import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from './spoken-guide.js';

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    send(payload) { this.body = payload; return this; },
  };
}

const prayer = (over = {}) => ({
  title: 'Grace for the week',
  details: 'Detailed private struggle text',
  summary: 'A short summary',
  category: 'Family',
  name: 'Daniel',
  ...over,
});

const validBody = (over = {}) => ({
  mode: 'driving',
  privacyMode: 'summary',
  voice: 'calm',
  length: 'short',
  includeScripture: false,
  readFullDetails: false,
  locale: 'en',
  audioFormat: 'mp3',
  prayers: [prayer()],
  ...over,
});

function req({ method = 'POST', auth = 'Bearer good-token', body = validBody(), query = {} } = {}) {
  return { method, headers: { authorization: auth }, body, query };
}

function installFetch({ authOk = true, userId = 'user-1', rpcOk = true, backend = 'ok', backendExtra = {} } = {}) {
  let rpcCount = 0;
  global.fetch = vi.fn(async (url, opts) => {
    const u = String(url);
    if (u.includes('/auth/v1/user')) {
      return { ok: authOk, json: async () => (authOk ? { id: userId } : {}) };
    }
    if (u.includes('/rpc/check_ai_rate_limit')) {
      if (!rpcOk) return { ok: false, status: 500, json: async () => ({}) };
      const { p_max } = JSON.parse(opts.body);
      rpcCount += 1;
      return { ok: true, status: 200, json: async () => rpcCount <= p_max };
    }
    if (backend === 'throw') throw new Error('backend down');
    if (backend === 'error500') {
      return { ok: false, status: 500, json: async () => ({ error: 'script leaked: Detailed private struggle text' }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        session_id: 'abc123def4567890',
        script: 'Let us begin a short time of prayer.',
        audio_url: 'https://ai.example.com/audio/abc123def4567890.mp3',
        audio_format: 'mp3',
        duration_seconds: 30,
        expires_at: '2026-07-08T00:15:00Z',
        privacy_mode: 'summary',
        locale: 'en-US',
        voice_locale: 'en-US',
        voice_fallback_used: false,
        ...backendExtra,
      }),
    };
  });
}

beforeEach(() => {
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co/rest/v1/';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  process.env.AI_BACKEND_URL = 'https://ai.example.com';
  process.env.AI_BACKEND_API_KEY = 'svc-secret';
  process.env.SPOKEN_GUIDE_MAX_PRAYERS = '20';
  process.env.SPOKEN_GUIDE_MAX_CHARS_PER_PRAYER = '1000';
  delete process.env.SPOKEN_GUIDE_ENABLED;
  installFetch();
});

function backendCall() {
  return global.fetch.mock.calls.find(([u]) => String(u).includes('/v1/spoken-guide'));
}

describe('Spoken guide — auth & method', () => {
  it('rejects unauthenticated requests (401)', async () => {
    const res = mockRes();
    await handler(req({ auth: '' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('rejects invalid methods (405)', async () => {
    const res = mockRes();
    await handler(req({ method: 'PUT' }), res);
    expect(res.statusCode).toBe(405);
  });
});

describe('Spoken guide — validation', () => {
  it('rejects an invalid privacy mode (400)', async () => {
    const res = mockRes();
    await handler(req({ body: validBody({ privacyMode: 'everything' }) }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects too many prayers (400)', async () => {
    const prayers = Array.from({ length: 21 }, (_, i) => prayer({ name: `Person ${i}` }));
    const res = mockRes();
    await handler(req({ body: validBody({ prayers }) }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects oversized prayer text (413)', async () => {
    const big = prayer({ details: 'x'.repeat(1001) });
    const res = mockRes();
    await handler(req({ body: validBody({ prayers: [big] }) }), res);
    expect(res.statusCode).toBe(413);
  });
});

describe('Spoken guide — privacy-mode sanitization', () => {
  it('names-only mode sends only name/category, never title or details', async () => {
    const res = mockRes();
    await handler(req({ body: validBody({ privacyMode: 'names_only' }) }), res);
    const sent = JSON.parse(backendCall()[1].body);
    expect(sent.prayers[0]).toEqual({ name: 'Daniel', category: 'Family' });
    expect(JSON.stringify(sent)).not.toContain('Detailed private struggle');
    expect(JSON.stringify(sent)).not.toContain('Grace for the week');
  });

  it('summary mode sends title/category/summary but never full details', async () => {
    const res = mockRes();
    await handler(req({ body: validBody({ privacyMode: 'summary' }) }), res);
    const sent = JSON.parse(backendCall()[1].body);
    expect(sent.prayers[0].title).toBe('Grace for the week');
    expect(sent.prayers[0].summary).toBe('A short summary');
    expect(sent.prayers[0].details).toBeUndefined();
    expect(JSON.stringify(sent)).not.toContain('Detailed private struggle');
  });

  it('full mode with readFullDetails includes the details', async () => {
    const res = mockRes();
    await handler(req({ body: validBody({ privacyMode: 'full', readFullDetails: true }) }), res);
    const sent = JSON.parse(backendCall()[1].body);
    expect(sent.prayers[0].details).toBe('Detailed private struggle text');
  });

  it('strips unsupported fields from the forwarded body', async () => {
    const res = mockRes();
    const body = validBody({ evil: 'x', prayers: [prayer({ hacker: 'y' })] });
    await handler(req({ body }), res);
    const sent = JSON.parse(backendCall()[1].body);
    expect(sent.evil).toBeUndefined();
    expect(sent.prayers[0].hacker).toBeUndefined();
    expect(Object.keys(sent).sort()).toEqual(
      ['audioFormat', 'includeScripture', 'length', 'locale', 'mode', 'prayers', 'privacyMode', 'readFullDetails', 'voice'].sort()
    );
  });
});

describe('Spoken guide — backend wiring', () => {
  it('forwards the sanitized request to the private backend with the service key', async () => {
    const res = mockRes();
    await handler(req(), res);
    const call = backendCall();
    expect(String(call[0])).toBe('https://ai.example.com/v1/spoken-guide');
    expect(call[1].headers.Authorization).toBe('Bearer svc-secret');
    expect(res.statusCode).toBe(200);
  });

  it('returns a session object with a proxied (in-app) audio URL', async () => {
    const res = mockRes();
    await handler(req(), res);
    expect(res.body.sessionId).toBe('abc123def4567890');
    expect(res.body.script).toBeTruthy();
    expect(res.body.audioUrl).toBe('/api/spoken-guide?audio=abc123def4567890.mp3');
    expect(res.body.expiresAt).toBe('2026-07-08T00:15:00Z');
  });

  it('handles backend downtime gracefully (502)', async () => {
    installFetch({ backend: 'throw' });
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(502);
  });

  it('does not expose raw backend errors', async () => {
    installFetch({ backend: 'error500' });
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('Detailed private struggle');
    expect(res.body).toEqual({ error: 'Voice service unavailable' });
  });

  it('is disabled when SPOKEN_GUIDE_ENABLED=false (403)', async () => {
    process.env.SPOKEN_GUIDE_ENABLED = 'false';
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(403);
  });
});

describe('Spoken guide — logging hygiene', () => {
  let logs;
  beforeEach(() => {
    logs = [];
    for (const m of ['log', 'info', 'warn', 'error', 'debug']) {
      vi.spyOn(console, m).mockImplementation((...a) => logs.push(a.join(' ')));
    }
  });
  afterEach(() => vi.restoreAllMocks());

  it('never logs prayer content', async () => {
    const res = mockRes();
    await handler(req({ body: validBody({ privacyMode: 'full', readFullDetails: true }) }), res);
    expect(logs.join('\n')).not.toContain('Detailed private struggle');
    expect(res.statusCode).toBe(200);
  });
});

// ── Locale: sanitized, forwarded, and reported back ──────────────────────────

describe('Spoken guide — locale', () => {
  const forwardedBody = () => JSON.parse(backendCall()[1].body);

  it('forwards the requested locale to the private backend', async () => {
    await handler(req({ body: validBody({ locale: 'de-DE' }) }), mockRes());
    expect(forwardedBody().locale).toBe('de-DE');
  });

  it('sanitizes an underscore locale before forwarding', async () => {
    await handler(req({ body: validBody({ locale: 'de_DE' }) }), mockRes());
    expect(forwardedBody().locale).toBe('de-DE');
  });

  it('canonicalises locale case before forwarding', async () => {
    await handler(req({ body: validBody({ locale: 'DE-de' }) }), mockRes());
    expect(forwardedBody().locale).toBe('de-DE');
  });

  it('drops a script subtag, keeping language and region', async () => {
    await handler(req({ body: validBody({ locale: 'zh-Hans-CN' }) }), mockRes());
    expect(forwardedBody().locale).toBe('zh-CN');
  });

  it.each([['../../etc'], ['!!!'], [''], [42], [null], [{ evil: true }]])(
    'falls back to en-US for an invalid locale (%o)',
    async (locale) => {
      const res = mockRes();
      await handler(req({ body: validBody({ locale }) }), res);
      expect(res.statusCode).toBe(200); // never a 400 for a bad locale
      expect(forwardedBody().locale).toBe('en-US');
    }
  );

  it('never lets a locale reach the backend unvalidated', async () => {
    await handler(req({ body: validBody({ locale: '../../../v1/admin' }) }), mockRes());
    expect(forwardedBody().locale).toBe('en-US');
    expect(forwardedBody().locale).not.toContain('/');
  });

  it('strips unrelated client fields instead of forwarding them', async () => {
    const body = validBody({
      locale: 'de-DE',
      userId: 'user-1',
      accessToken: 'secret-token',
      settings: { spokenGuideLowDetail: true, language: 'de' },
      email: 'arthur@example.com',
      mode: 'not-driving',
    });
    await handler(req({ body }), mockRes());

    const forwarded = forwardedBody();
    expect(Object.keys(forwarded).sort()).toEqual([
      'audioFormat', 'includeScripture', 'length', 'locale', 'mode',
      'prayers', 'privacyMode', 'readFullDetails', 'voice',
    ]);
    expect(forwarded).not.toHaveProperty('userId');
    expect(forwarded).not.toHaveProperty('accessToken');
    expect(forwarded).not.toHaveProperty('settings');
    expect(forwarded).not.toHaveProperty('email');
    // `mode` is a known key, but it is pinned server-side — not taken from input.
    expect(forwarded.mode).toBe('driving');
    expect(JSON.stringify(forwarded)).not.toContain('secret-token');
  });

  it('reports locale, voiceLocale and voiceFallbackUsed to the app', async () => {
    const res = mockRes();
    await handler(req({ body: validBody({ locale: 'en-US' }) }), res);
    expect(res.body.locale).toBe('en-US');
    expect(res.body.voiceLocale).toBe('en-US');
    expect(res.body.voiceFallbackUsed).toBe(false);
  });

  it('surfaces a fallback voice from the backend', async () => {
    installFetch({ backendExtra: { locale: 'de-DE', voice_locale: 'en-US', voice_fallback_used: true } });
    const res = mockRes();
    await handler(req({ body: validBody({ locale: 'de-DE' }) }), res);
    expect(res.body.locale).toBe('de-DE');
    expect(res.body.voiceLocale).toBe('en-US');
    expect(res.body.voiceFallbackUsed).toBe(true);
  });

  it('coerces a non-boolean voice_fallback_used to false', async () => {
    installFetch({ backendExtra: { voice_fallback_used: 'yes' } });
    const res = mockRes();
    await handler(req({ body: validBody() }), res);
    expect(res.body.voiceFallbackUsed).toBe(false);
  });

  it('echoes the sanitized locale when the backend omits it', async () => {
    installFetch({ backendExtra: { locale: undefined } });
    const res = mockRes();
    await handler(req({ body: validBody({ locale: 'fr_FR' }) }), res);
    expect(res.body.locale).toBe('fr-FR');
  });

  it('still rewrites audioUrl to our own proxy', async () => {
    const res = mockRes();
    await handler(req({ body: validBody({ locale: 'de-DE' }) }), res);
    expect(res.body.audioUrl).toBe('/api/spoken-guide?audio=abc123def4567890.mp3');
    expect(res.body.audioUrl).not.toContain('ai.example.com');
  });
});
