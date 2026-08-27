// @vitest-environment jsdom
//
// The public landing page used to sit behind a full-screen spinner until its
// locale chunk arrived, which made a fast site feel slow to exactly the people
// seeing it for the first time. It now paints the real page immediately from the
// bundled English dictionary and swaps in the visitor's language when it lands —
// and a language they choose later never blanks the page they are reading.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';

// A locale chunk whose arrival we control, so "before it lands" is a real state
// to assert on rather than a race.
const frChunk = vi.hoisted(() => {
  let settle;
  const promise = new Promise((resolve) => { settle = resolve; });
  return { promise, deliver: (value) => settle(value) };
});
vi.mock('./landing/locales/landing-fr.js', () => frChunk.promise);

import LandingPage from './LandingPage';
import enCopy from './landing/locales/landing-en.js';

// The real English dictionary with one unmistakable marker, so the swapped-in
// page has exactly the shape the production chunks have.
const FR_COPY = { ...enCopy, beginLabel: 'Commencer par une prière' };

afterEach(cleanup);
beforeEach(() => {
  localStorage.removeItem('pfm_theme');
  document.documentElement.removeAttribute('data-theme');
});

const renderLanding = () => render(<LandingPage onBeginPrayer={() => {}} onSignIn={() => {}} />);
const deliverFrench = () => act(async () => { frChunk.deliver({ default: FR_COPY }); });

describe('LandingPage — nothing waits for a dictionary', () => {
  it('paints the real page on the first frame, not a spinner', () => {
    localStorage.setItem('pfm_language', 'en');
    renderLanding();
    // Synchronously — no findBy, no await.
    expect(screen.getByText('Begin with a prayer')).toBeTruthy();
    expect(screen.getByText('Bring what is on your heart.')).toBeTruthy();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('shows readable content while a slow locale chunk is still in flight', () => {
    localStorage.setItem('pfm_language', 'fr');
    renderLanding();
    // The French chunk has not resolved, yet the page is fully usable.
    expect(screen.getByText('Begin with a prayer')).toBeTruthy();
    // …and it is labelled as the English it actually is, so a screen reader is
    // never asked to pronounce English words as French.
    expect(document.documentElement.lang).toBe('en');
    // The chosen language's DIRECTION is applied straight away, so the layout
    // never flips once the words change.
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('swaps in the selected language once its chunk arrives', async () => {
    localStorage.setItem('pfm_language', 'fr');
    renderLanding();
    await deliverFrench();

    await waitFor(() => expect(screen.getByText(FR_COPY.beginLabel)).toBeTruthy());
    expect(document.documentElement.lang).toBe('fr');
  });
});

describe('LandingPage — changing language keeps the page', () => {
  it('never blanks what is on screen while the new copy loads', async () => {
    localStorage.setItem('pfm_language', 'en');
    renderLanding();
    const before = screen.getByText('Begin with a prayer');

    fireEvent.click(screen.getByRole('button', { name: /English/ }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: /Français/ }));

    // Still reading the English page — nothing was torn down.
    expect(before.isConnected).toBe(true);
    expect(screen.getByText('Begin with a prayer')).toBeTruthy();
    // Only the language control reports that it is working.
    expect(screen.getByRole('button', { name: /Français/ }).getAttribute('aria-busy')).toBe('true');

    await deliverFrench();
    await waitFor(() => expect(screen.getByText(FR_COPY.beginLabel)).toBeTruthy());
    expect(screen.getByRole('button', { name: /Français/ }).getAttribute('aria-busy')).toBeNull();
  });
});
