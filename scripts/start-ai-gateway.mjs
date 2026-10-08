// Start the existing gateway with this app's local configuration. Credentials
// stay in server process memory; never copy them into another repo or print them.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';
import { loadEnv } from 'vite';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appEnv = loadEnv('development', appDir, '');
const gatewayDir = resolve(appDir, appEnv.AI_GATEWAY_DIR || '../pray-for-me-ai/services/ai-gateway');
const gatewayEnvFile = resolve(gatewayDir, '.env');
const gatewayEnv = existsSync(gatewayEnvFile) ? parseEnv(readFileSync(gatewayEnvFile, 'utf8')) : {};
const server = resolve(gatewayDir, 'src/server.ts');

if (!existsSync(server)) {
  console.error('AI gateway checkout is missing. Set AI_GATEWAY_DIR to its services/ai-gateway directory.');
  process.exit(1);
}

let gatewayUrl;
try { gatewayUrl = new URL(appEnv.AI_GATEWAY_URL || 'http://127.0.0.1:3001'); } catch {
  console.error('AI_GATEWAY_URL must be a valid local HTTP URL for ai:dev.');
  process.exit(1);
}
if (gatewayUrl.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(gatewayUrl.hostname)) {
  console.error('ai:dev starts a local gateway. Set AI_GATEWAY_URL to http://127.0.0.1:3001.');
  process.exit(1);
}

const env = {
  ...process.env,
  ...gatewayEnv,
  ...appEnv,
  APP_ENV: 'development',
  HOST: '127.0.0.1',
  PORT: gatewayUrl.port || '80',
  SUPABASE_URL: appEnv.VITE_SUPABASE_URL || gatewayEnv.SUPABASE_URL,
  SUPABASE_ANON_KEY: appEnv.VITE_SUPABASE_ANON_KEY || gatewayEnv.SUPABASE_ANON_KEY,
};
if (env.AI_PROVIDER === 'anthropic' && !env.ANTHROPIC_API_KEY) {
  console.error('Claude requires the server-only ANTHROPIC_API_KEY in the app .env.');
  process.exit(1);
}

let tsx;
try { tsx = createRequire(resolve(gatewayDir, 'package.json')).resolve('tsx/cli'); } catch {
  console.error('Gateway dependencies are missing. Run npm install in the gateway directory.');
  process.exit(1);
}

const child = spawn(process.execPath, [tsx, server], { cwd: gatewayDir, env, stdio: 'inherit', windowsHide: true });
child.on('error', () => {
  console.error('Unable to start the AI gateway.');
  process.exitCode = 1;
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
