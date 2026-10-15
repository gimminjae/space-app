import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { createHmac, randomUUID } from 'node:crypto';
import { checkPassword, credentialVersion } from '@/lib/password';
import { db, dbError } from './db';
import { site } from '@/lib/site';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const cookieName = 'space_admin';
function secret() { const value = process.env.ADMIN_SESSION_SECRET; if(!value || value.length < 32) throw new HttpError(503,'관리자 인증 설정이 필요합니다.'); return new TextEncoder().encode(value); }
export async function isAdmin() {
  const token = (await cookies()).get(cookieName)?.value;
  if(!token || !process.env.ADMIN_PASSWORD_HASH) return false;
  try { const {payload} = await jwtVerify(token, secret(), {issuer:'space',audience:'space-admin',algorithms:['HS256']}); return payload.ver === credentialVersion(process.env.ADMIN_PASSWORD_HASH) && payload.sub === 'owner'; } catch { return false; }
}
export async function requireAdmin() { if(!await isAdmin()) throw new HttpError(401,'관리 비밀번호를 확인해 주세요.'); }
export function assertOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = new Set([new URL(site.url).origin]);
  if(process.env.NODE_ENV !== 'production') { allowed.add('http://127.0.0.1:3000'); allowed.add('http://localhost:3000'); }
  if(!origin || !allowed.has(origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403,'허용되지 않은 요청입니다.');
}
export async function verifyPassword(request: Request, password: unknown) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if(!hash) throw new HttpError(503,'관리 비밀번호 설정이 필요합니다.');
  const salt = process.env.ADMIN_SESSION_SECRET;
  if(!salt) throw new HttpError(503,'관리자 인증 설정이 필요합니다.');
  // Netlify overwrites this header. Do not trust an arbitrary x-forwarded-for value.
  const ip = process.env.NETLIFY ? request.headers.get('x-nf-client-connection-ip') || 'unknown' : 'shared';
  const fingerprint = createHmac('sha256',salt).update(ip).digest('hex');
  const {data,error} = await db(true).rpc('space_take_auth_attempt', {p_key:fingerprint});
  dbError(error);
  if(!data) throw new HttpError(429,'시도 횟수를 초과했습니다. 15분 후 다시 시도해 주세요.');
  if(!await checkPassword(password,hash)) throw new HttpError(401,'비밀번호가 올바르지 않습니다.');
  const reset = await db(true).from('space_auth_attempts').delete().eq('key',fingerprint);
  dbError(reset.error);
}
export async function startSession() {
  const token = await new SignJWT({ver:credentialVersion(process.env.ADMIN_PASSWORD_HASH!)}).setProtectedHeader({alg:'HS256'}).setSubject('owner').setIssuer('space').setAudience('space-admin').setJti(randomUUID()).setIssuedAt().setExpirationTime('30m').sign(secret());
  (await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV === 'production',sameSite:'strict',path:'/',maxAge:1800});
}
export async function endSession() { (await cookies()).delete(cookieName); }
export function errorResponse(error: unknown) {
  const status = error instanceof HttpError ? error.status : 400;
  return Response.json({error:error instanceof Error ? error.message : '요청을 완료하지 못했습니다.'},{status,headers:{'Cache-Control':'no-store'}});
}
export async function readJson(request: Request) {
  if(!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415,'지원하지 않는 요청 형식입니다.');
  const raw = await request.text();
  if(raw.length > 600_000) throw new HttpError(413,'본문이 너무 큽니다.');
  try { return JSON.parse(raw); } catch { throw new HttpError(400,'요청 내용을 확인해 주세요.'); }
}
