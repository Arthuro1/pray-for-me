import { useState } from 'react';
import useAuthStore from '../store/authStore';
import ConfirmDialog from './shared/ConfirmDialog';
import { startFreshEncryption } from '../lib/crypto/accountKey';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import AccountGate from './AccountGate';
import { SecondaryButton } from './shared/Primitives';
import { isNewAppOrigin, ORIGINAL_APP_URL, ORIGINAL_WWW_APP_URL } from '../lib/originMigration';
import { originMigrationCopy } from '../lib/originMigrationCopy';
import { PrayerRecoveryChoices } from './PrayerProtection';

// ORPHANED means this device has no account key or legacy vault wrapper.
// Independent passkey/emergency wrappers may still exist: the recovery choices
// check those before the person decides whether to return to an original device
// or explicitly start fresh. The gate must not claim no recovery was configured.
export default function AccountKeyRecoveryScreen({ lang = 'fr', onResolved }) {
  const { user, signOut } = useAuthStore();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const { copy, lang: copyLang } = originMigrationCopy(lang);

  const handleStartFresh = async () => {
    setWorking(true);
    const ok = await startFreshEncryption(user.id);
    setWorking(false);
    setConfirming(false);
    if (!ok) { toast.error(t(lang, 'errorGeneric')); return; }
    onResolved?.();
  };

  return (
    <AccountGate
      lang={lang}
      title={t(lang, 'keyMissingHeading')}
      body={t(lang, 'keyMissingBody')}
      reassure={t(lang, 'keyMissingReassure')}
      exitLabel={t(lang, 'keyMissingRetry')}
      onExit={signOut}
    >
      <PrayerRecoveryChoices key={user?.id} userId={user?.id} lang={lang} onRecovered={onResolved} />
      {isNewAppOrigin() && (
        <div lang={copyLang} dir="ltr" className="mb-4">
          <p className="q-body-sm">{copy.returnBody}</p>
          <a className="secondary-button no-underline" href={ORIGINAL_APP_URL} target="_blank" rel="noopener noreferrer">{copy.return}</a>
          <p className="q-body-sm mt-3"><a href={ORIGINAL_WWW_APP_URL} target="_blank" rel="noopener noreferrer">{copy.returnWww}</a></p>
        </div>
      )}
      <SecondaryButton danger onClick={() => setConfirming(true)} className="w-full">
        {t(lang, 'keyMissingStartFresh')}
      </SecondaryButton>

      {confirming && (
        <ConfirmDialog
          title={t(lang, 'keyMissingStartFreshTitle')}
          message={t(lang, 'keyMissingStartFreshWarn')}
          confirmLabel={t(lang, 'keyMissingStartFreshConfirm')}
          cancelLabel={t(lang, 'cancel')}
          danger
          loading={working}
          onConfirm={handleStartFresh}
          onCancel={() => setConfirming(false)}
        />
      )}
    </AccountGate>
  );
}
