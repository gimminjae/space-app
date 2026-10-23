import test from 'node:test';
import assert from 'node:assert/strict';
import {briefingTarget} from '../scripts/briefing-session.mjs';
test('US Friday is briefed on Korean Saturday; Sunday and Monday skip weekend sessions',()=>{
 assert.deepEqual([briefingTarget('us',new Date('2026-10-24T08:30:00+09:00')).sessionDate,briefingTarget('us',new Date('2026-10-24T08:30:00+09:00')).weekend],['2026-10-23',false]);
 assert.equal(briefingTarget('us',new Date('2026-10-25T08:30:00+09:00')).weekend,true);
 assert.equal(briefingTarget('us',new Date('2026-10-26T08:30:00+09:00')).weekend,true);
});
test('Korean sessions stay on the Seoul date and US date mapping survives both DST changes',()=>{
 assert.equal(briefingTarget('kr',new Date('2026-10-23T21:30:00+09:00')).sessionDate,'2026-10-23');
 for(const date of ['2026-03-10','2026-11-03']){
  const expected=new Date(`${date}T00:00:00Z`);expected.setUTCDate(expected.getUTCDate()-1);
  assert.equal(briefingTarget('us',new Date(`${date}T08:30:00+09:00`)).sessionDate,expected.toISOString().slice(0,10));
 }
 assert.equal(briefingTarget('kr',new Date('2026-10-23T21:29:00+09:00')).beforeScheduledTime,true);
 assert.equal(briefingTarget('kr',new Date('2026-10-23T21:30:00+09:00')).beforeScheduledTime,false);
 assert.equal(briefingTarget('us',new Date('2026-10-23T08:30:00+09:00')).calendarRequired,true);
});
