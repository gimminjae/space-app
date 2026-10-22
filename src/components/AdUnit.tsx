'use client';
import Script from 'next/script';
import { useRef } from 'react';
import styles from './advertising.module.css';
export default function AdUnit({client,slot,label}:{client:string;slot:string;label:string}) {
 const element=useRef<HTMLModElement>(null),requested=useRef(false);
 function requestAd() {
  if(!element.current||requested.current||element.current.dataset.adsbygoogleStatus)return;
  requested.current=true;
  const adsWindow=window as Window & {adsbygoogle?:object[]};
  (adsWindow.adsbygoogle=adsWindow.adsbygoogle||[]).push({});
 }
 return <aside className={styles.advertisement} aria-label={label}>
  <span className={styles.label}>{label}</span>
  <ins ref={element} className="adsbygoogle" style={{display:'block'}} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/>
  <Script id="space-adsense" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} crossOrigin="anonymous" strategy="afterInteractive" onReady={requestAd}/>
 </aside>;
}
