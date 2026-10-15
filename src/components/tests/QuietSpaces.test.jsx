// @vitest-environment jsdom
//
// The quiet spaces (Remain with God, Pray in the Spirit, When words fail) and
// the Lord's-day card. Stillness is never recorded; only words the person
// chooses to keep afterwards are saved, and only onto a prayer given to hold
// them. The Sunday card names the person's own church and opens the ordinary
// prayer form in the Church circle.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import RemainWithGod from '../RemainWithGod';
import SundayCard from '../SundayCard';
import useChurchStore from '../../store/churchStore';
import { t } from '../../i18n';

const lang = 'fr';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(() => {
  localStorage.clear();
  useChurchStore.getState().reset();
});

const finishStillness = () => {
  fireEvent.click(screen.getByRole('button', { name: t(lang, 'remainFinish') }));
};

describe('RemainWithGod variants', () => {
  it('frames Remain with God as being led by the Spirit', () => {
    render(<RemainWithGod lang={lang} onFinish={() => {}} />);
    expect(screen.getByText(t(lang, 'remainSub'))).toBeTruthy();
  });

  it('offers longer times to pray in the Spirit, naming tongues gently', () => {
    render(<RemainWithGod lang={lang} variant="spirit" onFinish={() => {}} />);
    expect(screen.getByRole('heading', { name: t(lang, 'spiritPrayTitle') })).toBeTruthy();
    expect(screen.getByText(t(lang, 'spiritPraySub'))).toBeTruthy();
    for (const key of ['remain3m', 'remain5m', 'remain10m']) {
      expect(screen.getByRole('button', { name: t(lang, key) })).toBeTruthy();
    }
  });

  it('meets someone with no words with Romans 8:26 and nothing to write', () => {
    render(<RemainWithGod lang={lang} variant="noWords" onFinish={() => {}} />);
    expect(screen.getByRole('heading', { name: t(lang, 'noWordsTitle') })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Romains/ })).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('without a prayer to hold a note, finishing the stillness simply closes', () => {
    const onFinish = vi.fn();
    render(<RemainWithGod lang={lang} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'remain30s') }));
    finishStillness();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('keeps what stayed with the person on the given prayer, only when they choose', async () => {
    const onSaveNote = vi.fn().mockResolvedValue(undefined);
    const onFinish = vi.fn();
    render(<RemainWithGod lang={lang} onFinish={onFinish} noteTarget={{ id: 'p1' }} onSaveNote={onSaveNote} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'remain30s') }));
    finishStillness();

    const keep = screen.getByRole('button', { name: t(lang, 'remainNoteSave') });
    expect(keep.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(t(lang, 'remainNoteLabel')), { target: { value: '  Psaume 46  ' } });
    await act(async () => { fireEvent.click(keep); });

    expect(onSaveNote).toHaveBeenCalledWith('Psaume 46');
    expect(screen.getByText(t(lang, 'remainNoteSaved'))).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('ends the stillness on its own after the chosen time', () => {
    vi.useFakeTimers();
    render(<RemainWithGod lang={lang} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'remain30s') }));
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(screen.getByText(t(lang, 'remainEnded'))).toBeTruthy();
  });
});

describe('SundayCard', () => {
  const saturdayEvening = new Date(2026, 9, 17, 19, 0);
  const sundayAfternoon = new Date(2026, 9, 18, 15, 0);
  const wednesday = new Date(2026, 9, 14, 9, 0);

  it('stays away on an ordinary weekday', () => {
    const { container } = render(<SundayCard lang={lang} onPrayInCircle={() => {}} now={wednesday} />);
    expect(container.textContent).toBe('');
  });

  it('before worship, invites prayer for the church in the Church circle', () => {
    const onPrayInCircle = vi.fn();
    render(<SundayCard lang={lang} onPrayInCircle={onPrayInCircle} now={saturdayEvening} />);
    expect(screen.getByRole('heading', { name: t(lang, 'sundayPrepTitle') })).toBeTruthy();
    expect(screen.getByText(t(lang, 'sundayPrepBody'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'sundayPrepCta') }));
    expect(onPrayInCircle).toHaveBeenCalledWith('church', { prompt: t(lang, 'sundayPrepPrompt') });
  });

  it('names the person\'s own church when they have set one', () => {
    useChurchStore.setState({ anchor: { church: 'Église de la Grâce', smallGroup: '' } });
    render(<SundayCard lang={lang} onPrayInCircle={() => {}} now={saturdayEvening} />);
    expect(screen.getByText(t(lang, 'sundayPrepBodyNamed', { church: 'Église de la Grâce' }))).toBeTruthy();
  });

  it('after worship, asks what was received', () => {
    const onPrayInCircle = vi.fn();
    render(<SundayCard lang={lang} onPrayInCircle={onPrayInCircle} now={sundayAfternoon} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'sundayReflectCta') }));
    expect(onPrayInCircle).toHaveBeenCalledWith('church', { prompt: t(lang, 'sundayReflectPrompt') });
  });

  it('stays dismissed for this moment only', () => {
    const first = render(<SundayCard lang={lang} onPrayInCircle={() => {}} now={saturdayEvening} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'sundayDismiss') }));
    expect(screen.queryByRole('heading', { name: t(lang, 'sundayPrepTitle') })).toBeNull();
    first.unmount();

    render(<SundayCard lang={lang} onPrayInCircle={() => {}} now={sundayAfternoon} />);
    expect(screen.getByRole('heading', { name: t(lang, 'sundayReflectTitle') })).toBeTruthy();
  });
});
