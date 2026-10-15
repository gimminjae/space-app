import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
}).strict();

// Profile metadata is display-only. It never determines ownership or permissions.
export function displayNameOf(metadata: Record<string, unknown> | undefined): string {
  const value = metadata?.display_name;
  return typeof value === 'string' ? value.trim().slice(0, 60) : '';
}
