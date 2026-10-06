// @vitest-environment jsdom
//
// The landing hero names Qetoret and leads with the movements of a life of
// prayer; the nine-card feature grid is folded behind an "Explore all features"
// toggle. Landing marketing copy is loaded from one locale chunk at a time, so
// assertions wait for that boundary.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

import LandingPage from './LandingPage';

afterEach(cleanup);
beforeEach(() => {
  localStorage.setItem('pfm_language', 'en');
  localStorage.removeItem('pfm_theme');
  document.documentElement.removeAttribute('data-theme');
});

describe('LandingPage — Qetoret hero', () => {
  it('names Qetoret and its promise, never the old brand', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Build a life of prayer before God.' })).toBeTruthy();
    expect(screen.getAllByText('Let your prayers rise.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Qetoret').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/Praystead/);
  });

  it('introduces the movements up front: Bring, Carry, Return, Remember', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    for (const movement of ['Bring', 'Carry', 'Return', 'Remember']) {
      expect(await screen.findByRole('heading', { name: movement })).toBeTruthy();
    }
  });

  it('shows the seven Intercession Circles as a widening list, not levels', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    const section = (await screen.findByRole('heading', { name: 'From your heart to the nations' })).closest('section');
    const names = within(section).getAllByRole('listitem').map((li) => li.textContent);
    expect(names).toHaveLength(7);
    expect(names[0]).toMatch(/^My heart/);
    expect(names[6]).toMatch(/^Kingdom & Mission/);
  });

  it('explains the name with Scripture references only — no quoted Bible text', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    const section = (await screen.findByRole('heading', { name: 'Why Qetoret?' })).closest('section');
    for (const ref of ['Psalm 141:2', 'Revelation 5:8', 'Revelation 8:3–4', 'Luke 1:5–25']) {
      expect(within(section).getByText(ref)).toBeTruthy();
    }
    // The app is a tool, never a mediator.
    expect(within(section).getByText(/never a go-between/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Pray without ceasing/);
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
    await screen.findAllByText('Begin with a prayer');
    // Neither the fake numbers nor their "illustrative data" caption render.
    expect(screen.queryByText(/illustrative data/i)).toBeNull();
    expect(screen.queryByText('Active prayers')).toBeNull();
  });
});

describe('LandingPage — simplified product story', () => {
  it('explains the product in three steps (bring → return → record a testimony)', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    expect(await screen.findByText('Bring a prayer')).toBeTruthy();
    expect(screen.getByText('Return to pray')).toBeTruthy();
    expect(screen.getByText('Record a testimony')).toBeTruthy();
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
    const [begin] = await screen.findAllByText('Begin with a prayer');
    fireEvent.click(begin);
    expect(onBeginPrayer).toHaveBeenCalled();
    expect(onSignIn).not.toHaveBeenCalled();
    // Existing users keep a direct "Sign in" path — in the nav, as the hero's
    // secondary action, and in the footer.
    expect(screen.getAllByText(/Sign in/).length).toBeGreaterThanOrEqual(3);
    fireEvent.click(screen.getAllByText('Sign in')[0]);
    expect(onSignIn).toHaveBeenCalled();
    // One invitation, worded the same everywhere: hero, Scripture callout, closing section.
    expect(screen.getAllByText('Begin with a prayer')).toHaveLength(3);
  });

  it('starts the guest prayer flow from the product-preview Pray now button', async () => {
    const onBeginPrayer = vi.fn();
    render(<LandingPage onBeginPrayer={onBeginPrayer} onSignIn={() => {}} />);

    const prayNow = await screen.findByRole('button', { name: 'Pray now' });
    expect(prayNow.getAttribute('tabindex')).toBeNull();

    fireEvent.click(prayNow);

    expect(onBeginPrayer).toHaveBeenCalledTimes(1);
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

describe('LandingPage legacy Night theme', () => {
  it('migrates Night to Dark and keeps the public toggle binary', async () => {
    localStorage.setItem('pfm_theme', 'night');
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);

    await screen.findAllByText('Begin with a prayer');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('pfm_theme')).toBe('dark');

    fireEvent.click(screen.getByTitle('Light mode'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('pfm_theme')).toBe('light');
  });
});

describe('LandingPage language picker', () => {
  it('uses native names, explains partial translations, and closes on Escape', async () => {
    render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
    await screen.findAllByText('Begin with a prayer');

    const toggle = screen.getByRole('button', { name: 'Language: English' });
    fireEvent.click(toggle);

    expect(screen.getByRole('menu', { name: 'Language' })).toBeTruthy();
    expect(screen.getByRole('menuitemradio', { name: /Deutsch/ })).toBeTruthy();
    expect(screen.getByRole('menuitemradio', { name: /Русский.*Translation in progress/ })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'Language' })).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });
});
