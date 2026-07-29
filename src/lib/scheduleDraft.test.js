// The bounded default rhythm for NEW personal prayers: weekly on the weekday
// the prayer was written — it shows today, returns next week, and never turns
// a quick capture into a silent daily item. Legacy null schedules stay null.
import { describe, it, expect } from 'vitest';
import {
  defaultNewDraft, defaultNewSchedule, draftFromSchedule, scheduleFromDraft, rhythmOf, RHYTHM_PRESETS,
  draftForMode, draftForRecurrenceChoice, draftForEnd, recurrenceChoiceOf, emptyDraft,
  scheduleSummary, scheduleSentence, planSummary,
} from './scheduleDraft';
import { planWeekDays } from './planner';
import { occursOn, addDays, parseKey } from './schedule';
import { todayKey } from './prayedLog';
import { t } from '../i18n';

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

  it('treats a legacy null and an explicit no-fixed schedule the same', () => {
    // Editing an existing unscheduled prayer opens it on the "no fixed" row…
    expect(rhythmOf(draftFromSchedule(null))).toBe('flexible');
    expect(rhythmOf(draftFromSchedule({ type: 'none' }))).toBe('flexible');
    // …and saving it now writes an EXPLICIT { type: 'none' }, not null: categories
    // are labels, so there is no weekly plan left to fall back to.
    expect(scheduleFromDraft(draftFromSchedule(null))).toEqual({ type: 'none' });
  });
});

// ── Progressive disclosure: the choices the editor offers ────────────────────
const TODAY_WEEKDAY = parseKey(DAY).getDay();

describe('the three primary choices', () => {
  it('map onto the draft modes, keeping the other choices\' values', () => {
    const once = draftForMode('once', { ...emptyDraft(), weekDays: [1, 3] });
    expect(once.mode).toBe('once');
    expect(once.date).toBe(DAY);
    // Switching away and back keeps the weekdays a user already picked.
    const back = draftForMode('recurring', once);
    expect(back.weekDays).toEqual([1, 3]);
    expect(draftForMode('plan', back)).toMatchObject({ mode: 'plan', weekDays: [1, 3] });
  });

  it('give a NEWLY chosen rhythm the prayer-friendly ending', () => {
    expect(draftForMode('recurring', emptyDraft()).endKind).toBe('answered');
  });

  it('never re-default an ending that was stored or explicitly chosen', () => {
    const stored = draftFromSchedule({ type: 'recurring', freq: 'daily', startDate: DAY, end: { kind: 'never' } });
    expect(draftForMode('once', stored).endKind).toBe('never');
    expect(draftForMode('recurring', draftForMode('once', stored)).endKind).toBe('never');
    // An ending the user picks by hand is just as protected.
    const chosen = draftForEnd('count', emptyDraft());
    expect(draftForMode('recurring', chosen).endKind).toBe('count');
  });
});

describe('recurrence choices', () => {
  const recurring = () => draftForMode('recurring', emptyDraft());

  it('"once a week" seeds today\'s weekday, "choose days" keeps the selection', () => {
    const weekly = draftForRecurrenceChoice('weekly', recurring());
    expect(weekly.weekDays).toEqual([TODAY_WEEKDAY]);
    expect(recurrenceChoiceOf(weekly)).toBe('weekly');

    const days = draftForRecurrenceChoice('days', { ...recurring(), weekDays: [1, 3, 5] });
    expect(days.weekDays).toEqual([1, 3, 5]);
    expect(recurrenceChoiceOf(days)).toBe('days');
  });

  it('"once a week" narrows to the day the draft already names', () => {
    const weekly = draftForRecurrenceChoice('weekly', { ...recurring(), weekDays: [4, 6] });
    expect(weekly.weekDays).toEqual([4]);
  });

  it('reads a saved schedule back onto the right row', () => {
    const of = (s) => recurrenceChoiceOf(draftFromSchedule(s));
    expect(of({ type: 'recurring', freq: 'daily', startDate: DAY })).toBe('daily');
    expect(of({ type: 'recurring', freq: 'weekly', weekDays: [2], startDate: DAY })).toBe('weekly');
    expect(of({ type: 'recurring', freq: 'weekly', weekDays: [2, 5], startDate: DAY })).toBe('days');
    expect(of({ type: 'recurring', freq: 'interval', interval: 3, startDate: DAY })).toBe('interval');
    expect(of({ type: 'recurring', freq: 'monthly', dayOfMonth: 4, startDate: DAY })).toBe('monthly');
    expect(of({ type: 'recurring', freq: 'yearly', month: 3, day: 4, startDate: DAY })).toBe('yearly');
    expect(of(null)).toBeNull();
  });

  it('round-trips every schedule type without data loss', () => {
    const cases = [
      { type: 'once', date: addDays(DAY, 4) },
      { type: 'recurring', freq: 'daily', startDate: DAY, end: { kind: 'never' } },
      { type: 'recurring', freq: 'weekly', weekDays: [0, 2, 6], startDate: DAY, slot: 'morning', end: { kind: 'answered' } },
      { type: 'recurring', freq: 'interval', interval: 9, startDate: DAY, end: { kind: 'count', count: 12 } },
      { type: 'recurring', freq: 'monthly', dayOfMonth: 28, startDate: DAY, end: { kind: 'date', date: addDays(DAY, 90) } },
      { type: 'recurring', freq: 'yearly', month: 12, day: 25, startDate: DAY, end: { kind: 'never' } },
    ];
    for (const s of cases) expect(scheduleFromDraft(draftFromSchedule(s), s)).toEqual(s);
  });
});

// ── The natural-language preview ─────────────────────────────────────────────
// It must be READ OFF the schedule that gets saved, never kept in parallel.
describe('schedule descriptions', () => {
  const lang = 'fr';

  it('describes a plan-following prayer by the days it really lands on', () => {
    expect(scheduleSentence(null, lang, { planDays: [1, 3] })).toContain('lundi');
    expect(scheduleSentence(null, lang, { planDays: [1, 3] })).toContain('mercredi');
    // No categories → the legacy fallback really is every day; say so.
    expect(scheduleSentence(null, lang, { planDays: null })).toContain(t(lang, 'sentDaily'));
  });

  it('names the rhythm, the time and the ending of a recurring prayer', () => {
    const s = { type: 'recurring', freq: 'weekly', weekDays: [2, 5], startDate: DAY, end: { kind: 'answered' } };
    const sentence = scheduleSentence(s, lang);
    expect(sentence).toContain('mardi');
    expect(sentence).toContain('vendredi');
    expect(sentence).toContain(t(lang, 'sentAnytime'));
    expect(sentence).toContain(t(lang, 'sentUntilAnswered'));
  });

  it('mentions no ending for a one-time prayer, and no "anytime" in the chip summary', () => {
    const s = { type: 'once', date: DAY };
    expect(scheduleSentence(s, lang)).not.toContain(t(lang, 'sentUntilAnswered'));
    expect(scheduleSummary(s, lang)).not.toContain(t(lang, 'slotAnytime'));
    // The compact row that stands in for the whole editor does spell it out.
    expect(scheduleSummary(s, lang, { showAnytime: true })).toContain(t(lang, 'slotAnytime'));
  });

  it('keeps the chip summary exactly as other screens already render it', () => {
    const s = { type: 'recurring', freq: 'interval', interval: 4, startDate: DAY, slot: 'morning', end: { kind: 'count', count: 7 } };
    expect(scheduleSummary(s, lang)).toBe(
      [t(lang, 'schedInterval', { n: 4 }), t(lang, 'slot_morning'), t(lang, 'schedTimes', { n: 7 })].join(' · ')
    );
  });

  it('states a plan summary for every planner outcome', () => {
    expect(planSummary(null, lang)).toBe(t(lang, 'sentDaily'));
    expect(planSummary([], lang)).toBe(t(lang, 'categoryNotScheduled'));
    expect(planSummary([1], lang)).toContain('lundi');
  });
});

describe('planWeekDays — what "my normal rhythm" resolves to', () => {
  const cats = [
    { id: 'c1', week_days: [1, 3] },
    { id: 'c2', week_days: [3, 5] },
  ];

  it('is every day for an uncategorized prayer (the legacy fallback)', () => {
    expect(planWeekDays(cats, [])).toBeNull();
  });

  it('unions the planned days of the prayer\'s categories', () => {
    expect(planWeekDays(cats, ['c1', 'c2'])).toEqual([1, 3, 5]);
  });

  it('is empty when the categories are not on the weekly plan at all', () => {
    expect(planWeekDays([{ id: 'c3', week_days: [] }], ['c3'])).toEqual([]);
  });

  it('lets a per-prayer weekday override win, exactly like the planner', () => {
    expect(planWeekDays(cats, ['c1'], [6])).toEqual([6]);
  });
});
