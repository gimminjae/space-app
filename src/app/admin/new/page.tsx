import {randomUUID} from 'node:crypto';
import {isAdmin} from '@/lib/server/auth';
import {getCategories} from '@/lib/server/posts';
import {storageConfigured} from '@/lib/server/storage';
import Editor from '@/components/Editor';
import {site} from '@/lib/site';
export default async function NewPost(){if(!await isAdmin())return null;return <Editor categories={await getCategories()} initialAssets={[]} storageReady={storageConfigured()} initial={{id:randomUUID(),title:'',slug:'',summary:'',content:'',status:'private',category_id:null,cover_asset_id:null,seo_title:'',seo_description:'',author:site.author,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),published_at:null,deleted_at:null,version:0,tags:[]}}/>;}
