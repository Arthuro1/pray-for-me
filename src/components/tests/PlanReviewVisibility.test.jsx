// @vitest-environment jsdom
//
// Real approved plans are visible without preview. A test-only draft keeps the
// negative publication checks alive even when no production plan is pending.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => ({ text: '' })),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../../lib/analytics', () => ({ track: vi.fn(), EVENTS: { RESOURCE_OPENED: 'resource_opened' } }));
vi.mock('../../content/prayerPlans', async (importOriginal) => {
  const actual = await importOriginal();
  const fixture = {
    ...actual.PLANS[0], id: 'test-review-draft', titleKey: 'testReviewDraftTitle',
    review: { status: 'needs_review' },
  };
  const plans = [...actual.PLANS, fixture];
  return { ...actual, PLANS: plans, plansByCategory: (input = plans) => actual.plansByCategory(input) };
});

import PrayerJourneys from '../PrayerJourneys';
import usePrayerStore from '../../store/prayerStore';
import { PLANS } from '../../content/prayerPlans';
import { isPlanReviewed, setPlanPreview } from '../../lib/planReview';
import { t } from '../../i18n';

const lang = 'fr';
const drafts = PLANS.filter((plan) => !isPlanReviewed(plan));
const titleOf = (plan) => t(lang, plan.titleKey);

const renderJourneys = () => render(<MemoryRouter><PrayerJourneys lang={lang} /></MemoryRouter>);
const openBrowse = () => fireEvent.click(screen.getByRole('button', { name: t(lang, 'browseJourneys') }));

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv('DEV', false);
  usePrayerStore.setState({ settings: { language: lang }, prayers: [], completions: {}, categories: [] });
});
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllEnvs(); });

describe('approved and draft plans in the journey catalogue', () => {
  it('keeps a real negative fixture after the pending curricula are approved', () => {
    expect(drafts.map((plan) => plan.id)).toEqual(['test-review-draft']);
  });

  it('shows all five approved curricula to an ordinary reader', () => {
    renderJourneys();
    openBrowse();
    for (const id of ['covenant21', 'marriage30', 'freedom30', 'david12', 'discernment28']) {
      expect(screen.getByText(titleOf(PLANS.find((plan) => plan.id === id))), id).toBeTruthy();
    }
    expect(screen.queryByText(t(lang, 'planCoupleReviewPending'))).toBeNull();
  });

  it.each(['covenant21', 'marriage30', 'freedom30', 'david12', 'discernment28'])('opens %s without a draft warning or preview flag', (id) => {
    renderJourneys();
    openBrowse();
    fireEvent.click(screen.getByText(titleOf(PLANS.find((plan) => plan.id === id))));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).not.toContain(t(lang, 'planCoupleReviewHint'));
    expect(screen.getByRole('button', { name: t(lang, 'journeyStartToday') })).toBeTruthy();
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
    fireEvent.click(screen.getByText(titleOf(drafts.find((plan) => plan.id === 'test-review-draft'))));

    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain(t(lang, 'planCoupleReviewHint'));
    // The day-by-day preview is the thing a reviewer came to read.
    expect(dialog.textContent).toContain(t(lang, 'planDayLabel', { n: 1 }));
  });
});
