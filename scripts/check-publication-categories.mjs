import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const base=(process.argv[2]||'http://127.0.0.1:3015').replace(/\/$/,'');
const client=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const suffix=randomUUID().slice(0,8),category=`category-check-${suffix}`,slug=`category-article-${suffix}`,key=randomUUID();
const names={ko:`분류 확인 ${suffix}`,en:`Category check ${suffix}`};
const categoryRow={slug:category,name_ko:names.ko,name_en:names.en,description_ko:'DB에서 변경한 카테고리 설명입니다.',description_en:'Category description edited in the database.',show_in_header:true,show_in_footer:true,sort_order:25};
const input={kind:'article',slug,category,idempotencyKey:key,editions:['ko','en'].map(locale=>({locale,title:`Category verification ${locale} ${suffix}`,content:'This is a temporary verification article for database category editing and publication. '.repeat(3),summary:'Temporary category verification.'}))};
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
async function html(path,status=200){const r=await fetch(base+path);check(r.status===status,`${path}: expected ${status}, got ${r.status}`);return r.text();}
async function mutate(operation){const {error}=await operation;if(error)throw error;}
const post=(body)=>fetch(base+'/api/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
try{
 await mutate(client.from('space_publication_categories').insert(categoryRow));
 for(const [prefix,locale]of [['','ko'],['/en','en']]){
  const page=await html(prefix+`/category/${category}`);check(page.includes(`<h1>${names[locale]}</h1>`),'Dynamic category heading');check(/noindex/.test(page),'Empty category noindex');
  check((await html(prefix+'/write')).includes(`value="${category}"`),'Writer dynamic option');
  const home=await html(prefix+'/');check(home.match(/<header[\s\S]*?<\/header>/)?.[0].includes(`/category/${category}`),'Dynamic header');
 }
 check(!(await html('/sitemap.xml')).includes(`/category/${category}`),'Empty category excluded from sitemap');
 const result=await post(input),receipt=await result.json();check(result.status===201,JSON.stringify(receipt));check(receipt.articles.length===2,'Bilingual publication');
 const retry=await post(input);check(retry.status===201,'Idempotent retry');check(JSON.stringify((await retry.json()).articles)===JSON.stringify(receipt.articles),'Same document IDs on retry');
 for(const [prefix,locale]of [['','ko'],['/en','en']]){
  const archive=await html(prefix+`/category/${category}`);check(!/content="noindex/.test(archive),'Nonempty category indexable');check(archive.includes(slug),'Category listing');
  const article=await html(prefix+`/articles/${slug}`);check(article.includes(`"articleSection":"${names[locale]}"`),'Article category structured data');
 }
 check((await html('/sitemap.xml')).includes(`/category/${category}`),'Populated category in sitemap');
 await mutate(client.from('space_publication_categories').update({name_ko:names.ko+' 수정',name_en:names.en+' updated',show_in_header:false,show_in_footer:false,accepts_submissions:false}).eq('slug',category));
 const changed=await html(`/category/${category}`);check(changed.includes(`<h1>${names.ko} 수정</h1>`),'Rename without rebuild');
 check(!(await html('/')).match(/<header[\s\S]*?<\/header>/)?.[0].includes(`/category/${category}`),'Hide header without removing archive');
 check(!(await html('/write')).includes(`value="${category}"`),'Disabled category removed from writer');
 check((await html(`/articles/${slug}`)).includes(`"articleSection":"${names.ko} 수정"`),'Article updated without rebuild');
 check((await html('/feed.xml')).includes(`<category>${names.ko} 수정</category>`),'RSS updated without rebuild');
 check((await post({...input,idempotencyKey:randomUUID(),slug:slug+'-disabled'})).status===400,'Disabled category rejected');
 check((await post({...input,category:'unknown-category'})).status===400,'Unknown category rejected');
 check((await post({...input,category:'etf'})).status===400,'Wrong collection rejected');
 check((await post({...input,category:'us-market-briefing'})).status===400,'Briefing session required');
 console.log(JSON.stringify({base,checks,result:'passed',temporaryCategory:category}));
}finally{
 await mutate(client.from('space_publication_documents').delete().eq('slug',slug).eq('kind','article'));
 await mutate(client.from('space_publication_requests').delete().eq('key',key));
 await mutate(client.from('space_publication_categories').delete().eq('slug',category));
}
