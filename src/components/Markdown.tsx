import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {slugify} from '@/lib/site';
import type {ReactNode} from 'react';
function textOf(node:ReactNode):string {if(typeof node==='string'||typeof node==='number')return String(node); if(Array.isArray(node))return node.map(textOf).join(''); if(node&&typeof node==='object'&&'props' in node)return textOf((node.props as {children:ReactNode}).children);return '';}
export default function Markdown({content}:{content:string}) {let i=0;return <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={{h2:({children})=><h2 id={`${slugify(textOf(children))}-${i++}`}>{children}</h2>,h3:({children})=><h3>{children}</h3>,a:({href,children})=><a href={href} rel={href?.startsWith('http')?'noopener noreferrer':undefined}>{children}</a>,img:({src,alt})=>(typeof src==='string' && src.startsWith('/media/'))?<img src={src} alt={alt||''} loading="lazy"/>:<span className="external-image">{alt||'이미지'} (이미지를 업로드해 삽입해 주세요)</span>,table:({children})=><div className="table-scroll"><table>{children}</table></div>}}>{content}</ReactMarkdown></div>;}
