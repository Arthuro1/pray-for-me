// @vitest-environment jsdom
//
// "Pray through my altar": an optional order for the session's requests —
// circle by circle, inner to outer, unplaced prayers last — beside the prayer
// format, off by default and remembered. The walk crosses a quiet threshold
// into each circle (no card, no extra step) and ends as one carried altar,
// never as a count of circles.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/verseText', () => ({ fetchScriptureText: vi.fn(async () => null), fetchVerseText: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../../lib/audio/backgroundAudio', () => ({
  AUDIO_TRACKS: [{ id: 'silence', src: null, labelKey: 'audioSilence' }],
  DEFAULT_AUDIO_TRACK_ID: 'silence',
  resolveTrack: () => ({ id: 'silence', src: null, labelKey: 'audioSilence' }),
  startBackgroundInstrumental: vi.fn(async () => ({ started: false, trackId: 'silence' })),
  stopBackgroundAudio: vi.fn(async () => {}),
}));

import PrayerSession from '../PrayerSession';
import { circleContent } from '../../content/intercessionCircles';
import { t } from '../../i18n';

const lang = 'en';
const tr = (text) => text;
const prayer = (id, title, extra = {}) => ({ id, title, description: '', prayer_categories: [], prayer_points: [], ...extra });

// Given in the order Today would list them — not the order of the circles.
const TODAY = [
  prayer('loose', 'For a hard week'),
  prayer('nation', 'For Sudan', { circle: 'nations' }),
  prayer('home', 'For my sister', { circle: 'household' }),
  prayer('heart', 'For patience', { circle: 'self' }),
];

const open = (props = {}) => render(
  <PrayerSession prayers={TODAY} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} {...props} />,
);
const openFormats = () => fireEvent.click(screen.getByTitle(t(lang, 'prayerFormat')));
const altarSwitch = () => screen.getByRole('switch', { name: t(lang, 'prayThroughAltar') });
const next = () => fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
const title = () => document.querySelector('.prayer-session__title').textContent;
const threshold = () => document.querySelector('.prayer-session__threshold');

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('PrayerSession — Pray through my altar', () => {
  it('keeps the usual order by default, the altar order one switch away', () => {
    open();
    expect(title()).toBe('For a hard week');
    expect(threshold()).toBeNull();
    openFormats();
    expect(altarSwitch().getAttribute('aria-checked')).toBe('false');
  });

  it('walks circle by circle, crossing a quiet threshold into each, and is remembered', () => {
    const onPrayed = vi.fn();
    open({ onPrayed });
    openFormats();
    fireEvent.click(altarSwitch());
    expect(localStorage.getItem('pfm_prayer_order')).toBe('altar');

    // My heart first: its name and its call open the walk, with the prayer.
    expect(title()).toBe('For patience');
    expect(threshold().textContent).toContain(t(lang, 'circle_self'));
    expect(threshold().textContent).toContain(circleContent('self').heading.en);
    next();
    expect(title()).toBe('For my sister');
    expect(threshold().textContent).toContain(t(lang, 'circle_household'));
    next();
    expect(title()).toBe('For Sudan');
    next();
    // Prayers without a circle come last, under "Also on your heart".
    expect(title()).toBe('For a hard week');
    expect(threshold().textContent).toContain(t(lang, 'altarAlsoOnHeart'));
    expect(onPrayed.mock.calls.map(([id]) => id)).toEqual(['heart', 'home', 'nation']);

    cleanup();
    open();
    expect(title()).toBe('For patience');
  });

  it('crosses a threshold only into a new circle, never between two prayers of the same one', () => {
    localStorage.setItem('pfm_prayer_order', 'altar');
    render(
      <PrayerSession
        prayers={[prayer('a', 'First', { circle: 'church' }), prayer('b', 'Second', { circle: 'church' })]}
        categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}}
      />,
    );
    expect(threshold().textContent).toContain(t(lang, 'circle_church'));
    next();
    expect(title()).toBe('Second');
    expect(threshold()).toBeNull();
    // The circle still shows in the quiet context line.
    expect(screen.getByText(t(lang, 'circle_church'))).toBeTruthy();
  });

  it('ends as one carried altar — never a count of circles', () => {
    localStorage.setItem('pfm_prayer_order', 'altar');
    open();
    next();
    next();
    next();
    fireEvent.click(screen.getByText(t(lang, 'amenBtn'))); // the last prayer
    expect(screen.getByRole('heading', { name: t(lang, 'altarCarriedTitle') })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\d+\s*\/\s*7/);
    expect(screen.getByText(t(lang, 'remainWithGod'))).toBeTruthy();
  });

  it('keeps the order a walk began with — a change after the first step applies next time', () => {
    open();
    next(); // past "For a hard week"
    openFormats();
    fireEvent.click(altarSwitch());
    expect(screen.getByText(t(lang, 'prayThroughAltarNextTime'))).toBeTruthy();
    expect(title()).toBe('For Sudan');
    expect(threshold()).toBeNull();
    expect(localStorage.getItem('pfm_prayer_order')).toBe('altar');
  });

  it('is not offered where the order would change nothing', () => {
    render(
      <PrayerSession
        prayers={[prayer('a', 'One'), prayer('b', 'Two')]}
        categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}}
      />,
    );
    openFormats();
    expect(screen.queryByRole('switch', { name: t(lang, 'prayThroughAltar') })).toBeNull();
    cleanup();

    // Nor where formats are not offered at all (the guest's first prayer).
    localStorage.setItem('pfm_prayer_order', 'altar');
    open({ allowFormats: false });
    expect(title()).toBe('For a hard week');
    expect(threshold()).toBeNull();
  });
});
