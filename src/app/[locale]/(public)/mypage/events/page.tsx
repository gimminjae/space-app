import Link from '@/components/I18n';
import {getI18n} from '@/lib/i18n/server';
import {economyText} from '@/lib/economy/messages';
import {economicEvents,privateReader,readerState} from '@/lib/server/economy';
import {readerMetadata} from '@/lib/server/reader-metadata';
import EventList from '@/components/economy/EventList';
import styles from '@/components/economy/economy.module.css';
export const generateMetadata=()=>readerMetadata('myEvents','/mypage/events',true);
export default async function Page({searchParams}:{searchParams:Promise<{period?:string}>}){await privateReader('/mypage/events');const {locale}=await getI18n(),period=(await searchParams).period==='past'?'past':'upcoming',[events,state]=await Promise.all([economicEvents({saved:true,period}),readerState()]);return <div className={styles.page}><div className={styles.head}><h1>{economyText(locale,'myEvents')}</h1><Link href="/calendar" className={styles.button}>{economyText(locale,'calendar')}</Link></div><div className={styles.chips}><Link className={styles.chip} href="/mypage/events">{economyText(locale,'upcoming')}</Link><Link className={styles.chip} href="/mypage/events?period=past">{economyText(locale,'past')}</Link></div><EventList events={events} signedIn savedIds={state?.events}/></div>;}
