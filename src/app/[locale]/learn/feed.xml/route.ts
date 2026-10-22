import { courseFeed } from '@/lib/learn-feed';
import { isLocale } from '@/lib/i18n/routing';

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response(null, { status: 404 });
  return new Response(await courseFeed(locale), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Content-Language': locale, 'Cache-Control': 'public, max-age=3600' } });
}
