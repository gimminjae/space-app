import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:3000',origin=process.argv[3]||base,canonicalOrigin=process.env.SITE_URL||'https://space.service.io.kr',checks=[];
function check(name,pass){assert.ok(pass,name);checks.push(name);console.log('PASS',name);}
for(const [locale,prefix]of [['ko',''],['en','/en']]){
 for(const path of ['/','/about','/privacy','/spaces','/login','/signup','/forgot-password','/search?q=rates&page=2','/category/basics']){
  const route=prefix+(path==='/'?'':path)||'/',response=await fetch(base+route,{headers:{'x-space-locale':locale==='en'?'ko':'en','Cookie':`space_locale=${locale==='en'?'ko':'en'}`}}),html=await response.text();
  check(`${locale} ${path} server language`,response.status===200&&html.includes(`<html lang="${locale}"`)&&response.headers.get('content-language')===locale);
  check(`${locale} ${path} navigation`,html.includes(`href="${prefix}/spaces"`));
  if(path==='/'){
   check(`${locale} homepage text`,html.includes(locale==='en'?'Time to understand,':'경제를 읽는 시간,'));
   check(`${locale} alternate languages`,html.includes('hrefLang="ko"')&&html.includes('hrefLang="en"'));
   check(`${locale} canonical`,new URL(html.match(/rel="canonical" href="([^"]+)"/)?.[1]||'about:blank').href===new URL(prefix||'/',canonicalOrigin).href);
  }
  if(path.startsWith('/search'))check(`${locale} search preserves language`,html.includes(`action="${prefix}/search"`)&&html.includes(`${prefix}/search?q=rates&amp;page=2`));
  if(path==='/signup')check(`${locale} signup gate unchanged`,html.includes(locale==='en'?'Email verification is being prepared.':'이메일 인증 서비스를 준비하고 있습니다.'));
 }
 const studio=await fetch(base+prefix+'/admin',{redirect:'manual'});check(`${locale} studio redirect`,studio.status===307&&studio.headers.get('location')?.includes(prefix+'/login'));
 const error=await fetch(base+'/api/auth',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-space-language':locale},body:JSON.stringify({action:'login'})});const body=await error.json();check(`${locale} API validation`,error.status===400&&body.error===(locale==='en'?'Please enter your email address.':'이메일을 입력해 주세요.'));
 const missing=await fetch(base+prefix+'/missing-i18n-test');const html=await missing.text();check(`${locale} 404 translation`,html.includes(locale==='en'?'This page is not available.':'이 페이지는 비어 있습니다.')&&html.includes(`<html lang="${locale}"`));
}
const canonical=await fetch(base+'/ko/about?q=one',{redirect:'manual'});check('explicit Korean prefix canonicalizes',canonical.status===308&&canonical.headers.get('location')?.endsWith('/about?q=one'));
const sitemap=await (await fetch(base+'/sitemap.xml')).text();check('sitemap contains both languages',sitemap.includes(canonicalOrigin+'/en/about')&&sitemap.includes('hreflang="ko"')&&sitemap.includes('hreflang="en"'));
await writeFile(process.env.SPACE_I18N_REPORT||'docs/i18n-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),target:base,total:checks.length,checks},null,2)+'\n');console.log(`Verified ${checks.length} i18n checks.`);
