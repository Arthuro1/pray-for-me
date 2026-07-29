// @vitest-environment jsdom
//
// Source-language metadata: defaulted from the active language (nobody is asked
// to pick one), correctable in one tap from inside an existing disclosure, and
// authoritative over the on-device heuristic once stated.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../../lib/supabase', () => {
  const chain = {
    upsert: () => chain, insert: () => chain, update: () => chain, delete: () => chain,
    select: () => chain, eq: () => chain, in: () => chain, order: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
        getUser: async () => ({ data: { user: { id: 'u1' } } }),
      },
      from: () => chain,
      rpc: async () => ({ data: null, error: null }),
    },
  };
});
vi.mock('../../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));

import PrayerForm from '../PrayerForm';
import SourceLanguageField from '../SourceLanguageField';
import usePrayerStore from '../../store/prayerStore';
import { needsTranslationControl, normalizeContentLang, statedSourceLang, suggestedSourceLang } from '../../lib/langHint';
import { t, LANGUAGES } from '../../i18n';

const lang = 'fr';
const labelOf = (code) => LANGUAGES.find((l) => l.code === code).label;

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  usePrayerStore.setState({ prayers: [], categories: [], settings: { language: lang } });
});

describe('the form defaults the language and hides the correction', () => {
  it('defaults to the active interface language without asking anything', () => {
    render(<PrayerForm onClose={() => {}} />);
    // Collapsed by default: no language row until Organize is opened, so the
    // default form gains nothing.
    expect(screen.queryByText(t(lang, 'sourceLangWrittenIn', { name: labelOf(lang) }))).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'moreOptionsLabel')) }));
    expect(screen.getByText(t(lang, 'sourceLangWrittenIn', { name: labelOf(lang) }))).toBeTruthy();
  });

  it('corrects the language without opening any permanent form section', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'moreOptionsLabel')) }));

    // The picker itself is a disclosure — absent until "Change" is pressed.
    const change = screen.getByRole('button', { name: t(lang, 'sourceLangChange') });
    expect(change.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByLabelText(t(lang, 'sourceLangLabel'))).toBeNull();

    fireEvent.click(change);
    expect(change.getAttribute('aria-expanded')).toBe('true');
    const select = screen.getByLabelText(t(lang, 'sourceLangLabel'));
    fireEvent.change(select, { target: { value: 'es' } });

    expect(screen.getByText(t(lang, 'sourceLangWrittenIn', { name: labelOf('es') }))).toBeTruthy();
  });

  it('persists the correction onto the created prayer', async () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(t(lang, 'prayerFieldLabel')), { target: { value: 'Ayúdame' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'moreOptionsLabel')) }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'sourceLangChange') }));
    fireEvent.change(screen.getByLabelText(t(lang, 'sourceLangLabel')), { target: { value: 'es' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'savePrayer') }));

    await vi.waitFor(() => expect(usePrayerStore.getState().prayers.length).toBe(1));
    expect(usePrayerStore.getState().prayers[0].content_language).toBe('es');
  });

  it('reopens an edited prayer on its OWN stored language, not the interface one', () => {
    const edited = { id: 'p1', title: 'Oración', description: '', content_language: 'es', prayer_categories: [], prayer_points: [] };
    render(<PrayerForm editPrayer={edited} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'moreOptionsLabel')) }));
    expect(screen.getByText(t(lang, 'sourceLangWrittenIn', { name: labelOf('es') }))).toBeTruthy();
  });

  it('falls back to the active language for a legacy row with no metadata', () => {
    const legacy = { id: 'p1', title: 'Vieille prière', description: '', prayer_categories: [], prayer_points: [] };
    render(<PrayerForm editPrayer={legacy} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'moreOptionsLabel')) }));
    expect(screen.getByText(t(lang, 'sourceLangWrittenIn', { name: labelOf(lang) }))).toBeTruthy();
  });
});

describe('the heuristic offers, it never overwrites', () => {
  it('shows a suggestion only on a confident disagreement — and applies it only when tapped', () => {
    const onChange = vi.fn();
    const english = 'the lord is my shepherd and my god is with me';
    const { rerender } = render(
      <SourceLanguageField value="fr" onChange={onChange} sampleText={english} lang={lang} />
    );
    // Offered, not applied: the displayed value is still the explicit one.
    expect(screen.getByText(t(lang, 'sourceLangWrittenIn', { name: labelOf('fr') }))).toBeTruthy();
    const suggestion = screen.getByRole('button', { name: t(lang, 'sourceLangLooksLike', { name: labelOf('en') }) });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(suggestion);
    expect(onChange).toHaveBeenCalledWith('en');

    // Once the choice agrees with the reading, the nudge retires itself.
    rerender(<SourceLanguageField value="en" onChange={onChange} sampleText={english} lang={lang} />);
    expect(screen.queryByRole('button', { name: /looks like|dirait/i })).toBeNull();
  });

  it('stays quiet when the heuristic cannot confidently read the text', () => {
    render(<SourceLanguageField value="fr" onChange={() => {}} sampleText="Marie" lang={lang} />);
    expect(suggestedSourceLang('Marie', 'fr')).toBeNull();
    expect(screen.queryByRole('button', { name: /dirait/i })).toBeNull();
  });
});

describe('an explicit language decides the translation control', () => {
  it('exposes Translate for a SHORT prayer the author marked as another language', () => {
    // Three words: the heuristic reads nothing here. The stated language does.
    expect(suggestedSourceLang('Ayúdame Señor hoy', 'en')).toBeNull();
    expect(needsTranslationControl('Ayúdame Señor hoy', 'en', { contentLanguage: 'es' })).toBe(true);
  });

  it('offers nothing when the stated language already matches the reader', () => {
    expect(needsTranslationControl('Ayúdame Señor hoy', 'es', { contentLanguage: 'es' })).toBe(false);
    // ...even if a stale cached translation exists: the author's statement wins.
    expect(needsTranslationControl('Ayúdame Señor hoy', 'es', { contentLanguage: 'es', hasCachedTranslation: true })).toBe(false);
  });

  it('keeps the heuristic fallback for legacy rows that carry no metadata', () => {
    expect(needsTranslationControl('the lord is my shepherd and my god', 'fr')).toBe(true);
    expect(needsTranslationControl('Marie', 'fr')).toBe(false);
  });

  it('normalizes stored tags to a supported code and rejects unknown ones', () => {
    expect(normalizeContentLang('en-GB')).toBe('en');
    expect(normalizeContentLang('PT_BR')).toBe('pt');
    expect(normalizeContentLang('kl')).toBeNull();
    expect(normalizeContentLang(null)).toBeNull();
    // An unsupported tag must not masquerade as a mismatch.
    expect(needsTranslationControl('Marie', 'fr', { contentLanguage: 'kl' })).toBe(false);
  });

  it('prefers the stated language over the heuristic when they disagree', () => {
    const englishText = 'the lord is my shepherd and my god';
    expect(statedSourceLang(englishText)).toBe('en');
    expect(statedSourceLang(englishText, 'fr')).toBe('fr');
  });
});

describe('the community request form carries the same control', () => {
  it('passes the corrected language to the group write', () => {
    const onCommunitySubmit = vi.fn();
    render(<PrayerForm communityMode onClose={() => {}} onCommunitySubmit={onCommunitySubmit} />);
    fireEvent.change(screen.getByLabelText(t(lang, 'prayerSubject')), { target: { value: 'Oración' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'sourceLangChange') }));
    fireEvent.change(screen.getByLabelText(t(lang, 'sourceLangLabel')), { target: { value: 'es' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'add') }));

    expect(onCommunitySubmit).toHaveBeenCalledWith(expect.objectContaining({ contentLanguage: 'es' }));
  });
});

describe('the correction is a 44px, keyboard-operable control', () => {
  it('uses native button/select semantics with an accessible name', () => {
    render(<SourceLanguageField value="fr" onChange={() => {}} sampleText="" lang={lang} />);
    const change = screen.getByRole('button', { name: t(lang, 'sourceLangChange') });
    expect(change.tagName).toBe('BUTTON');
    expect(change.getAttribute('type')).toBe('button');
    expect(change.className).toMatch(/min-h-\[44px\]/);

    fireEvent.click(change);
    const panel = document.getElementById(change.getAttribute('aria-controls'));
    expect(panel).toBeTruthy();
    const select = within(panel).getByLabelText(t(lang, 'sourceLangLabel'));
    expect(select.tagName).toBe('SELECT');
    expect(select.className).toMatch(/min-h-\[44px\]/);
  });
});
