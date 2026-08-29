// @vitest-environment jsdom
//
// Grow as a path: ONE recommended next step leads the page, current progress
// outranks new suggestions, completed guides retire into a collapsed History,
// and the format descriptions read beginner-friendly (no ACTS jargon required).
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
import { guides, pick } from '../content/teaching';
import { markGuideStarted, markGuideCompleted } from '../lib/guideProgress';
import { guideDurationMinutes } from '../lib/guideMeta';
import { t } from '../i18n';

const lang = 'fr';

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  usePrayerStore.setState({ settings: { language: lang }, prayers: [], completions: {}, categories: [] });
});

const renderGrow = () => render(<MemoryRouter><GrowTab /></MemoryRouter>);

describe('GrowTab — one recommended next step', () => {
  it('leads with exactly one next-step card (the first new guide) and folds the rest away', () => {
    renderGrow();
    expect(screen.getByText(t(lang, 'growNextStep'))).toBeTruthy();
    // The recommended guide appears once; the others wait behind Browse all.
    expect(screen.getAllByText(pick(guides[0].title, lang))).toHaveLength(1);
    expect(screen.queryByText(pick(guides[1].title, lang))).toBeNull();
    fireEvent.click(screen.getByText(t(lang, 'growBrowseAll')));
    expect(screen.getByText(pick(guides[1].title, lang))).toBeTruthy();
  });

  it('current progress takes priority: a started guide is the recommendation', () => {
    markGuideStarted(guides[2].id);
    renderGrow();
    expect(screen.getByText(pick(guides[2].title, lang))).toBeTruthy();
    expect(screen.getByText(t(lang, 'growContinueDesc'))).toBeTruthy();
  });

  it('completed guides move into a collapsed History section', () => {
    markGuideCompleted(guides[0].id);
    renderGrow();
    // Not recommended, not visible until History is expanded.
    expect(screen.queryByText(pick(guides[0].title, lang))).toBeNull();
    const history = screen.getByRole('button', { name: `${t(lang, 'growHistory')} (1)` });
    expect(history.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(history);
    expect(history.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(pick(guides[0].title, lang))).toBeTruthy();
    // The next new guide became the recommendation.
    expect(screen.getByText(pick(guides[1].title, lang))).toBeTruthy();
  });
});

describe('GrowTab — recommendation lives in the Pray segment only', () => {
  it('shows the next step in Pray and an authored duration with it', () => {
    renderGrow();
    expect(screen.getByText(t(lang, 'growNextStep'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'aboutMinutes', { n: guideDurationMinutes(guides[0]) }))).toBeTruthy();
  });

  it('switching to Learn removes the guide recommendation — learning content stands alone', () => {
    renderGrow();
    fireEvent.click(screen.getByText(t(lang, 'growLearn')));
    expect(screen.queryByText(t(lang, 'growNextStep'))).toBeNull();
    expect(screen.queryByText(pick(guides[0].title, lang))).toBeNull();
    expect(screen.getByText(t(lang, 'growLearnIntro'))).toBeTruthy();
    // Back to Pray, the recommendation returns.
    fireEvent.click(screen.getByText(t(lang, 'growPray')));
    expect(screen.getByText(t(lang, 'growNextStep'))).toBeTruthy();
  });
});

describe('Prayer-format language — beginner friendly', () => {
  it('describes ACTS as a structured biblical pattern, not just the acronym', () => {
    // The descriptions live in the locale files; assert the copy the session
    // will render so a beginner can choose without knowing the term "ACTS".
    expect(t(lang, 'modeActsDesc').toLowerCase()).toContain('biblique');
    expect(t(lang, 'modeGuidedDesc').length).toBeGreaterThan(10);
    expect(t(lang, 'modeRequestsDesc').toLowerCase()).toContain('cœur');
  });
});
