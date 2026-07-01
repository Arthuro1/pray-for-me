// Optional AI assistance for prayer: suggested prayer points (with verses) and
// day-plan topics. This is deliberately the LAST, opt-in step — Scripture comes
// first (see scriptureGuidance.js). All calls run through aiCore, so they share
// the one theological guardrail system prompt and the one client-side cooldown.
//
// Prompts are written in English with the target language handled by the
// guardrail system prompt ("Write ALL content in <language>"). That covers all
// 16 supported languages — earlier this file only had prompts for 4 and silently
// fell back to French for the rest.
import { callClaudeForJson, localizeAiError } from './lib/aiCore';

const cache = new Map();

// Each point returns verses as an array: [{ref, text}, ...]
const EXAMPLE = (n) =>
  Array.from({ length: n }, () => ({
    title: '...',
    verses: [
      { ref: '...', text: '...' },
      { ref: '...', text: '...' },
    ],
  }));

const EXAMPLE_DAY = () =>
  Array.from({ length: 3 }, () => ({ title: '...', description: '...' }));

function dayPlanPrompt(categoryNames) {
  return `A believer has no prayers planned for today. Today's prayer categories are: ${categoryNames}.
Suggest 3 concrete, encouraging prayer topics for these categories — each a way to seek God, not a task to complete.
Reply ONLY with a valid JSON array, no text before or after:
${JSON.stringify(EXAMPLE_DAY())}`;
}

function pointsPrompt(title, description, isEvolution) {
  const intro = isEvolution
    ? `A believer is praying for: "${title}". They just added this update: "${description}".
Suggest 3 further prayer points suited to this update.`
    : `A believer wants to pray for: "${title}".${description ? ` Details: "${description}".` : ''}
Suggest 4 related or deeper prayer points.`;
  return `${intro}
For each point, provide 2 relevant Bible references with the full text of the key verse(s), read in context.
Reply ONLY with a valid JSON array, no text before or after:
${JSON.stringify(EXAMPLE(isEvolution ? 3 : 4))}`;
}

export async function getDayPlanSuggestions({ categoryNames, lang = 'fr' }) {
  const cacheKey = `dayplan:${lang}:${categoryNames}`;
  if (cache.has(cacheKey)) return { recs: cache.get(cacheKey), error: null };

  const { data, error } = await callClaudeForJson({
    prompt: dayPlanPrompt(categoryNames),
    lang,
    maxTokens: 600,
    shape: 'array',
    feature: 'dayplan',
  });
  if (error) return { recs: [], error: localizeAiError(error, lang) };

  const recs = Array.isArray(data) ? data.filter((r) => r && r.title) : [];
  if (recs.length > 0) cache.set(cacheKey, recs);
  return { recs, error: null };
}

export async function getAIRecommendations({ title, description = '', type = 'new', lang = 'fr' }) {
  const cacheKey = `${lang}:${type}:${title}:${description}`.slice(0, 100);
  if (cache.has(cacheKey)) return { recs: cache.get(cacheKey), error: null };

  const isEvolution = type === 'evolution';
  const { data, error } = await callClaudeForJson({
    prompt: pointsPrompt(title, description, isEvolution),
    lang,
    maxTokens: 1200,
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
