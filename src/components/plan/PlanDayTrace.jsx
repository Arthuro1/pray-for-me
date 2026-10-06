import { t } from '../../i18n';
import RichText from '../rich/RichText';
import { SectionLabel, StatusLabel } from '../shared/Primitives';

// What the reader left behind on a day of the plan they have already walked
// through: that they prayed it, and anything they wrote that day.
//
// It appears only on a PAST day. Today's notes are already the page's activity
// list a little further down, and a day still to come has nothing to show — so
// this is the one thing paging back adds that paging forward cannot.
//
// Read-only on purpose: the full rows stay editable in the activity list below,
// where the author controls, attachments and delete confirmation live. This is a
// reminder of that day, not a second place to manage it.
export default function PlanDayTrace({ lang, prayed = false, updates = [] }) {
  if (!prayed && updates.length === 0) return null;

  return (
    <section className="plan-day__aside grid gap-3">
      {prayed && <StatusLabel tone="answered">{t(lang, 'prayedOnDay')}</StatusLabel>}

      {updates.length > 0 && (
        <div>
          <SectionLabel as="h4" className="mb-2">{t(lang, 'planDayNotes')}</SectionLabel>
          <div className="grid gap-2">
            {updates.map((update) => (
              <RichText key={update.id} text={update.text} className="plan-day__text" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
