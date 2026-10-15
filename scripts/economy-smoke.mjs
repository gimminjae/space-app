import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:3000',checks=[];
const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);};
for(const prefix of ['', '/en']){
 for(const route of ['/glossary','/glossary/policy-rate','/topics','/topics/monetary','/indicators','/indicators/us-policy-rate','/calendar','/calendar/bls-cpi-2026-10','/data-terms']){
  const response=await fetch(base+prefix+route),html=await response.text();check(prefix+route+' renders',response.status===200);check(prefix+route+' localized HTML',html.includes(`<html lang="${prefix?'en':'ko'}"`));check(prefix+route+' canonical',html.includes('rel="canonical"'));check(prefix+route+' private cache',response.headers.get('cache-control')?.includes('no-store'));
 }
 for(const route of ['/following','/mypage/bookmarks','/mypage/following','/mypage/events']){const r=await fetch(base+prefix+route,{redirect:'manual'});check(prefix+route+' requires login',r.status===307&&r.headers.get('location')?.includes('/login?next='));}
 const filtered=await fetch(base+prefix+'/calendar?month=2026-11&country=US'),html=await filtered.text();check(prefix+' calendar filtered noindex',html.includes('noindex'));check(prefix+' calendar KST',html.includes('22:30 KST'));check(prefix+' calendar excludes KR',!html.includes('/calendar/bok-2026-11'));
}
for(const route of ['bookmarks','bookmark-folders','following','reader-state']){const r=await fetch(base+'/api/'+route);check(route+' unauthenticated',r.status===401);}
const saved=await fetch(base+'/api/bookmarks',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:'{}'});check('save requires authentication',saved.status===401);
const csrf=await fetch(base+'/api/bookmarks',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.invalid'},body:'{}'});check('cross-site save rejected',csrf.status===403);
const ics=await fetch(base+'/api/calendar/bls-cpi-2026-10/ics?lang=en');check('ICS download',ics.ok&&ics.headers.get('content-type')?.includes('text/calendar'));check('English ICS title',(await ics.text()).includes('SUMMARY:US Consumer Price Index'));
check('invalid observation range rejected',(await fetch(base+'/api/indicators/us-cpi?years=Infinity')).status===400);
const terms=await (await fetch(base+'/api/glossary?q=CPI')).json();check('abbreviation search',terms.items.some(t=>t.slug==='cpi'));
const sitemap=await (await fetch(base+'/sitemap.xml')).text();check('sitemap includes translated glossary',sitemap.includes('/en/glossary/policy-rate'));check('sitemap excludes personal pages',!sitemap.includes('/mypage/')&&!sitemap.includes('/following'));
await writeFile(process.env.SPACE_CHECK_REPORT||'docs/economy-http-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),target:base,mode:'public pages without configured database; authenticated persistence not covered',checks,total:checks.length},null,2)+'\n');console.log('Passed',checks.length,'HTTP checks');
