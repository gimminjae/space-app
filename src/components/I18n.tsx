'use client';
import { i18n } from '@/lib/i18n';
import { localizePath,type Locale } from '@/lib/i18n/routing';
import Link from 'next/link';
import { usePathname,useRouter,useSearchParams } from 'next/navigation';
import type { ComponentProps } from 'react';
import { createContext,useContext,useEffect,useState } from 'react';
const Context=createContext<Locale>('ko');
export function I18nProvider({locale,children}:{locale:Locale;children:React.ReactNode}){return <Context.Provider value={locale}>{children}</Context.Provider>;}
export function useI18n(){return i18n(useContext(Context));}
export default function LocaleLink({href,...props}:ComponentProps<typeof Link>){const {l}=useI18n();return <Link {...props} href={typeof href==='string'?l(href):{...href,pathname:l(href.pathname||'/')}}/>;}
export function useLocaleRouter(){const router=useRouter(),{l}=useI18n();return {...router,push:(path:string)=>router.push(l(path)),replace:(path:string)=>router.replace(l(path))};}
export function LanguageSwitcher({path,alternatePath}:{path:string;alternatePath?:string}){const {locale,t}=useI18n(),pathname=usePathname(),search=useSearchParams();const [currentPath,setCurrentPath]=useState(path);useEffect(()=>{setCurrentPath(pathname+(search.size?'?'+search.toString():'')+window.location.hash);},[pathname,search]);return <div className="language-switcher" role="group" aria-label={t('언어 선택')}>{(['ko','en'] as const).map(value=><a key={value} href={localizePath(value!==locale&&alternatePath?alternatePath:currentPath,value)} hrefLang={value} lang={value} aria-current={locale===value?'true':undefined} onClick={e=>{const event=new Event('space:before-language-change',{cancelable:true});if(!window.dispatchEvent(event)){e.preventDefault();return;}e.currentTarget.href=localizePath(value!==locale&&alternatePath?alternatePath:window.location.pathname+window.location.search+window.location.hash,value);}}>{value==='ko'?'한국어':'EN'}</a>)}</div>;}
