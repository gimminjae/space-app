import {getCategories} from '@/lib/server/posts';
import {Archive} from '@/components/Archive';
import {notFound} from 'next/navigation';
import {absolute} from '@/lib/site';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>};
export async function generateMetadata({params,searchParams}:Props) {const {slug}=await params; const page=Math.max(1,Math.min(10000,Number((await searchParams).page)||1)); const c=(await getCategories()).find(c=>c.slug===slug);return {title:c?.name||'카테고리',description:c?.description,alternates:{canonical:absolute(`/category/${slug}${page>1?`?page=${page}`:""}`)}};}
export default async function CategoryPage({params,searchParams}:Props) {const {slug}=await params; const c=(await getCategories()).find(c=>c.slug===slug);if(!c)notFound();return <Archive title={c.name} description={c.description} category={slug} page={Math.max(1,Number((await searchParams).page)||1)}/>;}
