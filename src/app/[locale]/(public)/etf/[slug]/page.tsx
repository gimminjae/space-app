import Ads from '@/components/Ads';
import Link from '@/components/I18n';
import Markdown from '@/components/Markdown';
import styles from '@/components/site.module.css';
import learnStyles from '@/components/learn/learn.module.css';
import { etfText as courseText, getEtf as getLesson, etfContent as lessonContent, etfArticles as lessons, etfPath as lessonPath, etfPublishedAt as publishedAt, etfUpdatedAt as updatedAt, etfReadingTime as readingTime } from '@/lib/etf';
const courseFeedPath = (locale: string) => locale === 'en' ? '/en/etf/feed.xml' : '/etf/feed.xml';
import { localizePath } from '@/lib/i18n/routing';
import { getI18n, localizedMetadata } from '@/lib/i18n/server';
import { slugify, absolute as siteAbsolute } from '@/lib/site';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, absolute } = await getI18n();
  const lesson = getLesson((await params).slug);
  if (!lesson) notFound();
  const edition = lesson[locale];
  const url = absolute(lessonPath(lesson.slug));
  return localizedMetadata({
    title: edition.seoTitle, description: edition.summary,
    alternates: { canonical: url, types: { 'application/rss+xml': siteAbsolute(courseFeedPath(locale)) } },
    authors: [{ name: 'space', url: absolute('/about') }],
    openGraph: { type: 'article', title: edition.title, description: edition.summary, url, siteName: 'space', publishedTime: publishedAt, modifiedTime: updatedAt, authors: [absolute('/about')], section: courseText[locale].title, tags: edition.tags, images: [{ url: absolute(edition.ogImage), width: 1200, height: 630, alt: edition.title }] },
    twitter: { card: 'summary_large_image', title: edition.title, description: edition.summary, images: [absolute(edition.ogImage)] },
  }, locale);
}

export default async function LessonPage({ params }: Props) {
  const { locale, absolute, date, t } = await getI18n();
  const lesson = getLesson((await params).slug);
  if (!lesson) notFound();
  const edition = lesson[locale], text = courseText[locale];
  const content = lessonContent(lesson.slug, locale);
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map((match, index) => ({ text: match[1].replace(/[*_`]/g, ''), id: `${slugify(match[1].replace(/[*_`]/g, ''))}-${index}` }));
  const previous = lessons[lesson.order - 2], next = lessons[lesson.order];
  const url = absolute(lessonPath(lesson.slug));
  const otherLocale = locale === 'ko' ? 'en' : 'ko';
  const structured = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': `${url}#article`, url, mainEntityOfPage: url, headline: edition.title, description: edition.summary, inLanguage: locale, datePublished: publishedAt, dateModified: updatedAt,
      author: { '@type': 'Organization', name: 'space', url: absolute('/about') }, publisher: { '@type': 'Organization', name: 'space', url: absolute('/') },
      image: [absolute(edition.ogImage)], articleSection: text.title, keywords: edition.tags.join(', '), isPartOf: { '@id': absolute('/category/etf#series'), '@type': 'CreativeWorkSeries', name: text.name, url: absolute('/category/etf') } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'space', item: absolute('/') }, { '@type': 'ListItem', position: 2, name: text.label, item: absolute('/category/etf') }, { '@type': 'ListItem', position: 3, name: edition.title, item: url }] },
  ] };
  return <article className={styles.article}>
    <header className={styles.articleHeader}>
      <nav aria-label={locale === 'ko' ? '현재 위치' : 'Breadcrumb'} className={styles.breadcrumb}><Link href="/">space</Link><span>/</span><Link href="/category/etf">{text.label}</Link><span>/</span><span>{locale === 'ko' ? `${lesson.order}편` : `Article ${lesson.order}`}</span></nav>
      <p className={learnStyles.kicker}>{text.name} · {String(lesson.order).padStart(2, '0')} / 17</p>
      <h1>{edition.title}</h1>
      <p className={styles.articleSummary}>{edition.summary}</p>
      <div className={styles.articleMeta}><Link href="/about">space</Link><time dateTime={publishedAt}>{date(publishedAt)}</time><span>{readingTime(lesson, locale)}</span></div>
      <div className={learnStyles.language}><Link href="/category/etf">{text.contents}</Link><a href={localizePath(lessonPath(lesson.slug), otherLocale)} hrefLang={otherLocale} lang={otherLocale}>{otherLocale === 'en' ? 'Read in English' : '한국어로 읽기'}</a></div>
    </header>
    <div className={styles.articleBody}>
      <nav aria-label={t('이 글의 순서')} className={styles.toc}><strong>{t('이 글의 순서')}</strong>{headings.map(heading => <a href={`#${heading.id}`} key={heading.id}>{heading.text}</a>)}</nav>
      <div className={styles.articleContent}>
        <Markdown content={content} /><p><a href={`/etf-files/${locale}/${lesson.slug}.md`} download>{locale === 'ko' ? 'Markdown 파일 받기' : 'Download Markdown'}</a></p>
        <div className={learnStyles.articleTags} aria-label={locale === 'ko' ? '다루는 주제' : 'Topics'}>{edition.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        <nav className={learnStyles.navigation} aria-label={locale === 'ko' ? 'ETF 이어 읽기' : 'Continue the series'}>
          {previous && <Link href={lessonPath(previous.slug)}><span>{text.previous}</span>{previous[locale].title}</Link>}
          {next && <Link href={lessonPath(next.slug)}><span>{text.next}</span>{next[locale].title}</Link>}
          <Link href="/category/etf" className={learnStyles.fullWidth}>{text.contents} <span>{text.name}</span></Link>
        </nav>
        <footer className={learnStyles.editorial}><strong><Link href="/about">space</Link></strong><p>{text.notice}</p><p>{t('최종 수정')} <time dateTime={updatedAt}>{date(updatedAt)}</time> · <a href={siteAbsolute(courseFeedPath(locale))}>RSS</a></p></footer>
        <Ads/>
      </div>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
  </article>;
}
