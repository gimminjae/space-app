import { Archive } from '@/components/Archive';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { getCategories,publicPostPage } from '@/lib/server/posts';
import { parsePage,pageExists,pagePath } from '@/lib/pagination';
import { notFound } from 'next/navigation';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>};
export async function generateMetadata({params,searchParams}:Props) {
 const {locale,category,absolute}=await getI18n();const {slug}=await params;
 const page=parsePage((await searchParams).page),c=(await getCategories()).find(c=>c.slug===slug);
 if(!c||page===null)notFound();const result=await publicPostPage(page,slug);if(!pageExists(page,result.total))notFound();
 const label=category(c),title=label.name+(page>1?(locale==='ko'?` · ${page}페이지`:` · Page ${page}`):'');
 const description=label.description||(locale==='ko'?`${label.name}에 관한 공개 글을 모았습니다.`:`Read public articles about ${label.name}.`);
 return localizedMetadata({title,description,alternates:{canonical:absolute(pagePath(`/category/${slug}`,page))},robots:result.total?undefined:{index:false,follow:true}},locale);
}
export default async function CategoryPage({params,searchParams}:Props) {
 const {category}=await getI18n();const {slug}=await params;const c=(await getCategories()).find(c=>c.slug===slug),page=parsePage((await searchParams).page);if(!c||page===null)notFound();
 return <Archive title={category(c).name} description={category(c).description} category={slug} page={page}/>;
}
