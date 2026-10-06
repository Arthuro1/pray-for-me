/**
 * Renders the link-preview picture for every shareable plan:
 *   public/og/plans/<planId>.png   (1200×630, what WhatsApp/Facebook/X show)
 *
 * Run after adding a plan or changing a plan's length:  npm run build:plan-og
 * (after regenerating api/_planPreviewData.js, which it reads).
 *
 * The picture has no words in it on purpose. A preview travels in whatever
 * language the sharer wrote in, and the platform already prints the plan's
 * localized title and description beside it; drawn text would need a font
 * for every one of the 16 scripts. So it says the one thing every reader can
 * read: the plan's length as a numeral, one gold mark per day beneath it, and
 * the Qetoret symbol — on the app's own deep violet. No sky, no stars.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import PLAN_PREVIEW from '../api/_planPreviewData.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'public', 'og', 'plans');
const WIDTH = 1200;
const HEIGHT = 630;

// The Qetoret tokens (src/styles/tokens.css): deep violet ground, alabaster
// type, temple gold for what is sacred.
const GROUND = '#29213F';
const INK = '#F7F5EF';
const GOLD = '#C6A15C';

const LEFT = 110;
const DAY_ROW_Y = 470;
const DAY_ROW_WIDTH = 520;
const SYMBOL_HEIGHT = 380;

// One upright gold mark per day: a tally of the days, never a starfield.
function dayRow(count) {
  const step = Math.min(30, DAY_ROW_WIDTH / Math.max(count - 1, 1));
  const width = count > 21 ? 3 : 4;
  return Array.from({ length: count }, (_unused, index) =>
    `<rect x="${(LEFT + 6 + index * step).toFixed(1)}" y="${DAY_ROW_Y - 14}" width="${width}" height="28" rx="${width / 2}" fill="${GOLD}" />`).join('');
}

// Lining figures on purpose: Georgia's old-style 4, 7 and 9 drop below the
// baseline straight into the row of day marks.
function planSvg(count) {
  const digits = String(count);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${GROUND}" />
  <text x="${LEFT}" y="400" font-family="'Palatino Linotype', 'Book Antiqua', Palatino, 'Times New Roman', serif" font-size="${digits.length > 1 ? 290 : 310}" fill="${INK}">${digits}</text>
  ${dayRow(count)}
</svg>`;
}

const symbol = await sharp(join(root, 'public', 'brand', 'qetoret-symbol-dark.svg'), { density: 300 })
  .resize({ height: SYMBOL_HEIGHT })
  .png()
  .toBuffer();
const symbolWidth = (await sharp(symbol).metadata()).width;

await mkdir(OUT_DIR, { recursive: true });
for (const [planId, plan] of Object.entries(PLAN_PREVIEW.plans)) {
  const png = await sharp(Buffer.from(planSvg(plan.count)))
    .composite([{ input: symbol, left: WIDTH - LEFT - symbolWidth, top: Math.round((HEIGHT - SYMBOL_HEIGHT) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(OUT_DIR, `${planId}.png`), png);
  console.log(`public/og/plans/${planId}.png  ${plan.count} days  ${(png.length / 1024).toFixed(0)} KB`);
}

// A stale picture for a plan that is no longer shareable would still be served.
const expected = new Set(Object.keys(PLAN_PREVIEW.plans).map((id) => `${id}.png`));
const stray = (await readdir(OUT_DIR)).filter((file) => file.endsWith('.png') && !expected.has(file));
if (stray.length) console.warn(`Not a shareable plan any more, remove: ${stray.join(', ')}`);
