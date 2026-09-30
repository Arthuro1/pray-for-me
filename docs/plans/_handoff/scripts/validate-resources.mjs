/* global process */
// Validate src/content/resources/newPlans/*.js against the taxonomy and the
// existing catalogue. Usage: node validate-resources.mjs <repo>
import { readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const repo = process.argv[2];
const out = join(process.env.SP || '.', 'bundles');
mkdirSync(out, { recursive: true });
const bundle = (src, name) => {
  const file = join(out, `${name}.mjs`);
  execSync(`npx esbuild "${src}" --bundle --format=esm --platform=node --outfile="${file}" --log-level=error`, { cwd: repo });
  return import(pathToFileURL(file).href + `?t=${Date.now()}`);
};

const topics = await bundle(join(repo, 'src/content/resources/topics.js'), 'topics');
const lib = await bundle(join(repo, 'src/lib/resources.js'), 'lib');
const cat = await bundle(join(repo, 'src/content/resources/catalogue.js'), 'catalogue');
// The catalogue already spreads the candidates in (newPlanResources.js), so
// "existing" means everything EXCEPT them — otherwise every id self-matches.
const candidates = await bundle(join(repo, 'src/content/resources/newPlanResources.js'), 'npr');
const candidateIds = new Set(candidates.NEW_PLAN_RESOURCES.map((r) => r.id));
const existing = new Map(cat.RESOURCES.filter((r) => !candidateIds.has(r.id)).map((r) => [r.id, r]));
const dir = join(repo, 'src/content/resources/newPlans');
const files = readdirSync(dir).filter((f) => f.endsWith('.js') && !f.includes('.test.'));
const seen = new Map();
const problems = [];
const stats = {};
for (const f of files) {
  const mod = await bundle(join(dir, f), `np-${f}`);
  const entries = Object.values(mod).find(Array.isArray) || [];
  const plan = f.replace('.js', '');
  const langs = new Set();
  let sensitive = 0;
  for (const e of entries) {
    const at = `${plan}/${e.id}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id || '')) problems.push(`${at}: bad id`);
    if (existing.has(e.id)) problems.push(`${at}: id exists in catalogue`);
    if (seen.has(e.id)) seen.get(e.id).push(plan); else seen.set(e.id, [plan]);
    if (!topics.RESOURCE_TYPES.includes(e.type)) problems.push(`${at}: type ${e.type}`);
    for (const t of e.topics || []) if (!topics.RESOURCE_TOPICS.includes(t)) problems.push(`${at}: topic ${t}`);
    if (!(e.topics || []).length) problems.push(`${at}: no topics`);
    for (const d of e.domains || []) if (!topics.RESOURCE_DOMAINS.includes(d)) problems.push(`${at}: domain ${d}`);
    if (!(e.domains || []).length) problems.push(`${at}: no domains`);
    for (const p of e.perspective || []) if (!topics.RESOURCE_PERSPECTIVES.includes(p)) problems.push(`${at}: perspective ${p}`);
    for (const s of e.lifeStages || []) if (!topics.LIFE_STAGES.includes(s)) problems.push(`${at}: lifeStage ${s}`);
    if (e.status !== 'needs_review') problems.push(`${at}: status ${e.status}`);
    if (e.contentReview || e.safetyReview) problems.push(`${at}: carries a review record`);
    if (e.reviewLevel && !['standard', 'sensitive'].includes(e.reviewLevel)) problems.push(`${at}: reviewLevel`);
    if (lib.isSensitiveResource(e)) sensitive += 1;
    if (!e.description?.en || !e.description?.fr) problems.push(`${at}: description en/fr`);
    const eds = Object.entries(e.editions || {});
    if (!eds.length) problems.push(`${at}: no editions`);
    for (const [lang, ed] of eds) {
      langs.add(lang);
      if (!ed.title || !ed.author || !ed.publisher) problems.push(`${at}/${lang}: title/author/publisher`);
      try { if (new URL(ed.url).protocol !== 'https:') problems.push(`${at}/${lang}: not https`); } catch { problems.push(`${at}/${lang}: bad url ${ed.url}`); }
      // The real day the page was opened: an ISO date, research began 2026-09-23, never in the future.
      const verified = /^\d{4}-\d{2}-\d{2}$/.test(ed.lastVerifiedAt || '') ? ed.lastVerifiedAt : '';
      if (!verified || verified < '2026-09-23' || verified > new Date().toISOString().slice(0, 10)) problems.push(`${at}/${lang}: lastVerifiedAt ${ed.lastVerifiedAt}`);
      if (/amazon\.|christianbook\.|fnac\.|thalia\.|bol\.com|ebay\./i.test(ed.url || '')) problems.push(`${at}/${lang}: retailer url`);
    }
    if (e.originalLanguage && !e.editions?.[e.originalLanguage]) { /* translation-only entry: fine but note */ }
  }
  stats[plan] = { entries: entries.length, sensitive, langs: [...langs].sort().join(',') };
}
console.table(stats);
const dupes = [...seen].filter(([, plans]) => plans.length > 1);
console.log('shared ids across plans:', dupes.map(([id, p]) => `${id} (${p.join('+')})`).join('; ') || 'none');
console.log(problems.length ? `PROBLEMS (${problems.length}):\n${problems.join('\n')}` : 'no problems');
