'use client';
import { useI18n,useLocaleRouter as useRouter } from '@/components/I18n';
export default function AdminLogout(){const {t,locale}=useI18n();const router=useRouter();return <button onClick={async()=>{await fetch('/api/auth',{method:'DELETE',headers:{'x-space-language':locale}});router.push('/login');router.refresh();}}>{t("로그아웃")}</button>;}
