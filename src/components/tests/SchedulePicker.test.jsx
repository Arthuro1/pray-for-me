// @vitest-environment jsdom
//
// The shared schedule editor has two hosts: the picker under the prayer form's
// rhythm row (which works on a draft) and the planner on Prayer Detail (which
// works on a saved schedule). These tests cover that Cancel discards and that a
// save commits exactly once through the existing update path. (The row that
// states the rhythm and opens the picker is covered with the form.)
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import SchedulePicker from '../SchedulePicker';
import SchedulePlanner from '../SchedulePlanner';
import { defaultNewDraft, emptyDraft, weekdayName } from '../../lib/scheduleDraft';
import { t } from '../../i18n';
import { todayKey } from '../../lib/prayedLog';

const lang = 'fr';
afterEach(cleanup);

const startsWith = (key) => new RegExp(`^${t(lang, key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
const radio = (key) => screen.getByRole('radio', { name: startsWith(key) });
const schedulerCancel = () => within(screen.getByText(t(lang, 'schedUseRhythm')).closest('div'))
  .getByText(t(lang, 'cancel'));

const renderPicker = ({ draft = defaultNewDraft(), onCommit = () => {}, onClose = () => {} } = {}) =>
  render(<SchedulePicker draft={draft} onCommit={onCommit} onClose={onClose} lang={lang} />);

describe('SchedulePicker — the editor under the rhythm row', () => {
  it('opens on the rhythm the prayer already has', () => {
    renderPicker();
    expect(screen.getByText(t(lang, 'schedWhenAppear'))).toBeTruthy();
    expect(radio('schedOtherRhythm').checked).toBe(true);
    expect(radio('schedNoFixed').checked).toBe(false);
  });

  it('opens a "no fixed schedule" prayer on that choice', () => {
    renderPicker({ draft: emptyDraft() });
    expect(radio('schedNoFixed').checked).toBe(true);
  });

  it('commits once on "Use this rhythm", then closes', () => {
    const onCommit = vi.fn();
    const onClose = vi.fn();
    renderPicker({ onCommit, onClose });
    fireEvent.click(radio('schedEveryDay'));
    fireEvent.click(screen.getByText(t(lang, 'schedUseRhythm')));

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0][0]).toMatchObject({ mode: 'recurring', freq: 'daily' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('discards the edits on Cancel — nothing is committed', () => {
    const onCommit = vi.fn();
    const onClose = vi.fn();
    renderPicker({ onCommit, onClose });
    fireEvent.click(radio('schedEveryDay'));
    fireEvent.click(schedulerCancel());

    expect(onCommit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
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
    expect(screen.getByText(new RegExp(weekdayName(lang, 2)))).toBeTruthy();
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
