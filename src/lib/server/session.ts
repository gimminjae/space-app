import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {cache} from 'react';
import {databaseConfigured} from './db';
// Only our server talks to Supabase. Cookies stay HttpOnly, including during refresh.
export const userDb=cache(async()=>{
 const jar=await cookies();
 if(!databaseConfigured())throw new Error('데이터베이스 연결 설정을 확인해 주세요.');
 return createServerClient(process.env.SUPABASE_URL!,process.env.SUPABASE_PUBLISHABLE_KEY!,{
  cookieOptions:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'},
  global:{fetch:(url,init)=>fetch(url,{...init,cache:'no-store'})},
  cookies:{getAll:()=>jar.getAll(),setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,options));}catch{/* Server Components rely on proxy for refresh. */}}}
 });
});
export const currentUser=cache(async()=>{
 if(!databaseConfigured())return null;
 const client=await userDb();const {data,error}=await client.auth.getUser();
 return error?null:data.user;
});
