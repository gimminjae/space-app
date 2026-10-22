import { permanentRedirect } from 'next/navigation';
import { getI18n } from '@/lib/i18n/server';
export default async function EtfIndex(){const {l}=await getI18n();permanentRedirect(l('/category/etf'));}
