import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const origin = new URL(process.argv[2] || 'http://127.0.0.1:3180').origin;
const canonicalOrigin = 'https://space.service.io.kr';
const manifest = JSON.parse(await readFile(new URL('../content/learn/manifest.json', import.meta.url), 'utf8'));
const results = [];
const images = new Set();
const requests = manifest.chapters.flatMap(lesson => ['ko', 'en'].map(locale => ({ lesson, locale })));
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
function tag(html, element, attribute, value) {
  return [...html.matchAll(new RegExp(`<${element}\\b[^>]*>`, 'gi'))].map(match => match[0]).find(valueTag => new RegExp(`${attribute}="${value}"`, 'i').test(valueTag));
}
async function get(path) {
  const response = await fetch(origin + path, { signal: AbortSignal.timeout(45000), redirect: 'manual', headers: { 'User-Agent': 'Googlebot' } });
  assert.equal(response.status, 200, path);
  return response;
}
for (let offset = 0; offset < requests.length; offset += 4) {
  await Promise.all(requests.slice(offset, offset + 4).map(async ({ lesson, locale }) => {
    const path = `${locale === 'en' ? '/en' : ''}/learn/${lesson.slug}`;
    const response = await get(path), html = await response.text();
    assert.equal(response.headers.get('content-language'), locale, path);
    assert.match(html, new RegExp(`<html[^>]*lang="${locale}"`));
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, path);
    assert.ok(decode(html).includes(lesson[locale].title), path);
    assert.ok(decode(html).includes(lesson[locale].seoTitle), path);
    assert.ok(decode(tag(html, 'meta', 'name', 'description')).includes(lesson[locale].summary), path);
    assert.ok(tag(html, 'link', 'rel', 'canonical')?.includes(`href="${canonicalOrigin}${path}"`), path);
    const rss = [...html.matchAll(/<link\b[^>]*>/g)].find(match => match[0].includes('type="application/rss+xml"'))?.[0];
    assert.ok(rss?.includes(`href="${canonicalOrigin}${locale === 'en' ? '/en' : ''}/learn/feed.xml"`), path);
    for (const other of ['ko', 'en']) {
      const expected = `${canonicalOrigin}${other === 'en' ? '/en' : ''}/learn/${lesson.slug}`;
      assert.ok(tag(html, 'link', 'hreflang', other)?.includes(`href="${expected}"`), path);
    }
    assert.doesNotMatch(tag(html, 'meta', 'name', 'robots') || '', /noindex/i);
    const nodes = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(match => {
      const data = JSON.parse(match[1]); return data['@graph'] || [data];
    });
    const article = nodes.find(node => node['@type'] === 'Article');
    assert.equal(article?.headline, lesson[locale].title, path);
    assert.equal(article?.inLanguage, locale, path);
    assert.equal(article?.mainEntityOfPage, canonicalOrigin + path, path);
    assert.ok(nodes.some(node => node['@type'] === 'BreadcrumbList'), path);
    assert.doesNotMatch(html, /href="[^"\s]*\.md(?:#|"|\?)/);
    for (const source of lesson.sources) assert.ok(decode(html).includes(`href="${source}"`), source);
    const content = html.match(/<div class="prose">([\s\S]*?)<\/article>/)?.[1] || '';
    assert.ok(content.length > 4000, `SSR manuscript missing: ${path}`);
    const figures = [...content.matchAll(/<img[^>]*src="(\/learn-assets\/[^\"]+)"[^>]*>/g)];
    figures.forEach(match => { assert.match(match[0], /alt="[^"]+"/); images.add(match[1]); });
    images.add(lesson[locale].ogImage);
    results.push({ path, status: response.status, locale, figures: figures.length, result: 'passed' });
  }));
}
for (const locale of ['ko', 'en']) {
  const path = `${locale === 'en' ? '/en' : ''}/learn`;
  const html = await (await get(path)).text();
  for (const lesson of manifest.chapters) assert.ok(html.includes(`href="${path}/${lesson.slug}"`));
  assert.ok(tag(html, 'link', 'rel', 'canonical')?.includes(`href="${canonicalOrigin}${path}"`));
  images.add(`/learn-assets/series.${locale}.og.png`);
  const feedResponse = await get(`${locale === 'en' ? '/en' : ''}/learn/feed.xml`);
  assert.equal(feedResponse.headers.get('content-language'), locale);
  const feed = await feedResponse.text();
  assert.equal((feed.match(/<item>/g) || []).length, 10);
  assert.ok(feed.includes(`<language>${locale}</language>`));
  const oppositeCookie = await fetch(origin + `${locale === 'en' ? '/en' : ''}/learn/feed.xml`, { headers: { Cookie: `space_locale=${locale === 'en' ? 'ko' : 'en'}` } });
  assert.equal(oppositeCookie.headers.get('content-language'), locale);
  assert.ok((await oppositeCookie.text()).includes(`<language>${locale}</language>`));
  const home = await (await get(locale === 'en' ? '/en' : '/')).text();
  assert.ok(home.includes(`href="${path}"`));
  const query = locale === 'en' ? 'compound interest' : '현금흐름';
  const search = await (await get(`${locale === 'en' ? '/en' : ''}/search?q=${encodeURIComponent(query)}`)).text();
  assert.ok(search.includes(`href="${path}/${locale === 'en' ? 'interest-and-time' : 'a-map-of-your-money'}"`));
  assert.match(tag(search, 'meta', 'name', 'robots'), /noindex/);
  results.push({ path, result: 'passed', checks: ['ten lessons', 'canonical', 'RSS', 'home link', 'search'] });
}
const sitemap = await (await get('/sitemap.xml')).text();
for (const { lesson, locale } of requests) assert.ok(sitemap.includes(`<loc>${canonicalOrigin}${locale === 'en' ? '/en' : ''}/learn/${lesson.slug}</loc>`));
for (const path of images) { const response = await get(path); assert.match(response.headers.get('content-type'), /image\/png/); assert.ok((await response.arrayBuffer()).byteLength > 1000); }
const missing = await fetch(origin + '/learn/no-such-lesson', { redirect: 'manual', headers: { 'User-Agent': 'Googlebot' } });
assert.equal(missing.status, 404);
const robots = await (await get('/robots.txt')).text();
assert.ok(robots.includes(`${canonicalOrigin}/sitemap.xml`));
const globalFeed = await (await get('/feed.xml')).text();
for (const lesson of manifest.chapters) assert.ok(globalFeed.includes(`/learn/${lesson.slug}`));
const report = { origin, checkedAt: new Date().toISOString(), lessons: 20, hubPages: 2, imageFiles: images.size, sitemap: 'passed', robots: 'passed', globalRSS: 'passed', missingPage: 404, results: results.sort((a, b) => a.path.localeCompare(b.path)) };
if (process.argv[3]) await writeFile(process.argv[3], JSON.stringify(report, null, 2) + '\n');
console.log(`Passed: 20 editions, 2 hubs, ${images.size} images, search, feeds, metadata, language pairs, sitemap, and 404.`);
