import { absolute as siteAbsolute } from '@/lib/site';
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
export function localizedMetadata(value:Metadata,locale:Locale):Metadata{
 const canonical=value.alternates?.canonical;
 let alternates=value.alternates;
 if(typeof canonical==='string'){
  const url=new URL(canonical);const path=url.pathname+url.search;
  alternates={...alternates,canonical:siteAbsolute(localizePath(path,locale)),languages:languageAlternates(path)};
 }
 return {...value,alternates,...(value.openGraph?{openGraph:{...value.openGraph,locale:locale==='en'?'en_US':'ko_KR',alternateLocale:locale==='en'?'ko_KR':'en_US'}}:{})};
}
