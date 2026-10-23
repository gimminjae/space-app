import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {categorySubmissionError,categoryName,categoryPath,type PublicationCategory} from '../src/lib/publication-categories';
const migration=readFileSync('supabase/migrations/20261023105843_publication_categories.sql','utf8');
test('DB categories preserve old URLs and support future categories with distinct publishing rules',()=>{
 const normal={slug:'bonds',kind:'article',name_ko:'채권',name_en:'Bonds',accepts_submissions:true,is_default:false,requires_session_date:false} as PublicationCategory;
 const briefing={...normal,slug:'us-market-briefing',requires_session_date:true};
 assert.equal(categorySubmissionError({kind:'article',category:'bonds'},normal),null);
 assert.ok(categorySubmissionError({kind:'article',sessionDate:'2026-10-22'},normal));
 assert.ok(categorySubmissionError({kind:'etf'},normal));
 assert.ok(categorySubmissionError({kind:'article'},{...normal,accepts_submissions:false}));
 assert.ok(categorySubmissionError({kind:'article'},undefined));
 assert.ok(categorySubmissionError({kind:'article'},briefing));
 assert.ok(categorySubmissionError({kind:'article',sessionDate:'2026-10-22',slug:'wrong'},briefing));
 assert.equal(categorySubmissionError({kind:'article',sessionDate:'2026-10-22',slug:'us-market-briefing-2026-10-22'},briefing),null);
 assert.equal(categoryPath(normal),'/category/bonds');assert.equal(categoryName({...normal,name_ko:'채권 시장'},'ko'),'채권 시장');
 assert.equal(categoryPath({...normal,kind:'lesson',is_default:true}),'/learn');
});
test('category migration preserves documents, RLS, legacy publishing, and category moves',async()=>{
 const pg=new PGlite();
 try{
 await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;grant usage on schema public to anon,authenticated,service_role;');
 await pg.exec(readFileSync('supabase/migrations/20261023043918_publication_content_store.sql','utf8'));
 for(const key of ['learn','etf','us-market-briefing','kr-market-briefing'])await pg.query('insert into space_publication_settings(key,value)values($1,$2)',[key,JSON.stringify({ko:{name:key,summary:key},en:{name:key,summary:key}})]);
 await pg.exec("insert into space_publication_documents(kind,slug,locale,title,content,status,updated_at) values('lesson','example','ko','title','body','published','2026-01-01T00:00:00Z');");
 await pg.exec(migration);
 const old=(await pg.query<{category_slug:string;updated_at:string}>('select category_slug,updated_at from space_publication_documents')).rows[0];assert.equal(old.category_slug,'learn');assert.equal(new Date(old.updated_at).toISOString(),'2026-01-01T00:00:00.000Z');
 await pg.exec('set role anon');assert.equal((await pg.query('select * from space_publication_categories')).rows.length,5);
 for(const sql of ["insert into space_publication_categories(slug,name_ko,name_en)values('unauthorized','bad','bad')","update space_publication_categories set name_en='bad'","delete from space_publication_categories"])await assert.rejects(pg.exec(sql));
 await pg.exec('set role service_role');
 await pg.exec("insert into space_publication_categories(slug,name_ko,name_en)values('bonds','채권','Bonds');");
 const entry={kind:'article',slug:'new',locale:'ko',title:'new',content:'body',author:'Author',tags:[],metadata:{category:'bonds'}};
 const key=randomUUID();const publish=()=>pg.query('select space_publish_documents($1,$2,$3,$4)',[JSON.stringify([entry]),key,'same-fingerprint','client']);
 assert.deepEqual((await publish()).rows,(await publish()).rows);
 assert.equal((await pg.query<{category_slug:string}>("select category_slug from space_publication_documents where slug='new'")).rows[0].category_slug,'bonds');
 await pg.exec("update space_publication_documents set category_slug='general' where slug='new';");
 assert.equal((await pg.query<{category:string}>("select metadata->>'category' as category from space_publication_documents where slug='new'")).rows[0].category,'general');
 await assert.rejects(pg.exec("update space_publication_documents set category_slug='etf' where slug='new'"),/invalid_publication_category/);
 await assert.rejects(pg.exec("delete from space_publication_categories where slug='general'"));
 await assert.rejects(pg.exec("update space_publication_categories set slug='renamed' where slug='bonds'"),/identity/);
 await pg.exec("update space_publication_categories set name_ko='채권 시장',show_in_header=false where slug='bonds'");
 }finally{await pg.close();}
});
