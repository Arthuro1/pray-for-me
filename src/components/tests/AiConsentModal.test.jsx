// @vitest-environment jsdom
//
// AI is strictly opt-in and account-level: consent lives in settings and can be
// granted per-context and revoked everywhere, each recording a content-free
// event. The modal's Accept button grants consent for its context.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});
vi.mock('../../lib/analytics', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, track: vi.fn() };
});

import AiConsentModal from '../AiConsentModal';
import { grantAiConsent, revokeAiConsent, hasAiConsent } from '../../lib/aiConsent';
import usePrayerStore from '../../store/prayerStore';
import { track, EVENTS } from '../../lib/analytics';
import { t } from '../../i18n';
import { getAiProviderLabel, hasAiProviderAcknowledgement } from '../../lib/aiProvider';

const lang = 'fr';
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

beforeEach(() => {
  vi.stubEnv('VITE_AI_PROVIDER', 'ollama');
  localStorage.clear();
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

  // One disclosure, said once — and nothing informed consent needs is left
  // out: what the AI is (not Scripture, cannot know God's will), what is sent
  // and to whom, that the optional fields are opt-in, and how to withdraw.
  it('discloses what the AI is, what is sent and how to withdraw — each once', () => {
    render(<AiConsentModal lang={lang} context="prayer" onAccept={() => {}} onCancel={() => {}} />);
    const text = screen.getByRole('dialog').textContent;
    expect(text).toContain(t(lang, 'aiPostureFull'));
    expect(text).toContain(t(lang, 'aiConsentBodyPrayer', { provider: getAiProviderLabel() }));
    expect(text).toContain(t(lang, 'aiConsentFooter'));
    expect(text).toMatch(/pas l’Écriture/);
    expect(text).toMatch(/connaître la volonté de Dieu/);
    expect(text).toMatch(/envoyé à Qetoret/);
    expect(text).not.toMatch(/Anthropic|Claude/);
    expect(text).toMatch(/que si vous les incluez/);
    expect(text).toMatch(/Paramètres/);
    // What is sent is said once, not in two paragraphs.
    expect(text.match(/titre/g)).toHaveLength(1);
  });

  it('the consent modal grants on Accept and calls back', () => {
    const onAccept = vi.fn();
    render(<AiConsentModal lang={lang} context="prayer" onAccept={onAccept} onCancel={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'aiConsentAccept')));
    expect(onAccept).toHaveBeenCalled();
    expect(hasAiConsent('prayer')).toBe(true);
  });

  it('requires renewed, account-scoped consent for Claude despite old synced grants', () => {
    vi.stubEnv('VITE_AI_PROVIDER', 'anthropic');
    usePrayerStore.setState({ userId: 'account-a', settings: { language: lang, aiConsentPrayer: true, aiConsentHome: true } });
    expect(hasAiConsent('prayer')).toBe(false);
    expect(hasAiConsent('home')).toBe(false);

    render(<AiConsentModal lang={lang} context="prayer" onAccept={() => {}} onCancel={() => {}} />);
    const text = screen.getByRole('dialog').textContent;
    expect(text).toContain('Claude (Anthropic)');
    expect(text).toContain('texte que vous choisissez de traduire');
    expect(text).not.toContain('{provider}');
    fireEvent.click(screen.getByText(t(lang, 'aiConsentAccept')));
    expect(hasAiConsent('prayer')).toBe(true);
    expect(hasAiConsent('home')).toBe(false);

    usePrayerStore.setState({ userId: 'account-b' });
    expect(hasAiConsent('prayer')).toBe(false);
  });

  it('withdraws the provider acknowledgement along with both context grants', () => {
    vi.stubEnv('VITE_AI_PROVIDER', 'anthropic');
    usePrayerStore.setState({ userId: 'account-a' });
    grantAiConsent('prayer');
    grantAiConsent('home');
    expect(hasAiProviderAcknowledgement('account-a')).toBe(true);
    revokeAiConsent();
    expect(hasAiProviderAcknowledgement('account-a')).toBe(false);
  });
});
