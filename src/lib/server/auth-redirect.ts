import { getI18n } from '@/lib/i18n/server';
import { site } from '@/lib/site';
import { NextResponse } from 'next/server';
import 'server-only';

export async function authRedirect(path:'/mypage'|'/account/password'|'/login?error=expired'){
 const {l}=await getI18n();
 const destination=new URL(l(path),site.url);
 // Netlify forwards the original query when Location has none. Replace it so
 // one-time codes and token hashes never follow users into another page.
 if(!destination.search)destination.searchParams.set('verified','1');
 return NextResponse.redirect(destination,{headers:{
  'Cache-Control':'private, no-store, max-age=0',
  'Netlify-CDN-Cache-Control':'no-store',
  'Referrer-Policy':'no-referrer',
 }});
}
