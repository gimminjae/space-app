import { absolute as siteAbsolute, site } from '@/lib/site';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { cache } from 'react';
import 'server-only';
import { i18n } from './index';
import { localizePath,type Locale } from './routing';
export const getI18n=cache(async()=>{
 const locale:Locale=(await headers()).get('x-space-locale')==='en'?'en':'ko';
 return {...i18n(locale),absolute:(path='/')=>siteAbsolute(localizePath(path,locale))};
});
export function languageAlternates(path:string){return {ko:siteAbsolute(localizePath(path,'ko')),en:siteAbsolute(localizePath(path,'en')),'x-default':siteAbsolute(localizePath(path,'ko'))};}
export function localizedMetadata(value:Metadata,locale:Locale,{translated=true}:{translated?:boolean}={}):Metadata{
 const canonical=value.alternates?.canonical;
 let alternates=value.alternates;
 if(typeof canonical==='string'){
  const url=new URL(canonical);const path=url.pathname+url.search;
  alternates={...alternates,canonical:siteAbsolute(localizePath(path,translated?locale:'ko')),languages:translated?languageAlternates(path):undefined};
 }
 const {t}=i18n(locale);
 const title=typeof value.title==='string'?value.title:t(site.title);
 const description=value.description||t(site.description);
 const openGraph=canonical||value.openGraph?{
  type:'website' as const,siteName:'space',title,description,images:[siteAbsolute('/og.png')],
  ...value.openGraph,url:typeof alternates?.canonical==='string'?alternates.canonical:value.openGraph?.url,
  locale:locale==='en'?'en_US':'ko_KR',alternateLocale:translated?(locale==='en'?'ko_KR':'en_US'):undefined,
 }:undefined;
 return {...value,alternates,...(openGraph?{openGraph,twitter:{card:'summary_large_image',title,description,images:[siteAbsolute('/og.png')],...value.twitter}}:{})};
}
