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
 * read: the sky of the verse cards, the plan's length as a numeral with one
 * star per day beneath it, a constellation seeded by the plan, and the logo.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import PLAN_PREVIEW from '../api/_planPreviewData.js';
import { constellationFigure, starField } from '../src/lib/cardSky.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'public', 'og', 'plans');
const WIDTH = 1200;
const HEIGHT = 630;

// Lining figures on purpose: Georgia's old-style 4, 7 and 9 drop below the
// baseline straight into the row of day stars.
//
// The Constellation card tokens (src/index.css, dark sky): the same palette the
// shareable verse and plan cards use.
const SKY_FROM = '#19132f';
const SKY_TO = '#4a3190';
const INK = '#f8f5ff';
const ACCENT = '#b19aeb';

const LEFT = 110;
const DAY_ROW_Y = 478;
const DAY_ROW_WIDTH = 520;

function dayRow(count) {
  const step = Math.min(34, DAY_ROW_WIDTH / Math.max(count - 1, 1));
  const radius = count > 21 ? 4.5 : 6;
  return Array.from({ length: count }, (_unused, index) =>
    `<circle cx="${(LEFT + 8 + index * step).toFixed(1)}" cy="${DAY_ROW_Y}" r="${radius}" fill="${ACCENT}" />`).join('');
}

function planSvg(planId, count) {
  const stars = starField({ seed: `og:${planId}`, width: WIDTH, height: HEIGHT, count: 90 })
    .map((star) => `<circle cx="${star.x}" cy="${star.y}" r="${star.radius.toFixed(2)}" fill="${INK}" fill-opacity="${star.alpha.toFixed(2)}" />`)
    .join('');
  const figure = constellationFigure({ seed: planId, box: { x: 660, y: 120, width: 440, height: 300 }, count: Math.max(3, Math.min(count, 12)) });
  const line = figure.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ');
  const figureStars = figure.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="${(point.radius * 1.6).toFixed(2)}" fill="${INK}" />`).join('');
  const digits = String(count);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${SKY_FROM}" />
      <stop offset="1" stop-color="${SKY_TO}" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)" />
  ${stars}
  <path d="${line}" fill="none" stroke="${INK}" stroke-opacity="0.3" stroke-width="2" />
  ${figureStars}
  <text x="${LEFT}" y="400" font-family="'Palatino Linotype', 'Book Antiqua', Palatino, 'Times New Roman', serif" font-size="${digits.length > 1 ? 290 : 310}" fill="${INK}">${digits}</text>
  ${dayRow(count)}
</svg>`;
}

const logo = await sharp(join(root, 'public', 'logo.svg')).resize(84, 84).png().toBuffer();

await mkdir(OUT_DIR, { recursive: true });
for (const [planId, plan] of Object.entries(PLAN_PREVIEW.plans)) {
  const png = await sharp(Buffer.from(planSvg(planId, plan.count)))
    .composite([{ input: logo, left: WIDTH - LEFT - 84, top: HEIGHT - 84 - 70 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(OUT_DIR, `${planId}.png`), png);
  console.log(`public/og/plans/${planId}.png  ${plan.count} days  ${(png.length / 1024).toFixed(0)} KB`);
}

// A stale picture for a plan that is no longer shareable would still be served.
const expected = new Set(Object.keys(PLAN_PREVIEW.plans).map((id) => `${id}.png`));
const stray = (await readdir(OUT_DIR)).filter((file) => file.endsWith('.png') && !expected.has(file));
if (stray.length) console.warn(`Not a shareable plan any more, remove: ${stray.join(', ')}`);
