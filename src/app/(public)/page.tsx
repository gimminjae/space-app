import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { getCategories, listPosts } from '@/lib/server/posts';
import { PostList,Pagination } from '@/components/PostList';
import styles from '@/components/site.module.css';
import { absolute } from '@/lib/site';
export async function generateMetadata({searchParams}:{searchParams:Promise<{page?:string}>}) {const page=Math.max(1,Math.min(10000,Number((await searchParams).page)||1));return {alternates:{canonical:absolute(page>1?`/?page=${page}`:'/')}};}
export default async function Home({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const params=await searchParams; const page=Math.max(1,Math.min(10000,Number(params.page)||1));
  const [categories,result]=await Promise.all([getCategories(),listPosts({page})]);
  return <><section className={styles.hero}><div><p className={styles.eyebrow}><span className={styles.dot}/> A LITTLE SPACE FOR BIG IDEAS</p><h1>경제를 읽는 시간,<br/>시야가 넓어지는 <em>공간.</em></h1><p className={styles.heroText}>숫자 너머의 흐름을 이해하고,<br/>우리의 일상과 연결합니다.</p><a href="#articles" className={styles.heroCta}>차분히 읽어보기 <ArrowDown size={17}/></a><Link href="/admin" className={styles.heroCta}>나의 공간 시작하기 <ArrowUpRight size={17}/></Link></div><div className={styles.heroArt} aria-hidden="true"><div className={styles.artCaption}>PERSPECTIVE<br/>CHANGES EVERYTHING.</div><div className={styles.orbit}/><div className={styles.orbit2}/><div className={styles.sphere}/><span className={styles.artIndex}>01 — ∞</span><span className={styles.artLabel}>ROOM TO THINK.</span></div></section><section id="articles" className={styles.articles}><div className={styles.sectionHead}><div><p className={styles.eyebrow}>THE JOURNAL</p><h2>새롭게 펼치는 이야기</h2></div><span className={styles.count}>{result.total}개의 글</span></div><nav className={styles.categoryNav} aria-label="카테고리"><Link href="/" className={styles.active}>전체</Link>{categories.map(c=><Link href={`/category/${c.slug}`} key={c.id}>{c.name}</Link>)}</nav><PostList posts={result.posts}/><Pagination page={page} total={result.total} path="/"/></section><section className={styles.manifesto}><span>OUR PERSPECTIVE</span><h2>더 많은 정보보다,<br/><em>더 깊은 이해를.</em></h2><div><p>빠르게 변하는 경제 속에서도<br/>나만의 관점을 가질 수 있도록.<br/>space는 오늘의 질문에서 시작합니다.</p><Link href="/about">space의 이야기 <ArrowUpRight size={18}/></Link></div></section></>;
}
