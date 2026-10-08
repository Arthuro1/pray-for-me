// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { acknowledgeAiProvider, clearAiProviderAcknowledgement } from './aiProvider';

const { getSession, prayerState } = vi.hoisted(() => ({ getSession: vi.fn(), prayerState: { current: null } }));
vi.mock('./supabase', () => ({ supabase: { auth: { getSession } } }));
vi.mock('../store/prayerStore', () => ({ default: { getState: () => prayerState.current } }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_AI_PROVIDER', 'anthropic');
  vi.stubEnv('VITE_AI_GATEWAY_URL', '');
  localStorage.clear();
  prayerState.current = { userId: 'account-a', settings: { aiConsentPrayer: true, aiConsentHome: false } };
  getSession.mockResolvedValue({ data: { session: { access_token: 'test-token', user: { id: 'account-a' } } } });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 })));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('AI provider request boundary', () => {
  it('blocks automatic translation before fetch when the account has not acknowledged Claude', async () => {
    const { aiFetch } = await import('./aiClient');
    const result = await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' });
    expect(result.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('cannot use another account’s provider acknowledgement', async () => {
    acknowledgeAiProvider('account-b');
    const { aiFetch } = await import('./aiClient');
    expect((await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' })).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('forwards the finite task with the authenticated token and acknowledged provider', async () => {
    acknowledgeAiProvider('account-a');
    const { aiFetch } = await import('./aiClient');
    const input = { title: 'Wisdom', description: '', lang: 'en' };
    await aiFetch('scripture_guidance', input);
    expect(fetch).toHaveBeenCalledWith('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token', 'X-Qetoret-AI-Provider': 'anthropic' },
      body: JSON.stringify({ task: 'scripture_guidance', input }),
    });
    clearAiProviderAcknowledgement('account-a');
    expect((await aiFetch('scripture_guidance', input)).status).toBe(403);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('blocks translation after synced revocation even when this device retains the provider proof', async () => {
    acknowledgeAiProvider('account-a');
    prayerState.current.settings.aiConsentPrayer = false;
    const { aiFetch } = await import('./aiClient');
    expect((await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' })).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('blocks during an account switch until the loaded settings match the authenticated user', async () => {
    acknowledgeAiProvider('account-a');
    prayerState.current.userId = 'account-b';
    const { aiFetch } = await import('./aiClient');
    expect((await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' })).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the private gateway path without requiring a new acknowledgement', async () => {
    vi.stubEnv('VITE_AI_PROVIDER', 'ollama');
    const { aiFetch } = await import('./aiClient');
    expect((await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' })).status).toBe(200);
    expect(fetch.mock.calls[0][1].headers['X-Qetoret-AI-Provider']).toBe('ollama');
  });

  it('keeps the existing CORS header contract when posting directly to a configured gateway', async () => {
    vi.stubEnv('VITE_AI_PROVIDER', 'ollama');
    vi.stubEnv('VITE_AI_GATEWAY_URL', 'https://gateway.example/');
    acknowledgeAiProvider('account-a');
    const { aiFetch } = await import('./aiClient');
    await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' });
    expect(fetch.mock.calls[0][0]).toBe('https://gateway.example/v1/tasks');
    expect(fetch.mock.calls[0][1].headers['X-Qetoret-AI-Provider']).toBeUndefined();
  });

  it('keeps Claude on the same-origin handler despite an old gateway override', async () => {
    vi.stubEnv('VITE_AI_GATEWAY_URL', 'https://old-gateway.example');
    acknowledgeAiProvider('account-a');
    const { aiFetch } = await import('./aiClient');
    await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' });
    expect(fetch.mock.calls[0][0]).toBe('/api/ai');
    expect(fetch.mock.calls[0][1].headers['X-Qetoret-AI-Provider']).toBe('anthropic');
  });
});
