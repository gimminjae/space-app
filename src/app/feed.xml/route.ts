import {publicationFeed} from '@/lib/server/publication-feed';
export const dynamic='force-dynamic';
export async function GET(){return new Response(await publicationFeed('ko'),{headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'no-store'}});}
