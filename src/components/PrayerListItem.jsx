import { Search } from 'lucide-react';
import { t } from '../i18n';
import { scheduleEnded } from '../lib/planner';
import { planRowContext, planRowSummary } from '../lib/planRow';
import { todayKey } from '../lib/prayedLog';
import { scheduleSummary } from '../lib/scheduleDraft';
import { carriedSinceLabel, showsCarriedSince } from '../lib/carried';
import { circleLabelKey, circleOf } from '../lib/circles';
import { StatusLabel } from './shared/Primitives';

// One prayer in a list, read like a line in a prayer book: a serif title, one
// line of context, and a quiet meta line (circle, answered, who is carrying it).
// No card, no icon per row, no chips — the list scans by its titles.
//
// variant 'today'   — what to pray now: the plan day's theme, or who it is for.
// variant 'journal' — the record: its rhythm or how long it has been carried.
export default function PrayerListItem({ prayer, lang, tr, shares, onClick, variant = 'journal', searchMatch = null }) {
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
  const person = prayer.for_other && prayer.person_name ? t(lang, 'forPersonLabel', { name: prayer.person_name }) : '';

  let heading = title;
  let context = '';
  if (variant === 'today') {
    // A plan run leads with the DAY'S THEME, because that is what changes; the
    // plan and the day move to the line beneath, so two runs stay distinct.
    heading = planRow?.theme || title;
    context = planRow ? planRowContext(planRow) : person || prayer.origin_group_name || '';
  } else {
    const planRhythm = planRow?.dayLabel
      ? [planRow.dayLabel, planRow.paused ? t(lang, 'planPacePausedNote') : ''].filter(Boolean).join(' · ')
      : '';
    const carried = showsCarriedSince(prayer) ? t(lang, 'carriedSince', { date: carriedSinceLabel(prayer, lang) }) : '';
    context = isAnswered ? person : isEnded
      ? t(lang, 'seriesEnded')
      : planRhythm || scheduleSummary(prayer.schedule, lang) || carried || person;
  }

  const meta = [
    circle && <span key="circle">{t(lang, circleLabelKey(circle))}</span>,
    variant === 'journal' && isAnswered && (
      <StatusLabel key="answered" tone="answered">
        {t(lang, (prayer.prayer_testimonies || []).length > 0 ? 'testimony' : 'answered')}
      </StatusLabel>
    ),
    variant === 'journal' && totalPraying > 0 && <span key="carrying">{totalPraying} {t(lang, 'prayingCount')}</span>,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`journal-row prayer-row pressable ${isAnswered ? 'prayer-row--answered' : ''}`}
    >
      <span className="min-w-0">
        <span className="prayer-row__title journal-row__title">{heading}</span>
        {context && <span className="prayer-row__context">{context}</span>}
        {meta.length > 0 && <span className="prayer-row__meta">{meta}</span>}
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
