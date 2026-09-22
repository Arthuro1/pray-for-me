import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, HandHeart, UserPlus } from 'lucide-react';
import { t } from '../../i18n';
import usePrayerStore from '../../store/prayerStore';
import useAuthStore from '../../store/authStore';
import useCommunityStore from '../../store/communityStore';
import { toast } from '../../store/toastStore';
import { track, EVENTS } from '../../lib/analytics';
import { formatPlanStartDate, planById } from '../../lib/guidedPlan';
import { runningPlanProgress } from '../../lib/planner';
import { todayKey } from '../../lib/prayedLog';
import { parsePlanSharePath, takePendingPlanJoin } from '../../lib/planShareLink';
import { recordPlanShareJoin } from '../../lib/planShareApi';
import { startGuidedPlan } from '../../lib/startGuidedPlan';
import { usePlanShareInvite } from '../../hooks/usePlanShareInvite';
import PlanPersonalizeModal from '../../components/PlanPersonalizeModal';
import { PlanJoinControls, PlanSharePreview } from './PlanSharePreview';

// A shared plan link, opened signed in. Four ways in, one page:
//
//   * straight from the public page's "Join this plan" — the choice was kept
//     across sign-up, so the plan starts at once (day 1, on the chosen day);
//   * an existing member tapping a link — the plan and a Join button;
//   * someone already praying this plan — nothing to start, a way to it;
//   * the sharer opening their own link — the plan, and no self-counting.
//
// After joining, and only for a live link from someone else, one optional
// step: send the sharer an ordinary friend request, which they still accept.
export default function PlanJoinPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { planId, token } = parsePlanSharePath(pathname) || {};
  const plan = planById(planId);
  const lang = usePrayerStore((s) => s.settings.language) || 'fr';
  const prayers = usePrayerStore((s) => s.prayers);
  const prayersLoading = usePrayerStore((s) => s.loading);
  const addPrayer = usePrayerStore((s) => s.addPrayer);
  const userId = useAuthStore((s) => s.user?.id);
  const fetchFriends = useCommunityStore((s) => s.fetchFriends);
  const sendFriendRequestToId = useCommunityStore((s) => s.sendFriendRequestToId);
  const invite = usePlanShareInvite(token, planId, userId);

  const [started, setStarted] = useState(null); // { prayerId, startDate }
  const [personalizeDate, setPersonalizeDate] = useState(null);
  const [busy, setBusy] = useState(false);
  const [friendIds, setFriendIds] = useState(null);
  const [requested, setRequested] = useState(false);
  const pendingChecked = useRef(false);

  const running = plan ? runningPlanProgress(prayers, todayKey())[plan.id] || null : null;
  const ownLink = !!invite.inviterId && invite.inviterId === userId;
  const fromSomeoneElse = invite.active && !!invite.inviterId && !ownLink;

  const begin = useCallback(async (startDate, prefs = null) => {
    setBusy(true);
    const result = await startGuidedPlan({ plan, startDate, lang, addPrayer, prefs });
    setBusy(false);
    if (result.reason === 'personalize') { setPersonalizeDate(startDate); return; }
    if (!result.ok) { toast.error(t(lang, 'errorGeneric')); return; }
    // The plan's first day is this person's first prayer here; the generic
    // first-run walkthrough would only stand in front of it.
    try { localStorage.setItem('pfm_onboarded', '1'); } catch { /* ignore */ }
    if (token && fromSomeoneElse) recordPlanShareJoin(token, plan.id);
    track(EVENTS.PLAN_LINK_JOINED);
    setStarted({ prayerId: result.prayerId, startDate });
  }, [plan, lang, addPrayer, token, fromSomeoneElse]);

  // A join chosen on the public page, before sign-up, finishes here — once the
  // journal has loaded (so an existing run is never duplicated) and the link is
  // resolved (so the join is counted for the right person).
  useEffect(() => {
    if (pendingChecked.current || !plan || prayersLoading || invite.loading) return;
    pendingChecked.current = true;
    const pending = takePendingPlanJoin(plan.id);
    if (pending && !running) begin(pending.startDate || todayKey());
  }, [plan, prayersLoading, invite.loading, running, begin]);

  useEffect(() => {
    if (!fromSomeoneElse || !userId) return;
    fetchFriends(userId).then((res) => setFriendIds(new Set((res?.friends || []).map((f) => f.id))));
  }, [fromSomeoneElse, userId, fetchFriends]);

  const requestFriend = async () => {
    const res = await sendFriendRequestToId(invite.inviterId, userId);
    if (res?.error && res.error !== 'exists' && res.error !== 'alreadyFriends') { toast.error(t(lang, 'errorGeneric')); return; }
    setRequested(true);
    toast.success(t(lang, 'requestSent'));
  };

  if (!plan) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'planShareUnavailable')}</p>
        <button type="button" onClick={() => navigate('/', { replace: true })} className="primary-button mt-6 px-6">{t(lang, 'guidanceContinue')}</button>
      </div>
    );
  }

  const offerFriend = fromSomeoneElse && (started || running) && friendIds && !friendIds.has(invite.inviterId);

  return (
    <div className="mx-auto max-w-md px-4 pb-12 pt-4">
      {personalizeDate && (
        <PlanPersonalizeModal
          plan={plan}
          lang={lang}
          mode="start"
          ctaKey="journeyStart"
          onSave={async (prefs) => {
            const date = personalizeDate;
            setPersonalizeDate(null);
            await begin(date, prefs);
          }}
          onClose={() => setPersonalizeDate(null)}
        />
      )}

      <PlanSharePreview plan={plan} lang={lang} firstName={ownLink ? null : invite.firstName} />

      <div className="mt-6 space-y-3">
        {started ? (
          <div className="phase-card p-5" role="status" style={{ borderColor: 'var(--success)' }}>
            <p className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-1)' }}>
              <Check size={18} aria-hidden="true" style={{ color: 'var(--success)' }} />
              {started.startDate === todayKey()
                ? t(lang, 'journeyBeginsToday')
                : t(lang, 'groupPlanStartsOn', { date: formatPlanStartDate(started.startDate, lang) })}
            </p>
            <button type="button" onClick={() => navigate(`/prayers/${started.prayerId}`)} className="primary-button mt-4 flex w-full items-center justify-center gap-2 px-4">
              <HandHeart size={16} aria-hidden="true" /> {t(lang, 'beginDayOne')}
            </button>
          </div>
        ) : running ? (
          <div className="phase-card p-5">
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t(lang, 'planShareAlreadyRunning')}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'planDayOf', { n: running.day || 1, total: plan.count })}</p>
            <button type="button" onClick={() => navigate(`/prayers/${running.prayerId}`)} className="primary-button mt-4 flex w-full items-center justify-center gap-2 px-4">
              <HandHeart size={16} aria-hidden="true" /> {t(lang, 'guidanceContinue')}
            </button>
          </div>
        ) : (
          <PlanJoinControls
            lang={lang}
            onJoin={(date) => begin(date)}
            busy={busy || invite.loading}
            footnote={fromSomeoneElse && invite.firstName ? t(lang, 'planShareJoinFootnote', { name: invite.firstName }) : null}
          />
        )}

        {ownLink && <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, 'planShareOwnLink')}</p>}

        {offerFriend && (
          <button
            type="button"
            onClick={requestFriend}
            disabled={requested}
            className="pressable flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium disabled:opacity-60"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
          >
            {requested
              ? <><Check size={15} aria-hidden="true" /> {t(lang, 'requestSent')}</>
              : <><UserPlus size={15} aria-hidden="true" /> {invite.firstName ? t(lang, 'planShareAddFriend', { name: invite.firstName }) : t(lang, 'planShareAddFriendPlain')}</>}
          </button>
        )}
      </div>
    </div>
  );
}
