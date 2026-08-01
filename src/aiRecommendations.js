// Optional AI assistance for prayer: suggested prayer points (with verses).
// This is deliberately the LAST, opt-in step — Scripture comes first (see
// scriptureGuidance.js), and it is offered INSIDE a prayer, never as a
// persistent control on Today. All calls run through aiCore, so they share
// the one theological guardrail system prompt and the one client-side cooldown.
//
// Prompts are written in English with the target language handled by the
// guardrail system prompt ("Write ALL content in <language>"). That covers all
// 16 supported languages — earlier this file only had prompts for 4 and silently
// fell back to French for the rest.
import { callClaudeForJson, localizeAiError } from './lib/aiCore';

const cache = new Map();

export async function getAIRecommendations({ title, description = '', type = 'new', lang = 'fr' }) {
  const cacheKey = `${lang}:${type}:${title}:${description}`.slice(0, 100);
  if (cache.has(cacheKey)) return { recs: cache.get(cacheKey), error: null };

  const isEvolution = type === 'evolution';
  const { data, error } = await callClaudeForJson({
    task: 'prayer_recommendations',
    input: { title, description, kind: isEvolution ? 'evolution' : 'new', lang },
    shape: 'array',
    feature: 'points',
  });
  if (error) return { recs: [], error: localizeAiError(error, lang) };

  const recs = Array.isArray(data)
    ? data
        .filter((r) => r && r.title && Array.isArray(r.verses) && r.verses.length > 0)
        .map((r) => ({ ...r, verses: r.verses.filter((v) => v && v.ref) }))
    : [];
  if (recs.length > 0) cache.set(cacheKey, recs);
  return { recs, error: null };
}
