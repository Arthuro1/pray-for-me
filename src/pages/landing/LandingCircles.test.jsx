// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));

import LandingCircles from './LandingCircles';
import en from './locales/landing-en';
import { CIRCLES } from '../../lib/circles';
import { circleContent, CIRCLE_UI } from '../../content/intercessionCircles';
import { track } from '@vercel/analytics';

const copy = en.circles;
const heading = (circle) => circleContent(circle).heading.en;
const option = (i) => screen.getByRole('button', { name: new RegExp(`^${copy.items[i].name}`) });
const ringStates = () => [...document.querySelectorAll('.landing__ring')]
  .map((ring) => ring.getAttribute('class').match(/landing__ring--(rest|selected|within|outside)/)[1]);

function setReducedMotion(reduce) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  setReducedMotion(false);
  window.requestAnimationFrame = (fn) => { fn(); return 0; };
  Element.prototype.scrollIntoView = vi.fn();
});

describe('LandingCircles', () => {
  it('lists the seven circles, inner to outer, as the accessible control', () => {
    render(<LandingCircles lang="en" copy={copy} onBeginPrayer={vi.fn()} />);
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('button')).toHaveLength(CIRCLES.length);
    CIRCLES.forEach((_, i) => expect(option(i).getAttribute('aria-expanded')).toBe('false'));
    // The ring drawing repeats the list for sighted people only.
    expect(document.querySelector('.landing__rings-art').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText(CIRCLE_UI.choose.en)).toBeTruthy();
    // Nothing is open until someone chooses; without IntersectionObserver the
    // rings are simply drawn.
    expect(document.querySelector('.circle-teaching')).toBeNull();
    expect(document.querySelector('.landing__rings-art--static')).toBeTruthy();
  });

  it('opens the chosen circle’s teaching beneath, without leaving the page', () => {
    render(<LandingCircles lang="en" copy={copy} onBeginPrayer={vi.fn()} />);
    fireEvent.click(option(1));
    expect(option(1).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('heading', { name: heading('household') })).toBeTruthy();
    expect(screen.getByText(circleContent('household').formation.en)).toBeTruthy();
    expect(track).toHaveBeenCalledWith('circle_teaching_opened', { source: 'landing' });
  });

  it('switches circles without leaving the previous circle’s words behind', async () => {
    render(<LandingCircles lang="en" copy={copy} onBeginPrayer={vi.fn()} />);
    fireEvent.click(option(1));
    fireEvent.click(option(5));
    expect(option(1).getAttribute('aria-expanded')).toBe('false');
    expect(option(5).getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(screen.getByRole('heading', { name: heading('nations') })).toBeTruthy());
    expect(screen.queryByRole('heading', { name: heading('household') })).toBeNull();
    expect(screen.queryByText(circleContent('household').summary.en)).toBeNull();
    expect(document.querySelectorAll('.circle-teaching')).toHaveLength(1);
  });

  it('previews a circle’s reach on hover or focus, and rests again after', () => {
    render(<LandingCircles lang="en" copy={copy} onBeginPrayer={vi.fn()} />);
    expect(new Set(ringStates())).toEqual(new Set(['rest']));
    fireEvent.focus(option(5)); // Nations — keyboard focus previews like hover
    // Drawn outer first: Kingdom lies outside, Nations is the circle, the rest within reach.
    expect(ringStates()).toEqual(['outside', 'selected', 'within', 'within', 'within', 'within', 'within']);
    fireEvent.blur(option(5));
    expect(new Set(ringStates())).toEqual(new Set(['rest']));
    fireEvent.pointerEnter(option(0));
    expect(ringStates().at(-1)).toBe('selected');
    expect(ringStates().filter((s) => s === 'outside')).toHaveLength(6);
  });

  it('lets the rings themselves be chosen, through generous hit bands', () => {
    render(<LandingCircles lang="en" copy={copy} onBeginPrayer={vi.fn()} />);
    const hits = document.querySelectorAll('.landing__ring-hit');
    expect(hits).toHaveLength(CIRCLES.length);
    fireEvent.click(document.querySelector('.landing__ring-hit--heart'));
    expect(option(0).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('heading', { name: heading('self') })).toBeTruthy();
  });

  it('starts a prayer framed by the chosen circle', () => {
    const onBeginPrayer = vi.fn();
    render(<LandingCircles lang="en" copy={copy} onBeginPrayer={onBeginPrayer} />);
    fireEvent.click(option(3));
    fireEvent.click(screen.getByRole('button', { name: circleContent('church').cta.en }));
    expect(onBeginPrayer).toHaveBeenCalledWith({ circle: 'church', prompt: undefined });
    expect(track).toHaveBeenCalledWith('circle_prayer_started', { source: 'landing' });
  });

  it('begins from a "Pray this" prompt without writing it for the person', async () => {
    const onBeginPrayer = vi.fn();
    render(<LandingCircles lang="en" copy={copy} onBeginPrayer={onBeginPrayer} />);
    fireEvent.click(option(0));
    // A development build shows the draft deep layer (lib/circleReview.js).
    fireEvent.click(screen.getByRole('button', { name: CIRCLE_UI.explore.en }));
    expect(await screen.findByText(CIRCLE_UI.draft.en)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Seven foundations/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Communion with God' }));
    const prompt = 'Teach me to seek You before I seek answers.';
    fireEvent.click(screen.getAllByRole('button', { name: CIRCLE_UI.prayThis.en })[0]);
    expect(onBeginPrayer).toHaveBeenCalledWith({ circle: 'self', prompt });
  });

  it('offers no deeper layer for a circle that has none yet', () => {
    render(<LandingCircles lang="en" copy={copy} onBeginPrayer={vi.fn()} />);
    fireEvent.click(option(6));
    expect(screen.queryByRole('button', { name: CIRCLE_UI.explore.en })).toBeNull();
  });

  it('swaps at once with reduced motion', () => {
    setReducedMotion(true);
    render(<LandingCircles lang="en" copy={copy} onBeginPrayer={vi.fn()} />);
    fireEvent.click(option(1));
    fireEvent.click(option(2));
    expect(document.querySelector('.landing__circle-panel.is-leaving')).toBeNull();
    expect(screen.getByRole('heading', { name: heading('people') })).toBeTruthy();
  });

  it('fades the old words out before the new ones arrive when motion is allowed', () => {
    vi.useFakeTimers();
    try {
      render(<LandingCircles lang="en" copy={copy} onBeginPrayer={vi.fn()} />);
      fireEvent.click(option(1));
      fireEvent.click(option(2));
      expect(document.querySelector('.landing__circle-panel.is-leaving')).toBeTruthy();
      act(() => { vi.advanceTimersByTime(200); });
      expect(document.querySelector('.landing__circle-panel.is-leaving')).toBeNull();
      expect(screen.getByRole('heading', { name: heading('people') })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('teaches in the visitor’s language once its words have arrived (Arabic, right to left)', async () => {
    const ar = (await import('./locales/landing-ar')).default;
    render(<LandingCircles lang="ar" copy={ar.circles} onBeginPrayer={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${ar.circles.items[5].name}`) }));
    expect(await screen.findByRole('heading', { name: 'احمل الأمم أمام الله.' })).toBeTruthy();
    // Never English inside the Arabic page.
    expect(screen.queryByText(heading('nations'))).toBeNull();
  });
});
