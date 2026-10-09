import { createClient } from '@supabase/supabase-js';
import { createRecoveryService } from '../server/recoveryService.js';
import { RecoveryError, recoveryConfig } from '../server/recoveryValidation.js';

export const MAX_RECOVERY_REQUEST_BYTES = 48 * 1024;

export async function handleRecoveryRequest(req, res, { env = process.env, createClientImpl = createClient, webauthn } = {}) {
  res.setHeader?.('Cache-Control', 'no-store');
  res.setHeader?.('Pragma', 'no-cache');
  res.setHeader?.('Vary', 'Origin');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const config = recoveryConfig(env);
    if (req.headers?.origin !== config.origin) throw new RecoveryError('origin_not_allowed', 403);
    const authorization = req.headers?.authorization;
    if (typeof authorization !== 'string' || !/^Bearer [^\s]+$/.test(authorization)) throw new RecoveryError('unauthorized', 401);
    if (typeof req.body !== 'object' || !req.body || Array.isArray(req.body)) throw new RecoveryError('invalid_request');
    if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > MAX_RECOVERY_REQUEST_BYTES) throw new RecoveryError('request_too_large', 413);
    const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
    const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !secret) throw new RecoveryError('recovery_not_configured', 503);
    const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
    const auth = createClientImpl(url, anon, options);
    // Obtain current server-confirmed ownership; never trust userId from input,
    // local getSession(), decoded JWTs or user-editable metadata.
    const { data, error } = await auth.auth.getUser(authorization.slice(7));
    if (error || !data?.user?.id) throw new RecoveryError('unauthorized', 401);
    const db = createClientImpl(url, secret, options);
    const execute = createRecoveryService({ db, user: data.user, config, webauthn });
    return res.status(200).json(await execute(req.body));
  } catch (error) {
    const safe = error instanceof RecoveryError ? error : new RecoveryError('recovery_unavailable', 503);
    if (safe.status === 429) res.setHeader?.('Retry-After', '60');
    return res.status(safe.status).json({ error: safe.code });
  }
}

export default handleRecoveryRequest;
