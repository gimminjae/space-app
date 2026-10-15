import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {randomUUID} from 'node:crypto';

test('member spaces isolate writes, drafts, tags, categories and assets across two accounts',async()=>{
 const pg=new PGlite();
 try{
 await pg.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth to anon,authenticated,service_role;
 grant execute on function auth.uid() to anon,authenticated,service_role;`);
 await pg.exec(readFileSync('supabase/migrations/20261015120706_space_blog.sql','utf8'));
 await pg.exec(readFileSync('supabase/migrations/20261015135050_member_spaces.sql','utf8'));
 await pg.exec(readFileSync('supabase/migrations/20261015141457_member_policy_indexes.sql','utf8'));
 const alice=randomUUID(),bob=randomUUID();await pg.query('insert into auth.users values ($1),($2)',[alice,bob]);
 async function asUser(user:string){await pg.exec('reset role');await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await pg.exec('set role authenticated');}
 async function asAnon(){await pg.exec('reset role');await pg.query("select set_config('request.jwt.claim.sub','',false)");await pg.exec('set role anon');}
 async function space(slug:string){return (await pg.query<any>('select * from space_create_space($1,$2)',[slug,slug])).rows[0];}
 async function save(post:object,tags:object[]=[]){return (await pg.query<any>('select space_save_post($1::jsonb,$2::jsonb) as post',[JSON.stringify(post),JSON.stringify(tags)])).rows[0].post;}
 await asUser(alice);const a=await space('alice-space');
 const ac=(await pg.query<any>('select * from space_categories where space_id=$1 order by sort_order',[a.id])).rows;
 await assert.rejects(space('alice-second'));
 await asUser(bob);const b=await space('bob-space');
 const bc=(await pg.query<any>('select * from space_categories where space_id=$1 order by sort_order',[b.id])).rows;
 const base={id:randomUUID(),version:0,title:'회원의 경제 글',slug:'same-slug',content:'## 제목\n본문',summary:'경제 이야기',status:'private',category_id:ac[0].id,cover_asset_id:null,seo_title:'',seo_description:'',author:'Alice'};
 await asUser(alice);let first=await save(base,[{name:'숨긴태그',slug:'hidden-tag'}]);assert.equal(first.space_id,a.id);assert.equal(first.version,1);
 await asUser(bob);assert.equal((await pg.query('select * from space_posts where id=$1',[base.id])).rows.length,0);
 assert.equal((await pg.query("select * from space_tags where slug='hidden-tag'")).rows.length,0);
 await assert.rejects(save({...base,version:1,title:'침입'}));
 await assert.rejects(save({...base,version:0,title:'아이디 충돌'}));
 await assert.rejects(save({...base,id:randomUUID(),category_id:ac[0].id}));
 assert.equal((await pg.query('update space_categories set name=$1 where id=$2 returning id',['타인의 분류',ac[0].id])).rows.length,0);
 await assert.rejects(pg.query('select space_delete_category($1,$2)',[bc[0].id,ac[0].id]));
 const bp=await save({...base,id:randomUUID(),category_id:bc[0].id,author:'Bob',status:'public'},[{name:'공개',slug:'public'}]);
 await asUser(alice);const published=await save({...base,version:1,status:'public'},[{name:'금리',slug:'interest'}]);assert.equal(published.version,2);
 await assert.rejects(save({...base,version:1,title:'오래된 저장'}));
 await assert.rejects(save({...base,version:2,slug:'changed'}));
 await assert.rejects(pg.query('update space_posts set slug=$1 where id=$2',['changed',base.id]));
 await assert.rejects(pg.query('update space_spaces set owner_id=$1 where id=$2',[bob,a.id]));
 await assert.rejects(pg.query('update space_spaces set slug=$1 where id=$2',['changed',a.id]));
 assert.equal((await pg.query('update space_spaces set name=$1 where id=$2 returning id',['침입',b.id])).rows.length,0);
 const list=(await pg.query<any>('select space_list_posts(p_admin=>true) as result')).rows[0].result;assert.equal(list.total,1);assert.equal(list.posts[0].id,base.id);
 assert.equal((await pg.query('update space_posts set title=$1 where id=$2 returning id',['침입',bp.id])).rows.length,0);
 await assert.rejects(pg.query('insert into space_post_tags(post_id,tag_id,space_id) select $1,id,$2 from space_tags where space_id=$3',[base.id,a.id,b.id]));
 const aid=randomUUID();await pg.exec('reset role');await pg.query("insert into space_assets(id,post_id,space_id,storage_key,name,mime,size,ready) values($1,$2,$3,'private/key','image.png','image/png',100,true)",[aid,base.id,a.id]);
 await asUser(bob);assert.equal((await pg.query('select * from space_assets where id=$1',[aid])).rows.length,0);
 await assert.rejects(save({...bp,version:bp.version,cover_asset_id:aid}));
 await assert.rejects(pg.query("insert into space_assets(post_id,space_id,storage_key,name,mime,size,ready) values($1,$2,'private/key','x.png','image/png',100,true)",[bp.id,b.id]));
 await asUser(alice);assert.equal((await pg.query('select * from space_assets where id=$1',[aid])).rows.length,1);
 const cover=await save({...base,version:2,status:'public',cover_asset_id:aid});assert.equal(cover.version,3);
 await asAnon();assert.equal((await pg.query('select * from space_posts')).rows.length,2);await assert.rejects(pg.query('select * from space_assets'));await assert.rejects(save({...base,version:3}));await assert.rejects(pg.query('select space_list_posts(p_admin=>true)'));
 assert.equal((await pg.query<any>('select space_list_posts(p_space=>$1) as result',[a.id])).rows[0].result.total,1);
 await asUser(alice);await save({...base,version:3,status:'private'});await asAnon();assert.equal((await pg.query('select * from space_posts')).rows.length,1);
 await asUser(alice);await pg.query('select space_delete_category($1,$2)',[ac[0].id,ac[1].id]);
 const moved=(await pg.query<any>('select * from space_posts where id=$1',[base.id])).rows[0];assert.equal(moved.category_id,ac[1].id);assert.equal(moved.version,5);
 await pg.query("update space_posts set deleted_at=now(),status='private',version=version+1 where id=$1 and version=5",[base.id]);
 assert.equal((await pg.query<any>('select space_list_posts(p_admin=>true) as result')).rows[0].result.total,0);
 await asUser(bob);assert.equal((await pg.query<any>('select space_list_posts(p_admin=>true) as result')).rows[0].result.total,1);
 }finally{await pg.close();}
});
