import 'server-only';
import { cache } from 'react';
import {defaultCategories} from '@/lib/default-categories';
import { db, dbError, databaseConfigured } from './db';
import type { Post, Category, Tag } from '@/lib/types';
export const getCategories = cache(async (): Promise<Category[]> => {
  if(!databaseConfigured()) return defaultCategories;
  const {data,error}=await db().from('space_categories').select('*').order('sort_order').order('name'); dbError(error); return data || [];
});
export const getTags = cache(async (): Promise<Tag[]> => {
  if(!databaseConfigured()) return [];
  const {data,error}=await db().from('space_tags').select('*').order('name'); dbError(error); return data || [];
});
export async function listPosts(options: {query?:string; category?:string; tag?:string; page?:number; admin?:boolean; status?:string} = {}): Promise<{posts:Post[];total:number}> {
  if(!databaseConfigured()) return {posts:[],total:0};
  const {data,error}=await db(!!options.admin).rpc('space_list_posts', {p_query:(options.query||'').slice(0,100),p_category:options.category||'',p_tag:options.tag||'',p_page:Math.max(1,options.page||1),p_admin:!!options.admin,p_status:options.status||''}); dbError(error); return data as {posts:Post[];total:number};
}
export const getPost = cache(async (slug: string):Promise<Post|null> => {
  if(!databaseConfigured()) return null;
  const {data,error}=await db().from('space_posts').select('*,category:space_categories(*)').eq('slug',slug).eq('status','public').is('deleted_at',null).maybeSingle(); dbError(error);
  if(!data) return null;
  const tags=await db().from('space_post_tags').select('tag:space_tags(*)').eq('post_id',data.id); dbError(tags.error);
  return {...data,tags:tags.data?.map(t=>t.tag).filter(Boolean)||[]} as unknown as Post;
});
export async function getAdminPost(id:string):Promise<Post|null> {
  const {data,error}=await db(true).from('space_posts').select('*,category:space_categories(*)').eq('id',id).is('deleted_at',null).maybeSingle(); dbError(error); if(!data) return null;
  const tags=await db(true).from('space_post_tags').select('tag:space_tags(*)').eq('post_id',id); dbError(tags.error);
  return {...data,tags:tags.data?.map(t=>t.tag).filter(Boolean)||[]} as unknown as Post;
}
export async function allPublicPosts(): Promise<Post[]> {
  if(!databaseConfigured()) return [];
  const posts:Post[]=[];
  for(let offset=0;;offset+=500) {
    const {data,error}=await db().from('space_posts').select('*').eq('status','public').is('deleted_at',null).order('id').range(offset,offset+499); dbError(error);
    posts.push(...(data||[]) as Post[]); if(!data || data.length<500) break;
  }
  return posts;
}
