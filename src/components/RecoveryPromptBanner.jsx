import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import useVaultStore from '../store/vaultStore';
import VaultModal from './VaultModal';
import { t } from '../i18n';
import { useContextualNudgeSlot } from './shared/contextualNudge';
import ContextualNudgeCard from './shared/ContextualNudgeCard';

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
      <div className="phase-page__shell pt-4">
        <ContextualNudgeCard
          icon={KeyRound}
          titleId="recovery-nudge-title"
          title={t(lang, 'backupKeyTitle')}
          body={(
            <>
              <p className="m-0">{t(lang, 'backupKeyBody')}</p>
              <p className="m-0 mt-1"><strong>{t(lang, 'backupKeyWarn')}</strong></p>
            </>
          )}
          actionLabel={t(lang, 'backupKeyCta')}
          onAction={() => setShowSetup(true)}
          secondaryLabel={t(lang, 'backupKeyDismiss')}
          onSecondary={snooze}
          dismissLabel={t(lang, 'backupKeyDismissForever')}
          onDismiss={dismissForever}
        />
      </div>
      {showSetup && (
        <VaultModal lang={lang} initialMode="setup" onClose={() => setShowSetup(false)} onUnlocked={() => { complete(); setShowSetup(false); }} />
      )}
    </>
  );
}
