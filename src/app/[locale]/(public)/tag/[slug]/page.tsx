import { Archive } from '@/components/Archive';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { getTags } from '@/lib/server/posts';
import { notFound } from 'next/navigation';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>};
export async function generateMetadata({params,searchParams}:Props) {const {t,locale,absolute}=await getI18n();const {slug}=await params; const page=Math.max(1,Math.min(10000,Number((await searchParams).page)||1)); const tag=(await getTags()).find(t=>t.slug===slug);return localizedMetadata({title:tag?`#${tag.name}`:t("태그"),alternates:{canonical:absolute(`/tag/${slug}${page>1?`?page=${page}`:""}`)}},locale);}
export default async function TagPage({params,searchParams}:Props) {const {t}=await getI18n();const {slug}=await params; const tag=(await getTags()).find(t=>t.slug===slug);if(!tag)notFound();return <Archive title={`#${tag.name}`} tag={slug} page={Math.max(1,Number((await searchParams).page)||1)}/>;}
