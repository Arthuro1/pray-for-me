// The one figure a shared picture carries: the Rise Mark — the incense stroke
// from the logo, on its own — fitted into the space a card leaves empty. No
// stars, no sky: deep violet, alabaster type, one gold line rising. Pure and
// dependency-free, so the in-app cards (verseCard.js, planCard.js) and the
// build-time link previews (scripts/build-plan-og.mjs, plain Node) draw the
// same line from the same master geometry.
import { RISE } from '../brand/marks.js';

const [VIEW_X, VIEW_Y, VIEW_W, VIEW_H] = RISE.viewBox.split(' ').map(Number);

export const RISE_PATH = RISE.d;

// Where the mark sits in `box`: as tall as the box allows (never taller than
// `maxHeight`), centred across it and resting on its bottom edge. Returns the
// transform that maps the mark's own coordinates into the card — draw RISE_PATH
// after translate(x, y) and scale(scale) — plus the box it ends up occupying.
export function riseFigure({ box, maxHeight = Infinity }) {
  const height = Math.min(box.height, maxHeight);
  const scale = height / VIEW_H;
  const width = VIEW_W * scale;
  const left = box.x + (box.width - width) / 2;
  const top = box.y + box.height - height;
  return {
    scale,
    x: left - VIEW_X * scale,
    y: top - VIEW_Y * scale,
    bounds: { x: left, y: top, width, height },
  };
}
