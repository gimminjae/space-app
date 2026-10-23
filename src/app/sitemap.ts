import type {MetadataRoute} from 'next';
import {allPublications,getPublicationSettings} from '@/lib/server/publications';
import {publicationPath} from '@/lib/publication';
import {absolute} from '@/lib/site';
import {locales,localizePath} from '@/lib/i18n/routing';
import {languageAlternates} from '@/lib/i18n/server';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const [docs,home,learn,etf]=await Promise.all([allPublications(),getPublicationSettings('home'),getPublicationSettings('learn'),getPublicationSettings('etf')]);
 const latest=(kind?:string)=>docs.filter(d=>kind?d.kind===kind:d.kind!=='page').map(d=>d.updated_at).sort().at(-1)||home.updated_at;
 const pages=[{path:'/',date:[home.updated_at,latest()].sort().at(-1)!},{path:'/learn',date:[learn.updated_at,latest('lesson')].sort().at(-1)!},{path:'/category/etf',date:[etf.updated_at,latest('etf')].sort().at(-1)!},{path:'/articles',date:latest()}];
 return [...pages.flatMap(({path,date})=>locales.map(locale=>({url:absolute(localizePath(path,locale)),lastModified:date,alternates:{languages:languageAlternates(path)}}))),...docs.map(doc=>{
  const editions=docs.filter(d=>d.kind===doc.kind&&d.slug===doc.slug),languages:Record<string,string>={};for(const d of editions)languages[d.locale]=absolute(publicationPath(d));if(languages.ko)languages['x-default']=languages.ko;
  const images=[...new Set([...(doc.metadata.ogImage?[absolute(doc.metadata.ogImage)]:[]),...[...doc.content.matchAll(/!\[[^\]]*\]\((\/(?:learn|etf)-assets\/[^)]+)\)/g)].map(m=>absolute(m[1]))])];
  return {url:absolute(publicationPath(doc)),lastModified:doc.updated_at,alternates:{languages},...(images.length?{images}:{})};
 })];
}
