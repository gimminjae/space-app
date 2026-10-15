import {randomUUID} from 'node:crypto';
import {studioSpace} from '@/lib/server/spaces';
import {userDb} from '@/lib/server/session';
import {getCategories} from '@/lib/server/posts';
import {storageConfigured} from '@/lib/server/storage';
import Editor from '@/components/Editor';
import {site} from '@/lib/site';
export default async function NewPost(){const space=await studioSpace();return <Editor categories={await getCategories(space.id,true)} initialAssets={[]} storageReady={storageConfigured()} initial={{id:randomUUID(),space_id:space.id,title:'',slug:'',summary:'',content:'',status:'private',category_id:null,cover_asset_id:null,seo_title:'',seo_description:'',author:space.name,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),published_at:null,deleted_at:null,version:0,tags:[]}}/>;}
