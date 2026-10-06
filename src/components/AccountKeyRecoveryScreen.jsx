import { useState } from 'react';
import useAuthStore from '../store/authStore';
import ConfirmDialog from './shared/ConfirmDialog';
import { startFreshEncryption } from '../lib/crypto/accountKey';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import AccountGate from './AccountGate';
import { SecondaryButton } from './shared/Primitives';

// Full-screen gate for the ORPHANED crypto state: the server holds prayers
// encrypted with a key that isn't on this device, and there's no recovery record
// to unlock it. Rather than silently minting a new key (which would strand that
// content forever with no explanation), we stop here and let the user choose:
//   • open Qetoret on their original device / browser and set up recovery, or
//   • deliberately start fresh here, accepting the old content stays locked.
export default function AccountKeyRecoveryScreen({ lang = 'fr', onResolved }) {
  const { user, signOut } = useAuthStore();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);

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
