import {createClient,type SupabaseClient} from '@supabase/supabase-js';
export function workerDb(deadline=Date.now()+20000):SupabaseClient{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('worker_environment_missing');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(Math.max(200,Math.min(4000,deadline-Date.now()))),cache:'no-store'})}});
}
export function checked<T>(result:{data:T;error:{code?:string}|null}):T{if(result.error)throw new Error('database_'+(result.error.code||'error'));return result.data;}
