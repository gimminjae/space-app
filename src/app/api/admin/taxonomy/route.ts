import { assertOrigin, requireSpace, errorResponse, readJson, HttpError } from '@/lib/server/auth';
import { db, dbError } from '@/lib/server/db';
import { slugify } from '@/lib/site';
import { z } from 'zod';
const schema=z.object({kind:z.enum(['category','tag']),id:z.uuid().optional(),name:z.string().trim().min(1).max(50),description:z.string().max(300).default(''),sort_order:z.number().int().min(0).max(999).default(0)});
export async function POST(request:Request) {
  try {
    assertOrigin(request); const {client,space}=await requireSpace(); const body=await readJson(request);
    const result=schema.safeParse(body); if(!result.success) throw new HttpError(400,'분류 정보를 확인해 주세요.');
    const item=result.data, table=item.kind==='category'?'space_categories':'space_tags'; const slug=slugify(item.name);
    if(!slug) throw new HttpError(400,'이름에 문자나 숫자를 포함해 주세요.');
    const values={...(!item.id?{space_id:space.id}:{}),name:item.name,...(!item.id?{slug}:{}),...(item.kind==='category'?{description:item.description,sort_order:item.sort_order}:{})};
    const query=item.id?client.from(table).update(values).eq('space_id',space.id).eq('id',item.id):client.from(table).insert(values);
    const {error}=await query; dbError(error); return Response.json({ok:true});
  } catch(error) { return errorResponse(error); }
}
export async function DELETE(request:Request) {
  try {
    assertOrigin(request); const {client,space}=await requireSpace(); const body=await readJson(request);
    if(!z.uuid().safeParse(body.id).success || !['category','tag'].includes(body.kind)) throw new HttpError(400,'분류를 확인해 주세요.');
    if(body.kind==='category') {
      if(!z.uuid().safeParse(body.replacement_id).success || body.replacement_id===body.id) throw new HttpError(400,'글을 옮길 다른 카테고리를 선택해 주세요.');
      const {error}=await client.rpc('space_delete_category',{p_id:body.id,p_replacement:body.replacement_id}); dbError(error);
    } else { const {error}=await client.from('space_tags').delete().eq('space_id',space.id).eq('id',body.id); dbError(error); }
    return Response.json({ok:true});
  } catch(error) { return errorResponse(error); }
}
