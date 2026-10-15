import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { digest } from './digest.mjs';

export { digest };
export const root = fileURLToPath(new URL('../../', import.meta.url));
export const qualityDir = resolve(root, 'src/content-quality');
export const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
// Loads app modules (import.meta.glob, JSON imports…) through Vite's SSR.
export async function withSsr(callback) {
  const server = await createServer({ root, configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null }, appType: 'custom', logLevel: 'error' });
  try {
    return await callback((path) => server.ssrLoadModule(path));
  } finally { await server.close(); }
}
export function withCatalogue(callback) {
  return withSsr(async (ssrLoad) => {
    const { loadCatalogue } = await ssrLoad('/src/content-quality/catalogue.js');
    const { LANG_CODES } = await ssrLoad('/src/i18n.js');
    return callback(loadCatalogue, LANG_CODES, ssrLoad);
  });
}
export function groupEntries(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const key = `${entry.locale}/${entry.surface}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return groups;
}
export function fingerprints(entries) {
  return {
    contentHash: digest(entries.map(({ key, text }) => [key, text])),
    sourceHash: digest(entries.map(({ key, source }) => [key, source])),
  };
}
