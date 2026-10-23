import 'server-only';
import {db} from './db';
import {getPublication} from './publications';
import {isLocale} from '../i18n/routing';
import type {PublicationKind} from '../publication';
export async function publicationDownload(kind:string,locale:string,file:string){
 if(!['etf','lesson','article'].includes(kind)||!isLocale(locale)||!file.endsWith('.md'))return new Response(null,{status:404});
 const doc=await getPublication(kind as PublicationKind,file.slice(0,-3),locale);if(!doc)return new Response(null,{status:404});
 const sources=doc.origin==='open'&&doc.metadata.sources?.length?`\n\n## ${locale==='ko'?'참고 자료':'Sources'}\n${doc.metadata.sources.map(s=>`- ${s}`).join('\n')}`:'';
 return new Response(`# ${doc.title}\n\n${doc.content}${sources}\n`,{headers:{'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="article.md"; filename*=UTF-8''${encodeURIComponent(doc.slug)}.${locale}.md`,'Cache-Control':'no-store','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'}});
}
export async function publicationAsset(folder:'learn-assets'|'etf-assets',file:string){
 if(!/^[a-z0-9][a-z0-9.-]*\.(?:png|svg|jpg|webp)$/i.test(file)||file.includes('..'))return new Response(null,{status:404});
 const {data,error}=await db(true).storage.from(process.env.SUPABASE_PUBLICATION_BUCKET||'space-publication-assets').download(`${folder}/${file}`);
 if(error){return new Response(null,{status:error.message.toLowerCase().includes('not found')||String((error as {statusCode?:string}).statusCode)==='404'?404:503,headers:{'Cache-Control':'no-store'}});}
 const type=file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'image/jpeg';
 return new Response(data,{headers:{'Content-Type':type,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff',...(type==='image/svg+xml'?{'Content-Security-Policy':"sandbox; default-src 'none'; style-src 'unsafe-inline'"}:{})}});
}
