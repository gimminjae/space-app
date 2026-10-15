import AuthForm from '@/components/AuthForm';
import {databaseConfigured} from '@/lib/server/db';
import {currentUser} from '@/lib/server/session';
import {redirect} from 'next/navigation';
export const metadata={title:'로그인',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{error?:string;changed?:string}>}){const params=await searchParams;if(await currentUser())redirect("/admin");return <AuthForm mode="login" configured={databaseConfigured()} notice={params.error?'인증 링크가 만료되었거나 사용할 수 없습니다. 다시 시도해 주세요.':params.changed?'비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.':''}/>;}
