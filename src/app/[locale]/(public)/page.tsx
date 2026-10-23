import {notFound} from 'next/navigation';
import Link from '@/components/I18n';
import {PublicationList,PublicationShelf} from '@/components/publication/PublicationList';
import styles from '@/components/site.module.css';
import {getI18n,localizedMetadata} from '@/lib/i18n/server';
import {getPublicationSettings,listPublications} from '@/lib/server/publications';
import {absolute as siteAbsolute} from '@/lib/site';
import {parsePage} from '@/lib/pagination';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
async function homeText(){const {locale}=await getI18n();return (await getPublicationSettings('home')).value[locale] as Record<string,string>;}
export async function generateMetadata(){const {locale,absolute}=await getI18n();const text=await homeText();return localizedMetadata({title:text.title,description:text.summary,alternates:{canonical:absolute('/')}},locale);}
export default async function Home({searchParams}:{searchParams:Promise<{page?:string}>}){
 const {locale,t}=await getI18n();if(parsePage((await searchParams).page)!==1)notFound();
 const [text,articles]=await Promise.all([homeText(),listPublications('article',locale)]);
 const structured={'@context':'https://schema.org','@graph':[
  {'@type':'WebSite','@id':siteAbsolute('/#website'),name:'space',url:siteAbsolute('/'),inLanguage:['ko','en'],publisher:{'@id':siteAbsolute('/#organization')}},
  {'@type':'Organization','@id':siteAbsolute('/#organization'),name:'space',url:siteAbsolute('/'),logo:siteAbsolute('/icon.svg')}
 ]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/>
  <section className={styles.hero}><div><p className={styles.eyebrow}><span className={styles.dot}/> A LITTLE SPACE FOR BIG IDEAS</p><h1>{text.heroFirst}<br/>{text.heroSecond} <em>{text.heroEmphasis}</em></h1><p className={styles.heroText}>{text.heroDescriptionFirst}<br/>{text.heroDescriptionSecond}</p><a href="#lessons-preview" className={styles.heroCta}>{t('차분히 읽어보기')} <ArrowDown size={17}/></a><Link href="/category/etf" className={styles.heroCta}>{locale==='ko'?'ETF 읽어보기':'Explore ETFs'} <ArrowUpRight size={17}/></Link></div><div className={styles.heroArt} aria-hidden="true"><div className={styles.artCaption}>PERSPECTIVE<br/>CHANGES EVERYTHING.</div><div className={styles.orbit}/><div className={styles.orbit2}/><div className={styles.sphere}/><span className={styles.artIndex}>01 — ∞</span><span className={styles.artLabel}>ROOM TO THINK.</span></div></section>
  <PublicationShelf kind="lesson" locale={locale}/><PublicationShelf kind="etf" locale={locale}/>
  {articles.length>0&&<section id="articles" className={styles.articles}><div className={styles.sectionHead}><div><p className={styles.eyebrow}>THE JOURNAL</p><h2>{t('새롭게 펼치는 이야기')}</h2></div><Link href="/articles">{t('전체 글')} →</Link></div><PublicationList items={[...articles].sort((a,b)=>b.published_at.localeCompare(a.published_at)).slice(0,6)}/></section>}
  <section className={styles.manifesto}><span>OUR PERSPECTIVE</span><h2>{text.perspectiveFirst}<br/><em>{text.perspectiveSecond}</em></h2><div><p style={{whiteSpace:'pre-line'}}>{text.perspectiveBody}</p><Link href="/about">{t('space의 이야기')} <ArrowUpRight size={18}/></Link></div></section>
 </>;
}
