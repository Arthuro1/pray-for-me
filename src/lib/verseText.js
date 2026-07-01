// Resolve the full text of a Bible passage so the user can read it inside the
// app instead of leaving for Bible.com.
//
// Source order:
//   1. YouVersion Platform API (authoritative publisher text) — when configured
//      (VITE_YOUVERSION_ENABLED) and we have a version id for the language. The
//      localized reference is mapped to USFM first (see bibleRef.js).
//   2. The guardrailed AI helper — the same path the daily verse uses — as a
//      universal fallback for any language/reference YouVersion can't serve.
//
// Either way the result is cached in localStorage so reopening a verse is instant
// and never re-spends an API call. `source` ('youversion' | 'ai') lets the reader
// label AI-sourced text honestly.
import { callClaudeForJson, languageName } from './aiCore';
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
// reader. Write-once (ignoreDuplicates) since Scripture text is immutable.
function putSharedVerse(lang, reference, value) {
  if (!value?.text) return;
  try {
    supabase
      .from('verse_cache')
      .upsert(
        { lang, reference, text: value.text, source: value.source || 'ai' },
        { onConflict: 'lang,reference', ignoreDuplicates: true },
      )
      .then(() => {}, () => {});
  } catch {
    // ignore — a missing table or offline write is non-fatal.
  }
}

// Try YouVersion first: map the reference to USFM, then fetch authoritative text.
// Returns { text, ref, source } or null so the caller can fall back to AI.
async function fromYouVersion(reference, lang) {
  const versionId = versionForLang(lang);
  if (!versionId) return null;

  const usfm = await referenceToUsfm(reference);
  if (!usfm) return null;

  const { data } = await fetchYouVersionPassage({ versionId, usfm });
  if (!data?.text) return null;

  return { text: data.text, ref: data.reference || reference, source: 'youversion' };
}

// Ask the AI for the passage text (universal fallback). Honours the app's
// "never isolate a verse from its context" posture via the shared guardrail.
async function fromAI(reference, lang) {
  const name = languageName(lang);
  const prompt = `Provide the exact, word-for-word text of the Bible passage "${reference}" from a widely-used ${name} translation. Quote only the real canonical text — never paraphrase, summarise, or invent words. If the reference names a single verse, include just that verse. Respond ONLY with JSON:
{"text": "<the passage text in ${name}>", "ref": "${reference}"}`;

  const { data, error } = await callClaudeForJson({ prompt, lang, maxTokens: 700 });
  if (data?.text) return { data: { text: data.text, ref: data.ref || reference, source: 'ai' }, error: null };
  return { data: null, error };
}

// Consent-free enrichment for the reader: return text we already have cached, or
// fetch authoritative YouVersion text when a version is mapped for the language.
// Never touches the AI path, so the reader can upgrade a saved verse to publisher
// text silently on open — no extra tap, no AI-consent prompt. Returns the passage
// or null (in which case the AI fallback stays behind an explicit button).
export async function fetchScriptureText({ reference, lang }) {
  if (!reference) return null;

  const cached = getCachedVerseText(lang, reference);
  if (cached?.text) return cached;

  // Reuse authoritative text another user already resolved. Restricted to
  // 'youversion' entries: this consent-free path must never surface AI-sourced
  // text (that stays behind the explicit AI button in fetchVerseText).
  const shared = await getSharedVerse(lang, reference, { authoritativeOnly: true });
  if (shared) { cache(lang, reference, shared); return shared; }

  if (!youVersionEnabled()) return null;
  const yv = await fromYouVersion(reference, lang);
  if (yv) { cache(lang, reference, yv); putSharedVerse(lang, reference, yv); }
  return yv;
}

// Resolve the full passage text for a reference. Returns { data: { text, ref,
// source } | null, error } — the same shape the AI callers use, so the reader can
// reuse localizeAiError.
export async function fetchVerseText({ reference, lang }) {
  if (!reference) return { data: null, error: null };

  const cached = getCachedVerseText(lang, reference);
  if (cached) return { data: cached, error: null };

  // Reuse any passage (authoritative or AI) already resolved by another
  // user/device before spending a live API call on the same verse.
  const shared = await getSharedVerse(lang, reference);
  if (shared) { cache(lang, reference, shared); return { data: shared, error: null }; }

  if (youVersionEnabled()) {
    const yv = await fromYouVersion(reference, lang);
    if (yv) {
      cache(lang, reference, yv);
      putSharedVerse(lang, reference, yv);
      return { data: yv, error: null };
    }
  }

  const { data, error } = await fromAI(reference, lang);
  if (data) { cache(lang, reference, data); putSharedVerse(lang, reference, data); }
  return { data, error };
}
