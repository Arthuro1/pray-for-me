// How a guided plan run reads in a list row.
//
// A plan run is an ordinary prayer underneath, so before this the Journal and
// Today described it with the generic recurrence machinery ("Every day · 3
// times") under whatever title the run happened to be started with. These
// assertions pin the three things that must instead be true of a plan row: it
// is named by the plan in the READER'S language, it is placed by its day even
// on dates the run does not land on, and it says when it is only resting.
import { describe, it, expect } from 'vitest';
import { planRowContext, planRowSummary } from './planRow';
import { planDayContent } from '../content/prayerPlans';
import { pick } from '../content/teaching';
import { t } from '../i18n';
import { addDays } from './schedule';

const lang = 'fr';
const DAY = '2026-03-10';
// fast3 is a 3-day plan that needs no review sign-off, so it reads the same in
// a test run as in production.
const PLAN = 'fast3';

const run = (overrides = {}) => ({
  id: 'p1',
  title: 'Titre enregistré',
  status: 'active',
  schedule: {
    type: 'recurring',
    freq: 'daily',
    startDate: addDays(DAY, -1),
    end: { kind: 'count', count: 3 },
    plan: { id: PLAN, startDate: addDays(DAY, -1) },
  },
  ...overrides,
});

describe('planRowSummary', () => {
  it('names the run from the plan content, not the title stored at start', () => {
    const summary = planRowSummary(run(), lang, DAY);
    expect(summary.name).toBe(t(lang, 'planFast3Title'));
    expect(summary.name).not.toBe('Titre enregistré');
  });

  it('reports the day reached and that day\'s theme', () => {
    const summary = planRowSummary(run(), lang, DAY);
    expect(summary.dayLabel).toBe(t(lang, 'planDayOf', { n: 2, total: 3 }));
    expect(summary.theme).toBe(pick(planDayContent(PLAN, 2).theme, lang));
    expect(summary.paused).toBe(false);
  });

  it('still reports the day on a date the run does not land on', () => {
    // Every other day: the run exists on the calendar, but not on DAY itself.
    const alternate = run();
    alternate.schedule = { ...alternate.schedule, freq: 'interval', interval: 2 };
    const summary = planRowSummary(alternate, lang, DAY);
    expect(summary.dayLabel).toBe(t(lang, 'planDayOf', { n: 1, total: 3 }));
  });

  it('says a paused run is paused, and holds its place', () => {
    const paused = run();
    paused.schedule = { type: 'none', plan: { id: PLAN, startDate: DAY, dayOffset: 1, total: 3 } };
    const summary = planRowSummary(paused, lang, DAY);
    expect(summary.paused).toBe(true);
    expect(summary.dayLabel).toBe(t(lang, 'planDayOf', { n: 2, total: 3 }));
  });

  it('is null for an ordinary prayer and for plan content that cannot be read', () => {
    expect(planRowSummary({ schedule: { type: 'recurring', freq: 'daily' } }, lang, DAY)).toBeNull();
    expect(planRowSummary({}, lang, DAY)).toBeNull();
    const unknown = run();
    unknown.schedule = { ...unknown.schedule, plan: { id: 'no-such-plan', startDate: DAY } };
    expect(planRowSummary(unknown, lang, DAY)).toBeNull();
  });
});

describe('planRowContext', () => {
  it('joins the plan and its day for the line under a row', () => {
    const summary = planRowSummary(run(), lang, DAY);
    expect(planRowContext(summary)).toBe(`${summary.name} · ${summary.dayLabel}`);
  });

  it('is empty when there is no plan', () => {
    expect(planRowContext(null)).toBe('');
  });
});
