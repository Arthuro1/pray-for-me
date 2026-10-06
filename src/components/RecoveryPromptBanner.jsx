import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import useVaultStore from '../store/vaultStore';
import VaultModal from './VaultModal';
import { t } from '../i18n';
import { useContextualNudgeSlot } from './shared/contextualNudge';

const DISMISS_KEY = 'pfm_recovery_prompt_dismissed';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // "Later" re-surfaces after a week

// Whether a prior dismissal still hides the banner. Backward-compatible with the
// legacy permanent flag ('1'); 'never' is an explicit "don't show again"; any
// numeric value is a snooze-until epoch (ms) written by the "Later" action, so
// the nudge comes back once it elapses instead of being gone for good.
function isDismissed() {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    if (v === 'never' || v === '1') return true;
    const until = Number(v);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

// Dismissible nudge shown only in the auto-provisioned state: encryption is on (a
// key is in memory → `unlocked`) but has NO recovery backup (`!initialized`, so
// nothing is synced to vault_keys). That's the one-storage-eviction-from-
// permanent-loss state — setting up recovery wraps the SAME key under a
// passphrase + code (non-destructive) so it survives a cleared browser or a new
// device. "Later" snoozes for a week; the ✕ opts out for good.
export default function RecoveryPromptBanner({ lang }) {
  const { initialized, unlocked } = useVaultStore();
  const [hidden, setHidden] = useState(isDismissed);
  const [showSetup, setShowSetup] = useState(false);
  const eligible = !initialized && unlocked && !hidden;
  const { visible, complete } = useContextualNudgeSlot('recovery', eligible, 10);

  if (!visible) return null;

  const remember = (value) => {
    try { localStorage.setItem(DISMISS_KEY, value); } catch { /* private mode — session-only */ }
    complete();
    setHidden(true);
  };
  const snooze = () => remember(String(Date.now() + SNOOZE_MS));
  const dismissForever = () => remember('never');

  return (
    <>
      <div className="mx-4 md:mx-8 mt-4 rounded-2xl p-4 flex items-start gap-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--surface)' }}>
          <KeyRound size={15} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-1)' }}>{t(lang, 'backupKeyTitle')}</p>
          <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--text-2)' }}>{t(lang, 'backupKeyBody')}</p>
          <p className="text-xs leading-relaxed font-medium mb-3" style={{ color: 'var(--text-1)' }}>{t(lang, 'backupKeyWarn')}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSetup(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'var(--accent)' }}>
              {t(lang, 'backupKeyCta')}
            </button>
            <button onClick={snooze} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'backupKeyDismiss')}
            </button>
          </div>
        </div>
        <button onClick={dismissForever} aria-label={t(lang, 'backupKeyDismissForever')} title={t(lang, 'backupKeyDismissForever')} className="shrink-0 p-1" style={{ color: 'var(--text-3)' }}>
          <X size={16} />
        </button>
      </div>
      {showSetup && (
        <VaultModal lang={lang} initialMode="setup" onClose={() => setShowSetup(false)} onUnlocked={() => { complete(); setShowSetup(false); }} />
      )}
    </>
  );
}
