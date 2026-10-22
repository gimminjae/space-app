import { absolute as siteAbsolute } from '@/lib/site';
import Link from '@/components/I18n';
import { LessonList } from '@/components/learn/LessonList';
import styles from '@/components/learn/learn.module.css';
import { courseText, courseFeedPath, lessons, lessonPath, updatedAt } from '@/lib/learn';
import { getI18n, localizedMetadata } from '@/lib/i18n/server';

export async function generateMetadata() {
  const { locale, absolute } = await getI18n();
  const text = courseText[locale];
  return localizedMetadata({
    title: text.title, description: text.summary,
    alternates: { canonical: absolute('/learn'), types: { 'application/rss+xml': siteAbsolute(courseFeedPath(locale)) } },
    openGraph: { type: 'website', title: text.name, description: text.summary, url: absolute('/learn'), images: [{ url: absolute(`/learn-assets/series.${locale}.og.png`), width: 1200, height: 630, alt: text.name }] },
    twitter: { card: 'summary_large_image', title: text.name, description: text.summary, images: [absolute(`/learn-assets/series.${locale}.og.png`)] },
  }, locale);
}

export default async function Learn() {
  const { locale, absolute, date, t } = await getI18n();
  const text = courseText[locale];
  const structured = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': absolute('/learn'), name: text.title, description: text.summary, inLanguage: locale, url: absolute('/learn'), mainEntity: { '@id': absolute('/learn#lessons') } },
    { '@type': 'CreativeWorkSeries', '@id': absolute('/learn#series'), name: text.name, url: absolute('/learn'), inLanguage: locale, publisher: { '@type': 'Organization', name: 'space', url: absolute('/') } },
    { '@type': 'ItemList', '@id': absolute('/learn#lessons'), numberOfItems: lessons.length, itemListElement: lessons.map(lesson => ({ '@type': 'ListItem', position: lesson.order, name: lesson[locale].title, url: absolute(lessonPath(lesson.slug, locale)) })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'space', item: absolute('/') }, { '@type': 'ListItem', position: 2, name: text.label, item: absolute('/learn') }] },
  ] };
  return <div className={styles.hub}>
    <header className={styles.intro}>
      <p className={styles.kicker}>ECONOMICS · MONEY · INVESTING</p>
      <Link href="/">space</Link><span aria-hidden="true"> / </span><span>{text.label}</span>
      <h1>{text.name}</h1>
      <p className={styles.lede}>{text.introduction}</p>
      <div className={styles.introActions}><Link className="button" href={lessonPath(lessons[0].slug)}>{text.start} <span aria-hidden="true">→</span></Link><span>{text.count} · {text.time}</span></div>
    </header>
    <section aria-labelledby="lessons"><h2 id="lessons" className={styles.contentsHeading}>{text.contents}</h2><LessonList locale={locale} /></section>
    <section className={styles.editorial}><h2>{text.sources}</h2><p>{text.editorial}</p><p>{text.notice}</p><p>{t('최종 수정')} {date(updatedAt)} · <Link href="/about">{locale === 'ko' ? 'space 소개' : 'About space'}</Link></p></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
  </div>;
}
