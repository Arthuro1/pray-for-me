import { Lock, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/authStore';
import VaultModal from './VaultModal';
import { t } from '../i18n';

// The full-screen gate shown when a Prayer Vault exists but is locked. It is a
// hard gate (encrypted content must never render without the key), but instead
// of a bare modal it explains WHY the app is locked, reassures the user about
// the end-to-end encryption, and keeps the recovery-code path (built into the
// embedded VaultModal) and a sign-out escape hatch within reach — so a forgotten
// passphrase never silently walls someone out of their whole account.
export default function VaultLockScreen({ lang = 'fr' }) {
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src="/logo.svg" alt="Praystead" className="w-12 h-12 rounded-2xl mb-6" />

        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--accent-soft)' }}>
          <Lock size={24} style={{ color: 'var(--accent)' }} />
        </div>

        <h1 className="text-xl font-semibold text-center mb-2" style={{ color: 'var(--text-1)' }}>
          {t(lang, 'vaultLockedHeading')}
        </h1>
        <p className="text-sm text-center leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>
          {t(lang, 'vaultLockedBody')}
        </p>

        <p className="flex items-start gap-2 text-xs text-center leading-relaxed mb-6 px-2" style={{ color: 'var(--text-3)' }}>
          <ShieldCheck size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
          <span>{t(lang, 'vaultLockedReassure')}</span>
        </p>

        {/* Reuses the unlock + "Forgot your passphrase?" recovery flow, rendered
            inline (no overlay) inside this friendlier screen. Unlocking flips the
            vault store's `unlocked`, which drops this gate in App. */}
        <VaultModal lang={lang} initialMode="unlock" dismissable={false} embedded />

        <div className="mt-6 text-center">
          {user?.email && (
            <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'vaultLockedSignedInAs', { email: user.email })}
            </p>
          )}
          <button onClick={signOut} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
            {t(lang, 'signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
