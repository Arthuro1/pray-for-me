// @vitest-environment jsdom
//
// AI is strictly opt-in and account-level: consent lives in settings and can be
// granted per-context and revoked everywhere, each recording a content-free
// event. The modal's Accept button grants consent for its context.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});
vi.mock('../lib/analytics', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, track: vi.fn() };
});

import AiConsentModal from './AiConsentModal';
import { grantAiConsent, revokeAiConsent, hasAiConsent } from '../lib/aiConsent';
import usePrayerStore from '../store/prayerStore';
import { track, EVENTS } from '../lib/analytics';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);

beforeEach(() => {
  usePrayerStore.setState({ settings: { language: lang, aiConsentPrayer: false, aiConsentHome: false }, userId: null });
  vi.clearAllMocks();
});

describe('AI consent', () => {
  it('grants consent for a context and records the opt-in', () => {
    grantAiConsent('prayer');
    expect(hasAiConsent('prayer')).toBe(true);
    expect(track).toHaveBeenCalledWith(EVENTS.AI_CONSENT_ENABLED, expect.objectContaining({ source: 'prayer' }));
  });

  it('revokes consent for every context', () => {
    grantAiConsent('prayer');
    grantAiConsent('home');
    revokeAiConsent();
    expect(hasAiConsent('prayer')).toBe(false);
    expect(hasAiConsent('home')).toBe(false);
    expect(track).toHaveBeenCalledWith(EVENTS.AI_CONSENT_REVOKED);
  });

  it('the consent modal grants on Accept and calls back', () => {
    const onAccept = vi.fn();
    render(<AiConsentModal lang={lang} context="prayer" onAccept={onAccept} onCancel={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'aiConsentAccept')));
    expect(onAccept).toHaveBeenCalled();
    expect(hasAiConsent('prayer')).toBe(true);
  });
});
