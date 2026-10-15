import type { Metadata } from 'next';
import { site, absolute } from '@/lib/site';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL(site.url),title:{default:`space — ${site.title}`,template:'%s | space'},description:site.description,applicationName:'space',openGraph:{type:'website',locale:'ko_KR',siteName:'space',title:site.title,description:site.description,images:[absolute('/og.png')]},twitter:{card:'summary_large_image'},verification:{google:process.env.GOOGLE_SITE_VERIFICATION,other:process.env.NAVER_SITE_VERIFICATION?{'naver-site-verification':process.env.NAVER_SITE_VERIFICATION}:undefined},other:process.env.ADSENSE_CLIENT_ID?{'google-adsense-account':process.env.ADSENSE_CLIENT_ID}:undefined};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ko" data-scroll-behavior="smooth"><body>{children}</body></html>;}
