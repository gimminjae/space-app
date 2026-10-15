import { assertOrigin, requireAdmin, verifyPassword, errorResponse, readJson, HttpError } from '@/lib/server/auth';
import { db, dbError } from '@/lib/server/db';
import { postSchema } from '@/lib/validation';
import { excerpt, slugify } from '@/lib/site';
export async function POST(request:Request) {
  try {
    assertOrigin(request); await requireAdmin(); const body=await readJson(request); await verifyPassword(request,body.password);
    const result=postSchema.safeParse(body.post); if(!result.success) throw new HttpError(400,result.error.issues[0].message);
    const post=result.data;
    if(post.status==='public' && !post.category_id) throw new HttpError(400,'카테고리를 선택해 주세요.');
    const tags=[...new Set(post.tags)].map(name=>({name,slug:slugify(name)}));
    if(tags.some(t=>!t.slug)) throw new HttpError(400,'태그에 문자나 숫자를 포함해 주세요.');
    const {data,error}=await db(true).rpc('space_save_post',{p_post:{...post,summary:post.summary||excerpt(post.content)},p_tags:tags}); dbError(error);
    return Response.json({post:data},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return errorResponse(error); }
}
export async function DELETE(request:Request) {
  try {
    assertOrigin(request); await requireAdmin(); const body=await readJson(request); await verifyPassword(request,body.password);
    if(typeof body.id!=='string' || !Number.isInteger(body.version)) throw new HttpError(400,'글 정보를 확인해 주세요.');
    const {data,error}=await db(true).from('space_posts').update({deleted_at:new Date().toISOString(),status:'private',updated_at:new Date().toISOString(),version:body.version+1}).eq('id',body.id).eq('version',body.version).is('deleted_at',null).select('id'); dbError(error);
    if(!data?.length) throw new HttpError(409,'다른 창에서 변경되었습니다. 목록을 새로고침해 주세요.');
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return errorResponse(error); }
}
