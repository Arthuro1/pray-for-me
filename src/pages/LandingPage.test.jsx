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

  it('keeps the illustrative sample-stats caption', () => {
    render(<LandingPage onGetStarted={() => {}} />);
    expect(screen.getByText(/illustrative data, not real platform statistics/i)).toBeTruthy();
  });
});
