import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
export async function proxy(request:NextRequest){
 let response=NextResponse.next({request});
 if(process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY){
  const client=createServerClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{
   cookieOptions:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'},
   cookies:{getAll:()=>request.cookies.getAll(),setAll(values,headers){
    values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});
    values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    Object.entries(headers).forEach(([key,value])=>response.headers.set(key,value));
   }}
  });
  await client.auth.getClaims();
 }
 response.headers.set('Cache-Control','private, no-store, max-age=0');
 response.headers.set('Netlify-CDN-Cache-Control','no-store');
 response.headers.set('Vary','Cookie');
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|icon.svg|og-space.png|favicon.ico).*)']};
