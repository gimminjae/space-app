import {pathToFileURL} from 'node:url';
export function briefingTarget(market,now=new Date()) {
 if(!['us','kr'].includes(market))throw new Error('Market must be us or kr.');
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 const runDate=`${p.year}-${p.month}-${p.day}`,date=new Date(`${runDate}T00:00:00Z`);
 if(market==='us')date.setUTCDate(date.getUTCDate()-1);
 const sessionDate=date.toISOString().slice(0,10),category=`${market}-market-briefing`;
 return {market,runDate,sessionDate,category,slug:`${category}-${sessionDate}`,scheduledTime:market==='us'?'08:30':'21:30',beforeScheduledTime:Number(p.hour)*60+Number(p.minute)<(market==='us'?510:1290),weekend:[0,6].includes(date.getUTCDay()),calendarRequired:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(briefingTarget(process.argv[2]),null,2));
