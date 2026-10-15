import type {MetadataRoute} from 'next';
import {allPublicPosts,getCategories} from '@/lib/server/posts';
import {absolute} from '@/lib/site';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const [posts,categories]=await Promise.all([allPublicPosts(),getCategories()]);return [{url:absolute('/')},{url:absolute('/about')},...categories.filter(c=>posts.some(p=>p.category_id===c.id)).map(c=>({url:absolute(`/category/${c.slug}`)})),...posts.map(p=>({url:absolute(`/posts/${p.slug}`),lastModified:p.updated_at}))];}
