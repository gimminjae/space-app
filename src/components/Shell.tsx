import Link,{ LanguageSwitcher } from '@/components/I18n';
import { getI18n } from '@/lib/i18n/server';
import { ArrowRight,Search } from 'lucide-react';
import { headers } from 'next/headers';
import styles from './site.module.css';
import {getPublication} from '@/lib/server/publications';
import {collectionPath,type PublicationKind} from '@/lib/publication';
import {publicationNavigation} from '@/lib/server/publication-navigation';
import {unlocalizePath} from '@/lib/i18n/routing';
export async function Header() {const {t,locale}=await getI18n();const navigation=await publicationNavigation(locale);const path=(await headers()).get('x-space-path')||'/';const match=unlocalizePath(path).split('?')[0].match(/^\/(learn|etf|articles)\/([^/]+)$/);let alternatePath:string|undefined;if(match){const kind=({learn:'lesson',etf:'etf',articles:'article'} as Record<string,PublicationKind>)[match[1]];const translated=await getPublication(kind,decodeURIComponent(match[2]),locale==='ko'?'en':'ko');if(!translated)alternatePath=collectionPath(kind);}return <><a className="skip" href="#main">{t("본문으로 이동")}</a><header className={styles.header}><Link href="/" aria-label={t("space 홈")} className={styles.logo}>space<span>●</span></Link><nav aria-label={t("주 메뉴")}>{navigation.header.map(item=><Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><LanguageSwitcher path={path} alternatePath={alternatePath}/><Link className={styles.searchIcon} href="/search" aria-label={t("글 검색")}><Search size={20}/></Link></header></>;}
export async function Footer() {const {t,locale}=await getI18n();const navigation=await publicationNavigation(locale);return <footer className={styles.footer}><div><Link href="/" className={styles.logo}>space<span>●</span></Link><p>{navigation.tagline}</p></div><div className={styles.footerLinks}>{navigation.footer.map(item=><Link key={item.href} href={item.href}>{item.label}</Link>)}</div><small>© {new Date().getFullYear()} {" "}{t("space. 모든 글은 정보 제공을 목적으로 합니다.")}</small></footer>;}
export async function ArrowLink({href,children}:{href:string;children:React.ReactNode}) {return <Link className={styles.arrowLink} href={href}>{children}<ArrowRight size={17}/></Link>;}
