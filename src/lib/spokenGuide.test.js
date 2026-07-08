import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// The client reads the Supabase session to attach a bearer token. Stub it out —
// these tests are about response shape and locale, not auth.
vi.mock('./supabase', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) } },
}));

const {
  normalizeSpokenGuideResponse,
  toProxiedAudioUrl,
  normalizeLocale,
  resolveSpokenGuideLocale,
  requestSpokenGuide,
  fetchGuideAudio,
  defaultPrivacyMode,
  SPOKEN_GUIDE_LANGUAGE_AUTO,
  DEFAULT_SPOKEN_GUIDE_LOCALE,
} = await import('./spokenGuide');

// A real backend session id: 32 hex chars.
const FILE = 'a1b2c3d4e5f60718293a4b5c6d7e8f90.mp3';
const PROXY = `/api/spoken-guide?audio=${FILE}`;

// What the PROD serverless function returns: camelCase, audio already proxied.
const prodResponse = (over = {}) => ({
  sessionId: 'sess-1',
  script: 'Let us pray.',
  audioUrl: PROXY,
  audioFormat: 'mp3',
  durationSeconds: 42.5,
  expiresAt: '2026-07-08T12:15:00Z',
  privacyMode: 'summary',
  locale: 'en-US',
  voiceLocale: 'en-US',
  voiceFallbackUsed: false,
  ...over,
});

// What the DEV Vite proxy passes straight through from the private backend:
// snake_case, and the backend's own absolute audio URL.
const devResponse = (over = {}) => ({
  session_id: 'sess-1',
  script: 'Let us pray.',
  audio_url: `http://localhost:3000/audio/${FILE}`,
  audio_format: 'mp3',
  duration_seconds: 42.5,
  expires_at: '2026-07-08T12:15:00Z',
  privacy_mode: 'summary',
  locale: 'en-US',
  voice_locale: 'en-US',
  voice_fallback_used: false,
  ...over,
});

describe('normalizeSpokenGuideResponse', () => {
  it('passes a camelCase (production) response through unchanged', () => {
    const out = normalizeSpokenGuideResponse(prodResponse());
    expect(out.sessionId).toBe('sess-1');
    expect(out.audioUrl).toBe(PROXY);
    expect(out.audioFormat).toBe('mp3');
    expect(out.durationSeconds).toBe(42.5);
    expect(out.expiresAt).toBe('2026-07-08T12:15:00Z');
    expect(out.voiceFallbackUsed).toBe(false);
  });

  it('normalizes a snake_case (local dev) response', () => {
    const out = normalizeSpokenGuideResponse(devResponse());
    expect(out.sessionId).toBe('sess-1');
    expect(out.audioUrl).toBe(PROXY);
    expect(out.audioFormat).toBe('mp3');
    expect(out.durationSeconds).toBe(42.5);
    expect(out.expiresAt).toBe('2026-07-08T12:15:00Z');
  });

  it('turns audio_url into audioUrl', () => {
    const out = normalizeSpokenGuideResponse(devResponse());
    expect(out.audioUrl).toBeTruthy();
    expect(out).not.toHaveProperty('audio_url');
  });

  it('turns session_id into sessionId', () => {
    const out = normalizeSpokenGuideResponse(devResponse({ session_id: 'abc' }));
    expect(out.sessionId).toBe('abc');
    expect(out).not.toHaveProperty('session_id');
  });

  it('turns expires_at / duration_seconds / audio_format into camelCase', () => {
    const out = normalizeSpokenGuideResponse(devResponse());
    expect(out).not.toHaveProperty('expires_at');
    expect(out).not.toHaveProperty('duration_seconds');
    expect(out).not.toHaveProperty('audio_format');
  });

  it('turns voice_fallback_used into voiceFallbackUsed', () => {
    const out = normalizeSpokenGuideResponse(devResponse({ voice_fallback_used: true }));
    expect(out.voiceFallbackUsed).toBe(true);
    expect(out.voiceLocale).toBe('en-US');
  });

  it('prefers camelCase when a response somehow carries both spellings', () => {
    const out = normalizeSpokenGuideResponse({ sessionId: 'camel', session_id: 'snake', script: 'x' });
    expect(out.sessionId).toBe('camel');
  });

  it('defaults voiceFallbackUsed to false when absent', () => {
    const out = normalizeSpokenGuideResponse({ script: 'x' });
    expect(out.voiceFallbackUsed).toBe(false);
  });

  it('yields a null audioUrl when the server produced no audio', () => {
    const out = normalizeSpokenGuideResponse(devResponse({ audio_url: null }));
    expect(out.audioUrl).toBeNull();
  });

  it('returns null for a non-object', () => {
    expect(normalizeSpokenGuideResponse(null)).toBeNull();
    expect(normalizeSpokenGuideResponse('nope')).toBeNull();
  });
});

describe('toProxiedAudioUrl', () => {
  it('keeps an already-proxied production URL', () => {
    expect(toProxiedAudioUrl(PROXY)).toBe(PROXY);
  });

  it('rewrites the dev backend URL to the in-app proxy', () => {
    expect(toProxiedAudioUrl(`http://localhost:3000/audio/${FILE}`)).toBe(PROXY);
  });

  it('never points at the private backend, whatever base URL it used', () => {
    const out = toProxiedAudioUrl(`https://ai-api.example.com/audio/${FILE}`);
    expect(out).toBe(PROXY);
    expect(out).not.toContain('ai-api.example.com');
  });

  it('rejects a file name that is not a generated audio file', () => {
    expect(toProxiedAudioUrl('http://localhost:3000/audio/../../etc/passwd')).toBeNull();
    expect(toProxiedAudioUrl('http://evil.test/pwn.exe')).toBeNull();
    expect(toProxiedAudioUrl('http://localhost:3000/audio/short.mp3')).toBeNull();
  });

  it('rejects empty and non-string input', () => {
    expect(toProxiedAudioUrl('')).toBeNull();
    expect(toProxiedAudioUrl(null)).toBeNull();
    expect(toProxiedAudioUrl(undefined)).toBeNull();
    expect(toProxiedAudioUrl(42)).toBeNull();
  });
});

describe('normalizeLocale', () => {
  it.each([
    ['de_DE', 'de-DE'],
    ['de-de', 'de-DE'],
    ['DE-DE', 'de-DE'],
    ['en-US', 'en-US'],
    ['fr', 'fr'],
    ['  de_DE  ', 'de-DE'],
    ['zh-Hans-CN', 'zh-CN'],
  ])('normalizes %s to %s', (raw, expected) => {
    expect(normalizeLocale(raw)).toBe(expected);
  });

  it.each(['', '   ', 'e', '../../etc', 'de/../..', null, undefined, 42, {}])(
    'rejects %o',
    (raw) => {
      expect(normalizeLocale(raw)).toBeNull();
    }
  );
});

describe('resolveSpokenGuideLocale', () => {
  it('uses the app language when the guide language is "auto"', () => {
    const settings = { language: 'de', spokenGuideLanguage: SPOKEN_GUIDE_LANGUAGE_AUTO };
    expect(resolveSpokenGuideLocale(settings)).toBe('de-DE');
  });

  it('uses the app language when no guide language is set at all', () => {
    expect(resolveSpokenGuideLocale({ language: 'es' })).toBe('es-ES');
  });

  it('maps every app language to a region', () => {
    expect(resolveSpokenGuideLocale({ language: 'en' })).toBe('en-US');
    expect(resolveSpokenGuideLocale({ language: 'fr' })).toBe('fr-FR');
    expect(resolveSpokenGuideLocale({ language: 'pt' })).toBe('pt-BR');
  });

  it('lets an explicit guide language override the app language', () => {
    const settings = { language: 'de', spokenGuideLanguage: 'en-GB' };
    expect(resolveSpokenGuideLocale(settings)).toBe('en-GB');
  });

  it('normalizes an explicit guide language', () => {
    expect(resolveSpokenGuideLocale({ language: 'en', spokenGuideLanguage: 'de_DE' })).toBe('de-DE');
  });

  it('falls back to the app language when the explicit choice is invalid', () => {
    const settings = { language: 'de', spokenGuideLanguage: '!!!' };
    expect(resolveSpokenGuideLocale(settings)).toBe('de-DE');
  });

  it('falls back to navigator.language when no setting is present', () => {
    expect(resolveSpokenGuideLocale({}, 'fr-CA')).toBe('fr-CA');
  });

  it('gives a bare navigator language a region', () => {
    expect(resolveSpokenGuideLocale({}, 'de')).toBe('de-DE');
  });

  it('falls back to en-US when nothing usable is available', () => {
    // `null` means "no navigator language"; `undefined` would consult the real one.
    expect(resolveSpokenGuideLocale({}, null)).toBe(DEFAULT_SPOKEN_GUIDE_LOCALE);
    expect(resolveSpokenGuideLocale({ language: '!!' }, '@@')).toBe(DEFAULT_SPOKEN_GUIDE_LOCALE);
  });

  it('consults the real navigator when the argument is omitted', () => {
    vi.stubGlobal('navigator', { language: 'es-MX' });
    expect(resolveSpokenGuideLocale({})).toBe('es-MX');
    vi.unstubAllGlobals();
  });
});

describe('defaultPrivacyMode', () => {
  it('forces names_only under the low-detail preference', () => {
    expect(defaultPrivacyMode({ spokenGuideLowDetail: true, spokenGuidePrivacyMode: 'full' })).toBe('names_only');
  });

  it('honours a saved mode, else summary', () => {
    expect(defaultPrivacyMode({ spokenGuidePrivacyMode: 'full' })).toBe('full');
    expect(defaultPrivacyMode({})).toBe('summary');
  });
});

// ── requestSpokenGuide: what we send, and what the caller receives ───────────

describe('requestSpokenGuide', () => {
  const tr = (v) => (typeof v === 'string' ? v : '');
  const prayers = [{ title: 'Grace', description: 'A note', prayer_points: [], prayer_categories: [] }];
  const call = (over = {}) =>
    requestSpokenGuide({ prayers, tr, lang: 'en', categories: [], privacyMode: 'summary', ...over });

  const bodyOf = () => JSON.parse(global.fetch.mock.calls[0][1].body);

  beforeEach(() => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => devResponse() }));
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('sends the resolved locale in the payload', async () => {
    await call({ locale: 'de-DE' });
    expect(bodyOf().locale).toBe('de-DE');
  });

  it('normalizes an underscore locale before sending', async () => {
    await call({ locale: 'de_DE' });
    expect(bodyOf().locale).toBe('de-DE');
  });

  it('falls back to en-US when handed an invalid locale', async () => {
    await call({ locale: '../../etc' });
    expect(bodyOf().locale).toBe('en-US');
  });

  it('defaults to en-US when no locale is passed', async () => {
    await call();
    expect(bodyOf().locale).toBe(DEFAULT_SPOKEN_GUIDE_LOCALE);
  });

  it('returns a normalized response even though dev served snake_case', async () => {
    const { ok, data } = await call({ locale: 'en-US' });
    expect(ok).toBe(true);
    expect(data.sessionId).toBe('sess-1');
    expect(data.audioUrl).toBe(PROXY);
  });

  it('returns the error body unchanged rather than a half-normalized success', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 502, json: async () => ({ error: 'Voice service unavailable' }) }));
    const { ok, status, data } = await call();
    expect(ok).toBe(false);
    expect(status).toBe(502);
    expect(data).toEqual({ error: 'Voice service unavailable' });
  });

  it('reports failure without throwing when the app is unreachable', async () => {
    global.fetch = vi.fn(async () => { throw new Error('offline'); });
    const { ok, status, data } = await call();
    expect(ok).toBe(false);
    expect(status).toBe(0);
    expect(data).toBeNull();
  });
});

// ── Server audio preferred; on-device TTS only for genuinely missing audio ───

describe('fetchGuideAudio — the fallback boundary', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('prefers server audio: returns a playable object URL when audio exists', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['audio'], { type: 'audio/mpeg' }) }));
    const url = await fetchGuideAudio(PROXY);
    expect(url).toBe('blob:mock');
    // and it fetched OUR proxy, never the private backend
    expect(global.fetch.mock.calls[0][0]).toBe(PROXY);
  });

  it('falls back (null) when there is no audio URL — the dev bug this fixes', async () => {
    global.fetch = vi.fn();
    const normalized = normalizeSpokenGuideResponse(devResponse({ audio_url: null }));
    expect(await fetchGuideAudio(normalized.audioUrl)).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does NOT fall back merely because dev spelled the key audio_url', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['audio']) }));
    const normalized = normalizeSpokenGuideResponse(devResponse());
    expect(normalized.audioUrl).toBe(PROXY);
    expect(await fetchGuideAudio(normalized.audioUrl)).toBe('blob:mock');
  });

  it('falls back when the audio fetch fails', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 404 }));
    expect(await fetchGuideAudio(PROXY)).toBeNull();
  });

  it('falls back when the audio proxy is unreachable', async () => {
    global.fetch = vi.fn(async () => { throw new Error('offline'); });
    expect(await fetchGuideAudio(PROXY)).toBeNull();
  });

  it('falls back when the server returns an empty body', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob([]) }));
    expect(await fetchGuideAudio(PROXY)).toBeNull();
  });
});
