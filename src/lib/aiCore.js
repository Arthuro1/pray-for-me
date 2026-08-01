// Shared client-side cooldown and JSON parsing for the finite AI tasks. Security
// prompts, model selection, and token budgets live only in api/anthropic.js.
import { anthropicFetch } from './anthropic';
import { devError } from './logger';
import { t } from '../i18n';

const COOLDOWN_MS = 5000;

// Per-feature cooldowns. The throttle is meant to stop one feature from being
// hammered, not to make unrelated actions block each other — so each distinct
// action (Scripture guidance, prayer points, day plan, verse reader) keeps its
// own timer. Asking for prayer points then opening a verse no longer trips a
// shared "please wait Ns". Callers pass a stable `feature` key; unkeyed calls
// share a single 'default' bucket.
const lastCallByFeature = new Map();

export function getRemainingCooldown(feature = 'default') {
  const last = lastCallByFeature.get(feature) || 0;
  return Math.max(0, Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000));
}

// Map a typed error from callClaudeForJson to localized, user-facing copy.
// Centralized so every AI caller surfaces the same wording in the user's language.
export function localizeAiError(error, lang) {
  if (!error) return null;
  if (error.type === 'cooldown') return t(lang, 'aiCooldown', { s: error.seconds });
  if (error.type === 'busy') return t(lang, 'aiBusy');
  // Dev-only, and only the typed token — never the prompt/prayer content.
  devError('AI request failed', error.type);
  return t(lang, 'aiError');
}

// Sends one guardrailed request to Claude and returns the first JSON value found
// in the response. `shape` selects whether we expect a top-level object or array.
// Errors come back as a typed token ({ type, seconds? }) so each caller can map
// them to its own localized copy — this module stays free of i18n.
export async function callClaudeForJson({ task, input, shape = 'object', feature = 'default' }) {
  const remaining = getRemainingCooldown(feature);
  if (remaining > 0) return { data: null, error: { type: 'cooldown', seconds: remaining } };

  lastCallByFeature.set(feature, Date.now());
  try {
    const res = await anthropicFetch(task, input);

    if (res.status === 429) return { data: null, error: { type: 'busy' } };
    if (!res.ok) {
      // Log only the status — never the body, which can echo the prompt
      // (and therefore the user's prayer content).
      devError('AI request failed', res.status);
      return { data: null, error: { type: 'error' } };
    }

    const body = await res.json();
    // A 200 response can still be an incomplete answer if Claude hit maxTokens
    // mid-JSON. That's otherwise silent (no error, just an unmatched/unparsable
    // regex below), which looks identical to a real failure from the caller's
    // side — log it so a too-small maxTokens budget is diagnosable.
    if (body?.stop_reason === 'max_tokens') devError('AI response truncated (max_tokens)', feature);
    const text = body?.content?.[0]?.text || '';
    const match = text.match(shape === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/);
    if (!match) return { data: null, error: null };
    return { data: JSON.parse(match[0]), error: null };
  } catch {
    return { data: null, error: { type: 'error' } };
  }
}
