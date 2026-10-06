// @vitest-environment jsdom
//
// The journey preview should help someone decide without making them scroll
// past an entire curriculum. Longer journeys lead with their movements; the
// complete day-by-day outline and biblical context stay available on request.
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
  it('shows movements first, then the complete day outline on request', () => {
    open();

    for (const movement of PREPARING_IN_PRAYER.movements) {
      expect(screen.getByText(t(lang, movement.titleKey))).toBeTruthy();
    }
    expect(screen.queryByText(pick(PREPARING_IN_PRAYER.days[0].theme, lang))).toBeNull();
    expect(screen.queryByText(pick(PREPARING_IN_PRAYER.days[3].theme, lang))).toBeNull();

    const disclosure = screen.getByRole('button', {
      name: t(lang, 'previewAllDays'),
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
  it('stays outside the scrolling preview and progressively reveals a custom date', () => {
    const { container, onStart } = open();
    const scrollRegion = container.querySelector('.flex-1.overflow-y-auto');
    const todayButton = screen.getByRole('button', { name: t(lang, 'journeyStartToday') });

    expect(scrollRegion).toBeTruthy();
    expect(scrollRegion.contains(todayButton)).toBe(false);
    expect(todayButton.closest('.sticky')).toBeNull();
    expect(screen.queryByLabelText(t(lang, 'planStartDate'))).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'startAnotherDay') }));
    const startDate = screen.getByLabelText(t(lang, 'planStartDate'));
    fireEvent.change(startDate, { target: { value: '2099-04-12' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'journeyStart') }));
    expect(onStart).toHaveBeenCalledWith(PREPARING_IN_PRAYER, '2099-04-12');
  });
});
