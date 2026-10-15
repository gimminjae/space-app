'use client';
import {useRouter} from 'next/navigation';
export default function AdminLogout(){const router=useRouter();return <button onClick={async()=>{await fetch('/api/admin/session',{method:'DELETE'});router.refresh();}}>관리 종료</button>;}
