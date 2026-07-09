// Pure recurrence-draft logic behind the ScheduleEditor UI. Lives in lib/ (not in
// the component file) so it can be imported without dragging in React — and so
// the editor file only exports a component (keeps Fast Refresh working).
//
// A DRAFT is the editor's working shape; scheduleFromDraft() turns it into the
// persisted schedule (or null = follows the weekly category plan).
import { t } from '../i18n';
import { normalizeSchedule, parseKey } from './schedule';
import { todayKey } from './prayedLog';

// Which mode chip a draft matches (drives chip highlighting). The chips name the
// MODE — "pray once" / "pray regularly" — not one of its values, so moving the
// date off today or the frequency off daily can never orphan the highlight.
export function presetOf(d) {
  return d?.mode || 'plan';
}

export function emptyDraft() {
  return {
    mode: 'plan', // 'plan' (no schedule) | 'once' | 'recurring'
    date: todayKey(),
    freq: 'daily',
    weekDays: [],
    interval: 3,
    dayOfMonth: parseInt(todayKey().slice(8, 10), 10),
    yearlyDate: todayKey(),
    slot: null,
    endKind: 'never', // 'never' | 'date' | 'count' | 'answered'
    endDate: '',
    endCount: 21,
  };
}

export function draftFromSchedule(s) {
  const d = emptyDraft();
  if (!s) return d;
  if (s.type === 'once') {
    return { ...d, mode: 'once', date: s.date, slot: s.slot || null };
  }
  d.mode = 'recurring';
  d.freq = s.freq || 'daily';
  d.weekDays = s.weekDays || [];
  d.interval = s.interval || 3;
  d.dayOfMonth = s.dayOfMonth || d.dayOfMonth;
  if (s.freq === 'yearly' && s.month && s.day) {
    const y = new Date().getFullYear();
    d.yearlyDate = `${y}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`;
  }
  d.slot = s.slot || null;
  d.endKind = s.end?.kind || 'never';
  d.endDate = s.end?.date || '';
  d.endCount = s.end?.count || 21;
  d.startDate = s.startDate;
  d.plan = s.plan;
  return d;
}

// Draft → persisted schedule (null = no schedule, follow the weekly plan).
export function scheduleFromDraft(d, existing = null) {
  if (!d || d.mode === 'plan') return null;
  if (d.mode === 'once') {
    return normalizeSchedule({ type: 'once', date: d.date, slot: d.slot }, todayKey());
  }
  const yearly = d.yearlyDate ? parseKey(d.yearlyDate) : new Date();
  return normalizeSchedule({
    type: 'recurring',
    freq: d.freq,
    weekDays: d.weekDays,
    interval: d.interval,
    dayOfMonth: d.dayOfMonth,
    month: yearly.getMonth() + 1,
    day: yearly.getDate(),
    // Editing keeps the original series anchor so counts don't restart.
    startDate: d.startDate || existing?.startDate,
    slot: d.slot,
    end: { kind: d.endKind, date: d.endDate, count: d.endCount },
    plan: d.plan || existing?.plan,
  }, todayKey());
}

// One-line human summary ("Every Tue, Fri · morning · until answered").
// Also used by PrayerDetail and the day agenda.
export function scheduleSummary(s, lang) {
  if (!s) return '';
  const dayNames = t(lang, 'days');
  const fmt = (key) => parseKey(key).toLocaleDateString(lang, { day: 'numeric', month: 'short' });
  let base;
  if (s.type === 'once') {
    base = `${t(lang, 'schedOnce')} · ${fmt(s.date)}`;
  } else {
    switch (s.freq) {
      case 'daily': base = t(lang, 'schedDaily'); break;
      case 'weekly': base = t(lang, 'schedWeekly', { days: (s.weekDays || []).map((i) => dayNames[i]).join(', ') }); break;
      case 'interval': base = t(lang, 'schedInterval', { n: s.interval }); break;
      case 'monthly': base = t(lang, 'schedMonthly', { d: s.dayOfMonth }); break;
      case 'yearly': base = t(lang, 'schedYearly', { date: parseKey(`2026-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`).toLocaleDateString(lang, { day: 'numeric', month: 'long' }) }); break;
      default: base = '';
    }
  }
  const parts = [base];
  if (s.slot) parts.push(t(lang, `slot_${s.slot}`));
  const end = s.end || {};
  if (end.kind === 'date' && end.date) parts.push(t(lang, 'schedUntilDate', { date: fmt(end.date) }));
  if (end.kind === 'count' && end.count) parts.push(t(lang, 'schedTimes', { n: end.count }));
  if (end.kind === 'answered') parts.push(t(lang, 'schedUntilAnswered'));
  return parts.filter(Boolean).join(' · ');
}
