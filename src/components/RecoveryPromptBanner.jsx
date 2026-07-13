import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import useVaultStore from '../store/vaultStore';
import VaultModal from './VaultModal';
import { t } from '../i18n';

const DISMISS_KEY = 'pfm_recovery_prompt_dismissed';

// Gentle, dismissible nudge shown only in the auto-provisioned state: encryption
// is on (a key is in memory → `unlocked`) but has NO recovery backup
// (`!initialized`, so nothing is synced to vault_keys). That's the
// one-storage-eviction-from-permanent-loss state — setting up recovery wraps the
// SAME key under a passphrase + code (non-destructive) so it survives a cleared
// browser or a new device. Dismissal is remembered locally.
export default function RecoveryPromptBanner({ lang }) {
  const { initialized, unlocked } = useVaultStore();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [showSetup, setShowSetup] = useState(false);

  if (initialized || !unlocked || dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode — session-only */ }
    setDismissed(true);
  };

  return (
    <>
      <div className="mx-4 md:mx-8 mt-4 rounded-2xl p-4 flex items-start gap-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--surface)' }}>
          <KeyRound size={15} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-1)' }}>{t(lang, 'backupKeyTitle')}</p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-2)' }}>{t(lang, 'backupKeyBody')}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSetup(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'var(--accent)' }}>
              {t(lang, 'backupKeyCta')}
            </button>
            <button onClick={dismiss} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'backupKeyDismiss')}
            </button>
          </div>
        </div>
        <button onClick={dismiss} aria-label={t(lang, 'close')} className="shrink-0 p-1" style={{ color: 'var(--text-3)' }}>
          <X size={16} />
        </button>
      </div>
      {showSetup && (
        <VaultModal lang={lang} initialMode="setup" onClose={() => setShowSetup(false)} onUnlocked={() => setShowSetup(false)} />
      )}
    </>
  );
}
