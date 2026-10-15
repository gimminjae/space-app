begin;

-- Public editorial catalogs. Localized content is stored together so a release is atomic.
create table public.space_topics (
 slug text primary key check(slug ~ '^[a-z0-9-]+$'), ko jsonb not null, en jsonb not null,
 active boolean not null default true, sort_order integer not null default 0
);
create table public.space_glossary_terms (
 slug text primary key check(slug ~ '^[a-z0-9-]+$'), topic_slug text references public.space_topics(slug),
 ko jsonb not null, en jsonb not null, aliases text[] not null default '{}', related text[] not null default '{}',
 source_url text not null, reviewed_at date not null, active boolean not null default true
);
create table public.space_post_topics (
 post_id uuid not null, space_id uuid not null, topic_slug text not null references public.space_topics(slug),
 primary key(post_id,topic_slug), foreign key(post_id,space_id) references public.space_posts(id,space_id) on delete cascade
);
create table public.space_post_terms (
 post_id uuid not null, space_id uuid not null, term_slug text not null references public.space_glossary_terms(slug),
 primary key(post_id,term_slug), foreign key(post_id,space_id) references public.space_posts(id,space_id) on delete cascade
);
create table public.space_bookmark_folders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 40), created_at timestamptz not null default now(),
 unique(id,user_id)
);
create unique index space_folder_name on public.space_bookmark_folders(user_id,lower(btrim(name)));
create table public.space_bookmarks (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 post_id uuid references public.space_posts(id) on delete set null, folder_id uuid,
 note text not null default '' check(length(note)<=5000), version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,post_id), foreign key(folder_id,user_id) references public.space_bookmark_folders(id,user_id)
);
create table public.space_space_follows (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 space_id uuid not null references public.space_spaces(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,space_id)
);
create table public.space_topic_follows (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 topic_slug text not null references public.space_topics(slug) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,topic_slug)
);
create table public.space_indicator_definitions (
 slug text primary key, country text not null check(country in ('KR','US')), ko jsonb not null, en jsonb not null,
 topic_slug text references public.space_topics(slug), term_slug text references public.space_glossary_terms(slug),
 unit text not null, frequency text not null check(frequency in ('D','M','Q')), adjustment text not null,
 change_kind text not null check(change_kind in ('points','percent','yoy')), active boolean not null default true,
 sort_order integer not null default 0
);
create table public.space_indicator_series (
 id text primary key, indicator_slug text not null references public.space_indicator_definitions(slug),
 provider text not null check(provider in ('fred','ecos')), code text not null, item_code text,
 role text not null default 'value' check(role in ('value','lower','upper')), source_url text not null,
 approved boolean not null default false, last_success_at timestamptz, last_error text
);
create table public.space_indicator_observations (
 series_id text not null references public.space_indicator_series(id) on delete cascade,
 period date not null, value numeric, fetched_at timestamptz not null default now(),
 source_updated_at date, primary key(series_id,period)
);
create table public.space_indicator_favorites (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 indicator_slug text not null references public.space_indicator_definitions(slug), sort_order integer not null default 0,
 primary key(user_id,indicator_slug)
);
create table public.space_economic_events (
 id text primary key check(length(id) between 1 and 160), country text not null check(country in ('KR','US')),
 kind text not null, ko jsonb not null, en jsonb not null, topic_slug text references public.space_topics(slug),
 event_date date not null, starts_at timestamptz, source_timezone text not null,
 precision text not null check(precision in ('time','date_only')),
 status text not null default 'scheduled' check(status in ('scheduled','released','postponed','cancelled')),
 source_url text not null, provider text not null, provider_key text not null, reference_period text,
 indicator_slugs text[] not null default '{}', manual_override boolean not null default false,
 active boolean not null default true, reviewed_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 history jsonb not null default '[]', unique(provider,provider_key),
 check((precision='time' and starts_at is not null) or (precision='date_only' and starts_at is null))
);
create table public.space_economic_event_results (
 event_id text not null references public.space_economic_events(id), series_id text not null references public.space_indicator_series(id),
 period date not null, captured_value numeric, previous_value numeric, captured_at timestamptz not null default now(),
 first_release_verified boolean not null default false, primary key(event_id,series_id,period)
);
create table public.space_event_saves (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 event_id text not null references public.space_economic_events(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,event_id)
);
create table public.space_sync_runs (
 key text primary key, cursor jsonb not null default '{}', locked_until timestamptz,
 last_success_at timestamptz, last_error text, processed integer not null default 0
);

-- Deny first, then grant exactly the operations used by the app.
do $$ declare t text; begin
 foreach t in array array['space_topics','space_glossary_terms','space_post_topics','space_post_terms','space_bookmark_folders','space_bookmarks','space_space_follows','space_topic_follows','space_indicator_definitions','space_indicator_series','space_indicator_observations','space_indicator_favorites','space_economic_events','space_economic_event_results','space_event_saves','space_sync_runs'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
 foreach t in array array['space_topics','space_glossary_terms','space_indicator_definitions','space_economic_events'] loop
  execute format('grant select on public.%I to anon,authenticated',t);
  execute format('create policy published on public.%I for select to anon,authenticated using(active)',t);
 end loop;
 foreach t in array array['space_bookmark_folders','space_bookmarks','space_space_follows','space_topic_follows','space_indicator_favorites','space_event_saves'] loop
  execute format('grant select,insert,delete on public.%I to authenticated',t);
  execute format('create policy own_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
  execute format('create policy own_delete on public.%I for delete to authenticated using(user_id=(select auth.uid()))',t);
 end loop;
 foreach t in array array['space_bookmark_folders','space_bookmarks','space_indicator_favorites'] loop
  execute format('create policy own_update on public.%I for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()))',t);
 end loop;
end $$;
grant update(name) on public.space_bookmark_folders to authenticated;
grant update(note,folder_id) on public.space_bookmarks to authenticated;
grant update(sort_order) on public.space_indicator_favorites to authenticated;
create policy own_insert on public.space_bookmark_folders for insert to authenticated with check(user_id=(select auth.uid()));
create policy own_insert on public.space_bookmarks for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.space_posts p where p.id=post_id and p.deleted_at is null));
create policy own_insert on public.space_space_follows for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.space_spaces s where s.id=space_id and s.owner_id<>auth.uid()));
create policy own_insert on public.space_topic_follows for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.space_topics t where t.slug=topic_slug and t.active));
create policy own_insert on public.space_indicator_favorites for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.space_indicator_definitions i where i.slug=indicator_slug and i.active));
create policy own_insert on public.space_event_saves for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.space_economic_events e where e.id=event_id and e.active));

grant select on public.space_indicator_series,public.space_indicator_observations,public.space_economic_event_results to anon,authenticated;
create policy public_series on public.space_indicator_series for select to anon,authenticated using(approved and exists(select 1 from public.space_indicator_definitions d where d.slug=indicator_slug and d.active));
create policy public_values on public.space_indicator_observations for select to anon,authenticated using(exists(select 1 from public.space_indicator_series s where s.id=series_id));
create policy public_results on public.space_economic_event_results for select to anon,authenticated using(exists(select 1 from public.space_economic_events e where e.id=event_id and e.active) and exists(select 1 from public.space_indicator_series s where s.id=series_id));

grant select on public.space_post_topics,public.space_post_terms to anon,authenticated;
grant insert,delete on public.space_post_topics,public.space_post_terms to authenticated;
do $$ declare t text; begin
 foreach t in array array['space_post_topics','space_post_terms'] loop
  execute format('create policy visible_post on public.%I for select to anon,authenticated using(exists(select 1 from public.space_posts p where p.id=post_id and p.deleted_at is null))',t);
  execute format('create policy own_post_insert on public.%I for insert to authenticated with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())))',t);
  execute format('create policy own_post_delete on public.%I for delete to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())))',t);
 end loop;
end $$;

create index space_bookmarks_saved on public.space_bookmarks(user_id,created_at desc,id desc);
create index space_bookmarks_modified on public.space_bookmarks(user_id,updated_at desc,id desc);
create index space_bookmarks_folder on public.space_bookmarks(folder_id,user_id);
create index space_bookmarks_post on public.space_bookmarks(post_id);
create index space_topic_posts on public.space_post_topics(topic_slug,post_id);
create index space_term_posts on public.space_post_terms(term_slug,post_id);
create index space_topics_space on public.space_post_topics(space_id);
create index space_terms_space on public.space_post_terms(space_id);
create index space_follows_target on public.space_space_follows(space_id);
create index space_follow_topics_target on public.space_topic_follows(topic_slug);
create index space_favorite_target on public.space_indicator_favorites(indicator_slug);
create index space_saved_event_target on public.space_event_saves(event_id);
create index space_series_indicator on public.space_indicator_series(indicator_slug);
create index space_calendar_date on public.space_economic_events(event_date,country) where active;
create index space_calendar_time on public.space_economic_events(starts_at,country) where active;
create index space_public_feed on public.space_posts(space_id,published_at desc,id desc) where status='public' and deleted_at is null;

create function public.space_bookmark_stamp() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.version=old.version+1; new.updated_at=now(); return new; end $$;
revoke all on function public.space_bookmark_stamp() from public,anon,authenticated;
create trigger bookmark_stamp before update on public.space_bookmarks for each row execute function public.space_bookmark_stamp();
create function public.space_folder_limit() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text,0));
 if (select count(*) from public.space_bookmark_folders where user_id=new.user_id)>=50 then raise exception 'folder_limit'; end if;
 return new;
end $$;
revoke all on function public.space_folder_limit() from public,anon,authenticated;
create trigger folder_limit before insert on public.space_bookmark_folders for each row execute function public.space_folder_limit();
create function public.space_delete_folder(p_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.space_bookmark_folders where id=p_id and user_id=auth.uid() for update;
 if not found then raise exception 'not_found'; end if;
 update public.space_bookmarks set folder_id=null where folder_id=p_id and user_id=auth.uid();
 delete from public.space_bookmark_folders where id=p_id and user_id=auth.uid();
end $$;
revoke all on function public.space_delete_folder(uuid) from public,anon;
grant execute on function public.space_delete_folder(uuid) to authenticated;

create function public.space_bookmark_list(p_query text default '',p_folder text default '',p_sort text default 'saved',p_cursor_time timestamptz default null,p_cursor_id uuid default null) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(rows)),'[]'::jsonb) from (
 select b.*,case when p.id is null then null else jsonb_build_object('id',p.id,'title',p.title,'slug',p.slug,'summary',p.summary,'status',p.status,'space_slug',s.slug,'space_name',s.name) end as post
 from public.space_bookmarks b
 left join public.space_posts p on p.id=b.post_id and p.deleted_at is null
 left join public.space_spaces s on s.id=p.space_id
 where b.user_id=auth.uid()
 and (p_folder='' or (p_folder='none' and b.folder_id is null) or b.folder_id::text=p_folder)
 and (p_query='' or strpos(lower(b.note||' '||coalesce(p.title,'')),lower(left(p_query,100)))>0)
 and (p_cursor_time is null or (case when p_sort='modified' then b.updated_at else b.created_at end,b.id)<(p_cursor_time,p_cursor_id))
 order by case when p_sort='modified' then b.updated_at else b.created_at end desc,b.id desc limit 21
 ) rows;
$$;
revoke all on function public.space_bookmark_list(text,text,text,timestamptz,uuid) from public,anon;
grant execute on function public.space_bookmark_list(text,text,text,timestamptz,uuid) to authenticated;

create function public.space_reader_posts(p_mode text default 'topic',p_slug text default '',p_before timestamptz default null,p_id uuid default null) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(rows)),'[]'::jsonb) from (
 select p.id,p.title,p.slug,p.summary,p.status,p.author,p.published_at,p.updated_at,p.created_at,p.cover_asset_id,p.category_id,p.space_id,greatest(1,ceil(char_length(p.content)/650.0))::integer as reading_minutes,to_jsonb(s)-'owner_id' as space,to_jsonb(c) as category,
 exists(select 1 from public.space_space_follows f where f.user_id=auth.uid() and f.space_id=p.space_id) as followed_space,
 array(select pt.topic_slug from public.space_post_topics pt join public.space_topic_follows f on f.topic_slug=pt.topic_slug where pt.post_id=p.id and f.user_id=auth.uid()) as followed_topics
 from public.space_posts p join public.space_spaces s on s.id=p.space_id left join public.space_categories c on c.id=p.category_id
 where p.status='public' and p.deleted_at is null
 and (p_before is null or (p.published_at,p.id)<(p_before,p_id))
 and case when p_mode='following' then auth.uid() is not null and (
 exists(select 1 from public.space_space_follows f where f.user_id=auth.uid() and f.space_id=p.space_id)
 or exists(select 1 from public.space_post_topics pt join public.space_topic_follows f on f.topic_slug=pt.topic_slug where pt.post_id=p.id and f.user_id=auth.uid()))
 when p_mode='term' then exists(select 1 from public.space_post_terms pt where pt.post_id=p.id and pt.term_slug=p_slug)
 else exists(select 1 from public.space_post_topics pt where pt.post_id=p.id and pt.topic_slug=p_slug) end
 order by p.published_at desc,p.id desc limit 21
 ) rows;
$$;
revoke all on function public.space_reader_posts(text,text,timestamptz,uuid) from public;
-- Follow rows are private. Public related-post calls use a separate session role with no matches.
grant execute on function public.space_reader_posts(text,text,timestamptz,uuid) to authenticated;

create function public.space_public_reader_posts(p_mode text default 'topic',p_slug text default '',p_before timestamptz default null,p_id uuid default null) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(rows)),'[]'::jsonb) from (
 select p.id,p.title,p.slug,p.summary,p.status,p.author,p.published_at,p.updated_at,p.created_at,p.cover_asset_id,p.category_id,p.space_id,greatest(1,ceil(char_length(p.content)/650.0))::integer as reading_minutes,to_jsonb(s)-'owner_id' as space,to_jsonb(c) as category
 from public.space_posts p join public.space_spaces s on s.id=p.space_id left join public.space_categories c on c.id=p.category_id
 where p.status='public' and p.deleted_at is null and (p_before is null or (p.published_at,p.id)<(p_before,p_id))
 and case when p_mode='term' then exists(select 1 from public.space_post_terms pt where pt.post_id=p.id and pt.term_slug=p_slug)
 else exists(select 1 from public.space_post_topics pt where pt.post_id=p.id and pt.topic_slug=p_slug) end
 order by p.published_at desc,p.id desc limit 21
 ) rows;
$$;
revoke all on function public.space_public_reader_posts(text,text,timestamptz,uuid) from public;
grant execute on function public.space_public_reader_posts(text,text,timestamptz,uuid) to anon,authenticated;

create function public.space_topic_limit() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.space_posts where id=new.post_id for update;
 if not exists(select 1 from public.space_topics where slug=new.topic_slug and active) then raise exception 'invalid_topics'; end if;
 if not exists(select 1 from public.space_post_topics where post_id=new.post_id and topic_slug=new.topic_slug)
 and (select count(*) from public.space_post_topics where post_id=new.post_id)>=3 then raise exception 'invalid_topics'; end if;
 return new;
end $$;
revoke all on function public.space_topic_limit() from public,anon,authenticated;
create trigger topic_limit before insert on public.space_post_topics for each row execute function public.space_topic_limit();

-- Keep the original write transaction and add taxonomies atomically.
alter function public.space_save_post(jsonb,jsonb) rename to space_save_post_core;
create function public.space_save_post(p_post jsonb,p_tags jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved jsonb; item text; own_space uuid;
begin
 saved=public.space_save_post_core(p_post,p_tags); own_space=(saved->>'space_id')::uuid;
 if p_post ? 'topics' then
  if jsonb_typeof(p_post->'topics')<>'array' or jsonb_array_length(p_post->'topics')>3 then raise exception 'invalid_topics'; end if;
  delete from public.space_post_topics where post_id=(saved->>'id')::uuid;
  for item in select jsonb_array_elements_text(p_post->'topics') loop
   if not exists(select 1 from public.space_topics where slug=item and active) then raise exception 'invalid_topics'; end if;
   insert into public.space_post_topics(post_id,space_id,topic_slug) values((saved->>'id')::uuid,own_space,item) on conflict do nothing;
  end loop;
 end if;
 if p_post ? 'terms' then
  if jsonb_typeof(p_post->'terms')<>'array' or jsonb_array_length(p_post->'terms')>30 then raise exception 'invalid_terms'; end if;
  delete from public.space_post_terms where post_id=(saved->>'id')::uuid;
  for item in select jsonb_array_elements_text(p_post->'terms') loop
   insert into public.space_post_terms(post_id,space_id,term_slug) select (saved->>'id')::uuid,own_space,item where exists(select 1 from public.space_glossary_terms where slug=item and active) on conflict do nothing;
  end loop;
 end if;
 return saved;
end $$;
revoke all on function public.space_save_post(jsonb,jsonb) from public,anon,service_role;
grant execute on function public.space_save_post(jsonb,jsonb) to authenticated;

create index space_glossary_topic on public.space_glossary_terms(topic_slug);
create index space_indicator_topic on public.space_indicator_definitions(topic_slug);
create index space_indicator_term on public.space_indicator_definitions(term_slug);
create index space_event_topic on public.space_economic_events(topic_slug);
create index space_result_series on public.space_economic_event_results(series_id);

-- Reserved for trusted scheduled workers, never an application-user endpoint.
create function public.space_sync_lock(p_key text) returns boolean language plpgsql security invoker set search_path='' as $$
declare acquired text;
begin
 insert into public.space_sync_runs(key,locked_until) values(p_key,now()+interval '45 seconds')
 on conflict(key) do update set locked_until=excluded.locked_until where space_sync_runs.locked_until is null or space_sync_runs.locked_until<now()
 returning key into acquired;
 return acquired is not null;
end $$;
revoke all on function public.space_sync_lock(text) from public,anon,authenticated;
grant execute on function public.space_sync_lock(text) to service_role;
create function public.space_order_favorites(p_order text[]) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or cardinality(p_order)>8 or cardinality(p_order)<>(select count(distinct v) from unnest(p_order) v) then raise exception 'invalid_order'; end if;
 update public.space_indicator_favorites f set sort_order=x.n from unnest(p_order) with ordinality x(slug,n) where f.user_id=auth.uid() and f.indicator_slug=x.slug;
end $$;
revoke all on function public.space_order_favorites(text[]) from public,anon;
grant execute on function public.space_order_favorites(text[]) to authenticated;
notify pgrst,'reload schema';
commit;
