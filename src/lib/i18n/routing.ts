export const locales=['ko','en'] as const;
export type Locale=typeof locales[number];
export const localeCookie='space_locale';
export function isLocale(value:unknown):value is Locale{return value==='ko'||value==='en';}
export function unlocalizePath(path:string){return path.replace(/^\/(?:en|ko)(?=\/|[?#]|$)/,'')||'/';}
export function isSharedPath(path:string){return /^\/(?:api|auth|media|_next|\.well-known)(?:\/|$)/.test(path)||/\.[a-z0-9]+$/i.test(path);}
export function localizePath(path:string,locale:Locale):string{
 if(!path.startsWith('/')||path.startsWith('//'))return path;
 const match=path.match(/^([^?#]*)(.*)$/)!;
 const pathname=unlocalizePath(match[1]),suffix=match[2];
 if(isSharedPath(pathname))return pathname+suffix;
 return (locale==='en'?`/en${pathname==='/'?'':pathname}`:pathname)+suffix;
}
