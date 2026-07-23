// @vitest-environment jsdom
//
// After saving a new prayer the user sees a compact "Saved privately" state with
// ONE decision: pray now (opens a real session on that prayer) or done. The old
// decision-heavy screen (Scripture / reminder / sharing) is gone — those live on
// the prayer detail page instead.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// Stub Supabase so the prayer-store import chain is safe in jsdom.
vi.mock('../../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});
vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));

import PrayerSavedStep from '../PrayerSavedStep';
import usePrayerStore from '../../store/prayerStore';
import { t } from '../../i18n';
import { readActivationProgress } from '../../lib/activationProgress';

const lang = 'fr';
afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  usePrayerStore.setState({ prayers: [], categories: [], settings: { language: lang } });
});

const renderStep = (props = {}) =>
  render(
    <PrayerSavedStep prayerId="p1" title="Ma prière" description="" lang={lang} onClose={props.onClose || (() => {})} />
  );

describe('PrayerSavedStep', () => {
  it('confirms "saved privately" with just pray-now and done', () => {
    renderStep();
    expect(screen.getByText(t(lang, 'savedPrivately'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'savedOnToday'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'prayNowCta'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'doneBtn'))).toBeTruthy();
    // The old optional-step rows are gone.
    expect(screen.queryByText(t(lang, 'savedOptionalSteps'))).toBeNull();
    expect(screen.queryByText(t(lang, 'findScripture'))).toBeNull();
  });

  it('"pray now" actually opens a prayer session on the saved prayer', () => {
    renderStep();
    fireEvent.click(screen.getByText(t(lang, 'prayNowCta')));
    // The session shows the prayer itself, ready to close with Amen.
    expect(screen.getByText('Ma prière')).toBeTruthy();
    expect(screen.getByText(t(lang, 'amenBtn'))).toBeTruthy();
  });

  it('marks the prayer prayed when the session advances past it', () => {
    const markPrayedOn = vi.fn();
    usePrayerStore.setState({ markPrayedOn });
    renderStep();
    fireEvent.click(screen.getByText(t(lang, 'prayNowCta')));
    fireEvent.click(screen.getByText(t(lang, 'amenBtn')));
    expect(markPrayedOn).toHaveBeenCalledWith('p1', expect.any(String));
    expect(readActivationProgress().signals).toContain('session_completed');
  });

  it('closes when done', () => {
    const onClose = vi.fn();
    renderStep({ onClose });
    fireEvent.click(screen.getByText(t(lang, 'doneBtn')));
    expect(onClose).toHaveBeenCalled();
  });

  it('computes audience and protection from the ACTUAL saved prayer, not a placeholder', () => {
    // The optimistic store copy already carries ciphertext markers — the badge
    // must read THIS row: Private audience + a separate Encrypted status.
    usePrayerStore.setState({
      prayers: [{ id: 'p1', title: 'Ma prière', encryption_version: 1, prayer_categories: [], prayer_points: [] }],
    });
    renderStep();
    expect(screen.getByText(t(lang, 'audiencePrivate'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'protEncrypted'))).toBeTruthy();
  });

  it('a plaintext row on a keyless device shows Private WITHOUT claiming encryption', () => {
    usePrayerStore.setState({
      prayers: [{ id: 'p1', title: 'Ma prière', prayer_categories: [], prayer_points: [] }],
    });
    renderStep();
    expect(screen.getByText(t(lang, 'audiencePrivate'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'protEncrypted'))).toBeNull();
  });
});
