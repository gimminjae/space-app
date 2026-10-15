import ReaderOverview from '@/components/economy/ReaderOverview';
import Link from '@/components/I18n';
import AdminLogout from '@/components/AdminLogout';
import ProfileForm from '@/components/ProfileForm';
import styles from '@/components/account.module.css';
import { getI18n, localizedMetadata } from '@/lib/i18n/server';
import { displayNameOf } from '@/lib/profile';
import { accountOverview } from '@/lib/server/account';
import { currentUser } from '@/lib/server/session';
import { ArrowUpRight, KeyRound, Plus, Settings2 } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const { t, locale } = await getI18n();
  return localizedMetadata({ title: t('마이페이지'), robots: { index: false, follow: false, nocache: true } }, locale);
}

export default async function MyPage() {
  const { t, l, date, number } = await getI18n();
  const user = await currentUser();
  if (!user) redirect(l('/login'));
  const { space, publicCount, privateCount, recentPosts } = await accountOverview();
  const name = displayNameOf(user.user_metadata);
  const stats = [
    { label: t('전체 글'), count: publicCount + privateCount, href: '/admin', key: 'all' },
    { label: t('공개 글'), count: publicCount, href: '/admin?status=public', key: 'public' },
    { label: t('비공개 글'), count: privateCount, href: '/admin?status=private', key: 'private' },
  ];

  return <div className={styles.page}>
    <div className={styles.pageHead}>
      <div><p className="eyebrow">YOUR SPACE, AT A GLANCE</p><h1>{t('마이페이지')}</h1>
        <p>{name ? t('{name}님, 오늘의 생각을 기록해 보세요.', { name }) : t('나의 계정과 공간을 한눈에 관리하세요.')}</p></div>
      <Link href={space ? '/admin/new' : '/onboarding'} className="button"><Plus size={17} />{space ? t('새 글 쓰기') : t('나의 공간 만들기')}</Link>
    </div>

    <div className={styles.columns}>
      <aside className={styles.sidebar}>
        <section className={styles.panel} aria-labelledby="profile-title">
          <div className={styles.avatar} aria-hidden="true">{Array.from(name || space?.name || 'S')[0].toUpperCase()}</div>
          <h2 id="profile-title">{t('내 프로필')}</h2>
          <dl className={styles.details}><div><dt>{t('이메일')}</dt><dd>{user.email}</dd></div>
            <div><dt>{t('가입일')}</dt><dd><time dateTime={user.created_at}>{date(user.created_at)}</time></dd></div></dl>
          <ProfileForm initialName={name} />
        </section>
        <section className={styles.panel} aria-labelledby="account-title">
          <h2 id="account-title">{t('계정 관리')}</h2>
          <div className={styles.accountActions}>
            <Link href="/account/password"><KeyRound size={16} />{t('비밀번호 변경')}<ArrowUpRight size={16} /></Link>
            <AdminLogout />
          </div>
        </section>
      </aside>

      <div className={styles.content}>
        <ReaderOverview/>
        <section className={styles.spaceCard} aria-labelledby="space-title">
          <p className="eyebrow">MY JOURNAL</p>
          <h2 id="space-title">{space ? space.name : t('아직 나의 공간이 없습니다.')}</h2>
          <p>{space ? space.description || t('나만의 시선과 이야기를 담는 공간입니다.') : t('공간 이름과 소개를 정하면 첫 글을 쓸 수 있습니다.')}</p>
          <div className={styles.spaceLinks}>{space ? <>
            <Link href={`/s/${space.slug}`}>{t('내 공간 보기 ↗')}</Link>
            <Link href="/admin/settings"><Settings2 size={16} />{t('공간 설정')}</Link>
            <Link href="/admin/taxonomy">{t('카테고리·태그')}</Link>
          </> : <Link href="/onboarding">{t('나의 공간 만들기')}<ArrowUpRight size={16} /></Link>}</div>
        </section>

        <section className={styles.stats} aria-label={t('나의 글 현황')}>
          {stats.map(stat => <Link key={stat.key} href={space ? stat.href : '/onboarding'} className={styles.stat}>
            <span>{stat.label}</span><strong data-stat={stat.key}>{number(stat.count)}</strong><ArrowUpRight size={16} aria-hidden="true" />
          </Link>)}
        </section>

        <section className={styles.panel} aria-labelledby="recent-title">
          <div className={styles.sectionHead}><h2 id="recent-title">{t('최근 작성한 글')}</h2>{space && <Link href="/admin">{t('전체 글 관리')}<ArrowUpRight size={15} /></Link>}</div>
          {recentPosts.length ? <ul className={styles.recentList}>{recentPosts.map(post => <li key={post.id}>
            <Link href={`/admin/edit/${post.id}`}><span className={styles.postTitle}>{post.title}</span>
              <span className={styles.postMeta}><span className={post.status === 'public' ? styles.public : styles.private}>{post.status === 'public' ? t('공개') : t('비공개')}</span>
                <time dateTime={post.updated_at}>{date(post.updated_at)}</time><ArrowUpRight size={15} /></span></Link>
          </li>)}</ul> : <div className={styles.empty}><h3>{t('아직 작성한 글이 없습니다.')}</h3><p>{t('첫 번째 이야기를 비공개로 작성해 보세요.')}</p>
            <Link href={space ? '/admin/new' : '/onboarding'}>{space ? t('새 글 쓰기 →') : t('나의 공간 만들기')}</Link></div>}
        </section>
      </div>
    </div>
  </div>;
}
