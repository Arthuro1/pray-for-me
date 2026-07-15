// @vitest-environment jsdom
//
// Human-first scheduling: the top row names the MODE (follow the plan / pray once
// / pray regularly), and the rhythm is a second question only recurring prayers
// are asked. These tests drive the real chip clicks through a small stateful
// harness and assert the SCHEDULE they produce (the persisted contract), plus the
// presetOf() highlight mapping.
//
// "Remind me to follow up" is deliberately NOT a schedule preset here — it is a
// separate per-prayer reminder (see followUpStore.test.js), so a one-time date a
// few days out is just a custom one-time schedule, never a recurrence.
import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ScheduleEditor from '../ScheduleEditor';
import { emptyDraft, scheduleFromDraft, presetOf } from '../../lib/scheduleDraft';
import { t } from '../../i18n';
import { todayKey } from '../../lib/prayedLog';
import { addDays } from '../../lib/schedule';

const lang = 'fr';
afterEach(cleanup);

function Harness() {
  const [draft, setDraft] = useState(emptyDraft());
  return (
    <>
      <ScheduleEditor draft={draft} onChange={setDraft} lang={lang} />
      <span data-testid="out">{JSON.stringify(scheduleFromDraft(draft))}</span>
    </>
  );
}

const currentSchedule = () => JSON.parse(screen.getByTestId('out').textContent || 'null');

describe('ScheduleEditor presets', () => {
  it('defaults to "follows the weekly plan" (no schedule)', () => {
    render(<Harness />);
    expect(currentSchedule()).toBeNull();
  });

  it('"Pray regularly" builds a daily recurring schedule by default', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(t(lang, 'schedPrayRecurring')));
    const s = currentSchedule();
    expect(s.type).toBe('recurring');
    expect(s.freq).toBe('daily');
  });

  it('"Pray regularly" then "Weekly" seeds the weekly schedule to today\'s weekday', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(t(lang, 'schedPrayRecurring')));
    fireEvent.click(screen.getByText(t(lang, 'freqWeekly')));
    const s = currentSchedule();
    expect(s.type).toBe('recurring');
    expect(s.freq).toBe('weekly');
    expect(s.weekDays).toContain(new Date().getDay());
  });

  it('"Pray regularly" then "Monthly" builds a monthly schedule with no advanced toggle needed', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(t(lang, 'schedPrayRecurring')));
    fireEvent.click(screen.getByText(t(lang, 'freqMonthly')));
    expect(currentSchedule().freq).toBe('monthly');
  });

  it('"Pray once" builds a one-time schedule for today', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(t(lang, 'schedPrayOnce')));
    expect(currentSchedule()).toEqual(expect.objectContaining({ type: 'once', date: todayKey() }));
  });

  it('offers no "follow up" recurrence preset (follow-up is a separate concept)', () => {
    render(<Harness />);
    expect(screen.queryByText(t(lang, 'schedFollowUp'))).toBeNull();
  });
});

describe('presetOf', () => {
  it('maps a draft to its MODE chip, whatever value that mode holds', () => {
    expect(presetOf(emptyDraft())).toBe('plan');
    expect(presetOf({ mode: 'once', date: todayKey() })).toBe('once');
    expect(presetOf({ mode: 'recurring', freq: 'daily' })).toBe('recurring');
    expect(presetOf({ mode: 'recurring', freq: 'weekly' })).toBe('recurring');
  });

  it('keeps the chip lit after the date or frequency moves off its default', () => {
    // These previously returned null, leaving no chip highlighted — the bug the
    // mode-named chips fix. A prayer scheduled a few days out is still "pray
    // once"; a monthly prayer is still "pray regularly".
    expect(presetOf({ mode: 'once', date: addDays(todayKey(), 3) })).toBe('once');
    expect(presetOf({ mode: 'once', date: addDays(todayKey(), 30) })).toBe('once');
    expect(presetOf({ mode: 'recurring', freq: 'monthly' })).toBe('recurring');
    expect(presetOf({ mode: 'recurring', freq: 'yearly' })).toBe('recurring');
  });
});
