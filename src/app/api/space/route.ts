import {assertOrigin,requireUser,errorResponse,readJson,HttpError} from '@/lib/server/auth';
import {userDb} from '@/lib/server/session';
import {dbError} from '@/lib/server/db';
import {z} from 'zod';
const schema=z.object({name:z.string().trim().min(1).max(60),description:z.string().trim().max(300),accent:z.enum(['forest','ocean','plum','terracotta']),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(40).optional()});
async function save(request:Request,create:boolean){try{assertOrigin(request);const user=await requireUser();const parsed=schema.safeParse(await readJson(request));if(!parsed.success)throw new HttpError(400,'공간 이름과 주소를 확인해 주세요. 주소는 영문 소문자·숫자·하이픈 3~40자로 입력하세요.');const client=await userDb(),v=parsed.data;
 if(create){if(!v.slug)throw new HttpError(400,'공간 주소를 입력해 주세요.');const {data,error}=await client.rpc('space_create_space',{p_slug:v.slug,p_name:v.name,p_description:v.description,p_accent:v.accent});dbError(error);return Response.json({space:data});}
 const {data,error}=await client.from('space_spaces').update({name:v.name,description:v.description,accent:v.accent,updated_at:new Date().toISOString()}).eq('owner_id',user.id).select().single();dbError(error);return Response.json({space:data});
}catch(error){return errorResponse(error);}}
export async function POST(request:Request){return save(request,true);}
export async function PATCH(request:Request){return save(request,false);}
