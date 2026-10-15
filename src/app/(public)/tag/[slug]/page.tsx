import {getTags} from '@/lib/server/posts';
import {Archive} from '@/components/Archive';
import {notFound} from 'next/navigation';
import {absolute} from '@/lib/site';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>};
export async function generateMetadata({params,searchParams}:Props) {const {slug}=await params; const page=Math.max(1,Math.min(10000,Number((await searchParams).page)||1)); const t=(await getTags()).find(t=>t.slug===slug);return {title:t?`#${t.name}`:'태그',alternates:{canonical:absolute(`/tag/${slug}${page>1?`?page=${page}`:""}`)}};}
export default async function TagPage({params,searchParams}:Props) {const {slug}=await params; const t=(await getTags()).find(t=>t.slug===slug);if(!t)notFound();return <Archive title={`#${t.name}`} tag={slug} page={Math.max(1,Number((await searchParams).page)||1)}/>;}
