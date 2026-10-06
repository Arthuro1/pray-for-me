import { CIRCLES } from '../../lib/circles';

// Geometry of the Intercession Circle glyph (CircleGlyph.jsx), on a 24-unit
// square: a point for the heart, and one ring per circle that widens a step at
// a time from "My heart" to "Kingdom & Mission" without touching the edge.
export const GLYPH_SIZE = 24;
export const GLYPH_CENTER = GLYPH_SIZE / 2;
const INNER = 3;
const STEP = (GLYPH_CENTER - 1.25 - INNER) / (CIRCLES.length - 1);

// The ring radius for a circle.
export const circleReach = (circle) => INNER + Math.max(0, CIRCLES.indexOf(circle)) * STEP;
