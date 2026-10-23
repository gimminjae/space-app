import PublicationPage,{publicationMetadata} from '@/components/publication/PublicationPage';
export async function generateMetadata(){return publicationMetadata('page','about');}
export default function Page(){return <PublicationPage kind="page" slug="about"/>;}
