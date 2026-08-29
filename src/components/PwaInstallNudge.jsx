import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus } from 'lucide-react';
import { t } from '../i18n';
import { markEducationHandledForVisit, readActivationProgress } from '../lib/activationProgress';
import { pwaInstallAllowed } from '../lib/activationPolicy';
import {
  markContextualPromptShownForVisit,
  pwaInstallMode,
  requestNativePwaInstall,
  snoozePwaInstallPrompt,
  subscribePwaInstallState,
} from '../lib/pwaInstall';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { BottomSheet, PrimaryButton } from './shared/Primitives';
import ContextualNudgeCard from './shared/ContextualNudgeCard';
import { useContextualNudgeSlot } from './shared/ContextualNudgeCoordinator';

function currentInstallMode() {
  // Installing is education too: it waits behind the same one-prompt-per-visit
  // rule as the activation cards, on top of pwaInstall's own conditions.
  if (!pwaInstallAllowed()) return null;
  const progress = readActivationProgress();
  return pwaInstallMode({
    sessionCompleted: progress.signals.includes('session_completed'),
  });
}

export default function PwaInstallNudge({ lang, modeOverride = null }) {
  const [mode, setMode] = useState(() => modeOverride || currentInstallMode());
  const [showIosHelp, setShowIosHelp] = useState(false);
  const sheetRef = useFocusTrap(showIosHelp);
  const { visible, complete } = useContextualNudgeSlot('pwa-install', !!mode || showIosHelp, 30);

  useEffect(() => {
    if (modeOverride) return undefined;
    return subscribePwaInstallState(() => setMode(currentInstallMode()));
  }, [modeOverride]);
  useEffect(() => {
    if (mode) markContextualPromptShownForVisit();
  }, [mode]);
  useEscapeKey(showIosHelp ? () => setShowIosHelp(false) : null);

  if (!visible) return null;

  const dismiss = () => {
    snoozePwaInstallPrompt();
    // Answering this ends education for the visit, so declining the install
    // never uncovers an activation card in its place.
    markEducationHandledForVisit();
    complete();
    setShowIosHelp(false);
    setMode(null);
  };

  const install = async () => {
    if (mode === 'ios') {
      setShowIosHelp(true);
      return;
    }
    await requestNativePwaInstall();
    complete();
    setMode(null);
  };

  return (
    <>
      {!showIosHelp && (
        <ContextualNudgeCard
          icon={Download}
          title={t(lang, 'pwaInstallTitle')}
          body={t(lang, 'pwaInstallBody')}
          actionLabel={t(lang, 'pwaInstallCta')}
          onAction={install}
          dismissLabel={t(lang, 'pwaInstallLater')}
          onDismiss={dismiss}
          titleId="pwa-install-title"
          data-pwa-install-mode={mode}
        />
      )}

      {showIosHelp && (
        <BottomSheet ref={sheetRef} label={t(lang, 'pwaIosTitle')} className="max-w-lg">
          <div className="p-6">
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
              aria-hidden="true"
            >
              <Share size={19} />
            </div>
            <h2 className="editorial-heading text-2xl" style={{ color: 'var(--text-1)' }}>
              {t(lang, 'pwaIosTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              {t(lang, 'pwaIosBody')}
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--surface-soft)' }}>
              <Share size={18} aria-hidden="true" style={{ color: 'var(--accent)' }} />
              <span aria-hidden="true">→</span>
              <SquarePlus size={18} aria-hidden="true" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                {t(lang, 'pwaIosAddAction')}
              </span>
            </div>
            <PrimaryButton onClick={dismiss} className="mt-6 w-full">
              {t(lang, 'doneBtn')}
            </PrimaryButton>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
