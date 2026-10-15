import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { t } from '../i18n';
import useChurchStore from '../store/churchStore';
import useVaultStore from '../store/vaultStore';
import { toast } from '../store/toastStore';
import { CHURCH_NAME_MAX } from '../lib/churchAnchor';
import { Input, SecondaryButton } from './shared/Primitives';

// "My church": the congregation and small group the person prays with, named so
// the Church circle, the Sunday card and a testimony can point back to them.
// Encrypted under the account key (lib/churchAnchor.js); editable only while the
// vault is open, because that is the only time it can be read or written.
export default function ChurchSettings({ lang, userId }) {
  const anchor = useChurchStore((s) => s.anchor);
  const save = useChurchStore((s) => s.save);
  const unlocked = useVaultStore((s) => s.unlocked);
  const [church, setChurch] = useState(anchor.church);
  const [smallGroup, setSmallGroup] = useState(anchor.smallGroup);
  const [saving, setSaving] = useState(false);

  // The anchor arrives after the vault opens; show it once it does.
  useEffect(() => {
    setChurch(anchor.church);
    setSmallGroup(anchor.smallGroup);
  }, [anchor.church, anchor.smallGroup]);

  if (!unlocked) {
    return (
      <p className="q-meta flex items-start gap-1.5">
        <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {t(lang, 'churchLocked')}
      </p>
    );
  }

  const changed = church.trim() !== anchor.church || smallGroup.trim() !== anchor.smallGroup;

  const submit = async (event) => {
    event.preventDefault();
    if (!changed || saving) return;
    setSaving(true);
    const ok = await save(userId, { church, smallGroup });
    setSaving(false);
    if (ok) toast.success(t(lang, 'churchSaved'));
    else toast.error(t(lang, 'churchSaveFailed'));
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <p className="settings-row__sub flex items-start gap-1.5">
        <Lock size={13} className="mt-0.5 shrink-0" aria-hidden="true" /> {t(lang, 'churchSectionDesc')}
      </p>
      <label className="grid gap-1.5">
        <span className="settings-row__label">{t(lang, 'churchNameLabel')}</span>
        <Input value={church} maxLength={CHURCH_NAME_MAX} onChange={(e) => setChurch(e.target.value)} placeholder={t(lang, 'churchNamePlaceholder')} autoComplete="off" />
      </label>
      <label className="grid gap-1.5">
        <span className="settings-row__label">{t(lang, 'smallGroupLabel')}</span>
        <Input value={smallGroup} maxLength={CHURCH_NAME_MAX} onChange={(e) => setSmallGroup(e.target.value)} placeholder={t(lang, 'smallGroupPlaceholder')} autoComplete="off" />
      </label>
      <div>
        <SecondaryButton type="submit" disabled={!changed || saving}>{t(lang, 'save')}</SecondaryButton>
      </div>
    </form>
  );
}
