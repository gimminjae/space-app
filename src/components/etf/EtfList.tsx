import Link from '@/components/I18n';
import { etfArticles, etfReadingTime, etfText, type EtfArticle } from '@/lib/etf';
import type { Locale } from '@/lib/i18n/routing';
import styles from '@/components/learn/learn.module.css';
export function EtfList({ locale, items = etfArticles }: { locale: Locale; items?: EtfArticle[] }) {
  return <ol className={styles.list}>{items.map(article => <li key={article.slug} value={article.order}>
    <Link href={`/etf/${article.slug}`} className={styles.lesson}>
      <span className={styles.number} aria-hidden="true">{String(article.order).padStart(2, '0')}</span>
      <div><p className={styles.meta}>ETF · {etfReadingTime(article, locale)}</p><h3>{article[locale].title}</h3><p className={styles.summary}>{article[locale].summary}</p><span className={styles.topics}>{article[locale].tags.join(' · ')}</span></div>
      <span className={styles.arrow} aria-hidden="true">↗</span>
    </Link>
  </li>)}</ol>;
}
export function EtfShelf({ locale }: { locale: Locale }) {
  return <section id="etf-preview" className={styles.shelf} aria-labelledby="etf-title">
    <div className={styles.shelfHeading}><div><p className={styles.kicker}>INSIDE THE PORTFOLIO</p><h2 id="etf-title">{etfText[locale].name}</h2><p>{locale === 'ko' ? '17편 · 배당, 옵션, 그리고 투자한 돈의 행방' : '17 articles · Dividends, options, and the capital behind them'}</p></div><Link href="/category/etf" className={styles.textLink}>{etfText[locale].contents} →</Link></div>
    <EtfList locale={locale} items={etfArticles.slice(0, 3)}/>
  </section>;
}
