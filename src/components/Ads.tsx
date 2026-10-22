import { getI18n } from '@/lib/i18n/server';
import { adConfiguration } from '@/lib/advertising';
import AdUnit from './AdUnit';
export default async function Ads() {
 const configuration=adConfiguration(process.env);if(!configuration)return null;
 const {locale}=await getI18n();return <AdUnit {...configuration} label={locale==='ko'?'광고':'Advertisement'}/>;
}
