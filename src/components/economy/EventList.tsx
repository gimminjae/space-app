import Link from '@/components/I18n';
import {getI18n} from '@/lib/i18n/server';
import {economyText} from '@/lib/economy/messages';
import {eventDay,eventTime} from '@/lib/economy/utils';
import type {EconomicEvent} from '@/lib/economy/types';
import ReaderAction from './ReaderAction';
import styles from './economy.module.css';
export default async function EventList({events,savedIds=[],signedIn=false}:{events:EconomicEvent[];savedIds?:string[];signedIn?:boolean}){const {locale}=await getI18n(),e=(k:Parameters<typeof economyText>[1])=>economyText(locale,k);return events.length?<div>{events.map(event=><article className={styles.event} key={event.id}><div><div className={styles.date}>{eventDay(event)}</div><div className={styles.muted}>{eventTime(event,locale)}</div></div><div><span className={styles.badge}>{event.country==='KR'?e('korea'):e('usa')}</span><span className={styles.badge}>{e(event.status==='scheduled'?'schedule':event.status)}</span><Link href={'/calendar/'+event.id}><h2>{event[locale].name}</h2></Link>{event.reference_period&&<p className={styles.muted}>{e('reference')}: {event.reference_period}</p>}</div><ReaderAction key={event.id+savedIds.includes(event.id)} kind="event" id={event.id} signedIn={signedIn} active={savedIds.includes(event.id)}/></article>)}</div>:<p className={styles.empty}>{e('emptyEvents')}</p>;}
