import type {SupabaseClient} from '@supabase/supabase-js';
import {glossary} from '../../src/lib/economy/catalog';
import {findTermSlugs} from '../../src/lib/economy/term-links';
import {checked} from './client';
/** Add missing term links to pre-existing posts without changing article content or visibility. */
export async function reindexTerms(db:SupabaseClient){let cursor='',count=0;for(;;){let query=db.from('space_posts').select('id,space_id,content').is('deleted_at',null).order('id').limit(100);if(cursor)query=query.gt('id',cursor);const rows=checked(await query)||[];for(const p of rows){const links=findTermSlugs(p.content,glossary).map(term_slug=>({post_id:p.id,space_id:p.space_id,term_slug}));if(links.length)checked(await db.from('space_post_terms').upsert(links,{onConflict:'post_id,term_slug',ignoreDuplicates:true}));count++;}if(rows.length<100)break;cursor=rows.at(-1)!.id;}return {posts:count};}
