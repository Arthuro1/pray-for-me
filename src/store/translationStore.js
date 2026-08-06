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

// Encrypted rows carry a TTL so orphaned entries (whose source text changed, so
// their hmac no longer matches) are swept server-side.
const TTL_MS = 90 * 24 * 60 * 60 * 1000;
const expiryIso = () => new Date(Date.now() + TTL_MS).toISOString();

// ── AI translation call (private gateway) ────────────────────────────────────
// Sensitive tokens are redacted to placeholders before the text is sent, then
// restored in the returned translation. Keys of the result map are the ORIGINAL
// (unredacted) source texts, so memCache lookups by source text still work.
async function callTranslate(texts, targetLang) {
  if (!aiEnabled || texts.length === 0) return {};
  try {
    const { texts: redacted, map } = redactMany(texts);
    const res = await aiFetch('translate_texts', { texts: redacted, lang: targetLang });
    if (!res.ok) return {};
    const body = await res.json();
    // Gateway returns { data: { translations: { 0: '…', 1: '…' } } }.
    const out = body?.data?.translations || {};
    const result = {};
    texts.forEach((t, i) => {
      if (typeof out[i] === 'string') result[t] = restore(out[i], map);
    });
    return result;
  } catch {
    return {};
  }
}

// ── Private (account-key) encrypted cache ────────────────────────────────────
// Fill memCache from existing encrypted rows; return the subset still needing AI.
async function fillFromAccountCache(todo, lang, userId) {
  const hmacKey = await deriveAccountHmacKey();
  if (!hmacKey || !userId) return todo; // locked / signed-out → translate in memory only
  try {
    const byHmac = new Map();
    for (const text of todo) byHmac.set(await computeSourceHmac(hmacKey, text), text);
    const { data } = await supabase
      .from('translations')
      .select('source_hmac, target_language, encrypted_translation, nonce, encryption_version')
      .eq('user_id', userId)
      .eq('target_language', lang)
      .in('source_hmac', [...byHmac.keys()]);
    if (!memCache[lang]) memCache[lang] = {};
    const hit = new Set();
    for (const row of data || []) {
      const text = byHmac.get(row.source_hmac);
      if (!text) continue;
      const translated = await decryptAccountTranslation({ userId, row });
      if (translated != null) {
        memCache[lang][text] = translated;
        hit.add(text);
      }
    }
    return todo.filter((t) => !hit.has(t));
  } catch {
    return todo;
  }
}

async function writeAccountCache(fresh, lang, userId) {
  const hmacKey = await deriveAccountHmacKey();
  if (!hmacKey || !userId) return; // never persist plaintext when we can't encrypt
  try {
    const rows = [];
    for (const [text, translated] of Object.entries(fresh)) {
      const sourceHmac = await computeSourceHmac(hmacKey, text);
      const enc = await encryptAccountTranslation({ userId, sourceHmac, targetLanguage: lang, translatedText: translated });
      if (enc) rows.push({ user_id: userId, target_language: lang, expires_at: expiryIso(), ...enc });
    }
    if (rows.length) {
      await supabase.from('translations').upsert(rows, { onConflict: 'user_id,target_language,source_hmac' });
    }
  } catch {
    // non-fatal — the translation still shows this session (memCache).
  }
}

// ── Community (group-key) encrypted, shared cache ────────────────────────────
async function fillFromGroupCache(todo, lang, groupId) {
  const gk = await ensureGroupKey(groupId);
  const hmacKey = await deriveGroupHmacKey(gk?.key);
  if (!gk || !hmacKey) return todo;
  try {
    const byHmac = new Map();
    for (const text of todo) byHmac.set(await computeSourceHmac(hmacKey, text), text);
    const { data } = await supabase
      .from('community_translations')
      .select('source_hmac, target_language, encrypted_translation, nonce, encryption_version, key_version')
      .eq('group_id', groupId)
      .eq('target_language', lang)
      .eq('key_version', gk.version)
      .in('source_hmac', [...byHmac.keys()]);
    if (!memCache[lang]) memCache[lang] = {};
    const hit = new Set();
    for (const row of data || []) {
      const text = byHmac.get(row.source_hmac);
      if (!text) continue;
      const translated = await decryptGroupTranslation({ groupKey: gk.key, groupId, row });
      if (translated != null) {
        memCache[lang][text] = translated;
        hit.add(text);
      }
    }
    return todo.filter((t) => !hit.has(t));
  } catch {
    return todo;
  }
}

async function writeGroupCache(fresh, lang, groupId) {
  const gk = await ensureGroupKey(groupId);
  const hmacKey = await deriveGroupHmacKey(gk?.key);
  if (!gk || !hmacKey) return;
  try {
    const rows = [];
    for (const [text, translated] of Object.entries(fresh)) {
      const sourceHmac = await computeSourceHmac(hmacKey, text);
      const enc = await encryptGroupTranslation({
        groupKey: gk.key,
        groupId,
        sourceHmac,
        targetLanguage: lang,
        keyVersion: gk.version,
        translatedText: translated,
      });
      if (enc) rows.push({ group_id: groupId, target_language: lang, ...enc });
    }
    if (rows.length) {
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

async function translateChunks(todo, lang) {
  const CHUNK = 20;
  const fresh = {};
  for (let i = 0; i < todo.length; i += CHUNK) {
    Object.assign(fresh, await callTranslate(todo.slice(i, i + CHUNK), lang));
  }
  return fresh;
}

// Clear the in-memory translation cache. Called on sign-out, account switch, and
// vault lock so no decrypted translation lingers in memory.
export function clearTranslationCache() {
  memCache = {};
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
  translateTexts: async (texts, lang, userId, groupId) => {
    if (!lang || !aiEnabled || !userId) return;
    const langCache = memCache[lang] || {};
    const todo = [...new Set((texts || []).filter((x) => x && !langCache[x]))];
    if (todo.length === 0) return;

    set({ translating: true });
    try {
      const remaining = groupId
        ? await fillFromGroupCache(todo, lang, groupId)
        : await fillFromAccountCache(todo, lang, userId);

      const fresh = await translateChunks(remaining, lang);
      if (Object.keys(fresh).length > 0) {
        if (!memCache[lang]) memCache[lang] = {};
        Object.assign(memCache[lang], fresh);
        await writeAccountCache(fresh, lang, userId);
        if (groupId) await writeGroupCache(fresh, lang, groupId);
      }
    } finally {
      set({ translating: false });
    }
  },

  // Translate all not-yet-cached texts for the given lang, resolving existing
  // encrypted rows first, then AI-translating and persisting the rest (encrypted).
  translateContent: async (prayers, categories, lang, userId) => {
    if (!lang || !aiEnabled || !userId) return;
    const langCache = memCache[lang] || {};

    const toTranslate = new Set();
    categories.forEach((c) => {
      if (c.name && !langCache[c.name]) toTranslate.add(c.name);
    });
    prayers.forEach((p) => {
      if (p.title && !langCache[p.title]) toTranslate.add(p.title);
      if (p.description && !langCache[p.description]) toTranslate.add(p.description);
      if (p.testimony && !langCache[p.testimony]) toTranslate.add(p.testimony);
      (p.prayer_updates || []).forEach((u) => {
        if (u.text && !langCache[u.text]) toTranslate.add(u.text);
      });
      (p.prayer_points || []).forEach((pp) => {
        if (pp.title && !langCache[pp.title]) toTranslate.add(pp.title);
        // Scripture text is NEVER sent through AI translation — authoritative verse
        // text comes from the bundle / YouVersion, or stays in its original language.
      });
    });

    const texts = [...toTranslate].filter(Boolean);
    if (texts.length === 0) return;

    set({ translating: true });
    try {
      const remaining = await fillFromAccountCache(texts, lang, userId);
      const fresh = await translateChunks(remaining, lang);
      if (Object.keys(fresh).length === 0) return;
      if (!memCache[lang]) memCache[lang] = {};
      Object.assign(memCache[lang], fresh);
      await writeAccountCache(fresh, lang, userId);
    } finally {
      set({ translating: false });
    }
  },
}));

export default useTranslationStore;
