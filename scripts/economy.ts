import {reindexTerms} from '../server/economy/reindex';
import {loadEnvConfig} from '@next/env';
import {workerDb,checked} from '../server/economy/client';
import {seedEconomy} from '../server/economy/seed';
import {syncIndicators,checkCalendar} from '../server/economy/sync';
loadEnvConfig(process.cwd());
const command=process.argv[2];
async function main(){try{
 if(command==='seed')console.log(await seedEconomy(workerDb(Date.now()+60000)));
 else if(command==='reindex')console.log(await reindexTerms(workerDb(Date.now()+300000)));
 else if(command==='sync'||command==='backfill'){
  for(let i=0;i<(command==='backfill'?7:1);i++){let pending=false;for(const provider of ['fred','ecos'] as const){const result=await syncIndicators(provider,{force:true});console.log(result);pending=pending||!!result.backfillPending;}if(!pending)break;}
 }else if(command==='calendar')console.log(await checkCalendar({force:true}));
 else if(command==='status'){
  const db=workerDb();console.log(JSON.stringify({keys:{fred:!!process.env.FRED_API_KEY,ecos:!!process.env.ECOS_API_KEY},enabled:process.env.ECONOMIC_SYNC_ENABLED==='true',jobs:checked(await db.from('space_sync_runs').select('*')),series:checked(await db.from('space_indicator_series').select('id,approved,last_success_at,last_error'))},null,2));
 }else throw new Error('Usage: npm run economy -- seed|reindex|sync|backfill|calendar|status');
}catch(e){console.error(e instanceof Error?e.message:'economy_failed');process.exitCode=1;}
}
void main();
