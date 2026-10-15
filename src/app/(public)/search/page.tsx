import {Search} from 'lucide-react';
import {listPosts} from '@/lib/server/posts';
import {PostList,Pagination} from '@/components/PostList';
import styles from '@/components/site.module.css';
export const metadata={title:'검색',robots:{index:false,follow:true}};
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}) {const {q='',page='1'}=await searchParams; const query=q.trim().slice(0,100); const pageNumber=Math.max(1,Number(page)||1);const result=await listPosts({query,page:pageNumber});return <section className={styles.archive}><p className={styles.eyebrow}>FIND YOUR PERSPECTIVE</p><h1>어떤 이야기가 궁금한가요?</h1><form action="/search" className={styles.searchForm}><label className="sr-only" htmlFor="query">검색어</label><input id="query" name="q" defaultValue={query} placeholder="금리, 환율, 그리고 궁금한 경제 이야기" maxLength={100}/><button aria-label="검색"><Search size={22}/></button></form><p className={styles.searchResult}>{query?`“${query}” 검색 결과`:'전체 글'} · {result.total}개</p><PostList posts={result.posts}/><Pagination page={pageNumber} total={result.total} path="/search" query={{q:query}}/></section>;}
