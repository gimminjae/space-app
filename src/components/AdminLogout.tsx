'use client';
import {useRouter} from 'next/navigation';
export default function AdminLogout(){const router=useRouter();return <button onClick={async()=>{await fetch('/api/auth',{method:'DELETE'});router.push('/login');router.refresh();}}>로그아웃</button>;}
