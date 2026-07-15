// @vitest-environment jsdom
//
// Scripture safety: when no authoritative source (cache → shared cache →
// YouVersion) has the passage, the reader must show the reference with a link to
// the user's own Bible — never AI-invented verse text.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(),
  fetchVerseText: vi.fn(),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

import VerseAccordion from '../VerseAccordion';
import { fetchScriptureText, fetchVerseText } from '../../lib/verseText';
import { t } from '../../i18n';

const lang = 'fr';
const trigger = ({ toggle }) => <button onClick={toggle}>{t(lang, 'openInBible')}</button>;

beforeEach(() => {
  // Default: no authoritative text available (drives the reference-only path).
  vi.mocked(fetchScriptureText).mockResolvedValue({ text: '' });
  vi.mocked(fetchVerseText).mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);

describe('VerseAccordion — reference-only fallback', () => {
  it('shows the reference note + Bible link and no invented verse text', async () => {
    render(<VerseAccordion reference="Jean 3:16" lang={lang}>{trigger}</VerseAccordion>);

    fireEvent.click(screen.getByText(t(lang, 'openInBible')));

    // The reference-only note appears once the (mocked) fetches resolve to nothing.
    expect(await screen.findByText(t(lang, 'scriptureRefOnly'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'readWholeChapter'))).toBeTruthy();
  });
});

describe('VerseAccordion — passage change', () => {
  it('drops the previous passage and re-fetches when the reference prop changes', async () => {
    // A step reader keeps ONE accordion mounted and swaps the reference between
    // slides; each passage must resolve to its OWN text, never the first slide's.
    vi.mocked(fetchScriptureText).mockImplementation(async ({ reference }) => ({ text: `WORD ${reference}` }));

    const { rerender } = render(
      <VerseAccordion reference="Jean 3:16" lang={lang}>{trigger}</VerseAccordion>
    );
    fireEvent.click(screen.getByText(t(lang, 'openInBible')));
    expect(await screen.findByText(/WORD Jean 3:16/)).toBeTruthy();

    // Advance to the next slide on the same instance.
    rerender(<VerseAccordion reference="Romains 8:28" lang={lang}>{trigger}</VerseAccordion>);
    // The panel collapses and the stale text is gone (no first-slide leak).
    expect(screen.queryByText(/WORD Jean 3:16/)).toBeNull();

    fireEvent.click(screen.getByText(t(lang, 'openInBible')));
    expect(await screen.findByText(/WORD Romains 8:28/)).toBeTruthy();
  });
});
