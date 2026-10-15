import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
export async function markdownHtml(content:string) {return String(await unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify).process(content));}
