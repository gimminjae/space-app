import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import {glossary,indicators,series,topics} from '../src/lib/economy/catalog';
import events from '../content/events.json';
import type {EconomicEvent,Observation} from '../src/lib/economy/types';
import {findTermSlugs,remarkGlossary} from '../src/lib/economy/term-links';
import {eventDay,eventIcs,eventTime,monthBounds,percentChange,safeReturnPath,yearOverYear} from '../src/lib/economy/utils';
import {indicatorSummary} from '../src/lib/economy/indicator-summary';
import {normalizeEcos,normalizeFred,providerJson,fetchObservations} from '../server/economy/providers';
import {collectionRange,syncIndicators,checkCalendar} from '../server/economy/sync';
import {mergeEvent,periodForResult} from '../server/economy/events';
const event=events.find(e=>e.id==='bls-cpi-2026-10') as EconomicEvent;
test('bilingual catalogs have unique, valid references and 30 original definitions',()=>{
 assert.equal(glossary.length,30);assert.equal(indicators.length,8);assert.equal(new Set(glossary.map(t=>t.slug)).size,30);
 const aliases=new Map<string,string>();for(const term of glossary){assert.ok(term.ko.body&&term.en.body&&term.ko.example&&term.en.example);assert.ok(topics.some(t=>t.slug===term.topic_slug));for(const slug of term.related)assert.ok(slug!==term.slug&&glossary.some(t=>t.slug===slug));for(const alias of [...term.aliases,term.ko.name,term.en.name]){assert.ok(!aliases.has(alias.toLowerCase())||aliases.get(alias.toLowerCase())===term.slug,'ambiguous alias '+alias);aliases.set(alias.toLowerCase(),term.slug);}}
 for(const e of events){assert.ok(e.ko.summary&&e.en.summary);assert.ok(topics.some(t=>t.slug===e.topic_slug));for(const id of e.indicator_slugs)assert.ok(indicators.some(i=>i.slug===id));}
});
test('glossary links first occurrences only, excluding existing links, code and headings',async()=>{
 const content='# GDP\n\n`CPI` [기준금리](https://example.com)\n\n인플레이션과 GDP. GDP 다시.\n\n<script>alert(1)</script>\n\n[evil](javascript:alert(1))';
 const found=findTermSlugs(content,glossary);assert.ok(found.includes('gdp'));assert.ok(!found.includes('cpi'));assert.ok(!found.includes('policy-rate'));
 const html=String(await unified().use(remarkParse).use(remarkGlossary,{terms:glossary,locale:'en'}).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify).process(content));assert.equal((html.match(/href="\/en\/glossary\/gdp"/g)||[]).length,1);assert.ok(!html.includes('<script>')&&!html.includes('javascript:'));assert.ok(!findTermSlugs('myGDPword',glossary).includes('gdp'));
});
test('null, zero and percentage-point comparisons remain distinct',()=>{
 assert.equal(percentChange(5,0),null);assert.equal(percentChange(null,5),null);assert.equal(percentChange(0,5),-100);
 const rows=[{series_id:'s',period:'2025-08-01',value:100},{series_id:'s',period:'2026-08-01',value:103}];assert.ok(Math.abs(yearOverYear(rows,'2026-08-01')!-3)<.00001);assert.equal(yearOverYear(rows,'2026-09-01'),null);
 const definition=indicators.find(i=>i.slug==='us-policy-rate')!,ss=series.filter(s=>s.indicator_slug===definition.slug),lower=ss.find(s=>s.role==='lower')!,upper=ss.find(s=>s.role==='upper')!;
 const values:Observation[]=[{series_id:lower.id,period:'2026-10-01',value:4},{series_id:lower.id,period:'2026-10-02',value:3.75},{series_id:upper.id,period:'2026-10-02',value:4}];const summary=indicatorSummary(definition,ss,values);assert.equal(summary.change,-.25);assert.equal(summary.upperValue,4);assert.equal(indicatorSummary(definition,ss,values.slice(0,2)).upperValue,null);
});
test('dates respect KST boundaries, DST and date-only precision',()=>{
 assert.equal(eventDay({...event,starts_at:'2026-10-31T21:00:00Z'}),'2026-11-01');assert.equal(eventDay({...event,precision:'date_only',event_date:'2026-10-31',starts_at:null}),'2026-10-31');
 assert.match(eventTime({...event,starts_at:'2026-07-01T12:30:00Z'},'en'),/21:30/);assert.match(eventTime({...event,starts_at:'2026-11-10T13:30:00Z'},'en'),/22:30/);
 assert.equal(event.starts_at,'2026-11-10T13:30:00Z');assert.equal((events.find(e=>e.id==='bls-cpi-2027-06')!).starts_at,'2027-07-14T12:30:00Z');assert.equal(monthBounds('2026-12').to,'2027-01-01');assert.notEqual(monthBounds('0000-00').month,'0000-00');
});
test('ICS escapes text and preserves stable UID for moved and cancelled dates',()=>{
 const input={...event,ko:{name:'가나다'.repeat(40)+', ;\nEND:VEVENT',summary:'One\\Two'},status:'cancelled'} as EconomicEvent;
 const ics=eventIcs(input,'ko','https://space.service.io.kr/calendar/'+input.id);assert.match(ics,/STATUS:CANCELLED/);assert.match(ics,/DTSTART:20261110T133000Z/);assert.ok(ics.includes('\\, \\;\\nEND:VEVENT'));for(const line of ics.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
 assert.equal(ics.split('BEGIN:VEVENT').length,2);assert.match(eventIcs({...event,precision:'date_only',starts_at:null},'en','https://example.com'),/DTSTART;VALUE=DATE:20261110/);
});
test('safe login destinations reject external URLs and encoded backslashes',()=>{
 for(const s of ['https://evil.com','//evil.com','/en//evil','/s/%5cevil','/s/\nevil','/s/\\evil'])assert.equal(safeReturnPath(s),'/mypage');assert.equal(safeReturnPath('/en/topics/monetary?x=1'),'/en/topics/monetary?x=1');
});
test('provider normalization rejects truncation and mismatched Korean series',()=>{
 const fred={count:2,observations:[{date:'2026-01-01',value:'.'},{date:'2026-01-02',value:'0'}]};assert.deepEqual(normalizeFred(fred,'s').map(r=>r.value),[null,0]);assert.throws(()=>normalizeFred({...fred,count:3},'s'));assert.throws(()=>normalizeFred({count:1,observations:[{date:'2026-02-30',value:'NaN'}]},'s'));
 const s=series.find(s=>s.indicator_slug==='kr-unemployment')!,d=indicators.find(d=>d.slug===s.indicator_slug)!;
 const row={STAT_CODE:s.code,ITEM_CODE1:'I61BC',ITEM_CODE2:'I28B',UNIT_NAME:'%',TIME:'202608',DATA_VALUE:'2.7'};assert.equal(normalizeEcos({StatisticSearch:{list_total_count:1,row:[row]}},s,d)[0].period,'2026-08-01');assert.throws(()=>normalizeEcos({StatisticSearch:{list_total_count:1,row:[{...row,ITEM_CODE2:'I28A'}]}},s,d));assert.throws(()=>normalizeEcos({StatisticSearch:{list_total_count:1,row:[{...row,UNIT_NAME:'명'}]}},s,d));assert.deepEqual(normalizeEcos({RESULT:{CODE:'INFO-200'}},s,d),[]);
});
test('provider retries respect Retry-After and never expose credentials in errors',async()=>{
 let count=0;const fake=async()=>{count++;return new Response('',{status:429,headers:{'retry-after':'300'}});};await assert.rejects(providerJson(new URL('https://example.com/?api_key=secret'),Date.now()+10000,fake as typeof fetch),{message:'http_429'});assert.equal(count,1);
 count=0;const transient=async()=>++count===1?new Response('',{status:503}):Response.json({ok:true});assert.deepEqual(await providerJson(new URL('https://example.com'),Date.now()+10000,transient as typeof fetch),{ok:true});assert.equal(count,2);
 const s=series.find(s=>s.provider==='fred')!,d=indicators.find(d=>d.slug===s.indicator_slug)!;await assert.rejects(fetchObservations(s,d,'2026-01-01','2026-02-01','secret',Date.now()+10000,(async()=>Response.json({seriess:[{id:s.code,units:'Wrong',frequency_short:'D',seasonal_adjustment_short:'NSA'}]})) as typeof fetch),{message:'metadata_mismatch'});
});
test('backfill is bounded and resumable and monthly review restarts',()=>{
 const now=new Date('2026-10-16T00:00:00Z');let p;const ranges=[];for(let n=0;n<7;n++){const r=collectionRange(now,p);ranges.push(r);p=r.next;if(p.before===null)break;}assert.ok(ranges.length<=6);assert.equal(ranges[0].to,'2026-10-16');assert.equal(ranges.at(-1)!.from,'2020-10-16');assert.equal(p!.before,null);assert.equal(collectionRange(new Date('2026-11-01'),p).next.month,'2026-11');
});
test('manual corrections survive automated refresh and changes retain event identity',()=>{
 const later={...event,event_date:'2026-11-11',reviewed_at:'2026-10-17T00:00:00Z'};assert.equal(mergeEvent(event,later).event_date,event.event_date);const changed=mergeEvent(event,later,true);assert.equal(changed.id,event.id);assert.equal(changed.history.length,1);assert.equal(mergeEvent(changed,later,true).history.length,1);assert.equal(periodForResult(event),'2026-10-01');assert.equal(periodForResult({...event,reference_period:null}),null);
});
test('scheduled functions remain inactive without operator activation',async()=>{const old=process.env.ECONOMIC_SYNC_ENABLED;delete process.env.ECONOMIC_SYNC_ENABLED;try{assert.deepEqual(await syncIndicators('fred'),{status:'disabled'});assert.deepEqual(await checkCalendar(),{status:'disabled'});}finally{if(old!==undefined)process.env.ECONOMIC_SYNC_ENABLED=old;}});
