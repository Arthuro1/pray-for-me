import { useEffect, useState } from 'react';
import { Bell, CalendarClock, FolderHeart } from 'lucide-react';
import { t } from '../i18n';
import {
  ACTIVATION_STEPS,
  markActivationStepHandled,
  markEducationHandledForVisit,
  readActivationProgress,
} from '../lib/activationProgress';
import { activationTargetPrayer, nextActivationStep } from '../lib/activationPolicy';
import { markContextualPromptShownForVisit } from '../lib/pwaInstall';
import ContextualNudgeCard from './shared/ContextualNudgeCard';
import { useContextualNudgeSlot } from './shared/contextualNudge';

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
  completions,
  settings,
  lang,
  onEditPrayer,
  onOpenReminders,
}) {
  const [hiddenForVisit, setHiddenForVisit] = useState(false);
  const progress = readActivationProgress();
  const step = nextActivationStep({
    prayers,
    completions,
    dailyReminderEnabled: !!settings?.dailyReminderEnabled,
    progress,
  });
  const { visible, complete } = useContextualNudgeSlot('activation', !!step && !hiddenForVisit, 20);

  useEffect(() => {
    if (step) markContextualPromptShownForVisit();
  }, [step]);

  if (!visible) return null;
  const { icon: Icon, title, body, action } = COPY[step];

  const finish = () => {
    markActivationStepHandled(step);
    // Do not replace one suggestion with the next immediately — including the
    // install invitation. A later visit can reveal the next relevant step,
    // keeping this moment to one invitation. (The local flag hides the card now;
    // the visit marker keeps it hidden across navigation within the same visit.)
    markEducationHandledForVisit();
    complete();
    setHiddenForVisit(true);
  };

  const act = () => {
    const target = activationTargetPrayer(step, prayers);
    finish();
    if (step === ACTIVATION_STEPS.REMINDER) onOpenReminders?.();
    else if (target) onEditPrayer?.(target, { openOrganize: true });
  };

  return (
    <ContextualNudgeCard
      icon={Icon}
      title={t(lang, title)}
      body={t(lang, body)}
      actionLabel={t(lang, action)}
      onAction={act}
      dismissLabel={t(lang, 'onboardLater')}
      onDismiss={finish}
      titleId={`activation-${step}-title`}
      data-activation-step={step}
    />
  );
}
