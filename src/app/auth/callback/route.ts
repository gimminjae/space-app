import {contentOnly} from '@/lib/platform-mode';
import {userDb} from '@/lib/server/session';
import {authRedirect} from '@/lib/server/auth-redirect';
export async function GET(request:Request){
 if(contentOnly)return new Response(null,{status:404});
 const url=new URL(request.url);const code=url.searchParams.get('code');
 if(code){const {error}=await (await userDb()).auth.exchangeCodeForSession(code);if(!error)return authRedirect(url.searchParams.get('next')==='/account/password'?'/account/password':'/mypage');}
 return authRedirect('/login?error=expired');
}
