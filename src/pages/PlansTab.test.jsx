// @vitest-environment jsdom
//
// Prayer plans as a destination of their own: what you're praying through,
// one gentle place to begin, then the whole catalogue open — each plan exactly
// once, nothing behind a "Browse" disclosure.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => ({ text: '' })),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../lib/planAnalytics', async (importOriginal) => ({
  ...(await importOriginal()),
  trackPlansPageViewed: vi.fn(),
  trackPlanDetailOpened: vi.fn(),
}));

import PlansTab from './PlansTab';
import usePrayerStore from '../store/prayerStore';
import { PLANS, PLAN_CATEGORIES, STARTER_PLAN_ID } from '../content/prayerPlans';
import { buildGuidedPlanPrayer } from '../lib/guidedPlan';
import { isPlanReviewed } from '../lib/planReview';
import { trackPlanDetailOpened, trackPlansPageViewed } from '../lib/planAnalytics';
import { todayKey } from '../lib/prayedLog';
import { addDays } from '../lib/schedule';
import { t } from '../i18n';
import { CIRCLES, circleLabelKey, planCircles } from '../lib/circles';

const lang = 'fr';
const planOf = (id) => PLANS.find((plan) => plan.id === id);
const titleOf = (id) => t(lang, planOf(id).titleKey);
const runOf = (planId, startDate, prayerId) => ({
  ...buildGuidedPlanPrayer(planOf(planId), startDate, lang),
  id: prayerId,
  status: 'active',
});
const section = (key) => screen.getByRole('region', { name: t(lang, key) });

function LandedOnCircle() {
  const location = useLocation();
  return <p data-testid="circle-page">{`${location.pathname} ${JSON.stringify(location.state)}`}</p>;
}

const renderPlans = (state) => render(
  <MemoryRouter initialEntries={[{ pathname: '/plans', state }]}>
    <Routes>
      <Route path="/plans" element={<PlansTab />} />
      <Route path="/prayers/:id" element={<p>prayer page</p>} />
      <Route path="/circles/:circleId" element={<LandedOnCircle />} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv('DEV', false);
  vi.mocked(trackPlansPageViewed).mockClear();
  vi.mocked(trackPlanDetailOpened).mockClear();
  usePrayerStore.setState({ settings: { language: lang }, prayers: [], completions: {}, categories: [] });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe('PlansTab', () => {
  it('shows every published plan at once, grouped by need, each exactly once', () => {
    renderPlans();
    const published = PLANS.filter(isPlanReviewed);
    for (const plan of published) expect(screen.getAllByText(titleOf(plan.id)), plan.id).toHaveLength(1);
    for (const category of PLAN_CATEGORIES.filter(({ id }) => published.some((plan) => plan.category === id))) {
      expect(screen.getByRole('heading', { name: t(lang, category.labelKey) }), category.id).toBeTruthy();
    }
    expect(screen.queryByRole('button', { name: t(lang, 'browseJourneys') })).toBeNull();
  });

  // A draft stays in the data catalogue for review preview, but a production
  // reader never sees it — nor a heading that would have nothing under it.
  it('keeps plans awaiting review, and their empty headings, out of production', () => {
    renderPlans();
    const drafts = PLANS.filter((plan) => !isPlanReviewed(plan));
    expect(drafts.length).toBeGreaterThan(0);
    for (const plan of drafts) expect(screen.queryByText(titleOf(plan.id)), plan.id).toBeNull();
    const published = PLANS.filter(isPlanReviewed);
    for (const category of PLAN_CATEGORIES.filter(({ id }) => !published.some((plan) => plan.category === id))) {
      expect(screen.queryByRole('heading', { name: t(lang, category.labelKey) }), category.id).toBeNull();
    }
  });

  it('offers the gentle starter plan — not a fast — to someone new to plans', () => {
    renderPlans();
    const start = section('plansStartHere');
    expect(within(start).getByText(titleOf(STARTER_PLAN_ID))).toBeTruthy();
    expect(within(start).queryByText(titleOf('fast3'))).toBeNull();
  });

  it('lists every running plan under Continue with its day, and opens where it is prayed', () => {
    usePrayerStore.setState({
      prayers: [runOf('altar7', todayKey(), 'run-altar'), runOf('wisdom42', addDays(todayKey(), -3), 'run-wisdom')],
    });
    renderPlans();
    const running = section('guidanceContinue');
    expect(within(running).getByText(titleOf('altar7'))).toBeTruthy();
    expect(within(running).getByText(titleOf('wisdom42'))).toBeTruthy();
    expect(within(running).getByText(t(lang, 'planDayOf', { n: 1, total: 7 }))).toBeTruthy();
    // Someone already praying a plan is past "Start here".
    expect(screen.queryByRole('region', { name: t(lang, 'plansStartHere') })).toBeNull();

    fireEvent.click(within(running).getByText(titleOf('altar7')));
    expect(screen.getByText('prayer page')).toBeTruthy();
  });

  it('retires a finished plan into Completed, offering it again', () => {
    usePrayerStore.setState({ prayers: [runOf('gratitude7', addDays(todayKey(), -30), 'run-done')] });
    renderPlans();
    const completed = section('growHistory');
    expect(within(completed).getByText(titleOf('gratitude7'))).toBeTruthy();
    expect(within(completed).getByText(t(lang, 'prayAgain'))).toBeTruthy();
    expect(screen.getAllByText(titleOf('gratitude7'))).toHaveLength(1);

    fireEvent.click(within(completed).getByText(titleOf('gratitude7')));
    expect(screen.getByRole('dialog', { name: titleOf('gratitude7') })).toBeTruthy();
  });

  it('opens the plan Today handed over, and counts where the visit came from', () => {
    renderPlans({ source: 'today_card', openPlanId: STARTER_PLAN_ID });
    expect(screen.getByRole('dialog', { name: titleOf(STARTER_PLAN_ID) })).toBeTruthy();
    expect(trackPlansPageViewed).toHaveBeenCalledWith('today_card');
    expect(trackPlanDetailOpened).toHaveBeenCalledWith(planOf(STARTER_PLAN_ID), 'today_card');
  });

  it('counts a visit with no known door as direct', () => {
    renderPlans();
    expect(trackPlansPageViewed).toHaveBeenCalledWith('direct');
  });
});

describe('PlansTab — Intercession Circles', () => {
  const nameOf = (circle) => t(lang, circleLabelKey(circle));

  // Plans are browsed by what they are for; the circles are a second, quieter
  // way in — one folded row, not seven doors high on the page.
  it('folds the circles behind one row that opens onto the seven circle pages', () => {
    renderPlans();
    expect(screen.queryByRole('navigation', { name: t(lang, 'exploreByCircle') })).toBeNull();
    const toggle = screen.getByRole('button', { name: t(lang, 'exploreByCircle') });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    const explore = screen.getByRole('navigation', { name: t(lang, 'exploreByCircle') });
    const links = within(explore).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(CIRCLES.map(nameOf));
    fireEvent.click(within(explore).getByRole('link', { name: nameOf('household') }));
    expect(screen.getByTestId('circle-page').textContent).toBe('/circles/household {"from":"/plans"}');
  });

  it('names no circle on catalogue rows', () => {
    renderPlans();
    const catalogue = document.querySelector('.phase-content');
    for (const circle of CIRCLES) expect(within(catalogue).queryByText(nameOf(circle)), circle).toBeNull();
  });

  it('says once, in a plan\'s details, where it forms prayer — never every circle it touches', () => {
    renderPlans();
    const plan = PLANS.find((p) => isPlanReviewed(p) && planCircles(p).circles.length > 1 && p.id !== STARTER_PLAN_ID);
    expect(plan).toBeTruthy();
    fireEvent.click(screen.getByText(titleOf(plan.id)));
    const dialog = screen.getByRole('dialog', { name: titleOf(plan.id) });
    const { primary, circles } = planCircles(plan);
    expect(within(dialog).getByText(t(lang, 'planFormsPrayerIn', { circle: nameOf(primary) }))).toBeTruthy();
    for (const other of circles.slice(1)) expect(dialog.textContent).not.toContain(nameOf(other));
  });
});
