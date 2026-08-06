// Optional AI assistance for prayer: suggested prayer points (with Scripture
// references). This is deliberately the LAST, opt-in step — Scripture comes first
// (see scriptureGuidance.js), and it is offered INSIDE a prayer, never as a
// persistent control on Today. All calls run through aiCore, so they share the one
// theological guardrail (the gateway's system prompt) and the one client cooldown.
//
// The gateway returns references only ({ title, references: [{ ref, why }] }); it
// never generates verse text. We map that to the UI's { title, verses: [{ ref,
// text }] } shape with empty text — the verse reader fills the wording from
// trusted Scripture sources.
import { callAiForJson, localizeAiError } from './lib/aiCore';
import { AI_MODEL_HINT } from './lib/aiClient';
import { createAiCache, aiCacheKey } from './lib/aiResultCache';
import { redactMany } from './lib/aiRedaction';
import useAuthStore from './store/authStore';
import usePrayerStore from './store/prayerStore';

const cache = createAiCache();

function normalize(data) {
  const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : [];
  return recommendations
    .filter((r) => r && r.title && Array.isArray(r.references))
    .map((r) => ({
      title: String(r.title),
      verses: r.references
        .filter((ref) => ref && ref.ref)
        .map((ref) => ({ ref: String(ref.ref), text: '', why: ref.why ? String(ref.why) : '' })),
    }))
    .filter((r) => r.verses.length > 0);
}

export async function getAIRecommendations({ title, description = '', update = '', type = 'new', lang = 'fr' }) {
  const isEvolution = type === 'evolution';
  const userId = useAuthStore.getState().user?.id;
  const settings = usePrayerStore.getState().settings || {};
  // Minimum-data default: the title is always sent; the description and the latest
  // update are each excluded unless the user opts in. Whatever is opted in is
  // composed into the single context string the gateway sees as `description`.
  const sendDescription = !!settings.aiSendDescription;
  const sendUpdate = !!settings.aiSendUpdate;
  const hideNames = !!settings.aiHideNames;
  const parts = [];
  if (sendDescription && description && description.trim()) parts.push(description.trim());
  if (sendUpdate && update && update.trim()) parts.push(update.trim());
  const effectiveContext = parts.join('\n\n');
  const kind = isEvolution ? 'evolution' : 'new';

  const key = await aiCacheKey({
    userId,
    task: 'prayer_recommendations',
    model: AI_MODEL_HINT,
    lang,
    input: { title, context: effectiveContext, kind, hideNames },
  });
  if (cache.has(key)) return { recs: cache.get(key), error: null };

  const { texts } = redactMany([title, effectiveContext], { hideNames });
  const { data, error } = await callAiForJson({
    task: 'prayer_recommendations',
    input: { title: texts[0], description: texts[1], kind, lang },
    feature: 'points',
  });
  if (error) return { recs: [], error: localizeAiError(error, lang) };

  const recs = normalize(data);
  if (recs.length > 0) cache.set(key, recs);
  return { recs, error: null };
}
