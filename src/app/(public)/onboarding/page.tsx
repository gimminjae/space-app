import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/server/session';
import {mySpace} from '@/lib/server/spaces';
import SpaceSettings from '@/components/SpaceSettings';
import AdminLogout from '@/components/AdminLogout';
import styles from '@/components/admin.module.css';
export const metadata={title:'나의 공간 만들기',robots:{index:false,follow:false}};
export default async function Onboarding(){if(!await currentUser())redirect('/login');if(await mySpace())redirect('/admin');return <div className={styles.main}><SpaceSettings/><div className={styles.authLinks}><AdminLogout/></div></div>;}
