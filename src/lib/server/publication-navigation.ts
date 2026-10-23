import 'server-only';
import {z} from 'zod';
import {getPublicationSettings} from './publications';
import {getPublicationCategories} from './publication-categories';
import {categoryName,categoryPath} from '../publication-categories';
import type {Locale} from '../i18n/routing';
const item=z.object({href:z.string().regex(/^\/(?!\/)[a-zA-Z0-9/._-]*$/),ko:z.string().min(1).max(100),en:z.string().min(1).max(100),sort_order:z.number()});
const config=z.object({header:z.array(item).max(50),footer:z.array(item).max(50),tagline:z.object({ko:z.string().max(300),en:z.string().max(300)})});
export async function publicationNavigation(locale:Locale){
 const [settings,categories]=await Promise.all([getPublicationSettings('navigation'),getPublicationCategories()]);
 const value=config.parse(settings.value);
 const links=(position:'header'|'footer')=>[
  ...value[position].map(i=>({href:i.href,label:i[locale],order:i.sort_order})),
  ...categories.filter(c=>position==='header'?c.show_in_header:c.show_in_footer).map(c=>({href:categoryPath(c),label:categoryName(c,locale),order:c.sort_order})),
 ].sort((a,b)=>a.order-b.order||a.href.localeCompare(b.href));
 return {header:links('header'),footer:links('footer'),tagline:value.tagline[locale]};
}
