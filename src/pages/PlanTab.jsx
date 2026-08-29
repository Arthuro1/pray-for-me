import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import { Plus, Trash2, X, Check, ChevronDown, Download, Tag, HeartHandshake, Loader2 } from 'lucide-react';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { monthDots, prayersForDay, sortEntries, runningPlanIds, runningPlanProgress } from '../lib/planner';
import { addDays } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { buildICS } from '../utils/ics';
import { plansByCategory } from '../content/prayerPlans';
import { planById } from '../lib/guidedPlan';
import { CATEGORY_COLORS, categoryTint } from '../lib/categoryColor';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import EmptyState from '../components/shared/EmptyState';
import MonthCalendar from '../components/MonthCalendar';
import { monthDayKeys } from '../lib/monthCalendar';
import DayAgenda from '../components/DayAgenda';
import PlanDetailModal from '../components/PlanDetailModal';
import PlanInviteModal from '../components/PlanInviteModal';
import PlanPersonalizeModal from '../components/PlanPersonalizeModal';
import { needsPreStartPersonalization, startGuidedPlan } from '../lib/startGuidedPlan';
import { canUsePlan, isPlanReviewed } from '../lib/planReview';
import { track } from '../lib/analytics';
import { PageHeader } from '../components/shared/Primitives';

const EMOJIS = ['🙏', '✝️', '⛪', '👨‍👩‍👧‍👦', '💼', '🌍', '❤️', '🏥', '📖', '🕊️', '⚡', '🌟', '💰', '🎓', '👶'];

export default function PlanTab() {
  const {
    categories, prayers, addCategory, updateCategory, deleteCategory, settings, addPrayer,
    completions, markPrayedOn, unmarkPrayedOn, skipOccurrence, moveOccurrence, setOccurrenceOverride, endSeriesBefore,
  } = usePrayerStore(
    useShallow((s) => ({
      categories: s.categories,
      prayers: s.prayers,
      addCategory: s.addCategory,
      updateCategory: s.updateCategory,
      deleteCategory: s.deleteCategory,
      settings: s.settings,
      addPrayer: s.addPrayer,
      completions: s.completions,
      markPrayedOn: s.markPrayedOn,
      unmarkPrayedOn: s.unmarkPrayedOn,
      skipOccurrence: s.skipOccurrence,
      moveOccurrence: s.moveOccurrence,
      setOccurrenceOverride: s.setOccurrenceOverride,
      endSeriesBefore: s.endSeriesBefore,
    }))
  );
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';
  const location = useLocation();
  const navigate = useNavigate();
  const [monthDate, setMonthDate] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '🙏', color: CATEGORY_COLORS[0] });
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  // Labels are grouping admin, not something a reader comes to this page for.
  // Folded away by default so the calendar and the plans are what the page is.
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null); // plan whose explanation modal is open
  const [inviteTarget, setInviteTarget] = useState(null); // { plan, startDate } → invite modal
  const [personalizeTarget, setPersonalizeTarget] = useState(null); // singles plan choices before its run begins
  const [planInvitations, setPlanInvitations] = useState([]); // incoming "pray together" invites
  const [busyInvite, setBusyInvite] = useState(null);

  const { user } = useAuthStore();
  const myCommitments = useCommunityStore((s) => s.myCommitments);
  const fetchMyCommitments = useCommunityStore((s) => s.fetchMyCommitments);
  const { fetchPlanInvitations, acceptPlanInvitation, declinePlanInvitation, fetchPendingCount } = useCommunityStore(
    useShallow((s) => ({
      fetchPlanInvitations: s.fetchPlanInvitations,
      acceptPlanInvitation: s.acceptPlanInvitation,
      declinePlanInvitation: s.declinePlanInvitation,
      fetchPendingCount: s.fetchPendingCount,
    }))
  );
  useEffect(() => {
    if (user?.id) fetchMyCommitments(user.id, addDays(todayKey(), -92));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInvitations = useCallback(async () => {
    if (!user?.id) return;
    const { invitations } = await fetchPlanInvitations(user.id);
    setPlanInvitations(invitations || []);
  }, [user?.id, fetchPlanInvitations]);
  useEffect(() => { loadInvitations(); }, [loadInvitations]);

  const dots = monthDots(prayers, categories, monthDayKeys(monthDate));
  // Group prayer-chain claims appear on the personal calendar too.
  for (const c of myCommitments) {
    if (c.day.slice(0, 7) === `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`) {
      dots[c.day] = { ...(dots[c.day] || {}), group: ((dots[c.day] || {}).group || 0) + 1 };
    }
  }
  // The agenda shows a day's FULL plan (uncapped) — the "a few per day" cap only
  // trims what Today actually asks of Grace, not what she can review here.
  const dayEntries = sortEntries(prayersForDay(prayers, categories, selectedKey), categories);
  const dayCommitments = myCommitments.filter((c) => c.day === selectedKey);

  // Download the whole schedule as an .ics file (Google/Apple/Outlook).
  const exportCalendar = () => {
    const blob = new Blob([buildICS(prayers, myCommitments)], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pray4me-schedule.ics';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t(lang, 'exportDone'));
  };

  // Start a guided plan: ONE recurring daily prayer capped after N occurrences;
  // the engine numbers the days and prayerPlans.js supplies each day's theme.
  const activePlanIds = runningPlanIds(prayers, todayKey());
  // Where each running plan has got to, so its card can say "Day 12 of 30" and
  // hand the reader straight to that day instead of a preview it cannot start.
  const runningPlans = useMemo(() => runningPlanProgress(prayers, todayKey()), [prayers]);

  // Actually create the run after any required pre-start choices have been
  // collected. Couple plans remain immediate and can be personalized later;
  // the singles plan carries its two small choices into day one.
  const beginPlan = useCallback(async (plan, startDate, prefs = null) => {
    const result = await startGuidedPlan({ plan, startDate, lang, addPrayer, prefs });
    if (!result.ok) {
      toast.error(t(lang, result.reason === 'unavailable' ? 'planCoupleReviewHint' : 'errorGeneric'));
      return result;
    }
    if (plan.analyticsEvents?.started) track(plan.analyticsEvents.started);
    toast.success(t(lang, 'planStarted'));
    return result;
  }, [lang, addPrayer]);

  const startPlan = useCallback(async (plan, startDate) => {
    if (!canUsePlan(plan)) {
      toast.error(t(lang, 'planCoupleReviewHint'));
      return { ok: false, reason: 'unavailable' };
    }
    if (needsPreStartPersonalization(plan)) {
      setPersonalizeTarget({ plan, startDate });
      return { ok: false, reason: 'personalize' };
    }
    return beginPlan(plan, startDate);
  }, [beginPlan, lang]);

  // Starts handed over from Community or a group keep the same date and open
  // the same small singles sheet here. Route state is consumed immediately so
  // Back/refresh never repeats the request.
  useEffect(() => {
    const pending = location.state?.guidedPlanStart;
    if (!pending?.planId) return;
    navigate(location.pathname, { replace: true, state: null });
    const plan = planById(pending.planId);
    if (plan) startPlan(plan, pending.startDate || todayKey());
  }, [location.pathname, location.state, navigate, startPlan]);

  // Accept an invitation to pray a plan together: start the SAME guided plan on
  // your own calendar (unless you're already running it) and clear the invite.
  const acceptInvitation = async (inv) => {
    setBusyInvite(inv.id);
    const res = await acceptPlanInvitation(inv.id);
    if (res?.error) { setBusyInvite(null); toast.error(t(lang, 'errorGeneric')); return; }
    setBusyInvite(null);
    setPlanInvitations((prev) => prev.filter((x) => x.id !== inv.id));
    if (user?.id) fetchPendingCount(user.id);

    const plan = planById(res.planId);
    // Already praying it: the invitation is simply cleared. Nothing to start,
    // and nothing to claim.
    if (plan && activePlanIds.has(plan.id)) { toast.success(t(lang, 'planRunning')); return; }
    if (!plan) { toast.error(t(lang, 'planCoupleReviewHint')); return; }
    await startPlan(plan, res.startDate);
  };

  const declineInvitation = async (inv) => {
    setBusyInvite(inv.id);
    const res = await declinePlanInvitation(inv.id);
    setBusyInvite(null);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    setPlanInvitations((prev) => prev.filter((x) => x.id !== inv.id));
    if (user?.id) fetchPendingCount(user.id);
  };

  const resetForm = () => setForm({ name: '', emoji: '🙏', color: CATEGORY_COLORS[0] });
  const openAdd = () => { resetForm(); setEditId(null); setShowAddForm(true); };
  const startEdit = (cat) => {
    setForm({ name: cat.name, emoji: cat.emoji, color: cat.color });
    setEditId(cat.id);
    setShowAddForm(true);
  };
  const handleSave = () => {
    if (!form.name.trim()) return;
    // A label is name + emoji + colour only — no weekdays, no rotation. Rhythm
    // lives on each prayer now, so labels are purely for grouping and filtering.
    if (editId) updateCategory(editId, form);
    else addCategory(form);
    resetForm();
    setEditId(null);
    setShowAddForm(false);
  };

  return (
    <div className="phase-page constellation-plan">
      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          lang={lang}
          running={activePlanIds.has(detailPlan.id)}
          onStart={startPlan}
          onInvite={user?.id ? (plan, startDate) => { setDetailPlan(null); setInviteTarget({ plan, startDate }); } : undefined}
          onClose={() => setDetailPlan(null)}
        />
      )}

      {inviteTarget && (
        <PlanInviteModal
          plan={inviteTarget.plan}
          startDate={inviteTarget.startDate}
          lang={lang}
          userId={user.id}
          onClose={() => setInviteTarget(null)}
        />
      )}

      {personalizeTarget && (
        <PlanPersonalizeModal
          plan={personalizeTarget.plan}
          lang={lang}
          mode="start"
          ctaKey="planStart"
          onSave={async (prefs) => {
            const target = personalizeTarget;
            setPersonalizeTarget(null);
            await beginPlan(target.plan, target.startDate, prefs);
          }}
          onClose={() => setPersonalizeTarget(null)}
        />
      )}

      {confirmDeleteCat && (
        <ConfirmDialog
          title={t(lang, 'deleteCategoryConfirm')}
          message={`${confirmDeleteCat.emoji} ${tr(confirmDeleteCat.name, lang)} — ${t(lang, 'deleteWarning')}`}
          confirmLabel={t(lang, 'delete')}
          cancelLabel={t(lang, 'cancel')}
          onConfirm={() => { deleteCategory(confirmDeleteCat.id); setConfirmDeleteCat(null); }}
          onCancel={() => setConfirmDeleteCat(null)}
        />
      )}

      {/* Header — the calendar IS the plan now: one surface, no Month/Week toggle */}
      <div className="phase-page__shell">
        <PageHeader
          eyebrow={t(lang, 'plan')}
          title={t(lang, 'calendarTitle')}
          subtitle={t(lang, 'calendarSub')}
        />
      </div>

      <div className="phase-content max-w-4xl space-y-4">
        {/* Invited to pray together — incoming plan invitations. Accepting starts
            the same guided plan on your calendar; declining dismisses it. */}
        {planInvitations.length > 0 && (
          <div className="phase-card p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <HeartHandshake size={16} style={{ color: 'var(--accent)' }} /> {t(lang, 'planInvitationsHeading')}
            </h3>
            {planInvitations.map((inv) => {
              const plan = planById(inv.plan_id);
              return (
                <div key={inv.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                      {plan ? t(lang, plan.titleKey) : t(lang, 'planInviteTitle')}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                      {inv.inviterName ? t(lang, 'planInvitationFrom', { name: inv.inviterName }) : t(lang, 'planInviteSub')}
                      {inv.groupName ? ` · ${inv.groupName}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => acceptInvitation(inv)}
                      disabled={busyInvite === inv.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                      style={{ background: 'var(--accent)' }}
                    >
                      {busyInvite === inv.id ? <Loader2 size={12} className="animate-spin" /> : t(lang, 'planInviteAccept')}
                    </button>
                    <button
                      onClick={() => declineInvitation(inv)}
                      disabled={busyInvite === inv.id}
                      className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
                      style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                    >
                      {t(lang, 'reject')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <MonthCalendar
          monthDate={monthDate}
          dots={dots}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onMonthChange={setMonthDate}
          lang={lang}
        />
        <DayAgenda
          dayKey={selectedKey}
          lang={lang}
          tr={tr}
          entries={dayEntries}
          completions={completions}
          commitments={dayCommitments}
          onTogglePrayed={(id, day, prayed) => (prayed ? unmarkPrayedOn(id, day) : markPrayedOn(id, day))}
          onSkip={(id, day) => { skipOccurrence(id, day); toast.success(t(lang, 'occurrenceSkipped')); }}
          onMove={(id, from, to) => { moveOccurrence(id, from, to); toast.success(t(lang, 'occurrenceMoved', { date: to })); }}
          onRestore={(id, day) => setOccurrenceOverride(id, day, null)}
          onEndSeries={(id, day) => { endSeriesBefore(id, day); toast.success(t(lang, 'seriesEnded')); }}
        />

        {/* Guided prayer plans */}
        <div className="pt-2">
          <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'plansTitle')}</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'plansSub')}</p>
          {/* Grouped by category so the list stays browsable as plans are added.
              A category heading only appears when it has plans under it. */}
          {plansByCategory().map((group) => (
            <section key={group.id} className="mb-4 last:mb-0">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                {t(lang, group.labelKey)}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.plans.map((plan) => {
                  const run = runningPlans[plan.id];
                  const running = activePlanIds.has(plan.id);
                  return (
                    <button
                      key={plan.id}
                      onClick={() => {
                        // A plan already on the calendar opens where the reader
                        // actually is; only an unstarted one needs the preview.
                        if (run) navigate(`/prayers/${run.prayerId}`);
                        else setDetailPlan(plan);
                      }}
                      className="phase-card plan-card p-4 flex items-start gap-3 text-start w-full"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--accent-soft)' }}>
                        {plan.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, plan.titleKey)}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, plan.subKey)}</p>
                        {!isPlanReviewed(plan) && (
                          <p className="mt-1 text-[11px] font-medium" style={{ color: 'var(--gold)' }}>
                            {t(lang, 'planCoupleReviewPending')}
                          </p>
                        )}
                        <p className="text-xs mt-2 font-medium" style={{ color: running ? 'var(--success)' : 'var(--accent)' }}>
                          {running
                            ? (run?.day
                              ? `✓ ${t(lang, 'planDayOf', { n: run.day, total: plan.count })}`
                              : `✓ ${t(lang, 'planRunning')}`)
                            : `${t(lang, 'planTapToPreview')} · ${t(lang, 'planDays', { n: plan.count })}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Labels — grouping only: name, emoji, colour. No schedule lives here. */}
        <div className="pt-2">
          <div className="flex items-center justify-between gap-3 mb-1">
            <button
              type="button"
              onClick={() => setLabelsOpen((open) => !open)}
              aria-expanded={labelsOpen}
              aria-controls="plan-labels"
              className="flex min-h-11 min-w-0 items-center gap-2 font-semibold text-start"
              style={{ color: 'var(--text-1)' }}
            >
              <Tag size={16} className="shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="min-w-0 truncate">{t(lang, 'labelsTitle')}</span>
              {categories.length > 0 && (
                <span className="shrink-0 text-xs font-normal" style={{ color: 'var(--text-3)' }}>· {categories.length}</span>
              )}
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="shrink-0"
                style={{ color: 'var(--text-3)', transform: labelsOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
              />
            </button>
            {labelsOpen && categories.length > 0 && (
              <button
                onClick={openAdd}
                title={t(lang, 'addLabel')}
                className="flex items-center gap-1.5 shrink-0 text-xs px-3 py-2 rounded-xl font-medium"
                style={{ background: 'var(--plum)', color: '#fff' }}
              >
                <Plus size={13} className="shrink-0" /> {t(lang, 'addLabel')}
              </button>
            )}
          </div>
          {labelsOpen && (<div id="plan-labels">
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'labelsSub')}</p>

          {/* Add / edit form */}
          {showAddForm && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{editId ? t(lang, 'editLabel') : t(lang, 'newLabel')}</h4>
                <button onClick={() => { setShowAddForm(false); setEditId(null); }} title={t(lang, 'tipCloseForm')} style={{ color: 'var(--text-3)' }}><X size={16} /></button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t(lang, 'labelNamePlaceholder')}
                  className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                  autoFocus
                />

                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'emojiLabel')}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setForm({ ...form, emoji: e })}
                        className="text-lg p-1.5 rounded-lg transition-colors"
                        style={form.emoji === e
                          ? { background: 'var(--accent-soft)', outline: '2px solid var(--accent)' }
                          : { background: 'var(--input-bg)' }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'colorLabel')}</p>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm({ ...form, color: c })}
                        aria-label={c}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: c, outline: form.color === c ? '2px solid var(--text-1)' : 'none', outlineOffset: '2px' }}
                      >
                        {form.color === c && <Check size={12} color="#fff" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full text-white rounded-xl py-2.5 text-sm font-semibold"
                  style={{ background: 'var(--plum)' }}
                >
                  {editId ? t(lang, 'saveBtn') : t(lang, 'addBtn')}
                </button>
              </div>
            </div>
          )}

          {/* Label chips */}
          {categories.length === 0 && !showAddForm ? (
            <EmptyState
              emoji="🏷️"
              title={t(lang, 'noLabelsYet')}
              subtitle={t(lang, 'labelsSub')}
              actionLabel={t(lang, 'addLabel')}
              actionIcon={Plus}
              onAction={openAdd}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5"
                  style={{ background: categoryTint(cat.color, 16), border: `1px solid ${cat.color}` }}
                >
                  <span className="text-sm">{cat.emoji}</span>
                  <button onClick={() => startEdit(cat)} className="text-sm font-medium" style={{ color: 'var(--text-1)' }} title={t(lang, 'editLabel')}>
                    {tr(cat.name, lang)}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteCat(cat)}
                    title={t(lang, 'delete')}
                    aria-label={`${t(lang, 'delete')} ${tr(cat.name, lang)}`}
                    className="flex items-center justify-center w-6 h-6 rounded-full"
                    style={{ color: 'var(--text-3)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          </div>)}
        </div>

        {/* ICS export — take the schedule into any external calendar */}
        <button
          onClick={exportCalendar}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-medium"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}
          title={t(lang, 'exportIcsSub')}
        >
          <Download size={13} /> {t(lang, 'exportIcs')}
        </button>
      </div>
    </div>
  );
}
