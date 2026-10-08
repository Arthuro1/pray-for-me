import { supabase } from './supabase';
import { getAiProvider, hasAiProviderAcknowledgement } from './aiProvider';
import { aiLimitGeneration, getAiLimitResponse, readAiLimit, rememberAiLimit } from './aiLimits';

// Browser client for Qetoret's authenticated AI tasks.
//
// No external AI provider is ever contacted from the browser. Requests go to the
// app's OWN origin (`/api/ai`) for Claude. An explicitly configured private
// provider can use VITE_AI_GATEWAY_URL on a separate public host. The browser
// can only ask for a server-defined { task, input }; it
// cannot choose a model, system prompt, temperature, token budget, or message
// history — those live only on the server. There is NO client-side API key and
// NO browser-side provider fallback, so nothing sensitive can be inlined into the
// bundle. AI is therefore always "enabled" from the client's point of view; the
// server is the gatekeeper for whether inference is actually available.
export const aiEnabled = true;

// Claude always uses same-origin /api/ai, including when an old deployment still
// has a gateway override. Only private inference may use a dedicated gateway;
// its public origin must then be allowed in CSP connect-src.
const GATEWAY_URL = getAiProvider() === 'anthropic' ? '' : import.meta.env.VITE_AI_GATEWAY_URL || '';
const ENDPOINT = GATEWAY_URL ? `${GATEWAY_URL.replace(/\/$/, '')}/v1/tasks` : '/api/ai';

// Public model hint, used ONLY to key client caches so a model change invalidates
// them. Not a secret; the real model is chosen server-side.
export const AI_MODEL_HINT = import.meta.env.VITE_AI_MODEL || 'server';

// Request one server-defined task. Returns the raw fetch Response so callers can
// branch on status; the server replies with a normalized { data, usage } body.
export async function aiFetch(task, input, { signal } = {}) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const headers = { 'Content-Type': 'application/json' };
  // Same-origin deployments use this to reject an outdated client disclosure
  // after the server switches providers. Direct gateway deployments retain their
  // existing CORS header contract.
  if (!GATEWAY_URL) headers['X-Qetoret-AI-Provider'] = getAiProvider();

  // The server verifies the Supabase token and enforces shared user quotas.
  const { data: { session } } = await supabase.auth.getSession();
  // Includes translation requests triggered by a saved preference: an old
  // private-service opt-in must never silently authorize an external provider.
  let providerConsent = true;
  if (getAiProvider() === 'anthropic') {
    // Import after initialization to avoid the store -> AI helpers -> transport
    // cycle. Synced revocation remains authoritative even if a local provider
    // acknowledgement survives on this device.
    const { default: usePrayerStore } = await import('../store/prayerStore');
    const { userId, settings } = usePrayerStore.getState();
    providerConsent = !!session?.user?.id && userId === session.user.id && (
      (settings.aiConsentPrayer && hasAiProviderAcknowledgement(userId, 'prayer')) ||
      (settings.aiConsentHome && hasAiProviderAcknowledgement(userId, 'home'))
    );
  }
  if (!providerConsent) {
    return new Response(JSON.stringify({ error: 'AI consent required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  const account = `${getAiProvider()}:${session?.user?.id || ''}`;
  const limited = getAiLimitResponse(account);
  if (limited) return limited;
  // Consent can be withdrawn or the vault locked while session lookup/imports
  // are pending. A cancelled translation must never dispatch its captured text.
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const generation = aiLimitGeneration();
  const response = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ task, input }), ...(signal ? { signal } : {}) });
  if (response.status === 429 && !signal?.aborted) {
    const limit = await readAiLimit(response.clone());
    rememberAiLimit(account, limit, generation);
  }
  return response;
}
