import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import { PrimaryButton } from './shared/Primitives';

// Shows whether the user's older private prayers (created before the vault, or
// while it was locked) are encrypted at rest, and offers a one-tap migration to
// encrypt any that aren't. Only rendered by SettingsTab while the vault is
// unlocked (the migration needs the master key). Stays silent while checking,
// offline, or when there's nothing to protect.
export default function VaultMigrationStatus({ lang, showComplete = true }) {
  const scanVaultCoverage = usePrayerStore((s) => s.scanVaultCoverage);
  const migrateToVault = usePrayerStore((s) => s.migrateToVault);
  const [status, setStatus] = useState(undefined); // undefined=checking | {total,pending} | null=couldn't check
  const [migrating, setMigrating] = useState(false);

  const rescan = useCallback(async () => {
    setStatus(await scanVaultCoverage());
  }, [scanVaultCoverage]);

  useEffect(() => { rescan(); }, [rescan]);

  const handleMigrate = async () => {
    setMigrating(true);
    const { migrated, failed } = await migrateToVault();
    setMigrating(false);
    if (failed > 0) toast.error(t(lang, 'vaultMigratePartial'));
    else if (migrated > 0) toast.success(t(lang, 'vaultMigrateDone'));
    await rescan();
  };

  // Checking, offline, or no private prayers to protect → render nothing.
  if (!status || status.total === 0) return null;

  if (status.pending === 0) {
    if (!showComplete) return null;
    return (
      <p className="vault-status">
        <ShieldCheck size={16} aria-hidden="true" /> {t(lang, 'vaultAllProtected')}
      </p>
    );
  }

  return (
    <div className="vault-status vault-status--pending">
      <p>
        <ShieldAlert size={16} aria-hidden="true" /> {t(lang, 'vaultMigratePending', { count: status.pending })}
      </p>
      <PrimaryButton icon={migrating ? Loader2 : ShieldCheck} iconSize={16} onClick={handleMigrate} disabled={migrating} className={migrating ? 'is-working' : ''}>
        {t(lang, migrating ? 'vaultMigrating' : 'vaultMigrateNow')}
      </PrimaryButton>
    </div>
  );
}
