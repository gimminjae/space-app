import { db } from '@/lib/server/db';
import { isAdmin } from '@/lib/server/auth';
import { readObject } from '@/lib/server/storage';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!z.uuid().safeParse(id).success) return new Response('Not found',{status:404});
  try {
    const admin=await isAdmin();
    const {data:asset,error}=await db(true).from('space_assets').select('*').eq('id',id).eq('ready',true).maybeSingle();
    if(error||!asset) return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
    if(!admin) {
      const {data:post}=await db().from('space_posts').select('id,content,cover_asset_id').eq('id',asset.post_id).eq('status','public').is('deleted_at',null).maybeSingle();
      if(!post || (post.cover_asset_id!==id && !post.content.includes(`/media/${id}`))) return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
    }
    const object=await readObject(asset.storage_key);
    const headers={'Content-Type':asset.mime,'Content-Length':String(object.ContentLength||asset.size),
      'Content-Disposition':`${asset.mime.startsWith('image/')?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(asset.name)}`,
      'Cache-Control':'private, no-store, max-age=0','Netlify-CDN-Cache-Control':'no-store','Vary':'Cookie',
      'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",...(admin?{'X-Robots-Tag':'noindex'}:{})};
    return new Response(object.Body!.transformToWebStream(),{headers});
  } catch { return new Response('File unavailable',{status:503,headers:{'Cache-Control':'no-store'}}); }
}
