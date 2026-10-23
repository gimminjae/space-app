import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {publicationSubmissionSchema,submissionEntries,publicationPath} from '../src/lib/publication';

test('public submission only creates new article editions with bounded input',()=>{
 const edition={locale:'ko',title:'공개 작성 예시',content:'본문과 출처를 작성합니다. '.repeat(20)};
 assert.equal(publicationSubmissionSchema.safeParse({kind:'page',editions:[edition]}).success,false);
 assert.equal(publicationSubmissionSchema.safeParse({editions:[edition,edition]}).success,false);
 assert.equal(publicationSubmissionSchema.safeParse({id:randomUUID(),editions:[edition]}).success,false);
 assert.equal(publicationSubmissionSchema.safeParse({editions:[{...edition,content:' '}]}).success,false);
 assert.equal(publicationSubmissionSchema.safeParse({editions:[{...edition,coverImage:'javascript:alert(1)'}]}).success,false);
 const value=publicationSubmissionSchema.parse({kind:'etf',slug:'new-etf',editions:[edition]});
 const entry=submissionEntries(value,'new-etf')[0];assert.ok(entry.summary);assert.equal(entry.seo_title,edition.title);
 assert.equal(publicationPath({kind:'etf',slug:'schd',locale:'ko'}),'/etf/schd');
 assert.equal(publicationPath({kind:'lesson',slug:'inside-an-etf',locale:'en'}),'/en/learn/inside-an-etf');
});

test('publication database isolates drafts, prohibits direct public writes, and publishes bilingual requests atomically',async()=>{
 const pg=new PGlite();
 await pg.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon,authenticated,service_role;');
 await pg.exec(readFileSync('supabase/migrations/20261023043918_publication_content_store.sql','utf8'));
 const entry={kind:'article',slug:'example',locale:'ko',title:'글 제목',content:'안전한 본문',author:'Author',tags:[],metadata:{}};
 const publish=(entries:object[],key=randomUUID(),fingerprint='fingerprint',rate='test-client')=>pg.query<{result:any}>('select public.space_publish_documents($1,$2,$3,$4) as result',[JSON.stringify(entries),key,fingerprint,rate]);
 await pg.exec('set role anon');
 await assert.rejects(publish([entry]));
 await assert.rejects(pg.query("insert into space_publication_documents(kind,slug,locale,title,content) values ('page','privacy','ko','changed','changed')"));
 await assert.rejects(pg.query('select * from space_publication_requests'));
 await pg.exec('set role service_role');
 await pg.query("insert into space_publication_documents(kind,slug,locale,title,content,status) values ('article','draft','ko','draft','private content','draft')");
 const key=randomUUID(),first=await publish([entry,{...entry,locale:'en'}],key);
 assert.equal(first.rows[0].result.length,2);
 assert.deepEqual((await publish([entry,{...entry,locale:'en'}],key)).rows,first.rows);
 await assert.rejects(publish([entry],key,'changed'),/idempotency_conflict/);
 await assert.rejects(publish([{...entry,slug:'should-rollback'},entry]));
 assert.equal((await pg.query("select id from space_publication_documents where slug='should-rollback'")).rows.length,0);
 await pg.exec('set role anon');
 assert.equal((await pg.query('select * from space_publication_documents')).rows.length,2);
 await assert.rejects(pg.query("update space_publication_documents set title='overwritten'"));
 await pg.exec('set role service_role');
 for(let i=1;i<20;i++)await publish([{...entry,slug:`article-${i}`}]);
 await assert.rejects(publish([{...entry,slug:'over-limit'}]),/rate_limit/);
 await pg.close();
});


test('cover images cannot break article metadata or the sitemap',()=>{
 const entry={locale:'ko',title:'검증 제목',content:'본문을 충분히 작성합니다. '.repeat(10)};
 for(const coverImage of ['https://','https://[invalid','javascript:alert(1)','//evil.invalid/a.png','/etf-assets/../../about','https://user:pass@example.com/a.png'])assert.equal(publicationSubmissionSchema.safeParse({editions:[{...entry,coverImage}]}).success,false,coverImage);
 for(const coverImage of ['', 'https://example.com/image.png','/etf-assets/schd.ko.og.png'])assert.equal(publicationSubmissionSchema.safeParse({editions:[{...entry,coverImage}]}).success,true,coverImage);
});

test('briefing metadata is date-bound and cannot be assigned to unrelated content',()=>{
 const editions=[{locale:'ko',title:'브리핑 검증',content:'오늘의 경제와 시장을 설명합니다. '.repeat(20),coverImage:'/briefing-assets/market.ko.png'}];
 const sample={kind:'article',category:'us-market-briefing',sessionDate:'2026-10-22',dataAsOf:'2026-10-23T08:30:00+09:00',editions};
 const value=publicationSubmissionSchema.parse(sample),entry=submissionEntries(value,'us-market-briefing-2026-10-22')[0];
 assert.equal(entry.metadata.category,'us-market-briefing');assert.equal(entry.metadata.sessionDate,'2026-10-22');
 for(const change of [{sessionDate:'2026-02-30'},{category:undefined}])assert.equal(publicationSubmissionSchema.safeParse({...sample,...change}).success,false);
});
