import { Check } from 'lucide-react';
import { t } from '../../i18n';
import RichText from '../rich/RichText';

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
    <section className="rounded-xl p-3 space-y-2" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
      {prayed && (
        <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--success)' }}>
          <Check size={13} aria-hidden="true" /> {t(lang, 'prayedOnDay')}
        </p>
      )}

      {updates.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'planDayNotes')}
          </h4>
          <div className="space-y-2">
            {updates.map((update) => (
              <RichText
                key={update.id}
                text={update.text}
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-2)' }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
