import 'server-only';
import {cache} from 'react';
import {db,dbError} from './db';
import type {Locale} from '../i18n/routing';
import type {Publication,PublicationKind,CollectionText} from '../publication';

// React cache only deduplicates reads within a request. Database fetches are
// no-store, so publishing never requires a build or a long-lived cache purge.
export const allPublications=cache(async(locale?:Locale):Promise<Publication[]>=>{
 const items:Publication[]=[];
 for(let offset=0;;offset+=500){
  let query=db().from('space_publication_documents').select('*').eq('status','published').lte('published_at',new Date().toISOString()).order('sort_order').order('id').range(offset,offset+499);
  if(locale)query=query.eq('locale',locale);
  const {data,error}=await query;dbError(error);
  items.push(...(data||[]) as Publication[]);if(!data||data.length<500)break;
 }
 return items;
});
export const getPublication=cache(async(kind:PublicationKind,slug:string,locale:Locale):Promise<Publication|null>=>{
 const {data,error}=await db().from('space_publication_documents').select('*').eq('kind',kind).eq('slug',slug).eq('locale',locale).eq('status','published').lte('published_at',new Date().toISOString()).maybeSingle();dbError(error);return data as Publication|null;
});
export async function listPublications(kind:PublicationKind,locale:Locale){return(await allPublications(locale)).filter(doc=>doc.kind===kind);}
export const getPublicationSettings=cache(async(key:string):Promise<{value:Record<string,unknown>;updated_at:string}>=>{
 const {data,error}=await db().from('space_publication_settings').select('value,updated_at').eq('key',key).single();dbError(error);if(!data)throw new Error('Publication settings are unavailable.');return data;
});
export async function collectionText(kind:'lesson'|'etf',locale:Locale):Promise<CollectionText>{
 const settings=await getPublicationSettings(kind==='lesson'?'learn':'etf');
 const value=settings.value[locale];if(!value||typeof value!=='object')throw new Error('Publication language settings are unavailable.');return value as CollectionText;
}
export async function searchPublications(query:string,locale:Locale){
 const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 return(await allPublications(locale)).filter(doc=>doc.kind!=='page'&&terms.every(term=>`${doc.title} ${doc.summary} ${doc.tags.join(' ')} ${doc.content}`.toLocaleLowerCase().includes(term)));
}

export async function listBriefings(category:string,locale:Locale){return(await listPublications('article',locale)).filter(d=>d.metadata.category===category).sort((a,b)=>String(b.metadata.sessionDate||b.published_at).localeCompare(String(a.metadata.sessionDate||a.published_at)));}
