// @vitest-environment jsdom
//
// The Grow tab carries one gentle, optional invitation to the gospel journey. It
// must sit above the Pray/Learn selector, never open automatically, never block
// the existing Pray/Learn sections, and hand off to the EXISTING prayer-creation
// flow. Related Learn articles may point to it; unrelated ones must not.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain, eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => ({ text: '' })),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

import GrowTab from './GrowTab';
import usePrayerStore from '../store/prayerStore';
import { guides, articles, gospelJourney, pick } from '../content/teaching';
import { t } from '../i18n';

const lang = 'fr';
const title = (id) => pick(articles.find((a) => a.id === id).title, lang);

afterEach(cleanup);
beforeEach(() => usePrayerStore.setState({ settings: { language: lang } }));

const openJourneyToEnd = () => {
  fireEvent.click(screen.getByText(t(lang, 'growSeekerCta')));
  fireEvent.click(screen.getByText(t(lang, 'gospelStart')));
  for (let i = 0; i < 6; i++) fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
};

describe('GrowTab — seeker card', () => {
  it('renders the seeker card above the Pray/Learn selector', () => {
    render(<GrowTab />);
    const card = screen.getByText(t(lang, 'growSeekerTitle'));
    const selector = screen.getByText(t(lang, 'growPray'));
    // The card appears before the segmented selector in document order.
    expect(card.compareDocumentPosition(selector) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('does not open the journey automatically', () => {
    render(<GrowTab />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the journey only when the card is selected', () => {
    render(<GrowTab />);
    fireEvent.click(screen.getByText(t(lang, 'growSeekerCta')));
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe(pick(gospelJourney.title, lang));
  });

  it('keeps the Pray and Learn sections working alongside the card', () => {
    render(<GrowTab />);
    // Pray (default) lists prayer guides.
    expect(screen.getByText(pick(guides[0].title, lang))).toBeTruthy();
    // Switch to Learn → theology articles.
    fireEvent.click(screen.getByText(t(lang, 'growLearn')));
    expect(screen.getByText(title('why-pray'))).toBeTruthy();
  });

  it('returns focus to the card after the journey closes', () => {
    render(<GrowTab />);
    const card = screen.getByText(t(lang, 'growSeekerCta')).closest('button');
    card.focus();
    fireEvent.click(card);
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByLabelText(t(lang, 'close')));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(card);
  });

  it('hands the "create a private prayer" step to the existing prayer flow', () => {
    const onCreatePrayer = vi.fn();
    render(<GrowTab onCreatePrayer={onCreatePrayer} />);
    openJourneyToEnd();
    fireEvent.click(screen.getByText(t(lang, 'gospelCreatePrayer')));
    expect(onCreatePrayer).toHaveBeenCalledTimes(1);
    expect(onCreatePrayer.mock.calls[0][0]).toEqual(
      expect.objectContaining({ description: pick(gospelJourney.starterPrompt, lang) })
    );
  });
});

describe('GrowTab — article ↔ journey links', () => {
  it('lets a related Learn article open the gospel journey', () => {
    render(<GrowTab />);
    fireEvent.click(screen.getByText(t(lang, 'growLearn')));
    fireEvent.click(screen.getByText(title('grace')));
    // The related article shows a single, subtle invitation.
    const invite = screen.getByText(t(lang, 'gospelInviteLabel'));
    expect(invite).toBeTruthy();
    fireEvent.click(invite);
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe(pick(gospelJourney.title, lang));
  });

  it('does not add a gospel prompt to unrelated articles', () => {
    render(<GrowTab />);
    fireEvent.click(screen.getByText(t(lang, 'growLearn')));
    fireEvent.click(screen.getByText(title('lament')));
    expect(screen.queryByText(t(lang, 'gospelInviteLabel'))).toBeNull();
  });
});
