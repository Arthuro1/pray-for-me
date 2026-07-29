import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import { Plus, Trash2, X, Check, Download, Tag } from 'lucide-react';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { monthDots, prayersForDay, sortEntries, runningPlanIds } from '../lib/planner';
import { addDays } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { buildICS } from '../utils/ics';
import { PLANS } from '../content/prayerPlans';
import { CATEGORY_COLORS, categoryTint } from '../lib/categoryColor';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import EmptyState from '../components/shared/EmptyState';
import MonthCalendar from '../components/MonthCalendar';
import { monthDayKeys } from '../lib/monthCalendar';
import DayAgenda from '../components/DayAgenda';
import PlanDetailModal from '../components/PlanDetailModal';
import { PageHeader } from '../components/shared/Primitives';

const EMOJIS = ['🙏', '✝️', '⛪', '👨‍👩‍👧‍👦', '💼', '🌍', '❤️', '🏥', '📖', '🕊️', '⚡', '🌟', '💰', '🎓', '👶'];
// "A few per day" (Decision A): a global cap on how many prayers a day surfaces
// on Today, so a long list stays coverable. Off = show everything.
const CAP_OPTIONS = [null, 3, 5, 10];

export default function PlanTab() {
  const {
    categories, prayers, addCategory, updateCategory, deleteCategory, settings, updateSettings, addPrayer,
    completions, markPrayedOn, unmarkPrayedOn, skipOccurrence, moveOccurrence, setOccurrenceOverride, endSeriesBefore,
  } = usePrayerStore(
    useShallow((s) => ({
      categories: s.categories,
      prayers: s.prayers,
      addCategory: s.addCategory,
      updateCategory: s.updateCategory,
      deleteCategory: s.deleteCategory,
      settings: s.settings,
      updateSettings: s.updateSettings,
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
  const [monthDate, setMonthDate] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '🙏', color: CATEGORY_COLORS[0] });
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  const [detailPlan, setDetailPlan] = useState(null); // plan whose explanation modal is open

  const { user } = useAuthStore();
  const myCommitments = useCommunityStore((s) => s.myCommitments);
  const fetchMyCommitments = useCommunityStore((s) => s.fetchMyCommitments);
  useEffect(() => {
    if (user?.id) fetchMyCommitments(user.id, addDays(todayKey(), -92));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const startPlan = async (plan, startDate) => {
    const start = startDate || todayKey();
    await addPrayer({
      title: t(lang, plan.titleKey),
      description: t(lang, plan.subKey),
      categoryIds: [],
      schedule: {
        type: 'recurring', freq: 'daily', startDate: start,
        end: { kind: 'count', count: plan.count },
        plan: { id: plan.id, startDate: start },
      },
    });
    toast.success(t(lang, 'planStarted'));
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

  const currentCap = settings.maxPerDay || null;

  return (
    <div className="phase-page constellation-plan">
      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          lang={lang}
          running={activePlanIds.has(detailPlan.id)}
          onStart={startPlan}
          onClose={() => setDetailPlan(null)}
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

        {/* A few per day — one calm global cap so a long list stays coverable */}
        <div className="phase-card p-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'perDayTitle')}</p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'perDaySub')}</p>
          <div className="flex gap-2 flex-wrap" role="group" aria-label={t(lang, 'perDayTitle')}>
            {CAP_OPTIONS.map((n) => {
              const active = currentCap === n;
              return (
                <button
                  key={n ?? 'off'}
                  onClick={() => updateSettings({ maxPerDay: n })}
                  aria-pressed={active}
                  className="min-h-[40px] px-4 rounded-xl text-sm font-medium transition-colors"
                  style={active
                    ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                    : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  {n ?? t(lang, 'perDayOff')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Guided prayer plans */}
        <div className="pt-2">
          <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'plansTitle')}</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'plansSub')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PLANS.map((plan) => {
              const running = activePlanIds.has(plan.id);
              return (
                <button
                  key={plan.id}
                  onClick={() => setDetailPlan(plan)}
                  className="phase-card plan-card p-4 flex items-start gap-3 text-left w-full"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--accent-soft)' }}>
                    {plan.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, plan.titleKey)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, plan.subKey)}</p>
                    <p className="text-xs mt-2 font-medium" style={{ color: running ? 'var(--success)' : 'var(--accent)' }}>
                      {running
                        ? `✓ ${t(lang, 'planRunning')}`
                        : `${t(lang, 'planTapToPreview')} · ${t(lang, 'planDays', { n: plan.count })}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Labels — grouping only: name, emoji, colour. No schedule lives here. */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <Tag size={16} style={{ color: 'var(--accent)' }} /> {t(lang, 'labelsTitle')}
            </h3>
            {categories.length > 0 && (
              <button
                onClick={openAdd}
                title={t(lang, 'addLabel')}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium"
                style={{ background: 'var(--plum)', color: '#fff' }}
              >
                <Plus size={13} /> {t(lang, 'addLabel')}
              </button>
            )}
          </div>
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
