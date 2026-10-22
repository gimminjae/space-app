/** Reject invalid pages rather than generating an unlimited set of empty URLs. */
export function parsePage(value: unknown): number | null {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d{0,3}$/.test(value)) return null;
  return Number(value);
}

export function pageExists(page: number, total: number) {
  return page <= Math.max(1, Math.ceil(total / 9));
}

export function pagePath(path: string, page: number, query: Record<string, string> = {}) {
  const params = new URLSearchParams(query);
  if (page > 1) params.set('page', String(page));
  else params.delete('page');
  return `${path}${params.size ? `?${params}` : ''}`;
}
