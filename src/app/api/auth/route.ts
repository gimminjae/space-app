import {assertOrigin,errorResponse,readJson,HttpError,requireUser} from '@/lib/server/auth';
import {userDb} from '@/lib/server/session';
import {site} from '@/lib/site';
import {z} from 'zod';
const schema=z.object({action:z.enum(['login','signup','reset','update-password']),email:z.email().max(254).optional(),password:z.string().max(128).optional()});
export async function POST(request:Request){try{
 assertOrigin(request);const input=schema.safeParse(await readJson(request));if(!input.success)throw new HttpError(400,'이메일과 비밀번호를 확인해 주세요.');
 const {action,email,password}=input.data;
 if((action==='signup'||action==='reset')&&process.env.AUTH_EMAIL_READY!=='true')throw new HttpError(503,'이메일 인증 서비스를 준비하고 있습니다. 잠시 후 다시 이용해 주세요.');
 const client=await userDb();
 if(action!=='update-password'&&!email)throw new HttpError(400,'이메일을 입력해 주세요.');
 if(action!=='reset'&&(!password||password.length<(action==='login'?1:10)))throw new HttpError(400,'비밀번호는 10자 이상으로 입력해 주세요.');
 if(action==='reset'){
  const {error}=await client.auth.resetPasswordForEmail(email!,{redirectTo:`${site.url}/auth/callback?next=/account/password`});
  if(error)throw new HttpError(error.status===429?429:400,error.status===429?'요청이 많습니다. 잠시 후 다시 시도해 주세요.':'재설정 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.');
  return Response.json({message:'등록된 이메일이면 비밀번호 재설정 안내가 발송됩니다.'});
 }
 if(action==='update-password'){
  await requireUser();const {error}=await client.auth.updateUser({password});if(error)throw new HttpError(400,'비밀번호를 변경하지 못했습니다. 새 비밀번호를 확인해 주세요.');
  await client.auth.signOut({scope:'global'});return Response.json({redirect:'/login?changed=1'});
 }
 const {data,error}=action==='signup'?await client.auth.signUp({email:email!,password:password!,options:{emailRedirectTo:`${site.url}/auth/callback`}}):await client.auth.signInWithPassword({email:email!,password:password!});
 if(error){const message=error.code==='email_not_confirmed'?'이메일 인증을 완료한 후 로그인해 주세요.':error.status===429?'요청이 많습니다. 잠시 후 다시 시도해 주세요.':action==='login'?'이메일 또는 비밀번호가 올바르지 않습니다.':'가입을 완료하지 못했습니다. 이메일을 확인하거나 잠시 후 다시 시도해 주세요.';throw new HttpError(error.status===429?429:400,message);}
 return Response.json(data.session?{redirect:'/mypage'}:{message:'이메일로 보낸 인증 링크를 열어 가입을 완료해 주세요. 기존 회원이라면 로그인 또는 비밀번호 재설정을 이용해 주세요.'});
}catch(error){return errorResponse(error);}}
export async function DELETE(request:Request){try{assertOrigin(request);const client=await userDb();await client.auth.signOut();return Response.json({ok:true});}catch(error){return errorResponse(error);}}
