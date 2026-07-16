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
  // Only the Psalm resolves to authoritative English text; everything else has
  // none, exercising the "keep the original pair" fallback.
  vi.mocked(fetchScriptureText).mockImplementation(async ({ reference }) =>
    reference === 'Psalm 23:1' ? { text: 'The LORD is my shepherd', ref: reference } : null,
  );
  vi.mocked(fetchVerseText).mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);

// Enter the straight-through "requests" path so the supplication view (with the
// prayer's own verses) renders.
function openRequests() {
  render(<PrayerSession prayers={[prayer]} categories={[]} lang={lang} tr={tr} onClose={() => {}} onComplete={() => {}} />);
  fireEvent.click(screen.getByText(t(lang, 'modeRequests')));
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
