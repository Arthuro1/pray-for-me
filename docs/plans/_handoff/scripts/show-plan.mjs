/* global process */
// Print a plan's days in reviewable form. Usage: node show-plan.mjs <repo> <DaysFile> [lang=en] [from] [to]
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const [repo, file, lang = 'en', from = '1', to = '99'] = process.argv.slice(2);
const out = join(process.env.SP, 'bundles', `${file}.mjs`);
execSync(`npx esbuild src/content/plans/${file}.js --bundle --format=esm --platform=node --outfile="${out}" --log-level=error`, { cwd: repo });
const { DAYS } = await import(pathToFileURL(out).href + '?t=' + Date.now());
const p = (v) => (v && typeof v === 'object' ? v[lang] : v);
DAYS.forEach((d, i) => {
  const n = i + 1; if (n < +from || n > +to) return;
  console.log(`\n## Day ${n} [${d.movement}] ${p(d.theme)} — ${d.ref} | related: ${(d.related || []).join('; ')} | topics: ${(d.resourceTopics || []).join(',')}`);
  console.log(`R: ${p(d.reflection)}`);
  (d.prompts || []).forEach((x, j) => console.log(`P${j + 1}: ${p(x)}`));
  if (d.selfPrompt) console.log(`SELF: ${p(d.selfPrompt)}`);
  if (d.practice) console.log(`PRAC: ${p(d.practice)}`);
  if (d.safetyNote) console.log(`SAFE: ${p(d.safetyNote)}`);
  if (d.study) { const s = d.study; console.log(`CTX: ${p(s.context)}\nTEN: ${p(s.tension)}`); (s.questions || []).forEach((q, j) => console.log(`Q${j + 1}: ${p(q)}`)); console.log(`SYN: ${p(s.synthesis)}\nPRAY: ${p(s.prayer)}`); }
});
