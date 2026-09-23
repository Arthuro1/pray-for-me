import { useMemo } from 'react';
import { addDays, nextOccurrence, prevOccurrence, walkedPlanDays } from '../lib/schedule';
import { planTotal } from '../lib/planTempo';

// How far the pager looks for the neighbouring day. A guided plan runs daily,
// so a neighbour is almost always one day away; the allowance is for a run
// whose schedule was edited to weekly or every-other-day, and for stretches of
// skipped days in between. Bounded on purpose: an unbounded scan past the end
// of a run re-counts the whole series for every day it rejects.
const HORIZON_DAYS = 62;

// Nothing to page through when the prayer is not on a plan day.
const NONE = { prevKey: null, nextKey: null, total: null };
const NO_OVERRIDES = {};

// Is the day on screen one the run walked before its current pace began?
const isWalkedDay = (walked, dayKey, dayNo) => !!dayKey && walked[dayNo - 1] === dayKey;

// The day before: the walked day before a walked one; otherwise the previous
// day of the current pace, and past its first day, the last day walked before
// it. A paused run has no date on screen, so it steps straight to that one.
function dayBefore(schedule, overrides, dayKey, dayNo, walked) {
  if (isWalkedDay(walked, dayKey, dayNo)) return walked[dayNo - 2] || null;
  const inPace = dayKey && prevOccurrence(schedule, addDays(dayKey, -1), overrides, HORIZON_DAYS);
  return inPace || walked[walked.length - 1] || null;
}

// The day after — the mirror of dayBefore. From the last day walked it crosses
// to the current pace's first day, looked for from the pace's anchor: scanning
// the gap day by day, a run paused for months would outrun the horizon.
function dayAfter(schedule, overrides, dayKey, dayNo, walked) {
  if (!dayKey) return null; // paused: no dated day ahead of the one it holds
  if (!isWalkedDay(walked, dayKey, dayNo)) {
    return nextOccurrence(schedule, addDays(dayKey, 1), overrides, HORIZON_DAYS);
  }
  if (dayNo < walked.length) return walked[dayNo];
  if (schedule.type !== 'recurring') return null;
  const from = schedule.startDate > dayKey ? schedule.startDate : addDays(dayKey, 1);
  return nextOccurrence(schedule, from, overrides, HORIZON_DAYS);
}

// Which days of a running plan sit on either side of the one on screen.
//
// Both neighbours are real days of THIS run — a skipped day is stepped over, a
// moved day is followed to where it went, and a day the run does not contain
// is never offered — so paging can only ever reach a day the page would also
// open. That includes the days walked before the run was last re-paced or
// paused (walkedPlanDays): they are no longer on its calendar, but they are
// still days 1, 2, 3 of the plan.
//
// Day numbers come from the base pattern (see planDayNumber), which is what
// bounds the walk exactly: there is nothing before day 1, and nothing after the
// last day of a run that ends on a count.
//
// Safe to call unconditionally: a prayer with no plan day gets nulls back.
export function usePlanDayPager(schedule, overrides = NO_OVERRIDES, viewedDayKey = null, dayNo = null, planLength = null) {
  // The plan's LENGTH, not the schedule's remaining count — a re-paced run
  // counts only the days it has left, and paging would then stop short of the
  // end (and "Day 16 of 15" would be printed on the way).
  //
  // The caller passes it when it knows the plan's content, which is the only
  // source that is always right: a run whose ending was never a count has no
  // length in its schedule at all, and paging on past the last day of the plan
  // lands on a day with no content — the card goes blank.
  const total = planLength || planTotal(schedule) || null;
  return useMemo(() => {
    if (!schedule || !dayNo) return { ...NONE, total };
    const walked = walkedPlanDays(schedule);
    return {
      total,
      prevKey: dayNo <= 1 ? null : dayBefore(schedule, overrides, viewedDayKey, dayNo, walked),
      nextKey: total && dayNo >= total ? null : dayAfter(schedule, overrides, viewedDayKey, dayNo, walked),
    };
  }, [schedule, overrides, viewedDayKey, dayNo, total]);
}
