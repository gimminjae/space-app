import type {MetadataRoute} from 'next';
import {allPublicPosts} from '@/lib/server/posts';
import {publicSpaces} from '@/lib/server/spaces';
import {absolute,postPath} from '@/lib/site';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const posts=await allPublicPosts();const spaces=[...new Map(posts.filter(p=>p.space).map(p=>[p.space!.id,p.space!])).values()];return [{url:absolute('/')},{url:absolute('/about')},{url:absolute('/spaces')},...spaces.filter(s=>posts.some(p=>p.space_id===s.id)).map(s=>({url:absolute(`/s/${s.slug}`),lastModified:s.updated_at})),...posts.map(p=>({url:absolute(postPath(p)),lastModified:p.updated_at}))];}
