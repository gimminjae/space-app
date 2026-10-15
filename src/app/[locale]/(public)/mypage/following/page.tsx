import Link from '@/components/I18n';
import {privateReader,readerState,topics} from '@/lib/server/economy';
import {getI18n} from '@/lib/i18n/server';
import {economyText} from '@/lib/economy/messages';
import {readerMetadata} from '@/lib/server/reader-metadata';
import ReaderAction from '@/components/economy/ReaderAction';
import styles from '@/components/economy/economy.module.css';
export const dynamic='force-dynamic';
export const generateMetadata=()=>readerMetadata('manage','/mypage/following',true);
export default async function Page(){await privateReader('/mypage/following');const {locale}=await getI18n(),state=await readerState();return <div className={styles.page}><div className={styles.head}><h1>{economyText(locale,'manage')}</h1><Link href="/following" className={styles.button}>{economyText(locale,'feed')}</Link></div><h2>{economyText(locale,'spaces')}</h2><div className={styles.grid}>{state?.spaces.map(item=>{const space=item.space as unknown as {id:string;slug:string;name:string};return space&&<div className={styles.card} key={space.id}><Link href={'/s/'+space.slug}><h3>{space.name}</h3></Link><ReaderAction kind="space" id={space.id} signedIn active/></div>;})}</div>{!state?.spaces.length&&<p className={styles.empty}>{economyText(locale,'noFollows')} <Link href="/spaces">→</Link></p>}<h2>{economyText(locale,'topics')}</h2><div className={styles.grid}>{topics.map(t=><div className={styles.card} key={t.slug}><Link href={'/topics/'+t.slug}><h3>{t[locale].name}</h3></Link><p>{t[locale].summary}</p><ReaderAction key={String(state?.topics.includes(t.slug))} kind="topic" id={t.slug} signedIn active={state?.topics.includes(t.slug)}/></div>)}</div></div>;}
