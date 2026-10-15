import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { dateLabel, readingMinutes, postPath } from '@/lib/site';
import type { Post } from '@/lib/types';
import styles from './site.module.css';
export function PostList({posts}:{posts:Post[]}) {
  if(!posts.length) return <div className={styles.empty}><BookOpen size={26}/><h3>새로운 이야기를 준비하고 있습니다.</h3><p>경제를 이해하는 데 도움이 되는 글을 이곳에 차곡차곡 담겠습니다.</p></div>;
  return <div className={styles.postList}>{posts.map((post,i)=><article className={styles.postCard} key={post.id}><Link href={postPath(post)} tabIndex={-1} aria-hidden="true" className={`${styles.cover} ${styles[`tone${i%3}`]}`}>{post.cover_asset_id?<img src={`/media/${post.cover_asset_id}`} alt="" loading="lazy"/>:<><span>SPACE<br/>JOURNAL</span><span className={styles.coverOrb}/><small>{post.category?.name||'ECONOMY'}</small></>}</Link><div className={styles.postInfo}><div className={styles.eyebrow}>{post.category?.name||'경제'} <span>·</span> {readingMinutes(post.content)}분 읽기</div><h3><Link href={postPath(post)}>{post.title}</Link></h3><p>{post.summary}</p><div className={styles.postBottom}>{post.space&&<Link href={`/s/${post.space.slug}`}>{post.space.name}</Link>}<time dateTime={post.published_at||post.created_at}>{dateLabel(post.published_at||post.created_at)}</time><ArrowUpRight size={21}/></div></div></article>)}</div>;
}
export function Pagination({page,total,path,query={}}:{page:number;total:number;path:string;query?:Record<string,string>}) {
  const last=Math.ceil(total/9); if(last<=1) return null;
  const url=(n:number)=>`${path}?${new URLSearchParams({...query,page:String(n)})}`;
  return <nav className={styles.pagination} aria-label="페이지 이동">{page>1&&<Link href={url(page-1)}>← 이전</Link>}<span>{page} / {last}</span>{page<last&&<Link href={url(page+1)}>다음 →</Link>}</nav>;
}
