import { resolve } from 'node:path';
import { qualityDir, readJson, writeJson, withCatalogue, groupEntries, fingerprints } from './content-quality/runtime.mjs';
import { auditEntries, validateMetadata } from './content-quality/checks.mjs';

const args = process.argv.slice(2);
if (args.some((arg) => !['--details', '--write-baseline', '--sync-metadata'].includes(arg))) throw new Error('Usage: check:content [--details] [--sync-metadata] [--write-baseline]');
await withCatalogue(async (load, locales) => {
  const entries = (await Promise.all(locales.map(load))).flat();
  const glossaries = Object.fromEntries(await Promise.all(locales.map(async (locale) => [locale, await readJson(resolve(qualityDir, `glossary/${locale}.json`))])));
  const rules = await readJson(resolve(qualityDir, 'content-rules.json'));
  const metadataPath = resolve(qualityDir, 'review-status.json');
  const metadata = await readJson(metadataPath);
  if (args.includes('--sync-metadata')) {
    const bundles = {};
    for (const [id, group] of groupEntries(entries)) {
      const current = fingerprints(group);
      const old = metadata.bundles[id];
      bundles[id] = old?.contentHash === current.contentHash && old?.sourceHash === current.sourceHash ? old : { status: 'needs-review', ...current };
    }
    metadata.bundles = bundles;
    await writeJson(metadataPath, metadata);
  }
  const errors = validateMetadata(entries, metadata, glossaries, locales);
  const issues = auditEntries(entries, rules, glossaries);
  const baselinePath = resolve(qualityDir, 'baseline.json');
  if (args.includes('--write-baseline')) {
    if (errors.length) throw new Error(`Fix metadata before baselining:\n${errors.join('\n')}`);
    await writeJson(baselinePath, { version: 1, note: 'Existing findings, not approvals. Review baseline diffs explicitly.', issues });
  }
  const baseline = await readJson(baselinePath);
  if (baseline.version !== 1 || !Array.isArray(baseline.issues) || baseline.issues.some((i) => !/^[a-f0-9]{64}$/.test(i.fingerprint))) throw new Error('Invalid content baseline');
  const known = new Set(baseline.issues.map((i) => i.fingerprint));
  const fresh = issues.filter((i) => !known.has(i.fingerprint));
  console.log(`${entries.length} strings; ${issues.length - fresh.length} existing findings; ${fresh.length} new findings; ${errors.length} metadata errors.`);
  for (const issue of args.includes('--details') ? issues : fresh) console.log(`${issue.locale} ${issue.id} [${issue.rule}] ${issue.message}`);
  for (const error of errors) console.error(error);
  if (fresh.length || errors.length) process.exitCode = 1;
});
