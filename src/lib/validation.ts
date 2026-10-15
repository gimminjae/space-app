import { z } from 'zod';
export const postSchema = z.object({
  id: z.uuid(), version: z.number().int().nonnegative(), title: z.string().trim().min(1,'제목을 입력해 주세요.').max(150),
  slug: z.string().min(1).max(120).regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, '주소에는 문자, 숫자, 하이픈을 사용할 수 있습니다.'),
  content: z.string().max(200_000), summary: z.string().max(300).default(''),
  status: z.enum(['public','private']), category_id: z.uuid().nullable(), cover_asset_id: z.uuid().nullable(),
  seo_title: z.string().max(150).default(''), seo_description: z.string().max(300).default(''),
  tags: z.array(z.string().trim().min(1).max(40)).max(12), author: z.string().trim().min(1).max(60),
}).superRefine((value,ctx) => { if(value.status === 'public' && !value.content.trim()) ctx.addIssue({code:'custom',path:['content'],message:'공개할 글의 본문을 입력해 주세요.'}); });
export const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;
export const allowedFiles: Record<string,string[]> = {
  'image/jpeg':['jpg','jpeg'], 'image/png':['png'], 'image/webp':['webp'], 'image/gif':['gif'],
  'application/pdf':['pdf'], 'text/plain':['txt'], 'text/csv':['csv'],
  'application/zip':['zip'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':['pptx'],
};
export function validateFile(name: string, mime: string, size: number) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return name.length <= 200 && size > 0 && size <= MAX_UPLOAD_SIZE && !!allowedFiles[mime]?.includes(ext);
}
