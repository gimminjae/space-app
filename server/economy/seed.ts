import type {SupabaseClient} from '@supabase/supabase-js';
import topics from '../../content/topics.json';
import glossary from '../../content/glossary.json';
import definitions from '../../content/indicators.json';
import series from '../../content/series.json';
import events from '../../content/events.json';
import type {EconomicEvent} from '../../src/lib/economy/types';
import {mergeEvent} from './events';
import {checked} from './client';
export async function seedEconomy(db:SupabaseClient){
 for(const [table,rows,key] of [['space_topics',topics,'slug'],['space_glossary_terms',glossary,'slug'],['space_indicator_definitions',definitions,'slug'],['space_indicator_series',series,'id']] as const)checked(await db.from(table).upsert(rows as Record<string,unknown>[],{onConflict:key}));
 const ids=events.map(e=>e.id);const previous=checked(await db.from('space_economic_events').select('*').in('id',ids)) as EconomicEvent[];
 const merged=events.map(row=>mergeEvent(previous.find(e=>e.id===row.id),row as EconomicEvent,true));
 checked(await db.from('space_economic_events').upsert(merged,{onConflict:'id'}));
 return {topics:topics.length,glossary:glossary.length,indicators:definitions.length,series:series.length,events:events.length};
}
