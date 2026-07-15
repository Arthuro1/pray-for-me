// @vitest-environment jsdom
//
// After saving a new prayer the user sees a compact "Saved privately" state.
// Scripture, reminders and sharing are OPTIONAL next steps — never forced. The
// Scripture step only appears once the user explicitly opts in.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Stub Supabase so the ScriptureFirstStep import chain (via the prayer store) is safe.
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

import PrayerSavedStep from '../PrayerSavedStep';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);

const renderStep = (props = {}) =>
  render(
    <MemoryRouter>
      <PrayerSavedStep prayerId="p1" title="Ma prière" description="" lang={lang} onClose={props.onClose || (() => {})} />
    </MemoryRouter>
  );

describe('PrayerSavedStep', () => {
  it('shows a compact "saved privately" confirmation with optional next steps', () => {
    renderStep();
    expect(screen.getByText(t(lang, 'savedPrivately'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'savedOnToday'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'savedOptionalSteps'))).toBeTruthy();
    // The three optional actions are offered…
    expect(screen.getByText(t(lang, 'findScripture'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'setReminderCta'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'shareGroupCta'))).toBeTruthy();
  });

  it('does NOT force Scripture — it opens only when chosen', () => {
    renderStep();
    // Not shown up-front.
    expect(screen.queryByText(t(lang, 'scriptureFirstTitle'))).toBeNull();
    // Opt in explicitly.
    fireEvent.click(screen.getByText(t(lang, 'findScripture')));
    expect(screen.getByText(t(lang, 'scriptureFirstTitle'))).toBeTruthy();
  });

  it('closes when the primary "pray now" action is taken', () => {
    const onClose = vi.fn();
    renderStep({ onClose });
    fireEvent.click(screen.getByText(t(lang, 'prayNowCta')));
    expect(onClose).toHaveBeenCalled();
  });
});
