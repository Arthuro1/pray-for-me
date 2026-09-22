// A guided plan drawn as a shareable image, for Stories, Status and feeds.
//
// The same sky as the verse card (see verseCard.js) and the same three rules:
// nothing is fetched, layout is pure, the sky is seeded. The seed is the plan
// id, so every picture of one plan stands under the same stars.
//
// What goes on it is only what the plan's public page shows: its name, its
// length and its subtitle. The link does not fit in a picture, so the footer
// carries the address people can type.
import { isRtl } from '../i18n';
import {
  CARD_MARK,
  CARD_SIZES,
  drawConstellation,
  drawSky,
  fontStacks,
  readCardPalette,
  weightedLength,
  wrapLines,
} from './verseCard';

const LABEL_SIZE = 22;
const META_SIZE = 32;
const SUB_SIZE = 38;
const MARK_SIZE = 24;
const TITLE_MAX_LINES = 4;
const SUB_MAX_LINES = 3;
// [max weighted length, px]: a short plan name is set large, a long one smaller,
// and past the last step it simply wraps onto more lines.
const TITLE_RAMP = Object.freeze([[22, 104], [44, 88], [72, 72]]);
const TITLE_MIN = 60;

export function planTitleSize(title) {
  const step = TITLE_RAMP.find(([max]) => weightedLength(title) <= max);
  return step ? step[1] : TITLE_MIN;
}

// Keeps at most `max` lines, ending the last kept one with an ellipsis that
// still fits, so a long subtitle can never run into the footer.
export function clampLines(lines, max, maxWidth, measure) {
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  let last = kept[max - 1];
  while (last && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
  kept[max - 1] = `${last.trimEnd()}…`;
  return kept;
}

function baselineIn(top, lineHeight, fontSize) {
  return Math.round(top + lineHeight * 0.5 + fontSize * 0.35);
}

// Geometry for one plan card. `measure(text, fontSize, family)` is its only
// view of type, so tests pass their own metrics.
export function layoutPlanCard({ label, title, meta, sub, mark = CARD_MARK, count = 6, lang = 'fr', size = 'square', measure }) {
  const { width, height, margin } = CARD_SIZES[size] || CARD_SIZES.square;
  const story = size === 'story';
  const rtl = isRtl(lang);
  const boxWidth = width - margin * 2;
  const leadX = rtl ? width - margin : margin;
  const lead = rtl ? 'right' : 'left';

  const contentTop = story ? Math.round(height * 0.155) : margin;
  const contentBottom = story ? Math.round(height * 0.79) : height - margin;
  const labelBaseline = contentTop + LABEL_SIZE;
  const markBaseline = contentBottom - 4;
  const ruleY = markBaseline - (story ? 44 : 58);
  const areaBottom = ruleY - 40;

  const titleSize = planTitleSize(title);
  const titleLineHeight = Math.round(titleSize * 1.18);
  const titleLines = clampLines(
    wrapLines({ text: title, maxWidth: boxWidth, measure: (text) => measure(text, titleSize, 'editorial') }),
    TITLE_MAX_LINES,
    boxWidth,
    (text) => measure(text, titleSize, 'editorial'),
  );
  const subLineHeight = Math.round(SUB_SIZE * 1.4);
  const subLines = sub
    ? clampLines(
      wrapLines({ text: sub, maxWidth: boxWidth, measure: (text) => measure(text, SUB_SIZE, 'ui') }),
      SUB_MAX_LINES,
      boxWidth,
      (text) => measure(text, SUB_SIZE, 'ui'),
    )
    : [];

  // Title, then the length, then the subtitle, as one block sat low in the
  // frame; the constellation takes the sky above it.
  const metaGap = 36;
  const subGap = 28;
  const blockHeight = titleLines.length * titleLineHeight
    + metaGap + META_SIZE
    + (subLines.length ? subGap + subLines.length * subLineHeight : 0);
  const blockTop = Math.max(labelBaseline + 180, areaBottom - blockHeight);
  const titleTop = blockTop;
  const metaBaseline = titleTop + titleLines.length * titleLineHeight + metaGap + Math.round(META_SIZE * 0.8);
  const subTop = metaBaseline + subGap;

  const figureWidth = Math.round(width * 0.5);
  const figureTop = labelBaseline + 48;
  const figureHeight = blockTop - 56 - figureTop;

  return {
    width,
    height,
    margin,
    dir: rtl ? 'rtl' : 'ltr',
    label: { text: label, size: LABEL_SIZE, x: leadX, y: labelBaseline, align: lead },
    figure: figureHeight >= 120
      ? { x: rtl ? margin : width - margin - figureWidth, y: figureTop, width: figureWidth, height: figureHeight, count: Math.max(3, Math.min(count, 12)) }
      : null,
    title: { lines: titleLines, size: titleSize, lineHeight: titleLineHeight, x: leadX, y: baselineIn(titleTop, titleLineHeight, titleSize), align: lead },
    meta: { text: meta, size: META_SIZE, x: leadX, y: metaBaseline, align: lead },
    sub: subLines.length
      ? { lines: subLines, size: SUB_SIZE, lineHeight: subLineHeight, x: leadX, y: baselineIn(subTop, subLineHeight, SUB_SIZE), align: lead }
      : null,
    rule: { y: ruleY, x1: margin, x2: width - margin },
    mark: story
      ? { text: mark, size: MARK_SIZE, x: Math.round(width / 2), y: markBaseline, align: 'center' }
      : { text: mark, size: MARK_SIZE, x: leadX, y: markBaseline, align: lead },
  };
}

export function drawPlanCard(ctx, layout, palette, { seed = 0, stacks }) {
  const font = (size, family, weight = '400') => `${weight} ${size}px ${stacks[family]}`;

  drawSky(ctx, layout, palette, seed);
  ctx.textBaseline = 'alphabetic';
  ctx.direction = layout.dir;
  if (layout.figure) drawConstellation(ctx, layout.figure, palette, { seed, count: layout.figure.count });

  const text = (part, family, color, weight = '400', spacing = '0px') => {
    if (!part?.text) return;
    ctx.font = font(part.size, family, weight);
    ctx.letterSpacing = spacing;
    ctx.fillStyle = color;
    ctx.textAlign = part.align;
    ctx.fillText(part.text, part.x, part.y);
    ctx.letterSpacing = '0px';
  };
  const lines = (part, family, color, weight = '400') => {
    if (!part) return;
    ctx.font = font(part.size, family, weight);
    ctx.fillStyle = color;
    ctx.textAlign = part.align;
    part.lines.forEach((line, index) => ctx.fillText(line, part.x, part.y + index * part.lineHeight));
  };

  text({ ...layout.label, text: String(layout.label.text || '').toUpperCase() }, 'ui', palette.label, '600', '4px');
  lines(layout.title, 'editorial', palette.ink);
  text(layout.meta, 'ui', palette.label, '600');
  lines(layout.sub, 'ui', palette.mark);

  ctx.strokeStyle = palette.rule;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(layout.rule.x1, layout.rule.y + 0.5);
  ctx.lineTo(layout.rule.x2, layout.rule.y + 0.5);
  ctx.stroke();
  text(layout.mark, 'ui', palette.mark, '400', '1px');
}

// A PNG Blob of the card, or null when 2D canvas is unavailable — the sheet then
// hides the image option and the link carries on alone.
export async function renderPlanCard({
  label,
  title,
  meta,
  sub,
  count,
  lang = 'fr',
  size = 'square',
  seed = 0,
  root = typeof document === 'undefined' ? null : document.documentElement,
}) {
  if (typeof document === 'undefined') return null;
  const { width, height } = CARD_SIZES[size] || CARD_SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext?.('2d');
  if (!ctx || typeof canvas.toBlob !== 'function') return null;

  const stacks = fontStacks(root);
  const layout = layoutPlanCard({
    label,
    title,
    meta,
    sub,
    count,
    lang,
    size,
    measure: (value, fontSize, family) => {
      ctx.font = `400 ${fontSize}px ${stacks[family]}`;
      return ctx.measureText(value).width;
    },
  });
  drawPlanCard(ctx, layout, readCardPalette(root), { seed, stacks });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || null), 'image/png');
  });
}
