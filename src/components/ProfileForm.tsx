'use client';

import { useState, type FormEvent } from 'react';
import { useI18n, useLocaleRouter } from './I18n';
import styles from './account.module.css';

export default function ProfileForm({ initialName }: { initialName: string }) {
  const { t, locale } = useI18n();
  const router = useLocaleRouter();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setSaved(false);
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-space-language': locale },
        body: JSON.stringify({ displayName: name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setName(data.displayName); setSavedName(data.displayName); setSaved(true);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : t('프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className={styles.profileForm}>
    <label htmlFor="display-name">{t('닉네임')}</label>
    <input id="display-name" name="displayName" autoComplete="nickname" value={name} required maxLength={60}
      aria-describedby="profile-hint" disabled={busy} onChange={e => { setName(e.target.value); setSaved(false); setError(''); }} />
    <p id="profile-hint" className={styles.hint}>{t('새 글의 기본 작성자 이름으로 사용합니다. 기존 글의 작성자는 바뀌지 않습니다.')}</p>
    {error && <p role="alert" className={styles.error}>{t(error)}</p>}
    {saved && <p role="status" className={styles.success}>{t('프로필을 저장했습니다.')}</p>}
    <button className="button" disabled={busy || !name.trim() || name.trim() === savedName}>
      {busy ? t('저장 중…') : t('프로필 저장')}
    </button>
  </form>;
}
