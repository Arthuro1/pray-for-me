import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import useVaultStore from '../store/vaultStore';
import { t } from '../i18n';
import { useContextualNudgeSlot } from './shared/contextualNudge';
import ContextualNudgeCard from './shared/ContextualNudgeCard';
import PrayerProtection from './PrayerProtection';
import { getProtectionStatus } from '../lib/prayerProtection';
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

// Nudge accounts without a saved recovery method. Check the new recovery
// methods as well as the legacy wrapper before declaring that a backup is
// missing. Both dismissal actions snooze for a week.
export default function RecoveryPromptBanner({ lang, userId }) {
  const { initialized, unlocked } = useVaultStore();
  const [hidden, setHidden] = useState(() => isDismissed(userId));
  const [showSetup, setShowSetup] = useState(false);
  const [protection, setProtection] = useState(null);
  const protectionEnabled = import.meta.env.VITE_PRAYER_PROTECTION_ENABLED === 'true';
  useEffect(() => {
    let current = true;
    setProtection(null);
    setHidden(isDismissed(userId));
    if (protectionEnabled && userId) {
      getProtectionStatus(userId).then((result) => {
        if (current) setProtection({ userId, result });
      }).catch(() => { /* Unknown health must not be presented as missing recovery. */ });
    }
    return () => { current = false; };
  }, [protectionEnabled, userId]);
  const health = protection && protection.userId === userId ? protection.result : null;
  const checked = !protectionEnabled || health?.ok === true;
  const hasRecovery = health?.methods?.some((method) => method.status === 'active');
  const eligible = !initialized && unlocked && !hidden && checked && !hasRecovery;
  const { visible, complete } = useContextualNudgeSlot('recovery', eligible, 10);

  // Saving recovery changes eligibility; keep the modal mounted until the
  // protection flow confirms the user has finished.
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
        <Modal label={t(lang, 'protectionTitle')} onClose={() => setShowSetup(false)}>
          <PrayerProtection userId={userId} lang={lang} onReady={() => { complete(); setHidden(true); setShowSetup(false); }} />
          <QuietButton onClick={() => setShowSetup(false)}>{t(lang, 'close')}</QuietButton>
        </Modal>
      )}
    </>
  );
}
