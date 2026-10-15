import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const base=process.argv[2]||'http://127.0.0.1:3000';
const origin=process.argv[3]||base;
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,options);
const anon=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,options);
const created=[],checks=[];const stamp=randomUUID().slice(0,8);
function check(name,condition){assert.ok(condition,name);checks.push(name);console.log('PASS',name);}
async function request(path,{method='GET',body,jar,requestOrigin=origin}={}){
 const response=await fetch(base+path,{method,redirect:'manual',headers:{...(body?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{Origin:requestOrigin}:{}),...(jar?{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')}:{})},body:body?JSON.stringify(body):undefined});
 for(const cookie of response.headers.getSetCookie()){const part=cookie.split(';')[0],index=part.indexOf('=');if(jar)jar.set(part.slice(0,index),part.slice(index+1));}
 const text=await response.text();let data;try{data=JSON.parse(text);}catch{}return {status:response.status,headers:response.headers,text,data};
}
try{
 for(const who of ['a','b']){
  const email=`space-test-${stamp}-${who}@example.com`,password=`S${randomUUID()}!`;
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;created.push({id:data.user.id,email,password,jar:new Map()});
 }
 const [a,b]=created;
 check('anonymous studio redirects to login',(await request('/admin')).headers.get('location')?.includes('/login'));
 check('anonymous writes rejected',(await request('/api/admin/posts',{method:'POST',body:{}})).status===401);
 check('cross-origin authentication rejected',(await request('/api/auth',{method:'POST',requestOrigin:'https://untrusted.invalid',body:{action:'login',email:a.email,password:a.password}})).status===403);
 for(const u of created){
  const response=await request('/api/auth',{method:'POST',jar:u.jar,body:{action:'login',email:u.email,password:u.password}});check('real email/password login '+u.email.slice(-13),response.status===200&&response.data.redirect==='/admin');
  check('HttpOnly session cookie',response.headers.getSetCookie().some(c=>/httponly/i.test(c)));
  if(base.startsWith('https://'))check('Secure production session cookie',response.headers.getSetCookie().some(c=>/; Secure/i.test(c)));
  check('new account goes to onboarding',(await request('/admin',{jar:u.jar})).headers.get('location')?.includes('/onboarding'));
  const result=await request('/api/space',{method:'POST',jar:u.jar,body:{slug:`verify-${stamp}-${u===a?'a':'b'}`,name:`검증용 공간 ${u===a?'A':'B'}`,description:'자동 기능 검증 후 삭제되는 임시 공간입니다.',accent:'forest'}});
  check('create personal space',result.status===200&&result.data.space.id);u.space=result.data.space;
  const cats=await admin.from('space_categories').select('*').eq('space_id',u.space.id).order('sort_order');if(cats.error)throw cats.error;u.category=cats.data[0];u.replacement=cats.data[1];
 }
 check('one space per account',(await request('/api/space',{method:'POST',jar:a.jar,body:{slug:`duplicate-${stamp}`,name:'중복',description:'',accent:'forest'}})).status===400);
 let post={id:randomUUID(),version:0,title:`검증 글 ${stamp}`,slug:`post-${stamp}`,content:'## 첫 번째 내용\n\n실제 저장을 확인하는 임시 본문입니다.',summary:'검증 요약',status:'private',category_id:a.category.id,cover_asset_id:null,seo_title:'',seo_description:'',author:'검증 작성자',tags:['검증비공개']};
 let result=await request('/api/admin/posts',{method:'POST',jar:a.jar,body:{post}});check('create private post',result.status===200&&result.data.post.version===1);post={...post,...result.data.post};
 const path=`/s/${a.space.slug}/posts/${post.slug}`;
 check('private post returns 404 to visitors',(await request(path)).status===404);
 check('owner can open editor',(await request(`/admin/edit/${post.id}`,{jar:a.jar})).status===200);
 check('other member cannot open editor',(await request(`/admin/edit/${post.id}`,{jar:b.jar})).status===404);
 check('other member cannot edit private post',(await request('/api/admin/posts',{method:'POST',jar:b.jar,body:{post:{...post,title:'침입'}}})).status!==200);
 check('other member cannot delete post',(await request('/api/admin/posts',{method:'DELETE',jar:b.jar,body:{id:post.id,version:post.version}})).status!==200);
 check('cross-space category rejected',(await request('/api/admin/posts',{method:'POST',jar:a.jar,body:{post:{...post,category_id:b.category.id}}})).status!==200);
 const hidden=await anon.from('space_tags').select('*').eq('space_id',a.space.id);check('private tags hidden',!hidden.error&&hidden.data.length===0);
 result=await request('/api/admin/posts',{method:'POST',jar:a.jar,body:{post:{...post,status:'public'}}});check('publish existing post',result.status===200&&result.data.post.version===2);post={...post,...result.data.post};
 const article=await request(path);check('public article rendered on server',article.status===200&&article.text.includes(post.title)&&article.text.includes('BlogPosting'));
 check('canonical URL contains personal space',article.text.includes(`/s/${a.space.slug}/posts/${post.slug}`));
 check('public sitemap contains article',(await request('/sitemap.xml')).text.includes(path));
 check('public RSS contains article',(await request('/feed.xml')).text.includes(path));
 result=await request('/api/admin/posts',{method:'POST',jar:a.jar,body:{post:{...post,title:`수정 완료 ${stamp}`}}});check('update saved post',result.status===200&&result.data.post.version===3);post={...post,...result.data.post};
 check('stale version is rejected',(await request('/api/admin/posts',{method:'POST',jar:a.jar,body:{post:{...post,version:2}}})).status!==200);
 result=await request('/api/admin/posts',{method:'POST',jar:a.jar,body:{post:{...post,status:'private'}}});check('switch back to private',result.status===200);post={...post,...result.data.post};
 check('unpublished article disappears',(await request(path)).status===404);
 check('unpublished article removed from sitemap',!(await request('/sitemap.xml')).text.includes(path));
 check('unpublished article removed from RSS',!(await request('/feed.xml')).text.includes(path));
 const assetId=randomUUID();const asset=await admin.from('space_assets').insert({id:assetId,space_id:a.space.id,post_id:post.id,storage_key:`test/${stamp}/${assetId}`,name:'private.png',mime:'image/png',size:100,ready:true});if(asset.error)throw asset.error;
 check('private media blocked for visitors',(await request(`/media/${assetId}`)).status===404);
 check('private media blocked for other member',(await request(`/media/${assetId}`,{jar:b.jar})).status===404);
 const bClient=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,options);const signed=await bClient.auth.signInWithPassword({email:b.email,password:b.password});if(signed.error)throw signed.error;
 const direct=await bClient.from('space_posts').select('*').eq('id',post.id);check('database RLS blocks direct cross-member reads',!direct.error&&direct.data.length===0);
 const forged=await bClient.from('space_assets').insert({id:randomUUID(),space_id:b.space.id,post_id:post.id,storage_key:`test/${stamp}/forged`,name:'x.png',mime:'image/png',size:100,ready:true});check('direct storage metadata forgery rejected',!!forged.error);
 result=await request('/api/space',{method:'PATCH',jar:a.jar,body:{name:'수정한 나의 공간',description:'소개를 수정했습니다.',accent:'ocean'}});check('space settings update',result.status===200&&result.data.space.accent==='ocean');
 result=await request('/api/admin/posts',{method:'DELETE',jar:a.jar,body:{id:post.id,version:post.version}});check('owner can delete post',result.status===200);
 check('deleted editor unavailable',(await request(`/admin/edit/${post.id}`,{jar:a.jar})).status===404);
 check('owner logout',(await request('/api/auth',{method:'DELETE',jar:a.jar})).status===200);
 check('studio protected after logout',(await request('/admin',{jar:a.jar})).headers.get('location')?.includes('/login'));
 const recovery=await admin.auth.admin.generateLink({type:'recovery',email:a.email});if(recovery.error)throw recovery.error;
 const recovered=await request('/auth/confirm?type=recovery&token_hash='+encodeURIComponent(recovery.data.properties.hashed_token),{jar:a.jar});
 check('recovery token creates a protected session',recovered.status===307&&recovered.headers.get('location')?.endsWith('/account/password'));
 const newPassword=`R${randomUUID()}!`;const updatedPassword=await request('/api/auth',{method:'POST',jar:a.jar,body:{action:'update-password',password:newPassword}});check('password update signs out the session',updatedPassword.status===200&&updatedPassword.data.redirect==='/login?changed=1');
 const newLogin=await request('/api/auth',{method:'POST',jar:a.jar,body:{action:'login',email:a.email,password:newPassword}});check('changed password authenticates',newLogin.status===200);
 await writeFile(process.env.SPACE_CHECK_REPORT||'docs/live-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),target:base,checks,total:checks.length,temporaryAccountsRemoved:true},null,2)+'\n');
 console.log(`Verified ${checks.length} live checks.`);
}finally{
 for(const u of created){const {error}=await admin.auth.admin.deleteUser(u.id);if(error)throw new Error('Temporary account cleanup failed: '+error.message);}
 console.log('Temporary accounts and their spaces removed.');
}
