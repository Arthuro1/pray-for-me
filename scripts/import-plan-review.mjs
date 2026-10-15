// Imports a native Christian reviewer's downloaded review file:
//
//   npm run import:plan-review -- path/to/de-plan-review-2026-10-20-anna.json [--dry-run]
//
// Each complete, current review becomes a `human-reviewed` record in
// src/content-quality/review-status.json → planQuality, and the reviewer's file
// is archived unchanged in docs/plan-reviews/ as the evidence. Scores come only
// from the file; nothing here grants or edits a score.
import { basename, resolve } from 'node:path';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { qualityDir, readJson, root, withSsr, writeJson } from './content-quality/runtime.mjs';
import { loadPlanQuality } from './content-quality/planQualityAudit.mjs';
import { parsePlanReviewFile, planReviewRecords } from './content-quality/planReviewImport.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const files = args.filter((arg) => arg !== '--dry-run');
if (files.length !== 1) throw new Error('Usage: npm run import:plan-review -- <review-file.json> [--dry-run]');

const source = resolve(files[0]);
const evidence = `docs/plan-reviews/${basename(source)}`;

async function archive() {
  const target = resolve(root, evidence);
  if (existsSync(target)) {
    if ((await readFile(target, 'utf8')) !== (await readFile(source, 'utf8'))) throw new Error(`${evidence} already exists with different content; rename the review file.`);
    return;
  }
  await mkdir(resolve(root, 'docs/plan-reviews'), { recursive: true });
  await copyFile(source, target);
}

function verdictLine(result) {
  if (result.status === 'approved') return `approved (overall ${result.score.overall}${result.meetsPreferred ? ', meets the preferred 4.5' : ''})`;
  return `${result.status}${result.failures.length ? ` (${result.failures.join('; ')})` : ''}`;
}

await withSsr(async (ssrLoad) => {
  const quality = await loadPlanQuality(ssrLoad);
  const file = parsePlanReviewFile(await readJson(source));
  const metadataPath = resolve(qualityDir, 'review-status.json');
  const metadata = await readJson(metadataPath);
  const { records, recorded, unscored, rejected } = planReviewRecords(file, { ...quality, evidence });
  const next = { ...metadata.planQuality, ...records };

  console.log(`${file.lang} review by ${file.reviewer.name} (${file.reviewer.reviewedAt}).`);
  for (const planId of recorded) {
    const plan = quality.plans.find((p) => p.id === planId);
    const result = quality.evaluate(plan, file.lang, { records: next });
    const served = quality.overlayLanguages(plan).includes(file.lang);
    console.log(`  ${planId}: ${verdictLine(result)}`);
    if (result.status === 'approved' && !served) console.log(`    To show it to readers, add '${file.lang}' to ${planId}.proseTranslations.`);
    if (result.status !== 'approved' && served) console.log(`    ! '${file.lang}' is in ${planId}.proseTranslations: CI fails until the translation is corrected and re-reviewed, or the language is removed.`);
  }
  for (const planId of unscored) console.log(`  ${planId}: suggestions or notes only, not recorded as a review.`);
  for (const { planId, reason } of rejected) console.log(`  ${planId}: NOT recorded: ${reason}.`);
  const suggestions = file.reviews.reduce((n, review) => n + review.suggestions.length, 0);
  if (suggestions) console.log(`${suggestions} wording suggestion${suggestions === 1 ? '' : 's'} to apply: see ${evidence}. Applied corrections change the translation, so ask for a confirming review afterwards.`);
  if (file.terminologyNotes) console.log(`Terminology feedback: ${file.terminologyNotes}`);

  if (dryRun) { console.log('Dry run: nothing written.'); return; }
  await archive();
  if (recorded.length) {
    metadata.planQuality = next;
    await writeJson(metadataPath, metadata);
  }
  console.log(`Archived ${evidence}${recorded.length ? ` and recorded ${recorded.length} review${recorded.length === 1 ? '' : 's'}` : ''}.`);
});
