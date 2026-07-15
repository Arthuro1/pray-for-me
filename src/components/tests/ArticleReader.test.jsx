// @vitest-environment jsdom
//
// ArticleReader stays a generic read-only reader. Its ONLY gospel addition is a
// single, opt-in invitation card at the very bottom — shown only for articles
// that declare relatedJourneyId + journeyInviteKey AND only when the caller wires
// onOpenJourney. Navigation is by STABLE journey id, never translated text.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => ({ text: '' })),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

import ArticleReader from '../ArticleReader';
import { getArticle, pick } from '../../content/teaching';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);

describe('ArticleReader — gospel invitation', () => {
  it('still renders the article content and the Scripture footer', () => {
    render(<ArticleReader article={getArticle('grace')} lang={lang} onClose={() => {}} />);
    expect(screen.getByText(pick(getArticle('grace').sections[0].heading, lang))).toBeTruthy();
    expect(screen.getByText(t(lang, 'growScriptureNote'))).toBeTruthy();
  });

  it('shows a single invitation on a related article and opens the journey by stable id', () => {
    const onOpenJourney = vi.fn();
    render(<ArticleReader article={getArticle('grace')} lang={lang} onClose={() => {}} onOpenJourney={onOpenJourney} />);
    expect(screen.getByText(t(lang, 'gospelInviteGrace'))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'gospelInviteLabel')));
    expect(onOpenJourney).toHaveBeenCalledWith('hope-behind-prayer');
  });

  it('shows no invitation on an unrelated article', () => {
    render(<ArticleReader article={getArticle('lament')} lang={lang} onClose={() => {}} onOpenJourney={() => {}} />);
    expect(screen.queryByText(t(lang, 'gospelInviteLabel'))).toBeNull();
  });

  it('shows no invitation when the caller does not wire onOpenJourney (generic use)', () => {
    render(<ArticleReader article={getArticle('grace')} lang={lang} onClose={() => {}} />);
    expect(screen.queryByText(t(lang, 'gospelInviteLabel'))).toBeNull();
  });
});
