import 'server-only';
import { dbError } from './db';
import { requireUser } from './auth';
import { userDb } from './session';
import { mySpace } from './spaces';
import type { Post } from '@/lib/types';

type RecentPost = Pick<Post, 'id' | 'title' | 'status' | 'updated_at'>;

export async function accountOverview() {
  await requireUser();
  const space = await mySpace();
  if (!space) return { space: null, publicCount: 0, privateCount: 0, recentPosts: [] as RecentPost[] };
  const client = await userDb();
  const ownedPosts = () => client.from('space_posts');
  const [published, drafts, recent] = await Promise.all([
    ownedPosts().select('id', { count: 'exact', head: true }).eq('space_id', space.id).eq('status', 'public').is('deleted_at', null),
    ownedPosts().select('id', { count: 'exact', head: true }).eq('space_id', space.id).eq('status', 'private').is('deleted_at', null),
    ownedPosts().select('id,title,status,updated_at').eq('space_id', space.id).is('deleted_at', null).order('updated_at', { ascending: false }).order('id').limit(5),
  ]);
  for (const result of [published, drafts, recent]) dbError(result.error);
  return { space, publicCount: published.count || 0, privateCount: drafts.count || 0, recentPosts: (recent.data || []) as RecentPost[] };
}
