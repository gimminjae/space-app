import {isAdmin} from '@/lib/server/auth';
import {getCategories} from '@/lib/server/posts';
import {db,dbError} from '@/lib/server/db';
import Taxonomy from '@/components/Taxonomy';
export default async function TaxonomyPage(){if(!await isAdmin())return null;const [categories,tags]=await Promise.all([getCategories(),db(true).from('space_tags').select('*').order('name')]);dbError(tags.error);return <Taxonomy categories={categories} tags={tags.data||[]}/>;}
