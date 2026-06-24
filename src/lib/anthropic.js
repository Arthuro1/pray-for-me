import { supabase } from './supabase';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const isDev = import.meta.env.DEV;

// In dev we call Anthropic directly (via the Vite proxy) using the local key.
// In prod we route through the /api/anthropic serverless proxy, which holds the
// key server-side and now requires a valid Supabase session — so the key is
// never shipped to the browser. AI is therefore "enabled" in prod regardless of
// the client-side key, and only requires the local key in dev.
export const aiEnabled = isDev ? !!API_KEY : true;

// POST a message to Claude, transparently handling dev vs prod auth.
export async function anthropicFetch(body) {
  const endpoint = isDev ? '/api/anthropic/v1/messages' : '/api/anthropic';
  const headers = { 'Content-Type': 'application/json' };

  if (isDev) {
    headers['x-api-key'] = API_KEY;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  } else {
    // Attach the user's access token so the proxy can authorize the request.
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
}
