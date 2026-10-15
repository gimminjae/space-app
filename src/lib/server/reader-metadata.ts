import 'server-only';
import {getI18n,localizedMetadata} from '@/lib/i18n/server';
import {economyText,type EconomyMessage} from '@/lib/economy/messages';
export async function readerMetadata(key:EconomyMessage,path:string,privatePage=false){const {locale,absolute}=await getI18n(),title=economyText(locale,key);return localizedMetadata({title,description:title+' · space',...(privatePage?{robots:{index:false,follow:false,nocache:true}}:{alternates:{canonical:absolute(path)},openGraph:{title,url:absolute(path)}})},locale);}
