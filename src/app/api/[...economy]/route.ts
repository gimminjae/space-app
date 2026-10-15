import {z} from 'zod';
import {assertOrigin,errorResponse,HttpError,readJson,requireUser} from '@/lib/server/auth';
import {userDb} from '@/lib/server/session';
import {bookmarks,economicEvents,economyError,eventDetail,eventIcs,eventResults,folders,glossary,indicatorData,indicators,readerPosts,readerState,topics} from '@/lib/server/reader-api';
import {getI18n} from '@/lib/i18n/server';
import {site} from '@/lib/site';
const uuid=z.uuid();const slug=z.string().regex(/^[a-z0-9-]{1,160}$/);const folderInput=z.object({name:z.string().trim().min(1).max(40)}).strict();
function parsed<T>(schema:z.ZodType<T>,data:unknown):T{const r=schema.safeParse(data);if(!r.success)throw new HttpError(400,'입력 내용을 확인해 주세요.');return r.data;}
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});
async function handle(request:Request){try{
 const url=new URL(request.url),parts=url.pathname.slice(5).split('/').map(decodeURIComponent),[name,id,third]=parts,method=request.method,q=url.searchParams;
 if(method!=='GET')assertOrigin(request);
 if(method==='GET'){
  if(name==='glossary'&&parts.length===1){const query=(q.get('q')||'').slice(0,100).toLowerCase();return reply({items:glossary.filter(t=>t.active&&[t.ko.name,t.en.name,...t.aliases].some(n=>n.toLowerCase().includes(query)))});}
  if(name==='topics'&&parts.length===1)return reply({items:topics});
  if(name==='indicators'&&parts.length===1)return reply({items:indicators});
  if(name==='indicators'&&parts.length===2){const value=await indicatorData(parsed(slug,id),parsed(z.coerce.number().int().min(1).max(5),q.get('years')||5));if(!value)throw new HttpError(404,'항목을 찾을 수 없습니다.');return reply(value);}
  if(name==='calendar'&&parts.length===1)return reply({items:await economicEvents({month:q.get('month')||undefined,country:q.get('country')||undefined,kind:q.get('kind')||undefined,topic:q.get('topic')||undefined})});
  if(name==='calendar'&&(parts.length===2||(parts.length===3&&third==='ics'))){const event=await eventDetail(parsed(slug,id));if(!event)throw new HttpError(404,'항목을 찾을 수 없습니다.');if(third==='ics'){const {locale}=await getI18n();return new Response(eventIcs(event,q.get('lang')==='en'?'en':locale,site.url+(q.get('lang')==='en'?'/en':'')+'/calendar/'+event.id),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':`attachment; filename="space-${event.id}.ics"`,'Cache-Control':'no-store'}});}return reply({event,results:await eventResults(event.id)});}
  await requireUser();
  if(name==='bookmark-folders'&&parts.length===1)return reply({items:await folders()});
  if(name==='bookmarks'&&parts.length===1)return reply(await bookmarks({query:q.get('q')||undefined,folder:q.get('folder')||undefined,sort:q.get('sort')||undefined,cursor:q.get('cursor')||undefined}));
  if(name==='following'&&parts.length===1)return reply(await readerPosts('following','',q.get('cursor')||undefined));
  if(name==='indicator-favorites'&&parts.length===1)return reply({items:(await readerState())?.favorites||[]});
  if(name==='reader-state'&&parts.length===1)return reply(await readerState());
 }
 const user=await requireUser(),c=await userDb();
 if(name==='bookmark-folders'){
  if(method==='POST'&&parts.length===1){const input=parsed(folderInput,await readJson(request));const {data,error}=await c.from('space_bookmark_folders').insert({...input,user_id:user.id}).select('id,name').single();economyError(error);return reply({folder:data},201);}
  if(parts.length===2){parsed(uuid,id);if(method==='PATCH'){const input=parsed(folderInput,await readJson(request));const r=await c.from('space_bookmark_folders').update(input).eq('id',id).eq('user_id',user.id).select('id,name').maybeSingle();economyError(r.error);if(!r.data)throw new HttpError(404,'항목을 찾을 수 없습니다.');return reply({folder:r.data});}if(method==='DELETE'){const r=await c.rpc('space_delete_folder',{p_id:id});economyError(r.error);return reply({ok:true});}}
 }
 if(name==='bookmarks'){
  if(method==='POST'&&parts.length===1){const input=parsed(z.object({post_id:uuid,folder_id:uuid.nullable().optional()}).strict(),await readJson(request));const r=await c.from('space_bookmarks').upsert({...input,user_id:user.id},{onConflict:'user_id,post_id',ignoreDuplicates:true});economyError(r.error);const b=await c.from('space_bookmarks').select('id').eq('user_id',user.id).eq('post_id',input.post_id).single();economyError(b.error);return reply({bookmark:b.data},201);}
  if(parts.length===2){parsed(uuid,id);if(method==='PATCH'){const input=parsed(z.object({note:z.string().max(5000),folder_id:uuid.nullable(),version:z.number().int().positive()}).strict(),await readJson(request));const r=await c.from('space_bookmarks').update({note:input.note,folder_id:input.folder_id}).eq('id',id).eq('user_id',user.id).eq('version',input.version).select('id,note,folder_id,version,updated_at').maybeSingle();economyError(r.error);if(!r.data)throw new HttpError(409,'다른 창에서 변경되었습니다. 새로고침 후 확인해 주세요.');return reply({bookmark:r.data});}if(method==='DELETE'){const r=await c.from('space_bookmarks').delete().eq('id',id).eq('user_id',user.id).select('id');economyError(r.error);if(!r.data?.length)throw new HttpError(404,'항목을 찾을 수 없습니다.');return reply({ok:true});}}
 }
 if(name==='follows'&&parts.length===3&&['spaces','topics'].includes(id)&&(method==='PUT'||method==='DELETE')){
  const table=id==='spaces'?'space_space_follows':'space_topic_follows',key=id==='spaces'?'space_id':'topic_slug';parsed(id==='spaces'?uuid:slug,third);
  const r=method==='PUT'?await c.from(table).upsert({user_id:user.id,[key]:third},{onConflict:`user_id,${key}`,ignoreDuplicates:true}):await c.from(table).delete().eq('user_id',user.id).eq(key,third);economyError(r.error);return reply({ok:true});
 }
 if(name==='indicator-favorites'){
  if(parts.length===2&&(method==='PUT'||method==='DELETE')){parsed(slug,id);if(!indicators.some(i=>i.slug===id))throw new HttpError(404,'항목을 찾을 수 없습니다.');const r=method==='PUT'?await c.from('space_indicator_favorites').upsert({user_id:user.id,indicator_slug:id},{onConflict:'user_id,indicator_slug',ignoreDuplicates:true}):await c.from('space_indicator_favorites').delete().eq('user_id',user.id).eq('indicator_slug',id);economyError(r.error);return reply({ok:true});}
  if(parts.length===1&&method==='PATCH'){const {order}=parsed(z.object({order:z.array(slug).max(8).refine(v=>new Set(v).size===v.length)}).strict(),await readJson(request));const r=await c.rpc('space_order_favorites',{p_order:order});economyError(r.error);return reply({ok:true});}
 }
 if(name==='event-saves'&&parts.length===2&&(method==='PUT'||method==='DELETE')){parsed(slug,id);const r=method==='PUT'?await c.from('space_event_saves').upsert({user_id:user.id,event_id:id},{onConflict:'user_id,event_id',ignoreDuplicates:true}):await c.from('space_event_saves').delete().eq('user_id',user.id).eq('event_id',id);economyError(r.error);return reply({ok:true});}
 throw new HttpError(404,'항목을 찾을 수 없습니다.');
 }catch(error){return errorResponse(error);}}
export const GET=handle;export const POST=handle;export const PATCH=handle;export const PUT=handle;export const DELETE=handle;
