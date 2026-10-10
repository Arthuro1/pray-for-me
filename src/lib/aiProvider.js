// Public provider identity and device-local disclosure acknowledgement. This
// module deliberately imports no stores: the request transport and consent UI
// can share it without introducing a cycle. It never stores prayer content.
export const AI_PROVIDER_CONSENT_REVISION = 'anthropic:1';

export function getAiProvider() {
  // Match the server's default. Private inference must be explicitly selected;
  // an omitted build variable must never disclose Ollama while calling Claude.
  return ['ollama', 'private'].includes(import.meta.env.VITE_AI_PROVIDER) ? 'ollama' : 'anthropic';
}

export function getAiProviderLabel() {
  return getAiProvider() === 'anthropic' ? 'Claude (Anthropic)' : 'Qetoret';
}

function acknowledgementKey(userId, context) {
  return `pfm_ai_provider_consent:${encodeURIComponent(userId)}:${context}`;
}

// Old, synced consent booleans covered private processing only. An Anthropic
// build requires this account to acknowledge the new disclosure on this device.
// Omitting context checks either grant, for shared transport such as translation.
export function hasAiProviderAcknowledgement(userId, context) {
  if (getAiProvider() !== 'anthropic') return true;
  if (!userId) return false;
  const contexts = context ? [context] : ['prayer', 'home'];
  try {
    return contexts.some((item) => localStorage.getItem(acknowledgementKey(userId, item)) === AI_PROVIDER_CONSENT_REVISION);
  } catch {
    return false;
  }
}

export function acknowledgeAiProvider(userId, context = 'prayer') {
  if (getAiProvider() !== 'anthropic' || !userId) return;
  try {
    localStorage.setItem(acknowledgementKey(userId, context), AI_PROVIDER_CONSENT_REVISION);
  } catch {
    // Fail closed: without a saved acknowledgement, requests remain blocked.
  }
}

export function clearAiProviderAcknowledgement(userId) {
  if (!userId) return;
  try {
    for (const context of ['prayer', 'home']) localStorage.removeItem(acknowledgementKey(userId, context));
  } catch {
    // Storage may be unavailable; consent booleans are still withdrawn.
  }
}
