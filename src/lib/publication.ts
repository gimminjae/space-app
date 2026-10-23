import { z } from 'zod';
import { localizePath, type Locale } from './i18n/routing';
import { excerpt } from './site';

export type PublicationKind = 'lesson' | 'etf' | 'article' | 'page';
export type Publication = {
  id: string; kind: PublicationKind; slug: string; locale: Locale; title: string;
  seo_title: string; summary: string; content: string; author: string; tags: string[];
  sort_order: number; origin: 'editorial' | 'open'; status: 'draft' | 'published';
  published_at: string; updated_at: string; created_at: string;
  metadata: { ogImage?: string; readingMinutes?: number | number[]; sources?: string[]; anchors?: Record<string,string>; [key:string]:unknown };
};
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
const editionSchema=z.object({
  locale:z.enum(['ko','en']),title:z.string().trim().min(2).max(150),
  content:z.string().trim().min(80).max(200000),summary:z.string().trim().max(500).default(''),
  seoTitle:z.string().trim().max(200).default(''),author:z.string().trim().min(1).max(80).default('Contributor'),
  tags:z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  sources:z.array(z.url().refine(value=>value.startsWith('https://'),'Use HTTPS source URLs.')).max(20).default([]),
  coverImage:z.string().max(2000).refine(value=>!value||/^https:\/\//.test(value)||/^\/(?:etf-assets|learn-assets|publication-assets)\/[a-z0-9./_-]+$/i.test(value),'Use an HTTPS image URL.').default(''),
}).strict();
export const publicationSubmissionSchema=z.object({
  kind:z.enum(['article','etf','lesson']).default('article'),
  slug:z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Use lowercase English letters, numbers and hyphens.').optional(),
  idempotencyKey:z.uuid().optional(),
  editions:z.array(editionSchema).min(1).max(2),
}).strict().superRefine((value,ctx)=>{
  if(new Set(value.editions.map(e=>e.locale)).size!==value.editions.length)ctx.addIssue({code:'custom',path:['editions'],message:'Only one edition per language is allowed.'});
});
export function submissionEntries(input:z.infer<typeof publicationSubmissionSchema>,slug:string) {
  return input.editions.map(edition=>{
    const content=edition.content.replace(new RegExp(`^# [^\\n]+\\n+`),'').trim();
    return {kind:input.kind,slug,locale:edition.locale,title:edition.title,seo_title:edition.seoTitle||edition.title,
      summary:edition.summary||excerpt(content),content,author:edition.author,tags:edition.tags,
      metadata:{sources:edition.sources,...(edition.coverImage?{ogImage:edition.coverImage}:{})}};
  });
}
