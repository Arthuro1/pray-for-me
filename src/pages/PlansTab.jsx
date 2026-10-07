import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share2, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { plansByCategory } from '../content/prayerPlans';
import { formatPlanStartDate, planById, starterPlan } from '../lib/guidedPlan';
import { finishedPlanIds, runningPlanProgress } from '../lib/planner';
import { todayKey } from '../lib/prayedLog';
import { canUsePlan } from '../lib/planReview';
import { needsPreStartPersonalization, startGuidedPlan } from '../lib/startGuidedPlan';
import { track } from '../lib/analytics';
import { planSource, trackPlanDetailOpened, trackPlansPageViewed } from '../lib/planAnalytics';
import { PageHeader, PrimaryButton, QuietButton } from '../components/shared/Primitives';
import RiseMark from '../components/shared/RiseMark';
import PlanCard from '../components/plan/PlanCard';
import CircleLinks from '../components/circles/CircleLinks';
import PlanDetailModal from '../components/PlanDetailModal';
import PlanShareSheet from '../components/plan/PlanShareSheet';
import PlanPersonalizeModal from '../components/PlanPersonalizeModal';

function PlanSection({ id, label, children }) {
  return (
    <section aria-labelledby={id} className="plan-section">
      <h2 id={id} className="section-label">{label}</h2>
      <div className="plan-list">{children}</div>
    </section>
  );
}

// Prayer plans as a destination of their own: what you're praying through,
// one gentle place to begin, then the whole catalogue — open, grouped by need,
// nothing behind a "Browse" disclosure.
//
// Every plan appears exactly once on the page: under Continue while it runs,
// as "Start here" for someone who has never finished one, in its category
// otherwise, and under Completed once walked to the end. "Explore by circle"
// leads to the circle pages, which list a circle's plans there.
//
// Other screens hand work to this page through router state:
//   source             — the door the visit came through (lib/planAnalytics.js)
//   openPlanId         — open that plan's details straight away (Today's card)
//   guidedJourneyStart — start a plan whose singles choices must be collected
//                        here first (a Community invitation or group plan)
export default function PlansTab() {
  const lang = usePrayerStore((s) => s.settings.language) || 'fr';
  const prayers = usePrayerStore((s) => s.prayers);
  const addPrayer = usePrayerStore((s) => s.addPrayer);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  // Read once: clearing the handed-over state below must not change where this
  // visit is counted as having come from.
  const [entrySource] = useState(() => planSource(location.state?.source));
  const [detailPlan, setDetailPlan] = useState(null);
  const [personalizeTarget, setPersonalizeTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [started, setStarted] = useState(null);

  useEffect(() => { trackPlansPageViewed(entrySource); }, [entrySource]);

  // A plan appears when it can actually be opened, so the catalogue holds no
  // dead ends: a plan awaiting sign-off is listed for whoever is in review
  // mode (or a dev build) and stays invisible to everyone else.
  const groups = useMemo(
    () => plansByCategory()
      .map((group) => ({ ...group, plans: group.plans.filter((plan) => canUsePlan(plan)) }))
      .filter((group) => group.plans.length > 0),
    [],
  );
  const today = todayKey();
  const progressById = useMemo(() => runningPlanProgress(prayers, today), [prayers, today]);
  const running = groups.flatMap((group) => group.plans).filter((plan) => progressById[plan.id]);
  const finished = finishedPlanIds(prayers, today).map(planById).filter(Boolean);
  const starter = running.length === 0 && finished.length === 0 ? starterPlan() : null;

  const placed = new Set([...running, ...finished, starter].filter(Boolean).map((plan) => plan.id));
  const categories = groups
    .map((group) => ({ ...group, plans: group.plans.filter((plan) => !placed.has(plan.id)) }))
    .filter((group) => group.plans.length > 0);

  const beginPlan = useCallback(async (plan, startDate, prefs = null) => {
    const result = await startGuidedPlan({ plan, startDate, lang, addPrayer, prefs, source: entrySource });
    if (!result.ok) {
      toast.error(t(lang, result.reason === 'unavailable' ? 'planCoupleReviewHint' : 'errorGeneric'));
      return result;
    }
    if (plan.analyticsEvents?.started) track(plan.analyticsEvents.started);
    setStarted({ plan, startDate: startDate || todayKey(), prayerId: result.prayerId });
    toast.success(t(lang, 'journeyStarted'));
    return result;
  }, [addPrayer, lang, entrySource]);

  const startPlan = useCallback(async (plan, startDate) => {
    if (!canUsePlan(plan)) return { ok: false, reason: 'unavailable' };
    if (needsPreStartPersonalization(plan)) {
      setPersonalizeTarget({ plan, startDate });
      return { ok: false, reason: 'personalize' };
    }
    return beginPlan(plan, startDate);
  }, [beginPlan]);

  // A running plan opens where it is being prayed; any other opens its details.
  const openPlan = useCallback((plan) => {
    const progress = progressById[plan.id];
    if (progress) {
      navigate(`/prayers/${progress.prayerId}`);
      return;
    }
    trackPlanDetailOpened(plan, entrySource);
    setDetailPlan(plan);
  }, [progressById, navigate, entrySource]);

  useEffect(() => {
    const pending = location.state?.guidedJourneyStart || location.state?.guidedPlanStart;
    const openPlanId = location.state?.openPlanId;
    if (!pending?.planId && !openPlanId) return;
    navigate(location.pathname, { replace: true, state: null });
    if (pending?.planId) {
      const plan = planById(pending.planId);
      if (plan) startPlan(plan, pending.startDate || todayKey());
      return;
    }
    const plan = planById(openPlanId);
    if (plan) openPlan(plan);
  }, [location.pathname, location.state, navigate, startPlan, openPlan]);

  const card = (plan, extra = {}) => (
    <PlanCard key={plan.id} plan={plan} lang={lang} progress={progressById[plan.id]} onOpen={() => openPlan(plan)} {...extra} />
  );

  return (
    <div className="phase-page plans">
      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          lang={lang}
          running={!!progressById[detailPlan.id]}
          onStart={startPlan}
          onShare={user?.id ? () => { setShareTarget({ plan: detailPlan, startDate: todayKey() }); setDetailPlan(null); } : undefined}
          onClose={() => setDetailPlan(null)}
        />
      )}
      {personalizeTarget && (
        <PlanPersonalizeModal
          plan={personalizeTarget.plan}
          lang={lang}
          mode="start"
          ctaKey="journeyStart"
          onSave={async (prefs) => {
            const target = personalizeTarget;
            setPersonalizeTarget(null);
            await beginPlan(target.plan, target.startDate, prefs);
          }}
          onClose={() => setPersonalizeTarget(null)}
        />
      )}
      {shareTarget && user?.id && (
        <PlanShareSheet
          plan={shareTarget.plan}
          startDate={shareTarget.startDate}
          lang={lang}
          userId={user.id}
          onClose={() => setShareTarget(null)}
        />
      )}

      <div className="phase-page__shell">
        <PageHeader title={t(lang, 'journeysTitle')} subtitle={t(lang, 'journeysSub')} />
      </div>

      <div className="phase-content">
        {/* A plan just begun: a calm status and the one next step — not a
            green success card. */}
        {started && (
          <section className="plan-started" role="status">
            <RiseMark motion="still" size={36} />
            <p className="plan-started__title">
              {started.startDate === todayKey()
                ? t(lang, 'journeyBeginsToday')
                : t(lang, 'groupPlanStartsOn', { date: formatPlanStartDate(started.startDate, lang) })}
            </p>
            <p className="q-meta">{t(lang, started.plan.titleKey)}</p>
            <div className="plan-started__actions">
              <PrimaryButton onClick={() => navigate(`/prayers/${started.prayerId}`)}>{t(lang, 'beginDayOne')}</PrimaryButton>
              {user?.id && (
                <QuietButton icon={Share2} iconSize={16} onClick={() => setShareTarget(started)}>{t(lang, 'planShareAction')}</QuietButton>
              )}
            </div>
          </section>
        )}

        {running.length > 0 && (
          <PlanSection id="plans-continue" label={t(lang, 'guidanceContinue')}>
            {running.map((plan) => card(plan, { featured: true }))}
          </PlanSection>
        )}

        {starter && (
          <PlanSection id="plans-start-here" label={t(lang, 'plansStartHere')}>
            {card(starter, { featured: true })}
          </PlanSection>
        )}

        <p className="plan-hint">
          <Users size={14} aria-hidden="true" />
          <span>{t(lang, 'plansTogetherHint')}</span>
        </p>

        {/* A second way in, beside the journey types below: where prayer is
            shaped. Seven doors to the circle pages, not a second catalogue. */}
        <section aria-labelledby="plans-circles" className="plan-section">
          <h2 id="plans-circles" className="section-label">{t(lang, 'exploreByCircle')}</h2>
          <CircleLinks lang={lang} returnTo={{ from: '/plans' }} labelledBy="plans-circles" className="plan-circles" />
        </section>

        {categories.map((group) => (
          <PlanSection key={group.id} id={`plans-${group.id}`} label={t(lang, group.labelKey)}>
            {group.plans.map((plan) => card(plan))}
          </PlanSection>
        ))}

        {finished.length > 0 && (
          <PlanSection id="plans-completed" label={t(lang, 'growHistory')}>
            {finished.map((plan) => card(plan, { finished: true }))}
          </PlanSection>
        )}
      </div>
    </div>
  );
}
