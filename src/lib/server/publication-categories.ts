import 'server-only';
import {cache} from 'react';
import {db,dbError} from './db';
import {categoryForDocument,type PublicationCategory} from '../publication-categories';
import {allPublications} from './publications';
import type {Locale} from '../i18n/routing';
export const getPublicationCategories=cache(async():Promise<PublicationCategory[]>=>{
 const rows:PublicationCategory[]=[];
 for(let offset=0;;offset+=500){
  const {data,error}=await db().from('space_publication_categories').select('*').order('sort_order').order('slug').range(offset,offset+499);dbError(error);
  rows.push(...(data||[]) as PublicationCategory[]);if(!data||data.length<500)break;
 }
 return rows;
});
export async function categoryPublications(category:PublicationCategory,locale:Locale){
 const [docs,categories]=await Promise.all([allPublications(locale),getPublicationCategories()]);
 return docs.filter(doc=>categoryForDocument(doc,categories)?.slug===category.slug).sort((a,b)=>category.kind==='article'?String(b.metadata.sessionDate||b.published_at).localeCompare(String(a.metadata.sessionDate||a.published_at)):a.sort_order-b.sort_order);
}
