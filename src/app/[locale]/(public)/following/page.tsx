import Link from '@/components/I18n';
import {privateReader,readerPosts,readerState,topics} from '@/lib/server/economy';
import {getI18n} from '@/lib/i18n/server';
import {economyText} from '@/lib/economy/messages';
import {readerMetadata} from '@/lib/server/reader-metadata';
import Feed from '@/components/economy/Feed';
import styles from '@/components/economy/economy.module.css';
export const dynamic='force-dynamic';
export const generateMetadata=()=>readerMetadata('feed','/following',true);
export default async function Page(){await privateReader('/following');const {locale}=await getI18n(),[initial,state]=await Promise.all([readerPosts('following'),readerState()]);return <div className={styles.page}><div className={styles.head}><div><p className="eyebrow">A FEED OF YOUR OWN</p><h1>{economyText(locale,'feed')}</h1><p>{economyText(locale,'readerIntro')}</p></div><Link className={styles.button} href="/mypage/following">{economyText(locale,'manage')}</Link></div>{!state?.spaces.length&&!state?.topics.length&&<div className={styles.featured}><p>{economyText(locale,'noFollows')}</p><Link href="/topics">{economyText(locale,'topics')}</Link><Link href="/spaces">{economyText(locale,'spaces')}</Link></div>}<Feed initial={initial} topics={topics}/></div>;}
