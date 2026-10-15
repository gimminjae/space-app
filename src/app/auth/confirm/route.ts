import {NextResponse} from 'next/server';
import {userDb} from '@/lib/server/session';
import {site} from '@/lib/site';
export async function GET(request:Request){
 const url=new URL(request.url),token_hash=url.searchParams.get('token_hash'),type=url.searchParams.get('type');
 if(token_hash&&(type==='email'||type==='recovery')){const {error}=await (await userDb()).auth.verifyOtp({token_hash,type});if(!error)return NextResponse.redirect(new URL(type==='recovery'?'/account/password':'/admin',site.url));}
 return NextResponse.redirect(new URL('/login?error=expired',site.url));
}
