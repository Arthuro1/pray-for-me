import { useState } from 'react';
import { BookHeart, Sparkles, Bell } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

// First-run intro. Shown once (gated by localStorage in App) to orient new users.
// Deliberately SHORT and warm: it centres on the one core habit — adding your
// first prayer — and ends with that as the primary action. Advanced tools
// (groups, reading plans, the encrypted vault, AI, recurring rules, calendar
// export) are intentionally NOT toured here; the app surfaces them later, once
// the first prayer exists. No Supporter prompts appear during onboarding.
const STEPS = [
  { icon: Sparkles, titleKey: 'onboardWelcomeTitle', bodyKey: 'onboardWelcomeBody' },
  { icon: BookHeart, titleKey: 'onboardPrayTitle', bodyKey: 'onboardPrayBody' },
  { icon: Bell, titleKey: 'onboardRemindTitle', bodyKey: 'onboardRemindBody' },
];

export default function Onboarding({ lang = 'en', onFinish, onAddPrayer }) {
  const [step, setStep] = useState(0);
  useEscapeKey(onFinish);
  const trapRef = useFocusTrap();
  const isLast = step === STEPS.length - 1;
  const { icon: Icon, titleKey, bodyKey } = STEPS[step];

  const finish = (addPrayer) => {
    onFinish();
    if (addPrayer) onAddPrayer?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div ref={trapRef} tabIndex={-1} role="dialog" aria-modal="true" className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--accent-soft)' }}>
          <Icon size={30} style={{ color: 'var(--accent)' }} />
        </div>

        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{t(lang, titleKey)}</h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-3)', lineHeight: 1.7 }}>{t(lang, bodyKey)}</p>
        {isLast && (
          <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--text-3)', opacity: 0.8 }}>{t(lang, 'onboardMoreLater')}</p>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 20 : 6, background: i === step ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => finish(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>
            {t(lang, 'onboardSkip')}
          </button>
          {isLast ? (
            <button onClick={() => finish(true)} className="flex-1 py-3 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>
              {t(lang, 'onboardAddFirst')}
            </button>
          ) : (
            <button onClick={() => setStep((s) => s + 1)} className="flex-1 py-3 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>
              {t(lang, 'onboardNext')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
