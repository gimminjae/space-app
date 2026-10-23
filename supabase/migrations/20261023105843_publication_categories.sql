begin;
create table public.space_publication_categories (
  slug text primary key check (char_length(slug) between 1 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null default 'article' check (kind in ('article','lesson','etf')),
  name_ko text not null check (char_length(btrim(name_ko)) between 1 and 100),
  name_en text not null check (char_length(btrim(name_en)) between 1 and 100),
  description_ko text not null default '' check (char_length(description_ko)<=500),
  description_en text not null default '' check (char_length(description_en)<=500),
  seo_title_ko text not null default '' check (char_length(seo_title_ko)<=200),
  seo_title_en text not null default '' check (char_length(seo_title_en)<=200),
  sort_order integer not null default 100,
  show_in_header boolean not null default true,
  show_in_footer boolean not null default false,
  accepts_submissions boolean not null default true,
  is_default boolean not null default false,
  requires_session_date boolean not null default false check (not requires_session_date or kind='article'),
  content jsonb not null default '{"ko":{},"en":{}}' check (jsonb_typeof(content)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index publication_category_default_kind on public.space_publication_categories(kind) where is_default;
alter table public.space_publication_categories enable row level security;
revoke all on public.space_publication_categories from public,anon,authenticated;
grant select on public.space_publication_categories to anon,authenticated;
grant all on public.space_publication_categories to service_role;
create policy publication_categories_read on public.space_publication_categories for select to anon,authenticated using(true);
create trigger publication_categories_touch before update on public.space_publication_categories for each row execute function public.space_publication_touch();

-- Copy existing editorial settings once; future category edits use the table.
insert into public.space_publication_categories(slug,kind,name_ko,name_en,description_ko,description_en,seo_title_ko,seo_title_en,sort_order,show_in_footer,is_default,requires_session_date,content)
select s.key, v.kind, coalesce(s.value->'ko'->>'label',s.value->'ko'->>'name'),coalesce(s.value->'en'->>'label',s.value->'en'->>'name'),s.value->'ko'->>'summary',s.value->'en'->>'summary',coalesce(s.value->'ko'->>'title',''),coalesce(s.value->'en'->>'title',''),v.sort_order,v.is_default,v.is_default,not v.is_default,s.value
from public.space_publication_settings s join (values ('learn','lesson',20,true),('etf','etf',30,true),('us-market-briefing','article',40,false),('kr-market-briefing','article',50,false)) as v(slug,kind,sort_order,is_default) on s.key=v.slug;
insert into public.space_publication_categories(slug,kind,name_ko,name_en,sort_order,show_in_header,is_default) values ('general','article','일반 아티클','General articles',10,false,true);

alter table public.space_publication_documents add column category_slug text references public.space_publication_categories(slug) on delete restrict;
alter table public.space_publication_documents disable trigger publication_touch;
update public.space_publication_documents d set category_slug=coalesce(d.metadata->>'category',(select c.slug from public.space_publication_categories c where c.kind=d.kind and c.is_default)) where kind<>'page';
alter table public.space_publication_documents enable trigger publication_touch;
alter table public.space_publication_documents add constraint publication_category_required check ((kind='page' and category_slug is null) or (kind<>'page' and category_slug is not null));
create index publication_document_category on public.space_publication_documents(category_slug,locale,published_at desc);

-- Keep the earlier publication API and automation metadata compatible. DB editors
-- can move an article with category_slug; the legacy metadata follows atomically.
create function public.space_publication_category_sync() returns trigger language plpgsql security invoker set search_path='' as $$
declare selected public.space_publication_categories;
begin
 if new.kind='page' then new.category_slug=null; return new; end if;
 if tg_op='INSERT' then
   new.category_slug=coalesce(new.category_slug,new.metadata->>'category',(select c.slug from public.space_publication_categories c where c.kind=new.kind and c.is_default));
 elsif new.category_slug is not distinct from old.category_slug and new.metadata->>'category' is distinct from old.metadata->>'category' then
   new.category_slug=coalesce(new.metadata->>'category',(select c.slug from public.space_publication_categories c where c.kind=new.kind and c.is_default));
 end if;
 select * into selected from public.space_publication_categories where slug=new.category_slug;
 if not found or selected.kind<>new.kind then raise exception 'invalid_publication_category'; end if;
 -- Keep metadata unchanged for old uncategorized documents and idempotent retries.
 if not selected.is_default or new.metadata ? 'category' then new.metadata=jsonb_set(new.metadata,'{category}',to_jsonb(new.category_slug)); end if;
 return new;
end; $$;
revoke all on function public.space_publication_category_sync() from public,anon,authenticated;
grant execute on function public.space_publication_category_sync() to service_role;
create trigger publication_category_sync before insert or update on public.space_publication_documents for each row execute function public.space_publication_category_sync();

create function public.space_publication_category_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.slug<>old.slug or new.kind<>old.kind or new.is_default<>old.is_default or new.requires_session_date<>old.requires_session_date then
  raise exception 'Category identity and publishing rules are fixed. Edit names, descriptions, display flags and order, or create a new category.';
 end if;
 return new;
end; $$;
revoke all on function public.space_publication_category_guard() from public,anon,authenticated;
grant execute on function public.space_publication_category_guard() to service_role;
create trigger publication_category_guard before update on public.space_publication_categories for each row execute function public.space_publication_category_guard();
comment on table public.space_publication_categories is 'Public content categories. Edit translated names/descriptions, sort_order, display flags and content in Table Editor. Names never change existing URLs.';
comment on column public.space_publication_categories.slug is 'Permanent URL key. Set once on creation; rename name_ko/name_en for display changes.';
comment on column public.space_publication_categories.content is 'Optional ko/en editorial copy: name (long heading), introduction, notice, schedule, empty, contents, previous, next.';
insert into public.space_publication_settings(key,value) values ('navigation', $navigation${"header": [{"href": "/articles", "ko": "아티클", "en": "Articles", "sort_order": 0}], "footer": [{"href": "/about", "ko": "소개", "en": "About", "sort_order": 40}, {"href": "/privacy", "ko": "개인정보처리방침", "en": "Privacy", "sort_order": 50}, {"href": "/write", "ko": "글 쓰기", "en": "Write", "sort_order": 60}, {"href": "/feed.xml", "ko": "RSS", "en": "RSS", "sort_order": 70}], "tagline": {"ko": "세상을 읽는 시선, 일상을 바꾸는 이해.", "en": "A perspective on the world. Understanding for everyday life."}}$navigation$::jsonb) on conflict(key) do nothing;
commit;
