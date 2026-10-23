import {publicationAsset} from '@/lib/server/publication-files';
export async function GET(_r:Request,{params}:{params:Promise<{file:string}>}){return publicationAsset('etf-assets',(await params).file);}
