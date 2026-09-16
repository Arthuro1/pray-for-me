import { useMemo } from 'react';
import { addDays, nextOccurrence, prevOccurrence } from '../lib/schedule';
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

// Which days of a running plan sit on either side of the one on screen.
//
// Both neighbours are real occurrences of THIS run — a skipped day is stepped
// over, a moved day is followed to where it went, and a day the run does not
// contain is never offered — so paging can only ever reach a day the calendar
// would also have opened.
//
// Day numbers come from the base pattern (see planDayNumber), which is what
// bounds the walk exactly: there is nothing before day 1, and nothing after the
// last day of a run that ends on a count.
//
// Safe to call unconditionally: a prayer with no plan day gets nulls back.
export function usePlanDayPager(schedule, overrides = NO_OVERRIDES, viewedDayKey = null, dayNo = null) {
  // The plan's LENGTH, not the schedule's remaining count — a re-paced run
  // counts only the days it has left, and paging would then stop short of the
  // end (and "Day 16 of 15" would be printed on the way).
  const total = planTotal(schedule) || null;
  return useMemo(() => {
    if (!schedule || !viewedDayKey || !dayNo) return { ...NONE, total };
    return {
      total,
      prevKey: dayNo <= 1
        ? null
        : prevOccurrence(schedule, addDays(viewedDayKey, -1), overrides, HORIZON_DAYS),
      nextKey: total && dayNo >= total
        ? null
        : nextOccurrence(schedule, addDays(viewedDayKey, 1), overrides, HORIZON_DAYS),
    };
  }, [schedule, overrides, viewedDayKey, dayNo, total]);
}
