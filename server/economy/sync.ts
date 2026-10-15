import type {SupabaseClient} from '@supabase/supabase-js';
import type {EconomicEvent,Indicator,Series} from '../../src/lib/economy/types';
import {checked,workerDb} from './client';
import {fetchObservations,ProviderError,providerJson,dateSchema} from './providers';
import {periodForResult} from './events';
type Progress={month:string;before:string|null};
type Cursor={index?:number;ranges?:Record<string,Progress>};
const day=(d:Date)=>d.toISOString().slice(0,10);
export function collectionRange(now:Date,progress?:Progress){
 const month=day(now).slice(0,7),oldest=new Date(now);oldest.setUTCFullYear(oldest.getUTCFullYear()-6);
 const full=!progress||progress.month!==month||progress.before!==null;
 const to=full&&progress?.month===month&&progress.before?new Date(progress.before+'T00:00:00Z'):new Date(now);
 const from=new Date(to);from.setUTCFullYear(from.getUTCFullYear()-1);if(from<oldest)from.setTime(oldest.getTime());
 const before=new Date(from);before.setUTCDate(before.getUTCDate()-1);
 return {from:day(from),to:day(to),next:{month,before:full&&from>oldest?day(before):null}};
}
export async function syncIndicators(provider:'fred'|'ecos',options:{force?:boolean;now?:Date;budgetMs?:number;fetcher?:typeof fetch;db?:SupabaseClient}={}){
 if(!options.force&&process.env.ECONOMIC_SYNC_ENABLED!=='true')return {status:'disabled'};
 const key=provider==='fred'?process.env.FRED_API_KEY:process.env.ECOS_API_KEY;if(!key)return {status:'missing_key',provider};
 const deadline=Date.now()+Math.min(options.budgetMs||19000,20000),db=options.db||workerDb(deadline),lock='indicators:'+provider;
 if(!checked(await db.rpc('space_sync_lock',{p_key:lock})))return {status:'locked',provider};
 let cursor:Cursor={},processed=0;const errors:string[]=[];
 try{
  const state=checked(await db.from('space_sync_runs').select('cursor').eq('key',lock).single());cursor=(state?.cursor||{}) as Cursor;cursor.ranges??={};
  const definitions=checked(await db.from('space_indicator_definitions').select('*').eq('active',true)) as Indicator[];
  const all=(checked(await db.from('space_indicator_series').select('*').eq('provider',provider).eq('approved',true).order('id'))||[]) as Series[];
  if(!all.length)return {status:'no_approved_series',provider};
  const start=(cursor.index||0)%all.length;
  for(let n=0;n<all.length;n++){
   const index=(start+n)%all.length,series=all[index],definition=definitions.find(d=>d.slug===series.indicator_slug);if(!definition)continue;
   cursor.index=index;if(deadline-Date.now()<2500)break;
   try{
    const range=collectionRange(options.now||new Date(),cursor.ranges[series.id]);
    const rows=await fetchObservations(series,definition,range.from,range.to,key,deadline,options.fetcher);
    // Empty/error responses never delete known values or mark a successful refresh.
    if(!rows.length)throw new ProviderError('empty_response');
    if(rows.some(r=>r.period<range.from.slice(0,7)+'-01'||r.period>range.to))throw new ProviderError('period_out_of_range');
    const stamp=new Date().toISOString();checked(await db.from('space_indicator_observations').upsert(rows.map(r=>({...r,fetched_at:stamp})),{onConflict:'series_id,period'}));
    checked(await db.from('space_indicator_series').update({last_success_at:stamp,last_error:null}).eq('id',series.id));cursor.ranges[series.id]=range.next;processed+=rows.length;
   }catch(error){const code=error instanceof ProviderError?error.code:'storage_or_timeout';errors.push(series.id+':'+code);if(deadline-Date.now()>500)await db.from('space_indicator_series').update({last_error:code}).eq('id',series.id);}
   cursor.index=(index+1)%all.length;
  }
  return {status:errors.length?'partial':'ok',provider,processed,errors,backfillPending:Object.values(cursor.ranges).some(p=>p.before!==null)};
 }finally{
  // Use a short independent timeout to persist a resume cursor even near the work deadline.
  const finish=options.db||workerDb(Date.now()+1500);checked(await finish.from('space_sync_runs').update({cursor,locked_until:null,processed,last_error:errors.join('|').slice(0,500)||null,...(processed?{last_success_at:new Date().toISOString()}:{})}).eq('key',lock));
 }
}
export async function captureEventResults(db:SupabaseClient,now=new Date(),deadline=Date.now()+15000){
 const from=new Date(now);from.setUTCDate(from.getUTCDate()-45);
 const events=(checked(await db.from('space_economic_events').select('*').eq('active',true).in('status',['scheduled','released']).gte('event_date',day(from)).lte('event_date',day(now)).limit(100))||[]) as EconomicEvent[];
 let count=0;
 for(const event of events){if(deadline-Date.now()<1500)break;if(event.starts_at&&Date.parse(event.starts_at)>now.getTime())continue;
  const period=periodForResult(event);if(!period)continue; // Policy decisions and GDP need explicit period-to-series review.
  const series=(checked(await db.from('space_indicator_series').select('*').in('indicator_slug',event.indicator_slugs).eq('approved',true))||[]) as Series[];
  let complete=series.length>0;
  for(const s of series){const rows:{period:string;value:number|null}[]|null=checked(await db.from('space_indicator_observations').select('period,value').eq('series_id',s.id).lte('period',period).order('period',{ascending:false}).limit(2));const current:{period:string;value:number|null}|undefined=rows?.[0];
   if(!current||current.period!==period||current.value===null){complete=false;continue;}
   const before=new Date(period+'T00:00:00Z');before.setUTCMonth(before.getUTCMonth()-1);const prev=rows?.[1];
   checked(await db.from('space_economic_event_results').upsert({event_id:event.id,series_id:s.id,period,captured_value:current.value,previous_value:prev?.period===day(before)?prev.value:null,captured_at:now.toISOString(),first_release_verified:false},{onConflict:'event_id,series_id,period',ignoreDuplicates:true}));count++;
  }
  if(complete&&event.status==='scheduled')checked(await db.from('space_economic_events').update({status:'released',updated_at:now.toISOString(),history:[...event.history,{at:now.toISOString(),date:event.event_date,status:event.status}]}).eq('id',event.id).eq('status','scheduled'));
 }
 return count;
}
/** FRED dates lack stable event IDs/reference periods. Unmatched dates require editorial review. */
export async function checkCalendar(options:{force?:boolean;db?:SupabaseClient;fetcher?:typeof fetch}={}){
 if(!options.force&&process.env.ECONOMIC_SYNC_ENABLED!=='true')return {status:'disabled'};
 const deadline=Date.now()+18000,db=options.db||workerDb(deadline),lock='calendar:review';if(!checked(await db.rpc('space_sync_lock',{p_key:lock})))return {status:'locked'};
 let error:string|null=null;const candidates:{releaseId:string;date:string}[]=[];let captured=0;
 try{
  const key=process.env.FRED_API_KEY;
  if(key){for(const [releaseId,kind] of [['10','cpi'],['50','employment']]){
   const url=new URL('https://api.stlouisfed.org/fred/release/dates');url.search=new URLSearchParams({api_key:key,file_type:'json',release_id:releaseId,include_release_dates_with_no_data:'true',sort_order:'desc',limit:'100'}).toString();
   const data=await providerJson(url,deadline,options.fetcher) as {release_dates?:{date:string;release_id:number}[]};if(!Array.isArray(data.release_dates))throw new ProviderError('invalid_calendar_response');
   const rows=checked(await db.from('space_economic_events').select('event_date').eq('country','US').eq('kind',kind));const known=new Set(rows?.map(r=>r.event_date));
   for(const r of data.release_dates){if(r.release_id!==Number(releaseId)||!dateSchema.safeParse(r.date).success)throw new ProviderError('invalid_calendar_response');if(r.date>=day(new Date())&&!known.has(r.date))candidates.push({releaseId,date:r.date});}
  }}
  if(deadline-Date.now()>2500)captured=await captureEventResults(db,new Date(),deadline);
  return {status:candidates.length?'editorial_review':key?'ok':'missing_key',candidates: candidates.length,captured};
 }catch(e){error=e instanceof ProviderError?e.code:'storage_or_timeout';throw new Error(error);}
 finally{checked(await (options.db||workerDb(Date.now()+1500)).from('space_sync_runs').update({cursor:{candidates},locked_until:null,...(error?{}:{last_success_at:new Date().toISOString()}),last_error:error,processed:captured}).eq('key',lock));}
}
