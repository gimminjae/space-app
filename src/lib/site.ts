export const site = {
  name: 'space',
  title: '경제를 이해하는 나만의 공간',
  description: '복잡한 경제를 차분하게 읽습니다. 경제 기초부터 금리, 금융, 기업과 일상의 변화까지, 나의 시야를 넓히는 경제 블로그 space.',
  url: process.env.SITE_URL || 'https://space.service.io.kr',
  author: process.env.SITE_AUTHOR || 'space 에디터',
  // The operator's existing public contact on service.io.kr.
  contactEmail: process.env.CONTACT_EMAIL || 'min356812@naver.com',
};
export function absolute(path = '/') { return new URL(path, site.url).toString(); }
export function dateLabel(value: string | null) { return value ? new Intl.DateTimeFormat('ko-KR', {year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Seoul'}).format(new Date(value)) : '미발행'; }
export function readingMinutes(content: string) { return Math.max(1, Math.ceil(content.length / 650)); }
export function slugify(input: string) { return input.normalize('NFKC').toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/[\s-]+/g, '-').replace(/^-|-$/g, '').slice(0, 100); }
export function excerpt(content: string) { return content.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[#*_>`~|]/g,'').replace(/\s+/g,' ').trim().slice(0,160); }
export function xmlEscape(input: string) { return input.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!)); }

export function postPath(post:{slug:string;space?:{slug:string}}){return post.space?`/s/${post.space.slug}/posts/${post.slug}`:`/posts/${post.slug}`;}
