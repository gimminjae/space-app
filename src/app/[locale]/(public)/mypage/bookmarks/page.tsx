import {bookmarks,folders,privateReader} from '@/lib/server/economy';
import {getI18n} from '@/lib/i18n/server';
import {economyText} from '@/lib/economy/messages';
import {readerMetadata} from '@/lib/server/reader-metadata';
import BookmarkLibrary from '@/components/economy/BookmarkLibrary';
import styles from '@/components/economy/economy.module.css';
export const dynamic='force-dynamic';
export const generateMetadata=()=>readerMetadata('library','/mypage/bookmarks',true);
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;folder?:string;sort?:string}>}){await privateReader('/mypage/bookmarks');const {locale}=await getI18n(),q=await searchParams;const [initial,initialFolders]=await Promise.all([bookmarks({query:q.q,folder:q.folder,sort:q.sort}),folders()]);return <div className={styles.page}><div className={styles.head}><div><p className="eyebrow">YOUR READING COLLECTION</p><h1>{economyText(locale,'library')}</h1><p>{economyText(locale,'noteHelp')}</p></div></div><BookmarkLibrary key={JSON.stringify(q)+JSON.stringify(initialFolders)} initial={initial} initialFolders={initialFolders} query={q.q||''} folder={q.folder||''} sort={q.sort||'saved'}/></div>;}
