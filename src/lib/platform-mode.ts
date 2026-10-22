// Temporarily run Space as an editorial publication. Existing member data is retained.
export const contentOnly = true;

export function isPersonalServicePath(path: string) {
  let decoded = path;
  try { decoded = decodeURIComponent(path); } catch { /* Invalid encodings have no matching route. */ }
  const normalized = decoded.replace(/^\/(?:en|ko)(?=\/|$)/, '') || '/';
  return /^\/(?:login|signup|forgot-password|onboarding|mypage|account|admin|spaces|s|auth|api)(?:\/|$)/.test(normalized);
}
