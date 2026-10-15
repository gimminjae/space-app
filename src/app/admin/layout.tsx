import Link from 'next/link';
import {studioSpace} from '@/lib/server/spaces';
import AdminLogout from '@/components/AdminLogout';
import styles from '@/components/admin.module.css';
export const dynamic='force-dynamic';
export const metadata={title:'나의 공간 관리',robots:{index:false,follow:false,nocache:true}};
export default async function AdminLayout({children}:{children:React.ReactNode}){const space=await studioSpace();return <><header className={styles.header}><Link href="/" className={styles.logo}>space<span> / studio</span></Link><nav><Link href="/admin">글 관리</Link><Link href="/admin/taxonomy">카테고리·태그</Link><Link href="/admin/settings">공간 설정</Link><Link href={`/s/${space.slug}`}>내 공간 보기 ↗</Link><AdminLogout/></nav></header><main id="main" className={styles.main}>{children}</main></>;}
