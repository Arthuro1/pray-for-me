// How fast a guided plan moves — and the ONE rule that lets that change
// mid-run without rewriting where the reader has got to.
//
// A plan's day number is derived from its recurrence pattern (see
// planDayNumber): day N is the Nth occurrence since the pattern's anchor. That
// makes pace and progress the same variable, so editing the rhythm of a running
// plan used to renumber it — a reader on day 16 of a daily plan who asked for
// something gentler was silently sent back to day 3, and on any date the new
// pattern missed, the plan's whole page rendered blank.
//
// Re-pacing therefore never edits the pattern in place. It RE-ANCHORS:
//
//   plan.dayOffset ← the days already walked     (progress, pinned)
//   startDate      ← today                       (the new pattern starts here)
//   end.count      ← the days that remain        (so the run still ends once)
//
// planDayNumber adds the offset back, so the day on screen is the day on screen
// whatever the pace. The rule that makes it safe: the day the run would show
// NEXT is the day it shows next afterwards — nothing is consumed, nothing is
// repeated. Everything here is pure and additive; `schedule` is jsonb, so no
// migration and no server change (the reminder function reads occursOn only).
import { parseKey, planDayAtOrAfter } from './schedule';
import { todayKey } from './prayedLog';

// The three paces offered on the plan's own card, in the vocabulary the rest of
// the app already uses. Anything rarer (monthly, every N days, a preferred
// time) stays in the full scheduler under the ⋯ menu, which re-anchors through
// exactly the same helper.
export const PLAN_PACES = ['daily', 'someDays', 'alternate'];

// Not a pace but the fourth answer: off the calendar, holding its place.
export const PLAN_PAUSED = 'paused';

// The i18n key naming each pace, so the control that sets it and the quiet row
// that reports it can never describe the same schedule differently.
export const PACE_LABEL_KEYS = {
  daily: 'planPaceDaily',
  someDays: 'planPaceSomeDays',
  alternate: 'planPaceAlternate',
  [PLAN_PAUSED]: 'planPacePause',
  custom: 'planPaceCustom',
};

// A fresh "a few days a week" spreads across the week from the day it was
// chosen (e.g. Mon/Wed/Fri) rather than landing on one weekday — the reader can
// then move the days themselves.
const WEEK_SPREAD = [0, 2, 4];

const sortedDays = (days) => [...new Set(days)].sort((a, b) => a - b);

// Which pace a stored schedule reads as: one of PLAN_PACES, PLAN_PAUSED, or
// 'custom' for a rhythm only the full scheduler can express.
export function paceOf(schedule) {
  if (!schedule?.plan?.id) return null;
  if (schedule.type === 'none') return PLAN_PAUSED;
  if (schedule.type !== 'recurring') return 'custom';
  if (schedule.freq === 'daily') return 'daily';
  if (schedule.freq === 'weekly' && (schedule.weekDays || []).length) return 'someDays';
  if (schedule.freq === 'interval' && schedule.interval === 2) return 'alternate';
  return 'custom';
}

// How many days the whole run has. Stored on the plan from the first re-pace
// (`plan.total`) because a paused run has no count left to read it from;
// before that it is exactly what it always was — the days walked plus the days
// still to come.
export function planTotal(schedule) {
  if (!schedule?.plan?.id) return 0;
  if (schedule.plan.total > 0) return schedule.plan.total;
  const end = schedule.end || {};
  if (schedule.type !== 'recurring' || end.kind !== 'count' || !(end.count > 0)) return 0;
  return (schedule.plan.dayOffset || 0) + end.count;
}

// The day this run will show NEXT, on or after `key` — the one fact re-anchoring
// turns on. null when the run can produce no more days (it is finished), which
// is the caller's signal that there is no pace left to change.
export function upcomingPlanDay(schedule, key) {
  if (!schedule?.plan?.id) return null;
  if (schedule.type === 'none') return (schedule.plan.dayOffset || 0) + 1;
  return planDayAtOrAfter(schedule, key)?.dayNo || null;
}

// Keep the days already chosen; otherwise spread a few across the week from the
// anchor, so the day on screen stays on screen and the rest follow it.
function seedWeekDays(schedule, requested, anchorKey) {
  if (requested?.length) return sortedDays(requested);
  if (schedule?.freq === 'weekly' && schedule.weekDays?.length) return sortedDays(schedule.weekDays);
  const start = parseKey(anchorKey).getDay();
  return sortedDays(WEEK_SPREAD.map((n) => (start + n) % 7));
}

// The plan record carried into the re-anchored schedule: the run's identity and
// original start (never moved), plus the progress and length that the new
// pattern can no longer describe on its own.
function planRecord(plan, { fallbackStart, dayOffset, total }) {
  return {
    id: plan.id,
    startDate: plan.startDate || fallbackStart,
    ...(Number.isInteger(plan.version) && plan.version > 0 ? { version: plan.version } : {}),
    ...(dayOffset > 0 ? { dayOffset } : {}),
    ...(total > 0 ? { total } : {}),
  };
}

// Re-pace a running plan. Returns the schedule to persist, or null when the
// prayer carries no run or the run is already finished.
//
//   pace: 'daily' | 'someDays' | 'alternate' | PLAN_PAUSED
//   weekDays: which days 'someDays' should land on (seeded when absent)
//   total: the plan's length from its content, when the caller knows it
export function repacePlan(schedule, pace, { today = todayKey(), total = null, weekDays = null } = {}) {
  const plan = schedule?.plan;
  if (!plan?.id) return null;
  const upcoming = upcomingPlanDay(schedule, today);
  if (!upcoming) return null;
  const dayOffset = upcoming - 1;
  const runTotal = total > 0 ? total : planTotal(schedule);
  const fallbackStart = schedule.startDate || today;
  const record = planRecord(plan, { fallbackStart, dayOffset, total: runTotal });

  if (pace === PLAN_PAUSED) return { type: 'none', plan: record };
  if (!PLAN_PACES.includes(pace)) return null;

  // A run that has not begun keeps its future start; one already under way
  // begins its new rhythm today, so the day it owed arrives on the next day the
  // new rhythm names.
  const anchor = schedule.type === 'recurring' && schedule.startDate > today ? schedule.startDate : today;
  const remaining = runTotal > dayOffset ? runTotal - dayOffset : 0;
  const base = {
    type: 'recurring',
    startDate: anchor,
    ...(schedule.slot ? { slot: schedule.slot } : {}),
    end: remaining > 0 ? { kind: 'count', count: remaining } : (schedule.end || { kind: 'never' }),
    plan: record,
  };
  if (pace === 'daily') return { ...base, freq: 'daily' };
  if (pace === 'alternate') return { ...base, freq: 'interval', interval: 2 };
  return { ...base, freq: 'weekly', weekDays: seedWeekDays(schedule, weekDays, anchor) };
}

// Do two schedules repeat on the same days? Compares the PATTERN only — a
// preferred time or a different ending is not a change of rhythm and must not
// re-anchor a run (which would otherwise consume a day on every save).
function samePattern(a, b) {
  if (a?.type !== 'recurring' || b?.type !== 'recurring' || a.freq !== b.freq) return false;
  switch (a.freq) {
    case 'weekly': return String(sortedDays(a.weekDays || [])) === String(sortedDays(b.weekDays || []));
    case 'interval': return (a.interval || 2) === (b.interval || 2);
    case 'monthly': return (a.dayOfMonth || 1) === (b.dayOfMonth || 1);
    case 'yearly': return (a.month || 1) === (b.month || 1) && (a.day || 1) === (b.day || 1);
    default: return true; // daily
  }
}

// The same re-anchoring, applied to a schedule the FULL scheduler just built.
// Every rhythm it offers stays available to a plan — a monthly plan day is a
// strange but legitimate ask — and none of them may renumber the run.
//
// `next` is the freshly normalized schedule, `existing` the one being replaced.
// Returned unchanged when there is no run, or when the rhythm did not actually
// move.
export function reanchorPlanSchedule(next, existing, today = todayKey()) {
  if (!existing?.plan?.id || next?.type !== 'recurring') return next;
  if (samePattern(next, existing)) return next;
  const upcoming = upcomingPlanDay(existing, today);
  if (!upcoming) return next;
  const dayOffset = upcoming - 1;
  const runTotal = planTotal(existing);
  const remaining = runTotal > dayOffset ? runTotal - dayOffset : 0;
  return {
    ...next,
    startDate: existing.startDate > today ? existing.startDate : today,
    ...(remaining > 0 ? { end: { kind: 'count', count: remaining } } : {}),
    plan: planRecord(existing.plan, {
      fallbackStart: existing.startDate || today, dayOffset, total: runTotal,
    }),
  };
}
