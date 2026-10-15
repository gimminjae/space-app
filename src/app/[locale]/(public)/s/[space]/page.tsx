import ReaderAction from '@/components/economy/ReaderAction';
import {readerState} from '@/lib/server/economy';
import {mySpace} from '@/lib/server/spaces';
import Link from '@/components/I18n';
import member from '@/components/member.module.css';
import { Pagination,PostList } from '@/components/PostList';
import styles from '@/components/site.module.css';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { getCategories,listPosts } from '@/lib/server/posts';
import { getSpace } from '@/lib/server/spaces';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
type Props={params:Promise<{space:string}>;searchParams:Promise<{category?:string;tag?:string;page?:string}>};
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{const {t,locale,category,absolute}=await getI18n();const space=await getSpace((await params).space);if(!space)return localizedMetadata({title:t("공간을 찾을 수 없습니다"),robots:{index:false}},locale);const q=await searchParams;const page=Math.max(1,Math.floor(Number(q.page)||1));return localizedMetadata({title:space.name,description:space.description,alternates:{canonical:absolute(`/s/${space.slug}${page>1?`?page=${page}`:''}`)},robots:q.category||q.tag?{index:false,follow:true}:undefined,openGraph:{title:space.name,description:space.description,url:absolute(`/s/${space.slug}`)}},locale);}
export default async function SpaceHome({params,searchParams}:Props){const {t,number,category}=await getI18n();const space=await getSpace((await params).space);if(!space)notFound();const [reader,ownSpace]=await Promise.all([readerState(),mySpace()]);const q=await searchParams,page=Math.max(1,Math.min(10000,Math.floor(Number(q.page)||1))),base=`/s/${space.slug}`;const [categories,result]=await Promise.all([getCategories(space.id),listPosts({spaceId:space.id,category:q.category,tag:q.tag,page})]);return <><section className={`${member.hero} ${member[space.accent]}`}><p className="eyebrow">A SPACE OF ONE’S OWN</p><h1>{space.name}</h1><p>{space.description||t("생각을 기록하고, 새로운 시선을 나누는 공간입니다.")}</p><span>space / {space.slug}</span>{ownSpace?.id!==space.id&&<div><ReaderAction kind="space" id={space.id} signedIn={!!reader} active={reader?.spaces.some(s=>s.space_id===space.id)}/></div>}</section><section className={styles.articles}><div className={styles.sectionHead}><h2>{q.tag?`#${q.tag}`:t("이 공간의 이야기")}</h2><span className={styles.count}>{t("{count}개의 글",{count:number(result.total)})}</span></div><nav className={styles.categoryNav} aria-label={t("이 공간의 카테고리")}><Link href={base} className={!q.category?styles.active:''}>{t("전체")}</Link>{categories.map(c=><Link href={`${base}?category=${c.slug}`} className={q.category===c.slug?styles.active:''} key={c.id}>{category(c).name}</Link>)}</nav><PostList posts={result.posts}/><Pagination page={page} total={result.total} path={base} query={{...(q.category?{category:q.category}:{}),...(q.tag?{tag:q.tag}:{})}}/></section></>;}
