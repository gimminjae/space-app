import { lessons,lessonImages,updatedAt } from '@/lib/learn';
import { etfArticles,etfUpdatedAt } from '@/lib/etf';
import { contentOnly } from '@/lib/platform-mode';
import { locales,localizePath } from '@/lib/i18n/routing';
import { languageAlternates } from '@/lib/i18n/server';
import { allPublicPosts } from '@/lib/server/posts';
import { absolute,postPath } from '@/lib/site';
import type { MetadataRoute } from 'next';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const posts=contentOnly?[]:await allPublicPosts();
 const spaces=[...new Map(posts.filter(p=>p.space).map(p=>[p.space!.id,p.space!])).values()];
 const categories=[...new Set(posts.flatMap(p=>p.category?[p.category.slug]:[]))];
 const tags=[...new Set(posts.flatMap(p=>(p.tags||[]).map(tag=>tag.slug)))];
 const pages=[{path:'/category/etf',lastModified:etfUpdatedAt},...etfArticles.map(article=>({path:`/etf/${article.slug}`,lastModified:etfUpdatedAt})),{path:'/learn',lastModified:updatedAt},...lessons.map(lesson=>({path:`/learn/${lesson.slug}`,lastModified:updatedAt})),
  {path:'/'},{path:'/about'},{path:'/privacy'},...(spaces.length?[{path:'/spaces'}]:[]),
  ...spaces.map(s=>({path:`/s/${s.slug}`,lastModified:s.updated_at})),...categories.map(slug=>({path:`/category/${slug}`})),...tags.map(slug=>({path:`/tag/${slug}`}))];
 const translated=pages.flatMap(({path,...rest})=>locales.map(locale=>({url:absolute(localizePath(path,locale)),...rest,
  ...(path.startsWith('/learn/')?{images:lessonImages(path.split('/').pop()!,locale).map(image=>absolute(image))}:{}),
  ...(path.startsWith('/etf/')?{images:[absolute(`/etf-assets/${path.split('/').pop()}.${locale}.og.png`)]}:{}),alternates:{languages:languageAlternates(path)}})));
 // Member articles keep their original body in both interfaces; index one canonical URL.
 return [...translated,...posts.map(post=>({url:absolute(postPath(post)),lastModified:post.updated_at,...(post.cover_asset_id?{images:[absolute(`/media/${post.cover_asset_id}`)]}:{})}))];
}
