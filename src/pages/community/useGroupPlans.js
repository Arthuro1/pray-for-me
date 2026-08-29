import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../../store/communityStore';
import usePrayerStore from '../../store/prayerStore';
import { t } from '../../i18n';
import { toast } from '../../store/toastStore';
import { planById } from '../../lib/guidedPlan';
import { canUsePlan } from '../../lib/planReview';
import { startGuidedPlan } from '../../lib/startGuidedPlan';
import { runningPlanIds } from '../../lib/planner';
import { todayKey } from '../../lib/prayedLog';

// Group prayer plans — the plans a whole group is walking through together,
// visible to every member (including those who join later) and joinable here.
// Owns the plans read-model, its live subscription, and the join/leave/end/adopt
// mutations (with optimistic "who's praying" count updates). Lifted out of
// GroupView, which was carrying ~90 lines of plan logic on top of the prayer wall.
export default function useGroupPlans({ groupId, user, lang }) {
  const navigate = useNavigate();
  const { fetchGroupPlans, startGroupPlan, joinGroupPlan, leaveGroupPlan, endGroupPlan, subscribeGroupPlans } = useCommunityStore(
    useShallow((s) => ({
      fetchGroupPlans: s.fetchGroupPlans,
      startGroupPlan: s.startGroupPlan,
      joinGroupPlan: s.joinGroupPlan,
      leaveGroupPlan: s.leaveGroupPlan,
      endGroupPlan: s.endGroupPlan,
      subscribeGroupPlans: s.subscribeGroupPlans,
    }))
  );
  const [groupPlans, setGroupPlans] = useState([]);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null); // plan chosen from the picker
  const [busyPlanId, setBusyPlanId] = useState(null);
  const [confirmEndPlan, setConfirmEndPlan] = useState(null);

  // Load the group's shared plans; live-refresh when one is started/ended or a
  // member joins (so the "who's praying" count stays current for everyone).
  const loadGroupPlans = useCallback(async () => {
    if (!groupId || !user?.id) return;
    const { plans } = await fetchGroupPlans(groupId, user.id);
    setGroupPlans(plans || []);
  }, [groupId, user?.id, fetchGroupPlans]);
  useEffect(() => { loadGroupPlans(); }, [loadGroupPlans]);
  useEffect(() => {
    if (!groupId) return;
    return subscribeGroupPlans(groupId, loadGroupPlans);
  }, [groupId, loadGroupPlans, subscribeGroupPlans]);

  // Start the guided plan on MY own calendar (unless I'm already running it).
  // Shared by "join a group plan" and "adopt a plan for the group". The slim
  // singles choices are owned by the Plan tab, so that one plan is handed over
  // there while every other plan starts in place.
  const startPlanOnMyCalendar = async (plan, startDate) => {
    if (!plan) return { ok: false, reason: 'unavailable' };
    const mine = usePrayerStore.getState().prayers;
    if (runningPlanIds(mine, todayKey()).has(plan.id)) return { ok: true, alreadyRunning: true };
    const result = await startGuidedPlan({
      plan, startDate, lang, addPrayer: usePrayerStore.getState().addPrayer,
    });
    if (!result.ok && result.reason === 'personalize') {
      navigate('/guidance', { state: { guidedJourneyStart: { planId: plan.id, startDate } } });
      return { ok: true, handedOff: true };
    }
    return result;
  };

  // Join a plan the group is praying: I'm counted among those praying it, and it
  // lands on my calendar. Optimistically reflect the new joined state + count.
  const handleJoinGroupPlan = async (gp) => {
    setBusyPlanId(gp.id);
    const plan = planById(gp.plan_id);
    if (!plan) {
      setBusyPlanId(null);
      toast.error(t(lang, 'planCoupleReviewHint'));
      return;
    }
    // Membership first: it is the shared signal, and it must not depend on
    // whether this member's own copy could be created.
    const res = await joinGroupPlan(gp.id, groupId, user.id);
    if (res?.error) { setBusyPlanId(null); toast.error(t(lang, 'errorGeneric')); return; }
    setGroupPlans((prev) => prev.map((p) => (p.id === gp.id && !p.joinedByMe)
      ? { ...p, joinedByMe: true, participantCount: p.participantCount + 1 } : p));

    const started = await startPlanOnMyCalendar(plan, gp.start_date);
    setBusyPlanId(null);
    if (!started.ok) { toast.error(t(lang, 'errorGeneric')); return; }
    if (started.handedOff) return;
    toast.success(t(lang, 'planStarted'));
  };

  // Stop praying a group plan (removes only my participation; my calendar copy
  // and everyone else's are untouched).
  const handleLeaveGroupPlan = async (gp) => {
    setBusyPlanId(gp.id);
    const res = await leaveGroupPlan(gp.id, user.id);
    setBusyPlanId(null);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    setGroupPlans((prev) => prev.map((p) => (p.id === gp.id && p.joinedByMe)
      ? { ...p, joinedByMe: false, participantCount: Math.max(0, p.participantCount - 1) } : p));
  };

  // End a shared plan for the whole group (starter or admin — enforced by RLS).
  const handleEndGroupPlan = async (gp) => {
    setBusyPlanId(gp.id);
    const res = await endGroupPlan(gp.id);
    setBusyPlanId(null);
    setConfirmEndPlan(null);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    setGroupPlans((prev) => prev.filter((p) => p.id !== gp.id));
    toast.success(t(lang, 'groupPlanEndedToast'));
  };

  // Adopt a plan for the group (picker → PlanDetailModal): it becomes visible to
  // everyone and also starts on the adopter's own calendar.
  const handleAdoptGroupPlan = async (plan, startDate) => {
    // The start boundary, not just the button's disabled state. Adopting wrote
    // the group_plans row BEFORE startGuidedPlan() checked the review gate, so a
    // plan awaiting sign-off could be pinned to a whole group's wall even though
    // no member could ever pray a day of it.
    if (!canUsePlan(plan)) { toast.error(t(lang, 'planCoupleReviewHint')); return; }
    const res = await startGroupPlan({ groupId, planId: plan.id, startDate, userId: user.id });
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    await startPlanOnMyCalendar(plan, startDate);
    await loadGroupPlans();
    toast.success(t(lang, 'groupPlanStartedToast'));
  };

  const adoptedPlanIds = new Set(groupPlans.map((p) => p.plan_id));

  return {
    groupPlans, adoptedPlanIds,
    showPlanPicker, setShowPlanPicker,
    detailPlan, setDetailPlan,
    confirmEndPlan, setConfirmEndPlan,
    busyPlanId,
    handleJoinGroupPlan, handleLeaveGroupPlan, handleEndGroupPlan, handleAdoptGroupPlan,
  };
}
