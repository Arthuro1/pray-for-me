// The Qetoret Rise Mark: the incense stroke from the logo, on its own. It is
// decoration only — always aria-hidden, always beside text that says what
// happened ("Amen", "Prayed today"), so nothing depends on seeing it. One per
// screen at most.
// motion: 'rise' (once), 'breathe' (slow repeat, Remain with God) or 'still'.
// Reduced-motion readers always get the line at rest (components.css).
import { RISE } from '../../brand/marks';

const [, , W, H] = RISE.viewBox.split(' ').map(Number);

export default function RiseMark({ motion = 'rise', size = 36, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-testid="rise-mark"
      viewBox={RISE.viewBox}
      width={Math.round(size * (W / H) * 10) / 10}
      height={size}
      className={`rise-mark ${motion === 'still' ? '' : `rise-mark--${motion}`} ${className}`}
    >
      <path d={RISE.d} fill="currentColor" />
    </svg>
  );
}
