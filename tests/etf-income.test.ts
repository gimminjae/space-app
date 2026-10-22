import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { incomeScenario, capitalForIncome } from '../scripts/lib/etf-income.mjs';

const data = JSON.parse(readFileSync('content/etf/income-scenarios.json', 'utf8'));
const fund = (slug: string) => data.funds.find((item: { slug: string }) => item.slug === slug);

test('rate examples retain monthly/quarterly units and do not compound distributions', () => {
  assert.deepEqual(incomeScenario(fund('jepi'), 10000000), { monthly: 67000, quarterly: 201000, annual: 804000 });
  assert.deepEqual(incomeScenario(fund('schd'), 10000000), { monthly: 27000, quarterly: 81000, annual: 324000 });
  assert.equal(incomeScenario(fund('ace-global-income-top10'), 10000000).monthly, 62000);
  assert.equal(capitalForIncome(fund('jepi'), 500000), 74626866);
});

test('whole-share income excludes leftover cash and target capital buys enough shares', () => {
  const plus = incomeScenario(fund('plus-high-dividend'), 10000000);
  assert.deepEqual(plus, { shares: 433, invested: 9984980, remainder: 15020, monthly: 44599, annual: 535188, quarterly: 133797 });
  assert.equal(incomeScenario(fund('rise-200-weekly-covered-call'), 10000000).monthly, 227040);
  assert.equal(incomeScenario(fund('plus-fixed-covered-call'), 10000000).monthly, 130048);
  for (const item of data.funds.filter((item: { method: string }) => item.method === 'shares')) {
    const required = capitalForIncome(item, 500000);
    assert.ok(incomeScenario(item, required).monthly >= 500000);
    assert.ok(incomeScenario(item, required - item.price).monthly < 500000);
  }
});

test('all profiles and comparisons disclose income assumptions in both languages', () => {
  const slugs = [...data.funds.map((item: { slug: string }) => item.slug), ...Object.keys(data.comparisons)];
  assert.equal(slugs.length, 17);
  for (const slug of slugs) for (const locale of ['ko', 'en']) {
    const body = readFileSync(`content/etf/${locale}/${slug}.md`, 'utf8');
    assert.equal(body.split('<!-- income-example:start -->').length, 2);
    assert.ok(body.includes(data.checkedOn));
    assert.ok(body.includes(locale === 'ko' ? '세전' : 'before-tax') || body.includes('gross monthly'));
  }
  assert.match(readFileSync('content/etf/ko/schd.md', 'utf8'), /매달 입금되는 것은 아니다/);
  assert.match(readFileSync('content/etf/en/schd.md', 'utf8'), /pays quarterly/);
});
