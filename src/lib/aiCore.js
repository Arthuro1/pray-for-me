// Shared client-side cooldown and response handling for the finite AI tasks. The
// system prompts, model selection, token budgets, and output validation all live
// in the self-hosted gateway (services/ai-gateway); the browser only asks for a
// server-defined { task, input } and receives a validated, normalized response.
import { aiFetch } from './aiClient';
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

// Prayers whose exact outgoing text the user has already reviewed this session.
// The outgoing-text preview is shown once per prayer before its first AI request.
const previewedPrayers = new Set();

// In-memory request state (in-flight markers + cooldown timers). Cleared on
// consent withdrawal / sign-out via resetAiRequestState().
export function getRemainingCooldown(feature = 'default') {
  const last = lastCallByFeature.get(feature) || 0;
  return Math.max(0, Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000));
}

// Whether the user has reviewed the outgoing text for this prayer this session.
export function hasReviewedOutgoing(prayerId) {
  return !!prayerId && previewedPrayers.has(prayerId);
}

// Record that the user reviewed and confirmed the outgoing text for this prayer.
export function markOutgoingReviewed(prayerId) {
  if (prayerId) previewedPrayers.add(prayerId);
}

// Clear all in-memory AI request state (cooldown timers, outgoing-text reviews).
// Consent withdrawal and sign-out call this so a withdrawn user starts clean.
export function resetAiRequestState() {
  lastCallByFeature.clear();
  previewedPrayers.clear();
}

// Map a typed error from callAiForJson to localized, user-facing copy.
// Centralized so every AI caller surfaces the same wording in the user's language.
export function localizeAiError(error, lang) {
  if (!error) return null;
  if (error.type === 'cooldown') return t(lang, 'aiCooldown', { s: error.seconds });
  if (error.type === 'busy') return t(lang, 'aiBusy');
  // Dev-only, and only the typed token — never the prompt/prayer content.
  devError('AI request failed', error.type);
  return t(lang, 'aiError');
}

// Sends one guardrailed request to the gateway and returns its already-parsed,
// already-validated `data` object. The gateway performs JSON parsing and strict
// schema validation server-side, so there is no client-side regex extraction and
// no raw model text to sift through. Errors come back as a typed token
// ({ type, seconds? }) so each caller maps them to its own localized copy.
export async function callAiForJson({ task, input, feature = 'default' }) {
  const remaining = getRemainingCooldown(feature);
  if (remaining > 0) return { data: null, error: { type: 'cooldown', seconds: remaining } };

  lastCallByFeature.set(feature, Date.now());
  try {
    const res = await aiFetch(task, input);

    if (res.status === 429) return { data: null, error: { type: 'busy' } };
    if (!res.ok) {
      // Log only the status — never the body, which can echo the prompt
      // (and therefore the user's prayer content).
      devError('AI request failed', res.status);
      return { data: null, error: { type: 'error' } };
    }

    const body = await res.json().catch(() => null);
    // The gateway returns { data, usage }. `data` is the validated task result.
    const data = body?.data ?? null;
    if (data == null) return { data: null, error: null };
    return { data, error: null };
  } catch {
    return { data: null, error: { type: 'error' } };
  }
}
