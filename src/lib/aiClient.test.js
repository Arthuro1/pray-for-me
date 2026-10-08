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
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function limitResponse(code = 'daily_limit', retryAfterSeconds = 60) {
  return new Response(JSON.stringify({ error: 'private prayer diagnostic', code, retryAfterSeconds }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSeconds) },
  });
}

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

  it('forwards an optional abort signal to the network request', async () => {
    acknowledgeAiProvider('account-a');
    const controller = new AbortController();
    const { aiFetch } = await import('./aiClient');
    await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' }, { signal: controller.signal });
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('does not send a request whose signal is already aborted', async () => {
    acknowledgeAiProvider('account-a');
    const controller = new AbortController();
    controller.abort();
    const { aiFetch } = await import('./aiClient');
    await expect(aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' }, { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not send content when cancelled while authentication is still resolving', async () => {
    acknowledgeAiProvider('account-a');
    let resolveSession;
    getSession.mockImplementationOnce(() => new Promise((resolve) => { resolveSession = resolve; }));
    const controller = new AbortController();
    const { aiFetch } = await import('./aiClient');
    const pending = aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' }, { signal: controller.signal });
    controller.abort();
    resolveSession({ data: { session: { access_token: 'test-token', user: { id: 'account-a' } } } });
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('AI limit backoff across features', () => {
  it('reaches the server again after a daily allowance is changed instead of waiting until midnight', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    acknowledgeAiProvider('account-a');
    fetch.mockResolvedValueOnce(limitResponse('daily_limit', 43_200));
    const { aiFetch } = await import('./aiClient');
    const input = { title: 'Wisdom', lang: 'en' };
    expect((await aiFetch('prayer_recommendations', input)).status).toBe(429);
    vi.advanceTimersByTime(60_000);
    expect((await aiFetch('prayer_recommendations', input)).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(['daily_limit', 'rate_limit', 'provider_rate_limit'])('shares a %s response with other features without another network request', async (code) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    acknowledgeAiProvider('account-a');
    fetch.mockResolvedValueOnce(limitResponse(code, 30));
    const { aiFetch } = await import('./aiClient');
    const first = await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' });
    expect(first.status).toBe(429);
    expect((await first.json()).code).toBe(code);

    vi.setSystemTime(new Date('2026-10-08T12:00:07Z'));
    const otherFeature = await aiFetch('scripture_guidance', { title: 'Wisdom', lang: 'en' });
    expect(otherFeature.status).toBe(429);
    expect(otherFeature.headers.get('Retry-After')).toBe('23');
    expect(await otherFeature.json()).toEqual({ code, retryAfterSeconds: 23 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('resumes network requests at the retry deadline', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    acknowledgeAiProvider('account-a');
    fetch.mockResolvedValueOnce(limitResponse('provider_rate_limit', 5));
    const { aiFetch } = await import('./aiClient');
    await aiFetch('translate_texts', { texts: ['Please pray'], lang: 'fr' });
    vi.setSystemTime(new Date('2026-10-08T12:00:05Z'));
    expect((await aiFetch('prayer_recommendations', { title: 'Wisdom', lang: 'en' })).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps backoff separate for authenticated accounts', async () => {
    acknowledgeAiProvider('account-a');
    acknowledgeAiProvider('account-b');
    fetch.mockResolvedValueOnce(limitResponse());
    const { aiFetch } = await import('./aiClient');
    const input = { texts: ['Please pray'], lang: 'fr' };
    await aiFetch('translate_texts', input);
    prayerState.current.userId = 'account-b';
    getSession.mockResolvedValue({ data: { session: { access_token: 'other-token', user: { id: 'account-b' } } } });
    expect((await aiFetch('translate_texts', input)).status).toBe(200);

    prayerState.current.userId = 'account-a';
    getSession.mockResolvedValue({ data: { session: { access_token: 'test-token', user: { id: 'account-a' } } } });
    expect((await aiFetch('translate_texts', input)).status).toBe(429);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps backoff separate for providers', async () => {
    acknowledgeAiProvider('account-a');
    fetch.mockResolvedValueOnce(limitResponse('provider_rate_limit'));
    const { aiFetch } = await import('./aiClient');
    const input = { texts: ['Please pray'], lang: 'fr' };
    await aiFetch('translate_texts', input);
    vi.stubEnv('VITE_AI_PROVIDER', 'ollama');
    expect((await aiFetch('translate_texts', input)).status).toBe(200);
    vi.stubEnv('VITE_AI_PROVIDER', 'anthropic');
    expect((await aiFetch('translate_texts', input)).status).toBe(429);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('clears known limits when consent or account request state resets', async () => {
    acknowledgeAiProvider('account-a');
    fetch.mockResolvedValueOnce(limitResponse());
    const { aiFetch } = await import('./aiClient');
    const { resetAiRequestState } = await import('./aiCore');
    const input = { texts: ['Please pray'], lang: 'fr' };
    await aiFetch('translate_texts', input);
    resetAiRequestState();
    expect((await aiFetch('translate_texts', input)).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not restore a cleared limit from an older in-flight response', async () => {
    acknowledgeAiProvider('account-a');
    let resolveRequest;
    let signalStarted;
    const started = new Promise((resolve) => { signalStarted = resolve; });
    fetch.mockImplementationOnce(() => {
      signalStarted();
      return new Promise((resolve) => { resolveRequest = resolve; });
    });
    const { aiFetch } = await import('./aiClient');
    const { resetAiRequestState } = await import('./aiCore');
    const input = { texts: ['Please pray'], lang: 'fr' };
    const pending = aiFetch('translate_texts', input);
    await started;
    resetAiRequestState();
    resolveRequest(limitResponse());
    expect((await pending).status).toBe(429);
    expect((await aiFetch('translate_texts', input)).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('falls back to a bounded generic backoff for unknown error metadata', async () => {
    acknowledgeAiProvider('account-a');
    fetch.mockResolvedValueOnce(limitResponse('private prayer diagnostic', 999_999));
    const { aiFetch } = await import('./aiClient');
    const input = { texts: ['Please pray'], lang: 'fr' };
    await aiFetch('translate_texts', input);
    const blocked = await aiFetch('translate_texts', input);
    expect(await blocked.json()).toEqual({ code: 'busy', retryAfterSeconds: 86_400 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
