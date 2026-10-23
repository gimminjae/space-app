'use client';
import {useRef,useState,type FormEvent} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {translator} from '@/lib/i18n';
import type {Locale} from '@/lib/i18n/routing';
import styles from './writer.module.css';
export default function OpenWriter({locale}:{locale:Locale}){
 const t=translator(locale),ko=locale==='ko',key=useRef<string|null>(null);
 const [category,setCategory]=useState(''),[sessionDate,setSessionDate]=useState('');
 const [language,setLanguage]=useState<Locale>(locale),[kind,setKind]=useState('article'),[title,setTitle]=useState(''),[slug,setSlug]=useState(''),[author,setAuthor]=useState(''),[summary,setSummary]=useState(''),[content,setContent]=useState(''),[tags,setTags]=useState(''),[sources,setSources]=useState('');
 const [preview,setPreview]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<{url:string;locale:string}[]>([]);
 function changed(){key.current=null;setResult([]);setError('');}
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');key.current||=crypto.randomUUID();
  try{
   const response=await fetch('/api/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,...(kind==='article'&&category?{category,sessionDate}:slug?{slug}:{}),idempotencyKey:key.current,editions:[{locale:language,title,author:author||(ko?'기고자':'Contributor'),summary,content,tags:tags.split(',').map(v=>v.trim()).filter(Boolean),sources:sources.split('\n').map(v=>v.trim()).filter(Boolean)}]})});
   const data=await response.json();if(!response.ok){setError(t(data.error||'Publication failed.'));return;}setResult(data.articles);
  }catch{setError(ko?'연결을 확인해 주세요. 다시 누르면 같은 요청으로 재시도합니다.':'Check the connection. Submitting again retries the same request.');}finally{setBusy(false);}
 }
 return <div className={styles.writer}><form onSubmit={submit} onChange={changed}><fieldset disabled={busy} className={styles.fields}>
  <div className={styles.row}><label>{ko?'글 종류':'Collection'}<select value={kind} onChange={e=>setKind(e.target.value)}><option value="article">{ko?'아티클':'Article'}</option><option value="etf">ETF</option><option value="lesson">{ko?'입문 강의':'Learn'}</option></select></label><label>{ko?'글 언어':'Language'}<select value={language} onChange={e=>setLanguage(e.target.value as Locale)}><option value="ko">{'한국어'}</option><option value="en">English</option></select></label></div>
  {kind==='article'&&<div className={styles.row}><label>{ko?'카테고리':'Category'}<select name="category" value={category} onChange={e=>setCategory(e.target.value)}><option value="">{ko?'일반 아티클':'General article'}</option><option value="us-market-briefing">{ko?'미장 브리핑':'US Market Briefing'}</option><option value="kr-market-briefing">{ko?'한국장 브리핑':'Korea Market Briefing'}</option></select></label>{category&&<label>{ko?'현지 거래일':'Local trading date'}<input type="date" name="sessionDate" required value={sessionDate} onChange={e=>setSessionDate(e.target.value)}/></label>}</div>}
  <label>{ko?'제목':'Title'}<input name="title" required minLength={2} maxLength={150} value={title} onChange={e=>setTitle(e.target.value)}/></label>
  <div className={styles.row}><label>{ko?'작성자 / 필명':'Author / pen name'}<input name="author" maxLength={80} value={author} onChange={e=>setAuthor(e.target.value)}/></label><label>{ko?'글 주소 (선택)':'URL slug (optional)'}<input name="slug" disabled={kind==='article'&&!!category} placeholder="my-article" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={slug} onChange={e=>setSlug(e.target.value)}/><small>{ko?'영문 소문자·숫자·하이픈. 비워두면 자동 생성됩니다.':'Lowercase letters, numbers and hyphens. Leave blank to generate.'}</small></label></div>
  <label>{ko?'요약':'Summary'}<textarea name="summary" rows={3} maxLength={500} value={summary} onChange={e=>setSummary(e.target.value)}/></label>
  <label>{ko?'본문 (Markdown)':'Body (Markdown)'}<textarea name="content" required minLength={80} maxLength={200000} rows={20} className={styles.markdown} value={content} onChange={e=>setContent(e.target.value)} placeholder={ko?'## 첫 번째 소제목\n\n본문과 출처를 작성하세요.':'## First section\n\nWrite the article and cite your sources.'}/><small>{ko?'80자 이상. 제목은 위 입력란에 작성하세요. 표·목록·HTTPS 이미지 링크를 사용할 수 있습니다.':'At least 80 characters. Put the title in the field above. Tables, lists and HTTPS image links are supported.'}</small></label>
  <label>{ko?'태그 (쉼표로 구분)':'Tags (comma-separated)'}<input name="tags" value={tags} maxLength={480} onChange={e=>setTags(e.target.value)} placeholder={ko?'경제, 금리, ETF':'Economics, Interest rates, ETFs'}/></label>
  <label>{ko?'출처 URL (한 줄에 하나, 선택)':'Source URLs (one per line, optional)'}<textarea name="sources" rows={3} value={sources} onChange={e=>setSources(e.target.value)} placeholder="https://..."/></label>
  <div className={styles.actions}><button type="button" className="button" onClick={()=>setPreview(!preview)}>{preview?(ko?'미리보기 닫기':'Close preview'):(ko?'미리보기':'Preview')}</button><button type="submit" className="button primary" disabled={busy||result.length>0}>{busy?(ko?'발행 중…':'Publishing…'):(ko?'바로 발행':'Publish now')}</button></div>
 </fieldset>{error&&<p role="alert" className={styles.error}>{error}</p>}{result.length>0&&<div role="status" data-testid="publish-success" className={styles.success}><strong>{ko?'공개되었습니다.':'Published.'}</strong>{result.map(item=><p key={item.locale}><a href={item.url}>{ko?'발행된 글 보기':'Read published article'} → {item.url}</a></p>)}</div>}</form>
 {preview&&<section aria-label={ko?'본문 미리보기':'Article preview'} className={styles.preview}><h2>{title}</h2><div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown></div></section>}</div>;
}
