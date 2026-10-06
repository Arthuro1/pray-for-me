// The mark of one Intercession Circle: a point for the heart and one ring for
// how far the circle reaches. The ring widens from "My heart" to "Kingdom &
// Mission" — the same seven rings, the same geometry, wherever circles appear.
// It shows breadth, never rank. Decorative: the circle's name is always beside it.
import { GLYPH_CENTER as CENTER, GLYPH_SIZE as SIZE, circleReach } from './circleGeometry';

export default function CircleGlyph({ circle, selected = false, size = SIZE, className = '' }) {
  const r = circleReach(circle);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={size}
      height={size}
      className={`circle-glyph ${selected ? 'circle-glyph--selected' : ''} ${className}`}
    >
      <circle className="circle-glyph__ring" cx={CENTER} cy={CENTER} r={r} />
      <circle className="circle-glyph__heart" cx={CENTER} cy={CENTER} r={selected ? 1.9 : 1.4} />
    </svg>
  );
}
