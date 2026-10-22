import { lessons,lessonImages,updatedAt } from '@/lib/learn';
import { locales,localizePath } from '@/lib/i18n/routing';
import { languageAlternates } from '@/lib/i18n/server';
import { allPublicPosts } from '@/lib/server/posts';
import { absolute,postPath } from '@/lib/site';
import type { MetadataRoute } from 'next';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const posts=await allPublicPosts(),spaces=[...new Map(posts.filter(p=>p.space).map(p=>[p.space!.id,p.space!])).values()];
 const pages=[{path:'/learn',lastModified:updatedAt},...lessons.map(lesson=>({path:`/learn/${lesson.slug}`,lastModified:updatedAt})),{path:'/'},{path:'/about'},{path:'/spaces'},...spaces.map(s=>({path:`/s/${s.slug}`,lastModified:s.updated_at})),...posts.map(p=>({path:postPath(p),lastModified:p.updated_at}))];
 return pages.flatMap(({path,...rest})=>locales.map(locale=>({url:absolute(localizePath(path,locale)),...rest,...(path.startsWith('/learn/')?{images:lessonImages(path.split('/').pop()!,locale).map(image=>absolute(image))}:{}),alternates:{languages:languageAlternates(path)}})));
}
