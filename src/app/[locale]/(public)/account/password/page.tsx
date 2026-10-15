import AuthForm from '@/components/AuthForm';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { databaseConfigured } from '@/lib/server/db';
import { currentUser } from '@/lib/server/session';
import { redirect } from 'next/navigation';
export async function generateMetadata(){const {t,locale}=await getI18n();return localizedMetadata({title:t("비밀번호 변경"),robots:{index:false,follow:false}},locale);}
export default async function Page({searchParams}:{searchParams:Promise<{error?:string;changed?:string}>}){const {t,l}=await getI18n();const params=await searchParams;if(!await currentUser())redirect(l("/login"));return <AuthForm mode="update-password" configured={databaseConfigured()} notice={params.error?t("인증 링크가 만료되었거나 사용할 수 없습니다. 다시 시도해 주세요."):params.changed?t("비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요."):''}/>;}
