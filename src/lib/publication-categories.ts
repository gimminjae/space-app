import type {Locale} from './i18n/routing';
import type {Publication, PublicationKind} from './publication';
export type PublicationCategory = {
 slug:string; kind:Exclude<PublicationKind,'page'>; name_ko:string; name_en:string;
 description_ko:string; description_en:string; seo_title_ko:string; seo_title_en:string;
 sort_order:number; show_in_header:boolean; show_in_footer:boolean; accepts_submissions:boolean;
 is_default:boolean; requires_session_date:boolean; content:Partial<Record<Locale,Record<string,string>>>; updated_at:string;
};
export const categoryName=(category:PublicationCategory,locale:Locale)=>category[`name_${locale}`];
export function categoryPath(category:PublicationCategory){return category.is_default&&category.kind==='lesson'?'/learn':`/category/${category.slug}`;}
export function categoryForDocument(doc:Pick<Publication,'kind'|'metadata'|'category_slug'>,categories:PublicationCategory[]){
 return categories.find(c=>c.slug===(doc.category_slug||doc.metadata.category))||categories.find(c=>c.is_default&&c.kind===doc.kind);
}
export function categoryText(category:PublicationCategory,locale:Locale):Record<string,string>{
 const copy=category.content[locale]||{};
 return {...copy,name:copy.name||categoryName(category,locale),label:categoryName(category,locale),title:category[`seo_title_${locale}`]||categoryName(category,locale),summary:category[`description_${locale}`]};
}
export function categorySubmissionError(input:{kind:string;category?:string;slug?:string;sessionDate?:string;dataAsOf?:string},category:PublicationCategory|undefined){
 if(!category||!category.accepts_submissions||category.kind!==input.kind)return 'This category is unavailable for this collection.';
 if(category.requires_session_date){
  if(!input.sessionDate)return 'A market briefing requires a trading session date.';
  if(input.slug&&input.slug!==`${category.slug}-${input.sessionDate}`)return 'Briefing slugs must match the category and trading date.';
 }else if(input.sessionDate||input.dataAsOf)return 'Trading metadata requires a market briefing category.';
 return null;
}
