import Taxonomy from '@/components/Taxonomy';
import { dbError } from '@/lib/server/db';
import { getCategories } from '@/lib/server/posts';
import { userDb } from '@/lib/server/session';
import { studioSpace } from '@/lib/server/spaces';
export default async function TaxonomyPage(){const space=await studioSpace();const [categories,tags]=await Promise.all([getCategories(space.id,true),(await userDb()).from('space_tags').select('*').eq('space_id',space.id).order('name')]);dbError(tags.error);return <Taxonomy categories={categories} tags={tags.data||[]}/>;}
