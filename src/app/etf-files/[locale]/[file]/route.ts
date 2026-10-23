import {publicationDownload} from '@/lib/server/publication-files';
export const dynamic='force-dynamic';
export async function GET(_r:Request,{params}:{params:Promise<{locale:string;file:string}>}){const{locale,file}=await params;return publicationDownload('etf',locale,file);}
