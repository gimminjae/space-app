import 'server-only';
import { cache } from 'react';
import {defaultCategories} from '@/lib/default-categories';
import { db, dbError, databaseConfigured } from './db';
import {userDb} from './session';
import {mySpace} from './spaces';
import type { Post, Category, Tag } from '@/lib/types';
export const getCategories = cache(async (spaceId?:string, own=false): Promise<Category[]> => {
  if(!databaseConfigured()) return defaultCategories;
  let query=(own?await userDb():db()).from('space_categories').select('*').order('sort_order').order('name');if(spaceId)query=query.eq('space_id',spaceId);const {data,error}=await query;dbError(error);return spaceId?(data||[]):data?.length?[...new Map(data.map(c=>[c.slug,c])).values()]:defaultCategories;
});
export const getTags = cache(async (): Promise<Tag[]> => {
  if(!databaseConfigured()) return [];
  const {data,error}=await db().from('space_tags').select('*').order('name'); dbError(error); return data || [];
});
export async function listPosts(options: {query?:string; category?:string; tag?:string; page?:number; admin?:boolean; status?:string; spaceId?:string} = {}): Promise<{posts:Post[];total:number}> {
  if(!databaseConfigured()) return {posts:[],total:0};
  const {data,error}=await (options.admin?await userDb():db()).rpc('space_list_posts', {p_query:(options.query||'').slice(0,100),p_category:options.category||'',p_tag:options.tag||'',p_page:Math.max(1,options.page||1),p_admin:!!options.admin,p_status:options.status||'',p_space:options.spaceId||null}); dbError(error); return data as {posts:Post[];total:number};
}
export const getPost = cache(async (slug: string, spaceId?:string):Promise<Post|null> => {
  if(!databaseConfigured()) return null;
  let query=db().from('space_posts').select('*,category:space_categories!space_posts_category_id_fkey(*),space:space_spaces(id,slug,name,description,accent,created_at,updated_at)').eq('slug',slug).eq('status','public').is('deleted_at',null);if(spaceId)query=query.eq('space_id',spaceId);const result=await query.limit(2);dbError(result.error);if(result.data?.length!==1)return null;const data=result.data[0];
  const tags=await db().from('space_post_tags').select('tag:space_tags!space_post_tags_tag_id_fkey(*)').eq('post_id',data.id); dbError(tags.error);
  return {...data,tags:tags.data?.map(t=>t.tag).filter(Boolean)||[]} as unknown as Post;
});
export async function getAdminPost(id:string):Promise<Post|null> {
  const space=await mySpace();if(!space)return null;const client=await userDb();const {data,error}=await client.from('space_posts').select('*,category:space_categories!space_posts_category_id_fkey(*),space:space_spaces(id,slug,name,description,accent,created_at,updated_at)').eq('id',id).eq('space_id',space.id).is('deleted_at',null).maybeSingle(); dbError(error); if(!data) return null;
  const tags=await client.from('space_post_tags').select('tag:space_tags!space_post_tags_tag_id_fkey(*)').eq('post_id',id); dbError(tags.error);
  return {...data,tags:tags.data?.map(t=>t.tag).filter(Boolean)||[]} as unknown as Post;
}
export async function allPublicPosts(): Promise<Post[]> {
  if(!databaseConfigured()) return [];
  const posts:Post[]=[];
  for(let offset=0;;offset+=500) {
    const {data,error}=await db().from('space_posts').select('*,space:space_spaces(id,slug,name,description,accent,created_at,updated_at)').eq('status','public').is('deleted_at',null).order('id').range(offset,offset+499); dbError(error);
    posts.push(...(data||[]) as Post[]); if(!data || data.length<500) break;
  }
  return posts;
}
