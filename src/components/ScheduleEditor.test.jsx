// @vitest-environment jsdom
//
// Human-first scheduling: the simple tier leads with habits (Pray today / daily /
// weekly / follow up) instead of engine language. These tests drive the real
// chip clicks through a small stateful harness and assert the SCHEDULE they
// produce (the persisted contract), plus the presetOf() highlight mapping.
import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ScheduleEditor, { emptyDraft, scheduleFromDraft, presetOf } from './ScheduleEditor';
import { t } from '../i18n';
import { todayKey } from '../lib/prayedLog';
import { addDays } from '../lib/schedule';

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

  it('"Pray daily" builds a daily recurring schedule', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(t(lang, 'schedPrayDaily')));
    const s = currentSchedule();
    expect(s.type).toBe('recurring');
    expect(s.freq).toBe('daily');
  });

  it('"Pray weekly" builds a weekly schedule seeded to today\'s weekday', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(t(lang, 'schedPrayWeekly')));
    const s = currentSchedule();
    expect(s.type).toBe('recurring');
    expect(s.freq).toBe('weekly');
    expect(s.weekDays).toContain(new Date().getDay());
  });

  it('"Pray today" builds a one-time schedule for today', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(t(lang, 'schedPrayToday')));
    expect(currentSchedule()).toEqual(expect.objectContaining({ type: 'once', date: todayKey() }));
  });

  it('"Follow up" builds a one-time nudge a few days out', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(t(lang, 'schedFollowUp')));
    const s = currentSchedule();
    expect(s.type).toBe('once');
    expect(s.date).toBe(addDays(todayKey(), 3));
    expect(s.date > todayKey()).toBe(true);
  });
});

describe('presetOf', () => {
  it('maps drafts back to their preset for chip highlighting', () => {
    expect(presetOf(emptyDraft())).toBe('plan');
    expect(presetOf({ mode: 'once', date: todayKey() })).toBe('today');
    expect(presetOf({ mode: 'once', date: addDays(todayKey(), 3) })).toBe('followup');
    expect(presetOf({ mode: 'recurring', freq: 'daily' })).toBe('daily');
    expect(presetOf({ mode: 'recurring', freq: 'weekly' })).toBe('weekly');
    // A custom one-time date or an advanced frequency has no simple preset.
    expect(presetOf({ mode: 'once', date: addDays(todayKey(), 30) })).toBeNull();
    expect(presetOf({ mode: 'recurring', freq: 'monthly' })).toBeNull();
  });
});
