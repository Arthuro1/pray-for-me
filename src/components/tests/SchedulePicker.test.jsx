// @vitest-environment jsdom
//
// Scheduling stays one line until asked for. These tests cover the two hosts of
// the shared editor: the picker inside the new-prayer form (which works on a
// draft) and the planner on Prayer Detail (which works on a saved schedule) —
// specifically that opening is optional, Cancel discards, and a save commits
// exactly once through the existing update path.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import SchedulePicker from '../SchedulePicker';
import SchedulePlanner from '../SchedulePlanner';
import { defaultNewDraft, emptyDraft } from '../../lib/scheduleDraft';
import { t } from '../../i18n';
import { todayKey } from '../../lib/prayedLog';
import { parseKey } from '../../lib/schedule';

const lang = 'fr';
afterEach(cleanup);

const startsWith = (key) => new RegExp(`^${t(lang, key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
const radio = (key) => screen.getByRole('radio', { name: startsWith(key) });
const rhythmRow = () => screen.getByText(t(lang, 'schedRhythmLabel')).closest('button');
const schedulerCancel = () => within(screen.getByText(t(lang, 'schedUseRhythm')).closest('div'))
  .getByText(t(lang, 'cancel'));

function PickerHarness({ initial = defaultNewDraft(), onCommit = () => {}, planDays }) {
  const [draft, setDraft] = useState(initial);
  return (
    <SchedulePicker
      draft={draft}
      onCommit={(d) => { setDraft(d); onCommit(d); }}
      lang={lang}
      planDays={planDays}
    />
  );
}

describe('SchedulePicker — one line until asked', () => {
  it('shows only the rhythm summary and a reassurance, never the scheduler', () => {
    render(<PickerHarness />);
    expect(rhythmRow()).toBeTruthy();
    expect(screen.getByText(t(lang, 'schedChangeLater'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'schedWhenAppear'))).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('states the rhythm the prayer already has, in words', () => {
    render(<PickerHarness />);
    // The bounded weekly default, named by its real weekday and time.
    expect(rhythmRow().textContent).toContain(t(lang, 'days')[parseKey(todayKey()).getDay()]);
    expect(rhythmRow().textContent).toContain(t(lang, 'slotAnytime'));
  });

  it('states a "no fixed schedule" prayer as staying in the Journal', () => {
    render(<PickerHarness initial={emptyDraft()} />);
    expect(rhythmRow().textContent).toContain(t(lang, 'noFixedSchedule'));
    expect(screen.getByText(t(lang, 'rhythmPlanHint'))).toBeTruthy();
  });

  it('opens the scheduler on Change and collapses again after "Use this rhythm"', () => {
    const onCommit = vi.fn();
    render(<PickerHarness onCommit={onCommit} />);
    fireEvent.click(rhythmRow());
    expect(screen.getByText(t(lang, 'schedWhenAppear'))).toBeTruthy();

    fireEvent.click(radio('schedEveryDay'));
    fireEvent.click(screen.getByText(t(lang, 'schedUseRhythm')));

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0][0]).toMatchObject({ mode: 'recurring', freq: 'daily' });
    // Back to the compact row, now describing the new rhythm.
    expect(screen.queryByText(t(lang, 'schedWhenAppear'))).toBeNull();
    expect(rhythmRow().textContent).toContain(t(lang, 'schedDaily'));
  });

  it('discards the draft on Cancel — nothing is committed', () => {
    const onCommit = vi.fn();
    render(<PickerHarness onCommit={onCommit} />);
    fireEvent.click(rhythmRow());
    fireEvent.click(radio('schedEveryDay'));
    fireEvent.click(schedulerCancel());

    expect(onCommit).not.toHaveBeenCalled();
    expect(rhythmRow().textContent).toContain(t(lang, 'days')[parseKey(todayKey()).getDay()]);
    // Reopening starts from the committed value again, not the discarded one.
    fireEvent.click(rhythmRow());
    expect(radio('schedEveryDay').checked).toBe(false);
  });

  it('returns focus to the row that opened it', () => {
    render(<PickerHarness />);
    fireEvent.click(rhythmRow());
    fireEvent.click(schedulerCancel());
    // The collapsed row is re-created on close, so identity is checked against
    // the row that exists now — what matters is that focus is on it.
    expect(document.activeElement).toBe(rhythmRow());
  });
});

describe('SchedulePlanner — Prayer Detail', () => {
  it('saves once through the update path and closes', () => {
    const onSave = vi.fn();
    const onDone = vi.fn();
    render(<SchedulePlanner schedule={null} lang={lang} defaultEditing onSave={onSave} onDone={onDone} />);

    fireEvent.click(radio('schedOtherRhythm'));
    fireEvent.click(radio('schedEveryDay'));
    fireEvent.click(screen.getByText(t(lang, 'schedUseRhythm')));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ type: 'recurring', freq: 'daily' });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('does not save on Cancel, and keeps the stored schedule intact', () => {
    const onSave = vi.fn();
    const stored = { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: todayKey(), end: { kind: 'never' } };
    render(<SchedulePlanner schedule={stored} lang={lang} defaultEditing onSave={onSave} onDone={() => {}} />);

    fireEvent.click(radio('schedEveryDay'));
    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(onSave).not.toHaveBeenCalled();
    // Collapsed back to the stored schedule's own summary.
    expect(screen.getByText(new RegExp(t(lang, 'days')[2]))).toBeTruthy();
  });

  it('clears a schedule to "no fixed schedule"', () => {
    const onSave = vi.fn();
    const stored = { type: 'recurring', freq: 'daily', startDate: todayKey(), end: { kind: 'never' } };
    render(<SchedulePlanner schedule={stored} lang={lang} defaultEditing onSave={onSave} onDone={() => {}} />);

    fireEvent.click(radio('schedNoFixed'));
    fireEvent.click(screen.getByText(t(lang, 'schedUseRhythm')));
    expect(onSave).toHaveBeenCalledWith({ type: 'none' });
  });
});
