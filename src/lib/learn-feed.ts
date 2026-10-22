import { courseText, lessons, lessonContent, lessonPath, publishedAt } from './learn';
import { absolute, xmlEscape as esc } from './site';
import type { Locale } from './i18n/routing';
import { markdownHtml } from './markdown-html';

export async function lessonFeedItems(locale: Locale) {
  return Promise.all(lessons.map(async lesson => {
    const edition = lesson[locale];
    const url = absolute(lessonPath(lesson.slug, locale));
    const content = lessonContent(lesson.slug, locale).replace(/\]\((\/[^)]+)\)/g, (_, path) => `](${absolute(path)})`);
    return `<item><title>${esc(edition.title)}</title><link>${esc(url)}</link><guid isPermaLink="true">${esc(url)}</guid><pubDate>${new Date(publishedAt).toUTCString()}</pubDate><description>${esc(edition.summary)}</description><content:encoded>${esc(await markdownHtml(content))}</content:encoded></item>`;
  }));
}

export async function courseFeed(locale: Locale) {
  const text = courseText[locale];
  const items = await lessonFeedItems(locale);
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${esc(text.name)}</title><link>${esc(absolute(locale === 'en' ? '/en/learn' : '/learn'))}</link><description>${esc(text.summary)}</description><language>${locale}</language>${items.join('')}</channel></rss>`;
}
