/** Only trust the client IP supplied by the current hosting platform. */
export function publishingClientIp(headers: Headers, platform: Readonly<Record<string,string|undefined>>) {
 const name = platform.VERCEL === '1' ? 'x-forwarded-for' : platform.NETLIFY === 'true' ? 'x-nf-client-connection-ip' : null;
 return (name ? headers.get(name)?.split(',')[0].trim() : undefined) || 'shared';
}
