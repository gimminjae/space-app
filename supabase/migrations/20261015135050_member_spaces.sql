begin;
-- Preserve unclaimed legacy rows, but do not expose them after the ownership upgrade.
create table public.space_spaces (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references auth.users(id) on delete cascade,
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 40),
 name text not null check(length(name) between 1 and 60),
 description text not null default '' check(length(description)<=300),
 accent text not null default 'forest' check(accent in ('forest','ocean','plum','terracotta')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.space_spaces enable row level security;
revoke all on public.space_spaces from public,anon,authenticated;
grant select on public.space_spaces to anon,authenticated;
grant insert on public.space_spaces to authenticated;
grant update(name,description,accent,updated_at) on public.space_spaces to authenticated;
grant all on public.space_spaces to service_role;
create policy spaces_read on public.space_spaces for select to anon,authenticated using(true);
create policy spaces_insert on public.space_spaces for insert to authenticated with check(owner_id=(select auth.uid()));
create policy spaces_update on public.space_spaces for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

alter table public.space_posts add column space_id uuid references public.space_spaces(id) on delete cascade;
alter table public.space_categories add column space_id uuid references public.space_spaces(id) on delete cascade;
alter table public.space_tags add column space_id uuid references public.space_spaces(id) on delete cascade;
alter table public.space_post_tags add column space_id uuid references public.space_spaces(id) on delete cascade;
alter table public.space_assets add column space_id uuid references public.space_spaces(id) on delete cascade;
alter table public.space_posts drop constraint space_posts_slug_key;
alter table public.space_categories drop constraint space_categories_name_key, drop constraint space_categories_slug_key;
alter table public.space_tags drop constraint space_tags_slug_key;
alter table public.space_posts add unique(space_id,slug), add unique(id,space_id);
alter table public.space_categories add unique(space_id,slug), add unique(space_id,name), add unique(id,space_id);
alter table public.space_tags add unique(space_id,slug), add unique(id,space_id);
alter table public.space_posts add foreign key(category_id,space_id) references public.space_categories(id,space_id);
alter table public.space_post_tags add foreign key(post_id,space_id) references public.space_posts(id,space_id) on delete cascade,
 add foreign key(tag_id,space_id) references public.space_tags(id,space_id) on delete cascade;
alter table public.space_assets add unique(id,post_id,space_id),
 add foreign key(post_id,space_id) references public.space_posts(id,space_id) on delete cascade;
alter table public.space_posts add foreign key(cover_asset_id,id,space_id) references public.space_assets(id,post_id,space_id) deferrable initially deferred;
create index space_posts_owner_date on public.space_posts(space_id,updated_at desc) where deleted_at is null;
create index space_assets_space on public.space_assets(space_id);
create index space_links_space on public.space_post_tags(space_id);
create index space_posts_cover on public.space_posts(cover_asset_id,id,space_id);

drop policy space_categories_read on public.space_categories;
drop policy space_posts_read on public.space_posts;
drop policy space_links_read on public.space_post_tags;
drop policy space_tags_read on public.space_tags;
-- Ownership is derived from auth.uid(), never client-submitted metadata.
create policy categories_public on public.space_categories for select to anon,authenticated using(space_id is not null);
create policy posts_public on public.space_posts for select to anon,authenticated using(space_id is not null and status='public' and deleted_at is null);
create policy tags_public on public.space_tags for select to anon,authenticated using(exists(select 1 from public.space_post_tags pt where pt.tag_id=space_tags.id));
create policy links_public on public.space_post_tags for select to anon,authenticated using(exists(select 1 from public.space_posts p where p.id=post_id and p.status='public' and p.deleted_at is null));
-- Assets are never granted to anonymous callers. The server checks their parent post before streaming.
create policy posts_owner_select on public.space_posts for select to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy posts_owner_insert on public.space_posts for insert to authenticated with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy posts_owner_update on public.space_posts for update to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid()))) with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy categories_owner_select on public.space_categories for select to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy categories_owner_insert on public.space_categories for insert to authenticated with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy categories_owner_update on public.space_categories for update to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid()))) with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy categories_owner_delete on public.space_categories for delete to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy tags_owner_select on public.space_tags for select to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy tags_owner_insert on public.space_tags for insert to authenticated with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy tags_owner_update on public.space_tags for update to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid()))) with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy tags_owner_delete on public.space_tags for delete to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy post_tags_owner_select on public.space_post_tags for select to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy post_tags_owner_insert on public.space_post_tags for insert to authenticated with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy post_tags_owner_update on public.space_post_tags for update to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid()))) with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy post_tags_owner_delete on public.space_post_tags for delete to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy assets_owner_select on public.space_assets for select to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy assets_owner_insert on public.space_assets for insert to authenticated with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy assets_owner_update on public.space_assets for update to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid()))) with check(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
create policy assets_owner_delete on public.space_assets for delete to authenticated using(space_id in (select id from public.space_spaces where owner_id=(select auth.uid())));
grant select,insert,update on public.space_posts to authenticated;
grant select,insert,update,delete on public.space_categories,public.space_tags,public.space_post_tags to authenticated;
grant select on public.space_assets to authenticated;

create function public.space_create_space(p_slug text,p_name text,p_description text default '',p_accent text default 'forest') returns public.space_spaces
language plpgsql security invoker set search_path='' as $$
declare s public.space_spaces;
begin
 if auth.uid() is null then raise exception 'forbidden'; end if;
 insert into public.space_spaces(owner_id,slug,name,description,accent) values(auth.uid(),p_slug,p_name,p_description,p_accent) returning * into s;
 insert into public.space_categories(space_id,name,slug,description,sort_order) values
 (s.id,'경제 기초','basics','일상의 선택을 이해하는 경제의 기본 개념',10),
 (s.id,'거시경제','macro','숫자와 정책을 통해 읽는 더 큰 흐름',20),
 (s.id,'금융·금리','finance','돈의 흐름과 금융의 작동 원리',30),
 (s.id,'주식·기업','business','기업과 산업의 변화를 읽는 관점',40),
 (s.id,'부동산','real-estate','공간과 자산, 주거를 둘러싼 이야기',50),
 (s.id,'경제 이슈','issues','오늘의 경제 뉴스를 이해하는 맥락',60);
 return s;
end; $$;
revoke all on function public.space_create_space(text,text,text,text) from public,anon;
grant execute on function public.space_create_space(text,text,text,text) to authenticated;

drop function public.space_list_posts(text,text,text,integer,boolean,text);
create function public.space_list_posts(p_query text default '',p_category text default '',p_tag text default '',p_page integer default 1,p_admin boolean default false,p_status text default '',p_space uuid default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_admin and auth.uid() is null then raise exception 'forbidden'; end if;
 with filtered as (
  select p.*,to_jsonb(c) as category,to_jsonb(s)-'owner_id' as space from public.space_posts p
  join public.space_spaces s on s.id=p.space_id left join public.space_categories c on c.id=p.category_id
  where p.deleted_at is null and (case when p_admin then s.owner_id=auth.uid() else p.status='public' end)
   and (p_space is null or p.space_id=p_space)
   and (p_status='' or p.status=p_status) and (p_category='' or c.slug=p_category)
   and (p_tag='' or exists(select 1 from public.space_post_tags pt join public.space_tags t on t.id=pt.tag_id where pt.post_id=p.id and t.slug=p_tag))
   and (p_query='' or strpos(lower(p.title || ' ' || p.content || ' ' || p.summary),lower(left(p_query,100)))>0
    or exists(select 1 from public.space_post_tags pt join public.space_tags t on t.id=pt.tag_id where pt.post_id=p.id and strpos(lower(t.name),lower(left(p_query,100)))>0))
 ), page as (
  select * from filtered order by case when p_admin then updated_at else published_at end desc,id desc limit 9 offset (greatest(1,least(p_page,10000))-1)*9
 ) select jsonb_build_object('posts',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),'total',(select count(*) from filtered)) into result;
 return result;
end; $$;
revoke all on function public.space_list_posts(text,text,text,integer,boolean,text,uuid) from public;
grant execute on function public.space_list_posts(text,text,text,integer,boolean,text,uuid) to anon,authenticated,service_role;

create or replace function public.space_save_post(p_post jsonb,p_tags jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare old_post public.space_posts; saved public.space_posts; item jsonb; v_tag_id uuid;
 v_post_id uuid := (p_post->>'id')::uuid; cover uuid := nullif(p_post->>'cover_asset_id','')::uuid; own_space uuid;
begin
 select id into own_space from public.space_spaces where owner_id=auth.uid();
 if own_space is null then raise exception 'forbidden'; end if;
 if jsonb_typeof(p_tags)<>'array' or jsonb_array_length(p_tags)>12 then raise exception 'invalid_tags'; end if;
 select * into old_post from public.space_posts where id=v_post_id for update;
 if found then
  if old_post.space_id<>own_space then raise exception 'forbidden'; end if;
  if old_post.deleted_at is not null or old_post.version<>(p_post->>'version')::integer then raise exception 'version_conflict'; end if;
  if old_post.slug<>p_post->>'slug' then raise exception 'slug_immutable'; end if;
 else
  if (p_post->>'version')::integer<>0 then raise exception 'version_conflict'; end if;
 end if;
 if cover is not null and not exists(select 1 from public.space_assets a where a.id=cover and a.post_id=v_post_id and a.space_id=own_space and a.ready and a.mime like 'image/%') then raise exception 'invalid_asset'; end if;
 if old_post.id is null then
  insert into public.space_posts(id,space_id,title,slug,content,summary,status,category_id,cover_asset_id,seo_title,seo_description,author,published_at)
  values(v_post_id,own_space,p_post->>'title',p_post->>'slug',p_post->>'content',p_post->>'summary',p_post->>'status',nullif(p_post->>'category_id','')::uuid,cover,p_post->>'seo_title',p_post->>'seo_description',p_post->>'author',case when p_post->>'status'='public' then now() end) returning * into saved;
 else
  update public.space_posts set title=p_post->>'title',content=p_post->>'content',summary=p_post->>'summary',status=p_post->>'status',category_id=nullif(p_post->>'category_id','')::uuid,cover_asset_id=cover,seo_title=p_post->>'seo_title',seo_description=p_post->>'seo_description',author=p_post->>'author',updated_at=now(),version=old_post.version+1,published_at=coalesce(old_post.published_at,case when p_post->>'status'='public' then now() end) where id=v_post_id returning * into saved;
 end if;
 delete from public.space_post_tags pt where pt.post_id=v_post_id;
 for item in select * from jsonb_array_elements(p_tags) loop
  insert into public.space_tags(space_id,name,slug) values(own_space,item->>'name',item->>'slug') on conflict(space_id,slug) do nothing;
  select t.id into v_tag_id from public.space_tags t where t.space_id=own_space and t.slug=item->>'slug';
  insert into public.space_post_tags(space_id,post_id,tag_id) values(own_space,v_post_id,v_tag_id) on conflict do nothing;
 end loop;
 return to_jsonb(saved);
end; $$;
revoke all on function public.space_save_post(jsonb,jsonb) from public,anon,service_role;
grant execute on function public.space_save_post(jsonb,jsonb) to authenticated;

create or replace function public.space_delete_category(p_id uuid,p_replacement uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare own_space uuid;
begin
 select id into own_space from public.space_spaces where owner_id=auth.uid();
 if own_space is null or p_id=p_replacement
 or not exists(select 1 from public.space_categories where id=p_id and space_id=own_space)
 or not exists(select 1 from public.space_categories where id=p_replacement and space_id=own_space) then raise exception 'invalid_replacement'; end if;
 update public.space_posts set category_id=p_replacement,updated_at=now(),version=version+1 where category_id=p_id and space_id=own_space;
 delete from public.space_categories where id=p_id and space_id=own_space;
end; $$;
revoke all on function public.space_delete_category(uuid,uuid) from public,anon,service_role;
grant execute on function public.space_delete_category(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
