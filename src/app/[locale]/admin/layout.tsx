import AdminLogout from '@/components/AdminLogout';
import Link,{ LanguageSwitcher } from '@/components/I18n';
import styles from '@/components/admin.module.css';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { studioSpace } from '@/lib/server/spaces';
import { headers } from 'next/headers';
export const dynamic='force-dynamic';
export async function generateMetadata(){const {t,locale}=await getI18n();return localizedMetadata({title:t("나의 공간 관리"),robots:{index:false,follow:false,nocache:true}},locale);}
export default async function AdminLayout({children}:{children:React.ReactNode}){const {t}=await getI18n();const space=await studioSpace();return <><header className={styles.header}><Link href="/" className={styles.logo}>space<span> / studio</span></Link><nav><Link href="/mypage">{t("마이페이지")}</Link><Link href="/admin">{t("글 관리")}</Link><Link href="/admin/taxonomy">{t("카테고리·태그")}</Link><Link href="/admin/settings">{t("공간 설정")}</Link><Link href={`/s/${space.slug}`}>{t("내 공간 보기 ↗")}</Link><AdminLogout/></nav><LanguageSwitcher path={(await headers()).get('x-space-path')||'/admin'}/></header><main id="main" className={styles.main}>{children}</main></>;}
