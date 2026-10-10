// Optional AI assistance for prayer: suggested prayer points (with Scripture
// references). This is deliberately the LAST, opt-in step — Scripture comes first
// (see scriptureGuidance.js), and it is offered INSIDE a prayer, never as a
// persistent control on Today. All calls run through aiCore, so they share the one
// theological guardrail (the gateway's system prompt) and the one client cooldown.
//
// The gateway returns references only ({ recommendations: [{ title, references }] }); it never
// generates verse text. Any wording that slips through is dropped below — the
// verse reader fills it from trusted Scripture sources.
import { callAiForJson, localizeAiError } from './lib/aiCore';
import { AI_MODEL_HINT } from './lib/aiClient';
import { createAiCache, aiCacheKey } from './lib/aiResultCache';
import { preparePrayerAiInput, selectPrayerAiInput } from './lib/aiPrayerInput';
import useAuthStore from './store/authStore';
import usePrayerStore from './store/prayerStore';

const cache = createAiCache();

export async function getAIRecommendations({ title, description = '', update = '', type = 'new', lang = 'fr', reviewedInput = null }) {
  const isEvolution = type === 'evolution';
  const userId = useAuthStore.getState().user?.id;
  const settings = usePrayerStore.getState().settings || {};
  // Minimum-data default: the title is always sent; the description and the latest
  // update are each excluded unless the user opts in. Whatever is opted in is
  // composed into the single context string the gateway sees as `description`.
  const selected = reviewedInput || selectPrayerAiInput({ title, description, update }, settings);
  const effectiveContext = [selected.description, selected.update].filter(Boolean).join('\n\n');
  const outgoing = preparePrayerAiInput(selected);
  const kind = isEvolution ? 'evolution' : 'new';

  const key = await aiCacheKey({
    userId,
    task: 'prayer_recommendations',
    model: AI_MODEL_HINT,
    lang,
    input: { title: selected.title, context: effectiveContext, kind },
  });
  if (cache.has(key)) return { recs: cache.get(key), error: null };

  const { data, error } = await callAiForJson({
    task: 'prayer_recommendations',
    input: { title: outgoing.title, description: outgoing.context, kind, lang },
    feature: 'points',
  });
  if (error) return { recs: [], error: localizeAiError(error, lang) };

  // Accept the validated gateway envelope and the older array shape during
  // rollout. Explicitly keep only the fields the UI needs, never model wording
  // masquerading as Scripture or extra payload fields.
  const suggestions = Array.isArray(data) ? data : data?.recommendations;
  const recs = (Array.isArray(suggestions) ? suggestions : [])
    .filter((r) => r && typeof r.title === 'string' && r.title.trim())
    .map((r) => ({
      title: r.title,
      verses: (Array.isArray(r.references) ? r.references : Array.isArray(r.verses) ? r.verses : [])
        .filter((v) => v && typeof v.ref === 'string' && v.ref.trim())
        .map((v) => ({ ref: v.ref })),
    }))
    .filter((r) => r.verses.length > 0);
  if (recs.length > 0) cache.set(key, recs);
  return { recs, error: null };
}
