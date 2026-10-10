import useAuthStore from '../store/authStore';
import VaultModal from './VaultModal';
import AccountGate from './AccountGate';
import { t } from '../i18n';
import { PrayerRecoveryChoices } from './PrayerProtection';
import useVaultStore from '../store/vaultStore';
import { readUnassignedLegacyVaultRecord } from '../lib/crypto/keyManager';
import { useEffect, useRef, useState } from 'react';

// Encrypted content remains gated until an existing account key is recovered.
// Saved passkeys are primary; previous passphrase/code access stays optional.
export default function VaultLockScreen({ lang = 'fr' }) {
  const { user, signOut } = useAuthStore();
  const initialized = useVaultStore((state) => state.initialized);
  const [legacyCandidate, setLegacyCandidate] = useState(false);
  const legacy = useRef(null);
  const recovery = useRef(null);
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
      <div ref={recovery}><PrayerRecoveryChoices key={user?.id} lang={lang} userId={user?.id} /></div>
      {(initialized || legacyCandidate) && (
        <details ref={legacy} className="protection-details">
          <summary>{t(lang, 'protectionLegacyAccess')}</summary>
          <VaultModal lang={lang} initialMode="unlock" userId={user?.id} dismissable={false} embedded onUsePasskey={() => {
            if (legacy.current) legacy.current.open = false;
            recovery.current?.querySelector('button')?.focus();
          }} />
        </details>
      )}
    </AccountGate>
  );
}
