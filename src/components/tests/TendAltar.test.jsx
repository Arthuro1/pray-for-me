// @vitest-environment jsdom
//
// "Tend your altar" is a reflective review, one prayer at a time: a question,
// four faithful answers, then the next prayer — never a list of chores. Every
// answer is remembered on this device only, and releasing a prayer from its
// rhythm never deletes it or calls it answered.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TendAltar from '../TendAltar';
import { readTended } from '../../lib/carried';
import { t } from '../../i18n';

const lang = 'fr';
const daily = { type: 'recurring', freq: 'daily', startDate: '2025-01-01', end: { kind: 'never' } };
const prayers = [
  { id: 'a', title: 'Pour Sarah', status: 'active', circle: 'people', for_other: true, person_name: 'Sarah', schedule: daily, created_at: '2025-03-12T08:00:00Z' },
  { id: 'b', title: 'Mon Église', status: 'active', circle: 'church', schedule: daily, created_at: '2025-05-02T08:00:00Z' },
];

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const renderTend = (props = {}) => {
  const onRelease = vi.fn();
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <TendAltar prayers={prayers} completions={{}} lang={lang} tr={(text) => text} onRelease={onRelease} onClose={onClose} {...props} />
    </MemoryRouter>,
  );
  return { onRelease, onClose };
};

describe('TendAltar — one prayer at a time', () => {
  it('shows a single prayer with its circle, how long it has been carried and the question', () => {
    renderTend();
    expect(screen.getByRole('heading', { level: 3, name: 'Pour Sarah' })).toBeTruthy();
    expect(screen.queryByText('Mon Église')).toBeNull();
    expect(screen.getByText(`${t(lang, 'circle_people')} · ${t(lang, 'forPersonLabel', { name: 'Sarah' })}`)).toBeTruthy();
    expect(screen.getByText(/^Porté/)).toBeTruthy();
    expect(screen.getByText(t(lang, 'tendQuestion'))).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('continuing carries on to the next prayer and remembers the answer on this device', () => {
    renderTend();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tendContinue') }));
    expect(screen.getByRole('heading', { level: 3, name: 'Mon Église' })).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
    expect(Object.keys(readTended())).toEqual(['a']);
  });

  it('releasing from the rhythm hands the prayer back to the caller and moves on', () => {
    const { onRelease } = renderTend();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tendRelease') }));
    expect(onRelease).toHaveBeenCalledWith(prayers[0]);
    expect(screen.getByRole('heading', { level: 3, name: 'Mon Église' })).toBeTruthy();
  });

  it('ends quietly once every prayer has been tended', () => {
    const { onClose } = renderTend();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tendContinue') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'tendContinue') }));
    expect(screen.getByRole('status').textContent).toContain(t(lang, 'tendDone'));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'remainFinish') }));
    expect(onClose).toHaveBeenCalled();
  });
});
