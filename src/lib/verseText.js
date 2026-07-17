// Resolve the full text of a Bible passage so the user can read it inside the
// app instead of leaving for Bible.com.
//
// AUTHORITATIVE-TEXT-ONLY policy: we never let an LLM generate canonical
// Scripture wording — that is the app's single most sensitive correctness/safety
// boundary (a misquoted verse presented as Scripture is worse than no verse).
// So the only source of full verse TEXT is authoritative:
//   0. The OFFLINE BUNDLE (src/content/verses/*.json via verseBundle.js) — public
//      domain text pre-resolved at build time for the whole curated pool. Instant,
//      offline, free, and un-misquotable; it means the reader almost never needs
//      the network for a pool verse, and never the AI reference→USFM step.
//   1. localStorage cache (a previously-resolved passage).
//   2. The shared verse_cache table — but ONLY 'youversion' rows, so no legacy
//      AI-sourced text can resurface as if authoritative.
//   3. YouVersion Platform API (authoritative publisher text) — when configured
//      (VITE_YOUVERSION_ENABLED) and we have a version id for the language. The
//      localized reference is mapped to USFM first (see bibleRef.js). Used only for
//      references outside the bundle (e.g. verses attached to individual prayers).
//
// When none of these can serve the passage, we return null and the reader shows
// the REFERENCE only with a link to open it in the user's Bible — never invented
// text. AI may still offer a devotional REFLECTION elsewhere (behind consent),
// but it must not produce the verse text itself.
import { youVersionEnabled, fetchYouVersionPassage } from './youversion';
import { versionForLang, referenceToUsfm, usfmFromReference } from './bibleRef';
import { getBundledVerse } from './verseBundle';
import { isLowDataMode } from './lowData';
import { supabase } from './supabase';

const cacheKey = (lang, reference) => `verseText:${lang}:${reference}`;

// The key every cache (localStorage AND the shared verse_cache table) is stored
// under: the extent-precise USFM passage id — "PHP.1.3-11" for a range, "PSA.100"
// for a whole chapter, "PHP.4.6" for a verse — rather than the free-form reference
// string. This does two things: it dedups the many spellings of one passage across
// languages, and — crucially — it sidesteps rows written by an older build that
// stored only the FIRST verse of a range/chapter under the range's reference string
// ("Psalm 103:1-5" → just verse 1). Keyed by passage id, those truncated rows are
// never read again, so the full passage resolves. An unrecognized book name has no
// id; it falls back to the reference string (unchanged, pre-existing behavior).
function cacheKeyRef(reference, usfm) {
  return usfm || usfmFromReference(reference) || reference;
}

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

  const key = cacheKeyRef(reference, usfm);

  // Offline bundle first: no network, no AI, no cost. Covers the curated pool.
  const bundled = await getBundledVerse({ reference, lang, usfm: usfm || key });
  if (bundled) return bundled;

  const cached = getCachedVerseText(lang, key);
  if (cached?.text) return cached;

  // Low data mode: verse text is nonessential enrichment, so anything not
  // already bundled or cached on this device stays a reference (with a link to
  // the user's Bible) instead of spending the network on it.
  if (isLowDataMode()) return null;

  // Reuse authoritative text another user already resolved. Restricted to
  // 'youversion' entries so any legacy AI-sourced row in the shared cache can
  // never resurface as Scripture — no path in this module produces verse text
  // with AI.
  const shared = await getSharedVerse(lang, key, { authoritativeOnly: true });
  if (shared) { cache(lang, key, shared); return shared; }

  if (!youVersionEnabled()) return null;
  // Pass the resolved passage id as the known USFM so YouVersion fetches the full
  // extent AND we skip referenceToUsfm's own (possibly stale) localStorage cache.
  const yv = await fromYouVersion(reference, lang, key !== reference ? key : undefined);
  if (yv) { cache(lang, key, yv); putSharedVerse(lang, key, yv); }
  return yv;
}

// Resolve the full passage text for a reference from authoritative sources only.
// Returns { data: { text, ref, source } | null, error }. `data` is null (with no
// error) when no authoritative text is available — the reader then shows the
// reference with a link to open it in the user's Bible, never invented text.
export async function fetchVerseText({ reference, lang, usfm }) {
  if (!reference) return { data: null, error: null };

  const key = cacheKeyRef(reference, usfm);

  // Offline bundle first: no network, no AI, no cost. Covers the curated pool.
  const bundled = await getBundledVerse({ reference, lang, usfm: usfm || key });
  if (bundled) return { data: bundled, error: null };

  const cached = getCachedVerseText(lang, key);
  if (cached?.text) return { data: cached, error: null };

  // Low data mode: defer the remote lookups — reference-only fallback.
  if (isLowDataMode()) return { data: null, error: null };

  // Reuse authoritative text already resolved by another user/device before
  // spending a live API call. Restricted to 'youversion' rows so no legacy
  // AI-sourced entry can resurface as authoritative Scripture.
  const shared = await getSharedVerse(lang, key, { authoritativeOnly: true });
  if (shared) { cache(lang, key, shared); return { data: shared, error: null }; }

  if (youVersionEnabled()) {
    const yv = await fromYouVersion(reference, lang, key !== reference ? key : undefined);
    if (yv) {
      cache(lang, key, yv);
      putSharedVerse(lang, key, yv);
      return { data: yv, error: null };
    }
  }

  // No authoritative source could serve it — reference-only fallback.
  return { data: null, error: null };
}
