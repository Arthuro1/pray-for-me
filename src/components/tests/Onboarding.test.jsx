// @vitest-environment jsdom
//
// Onboarding IS the first prayer: one screen asks what to pray about, saves it
// and goes straight into a prayer session. It must NEVER surface a Supporter
// prompt or gate prayer behind any setup — reminders, AI, groups and planning
// introduce themselves later, in context.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

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

import Onboarding from '../Onboarding';
import usePrayerStore from '../../store/prayerStore';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  usePrayerStore.setState({ prayers: [], categories: [], settings: { language: lang } });
});

// Onboarding must never mention Supporter/Free/Premium/pricing/donations, in any
// language — assert on the rendered text, not on (now-removed) supporter keys.
const expectNoSupporterPrompt = () => {
  expect(document.body.textContent).not.toMatch(/supporter|premium|abonnement/i);
};

describe('Onboarding', () => {
  it('is a single prayer-capture screen with a private-by-default reassurance', () => {
    render(<Onboarding lang={lang} onFinish={vi.fn()} />);
    expect(screen.getByText(t(lang, 'onboardCaptureTitle'))).toBeTruthy();
    expect(screen.getByPlaceholderText(t(lang, 'onboardCapturePlaceholder'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'onboardPrivateNote'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'onboardSaveAndPray'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'onboardLater'))).toBeTruthy();
    expectNoSupporterPrompt();
  });

  it('"I\'ll do this later" finishes without demanding anything', () => {
    const onFinish = vi.fn();
    render(<Onboarding lang={lang} onFinish={onFinish} />);
    fireEvent.click(screen.getByText(t(lang, 'onboardLater')));
    expect(onFinish).toHaveBeenCalled();
  });

  it('saves the first prayer and goes straight into praying it', async () => {
    const addPrayer = vi.fn(async ({ title }) => {
      const prayer = { id: 'p1', title, prayer_categories: [], prayer_points: [] };
      usePrayerStore.setState((s) => ({ prayers: [prayer, ...s.prayers] }));
      return 'p1';
    });
    usePrayerStore.setState({ addPrayer });
    const onFinish = vi.fn();
    render(<Onboarding lang={lang} onFinish={onFinish} />);

    fireEvent.change(screen.getByPlaceholderText(t(lang, 'onboardCapturePlaceholder')), {
      target: { value: 'La santé de ma sœur' },
    });
    fireEvent.click(screen.getByText(t(lang, 'onboardSaveAndPray')));

    expect(addPrayer).toHaveBeenCalledWith({ title: 'La santé de ma sœur' });
    // The prayer session opens on the prayer that was just written…
    expect(await screen.findByText('La santé de ma sœur')).toBeTruthy();
    // …and finishing it (Amen) completes onboarding.
    fireEvent.click(screen.getByText(t(lang, 'amenBtn')));
    await waitFor(() => expect(screen.getByText(t(lang, 'close'))).toBeTruthy());
    fireEvent.click(screen.getByText(t(lang, 'close')));
    expect(onFinish).toHaveBeenCalled();
  });
});
