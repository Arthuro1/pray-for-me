import useAuthStore from '../store/authStore';
import VaultModal from './VaultModal';
import AccountGate from './AccountGate';
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
    <AccountGate
      lang={lang}
      title={t(lang, 'vaultLockedHeading')}
      body={t(lang, 'vaultLockedBody')}
      reassure={t(lang, 'vaultLockedReassure')}
      exitLabel={t(lang, 'signOut')}
      onExit={signOut}
    >
      {/* Reuses the unlock + "Forgot your passphrase?" recovery flow, rendered
          inline (no overlay) inside this friendlier screen. Unlocking flips the
          vault store's `unlocked`, which drops this gate in App. */}
      <VaultModal lang={lang} initialMode="unlock" userId={user?.id} dismissable={false} embedded />
    </AccountGate>
  );
}
