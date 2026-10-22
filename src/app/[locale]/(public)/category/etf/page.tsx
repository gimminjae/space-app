import Link from '@/components/I18n';
import { EtfList } from '@/components/etf/EtfList';
import styles from '@/components/learn/learn.module.css';
import { etfArticles, etfText, etfPath, etfUpdatedAt } from '@/lib/etf';
import { getI18n, localizedMetadata } from '@/lib/i18n/server';
export async function generateMetadata() {
  const {locale,absolute}=await getI18n(), text=etfText[locale];
  return localizedMetadata({title:text.title,description:text.summary,alternates:{canonical:absolute('/category/etf')},openGraph:{type:'website',title:text.name,description:text.summary,url:absolute('/category/etf'),images:[{url:absolute(`/etf-assets/series.${locale}.og.png`),width:1200,height:630,alt:text.name}]},twitter:{card:'summary_large_image',images:[absolute(`/etf-assets/series.${locale}.og.png`)]}},locale);
}
export default async function EtfCategory() {
  const {locale,absolute,date}=await getI18n(),text=etfText[locale];
  const data={'@context':'https://schema.org','@graph':[
    {'@type':'CollectionPage',url:absolute('/category/etf'),name:text.title,description:text.summary,inLanguage:locale,mainEntity:{'@id':absolute('/category/etf#articles')}},
    {'@type':'CreativeWorkSeries','@id':absolute('/category/etf#series'),name:text.name,url:absolute('/category/etf'),inLanguage:locale},
    {'@type':'ItemList','@id':absolute('/category/etf#articles'),numberOfItems:etfArticles.length,itemListElement:etfArticles.map(a=>({'@type':'ListItem',position:a.order,name:a[locale].title,url:absolute(etfPath(a.slug))}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'space',item:absolute('/')},{'@type':'ListItem',position:2,name:'ETF',item:absolute('/category/etf')}]}
  ]};
  return <div className={styles.hub}><header className={styles.intro}><p className={styles.kicker}>DIVIDENDS · OPTIONS · TOTAL RETURN</p><Link href="/">space</Link> / ETF<h1>{text.name}</h1><p className={styles.lede}>{text.introduction}</p><div className={styles.introActions}><Link className="button" href={etfPath(etfArticles[0].slug)}>{locale==='ko'?'첫 글 읽기':'Start reading'} →</Link><span>{locale==='ko'?'17편 · 한국어와 영어 · 편당 약 5–10분':'17 articles · Korean and English · About 5–10 minutes each'}</span></div></header><section aria-labelledby="etf-contents"><h2 id="etf-contents" className={styles.contentsHeading}>{text.contents}</h2><EtfList locale={locale}/></section><section className={styles.editorial}><h2>{locale==='ko'?'자료를 읽는 기준':'How to read the figures'}</h2><p>{locale==='ko'?'운용사 상품 페이지와 공시를 확인해 상품명·비용·전략을 정리했습니다. 수치의 기준일은 항목 옆에 적었으며, 자료 확인일과 가격 기준일은 다를 수 있습니다. 표와 그림의 가상 예시는 실제 ETF의 과거 실적이나 미래 예측이 아닙니다.':'Fund names, costs and strategies were checked against issuer pages and disclosures. Each dated observation belongs to its stated reporting date, which can differ from our review date. Hypothetical tables and diagrams are neither historical fund performance nor forecasts.'}</p><p>{text.notice}</p><p>{locale==='ko'?'자료 확인':'Reviewed'} {date(etfUpdatedAt)} · <a href={locale==='ko'?'/etf/feed.xml':'/en/etf/feed.xml'}>ETF RSS</a> · <Link href="/learn/inside-an-etf">{locale==='ko'?'ETF가 처음이라면':'New to ETFs?'}</Link></p></section><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}}/></div>;
}
