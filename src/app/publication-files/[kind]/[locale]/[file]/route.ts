import {publicationDownload} from '@/lib/server/publication-files';
export const dynamic='force-dynamic';
export async function GET(_r:Request,{params}:{params:Promise<{kind:string;locale:string;file:string}>}){const{kind,locale,file}=await params;return publicationDownload(kind,locale,file);}
