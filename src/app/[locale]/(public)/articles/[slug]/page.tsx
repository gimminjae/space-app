import PublicationPage,{publicationMetadata} from '@/components/publication/PublicationPage';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){return publicationMetadata('article',(await params).slug);}
export default async function Page({params}:Props){return <PublicationPage kind="article" slug={(await params).slug}/>;}
