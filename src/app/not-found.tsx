import Link from '@/components/I18n';
import { getI18n } from '@/lib/i18n/server';
export default async function NotFound(){const {t,l}=await getI18n();return <main className="standalone"><a className="wordmark" href={l("/")}>space.</a><p className="eyebrow">404 / PAGE NOT FOUND</p><h1>{t("이 페이지는 비어 있습니다.")}</h1><p>{t("주소가 바뀌었거나 공개되지 않은 글입니다.")}</p><Link className="button" href="/">{t("아티클 둘러보기")}</Link></main>;}
