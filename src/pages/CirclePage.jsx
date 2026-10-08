import { useEffect, useMemo } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { circleLabelKey, isCircle, plansForCircle } from '../lib/circles';
import { PLANS } from '../content/prayerPlans';
import { canUsePlan } from '../lib/planReview';
import { runningPlanProgress } from '../lib/planner';
import { todayKey } from '../lib/prayedLog';
import { EVENTS, track } from '../lib/analytics';
import { PLAN_SOURCES } from '../lib/planAnalytics';
import { useCircleTeaching } from '../hooks/useCircleTeaching';
import CircleTeaching from '../components/circles/CircleTeaching';
import CircleLinks from '../components/circles/CircleLinks';
import ScriptureRefButton from '../components/circles/ScriptureRefButton';
import PlanCard from '../components/plan/PlanCard';
import { BackLink } from '../components/shared/Primitives';

// Where a circle page returns to, by the path it was opened from. Anything else
// (a prayer's page, a link) reads as a plain "Back".
const BACK_LABEL_KEYS = Object.freeze({ '/plans': 'navPlans', '/prayers': 'journal', '/about': 'aboutTitle' });

// Where the back link returns: the in-app path the page was opened from (and
// any state that page handed over), or the Plans page. Only an in-app path is
// honoured.
function returnTarget(state) {
  const from = state?.from;
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return { from: '/plans' };
  return { from, fromState: state.fromState };
}

// One Intercession Circle inside the app (/circles/:circleId): its teaching —
// the short layer for everyone, the deep layer where its review gate allows —
// as a doorway into prayer, then the plans that shape prayer in it ("Go
// deeper"), chosen from authored plan metadata only. Opened from the Plans
// page, the Journal's circle groups, a prayer's circle and About.
//
// Praying from here opens the composer with the circle preselected; a "Pray
// this" prompt shows above the empty field and is never written into it.
export default function CirclePage({ onPrayInCircle }) {
  const { circleId } = useParams();
  const lang = usePrayerStore((s) => s.settings.language) || 'fr';
  const prayers = usePrayerStore((s) => s.prayers);
  const navigate = useNavigate();
  const location = useLocation();
  const teaching = useCircleTeaching(lang);
  const circle = isCircle(circleId) ? circleId : null;
  const returnTo = returnTarget(location.state);

  useEffect(() => {
    if (circle) track(EVENTS.CIRCLE_TEACHING_OPENED, { source: 'app' });
  }, [circle]);

  const today = todayKey();
  const progressById = useMemo(() => runningPlanProgress(prayers, today), [prayers, today]);
  // A plan awaiting sign-off is listed only where it can be opened (review
  // mode, a dev build) — the same rule as the Plans page.
  const plans = useMemo(() => plansForCircle(PLANS.filter((plan) => canUsePlan(plan)), circle), [circle]);

  if (!circle) return <Navigate to="/plans" replace />;

  const name = t(lang, circleLabelKey(circle));
  const content = teaching?.circle(circle);

  const pray = ({ prompt } = {}) => {
    track(EVENTS.CIRCLE_PRAYER_STARTED, { source: 'app' });
    onPrayInCircle?.(circle, { prompt });
  };

  // A running plan opens where it is being prayed; any other opens its details
  // on the Plans page, which owns starting a plan.
  const openPlan = (plan) => {
    const progress = progressById[plan.id];
    if (progress) navigate(`/prayers/${progress.prayerId}`);
    else navigate('/plans', { state: { openPlanId: plan.id, source: PLAN_SOURCES.CIRCLE } });
  };

  const backLabel = t(lang, BACK_LABEL_KEYS[returnTo.from] || 'backBtn');

  return (
    <div className="phase-page circle-page">
      <div className="phase-page__shell">
        <BackLink to={returnTo.from} state={returnTo.fromState} label={backLabel} ariaLabel={`${t(lang, 'backBtn')}: ${backLabel}`} />
        <CircleLinks lang={lang} current={circle} returnTo={returnTo} label={t(lang, 'circlesNav')} className="circle-page__nav" />
      </div>

      <div className="phase-content">
        {content && (
          <CircleTeaching
            key={circle}
            id={`circle-${circle}`}
            teaching={content}
            ui={teaching.ui}
            lang={teaching.lang}
            name={name}
            ScriptureRef={ScriptureRefButton}
            onPray={pray}
            headingLevel={1}
          />
        )}

        {plans.length > 0 && (
          <section aria-labelledby="circle-plans" className="plan-section circle-page__plans">
            <h2 id="circle-plans" className="section-label">{t(lang, 'goDeeper')}</h2>
            <div className="plan-list">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  lang={lang}
                  progress={progressById[plan.id]}
                  onOpen={() => openPlan(plan)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
