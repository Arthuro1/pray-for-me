// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const remote = vi.hoisted(() => {
  const unavailable = () => { throw new Error('Public Scripture must resolve without remote services'); };
  return {
    database: vi.fn(unavailable),
    session: vi.fn(unavailable),
    publisher: vi.fn(unavailable),
    fetch: vi.fn(unavailable),
  };
});

vi.mock('../../lib/supabase', () => ({
  supabase: { from: remote.database, auth: { getSession: remote.session } },
}));
vi.mock('../../lib/youversion', () => ({
  youVersionEnabled: () => true,
  fetchYouVersionPassage: remote.publisher,
}));

// Keep the actual reference control, lazy reader, localization, resolver and
// generated Bible bundles together: this is the public reader's real path.
import ScriptureRefButton from '../circles/ScriptureRefButton';
import { localizeRef } from '../../content/teaching/pick';
import { versionForSource } from '../../lib/bibleVersions';
import { getBundledVerse } from '../../lib/verseBundle';
import { isLocaleLoaded, t } from '../../i18n';

// These tests import real locale and Scripture chunks on demand. Allow their
// asynchronous work to finish when the build or broader suite shares the CPU.
const READER_WAIT = { timeout: 10000 };

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('pfm_settings', JSON.stringify({ lowDataMode: true }));
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  vi.stubGlobal('fetch', remote.fetch);
});

afterEach(() => {
  cleanup();
  expect(remote.database).not.toHaveBeenCalled();
  expect(remote.session).not.toHaveBeenCalled();
  expect(remote.publisher).not.toHaveBeenCalled();
  expect(remote.fetch).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const examples = [
  // All missing passages visible in the reported German identity cards.
  ['de', ['Exodus 30:7-8', 'Revelation 5:8', 'Revelation 8:3-4', 'Hebrews 4:14-16', 'Hebrews 10:19-22', '1 Peter 2:9', 'Revelation 1:6']],
  ['en', ['Hebrews 11']],
  ['ru', ['Psalm 141:2']],
  ['id', ['Hebrews 4:14-16']],
  ['am', ['Hebrews 4:14-16']],
  ['sw', ['Hebrews 4:14-16']],
];

describe('landing Scripture reader offline and in low data mode', () => {
  it.each(examples)('opens complete %s passages without sign-in or external requests', async (lang, references) => {
    const { container } = render(
      <div>
        {references.map((reference) => (
          <section key={reference} data-reference={reference}>
            <ScriptureRefButton reference={reference} lang={lang} />
          </section>
        ))}
      </div>,
    );

    for (const reference of references) {
      const section = [...container.querySelectorAll('[data-reference]')]
        .find((node) => node.dataset.reference === reference);
      const localized = localizeRef(reference, lang);
      const expected = await getBundledVerse({ reference: localized, lang });
      expect(expected?.text, `${lang}: ${reference} must be bundled`).toBeTruthy();
      fireEvent.click(within(section).getByRole('button', { name: localized }));
      await waitFor(() => {
        expect(section.querySelector('.scripture-panel__text')?.textContent).toBe(`“${expected.text}”`);
      }, READER_WAIT);
      expect(within(section).getByRole('button', { name: localized }).getAttribute('aria-expanded')).toBe('true');
      expect(within(section).getByTitle(versionForSource('bundle', lang).name)).toBeTruthy();
      expect(within(section).getByRole('link', { name: t(lang, 'readWholeChapter') })).toBeTruthy();
      expect(within(section).queryByText(t(lang, 'scriptureRefOnly'))).toBeNull();
      expect(within(section).queryByText(t(lang, 'scriptureOffline'))).toBeNull();
    }
  }, 30000);

  it('loads the new reader dictionary and clears old text when the language changes', async () => {
    const reference = 'Hebrews 4:14-16';
    const german = await getBundledVerse({ reference, lang: 'de' });
    // Japanese is not used above, so this switch must load a new dictionary
    // rather than inherit a readiness boolean from the previous language.
    expect(isLocaleLoaded('ja')).toBe(false);
    const japanese = await getBundledVerse({ reference, lang: 'ja' });
    expect(german?.text).toBeTruthy();
    expect(japanese?.text).toBeTruthy();
    const { container, rerender } = render(<ScriptureRefButton reference={reference} lang="de" />);
    fireEvent.click(screen.getByRole('button', { name: localizeRef(reference, 'de') }));
    await waitFor(() => expect(container.querySelector('.scripture-panel__text')?.textContent).toBe(`“${german.text}”`), READER_WAIT);

    rerender(<ScriptureRefButton reference={reference} lang="ja" />);
    expect(container.querySelector('.scripture-panel__text')).toBeNull();
    const trigger = screen.getByRole('button', { name: localizeRef(reference, 'ja') });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    await waitFor(() => expect(container.querySelector('.scripture-panel__text')?.textContent).toBe(`“${japanese.text}”`), READER_WAIT);
    expect(isLocaleLoaded('ja')).toBe(true);
    expect(screen.queryByText(`“${german.text}”`)).toBeNull();
    expect(screen.getByTitle(versionForSource('bundle', 'ja').name)).toBeTruthy();
    expect(screen.getByRole('link', { name: t('ja', 'readWholeChapter') })).toBeTruthy();
    expect(screen.queryByRole('link', { name: t('fr', 'readWholeChapter') })).toBeNull();
  }, 30000);
});
