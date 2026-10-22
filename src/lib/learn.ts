import manifest from '../../content/learn/manifest.json';
import articles from '../../content/learn/articles.generated.json';
import { localizePath, type Locale } from './i18n/routing';

export const lessons = manifest.chapters;
export type Lesson = (typeof lessons)[number];
export const publishedAt = manifest.publishedAt;
export const updatedAt = manifest.updatedAt;
export const courseText = {
  ko: {
    name: manifest.series.ko,
    title: '경제·재테크·주식 입문 강의',
    summary: '가계부에서 경제 뉴스, 기업의 재무제표와 투자 계획까지. 경제와 투자가 처음인 독자를 위한 10편의 수업을 한국어와 영어로 읽어보세요.',
    introduction: '월급이 들어온 통장을 살펴보는 일에서 시작합니다. 이자와 물가를 지나 기업의 장부를 펼치고, 마지막에는 나에게 맞는 투자 계획을 한 장에 적어봅니다. 앞에서 배운 생각이 다음 글의 바탕이 되도록 순서를 잡았습니다.',
    label: '입문 강의', author: 'space', start: '첫 수업 읽기', contents: '전체 목차',
    time: '편당 약 6–9분', count: '10편의 수업', chapter: '편', previous: '이전 수업', next: '다음 수업',
    sources: '자료와 예제에 관하여',
    editorial: '각 글의 개념 옆에 공공기관의 원문 자료를 연결했습니다. 지윤과 모퉁이빵집은 설명을 위한 가상의 사례이며, 그래프의 수치는 가정을 바탕으로 직접 계산했습니다. 읽기 시간은 표와 계산을 살펴보는 시간을 포함한 추정입니다.',
    notice: '경제와 투자를 이해하기 위한 교육 자료입니다. 개인의 상황에 맞춘 투자 자문이나 특정 상품의 추천을 제공하지 않습니다.',
  },
  en: {
    name: manifest.series.en,
    title: 'Economics, Personal Finance, and Investing for Beginners',
    summary: 'Ten beginner-friendly lessons, from cash flow and economic news to financial statements and an investment plan. Read the complete series in English or Korean.',
    introduction: 'Start with the account that receives your paycheck. Explore interest and inflation, open a company’s financial statements, and finish with a one-page investment plan. Each lesson builds on ideas introduced earlier in the series.',
    label: 'Learn', author: 'space', start: 'Read lesson one', contents: 'All lessons',
    time: 'About 6–9 minutes each', count: '10 lessons', chapter: 'Lesson', previous: 'Previous lesson', next: 'Next lesson',
    sources: 'About the sources and examples',
    editorial: 'Links beside the relevant concepts lead to original public-agency sources. Jiyun and Corner Bakery are fictional examples, and charts are calculated from stated assumptions. Reading times are estimates that include time to examine tables and calculations.',
    notice: 'These lessons provide general financial education. They do not offer personalized investment advice or recommend particular products.',
  },
} as const;

export function lessonPath(slug: string, locale: Locale = 'ko') {
  return localizePath(`/learn/${slug}`, locale);
}
export function getLesson(slug: string) {
  return lessons.find(lesson => lesson.slug === slug);
}
export function lessonContent(slug: string, locale: Locale) {
  return (articles as Record<string, Record<Locale, string>>)[slug]?.[locale] ?? '';
}
export function lessonImages(slug: string, locale: Locale) {
  return [...lessonContent(slug, locale).matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(match => match[1]);
}
export function searchLessons(query: string, locale: Locale) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return lessons.filter(lesson => {
    const edition = lesson[locale];
    const searchable = `${edition.title} ${edition.seoTitle} ${edition.summary} ${edition.tags.join(' ')} ${lessonContent(lesson.slug, locale)}`.toLocaleLowerCase();
    return terms.every(term => searchable.includes(term));
  });
}
export function readingTime(lesson: Lesson, locale: Locale) {
  return `${lesson[locale].readingMinutes.join('–')}${locale === 'ko' ? '분 읽기' : ' min read'}`;
}
