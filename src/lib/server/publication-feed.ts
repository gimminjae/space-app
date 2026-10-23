import 'server-only';
import {allPublications,collectionText,getPublicationSettings} from './publications';
import {absolute,xmlEscape as esc} from '../site';
import {publicationPath,collectionPath} from '../publication';
import {localizePath,type Locale} from '../i18n/routing';
import {markdownHtml} from '../markdown-html';
export async function publicationFeed(locale:Locale,kind?:'lesson'|'etf'){
 const [all,text]=await Promise.all([allPublications(locale),kind?collectionText(kind,locale):(async()=>{const v=(await getPublicationSettings('home')).value[locale] as Record<string,string>;return {name:'space',summary:v.summary};})()]);
 const docs=all.filter(d=>kind?d.kind===kind:d.kind!=='page').sort((a,b)=>b.published_at.localeCompare(a.published_at)||a.sort_order-b.sort_order);
 const items=await Promise.all(docs.map(async doc=>{
  const url=absolute(publicationPath(doc)),sources=doc.origin==='open'&&doc.metadata.sources?.length?`\n\n## ${locale==='ko'?'참고 자료':'Sources'}\n${doc.metadata.sources.map(s=>`- ${s}`).join('\n')}`:'';
  const body=(doc.content+sources).replace(/\]\((\/[^)]+)\)/g,(_,path)=>`](${absolute(path)})`);
  return `<item><title>${esc(doc.title)}</title><link>${esc(url)}</link><guid isPermaLink="true">${esc(url)}</guid><pubDate>${new Date(doc.published_at).toUTCString()}</pubDate><category>${doc.kind}</category><description>${esc(doc.summary)}</description><content:encoded>${esc(await markdownHtml(body))}</content:encoded></item>`;
 }));
 return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${esc(text.name)}</title><link>${esc(absolute(localizePath(kind?collectionPath(kind):'/',locale)))}</link><description>${esc(text.summary)}</description><language>${locale}</language>${items.join('')}</channel></rss>`;
}
