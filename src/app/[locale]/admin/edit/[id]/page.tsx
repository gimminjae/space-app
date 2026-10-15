import {postTopics} from '@/lib/server/economy';
import Editor from '@/components/Editor';
import { dbError } from '@/lib/server/db';
import { getAdminPost,getCategories } from '@/lib/server/posts';
import { userDb } from '@/lib/server/session';
import { studioSpace } from '@/lib/server/spaces';
import { storageConfigured } from '@/lib/server/storage';
import { notFound } from 'next/navigation';
import { z } from 'zod';
export default async function EditPost({params}:{params:Promise<{id:string}>}){const space=await studioSpace();const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const [post,categories,assets]=await Promise.all([getAdminPost(id),getCategories(space.id,true),(await userDb()).from('space_assets').select('id,post_id,name,mime,size,ready').eq('post_id',id).eq('ready',true)]);if(!post)notFound();dbError(assets.error);return <Editor key={`${id}-${post.version}`} initial={{...post,topics:await postTopics(id,true)}} categories={categories} initialAssets={assets.data||[]} storageReady={storageConfigured()}/>;}
