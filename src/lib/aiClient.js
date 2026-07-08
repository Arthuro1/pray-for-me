import { supabase } from './supabase';

// Client-side entry point for every AI text call. It talks ONLY to Pray4Me's own
// endpoint (/api/ai), which forwards to the private AI backend (pray-for-me-ai).
// The browser never calls the private backend, Ollama/vLLM, or any third-party
// AI provider directly — and no API key is ever referenced from client code.
//
//   • dev  → the Vite dev-server proxy (vite.config.js) rewrites /api/ai to the
//            backend's /v1/chat/completions and injects the service key Node-side.
//   • prod → the /api/ai serverless function, which enforces a valid Supabase
//            session, a pinned model, payload caps and per-user rate limiting.
// AI is always "enabled" from the client's point of view; the proxy is the single
// gatekeeper for whether the backend is actually configured.
export const aiEnabled = true;

// The model the client requests. Model names are not secret, so this is a public
// VITE_ var; the server still enforces its own allowlist (AI_ALLOWED_MODELS).
// Defaults to a common self-hosted model.
export const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'llama3.1:8b';

// POST an OpenAI-compatible chat request through the app's own /api/ai proxy.
export async function aiFetch(body) {
  const headers = { 'Content-Type': 'application/json' };

  // Attach the user's access token so the proxy can authorize the request.
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  return fetch('/api/ai', { method: 'POST', headers, body: JSON.stringify(body) });
}

// Read the assistant text out of an OpenAI-compatible chat completion response.
export function extractText(json) {
  return json?.choices?.[0]?.message?.content || '';
}

// True when the model stopped because it hit the token cap (answer may be cut).
export function wasTruncated(json) {
  return json?.choices?.[0]?.finish_reason === 'length';
}
