import { getI18n } from '@/lib/i18n/server';
import { slugify } from '@/lib/site';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
function textOf(node:ReactNode):string {if(typeof node==='string'||typeof node==='number')return String(node); if(Array.isArray(node))return node.map(textOf).join(''); if(node&&typeof node==='object'&&'props' in node)return textOf((node.props as {children:ReactNode}).children);return '';}
export default async function Markdown({content}:{content:string}) {const {t}=await getI18n();let i=0;return <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={{h2:({children})=><h2 id={`${slugify(textOf(children))}-${i++}`}>{children}</h2>,h3:({children})=><h3>{children}</h3>,a:({href,children})=><a href={href} rel={href?.startsWith('http')?'noopener noreferrer':undefined}>{children}</a>,img:({src,alt})=>(typeof src==='string' && (src.startsWith('/media/') || /^\/learn-assets\/[a-z0-9.-]+\.png$/.test(src)))?<img src={src} alt={alt||''} loading="lazy" decoding="async" {...(src.startsWith('/learn-assets/')?{width:1400,height:880}:{})}/>:<span className="external-image">{alt||t("이미지")} {" "}{t("(이미지를 업로드해 삽입해 주세요)")}</span>,table:({children})=><div className="table-scroll"><table>{children}</table></div>}}>{content}</ReactMarkdown></div>;}
