begin;
-- Keep the same access rules, but evaluate only one SELECT policy per role.
alter policy categories_public on public.space_categories to anon;
alter policy posts_public on public.space_posts to anon;
alter policy tags_public on public.space_tags to anon;
alter policy links_public on public.space_post_tags to anon;
alter policy categories_owner_select on public.space_categories using(space_id is not null);
alter policy posts_owner_select on public.space_posts using(
 (space_id is not null and status='public' and deleted_at is null)
 or space_id in (select id from public.space_spaces where owner_id=(select auth.uid()))
);
alter policy tags_owner_select on public.space_tags using(
 space_id in (select id from public.space_spaces where owner_id=(select auth.uid()))
 or exists(select 1 from public.space_post_tags pt where pt.tag_id=space_tags.id)
);
alter policy post_tags_owner_select on public.space_post_tags using(
 space_id in (select id from public.space_spaces where owner_id=(select auth.uid()))
 or exists(select 1 from public.space_posts p where p.id=post_id and p.status='public' and p.deleted_at is null)
);
create index space_assets_post_space on public.space_assets(post_id,space_id);
create index space_links_post_space on public.space_post_tags(post_id,space_id);
create index space_links_tag_space on public.space_post_tags(tag_id,space_id);
create index space_posts_category_space on public.space_posts(category_id,space_id);
-- Member writes cannot change stable IDs/URLs. Attachments are server-managed.
revoke update on public.space_posts from authenticated;
grant update(title,content,summary,status,category_id,cover_asset_id,seo_title,seo_description,author,updated_at,published_at,deleted_at,version) on public.space_posts to authenticated;
notify pgrst,'reload schema';
commit;
