import { notFound } from 'next/navigation';
import { parsePage,pageExists,pagePath } from '@/lib/pagination';
import { site,absolute as siteAbsolute } from '@/lib/site';
import { EtfShelf } from '@/components/etf/EtfList';
import { contentOnly } from '@/lib/platform-mode';
import { CourseShelf } from '@/components/learn/LessonList';
import Link from '@/components/I18n';
import { Pagination,PostList } from '@/components/PostList';
import styles from '@/components/site.module.css';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { getCategories,publicPostPage } from '@/lib/server/posts';
import { ArrowDown,ArrowUpRight } from 'lucide-react';
export async function generateMetadata({searchParams}:{searchParams:Promise<{page?:string}>}) {
 const {t,locale,absolute}=await getI18n();
 const page=parsePage((await searchParams).page);if(page===null)notFound();
 if(page>1&&(contentOnly||!pageExists(page,(await publicPostPage(page)).total)))notFound();
 const title=t(site.title)+(page>1?(locale==='ko'?` · ${page}페이지`:` · Page ${page}`):'');
 return localizedMetadata({title,description:t(site.description),alternates:{canonical:absolute(pagePath('/',page))}},locale);
}
export default async function Home({searchParams}:{searchParams:Promise<{page?:string}>}) {const {t,number,category,locale}=await getI18n();
  const params=await searchParams; const page=parsePage(params.page);if(page===null)notFound();
  const [categories,result]=contentOnly?[[],{posts:[],total:0}]:await Promise.all([getCategories(),publicPostPage(page)]);
  if(!pageExists(page,result.total))notFound();
  const structured={'@context':'https://schema.org','@graph':[
   {'@type':'WebSite','@id':siteAbsolute('/#website'),name:'space',url:siteAbsolute('/'),inLanguage:['ko','en'],publisher:{'@id':siteAbsolute('/#organization')}},
   {'@type':'Organization','@id':siteAbsolute('/#organization'),name:'space',url:siteAbsolute('/'),logo:siteAbsolute('/icon.svg')},
  ]};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/><section className={styles.hero}><div><p className={styles.eyebrow}><span className={styles.dot}/> A LITTLE SPACE FOR BIG IDEAS</p><h1>{t("경제를 읽는 시간,")}<br/>{t("시야가 넓어지는")}{" "}<em>{t("공간.")}</em></h1><p className={styles.heroText}>{t("숫자 너머의 흐름을 이해하고,")}<br/>{t("우리의 일상과 연결합니다.")}</p><a href={page===1?"#lessons-preview":"#articles"} className={styles.heroCta}>{t("차분히 읽어보기")}{" "}<ArrowDown size={17}/></a><Link href="/category/etf" className={styles.heroCta}>{locale==='ko'?'ETF 읽어보기':'Explore ETFs'} <ArrowUpRight size={17}/></Link></div><div className={styles.heroArt} aria-hidden="true"><div className={styles.artCaption}>PERSPECTIVE<br/>CHANGES EVERYTHING.</div><div className={styles.orbit}/><div className={styles.orbit2}/><div className={styles.sphere}/><span className={styles.artIndex}>01 — ∞</span><span className={styles.artLabel}>ROOM TO THINK.</span></div></section>{page===1&&<><CourseShelf locale={locale}/><EtfShelf locale={locale}/></>}{(result.total>0||page>1)&&<section id="articles" className={styles.articles}><div className={styles.sectionHead}><div><p className={styles.eyebrow}>THE JOURNAL</p><h2>{t("새롭게 펼치는 이야기")}</h2></div><span className={styles.count}>{t("{count}개의 글",{count:number(result.total)})}</span></div><nav className={styles.categoryNav} aria-label={t("카테고리")}><Link href="/" className={styles.active}>{t("전체")}</Link>{categories.map(c=><Link href={`/category/${c.slug}`} key={c.id}>{category(c).name}</Link>)}</nav><PostList posts={result.posts}/><Pagination page={page} total={result.total} path="/"/></section>}<section className={styles.manifesto}><span>OUR PERSPECTIVE</span><h2>{t("더 많은 정보보다,")}<br/><em>{t("더 깊은 이해를.")}</em></h2><div><p>{t("빠르게 변하는 경제 속에서도")}<br/>{t("나만의 관점을 가질 수 있도록.")}<br/>{t("space는 오늘의 질문에서 시작합니다.")}</p><Link href="/about">{t("space의 이야기")}{" "}<ArrowUpRight size={18}/></Link></div></section></>;
}
