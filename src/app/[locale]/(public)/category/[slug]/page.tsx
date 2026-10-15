import { Archive } from '@/components/Archive';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { getCategories } from '@/lib/server/posts';
import { notFound } from 'next/navigation';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>};
export async function generateMetadata({params,searchParams}:Props) {const {t,locale,category,absolute}=await getI18n();const {slug}=await params; const page=Math.max(1,Math.min(10000,Number((await searchParams).page)||1)); const c=(await getCategories()).find(c=>c.slug===slug);return localizedMetadata({title:(c?category(c).name:undefined)||t("카테고리"),description:c?category(c).description:undefined,alternates:{canonical:absolute(`/category/${slug}${page>1?`?page=${page}`:""}`)}},locale);}
export default async function CategoryPage({params,searchParams}:Props) {const {category}=await getI18n();const {slug}=await params; const c=(await getCategories()).find(c=>c.slug===slug);if(!c)notFound();return <Archive title={category(c).name} description={c.description} category={slug} page={Math.max(1,Number((await searchParams).page)||1)}/>;}
