import { etfArticles, etfContent, etfPath, etfPublishedAt, etfText } from './etf';
import { absolute, xmlEscape as esc } from './site';
import { localizePath, type Locale } from './i18n/routing';
import { markdownHtml } from './markdown-html';
export async function etfFeedItems(locale: Locale) {
  return Promise.all(etfArticles.map(async article => {
    const url = absolute(etfPath(article.slug, locale)), edition = article[locale];
    const body = etfContent(article.slug, locale).replace(/\]\((\/[^)]+)\)/g, (_, path) => `](${absolute(path)})`);
    return `<item><title>${esc(edition.title)}</title><link>${esc(url)}</link><guid isPermaLink="true">${esc(url)}</guid><pubDate>${new Date(etfPublishedAt).toUTCString()}</pubDate><category>ETF</category><description>${esc(edition.summary)}</description><content:encoded>${esc(await markdownHtml(body))}</content:encoded></item>`;
  }));
}
export async function etfFeed(locale: Locale) { return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${esc(etfText[locale].name)}</title><link>${esc(absolute(localizePath('/category/etf',locale)))}</link><description>${esc(etfText[locale].summary)}</description><language>${locale}</language>${(await etfFeedItems(locale)).join('')}</channel></rss>`; }
