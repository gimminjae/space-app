import { courseFeed } from '@/lib/learn-feed';

export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'ko';
  return new Response(await courseFeed(locale), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Content-Language': locale, 'Cache-Control': 'public, max-age=3600' } });
}
