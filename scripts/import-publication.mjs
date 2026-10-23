import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const input=process.argv[2];if(!input)throw new Error('Provide the external export directory. Content is not bundled with source code.');
const client=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const docs=JSON.parse(await readFile(resolve(input,'documents.json'),'utf8'));
const settings=JSON.parse(await readFile(resolve(input,'settings.json'),'utf8'));
for(let offset=0;offset<docs.length;offset+=10){const {error}=await client.from('space_publication_documents').upsert(docs.slice(offset,offset+10),{onConflict:'kind,slug,locale',ignoreDuplicates:true});if(error)throw error;}
const config=await client.from('space_publication_settings').upsert(settings,{onConflict:'key',ignoreDuplicates:true});if(config.error)throw config.error;
const stored=await client.from('space_publication_documents').select('kind,slug,locale,title,content,metadata,summary,seo_title');if(stored.error)throw stored.error;
for(const doc of docs){const row=stored.data.find(r=>r.kind===doc.kind&&r.slug===doc.slug&&r.locale===doc.locale);if(!row)throw new Error('Missing document '+doc.slug);for(const field of ['title','content','summary','seo_title'])if(row[field]!==doc[field])throw new Error('Import mismatch '+doc.slug+' '+field);}
console.log(`Verified exact text and SEO fields for ${docs.length} documents and imported ${settings.length} settings records.`);
const bucket=process.env.SUPABASE_PUBLICATION_BUCKET||'space-publication-assets';
const buckets=await client.storage.listBuckets();if(buckets.error)throw buckets.error;
if(!buckets.data.some(b=>b.id===bucket)){const created=await client.storage.createBucket(bucket,{public:false,fileSizeLimit:5242880,allowedMimeTypes:['image/png','image/svg+xml','image/jpeg','image/webp']});if(created.error)throw created.error;}
let assets=0;
for(const directory of ['learn-assets','etf-assets'])for(const name of await readdir(resolve(input,'assets',directory))){
 const bytes=await readFile(resolve(input,'assets',directory,name));const mime=name.endsWith('.svg')?'image/svg+xml':'image/png';
 const upload=await client.storage.from(bucket).upload(`${directory}/${name}`,bytes,{contentType:mime,upsert:true});if(upload.error)throw upload.error;
 const download=await client.storage.from(bucket).download(`${directory}/${name}`);if(download.error)throw download.error;
 if(createHash('sha256').update(bytes).digest('hex')!==createHash('sha256').update(Buffer.from(await download.data.arrayBuffer())).digest('hex'))throw new Error('Asset mismatch '+name);assets++;
}
console.log(`Uploaded and byte-verified ${assets} content illustrations and cover images.`);
