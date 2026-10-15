import Link from '@/components/I18n';
import {getI18n} from '@/lib/i18n/server';
import {economyText} from '@/lib/economy/messages';
import styles from './economy.module.css';
export default async function ReaderNav(){const {locale}=await getI18n(),e=(key:Parameters<typeof economyText>[1])=>economyText(locale,key);return <nav className={styles.nav} aria-label={locale==='ko'?'경제 탐색':'Explore economics'}>{[['/following','feed'],['/mypage/bookmarks','library'],['/topics','topics'],['/glossary','glossary'],['/indicators','indicators'],['/calendar','calendar']].map(([path,key])=><Link key={path} href={path}>{e(key as Parameters<typeof e>[0])}</Link>)}</nav>;}
