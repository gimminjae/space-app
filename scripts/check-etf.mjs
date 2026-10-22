import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const origin = new URL(process.argv[2] || 'http://127.0.0.1:3182').origin;
const canonicalOrigin = 'https://space.service.io.kr';
const { articles } = JSON.parse(await readFile('content/etf/manifest.json','utf8'));
const assets=new Set(),results=[];
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const tags=(html,name)=>[...html.matchAll(new RegExp(`<${name}\\b[^>]*>`,'g'))].map(m=>m[0]);
const attr=(tag,key)=>tag?.match(new RegExp(`${key}="([^"]*)"`,'i'))?.[1];
async function get(path){const r=await fetch(origin+path,{headers:{'User-Agent':'Googlebot'},redirect:'manual',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,path);return r;}
const tasks=articles.flatMap(article=>['ko','en'].map(locale=>({article,locale})));
for(let i=0;i<tasks.length;i+=4)await Promise.all(tasks.slice(i,i+4).map(async({article:a,locale})=>{
 const prefix=locale==='en'?'/en':'',path=`${prefix}/etf/${a.slug}`,r=await get(path),html=await r.text();
 assert.equal(r.headers.get('content-language'),locale,path);
 assert.ok(html.includes(`<html lang="${locale}"`));
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);
 assert.ok(decode(html).includes(a[locale].title));
 for(const other of ['ko','en'])assert.ok(tags(html,'link').some(t=>attr(t,'hreflang')===other&&attr(t,'href')===`${canonicalOrigin}${other==='en'?'/en':''}/etf/${a.slug}`));
 const graph=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']||[]);
 assert.equal(graph.find(n=>n['@type']==='Article')?.headline,a[locale].title);
 assert.equal(graph.find(n=>n['@type']==='Article')?.inLanguage,locale);
 const body=html.match(/<div class="prose">([\s\S]*?)<\/article>/)?.[1]||'';
 assert.ok(body.length>4000,`Full article ${path}`);
 assert.ok(decode(body).includes(`href="${a.originalUrl}"`));
 for(const source of a.sources)assert.ok(decode(body).includes(`href="${source}"`),source);
 for(const img of tags(body,'img')){assert.ok(attr(img,'alt'));assets.add(attr(img,'src'));}
 assert.ok(tags(body,'table').length>0);
 const file=`/etf-files/${locale}/${a.slug}.md`;
 assert.ok(html.includes(`href="${file}"`));
 assert.equal(await(await get(file)).text(),await readFile(`public${file}`,'utf8'));
 assets.add(a[locale].ogImage);
 assert.doesNotMatch(html,/href="(?:\/en)?\/(?:login|signup|admin|mypage|spaces)(?:[/?"])/);
 results.push({path,status:200,locale,result:'passed'});
}));
for(const locale of ['ko','en']){
 const prefix=locale==='en'?'/en':'',path=`${prefix}/category/etf`,html=await(await get(path)).text();
 for(const a of articles)assert.ok(html.includes(`href="${prefix}/etf/${a.slug}"`));
 assert.ok(html.includes('"numberOfItems":17'));
 const home=await(await get(prefix||'/')).text();assert.ok(home.includes(`href="${path}"`));
 assert.doesNotMatch(home,/href="(?:\/en)?\/(?:login|signup|admin|mypage|spaces)(?:[/?"])/);
 const search=await(await get(`${prefix}/search?q=0018C0`)).text();assert.ok(search.includes(`href="${prefix}/etf/plus-fixed-covered-call"`));
 const feed=await(await get(`${prefix}/etf/feed.xml`)).text();assert.equal((feed.match(/<item>/g)||[]).length,17);assert.ok(feed.includes(`<language>${locale}</language>`));
 const opposite=await fetch(origin+`${prefix}/etf/feed.xml`,{headers:{Cookie:`space_locale=${locale==='ko'?'en':'ko'}`}});assert.equal(opposite.headers.get('content-language'),locale);
 assets.add(`/etf-assets/series.${locale}.og.png`);
 results.push({path,status:200,locale,result:'passed'});
}
const feed=await(await get('/feed.xml')).text();assert.equal((feed.match(/<item>/g)||[]).length,27);
const sitemap=await(await get('/sitemap.xml')).text();for(const {article:a,locale} of tasks)assert.ok(sitemap.includes(`<loc>${canonicalOrigin}${locale==='en'?'/en':''}/etf/${a.slug}</loc>`));
for(const path of assets){const r=await get(path);assert.match(r.headers.get('content-type'),/image\/(?:png|svg\+xml)/);assert.ok((await r.arrayBuffer()).byteLength>1000);}
const report={origin,checkedAt:new Date().toISOString(),editions:tasks.length,assets:assets.size,results};
if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n');
console.log(`Passed ${tasks.length} full ETF editions, 2 category hubs, 34 Markdown downloads, ${assets.size} assets, bilingual search, feeds and sitemap.`);
