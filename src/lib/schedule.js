// Pure recurrence engine for prayer scheduling. No I/O, no i18n — the UI
// composes human summaries from the parts, and planner.js/stores decide which
// prayers it applies to. All dates are LOCAL day keys ("YYYY-MM-DD"), the same
// convention as prayedLog.todayKey, so a prayer scheduled "tonight" never
// slips a day across timezones. (Times of day are soft "slots", not clocks.)
//
// Schedule shape (stored as plain jsonb on prayers.schedule):
//   { type: 'once', date: 'YYYY-MM-DD', slot?: 'morning'|'midday'|'evening' }
//   { type: 'recurring',
//     freq: 'daily' | 'weekly' | 'interval' | 'monthly' | 'yearly',
//     weekDays?: number[],       // weekly: 0=Sunday … 6=Saturday
//     interval?: number,         // interval: every N days (N >= 2)
//     dayOfMonth?: number,       // monthly: 1–31 (clamped to short months)
//     month?: number, day?: number, // yearly: 1–12 / 1–31
//     startDate: 'YYYY-MM-DD',
//     slot?: string,
//     end?: { kind: 'never'|'date'|'count'|'answered', date?: string, count?: number },
//     plan?: { id: string, version?: number, startDate: 'YYYY-MM-DD',
//              dayOffset?: number, walked?: 'YYYY-MM-DD'[] } }
//
// `plan.startDate` is the day the RUN began and never moves — it is the run's
// identity. `startDate` above is the current anchor of the pattern, and moves
// whenever the rhythm is re-paced (see `plan.dayOffset` on planDayNumber).
// `plan.walked` is where the days before that anchor fell (see walkedPlanDays).
//
// Overrides (prayers.schedule_overrides) are per-occurrence exceptions:
//   { 'YYYY-MM-DD': { skip: true } }              — this day only, skipped
//   { 'YYYY-MM-DD': { movedTo: 'YYYY-MM-DD' } }   — this day only, moved

export const SLOTS = ['morning', 'midday', 'evening'];

const pad = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' → local Date at midnight. Manual parse — new Date('YYYY-MM-DD')
// would parse as UTC and shift the day in western timezones.
export function parseKey(key) {
  const [y, m, d] = key.split('-').map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

// Whole days from a to b (positive when b is after a). DST-safe via rounding.
export function diffDays(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}

function daysInMonth(year, month1) {
  return new Date(year, month1, 0).getDate();
}

// Does the base pattern (ignoring overrides and end conditions) hit this day?
function matchesPattern(s, key) {
  if (s.type === 'once') return s.date === key;
  if (!s.startDate || key < s.startDate) return false;
  const d = parseKey(key);
  switch (s.freq) {
    case 'daily':
      return true;
    case 'weekly':
      return (s.weekDays || []).includes(d.getDay());
    case 'interval': {
      const n = Math.max(2, s.interval || 2);
      return diffDays(s.startDate, key) % n === 0;
    }
    case 'monthly': {
      const dim = daysInMonth(d.getFullYear(), d.getMonth() + 1);
      const target = Math.min(s.dayOfMonth || 1, dim); // 31st → last day of short months
      return d.getDate() === target;
    }
    case 'yearly': {
      if (d.getMonth() + 1 !== (s.month || 1)) return false;
      const dim = daysInMonth(d.getFullYear(), s.month || 1);
      return d.getDate() === Math.min(s.day || 1, dim); // Feb 29 → Feb 28 off-leap
    }
    default:
      return false;
  }
}

// How many base occurrences fall in [startDate, key], for `count` ends.
// Iterates days (plans are short: 7–40 occurrences) with a hard safety cap.
function occurrenceIndex(s, key) {
  let count = 0;
  let cursor = s.startDate;
  let guard = 0;
  while (cursor <= key && guard < 1000) {
    if (matchesPattern(s, cursor)) count++;
    cursor = addDays(cursor, 1);
    guard++;
  }
  return count;
}

// True when the series can no longer produce occurrences after `key` (a date
// end in the past, or a count end already consumed). 'answered' ends are
// enforced by the caller via prayer.status — the engine never sees status.
export function seriesEnded(s, key) {
  if (!s) return false;
  if (s.type === 'once') return s.date < key;
  const end = s.end || { kind: 'never' };
  if (end.kind === 'date') return !!end.date && end.date < key;
  if (end.kind === 'count') return occurrenceIndex(s, addDays(key, -1)) >= (end.count || 1);
  return false;
}

// Does this schedule land on `key`, honouring end conditions and overrides?
export function occursOn(s, key, overrides = {}) {
  if (!s) return false;
  const ov = overrides[key];
  if (ov && (ov.skip || ov.movedTo)) return false; // skipped or moved away
  // Moved here from another base occurrence?
  for (const [from, o] of Object.entries(overrides)) {
    if (o && o.movedTo === key && matchesPattern(s, from) && withinEnd(s, from)) return true;
  }
  return matchesPattern(s, key) && withinEnd(s, key);
}

function withinEnd(s, key) {
  if (s.type === 'once') return true;
  const end = s.end || { kind: 'never' };
  if (end.kind === 'date') return !end.date || key <= end.date;
  if (end.kind === 'count') return occurrenceIndex(s, key) <= (end.count || 1);
  return true; // never / answered
}

// All occurrence day-keys in [fromKey, toKey] (inclusive). Calendar month = 31
// iterations per prayer; cheap enough to run per render.
export function occurrencesInRange(s, fromKey, toKey, overrides = {}) {
  const out = [];
  let cursor = fromKey;
  let guard = 0;
  while (cursor <= toKey && guard < 400) {
    if (occursOn(s, cursor, overrides)) out.push(cursor);
    cursor = addDays(cursor, 1);
    guard++;
  }
  return out;
}

// First occurrence on/after fromKey, or null within the horizon.
export function nextOccurrence(s, fromKey, overrides = {}, horizonDays = 400) {
  let cursor = fromKey;
  for (let i = 0; i < horizonDays; i++) {
    if (occursOn(s, cursor, overrides)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

// The earliest day this series can land on: its start, or an occurrence a
// reader explicitly moved to before it.
function seriesFloor(s, overrides) {
  let floor = s.type === 'once' ? s.date : s.startDate;
  for (const o of Object.values(overrides || {})) {
    if (o?.movedTo && (!floor || o.movedTo < floor)) floor = o.movedTo;
  }
  return floor;
}

// Last occurrence on/before fromKey, or null — the mirror of nextOccurrence,
// walking backwards. It stops at the start of the series rather than at the
// horizon, so asking for the day before the first one costs a comparison
// instead of a 400-day scan.
export function prevOccurrence(s, fromKey, overrides = {}, horizonDays = 400) {
  if (!s) return null;
  const floor = seriesFloor(s, overrides);
  let cursor = fromKey;
  for (let i = 0; i < horizonDays; i++) {
    if (floor && cursor < floor) return null;
    if (occursOn(s, cursor, overrides)) return cursor;
    cursor = addDays(cursor, -1);
  }
  return null;
}

// For plan-linked schedules: which day of the plan is `key` (1-based), e.g.
// "Day 3 of 21". Based on the base pattern so skips don't shift the readings.
//
// `plan.dayOffset` is how many days the run had ALREADY walked when its rhythm
// was last changed. Without it the day number is a pure function of the
// recurrence rule, so re-pacing a run silently rewrote its history (a reader on
// day 16 of a daily plan was sent back to day 3 by switching to weekly). The
// offset pins that progress; `startDate` is re-anchored to the change date at
// the same time, so the pattern counts only the days since. Absent on every run
// that has never been re-paced, where it reads as the 0 it always was.
//
// `overrides` is what lets the CALENDAR and the day number agree. Navigation
// speaks dates (occursOn, nextOccurrence), and a day the reader moved lands on
// a date the base pattern knows nothing about — so numbering it straight
// returned null on every rhythm but daily, and the wrong day on that one. The
// date is resolved back to the base day behind it first; the reading a reader
// moved is still the reading they moved.
//
// A date before the anchor is one of the days the run walked under an earlier
// pace, numbered from where that day fell (walkedPlanDays) — paused runs too.
export function planDayNumber(s, key, overrides = {}) {
  if (!s) return null;
  if (s.type === 'recurring') {
    const base = basePatternKey(s, key, overrides);
    if (matchesPattern(s, base)) return (s.plan?.dayOffset || 0) + occurrenceIndex(s, base);
  }
  const walked = walkedPlanDays(s).indexOf(key);
  return walked >= 0 ? walked + 1 : null;
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

// A recorded `plan.walked` is trusted only when it accounts for exactly the
// days the offset says were walked — anything else would misnumber the run.
function hasWalkedRecord(plan) {
  return Array.isArray(plan?.walked)
    && plan.walked.length === plan.dayOffset
    && plan.walked.every((key) => DAY_KEY.test(key));
}

// WHERE THE DAYS BEFORE THE CURRENT PACE FELL, day 1 first — one date for each
// of the `plan.dayOffset` days the run had already walked when it was last
// re-paced or paused.
//
// Re-anchoring moves the pattern's start to the change date, so those days are
// no longer occurrences of anything, and the reader could not page back to
// them: a run paused on day 4 lost days 1–3 for good. They are recorded on the
// plan at every re-anchor (planTempo.js). A run re-anchored before that record
// existed is read as daily from the day it began — how every run starts
// (guidedPlan.js) — which is exact for a run re-paced once, and always lands
// before the current anchor, never on a day of the current pace.
export function walkedPlanDays(s) {
  const plan = s?.plan;
  const walked = plan?.dayOffset || 0;
  if (!walked) return [];
  if (hasWalkedRecord(plan)) return plan.walked;
  if (!plan.startDate) return [];
  return Array.from({ length: walked }, (_, i) => addDays(plan.startDate, i));
}

// Is `key` a day of this run — one still on its calendar, or one it walked
// before its pace last changed?
export function isPlanDay(s, key, overrides = {}) {
  return occursOn(s, key, overrides) || walkedPlanDays(s).includes(key);
}

// Every date the run has walked before `key`, day 1 first: the days of earlier
// paces, then the current pace's own. What a re-anchor records as `plan.walked`.
export function planDaysBefore(s, key) {
  const days = [...walkedPlanDays(s)];
  if (s?.type !== 'recurring' || !s.startDate) return days;
  for (const { dayKey } of runDays(s)) {
    if (dayKey >= key) break;
    days.push(dayKey);
  }
  return days;
}

// The base-pattern day behind a calendar date: the day a reader MOVED to `key`,
// or `key` itself when nothing was moved there. Mirrors the precedence in
// occursOn, which answers "the run lands here" for a moved-to date before it
// ever looks at the pattern.
export function basePatternKey(s, key, overrides = {}) {
  for (const [from, o] of Object.entries(overrides || {})) {
    if (o?.movedTo === key && matchesPattern(s, from)) return from;
  }
  return key;
}

// How far a plan-linked schedule looks for a neighbouring day of its own run.
// A year covers even a monthly cadence chosen from the full editor, and bounds
// the walk so a finished run costs a scan rather than an open-ended one.
const PLAN_HORIZON_DAYS = 366;

// The first/last day of the run at or after (resp. before) `key`, as
// { dayNo, dayKey } — or null when the run has none that way.
//
// Base pattern only, exactly like planDayNumber: a skipped or moved day never
// renumbers the readings, so these answer "which day of the plan is the reader
// on" rather than "what is on the calendar".
//
// The days of the run's CURRENT pace, first to last, as { dayNo, dayKey } —
// walked FORWARD from the anchor once, counting as it goes, rather than testing
// each candidate day against the end condition, which would re-walk the whole
// series per day and is quadratic on a run opened long after it finished.
function* runDays(s, horizonDays = PLAN_HORIZON_DAYS) {
  const end = s.end || {};
  const max = end.kind === 'count' ? (end.count || 1) : Infinity;
  const until = end.kind === 'date' && end.date ? end.date : null;
  const offset = s.plan?.dayOffset || 0;
  let cursor = s.startDate;
  let count = 0;
  for (let i = 0; i < horizonDays && count < max; i++) {
    if (until && cursor > until) return;
    if (matchesPattern(s, cursor)) {
      count += 1;
      yield { dayNo: offset + count, dayKey: cursor };
    }
    cursor = addDays(cursor, 1);
  }
}

const walksPattern = (s) => s?.type === 'recurring' && !!s.startDate;

export function planDayAtOrAfter(s, key, horizonDays = PLAN_HORIZON_DAYS) {
  if (!walksPattern(s)) return null;
  for (const day of runDays(s, horizonDays)) {
    if (day.dayKey >= key) return day;
  }
  return null;
}

export function planDayAtOrBefore(s, key, horizonDays = PLAN_HORIZON_DAYS) {
  if (!walksPattern(s) || key < s.startDate) return null;
  let last = null;
  for (const day of runDays(s, horizonDays)) {
    if (day.dayKey > key) break;
    last = day;
  }
  return last;
}

// WHERE A RUN IS SITTING on `key` — the day a screen should show when the
// reader opens the prayer, whether or not the run lands on that date:
//
//   { dayNo, dayKey, state: 'today' | 'past' | 'upcoming' | 'paused' }
//
// A run only ever landed on `key` itself before, so every rhythm that isn't
// daily — and every skipped or moved day — left the plan's own page blank. It
// rests on the most recent day it reached, or on the first one still to come
// when it hasn't started, or on the day it was paused holding.
//
// null when the prayer carries no plan, or when the run is finished.
export function restingPlanDay(s, key, overrides = {}) {
  if (!s?.plan?.id) return null;
  // Paused ("no fixed schedule"): no dates at all, holding the next day.
  if (s.type === 'none') return { dayNo: (s.plan.dayOffset || 0) + 1, dayKey: null, state: 'paused' };
  // The calendar has the last word on whether the run lands on `key`: a day
  // moved HERE lands here, and one moved away (or skipped) does not. Without
  // this the base-pattern walk below called a day "today" that the reader had
  // already moved to tomorrow, and dated a day moved to today as last week's.
  const lands = occursOn(s, key, overrides);
  if (lands) {
    const dayNo = planDayNumber(s, key, overrides);
    if (dayNo) return { dayNo, dayKey: key, state: 'today' };
  }
  const past = planDayAtOrBefore(s, key);
  if (past) return { ...past, state: lands && past.dayKey === key ? 'today' : 'past' };
  const ahead = planDayAtOrAfter(s, key);
  return ahead ? { ...ahead, state: 'upcoming' } : null;
}

// ── Rotation ──────────────────────────────────────────────────────────────
// Deterministic round-robin: the category's ordered active prayers are cut
// into ceil(n/perDay) groups; the day index (days since epoch) picks the
// group. Every prayer is covered every `groups` days, with no server state —
// the same day shows the same group on every device, online or off.
export function rotationForDay(orderedIds, perDay, key) {
  const n = orderedIds.length;
  const per = Math.max(1, perDay || 1);
  if (n <= per) return orderedIds;
  const groups = Math.ceil(n / per);
  const serial = Math.floor(parseKey(key).getTime() / 86400000);
  const idx = ((serial % groups) + groups) % groups;
  return orderedIds.slice(idx * per, idx * per + per);
}

// ── ICS / RRULE export ────────────────────────────────────────────────────
// Serialise a schedule to an iCalendar RRULE (RFC 5545) for calendar export.
// Returns null for one-time schedules (they export as a single VEVENT).
const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export function toRRule(s) {
  if (!s || s.type !== 'recurring') return null;
  let rule;
  switch (s.freq) {
    case 'daily': rule = 'FREQ=DAILY'; break;
    case 'weekly': rule = `FREQ=WEEKLY;BYDAY=${(s.weekDays || []).map((d) => BYDAY[d]).join(',')}`; break;
    case 'interval': rule = `FREQ=DAILY;INTERVAL=${Math.max(2, s.interval || 2)}`; break;
    case 'monthly': rule = `FREQ=MONTHLY;BYMONTHDAY=${s.dayOfMonth || 1}`; break;
    case 'yearly': rule = 'FREQ=YEARLY'; break;
    default: return null;
  }
  const end = s.end || {};
  if (end.kind === 'date' && end.date) rule += `;UNTIL=${end.date.replace(/-/g, '')}`;
  if (end.kind === 'count' && end.count) rule += `;COUNT=${end.count}`;
  return rule;
}

// ── Validation / defaults ─────────────────────────────────────────────────
// Normalise a form-built schedule; returns null when it doesn't describe a
// real schedule (so the prayer falls back to the category weekly plan).
export function normalizeSchedule(s, todayKeyStr) {
  if (!s || !s.type) return null;
  if (s.type === 'once') {
    if (!s.date) return null;
    return { type: 'once', date: s.date, ...(s.slot ? { slot: s.slot } : {}) };
  }
  const out = { type: 'recurring', freq: s.freq || 'daily', startDate: s.startDate || todayKeyStr };
  if (out.freq === 'weekly') {
    if (!s.weekDays || s.weekDays.length === 0) return null;
    out.weekDays = [...s.weekDays].sort();
  }
  if (out.freq === 'interval') out.interval = Math.max(2, s.interval || 2);
  if (out.freq === 'monthly') out.dayOfMonth = Math.min(31, Math.max(1, s.dayOfMonth || 1));
  if (out.freq === 'yearly') {
    out.month = Math.min(12, Math.max(1, s.month || 1));
    out.day = Math.min(31, Math.max(1, s.day || 1));
  }
  if (s.slot) out.slot = s.slot;
  const end = s.end || { kind: 'never' };
  if (end.kind === 'date' && end.date) out.end = { kind: 'date', date: end.date };
  else if (end.kind === 'count' && end.count > 0) out.end = { kind: 'count', count: Math.floor(end.count) };
  else if (end.kind === 'answered') out.end = { kind: 'answered' };
  else out.end = { kind: 'never' };
  if (s.plan?.id) out.plan = {
    id: s.plan.id,
    startDate: s.plan.startDate || out.startDate,
    ...(Number.isInteger(s.plan.version) && s.plan.version > 0 ? { version: s.plan.version } : {}),
    // Progress already walked, and the run's full length, carried through every
    // later edit — dropping either here would renumber the run (or lose its
    // ending) the first time its rhythm was touched.
    ...(Number.isInteger(s.plan.dayOffset) && s.plan.dayOffset > 0 ? { dayOffset: s.plan.dayOffset } : {}),
    ...(Number.isInteger(s.plan.total) && s.plan.total > 0 ? { total: s.plan.total } : {}),
    // Where those walked days fell — without it, the reader could not page
    // back to them after an edit that is not a change of rhythm.
    ...(hasWalkedRecord(s.plan) ? { walked: [...s.plan.walked] } : {}),
  };
  return out;
}
