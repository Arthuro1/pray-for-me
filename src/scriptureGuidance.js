// Scripture-first guidance for a prayer request. This is deliberately NOT a
// prayer generator: it returns passages to read, faithful context, themes, and
// reflection questions — so the user meets God's Word BEFORE (and instead of
// leaning on) any AI-written prayer. Generating actual prayer points stays a
// separate, opt-in last step (see aiRecommendations.getAIRecommendations).
import { callClaudeForJson, getRemainingCooldown, localizeAiError } from './lib/aiCore';

export { getRemainingCooldown };

const cache = new Map();

function buildPrompt(title, description) {
  return `A believer wants to bring this to God in prayer.
Request: "${title}".${description ? `\nDetails: "${description}".` : ''}

Help them BEGIN WITH SCRIPTURE before they pray. Respond with a JSON object of exactly this shape:
{
  "passages": [
    {
      "ref": "a real Bible reference, e.g. Psalm 103:1-5",
      "readWhole": "the chapter to read in full, e.g. Psalm 103",
      "text": "the full text of 1-2 key verses from this passage",
      "why": "one humble sentence on how this passage, in its context, speaks to the request"
    }
  ],
  "context": "2-3 sentences of faithful context for the main passage (who wrote it, to whom, its point). No speculation, no private interpretation.",
  "themes": ["2-4 short biblical themes this request can be prayed around"],
  "reflections": ["2-3 reflection questions that turn the believer's eyes to God's character and to the passage itself"]
}

Give 1 to 3 passages, preferring whole chapters or larger sections over isolated proof texts.`;
}

function normalize(data) {
  const passages = (Array.isArray(data?.passages) ? data.passages : [])
    .filter((p) => p && p.ref)
    .map((p) => ({
      ref: String(p.ref),
      readWhole: p.readWhole ? String(p.readWhole) : String(p.ref),
      text: p.text ? String(p.text) : '',
      why: p.why ? String(p.why) : '',
    }));
  const themes = (Array.isArray(data?.themes) ? data.themes : []).filter(Boolean).map(String);
  const reflections = (Array.isArray(data?.reflections) ? data.reflections : []).filter(Boolean).map(String);
  const context = typeof data?.context === 'string' ? data.context : '';
  return { passages, context, themes, reflections };
}

// Returns { guidance, error }. guidance is null when nothing usable came back.
export async function getScriptureGuidance({ title, description = '', lang = 'fr' }) {
  if (!title) return { guidance: null, error: null };

  const cacheKey = `sg:${lang}:${title}:${description}`.slice(0, 120);
  if (cache.has(cacheKey)) return { guidance: cache.get(cacheKey), error: null };

  const { data, error } = await callClaudeForJson({
    prompt: buildPrompt(title, description),
    lang,
    maxTokens: 900,
    shape: 'object',
  });

  if (error) return { guidance: null, error: localizeAiError(error, lang) };
  if (!data) return { guidance: null, error: null };

  const guidance = normalize(data);
  if (guidance.passages.length === 0) return { guidance: null, error: null };

  cache.set(cacheKey, guidance);
  return { guidance, error: null };
}
