import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { page } from 'vitest/browser';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

import PlanDayDeck from './PlanDayDeck';
import PlanDayBody from '../PlanDayBody';
import { DAVID_HEART } from '../../content/plans/davidHeart';
import { loadLocale, t } from '../../i18n';
import '../../index.css';

// The swipe, in a real browser: jsdom has no layout, so the card has no width
// there and the commit threshold cannot be exercised at all. Everything else
// about paging — which day each step lands on, the ends of the plan, the
// keyboard — is covered in src/pages/PrayerDetail.planDay.test.jsx.
beforeAll(async () => { await loadLocale('ar'); });
afterEach(cleanup);

const DAYS = { prev: '2026-09-15', today: '2026-09-16', next: '2026-09-17' };

function renderDeck({ lang = 'fr', dir = 'ltr', children, ...props } = {}) {
  const onGoToDay = vi.fn();
  const { container } = render(
    <main dir={dir} className="mx-auto max-w-xl p-4" style={{ background: 'var(--background)' }}>
      <PlanDayDeck
        lang={lang}
        dayNo={4}
        total={21}
        dayKey={DAYS.today}
        isToday
        prevKey={DAYS.prev}
        nextKey={DAYS.next}
        onGoToDay={onGoToDay}
        {...props}
      >
        {children || <p>Le quatrième jour</p>}
      </PlanDayDeck>
    </main>,
  );
  return { onGoToDay, viewport: container.querySelector('.plan-deck__viewport') };
}

// A real day of a real plan, so the card is measured around the content it
// actually carries rather than one line of text.
const realDay = (
  <div className="space-y-3">
    <p className="text-sm font-medium">{DAVID_HEART.days[0].theme.fr}</p>
    <PlanDayBody day={DAVID_HEART.days[0]} lang="fr" />
  </div>
);

// One continuous gesture, as a finger would make it.
function swipe(el, { from, to, y = 200, endY = y, steps = 5 }) {
  const at = (clientX, clientY) => ({ bubbles: true, clientX, clientY, pointerType: 'touch', pointerId: 1 });
  el.dispatchEvent(new PointerEvent('pointerdown', at(from, y)));
  for (let i = 1; i <= steps; i++) {
    el.dispatchEvent(new PointerEvent('pointermove', at(
      from + ((to - from) * i) / steps,
      y + ((endY - y) * i) / steps,
    )));
  }
  el.dispatchEvent(new PointerEvent('pointerup', at(to, endY)));
}

describe('swiping between the days of a plan', () => {
  it('carries a whole plan day on a phone, leaving the vertical axis to the page', async () => {
    await page.viewport(390, 844);
    const { viewport } = renderDeck({ children: realDay });
    // Ours is the horizontal axis only: vertical scrolling stays native.
    expect(getComputedStyle(viewport).touchAction).toBe('pan-y');
    expect(getComputedStyle(viewport).overflow).toBe('hidden');
    expect(screen.getByText(DAVID_HEART.days[0].theme.fr)).toBeTruthy();
    // Both arrows are reachable thumb targets, and nothing widens the page.
    for (const key of ['planPrevDay', 'planNextDay']) {
      const box = screen.getByRole('button', { name: new RegExp(t('fr', key)) }).getBoundingClientRect();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
  });

  it('pages forward when the day is dragged against the reading direction', async () => {
    await page.viewport(390, 844);
    const { onGoToDay, viewport } = renderDeck();
    swipe(viewport, { from: 300, to: 80 });
    expect(onGoToDay).toHaveBeenCalledWith(DAYS.next);
  });

  it('pages back when it is dragged the other way', async () => {
    await page.viewport(390, 844);
    const { onGoToDay, viewport } = renderDeck();
    swipe(viewport, { from: 80, to: 300 });
    expect(onGoToDay).toHaveBeenCalledWith(DAYS.prev);
  });

  it('holds its place when the drag is only a nudge', async () => {
    await page.viewport(390, 844);
    const { onGoToDay, viewport } = renderDeck();
    swipe(viewport, { from: 300, to: 282 });
    expect(onGoToDay).not.toHaveBeenCalled();
  });

  it('does not page while the reader is scrolling the page', async () => {
    await page.viewport(390, 844);
    const { onGoToDay, viewport } = renderDeck();
    // Mostly vertical: the gesture locks to the axis it started on.
    swipe(viewport, { from: 300, to: 260, y: 600, endY: 120 });
    expect(onGoToDay).not.toHaveBeenCalled();
  });

  it('means the same thing to an Arabic reader, whose next day is the other way', async () => {
    await page.viewport(390, 844);
    const { onGoToDay, viewport } = renderDeck({ lang: 'ar', dir: 'rtl' });
    expect(screen.getByRole('button', { name: new RegExp(t('ar', 'planNextDay')) })).toBeTruthy();
    swipe(viewport, { from: 80, to: 300 });
    expect(onGoToDay).toHaveBeenCalledWith(DAYS.next);
  });

  it('will not step past the last day of the plan', async () => {
    await page.viewport(390, 844);
    const { onGoToDay, viewport } = renderDeck({ nextKey: null });
    swipe(viewport, { from: 300, to: 80 });
    expect(onGoToDay).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: t('fr', 'planNextDay') }).disabled).toBe(true);
  });
});
