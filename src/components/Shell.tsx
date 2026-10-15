import Link from 'next/link';
import { ArrowUpRight, Search, ArrowRight } from 'lucide-react';
import styles from './site.module.css';
export function Header() {return <><a className="skip" href="#main">본문으로 이동</a><header className={styles.header}><Link href="/" aria-label="space 홈" className={styles.logo}>space<span>●</span></Link><nav aria-label="주 메뉴"><Link href="/">아티클</Link><Link href="/about">space 소개</Link></nav><Link className={styles.searchIcon} href="/search" aria-label="글 검색"><Search size={20}/></Link></header></>;}
export function Footer() {return <footer className={styles.footer}><div><Link href="/" className={styles.logo}>space<span>●</span></Link><p>세상을 읽는 시선, 일상을 바꾸는 이해.</p></div><div className={styles.footerLinks}><Link href="/about">소개 <ArrowUpRight size={14}/></Link><Link href="/privacy">개인정보처리방침</Link><a href="/feed.xml">RSS</a><Link href="/admin">관리</Link></div><small>© {new Date().getFullYear()} space. 모든 글은 정보 제공을 목적으로 합니다.</small></footer>;}
export function ArrowLink({href,children}:{href:string;children:React.ReactNode}) {return <Link className={styles.arrowLink} href={href}>{children}<ArrowRight size={17}/></Link>;}
