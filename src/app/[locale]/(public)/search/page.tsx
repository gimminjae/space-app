import {notFound} from 'next/navigation';
import {Search} from 'lucide-react';
import {getI18n,localizedMetadata} from '@/lib/i18n/server';
import {searchPublications} from '@/lib/server/publications';
import {parsePage,pageExists} from '@/lib/pagination';
import {Pagination} from '@/components/PostList';
import {PublicationList} from '@/components/publication/PublicationList';
import styles from '@/components/site.module.css';
export async function generateMetadata(){const {t,locale}=await getI18n();return localizedMetadata({title:t('검색'),robots:{index:false,follow:true}},locale);}
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}){
 const {t,l,locale}=await getI18n();const {q='',page}=await searchParams;const query=q.trim().slice(0,100),number=parsePage(page);if(number===null)notFound();
 const items=await searchPublications(query,locale);if(!pageExists(number,items.length))notFound();
 return <section className={styles.archive}><p className={styles.eyebrow}>FIND YOUR PERSPECTIVE</p><h1>{t('어떤 이야기가 궁금한가요?')}</h1><form action={l('/search')} className={styles.searchForm}><label className="sr-only" htmlFor="query">{t('검색어')}</label><input id="query" name="q" defaultValue={query} placeholder={t('금리, 환율, 그리고 궁금한 경제 이야기')} maxLength={100}/><button aria-label={t('검색')}><Search size={22}/></button></form><p className={styles.searchResult}>{query?t('검색 결과: {query}',{query}):t('전체 글')} · {items.length}{t('개')}</p><PublicationList items={items.slice((number-1)*9,number*9)}/>{!items.length&&<p>{locale==='ko'?'검색 결과가 없습니다.':'No articles found.'}</p>}<Pagination page={number} total={items.length} path="/search" query={{q:query}}/></section>;
}
