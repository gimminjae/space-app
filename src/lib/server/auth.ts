import { getI18n } from '@/lib/i18n/server';
import { site } from '@/lib/site';
import 'server-only';
import { dbError } from './db';
import { currentUser,userDb } from './session';
export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export async function requireUser(){const user=await currentUser();if(!user)throw new HttpError(401,'로그인 후 이용해 주세요.');return user;}
export async function requireSpace(){const user=await requireUser();const client=await userDb();const {data,error}=await client.from('space_spaces').select('*').eq('owner_id',user.id).maybeSingle();dbError(error);if(!data)throw new HttpError(409,'먼저 나의 공간을 만들어 주세요.');return {user,space:data,client};}
export function assertOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = new Set([new URL(site.url).origin]);
  if(process.env.NODE_ENV !== 'production') { allowed.add('http://127.0.0.1:3000'); allowed.add('http://localhost:3000'); }
  if(!origin || !allowed.has(origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403,'허용되지 않은 요청입니다.');
}
export async function errorResponse(error: unknown) {
  const {t}=await getI18n();
  const status = error instanceof HttpError ? error.status : 400;
  return Response.json({error:t(error instanceof Error ? error.message : '요청을 완료하지 못했습니다.')},{status,headers:{'Cache-Control':'no-store'}});
}
export async function readJson(request: Request) {
  if(!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415,'지원하지 않는 요청 형식입니다.');
  const raw = await request.text();
  if(raw.length > 600_000) throw new HttpError(413,'본문이 너무 큽니다.');
  try { return JSON.parse(raw); } catch { throw new HttpError(400,'요청 내용을 확인해 주세요.'); }
}
