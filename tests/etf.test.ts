import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { etfArticles, etfContent, etfPath, searchEtf } from '../src/lib/etf';
import { etfFeed } from '../src/lib/etf-feed';
import { contentOnly, isPersonalServicePath } from '../src/lib/platform-mode';

test('all 17 distinct originals have complete bilingual editions and downloadable assets', () => {
  assert.equal(etfArticles.length,17);
  assert.equal(new Set(etfArticles.map(a=>a.originalUrl)).size,17);
  assert.equal(new Set(etfArticles.map(a=>a.slug)).size,17);
  for(const [i,a] of etfArticles.entries()) {
    assert.equal(a.order,i+1);
    for(const locale of ['ko','en'] as const) {
      const edition=a[locale],body=etfContent(a.slug,locale);
      assert.ok(edition.readingMinutes>=5&&edition.readingMinutes<=15);
      assert.ok(edition.characterCount>2000);
      if(locale==='en')assert.ok(edition.wordCount>600,`${a.slug} is a full English article`);
      assert.doesNotMatch(body,/^# /m);
      assert.ok(body.includes(a.originalUrl));
      for(const url of a.sources)assert.ok(body.includes(url),url);
      assert.match(body,/\|.+\|/);
      assert.ok(existsSync(resolve('public',edition.ogImage.slice(1))));
      for(const image of body.matchAll(/!\[[^\]]+\]\(([^)]+)\)/g))assert.ok(existsSync(resolve('public',image[1].slice(1))));
      const download=readFileSync(resolve('public/etf-files',locale,`${a.slug}.md`),'utf8');
      assert.equal(download,`# ${edition.title}\n\n${body}`);
    }
  }
});

test('ETF search and feeds expose the correct language and every published article',async()=>{
  assert.equal(etfPath('schd','en'),'/en/etf/schd');
  assert.ok(searchEtf('0018C0','ko').some(a=>a.slug==='plus-fixed-covered-call'));
  assert.ok(searchEtf('equity-linked','en').some(a=>a.slug==='jepi'));
  assert.equal(searchEtf('no-such-etf-zzzz','ko').length,0);
  for(const locale of ['ko','en'] as const){
    const xml=await etfFeed(locale);
    assert.equal((xml.match(/<item>/g)||[]).length,17);
    assert.ok(xml.includes(`<language>${locale}</language>`));
    assert.ok(xml.includes('https://space.service.io.kr/etf-assets/'));
    for(const a of etfArticles)assert.ok(xml.includes(etfPath(a.slug,locale)));
  }
});

test('content-only mode closes personal entry points including locale and encoded variants',()=>{
  assert.equal(contentOnly,true);
  for(const prefix of ['','/en','/ko'])for(const path of ['/login','/signup','/forgot-password','/onboarding','/mypage','/admin/posts','/account','/spaces','/s/example','/auth/callback','/api/auth','/%6cogin']){
    assert.equal(isPersonalServicePath(prefix+path),true,prefix+path);
  }
  for(const path of ['/','/en','/learn','/category/etf','/etf/schd','/en/etf/schd','/search','/etf-assets/split.ko.svg','/etf-files/ko/schd.md'])assert.equal(isPersonalServicePath(path),false,path);
});
