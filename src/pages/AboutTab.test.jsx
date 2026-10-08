// @vitest-environment jsdom
//
// About Qetoret: a reference opens its passage in place, under the row of
// references — the reader stays on the page. One passage is open at a time.
// The author's word reads as a signed letter, and the circles open in place.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => ({ text: 'Que ma prière soit devant ta face comme l’encens', source: 'bundle' })),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));

import AboutTab from './AboutTab';
import usePrayerStore from '../store/prayerStore';
import { localizeRef } from '../content/teaching';
import { localizeCircle } from '../content/intercessionCircles';
import { circleLabelKey } from '../lib/circles';
import { t } from '../i18n';

const lang = 'fr';
const refButton = (ref) => screen.getByRole('button', { name: localizeRef(ref, lang) });

afterEach(cleanup);
beforeEach(() => {
  usePrayerStore.setState({ settings: { language: lang } });
});

describe('AboutTab — Scripture references', () => {
  it('are buttons that unfold the passage in place, not links away', async () => {
    render(<MemoryRouter><AboutTab /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: localizeRef('Psalm 141:2', lang) })).toBeNull();

    const psalm = refButton('Psalm 141:2');
    expect(psalm.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(psalm);
    expect(psalm.getAttribute('aria-expanded')).toBe('true');
    expect(await screen.findByText(/comme l’encens/)).toBeTruthy();
    expect(document.getElementById(psalm.getAttribute('aria-controls'))).toBeTruthy();

    fireEvent.click(psalm);
    expect(psalm.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/comme l’encens/)).toBeNull();
  });

  it('keeps one passage open per section', () => {
    render(<MemoryRouter><AboutTab /></MemoryRouter>);
    fireEvent.click(refButton('Psalm 141:2'));
    fireEvent.click(refButton('Revelation 5:8'));
    expect(refButton('Psalm 141:2').getAttribute('aria-expanded')).toBe('false');
    expect(refButton('Revelation 5:8').getAttribute('aria-expanded')).toBe('true');
  });
});

const follows = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('AboutTab — the author’s word', () => {
  it('tells how Qetoret began in the author’s voice, then its passages, then the prayer and signature', () => {
    render(<MemoryRouter><AboutTab /></MemoryRouter>);
    const section = screen.getByRole('region', { name: t(lang, 'aboutStoryTitle') });
    const paragraphs = t(lang, 'aboutStoryBody').split('\n\n');
    expect(paragraphs.length).toBeGreaterThan(1);
    for (const paragraph of paragraphs) expect(within(section).getByText(paragraph)).toBeTruthy();

    // The Scripture comes straight after the story; the prayer and the
    // signature close the letter after it.
    const lastParagraph = within(section).getByText(paragraphs.at(-1));
    const luke = within(section).getByRole('button', { name: localizeRef('Luke 1:5-17', lang) });
    const prayer = within(section).getByText(t(lang, 'aboutStoryPrayer'));
    const signature = within(section).getByText('Paul');
    expect(follows(lastParagraph, luke)).toBe(true);
    expect(follows(luke, prayer)).toBe(true);
    expect(follows(prayer, signature)).toBe(true);
    expect(within(section).getByRole('button', { name: localizeRef('Ezekiel 22:30', lang) })).toBeTruthy();
    expect(within(section).getByRole('button', { name: localizeRef('James 5:16', lang) })).toBeTruthy();
  });

  it('closes the page, after the circles', () => {
    render(<MemoryRouter><AboutTab /></MemoryRouter>);
    const circles = screen.getByRole('region', { name: t(lang, 'aboutCirclesTitle') });
    const letter = screen.getByRole('region', { name: t(lang, 'aboutStoryTitle') });
    expect(follows(circles, letter)).toBe(true);
    const sections = [...document.querySelectorAll('section')];
    expect(sections.at(-1)).toBe(letter);
  });

  it('is reached from the line of it quoted at the top of the page', () => {
    render(<MemoryRouter><AboutTab /></MemoryRouter>);
    const letter = screen.getByRole('region', { name: t(lang, 'aboutStoryTitle') });
    const quote = screen.getByText(t(lang, 'aboutPullQuote'));
    expect(follows(quote, letter)).toBe(true);
    const read = screen.getByRole('link', { name: t(lang, 'aboutReadLetter') });
    expect(read.getAttribute('href')).toBe(`#${letter.id}`);
    fireEvent.click(read);
    expect(document.activeElement).toBe(letter);
  });

  it('signs with the author’s portrait, over the initial it falls back to', () => {
    render(<MemoryRouter><AboutTab /></MemoryRouter>);
    const section = screen.getByRole('region', { name: t(lang, 'aboutStoryTitle') });
    const portrait = section.querySelector('img[src="/authors/paul.webp"]');
    expect(portrait).toBeTruthy();
    expect(portrait.getAttribute('alt')).toBe('');
    fireEvent.error(portrait);
    expect(section.querySelector('img')).toBeNull();
    expect(within(section).getByText('P')).toBeTruthy();
  });
});

describe('AboutTab — the name', () => {
  it('opens on the Hebrew word and what it means', () => {
    render(<MemoryRouter><AboutTab /></MemoryRouter>);
    const word = screen.getByText('קְטֹרֶת');
    expect(word.getAttribute('lang')).toBe('he');
    expect(word.getAttribute('dir')).toBe('rtl');
    expect(screen.getByText(t(lang, 'aboutHebrewGloss'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'aboutTagline'))).toBeTruthy();
  });
});

describe('AboutTab — the circles', () => {
  const circleButton = (circle) => screen.getByRole('button', { name: new RegExp(t(lang, circleLabelKey(circle))) });

  it('opens one circle at a time, with how to pray in it and a door to its page', () => {
    const onPrayInCircle = vi.fn();
    render(<MemoryRouter><AboutTab onPrayInCircle={onPrayInCircle} /></MemoryRouter>);
    const household = circleButton('household');
    expect(household.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(household);
    expect(household.getAttribute('aria-expanded')).toBe('true');
    const panel = document.getElementById(household.getAttribute('aria-controls'));
    expect(panel).toBeTruthy();
    const content = localizeCircle('household', lang);
    expect(within(panel).getByText(content.summary)).toBeTruthy();
    expect(within(panel).getByRole('link').getAttribute('href')).toBe('/circles/household');

    fireEvent.click(within(panel).getByRole('button', { name: content.cta }));
    expect(onPrayInCircle).toHaveBeenCalledWith('household');

    fireEvent.click(circleButton('nations'));
    expect(household.getAttribute('aria-expanded')).toBe('false');
    expect(circleButton('nations').getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(circleButton('nations'));
    expect(circleButton('nations').getAttribute('aria-expanded')).toBe('false');
  });

  it('lights the rings a chosen circle reaches across, never ranking them', () => {
    render(<MemoryRouter><AboutTab onPrayInCircle={() => {}} /></MemoryRouter>);
    fireEvent.click(circleButton('people'));
    const states = [...document.querySelectorAll('.circle-rings__ring')]
      .map((ring) => ring.getAttribute('class').match(/circle-rings__ring--(\w+)/)[1]);
    // Outermost first: kingdom … self.
    expect(states).toEqual(['outside', 'outside', 'outside', 'outside', 'selected', 'within', 'within']);
  });
});
