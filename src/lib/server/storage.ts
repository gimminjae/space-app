import 'server-only';
import {S3Client,GetObjectCommand,PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
export function storageConfigured(){return !!(process.env.AWS_REGION&&process.env.S3_BUCKET&&((process.env.AWS_ACCESS_KEY_ID&&process.env.AWS_SECRET_ACCESS_KEY)||process.env.AWS_ROLE_ARN));}
function storage(){if(!storageConfigured())throw new Error('S3 환경변수를 설정하면 업로드를 사용할 수 있습니다.');return new S3Client({region:process.env.AWS_REGION,...(process.env.S3_ENDPOINT?{endpoint:process.env.S3_ENDPOINT,forcePathStyle:true}:{})});}
export async function writeObject(key:string,mime:string,bytes:Uint8Array){return storage().send(new PutObjectCommand({Bucket:process.env.S3_BUCKET!,Key:key,Body:bytes,ContentType:mime,ServerSideEncryption:'AES256',CacheControl:'private, no-store'}));}
export async function deleteObject(key:string){return storage().send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET!,Key:key}));}
export async function readObject(key:string){return storage().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET!,Key:key}));}
