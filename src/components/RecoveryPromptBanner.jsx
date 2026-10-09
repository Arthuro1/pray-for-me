import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import useVaultStore from '../store/vaultStore';
import VaultModal from './VaultModal';
import { t } from '../i18n';
import { useContextualNudgeSlot } from './shared/contextualNudge';
import ContextualNudgeCard from './shared/ContextualNudgeCard';
import PrayerProtection from './PrayerProtection';
import { Modal, QuietButton } from './shared/Primitives';

const DISMISS_KEY = 'pfm_recovery_prompt_dismissed';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // "Later" re-surfaces after a week

// Account-scoped dismissals snooze the reminder for a week. Old permanent
// dismissals no longer suppress the risk reminder indefinitely.
function isDismissed(userId) {
  try {
    const v = localStorage.getItem(userId ? `${DISMISS_KEY}:${userId}` : DISMISS_KEY);
    if (!v) return false;
    // Legacy casual dismissals cannot permanently hide recovery risk.
    if (v === 'never' || v === '1') return false;
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
// device. Both dismissal actions snooze for a week.
export default function RecoveryPromptBanner({ lang, userId }) {
  const { initialized, unlocked } = useVaultStore();
  const [hidden, setHidden] = useState(() => isDismissed(userId));
  const [showSetup, setShowSetup] = useState(false);
  const eligible = !initialized && unlocked && !hidden;
  const { visible, complete } = useContextualNudgeSlot('recovery', eligible, 10);

  // Wrapping changes eligibility before the one-time code screen is shown.
  // Its modal must outlive nudge visibility until the user finishes that step.
  if (!visible && !showSetup) return null;

  const remember = (value) => {
    try { localStorage.setItem(userId ? `${DISMISS_KEY}:${userId}` : DISMISS_KEY, value); } catch { /* private mode — session-only */ }
    complete();
    setHidden(true);
  };
  const snooze = () => remember(String(Date.now() + SNOOZE_MS));

  return (
    <>
      {visible && <div className="phase-page__shell pt-4">
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
          dismissLabel={t(lang, 'backupKeyDismiss')}
          onDismiss={snooze}
        />
      </div>}
      {showSetup && (
        import.meta.env.VITE_PRAYER_PROTECTION_ENABLED === 'true'
          ? <Modal label={t(lang, 'protectionTitle')} onClose={() => setShowSetup(false)}>
            <PrayerProtection userId={userId} lang={lang} />
            <QuietButton onClick={() => setShowSetup(false)}>{t(lang, 'close')}</QuietButton>
          </Modal>
          : <VaultModal lang={lang} userId={userId} initialMode="setup" onClose={() => setShowSetup(false)} onUnlocked={() => { complete(); setShowSetup(false); }} />
      )}
    </>
  );
}
