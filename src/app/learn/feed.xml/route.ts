import { courseFeed } from '@/lib/learn-feed';

export async function GET() {
  return new Response(await courseFeed('ko'), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Content-Language': 'ko', 'Cache-Control': 'public, max-age=3600' } });
}
