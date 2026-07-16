// @vitest-environment jsdom
//
// The landing hero leads with three core benefits; the nine-card feature grid is
// folded behind an "Explore all features" toggle. LandingPage uses its own inline
// CONTENT/CORE_BENEFITS dictionaries (not the app i18n), keyed off detectLang(),
// so we pin the language to English via localStorage for deterministic strings.
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import LandingPage from './LandingPage';

afterEach(cleanup);
beforeEach(() => {
  localStorage.setItem('pfm_language', 'en');
});

describe('LandingPage — simplified hero', () => {
  it('surfaces the three core benefits up front', () => {
    render(<LandingPage onGetStarted={() => {}} />);
    expect(screen.getByText('Remember every prayer')).toBeTruthy();
    expect(screen.getByText('Know what to pray today')).toBeTruthy();
    expect(screen.getByText('Record every answer')).toBeTruthy();
  });

  it('folds the full feature grid behind an "Explore all features" toggle', () => {
    render(<LandingPage onGetStarted={() => {}} />);
    // A feature-grid card ("16 languages") is not in the DOM until expanded.
    expect(screen.queryByText('16 languages')).toBeNull();
    fireEvent.click(screen.getByText('Explore all features'));
    expect(screen.getByText('16 languages')).toBeTruthy();
    // Collapsing hides it again.
    fireEvent.click(screen.getByText('Show fewer'));
    expect(screen.queryByText('16 languages')).toBeNull();
  });

  it('shows no example statistics at all (strip removed entirely)', () => {
    render(<LandingPage onGetStarted={() => {}} />);
    // Neither the fake numbers nor their "illustrative data" caption render.
    expect(screen.queryByText(/illustrative data/i)).toBeNull();
    expect(screen.queryByText('Active prayers')).toBeNull();
  });
});

describe('LandingPage — simplified product story', () => {
  it('explains the product in three steps (capture → pray today → remember)', () => {
    render(<LandingPage onGetStarted={() => {}} />);
    expect(screen.getByText('Capture a prayer')).toBeTruthy();
    expect(screen.getByText('Pray what matters today')).toBeTruthy();
    expect(screen.getByText("Remember God's faithfulness")).toBeTruthy();
    // The old category/weekly-plan setup steps are gone.
    expect(screen.queryByText('Set your plan')).toBeNull();
    expect(screen.queryByText(/assign a category/i)).toBeNull();
    expect(screen.queryByText('Step 4')).toBeNull();
  });

  it('uses an outcome-focused CTA', () => {
    render(<LandingPage onGetStarted={() => {}} />);
    expect(screen.getAllByText('Start your private prayer journal').length).toBeGreaterThan(0);
  });

  it('localizes the example Bible references (no English books inside French)', () => {
    localStorage.setItem('pfm_language', 'fr');
    render(<LandingPage onGetStarted={() => {}} />);
    expect(screen.getByText(/Philippiens 4:7/)).toBeTruthy();
    expect(screen.getByText(/Ésaïe 40:31/)).toBeTruthy();
    expect(screen.queryByText(/Philippians/)).toBeNull();
    expect(screen.queryByText(/Isaiah/)).toBeNull();
  });
});
