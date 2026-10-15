import {studioSpace} from '@/lib/server/spaces';
import {userDb} from '@/lib/server/session';
import {getCategories,getAdminPost} from '@/lib/server/posts';
import {db,dbError} from '@/lib/server/db';
import {storageConfigured} from '@/lib/server/storage';
import Editor from '@/components/Editor';
import {notFound} from 'next/navigation';
import {z} from 'zod';
export default async function EditPost({params}:{params:Promise<{id:string}>}){const space=await studioSpace();const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const [post,categories,assets]=await Promise.all([getAdminPost(id),getCategories(space.id,true),(await userDb()).from('space_assets').select('id,post_id,name,mime,size,ready').eq('post_id',id).eq('ready',true)]);if(!post)notFound();dbError(assets.error);return <Editor key={`${id}-${post.version}`} initial={post} categories={categories} initialAssets={assets.data||[]} storageReady={storageConfigured()}/>;}
