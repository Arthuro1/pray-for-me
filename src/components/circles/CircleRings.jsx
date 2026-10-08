import { CIRCLES, circlesWithin } from '../../lib/circles';
import { circleReach } from '../shared/circleGeometry';

// The seven Intercession Circles drawn as one widening ring model around the
// heart, with the incense rising from it. Shared by the landing page and About:
// the host's list of circle names is the accessible control, and these rings
// are a drawing of the same state, so a screen reader hears each circle once.
//
// Breadth, never rank: choosing "Nations" lights the circles it reaches across
// (My heart … Nations). Nothing is counted, completed or compared.

const LAST = CIRCLES[CIRCLES.length - 1];
const SCALE = 140 / circleReach(LAST);
const STEP = (circleReach(CIRCLES[1]) - circleReach(CIRCLES[0])) * SCALE;

function ringState(circle, active, within) {
  if (!active) return 'rest';
  if (circle === active) return 'selected';
  return within.has(circle) ? 'within' : 'outside';
}

// Each ring has a generous invisible hit band (one ring step wide) so nobody
// has to hit a hairline; the innermost is a disc. `stage` comes from
// hooks/useRingReveal; `active` is the circle previewed or chosen, if any.
export default function CircleRings({ active, stage, onPreview, onSelect, className = '' }) {
  const within = new Set(circlesWithin(active));
  const outerFirst = [...CIRCLES].reverse();
  const hit = (circle) => ({
    onPointerEnter: () => onPreview(circle),
    onPointerLeave: () => onPreview(null),
    onClick: () => onSelect(circle),
  });
  return (
    <svg
      viewBox="0 0 320 320"
      className={`circle-rings circle-rings--${stage} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {outerFirst.map((circle) => {
        const index = CIRCLES.indexOf(circle);
        return (
          <circle
            key={circle}
            cx="160"
            cy="160"
            r={circleReach(circle) * SCALE}
            pathLength="1"
            style={{ '--ring-index': index }}
            className={`circle-rings__ring circle-rings__ring--${ringState(circle, active, within)}${index === 0 ? ' circle-rings__ring--heart' : ''}`}
          />
        );
      })}
      <circle cx="160" cy="160" r="5" className="circle-rings__point" />
      <path d="M157 150C163 145 164 139 160 133C157 128 157 123 161 118" className="circle-rings__rise" />
      {outerFirst.slice(0, -1).map((circle) => (
        <circle key={circle} cx="160" cy="160" r={circleReach(circle) * SCALE} strokeWidth={STEP} className="circle-rings__hit" {...hit(circle)} />
      ))}
      <circle cx="160" cy="160" r={circleReach(CIRCLES[0]) * SCALE + STEP / 2} className="circle-rings__hit circle-rings__hit--heart" {...hit(CIRCLES[0])} />
    </svg>
  );
}
