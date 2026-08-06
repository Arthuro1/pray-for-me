import { supabase } from './supabase';

// Browser client for the private, self-hosted Pray4Me AI gateway.
//
// No external AI provider is ever contacted from the browser. Requests go to the
// app's OWN origin (`/api/ai`, a thin reverse proxy to the gateway) by default,
// or to VITE_AI_GATEWAY_URL when an operator deploys the gateway on a separate
// public host. The browser can only ask for a server-defined { task, input }; it
// cannot choose a model, system prompt, temperature, token budget, or message
// history — those live only in the gateway. There is NO client-side API key and
// NO external-provider fallback, so nothing sensitive can be inlined into the
// bundle. AI is therefore always "enabled" from the client's point of view; the
// gateway is the single gatekeeper for whether inference is actually available.
export const aiEnabled = true;

// Same-origin by default (keeps the browser talking only to Pray4Me's domain and
// avoids a CSP connect-src change). An operator may point at a dedicated gateway
// host via VITE_AI_GATEWAY_URL (that public URL is not a secret, but then its
// origin must be added to the CSP connect-src).
const GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL || '';
const ENDPOINT = GATEWAY_URL ? `${GATEWAY_URL.replace(/\/$/, '')}/v1/tasks` : '/api/ai';

// Public model hint, used ONLY to key client caches so a model change invalidates
// them. Not a secret; the real model is chosen server-side.
export const AI_MODEL_HINT = import.meta.env.VITE_AI_MODEL || 'server';

// Request one server-defined task. Returns the raw fetch Response so callers can
// branch on status; the gateway replies with a normalized { data, usage } body.
export async function aiFetch(task, input) {
  const headers = { 'Content-Type': 'application/json' };

  // Attach the user's Supabase access token so the gateway can verify the JWT and
  // enforce per-user quotas. The gateway derives the user id from the token only.
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  return fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ task, input }) });
}
