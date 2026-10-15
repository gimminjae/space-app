import {NextResponse} from 'next/server';
import {userDb} from '@/lib/server/session';
import {site} from '@/lib/site';
export async function GET(request:Request){
 const url=new URL(request.url);const code=url.searchParams.get('code');
 if(code){const {error}=await (await userDb()).auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(url.searchParams.get('next')==='/account/password'?'/account/password':'/admin',site.url));}
 return NextResponse.redirect(new URL('/login?error=expired',site.url));
}
