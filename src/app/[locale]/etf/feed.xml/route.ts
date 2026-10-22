import { etfFeed } from '@/lib/etf-feed';
import { notFound } from 'next/navigation';
export async function GET(_request: Request, {params}: {params: Promise<{locale:string}>}) { if ((await params).locale !== 'en') notFound(); return new Response(await etfFeed('en'), {headers: {'Content-Type':'application/rss+xml; charset=utf-8'}}); }
