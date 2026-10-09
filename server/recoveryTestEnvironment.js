import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

export const RECOVERY_TEST_ORIGIN = 'http://localhost:5173';
export const RECOVERY_TEST_ENV_DIRECTORY = '.recovery-test';
const API_ORIGINS = new Set(['http://127.0.0.1:55421', 'http://localhost:55421']);
const PUBLIC_KEYS = [
  'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_PRAYER_PROTECTION_ENABLED',
  'VITE_RECOVERY_ALLOW_LOCALHOST', 'VITE_RECOVERY_LOCAL_ORIGIN',
];
const SERVER_KEYS = [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'RECOVERY_ENROLLMENT_ENABLED', 'RECOVERY_ALLOW_LOCALHOST', 'RECOVERY_LOCAL_ORIGIN',
];

export function validateRecoveryTestSupabaseConfig(config) {
  const settings = [
    ['', 'project_id', '"qetoret_recovery_test"'],
    ['api', 'port', '55421'], ['db', 'port', '55422'], ['db', 'shadow_port', '55420'],
    ['db.pooler', 'port', '55429'], ['studio', 'port', '55423'], ['local_smtp', 'port', '55424'],
    ['analytics', 'port', '55427'], ['edge_runtime', 'inspector_port', '8183'], ['edge_runtime', 'enabled', 'false'],
    ['studio', 'openai_api_key', '""'], ['auth.sms.twilio', 'auth_token', '""'], ['auth.external.apple', 'secret', '""'],
    ['experimental', 's3_host', '""'], ['experimental', 's3_region', '""'],
    ['experimental', 's3_access_key', '""'], ['experimental', 's3_secret_key', '""'],
    ['db.seed', 'enabled', 'false'], ['db.seed', 'sql_paths', '[]'],
    ['auth', 'site_url', '"http://localhost:5173"'],
    ['auth', 'additional_redirect_urls', '["http://localhost:5173"]'],
  ];
  if (/\b543\d{2}\b/.test(config)) throw new Error('Recovery test: ordinary Supabase ports remain in the isolated config. Existing config retained.');
  if (/^\[functions\./m.test(config)) throw new Error('Recovery test: Edge Function sections must be absent. Existing config retained.');
  if (/^(?![ \t]*#)[ \t]*[\w.-]+[ \t]*=[ \t]*["']env\(/m.test(config)) {
    throw new Error('Recovery test: inherited secret substitutions must be absent. Existing config retained.');
  }
  for (const [section, key, expected] of settings) {
    const start = section ? config.indexOf(`[${section}]`) : 0;
    const contentStart = section && start >= 0 ? config.indexOf('\n', start) + 1 : start;
    const remainder = start >= 0 ? config.slice(contentStart) : '';
    const nextSection = remainder.search(/^\[/m);
    const block = nextSection < 0 ? remainder : remainder.slice(0, nextSection);
    const value = block.match(new RegExp(`^${key}\\s*=\\s*([^\\r\\n]+)`, 'm'))?.[1]?.trim();
    if (value !== expected) {
      throw new Error(`Recovery test: isolated Supabase ${section ? `${section}.` : ''}${key} must be ${expected}. Existing config retained.`);
    }
  }
}

function requireKey(value, name, role) {
  // Never print credential contents in a startup error.
  if (typeof value !== 'string' || value.length < 32 || value.trim() !== value
    || /placeholder|replace|your_|here|changeme|example|<|>/i.test(value)) {
    throw new Error(`Recovery test: fill ${name} with a key from the isolated local Supabase instance.`);
  }
  const prefix = role === 'anon' ? 'sb_publishable_' : 'sb_secret_';
  if (value.startsWith(prefix) && /^[A-Za-z0-9_-]+$/.test(value)) return;
  const parts = value.split('.');
  try {
    if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error();
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.role === role) return;
  } catch { /* Fail closed for malformed or incorrectly scoped keys. */ }
  throw new Error(`Recovery test: ${name} must be the local ${role === 'anon' ? 'anon/publishable' : 'service-role/secret'} key.`);
}

export function validateRecoveryTestEnvironment(env, { command = 'serve', production = false } = {}) {
  if (command !== 'serve' || production || env.NODE_ENV === 'production') {
    throw new Error('Recovery test is available only through the development server; production builds are refused.');
  }
  for (const key of ['VITE_PRAYER_PROTECTION_ENABLED', 'VITE_RECOVERY_ALLOW_LOCALHOST', 'RECOVERY_ENROLLMENT_ENABLED', 'RECOVERY_ALLOW_LOCALHOST']) {
    if (env[key] !== 'true') throw new Error(`Recovery test: ${key} must be true.`);
  }
  for (const key of ['VITE_RECOVERY_LOCAL_ORIGIN', 'RECOVERY_LOCAL_ORIGIN']) {
    if (env[key] !== RECOVERY_TEST_ORIGIN) throw new Error(`Recovery test: ${key} must be ${RECOVERY_TEST_ORIGIN}.`);
  }
  if (!API_ORIGINS.has(env.VITE_SUPABASE_URL) || env.SUPABASE_URL !== env.VITE_SUPABASE_URL) {
    throw new Error('Recovery test: browser and server Supabase URLs must match and use the loopback API on port 55421.');
  }
  requireKey(env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY', 'anon');
  if (env.SUPABASE_ANON_KEY !== env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Recovery test: browser and server anon keys must match.');
  }
  const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  requireKey(secret, 'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY', 'service_role');
  if (env.SUPABASE_SECRET_KEY && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SECRET_KEY !== env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Recovery test: configure only one server secret key.');
  }
  return env.VITE_SUPABASE_URL;
}

export function loadRecoveryTestEnvironment(projectRoot, options = {}) {
  const envDir = resolve(projectRoot, RECOVERY_TEST_ENV_DIRECTORY);
  const parsed = {};
  // Only this directory is read. Inherited process variables, root .env files,
  // and optional third-party integrations cannot supply test credentials.
  for (const name of ['.env', '.env.local', '.env.recovery-test', '.env.recovery-test.local']) {
    try { Object.assign(parsed, parseEnv(readFileSync(resolve(envDir, name), 'utf8'))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const env = Object.fromEntries([...PUBLIC_KEYS, ...SERVER_KEYS].map(key => [key, parsed[key] || '']));
  env.NODE_ENV = 'development';
  env.AI_PROXY_DISABLED = 'true';
  const apiOrigin = validateRecoveryTestEnvironment(env, options);
  validateRecoveryTestSupabaseConfig(readFileSync(resolve(envDir, 'supabase', 'config.toml'), 'utf8'));
  const publicEnv = Object.fromEntries(PUBLIC_KEYS.map(key => [key, env[key]]));
  // These integrations are deliberately absent from an isolated recovery test.
  Object.assign(publicEnv, { VITE_YOUVERSION_ENABLED: 'false', VITE_AI_PROVIDER: '', VITE_AI_GATEWAY_URL: '' });
  return { envDir, env, publicEnv, apiOrigin };
}
