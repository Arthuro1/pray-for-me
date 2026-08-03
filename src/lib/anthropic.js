import { supabase } from './supabase';

// The Anthropic API key is NEVER referenced from client code or import.meta.env,
// so it can never be inlined into the browser bundle (no VITE_ fallback). Both
// dev and prod route through the same server handler. In development a Vite
// middleware adapter invokes api/anthropic.js; in production Vercel invokes it
// as a serverless function. Both require a Supabase session and enforce the same
// structured tasks, pinned model, payload caps, quotas, and circuit breaker.
// AI is therefore always "enabled" from the client's point of view; the proxy is
// the single gatekeeper for whether the key is actually configured.
export const aiEnabled = true;

// Request one server-defined task. The browser cannot choose a model, system
// prompt, role, token budget, or arbitrary message sequence.
export async function anthropicFetch(task, input) {
  const endpoint = '/api/anthropic';
  const headers = { 'Content-Type': 'application/json' };

  // Attach the user's access token so the proxy can authorize the request. In
  // Both the Vite adapter and production serverless function require it.
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  return fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ task, input }) });
}
