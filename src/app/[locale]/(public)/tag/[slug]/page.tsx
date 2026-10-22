import { Archive } from '@/components/Archive';
import { getI18n,localizedMetadata } from '@/lib/i18n/server';
import { getTags,publicPostPage } from '@/lib/server/posts';
import { parsePage,pageExists,pagePath } from '@/lib/pagination';
import { notFound } from 'next/navigation';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>};
export async function generateMetadata({params,searchParams}:Props) {
 const {locale,absolute}=await getI18n();const {slug}=await params;const page=parsePage((await searchParams).page),tag=(await getTags()).find(t=>t.slug===slug);
 if(!tag||page===null)notFound();const result=await publicPostPage(page,undefined,slug);if(!pageExists(page,result.total))notFound();
 const title=`#${tag.name}`+(page>1?(locale==='ko'?` · ${page}페이지`:` · Page ${page}`):'');
 const description=locale==='ko'?`${tag.name} 주제의 경제 이야기를 모았습니다. 관련 글을 읽고 생각의 폭을 넓혀 보세요.`:`Explore public articles about ${tag.name} and discover related economic perspectives.`;
 return localizedMetadata({title,description,alternates:{canonical:absolute(pagePath(`/tag/${slug}`,page))},robots:result.total?undefined:{index:false,follow:true}},locale);
}
export default async function TagPage({params,searchParams}:Props) {
 const {slug}=await params;const tag=(await getTags()).find(t=>t.slug===slug),page=parsePage((await searchParams).page);if(!tag||page===null)notFound();return <Archive title={`#${tag.name}`} tag={slug} page={page}/>;
}
