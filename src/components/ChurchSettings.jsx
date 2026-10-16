import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { t } from '../i18n';
import useChurchStore from '../store/churchStore';
import useVaultStore from '../store/vaultStore';
import { toast } from '../store/toastStore';
import { CHURCH_NAME_MAX } from '../lib/churchAnchor';
import { Input, SecondaryButton } from './shared/Primitives';

// "My church": the congregation the person prays with, named so the Church
// circle, the Sunday card and a testimony can point back to it.
// Encrypted under the account key (lib/churchAnchor.js); editable only while the
// vault is open, because that is the only time it can be read or written.
export default function ChurchSettings({ lang, userId }) {
  const anchor = useChurchStore((s) => s.anchor);
  const save = useChurchStore((s) => s.save);
  const unlocked = useVaultStore((s) => s.unlocked);
  const [church, setChurch] = useState(anchor.church);
  const [saving, setSaving] = useState(false);

  // The anchor arrives after the vault opens; show it once it does.
  useEffect(() => {
    setChurch(anchor.church);
  }, [anchor.church]);

  if (!unlocked) {
    return (
      <p className="q-meta flex items-start gap-1.5">
        <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {t(lang, 'churchLocked')}
      </p>
    );
  }

  const changed = church.trim() !== anchor.church;

  const submit = async (event) => {
    event.preventDefault();
    if (!changed || saving) return;
    setSaving(true);
    const ok = await save(userId, { church });
    setSaving(false);
    if (ok) toast.success(t(lang, 'churchSaved'));
    else toast.error(t(lang, 'churchSaveFailed'));
  };

  return (
    <form onSubmit={submit} className="church-form">
      <label htmlFor="church-name" className="settings-row__label">{t(lang, 'churchNameLabel')}</label>
      <div className="church-form__row">
        <Input id="church-name" value={church} maxLength={CHURCH_NAME_MAX} onChange={(e) => setChurch(e.target.value)} placeholder={t(lang, 'churchNamePlaceholder')} autoComplete="off" />
        <SecondaryButton type="submit" disabled={!changed || saving}>{t(lang, 'save')}</SecondaryButton>
      </div>
    </form>
  );
}
