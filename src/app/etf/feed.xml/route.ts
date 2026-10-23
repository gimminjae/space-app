export const dynamic='force-dynamic';
import { etfFeed } from '@/lib/etf-feed';
export async function GET() { return new Response(await etfFeed('ko'), {headers: {'Content-Type':'application/rss+xml; charset=utf-8'}}); }
