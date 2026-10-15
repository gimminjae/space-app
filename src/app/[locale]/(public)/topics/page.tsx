import Link from '@/components/I18n';
import {readerState,topics} from '@/lib/server/economy';
import {getI18n} from '@/lib/i18n/server';
import {economyText} from '@/lib/economy/messages';
import {readerMetadata} from '@/lib/server/reader-metadata';
import ReaderAction from '@/components/economy/ReaderAction';
import styles from '@/components/economy/economy.module.css';
export const generateMetadata=()=>readerMetadata('topics','/topics');
export default async function Page(){const {locale}=await getI18n(),state=await readerState();return <div className={styles.page}><div className={styles.head}><div><p className="eyebrow">FOLLOW YOUR CURIOSITY</p><h1>{economyText(locale,'topics')}</h1><p>{economyText(locale,'topicIntro')}</p></div></div><div className={styles.grid}>{topics.map(t=><div className={styles.card} key={t.slug}><Link href={'/topics/'+t.slug}><h2>{t[locale].name}</h2></Link><p>{t[locale].summary}</p><ReaderAction kind="topic" id={t.slug} signedIn={!!state} active={state?.topics.includes(t.slug)}/></div>)}</div></div>;}
