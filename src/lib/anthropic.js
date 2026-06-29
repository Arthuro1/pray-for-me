import { supabase } from './supabase';

// The Anthropic API key is NEVER referenced from client code or import.meta.env,
// so it can never be inlined into the browser bundle (no VITE_ fallback). Both
// dev and prod route through a server-side proxy that injects the key:
//   • dev  → the Vite dev-server proxy (vite.config.js) adds the x-api-key
//            header from process.env.ANTHROPIC_API_KEY (Node-side, not bundled).
//   • prod → the /api/anthropic serverless function, which also enforces a valid
//            Supabase session, a pinned model, payload caps and rate limiting.
// AI is therefore always "enabled" from the client's point of view; the proxy is
// the single gatekeeper for whether the key is actually configured.
const isDev = import.meta.env.DEV;
export const aiEnabled = true;

// POST a message to Claude through the appropriate server-side proxy.
export async function anthropicFetch(body) {
  const endpoint = isDev ? '/api/anthropic/v1/messages' : '/api/anthropic';
  const headers = { 'Content-Type': 'application/json' };

  // Attach the user's access token so the proxy can authorize the request. In
  // dev the Vite proxy ignores it; in prod the serverless function requires it.
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  return fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
}
