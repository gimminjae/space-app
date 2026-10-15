/** Node-only provider adapters. Imported exclusively by scripts and scheduled functions. */
import {z} from 'zod';
import type {Indicator,Observation,Series} from '../../src/lib/economy/types';
export class ProviderError extends Error { constructor(public code:string){super(code);} }
export const dateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
const numeric=z.string().transform((s,ctx)=>{if(['.','','-'].includes(s))return null;const n=Number(s);if(!Number.isFinite(n)){ctx.addIssue({code:'custom',message:'invalid numeric'});return z.NEVER;}return n;});
const fredResponse=z.object({count:z.number().int().nonnegative(),observations:z.array(z.object({date:dateSchema,value:numeric}))});
const ecosResponse=z.object({list_total_count:z.number().int().nonnegative(),row:z.array(z.object({STAT_CODE:z.string(),ITEM_CODE1:z.string(),ITEM_CODE2:z.string().nullable().optional(),UNIT_NAME:z.string(),TIME:z.string(),DATA_VALUE:numeric}))});
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export async function providerJson(url:URL,deadline=Date.now()+18000,fetcher:typeof fetch=fetch):Promise<unknown>{
 for(let attempt=0;attempt<2;attempt++){
  const remaining=deadline-Date.now();if(remaining<1000)throw new ProviderError('time_budget');
  let response:Response;try{response=await fetcher(url,{signal:AbortSignal.timeout(Math.min(6500,remaining-300)),redirect:'error',cache:'no-store'});}catch{if(attempt===0&&deadline-Date.now()>1500){await sleep(250);continue;}throw new ProviderError('network_or_timeout');}
  if(!response.ok){const retry=response.status===429||response.status>=500;const header=response.headers.get('retry-after');const delay=header?(/^\d+$/.test(header)?Number(header)*1000:Date.parse(header)-Date.now()):300;
   if(retry&&attempt===0&&Number.isFinite(delay)&&delay>=0&&delay<2000&&deadline-Date.now()>delay+1500){await sleep(delay);continue;}throw new ProviderError('http_'+response.status);}
  try{return await response.json();}catch{throw new ProviderError('invalid_json');}
 }
 throw new ProviderError('network_or_timeout');
}
export function normalizeFred(payload:unknown,seriesId:string):Observation[]{const parsed=fredResponse.safeParse(payload);if(!parsed.success)throw new ProviderError('invalid_fred_response');if(parsed.data.count>parsed.data.observations.length)throw new ProviderError('truncated_fred_response');return parsed.data.observations.map(r=>({series_id:seriesId,period:r.date,value:r.value}));}
export function normalizeEcos(payload:unknown,series:Series,definition:Indicator):Observation[]{
 const envelope=payload as {RESULT?:{CODE?:string};StatisticSearch?:unknown};if(envelope?.RESULT?.CODE==='INFO-200')return [];
 const parsed=ecosResponse.safeParse(envelope?.StatisticSearch);if(!parsed.success)throw new ProviderError('invalid_ecos_response');if(parsed.data.list_total_count>parsed.data.row.length)throw new ProviderError('truncated_ecos_response');const [item,subitem]=series.item_code!.split('/');
 return parsed.data.row.map(r=>{if(r.STAT_CODE!==series.code||r.ITEM_CODE1!==item||(subitem&&r.ITEM_CODE2!==subitem))throw new ProviderError('series_mismatch');const expected=definition.slug==='kr-policy-rate'?'연%':definition.slug==='kr-usd'?'원':definition.slug==='kr-cpi'?'2020=100':'%';if(r.UNIT_NAME.replace(/\s/g,'')!==expected)throw new ProviderError('unit_mismatch');const raw=definition.frequency==='M'?r.TIME+'01':r.TIME;if(!/^\d{8}$/.test(raw))throw new ProviderError('invalid_period');const period=raw.slice(0,4)+'-'+raw.slice(4,6)+'-'+raw.slice(6,8);if(!dateSchema.safeParse(period).success)throw new ProviderError('invalid_period');return {series_id:series.id,period,value:r.DATA_VALUE};});
}
export async function fetchObservations(series:Series,definition:Indicator,from:string,to:string,key:string,deadline:number,fetcher:typeof fetch=fetch){
 if(series.provider==='fred'){const meta=new URL('https://api.stlouisfed.org/fred/series');meta.search=new URLSearchParams({series_id:series.code,api_key:key,file_type:'json'}).toString();const m=await providerJson(meta,deadline,fetcher) as {seriess?:{id:string;units:string;frequency_short:string;seasonal_adjustment_short:string}[]};const row=m?.seriess?.[0];const units=definition.slug==='us-cpi'?'Index 1982-1984=100':'Percent';if(!row||row.id!==series.code||row.units!==units||row.frequency_short!==definition.frequency||row.seasonal_adjustment_short!==definition.adjustment)throw new ProviderError('metadata_mismatch');const url=new URL('https://api.stlouisfed.org/fred/series/observations');url.search=new URLSearchParams({series_id:series.code,api_key:key,file_type:'json',observation_start:from,observation_end:to,limit:'100000',sort_order:'asc'}).toString();return normalizeFred(await providerJson(url,deadline,fetcher),series.id);}
 const compact=(v:string)=>v.replace(/-/g,'').slice(0,definition.frequency==='M'?6:8);const pieces=['StatisticSearch',key,'json','kr','1','1000',series.code,definition.frequency,compact(from),compact(to),...series.item_code!.split('/')];return normalizeEcos(await providerJson(new URL('https://ecos.bok.or.kr/api/'+pieces.map(encodeURIComponent).join('/')),deadline,fetcher),series,definition);
}
