import {notFound} from 'next/navigation';
import Link from '@/components/I18n';
import {Pagination} from '@/components/PostList';
import {PublicationList} from './PublicationList';
import {getI18n,localizedMetadata} from '@/lib/i18n/server';
import {getPublicationSettings,listBriefings} from '@/lib/server/publications';
import {isBriefingCategory,publicationPath} from '@/lib/publication';
import {parsePage,pageExists,pagePath} from '@/lib/pagination';
import styles from '@/components/learn/learn.module.css';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>};
async function state(props:Props){
 const {locale,absolute}=await getI18n(),{slug}=await props.params;const page=parsePage((await props.searchParams).page);if(!isBriefingCategory(slug)||page===null)notFound();
 const [settings,items]=await Promise.all([getPublicationSettings(slug),listBriefings(slug,locale)]);if(!pageExists(page,items.length))notFound();
 return {locale,absolute,slug,page,items,text:settings.value[locale] as Record<string,string>};
}
export async function briefingMetadata(props:Props){const {locale,absolute,slug,page,items,text}=await state(props);return localizedMetadata({title:text.name+(page>1?` · ${page}`:''),description:text.summary,alternates:{canonical:absolute(pagePath(`/category/${slug}`,page))},robots:{index:items.length>0,follow:true}},locale);}
export default async function BriefingPage(props:Props){
 const {locale,absolute,slug,page,items,text}=await state(props),shown=items.slice((page-1)*9,page*9),path=`/category/${slug}`;
 const schema={'@context':'https://schema.org','@type':'CollectionPage',url:absolute(pagePath(path,page)),name:text.name,description:text.summary,inLanguage:locale,mainEntity:{'@type':'ItemList',numberOfItems:shown.length,itemListElement:shown.map((d,i)=>({'@type':'ListItem',position:(page-1)*9+i+1,name:d.title,url:absolute(publicationPath(d))}))}};
 return <section className={styles.hub}><header className={styles.intro}><p className={styles.kicker}>DAILY MARKET BRIEFING</p><Link href="/">space</Link><h1>{text.name}</h1><p className={styles.lede}>{text.summary}</p><p>{text.schedule}</p></header>{items.length?<PublicationList items={shown}/>:<p>{text.empty}</p>}<Pagination page={page} total={items.length} path={path}/><section className={styles.editorial}><p>{text.notice}</p><Link href={slug==='us-market-briefing'?'/category/kr-market-briefing':'/category/us-market-briefing'}>{locale==='ko'?'다른 시장 브리핑 보기':'Explore the other market'} →</Link></section><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/></section>;
}
