import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const isDev = import.meta.env.DEV;
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

// In-memory cache for fast lookups: { [lang]: { [originalText]: translatedText } }
let memCache = {};

async function callTranslate(texts, targetLang) {
  if (!API_KEY || texts.length === 0) return {};

  const LANG_NAMES = { fr: 'French', en: 'English', de: 'German', pt: 'Brazilian Portuguese', zh: 'Simplified Chinese', es: 'Spanish', hi: 'Hindi', ja: 'Japanese', sw: 'Swahili', am: 'Amharic', id: 'Indonesian', tl: 'Tagalog', ko: 'Korean', ru: 'Russian', ar: 'Arabic', fa: 'Persian' };
  const langName = LANG_NAMES[targetLang] || 'English';

  const endpoint = isDev ? '/api/anthropic/v1/messages' : '/api/anthropic';
  const headers = { 'Content-Type': 'application/json' };
  if (isDev) {
    headers['x-api-key'] = API_KEY;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  const prompt = `Translate the following texts to ${langName}. Keep proper nouns, Bible references (e.g. "John 3:16"), and names unchanged. Return ONLY a valid JSON object mapping each index to its translation, no extra text:
${JSON.stringify(Object.fromEntries(texts.map((t, i) => [i, t])))}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
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

const useTranslationStore = create((set, get) => ({
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

  // Translate all texts not yet in DB for the given lang, then save to Supabase
  translateContent: async (prayers, categories, lang, userId) => {
    if (!lang || !API_KEY || !userId) return;

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
        if (pp.verse_text && !langCache[pp.verse_text]) toTranslate.add(pp.verse_text);
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
