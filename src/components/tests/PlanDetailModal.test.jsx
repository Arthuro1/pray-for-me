// @vitest-environment jsdom
//
// The plan preview should help someone decide without making them scroll past
// an entire curriculum. It gives the summary and first three days first, while
// keeping both the complete outline and biblical context available on request.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import PlanDetailModal from '../PlanDetailModal';
import { PREPARING_IN_PRAYER } from '../../content/plans/preparingInPrayer';
import { pick } from '../../content/teaching';
import { t } from '../../i18n';

const lang = 'fr'; // the always-loaded fallback locale

afterEach(cleanup);

function open(props = {}) {
  const onStart = vi.fn();
  const result = render(
    <PlanDetailModal
      plan={PREPARING_IN_PRAYER}
      lang={lang}
      running={false}
      onStart={onStart}
      onClose={vi.fn()}
      {...props}
    />,
  );
  return { ...result, onStart };
}

describe('the concise plan preview', () => {
  it('shows only the first three days until the reader asks for the full outline', () => {
    open();

    expect(screen.getByText(pick(PREPARING_IN_PRAYER.days[0].theme, lang))).toBeTruthy();
    expect(screen.getByText(pick(PREPARING_IN_PRAYER.days[2].theme, lang))).toBeTruthy();
    expect(screen.queryByText(pick(PREPARING_IN_PRAYER.days[3].theme, lang))).toBeNull();

    const disclosure = screen.getByRole('button', {
      name: `${t(lang, 'loadMore')}: ${t(lang, 'planDayByDay')}`,
    });
    expect(disclosure.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(disclosure);
    expect(disclosure.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(pick(PREPARING_IN_PRAYER.days[3].theme, lang))).toBeTruthy();
    expect(screen.getByText(pick(PREPARING_IN_PRAYER.days.at(-1).theme, lang))).toBeTruthy();

    fireEvent.click(disclosure);
    expect(screen.queryByText(pick(PREPARING_IN_PRAYER.days[3].theme, lang))).toBeNull();
  });

  it('keeps the longer biblical context behind an accessible disclosure', () => {
    open();

    expect(screen.getByText(pick(PREPARING_IN_PRAYER.intro, lang))).toBeTruthy();
    expect(screen.queryByText(pick(PREPARING_IN_PRAYER.biblical.text, lang))).toBeNull();

    const disclosure = screen.getByRole('button', { name: t(lang, 'gospelReadMore') });
    expect(disclosure.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(disclosure);
    expect(disclosure.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(pick(PREPARING_IN_PRAYER.biblical.text, lang))).toBeTruthy();
  });
});

describe('the start action', () => {
  it('stays outside the scrolling preview and passes the chosen date to the caller', () => {
    const { container, onStart } = open();
    const scrollRegion = container.querySelector('.flex-1.overflow-y-auto');
    const startButton = screen.getByRole('button', { name: new RegExp(t(lang, 'planStart')) });
    const startDate = screen.getByLabelText(t(lang, 'planStartDate'));

    expect(scrollRegion).toBeTruthy();
    expect(scrollRegion.contains(startButton)).toBe(false);
    expect(startButton.closest('.sticky')).toBeNull();

    fireEvent.change(startDate, { target: { value: '2099-04-12' } });
    fireEvent.click(startButton);
    expect(onStart).toHaveBeenCalledWith(PREPARING_IN_PRAYER, '2099-04-12');
  });
});
