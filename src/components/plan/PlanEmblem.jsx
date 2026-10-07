import { DEFAULT_PLAN_CATEGORY } from '../../content/prayerPlans';

// The quiet mark of a plan's KIND — one thin line drawing per category, in the
// same hand as the circle glyphs: no picture, no colour block, no emoji. It
// helps the eye tell the catalogue's journeys apart; the words still carry the
// meaning, so the mark is decorative (aria-hidden).
//
//   seeking       — incense rising from the altar
//   formation     — a shoot growing
//   others        — prayer reaching outward
//   relationships — two lives joined
//   freedom       — a bond broken open
//   bible-study   — the open Book
const MARKS = {
  seeking: (
    <>
      <path d="M12 18c0-2.6 2.6-3.6 2.6-6.3S12 8.3 12 5.6" />
      <path d="M9.4 13.4c-.9-1.1-.9-2.4 0-3.6" />
      <path d="M7.5 20.5h9" />
    </>
  ),
  formation: (
    <>
      <path d="M12 20.5v-9" />
      <path d="M12 14.5c-3.2 0-5.2-2-5.2-5.2 3.2 0 5.2 2 5.2 5.2Z" />
      <path d="M12 11.5c0-3.2 2-5.2 5.2-5.2 0 3.2-2 5.2-5.2 5.2Z" />
    </>
  ),
  others: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6" />
      <path d="M5.1 5.1a9.8 9.8 0 0 0 0 13.8M18.9 5.1a9.8 9.8 0 0 1 0 13.8" />
    </>
  ),
  relationships: (
    <>
      <circle cx="9.3" cy="12" r="5" />
      <circle cx="14.7" cy="12" r="5" />
    </>
  ),
  freedom: (
    <>
      <path d="M10 8.5H8a3.5 3.5 0 0 0 0 7h2" />
      <path d="M14 8.5h2a3.5 3.5 0 0 1 0 7h-2" />
      <path d="M12 4.5v1.8M12 17.7v1.8" />
    </>
  ),
  'bible-study': (
    <>
      <path d="M12 6.5C10 5 7 4.6 4 5.1v13.4c3-.5 6-.1 8 1.4 2-1.5 5-1.9 8-1.4V5.1c-3-.5-6-.1-8 1.4Z" />
      <path d="M12 6.5v13.4" />
    </>
  ),
};

export default function PlanEmblem({ category, className = '' }) {
  const mark = MARKS[category] || MARKS[DEFAULT_PLAN_CATEGORY];
  return (
    <span className={`plan-emblem ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        {mark}
      </svg>
    </span>
  );
}
