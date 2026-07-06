// Resolve the full text of a Bible passage so the user can read it inside the
// app instead of leaving for Bible.com.
//
// AUTHORITATIVE-TEXT-ONLY policy: we never let an LLM generate canonical
// Scripture wording — that is the app's single most sensitive correctness/safety
// boundary (a misquoted verse presented as Scripture is worse than no verse).
// So the only source of full verse TEXT is authoritative:
//   1. localStorage cache (a previously-resolved passage).
//   2. The shared verse_cache table — but ONLY 'youversion' rows, so no legacy
//      AI-sourced text can resurface as if authoritative.
//   3. YouVersion Platform API (authoritative publisher text) — when configured
//      (VITE_YOUVERSION_ENABLED) and we have a version id for the language. The
//      localized reference is mapped to USFM first (see bibleRef.js).
//
// When none of these can serve the passage, we return null and the reader shows
// the REFERENCE only with a link to open it in the user's Bible — never invented
// text. AI may still offer a devotional REFLECTION elsewhere (behind consent),
// but it must not produce the verse text itself.
import { youVersionEnabled, fetchYouVersionPassage } from './youversion';
import { versionForLang, referenceToUsfm } from './bibleRef';
import { supabase } from './supabase';

const cacheKey = (lang, reference) => `verseText:${lang}:${reference}`;

// Return a previously-fetched passage for this reference + language, or null.
export function getCachedVerseText(lang, reference) {
  try {
    const raw = localStorage.getItem(cacheKey(lang, reference));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cache(lang, reference, value) {
  try {
    localStorage.setItem(cacheKey(lang, reference), JSON.stringify(value));
  } catch {
    // localStorage full / unavailable — the passage still shows this session.
  }
}

// ── Shared server cache (verse_cache) ────────────────────────────────────────
// Holds only public Scripture text, so it's reused across every user and device:
// a verse resolved once is never re-fetched (and never re-billed) for anyone else.
// Any failure (offline, table not yet migrated) returns null so the caller falls
// through to a live fetch.
async function getSharedVerse(lang, reference, { authoritativeOnly = false } = {}) {
  try {
    let query = supabase
      .from('verse_cache')
      .select('text, source')
      .eq('lang', lang)
      .eq('reference', reference);
    if (authoritativeOnly) query = query.eq('source', 'youversion');
    const { data } = await query.maybeSingle();
    if (!data?.text) return null;
    return { text: data.text, ref: reference, source: data.source };
  } catch {
    return null;
  }
}

// Fire-and-forget: contributing to the shared cache must never block or fail the
// reader. Write-once (ignoreDuplicates) since Scripture text is immutable. Only
// authoritative ('youversion') text is ever contributed — the shared cache must
// never hold LLM-generated Scripture.
function putSharedVerse(lang, reference, value) {
  if (!value?.text || value.source !== 'youversion') return;
  try {
    supabase
      .from('verse_cache')
      .upsert(
        { lang, reference, text: value.text, source: 'youversion' },
        { onConflict: 'lang,reference', ignoreDuplicates: true },
      )
      .then(() => {}, () => {});
  } catch {
    // ignore — a missing table or offline write is non-fatal.
  }
}

// Try YouVersion first: map the reference to USFM, then fetch authoritative text.
// Returns { text, ref, source } or null. When null, the caller shows the
// reference only (with a link to the user's Bible) — there is NO AI text
// fallback; an LLM must never produce canonical Scripture wording.
// `knownUsfm` lets callers that already know the passage id (e.g. the curated
// daily-verse pool, which stores USFM book codes) skip the AI-based reference→
// USFM conversion entirely — no Anthropic call needed for those verses.
async function fromYouVersion(reference, lang, knownUsfm) {
  const versionId = versionForLang(lang);
  if (!versionId) return null;

  const usfm = knownUsfm || await referenceToUsfm(reference);
  if (!usfm) return null;

  const { data } = await fetchYouVersionPassage({ versionId, usfm });
  if (!data?.text) return null;

  return { text: data.text, ref: data.reference || reference, source: 'youversion' };
}

// Consent-free enrichment for the reader: return text we already have cached, or
// fetch authoritative YouVersion text when a version is mapped for the language.
// Never touches the AI path, so the reader can upgrade a saved verse to publisher
// text silently on open — no extra tap, no AI-consent prompt. Returns the passage
// or null, in which case the reader shows the reference with a link to the user's
// Bible — there is no AI fallback.
export async function fetchScriptureText({ reference, lang, usfm }) {
  if (!reference) return null;

  const cached = getCachedVerseText(lang, reference);
  if (cached?.text) return cached;

  // Reuse authoritative text another user already resolved. Restricted to
  // 'youversion' entries so any legacy AI-sourced row in the shared cache can
  // never resurface as Scripture — no path in this module produces verse text
  // with AI.
  const shared = await getSharedVerse(lang, reference, { authoritativeOnly: true });
  if (shared) { cache(lang, reference, shared); return shared; }

  if (!youVersionEnabled()) return null;
  const yv = await fromYouVersion(reference, lang, usfm);
  if (yv) { cache(lang, reference, yv); putSharedVerse(lang, reference, yv); }
  return yv;
}

// Resolve the full passage text for a reference from authoritative sources only.
// Returns { data: { text, ref, source } | null, error }. `data` is null (with no
// error) when no authoritative text is available — the reader then shows the
// reference with a link to open it in the user's Bible, never invented text.
export async function fetchVerseText({ reference, lang }) {
  if (!reference) return { data: null, error: null };

  const cached = getCachedVerseText(lang, reference);
  if (cached?.text) return { data: cached, error: null };

  // Reuse authoritative text already resolved by another user/device before
  // spending a live API call. Restricted to 'youversion' rows so no legacy
  // AI-sourced entry can resurface as authoritative Scripture.
  const shared = await getSharedVerse(lang, reference, { authoritativeOnly: true });
  if (shared) { cache(lang, reference, shared); return { data: shared, error: null }; }

  if (youVersionEnabled()) {
    const yv = await fromYouVersion(reference, lang);
    if (yv) {
      cache(lang, reference, yv);
      putSharedVerse(lang, reference, yv);
      return { data: yv, error: null };
    }
  }

  // No authoritative source could serve it — reference-only fallback.
  return { data: null, error: null };
}
