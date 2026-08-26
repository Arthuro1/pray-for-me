// Category (label) colours, tuned to read on BOTH constellation grounds — the
// lavender-white day theme and the deep-indigo night theme. The old palette held
// fully-saturated web colours (#dc2626, and a near-black #2d1b5e that vanished on
// dark). These are mid-tone hues: light enough to carry white text as a solid
// pill, dark enough to read as a tint or as coloured text on either background.
//
// A label stores one of these hex values. Legacy rows keep whatever hex they were
// saved with; resolveCategoryColor() snaps any stored colour to the nearest hue
// here, so old data renders in the new, theme-safe palette without a DB migration.

export const CATEGORY_COLORS = [
  '#7b61d6', // violet   (brand-adjacent)
  '#6366c9', // indigo
  '#3f86c9', // sky
  '#2f9e94', // teal     (the app's colour of peace)
  '#4f9d5b', // green
  '#b07f30', // amber
  '#cf7355', // coral
  '#cf6a8e', // rose
  '#a765c2', // orchid
];

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0];

function hexToRgb(hex) {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Snap an arbitrary stored colour to the nearest curated hue (squared RGB
// distance is enough for a 9-swatch palette). Values already in the palette are
// returned unchanged; unparseable input falls back to the default.
export function resolveCategoryColor(stored) {
  if (!stored) return DEFAULT_CATEGORY_COLOR;
  const lower = stored.toLowerCase();
  if (CATEGORY_COLORS.includes(lower)) return lower;
  const rgb = hexToRgb(lower);
  if (!rgb) return DEFAULT_CATEGORY_COLOR;
  let best = DEFAULT_CATEGORY_COLOR;
  let bestDist = Infinity;
  for (const c of CATEGORY_COLORS) {
    const [r, g, b] = hexToRgb(c);
    const d = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

// A soft, theme-adaptive tile background: the hue mixed toward the surface it
// sits on, so an emoji chip reads on cream and on indigo alike (unlike a fixed
// low-alpha overlay, which muddies on dark). Pass `surface` when the tile sits
// on something other than the page ground — a card's own fill, say — otherwise
// the mix is computed against a background that isn't actually behind it.
export function categoryTint(color, amount = 20, surface = 'var(--surface)') {
  return `color-mix(in srgb, ${color} ${amount}%, ${surface})`;
}
