import {notFound} from 'next/navigation';
import {getI18n,localizedMetadata} from '@/lib/i18n/server';
import {allPublications} from '@/lib/server/publications';
import {publicationPath} from '@/lib/publication';
import {parsePage,pageExists,pagePath} from '@/lib/pagination';
import {PublicationList} from '@/components/publication/PublicationList';
import {Pagination} from '@/components/PostList';
import styles from '@/components/learn/learn.module.css';
const itemsFor=async(locale:'ko'|'en')=>(await allPublications(locale)).filter(d=>d.kind!=='page').sort((a,b)=>b.published_at.localeCompare(a.published_at)||a.sort_order-b.sort_order);
export async function generateMetadata({searchParams}:{searchParams:Promise<{page?:string}>}){
 const {locale,absolute}=await getI18n();const page=parsePage((await searchParams).page);if(page===null)notFound();const items=await itemsFor(locale);if(!pageExists(page,items.length))notFound();
 return localizedMetadata({title:(locale==='ko'?'모든 글 · 경제, 재테크와 ETF':'All articles · Economics, money and ETFs')+(page>1?` · ${page}`:''),description:locale==='ko'?'space의 경제 입문 강의와 ETF 해설, 새로 발행된 아티클을 한곳에서 읽어보세요.':'Read beginner economics lessons, ETF guides and newly published articles from space in one place.',alternates:{canonical:absolute(pagePath('/articles',page))},robots:{index:items.length>0,follow:true}},locale);
}
export default async function Articles({searchParams}:{searchParams:Promise<{page?:string}>}){
 const {locale,absolute}=await getI18n();const page=parsePage((await searchParams).page);if(page===null)notFound();const items=await itemsFor(locale);if(!pageExists(page,items.length))notFound();const shown=items.slice((page-1)*9,page*9);
 const schema={'@context':'https://schema.org','@type':'CollectionPage',url:absolute(pagePath('/articles',page)),name:locale==='ko'?'모든 글':'All articles',mainEntity:{'@type':'ItemList',numberOfItems:shown.length,itemListElement:shown.map((d,i)=>({'@type':'ListItem',position:(page-1)*9+i+1,name:d.title,url:absolute(publicationPath(d))}))}};
 return <section className={styles.hub}><header className={styles.intro}><p className={styles.kicker}>THE JOURNAL</p><h1>{locale==='ko'?'모든 글':'All articles'}</h1><p>{items.length}{locale==='ko'?'개의 이야기':' articles'}</p></header><PublicationList items={shown}/><Pagination page={page} total={items.length} path="/articles"/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/></section>;
}
