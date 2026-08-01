// Scripture-first guidance for a prayer request. This is deliberately NOT a
// prayer generator: it returns passages to read, faithful context, themes, and
// reflection questions — so the user meets God's Word BEFORE (and instead of
// leaning on) any AI-written prayer. Generating actual prayer points stays a
// separate, opt-in last step (see aiRecommendations.getAIRecommendations).
import { callClaudeForJson, localizeAiError } from './lib/aiCore';

const cache = new Map();

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
    task: 'scripture_guidance',
    input: { title, description, lang },
    shape: 'object',
    feature: 'guidance',
  });

  if (error) return { guidance: null, error: localizeAiError(error, lang) };
  if (!data) return { guidance: null, error: null };

  const guidance = normalize(data);
  if (guidance.passages.length === 0) return { guidance: null, error: null };

  cache.set(cacheKey, guidance);
  return { guidance, error: null };
}
