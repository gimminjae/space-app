import Link from '@/components/I18n';
import { getI18n } from '@/lib/i18n/server';
import { postPath,readingMinutes } from '@/lib/site';
import type { Post } from '@/lib/types';
import { ArrowUpRight,BookOpen } from 'lucide-react';
import styles from './site.module.css';
export async function PostList({posts}:{posts:Post[]}) {const {t,date,category}=await getI18n();
  if(!posts.length) return <div className={styles.empty}><BookOpen size={26}/><h3>{t("새로운 이야기를 준비하고 있습니다.")}</h3><p>{t("경제를 이해하는 데 도움이 되는 글을 이곳에 차곡차곡 담겠습니다.")}</p></div>;
  return <div className={styles.postList}>{posts.map((post,i)=><article className={styles.postCard} key={post.id}><Link href={postPath(post)} tabIndex={-1} aria-hidden="true" className={`${styles.cover} ${styles[`tone${i%3}`]}`}>{post.cover_asset_id?<img src={`/media/${post.cover_asset_id}`} alt="" loading="lazy"/>:<><span>SPACE<br/>JOURNAL</span><span className={styles.coverOrb}/><small>{(post.category?category(post.category).name:undefined)||'ECONOMY'}</small></>}</Link><div className={styles.postInfo}><div className={styles.eyebrow}>{(post.category?category(post.category).name:undefined)||t("경제")} <span>·</span> {t("{count}분 읽기",{count:readingMinutes(post.content)})}</div><h3><Link href={postPath(post)}>{post.title}</Link></h3><p>{post.summary}</p><div className={styles.postBottom}>{post.space&&<Link href={`/s/${post.space.slug}`}>{post.space.name}</Link>}<time dateTime={post.published_at||post.created_at}>{date(post.published_at||post.created_at)}</time><ArrowUpRight size={21}/></div></div></article>)}</div>;
}
export async function Pagination({page,total,path,query={}}:{page:number;total:number;path:string;query?:Record<string,string>}) {const {t,number}=await getI18n();
  const last=Math.ceil(total/9); if(last<=1) return null;
  const url=(n:number)=>`${path}?${new URLSearchParams({...query,page:String(n)})}`;
  return <nav className={styles.pagination} aria-label={t("페이지 이동")}>{page>1&&<Link href={url(page-1)}>{t("← 이전")}</Link>}<span>{number(page)} / {number(last)}</span>{page<last&&<Link href={url(page+1)}>{t("다음 →")}</Link>}</nav>;
}
