import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import nextEnv from '@next/env';
import {createClient} from '@supabase/supabase-js';
nextEnv.loadEnvConfig(process.cwd());
const base=process.argv[2]||'http://127.0.0.1:3000',options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,options),anon=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,options);
const checks=[],users=[],stamp=randomUUID().slice(0,8);
function ok(name,condition){assert.ok(condition,name);checks.push(name);console.log('PASS',name);}
async function request(path,method='GET',body,user){const r=await fetch(base+path,{method,redirect:'manual',headers:{'Content-Type':'application/json',Origin:process.env.SPACE_CHECK_ORIGIN||base,...(user?{Cookie:[...user.jar].map(([k,v])=>k+'='+v).join('; ')}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});for(const cookie of r.headers.getSetCookie()){const [pair]=cookie.split(';'),at=pair.indexOf('=');user?.jar.set(pair.slice(0,at),pair.slice(at+1));}const text=await r.text();let data;try{data=JSON.parse(text);}catch{}return {status:r.status,data,text,headers:r.headers};}
const ready=await admin.from('space_topics').select('slug').limit(1);if(ready.error||!ready.data.length)throw new Error('Apply the economy migration and seed before running this check.');
try{
 for(const name of ['a','b']){const email=`space-economy-${stamp}-${name}@example.com`,password='T'+randomUUID()+'!';const r=await admin.auth.admin.createUser({email,password,email_confirm:true});if(r.error)throw r.error;const user={id:r.data.user.id,email,password,jar:new Map()};users.push(user);ok('login '+name,(await request('/api/auth','POST',{action:'login',email,password,next:'/following'},user)).data?.redirect==='/following');}
 const [a,b]=users;
 const space=(await request('/api/space','POST',{slug:'reader-test-'+stamp,name:'Reader test',description:'Temporary verification',accent:'forest'},a)).data.space;
 const category=(await admin.from('space_categories').select('id').eq('space_id',space.id).limit(1)).data[0];
 let post={id:randomUUID(),version:0,title:'Reader test '+stamp,slug:'reader-'+stamp,content:'기준금리와 CPI를 공부합니다.',summary:'Temporary verification',status:'public',category_id:category.id,cover_asset_id:null,seo_title:'',seo_description:'',author:'Test',tags:[],topics:['monetary']};
 let r=await request('/api/admin/posts','POST',{post},a);ok('publish with shared topics',r.status===200);post={...post,...r.data.post};
 ok('space follow',(await request('/api/follows/spaces/'+space.id,'PUT',undefined,b)).status===200);
 ok('topic follow',(await request('/api/follows/topics/monetary','PUT',undefined,b)).status===200);
 r=await request('/api/following','GET',undefined,b);ok('one feed result for duplicate follow reasons',r.data.items.filter(p=>p.id===post.id).length===1);
 const folder=(await request('/api/bookmark-folders','POST',{name:'Study'},b)).data.folder;
 const bookmark=(await request('/api/bookmarks','POST',{post_id:post.id,folder_id:folder.id},b)).data.bookmark;
 ok('duplicate bookmark keeps identity',(await request('/api/bookmarks','POST',{post_id:post.id},b)).data.bookmark.id===bookmark.id);
 r=await request('/api/bookmarks/'+bookmark.id,'PATCH',{note:'Private test note',folder_id:folder.id,version:1},b);ok('save private note',r.status===200&&r.data.bookmark.version===2);
 ok('stale note rejected',(await request('/api/bookmarks/'+bookmark.id,'PATCH',{note:'stale',folder_id:null,version:1},b)).status===409);
 ok('other member cannot edit note',(await request('/api/bookmarks/'+bookmark.id,'PATCH',{note:'intrusion',folder_id:null,version:2},a)).status!==200);
 const own=(await request('/api/bookmark-folders','POST',{name:'Other'},a)).data.folder;
 ok('foreign folder rejected',(await request('/api/bookmarks/'+bookmark.id,'PATCH',{note:'test',folder_id:own.id,version:2},b)).status!==200);
 for(const path of ['/api/indicator-favorites/us-cpi','/api/event-saves/bls-cpi-2026-10'])ok(path+' saves',(await request(path,'PUT',undefined,b)).status===200);
 const state=(await request('/api/reader-state','GET',undefined,b)).data;ok('personal indicator and event state',state.favorites.some(f=>f.indicator_slug==='us-cpi')&&state.events.includes('bls-cpi-2026-10'));
 const other=(await request('/api/reader-state','GET',undefined,a)).data;ok('personal state does not leak',!other.events.length&&!other.favorites.length);
 r=await request('/api/admin/posts','POST',{post:{...post,status:'private'}},a);post={...post,...r.data.post};
 const hidden=(await request('/api/bookmarks','GET',undefined,b)).data.items.find(i=>i.id===bookmark.id);ok('hidden original retains private note',hidden.post===null&&hidden.note==='Private test note');ok('hidden original leaves feed',!(await request('/api/following','GET',undefined,b)).data.items.some(p=>p.id===post.id));
 ok('folder deletion',(await request('/api/bookmark-folders/'+folder.id,'DELETE',undefined,b)).status===200);ok('folder deletion moves bookmark',(await request('/api/bookmarks','GET',undefined,b)).data.items.find(i=>i.id===bookmark.id).folder_id===null);
 for(const path of ['/mypage/bookmarks','/mypage/following','/following','/mypage/events']){r=await request(path,'GET',undefined,b);ok(path+' private SSR',r.status===200&&r.text.includes('noindex')&&r.headers.get('cache-control')?.includes('no-store'));}
 const direct=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,options);await direct.auth.signInWithPassword({email:a.email,password:a.password});
 ok('direct database cannot read another member note',(await direct.from('space_bookmarks').select('*').eq('id',bookmark.id)).data?.length===0);
 ok('direct anonymous reads denied',!!(await anon.from('space_bookmarks').select('*')).error);
 ok('bookmark removal',(await request('/api/bookmarks/'+bookmark.id,'DELETE',undefined,b)).status===200);
}finally{for(const u of users){const r=await admin.auth.admin.deleteUser(u.id);if(r.error)throw new Error('Temporary test-account cleanup failed');}}
await writeFile(process.env.SPACE_CHECK_REPORT||'docs/economy-live-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),target:base,checks,total:checks.length,temporaryUsersRemoved:true},null,2)+'\n');
