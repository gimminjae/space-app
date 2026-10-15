'use client';
import {useRef,useState} from 'react';
import Link from '@/components/I18n';
import type {EconomicEvent} from '@/lib/economy/types';
import {eventDay} from '@/lib/economy/utils';
import {useReader} from './use-reader';
import styles from './economy.module.css';
export default function CalendarGrid({month,events}:{month:string;events:EconomicEvent[]}){
 const {locale}=useReader(),start=new Date(month+'-01T12:00:00Z'),days=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate();
 const [focused,setFocused]=useState(0),cells=useRef<(HTMLDivElement|null)[]>([]);
 function move(index:number,key:string){const weekday=(start.getUTCDay()+index)%7;const next=key==='ArrowRight'?index+1:key==='ArrowLeft'?index-1:key==='ArrowDown'?index+7:key==='ArrowUp'?index-7:key==='Home'?index-weekday:key==='End'?index+6-weekday:index;const bounded=Math.max(0,Math.min(days-1,next));setFocused(bounded);cells.current[bounded]?.focus();}
 return <div className={styles.calendar} role="group" aria-label={month}>
 {Array.from({length:7},(_,i)=><div className={styles.dayHead} key={'w'+i}>{new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,0,4+i)))}</div>)}
 {Array.from({length:start.getUTCDay()},(_,i)=><div className={styles.day} key={'blank'+i} aria-hidden="true"/>)}
 {Array.from({length:days},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0');return <div ref={element=>{cells.current[i]=element;}} className={styles.day} key={date} tabIndex={focused===i?0:-1} aria-label={date} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();move(i,event.key);}}}><time dateTime={date}>{i+1}</time>{events.filter(ev=>eventDay(ev)===date).map(ev=><Link key={ev.id} href={'/calendar/'+ev.id}>{ev.country} · {ev[locale].name}</Link>)}</div>;})}</div>;
}
