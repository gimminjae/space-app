import {notFound,permanentRedirect} from 'next/navigation';
import Link from '@/components/I18n';
import {Pagination} from '@/components/PostList';
import {PublicationList} from './PublicationList';
import {getI18n,localizedMetadata} from '@/lib/i18n/server';
import {getPublicationCategories,categoryPublications} from '@/lib/server/publication-categories';
import {categoryName,categoryPath,categoryText} from '@/lib/publication-categories';
import {publicationPath} from '@/lib/publication';
import {parsePage,pageExists,pagePath} from '@/lib/pagination';
import styles from '@/components/learn/learn.module.css';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>};
async function state(props:Props){
 const {locale,absolute,l}=await getI18n(),{slug}=await props.params;
 const page=parsePage((await props.searchParams).page),categories=await getPublicationCategories(),category=categories.find(c=>c.slug===slug);
 if(!category||page===null)notFound();
 const path=categoryPath(category);if(path!==`/category/${slug}`)permanentRedirect(l(pagePath(path,page)));
 const items=await categoryPublications(category,locale);if(!pageExists(page,items.length))notFound();
 return {locale,absolute,slug,page,items,category,categories,text:categoryText(category,locale)};
}
export async function briefingMetadata(props:Props){const {locale,absolute,slug,page,items,text}=await state(props);return localizedMetadata({title:text.title+(page>1?` · ${page}`:''),description:text.summary,alternates:{canonical:absolute(pagePath(`/category/${slug}`,page))},robots:{index:items.length>0,follow:true}},locale);}
export default async function BriefingPage(props:Props){
 const {locale,absolute,slug,page,items,category,categories,text}=await state(props),shown=items.slice((page-1)*9,page*9),path=`/category/${slug}`;
 const related=categories.filter(c=>c.slug!==slug&&c.show_in_header);
 const schema={'@context':'https://schema.org','@type':'CollectionPage',url:absolute(pagePath(path,page)),name:categoryName(category,locale),description:text.summary,inLanguage:locale,mainEntity:{'@type':'ItemList',numberOfItems:shown.length,itemListElement:shown.map((d,i)=>({'@type':'ListItem',position:(page-1)*9+i+1,name:d.title,url:absolute(publicationPath(d))}))}};
 return <section className={styles.hub}><header className={styles.intro}><p className={styles.kicker}>{category.requires_session_date?'DAILY MARKET BRIEFING':'THE JOURNAL'}</p><Link href="/">space</Link><h1>{categoryName(category,locale)}</h1><p className={styles.lede}>{text.summary}</p>{text.schedule&&<p>{text.schedule}</p>}</header>{items.length?<PublicationList items={shown}/>:<p>{text.empty||(locale==='ko'?'아직 발행된 글이 없습니다.':'No articles have been published yet.')}</p>}<Pagination page={page} total={items.length} path={path}/><section className={styles.editorial}>{text.notice&&<p>{text.notice}</p>}<nav aria-label={locale==='ko'?'다른 카테고리':'More categories'} style={{display:'flex',flexWrap:'wrap',gap:'1rem'}}>{related.map(c=><Link key={c.slug} href={categoryPath(c)}>{categoryName(c,locale)} →</Link>)}</nav></section><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/></section>;
}
