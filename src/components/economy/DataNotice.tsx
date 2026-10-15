import Link from '@/components/I18n';
import {getI18n} from '@/lib/i18n/server';
import styles from './economy.module.css';
export default async function DataNotice(){const {locale}=await getI18n();return <aside className={styles.source}><p>This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.</p><Link href="/data-terms">{locale==='ko'?'데이터 출처 및 이용 안내':'Data sources and terms'} →</Link></aside>;}
