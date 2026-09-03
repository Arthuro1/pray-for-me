// @vitest-environment jsdom
//
// The curricula awaiting sign-off (covenant21, marriage30, freedom30, david12)
// have to be readable by the human who reviews and corrects them, and invisible
// to everyone else. Review mode is the whole difference: it never edits a
// review record, so a draft on screen still says it is a draft.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => ({ text: '' })),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../../lib/analytics', () => ({ track: vi.fn(), EVENTS: { RESOURCE_OPENED: 'resource_opened' } }));

import PrayerJourneys from '../PrayerJourneys';
import usePrayerStore from '../../store/prayerStore';
import { PLANS } from '../../content/prayerPlans';
import { setPlanPreview } from '../../lib/planReview';
import { t } from '../../i18n';

const lang = 'fr';
const drafts = PLANS.filter((plan) => plan.review?.status === 'needs_review');
const titleOf = (plan) => t(lang, plan.titleKey);

const renderJourneys = () => render(<MemoryRouter><PrayerJourneys lang={lang} /></MemoryRouter>);
const openBrowse = () => fireEvent.click(screen.getByRole('button', { name: t(lang, 'browseJourneys') }));

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv('DEV', false);
  usePrayerStore.setState({ settings: { language: lang }, prayers: [], completions: {}, categories: [] });
});
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllEnvs(); });

describe('draft plans in the journey catalogue', () => {
  it('guards the premise: relationship, freedom and David curricula are drafts', () => {
    expect(drafts.map((plan) => plan.id).sort()).toEqual(['covenant21', 'david12', 'freedom30', 'marriage30']);
  });

  it('shows an ordinary reader none of them', () => {
    renderJourneys();
    openBrowse();
    for (const plan of drafts) expect(screen.queryByText(titleOf(plan)), plan.id).toBeNull();
  });

  it('shows every one of them to a reviewer, each marked as a draft', () => {
    setPlanPreview(true);
    renderJourneys();
    openBrowse();

    for (const plan of drafts) expect(screen.getByText(titleOf(plan)), plan.id).toBeTruthy();
    expect(screen.getAllByText(t(lang, 'planCoupleReviewPending')).length).toBe(drafts.length);
  });

  it('still never puts a draft forward as the recommendation', () => {
    setPlanPreview(true);
    renderJourneys();
    // The one journey offered before Browse is opened is a reviewed one.
    const featured = screen.getByText(t(lang, 'guidanceForYou')).closest('div');
    for (const plan of drafts) expect(featured.textContent, plan.id).not.toContain(titleOf(plan));
  });

  it('opens a draft for reading, and says why it is not shipped', () => {
    setPlanPreview(true);
    renderJourneys();
    openBrowse();
    fireEvent.click(screen.getByText(titleOf(drafts[0])));

    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain(t(lang, 'planCoupleReviewHint'));
    // The day-by-day preview is the thing a reviewer came to read.
    expect(dialog.textContent).toContain(t(lang, 'planDayLabel', { n: 1 }));
  });
});
