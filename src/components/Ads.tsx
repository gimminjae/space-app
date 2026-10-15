import Script from 'next/script';
export default function Ads() {const id=process.env.ADSENSE_CLIENT_ID;if(process.env.ADSENSE_ENABLED!=='true'||!id||!/^ca-pub-\d{16}$/.test(id))return null;return <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${id}`} crossOrigin="anonymous" strategy="afterInteractive"/>;}
