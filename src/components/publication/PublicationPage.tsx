import {getPublicationCategories,categoryPublications} from '@/lib/server/publication-categories';
import {categoryForDocument,categoryName,categoryPath} from '@/lib/publication-categories';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Ads from '@/components/Ads';
import Link from '@/components/I18n';
import Markdown from '@/components/Markdown';
import styles from '@/components/site.module.css';
import learnStyles from '@/components/learn/learn.module.css';
import {getI18n,localizedMetadata} from '@/lib/i18n/server';
import {localizePath} from '@/lib/i18n/routing';
import {absolute,slugify} from '@/lib/site';
import {publicationPath,publicationReadingMinutes,type PublicationKind} from '@/lib/publication';
import {getPublication,listPublications,collectionText} from '@/lib/server/publications';

export async function publicationMetadata(kind:PublicationKind,slug:string):Promise<Metadata>{
 const {locale}=await getI18n();const doc=await getPublication(kind,slug,locale);if(!doc)notFound();
 const other=await getPublication(kind,slug,locale==='ko'?'en':'ko');
 const url=absolute(publicationPath(doc)),image=absolute(doc.metadata.ogImage||'/og.png');
 const metadata=localizedMetadata({title:doc.seo_title||doc.title,description:doc.summary,authors:[{name:doc.author}],
  alternates:{canonical:url},openGraph:{type:kind==='page'?'website':'article',title:doc.title,description:doc.summary,url,siteName:'space',publishedTime:doc.published_at,modifiedTime:doc.updated_at,images:[{url:image,width:1200,height:630,alt:doc.title}]},
  twitter:{card:'summary_large_image',title:doc.title,description:doc.summary,images:[image]}},locale);
 if(!other){metadata.alternates={canonical:url};if(metadata.openGraph)metadata.openGraph.alternateLocale=undefined;}
 return metadata;
}
export default async function PublicationPage({kind,slug}:{kind:PublicationKind;slug:string}){
 const {locale,date,t}=await getI18n();const doc=await getPublication(kind,slug,locale);if(!doc)notFound();
 const category=categoryForDocument(doc,await getPublicationCategories());
 const isSeries=kind==='lesson'||kind==='etf';
 const [siblings,other,text]=await Promise.all([category?categoryPublications(category,locale):listPublications(kind,locale),getPublication(kind,slug,locale==='ko'?'en':'ko'),isSeries?collectionText(kind,locale):Promise.resolve(null)]);
 const index=siblings.findIndex(item=>item.id===doc.id),previous=siblings[index-1],next=siblings[index+1];
 const path=category?categoryPath(category):'/articles',label=category?categoryName(category,locale):text?.label||(locale==='ko'?'아티클':'Articles');
 const url=absolute(publicationPath(doc));
 const headings=[...doc.content.matchAll(/^#{1,2}\s+(.+)$/gm)].map((match,index)=>{const title=match[1].replace(/[*_`]/g,'');return{text:title,id:doc.metadata.anchors?.[title]||`${slugify(title)}-${index}`};});
 const structured={'@context':'https://schema.org','@graph':[
  {'@type':kind==='page'?(slug==='about'?'AboutPage':'WebPage'):'Article','@id':`${url}#article`,url,mainEntityOfPage:url,headline:doc.title,description:doc.summary,inLanguage:locale,...(category?{articleSection:categoryName(category,locale)}:{}),...(category?.requires_session_date?{temporalCoverage:doc.metadata.sessionDate}:{}),datePublished:doc.published_at,dateModified:doc.updated_at,
   author:{'@type':doc.origin==='editorial'?'Organization':'Person',name:doc.author,...(doc.origin==='editorial'?{url:absolute('/about')}:{})},publisher:{'@type':'Organization',name:'space',url:absolute('/')},image:[absolute(doc.metadata.ogImage||'/og.png')],keywords:doc.tags.join(', '),...(isSeries?{isPartOf:{'@type':'CreativeWorkSeries','@id':absolute(`${localizePath(path,locale)}#series`),name:text?.name,url:absolute(localizePath(path,locale))}}:{})},
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'space',item:absolute(localizePath('/',locale))},...(kind==='page'?[]:[{'@type':'ListItem',position:2,name:label,item:absolute(localizePath(path,locale))}]),{'@type':'ListItem',position:kind==='page'?2:3,name:doc.title,item:url}]}
 ]};
 if(kind==='page')return <section className={styles.about}><p className={styles.eyebrow}>{slug==='about'?'ABOUT SPACE':'PRIVACY'}</p><h1>{doc.title}</h1><Markdown content={doc.content} anchors={doc.metadata.anchors}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/></section>;
 return <article className={styles.article}>
  <header className={styles.articleHeader}>
   <nav aria-label={locale==='ko'?'현재 위치':'Breadcrumb'} className={styles.breadcrumb}><Link href="/">space</Link><span>/</span><Link href={path}>{label}</Link><span>/</span><span>{isSeries?doc.sort_order:doc.title}</span></nav>
   <p className={learnStyles.kicker}>{text?.name||label}{isSeries?` · ${String(doc.sort_order).padStart(2,'0')} / ${siblings.length}`:''}</p>
   {typeof doc.metadata.sessionDate==='string'&&<p className={learnStyles.meta}>{locale==='ko'?'거래일':'Trading session'}: {String(doc.metadata.sessionDate)}{doc.metadata.dataAsOf?` · ${locale==='ko'?'자료 기준':'Data as of'}: ${String(doc.metadata.dataAsOf)}`:''}</p>}
   <h1>{doc.title}</h1><p className={styles.articleSummary}>{doc.summary}</p>
   <div className={styles.articleMeta}><span>{doc.author}</span><time dateTime={doc.published_at}>{date(doc.published_at)}</time><span>{publicationReadingMinutes(doc)}{locale==='ko'?'분 읽기':' min read'}</span></div>
   {doc.origin==='open'&&<p className={learnStyles.meta}>{locale==='ko'?'공개 작성 글 · 발행 전 운영자 검토를 거치지 않은 제출 글입니다.':'Open submission · Published without prior editorial review.'}</p>}
   <div className={learnStyles.language}><Link href={path}>{text?.contents||(locale==='ko'?'전체 글':'All articles')}</Link>{other&&<a href={publicationPath(other)} hrefLang={other.locale} lang={other.locale}>{other.locale==='en'?'Read in English':'한국어로 읽기'}</a>}</div>
  </header>
  <div className={styles.articleBody}>
   {headings.length>0&&<nav aria-label={t('이 글의 순서')} className={styles.toc}><strong>{t('이 글의 순서')}</strong>{headings.map(h=><a href={`#${h.id}`} key={h.id}>{h.text}</a>)}</nav>}
   <div className={styles.articleContent}><Markdown content={doc.content} userGenerated={doc.origin==='open'} anchors={doc.metadata.anchors}/>{doc.origin==='open'&&!!doc.metadata.sources?.length&&<section className="prose"><h2>{locale==='ko'?'참고 자료':'Sources'}</h2><ul>{doc.metadata.sources.map(source=><li key={source}><a href={source} rel="ugc nofollow noopener noreferrer">{source}</a></li>)}</ul></section>}
    <p><a href={kind==='etf'?`/etf-files/${locale}/${doc.slug}.md`:`/publication-files/${kind}/${locale}/${doc.slug}.md`} download>{locale==='ko'?'Markdown 파일 받기':'Download Markdown'}</a></p>
    <div className={learnStyles.articleTags}>{doc.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
    <nav className={learnStyles.navigation} aria-label={locale==='ko'?'이어서 읽기':'Continue reading'}>{previous&&<Link href={publicationPath(previous)}><span>{text?.previous||(locale==='ko'?'이전 글':'Previous')}</span>{previous.title}</Link>}{next&&<Link href={publicationPath(next)}><span>{text?.next||(locale==='ko'?'다음 글':'Next')}</span>{next.title}</Link>}<Link href={path} className={learnStyles.fullWidth}>{text?.contents||(locale==='ko'?'전체 글':'All articles')}</Link></nav>
    <footer className={learnStyles.editorial}><strong><Link href="/about">space</Link></strong>{text?.notice&&<p>{text.notice}</p>}<p>{t('최종 수정')} <time dateTime={doc.updated_at}>{date(doc.updated_at)}</time> · <a href={kind==='etf'?`${locale==='en'?'/en':''}/etf/feed.xml`:kind==='lesson'?`${locale==='en'?'/en':''}/learn/feed.xml`:'/feed.xml'}>RSS</a></p></footer><Ads/>
   </div>
  </div><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/>
 </article>;
}
