import ReaderNav from './economy/ReaderNav';
import Link,{ LanguageSwitcher } from '@/components/I18n';
import { getI18n } from '@/lib/i18n/server';
import { currentUser } from '@/lib/server/session';
import { ArrowRight,ArrowUpRight,Search } from 'lucide-react';
import { headers } from 'next/headers';
import styles from './site.module.css';
export async function Header() {const {t}=await getI18n();const user=await currentUser();return <><a className="skip" href="#main">{t("본문으로 이동")}</a><header className={styles.header}><Link href="/" aria-label={t("space 홈")} className={styles.logo}>space<span>●</span></Link><nav aria-label={t("주 메뉴")}><Link href="/">{t("아티클")}</Link><Link href="/spaces">{t("공간 둘러보기")}</Link><Link href={user?"/mypage":"/login"}>{user?t("마이페이지"):t("로그인")}</Link></nav><LanguageSwitcher path={(await headers()).get('x-space-path')||'/'}/><Link className={styles.searchIcon} href="/search" aria-label={t("글 검색")}><Search size={20}/></Link></header><ReaderNav/></>;}
export async function Footer() {const {t}=await getI18n();return <footer className={styles.footer}><div><Link href="/" className={styles.logo}>space<span>●</span></Link><p>{t("세상을 읽는 시선, 일상을 바꾸는 이해.")}</p></div><div className={styles.footerLinks}><Link href="/about">{t("소개")}{" "}<ArrowUpRight size={14}/></Link><Link href="/privacy">{t("개인정보처리방침")}</Link><Link href="/data-terms">{t("데이터 이용 안내")}</Link><a href="/feed.xml">RSS</a><Link href="/mypage">{t("마이페이지")}</Link></div><small>© {new Date().getFullYear()} {" "}{t("space. 모든 글은 정보 제공을 목적으로 합니다.")}</small></footer>;}
export async function ArrowLink({href,children}:{href:string;children:React.ReactNode}) {return <Link className={styles.arrowLink} href={href}>{children}<ArrowRight size={17}/></Link>;}
