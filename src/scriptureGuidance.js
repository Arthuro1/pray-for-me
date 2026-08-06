// Scripture-first guidance for a prayer request. This is deliberately NOT a
// prayer generator: it returns passages to READ (references only — the model
// never generates verse text), faithful context, themes, and reflection
// questions, so the user meets God's Word BEFORE (and instead of leaning on) any
// AI-written prayer. Actual verse text is filled in by the app's trusted
// Scripture sources at render time (VerseAccordion), never by the model.
import { callAiForJson, localizeAiError } from './lib/aiCore';
import { AI_MODEL_HINT } from './lib/aiClient';
import { createAiCache, aiCacheKey } from './lib/aiResultCache';
import { redactMany } from './lib/aiRedaction';
import useAuthStore from './store/authStore';
import usePrayerStore from './store/prayerStore';

// Account-scoped, SHA-256-keyed cache (see aiResultCache). Cleared on sign-out,
// account switch, vault lock, and AI consent withdrawal.
const cache = createAiCache();

// The gateway returns passages as { ref, readWhole, why } — references only. We
// normalize to the shape the UI expects, with `text` always empty; the verse
// reader resolves the wording from trusted Scripture sources.
function normalize(data) {
  const passages = (Array.isArray(data?.passages) ? data.passages : [])
    .filter((p) => p && p.ref)
    .map((p) => ({
      ref: String(p.ref),
      readWhole: p.readWhole ? String(p.readWhole) : String(p.ref),
      text: '',
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

  const userId = useAuthStore.getState().user?.id;
  const settings = usePrayerStore.getState().settings || {};
  // Minimum-data default: the title is sent, the description is EXCLUDED unless the
  // user has explicitly opted in (aiSendDescription).
  const sendDescription = !!settings.aiSendDescription;
  const effectiveDescription = sendDescription ? description : '';

  const key = await aiCacheKey({
    userId,
    task: 'scripture_guidance',
    model: AI_MODEL_HINT,
    lang,
    input: { title, description: effectiveDescription },
  });
  if (cache.has(key)) return { guidance: cache.get(key), error: null };

  // Redact high-confidence sensitive tokens (emails, phones, secrets, …) before
  // transmission. The guidance output is references + explanations, so no
  // placeholder restoration is needed on the response.
  const { texts } = redactMany([title, effectiveDescription]);

  const { data, error } = await callAiForJson({
    task: 'scripture_guidance',
    input: { title: texts[0], description: texts[1], lang },
    feature: 'guidance',
  });

  if (error) return { guidance: null, error: localizeAiError(error, lang) };
  if (!data) return { guidance: null, error: null };

  const guidance = normalize(data);
  if (guidance.passages.length === 0) return { guidance: null, error: null };

  cache.set(key, guidance);
  return { guidance, error: null };
}
