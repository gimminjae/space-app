begin;
create table public.space_categories (
 id uuid primary key default gen_random_uuid(), name text not null unique check (length(name) between 1 and 50),
 slug text not null unique, description text not null default '', sort_order integer not null default 0
);
create table public.space_tags (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 50), slug text not null unique
);
create table public.space_posts (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 150), slug text not null unique,
 content text not null default '' check(length(content)<=200000), summary text not null default '',
 status text not null default 'private' check(status in ('public','private')),
 category_id uuid references public.space_categories(id) on delete restrict, cover_asset_id uuid,
 seo_title text not null default '', seo_description text not null default '', author text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 published_at timestamptz, deleted_at timestamptz, version integer not null default 1,
 check(status <> 'public' or (published_at is not null and category_id is not null and length(btrim(content))>0))
);
create table public.space_post_tags (
 post_id uuid not null references public.space_posts(id) on delete cascade,
 tag_id uuid not null references public.space_tags(id) on delete cascade,
 primary key(post_id,tag_id)
);
-- post_id is reserved before the first save, allowing uploads in a new private draft.
create table public.space_assets (
 id uuid primary key default gen_random_uuid(), post_id uuid not null, storage_key text not null unique,
 name text not null, mime text not null, size bigint not null check(size>0 and size<=4194304),
 ready boolean not null default false, created_at timestamptz not null default now()
);
create table public.space_auth_attempts (
 key text primary key, attempts integer not null, started_at timestamptz not null default now()
);
create index space_posts_public_date on public.space_posts(published_at desc,id) where status='public' and deleted_at is null;
create index space_posts_category on public.space_posts(category_id);
create index space_posts_updated on public.space_posts(updated_at desc) where deleted_at is null;
create index space_post_tags_tag on public.space_post_tags(tag_id,post_id);
create index space_assets_post on public.space_assets(post_id);
create index space_auth_expiry on public.space_auth_attempts(started_at);

alter table public.space_categories enable row level security;
alter table public.space_tags enable row level security;
alter table public.space_posts enable row level security;
alter table public.space_post_tags enable row level security;
alter table public.space_assets enable row level security;
alter table public.space_auth_attempts enable row level security;
revoke all on public.space_categories,public.space_tags,public.space_posts,public.space_post_tags,public.space_assets,public.space_auth_attempts from public,anon,authenticated;
grant select on public.space_categories,public.space_tags,public.space_posts,public.space_post_tags to anon;
grant all on public.space_categories,public.space_tags,public.space_posts,public.space_post_tags,public.space_assets,public.space_auth_attempts to service_role;
create policy space_categories_read on public.space_categories for select to anon using(true);
create policy space_posts_read on public.space_posts for select to anon using(status='public' and deleted_at is null);
create policy space_links_read on public.space_post_tags for select to anon using(exists(select 1 from public.space_posts p where p.id=post_id and p.status='public' and p.deleted_at is null));
create policy space_tags_read on public.space_tags for select to anon using(exists(select 1 from public.space_post_tags pt where pt.tag_id=id));

create function public.space_list_posts(p_query text default '',p_category text default '',p_tag text default '',p_page integer default 1,p_admin boolean default false,p_status text default '') returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_admin and current_user <> 'service_role' then raise exception 'forbidden'; end if;
 with filtered as (
  select p.*,to_jsonb(c) as category from public.space_posts p left join public.space_categories c on c.id=p.category_id
  where p.deleted_at is null and (p_admin or p.status='public')
   and (p_status='' or p.status=p_status) and (p_category='' or c.slug=p_category)
   and (p_tag='' or exists(select 1 from public.space_post_tags pt join public.space_tags t on t.id=pt.tag_id where pt.post_id=p.id and t.slug=p_tag))
   and (p_query='' or strpos(lower(p.title || ' ' || p.content || ' ' || p.summary),lower(left(p_query,100)))>0
    or exists(select 1 from public.space_post_tags pt join public.space_tags t on t.id=pt.tag_id where pt.post_id=p.id and strpos(lower(t.name),lower(left(p_query,100)))>0))
 ), page as (
  select * from filtered order by case when p_admin then updated_at else published_at end desc, id desc limit 9 offset (greatest(1,least(p_page,10000))-1)*9
 ) select jsonb_build_object('posts',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),'total',(select count(*) from filtered)) into result;
 return result;
end; $$;
revoke all on function public.space_list_posts(text,text,text,integer,boolean,text) from public,anon,authenticated;
grant execute on function public.space_list_posts(text,text,text,integer,boolean,text) to anon,service_role;

create function public.space_save_post(p_post jsonb,p_tags jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare old_post public.space_posts; saved public.space_posts; item jsonb; v_tag_id uuid; v_post_id uuid := (p_post->>'id')::uuid; cover uuid := nullif(p_post->>'cover_asset_id','')::uuid;
begin
 select * into old_post from public.space_posts where id=v_post_id for update;
 if found then
  if old_post.deleted_at is not null or old_post.version<>(p_post->>'version')::integer then raise exception 'version_conflict'; end if;
  if old_post.slug<>p_post->>'slug' then raise exception 'slug_immutable'; end if;
 else
  if (p_post->>'version')::integer<>0 then raise exception 'version_conflict'; end if;
 end if;
 if cover is not null and not exists(select 1 from public.space_assets a where a.id=cover and a.post_id=v_post_id and a.ready and a.mime like 'image/%') then raise exception 'invalid_asset'; end if;
 if old_post.id is null then
  insert into public.space_posts(id,title,slug,content,summary,status,category_id,cover_asset_id,seo_title,seo_description,author,published_at)
  values(v_post_id,p_post->>'title',p_post->>'slug',p_post->>'content',p_post->>'summary',p_post->>'status',nullif(p_post->>'category_id','')::uuid,cover,p_post->>'seo_title',p_post->>'seo_description',p_post->>'author',case when p_post->>'status'='public' then now() end) returning * into saved;
 else
  update public.space_posts set title=p_post->>'title',content=p_post->>'content',summary=p_post->>'summary',status=p_post->>'status',category_id=nullif(p_post->>'category_id','')::uuid,cover_asset_id=cover,seo_title=p_post->>'seo_title',seo_description=p_post->>'seo_description',author=p_post->>'author',updated_at=now(),version=old_post.version+1,published_at=coalesce(old_post.published_at,case when p_post->>'status'='public' then now() end) where id=v_post_id returning * into saved;
 end if;
 delete from public.space_post_tags pt where pt.post_id=v_post_id;
 for item in select * from jsonb_array_elements(p_tags) loop
  insert into public.space_tags(name,slug) values(item->>'name',item->>'slug') on conflict(slug) do nothing;
  select t.id into v_tag_id from public.space_tags t where t.slug=item->>'slug';
  insert into public.space_post_tags(post_id,tag_id) values(v_post_id,v_tag_id) on conflict do nothing;
 end loop;
 return to_jsonb(saved);
end; $$;
revoke all on function public.space_save_post(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.space_save_post(jsonb,jsonb) to service_role;

create function public.space_delete_category(p_id uuid,p_replacement uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if p_id=p_replacement or not exists(select 1 from public.space_categories where id=p_replacement) then raise exception 'invalid_replacement'; end if;
 update public.space_posts set category_id=p_replacement,updated_at=now(),version=version+1 where category_id=p_id;
 delete from public.space_categories where id=p_id;
end; $$;
revoke all on function public.space_delete_category(uuid,uuid) from public,anon,authenticated;
grant execute on function public.space_delete_category(uuid,uuid) to service_role;

create function public.space_take_auth_attempt(p_key text) returns boolean
language plpgsql security invoker set search_path='' as $$
declare n integer; total integer;
begin
 delete from public.space_auth_attempts where started_at<now()-interval '1 day';
 insert into public.space_auth_attempts(key,attempts) values(p_key,1) on conflict(key) do update set
 attempts=case when space_auth_attempts.started_at<now()-interval '15 minutes' then 1 else space_auth_attempts.attempts+1 end,
 started_at=case when space_auth_attempts.started_at<now()-interval '15 minutes' then now() else space_auth_attempts.started_at end returning attempts into n;
 insert into public.space_auth_attempts(key,attempts) values('global',1) on conflict(key) do update set
 attempts=case when space_auth_attempts.started_at<now()-interval '15 minutes' then 1 else space_auth_attempts.attempts+1 end,
 started_at=case when space_auth_attempts.started_at<now()-interval '15 minutes' then now() else space_auth_attempts.started_at end returning attempts into total;
 return n<=10 and total<=300;
end; $$;
revoke all on function public.space_take_auth_attempt(text) from public,anon,authenticated;
grant execute on function public.space_take_auth_attempt(text) to service_role;

insert into public.space_categories(name,slug,description,sort_order) values
 ('경제 기초','basics','일상의 선택을 이해하는 경제의 기본 개념',10),
 ('거시경제','macro','숫자와 정책을 통해 읽는 더 큰 흐름',20),
 ('금융·금리','finance','돈의 흐름과 금융의 작동 원리',30),
 ('주식·기업','business','기업과 산업의 변화를 읽는 관점',40),
 ('부동산','real-estate','공간과 자산, 주거를 둘러싼 이야기',50),
 ('경제 이슈','issues','오늘의 경제 뉴스를 이해하는 맥락',60);
notify pgrst, 'reload schema';
commit;
