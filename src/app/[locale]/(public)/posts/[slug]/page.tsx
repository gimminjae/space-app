import { getI18n } from '@/lib/i18n/server';
import { getPost } from '@/lib/server/posts';
import { postPath } from '@/lib/site';
import { notFound,permanentRedirect } from 'next/navigation';
export default async function LegacyPost({params}:{params:Promise<{slug:string}>}){const {l}=await getI18n();const post=await getPost((await params).slug);if(!post)notFound();permanentRedirect(l(postPath(post)));}
