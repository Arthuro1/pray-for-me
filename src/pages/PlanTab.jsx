import { useState, useEffect } from 'react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import { Plus, Trash2, X, Check, Sparkles, ChevronUp, ChevronDown, CalendarDays, LayoutGrid, Download } from 'lucide-react';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { prayerOnDay } from '../utils/prayer';
import { monthDots } from '../lib/planner';
import { addDays } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { buildICS } from '../utils/ics';
import { PLANS } from '../content/prayerPlans';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import MonthCalendar, { monthDayKeys } from '../components/MonthCalendar';
import DayAgenda from '../components/DayAgenda';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
const EMOJIS = ['🙏', '✝️', '⛪', '👨‍👩‍👧‍👦', '💼', '🌍', '❤️', '🏥', '📖', '🕊️', '⚡', '🌟', '💰', '🎓', '👶'];
const COLORS = ['#7c5cfc', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#ea580c', '#16a34a', '#2d1b5e'];

export default function PlanTab() {
  const {
    categories, prayers, addCategory, updateCategory, deleteCategory, reorderCategories, settings, addPrayer,
    completions, getEntriesForDay, markPrayedOn, unmarkPrayedOn, skipOccurrence, moveOccurrence, setOccurrenceOverride, endSeriesBefore,
  } = usePrayerStore();
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';
  const DAYS = t(lang, 'days');
  const todayIdx = new Date().getDay();
  const [view, setView] = useState('month'); // 'month' (calendar) | 'week' (legacy category plan)
  const [monthDate, setMonthDate] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '🙏', color: '#7c5cfc', weekDays: [] });
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  useEscapeKey(selectedDay !== null ? () => setSelectedDay(null) : null);
  const dayTrapRef = useFocusTrap(selectedDay !== null);

  const { user } = useAuthStore();
  const { myCommitments, fetchMyCommitments } = useCommunityStore();
  useEffect(() => {
    if (user?.id) fetchMyCommitments(user.id, addDays(todayKey(), -92));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dots = view === 'month' ? monthDots(prayers, categories, monthDayKeys(monthDate)) : {};
  if (view === 'month') {
    // Group prayer-chain claims appear on the personal calendar too.
    for (const c of myCommitments) {
      if (c.day.slice(0, 7) === `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`) {
        dots[c.day] = { ...(dots[c.day] || {}), group: ((dots[c.day] || {}).group || 0) + 1 };
      }
    }
  }
  const dayEntries = view === 'month' ? getEntriesForDay(selectedKey) : [];
  const dayCommitments = view === 'month' ? myCommitments.filter((c) => c.day === selectedKey) : [];

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
  const activePlanIds = new Set(prayers.filter((p) => p.status === 'active' && p.schedule?.plan?.id).map((p) => p.schedule.plan.id));
  const startPlan = async (plan) => {
    const start = todayKey();
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

  // Number of active prayers that land on a given weekday.
  const countForDay = (dayIdx) => {
    const dayCatIds = categories.filter((c) => (c.week_days || []).includes(dayIdx)).map((c) => c.id);
    return prayers.filter((p) => prayerOnDay(p, dayIdx, dayCatIds)).length;
  };

  const moveCategory = (id, dir) => {
    const ids = categories.map((c) => c.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorderCategories(ids);
  };

  const toggleDay = (day, catId) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const days = cat.week_days || [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    updateCategory(catId, { weekDays: next });
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    if (editId) {
      updateCategory(editId, form);
      setEditId(null);
    } else {
      addCategory(form);
    }
    setForm({ name: '', emoji: '🙏', color: '#7c5cfc', weekDays: [] });
    setShowAddForm(false);
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name, emoji: cat.emoji, color: cat.color, weekDays: cat.week_days || [] });
    setEditId(cat.id);
    setShowAddForm(true);
  };

  // Days with no active prayers planned, and categories not assigned to any day.
  const emptyDays = DAYS.map((_, idx) => idx).filter((idx) => countForDay(idx) === 0);
  const unassigned = categories.filter((c) => !(c.week_days || []).length);

  const activePrayerCount = (catId) =>
    prayers.filter((p) => p.status === 'active' && (p.prayer_categories || []).some((x) => x.category_id === catId)).length;

  // Fill empty days: greedily place each unassigned category on the currently
  // lightest day (so empties get filled first and the week stays balanced). Undoable.
  const handleFillEmptyDays = () => {
    if (unassigned.length === 0) return;
    const load = DAYS.map((_, idx) => countForDay(idx));
    const prev = unassigned.map((c) => ({ id: c.id, weekDays: c.week_days || [] }));
    unassigned.forEach((cat) => {
      let minIdx = 0;
      for (let d = 1; d < 7; d++) if (load[d] < load[minIdx]) minIdx = d;
      updateCategory(cat.id, { weekDays: [minIdx] });
      load[minIdx] += Math.max(activePrayerCount(cat.id), 1); // at least 1 so empty categories still spread
    });
    toast.success(t(lang, 'categoriesScheduled'), {
      action: { label: t(lang, 'undo'), onClick: () => prev.forEach((p) => updateCategory(p.id, { weekDays: p.weekDays })) },
    });
  };

  return (
    <div>
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

      {/* Day-centric editor: tap a day to toggle which categories you pray that day */}
      {selectedDay !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSelectedDay(null)}>
          <div ref={dayTrapRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={DAYS[selectedDay]} className="w-full max-w-md rounded-2xl p-5 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{DAYS[selectedDay]}</h3>
              <button onClick={() => setSelectedDay(null)} aria-label={t(lang, 'close')} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>{t(lang, 'planDayHint')}</p>
            {categories.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-3)' }}>{t(lang, 'noCategoriesYet')}</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => {
                  const on = (cat.week_days || []).includes(selectedDay);
                  return (
                    <button key={cat.id} onClick={() => toggleDay(selectedDay, cat.id)}
                      className="flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all"
                      style={{ background: 'var(--input-bg)', border: on ? `1.5px solid ${cat.color}` : '0.5px solid var(--input-border)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: cat.color + '22' }}>{cat.emoji}</div>
                      <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-1)' }}>{tr(cat.name, lang)}</span>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: on ? cat.color : 'transparent', border: on ? 'none' : '1.5px solid var(--input-border)' }}>
                        {on && <Check size={13} color="#fff" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="px-4 md:px-8 pt-8 pb-5"
        style={{ background: 'var(--header)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold mb-1 text-white">{t(lang, view === 'month' ? 'calendarTitle' : 'weeklyPlan')}</h2>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{t(lang, view === 'month' ? 'calendarSub' : 'weeklyPlanSub')}</p>
          </div>
          {/* View switcher: calendar (day-by-day) vs weekly category plan */}
          <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid rgba(255,255,255,0.25)' }}>
            {[['month', CalendarDays, 'monthView'], ['week', LayoutGrid, 'weekView']].map(([v, Icon, key]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium"
                style={view === v ? { background: 'rgba(255,255,255,0.22)', color: '#fff' } : { color: 'rgba(255,255,255,0.6)' }}
              >
                <Icon size={12} /> {t(lang, key)}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly overview — tap a day to edit what you pray that day */}
        {view === 'week' && (
        <div className="mt-4 grid grid-cols-7 gap-1">
          {DAYS.map((day, idx) => {
            const dayCats = categories.filter((c) => (c.week_days || []).includes(idx));
            const count = countForDay(idx);
            const isToday = idx === todayIdx;
            return (
              <button key={idx} onClick={() => setSelectedDay(idx)} className="text-center rounded-lg p-1 transition-colors"
                style={isToday ? { background: 'rgba(255,255,255,0.16)' } : {}}>
                <p className="text-xs font-medium mb-1" style={{ color: isToday ? '#fff' : 'rgba(255,255,255,0.6)' }}>{day}</p>
                <div className="space-y-0.5">
                  {dayCats.length === 0 ? (
                    <div className="h-6 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  ) : (
                    dayCats.map((c) => (
                      <div key={c.id} className="h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: c.color }}>
                        {c.emoji}
                      </div>
                    ))
                  )}
                </div>
                <p className="text-[10px] mt-1" style={{ color: count > 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)' }}>{count}</p>
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Month calendar + day agenda */}
      {view === 'month' && (
        <div className="px-4 md:px-8 pt-4 pb-6 space-y-3">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PLANS.map((plan) => {
                const running = activePlanIds.has(plan.id);
                return (
                  <div key={plan.id} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--accent-soft)' }}>
                      {plan.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, plan.titleKey)}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, plan.subKey)}</p>
                      <button
                        onClick={() => startPlan(plan)}
                        disabled={running}
                        className="mt-2.5 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                        style={running
                          ? { background: 'var(--input-bg)', color: 'var(--text-3)' }
                          : { background: 'var(--accent)', color: '#fff' }}
                      >
                        {running ? `✓ ${t(lang, 'planRunning')}` : `${t(lang, 'planStart')} · ${t(lang, 'planDays', { n: plan.count })}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
      )}

      {view === 'week' && (
      <div className="px-4 md:px-8 pt-4">
        {/* Planning hints — unscheduled categories and/or empty days */}
        {(unassigned.length > 0 || emptyDays.length > 0) && (
          <div className="rounded-2xl p-3.5 mb-4 flex items-start gap-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
            <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <div className="flex-1 min-w-0">
              {unassigned.length > 0 && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {t(lang, 'unassignedCategories', { count: unassigned.length })}
                </p>
              )}
              {emptyDays.length > 0 && (
                <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--text-2)' }}>
                  {t(lang, 'planEmptyDays')} {emptyDays.map((idx) => DAYS[idx]).join(', ')}
                </p>
              )}
              {unassigned.length > 0 && (
                <button onClick={handleFillEmptyDays} className="mt-2 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {t(lang, 'autoSchedule')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Add button */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'categoriesHeading')}</h3>
          <button
            onClick={() => { setShowAddForm(true); setEditId(null); setForm({ name: '', emoji: '🙏', color: '#7c5cfc', weekDays: [] }); }}
            title={t(lang, 'tipCreateCategory')}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium"
            style={{ background: '#7c5cfc', color: '#fff' }}
          >
            <Plus size={13} /> {t(lang, 'addCategory')}
          </button>
        </div>

        {/* Add/Edit form */}
        {showAddForm && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{editId ? t(lang, 'editCategoryLabel') : t(lang, 'newCategoryLabel')}</h4>
              <button onClick={() => setShowAddForm(false)} title={t(lang, 'tipCloseForm')} style={{ color: '#b0a4c0' }}><X size={16} /></button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t(lang, 'categoryNamePlaceholder')}
                className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                autoFocus
              />

              <div>
                <p className="text-xs mb-2" style={{ color: '#9b8cb0' }}>{t(lang, 'emojiLabel')}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setForm({ ...form, emoji: e })}
                      className="text-lg p-1.5 rounded-lg transition-colors"
                      style={form.emoji === e ? { background: '#f3eff9', outline: '2px solid #7c5cfc' } : { background: '#f7f4ef' }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs mb-2" style={{ color: '#9b8cb0' }}>{t(lang, 'colorLabel')}</p>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: c, outline: form.color === c ? '2px solid #1a0f2e' : 'none', outlineOffset: '2px' }}
                    >
                      {form.color === c && <Check size={12} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs mb-2" style={{ color: '#9b8cb0' }}>{t(lang, 'prayerDays')}</p>
                <div className="flex gap-1">
                  {DAYS.map((day, idx) => {
                    const active = (form.weekDays || []).includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const days = form.weekDays || [];
                          setForm({ ...form, weekDays: days.includes(idx) ? days.filter((d) => d !== idx) : [...days, idx] });
                        }}
                        className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
                        style={active ? { backgroundColor: form.color, color: '#fff' } : { background: '#f3eff9', color: '#9b8cb0' }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleAdd}
                className="w-full text-white rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: '#7c5cfc' }}
              >
                {editId ? t(lang, 'saveBtn') : t(lang, 'addBtn')}
              </button>
            </div>
          </div>
        )}

        {/* Category list */}
        {categories.length === 0 && !showAddForm ? (
          <EmptyState
            emoji="🗂️"
            title={t(lang, 'noCategoriesYet')}
            subtitle={t(lang, 'weeklyPlanSub')}
            actionLabel={t(lang, 'addCategory')}
            actionIcon={Plus}
            onAction={() => { setShowAddForm(true); setEditId(null); setForm({ name: '', emoji: '🙏', color: '#7c5cfc', weekDays: [] }); }}
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: cat.color + '22' }}
                >
                  {cat.emoji}
                </div>
                <span className="text-sm font-semibold" style={{ color: cat.color }}>{tr(cat.name, lang)}</span>
                {(cat.week_days || []).length === 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#fdf0f0', color: '#c04040' }}>
                    {t(lang, 'categoryNotScheduled')}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {(() => { const i = categories.findIndex((c) => c.id === cat.id); return (
                    <>
                      <button onClick={() => moveCategory(cat.id, -1)} disabled={i === 0} title={t(lang, 'moveUp')} className="p-1 rounded-lg disabled:opacity-30" style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}>
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={() => moveCategory(cat.id, 1)} disabled={i === categories.length - 1} title={t(lang, 'moveDown')} className="p-1 rounded-lg disabled:opacity-30" style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}>
                        <ChevronDown size={14} />
                      </button>
                    </>
                  ); })()}
                  <button
                    onClick={() => startEdit(cat)}
                    title={t(lang, 'tipEditCategory')}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: '#f3eff9', color: '#7c5cfc' }}
                  >
                    {t(lang, 'edit')}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteCat(cat)}
                    title={t(lang, 'tipDeleteCategory')}
                    className="p-1.5 rounded-lg"
                    style={{ background: '#fdf0f0', color: '#c04040' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="flex gap-1">
                {DAYS.map((day, idx) => {
                  const active = (cat.week_days || []).includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleDay(idx, cat.id)}
                      title={t(lang, 'tipToggleDay', { day })}
                      className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
                      style={active ? { backgroundColor: cat.color, color: '#fff' } : { background: '#f3eff9', color: '#b0a4c0' }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Rotation: pray N of this list per planned day (round-robin) instead
                  of the whole list — big lists stay coverable without burnout. */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap" title={t(lang, 'rotationHint')}>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>🔄 {t(lang, 'rotationLabel')}</span>
                {[null, 3, 5, 10].map((n) => {
                  const active = (cat.rotation?.perDay || null) === n;
                  return (
                    <button
                      key={n ?? 'off'}
                      onClick={() => updateCategory(cat.id, { rotation: n ? { perDay: n } : null })}
                      className="text-[10px] px-2 py-1 rounded-lg font-medium transition-colors"
                      style={active ? { backgroundColor: cat.color, color: '#fff' } : { background: 'var(--input-bg)', color: 'var(--text-3)' }}
                    >
                      {n ?? t(lang, 'rotationOffShort')}
                    </button>
                  );
                })}
                {cat.rotation?.perDay && (
                  <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    {t(lang, 'rotationPerDay', { n: cat.rotation.perDay })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
      )}
    </div>
  );
}
