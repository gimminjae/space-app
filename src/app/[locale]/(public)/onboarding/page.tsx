import AdminLogout from '@/components/AdminLogout';
import SpaceSettings from '@/components/SpaceSettings';
import styles from '@/components/admin.module.css';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { currentUser } from '@/lib/server/session';
import { mySpace } from '@/lib/server/spaces';
import { redirect } from 'next/navigation';
export async function generateMetadata(){const {t,locale}=await getI18n();return localizedMetadata({title:t("나의 공간 만들기"),robots:{index:false,follow:false}},locale);}
export default async function Onboarding(){const {l}=await getI18n();if(!await currentUser())redirect(l('/login'));if(await mySpace())redirect(l('/admin'));return <div className={styles.main}><SpaceSettings/><div className={styles.authLinks}><AdminLogout/></div></div>;}
