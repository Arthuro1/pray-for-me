// @vitest-environment jsdom
//
// Calm scheduling: ONE question with three answers, and everything rarer folded
// behind a disclosure that still shows its current value. These tests drive the
// real controls through a small stateful harness and assert the SCHEDULE they
// produce (the persisted contract) — the shape stored in prayers.schedule is
// unchanged, only the way it is asked for.
//
// "Remind me to follow up" is deliberately NOT a schedule choice here — it is a
// separate per-prayer reminder (see followUpStore.test.js), so a one-time date a
// few days out is just a one-time schedule, never a recurrence.
import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import ScheduleEditor from '../ScheduleEditor';
import { emptyDraft, draftFromSchedule, scheduleFromDraft } from '../../lib/scheduleDraft';
import { t } from '../../i18n';
import { todayKey } from '../../lib/prayedLog';
import { addDays, parseKey } from '../../lib/schedule';

const lang = 'fr';
afterEach(cleanup);

function Harness({ initial = emptyDraft(), planDays }) {
  const [draft, setDraft] = useState(initial);
  return (
    <>
      <ScheduleEditor draft={draft} onChange={setDraft} lang={lang} planDays={planDays} />
      <span data-testid="out">{JSON.stringify(scheduleFromDraft(draft))}</span>
    </>
  );
}

const currentSchedule = () => JSON.parse(screen.getByTestId('out').textContent || 'null');
// A row's accessible name is its label followed by its sub-line, so match from
// the start ("Chaque jour" would otherwise also hit "…, chaque semaine…").
const startsWith = (key) => new RegExp(`^${t(lang, key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
const radio = (key) => screen.getByRole('radio', { name: startsWith(key) });
const queryRadio = (key) => screen.queryByRole('radio', { name: startsWith(key) });
const disclosure = (key) => screen.getByRole('button', { name: startsWith(key) });
const openRecurring = () => fireEvent.click(radio('schedOtherRhythm'));

describe('ScheduleEditor — progressive disclosure', () => {
  it('opens on exactly three primary choices, nothing else', () => {
    render(<Harness />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(radio('schedUsePlan')).toBeTruthy();
    expect(radio('schedPrayOnce')).toBeTruthy();
    expect(radio('schedOtherRhythm')).toBeTruthy();
  });

  it('keeps the rhythm choices hidden until "Choose another rhythm" is selected', () => {
    render(<Harness />);
    expect(queryRadio('schedEveryDay')).toBeNull();
    expect(queryRadio('schedOnceAWeek')).toBeNull();
    openRecurring();
    expect(radio('schedEveryDay')).toBeTruthy();
    expect(radio('schedOnceAWeek')).toBeTruthy();
    expect(radio('schedChooseDays')).toBeTruthy();
  });

  it('keeps the date input hidden until "Pray once" is selected', () => {
    render(<Harness />);
    expect(screen.queryByLabelText(t(lang, 'schedDateLabel'))).toBeNull();
    fireEvent.click(radio('schedPrayOnce'));
    expect(screen.getByLabelText(t(lang, 'schedDateLabel'))).toBeTruthy();
  });

  it('hides every-N-days, monthly and yearly behind "More scheduling options"', () => {
    render(<Harness />);
    openRecurring();
    expect(queryRadio('freqInterval')).toBeNull();
    expect(queryRadio('freqMonthly')).toBeNull();
    expect(queryRadio('freqYearly')).toBeNull();
    fireEvent.click(disclosure('schedMoreOptions'));
    expect(radio('freqInterval')).toBeTruthy();
    expect(radio('freqMonthly')).toBeTruthy();
    expect(radio('freqYearly')).toBeTruthy();
  });

  it('shows the preferred time as one summary row until Change is selected', () => {
    render(<Harness />);
    openRecurring();
    // The current value reads without expanding anything…
    expect(disclosure('schedPreferredTime').textContent).toContain(t(lang, 'slotAnytime'));
    expect(queryRadio('slot_morning')).toBeNull();
    fireEvent.click(disclosure('schedPreferredTime'));
    expect(radio('slot_morning')).toBeTruthy();
    expect(radio('slot_evening')).toBeTruthy();
  });

  it('keeps the ending choices behind their own disclosure, value still visible', () => {
    render(<Harness />);
    openRecurring();
    expect(disclosure('schedStopQuestion').textContent).toContain(t(lang, 'endMarkAnswered'));
    expect(queryRadio('endOnDate')).toBeNull();
    fireEvent.click(disclosure('schedStopQuestion'));
    expect(radio('endMarkAnswered')).toBeTruthy();
    expect(radio('endOnDate')).toBeTruthy();
    expect(radio('endAfterCount')).toBeTruthy();
    expect(radio('endNoAutoEnd')).toBeTruthy();
  });

  it('reveals the ending date and count inputs only for their own choice', () => {
    render(<Harness />);
    openRecurring();
    fireEvent.click(disclosure('schedStopQuestion'));
    expect(screen.queryByLabelText(t(lang, 'schedEndDateLabel'))).toBeNull();
    fireEvent.click(radio('endOnDate'));
    expect(screen.getByLabelText(t(lang, 'schedEndDateLabel'))).toBeTruthy();
    expect(screen.queryByLabelText(t(lang, 'schedEndCountLabel'))).toBeNull();
    fireEvent.click(radio('endAfterCount'));
    expect(screen.getByLabelText(t(lang, 'schedEndCountLabel'))).toBeTruthy();
  });
});

describe('ScheduleEditor — what each choice saves', () => {
  it('"use my normal rhythm" keeps the plan-following (null) schedule', () => {
    render(<Harness />);
    expect(currentSchedule()).toBeNull();
    // …and returning to it after a detour still means "no schedule".
    fireEvent.click(radio('schedPrayOnce'));
    fireEvent.click(radio('schedUsePlan'));
    expect(currentSchedule()).toBeNull();
  });

  it('"pray once" defaults to today and persists a chosen date', () => {
    render(<Harness />);
    fireEvent.click(radio('schedPrayOnce'));
    expect(currentSchedule()).toEqual(expect.objectContaining({ type: 'once', date: todayKey() }));
    const later = addDays(todayKey(), 6);
    fireEvent.change(screen.getByLabelText(t(lang, 'schedDateLabel')), { target: { value: later } });
    expect(currentSchedule()).toEqual(expect.objectContaining({ type: 'once', date: later }));
  });

  it('"every day" maps to the existing daily frequency', () => {
    render(<Harness />);
    openRecurring();
    fireEvent.click(radio('schedEveryDay'));
    expect(currentSchedule()).toEqual(expect.objectContaining({ type: 'recurring', freq: 'daily' }));
  });

  it('"once a week" selects a single valid weekday — today\'s', () => {
    render(<Harness />);
    openRecurring();
    fireEvent.click(radio('schedOnceAWeek'));
    const s = currentSchedule();
    expect(s.freq).toBe('weekly');
    expect(s.weekDays).toEqual([parseKey(todayKey()).getDay()]);
  });

  it('"choose days" supports several weekdays', () => {
    render(<Harness />);
    openRecurring();
    fireEvent.click(radio('schedChooseDays'));
    const days = t(lang, 'days');
    const group = screen.getByRole('group', { name: t(lang, 'schedWeekdaysLabel') });
    fireEvent.click(within(group).getByRole('button', { name: new RegExp(days[1]) })); // Monday
    fireEvent.click(within(group).getByRole('button', { name: new RegExp(days[4]) })); // Thursday
    const s = currentSchedule();
    expect(s.freq).toBe('weekly');
    expect(s.weekDays).toEqual(expect.arrayContaining([1, 4]));
  });

  it('still persists every-N-days, monthly and yearly from the disclosure', () => {
    render(<Harness />);
    openRecurring();
    fireEvent.click(disclosure('schedMoreOptions'));

    fireEvent.click(radio('freqInterval'));
    fireEvent.change(screen.getByLabelText(t(lang, 'intervalEvery')), { target: { value: '5' } });
    expect(currentSchedule()).toEqual(expect.objectContaining({ freq: 'interval', interval: 5 }));

    fireEvent.click(radio('freqMonthly'));
    fireEvent.change(screen.getByLabelText(t(lang, 'monthlyOnDay')), { target: { value: '12' } });
    expect(currentSchedule()).toEqual(expect.objectContaining({ freq: 'monthly', dayOfMonth: 12 }));

    fireEvent.click(radio('freqYearly'));
    expect(currentSchedule().freq).toBe('yearly');
  });

  it('a newly chosen rhythm ends when the prayer is marked answered', () => {
    render(<Harness />);
    openRecurring();
    expect(currentSchedule().end).toEqual({ kind: 'answered' });
  });

  it('preserves chosen weekdays when switching away and back in the same session', () => {
    render(<Harness />);
    openRecurring();
    fireEvent.click(radio('schedChooseDays'));
    const days = t(lang, 'days');
    const group = screen.getByRole('group', { name: t(lang, 'schedWeekdaysLabel') });
    fireEvent.click(within(group).getByRole('button', { name: new RegExp(days[2]) }));
    fireEvent.click(within(group).getByRole('button', { name: new RegExp(days[5]) }));
    const before = currentSchedule().weekDays;

    fireEvent.click(radio('schedPrayOnce'));
    fireEvent.click(radio('schedOtherRhythm'));
    expect(currentSchedule().weekDays).toEqual(before);
  });
});

describe('ScheduleEditor — existing schedules reopen unchanged', () => {
  const reopen = (schedule) => render(<Harness initial={draftFromSchedule(schedule)} />);

  it('a saved multi-day week opens on "Choose days" with its days intact', () => {
    reopen({ type: 'recurring', freq: 'weekly', weekDays: [2, 5], startDate: todayKey(), end: { kind: 'never' } });
    expect(radio('schedOtherRhythm').checked).toBe(true);
    expect(radio('schedChooseDays').checked).toBe(true);
    expect(currentSchedule()).toEqual(expect.objectContaining({ freq: 'weekly', weekDays: [2, 5] }));
  });

  it('a saved single-day week opens on "Once a week"', () => {
    reopen({ type: 'recurring', freq: 'weekly', weekDays: [3], startDate: todayKey(), end: { kind: 'never' } });
    expect(radio('schedOnceAWeek').checked).toBe(true);
  });

  it('a saved monthly schedule opens with its disclosure already expanded', () => {
    reopen({ type: 'recurring', freq: 'monthly', dayOfMonth: 9, startDate: todayKey(), end: { kind: 'never' } });
    expect(radio('freqMonthly').checked).toBe(true);
    expect(currentSchedule()).toEqual(expect.objectContaining({ freq: 'monthly', dayOfMonth: 9 }));
  });

  it('a saved one-time schedule opens on "Pray once" with its date and slot', () => {
    const day = addDays(todayKey(), 10);
    reopen({ type: 'once', date: day, slot: 'evening' });
    expect(radio('schedPrayOnce').checked).toBe(true);
    expect(currentSchedule()).toEqual({ type: 'once', date: day, slot: 'evening' });
  });

  it('never re-defaults an ending the user already has', () => {
    const stored = { type: 'recurring', freq: 'daily', startDate: todayKey(), end: { kind: 'never' } };
    reopen(stored);
    expect(disclosure('schedStopQuestion').textContent).toContain(t(lang, 'endNoAutoEnd'));
    // Re-picking a rhythm must not swap the stored ending for the new default.
    fireEvent.click(radio('schedOnceAWeek'));
    expect(currentSchedule().end).toEqual({ kind: 'never' });
  });

  it('round-trips a counted interval schedule without data loss', () => {
    const stored = { type: 'recurring', freq: 'interval', interval: 4, startDate: addDays(todayKey(), -3), slot: 'morning', end: { kind: 'count', count: 7 } };
    reopen(stored);
    expect(currentSchedule()).toEqual(stored);
  });
});

describe('ScheduleEditor — the confirmation sentence', () => {
  it('describes a plan-following prayer by the days it really lands on', () => {
    render(<Harness planDays={[1, 3]} />);
    const sentence = screen.getByText(new RegExp(t(lang, 'schedWillFollowPlan', { days: '' }).slice(0, 20)));
    expect(sentence.textContent).toContain('lundi');
    expect(sentence.textContent).toContain('mercredi');
  });

  it('states the rhythm, the time and the ending of a recurring prayer', () => {
    render(<Harness />);
    openRecurring();
    fireEvent.click(radio('schedOnceAWeek'));
    const live = screen.getByText(new RegExp(t(lang, 'sentAnytime')));
    expect(live.textContent).toContain(t(lang, 'sentUntilAnswered'));
    // The day named is the one the schedule actually carries.
    const weekday = parseKey(todayKey()).toLocaleDateString(lang, { weekday: 'long' });
    expect(live.textContent).toContain(weekday);
  });

  it('says "once on <date>" for a one-time prayer and names no ending', () => {
    render(<Harness />);
    fireEvent.click(radio('schedPrayOnce'));
    const live = screen.getByText(new RegExp(t(lang, 'sentAnytime')));
    expect(live.textContent).not.toContain(t(lang, 'sentUntilAnswered'));
    expect(live.textContent).toContain(parseKey(todayKey()).toLocaleDateString(lang, { day: 'numeric', month: 'short' }));
  });
});

describe('ScheduleEditor — accessibility', () => {
  it('uses real radios in named groups', () => {
    render(<Harness />);
    expect(screen.getByRole('group', { name: t(lang, 'schedWhenAppear') })).toBeTruthy();
    expect(radio('schedUsePlan').type).toBe('radio');
    expect(radio('schedUsePlan').checked).toBe(true);
    expect(radio('schedPrayOnce').checked).toBe(false);
  });

  it('exposes aria-expanded/aria-controls on every disclosure', () => {
    render(<Harness />);
    openRecurring();
    for (const key of ['schedMoreOptions', 'schedPreferredTime', 'schedStopQuestion']) {
      const row = disclosure(key);
      expect(row.getAttribute('aria-expanded')).toBe(key === 'schedMoreOptions' ? 'false' : 'false');
      expect(row.getAttribute('aria-controls')).toBeTruthy();
      fireEvent.click(row);
      expect(row.getAttribute('aria-expanded')).toBe('true');
    }
  });

  it('does not submit the surrounding form when Enter is pressed in a field', () => {
    let submitted = false;
    render(
      <form onSubmit={() => { submitted = true; }}>
        <Harness />
      </form>
    );
    fireEvent.click(radio('schedPrayOnce'));
    const date = screen.getByLabelText(t(lang, 'schedDateLabel'));
    fireEvent.keyDown(date, { key: 'Enter' });
    expect(submitted).toBe(false);
  });
});
