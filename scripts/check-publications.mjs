import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createClient} from '@supabase/supabase-js';
const base=new URL(process.argv[2]||'http://127.0.0.1:3102').origin;
const exportDir=process.argv[3];
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,options);
const anon=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,options);
const checks=[],created=[],requestKey=randomUUID(),slug=`connection-check-${randomUUID()}`;
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);};
const get=async path=>{const r=await fetch(base+path,{signal:AbortSignal.timeout(40000)});return{status:r.status,headers:r.headers,text:await r.text()};};
const post=async(body,headers={})=>{const r=await fetch(base+'/api/publish',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});return{status:r.status,data:await r.json()};};
try{
 const stored=await admin.from('space_publication_documents').select('*');if(stored.error)throw stored.error;
 if(exportDir){
  const original=JSON.parse(await readFile(resolve(exportDir,'documents.json'),'utf8'));
  for(const doc of original){const row=stored.data.find(d=>d.kind===doc.kind&&d.slug===doc.slug&&d.locale===doc.locale);assert.ok(row);for(const field of ['title','content','summary','seo_title'])assert.equal(row[field],doc[field],`${doc.slug}:${field}`);}
  check(`${original.length} original documents retain exact text and SEO fields`,true);
  let assets=0;
  for(const folder of ['learn-assets','etf-assets'])for(const file of await readdir(resolve(exportDir,'assets',folder))){
   const expected=await readFile(resolve(exportDir,'assets',folder,file)),r=await fetch(`${base}/${folder}/${file}`);assert.equal(r.status,200,file);
   assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),createHash('sha256').update(expected).digest('hex'),file);assets++;
  }check(`${assets} original assets are byte-identical through the Storage proxy`,true);
 }
 for(const doc of stored.data.filter(d=>d.kind!=='page'&&d.origin==='editorial')){
  const path=doc.kind==='etf'?`/etf-files/${doc.locale}/${doc.slug}.md`:`/publication-files/${doc.kind}/${doc.locale}/${doc.slug}.md`;
  const file=await get(path);check(`Markdown download ${doc.locale}/${doc.slug}`,file.status===200&&file.text===`# ${doc.title}\n\n${doc.content}\n`);
 }
 check('Anonymous direct table writes denied',!!(await anon.from('space_publication_documents').insert({kind:'article',slug,title:'Forbidden',content:'Forbidden',locale:'ko'})).error);
 check('Anonymous RPC calls denied',!!(await anon.rpc('space_publish_documents',{p_entries:[],p_request_key:requestKey,p_fingerprint:'x',p_rate_key:'x'})).error);
 check('Request ledger is private',!!(await anon.from('space_publication_requests').select('*')).error);
 const draft=await admin.from('space_publication_documents').insert({kind:'article',slug:slug+'-draft',locale:'ko',title:'Temporary private verification',content:'Temporary verification record.',status:'draft'}).select('id').single();if(draft.error)throw draft.error;created.push(draft.data.id);
 check('Anonymous draft read returns no rows',(await anon.from('space_publication_documents').select('id').eq('id',draft.data.id)).data?.length===0);
 check('Draft URL is not public',(await get('/articles/'+slug+'-draft')).status===404);
 const body={kind:'article',slug,idempotencyKey:requestKey,editions:[{locale:'ko',title:'발행 연결 확인',summary:'자동 발행과 검색 연결을 확인하는 임시 글입니다.',author:'space verification',content:`## 연결 확인\n\n이 글은 공개 작성 기능이 저장소와 연결되는지 확인하기 위한 임시 검증 자료입니다. 검증을 마치면 제거합니다. 재테크나 투자 판단을 위한 글이 아닙니다.\n\n확인 식별자: ${slug}\n\n<script>alert('test')</script>`,sources:['https://www.example.com/']},{locale:'en',title:'Publishing connection check',summary:'A temporary article for verifying publishing and search.',author:'space verification',content:`## Connection check\n\nThis temporary article verifies that the open publishing form stores its content and makes it available to readers. It is removed after verification and is not investment guidance.\n\nVerification identifier: ${slug}`} ]};
 const first=await post(body);check('Unauthenticated bilingual publish returns 201',first.status===201&&first.data.articles?.length===2);created.push(...first.data.articles.map(a=>a.id));
 const retry=await post(body);check('Same request is idempotent',retry.status===201&&JSON.stringify(retry.data.articles)===JSON.stringify(first.data.articles));
 check('Reusing a request key for different content fails',(await post({...body,editions:body.editions.map(e=>({...e,title:e.title+' changed'}))})).status===409);
 check('Duplicate slug cannot replace a published article',(await post({...body,idempotencyKey:randomUUID()})).status===409);
 check('Privilege fields are rejected',(await post({...body,status:'draft',idempotencyKey:randomUUID()})).status===400);
 check('Cross-origin browser submission is rejected',(await post(body,{Origin:'https://untrusted.invalid'})).status===403);
 const saved=await admin.from('space_publication_documents').select('*').in('id',first.data.articles.map(a=>a.id));if(saved.error)throw saved.error;
 check('Both editions persist as open/published',saved.data.length===2&&saved.data.every(d=>d.status==='published'&&d.origin==='open'));
 for(const doc of first.data.articles){const page=await get(doc.path);check(`Fresh ${doc.locale} page appears without a build`,page.status===200&&page.text.includes(slug)&&page.text.includes('Connection check')=== (doc.locale==='en'));check(`Executable markup removed (${doc.locale})`,!page.text.includes("<script>alert('test')</script>"));}
 for(const path of ['/', '/en','/search?q='+slug,'/en/search?q='+slug,'/articles','/en/articles','/feed.xml','/sitemap.xml'])check(`Fresh content appears in ${path}`,(await get(path)).text.includes(slug));
 check('Sources render on the article',(await get('/articles/'+slug)).text.includes('https://www.example.com/'));
 check('Writer is public but excluded from indexing',(await get('/write')).text.includes('noindex'));
 const onlyEn={kind:'article',slug:slug+'-english',idempotencyKey:randomUUID(),editions:[body.editions[1]]};
 const single=await post(onlyEn);check('Single-language publish succeeds',single.status===201);created.push(...single.data.articles.map(a=>a.id));
 const english=await get('/en/articles/'+onlyEn.slug);check('Single-language article has no false Korean alternate',!/<link[^>]*hrefLang="ko"/.test(english.text));
 check('Missing translation is 404',(await get('/articles/'+onlyEn.slug)).status===404);
 await admin.from('space_publication_requests').delete().eq('key',onlyEn.idempotencyKey);
 console.log(JSON.stringify({base,checkedAt:new Date().toISOString(),passed:checks.length,checks},null,2));
 if(process.env.PUBLICATION_CHECK_REPORT)await writeFile(process.env.PUBLICATION_CHECK_REPORT,JSON.stringify({base,checkedAt:new Date().toISOString(),passed:checks.length,checks},null,2));
}finally{
 // Delete only UUIDs returned for records created by this verification run.
 if(created.length){const clean=await admin.from('space_publication_documents').delete().in('id',created);if(clean.error)throw clean.error;}
 const ledger=await admin.from('space_publication_requests').delete().eq('key',requestKey);if(ledger.error)throw ledger.error;
}
