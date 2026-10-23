import {createHash,createHmac,randomUUID} from 'node:crypto';
import {db,adminDatabaseConfigured} from '@/lib/server/db';
import {publicationSubmissionSchema,submissionEntries,publicationPath,type Publication} from '@/lib/publication';
import {absolute} from '@/lib/site';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
const reply=(value:unknown,status=200,extra:Record<string,string>={})=>Response.json(value,{status,headers:{...headers,...extra}});
export async function GET(){return reply({endpoint:'/api/publish',method:'POST',authentication:'none',publishesImmediately:true,limits:{perClient:20,windowMinutes:15,maxBodyBytes:1500000},example:{kind:'article',slug:'my-first-article',idempotencyKey:'a054c391-cd4d-4c46-bad3-1be6ae5764b9',editions:[{locale:'ko',title:'글 제목',author:'작성자',summary:'글의 요약',content:'80자 이상의 Markdown 본문',tags:['경제'],sources:[]}]},briefingCategories:['us-market-briefing','kr-market-briefing'],notes:['Use kind article, category and sessionDate YYYY-MM-DD for market briefings. The slug is category-sessionDate.','One or two editions (ko/en) per request.','Use the same idempotencyKey for retries of the same content.','Existing articles cannot be edited or deleted by this endpoint.']});}
export async function POST(request:Request){
 if(!adminDatabaseConfigured())return reply({error:'작성 기능의 연결 설정을 확인하고 있습니다.'},503);
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply({error:'application/json 형식으로 보내 주세요.'},415);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin&&origin!==new URL(absolute('/')).origin)return reply({error:'이 사이트의 작성 페이지 또는 서버 자동화를 이용해 주세요.'},403);
 let raw='';
 try{
  const reader=request.body?.getReader();if(!reader)return reply({error:'본문이 없습니다.'},400);
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1500000){await reader.cancel();return reply({error:'요청 크기는 1.5MB 이하여야 합니다.'},413);}chunks.push(value);}
  raw=Buffer.concat(chunks).toString('utf8');
 }catch{return reply({error:'요청 본문을 읽지 못했습니다.'},400);}
 let input:unknown;try{input=JSON.parse(raw);}catch{return reply({error:'올바른 JSON을 보내 주세요.'},400);}
 const parsed=publicationSubmissionSchema.safeParse(input);if(!parsed.success)return reply({error:'제목·본문·언어·주소를 확인해 주세요. 본문은 80자 이상이어야 합니다.',issues:parsed.error.issues.map(i=>({path:i.path.join('.'),message:i.message}))},400);
 const value=parsed.data,headerKey=request.headers.get('idempotency-key');
 const key=headerKey||value.idempotencyKey||randomUUID();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))return reply({error:'요청 식별자는 UUID 형식이어야 합니다.'},400);
 const slug=value.category?`${value.category}-${value.sessionDate}`:value.slug||`post-${key}`,entries=submissionEntries(value,slug);
 if(entries.some(e=>e.content.length<80))return reply({error:'제목을 제외한 본문을 80자 이상 작성해 주세요.'},400);
 const fingerprint=createHash('sha256').update(JSON.stringify(entries)).digest('hex');
 const ip=request.headers.get('x-nf-client-connection-ip')||'shared';
 const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY!;
 const rateKey=createHmac('sha256',secret).update(ip).digest('hex');
 try{
  const {data,error}=await db(true).rpc('space_publish_documents',{p_entries:entries,p_request_key:key,p_fingerprint:fingerprint,p_rate_key:rateKey});
  if(error){
   if(error.message.includes('rate_limit'))return reply({error:'발행 요청이 많습니다. 15분 뒤 다시 시도해 주세요.'},429,{'Retry-After':'900'});
   if(error.code==='23505'||error.message.includes('idempotency_conflict'))return reply({error:'이미 사용한 글 주소 또는 요청 식별자입니다. 같은 글의 재시도에는 이전 내용과 식별자를 그대로 사용해 주세요.'},409);
   console.error('Publication write failed',{code:error.code});return reply({error:'저장하지 못했습니다. 같은 요청 식별자로 다시 시도해 주세요.'},503);
  }
  const articles=(data as Pick<Publication,'id'|'kind'|'slug'|'locale'|'published_at'>[]).map(doc=>({...doc,path:publicationPath(doc),url:absolute(publicationPath(doc))}));
  return reply({status:'published',idempotencyKey:key,articles},201);
 }catch{return reply({error:'저장소에 연결하지 못했습니다. 같은 요청 식별자로 다시 시도해 주세요.'},503);}
}
