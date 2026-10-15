import {userDb} from '@/lib/server/session';
import {economyError} from '@/lib/server/economy';
import Link from '@/components/I18n';
import {getI18n} from '@/lib/i18n/server';
import {economyText} from '@/lib/economy/messages';
import {bookmarks,economicEvents,readerState} from '@/lib/server/economy';
import {indicators} from '@/lib/economy/catalog';
import FavoriteList from './FavoriteList';
import EventList from './EventList';
import styles from './economy.module.css';
export default async function ReaderOverview(){
 const {locale}=await getI18n(),e=(k:Parameters<typeof economyText>[1])=>economyText(locale,k);
 const [saved,state,events,count]=await Promise.all([bookmarks(),readerState(),economicEvents({saved:true}),(async()=>{const r=await (await userDb()).from('space_bookmarks').select('id',{count:'exact',head:true});economyError(r.error);return r.count||0;})()]);
 return <section className={styles.card} aria-label={e('library')}><h2>{e('library')}</h2><p>{e('readerIntro')}</p>
 <div className={styles.miniStats}><Link className={styles.chip} href="/mypage/bookmarks">{e('library')}<strong>{count}</strong></Link><Link className={styles.chip} href="/following">{e('feed')} →</Link><Link className={styles.chip} href="/mypage/following">{e('manage')}<strong>{(state?.spaces.length||0)+(state?.topics.length||0)}</strong></Link><Link className={styles.chip} href="/mypage/events">{e('myEvents')}<strong>{state?.events.length||0}</strong></Link></div>
 {saved.items.slice(0,3).map(b=><p key={b.id}><Link href="/mypage/bookmarks">{b.post?.title||e('unavailable')}</Link></p>)}
 <h3>{e('favorites')}</h3><FavoriteList items={(state?.favorites||[]).map(f=>indicators.find(i=>i.slug===f.indicator_slug)!).filter(Boolean)}/>
 <h3>{e('upcoming')}</h3><EventList events={events.slice(0,3)} savedIds={state?.events} signedIn/>
 </section>;
}
