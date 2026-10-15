import {notFound,permanentRedirect} from 'next/navigation';
import {getPost} from '@/lib/server/posts';
import {postPath} from '@/lib/site';
export default async function LegacyPost({params}:{params:Promise<{slug:string}>}){const post=await getPost((await params).slug);if(!post)notFound();permanentRedirect(postPath(post));}
