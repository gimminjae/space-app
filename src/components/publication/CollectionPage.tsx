import Link from '@/components/I18n';
import {getI18n,localizedMetadata} from '@/lib/i18n/server';
import {publicationPath,collectionPath} from '@/lib/publication';
import {listPublications,collectionText} from '@/lib/server/publications';
import {PublicationList} from './PublicationList';
import styles from '@/components/learn/learn.module.css';

export async function collectionMetadata(kind:'lesson'|'etf'){
 const {locale,absolute}=await getI18n();const text=await collectionText(kind,locale);const image=absolute(`/${kind==='lesson'?'learn':'etf'}-assets/series.${locale}.og.png`);
 return localizedMetadata({title:text.title,description:text.summary,alternates:{canonical:absolute(collectionPath(kind))},openGraph:{type:'website',title:text.name,description:text.summary,images:[{url:image,width:1200,height:630,alt:text.name}]},twitter:{card:'summary_large_image',images:[image]}},locale);
}
export default async function CollectionPage({kind}:{kind:'lesson'|'etf'}){
 const {locale,absolute,date}=await getI18n();const [items,text]=await Promise.all([listPublications(kind,locale),collectionText(kind,locale)]);
 const path=collectionPath(kind),updated=items.map(i=>i.updated_at).sort().at(-1);
 const graph={'@context':'https://schema.org','@graph':[
  {'@type':'CollectionPage',url:absolute(path),name:text.title,description:text.summary,inLanguage:locale,mainEntity:{'@id':absolute(`${path}#articles`)}},
  {'@type':'CreativeWorkSeries','@id':absolute(`${path}#series`),name:text.name,url:absolute(path),inLanguage:locale},
  {'@type':'ItemList','@id':absolute(`${path}#articles`),numberOfItems:items.length,itemListElement:items.map((doc,i)=>({'@type':'ListItem',position:i+1,name:doc.title,url:absolute(publicationPath(doc))}))}
 ]};
 return <div className={styles.hub}><header className={styles.intro}><p className={styles.kicker}>{kind==='etf'?'DIVIDENDS · OPTIONS · TOTAL RETURN':'ECONOMICS · MONEY · INVESTING'}</p><Link href="/">space</Link> / {text.label}<h1>{text.name}</h1><p className={styles.lede}>{text.introduction}</p><div className={styles.introActions}>{items[0]&&<Link className="button" href={publicationPath(items[0])}>{text.start||(locale==='ko'?'첫 글 읽기':'Start reading')} →</Link>}<span>{items.length}{locale==='ko'?'편':' articles'}</span></div></header><section aria-labelledby="collection-contents"><h2 id="collection-contents" className={styles.contentsHeading}>{text.contents}</h2><PublicationList items={items}/></section><section className={styles.editorial}>{text.sources&&<h2>{text.sources}</h2>}{text.editorial&&<p>{text.editorial}</p>}<p>{text.notice}</p>{updated&&<p>{locale==='ko'?'최종 수정':'Updated'} {date(updated)} · <Link href="/about">{locale==='ko'?'space 소개':'About space'}</Link></p>}</section><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(graph).replace(/</g,'\\u003c')}}/></div>;
}
