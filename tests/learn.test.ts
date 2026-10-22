import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { lessons, lessonContent, lessonImages, lessonPath, searchLessons, courseFeedPath } from '../src/lib/learn';
import { courseFeed } from '../src/lib/learn-feed';

test('every published lesson has a complete pair of editions and real assets', () => {
  assert.equal(lessons.length, 10);
  assert.equal(new Set(lessons.map(lesson => lesson.slug)).size, 10);
  let figures = 0;
  for (const [index, lesson] of lessons.entries()) {
    assert.equal(lesson.order, index + 1);
    for (const locale of ['ko', 'en'] as const) {
      const edition = lesson[locale], content = lessonContent(lesson.slug, locale);
      assert.ok(content.length > 2500, `${lesson.slug}/${locale} has the full manuscript`);
      assert.doesNotMatch(content, /^# /m, 'page provides the sole h1');
      assert.doesNotMatch(content, /\]\((?:\.\.?\/|[^)]*\.md(?:#|\)))/, 'no local Markdown links');
      assert.ok(edition.seoTitle && edition.summary && edition.tags.length);
      assert.ok(edition.readingMinutes[0] >= 5 && edition.readingMinutes[1] <= 15);
      assert.ok(existsSync(resolve('public', edition.ogImage.slice(1))), edition.ogImage);
      for (const source of lesson.sources) assert.ok(content.includes(source), `source preserved: ${source}`);
      for (const image of lessonImages(lesson.slug, locale)) {
        assert.ok(existsSync(resolve('public', image.slice(1))), image);
        figures++;
      }
    }
  }
  assert.equal(figures, 8);
});

test('lesson paths and search keep the actual language of the manuscript', () => {
  assert.equal(courseFeedPath('en'), '/en/learn/feed.xml');
  assert.equal(courseFeedPath('ko'), '/learn/feed.xml');
  assert.equal(lessonPath('inside-an-etf'), '/learn/inside-an-etf');
  assert.equal(lessonPath('inside-an-etf', 'en'), '/en/learn/inside-an-etf');
  assert.ok(searchLessons('현금흐름', 'ko').some(lesson => lesson.order === 1));
  assert.ok(searchLessons('compound interest', 'en').some(lesson => lesson.order === 2));
  assert.equal(searchLessons('zzzz-no-such-lesson', 'en').length, 0);
});

test('each RSS language has all ten complete editions and absolute asset URLs', async () => {
  for (const locale of ['ko', 'en'] as const) {
    const xml = await courseFeed(locale);
    assert.equal((xml.match(/<item>/g) || []).length, 10);
    assert.ok(xml.includes(`<language>${locale}</language>`));
    for (const lesson of lessons) assert.ok(xml.includes(lessonPath(lesson.slug, locale)));
    assert.ok(xml.includes('https://space.service.io.kr/learn-assets/'));
    assert.doesNotMatch(xml, /\.md["<)]/);
  }
});
