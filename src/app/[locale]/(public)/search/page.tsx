import { LessonList } from '@/components/learn/LessonList';
import learnStyles from '@/components/learn/learn.module.css';
import { searchLessons, courseText } from '@/lib/learn';
import { Pagination,PostList } from '@/components/PostList';
import styles from '@/components/site.module.css';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { listPosts } from '@/lib/server/posts';
import { Search } from 'lucide-react';
export async function generateMetadata(){const {t,locale}=await getI18n();return localizedMetadata({title:t("검색"),robots:{index:false,follow:true}},locale);}
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}) {const {t,l,locale}=await getI18n();const {q='',page='1'}=await searchParams; const query=q.trim().slice(0,100); const pageNumber=Math.max(1,Number(page)||1);const courseResults=searchLessons(query,locale);const result=await listPosts({query,page:pageNumber});return <section className={styles.archive}><p className={styles.eyebrow}>FIND YOUR PERSPECTIVE</p><h1>{t("어떤 이야기가 궁금한가요?")}</h1><form action={l("/search")} className={styles.searchForm}><label className="sr-only" htmlFor="query">{t("검색어")}</label><input id="query" name="q" defaultValue={query} placeholder={t("금리, 환율, 그리고 궁금한 경제 이야기")} maxLength={100}/><button aria-label={t("검색")}><Search size={22}/></button></form><p className={styles.searchResult}>{query?t("검색 결과: {query}",{query}):t("전체 글")} · {result.total+courseResults.length}{t("개")}</p>{pageNumber===1&&courseResults.length>0&&<section className={learnStyles.searchSection}><h2>{courseText[locale].label} · {courseResults.length}</h2><LessonList locale={locale} items={courseResults}/></section>}{(result.posts.length>0||courseResults.length===0||pageNumber>1)&&<PostList posts={result.posts}/>}<Pagination page={pageNumber} total={result.total} path="/search" query={{q:query}}/></section>;}
