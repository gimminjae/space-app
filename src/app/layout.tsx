import { I18nProvider } from '@/components/I18n';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { site } from '@/lib/site';
import './globals.css';
export async function generateMetadata(){const {t,locale,absolute}=await getI18n();return localizedMetadata({metadataBase:new URL(site.url),title:{default:`space — ${t(site.title)}`,template:'%s | space'},description:t(site.description),applicationName:'space',openGraph:{type:'website',locale:'ko_KR',siteName:'space',title:t(site.title),description:t(site.description),images:[absolute('/og.png')]},twitter:{card:'summary_large_image'},verification:{google:process.env.GOOGLE_SITE_VERIFICATION,other:process.env.NAVER_SITE_VERIFICATION?{'naver-site-verification':process.env.NAVER_SITE_VERIFICATION}:undefined},other:process.env.ADSENSE_CLIENT_ID?{'google-adsense-account':process.env.ADSENSE_CLIENT_ID}:undefined},locale);}
export default async function RootLayout({children}:{children:React.ReactNode}) {const {locale}=await getI18n();return <html lang={locale} data-scroll-behavior="smooth"><body><I18nProvider locale={locale}>{children}</I18nProvider></body></html>;}
