import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {publicationSubmissionSchema,publicationReadingMinutes} from '../src/lib/publication';
import {briefingTarget} from './briefing-session.mjs';

async function main(){
const filename=process.argv[2];if(!filename)throw new Error('Provide a briefing bundle JSON. Add --check to validate without publishing.');
const bundle=JSON.parse(await readFile(filename,'utf8')),check=process.argv.includes('--check');
const {evidence,charts}=bundle;
const parsed=publicationSubmissionSchema.parse(bundle.publication);
if(!parsed.category||!parsed.sessionDate||!parsed.dataAsOf||parsed.editions.length!==2||new Set(parsed.editions.map(e=>e.locale)).size!==2)throw new Error('Briefings require a category, sessionDate, dataAsOf and both languages.');
if(evidence?.sessionStatus!=='open'||!evidence.calendarUrl?.startsWith('https://')||!evidence.closeUrl?.startsWith('https://')||evidence.sessionDate!==parsed.sessionDate)throw new Error('Verify the official calendar and dated closing report before publication.');
const market=parsed.category==='us-market-briefing'?'us':'kr';
const target=briefingTarget(market);
if(!check&&(target.sessionDate!==parsed.sessionDate||target.weekend||target.beforeScheduledTime))throw new Error('This is not the current scheduled session. Recheck the date; do not backfill or publish before the close.');
const slug=`${parsed.category}-${parsed.sessionDate}`;
const sourceTime=Date.parse(parsed.dataAsOf);
if(!check&&(sourceTime>Date.now()+60000||Date.now()-sourceTime>12*3600000))throw new Error('Use a current data cutoff, not future or stale information.');
// Freeze the same request key and payload on disk before a potentially ambiguous network result.
const digest=createHash('sha256').update(`space-market-briefing-v1:${slug}`).digest('hex');
parsed.idempotencyKey=`${digest.slice(0,8)}-${digest.slice(8,12)}-5${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`;
parsed.slug=slug;
const images: {path:string;bytes:Buffer}[]=[];
for(const edition of parsed.editions){
 if(new Set(edition.sources).size<5)throw new Error('Each edition needs at least five distinct, opened source URLs.');
 if(!edition.content.includes('{{MARKET_CHART}}'))throw new Error('Add the original chart marker to each edition.');
 const chart=charts?.[edition.locale];if(!chart?.alt?.trim())throw new Error('A localized chart and alt text are required.');
 const bytes=await readFile(resolve(dirname(filename),chart.file));
 if(bytes.length>5242880||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Charts must be PNG files below 5 MB.');
 const imageHash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
 const path=`briefing-assets/${slug}.${edition.locale}.${imageHash}.png`;
 const alt=chart.alt.replace(/[\[\]\r\n]/g,' ');
 edition.content=edition.content.replace('{{MARKET_CHART}}',`![${alt}](/${path})`);edition.coverImage=`/${path}`;
 const minutes=Number(publicationReadingMinutes({...edition,metadata:{}}));
 if(minutes<5||minutes>15)throw new Error(`${edition.locale} is ${minutes} estimated minutes; required range is 5–15.`);
 images.push({path,bytes});
}
const payload=publicationSubmissionSchema.parse(parsed),payloadFile=resolve(dirname(filename),'publish-payload.json');
await writeFile(payloadFile,JSON.stringify(payload,null,2)+'\n');
if(check){console.log(JSON.stringify({status:'validated',slug,editions:payload.editions.map(e=>({locale:e.locale,minutes:publicationReadingMinutes({...e,metadata:{}})}))}));process.exit(0);}
const origin=(process.env.SPACE_PUBLISH_ORIGIN||'https://space.service.io.kr').replace(/\/$/,'');
const urls=[`${origin}/articles/${slug}`,`${origin}/en/articles/${slug}`];
const existing=await Promise.all(urls.map(async url=>({url,status:(await fetch(url,{redirect:'manual'})).status})));
if(existing.every(r=>r.status===200)){console.log(JSON.stringify({status:'already-published',urls}));process.exit(0);}
if(existing.some(r=>r.status!==404))throw new Error('Existing or partially published session; inspect before retrying. Never overwrite it.');
const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const bucket=client.storage.from(process.env.SUPABASE_PUBLICATION_BUCKET||'space-publication-assets');
for(const {path,bytes} of images){
 const stored=await bucket.download(path);
 if(stored.data){if(!Buffer.from(await stored.data.arrayBuffer()).equals(bytes))throw new Error('Immutable chart path has different bytes.');}
 else {const result=await bucket.upload(path,bytes,{contentType:'image/png',upsert:false});if(result.error)throw result.error;}
}
const response=await fetch(`${origin}/api/publish`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':payload.idempotencyKey!},body:JSON.stringify(payload)});
const result=await response.json();
await writeFile(resolve(dirname(filename),'publish-receipt.json'),JSON.stringify({httpStatus:response.status,result,verified:false},null,2)+'\n');
if(!response.ok)throw new Error(`Publication returned ${response.status}: ${JSON.stringify(result)}`);
for(const edition of payload.editions){
 const prefix=edition.locale==='en'?'/en':'',article=`${origin}${prefix}/articles/${slug}`;
 const page=await fetch(article),html=await page.text();
 if(!page.ok||!html.includes(slug)||!html.includes(edition.coverImage)||!html.includes('application/ld+json'))throw new Error('Published page did not pass rendering verification.');
 const category=await fetch(`${origin}${prefix}/category/${payload.category}`);
 if(!category.ok||!(await category.text()).includes(slug))throw new Error('Category did not contain the new article.');
 const image=await fetch(`${origin}${edition.coverImage}`);
 if(!image.ok||!image.headers.get('content-type')?.includes('image/png'))throw new Error('Published chart was unavailable.');
}
const sitemap=await fetch(`${origin}/sitemap.xml`);
if(!sitemap.ok||!(await sitemap.text()).includes(slug))throw new Error('Sitemap did not include the briefing.');
await writeFile(resolve(dirname(filename),'publish-receipt.json'),JSON.stringify({httpStatus:response.status,result,verified:true,verifiedAt:new Date().toISOString(),urls},null,2)+'\n');
console.log(JSON.stringify({status:'published-and-verified',urls}));

}
main().catch(error=>{console.error(error instanceof Error?error.message:'Briefing publication failed.');process.exitCode=1;});
