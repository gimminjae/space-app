import CollectionPage,{collectionMetadata} from '@/components/publication/CollectionPage';
export async function generateMetadata(){return collectionMetadata('etf');}
export default function Page(){return <CollectionPage kind="etf"/>;}
