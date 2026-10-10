import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRecoveryTestSupabaseConfig } from '../server/recoveryTestEnvironment.js';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function replaceSetting(config, section, key, value) {
  const sectionStart = section ? config.indexOf(`[${section}]`) : 0;
  if (sectionStart < 0) throw new Error(`Missing Supabase config section: ${section}`);
  const contentStart = section ? config.indexOf('\n', sectionStart) + 1 : 0;
  const nextSection = config.slice(contentStart).search(/^\[/m);
  const contentEnd = nextSection < 0 ? config.length : contentStart + nextSection;
  const block = config.slice(contentStart, contentEnd);
  const pattern = new RegExp(`^${key}\\s*=.*$`, 'm');
  if (!pattern.test(block)) throw new Error(`Missing Supabase config setting: ${section}.${key}`);
  return config.slice(0, contentStart) + block.replace(pattern, `${key} = ${value}`) + config.slice(contentEnd);
}

export function createRecoveryTestConfig(source) {
  let config = source.replace(/\b543(\d{2})\b/g, '554$1');
  // Recovery uses the same-origin Vite API, not the project's notification
  // Edge Functions. Their files and external provider secrets are not copied.
  config = config.split(/(?=^\[)/m).filter(block => !/^\[functions\./.test(block)).join('');
  config = replaceSetting(config, '', 'project_id', '"qetoret_recovery_test"');
  config = replaceSetting(config, 'db.seed', 'enabled', 'false');
  config = replaceSetting(config, 'db.seed', 'sql_paths', '[]');
  config = replaceSetting(config, 'auth', 'site_url', '"http://localhost:5173"');
  config = replaceSetting(config, 'auth', 'additional_redirect_urls', '["http://localhost:5173"]');
  for (const [section, key] of [
    ['studio', 'openai_api_key'], ['auth.sms.twilio', 'auth_token'], ['auth.external.apple', 'secret'],
    ['experimental', 's3_host'], ['experimental', 's3_region'],
    ['experimental', 's3_access_key'], ['experimental', 's3_secret_key'],
  ]) config = replaceSetting(config, section, key, '""');
  config = replaceSetting(config, 'edge_runtime', 'enabled', 'false');
  // Keep the optional edge inspector distinct from the ordinary local project.
  config = replaceSetting(config, 'edge_runtime', 'inspector_port', '8183');
  return config;
}

async function createOnly(path, content) {
  try { await writeFile(path, content, { flag: 'wx' }); return true; }
  catch (error) { if (error.code === 'EEXIST') return false; throw error; }
}

export async function prepareRecoveryTest(projectRoot = defaultRoot) {
  const root = resolve(projectRoot);
  const testDirectory = join(root, '.recovery-test');
  const supabaseDirectory = join(testDirectory, 'supabase');
  const migrationDirectory = join(supabaseDirectory, 'migrations');
  const sourceConfig = await readFile(join(root, 'supabase', 'config.toml'), 'utf8');
  const template = await readFile(join(root, '.env.recovery-test.example'), 'utf8');
  const migrationNames = (await readdir(join(root, 'supabase', 'migrations'))).filter(name => /^\d+_[\w-]+\.sql$/.test(name)).sort();
  await mkdir(migrationDirectory, { recursive: true });
  const configCreated = await createOnly(join(supabaseDirectory, 'config.toml'), createRecoveryTestConfig(sourceConfig));
  validateRecoveryTestSupabaseConfig(await readFile(join(supabaseDirectory, 'config.toml'), 'utf8'));
  let migrationsCreated = 0;
  for (const name of migrationNames) {
    const content = await readFile(join(root, 'supabase', 'migrations', name));
    const target = join(migrationDirectory, name);
    if (await createOnly(target, content)) migrationsCreated += 1;
    else if (!(await readFile(target)).equals(content)) {
      throw new Error(`Isolated migration differs: ${name}. Existing file retained; reconcile it manually before starting the test database.`);
    }
  }
  const envCreated = await createOnly(join(testDirectory, '.env.local'), template);
  return { testDirectory, configCreated, envCreated, migrationsCreated, migrationCount: migrationNames.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await prepareRecoveryTest();
    console.log(`Isolated recovery test prepared: ${result.migrationCount} migrations (${result.migrationsCreated} new).`);
    console.log(`.recovery-test/.env.local ${result.envCreated ? 'created; fill the local keys before starting Vite' : 'retained unchanged'}.`);
    console.log('This command does not start Docker, contact Supabase, reset data, or change the normal .env.');
    console.log('Next: start the separate local stack with supabase --workdir .recovery-test start, fill its keys, then npm run dev:recovery-test.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
