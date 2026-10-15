import 'server-only';
import { createClient } from '@supabase/supabase-js';
export function databaseConfigured() { return !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY); }
export function adminDatabaseConfigured() { return databaseConfigured() && !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY); }
export function db(admin = false) {
  const url = process.env.SUPABASE_URL;
  const key = admin ? (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) : process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('데이터베이스 연결 설정을 확인해 주세요.');
  return createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}, global:{fetch:(url, init) => fetch(url, {...init, cache:'no-store'})}});
}
export function dbError(error: {message:string; code?:string} | null) {
  if (!error) return;
  if(error.code === '23505') throw new Error('이미 사용 중인 글 주소 또는 이름입니다.');
  if(error.message.includes('version_conflict')) throw new Error('다른 창에서 글이 수정되었습니다. 새로고침 후 다시 시도해 주세요.');
  if(error.message.includes('invalid_asset')) throw new Error('이 글에 업로드한 이미지를 선택해 주세요.');
  console.error('Database operation failed', {code:error.code});
  throw new Error('저장소 요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
}
