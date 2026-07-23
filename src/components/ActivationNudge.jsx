import { useState } from 'react';
import { Bell, CalendarClock, FolderHeart, X } from 'lucide-react';
import { t } from '../i18n';
import {
  ACTIVATION_STEPS,
  activationTargetPrayer,
  markActivationStepHandled,
  nextActivationStep,
  readActivationProgress,
} from '../lib/activationProgress';

const COPY = {
  [ACTIVATION_STEPS.RHYTHM]: {
    icon: CalendarClock,
    title: 'activationRhythmTitle',
    body: 'activationRhythmBody',
    action: 'activationRhythmCta',
  },
  [ACTIVATION_STEPS.REMINDER]: {
    icon: Bell,
    title: 'activationReminderTitle',
    body: 'activationReminderBody',
    action: 'setReminderCta',
  },
  [ACTIVATION_STEPS.ORGANIZE]: {
    icon: FolderHeart,
    title: 'activationOrganizeTitle',
    body: 'activationOrganizeBody',
    action: 'activationOrganizeCta',
  },
};

// One quiet, contextual next step after sign-in. It is intentionally not a
// checklist or tour: handling or dismissing the current card reveals nothing
// else in the same moment.
export default function ActivationNudge({
  prayers,
  settings,
  lang,
  onEditPrayer,
  onOpenReminders,
}) {
  const [hiddenForVisit, setHiddenForVisit] = useState(false);
  const progress = readActivationProgress();
  const step = nextActivationStep({
    prayers,
    dailyReminderEnabled: !!settings?.dailyReminderEnabled,
    progress,
  });

  if (!step || hiddenForVisit) return null;
  const { icon: Icon, title, body, action } = COPY[step];

  const finish = () => {
    markActivationStepHandled(step);
    // Do not replace one suggestion with the next immediately. A later visit
    // can reveal the next relevant step, keeping this moment to one invitation.
    setHiddenForVisit(true);
  };

  const act = () => {
    const target = activationTargetPrayer(step, prayers);
    finish();
    if (step === ACTIVATION_STEPS.REMINDER) onOpenReminders?.();
    else if (target) onEditPrayer?.(target, { openOrganize: true });
  };

  return (
    <section
      className="mb-6 rounded-2xl p-4 sm:flex sm:items-center sm:gap-4"
      style={{ background: 'var(--gold-soft)', border: '1px solid color-mix(in srgb, var(--gold) 24%, var(--border))' }}
      aria-labelledby={`activation-${step}-title`}
      data-activation-step={step}
    >
      <div
        className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:mb-0"
        style={{ background: 'var(--surface)', color: 'var(--gold)' }}
        aria-hidden="true"
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 id={`activation-${step}-title`} className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          {t(lang, title)}
        </h2>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
          {t(lang, body)}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-2 sm:mt-0 sm:shrink-0">
        <button
          type="button"
          onClick={act}
          className="min-h-11 flex-1 rounded-xl px-4 text-xs font-semibold sm:flex-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--accent)' }}
        >
          {t(lang, action)}
        </button>
        <button
          type="button"
          onClick={finish}
          aria-label={t(lang, 'onboardLater')}
          title={t(lang, 'onboardLater')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ color: 'var(--text-3)' }}
        >
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
