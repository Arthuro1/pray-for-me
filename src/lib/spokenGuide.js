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

// Generate a spoken guide session. Returns { ok, status, data }. `data` on
// success: { sessionId, script, audioUrl, audioFormat, durationSeconds, expiresAt }.
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
    locale: lang,
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
    return { ok: res.ok, status: res.status, data };
  } catch {
    // Backend/app unreachable — caller falls back gracefully.
    return { ok: false, status: 0, data: null };
  }
}

// Fetch the temporary audio through the app's authenticated proxy and return an
// object URL for an <audio> element. Returns null if there's no audio (e.g. dev
// mode, where the driving screen falls back to on-device speech of the script).
export async function fetchGuideAudio(audioUrl) {
  if (!audioUrl) return null;
  try {
    const headers = {};
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    const res = await fetch(audioUrl, { headers });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
