import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Server-side bridge for "Sign in with YouVersion". The browser does the PKCE
// authorize redirect, then posts the auth code here. We exchange it for tokens
// directly with YouVersion (server-to-server over TLS, no client secret — public
// PKCE client), read the verified id_token claims, then find-or-create the
// matching Supabase user BY EMAIL (so a YouVersion login links to an existing
// Google/email account) and mint a one-time link the client swaps for a session.
//
// Required env (server-only — never shipped to the browser):
//   VITE_YOUVERSION_APP_KEY      the YouVersion App Key (OAuth client_id)
//   SUPABASE_SERVICE_ROLE_KEY    Supabase service-role key (god mode)
//   VITE_SUPABASE_URL            project URL (already set)
// Also: enable the Email provider in Supabase Auth so magic-link verification works.

const YV_TOKEN_URL = 'https://api.youversion.com/auth/token';
const YV_ISSUER = 'https://api.youversion.com';

// Cached across warm invocations: verifies the id_token's RS256 signature against
// YouVersion's published public keys (defends against a forged/tampered token).
const JWKS = createRemoteJWKSet(new URL('https://api.youversion.com/.well-known/jwks.json'));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const appKey = process.env.VITE_YOUVERSION_APP_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!appKey || !serviceKey || !supabaseUrl) return res.status(500).json({ error: 'not_configured' });

  const { code, code_verifier, redirect_uri } = req.body || {};
  if (!code || !code_verifier || !redirect_uri) return res.status(400).json({ error: 'missing_params' });

  // 1. Exchange the authorization code for tokens (PKCE, no secret).
  let tokens;
  try {
    const r = await fetch(YV_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri, client_id: appKey, code_verifier }),
    });
    tokens = await r.json();
    if (!r.ok || !tokens?.id_token) return res.status(401).json({ error: 'token_exchange_failed' });
  } catch {
    return res.status(502).json({ error: 'youversion_unreachable' });
  }

  // 2. Verify the id_token's signature + issuer + audience + expiry against JWKS.
  let claims;
  try {
    ({ payload: claims } = await jwtVerify(tokens.id_token, JWKS, { issuer: YV_ISSUER, audience: appKey }));
  } catch {
    return res.status(401).json({ error: 'bad_token' });
  }

  // Only trust an email YouVersion marks verified (guards email-based account linking).
  if (claims.email_verified === false) return res.status(401).json({ error: 'email_unverified' });
  const email = String(claims.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'no_email' });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // 3. Find-or-create the Supabase user by email. createUser errors if the email
  //    already exists (e.g. a Google account) — we ignore that and just link.
  await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: claims.name || claims.given_name || null,
      provider: 'youversion',
      yvp_id: claims.yvp_id || claims.sub || null,
    },
  }).catch(() => {});

  // 4. Mint a one-time magic link; the client verifies its token_hash to sign in.
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data?.properties?.hashed_token) return res.status(500).json({ error: 'session_mint_failed' });

  return res.status(200).json({ email, token_hash: data.properties.hashed_token });
}
