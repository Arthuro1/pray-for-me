import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, HandHeart, HeartHandshake } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { plansByCategory } from '../content/prayerPlans';
import { planById } from '../lib/guidedPlan';
import { runningPlanIds, runningPlanProgress } from '../lib/planner';
import { todayKey } from '../lib/prayedLog';
import { canUsePlan, isPlanReviewed } from '../lib/planReview';
import { needsPreStartPersonalization, startGuidedPlan } from '../lib/startGuidedPlan';
import { track } from '../lib/analytics';
import PlanDetailModal from './PlanDetailModal';
import PlanInviteModal from './PlanInviteModal';
import PlanPersonalizeModal from './PlanPersonalizeModal';

function formatJourneyDate(key, lang) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
  if (!match) return key || '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  try { return date.toLocaleDateString(lang, { month: 'short', day: 'numeric' }); } catch { return key; }
}

function JourneyCard({ plan, lang, running, progress, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="phase-card grow-card w-full p-4 text-start">
      <span className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: 'var(--accent-soft)' }}>
          {plan.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, plan.titleKey)}</span>
          <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, plan.subKey)}</span>
          <span className="mt-2 block text-xs font-medium" style={{ color: running ? 'var(--success)' : 'var(--accent)' }}>
            {running
              ? t(lang, 'planDayOf', { n: progress?.day || 1, total: plan.count })
              : t(lang, 'planDays', { n: plan.count })}
          </span>
        </span>
        <ChevronRight size={16} className="mt-1 shrink-0" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
      </span>
    </button>
  );
}

// Short guides and authored multi-day experiences meet in Guidance. Only one
// journey is recommended at a time; the catalogue stays behind Browse and
// unreviewed content never appears as a dead end.
export default function PrayerJourneys({ lang, showRecommendation = true }) {
  const prayers = usePrayerStore((state) => state.prayers);
  const addPrayer = usePrayerStore((state) => state.addPrayer);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [detailJourney, setDetailJourney] = useState(null);
  const [personalizeTarget, setPersonalizeTarget] = useState(null);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [startedJourney, setStartedJourney] = useState(null);
  const [browseOpen, setBrowseOpen] = useState(false);

  const groups = useMemo(
    () => plansByCategory()
      .map((group) => ({ ...group, plans: group.plans.filter((plan) => isPlanReviewed(plan) && canUsePlan(plan)) }))
      .filter((group) => group.plans.length > 0),
    [],
  );
  const journeys = groups.flatMap((group) => group.plans);
  const activeIds = runningPlanIds(prayers, todayKey());
  const progressById = useMemo(() => runningPlanProgress(prayers, todayKey()), [prayers]);
  const activeJourney = journeys.find((journey) => activeIds.has(journey.id)) || null;
  const recommendation = activeJourney || journeys.find((journey) => !activeIds.has(journey.id)) || null;
  const featuredJourney = showRecommendation ? recommendation : null;

  const beginJourney = useCallback(async (journey, startDate, prefs = null) => {
    const result = await startGuidedPlan({ plan: journey, startDate, lang, addPrayer, prefs });
    if (!result.ok) {
      toast.error(t(lang, result.reason === 'unavailable' ? 'planCoupleReviewHint' : 'errorGeneric'));
      return result;
    }
    if (journey.analyticsEvents?.started) track(journey.analyticsEvents.started);
    setStartedJourney({ journey, startDate: startDate || todayKey(), prayerId: result.prayerId });
    toast.success(t(lang, 'journeyStarted'));
    return result;
  }, [addPrayer, lang]);

  const startJourney = useCallback(async (journey, startDate) => {
    if (!canUsePlan(journey)) return { ok: false, reason: 'unavailable' };
    if (needsPreStartPersonalization(journey)) {
      setPersonalizeTarget({ journey, startDate });
      return { ok: false, reason: 'personalize' };
    }
    return beginJourney(journey, startDate);
  }, [beginJourney]);

  useEffect(() => {
    const pending = location.state?.guidedJourneyStart || location.state?.guidedPlanStart;
    if (!pending?.planId) return;
    navigate(location.pathname, { replace: true, state: null });
    const journey = planById(pending.planId);
    if (journey) startJourney(journey, pending.startDate || todayKey());
  }, [location.pathname, location.state, navigate, startJourney]);

  const openJourney = (journey) => {
    const progress = progressById[journey.id];
    if (progress) navigate(`/prayers/${progress.prayerId}`);
    else setDetailJourney(journey);
  };

  return (
    <section aria-labelledby="prayer-journeys-title" className="mt-8">
      {detailJourney && (
        <PlanDetailModal
          plan={detailJourney}
          lang={lang}
          running={activeIds.has(detailJourney.id)}
          onStart={startJourney}
          onClose={() => setDetailJourney(null)}
        />
      )}
      {personalizeTarget && (
        <PlanPersonalizeModal
          plan={personalizeTarget.journey}
          lang={lang}
          mode="start"
          ctaKey="journeyStart"
          onSave={async (prefs) => {
            const target = personalizeTarget;
            setPersonalizeTarget(null);
            await beginJourney(target.journey, target.startDate, prefs);
          }}
          onClose={() => setPersonalizeTarget(null)}
        />
      )}
      {inviteTarget && user?.id && (
        <PlanInviteModal
          plan={inviteTarget.journey}
          startDate={inviteTarget.startDate}
          lang={lang}
          userId={user.id}
          onClose={() => setInviteTarget(null)}
        />
      )}

      <div className="mb-3">
        <p className="section-label">{t(lang, 'guidanceBrowse')}</p>
        <h2 id="prayer-journeys-title" className="editorial-heading mt-1 text-2xl" style={{ color: 'var(--text-1)' }}>
          {t(lang, 'journeysTitle')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'journeysSub')}</p>
      </div>

      {startedJourney && (
        <div className="phase-card mb-4 p-5" role="status" style={{ borderColor: 'var(--success)' }}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <Check size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold" style={{ color: 'var(--text-1)' }}>
                {startedJourney.startDate === todayKey()
                  ? t(lang, 'journeyBeginsToday')
                  : t(lang, 'groupPlanStartsOn', { date: formatJourneyDate(startedJourney.startDate, lang) })}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, startedJourney.journey.titleKey)}</p>
            </div>
          </div>
          <button type="button" onClick={() => navigate(`/prayers/${startedJourney.prayerId}`)} className="primary-button mt-4 flex w-full items-center justify-center gap-2 px-4">
            <HandHeart size={16} aria-hidden="true" /> {t(lang, 'beginDayOne')}
          </button>
          {user?.id && (
            <button type="button" onClick={() => setInviteTarget(startedJourney)} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
              <HeartHandshake size={15} aria-hidden="true" /> {t(lang, 'journeyInviteSomeone')}
            </button>
          )}
        </div>
      )}

      {!startedJourney && featuredJourney && (
        <div className="mb-4">
          <p className="section-label mb-2">{t(lang, activeJourney ? 'guidanceContinue' : 'guidanceForYou')}</p>
          <JourneyCard
            plan={featuredJourney}
            lang={lang}
            running={activeIds.has(featuredJourney.id)}
            progress={progressById[featuredJourney.id]}
            onOpen={() => openJourney(featuredJourney)}
          />
        </div>
      )}

      {journeys.length > (featuredJourney ? 1 : 0) && (
        <div className="border-block" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setBrowseOpen((open) => !open)}
            aria-expanded={browseOpen}
            aria-controls="journey-catalogue"
            className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-sm font-semibold"
            style={{ color: 'var(--text-2)' }}
          >
            {t(lang, 'browseJourneys')}
            <ChevronDown size={16} aria-hidden="true" style={{ transform: browseOpen ? 'rotate(180deg)' : undefined }} />
          </button>
          {browseOpen && (
            <div id="journey-catalogue" className="pb-3">
              {groups.map((group) => {
                const visible = group.plans.filter((journey) => journey.id !== featuredJourney?.id);
                if (visible.length === 0) return null;
                return (
                  <div key={group.id} className="mb-5 last:mb-0">
                    <h3 className="mb-2 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{t(lang, group.labelKey)}</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {visible.map((journey) => (
                        <JourneyCard
                          key={journey.id}
                          plan={journey}
                          lang={lang}
                          running={activeIds.has(journey.id)}
                          progress={progressById[journey.id]}
                          onOpen={() => openJourney(journey)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
