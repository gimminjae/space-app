import manifest from '../../content/etf/manifest.json';
import articles from '../../content/etf/articles.generated.json';
import { localizePath, type Locale } from './i18n/routing';
export const etfArticles = manifest.articles;
export type EtfArticle = (typeof etfArticles)[number];
export const etfPublishedAt = manifest.publishedAt;
export const etfUpdatedAt = manifest.updatedAt;
export const etfText = {
  ko: { name: 'ETF를 읽는 시간', label: 'ETF', title: 'ETF 소개와 비교: 배당·커버드콜·글로벌 인컴', summary: 'SCHD부터 JEPI, QQQI와 국내 월분배 ETF까지. 투자금별 분배금과 월 현금 목표에 필요한 투자금을 계산하고, 운용 구조·비용·위험을 함께 읽는 17편.', introduction: '천만 원을 넣으면 한 달에 얼마를 받을까. 월 50만 원을 바라보려면 얼마가 필요할까. 공식 분배 자료로 현금 규모를 먼저 계산한 뒤, 그 돈을 만드는 기업과 옵션, 투자 방식을 한 편씩 읽어봅니다.', contents: '전체 ETF 글', previous: '이전 글', next: '다음 글', notice: '일반적인 금융 교육을 위한 글입니다. 분배금은 확정 이자가 아니며 원금 손실이 발생할 수 있습니다. 개인별 매수·매도 추천을 제공하지 않습니다.' },
  en: { name: 'Reading an ETF', label: 'ETF', title: 'ETF Guides: Dividends, Covered Calls, and Global Income', summary: 'Seventeen guides to SCHD, JEPI, QQQI and Korean income ETFs, with cash-flow examples, required capital, strategies, costs and risks.', introduction: 'How much monthly cash could an investment provide? How much capital would an income target require? Start with examples calculated from official distribution data, then explore the companies, options and investment decisions behind the payments.', contents: 'All ETF articles', previous: 'Previous article', next: 'Next article', notice: 'General financial education, not a personal recommendation to buy or sell. Distributions are not guaranteed interest, and invested capital can fall in value.' },
} as const;
export function etfPath(slug: string, locale: Locale = 'ko') { return localizePath(`/etf/${slug}`, locale); }
export function getEtf(slug: string) { return etfArticles.find(article => article.slug === slug); }
export function etfContent(slug: string, locale: Locale) { return (articles as Record<string, Record<Locale, string>>)[slug]?.[locale] ?? ''; }
export function etfReadingTime(article: EtfArticle, locale: Locale) { return `${article[locale].readingMinutes}${locale === 'ko' ? '분 읽기' : ' min read'}`; }
export function searchEtf(query: string, locale: Locale) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return etfArticles.filter(article => terms.every(term => `${article[locale].title} ${article[locale].summary} ${etfContent(article.slug, locale)}`.toLocaleLowerCase().includes(term)));
}
