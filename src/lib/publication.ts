import { z } from 'zod';
import { localizePath, type Locale } from './i18n/routing';
import { excerpt } from './site';

export type PublicationKind = 'lesson' | 'etf' | 'article' | 'page';
export type Publication = {
  category_slug?: string | null; id: string; kind: PublicationKind; slug: string; locale: Locale; title: string;
  seo_title: string; summary: string; content: string; author: string; tags: string[];
  sort_order: number; origin: 'editorial' | 'open'; status: 'draft' | 'published';
  published_at: string; updated_at: string; created_at: string;
  metadata: { ogImage?: string; readingMinutes?: number | number[]; sources?: string[]; anchors?: Record<string,string>; [key:string]:unknown };
};
export const briefingCategories=['us-market-briefing','kr-market-briefing'] as const;
export type BriefingCategory=typeof briefingCategories[number];
export function isBriefingCategory(value:unknown):value is BriefingCategory{return typeof value==='string'&&briefingCategories.includes(value as BriefingCategory);}
export type CollectionText = Record<string,string>;
export function publicationPath(doc: Pick<Publication,'kind'|'slug'|'locale'>) {
  const prefix = {lesson:'/learn',etf:'/etf',article:'/articles',page:''}[doc.kind];
  return localizePath(`${prefix}/${encodeURIComponent(doc.slug)}`, doc.locale);
}
export function collectionPath(kind: PublicationKind) { return kind==='lesson'?'/learn':kind==='etf'?'/category/etf':'/articles'; }
export function publicationReadingMinutes(doc: Pick<Publication,'content'|'locale'|'metadata'>) {
  const stated=doc.metadata.readingMinutes;
  if(Array.isArray(stated))return stated.join('–');
  if(typeof stated==='number'&&stated>0)return String(stated);
  return String(Math.max(1,Math.ceil(doc.locale==='ko'?doc.content.length/550:doc.content.trim().split(/\s+/).length/180)));
}
function validCover(value:string){
  if(!value)return true;
  if(/^\/(?:etf|learn|briefing)-assets\/[a-z0-9][a-z0-9.-]*\.(?:png|svg|jpg|webp)$/i.test(value)&&!value.includes('..'))return true;
  try{const url=new URL(value);return url.protocol==='https:'&&!!url.hostname&&!url.username&&!url.password;}catch{return false;}
}
const editionSchema=z.object({
  locale:z.enum(['ko','en']),title:z.string().trim().min(2).max(150),
  content:z.string().trim().min(80).max(200000),summary:z.string().trim().max(500).default(''),
  seoTitle:z.string().trim().max(200).default(''),author:z.string().trim().min(1).max(80).default('Contributor'),
  tags:z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  sources:z.array(z.url().refine(value=>value.startsWith('https://'),'Use HTTPS source URLs.')).max(20).default([]),
  coverImage:z.string().max(2000).refine(validCover,'Use a valid HTTPS image URL or an existing illustration path.').default(''),
}).strict();
export const publicationSubmissionSchema=z.object({
  kind:z.enum(['article','etf','lesson']).default('article'),
  slug:z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Use lowercase English letters, numbers and hyphens.').optional(),
  idempotencyKey:z.uuid().optional(),
  category:z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  sessionDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{const date=new Date(`${value}T00:00:00Z`);return !isNaN(date.getTime())&&date.toISOString().startsWith(value);},'Use a valid trading date.').optional(),
  dataAsOf:z.iso.datetime({offset:true}).optional(),
  editions:z.array(editionSchema).min(1).max(2),
}).strict().superRefine((value,ctx)=>{
  if(!value.category&&(value.sessionDate||value.dataAsOf))ctx.addIssue({code:'custom',path:['category'],message:'Trading metadata requires a category.'});
  if(new Set(value.editions.map(e=>e.locale)).size!==value.editions.length)ctx.addIssue({code:'custom',path:['editions'],message:'Only one edition per language is allowed.'});
});
export function submissionEntries(input:z.infer<typeof publicationSubmissionSchema>,slug:string) {
  return input.editions.map(edition=>{
    const content=edition.content.replace(new RegExp(`^# [^\\n]+\\n+`),'').trim();
    return {kind:input.kind,slug,locale:edition.locale,title:edition.title,seo_title:edition.seoTitle||edition.title,
      summary:edition.summary||excerpt(content),content,author:edition.author,tags:edition.tags,
      metadata:{sources:edition.sources,...(input.category?{category:input.category}:{}),...(input.sessionDate?{sessionDate:input.sessionDate}:{}),...(input.dataAsOf?{dataAsOf:input.dataAsOf}:{}),...(edition.coverImage?{ogImage:edition.coverImage}:{})}};
  });
}
