import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

// Shows whether the user's older private prayers (created before the vault, or
// while it was locked) are encrypted at rest, and offers a one-tap migration to
// encrypt any that aren't. Only rendered by SettingsTab while the vault is
// unlocked (the migration needs the master key). Stays silent while checking,
// offline, or when there's nothing to protect.
export default function VaultMigrationStatus({ lang }) {
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

  const wrapStyle = { borderTop: '0.5px solid var(--border-soft)' };

  if (status.pending === 0) {
    return (
      <div className="mt-3 pt-3 flex items-center gap-2" style={wrapStyle}>
        <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'vaultAllProtected')}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3" style={wrapStyle}>
      <div className="flex items-start gap-2 mb-2">
        <ShieldAlert size={14} style={{ color: '#d97706', marginTop: 2, flexShrink: 0 }} />
        <p className="text-xs" style={{ color: 'var(--text-2)' }}>
          {t(lang, 'vaultMigratePending', { count: status.pending })}
        </p>
      </div>
      <button
        onClick={handleMigrate}
        disabled={migrating}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {migrating ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
        {t(lang, migrating ? 'vaultMigrating' : 'vaultMigrateNow')}
      </button>
    </div>
  );
}
