import { isLocale,isSharedPath,localeCookie,unlocalizePath,type Locale } from '@/lib/i18n/routing';
import { createServerClient } from '@supabase/ssr';
import { NextResponse,type NextRequest } from 'next/server';
export async function proxy(request:NextRequest){
 const path=request.nextUrl.pathname,shared=isSharedPath(path);
 if(path==='/ko'||path.startsWith('/ko/')){const url=new URL(request.url);url.pathname=unlocalizePath(path);return NextResponse.redirect(url,308);}
 const preferred=request.headers.get('x-space-language')||request.cookies.get(localeCookie)?.value;
 const locale:Locale=shared?(isLocale(preferred)?preferred:'ko'):(path==='/en'||path.startsWith('/en/')?'en':'ko');
 // Overwrite public request headers: the URL alone determines the rendered language.
 request.headers.set('x-space-locale',locale);
 const visibleUrl=new URL(request.url);visibleUrl.searchParams.delete('_rsc');
 request.headers.set('x-space-path',path+visibleUrl.search);
 const destination=new URL(request.url);
 if(!shared&&locale==='ko')destination.pathname=`/ko${path==='/'?'':path}`;
 const makeResponse=()=>!shared&&locale==='ko'?NextResponse.rewrite(destination,{request:{headers:request.headers}}):NextResponse.next({request:{headers:request.headers}});
 let response=makeResponse();
 if(process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY){
  const client=createServerClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{
   cookieOptions:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'},
   cookies:{getAll:()=>request.cookies.getAll(),setAll(values,headers){
    values.forEach(({name,value})=>request.cookies.set(name,value));response=makeResponse();
    values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    Object.entries(headers).forEach(([key,value])=>response.headers.set(key,value));
   }}
  });
  await client.auth.getClaims();
 }
 if(!shared)response.cookies.set(localeCookie,locale,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:365*24*60*60});
 response.headers.set('Cache-Control','private, no-store, max-age=0');
 response.headers.set('Netlify-CDN-Cache-Control','no-store');
 response.headers.set('Vary','Cookie');
 response.headers.set('Content-Language',locale);
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|icon.svg|og-space.png|favicon.ico).*)']};
