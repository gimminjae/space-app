import manifest from '../../content/etf/manifest.json';
import articles from '../../content/etf/articles.generated.json';
import { localizePath, type Locale } from './i18n/routing';
export const etfArticles = manifest.articles;
export type EtfArticle = (typeof etfArticles)[number];
export const etfPublishedAt = manifest.publishedAt;
export const etfUpdatedAt = manifest.updatedAt;
export const etfText = {
  ko: { name: 'ETF를 읽는 시간', label: 'ETF', title: 'ETF 소개와 비교: 배당·커버드콜·글로벌 인컴', summary: 'SCHD부터 JEPI, QQQI와 국내 월분배 ETF까지. 운용 구조, 비용, 분배금과 위험을 함께 읽는 ETF 연재 17편.', introduction: '통장에 들어오는 분배금 뒤에는 서로 다른 투자 방식이 있습니다. 기업의 배당을 모으는 상품, 상승 가능성 일부를 옵션 프리미엄과 맞바꾸는 상품, 다른 ETF를 담는 상품. 이름이 비슷한 ETF의 차이를 한 편씩 읽어봅니다.', contents: '전체 ETF 글', previous: '이전 글', next: '다음 글', notice: '일반적인 금융 교육을 위한 글입니다. 분배금은 확정 이자가 아니며 원금 손실이 발생할 수 있습니다. 개인별 매수·매도 추천을 제공하지 않습니다.' },
  en: { name: 'Reading an ETF', label: 'ETF', title: 'ETF Guides: Dividends, Covered Calls, and Global Income', summary: 'Seventeen ETF guides covering SCHD, JEPI, QQQI and Korean income funds. Read strategies, costs, distributions and risks together.', introduction: 'Behind every distribution is an investment decision. Some funds collect company dividends, some trade a portion of future upside for option premiums, and others invest in a basket of ETFs. These seventeen articles explain what you actually own.', contents: 'All ETF articles', previous: 'Previous article', next: 'Next article', notice: 'General financial education, not a personal recommendation to buy or sell. Distributions are not guaranteed interest, and invested capital can fall in value.' },
} as const;
export function etfPath(slug: string, locale: Locale = 'ko') { return localizePath(`/etf/${slug}`, locale); }
export function getEtf(slug: string) { return etfArticles.find(article => article.slug === slug); }
export function etfContent(slug: string, locale: Locale) { return (articles as Record<string, Record<Locale, string>>)[slug]?.[locale] ?? ''; }
export function etfReadingTime(article: EtfArticle, locale: Locale) { return `${article[locale].readingMinutes}${locale === 'ko' ? '분 읽기' : ' min read'}`; }
export function searchEtf(query: string, locale: Locale) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return etfArticles.filter(article => terms.every(term => `${article[locale].title} ${article[locale].summary} ${etfContent(article.slug, locale)}`.toLocaleLowerCase().includes(term)));
}
