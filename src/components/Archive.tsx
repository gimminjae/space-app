import { listPosts,getCategories } from '@/lib/server/posts';
import {PostList,Pagination} from './PostList';
import styles from './site.module.css';
import Link from 'next/link';
export async function Archive({title,description,category,tag,page=1}:{title:string;description?:string;category?:string;tag?:string;page?:number}) {
  const [result,categories]=await Promise.all([listPosts({category,tag,page}),getCategories()]);
  const path=category?`/category/${category}`:`/tag/${tag}`;
  return <section className={styles.archive}><p className={styles.eyebrow}>{tag?'TOPIC':'COLLECTION'}</p><h1>{title}</h1><p className={styles.description}>{description||'관심 있는 주제의 이야기를 모았습니다.'}</p><nav className={styles.categoryNav} aria-label="카테고리"><Link href="/">전체</Link>{categories.map(c=><Link href={`/category/${c.slug}`} className={c.slug===category?styles.active:''} key={c.id}>{c.name}</Link>)}</nav><PostList posts={result.posts}/><Pagination page={page} total={result.total} path={path}/></section>;
}
