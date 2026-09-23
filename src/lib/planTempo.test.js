import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addDays, isPlanDay, normalizeSchedule, occursOn, planDayNumber, restingPlanDay, walkedPlanDays,
} from './schedule';
import {
  PLAN_PAUSED, paceOf, planTotal, repacePlan, upcomingPlanDay,
} from './planTempo';
import { draftFromSchedule, scheduleFromDraft } from './scheduleDraft';

// The invariant every test below is really checking:
//
//   changing the PACE of a running plan never changes WHICH DAY you are on.
//
// Before plan.dayOffset existed, the day number was recounted from the
// recurrence rule on every render, so a reader on day 16 of a daily plan who
// asked for something gentler was silently sent back to day 3 — and on any date
// the new rhythm missed, the plan's whole card rendered blank.

const START = '2026-09-01';
const TODAY = '2026-09-16'; // a Wednesday, day 16 of a daily run started the 1st
const WED = 3;

// A 30-day plan running daily since the 1st, exactly as startGuidedPlan builds it.
const dailyRun = () => ({
  type: 'recurring',
  freq: 'daily',
  startDate: START,
  end: { kind: 'count', count: 30 },
  plan: { id: 'plan30', startDate: START },
});

describe('the day a run is on', () => {
  it('is day 16 today, the way it always was', () => {
    expect(planDayNumber(dailyRun(), TODAY)).toBe(16);
    expect(upcomingPlanDay(dailyRun(), TODAY)).toBe(16);
  });

  it('survives every pace, on the next day that pace names', () => {
    for (const pace of ['daily', 'someDays', 'alternate']) {
      const next = repacePlan(dailyRun(), pace, { today: TODAY });
      expect(upcomingPlanDay(next, TODAY), pace).toBe(16);
    }
  });

  it('is still 16 on the very day of the change when the pace includes it', () => {
    // 'someDays' seeds from today's weekday, so today stays a day of the run.
    for (const pace of ['daily', 'alternate', 'someDays']) {
      const next = repacePlan(dailyRun(), pace, { today: TODAY });
      expect(planDayNumber(next, TODAY), pace).toBe(16);
    }
  });

  it('carries forward to the next scheduled day when the new pace skips today', () => {
    const next = repacePlan(dailyRun(), 'someDays', { today: TODAY, weekDays: [WED + 1] });
    expect(planDayNumber(next, TODAY)).toBe(null); // today is no longer a day of the run
    expect(planDayNumber(next, '2026-09-17')).toBe(16); // it arrives tomorrow instead
  });

  it('does not drift when the pace is changed again and again', () => {
    let s = dailyRun();
    for (const pace of ['someDays', 'alternate', 'daily', 'someDays', 'daily']) {
      s = repacePlan(s, pace, { today: TODAY });
      expect(upcomingPlanDay(s, TODAY), pace).toBe(16);
    }
    expect(planDayNumber(s, TODAY)).toBe(16);
  });
});

describe('the run still ends exactly once', () => {
  it('keeps the plan length and counts only the days that remain', () => {
    const next = repacePlan(dailyRun(), 'alternate', { today: TODAY });
    expect(planTotal(next)).toBe(30);
    expect(next.end).toEqual({ kind: 'count', count: 15 }); // days 16–30
    expect(next.plan.dayOffset).toBe(15);
  });

  it('reaches day 30 and lands on nothing after it', () => {
    const next = repacePlan(dailyRun(), 'daily', { today: TODAY });
    expect(planDayNumber(next, '2026-09-30')).toBe(30);
    // The ending is enforced where it always was — on the calendar, not in the
    // numbering, which counts the base pattern and knows nothing of ends.
    expect(occursOn(next, '2026-09-30')).toBe(true);
    expect(occursOn(next, '2026-10-01')).toBe(false);
  });

  it('leaves the original start date alone — it is the run’s identity', () => {
    const next = repacePlan(dailyRun(), 'someDays', { today: TODAY });
    expect(next.plan.startDate).toBe(START);
    expect(next.startDate).toBe(TODAY); // the PATTERN re-anchors, the run does not
  });

  it('has nothing to re-pace once the run is finished', () => {
    const finished = { ...dailyRun(), end: { kind: 'count', count: 3 } };
    expect(upcomingPlanDay(finished, TODAY)).toBe(null);
    expect(repacePlan(finished, 'daily', { today: TODAY })).toBe(null);
  });

  it('refuses a prayer that carries no run at all', () => {
    expect(repacePlan({ type: 'recurring', freq: 'daily', startDate: START }, 'daily')).toBe(null);
  });
});

describe('pausing', () => {
  const paused = () => repacePlan(dailyRun(), PLAN_PAUSED, { today: TODAY });

  it('keeps the run, its place and its length', () => {
    const s = paused();
    expect(s.type).toBe('none');
    expect(s.plan.id).toBe('plan30');
    expect(s.plan.dayOffset).toBe(15);
    expect(planTotal(s)).toBe(30);
    expect(paceOf(s)).toBe(PLAN_PAUSED);
  });

  it('still knows which day it is holding, with no date to hold it on', () => {
    expect(restingPlanDay(paused(), TODAY)).toEqual({ dayNo: 16, dayKey: null, state: 'paused' });
  });

  it('resumes on day 16, not day 1', () => {
    const resumed = repacePlan(paused(), 'daily', { today: '2026-10-05' });
    expect(planDayNumber(resumed, '2026-10-05')).toBe(16);
    expect(resumed.end).toEqual({ kind: 'count', count: 15 });
  });
});

// Re-anchoring moves the pattern's start to the day of the change, so the days
// before it stop being occurrences of anything. They used to be lost with it: a
// reader who paused on day 4 and came back could never page back to days 1–3.
// The run now keeps where each of them fell.
describe('the days already walked', () => {
  const daysFrom = (start, n) => Array.from({ length: n }, (_, i) => addDays(start, i));

  it('are recorded, day 1 first, when the pace changes', () => {
    const next = repacePlan(dailyRun(), 'alternate', { today: TODAY });
    expect(next.plan.walked).toEqual(daysFrom(START, 15));
    expect(walkedPlanDays(next)).toEqual(daysFrom(START, 15));
  });

  it('keep their day numbers and stay days of the run, though off its calendar', () => {
    const next = repacePlan(dailyRun(), 'alternate', { today: TODAY });
    expect(planDayNumber(next, START)).toBe(1);
    expect(planDayNumber(next, '2026-09-15')).toBe(15);
    expect(occursOn(next, START)).toBe(false); // nothing is put back on the calendar
    expect(isPlanDay(next, START)).toBe(true);
    expect(isPlanDay(next, addDays(START, -1))).toBe(false);
  });

  it('survive a pause and the resumption after it', () => {
    const paused = repacePlan(dailyRun(), PLAN_PAUSED, { today: TODAY });
    expect(planDayNumber(paused, '2026-09-02')).toBe(2);
    const resumed = repacePlan(paused, 'daily', { today: '2026-10-05' });
    expect(resumed.plan.walked).toEqual(daysFrom(START, 15));
    expect(planDayNumber(resumed, '2026-09-02')).toBe(2);
  });

  it('stay exact through a second change of pace, where a guess would drift', () => {
    const weekly = repacePlan(dailyRun(), 'someDays', { today: TODAY, weekDays: [1, 3, 5] });
    const daily = repacePlan(weekly, 'daily', { today: '2026-09-30' });
    // Days 16–21 fell on the Mondays, Wednesdays and Fridays in between.
    const weeklyDays = ['2026-09-16', '2026-09-18', '2026-09-21', '2026-09-23', '2026-09-25', '2026-09-28'];
    expect(daily.plan.walked).toEqual([...daysFrom(START, 15), ...weeklyDays]);
    expect(planDayNumber(daily, '2026-09-18')).toBe(17);
    expect(planDayNumber(daily, '2026-09-17')).toBe(null);
    expect(planDayNumber(daily, '2026-09-30')).toBe(22);
  });

  it('are read as daily from the start on a run re-paced before they were recorded', () => {
    const next = repacePlan(dailyRun(), PLAN_PAUSED, { today: TODAY });
    const { walked, ...legacyPlan } = next.plan;
    expect(walked).toHaveLength(15);
    const legacy = { ...next, plan: legacyPlan };
    expect(walkedPlanDays(legacy)).toEqual(daysFrom(START, 15));
    expect(planDayNumber(legacy, '2026-09-03')).toBe(3);
  });

  it('are ignored when the record does not match the days walked', () => {
    const next = repacePlan(dailyRun(), 'daily', { today: TODAY });
    const short = { ...next, plan: { ...next.plan, walked: ['2026-09-01'] } };
    expect(walkedPlanDays(short)).toEqual(daysFrom(START, 15)); // falls back, never misnumbers
  });

  it('are carried through an edit that is not a change of rhythm', () => {
    const next = repacePlan(dailyRun(), 'daily', { today: TODAY });
    const edited = normalizeSchedule({ ...next, slot: 'evening' }, TODAY);
    expect(edited.plan.walked).toEqual(next.plan.walked);
  });

  it('are nothing on a run that was never re-paced', () => {
    expect(walkedPlanDays(dailyRun())).toEqual([]);
    expect(dailyRun().plan.walked).toBeUndefined();
  });
});

describe('the plan card always has a day to show', () => {
  it('rests on the last day reached when today is not one of the run’s days', () => {
    const weekly = repacePlan(dailyRun(), 'someDays', { today: TODAY, weekDays: [WED] });
    // The Friday after: not a Wednesday, so not a day of the run.
    expect(planDayNumber(weekly, '2026-09-18')).toBe(null);
    expect(restingPlanDay(weekly, '2026-09-18')).toEqual({ dayNo: 16, dayKey: TODAY, state: 'past' });
  });

  it('rests on today when today IS one of the run’s days', () => {
    expect(restingPlanDay(dailyRun(), TODAY)).toEqual({ dayNo: 16, dayKey: TODAY, state: 'today' });
  });

  it('rests on the first day of a run that has not begun', () => {
    const later = { ...dailyRun(), startDate: '2026-10-01', plan: { id: 'plan30', startDate: '2026-10-01' } };
    expect(restingPlanDay(later, TODAY)).toEqual({ dayNo: 1, dayKey: '2026-10-01', state: 'upcoming' });
  });

  it('rests on the LAST day of a finished run, so the closing day and its completion card read together', () => {
    const finished = { ...dailyRun(), end: { kind: 'count', count: 3 } };
    expect(restingPlanDay(finished, TODAY)).toEqual({ dayNo: 3, dayKey: '2026-09-03', state: 'past' });
    // …but there is no next day left to protect, so no pace is offered.
    expect(upcomingPlanDay(finished, TODAY)).toBe(null);
  });

  it('has nothing to rest on for a prayer carrying no plan', () => {
    expect(restingPlanDay({ type: 'recurring', freq: 'daily', startDate: START }, TODAY)).toBe(null);
  });
});

// The full scheduler under the ⋯ menu offers rhythms the pace control does not.
// It must re-anchor through the same rule — and must not re-anchor when the
// reader only changed something that is not a rhythm. It takes no `today`: it
// re-anchors from the real clock, so the clock is pinned to TODAY (local noon,
// clear of any midnight/time-zone edge) or day 16 would drift with the calendar.
describe('the full scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00`)); // no offset: local time
  });
  afterEach(() => vi.useRealTimers());

  const edit = (schedule, changes) => scheduleFromDraft({ ...draftFromSchedule(schedule), ...changes }, schedule);

  it('re-anchors a rhythm it changed, keeping the reader on day 16', () => {
    const next = edit(dailyRun(), { freq: 'monthly', dayOfMonth: 20 });
    expect(next.plan.dayOffset).toBe(15);
    expect(planDayNumber(next, '2026-09-20')).toBe(16);
    expect(planTotal(next)).toBe(30);
  });

  it('leaves the run exactly where it is when only the preferred time changed', () => {
    const next = edit(dailyRun(), { slot: 'morning' });
    expect(next.slot).toBe('morning');
    expect(next.startDate).toBe(START); // untouched: a slot is not a rhythm
    expect(next.plan.dayOffset).toBeUndefined();
    expect(planDayNumber(next, TODAY)).toBe(16);
  });

  it('pauses rather than deletes when "no fixed schedule" is chosen on a plan', () => {
    const next = edit(dailyRun(), { mode: 'plan' });
    expect(next.type).toBe('none');
    expect(next.plan.id).toBe('plan30'); // the run used to be dropped outright here
    expect(restingPlanDay(next, TODAY).dayNo).toBe(16);
  });

  it('still means "no fixed schedule" for a prayer carrying no plan', () => {
    const plain = { type: 'recurring', freq: 'daily', startDate: START, end: { kind: 'never' } };
    expect(edit(plain, { mode: 'plan' })).toEqual({ type: 'none' });
  });

  it('resumes a paused run through the rhythm rows, on the day it was holding', () => {
    const next = edit(repacePlan(dailyRun(), PLAN_PAUSED, { today: TODAY }), { mode: 'recurring', freq: 'daily' });
    expect(next.type).toBe('recurring');
    expect(next.plan.dayOffset).toBe(15);
    expect(planTotal(next)).toBe(30);
  });
});
