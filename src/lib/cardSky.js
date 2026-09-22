// The seeded sky every shared picture stands under: a calm starfield and a small
// drawn constellation. Pure and dependency-free, so the in-app cards
// (verseCard.js, planCard.js) and the build-time link-preview images
// (scripts/build-plan-og.mjs, plain Node) draw exactly the same stars.

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
