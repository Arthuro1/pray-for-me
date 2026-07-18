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

// ── Simple rhythm presets ────────────────────────────────────────────────────
// The Add-prayer form asks ONE question — "How often should this return?" —
// with three everyday answers plus Custom for the full editor. Each preset is a
// plain mapping onto the draft, so the two views never disagree:
//   daily        — recurring, every day
//   weekly       — recurring, once a week (seeded on today's weekday)
//   occasionally — recurring, about every two weeks
//   custom       — anything the presets can't express (dates, months, slots…)
// 'flexible' (no schedule → the legacy category plan, daily when uncategorized)
// is no longer offered to new prayers: it made every quick capture silently
// daily. It remains selectable while EDITING a prayer that already uses it.
const OCCASIONALLY_DAYS = 14;

export const RHYTHM_PRESETS = ['daily', 'weekly', 'occasionally'];

export function rhythmOf(d) {
  if (!d || d.mode === 'plan') return 'flexible';
  if (d.mode !== 'recurring') return 'custom';
  if (d.freq === 'daily') return 'daily';
  if (d.freq === 'weekly') return 'weekly';
  if (d.freq === 'interval' && d.interval === OCCASIONALLY_DAYS) return 'occasionally';
  return 'custom';
}

export function draftForRhythm(rhythm, d) {
  switch (rhythm) {
    case 'flexible': return { ...d, mode: 'plan' };
    case 'daily': return { ...d, mode: 'recurring', freq: 'daily' };
    case 'weekly': return {
      ...d, mode: 'recurring', freq: 'weekly',
      weekDays: d.weekDays.length ? d.weekDays : [parseKey(todayKey()).getDay()],
    };
    case 'occasionally': return { ...d, mode: 'recurring', freq: 'interval', interval: OCCASIONALLY_DAYS };
    default: return d;
  }
}

// Default draft for a NEW personal prayer: weekly, on the weekday it was
// written. The prayer shows up today and returns every week on this day — a
// bounded rhythm, so quick captures never silently join an ever-growing daily
// list. Grace can widen or narrow it under Organize (the default is visible
// there as "Every <weekday>").
export function defaultNewDraft() {
  return draftForRhythm('weekly', emptyDraft());
}

// The same default as a persisted schedule, for flows that create a prayer
// without the form (onboarding's one-field capture).
export function defaultNewSchedule() {
  return scheduleFromDraft(defaultNewDraft());
}

export function emptyDraft() {
  return {
    mode: 'plan', // 'plan' (no schedule) | 'once' | 'recurring'
    date: todayKey(),
    freq: 'daily',
    weekDays: [],
    chooseDays: false, // editor-only: "Choose days" picked over "Once a week"
    interval: 3,
    dayOfMonth: parseInt(todayKey().slice(8, 10), 10),
    yearlyDate: todayKey(),
    slot: null,
    endKind: 'never', // 'never' | 'date' | 'count' | 'answered'
    endDate: '',
    endCount: 21,
    endExplicit: false, // editor-only: this ending was stored or chosen, not defaulted
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
  // A saved multi-day week opens on "Choose days"; a single day is "Once a week".
  d.chooseDays = (s.weekDays || []).length > 1;
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
  // A stored ending is the user's, never ours to re-default.
  d.endExplicit = true;
  d.startDate = s.startDate;
  d.plan = s.plan;
  return d;
}

// ── Progressive disclosure: the three primary choices, then the rhythm ───────
// The editor asks ONE question first — "when would you like this prayer to
// appear?" — with three answers that map straight onto the draft's mode:
//   plan      → no schedule at all (the legacy weekly category plan)
//   once      → a single date
//   recurring → a rhythm, asked as a SECOND question
// Everything below is a plain mapping onto the same draft the old chip row
// edited, so the persisted schedule shape is unchanged.

// The everyday rhythms, and the uncommon ones kept behind "More options".
export const RECURRENCE_CHOICES = ['daily', 'weekly', 'days'];
export const ADVANCED_CHOICES = ['interval', 'monthly', 'yearly'];

// A new rhythm chosen in the editor ends when the prayer is answered — the
// prayer-friendly default, and the one ending that needs no date or count.
// It is applied ONLY to a rhythm the user picks here and never overwrites an
// ending that was stored or explicitly chosen (see endExplicit); the bounded
// weekly default for new prayers keeps its own open-ended shape.
const NEW_RECURRING_END = 'answered';

const todayWeekday = () => parseKey(todayKey()).getDay();

// Which of the three primary rows a draft matches.
export function modeOf(d) {
  return d?.mode || 'plan';
}

// Which rhythm row a recurring draft matches: the three common ones, or the
// interval/monthly/yearly that live behind "More scheduling options".
// null when the draft doesn't recur at all.
export function recurrenceChoiceOf(d) {
  if (!d || d.mode !== 'recurring') return null;
  if (d.freq === 'weekly') return d.chooseDays || (d.weekDays || []).length > 1 ? 'days' : 'weekly';
  if (d.freq === 'daily') return 'daily';
  return d.freq; // 'interval' | 'monthly' | 'yearly'
}

// Switch the primary choice, keeping every value the other choices hold, so
// moving away and back never silently discards a date or a set of weekdays.
export function draftForMode(mode, d) {
  if (!d || mode === d.mode) return d;
  if (mode === 'plan') return { ...d, mode: 'plan' };
  if (mode === 'once') return { ...d, mode: 'once', date: d.date || todayKey() };
  return { ...d, mode: 'recurring', endKind: d.endExplicit ? d.endKind : NEW_RECURRING_END };
}

// Switch the rhythm. Weekly is the one rhythm that needs a day seeded, or it
// would match none: "once a week" narrows to a single day (today's, unless the
// draft already names one), "choose days" keeps whatever is already selected.
export function draftForRecurrenceChoice(choice, d) {
  switch (choice) {
    case 'daily':
      return { ...d, freq: 'daily', chooseDays: false };
    case 'weekly': {
      const [first] = d.weekDays || [];
      return { ...d, freq: 'weekly', weekDays: [first ?? todayWeekday()], chooseDays: false };
    }
    case 'days':
      return {
        ...d,
        freq: 'weekly',
        weekDays: (d.weekDays || []).length ? d.weekDays : [todayWeekday()],
        chooseDays: true,
      };
    default:
      return { ...d, freq: choice, chooseDays: false };
  }
}

// Choosing an ending marks it explicit, so re-picking a rhythm later can't
// quietly replace it with the default.
export function draftForEnd(endKind, d) {
  return { ...d, endKind, endExplicit: true };
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

// ── Human-readable schedules ─────────────────────────────────────────────────
// TWO renderings of ONE schedule: a terse chip summary ("Every Tue, Fri ·
// morning · until answered") and a full sentence ("This prayer will appear
// every Tuesday and Friday, at any time, until you mark it answered"). Both
// read the same persisted object through the same field-by-field switch below,
// so the preview a user confirms can never describe something else than what
// gets saved — only the wording and the day-name length differ.

const SHORT_DATE = { day: 'numeric', month: 'short' };

// Weekday names straight from the locale, taken off one known week (2024-01-07
// was a Sunday) so index 0 = Sunday exactly like schedule.weekDays.
const WEEK_ANCHOR = ['2024-01-07', '2024-01-08', '2024-01-09', '2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13'];

export function weekdayName(lang, index, style = 'long') {
  return parseKey(WEEK_ANCHOR[index % 7]).toLocaleDateString(lang, { weekday: style });
}

// "Tuesday and Friday" in the reader's language, falling back to a plain list
// where Intl.ListFormat is unavailable. Only for enumerations that really are
// a conjunction — the clauses of the confirmation sentence are joined with the
// locale's own separator (sentJoin), because Intl's 'unit' style still inserts
// an "and" in Arabic, Persian and French.
export function formatList(lang, items) {
  if (items.length <= 1) return items[0] || '';
  try {
    return new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}

const fmtDate = (key, lang) => parseKey(key).toLocaleDateString(lang, SHORT_DATE);

// The rhythm itself. `sentence` picks the flowing wording and full day names.
function rhythmPhrase(s, lang, sentence) {
  if (s.type === 'once') {
    return sentence
      ? t(lang, 'sentOnce', { date: fmtDate(s.date, lang) })
      : `${t(lang, 'schedOnce')} · ${fmtDate(s.date, lang)}`;
  }
  switch (s.freq) {
    case 'daily':
      return t(lang, sentence ? 'sentDaily' : 'schedDaily');
    case 'weekly': {
      const idx = s.weekDays || [];
      const days = sentence
        ? formatList(lang, idx.map((i) => weekdayName(lang, i)))
        : idx.map((i) => t(lang, 'days')[i]).join(', ');
      return t(lang, sentence ? 'sentWeekly' : 'schedWeekly', { days });
    }
    case 'interval':
      return t(lang, sentence ? 'sentInterval' : 'schedInterval', { n: s.interval });
    case 'monthly':
      return t(lang, sentence ? 'sentMonthly' : 'schedMonthly', { d: s.dayOfMonth });
    case 'yearly': {
      const key = `2026-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`;
      const date = parseKey(key).toLocaleDateString(lang, { day: 'numeric', month: 'long' });
      return t(lang, sentence ? 'sentYearly' : 'schedYearly', { date });
    }
    default:
      return '';
  }
}

// The prayer-time slot. The chip summary states it only when set; the sentence
// always says something, because "at any time" is a real answer.
const SENTENCE_SLOTS = { morning: 'sentMorning', midday: 'sentMidday', evening: 'sentEvening' };

function slotPhrase(s, lang, sentence) {
  if (sentence) return t(lang, s.slot ? SENTENCE_SLOTS[s.slot] : 'sentAnytime');
  return s.slot ? t(lang, `slot_${s.slot}`) : '';
}

// The ending. One-time schedules have none, and "no automatic end" is silence.
function endPhrase(s, lang, sentence) {
  if (s.type === 'once') return '';
  const end = s.end || {};
  if (end.kind === 'date' && end.date) return t(lang, sentence ? 'sentUntilDate' : 'schedUntilDate', { date: fmtDate(end.date, lang) });
  if (end.kind === 'count' && end.count) return t(lang, sentence ? 'sentTimes' : 'schedTimes', { n: end.count });
  if (end.kind === 'answered') return t(lang, sentence ? 'sentUntilAnswered' : 'schedUntilAnswered');
  return '';
}

// One-line human summary ("Every Tue, Fri · morning · until answered").
// Also used by PrayerDetail and the day agenda. `showAnytime` spells out the
// unset slot, for the compact row that stands in for the whole editor.
export function scheduleSummary(s, lang, { showAnytime = false } = {}) {
  if (!s) return '';
  const slot = slotPhrase(s, lang, false) || (showAnytime ? t(lang, 'slotAnytime') : '');
  return [rhythmPhrase(s, lang, false), slot, endPhrase(s, lang, false)].filter(Boolean).join(' · ');
}

// What a plan-following (unscheduled) prayer actually does, from planWeekDays:
// null = every day, [] = no day at all, otherwise the planned weekdays.
export function planSummary(planDays, lang) {
  if (planDays === null || planDays === undefined) return t(lang, 'sentDaily');
  if (planDays.length === 0) return t(lang, 'categoryNotScheduled');
  // The sentence wording, not the chip's: this reads as a description of days
  // ("every Tuesday and Friday"), and full day names need the same grammar.
  return t(lang, 'sentWeekly', { days: formatList(lang, planDays.map((i) => weekdayName(lang, i))) });
}

// The confirmation sentence shown beside the final action. Derived from the
// very schedule that will be saved — a null schedule is not "no rhythm", it is
// the user's normal one, so it says which days that actually means.
export function scheduleSentence(s, lang, { planDays } = {}) {
  if (!s) {
    const days = planDays === null || planDays === undefined
      ? t(lang, 'sentDaily')
      : (planDays.length === 0 ? t(lang, 'categoryNotScheduled') : formatList(lang, planDays.map((i) => weekdayName(lang, i))));
    return t(lang, 'schedWillFollowPlan', { days });
  }
  const detail = [rhythmPhrase(s, lang, true), slotPhrase(s, lang, true), endPhrase(s, lang, true)]
    .filter(Boolean)
    .join(t(lang, 'sentJoin'));
  return t(lang, 'schedWillAppear', { detail });
}
