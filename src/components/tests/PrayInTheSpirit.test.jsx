// @vitest-environment jsdom
//
// The quiet space ("Pray in the Spirit") and the Lord's-day card. Stillness is
// never recorded; only words the person chooses to keep afterwards are saved,
// and only onto a prayer given to hold them. The person chooses how long — a
// preset, their own minutes, or no timer — and that choice is remembered on
// the device. The Sunday card names the person's own church and opens the
// ordinary prayer form in the Church circle.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrayInTheSpirit from '../PrayInTheSpirit';
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

const chip = (key, vars) => screen.getByRole('button', { name: t(lang, key, vars) });
const begin = () => fireEvent.click(screen.getByRole('button', { name: t(lang, 'spiritBegin') }));
const finishStillness = () => {
  fireEvent.click(screen.getByRole('button', { name: t(lang, 'remainFinish') }));
};

describe('PrayInTheSpirit', () => {
  it('is one space: led by the Spirit, naming tongues gently, with its passages', () => {
    render(<PrayInTheSpirit lang={lang} onFinish={() => {}} />);
    expect(screen.getByRole('heading', { name: t(lang, 'spiritPrayTitle') })).toBeTruthy();
    expect(screen.getByText(t(lang, 'spiritPraySub'))).toBeTruthy();
    expect(screen.getByRole('button', { name: /Éphésiens 6/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Romains 8/ })).toBeTruthy();
  });

  it('offers presets, the person\'s own minutes and no timer', () => {
    render(<PrayInTheSpirit lang={lang} onFinish={() => {}} />);
    for (const n of [5, 10, 15, 30]) expect(chip('minutesShort', { n })).toBeTruthy();
    expect(chip('spiritDurationOther')).toBeTruthy();
    expect(chip('spiritDurationOpen')).toBeTruthy();
    // Ten minutes until the person chooses otherwise.
    expect(chip('minutesShort', { n: 10 }).getAttribute('aria-pressed')).toBe('true');
  });

  it('cannot begin while its own duration is out of range, and remembers a valid one', () => {
    const { unmount } = render(<PrayInTheSpirit lang={lang} onFinish={() => {}} />);
    fireEvent.click(chip('spiritDurationOther'));
    const minutes = screen.getByLabelText(t(lang, 'spiritCustomLabel'));
    fireEvent.change(minutes, { target: { value: '90' } });
    expect(screen.getByRole('button', { name: t(lang, 'spiritBegin') }).disabled).toBe(true);
    fireEvent.change(minutes, { target: { value: '45' } });
    begin();
    expect(screen.getByText(t(lang, 'spiritPrayStill'))).toBeTruthy();
    unmount();

    render(<PrayInTheSpirit lang={lang} onFinish={() => {}} />);
    expect(chip('spiritDurationOther').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText(t(lang, 'spiritCustomLabel')).value).toBe('45');
  });

  it('ends the stillness on its own after the chosen time', () => {
    vi.useFakeTimers();
    render(<PrayInTheSpirit lang={lang} onFinish={() => {}} />);
    fireEvent.click(chip('minutesShort', { n: 5 }));
    begin();
    act(() => { vi.advanceTimersByTime(5 * 60_000); });
    expect(screen.getByText(t(lang, 'remainEnded'))).toBeTruthy();
  });

  it('without a timer, stays until the person finishes', () => {
    vi.useFakeTimers();
    render(<PrayInTheSpirit lang={lang} onFinish={() => {}} />);
    fireEvent.click(chip('spiritDurationOpen'));
    begin();
    act(() => { vi.advanceTimersByTime(3 * 60 * 60_000); });
    expect(screen.getByText(t(lang, 'spiritPrayStill'))).toBeTruthy();
  });

  it('explains what praying in the Spirit means, then returns to the space', () => {
    render(<MemoryRouter><PrayInTheSpirit lang={lang} onFinish={() => {}} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'spiritGuideLink') }));
    expect(screen.getByRole('heading', { name: t(lang, 'spiritGuideLink') })).toBeTruthy();
    for (const key of ['spiritFaqTonguesQ', 'spiritFaqHowQ', 'spiritFaqWanderQ']) {
      expect(screen.getByRole('heading', { name: t(lang, key) })).toBeTruthy();
    }
    // The 21-day plan is offered for those who want to go further.
    expect(screen.getByRole('button', { name: new RegExp(t(lang, 'planHolySpiritTitle')) })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'backBtn') }));
    expect(screen.getByRole('heading', { name: t(lang, 'spiritPrayTitle') })).toBeTruthy();
  });

  it('outside the app\'s pages the guide still answers, without the plan link', () => {
    render(<PrayInTheSpirit lang={lang} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'spiritGuideLink') }));
    expect(screen.getByText(t(lang, 'spiritGuideIntro'))).toBeTruthy();
    expect(screen.queryByRole('button', { name: new RegExp(t(lang, 'planHolySpiritTitle')) })).toBeNull();
  });

  it('without a prayer to hold a note, finishing the stillness simply closes', () => {
    const onFinish = vi.fn();
    render(<PrayInTheSpirit lang={lang} onFinish={onFinish} />);
    begin();
    finishStillness();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('keeps what stayed with the person on the given prayer, only when they choose', async () => {
    const onSaveNote = vi.fn().mockResolvedValue(undefined);
    const onFinish = vi.fn();
    render(<PrayInTheSpirit lang={lang} onFinish={onFinish} noteTarget={{ id: 'p1' }} onSaveNote={onSaveNote} />);
    begin();
    finishStillness();

    const keep = screen.getByRole('button', { name: t(lang, 'remainNoteSave') });
    expect(keep.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(t(lang, 'remainNoteLabel')), { target: { value: '  Psaume 46  ' } });
    await act(async () => { fireEvent.click(keep); });

    expect(onSaveNote).toHaveBeenCalledWith('Psaume 46');
    expect(screen.getByText(t(lang, 'remainNoteSaved'))).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
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
    useChurchStore.setState({ anchor: { church: 'Église de la Grâce' } });
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
