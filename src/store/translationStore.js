import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { aiEnabled, aiFetch } from '../lib/aiClient';
import { redactMany, restore } from '../lib/aiRedaction';
import { ensureGroupKey } from '../lib/crypto/groupKeys';
import {
  deriveAccountHmacKey,
  computeSourceHmac,
  encryptAccountTranslation,
  decryptAccountTranslation,
  deriveGroupHmacKey,
  encryptGroupTranslation,
  decryptGroupTranslation,
} from '../lib/crypto/translationCrypto';

// In-memory cache for fast, synchronous lookups in render: { [lang]: { [originalText]: translatedText } }.
// This is plaintext IN MEMORY only, and only while the account/group key is
// available — the same trust boundary as decrypted prayers. At REST (Supabase)
// translations are ALWAYS encrypted (see translationCrypto); the original text is
// never persisted.
let memCache = {};
let cacheGeneration = 0;
let queuedJobs = [];
const pendingJobs = new Map();
let activeRunner = null;

const MAX_TEXT_LENGTH = 4000;
const MAX_BATCH_TEXTS = 20;
const MAX_BATCH_CHARACTERS = 16000;
const MAX_REQUEST_BYTES = 32 * 1024;
const encoder = new TextEncoder();
const cached = (text, lang) => Object.hasOwn(memCache[lang] || {}, text);

function remember(fresh, lang, isCurrent) {
  if (!isCurrent()) return;
  if (!memCache[lang]) memCache[lang] = {};
  Object.assign(memCache[lang], fresh);
  useTranslationStore.setState({});
}

// Encrypted rows carry a TTL so orphaned entries (whose source text changed, so
// their hmac no longer matches) are swept server-side.
const TTL_MS = 90 * 24 * 60 * 60 * 1000;
const expiryIso = () => new Date(Date.now() + TTL_MS).toISOString();

// ── Authenticated AI translation call ───────────────────────────────────────
// Sensitive tokens are redacted to placeholders before the text is sent, then
// restored in the returned translation. Keys of the result map are the ORIGINAL
// (unredacted) source texts, so memCache lookups by source text still work.
async function callTranslate(texts, redacted, map, targetLang, isCurrent, signal) {
  if (!aiEnabled || texts.length === 0 || !isCurrent()) return null;
  try {
    const res = await aiFetch('translate_texts', { texts: redacted, lang: targetLang }, { signal });
    if (!res.ok || !isCurrent()) return null;
    const body = await res.json();
    if (!isCurrent()) return null;
    // The server returns { data: { translations: { 0: '…', 1: '…' } } }.
    const out = body?.data?.translations || {};
    const result = {};
    texts.forEach((t, i) => {
      if (typeof out[i] === 'string') result[t] = restore(out[i], map);
    });
    return result;
  } catch {
    return null;
  }
}

// ── Private (account-key) encrypted cache ────────────────────────────────────
// Fill memCache from existing encrypted rows; return the subset still needing AI.
async function fillFromAccountCache(todo, lang, userId, isCurrent) {
  const hmacKey = await deriveAccountHmacKey();
  if (!isCurrent()) return [];
  if (!hmacKey || !userId) return todo; // locked / signed-out → translate in memory only
  try {
    const byHmac = new Map();
    for (const text of todo) {
      byHmac.set(await computeSourceHmac(hmacKey, text), text);
      if (!isCurrent()) return [];
    }
    const { data } = await supabase
      .from('translations')
      .select('source_hmac, target_language, encrypted_translation, nonce, encryption_version')
      .eq('user_id', userId)
      .eq('target_language', lang)
      .in('source_hmac', [...byHmac.keys()]);
    if (!isCurrent()) return [];
    const fresh = {};
    const hit = new Set();
    for (const row of data || []) {
      const text = byHmac.get(row.source_hmac);
      if (!text) continue;
      const translated = await decryptAccountTranslation({ userId, row });
      if (!isCurrent()) return [];
      if (translated != null) {
        fresh[text] = translated;
        hit.add(text);
      }
    }
    remember(fresh, lang, isCurrent);
    return todo.filter((t) => !hit.has(t));
  } catch {
    return isCurrent() ? todo : [];
  }
}

async function writeAccountCache(fresh, lang, userId, isCurrent) {
  if (!isCurrent()) return;
  const hmacKey = await deriveAccountHmacKey();
  if (!isCurrent() || !hmacKey || !userId) return; // never persist plaintext when we can't encrypt
  try {
    const rows = [];
    for (const [text, translated] of Object.entries(fresh)) {
      const sourceHmac = await computeSourceHmac(hmacKey, text);
      if (!isCurrent()) return;
      const enc = await encryptAccountTranslation({ userId, sourceHmac, targetLanguage: lang, translatedText: translated });
      if (!isCurrent()) return;
      if (enc) rows.push({ user_id: userId, target_language: lang, expires_at: expiryIso(), ...enc });
    }
    if (rows.length && isCurrent()) {
      await supabase.from('translations').upsert(rows, { onConflict: 'user_id,target_language,source_hmac' });
    }
  } catch {
    // non-fatal — the translation still shows this session (memCache).
  }
}

// ── Community (group-key) encrypted, shared cache ────────────────────────────
async function fillFromGroupCache(todo, lang, groupId, isCurrent) {
  const gk = await ensureGroupKey(groupId);
  if (!isCurrent()) return [];
  const hmacKey = await deriveGroupHmacKey(gk?.key);
  if (!isCurrent()) return [];
  if (!gk || !hmacKey) return todo;
  try {
    const byHmac = new Map();
    for (const text of todo) {
      byHmac.set(await computeSourceHmac(hmacKey, text), text);
      if (!isCurrent()) return [];
    }
    const { data } = await supabase
      .from('community_translations')
      .select('source_hmac, target_language, encrypted_translation, nonce, encryption_version, key_version')
      .eq('group_id', groupId)
      .eq('target_language', lang)
      .eq('key_version', gk.version)
      .in('source_hmac', [...byHmac.keys()]);
    if (!isCurrent()) return [];
    const fresh = {};
    const hit = new Set();
    for (const row of data || []) {
      const text = byHmac.get(row.source_hmac);
      if (!text) continue;
      const translated = await decryptGroupTranslation({ groupKey: gk.key, groupId, row });
      if (!isCurrent()) return [];
      if (translated != null) {
        fresh[text] = translated;
        hit.add(text);
      }
    }
    remember(fresh, lang, isCurrent);
    return todo.filter((t) => !hit.has(t));
  } catch {
    return isCurrent() ? todo : [];
  }
}

async function writeGroupCache(fresh, lang, groupId, isCurrent) {
  if (!isCurrent()) return;
  const gk = await ensureGroupKey(groupId);
  if (!isCurrent()) return;
  const hmacKey = await deriveGroupHmacKey(gk?.key);
  if (!isCurrent() || !gk || !hmacKey) return;
  try {
    const rows = [];
    for (const [text, translated] of Object.entries(fresh)) {
      const sourceHmac = await computeSourceHmac(hmacKey, text);
      if (!isCurrent()) return;
      const enc = await encryptGroupTranslation({
        groupKey: gk.key,
        groupId,
        sourceHmac,
        targetLanguage: lang,
        keyVersion: gk.version,
        translatedText: translated,
      });
      if (!isCurrent()) return;
      if (enc) rows.push({ group_id: groupId, target_language: lang, ...enc });
    }
    if (rows.length && isCurrent()) {
      // Overwrite on conflict (not ignoreDuplicates) so that after a group-key
      // rotation a fresh translation replaces the stale-version row.
      await supabase
        .from('community_translations')
        .upsert(rows, { onConflict: 'group_id,target_language,source_hmac' });
    }
  } catch {
    // non-fatal.
  }
}

// Redaction can change string lengths. Batch the actual outgoing strings, also
// respecting the byte limit for non-Latin text and JSON escaping.
function translationBatches(todo, lang) {
  const batches = [];
  let batch = { texts: [], redacted: [], map: {} };
  const requestBytes = (texts) => encoder.encode(JSON.stringify({
    task: 'translate_texts', input: { texts, lang },
  })).byteLength;
  const prepare = (texts) => {
    const { texts: redacted, map } = redactMany(texts);
    return { texts, redacted, map };
  };
  const fits = ({ redacted }) => redacted.length <= MAX_BATCH_TEXTS
    && redacted.every((text) => text?.trim() && text.length <= MAX_TEXT_LENGTH)
    && redacted.reduce((sum, text) => sum + text.length, 0) <= MAX_BATCH_CHARACTERS
    && requestBytes(redacted) <= MAX_REQUEST_BYTES;
  for (const text of todo) {
    const single = prepare([text]);
    if (!fits(single)) continue;
    const next = batch.texts.length ? prepare([...batch.texts, text]) : single;
    if (!fits(next) && batch.texts.length) {
      batches.push(batch);
      batch = single;
    } else {
      batch = next;
    }
  }
  if (batch.texts.length) batches.push(batch);
  return batches;
}

async function translateChunks(todo, lang, userId, groupId, isCurrent, signal) {
  const batches = translationBatches(todo, lang);
  for (const batch of batches) {
    if (!isCurrent()) return;
    const fresh = await callTranslate(batch.texts, batch.redacted, batch.map, lang, isCurrent, signal);
    // A rejected or failed batch ends the job. In particular, never consume
    // another quota reservation for every remaining chunk after a 429.
    if (fresh === null || !isCurrent()) return;
    if (Object.keys(fresh).length === 0) continue;
    remember(fresh, lang, isCurrent);
    await writeAccountCache(fresh, lang, userId, isCurrent);
    if (groupId) await writeGroupCache(fresh, lang, groupId, isCurrent);
  }
}

function finishJob(job) {
  job.texts.clear();
  job.resolve();
}

async function drainJobs(runner) {
  const isCurrent = () => runner.generation === cacheGeneration;
  try {
    while (isCurrent() && queuedJobs.length) {
      const job = queuedJobs.shift();
      pendingJobs.delete(job.key);
      runner.job = job;
      try {
        // Cache misses are evaluated when the job runs, after previous jobs have
        // finished, rather than when a render scheduled overlapping work.
        const todo = [...job.texts].filter((text) => !cached(text, job.lang));
        if (!todo.length) continue;
        const remaining = job.groupId
          ? await fillFromGroupCache(todo, job.lang, job.groupId, isCurrent)
          : await fillFromAccountCache(todo, job.lang, job.userId, isCurrent);
        if (!isCurrent()) return;
        await translateChunks(remaining.filter((text) => !cached(text, job.lang)),
          job.lang, job.userId, job.groupId, isCurrent, runner.controller.signal);
      } catch {
        // Translation is optional; failed cache/provider work keeps the original.
      } finally {
        finishJob(job);
        runner.job = null;
      }
    }
  } finally {
    // An old request completing after a reset must not clear a new run's state.
    if (activeRunner === runner) {
      activeRunner = null;
      useTranslationStore.setState({ translating: false });
    }
  }
}

function queueTranslation(texts, lang, userId, groupId = null) {
  if (!lang || !aiEnabled || !userId) return Promise.resolve();
  const valid = (texts || []).filter((text) => typeof text === 'string'
    && text.trim() && text.length <= MAX_TEXT_LENGTH && !cached(text, lang));
  if (!valid.length) return Promise.resolve();
  const key = JSON.stringify([userId, lang, groupId]);
  let job = pendingJobs.get(key);
  if (!job) {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    job = { key, texts: new Set(), lang, userId, groupId, resolve, promise };
    pendingJobs.set(key, job);
    queuedJobs.push(job);
  }
  valid.forEach((text) => job.texts.add(text));
  useTranslationStore.setState({ translating: true });
  if (!activeRunner) {
    const runner = { generation: cacheGeneration, job: null, controller: new AbortController() };
    activeRunner = runner;
    // Same-turn scans coalesce before cache lookups or provider requests begin.
    Promise.resolve().then(() => drainJobs(runner));
  }
  return job.promise;
}

// Clear the in-memory translation cache. Called on sign-out, account switch, and
// vault lock so no decrypted translation lingers in memory.
export function clearTranslationCache() {
  cacheGeneration += 1;
  memCache = {};
  queuedJobs.forEach(finishJob);
  queuedJobs = [];
  pendingJobs.clear();
  activeRunner?.controller.abort();
  if (activeRunner?.job) finishJob(activeRunner.job);
  activeRunner = null;
  useTranslationStore.setState({ translating: false });
}

const useTranslationStore = create((set) => ({
  translating: false,

  // Retained for API compatibility. Translations are now resolved on demand by
  // translateContent/translateTexts (which hold the source texts needed to derive
  // the keyed lookup hmac); there is no plaintext bulk table to preload.
  loadTranslations: async () => {
    set({});
  },

  // Synchronous lookup used in render; falls back to the original text.
  tr: (text, lang) => {
    if (!text || !lang) return text;
    return memCache[lang]?.[text] ?? text;
  },

  // Translate an arbitrary list of texts to lang (skipping already-cached ones).
  // When groupId is given, uses the group-shared encrypted cache so members don't
  // re-pay for the same text; otherwise uses the per-user encrypted cache.
  translateTexts: queueTranslation,

  // Translate all not-yet-cached texts for the given lang, resolving existing
  // encrypted rows first, then AI-translating and persisting the rest (encrypted).
  translateContent: async (prayers, categories, lang, userId) => {
    if (!lang || !aiEnabled || !userId) return;
    const toTranslate = new Set();
    // During an account switch, the store may receive the new account id before
    // its previous prayer/category arrays have been replaced. Never enqueue
    // those old records under the new account's translation consent or token.
    categories.forEach((c) => {
      if (c.user_id !== userId) return;
      if (c.name) toTranslate.add(c.name);
    });
    prayers.forEach((p) => {
      if (p.user_id !== userId) return;
      if (p.title) toTranslate.add(p.title);
      if (p.description) toTranslate.add(p.description);
      if (p.testimony) toTranslate.add(p.testimony);
      (p.prayer_updates || []).forEach((u) => {
        if (u.text) toTranslate.add(u.text);
      });
      (p.prayer_points || []).forEach((pp) => {
        if (pp.title) toTranslate.add(pp.title);
        // Scripture text is NEVER sent through AI translation — authoritative verse
        // text comes from the bundle / YouVersion, or stays in its original language.
      });
    });

    return queueTranslation([...toTranslate], lang, userId);
  },
}));

export default useTranslationStore;
