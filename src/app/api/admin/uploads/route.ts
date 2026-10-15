import {randomUUID} from 'node:crypto';
import {assertOrigin,requireAdmin,errorResponse,HttpError} from '@/lib/server/auth';
import {db,dbError} from '@/lib/server/db';
import {writeObject,deleteObject,storageConfigured} from '@/lib/server/storage';
import {validateFile,MAX_UPLOAD_SIZE} from '@/lib/validation';
import {z} from 'zod';
export async function POST(request:Request){
 try{
  assertOrigin(request);await requireAdmin();
  if(!storageConfigured())throw new HttpError(503,'S3 환경변수 설정 후 파일을 업로드할 수 있습니다.');
  if(Number(request.headers.get('content-length')||0)>MAX_UPLOAD_SIZE+64*1024)throw new HttpError(413,'파일은 최대 4MB까지 업로드할 수 있습니다.');
  const form=await request.formData(),file=form.get('file'),postId=form.get('post_id');
  if(!z.uuid().safeParse(postId).success||!(file instanceof File)||!validateFile(file.name,file.type,file.size))throw new HttpError(400,'허용된 이미지·문서 파일을 선택해 주세요. 최대 4MB입니다.');
  const id=randomUUID(),key=`space/${postId}/${id}.${file.name.split('.').pop()!.toLowerCase()}`;
  await writeObject(key,file.type,new Uint8Array(await file.arrayBuffer()));
  const {error}=await db(true).from('space_assets').insert({id,post_id:postId,storage_key:key,name:file.name,mime:file.type,size:file.size,ready:true});
  if(error){await deleteObject(key).catch(()=>console.error('Orphan upload cleanup requires retry',{assetId:id}));dbError(error);}
  return Response.json({id,url:`/media/${id}`,name:file.name,mime:file.type},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return errorResponse(error);}
}
