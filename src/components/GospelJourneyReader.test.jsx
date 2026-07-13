// @vitest-environment jsdom
//
// The gospel journey reader must be a gentle, optional, Scripture-first reading:
// six sections in order, an optional (collapsed) guided prayer that is clearly NOT
// a saving formula, a private-prayer next step that reuses the existing flow, and
// NO tracking of any spiritual decision. It must never write or publish data.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

// The Scripture reader fetches passage text on expand; keep tests offline and
// prove no AI text is invented (reference-only fallback).
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => ({ text: '' })),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

// Guard: rendering/using the journey must NEVER emit analytics.
const track = vi.fn();
vi.mock('../lib/analytics', () => ({ track: (...a) => track(...a), EVENTS: {} }));

import GospelJourneyReader from './GospelJourneyReader';
import gospelJourney from '../content/teaching/gospelJourney';
import { pick, localizeRef } from '../content/teaching';
import { t } from '../i18n';

const lang = 'fr';
const heading = (i) => pick(gospelJourney.sections[i].heading, lang);

const setup = (props = {}) => {
  const onClose = vi.fn();
  const onCreatePrayer = vi.fn();
  const onOpenArticle = vi.fn();
  const onExplore = vi.fn();
  render(
    <GospelJourneyReader
      journey={gospelJourney}
      lang={lang}
      onClose={onClose}
      onCreatePrayer={onCreatePrayer}
      onOpenArticle={onOpenArticle}
      onExplore={onExplore}
      {...props}
    />
  );
  return { onClose, onCreatePrayer, onOpenArticle, onExplore };
};

const start = () => fireEvent.click(screen.getByText(t(lang, 'gospelStart')));
const cont = () => fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
const toEnd = () => { start(); for (let i = 0; i < 6; i++) cont(); };

afterEach(cleanup);
beforeEach(() => track.mockClear());

describe('GospelJourneyReader', () => {
  it('opens on an intro and reveals the six sections in order', () => {
    setup();
    // Intro first (title, not section 1).
    expect(screen.getByText(pick(gospelJourney.title, lang))).toBeTruthy();
    start();
    for (let i = 0; i < 6; i++) {
      expect(screen.getByText(heading(i))).toBeTruthy();
      expect(screen.getByText(t(lang, 'gospelStep', { n: i + 1, total: 6 }))).toBeTruthy();
      if (i < 5) cont();
    }
  });

  it('renders each section\'s Scripture references through the verse component', async () => {
    setup();
    start();
    // Section 1 rests on Psalm 34:18 (localized) — shown as an expandable pill.
    const ref = localizeRef(gospelJourney.sections[0].refs[0], lang);
    const pill = screen.getByText(ref);
    expect(pill).toBeTruthy();
    // Expanding uses VerseAccordion; with no authoritative text it shows the
    // reference-only note — never invented verse text.
    fireEvent.click(pill);
    expect(await screen.findByText(t(lang, 'scriptureRefOnly'))).toBeTruthy();
  });

  it('keeps the guided prayer collapsed by default and expands it accessibly', () => {
    setup();
    toEnd();
    const toggle = screen.getByText(t(lang, 'gospelUsePrayer'));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // Collapsed → the prayer text and disclaimer are not in the document.
    expect(screen.queryByText('besoin de toi', { exact: false })).toBeNull();
    fireEvent.click(toggle);
    // Expanded → prayer + the "not a formula" disclaimer are both visible.
    expect(screen.getByText(t(lang, 'gospelHidePrayer')).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('besoin de toi', { exact: false })).toBeTruthy();
    expect(screen.getByText('pas une formule', { exact: false })).toBeTruthy();
  });

  it('does not create, publish, or track anything when the prayer is expanded', () => {
    const { onCreatePrayer, onClose } = setup();
    toEnd();
    fireEvent.click(screen.getByText(t(lang, 'gospelUsePrayer')));
    expect(onCreatePrayer).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('creates a private prayer through the passed-in flow, seeded with the editable starter prompt', () => {
    const { onCreatePrayer, onClose } = setup();
    toEnd();
    fireEvent.click(screen.getByText(t(lang, 'gospelCreatePrayer')));
    expect(onCreatePrayer).toHaveBeenCalledTimes(1);
    expect(onCreatePrayer.mock.calls[0][0]).toEqual(
      expect.objectContaining({ description: pick(gospelJourney.starterPrompt, lang) })
    );
    expect(onClose).toHaveBeenCalled(); // steps out so modals never stack
    expect(track).not.toHaveBeenCalled();
  });

  it('links the "I still have questions" panel to real Learn articles by id', () => {
    const { onOpenArticle } = setup();
    toEnd();
    fireEvent.click(screen.getByText(t(lang, 'gospelMoreQuestions')));
    // First question with an article link ("Why did Jesus have to die?" → grace).
    const q = gospelJourney.questions.find((x) => x.articleId);
    const card = screen.getByText(pick(q.heading, lang)).closest('div');
    fireEvent.click(within(card).getByText(t(lang, 'gospelReadMore')));
    expect(onOpenArticle).toHaveBeenCalledWith(q.articleId);
  });

  it('closes on the close button and on Escape', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByLabelText(t(lang, 'close')));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('is a proper modal dialog and moves focus inside on open', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe(pick(gospelJourney.title, lang));
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
