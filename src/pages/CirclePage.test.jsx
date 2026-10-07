// @vitest-environment jsdom
//
// A circle inside the app: its teaching as a doorway into prayer, the plans
// that shape prayer in it (authored metadata only), and a way back to where it
// was opened from. Praying opens the composer in that circle — never a prayer
// written on the person's behalf.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

vi.mock('../lib/analytics', async (importOriginal) => ({ ...(await importOriginal()), track: vi.fn() }));

import CirclePage from './CirclePage';
import usePrayerStore from '../store/prayerStore';
import { PLANS } from '../content/prayerPlans';
import { CIRCLE_UI, circleContent } from '../content/intercessionCircles';
import { CIRCLES, circleLabelKey, plansForCircle } from '../lib/circles';
import { canUsePlan } from '../lib/planReview';
import { buildGuidedPlanPrayer } from '../lib/guidedPlan';
import { todayKey } from '../lib/prayedLog';
import { EVENTS, track } from '../lib/analytics';
import { t } from '../i18n';

const lang = 'fr';

// Shows where navigation landed, and with which router state.
function Landed({ name }) {
  const location = useLocation();
  return <p data-testid="landed">{`${name} ${JSON.stringify(location.state)}`}</p>;
}

function renderCircle(circle, { state, onPrayInCircle = vi.fn() } = {}) {
  render(
    <MemoryRouter initialEntries={[{ pathname: `/circles/${circle}`, state }]}>
      <Routes>
        <Route path="/circles/:circleId" element={<CirclePage onPrayInCircle={onPrayInCircle} />} />
        <Route path="/plans" element={<Landed name="plans" />} />
        <Route path="/prayers" element={<Landed name="journal" />} />
        <Route path="/prayers/:id" element={<Landed name="prayer" />} />
      </Routes>
    </MemoryRouter>,
  );
  return { onPrayInCircle };
}

const plansSection = () => screen.getByRole('region', { name: t(lang, 'goDeeper') });

afterEach(cleanup);
beforeEach(() => {
  vi.mocked(track).mockClear();
  usePrayerStore.setState({ prayers: [], categories: [], settings: { language: lang }, loading: false });
});

describe('CirclePage', () => {
  it('teaches the circle in the reader\'s language, as the page heading', () => {
    renderCircle('household');
    expect(screen.getByRole('heading', { level: 1, name: circleContent('household').heading.fr })).toBeTruthy();
    expect(screen.getByText(circleContent('household').formation.fr)).toBeTruthy();
    expect(track).toHaveBeenCalledWith(EVENTS.CIRCLE_TEACHING_OPENED, { source: 'app' });
  });

  // The short teaching ships in 16 languages; the 14 AI-drafted ones say so
  // until a native reviewer signs them (content/intercessionCircles/review.js).
  it('labels an AI-drafted language as a draft translation, never an authored one', async () => {
    renderCircle('household');
    expect(screen.queryByText(CIRCLE_UI.draftTranslation.fr)).toBeNull();
    cleanup();

    usePrayerStore.setState({ settings: { language: 'de' } });
    renderCircle('household');
    expect(await screen.findByText('Vorläufige Übersetzung')).toBeTruthy();
  });

  it('offers all seven circles, marking the one on screen', () => {
    renderCircle('church');
    const nav = screen.getByRole('navigation', { name: t(lang, 'circlesNav') });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(CIRCLES.map((c) => t(lang, circleLabelKey(c))));
    expect(within(nav).getByRole('link', { current: 'page' }).textContent).toBe(t(lang, circleLabelKey('church')));
  });

  it('lists the circle\'s plans from their metadata — its own first, without repeating the circle on each row', () => {
    renderCircle('household');
    const expected = plansForCircle(PLANS.filter((plan) => canUsePlan(plan)), 'household');
    expect(expected.length).toBeGreaterThan(0);
    const rows = within(plansSection()).getAllByRole('button');
    expect(rows).toHaveLength(expected.length);
    expected.forEach((plan, i) => expect(rows[i].textContent).toContain(t(lang, plan.titleKey)));
    expect(within(plansSection()).queryByText(t(lang, circleLabelKey('household')))).toBeNull();
  });

  it('opens a plan\'s details on the Plans page, counted as coming from a circle', () => {
    renderCircle('kingdom');
    fireEvent.click(within(plansSection()).getAllByRole('button')[0]);
    const landed = screen.getByTestId('landed').textContent;
    expect(landed).toContain('plans');
    expect(landed).toContain('"source":"circle"');
    expect(landed).toContain(`"openPlanId":"${plansForCircle(PLANS.filter((plan) => canUsePlan(plan)), 'kingdom')[0].id}"`);
  });

  it('opens a running plan where it is being prayed', () => {
    const plan = PLANS.find((p) => p.id === 'kingdomCome14');
    usePrayerStore.setState({
      prayers: [{ ...buildGuidedPlanPrayer(plan, todayKey(), lang), id: 'run-1', status: 'active' }],
    });
    renderCircle('kingdom');
    const row = within(plansSection()).getAllByRole('button').find((b) => b.textContent.includes(t(lang, plan.titleKey)));
    fireEvent.click(row);
    expect(screen.getByTestId('landed').textContent).toContain('prayer');
  });

  it('prays from the circle: the composer opens in it, with nothing written for the person', () => {
    const { onPrayInCircle } = renderCircle('nations');
    fireEvent.click(screen.getByRole('button', { name: circleContent('nations').cta.fr }));
    expect(onPrayInCircle).toHaveBeenCalledWith('nations', { prompt: undefined });
    expect(track).toHaveBeenCalledWith(EVENTS.CIRCLE_PRAYER_STARTED, { source: 'app' });
  });

  it('returns to the Journal\'s "By circle" view when opened from it', () => {
    renderCircle('self', { state: { from: '/prayers', fromState: { journalView: 'circles' } } });
    const back = screen.getByRole('link', { name: `${t(lang, 'backBtn')}: ${t(lang, 'journal')}` });
    fireEvent.click(back);
    expect(screen.getByTestId('landed').textContent).toBe('journal {"journalView":"circles"}');
  });

  it('returns to the Plans page by default, and never to an outside address', () => {
    renderCircle('self', { state: { from: '//evil.example' } });
    fireEvent.click(screen.getByRole('link', { name: `${t(lang, 'backBtn')}: ${t(lang, 'navPlans')}` }));
    expect(screen.getByTestId('landed').textContent).toContain('plans');
  });

  it('sends an unknown circle back to the Plans page', () => {
    renderCircle('galaxies');
    expect(screen.getByTestId('landed').textContent).toContain('plans');
  });
});
