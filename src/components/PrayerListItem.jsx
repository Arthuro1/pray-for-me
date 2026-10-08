import { Search, User, Users } from 'lucide-react';
import { t } from '../i18n';
import { scheduleEnded } from '../lib/planner';
import { planRowProgress, planRowSummary } from '../lib/planRow';
import { todayKey } from '../lib/prayedLog';
import { scheduleSummary } from '../lib/scheduleDraft';
import { carriedSinceLabel, showsCarriedSince } from '../lib/carried';
import { circleLabelKey, circleOf } from '../lib/circles';
import PrayerMark from './shared/PrayerMark';
import { StatusLabel } from './shared/Primitives';

// One prayer in a list, on a soft card of its own: a leading mark (its circle
// or plan — see PrayerMark), a serif title and ONE quiet detail line beneath
// it. A small icon says what each detail is, so "Prayer Buddies" (a group) and
// "Pour Anatole" (a person) can never be confused. No chips.
//
// variant 'today'   — what to pray now: the plan day's theme, or who it is for.
// variant 'journal' — the record: its rhythm or how long it has been carried.
// The circle shows as the mark's tone and icon; its name is spoken to screen
// readers only, and not at all where the circle is already the heading the
// row sits under (`showCircle={false}`, the Journal's By circle view).
const ICON = { size: 13, strokeWidth: 1.9, 'aria-hidden': true };

export default function PrayerListItem({ prayer, lang, tr, shares, onClick, variant = 'journal', searchMatch = null, showCircle = true }) {
  const isAnswered = prayer.status === 'answered';
  // A finished series reads "Series ended", never "Active" — the plan is over
  // even though the prayer stays in the journal.
  const isEnded = !isAnswered && scheduleEnded(prayer, todayKey());
  const totalPraying = (shares || []).reduce((n, s) => n + (s.prayingCount || 0), 0);
  // A guided plan run is a prayer like any other underneath, but it is not read
  // like one: it is named by the plan (in the reader's language, not the one
  // the run was started in) and placed by its day, not by a recurrence rule.
  const planRow = planRowSummary(prayer, lang);
  const title = planRow?.name || tr(prayer.title, lang);
  const circle = circleOf(prayer);
  const person = prayer.for_other && prayer.person_name
    ? { key: 'person', icon: <User {...ICON} />, text: t(lang, 'forPersonLabel', { name: prayer.person_name }) }
    : null;
  const group = prayer.origin_group_name
    ? { key: 'group', icon: <Users {...ICON} />, text: prayer.origin_group_name }
    : null;
  const lead = (key, text) => (text ? { key, text, lead: true } : null);

  let heading = title;
  let context = [];
  if (variant === 'today') {
    // A plan run leads with the DAY'S THEME, because that is what changes; the
    // day, then the plan, move to the line beneath — the day first, so it stays
    // readable when a long plan name is cut short.
    heading = planRow?.theme || title;
    context = planRow
      ? [lead('day', planRow.dayLabel), planRow.theme && { key: 'plan', text: planRow.name, truncate: true }]
      : [person || group];
  } else {
    const planRhythm = planRow?.dayLabel
      ? [planRow.dayLabel, planRow.paused ? t(lang, 'planPacePausedNote') : ''].filter(Boolean).join(' · ')
      : '';
    const carried = showsCarriedSince(prayer) ? t(lang, 'carriedSince', { date: carriedSinceLabel(prayer, lang) }) : '';
    // Who it is for (or the group it came from) first — the mark shows only
    // the circle — then where it stands: its rhythm, or that its series ended.
    context = [
      person || group,
      !isAnswered && (isEnded
        ? lead('ended', t(lang, 'seriesEnded'))
        : lead('rhythm', planRhythm || scheduleSummary(prayer.schedule, lang) || carried)),
    ];
  }

  const details = [
    ...context,
    variant === 'journal' && isAnswered && {
      key: 'answered',
      node: (
        <StatusLabel tone="answered">
          {t(lang, (prayer.prayer_testimonies || []).length > 0 ? 'testimony' : 'answered')}
        </StatusLabel>
      ),
    },
    variant === 'journal' && totalPraying > 0 && { key: 'carrying', text: `${totalPraying} ${t(lang, 'prayingCount')}` },
  ].filter(Boolean);
  const progress = isEnded ? null : planRowProgress(planRow);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`journal-row prayer-row prayer-row--marked q-card pressable ${isAnswered ? 'prayer-row--answered' : ''}`}
    >
      <PrayerMark prayer={prayer} planCategory={planRow?.category} />
      <span className="min-w-0">
        <span className="prayer-row__title journal-row__title">{heading}</span>
        {showCircle && circle && <span className="sr-only">{t(lang, circleLabelKey(circle))}</span>}
        {details.length > 0 && (
          <span className="prayer-row__details">
            {details.map((d) => d.node ? <span key={d.key}>{d.node}</span> : (
              <span
                key={d.key}
                className={`prayer-row__detail ${d.lead ? 'prayer-row__detail--lead' : ''} ${d.truncate ? 'prayer-row__detail--truncate' : ''}`}
              >
                {d.icon}
                {d.text}
              </span>
            ))}
          </span>
        )}
        {progress !== null && (
          <span className="prayer-row__track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </span>
        )}
        {searchMatch?.text && !['title', 'person'].includes(searchMatch.field) && (
          <span className="prayer-row__match">
            <Search size={12} aria-hidden="true" />
            <span>{tr(searchMatch.text, lang)}</span>
          </span>
        )}
      </span>
    </button>
  );
}
