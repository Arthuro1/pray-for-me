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
//     plan?: { id: string, startDate: 'YYYY-MM-DD' } }
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

// For plan-linked schedules: which day of the plan is `key` (1-based), e.g.
// "Day 3 of 21". Based on the base pattern so skips don't shift the readings.
export function planDayNumber(s, key) {
  if (!s || s.type !== 'recurring' || !matchesPattern(s, key)) return null;
  return occurrenceIndex(s, key);
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
  if (s.plan?.id) out.plan = { id: s.plan.id, startDate: s.plan.startDate || out.startDate };
  return out;
}
