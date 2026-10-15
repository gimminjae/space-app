'use client';
import { useI18n } from '@/components/I18n';
export default function ErrorPage({reset}:{reset:()=>void}) {const {t}=useI18n();return <div className="standalone"><h1>{t("잠시 연결이 원활하지 않습니다.")}</h1><p>{t("잠시 후 다시 시도해 주세요.")}</p><button className="button" onClick={reset}>{t("다시 불러오기")}</button></div>;}
