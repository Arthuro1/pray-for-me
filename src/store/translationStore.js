import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { aiEnabled, anthropicFetch } from '../lib/anthropic';
import { hashText } from '../utils/hash';

// In-memory cache for fast lookups: { [lang]: { [originalText]: translatedText } }
let memCache = {};

// ── Group-scoped shared cache (community_translations) ───────────────────────
// Community requests are visible to every member of the group, so their
// translations can be shared among those same members — the first member's
// translation spares everyone else the AI call. Scoped to the group, never used
// for private personal prayers.

// Fill memCache from the group cache; return the subset still needing translation.
async function fillFromGroupCache(todo, lang, groupId) {
  try {
    const byHash = new Map(todo.map((txt) => [hashText(txt), txt]));
    const { data } = await supabase
      .from('community_translations')
      .select('source_hash, original_text, translated_text')
      .eq('group_id', groupId)
      .eq('lang', lang)
      .in('source_hash', [...byHash.keys()]);
    if (!memCache[lang]) memCache[lang] = {};
    const hit = new Set();
    for (const row of data || []) {
      // Trust a row only on an exact original-text match (guards hash collisions).
      if (byHash.get(row.source_hash) === row.original_text) {
        memCache[lang][row.original_text] = row.translated_text;
        hit.add(row.original_text);
      }
    }
    return todo.filter((txt) => !hit.has(txt));
  } catch {
    return todo; // table missing / offline → translate everything
  }
}

// Contribute freshly-translated texts back to the group cache for the next member.
async function writeGroupCache(fresh, lang, groupId) {
  try {
    const rows = Object.entries(fresh).map(([original_text, translated_text]) => ({
      group_id: groupId,
      lang,
      source_hash: hashText(original_text),
      original_text,
      translated_text,
    }));
    await supabase
      .from('community_translations')
      .upsert(rows, { onConflict: 'group_id,lang,source_hash', ignoreDuplicates: true });
  } catch {
    // non-fatal — the translation still shows this session.
  }
}

async function callTranslate(texts, targetLang) {
  if (!aiEnabled || texts.length === 0) return {};

  const LANG_NAMES = { fr: 'French', en: 'English', de: 'German', pt: 'Brazilian Portuguese', zh: 'Simplified Chinese', es: 'Spanish', hi: 'Hindi', ja: 'Japanese', sw: 'Swahili', am: 'Amharic', id: 'Indonesian', tl: 'Tagalog', ko: 'Korean', ru: 'Russian', ar: 'Arabic', fa: 'Persian' };
  const langName = LANG_NAMES[targetLang] || 'English';

  const prompt = `Translate the following texts to ${langName}. Keep proper nouns, Bible references (e.g. "John 3:16"), and names unchanged. Return ONLY a valid JSON object mapping each index to its translation, no extra text:
${JSON.stringify(Object.fromEntries(texts.map((t, i) => [i, t])))}`;

  try {
    const res = await anthropicFetch({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    if (!res.ok) return {};
    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    const parsed = JSON.parse(match[0]);
    const result = {};
    texts.forEach((t, i) => { if (parsed[i]) result[t] = parsed[i]; });
    return result;
  } catch {
    return {};
  }
}

const useTranslationStore = create((set) => ({
  translating: false,

  // Load all translations for a user from Supabase into memCache
  loadTranslations: async (userId) => {
    const { data } = await supabase
      .from('translations')
      .select('lang, original_text, translated_text')
      .eq('user_id', userId);

    if (!data) return;
    memCache = {};
    for (const row of data) {
      if (!memCache[row.lang]) memCache[row.lang] = {};
      memCache[row.lang][row.original_text] = row.translated_text;
    }
    // Trigger re-render
    set({});
  },

  // Get translated text from memCache, fallback to original
  tr: (text, lang) => {
    if (!text || !lang) return text;
    return memCache[lang]?.[text] ?? text;
  },

  // Translate an arbitrary list of texts to lang (skipping already-cached ones).
  // Used for on-demand community translation: when groupId is given, translations
  // are shared across the group so each member doesn't re-pay for the same text.
  translateTexts: async (texts, lang, userId, groupId) => {
    if (!lang || !aiEnabled || !userId) return;
    const langCache = memCache[lang] || {};
    const todo = [...new Set((texts || []).filter((x) => x && !langCache[x]))];
    if (todo.length === 0) return;

    set({ translating: true });

    // Reuse anything a fellow group member already translated before calling AI.
    const stillTodo = groupId ? await fillFromGroupCache(todo, lang, groupId) : todo;

    const CHUNK = 20;
    const fresh = {};
    for (let i = 0; i < stillTodo.length; i += CHUNK) {
      Object.assign(fresh, await callTranslate(stillTodo.slice(i, i + CHUNK), lang));
    }
    if (Object.keys(fresh).length > 0) {
      if (!memCache[lang]) memCache[lang] = {};
      Object.assign(memCache[lang], fresh);
      const rows = Object.entries(fresh).map(([original_text, translated_text]) => ({ user_id: userId, lang, original_text, translated_text }));
      await supabase.from('translations').upsert(rows, { onConflict: 'user_id,lang,original_text', ignoreDuplicates: true });
      if (groupId) await writeGroupCache(fresh, lang, groupId);
    }
    set({ translating: false });
  },

  // Translate all texts not yet in DB for the given lang, then save to Supabase
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
        // Scripture text (pp.verse_text / verses) is NEVER sent through AI
        // translation — authoritative verse text comes from the bundle /
        // YouVersion via useLocalizedVerse, or stays in its original language.
      });
    });

    const texts = [...toTranslate].filter(Boolean);
    if (texts.length === 0) return;

    set({ translating: true });

    const CHUNK = 20;
    const newTranslations = {};
    for (let i = 0; i < texts.length; i += CHUNK) {
      const chunk = texts.slice(i, i + CHUNK);
      const result = await callTranslate(chunk, lang);
      Object.assign(newTranslations, result);
    }

    if (Object.keys(newTranslations).length === 0) {
      set({ translating: false });
      return;
    }

    // Update memCache
    if (!memCache[lang]) memCache[lang] = {};
    Object.assign(memCache[lang], newTranslations);

    // Save to Supabase with upsert (unique on user_id, lang, original_text)
    const rows = Object.entries(newTranslations).map(([original_text, translated_text]) => ({
      user_id: userId,
      lang,
      original_text,
      translated_text,
    }));

    await supabase
      .from('translations')
      .upsert(rows, { onConflict: 'user_id,lang,original_text', ignoreDuplicates: true });

    set({ translating: false });
  },
}));

export default useTranslationStore;
