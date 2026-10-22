import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePage,pageExists,pagePath } from '../src/lib/pagination';
import { adConfiguration } from '../src/lib/advertising';
test('pagination rejects crawl traps and keeps the first page canonical',()=>{
 assert.equal(parsePage(undefined),1);assert.equal(parsePage('2'),2);
 for(const value of ['0','-1','1.5','Infinity','999999','abc','','01',['1','2']])assert.equal(parsePage(value),null);
 assert.equal(pageExists(1,0),true);assert.equal(pageExists(2,9),false);assert.equal(pageExists(2,10),true);
 assert.equal(pagePath('/',1),'/');assert.equal(pagePath('/category/basics',2),'/category/basics?page=2');
 assert.equal(pagePath('/search',1,{q:'interest rates'}),'/search?q=interest+rates');
});
test('ads require activation, consent readiness and a real unit identifier',()=>{
 const ready={ADSENSE_CLIENT_ID:'ca-pub-4493633870090510',ADSENSE_ARTICLE_SLOT:'1234567890',ADSENSE_ENABLED:'true',ADSENSE_CONSENT_READY:'true'};
 assert.deepEqual(adConfiguration(ready),{client:ready.ADSENSE_CLIENT_ID,slot:ready.ADSENSE_ARTICLE_SLOT});
 for(const key of Object.keys(ready))assert.equal(adConfiguration({...ready,[key]:undefined}),null);
 assert.equal(adConfiguration({...ready,ADSENSE_ENABLED:'false'}),null);
 assert.equal(adConfiguration({...ready,ADSENSE_ARTICLE_SLOT:'placeholder'}),null);
});
