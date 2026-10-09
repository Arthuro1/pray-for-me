import useAuthStore from '../store/authStore';
import VaultModal from './VaultModal';
import AccountGate from './AccountGate';
import { t } from '../i18n';
import { PrayerRecoveryChoices } from './PrayerProtection';
import useVaultStore from '../store/vaultStore';
import { readUnassignedLegacyVaultRecord } from '../lib/crypto/keyManager';
import { useEffect, useState } from 'react';

// The full-screen gate shown when a Prayer Vault exists but is locked. It is a
// hard gate (encrypted content must never render without the key), but instead
// of a bare modal it explains WHY the app is locked, reassures the user about
// the end-to-end encryption, and keeps the recovery-code path (built into the
// embedded VaultModal) and a sign-out escape hatch within reach — so a forgotten
// passphrase never silently walls someone out of their whole account.
export default function VaultLockScreen({ lang = 'fr' }) {
  const { user, signOut } = useAuthStore();
  const initialized = useVaultStore((state) => state.initialized);
  const [legacyCandidate, setLegacyCandidate] = useState(false);
  useEffect(() => {
    let current = true;
    readUnassignedLegacyVaultRecord().then((record) => { if (current) setLegacyCandidate(!!record); }).catch(() => { if (current) setLegacyCandidate(false); });
    return () => { current = false; };
  }, [user?.id]);

  return (
    <AccountGate
      lang={lang}
      title={t(lang, 'keyMissingHeading')}
      body={t(lang, 'keyMissingBody')}
      reassure={t(lang, 'keyMissingReassure')}
      exitLabel={t(lang, 'signOut')}
      onExit={signOut}
    >
      <PrayerRecoveryChoices key={user?.id} lang={lang} userId={user?.id} />
      {(initialized || legacyCandidate) && (
        <details className="protection-details">
          <summary>{t(lang, 'protectionLegacyAccess')}</summary>
          <VaultModal lang={lang} initialMode="unlock" userId={user?.id} dismissable={false} embedded />
        </details>
      )}
    </AccountGate>
  );
}
