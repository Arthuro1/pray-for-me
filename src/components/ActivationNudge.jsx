import { useEffect, useState } from 'react';
import { Bell, CalendarClock, FolderHeart, Route } from 'lucide-react';
import { t } from '../i18n';
import { starterPlan } from '../lib/guidedPlan';
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
  // The body is the starter plan itself (see starterPlanBody below).
  [ACTIVATION_STEPS.PLANS]: {
    icon: Route,
    title: 'planStarterTitle',
    action: 'planStarterView',
    secondary: 'planStarterAll',
  },
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

// The plan invitation names one real plan rather than describing plans in
// general: a single concrete first step is easier to take than a catalogue.
function starterPlanBody(plan, lang) {
  return (
    <>
      <span className="block font-semibold" style={{ color: 'var(--text-1)' }}>
        <span aria-hidden="true">{plan.emoji} </span><span>{t(lang, plan.titleKey)}</span>
      </span>
      <span className="block">{t(lang, plan.subKey)}</span>
    </>
  );
}

// One quiet, contextual next step after sign-in. It is intentionally not a
// checklist or tour: handling or dismissing the current card reveals nothing
// else in the same moment.
//
// `onOpenPlans(planId?)` opens the Plans page — on the starter plan's details
// when an id is given, on the whole catalogue otherwise.
export default function ActivationNudge({
  prayers,
  completions,
  settings,
  lang,
  onEditPrayer,
  onOpenReminders,
  onOpenPlans,
}) {
  const [hiddenForVisit, setHiddenForVisit] = useState(false);
  const progress = readActivationProgress();
  const starter = onOpenPlans ? starterPlan() : null;
  const step = nextActivationStep({
    prayers,
    completions,
    dailyReminderEnabled: !!settings?.dailyReminderEnabled,
    progress,
    plansAvailable: !!starter,
  });
  const { visible, complete } = useContextualNudgeSlot('activation', !!step && !hiddenForVisit, 20);

  useEffect(() => {
    if (step) markContextualPromptShownForVisit();
  }, [step]);

  if (!visible) return null;
  const { icon: Icon, title, body, action, secondary } = COPY[step];

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
    if (step === ACTIVATION_STEPS.PLANS) onOpenPlans(starter.id);
    else if (step === ACTIVATION_STEPS.REMINDER) onOpenReminders?.();
    else if (target) onEditPrayer?.(target, { openOrganize: true });
  };

  const openAllPlans = () => {
    finish();
    onOpenPlans();
  };

  return (
    <ContextualNudgeCard
      icon={Icon}
      title={t(lang, title)}
      body={step === ACTIVATION_STEPS.PLANS ? starterPlanBody(starter, lang) : t(lang, body)}
      actionLabel={t(lang, action)}
      onAction={act}
      secondaryLabel={secondary ? t(lang, secondary) : undefined}
      onSecondary={secondary ? openAllPlans : undefined}
      dismissLabel={t(lang, 'onboardLater')}
      onDismiss={finish}
      titleId={`activation-${step}-title`}
      data-activation-step={step}
    />
  );
}
