import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';
import {localizePath,isLocale,isSharedPath} from '../src/lib/i18n/routing';
import {i18n,translator,formatDate} from '../src/lib/i18n';
import en from '../src/lib/i18n/en.json';
import {defaultCategories} from '../src/lib/default-categories';
test('locale URLs preserve queries, fragments and original Korean links without changing service or external URLs',()=>{
 assert.equal(localizePath('/search?q=%EA%B8%88%EB%A6%AC&page=2#results','en'),'/en/search?q=%EA%B8%88%EB%A6%AC&page=2#results');
 assert.equal(localizePath('/en/s/my-space/posts/my-post?preview=1','ko'),'/s/my-space/posts/my-post?preview=1');
 assert.equal(localizePath('/en','ko'),'/');
 assert.equal(localizePath('/en/about','en'),'/en/about');
 assert.equal(localizePath('/ko/about','en'),'/en/about');
 for(const path of ['/api/auth','/auth/confirm?token_hash=abc','/media/123','/og.png','/feed.xml','#heading','https://example.com','//example.com'])assert.equal(localizePath(path,'en'),path);
 assert.equal(isSharedPath('/apiary'),false);assert.equal(isLocale('fr'),false);assert.equal(isLocale('__proto__'),false);
});
test('translation preserves member content and only localizes untouched default categories',()=>{
 assert.equal(translator('en')('로그인'),'Sign in');assert.equal(translator('ko')('로그인'),'로그인');
 assert.equal(translator('en')('{count}개의 글',{count:12}),'12 posts');
 assert.equal(translator('en')('내가 작성한 경제 이야기'),'내가 작성한 경제 이야기');
 assert.equal(i18n('en').category(defaultCategories[0]).name,'Economic basics');
 const custom={...defaultCategories[0],name:'내 경제 기록'};
 assert.deepEqual(i18n('en').category(custom),custom);
 assert.equal(formatDate('2026-10-15T00:00:00Z','en'),'Oct 15, 2026');
 assert.match(formatDate('2026-10-15T00:00:00Z','ko'),/2026/);
});
test('every UI translation key and server error has an English translation with matching placeholders',()=>{
 function files(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]);}
 for(const file of files('src').filter(f=>/\.tsx?$/.test(f)&&!f.includes('/i18n/'))){
  const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  function visit(node:ts.Node){
   if(ts.isCallExpression(node)&&node.expression.getText(source)==='t'&&ts.isStringLiteral(node.arguments[0]))assert.ok(Object.hasOwn(en,node.arguments[0].text),`${file}: missing translation: ${node.arguments[0].text}`);
   if(file.includes('/api/')||file.includes('/lib/server/')||file.endsWith('/validation.ts'))if(ts.isStringLiteral(node)&&/[가-힣]/.test(node.text))assert.ok(Object.hasOwn(en,node.text),`${file}: untranslated server message`);
   if(ts.isJsxText(node))assert.ok(!/[가-힣]/.test(node.text),`${file}: untranslated JSX text`);
   ts.forEachChild(node,visit);
  }visit(source);
 }
 for(const [key,value]of Object.entries(en)){
  assert.ok(value.trim(),`Empty translation: ${key}`);
  assert.deepEqual([...key.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),[...value.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),key);
 }
});
