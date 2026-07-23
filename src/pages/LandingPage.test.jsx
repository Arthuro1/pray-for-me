// @vitest-environment jsdom
//
// The landing hero leads with three core benefits; the nine-card feature grid is
// folded behind an "Explore all features" toggle. Landing marketing copy is
// loaded from one locale chunk at a time, so assertions wait for that boundary.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import LandingPage from './LandingPage';

afterEach(cleanup);
beforeEach(() => {
  localStorage.setItem('pfm_language', 'en');
});

describe('LandingPage — simplified hero', () => {
  it('surfaces the three core benefits up front', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    expect(await screen.findByText('Capture what is on your heart')).toBeTruthy();
    expect(screen.getAllByText('Know what to pray today').length).toBeGreaterThan(0);
    expect(screen.getAllByText("Remember God's faithfulness").length).toBeGreaterThan(0);
    expect(screen.getByText('Bring what is on your heart.')).toBeTruthy();
    expect(screen.getByText('Pray faithfully. Remember God’s faithfulness.')).toBeTruthy();
  });

  it('folds the full feature grid behind an "Explore all features" toggle', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    // A feature-grid card ("16 languages") is not in the DOM until expanded.
    expect(screen.queryByText('16 languages')).toBeNull();
    fireEvent.click(await screen.findByText('Explore all features'));
    expect(screen.getByText('16 languages')).toBeTruthy();
    // Collapsing hides it again.
    fireEvent.click(screen.getByText('Show fewer'));
    expect(screen.queryByText('16 languages')).toBeNull();
  });

  it('shows no example statistics at all (strip removed entirely)', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    await screen.findByText('Begin with a prayer');
    // Neither the fake numbers nor their "illustrative data" caption render.
    expect(screen.queryByText(/illustrative data/i)).toBeNull();
    expect(screen.queryByText('Active prayers')).toBeNull();
  });
});

describe('LandingPage — simplified product story', () => {
  it('explains the product in three steps (capture → pray today → remember)', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    expect(await screen.findByText('Capture a prayer')).toBeTruthy();
    expect(screen.getByText('Pray what matters today')).toBeTruthy();
    expect(screen.getAllByText("Remember God's faithfulness").length).toBeGreaterThan(0);
    // The old category/weekly-plan setup steps are gone.
    expect(screen.queryByText('Set your plan')).toBeNull();
    expect(screen.queryByText(/assign a category/i)).toBeNull();
    expect(screen.queryByText('Step 4')).toBeNull();
  });

  it('leads with a "Begin with a prayer" CTA (pray first, sign up only to save)', async () => {
    const onBeginPrayer = vi.fn();
    const onSignIn = vi.fn();
    render(<LandingPage onBeginPrayer={onBeginPrayer} onSignIn={onSignIn} />);
    // The primary hero CTA invites a prayer moment, not a signup.
    const begin = await screen.findByText('Begin with a prayer');
    fireEvent.click(begin);
    expect(onBeginPrayer).toHaveBeenCalled();
    expect(onSignIn).not.toHaveBeenCalled();
    // Existing users keep a direct "Sign in" path.
    fireEvent.click(screen.getAllByText('Sign in')[0]);
    expect(onSignIn).toHaveBeenCalled();
    // The outcome-focused journal CTA still appears further down the page.
    expect(screen.getAllByText('Start your private prayer journal').length).toBeGreaterThan(0);
  });

  it('localizes the example Bible references (no English books inside French)', async () => {
    localStorage.setItem('pfm_language', 'fr');
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    expect(await screen.findByText(/Philippiens 4:7/)).toBeTruthy();
    expect(screen.getByText(/Ésaïe 40:31/)).toBeTruthy();
    expect(screen.queryByText(/Philippians/)).toBeNull();
    expect(screen.queryByText(/Isaiah/)).toBeNull();
  });
});
