import CollectionPage,{collectionMetadata} from '@/components/publication/CollectionPage';
export async function generateMetadata(){return collectionMetadata('lesson');}
export default function Page(){return <CollectionPage kind="lesson"/>;}
