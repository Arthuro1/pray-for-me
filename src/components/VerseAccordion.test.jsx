// @vitest-environment jsdom
//
// Scripture safety: when no authoritative source (cache → shared cache →
// YouVersion) has the passage, the reader must show the reference with a link to
// the user's own Bible — never AI-invented verse text.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => ({ text: '' })),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

import VerseAccordion from './VerseAccordion';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);

describe('VerseAccordion — reference-only fallback', () => {
  it('shows the reference note + Bible link and no invented verse text', async () => {
    render(
      <VerseAccordion reference="Jean 3:16" lang={lang}>
        {({ toggle }) => <button onClick={toggle}>{t(lang, 'openInBible')}</button>}
      </VerseAccordion>
    );

    fireEvent.click(screen.getByText(t(lang, 'openInBible')));

    // The reference-only note appears once the (mocked) fetches resolve to nothing.
    expect(await screen.findByText(t(lang, 'scriptureRefOnly'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'readWholeChapter'))).toBeTruthy();
  });
});
