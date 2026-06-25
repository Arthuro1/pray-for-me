import { supabase } from './supabase';

// "Sign in with YouVersion" (OIDC + PKCE, public client — no secret in the browser).
// The App Key (client_id) is registered at platform.youversion.com. The button is
// hidden until it's configured. The code→session bridge happens server-side in
// /api/auth/youversion (it needs the Supabase service-role key).
const APP_KEY = import.meta.env.VITE_YOUVERSION_APP_KEY;
const AUTHORIZE_URL = 'https://api.youversion.com/auth/authorize';
const REDIRECT_PATH = '/auth/youversion/callback';

export const youVersionEnabled = !!APP_KEY;

const redirectUri = () => window.location.origin + REDIRECT_PATH;

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomString(byteLen = 48) {
  const arr = new Uint8Array(byteLen);
  crypto.getRandomValues(arr);
  return base64url(arr);
}
async function sha256(str) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
}

// Build the PKCE challenge, stash the verifier/state, and redirect to YouVersion.
export async function startYouVersionLogin() {
  if (!APP_KEY) return;
  const verifier = randomString(48);
  const challenge = base64url(await sha256(verifier));
  const state = randomString(16);
  const nonce = randomString(16);
  sessionStorage.setItem('yv_pkce', JSON.stringify({ verifier, state, nonce }));
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: APP_KEY,
    redirect_uri: redirectUri(),
    scope: 'openid profile email',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  window.location.href = `${AUTHORIZE_URL}?${params.toString()}`;
}

// Handle the redirect back: validate state, exchange the code via our serverless
// bridge, then establish the Supabase session. Throws on any failure.
export async function completeYouVersionLogin() {
  const url = new URL(window.location.href);
  if (url.searchParams.get('error')) throw new Error(url.searchParams.get('error'));
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  if (!code) throw new Error('missing_code');

  const stored = JSON.parse(sessionStorage.getItem('yv_pkce') || '{}');
  sessionStorage.removeItem('yv_pkce');
  if (!stored.verifier || stored.state !== returnedState) throw new Error('state_mismatch');

  const res = await fetch('/api/auth/youversion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: stored.verifier, redirect_uri: redirectUri() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || 'exchange_failed');

  // Exchange the one-time link for a real Supabase session.
  const { error } = await supabase.auth.verifyOtp({ email: data.email, token_hash: data.token_hash, type: 'magiclink' });
  if (error) throw error;
}
