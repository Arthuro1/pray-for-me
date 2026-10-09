import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRecoveryTestConfig, prepareRecoveryTest } from '../scripts/prepare-recovery-test.mjs';
import { loadRecoveryTestEnvironment, validateRecoveryTestEnvironment, validateRecoveryTestSupabaseConfig } from './recoveryTestEnvironment.js';

const temporaryDirectories = [];
const projectRoot = resolve(import.meta.dirname, '..');
const localKey = role => `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ iss: 'supabase-demo', role, exp: 9999999999 })).toString('base64url')}.${Buffer.alloc(32, 1).toString('base64url')}`;
const validEnv = () => ({
  VITE_SUPABASE_URL: 'http://127.0.0.1:55421', SUPABASE_URL: 'http://127.0.0.1:55421',
  VITE_SUPABASE_ANON_KEY: localKey('anon'), SUPABASE_ANON_KEY: localKey('anon'),
  SUPABASE_SERVICE_ROLE_KEY: localKey('service_role'),
  VITE_PRAYER_PROTECTION_ENABLED: 'true', VITE_RECOVERY_ALLOW_LOCALHOST: 'true',
  RECOVERY_ENROLLMENT_ENABLED: 'true', RECOVERY_ALLOW_LOCALHOST: 'true',
  VITE_RECOVERY_LOCAL_ORIGIN: 'http://localhost:5173', RECOVERY_LOCAL_ORIGIN: 'http://localhost:5173',
});
const envText = env => Object.entries(env).map(([key, value]) => `${key}=${value}`).join('\n');

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), 'qetoret-recovery-env-'));
  temporaryDirectories.push(root);
  await mkdir(join(root, 'supabase', 'migrations'), { recursive: true });
  await writeFile(join(root, 'supabase', 'config.toml'), await readFile(join(projectRoot, 'supabase', 'config.toml')));
  await writeFile(join(root, '.env.recovery-test.example'), envText(validEnv()));
  await writeFile(join(root, 'supabase', 'migrations', '20261001000000_test.sql'), 'select 1;\n');
  return root;
}

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe('isolated recovery test startup', () => {
  it('accepts matching loopback credentials and explicit local enrollment', () => {
    expect(validateRecoveryTestEnvironment(validEnv())).toBe('http://127.0.0.1:55421');
    const env = validEnv();
    env.VITE_SUPABASE_URL = env.SUPABASE_URL = 'http://localhost:55421';
    env.VITE_SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY = `sb_publishable_${'a'.repeat(40)}`;
    env.SUPABASE_SERVICE_ROLE_KEY = '';
    env.SUPABASE_SECRET_KEY = `sb_secret_${'b'.repeat(40)}`;
    expect(validateRecoveryTestEnvironment(env)).toBe('http://localhost:55421');
  });

  it.each([
    'https://production.supabase.co', 'http://127.0.0.1:54321', 'http://localhost:55422',
    'http://localhost:55421/', 'http://localhost:55421/rest/v1/', 'http://localhost.evil.test:55421',
    'http://127.0.0.2:55421', 'http://user:pass@localhost:55421',
  ])('refuses a hosted or ambiguous API URL: %s', url => {
    expect(() => validateRecoveryTestEnvironment({ ...validEnv(), VITE_SUPABASE_URL: url, SUPABASE_URL: url })).toThrow(/loopback API/);
  });

  it('refuses mismatched client/server URLs or anon keys', () => {
    expect(() => validateRecoveryTestEnvironment({ ...validEnv(), SUPABASE_URL: 'https://production.supabase.co' })).toThrow();
    expect(() => validateRecoveryTestEnvironment({ ...validEnv(), SUPABASE_ANON_KEY: localKey('service_role') })).toThrow(/must match/);
  });

  it.each(['', 'REPLACE_WITH_LOCAL_ANON_KEY', 'your_key_here', 'not-a-key-with-at-least-thirty-two-characters'])('refuses missing or placeholder public credentials', value => {
    expect(() => validateRecoveryTestEnvironment({ ...validEnv(), VITE_SUPABASE_ANON_KEY: value })).toThrow();
  });

  it('rejects a service secret in browser credentials and an anon server secret without echoing keys', () => {
    const env = validEnv();
    const secret = env.SUPABASE_SERVICE_ROLE_KEY;
    let error;
    try { validateRecoveryTestEnvironment({ ...env, VITE_SUPABASE_ANON_KEY: secret }); }
    catch (caught) { error = caught; }
    expect(error.message).toMatch(/anon\/publishable/);
    expect(error.message).not.toContain(secret);
    expect(() => validateRecoveryTestEnvironment({ ...env, SUPABASE_SERVICE_ROLE_KEY: env.VITE_SUPABASE_ANON_KEY })).toThrow(/service-role\/secret/);
  });

  it('rejects production, builds, altered origins, and missing explicit opt-ins', () => {
    expect(() => validateRecoveryTestEnvironment(validEnv(), { command: 'build' })).toThrow(/production builds/);
    expect(() => validateRecoveryTestEnvironment(validEnv(), { production: true })).toThrow();
    expect(() => validateRecoveryTestEnvironment({ ...validEnv(), NODE_ENV: 'production' })).toThrow();
    expect(() => validateRecoveryTestEnvironment({ ...validEnv(), VITE_RECOVERY_LOCAL_ORIGIN: 'http://localhost:5174' })).toThrow();
    expect(() => validateRecoveryTestEnvironment({ ...validEnv(), RECOVERY_LOCAL_ORIGIN: 'https://qetoret.com' })).toThrow();
    expect(() => validateRecoveryTestEnvironment({ ...validEnv(), RECOVERY_ALLOW_LOCALHOST: 'false' })).toThrow();
  });

  it('loads only isolated files and excludes inherited credentials and optional providers', async () => {
    const root = await createFixture();
    await prepareRecoveryTest(root);
    await writeFile(join(root, '.env'), envText({ VITE_SUPABASE_URL: 'https://production.supabase.co', SUPABASE_SECRET_KEY: 'root-secret' }));
    vi.stubEnv('VITE_SUPABASE_URL', 'https://inherited.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'inherited-secret');
    vi.stubEnv('ANTHROPIC_API_KEY', 'inherited-provider-secret');
    vi.stubEnv('VITE_AI_GATEWAY_URL', 'https://private-gateway.test');
    const result = loadRecoveryTestEnvironment(root);
    expect(result.envDir).toBe(join(root, '.recovery-test'));
    expect(result.env.VITE_SUPABASE_URL).toBe('http://127.0.0.1:55421');
    expect(result.env.SUPABASE_SECRET_KEY).toBe('');
    expect(result.env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(result.env.AI_PROXY_DISABLED).toBe('true');
    expect(result.publicEnv.VITE_AI_GATEWAY_URL).toBe('');
    expect(JSON.stringify(result.publicEnv)).not.toMatch(/service_role|inherited-secret|root-secret|provider-secret/);
  });

  it('uses fixed localhost/strict port and explicitly defines public env without automatic injection', async () => {
    const root = await createFixture();
    await prepareRecoveryTest(root);
    const { default: configureVite } = await import('../vite.config.js');
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    vi.stubEnv('PORT', '9000');
    const config = configureVite({ mode: 'recovery-test', command: 'serve' });
    expect(config.envDir).toBe(join(root, '.recovery-test'));
    expect(config.envPrefix).toEqual([]);
    expect(config.server).toMatchObject({ host: 'localhost', port: 5173, strictPort: true });
    expect(config.define['import.meta.env.VITE_SUPABASE_URL']).toBe('"http://127.0.0.1:55421"');
    expect(config.define['import.meta.env.SUPABASE_SERVICE_ROLE_KEY']).toBeUndefined();
    expect(config.server.headers['Content-Security-Policy']).toContain('http://127.0.0.1:55421');
    expect(() => configureVite({ mode: 'recovery-test', command: 'build' })).toThrow(/production builds/);
  });

  it('transforms browser env with only validated local public values despite inherited production credentials', async () => {
    const root = await createFixture();
    await prepareRecoveryTest(root);
    const { default: configureVite } = await import('../vite.config.js');
    const { createServer } = await import('vite');
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    vi.stubEnv('VITE_SUPABASE_URL', 'https://inherited-production.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'inherited-production-anon');
    vi.stubEnv('VITE_AI_GATEWAY_URL', 'https://inherited-private-gateway.test');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'inherited-production-secret');
    await writeFile(join(root, 'probe.js'), 'export const values = [import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, import.meta.env.VITE_AI_GATEWAY_URL, import.meta.env.SUPABASE_SECRET_KEY, import.meta.env.DEV, import.meta.env.MODE];');
    const config = configureVite({ mode: 'recovery-test', command: 'serve' });
    const server = await createServer({ ...config, root, mode: 'recovery-test', configFile: false, plugins: [], logLevel: 'silent', server: { ...config.server, middlewareMode: true, watch: null }, optimizeDeps: { noDiscovery: true } });
    try {
      const result = await server.transformRequest('/probe.js');
      expect(result.code).toContain('http://127.0.0.1:55421');
      expect(result.code).toContain('recovery-test');
      expect(result.code).toMatch(/"DEV":\s*true/);
      expect(result.code).not.toMatch(/inherited-production|inherited-private-gateway|service_role/);
    } finally { await server.close(); }
  });
});

describe('recovery test preparation', () => {
  it('copies migrations, isolates project/ports, disables seeding, and preserves normal configuration', async () => {
    const root = await createFixture();
    const source = await readFile(join(root, 'supabase', 'config.toml'), 'utf8');
    await writeFile(join(root, '.env'), 'DO_NOT_CHANGE=production\n');
    const result = await prepareRecoveryTest(root);
    const config = await readFile(join(root, '.recovery-test', 'supabase', 'config.toml'), 'utf8');
    expect(config).toContain('project_id = "qetoret_recovery_test"');
    expect(config).not.toMatch(/\b543\d{2}\b/);
    expect(config).toContain('port = 55421');
    expect(config).toMatch(/\[db.seed\][\s\S]*?enabled = false[\s\S]*?sql_paths = \[\]/);
    expect(config).toContain('site_url = "http://localhost:5173"');
    expect(config).toContain('additional_redirect_urls = ["http://localhost:5173"]');
    expect(config).toContain('inspector_port = 8183');
    expect(config).toMatch(/\[edge_runtime\][\s\S]*?enabled = false/);
    expect(config).not.toMatch(/^\[functions\./m);
    expect(config).toContain('openai_api_key = ""');
    expect(config).toContain('auth_token = ""');
    expect(config).toContain('s3_host = ""');
    expect(config).not.toMatch(/^(?![ \t]*#)[ \t]*[\w.-]+[ \t]*=[ \t]*["']env\(/m);
    expect(result).toMatchObject({ configCreated: true, envCreated: true, migrationsCreated: 1 });
    expect(await readFile(join(root, 'supabase', 'config.toml'), 'utf8')).toBe(source);
    expect(await readFile(join(root, '.env'), 'utf8')).toBe('DO_NOT_CHANGE=production\n');
    expect(await readdir(join(root, '.recovery-test', 'supabase'))).toEqual(['config.toml', 'migrations']);
  });

  it('reruns without overwriting an existing environment or config and adds only new migrations', async () => {
    const root = await createFixture();
    await prepareRecoveryTest(root);
    const envPath = join(root, '.recovery-test', '.env.local');
    const configPath = join(root, '.recovery-test', 'supabase', 'config.toml');
    const originalConfig = await readFile(configPath, 'utf8');
    await writeFile(envPath, 'KEEP_LOCAL_CREDENTIALS=1\n');
    await writeFile(configPath, `${originalConfig}\n# KEEP_CONFIG=1\n`);
    await writeFile(join(root, 'supabase', 'migrations', '20261002000000_next.sql'), 'select 2;\n');
    expect(await prepareRecoveryTest(root)).toMatchObject({ configCreated: false, envCreated: false, migrationsCreated: 1 });
    expect(await readFile(envPath, 'utf8')).toBe('KEEP_LOCAL_CREDENTIALS=1\n');
    expect(await readFile(configPath, 'utf8')).toBe(`${originalConfig}\n# KEEP_CONFIG=1\n`);
  });

  it('refuses existing configs that share ordinary volumes or ports without altering them', async () => {
    const root = await createFixture();
    await prepareRecoveryTest(root);
    const path = join(root, '.recovery-test', 'supabase', 'config.toml');
    const original = await readFile(path, 'utf8');
    const changed = original.replace('project_id = "qetoret_recovery_test"', 'project_id = "pray_for_me"');
    await writeFile(path, changed);
    await expect(prepareRecoveryTest(root)).rejects.toThrow(/project_id/);
    expect(() => loadRecoveryTestEnvironment(root)).toThrow(/project_id/);
    expect(() => validateRecoveryTestSupabaseConfig(original.replace('port = 55421', 'port = 54321'))).toThrow(/ordinary Supabase ports/);
    expect(await readFile(path, 'utf8')).toBe(changed);
  });

  it('retains changed generated migrations and fails rather than overwriting them', async () => {
    const root = await createFixture();
    await prepareRecoveryTest(root);
    const migration = join(root, '.recovery-test', 'supabase', 'migrations', '20261001000000_test.sql');
    await writeFile(migration, 'select 99;\n');
    await expect(prepareRecoveryTest(root)).rejects.toThrow(/Existing file retained/);
    expect(await readFile(migration, 'utf8')).toBe('select 99;\n');
  });

  it('fails if required config fields disappear instead of generating a partial unsafe setup', () => {
    expect(() => createRecoveryTestConfig('project_id = "normal"\n[api]\nport = 54321\n')).toThrow(/Missing Supabase/);
  });

  it('rejects function declarations, enabled edge runtime, and any active ambient secret substitution', async () => {
    const root = await createFixture();
    const source = await readFile(join(root, 'supabase', 'config.toml'), 'utf8');
    const config = createRecoveryTestConfig(source);
    expect(() => validateRecoveryTestSupabaseConfig(config)).not.toThrow();
    expect(() => validateRecoveryTestSupabaseConfig(`${config}\n[functions.send-daily-reminder]\nverify_jwt = false\n`)).toThrow(/Edge Function/);
    expect(() => validateRecoveryTestSupabaseConfig(config.replace(/(\[edge_runtime\]\r?\nenabled = )false/, '$1true'))).toThrow(/edge_runtime.enabled/);
    expect(() => validateRecoveryTestSupabaseConfig(config.replace('openai_api_key = ""', 'openai_api_key = "env(OPENAI_API_KEY)"'))).toThrow(/inherited secret/);
    expect(() => validateRecoveryTestSupabaseConfig(`${config}\nunexpected_secret = "env(NEW_PROVIDER_KEY)"\n`)).toThrow(/inherited secret/);
    expect(() => validateRecoveryTestSupabaseConfig(`${config}\n# disabled_secret = "env(UNUSED_KEY)"\n`)).not.toThrow();
    expect(await readFile(join(root, 'supabase', 'config.toml'), 'utf8')).toBe(source);
  });
});
