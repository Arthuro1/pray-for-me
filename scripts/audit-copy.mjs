import { resolve } from 'node:path';
import { qualityDir, readJson, writeJson, withCatalogue, groupEntries, fingerprints } from './content-quality/runtime.mjs';
import { auditEntries, validateMetadata } from './content-quality/checks.mjs';
import { loadPlanQuality, planQualityFindings, planQualityRecordErrors, syncPlanQualityRecords } from './content-quality/planQualityAudit.mjs';

const args = process.argv.slice(2);
if (args.some((arg) => !['--details', '--write-baseline', '--sync-metadata'].includes(arg))) throw new Error('Usage: check:content [--details] [--sync-metadata] [--write-baseline]');

// Findings not in the baseline are new. A baseline records existing findings;
// it is never an approval, and only an explicit --write-baseline changes it.
async function compareWithBaseline(path, issues, note) {
  if (args.includes('--write-baseline')) await writeJson(path, { version: 1, note, issues });
  const baseline = await readJson(path);
  if (baseline.version !== 1 || !Array.isArray(baseline.issues) || baseline.issues.some((i) => !/^[a-f0-9]{64}$/.test(i.fingerprint))) throw new Error(`Invalid baseline: ${path}`);
  const known = new Set(baseline.issues.map((i) => i.fingerprint));
  return issues.filter((i) => !known.has(i.fingerprint));
}

await withCatalogue(async (load, locales, ssrLoad) => {
  const entries = (await Promise.all(locales.map(load))).flat();
  const glossaries = Object.fromEntries(await Promise.all(locales.map(async (locale) => [locale, await readJson(resolve(qualityDir, `glossary/${locale}.json`))])));
  const rules = await readJson(resolve(qualityDir, 'content-rules.json'));
  const planQuality = await loadPlanQuality(ssrLoad);
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
    metadata.planQuality = syncPlanQualityRecords(planQuality, metadata.planQuality);
    await writeJson(metadataPath, metadata);
  }
  const errors = [
    ...validateMetadata(entries, metadata, glossaries, locales),
    ...planQualityRecordErrors(planQuality, metadata.planQuality),
  ];
  if (args.includes('--write-baseline') && errors.length) throw new Error(`Fix metadata before baselining:\n${errors.join('\n')}`);
  const issues = auditEntries(entries, rules, glossaries);
  const planIssues = planQualityFindings(planQuality, metadata.planQuality);
  const fresh = await compareWithBaseline(resolve(qualityDir, 'baseline.json'), issues, 'Existing findings, not approvals. Review baseline diffs explicitly.');
  const freshPlan = await compareWithBaseline(resolve(qualityDir, 'plan-quality-baseline.json'), planIssues, 'Existing prayer-plan quality findings, not approvals. See docs/PRAYER_PLAN_QUALITY.md.');
  console.log(`${entries.length} strings; ${issues.length - fresh.length} existing findings; ${fresh.length} new findings; ${errors.length} metadata errors.`);
  console.log(`Prayer plans: ${planIssues.length - freshPlan.length} existing quality findings; ${freshPlan.length} new.`);
  for (const issue of args.includes('--details') ? [...issues, ...planIssues] : [...fresh, ...freshPlan]) console.log(`${issue.locale} ${issue.id} [${issue.rule}] ${issue.message}`);
  for (const error of errors) console.error(error);
  if (fresh.length || freshPlan.length || errors.length) process.exitCode = 1;
});
