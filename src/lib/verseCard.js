// The verse of the day, drawn as a shareable image.
//
// Why an image at all: a verse leaves the app into someone else's chat, where a
// bare text line plus a link to the app root arrives as noise. A card carries the
// verse, its reference and its edition, so what lands is readable on its own —
// and so Scripture is never passed on without saying which edition it came from.
//
// Three rules shape this module:
//
//   1. Nothing is fetched at render time. The colours are the live Constellation
//      tokens from index.css and the type is the same font stacks the app uses,
//      so the card matches whatever theme the sharer is in, renders offline, and
//      works in all 16 scripts — the device supplies the face, canvas needs no
//      webfont.
//   2. Layout is pure. `layoutVerseCard` takes a `measure` callback and returns
//      plain geometry, so the type ramp, the wrapping and the right-to-left flip
//      are unit-testable with no canvas in sight.
//   3. The sky is deterministic. The starfield is seeded by the day, exactly like
//      the verse pick, so everyone who shares today shares the same sky.
import { isRtl } from '../i18n';

export const CARD_SIZES = Object.freeze({
  // Square travels everywhere — chat bubbles, feeds, a screenshot into a
  // bulletin. Story is the 9:16 status/story frame.
  square: Object.freeze({ width: 1080, height: 1080, margin: 96 }),
  story: Object.freeze({ width: 1080, height: 1920, margin: 76 }),
});

export const CARD_MARK = 'pray4me.space';

// [max weighted length, px]. The step is picked before layout so the verse never
// shrinks below a readable size; past the last step it is too long to set as
// artwork and the card shows the reference alone instead.
const TYPE_RAMP = Object.freeze([[40, 84], [90, 64], [160, 52], [260, 44]]);
export const VERSE_TEXT_LIMIT = TYPE_RAMP[TYPE_RAMP.length - 1][0];
// At or under this the verse needs only a couple of lines, and the sky it leaves
// empty gets a small drawn constellation.
const FIGURE_LIMIT = TYPE_RAMP[0][0];

const LABEL_SIZE = 22;
const REFERENCE_SIZE = 30;
const MARK_SIZE = 24;
const BIG_REFERENCE_SIZE = 92;
const INVITE_SIZE = 32;

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

// Geometry for one card. Pure: `measure(text, fontSize, family)` is the only way
// it learns how wide anything is, so tests inject their own metrics.
//
// Returns { mode, dir, label, verse, reference, invite, figure, rule, mark } where
// every position is a canvas pixel and every `align` is 'left' | 'right' | 'center'.
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
  // Right-to-left flips which edge text grows from: the label and verse hang off
  // the right margin, and the footer's two halves swap sides.
  const leadX = rtl ? width - margin : margin;
  const trailX = rtl ? margin : width - margin;
  const lead = rtl ? 'right' : 'left';
  const trail = rtl ? 'left' : 'right';

  // The story frame keeps the platform's own chrome out of the artwork: nothing
  // is drawn in the top 14% (header) or bottom 20% (reply bar / swipe-up).
  const contentTop = story ? Math.round(height * 0.155) : margin;
  const contentBottom = story ? Math.round(height * 0.79) : height - margin;
  const labelBaseline = contentTop + LABEL_SIZE;
  const markBaseline = contentBottom - 4;
  const ruleY = markBaseline - (story ? 44 : 58);
  const areaTop = labelBaseline + 26;
  const areaBottom = ruleY - 34;

  const common = {
    width,
    height,
    margin,
    dir: rtl ? 'rtl' : 'ltr',
    label: { text: label, size: LABEL_SIZE, x: leadX, y: labelBaseline, align: lead },
    rule: { y: ruleY, x1: margin, x2: width - margin },
    mark: story
      ? { text: mark, size: MARK_SIZE, x: Math.round(width / 2), y: markBaseline, align: 'center' }
      : { text: mark, size: MARK_SIZE, x: leadX, y: markBaseline, align: lead },
  };

  const fontSize = verseFontSize(verse);

  // No authoritative text in this language, or a passage too long to set: the
  // reference becomes the artwork. Never a placeholder, never invented wording.
  if (!verse || !fontSize) {
    const centre = Math.round((areaTop + areaBottom) / 2);
    const figureWidth = Math.round(width * 0.42);
    const figureTop = areaTop + 30;
    return {
      ...common,
      mode: 'reference',
      verse: null,
      figure: {
        x: Math.round((width - figureWidth) / 2),
        y: figureTop,
        width: figureWidth,
        height: centre - 130 - figureTop,
      },
      reference: {
        text: reference,
        size: BIG_REFERENCE_SIZE,
        x: Math.round(width / 2),
        y: centre,
        align: 'center',
      },
      invite: invite
        ? { text: invite, size: INVITE_SIZE, x: Math.round(width / 2), y: centre + 72, align: 'center' }
        : null,
    };
  }

  const wide = hasWideChars(verse);
  const lineHeight = Math.round(fontSize * (wide ? 1.6 : 1.42));
  const lines = wrapLines({
    text: verse,
    maxWidth: boxWidth,
    measure: (text) => measure(text, fontSize, 'editorial'),
  });

  // In the story frame the reference rides under the verse as a caption instead of
  // sitting in the footer, so the footer carries the wordmark alone.
  const captionGap = story ? 34 + REFERENCE_SIZE : 0;
  const blockHeight = lines.length * lineHeight + captionGap;
  const blockTop = areaTop + Math.max(0, Math.round((areaBottom - areaTop - blockHeight) / 2));
  const firstBaseline = baselineIn(blockTop, lineHeight, fontSize);

  // A short verse leaves a band of empty sky above it. Rather than pad it out,
  // draw into it: a small constellation, on the side the text doesn't occupy, in
  // the app's own visual language. Deterministic, and free of any one font's
  // idea of what a quotation mark looks like.
  const figureWidth = Math.round(width * 0.42);
  const figureTop = labelBaseline + 44;
  const figureHeight = blockTop - 40 - figureTop;
  const figure = weightedLength(verse) <= FIGURE_LIMIT && figureHeight >= 140
    ? {
      x: rtl ? margin : width - margin - figureWidth,
      y: figureTop,
      width: figureWidth,
      height: figureHeight,
    }
    : null;

  return {
    ...common,
    mode: 'verse',
    verse: { lines, size: fontSize, lineHeight, x: leadX, y: firstBaseline, align: lead },
    figure,
    reference: story
      ? {
        text: reference,
        size: REFERENCE_SIZE,
        x: leadX,
        y: blockTop + lines.length * lineHeight + 34 + Math.round(REFERENCE_SIZE * 0.8),
        align: lead,
      }
      : { text: reference, size: REFERENCE_SIZE, x: trailX, y: markBaseline, align: trail },
    invite: null,
  };
}

// A calm, deterministic starfield. Seeded by the day like the verse itself, so the
// sky never flickers between two renders of the same card.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value) {
  const text = String(value ?? '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// One star per column, jittered vertically, then joined in order — a wandering
// line that reads as a constellation instead of a scribble.
export function constellationFigure({ seed, box, count = 6 }) {
  const random = mulberry32(hashSeed(`figure:${seed}`));
  const column = box.width / count;
  return Array.from({ length: count }, (_unused, index) => ({
    x: Math.round(box.x + column * (index + 0.5) + (random() - 0.5) * column * 0.6),
    y: Math.round(box.y + box.height * (0.15 + random() * 0.7)),
    radius: 2.4 + random() * 2.6,
  }));
}

export function starField({ seed, width, height, count }) {
  const random = mulberry32(hashSeed(seed));
  return Array.from({ length: count }, () => ({
    x: Math.round(random() * width),
    y: Math.round(random() * height),
    radius: 1 + random() * 2.4,
    alpha: 0.25 + random() * 0.6,
  }));
}

// ── palette ──────────────────────────────────────────────────────────────────
// Straight from the Constellation card tokens, so the exported image is the app's
// own sky rather than a second palette that can drift away from index.css. One
// committed look in both themes: Light and Dark differ only in the sky's depth.
function withAlpha(hex, alpha) {
  const value = String(hex).trim().replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const int = Number.parseInt(full, 16);
  if (!Number.isFinite(int) || full.length !== 6) return hex;
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

export function readCardPalette(root = document.documentElement) {
  const styles = getComputedStyle(root);
  const token = (name, fallback) => (styles.getPropertyValue(name) || '').trim() || fallback;
  const ink = token('--card-sky-ink', '#f8f5ff');
  const accent = token('--card-sky-accent', '#b19aeb');
  return {
    sky: [token('--card-sky-from', '#19132f'), token('--card-sky-to', '#4a3190')],
    ink,
    label: accent,
    reference: accent,
    star: ink,
    mark: withAlpha(ink, 0.6),
    rule: withAlpha(ink, 0.24),
    starCount: 64,
  };
}

// ── drawing ──────────────────────────────────────────────────────────────────
const FAMILIES = Object.freeze({
  editorial: "'Iowan Old Style', 'Palatino Linotype', 'Noto Serif', 'Noto Naskh Arabic', 'Noto Serif Devanagari', 'Noto Serif Ethiopic', Georgia, serif",
  ui: "'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Devanagari', 'Noto Sans Ethiopic', 'Segoe UI', system-ui, -apple-system, sans-serif",
});

// Prefer the live stacks so the card tracks index.css, and fall back to the same
// values inline when the tokens aren't readable (tests, detached documents).
function fontStacks(root) {
  if (typeof getComputedStyle !== 'function' || !root) return FAMILIES;
  const styles = getComputedStyle(root);
  const read = (name, fallback) => (styles.getPropertyValue(name) || '').trim() || fallback;
  return {
    editorial: read('--font-editorial', FAMILIES.editorial),
    ui: read('--font-ui', FAMILIES.ui),
  };
}

export function drawVerseCard(ctx, layout, palette, { seed = 0, stacks = FAMILIES } = {}) {
  const { width, height } = layout;
  const font = (size, family, weight = '400') => `${weight} ${size}px ${stacks[family]}`;

  const sky = ctx.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, palette.sky[0]);
  sky.addColorStop(1, palette.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = palette.star;
  for (const star of starField({ seed, width, height, count: palette.starCount })) {
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textBaseline = 'alphabetic';
  ctx.direction = layout.dir;

  if (layout.figure) {
    const points = constellationFigure({ seed, box: layout.figure });
    ctx.strokeStyle = withAlpha(palette.star, 0.28);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.fillStyle = palette.star;
    for (const point of points) {
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const line = (part, family, color, weight = '400', spacing = '0px') => {
    if (!part?.text) return;
    ctx.font = font(part.size, family, weight);
    ctx.letterSpacing = spacing;
    ctx.fillStyle = color;
    ctx.textAlign = part.align;
    ctx.fillText(part.text, part.x, part.y);
    ctx.letterSpacing = '0px';
  };

  line({ ...layout.label, text: String(layout.label.text || '').toUpperCase() }, 'ui', palette.label, '600', '4px');

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
    line(layout.reference, 'editorial', palette.reference);
  }

  ctx.strokeStyle = palette.rule;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(layout.rule.x1, layout.rule.y + 0.5);
  ctx.lineTo(layout.rule.x2, layout.rule.y + 0.5);
  ctx.stroke();

  line(layout.mark, 'ui', palette.mark, '400', '1px');
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
  const layout = layoutVerseCard({
    label,
    verse,
    reference,
    invite,
    lang,
    size,
    measure: (text, fontSize, family) => {
      ctx.font = `400 ${fontSize}px ${stacks[family]}`;
      return ctx.measureText(text).width;
    },
  });
  drawVerseCard(ctx, layout, readCardPalette(root), { seed, stacks });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || null), 'image/png');
  });
}
