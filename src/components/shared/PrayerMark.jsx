import { Users } from 'lucide-react';
import { initialsFrom } from '../../lib/avatar';
import { circleOf } from '../../lib/circles';
import PlanEmblem from '../plan/PlanEmblem';
import { CIRCLE_ICONS } from './circleIcons';

// The leading mark of a prayer row — what the prayer is about, in one small
// tile, so a list scans by more than its titles:
//
//   a guided plan — its plan's emblem, outlined in gold as on the Plans tab;
//   a person      — their initials, round, the way people are drawn everywhere;
//   a group       — the group mark, round;
//   otherwise     — its circle's icon, or the incense mark while it has no
//                   circle yet (nothing ever guesses one on the person's behalf).
//
// A placed prayer's tile takes its circle's tone, whichever mark it carries.
// Decorative: the row's own words say everything the tile shows.
const ICON = { size: 18, strokeWidth: 1.8, 'aria-hidden': true };

const toneOf = (circle) => (circle ? `tone-${circle}` : 'prayer-mark--unplaced');

// A person's initials in a round tile — also the People view's mark, where one
// person may be carried in several circles and the tile stays neutral.
export function PersonMark({ name, circle = null }) {
  return (
    <span className={`icon-tile icon-tile--round prayer-mark ${toneOf(circle)}`} aria-hidden="true">
      {initialsFrom(name)}
    </span>
  );
}

export default function PrayerMark({ prayer, planCategory = null }) {
  if (planCategory) {
    return (
      <span className="icon-tile prayer-mark prayer-mark--plan" aria-hidden="true">
        <PlanEmblem category={planCategory} size={20} className="plan-emblem--bare" />
      </span>
    );
  }

  const circle = circleOf(prayer);
  if (prayer.for_other && prayer.person_name) return <PersonMark name={prayer.person_name} circle={circle} />;
  if (prayer.origin_group_name) {
    return <span className={`icon-tile icon-tile--round prayer-mark ${toneOf(circle)}`} aria-hidden="true"><Users {...ICON} /></span>;
  }

  // No circle yet: the thin line of incense rising from the altar (the same
  // drawing as the "seeking" plans), not the Rise Mark, which stays one a screen.
  const CircleIcon = circle ? CIRCLE_ICONS[circle] : null;
  return (
    <span className={`icon-tile prayer-mark ${toneOf(circle)}`} aria-hidden="true">
      {CircleIcon ? <CircleIcon {...ICON} /> : <PlanEmblem category="seeking" size={20} className="plan-emblem--bare" />}
    </span>
  );
}
