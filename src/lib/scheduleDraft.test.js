// The bounded default rhythm for NEW personal prayers: weekly on the weekday
// the prayer was written — it shows today, returns next week, and never turns
// a quick capture into a silent daily item. Legacy null schedules stay null.
import { describe, it, expect } from 'vitest';
import { defaultNewDraft, defaultNewSchedule, draftFromSchedule, scheduleFromDraft, rhythmOf, RHYTHM_PRESETS } from './scheduleDraft';
import { occursOn, addDays, parseKey } from './schedule';
import { todayKey } from './prayedLog';

const DAY = todayKey();

describe('defaultNewSchedule — bounded weekly default', () => {
  it('is weekly on the current weekday, open-ended, starting today', () => {
    const s = defaultNewSchedule();
    expect(s).toMatchObject({
      type: 'recurring',
      freq: 'weekly',
      weekDays: [parseKey(DAY).getDay()],
      startDate: DAY,
      end: { kind: 'never' },
    });
  });

  it('occurs today and again in 7 days — but not every day', () => {
    const s = defaultNewSchedule();
    expect(occursOn(s, DAY)).toBe(true);
    expect(occursOn(s, addDays(DAY, 7))).toBe(true);
    expect(occursOn(s, addDays(DAY, 1))).toBe(false);
    expect(occursOn(s, addDays(DAY, 3))).toBe(false);
  });

  it('shows as the Weekly preset in the form', () => {
    expect(rhythmOf(defaultNewDraft())).toBe('weekly');
  });
});

describe('rhythm presets — no unbounded default on offer', () => {
  it('offers Daily / Weekly / Occasionally (Flexible is no longer a preset)', () => {
    expect(RHYTHM_PRESETS).toEqual(['daily', 'weekly', 'occasionally']);
  });

  it('still RECOGNISES a legacy null schedule as the plan-based rhythm', () => {
    // Editing an existing unscheduled prayer must show (and keep) its rhythm.
    const draft = draftFromSchedule(null);
    expect(rhythmOf(draft)).toBe('flexible');
    // Round-tripping without touching it keeps the schedule null — no silent
    // migration of existing users' data.
    expect(scheduleFromDraft(draft)).toBeNull();
  });
});
