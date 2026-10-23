import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {Children,isValidElement,type ReactNode} from 'react';
import {slugify} from '@/lib/site';
import {getI18n} from '@/lib/i18n/server';
function textOf(node:ReactNode):string{return Children.toArray(node).map(child=>typeof child==='string'||typeof child==='number'?String(child):isValidElement<{children?:ReactNode}>(child)?textOf(child.props.children):'').join('');}
export default async function Markdown({content,anchors={},userGenerated=false}:{content:string;anchors?:Record<string,string>;userGenerated?:boolean}){
 const {t,locale}=await getI18n();let i=0;
 return <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={{
  h1:({children})=>{const text=textOf(children),index=i++;return <h2 id={anchors[text]||`${slugify(text)}-${index}`}>{children}</h2>;},
  h2:({children})=>{const text=textOf(children),index=i++;return <h2 id={anchors[text]||`${slugify(text)}-${index}`}>{children}</h2>;},
  a:({href,children})=><a href={href} rel={href?.startsWith('http')?(userGenerated?'ugc nofollow noopener noreferrer':'noopener noreferrer'):undefined}>{children}</a>,
  img:({src,alt})=>typeof src==='string'&&(/^(?:https:\/\/|\/media\/|\/publication-assets\/)/.test(src)||/^\/(?:learn|etf|briefing)-assets\/[a-z0-9.-]+\.(?:png|svg)$/.test(src))
   ? src.startsWith('/etf-assets/')?<a className="figure-link" href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={alt||''} loading="lazy" decoding="async" width={1400} height={880}/><span>{locale==='ko'?'그림 크게 보기 (새 창)':'View full-size figure (new tab)'} ↗</span></a>
    :<img src={src} alt={alt||''} loading="lazy" decoding="async" referrerPolicy="no-referrer" {...(src.startsWith('/learn-assets/')?{width:1400,height:880}:{})}/>
   :<span className="external-image">{alt||t('이미지')}</span>,
  table:({children})=><div className="table-scroll"><table>{children}</table></div>,
 }}>{content}</ReactMarkdown></div>;
}
