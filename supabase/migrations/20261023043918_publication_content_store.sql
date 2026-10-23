begin;

create table public.space_publication_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('lesson','etf','article','page')),
  slug text not null check (char_length(slug) between 1 and 120 and slug ~ '^[[:alnum:]][[:alnum:]-]*$'),
  locale text not null check (locale in ('ko','en')),
  title text not null check (char_length(btrim(title)) between 1 and 150),
  seo_title text not null default '' check (char_length(seo_title) <= 200),
  summary text not null default '' check (char_length(summary) <= 500),
  content text not null check (char_length(btrim(content)) between 1 and 200000),
  author text not null default 'space' check (char_length(author) between 1 and 80),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  sort_order integer not null default 0 check (sort_order >= 0),
  status text not null default 'draft' check (status in ('draft','published')),
  origin text not null default 'editorial' check (origin in ('editorial','open')),
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind,slug,locale)
);
create index space_publication_browse on public.space_publication_documents(locale,kind,sort_order,published_at desc) where status='published';
create index space_publication_updated on public.space_publication_documents(updated_at desc) where status='published';

create table public.space_publication_settings (
  key text primary key,
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  updated_at timestamptz not null default now()
);
create table public.space_publication_requests (
  key uuid primary key,
  fingerprint text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create table public.space_publication_limits (
  key text primary key,
  attempts integer not null,
  started_at timestamptz not null default now()
);

alter table public.space_publication_documents enable row level security;
alter table public.space_publication_settings enable row level security;
alter table public.space_publication_requests enable row level security;
alter table public.space_publication_limits enable row level security;
revoke all on public.space_publication_documents,public.space_publication_settings,public.space_publication_requests,public.space_publication_limits from public,anon,authenticated;
grant select on public.space_publication_documents,public.space_publication_settings to anon,authenticated;
grant all on public.space_publication_documents,public.space_publication_settings,public.space_publication_requests,public.space_publication_limits to service_role;
create policy publication_read on public.space_publication_documents for select to anon,authenticated using (status='published' and published_at <= now());
create policy publication_settings_read on public.space_publication_settings for select to anon,authenticated using (true);
create policy publication_requests_service on public.space_publication_requests for all to service_role using (true) with check (true);
create policy publication_limits_service on public.space_publication_limits for all to service_role using (true) with check (true);

create function public.space_publication_touch() returns trigger
language plpgsql security invoker set search_path='' as $$
begin new.updated_at=now(); return new; end; $$;
revoke all on function public.space_publication_touch() from public,anon,authenticated;
grant execute on function public.space_publication_touch() to service_role;
create trigger publication_touch before update on public.space_publication_documents for each row execute function public.space_publication_touch();
create trigger publication_settings_touch before update on public.space_publication_settings for each row execute function public.space_publication_touch();

-- The public website validates submissions. Only its server credential can call
-- this transaction; anonymous clients cannot bypass validation or edit old rows.
create function public.space_publish_documents(p_entries jsonb,p_request_key uuid,p_fingerprint text,p_rate_key text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare previous public.space_publication_requests; entry jsonb; result jsonb='[]'; saved public.space_publication_documents; n integer; key_name text; next_order integer;
begin
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) not between 1 and 2 then raise exception 'invalid_entries'; end if;
  perform pg_advisory_xact_lock(hashtext('space-publication-submit'));
  select * into previous from public.space_publication_requests where key=p_request_key;
  if found then
    if previous.fingerprint<>p_fingerprint then raise exception 'idempotency_conflict'; end if;
    return previous.result;
  end if;
  delete from public.space_publication_limits where started_at < now()-interval '1 day';
  foreach key_name in array array[p_rate_key,'global'] loop
    insert into public.space_publication_limits(key,attempts) values(key_name,1)
      on conflict(key) do update set
      attempts=case when space_publication_limits.started_at<now()-interval '15 minutes' then 1 else space_publication_limits.attempts+1 end,
      started_at=case when space_publication_limits.started_at<now()-interval '15 minutes' then now() else space_publication_limits.started_at end
      returning attempts into n;
    if n > (case when key_name='global' then 200 else 20 end) then raise exception 'rate_limit'; end if;
  end loop;
  for entry in select * from jsonb_array_elements(p_entries) loop
    if entry->>'kind' not in ('article','etf','lesson') then raise exception 'invalid_kind'; end if;
    select coalesce(max(sort_order),0)+1 into next_order from public.space_publication_documents where kind=entry->>'kind' and locale=entry->>'locale';
    insert into public.space_publication_documents(kind,slug,locale,title,seo_title,summary,content,author,tags,sort_order,status,origin,metadata)
      values(entry->>'kind',entry->>'slug',entry->>'locale',entry->>'title',coalesce(entry->>'seo_title',''),coalesce(entry->>'summary',''),entry->>'content',entry->>'author',
        array(select jsonb_array_elements_text(coalesce(entry->'tags','[]'))),next_order,'published','open',coalesce(entry->'metadata','{}')) returning * into saved;
    result=result||jsonb_build_array(jsonb_build_object('id',saved.id,'kind',saved.kind,'slug',saved.slug,'locale',saved.locale,'published_at',saved.published_at));
  end loop;
  insert into public.space_publication_requests(key,fingerprint,result) values(p_request_key,p_fingerprint,result);
  return result;
end; $$;
revoke all on function public.space_publish_documents(jsonb,uuid,text,text) from public,anon,authenticated;
grant execute on function public.space_publish_documents(jsonb,uuid,text,text) to service_role;
commit;
