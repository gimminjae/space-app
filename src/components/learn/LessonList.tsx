import Link from '@/components/I18n';
import { courseText, lessons, readingTime, type Lesson } from '@/lib/learn';
import type { Locale } from '@/lib/i18n/routing';
import styles from './learn.module.css';

export function LessonList({ locale, items = lessons }: { locale: Locale; items?: Lesson[] }) {
  return <ol className={styles.list}>
    {items.map(lesson => <li key={lesson.slug} value={lesson.order}>
      <Link href={`/learn/${lesson.slug}`} className={styles.lesson}>
        <span className={styles.number} aria-hidden="true">{String(lesson.order).padStart(2, '0')}</span>
        <div>
          <p className={styles.meta}>{locale === 'ko' ? `${lesson.order}편` : `Lesson ${lesson.order}`} · {readingTime(lesson, locale)}</p>
          <h3>{lesson[locale].title}</h3>
          <p className={styles.summary}>{lesson[locale].summary}</p>
          <span className={styles.topics}>{lesson[locale].tags.join(' · ')}</span>
        </div>
        <span className={styles.arrow} aria-hidden="true">↗</span>
      </Link>
    </li>)}
  </ol>;
}

export function CourseShelf({ locale }: { locale: Locale }) {
  const text = courseText[locale];
  return <section id="lessons-preview" className={styles.shelf} aria-labelledby="course-title">
    <div className={styles.shelfHeading}>
      <div><p className={styles.kicker}>THE FIRST CHAPTER</p><h2 id="course-title">{text.name}</h2><p>{text.count} · {text.time}</p></div>
      <Link className={styles.textLink} href="/learn">{text.contents} <span aria-hidden="true">→</span></Link>
    </div>
    <LessonList locale={locale} items={lessons.slice(0, 3)} />
  </section>;
}
