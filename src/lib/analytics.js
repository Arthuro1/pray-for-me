// Privacy-preserving product analytics — a single choke point for every event so
// tracking can be audited, disabled, or swapped in one place.
//
// HARD PRIVACY RULE: this helper must NEVER emit prayer content or anything that
// could reveal it — no prayer text, titles, descriptions, person names, phone
// numbers, testimonies, group content, or AI prompts. It enforces this
// structurally, not by convention:
//   • Only event names on the ALLOWED list are sent.
//   • Only a small allowlist of NON-sensitive property keys is kept, and only
//     when their value is a plain scalar (string ≤ 64 chars / number / boolean).
//   • Everything else — unknown keys, objects, arrays, long strings — is dropped
//     before the event ever leaves the device.
//
// Events describe product ACTIVATION and HABIT FORMATION (that a thing happened),
// never WHAT the thing contained.
import { track as vercelTrack } from '@vercel/analytics';
import { devError } from './logger';

// Canonical event names. Reference these constants at call sites.
export const EVENTS = Object.freeze({
  FIRST_PRAYER_CREATED: 'first_prayer_created',
  REMINDER_SET: 'reminder_set',
  PRAYER_PRAYED: 'prayer_prayed',
  PRAYER_UPDATED: 'prayer_updated',
  PRAYER_ANSWERED: 'prayer_answered',
  VAULT_ENABLED: 'vault_enabled',
  AI_CONSENT_ENABLED: 'ai_consent_enabled',
  AI_CONSENT_REVOKED: 'ai_consent_revoked',
  GROUP_JOINED: 'group_joined',
  PRAYER_SHARED: 'prayer_shared',
  DATA_EXPORTED: 'data_exported',
  ACCOUNT_DELETED_STARTED: 'account_deleted_started',
  PRIVACY_CENTER_OPENED: 'privacy_center_opened',
});

const ALLOWED_EVENTS = new Set(Object.values(EVENTS));

// The ONLY property keys that may ever accompany an event. None of these can
// carry free text about a prayer. Adding a key here is a deliberate act — think
// hard before allowing anything that could echo user content.
const ALLOWED_PROP_KEYS = new Set([
  'source',       // where the action originated (e.g. 'onboarding', 'settings')
  'method',       // e.g. reminder type: 'daily' | 'weekly' | 'followUp'
  'channel',      // e.g. share channel: 'group' | 'link'
  'reminderType',
  'step',         // onboarding step index
  'count',        // an aggregate count (never an id)
  'enabled',      // boolean toggle state
]);

const MAX_STRING_LEN = 64;

export function isEventAllowed(name) {
  return ALLOWED_EVENTS.has(name);
}

// Keep only allowlisted keys whose value is a safe scalar. Returns a new object;
// returns undefined when there's nothing safe to send (so callers can omit props).
export function sanitizeProps(props) {
  if (!props || typeof props !== 'object') return undefined;
  const out = {};
  for (const key of Object.keys(props)) {
    if (!ALLOWED_PROP_KEYS.has(key)) continue;
    const value = props[key];
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'boolean') out[key] = value;
    else if (typeof value === 'string' && value.length > 0 && value.length <= MAX_STRING_LEN) out[key] = value;
    // objects, arrays, functions, long strings, null/undefined → dropped
  }
  return Object.keys(out).length ? out : undefined;
}

// Analytics can be globally disabled (e.g. a future "no analytics" preference or
// a Do-Not-Track signal). Defaults to enabled; never throws.
export function isAnalyticsEnabled() {
  try {
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return false;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('pfm_analytics_off') === '1') return false;
  } catch { /* storage/navigator unavailable — default enabled */ }
  return true;
}

// Emit one product event. Silently ignores unknown events and never lets an
// analytics failure surface to the user or interrupt the flow.
export function track(name, props) {
  try {
    if (!isEventAllowed(name) || !isAnalyticsEnabled()) return;
    const safe = sanitizeProps(props);
    if (safe) vercelTrack(name, safe);
    else vercelTrack(name);
  } catch (e) {
    devError('analytics track failed', name);
  }
}
