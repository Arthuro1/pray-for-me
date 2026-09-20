// @vitest-environment jsdom
//
// A guided plan run must not read like an ordinary recurring prayer. The
// Journal row says which plan and how far in ("Day 2 of 3") where it used to
// recite the recurrence rule, and Today leads with the day's THEME, because the
// plan's name is the same on day 3 as on day 1 and says nothing about what
// there is to pray. Both are named from the plan content, so a run started in
// one language does not keep that language for a reader who has moved on.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PrayerListItem from '../PrayerListItem';
import { planDayContent } from '../../content/prayerPlans';
import { pick } from '../../content/teaching';
import { t } from '../../i18n';
import { todayKey } from '../../lib/prayedLog';
import { addDays } from '../../lib/schedule';

const lang = 'fr';
const PLAN = 'fast3';
const START = addDays(todayKey(), -1); // today is day 2 of 3
afterEach(cleanup);

const planRun = (schedule) => ({
  id: 'p1',
  title: 'Titre enregistré',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  prayer_categories: [],
  schedule: schedule || {
    type: 'recurring',
    freq: 'daily',
    startDate: START,
    end: { kind: 'count', count: 3 },
    plan: { id: PLAN, startDate: START },
  },
});

const renderItem = (variant, prayer = planRun()) => render(
  <PrayerListItem
    prayer={prayer}
    categories={[]}
    lang={lang}
    tr={(s) => s}
    onClick={() => {}}
    variant={variant}
  />
);

const dayLabel = t(lang, 'planDayOf', { n: 2, total: 3 });
const planName = t(lang, 'planFast3Title');
const theme = pick(planDayContent(PLAN, 2).theme, lang);

describe('PrayerListItem — a plan run in the Journal', () => {
  it('reads "Day 2 of 3" instead of the recurrence rule', () => {
    renderItem('constellation');
    expect(screen.getByText(dayLabel)).toBeTruthy();
    expect(screen.queryByText(t(lang, 'schedDaily'))).toBeNull();
  });

  it('is titled by the plan, not by the title stored when it started', () => {
    renderItem('constellation');
    const row = screen.getByRole('button');
    expect(row.querySelector('.constellation-journal-row__title')?.textContent).toBe(planName);
    expect(screen.queryByText('Titre enregistré')).toBeNull();
  });

  it('says so when the run is paused', () => {
    const paused = planRun({ type: 'none', plan: { id: PLAN, startDate: START, dayOffset: 1, total: 3 } });
    renderItem('constellation', paused);
    expect(screen.getByText(`${dayLabel} · ${t(lang, 'planPacePausedNote')}`)).toBeTruthy();
  });

  it('leaves an ordinary prayer on its schedule summary', () => {
    const ordinary = planRun({ type: 'recurring', freq: 'daily', startDate: START, end: { kind: 'never' } });
    ordinary.title = 'Prière ordinaire';
    renderItem('constellation', ordinary);
    expect(screen.getByText('Prière ordinaire')).toBeTruthy();
    expect(screen.queryByText(dayLabel)).toBeNull();
  });
});

describe('PrayerListItem — a plan run on Today', () => {
  it('leads with the day\'s theme and names the plan beneath it', () => {
    renderItem('journal');
    expect(screen.getByText(theme)).toBeTruthy();
    expect(screen.getByText(`${planName} · ${dayLabel}`)).toBeTruthy();
  });

  it('falls back to the plan name when the day has no content', () => {
    // Day 9 of a 3-day plan: walked past its last authored day.
    const overrun = planRun({
      type: 'recurring', freq: 'daily', startDate: addDays(todayKey(), -8),
      end: { kind: 'count', count: 12 },
      plan: { id: PLAN, startDate: addDays(todayKey(), -8) },
    });
    renderItem('journal', overrun);
    expect(screen.getByText(planName)).toBeTruthy();
  });
});
