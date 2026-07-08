import { supabase } from './supabase';

// Client entry point for the Spoken Prayer Guide. It talks ONLY to the app's own
// /api/spoken-guide endpoint, which sanitizes prayers per the privacy mode and
// forwards to Pray4Me's private AI + voice backend. The browser never calls the
// backend, Piper/Kokoro, or any third-party TTS directly.
//
// PRIVACY: this converts selected prayer content into plaintext to send for voice
// generation. The privacy mode limits how much is included; "names only" and
// "summary" genuinely send less. See PrivacyCenter copy.

export const PRIVACY_MODES = ['full', 'summary', 'names_only'];

// The privacy mode a new session should start in, honouring the low-detail
// preference (which forces the safest, names-only mode by default).
export function defaultPrivacyMode(settings = {}) {
  if (settings.spokenGuideLowDetail) return 'names_only';
  return PRIVACY_MODES.includes(settings.spokenGuidePrivacyMode)
    ? settings.spokenGuidePrivacyMode
    : 'summary';
}

// ── Spoken language ─────────────────────────────────────────────────────────
//
// The guide is spoken in the user's app language: the locale we send drives BOTH
// the script the backend writes and the Piper voice that reads it. Users can pin
// an explicit language instead ("always read to me in English").

export const SPOKEN_GUIDE_LANGUAGE_AUTO = 'auto';

// Locales the voice backend has a Piper model for. Keep in step with
// SUPPORTED_TTS_LOCALES / VOICE_MAP in pray-for-me-ai. Anything else still works —
// the backend falls back by base language, then to English — but only these are
// offered as an explicit choice.
export const SPOKEN_GUIDE_LOCALES = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES'];

export const DEFAULT_SPOKEN_GUIDE_LOCALE = 'en-US';

// The app's language codes are bare ISO-639-1 ("de"); a Piper voice needs a region
// ("de-DE"). This is the app's opinion about which regional voice best serves each
// UI language. A language with no voice yet (e.g. "ja") is still sent accurately —
// the backend decides how to fall back, not us.
const APP_LANG_TO_LOCALE = {
  fr: 'fr-FR',
  en: 'en-US',
  de: 'de-DE',
  pt: 'pt-BR',
  zh: 'zh-CN',
  es: 'es-ES',
  hi: 'hi-IN',
  ja: 'ja-JP',
  sw: 'sw-KE',
  am: 'am-ET',
  id: 'id-ID',
  tl: 'tl-PH',
  ko: 'ko-KR',
  ru: 'ru-RU',
  ar: 'ar-SA',
  fa: 'fa-IR',
};

const LANG_SUBTAG_RE = /^[a-z]{2,3}$/i;
const REGION_SUBTAG_RE = /^[a-z0-9]{2,8}$/i;

// `de_DE` → `de-DE`, `zh-Hans-CN` → `zh-CN`, `DE` → `de`. Returns null for anything
// that isn't a locale, so callers fall through to the next source rather than
// forwarding junk to the backend.
export function normalizeLocale(raw) {
  if (typeof raw !== 'string') return null;
  const parts = raw.trim().replace(/_/g, '-').split('-').filter(Boolean);
  if (!parts.length) return null;

  const lang = parts[0];
  if (!LANG_SUBTAG_RE.test(lang)) return null;
  if (parts.length === 1) return lang.toLowerCase();

  // Drop any script subtag in the middle ("zh-Hans-CN"); the region is what a
  // voice model is keyed on.
  const region = parts[parts.length - 1];
  if (!REGION_SUBTAG_RE.test(region)) return null;
  return `${lang.toLowerCase()}-${region.toUpperCase()}`;
}

function browserLanguage() {
  return typeof navigator !== 'undefined' && navigator ? navigator.language : undefined;
}

// Which language the guide should be spoken in, in priority order:
//   1. an explicit Spoken Guide language, if the user pinned one
//   2. the app language setting
//   3. the browser's language
//   4. en-US
//
// `navigatorLanguage` defaults to the real browser language. Pass `null` to mean
// "there is none" — a default parameter only fires for `undefined`, so that stays
// expressible (and keeps this function deterministic under test).
export function resolveSpokenGuideLocale(settings = {}, navigatorLanguage = browserLanguage()) {
  const explicit = settings.spokenGuideLanguage;
  if (explicit && explicit !== SPOKEN_GUIDE_LANGUAGE_AUTO) {
    const normalized = normalizeLocale(explicit);
    if (normalized) return normalized;
  }

  const appLang = normalizeLocale(settings.language);
  if (appLang) {
    // "de" → "de-DE" where we have an opinion; otherwise pass it through as-is.
    return APP_LANG_TO_LOCALE[appLang.split('-')[0]] || appLang;
  }

  const nav = normalizeLocale(navigatorLanguage);
  if (nav) return nav.includes('-') ? nav : APP_LANG_TO_LOCALE[nav] || nav;

  return DEFAULT_SPOKEN_GUIDE_LOCALE;
}

// ── Response normalization ──────────────────────────────────────────────────
//
// The dev Vite proxy passes the private backend's response straight through
// (snake_case: `audio_url`, `session_id`), while the prod serverless function
// rewrites it to camelCase. Both shapes land here and leave identical, so the
// driving screen never falls back to on-device speech merely because a key was
// spelled differently. See the dev proxy in vite.config.js.

// A generated audio file name: the backend's session id + extension.
const AUDIO_FILE_RE = /^[a-f0-9]{16,64}\.(mp3|wav|ogg)$/;

// Every audio URL the app plays must point at OUR proxy, never at the private
// backend — in dev as much as in prod. Prod's serverless function has already
// rewritten it; dev hands us the backend's own URL, so we rebuild the proxy path
// from the file name. Anything that isn't a recognisable audio file is dropped.
export function toProxiedAudioUrl(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  if (raw.startsWith('/api/spoken-guide?audio=')) return raw; // already proxied (prod)
  const file = raw.split('?')[0].split('/').pop();
  if (!AUDIO_FILE_RE.test(file || '')) return null;
  return `/api/spoken-guide?audio=${file}`;
}

// Accept camelCase (prod) or snake_case (dev) and return one canonical shape.
// `audioUrl` is null when the server produced no audio — that, and only that, is
// what makes the caller fall back to on-device speech.
export function normalizeSpokenGuideResponse(data) {
  if (!data || typeof data !== 'object') return null;
  return {
    sessionId: data.sessionId ?? data.session_id ?? null,
    script: typeof data.script === 'string' ? data.script : '',
    audioUrl: toProxiedAudioUrl(data.audioUrl ?? data.audio_url ?? null),
    audioFormat: data.audioFormat ?? data.audio_format ?? null,
    durationSeconds: data.durationSeconds ?? data.duration_seconds ?? null,
    expiresAt: data.expiresAt ?? data.expires_at ?? null,
    privacyMode: data.privacyMode ?? data.privacy_mode ?? null,
    locale: data.locale ?? null,
    voiceLocale: data.voiceLocale ?? data.voice_locale ?? null,
    voiceFallbackUsed: data.voiceFallbackUsed ?? data.voice_fallback_used ?? false,
  };
}

function firstCategoryName(prayer, categories, tr, lang) {
  const ids = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  const cat = (categories || []).find((c) => ids.includes(c.id));
  return cat ? tr(cat.name, lang) : undefined;
}

function shortSummary(prayer, tr, lang) {
  const points = (prayer.prayer_points || [])
    .map((pp) => tr(pp.title, lang))
    .filter(Boolean)
    .slice(0, 2);
  if (points.length) return points.join('; ').slice(0, 180);
  const desc = tr(prayer.description || '', lang);
  return desc ? desc.slice(0, 180) : undefined;
}

function collectScripture(prayer) {
  const out = [];
  for (const pp of prayer.prayer_points || []) {
    for (const v of pp.verses || []) {
      if (v?.ref || v?.text) out.push({ ref: v.ref || undefined, text: v.text || undefined });
      if (out.length >= 3) return out;
    }
  }
  return out;
}

// Map the app's rich prayer objects to the minimal, resolved fields the guide
// needs. Translation (tr) resolves titles/descriptions to the session locale.
export function buildPrayerPayload(prayers, { tr, lang, categories, includeScripture }) {
  return (prayers || []).map((p) => {
    const obj = {
      title: tr(p.title, lang) || undefined,
      details: tr(p.description || '', lang) || undefined,
      summary: shortSummary(p, tr, lang),
      category: firstCategoryName(p, categories, tr, lang),
      name: p.for_other && p.person_name ? p.person_name : undefined,
    };
    if (includeScripture) {
      const sc = collectScripture(p);
      if (sc.length) obj.scripture = sc;
    }
    return obj;
  });
}

// Generate a spoken guide session. Returns { ok, status, data }, where `data` has
// been through normalizeSpokenGuideResponse — so callers only ever see camelCase,
// whatever the environment served. `lang` translates the prayer content; `locale`
// is the language it will be spoken in.
export async function requestSpokenGuide({
  prayers,
  tr,
  lang,
  categories,
  privacyMode,
  length = 'short',
  includeScripture = false,
  readFullDetails = false,
  voice = 'calm',
  audioFormat = 'mp3',
  locale = DEFAULT_SPOKEN_GUIDE_LOCALE,
}) {
  const headers = { 'Content-Type': 'application/json' };
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  const body = {
    mode: 'driving',
    privacyMode,
    voice,
    length,
    includeScripture,
    readFullDetails,
    prayers: buildPrayerPayload(prayers, { tr, lang, categories, includeScripture }),
    locale: normalizeLocale(locale) || DEFAULT_SPOKEN_GUIDE_LOCALE,
    audioFormat,
  };

  try {
    const res = await fetch('/api/spoken-guide', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON error */ }
    // Errors carry no guide payload; don't normalize them into a fake success.
    return { ok: res.ok, status: res.status, data: res.ok ? normalizeSpokenGuideResponse(data) : data };
  } catch {
    // Backend/app unreachable — caller falls back gracefully.
    return { ok: false, status: 0, data: null };
  }
}

// Fetch the temporary audio through the app's authenticated proxy and return an
// object URL for an <audio> element. Takes the NORMALIZED `audioUrl`, which always
// points at /api/spoken-guide — never at the private backend.
//
// Returns null only when there is genuinely no server audio to play: no URL, a
// failed fetch, or an unreachable backend. The driving screen treats that — and
// nothing else — as the signal to fall back to on-device speech.
export async function fetchGuideAudio(audioUrl) {
  if (!audioUrl) return null;
  try {
    const headers = {};
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    const res = await fetch(audioUrl, { headers });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob || blob.size === 0) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
