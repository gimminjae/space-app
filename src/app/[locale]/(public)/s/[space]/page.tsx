import { parsePage,pageExists,pagePath } from '@/lib/pagination';
import Link from '@/components/I18n';
import member from '@/components/member.module.css';
import { Pagination,PostList } from '@/components/PostList';
import styles from '@/components/site.module.css';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { getCategories,publicPostPage } from '@/lib/server/posts';
import { getSpace } from '@/lib/server/spaces';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
type Props={params:Promise<{space:string}>;searchParams:Promise<{category?:string;tag?:string;page?:string}>};
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
 const {t,locale,absolute}=await getI18n();const space=await getSpace((await params).space);if(!space)notFound();
 const q=await searchParams,page=parsePage(q.page);if(page===null)notFound();
 const result=await publicPostPage(page,q.category,q.tag,space.id);if(!pageExists(page,result.total))notFound();
 const title=space.name+(page>1?(locale==='ko'?` · ${page}페이지`:` · Page ${page}`):'');
 const description=space.description||t("생각을 기록하고, 새로운 시선을 나누는 공간입니다.");
 return localizedMetadata({title,description,alternates:{canonical:absolute(pagePath(`/s/${space.slug}`,page,{...(q.category?{category:q.category}:{}),...(q.tag?{tag:q.tag}:{})}))},robots:q.category||q.tag||!result.total?{index:false,follow:true}:undefined},locale);
}
export default async function SpaceHome({params,searchParams}:Props){const {t,number,category}=await getI18n();const space=await getSpace((await params).space);if(!space)notFound();const q=await searchParams,page=parsePage(q.page),base=`/s/${space.slug}`;if(page===null)notFound();const [categories,result]=await Promise.all([getCategories(space.id),publicPostPage(page,q.category,q.tag,space.id)]);if(!pageExists(page,result.total))notFound();return <><section className={`${member.hero} ${member[space.accent]}`}><p className="eyebrow">A SPACE OF ONE’S OWN</p><h1>{space.name}</h1><p>{space.description||t("생각을 기록하고, 새로운 시선을 나누는 공간입니다.")}</p><span>space / {space.slug}</span></section><section className={styles.articles}><div className={styles.sectionHead}><h2>{q.tag?`#${q.tag}`:t("이 공간의 이야기")}</h2><span className={styles.count}>{t("{count}개의 글",{count:number(result.total)})}</span></div><nav className={styles.categoryNav} aria-label={t("이 공간의 카테고리")}><Link href={base} className={!q.category?styles.active:''}>{t("전체")}</Link>{categories.map(c=><Link href={`${base}?category=${c.slug}`} className={q.category===c.slug?styles.active:''} key={c.id}>{category(c).name}</Link>)}</nav><PostList posts={result.posts}/><Pagination page={page} total={result.total} path={base} query={{...(q.category?{category:q.category}:{}),...(q.tag?{tag:q.tag}:{})}}/></section></>;}
