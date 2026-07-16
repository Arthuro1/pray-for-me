// @vitest-environment jsdom
//
// "Pray now" walks today's prayers, and each prayer point may cite Scripture.
// Verses are stored in the language the prayer was created in, so the session must
// show each citation and its text in ONE language: the reader's when authoritative
// text is available for it, otherwise the original — but never a localized
// reference paired with stale, differently-languaged text.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(),
  fetchVerseText: vi.fn(),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

import PrayerSession from '../PrayerSession';
import { fetchScriptureText, fetchVerseText } from '../../lib/verseText';
import { t } from '../../i18n';

const lang = 'en';
const tr = (text) => text; // personal prayers pass through unchanged in these tests

// A prayer created in French: one point cites a Psalm we CAN resolve to
// authoritative English text, one cites a verse we cannot (no edition mocked).
const prayer = {
  id: 'p1',
  title: 'Pour ma famille',
  description: '',
  prayer_categories: [],
  for_other: false,
  prayer_points: [
    { id: 'pt1', title: 'Confiance', verses: [{ ref: 'Psaume 23:1', text: 'L’Éternel est mon berger' }] },
    { id: 'pt2', title: 'Amour', verses: [{ ref: 'Jean 3:16', text: 'Car Dieu a tant aimé le monde' }] },
  ],
};

beforeEach(() => {
  localStorage.clear();
  // Only the Psalm resolves to authoritative English text; everything else has
  // none, exercising the "keep the original pair" fallback.
  vi.mocked(fetchScriptureText).mockImplementation(async ({ reference }) =>
    reference === 'Psalm 23:1' ? { text: 'The LORD is my shepherd', ref: reference } : null,
  );
  vi.mocked(fetchVerseText).mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);

// The session starts straight in the "requests" path (no upfront picker), so the
// supplication view (with the prayer's own verses) renders immediately.
function openRequests(props = {}) {
  render(<PrayerSession prayers={[prayer]} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} {...props} />);
}

describe('PrayerSession — Scripture localization', () => {
  it('shows authoritative text and a localized reference when one is available', async () => {
    openRequests();
    expect(await screen.findByText(/The LORD is my shepherd/)).toBeTruthy();
    expect(screen.getByText(/Psalm 23:1/)).toBeTruthy();
    // The stored French wording/citation is fully replaced — no stale leak.
    expect(screen.queryByText(/L’Éternel est mon berger/)).toBeNull();
    expect(screen.queryByText(/Psaume 23:1/)).toBeNull();
  });

  it('keeps the reference and text in ONE language when no authoritative text exists', async () => {
    openRequests();
    // John 3:16 has no mocked English edition: rather than pair a localized "John
    // 3:16" with untranslatable French text, both stay in the original language.
    expect(await screen.findByText(/Car Dieu a tant aimé le monde/)).toBeTruthy();
    expect(screen.getByText(/Jean 3:16/)).toBeTruthy();
    expect(screen.queryByText(/John 3:16/)).toBeNull();
  });
});

describe('PrayerSession — immediate start & format control', () => {
  it('starts directly on the first prayer, with no upfront mode picker', () => {
    openRequests();
    // The prayer content is already on screen; the old intro title is gone.
    expect(screen.getByText('Pour ma famille')).toBeTruthy();
    // No Back button on the very first step (there is no picker to return to).
    expect(screen.queryByText(t(lang, 'backBtn'))).toBeNull();
  });

  it('offers Guided/ACTS under the Prayer format control and remembers the choice', () => {
    openRequests();
    fireEvent.click(screen.getByTitle(t(lang, 'prayerFormat')));
    fireEvent.click(screen.getByText(t(lang, 'modeActs')));
    // ACTS opens with the adoration movement, and the choice persists.
    expect(screen.getByText(t(lang, 'stageAdoration'))).toBeTruthy();
    expect(localStorage.getItem('pfm_prayer_mode')).toBe('acts');
    cleanup();
    // A new session reopens straight into the remembered format.
    openRequests();
    expect(screen.getByText(t(lang, 'stageAdoration'))).toBeTruthy();
  });

  it('records each prayer as prayed when the user advances past it', () => {
    const onPrayed = vi.fn();
    const onComplete = vi.fn();
    const two = [prayer, { ...prayer, id: 'p2', title: 'Pour un ami', prayer_points: [] }];
    render(<PrayerSession prayers={two} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={onComplete} onPrayed={onPrayed} />);
    fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
    // Progress is kept even though the session isn't finished.
    expect(onPrayed).toHaveBeenCalledWith('p1');
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(t(lang, 'amenBtn')));
    expect(onPrayed).toHaveBeenCalledWith('p2');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
