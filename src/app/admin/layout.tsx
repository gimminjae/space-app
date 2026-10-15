import Link from 'next/link';
import {isAdmin} from '@/lib/server/auth';
import {adminDatabaseConfigured} from '@/lib/server/db';
import AdminLogin from '@/components/AdminLogin';
import AdminLogout from '@/components/AdminLogout';
import styles from '@/components/admin.module.css';
export const dynamic='force-dynamic';
export const metadata={title:'관리',robots:{index:false,follow:false,nocache:true}};
export default async function AdminLayout({children}:{children:React.ReactNode}){const admin=await isAdmin();return <><header className={styles.header}><Link href="/" className={styles.logo}>space<span> / studio</span></Link>{admin&&<nav><Link href="/admin">글 관리</Link><Link href="/admin/taxonomy">카테고리·태그</Link><a href="/" target="_blank" rel="noreferrer">블로그 보기 ↗</a><AdminLogout/></nav>}</header><main id="main" className={styles.main}>{admin?children:<AdminLogin configured={adminDatabaseConfigured()&&!!process.env.ADMIN_PASSWORD_HASH&&!!process.env.ADMIN_SESSION_SECRET}/>}</main></>;}
