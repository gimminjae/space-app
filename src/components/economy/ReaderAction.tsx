'use client';
import {useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {Bookmark,Check,Plus,Star,CalendarPlus} from 'lucide-react';
import {useReader} from './use-reader';
import styles from './economy.module.css';
type Props={kind:'bookmark'|'space'|'topic'|'indicator'|'event';id:string;active?:boolean;bookmarkId?:string|null;signedIn:boolean;disabled?:boolean};
export default function ReaderAction({kind,id,active=false,bookmarkId=null,signedIn,disabled}:Props){const {e,l,request}=useReader(),router=useRouter(),path=usePathname();const [on,setOn]=useState(active),[savedId,setSavedId]=useState(bookmarkId),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const label=kind==='bookmark'?(on?e('saved'):e('save')):kind==='indicator'?(on?e('favorited'):e('favorite')):kind==='event'?(on?e('savedEvent'):e('saveEvent')):(on?e('following'):e('follow'));
 async function toggle(){if(!signedIn){router.push(l('/login')+'?next='+encodeURIComponent(path));return;}if(kind==='bookmark'&&on&&!window.confirm(e('deleteBookmark')))return;setBusy(true);setError('');try{if(kind==='bookmark'){if(on)await request('/api/bookmarks/'+savedId,'DELETE');else{const r=await request('/api/bookmarks','POST',{post_id:id});setSavedId(r.bookmark.id);}}else{const base=kind==='space'?'/api/follows/spaces/':kind==='topic'?'/api/follows/topics/':kind==='indicator'?'/api/indicator-favorites/':'/api/event-saves/';await request(base+encodeURIComponent(id),on?'DELETE':'PUT');}setOn(!on);setMessage(e('changed'));router.refresh();}catch(err){setError(err instanceof Error?err.message:e('error'));}finally{setBusy(false);}}
 return <span><button type="button" className={styles.button} aria-pressed={on} disabled={busy||disabled} onClick={toggle}>{on?<Check size={15}/>:kind==='bookmark'?<Bookmark size={15}/>:kind==='indicator'?<Star size={15}/>:kind==='event'?<CalendarPlus size={15}/>:<Plus size={15}/>} {busy?e('working'):label}</button><span className="sr-only" role="status">{message}</span>{error&&<span role="alert" className={styles.error}>{error}</span>}</span>;
}
