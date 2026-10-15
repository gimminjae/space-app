import Link from 'next/link';
import {publicSpaces} from '@/lib/server/spaces';
import {absolute} from '@/lib/site';
import styles from '@/components/member.module.css';
export const metadata={title:'공간 둘러보기',description:'서로 다른 시선으로 경제를 읽는 회원들의 공간을 만나 보세요.',alternates:{canonical:absolute('/spaces')}};
export default async function Spaces(){const spaces=await publicSpaces();return <section className={styles.directory}><p className="eyebrow">MANY VOICES, NEW PERSPECTIVES</p><div className={styles.heading}><div><h1>각자의 시선이 모이는 공간</h1><p>관심 있는 이야기를 발견하고, 나만의 기록도 시작해 보세요.</p></div><Link href="/admin" className="button">나의 공간 만들기 ↗</Link></div><div className={styles.grid}>{spaces.map(s=><Link className={`${styles.card} ${styles[s.accent]}`} href={`/s/${s.slug}`} key={s.id}><small>space / {s.slug}</small><h2>{s.name}</h2><p>{s.description||'새로운 이야기를 준비하고 있습니다.'}</p><span>공간 둘러보기 →</span></Link>)}</div>{!spaces.length&&<div className={styles.empty}><h2>첫 번째 공간의 주인공이 되어 보세요.</h2><p>회원가입 후 나만의 주소로 글을 발행할 수 있습니다.</p><Link href="/signup">시작하기 →</Link></div>}</section>;}
