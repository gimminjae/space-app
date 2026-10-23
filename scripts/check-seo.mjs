import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const origin=new URL(process.argv[2]||'http://127.0.0.1:3102').origin,canonicalOrigin='https://space.service.io.kr';
const results=[];
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'");
const tags=(html,name)=>[...html.matchAll(new RegExp(`<${name}\\b[^>]*>`,'g'))].map(m=>m[0]);
const attr=(tag,key)=>tag?.match(new RegExp(`${key}="([^"]*)"`))?.[1];
const meta=(html,key)=>attr(tags(html,'meta').find(t=>attr(t,'name')===key||attr(t,'property')===key),'content');
const canonical=html=>attr(tags(html,'link').find(t=>attr(t,'rel')==='canonical'),'href');
async function get(path){path=path.replace(/^\/en\/\?/, '/en?');const r=await fetch(origin+path,{headers:{'User-Agent':'Googlebot'},redirect:'manual',signal:AbortSignal.timeout(40000)});return {status:r.status,html:await r.text(),headers:r.headers};}
const sitemap=await get('/sitemap.xml');assert.equal(sitemap.status,200);
const paths=[...sitemap.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]).replace(canonicalOrigin,''));
assert.ok(paths.length>=66);assert.equal(new Set(paths).size,paths.length);
assert.ok(paths.includes('/privacy')&&paths.includes('/en/privacy'));
assert.ok(paths.every(p=>!/(?:admin|search|write|login|signup|mypage|onboarding|password)/.test(p)));
const titles=new Set();
for(let i=0;i<paths.length;i+=4)await Promise.all(paths.slice(i,i+4).map(async path=>{
 const {status,html}=await get(path);assert.equal(status,200,path);
 assert.equal(new URL(canonical(html)).href,new URL(canonicalOrigin+path).href,path);
 assert.ok(meta(html,'description')?.length>20,path);
 assert.ok(meta(html,'og:title')&&meta(html,'og:description'),path);
 assert.equal(new URL(meta(html,'og:url')).href,new URL(canonicalOrigin+path).href,path);
 assert.ok(meta(html,'og:image')?.startsWith(canonicalOrigin),path);
 assert.equal(meta(html,'twitter:card'),'summary_large_image',path);
 assert.ok(!meta(html,'robots')?.includes('noindex'),path);
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,path);
 const title=html.match(/<title>(.*?)<\/title>/)?.[1];assert.ok(title&&!titles.has(title),path);titles.add(title);
 for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(m[1]);
 assert.ok(!html.includes('src="https://pagead2.googlesyndication.com/'),path);
 results.push({path,status,result:'passed'});
}));
for(const prefix of ['','/en']){
 for(const path of ['/search','/write']){
  const {status,html}=await get(prefix+path);assert.equal(status,200,prefix+path);assert.match(meta(html,'robots'),/noindex/,prefix+path);
  if(path==='/category/basics'||path==='/spaces')assert.ok(!paths.includes(prefix+path),'Empty archive in sitemap');
  results.push({path:prefix+path,status,robots:'noindex',result:'passed'});
 }
 for(const path of ['/?page=1.5','/?page=Infinity','/?page=9999','/category/basics?page=2','/category/missing','/tag/missing','/learn/missing','/etf/missing']){
  const {status,html}=await get(prefix+path);assert.equal(status,404,prefix+path);assert.match(meta(html,'robots'),/noindex/,prefix+path);
  results.push({path:prefix+path,status,result:'passed'});
 }
 const first=await get(prefix+'/?page=1');assert.equal(new URL(canonical(first.html)).href,new URL(canonicalOrigin+(prefix||'/')).href);
 const home=await get(prefix||'/');assert.ok(home.html.includes('"@type":"WebSite"'));assert.ok(home.html.includes('"@type":"Organization"'));
}
for(const prefix of ['','/en','/ko'])for(const path of ['/login','/%6cogin','/signup','/forgot-password','/onboarding','/mypage','/account','/admin','/spaces','/s/missing','/auth/callback?code=invalid','/auth/confirm?token_hash=invalid','/api/auth','/api/admin/posts']){
 const {status,headers}=await get(prefix+path);assert.equal(status,404,prefix+path);assert.match(headers.get('x-robots-tag'),/noindex/);
 results.push({path:prefix+path,status,result:'blocked'});
}
const mutation=await fetch(origin+'/api/auth',{method:'POST',headers:{'Content-Type':'application/json',Origin:canonicalOrigin},body:JSON.stringify({action:'signup',email:'content-only-test@example.invalid'})});assert.equal(mutation.status,404);
const ads=await get('/ads.txt');assert.equal(ads.status,200);assert.equal(ads.html.trim(),'google.com, pub-4493633870090510, DIRECT, f08c47fec0942fa0');
const report={origin,checkedAt:new Date().toISOString(),indexablePages:paths.length,results};
if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n');
console.log(`Passed SEO checks: ${paths.length} sitemap pages, ${results.length} routes, private/empty page exclusions, invalid page 404s, social metadata, JSON-LD, ads disabled and ads.txt.`);
