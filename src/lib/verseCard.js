// The verse of the day, drawn as a shareable image.
//
// Why an image at all: a verse leaves the app into someone else's chat, where a
// bare text line plus a link to the app root arrives as noise. A card carries the
// verse, its reference and its edition, so what lands is readable on its own —
// and so Scripture is never passed on without saying which edition it came from.
//
// Three rules shape this module:
//
//   1. No remote artwork. Colours and type come from the Qetoret tokens; the
//      bundled editorial face and device fallbacks also work offline.
//   2. Layout is pure. `layoutVerseCard` takes a `measure` callback and returns
//      plain geometry, so the type ramp, the wrapping and the right-to-left flip
//      are unit-testable with no canvas in sight.
//   3. Scripture first. An editorial verse and its citation form one block;
//      a quiet incense silhouette and the outlined wordmark carry the brand.
import { isRtl } from '../i18n';
import { RISE_PATH, riseFigure } from './cardRise';
import { WORDMARK } from '../brand/marks';

export { riseFigure };

export const CARD_SIZES = Object.freeze({
  // Square travels everywhere — chat bubbles, feeds, a screenshot into a
  // bulletin. Story is the 9:16 status/story frame.
  square: Object.freeze({ width: 1080, height: 1080, margin: 96 }),
  story: Object.freeze({ width: 1080, height: 1920, margin: 76 }),
});

export const CARD_MARK = 'qetoret.com';

// [max weighted length, px]. The step is picked before layout so the verse never
// shrinks below a readable size; past the last step it is too long to set as
// artwork and the card shows the reference alone instead.
const TYPE_RAMP = Object.freeze([[40, 100], [90, 80], [160, 64], [260, 54]]);
export const VERSE_TEXT_LIMIT = TYPE_RAMP[TYPE_RAMP.length - 1][0];
const MIN_VERSE_SIZE = 44;

const LABEL_SIZE = 24;
const REFERENCE_SIZE = 32;
const MARK_SIZE = 24;
const BIG_REFERENCE_SIZE = 92;
const INVITE_SIZE = 32;
const UNTRACKED_LANGS = new Set(['ar', 'fa', 'hi', 'am', 'zh', 'ja', 'ko']);

// Ideographs, Hangul and full-width punctuation take about twice the advance of a
// Latin character and each carries a whole word, so a 26-glyph Chinese verse must
// not land on the same step as a 26-character English one.
const WIDE_CHAR = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/;

export function weightedLength(text) {
  let total = 0;
  for (const char of String(text ?? '')) total += WIDE_CHAR.test(char) ? 1.8 : 1;
  return total;
}

function hasWideChars(text) {
  return WIDE_CHAR.test(String(text ?? ''));
}

// The step for this verse, or null when it is past the ramp (caller falls back to
// the reference-only card rather than setting Scripture at an unreadable size).
export function verseFontSize(text) {
  const step = TYPE_RAMP.find(([max]) => weightedLength(text) <= max);
  return step ? step[1] : null;
}

// Greedy wrap on whitespace, then break any single token that still doesn't fit.
// Chinese and Japanese have no spaces at all, so the per-character pass is the
// only thing keeping them inside the margin.
export function wrapLines({ text, maxWidth, measure }) {
  const lines = [];
  let line = '';
  const flush = () => {
    if (line) lines.push(line);
    line = '';
  };
  for (const token of String(text ?? '').split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${token}` : token;
    if (measure(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }
    flush();
    if (measure(token) <= maxWidth) {
      line = token;
      continue;
    }
    for (const char of token) {
      if (line && measure(line + char) > maxWidth) flush();
      line += char;
    }
  }
  flush();
  return lines;
}

// Roughly centre the ink of a line inside its line box. Canvas has no line-height,
// so every baseline is placed by hand.
function baselineIn(top, lineHeight, fontSize) {
  return Math.round(top + lineHeight * 0.5 + fontSize * 0.35);
}

// Keep the line count, but find a narrower measure so the final line is not a
// lone word. No words or punctuation are added, removed or abbreviated.
function balancedLines({ text, maxWidth, measure }) {
  const original = wrapLines({ text, maxWidth, measure });
  if (original.length < 2) return original;
  let low = maxWidth * 0.45;
  let high = maxWidth;
  while (high - low > 2) {
    const mid = (low + high) / 2;
    if (wrapLines({ text, maxWidth: mid, measure }).length > original.length) low = mid;
    else high = mid;
  }
  return wrapLines({ text, maxWidth: high, measure });
}

// Geometry for one card. Pure: `measure(text, fontSize, family, weight)` is the only way
// it learns how wide anything is, so tests inject their own metrics.
//
// Every position is a canvas pixel; text is wrapped and measured before drawing.
export function layoutVerseCard({
  label,
  verse,
  reference,
  invite,
  mark = CARD_MARK,
  lang = 'fr',
  size = 'square',
  measure,
}) {
  const { width, height, margin } = CARD_SIZES[size] || CARD_SIZES.square;
  const story = size === 'story';
  const rtl = isRtl(lang);
  const boxWidth = width - margin * 2;
  // Right-to-left flips the reading edge and the footer's two halves.
  const leadX = rtl ? width - margin : margin;
  const trailX = rtl ? margin : width - margin;
  const lead = rtl ? 'right' : 'left';
  const trail = rtl ? 'left' : 'right';

  // The story frame keeps the platform's own chrome out of the artwork: nothing
  // is drawn in the top 14% (header) or bottom 20% (reply bar / swipe-up).
  const contentTop = story ? Math.round(height * 0.155) : margin;
  const contentBottom = story ? Math.round(height * 0.79) : height - margin;
  const labelText = UNTRACKED_LANGS.has(lang) ? String(label || '') : String(label || '').toUpperCase();
  const labelSpacing = UNTRACKED_LANGS.has(lang) ? 0 : 3.5;
  let labelSize = LABEL_SIZE;
  while (labelSize > 16 && measure(labelText, labelSize, 'ui', '600') + Math.max(0, [...labelText].length - 1) * labelSpacing > boxWidth) labelSize -= 1;
  const labelBaseline = contentTop + LABEL_SIZE;
  const markBaseline = contentBottom - 4;
  const ruleY = markBaseline - 64;
  const areaTop = labelBaseline + 100;
  const areaBottom = ruleY - 70;
  const areaHeight = areaBottom - areaTop;
  const figureWidth = Math.round(width * 0.24);
  const figureHeight = Math.round((contentBottom - contentTop) * 0.83);
  const brandHeight = 38;
  const [, , wordmarkWidth, wordmarkHeight] = WORDMARK.viewBox.split(' ').map(Number);
  const brandWidth = brandHeight * wordmarkWidth / wordmarkHeight;

  const common = {
    width,
    height,
    margin,
    dir: rtl ? 'rtl' : 'ltr',
    label: { text: labelText, size: labelSize, spacing: labelSpacing, x: leadX, y: labelBaseline, align: lead },
    figure: {
      x: rtl ? margin - 20 : width - margin - figureWidth + 20,
      y: contentTop + 32,
      width: figureWidth,
      height: figureHeight,
    },
    rule: { y: ruleY, x1: margin, x2: width - margin },
    brand: { x: rtl ? width - margin - brandWidth : margin, y: markBaseline - brandHeight + 4, height: brandHeight },
    mark: { text: mark, size: MARK_SIZE, x: trailX, y: markBaseline, align: trail },
  };

  let fontSize = verseFontSize(verse);
  const wide = hasWideChars(verse);
  const referenceLines = wrapLines({ text: reference, maxWidth: boxWidth, measure: (text) => measure(text, REFERENCE_SIZE, 'ui', '500') });
  const referenceLineHeight = Math.round(REFERENCE_SIZE * 1.4);
  const captionHeight = 36 + referenceLines.length * referenceLineHeight;
  let lines;
  let lineHeight;
  let blockHeight;
  if (verse && fontSize) {
    if (story) fontSize = Math.round(fontSize * 1.08);
    // Actual metrics, not just character counts: even a wide fallback face must
    // fit above the footer. Scripture is never clipped or truncated to make room.
    while (fontSize >= MIN_VERSE_SIZE) {
      lineHeight = Math.round(fontSize * (wide ? 1.5 : 1.28));
      lines = balancedLines({ text: verse, maxWidth: boxWidth, measure: (text) => measure(text, fontSize, 'editorial') });
      blockHeight = lines.length * lineHeight + captionHeight;
      if (blockHeight <= areaHeight) break;
      fontSize -= 2;
    }
    if (fontSize < MIN_VERSE_SIZE) fontSize = null;
  }

  // No authoritative text in this language, or a passage too long to set: the
  // reference becomes the artwork. Never a placeholder, never invented wording.
  if (!verse || !fontSize) {
    let referenceSize = BIG_REFERENCE_SIZE;
    let fallbackLines;
    const inviteLines = wrapLines({ text: invite, maxWidth: boxWidth, measure: (text) => measure(text, INVITE_SIZE, 'ui') });
    const inviteLineHeight = Math.round(INVITE_SIZE * 1.4);
    const inviteHeight = inviteLines.length ? 36 + inviteLines.length * inviteLineHeight : 0;
    let referenceHeight;
    do {
      fallbackLines = balancedLines({ text: reference, maxWidth: boxWidth, measure: (text) => measure(text, referenceSize, 'editorial') });
      referenceHeight = fallbackLines.length * Math.round(referenceSize * 1.18);
      if (referenceHeight + inviteHeight <= areaHeight || referenceSize <= MIN_VERSE_SIZE) break;
      referenceSize -= 2;
    } while (referenceSize >= MIN_VERSE_SIZE);
    const blockTop = areaTop + Math.max(0, Math.round((areaHeight - referenceHeight - inviteHeight) / 2));
    return {
      ...common,
      mode: 'reference',
      verse: null,
      accent: { x1: leadX, x2: leadX + (rtl ? -64 : 64), y: blockTop - 42 },
      reference: {
        text: reference,
        lines: fallbackLines,
        size: referenceSize,
        lineHeight: Math.round(referenceSize * 1.18),
        x: leadX,
        y: baselineIn(blockTop, Math.round(referenceSize * 1.18), referenceSize),
        align: lead,
      },
      invite: inviteLines.length
        ? { text: invite, lines: inviteLines, size: INVITE_SIZE, lineHeight: inviteLineHeight, x: leadX, y: baselineIn(blockTop + referenceHeight + 36, inviteLineHeight, INVITE_SIZE), align: lead }
        : null,
    };
  }

  const blockTop = areaTop + Math.round((areaHeight - blockHeight) / 2);
  const firstBaseline = baselineIn(blockTop, lineHeight, fontSize);

  return {
    ...common,
    mode: 'verse',
    verse: { lines, size: fontSize, lineHeight, x: leadX, y: firstBaseline, align: lead },
    accent: { x1: leadX, x2: leadX + (rtl ? -64 : 64), y: blockTop - 42 },
    reference: {
      text: reference,
      lines: referenceLines,
      size: REFERENCE_SIZE,
      lineHeight: referenceLineHeight,
      x: leadX,
      y: baselineIn(blockTop + lines.length * lineHeight + 36, referenceLineHeight, REFERENCE_SIZE),
      align: lead,
    },
    invite: null,
  };
}

// ── palette ──────────────────────────────────────────────────────────────────
// Straight from the Qetoret tokens, so the exported image wears the app's own
// deep violet rather than a second palette that can drift away. One committed
// look in both themes.
export function withAlpha(hex, alpha) {
  const value = String(hex).trim().replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const int = Number.parseInt(full, 16);
  if (!Number.isFinite(int) || full.length !== 6) return hex;
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

export function readCardPalette(root = document.documentElement) {
  const styles = getComputedStyle(root);
  const token = (name, fallback) => (styles.getPropertyValue(name) || '').trim() || fallback;
  const ink = token('--q-text-inverse', '#F7F5EF');
  const accent = token('--q-gold-inverse', '#C6A15C');
  return {
    ground: token('--q-royal-deep', '#29213F'),
    ink,
    label: accent,
    reference: accent,
    rise: accent,
    motif: withAlpha(accent, 0.12),
    mark: withAlpha(ink, 0.6),
    rule: withAlpha(ink, 0.24),
  };
}

// ── drawing ──────────────────────────────────────────────────────────────────
const FAMILIES = Object.freeze({
  editorial: "'Newsreader', 'Noto Serif', 'Iowan Old Style', 'Palatino Linotype', 'Noto Naskh Arabic', 'Noto Serif Devanagari', 'Noto Serif Ethiopic', 'Noto Serif CJK SC', Georgia, serif",
  ui: "'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Devanagari', 'Noto Sans Ethiopic', 'Noto Sans CJK SC', 'Segoe UI', system-ui, -apple-system, sans-serif",
});

// Prefer the live stacks so the card tracks index.css, and fall back to the same
// values inline when the tokens aren't readable (tests, detached documents).
export function fontStacks(root) {
  if (typeof getComputedStyle !== 'function' || !root) return FAMILIES;
  const styles = getComputedStyle(root);
  const read = (name, fallback) => (styles.getPropertyValue(name) || '').trim() || fallback;
  return {
    editorial: read('--q-font-editorial', FAMILIES.editorial),
    ui: read('--q-font-ui', FAMILIES.ui),
  };
}

// The ground every shared card stands on: one flat deep violet, no gradient.
export function drawGround(ctx, { width, height }, palette) {
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, 0, width, height);
}

// The Rise Mark, fitted into `box`. Skipped where Path2D is missing (a test double).
export function drawRise(ctx, box, palette, { maxHeight } = {}) {
  if (typeof Path2D === 'undefined') return;
  const figure = riseFigure({ box, maxHeight });
  ctx.save();
  ctx.translate(figure.x, figure.y);
  ctx.scale(figure.scale, figure.scale);
  ctx.fillStyle = palette.rise;
  ctx.fill(new Path2D(RISE_PATH));
  ctx.restore();
}

// Use the real outlined wordmark, including its plain Q and swash. The generated
// letters have one translate/scale transform, shared with Brand.jsx's SVG.
function drawWordmark(ctx, box, color) {
  if (typeof Path2D === 'undefined') return;
  const [x, y, , height] = WORDMARK.viewBox.split(' ').map(Number);
  const [lettersX, lettersY, lettersScale] = WORDMARK.lettersTransform.match(/-?\d*\.?\d+/g).map(Number);
  ctx.save();
  ctx.translate(box.x, box.y);
  ctx.scale(box.height / height, box.height / height);
  ctx.translate(-x, -y);
  ctx.fillStyle = color;
  WORDMARK.q.forEach((path) => ctx.fill(new Path2D(path)));
  ctx.translate(lettersX, lettersY);
  ctx.scale(lettersScale, lettersScale);
  ctx.fill(new Path2D(WORDMARK.letters));
  ctx.restore();
}

export function drawVerseCard(ctx, layout, palette, { stacks = FAMILIES } = {}) {
  const font = (size, family, weight = '400') => `${weight} ${size}px ${stacks[family]}`;

  drawGround(ctx, layout, palette);

  ctx.textBaseline = 'alphabetic';
  ctx.direction = layout.dir;

  if (layout.figure) drawRise(ctx, layout.figure, { ...palette, rise: palette.motif });

  const line = (part, family, color, weight = '400', spacing = '0px') => {
    if (!part?.text) return;
    ctx.font = font(part.size, family, weight);
    ctx.letterSpacing = spacing;
    ctx.fillStyle = color;
    ctx.textAlign = part.align;
    (part.lines || [part.text]).forEach((text, index) => {
      ctx.fillText(text, part.x, part.y + index * (part.lineHeight || 0));
    });
    ctx.letterSpacing = '0px';
  };

  line(layout.label, 'ui', palette.label, '600', `${layout.label.spacing}px`);

  ctx.strokeStyle = palette.rise;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(layout.accent.x1, layout.accent.y);
  ctx.lineTo(layout.accent.x2, layout.accent.y);
  ctx.stroke();

  if (layout.verse) {
    ctx.font = font(layout.verse.size, 'editorial');
    ctx.fillStyle = palette.ink;
    ctx.textAlign = layout.verse.align;
    layout.verse.lines.forEach((text, index) => {
      ctx.fillText(text, layout.verse.x, layout.verse.y + index * layout.verse.lineHeight);
    });
  }

  if (layout.mode === 'reference') {
    line(layout.reference, 'editorial', palette.ink);
    line(layout.invite, 'ui', palette.mark);
  } else {
    line(layout.reference, 'ui', palette.reference, '500');
  }

  ctx.strokeStyle = palette.rule;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(layout.rule.x1, layout.rule.y + 0.5);
  ctx.lineTo(layout.rule.x2, layout.rule.y + 0.5);
  ctx.stroke();

  drawWordmark(ctx, layout.brand, palette.ink);
  line(layout.mark, 'ui', palette.mark);
}

// Render one card to a PNG Blob. Resolves null when 2D canvas isn't available —
// callers then fall back to sharing the verse as text rather than failing loudly.
export async function renderVerseCard({
  label,
  verse,
  reference,
  invite,
  lang = 'fr',
  size = 'square',
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
  // Canvas doesn't repaint after a font swap. Resolve the app's local faces
  // before measuring so a first share looks like every subsequent export.
  if (document.fonts?.load) {
    await Promise.allSettled([
      document.fonts.load(`400 100px ${stacks.editorial}`, verse || reference),
      document.fonts.load(`600 32px ${stacks.ui}`, `${label} ${reference}`),
    ]);
  }
  const layout = layoutVerseCard({
    label,
    verse,
    reference,
    invite,
    lang,
    size,
    measure: (text, fontSize, family, weight = '400') => {
      ctx.font = `${weight} ${fontSize}px ${stacks[family]}`;
      return ctx.measureText(text).width;
    },
  });
  drawVerseCard(ctx, layout, readCardPalette(root), { stacks });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || null), 'image/png');
  });
}
