import { initialsFrom } from '../../lib/avatar';
import { circleOf } from '../../lib/circles';
import PlanEmblem from '../plan/PlanEmblem';
import { CIRCLE_ICONS } from './circleIcons';

// The leading mark of a prayer row — where the prayer is carried, in one small
// tile, so a list scans by more than its titles:
//
//   a guided plan — its plan's emblem, outlined in gold as on the Plans tab;
//   otherwise     — its circle's icon in its circle's tone, so moving a prayer
//                   to another circle changes its mark; or the incense mark
//                   while it has no circle yet (nothing ever guesses one on the
//                   person's behalf).
//
// Who a prayer is for, or the group it came from, is said in the row's own
// detail line. Decorative: the row's words say everything the tile shows.
const ICON = { size: 20, strokeWidth: 1.8, 'aria-hidden': true };

// A person's initials in a round, neutral tile — the Journal's People view,
// where one person may be carried in several circles.
export function PersonMark({ name }) {
  return (
    <span className="icon-tile icon-tile--round prayer-mark prayer-mark--unplaced" aria-hidden="true">
      {initialsFrom(name)}
    </span>
  );
}

export default function PrayerMark({ prayer, planCategory = null }) {
  if (planCategory) {
    return (
      <span className="icon-tile prayer-mark prayer-mark--plan" aria-hidden="true">
        <PlanEmblem category={planCategory} size={22} className="plan-emblem--bare" />
      </span>
    );
  }

  // No circle yet: the thin line of incense rising from the altar (the same
  // drawing as the "seeking" plans), not the Rise Mark, which stays one a screen.
  const circle = circleOf(prayer);
  const CircleIcon = circle ? CIRCLE_ICONS[circle] : null;
  return (
    <span className={`icon-tile prayer-mark ${circle ? `tone-${circle}` : 'prayer-mark--unplaced'}`} aria-hidden="true">
      {CircleIcon ? <CircleIcon {...ICON} /> : <PlanEmblem category="seeking" size={22} className="plan-emblem--bare" />}
    </span>
  );
}
