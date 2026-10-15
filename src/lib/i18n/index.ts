import { defaultCategories } from '@/lib/default-categories';
import type { Category } from '@/lib/types';
import en from './en.json';
import { type Locale,localizePath } from './routing';
export type Message=keyof typeof en;
export function translator(locale:Locale){return (message:string,values:Record<string,string|number>={})=>{
 const text=locale==='en'&&Object.hasOwn(en,message)?en[message as Message]:message;
 return text.replace(/\{(\w+)\}/g,(match,key)=>values[key]===undefined?match:String(values[key]));
};}
export function formatDate(value:string|null,locale:Locale){return value?new Intl.DateTimeFormat(locale==='en'?'en-US':'ko-KR',{year:'numeric',month:locale==='en'?'short':'2-digit',day:locale==='en'?'numeric':'2-digit',timeZone:'Asia/Seoul'}).format(new Date(value)):translator(locale)('미발행');}
export function i18n(locale:Locale){return {locale,category:(value:Category)=>{const original=defaultCategories.find(c=>c.slug===value.slug&&c.name===value.name&&c.description===value.description);return original?{...value,name:translator(locale)(value.name),description:translator(locale)(value.description)}:value;},t:translator(locale),l:(path:string)=>localizePath(path,locale),date:(value:string|null)=>formatDate(value,locale),number:(value:number)=>new Intl.NumberFormat(locale).format(value)};}
