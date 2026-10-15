'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from '@/components/I18n';
import type {Indicator} from '@/lib/economy/types';
import {useReader} from './use-reader';
import styles from './economy.module.css';
export default function FavoriteList({items}:{items:Indicator[]}){const {locale,e,request}=useReader(),router=useRouter(),[error,setError]=useState(''),[busy,setBusy]=useState(false);async function up(i:number){const order=items.map(x=>x.slug);[order[i-1],order[i]]=[order[i],order[i-1]];setBusy(true);try{await request('/api/indicator-favorites','PATCH',{order});router.refresh();}catch(err){setError(err instanceof Error?err.message:e('error'));}finally{setBusy(false);}}return <><div className={styles.chips}>{items.map((x,i)=><span key={x.slug} className={styles.chip}><Link href={'/indicators/'+x.slug}>{x[locale].name}</Link> <button disabled={!i||busy} onClick={()=>up(i)} aria-label={e('moveUp')+' '+x[locale].name}>↑</button></span>)}</div>{error&&<p className={styles.error} role="alert">{error}</p>}</>;}
