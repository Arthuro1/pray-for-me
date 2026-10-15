// Builds a self-contained review page per language for native Christian
// reviewers (docs/PRAYER_PLAN_QUALITY.md § How a language is approved):
//
//   npm run build:plan-review -- --lang de     → reports/plan-review/de.html
//   npm run build:plan-review -- --all         → one page per translated language
//
// Send the HTML file to the reviewer. It sends nothing anywhere; the reviewer
// downloads their review and you import it with `npm run import:plan-review`.
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { root, withSsr } from './content-quality/runtime.mjs';
import { renderReviewPage } from './content-quality/planReviewHtml.mjs';

const args = process.argv.slice(2);
const all = args.includes('--all');
const lang = args[args.indexOf('--lang') + 1];
if (all === args.includes('--lang') || (!all && !lang)) throw new Error('Usage: npm run build:plan-review -- --lang <code> | --all');

await withSsr(async (ssrLoad) => {
  const [{ PLANS }, { overlayLanguages }, { buildReviewPacket }, { LANG_CODES }, en] = await Promise.all([
    ssrLoad('/src/content/prayerPlans.js'),
    ssrLoad('/src/content/plans/translations.js'),
    ssrLoad('/src/content-quality/planReviewPacket.js'),
    ssrLoad('/src/i18n.js'),
    ssrLoad('/src/i18n/locales/en.js'),
  ]);
  const languages = all ? LANG_CODES.filter((code) => !['en', 'fr'].includes(code)) : [lang];
  for (const code of languages) {
    if (!LANG_CODES.includes(code)) throw new Error(`Unsupported language: ${code}`);
    const target = (await ssrLoad(`/src/i18n/locales/${code}.js`)).default;
    const packet = buildReviewPacket(code, { plans: PLANS, overlayLanguages, locales: { en: en.default, target } });
    if (!packet.plans.length) { console.log(`${code}: no plan translation to review.`); continue; }
    const path = resolve(root, 'reports/plan-review', `${code}.html`);
    await mkdir(resolve(root, 'reports/plan-review'), { recursive: true });
    await writeFile(path, renderReviewPage(packet));
    const served = packet.plans.filter((plan) => plan.served).length;
    console.log(`${code}: ${packet.plans.length} plans (${served} shown to readers) → ${path}`);
  }
});
