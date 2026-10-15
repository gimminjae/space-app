import {userDb} from '@/lib/server/session';
import {authRedirect} from '@/lib/server/auth-redirect';
export async function GET(request:Request){
 const url=new URL(request.url),token_hash=url.searchParams.get('token_hash'),type=url.searchParams.get('type');
 if(token_hash&&(type==='email'||type==='recovery')){const {error}=await (await userDb()).auth.verifyOtp({token_hash,type});if(!error)return authRedirect(type==='recovery'?'/account/password':'/mypage');}
 return authRedirect('/login?error=expired');
}
