import Link from '@/components/I18n';
import {notFound} from 'next/navigation';
import {topics,readerPosts,readerState} from '@/lib/server/economy';
import {getI18n,localizedMetadata} from '@/lib/i18n/server';
import {PostList} from '@/components/PostList';
import ReaderAction from '@/components/economy/ReaderAction';
import styles from '@/components/economy/economy.module.css';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{cursor?:string}>};
export async function generateMetadata({params}:Props){const {locale,absolute}=await getI18n();const slug=(await params).slug,t=topics.find(t=>t.slug===slug);if(!t)return {robots:{index:false}};return localizedMetadata({title:t[locale].name,description:t[locale].summary,alternates:{canonical:absolute('/topics/'+slug)}},locale);}
export default async function Page({params,searchParams}:Props){const {locale,t}=await getI18n(),slug=(await params).slug,topic=topics.find(t=>t.slug===slug);if(!topic)notFound();const [posts,state]=await Promise.all([readerPosts('topic',slug,(await searchParams).cursor),readerState()]);return <div className={styles.page}><div className={styles.head}><div><Link href="/topics">← {locale==='ko'?'관심 주제':'Topics'}</Link><h1>{topic[locale].name}</h1><p>{topic[locale].summary}</p></div><ReaderAction kind="topic" id={slug} signedIn={!!state} active={state?.topics.includes(slug)}/></div><PostList posts={posts.items}/>{posts.nextCursor&&<div className={styles.loadMore}><Link className={styles.button} href={'/topics/'+slug+'?cursor='+encodeURIComponent(posts.nextCursor)}>{locale==='ko'?'다음 글':'More articles'} →</Link></div>}</div>;}
