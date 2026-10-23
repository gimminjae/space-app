import Link from '@/components/I18n';
import {publicationPath,publicationReadingMinutes,type Publication} from '@/lib/publication';
import {collectionText,listPublications} from '@/lib/server/publications';
import type {Locale} from '@/lib/i18n/routing';
import styles from '@/components/learn/learn.module.css';

export function PublicationList({items}:{items:Publication[]}){
 return <ol className={styles.list}>{items.map((doc,index)=><li key={doc.id} value={index+1}>
  <Link href={publicationPath(doc)} className={styles.lesson}>
   <span className={styles.number} aria-hidden="true">{String(doc.sort_order||index+1).padStart(2,'0')}</span>
   <div><p className={styles.meta}>{doc.kind==='etf'?'ETF':doc.kind==='lesson'?(doc.locale==='ko'?'입문 강의':'Learn'):(doc.locale==='ko'?'아티클':'Article')} · {publicationReadingMinutes(doc)}{doc.locale==='ko'?'분 읽기':' min read'}</p><h3>{doc.title}</h3><p className={styles.summary}>{doc.summary}</p><span className={styles.topics}>{doc.tags.join(' · ')}</span></div>
   <span className={styles.arrow} aria-hidden="true">↗</span>
  </Link>
 </li>)}</ol>;
}
export async function PublicationShelf({kind,locale}:{kind:'lesson'|'etf';locale:Locale}){
 const [items,text]=await Promise.all([listPublications(kind,locale),collectionText(kind,locale)]);
 const path=kind==='lesson'?'/learn':'/category/etf';
 return <section id={kind==='lesson'?'lessons-preview':'etf-preview'} className={styles.shelf} aria-labelledby={`${kind}-title`}>
  <div className={styles.shelfHeading}><div><p className={styles.kicker}>{kind==='lesson'?'THE FIRST CHAPTER':'INSIDE THE PORTFOLIO'}</p><h2 id={`${kind}-title`}>{text.name}</h2><p>{items.length}{locale==='ko'?'편':' articles'} · {text.summary}</p></div><Link href={path} className={styles.textLink}>{text.contents} →</Link></div>
  <PublicationList items={items.slice(0,3)}/>
 </section>;
}
