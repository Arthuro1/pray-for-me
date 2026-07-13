import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/authStore';
import ConfirmDialog from './ConfirmDialog';
import { startFreshEncryption } from '../lib/crypto/accountKey';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

// Full-screen gate for the ORPHANED crypto state: the server holds prayers
// encrypted with a key that isn't on this device, and there's no recovery record
// to unlock it. Rather than silently minting a new key (which would strand that
// content forever with no explanation), we stop here and let the user choose:
//   • open Pray4Me on their original device / browser and set up recovery, or
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
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src="/logo.svg" alt="Pray4Me" className="w-12 h-12 rounded-2xl mb-6" />

        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--accent-soft)' }}>
          <KeyRound size={24} style={{ color: 'var(--accent)' }} />
        </div>

        <h1 className="text-xl font-semibold text-center mb-2" style={{ color: 'var(--text-1)' }}>
          {t(lang, 'keyMissingHeading')}
        </h1>
        <p className="text-sm text-center leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>
          {t(lang, 'keyMissingBody')}
        </p>

        <p className="flex items-start gap-2 text-xs text-center leading-relaxed mb-6 px-2" style={{ color: 'var(--text-3)' }}>
          <ShieldCheck size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
          <span>{t(lang, 'keyMissingReassure')}</span>
        </p>

        <button
          onClick={() => setConfirming(true)}
          className="w-full py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--input-bg)', color: '#c04040', border: '0.5px solid #f5c8c8' }}
        >
          {t(lang, 'keyMissingStartFresh')}
        </button>

        <div className="mt-6 text-center">
          {user?.email && (
            <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'vaultLockedSignedInAs', { email: user.email })}
            </p>
          )}
          <button onClick={signOut} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
            {t(lang, 'keyMissingRetry')}
          </button>
        </div>
      </div>

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
    </div>
  );
}
