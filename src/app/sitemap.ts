import {glossary,indicators,topics} from '@/lib/economy/catalog';
import events from '../../content/events.json';
import { locales,localizePath } from '@/lib/i18n/routing';
import { languageAlternates } from '@/lib/i18n/server';
import { allPublicPosts } from '@/lib/server/posts';
import { absolute,postPath } from '@/lib/site';
import type { MetadataRoute } from 'next';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const posts=await allPublicPosts(),spaces=[...new Map(posts.filter(p=>p.space).map(p=>[p.space!.id,p.space!])).values()];
 const pages=[{path:'/'},{path:'/about'},{path:'/spaces'},{path:'/topics'},{path:'/glossary'},{path:'/indicators'},{path:'/calendar'},...topics.filter(x=>x.active).map(x=>({path:`/topics/${x.slug}`})),...glossary.filter(x=>x.active).map(x=>({path:`/glossary/${x.slug}`,lastModified:x.reviewed_at})),...indicators.filter(x=>x.active).map(x=>({path:`/indicators/${x.slug}`})),...events.filter(x=>x.active).map(x=>({path:`/calendar/${x.id}`,lastModified:x.updated_at})),...spaces.map(s=>({path:`/s/${s.slug}`,lastModified:s.updated_at})),...posts.map(p=>({path:postPath(p),lastModified:p.updated_at}))];
 return pages.flatMap(({path,...rest})=>locales.map(locale=>({url:absolute(localizePath(path,locale)),...rest,alternates:{languages:languageAlternates(path)}})));
}
