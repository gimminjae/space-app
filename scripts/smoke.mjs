// Read-only production checks plus rejected requests without administrator credentials.
import assert from 'node:assert/strict';

const origin = new URL(process.argv[2] || 'https://space.service.io.kr').origin;
const requestOrigin = new URL(process.argv[3] || origin).origin;
const results = [];
async function check(path, status, inspect, init) {
  const response = await fetch(`${origin}${path}`, {
    redirect: 'manual', signal: AbortSignal.timeout(30000), ...init,
  });
  const body = await response.text();
  assert.equal(response.status, status, `${path}: expected ${status}, got ${response.status}`);
  if (inspect) inspect(body, response);
  results.push({path, status: response.status, result: 'passed'});
}

await check('/', 200, (html, response) => {
  assert.match(html, /<html[^>]*lang="ko"/);
  assert.match(html, /rel="canonical" href="https:\/\/space\.service\.io\.kr\/?"/);
  assert.match(html, /name="google-adsense-account" content="ca-pub-4493633870090510"/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});
await check('/about', 200);
await check('/privacy', 200);
await check('/category/basics', 200);
await check('/search?q=%EA%B8%88%EB%A6%AC', 200, html => assert.match(html, /name="robots" content="noindex/));
await check('/admin', 200, html => assert.match(html, /name="robots" content="noindex/));
await check('/posts/nonexistent-space-smoke-test', 404);
await check('/media/not-a-valid-id', 404);
await check('/sitemap.xml', 200, (xml, response) => {
  assert.match(response.headers.get('content-type'), /xml/);
  assert.match(xml, /https:\/\/space\.service\.io\.kr/);
  assert.doesNotMatch(xml, /\/admin/);
});
await check('/robots.txt', 200, text => assert.match(text, /Sitemap: https:\/\/space\.service\.io\.kr\/sitemap.xml/));
await check('/feed.xml', 200, text => assert.match(text, /<rss/));
await check('/ads.txt', 200, text => assert.equal(text.trim(), 'google.com, pub-4493633870090510, DIRECT, f08c47fec0942fa0'));
await check('/api/admin/posts', 403, undefined, {
  method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}',
});
await check('/api/admin/posts', 401, undefined, {
  method: 'POST', headers: {'Content-Type': 'application/json', Origin: requestOrigin}, body: '{}',
});
await check('/api/admin/uploads', 401, undefined, {method: 'POST', headers: {Origin: requestOrigin}});
console.log(JSON.stringify({origin, checkedAt: new Date().toISOString(), results}, null, 2));
