import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../i18n';
import { todayKey } from '../lib/prayedLog';
import { DOT_KINDS, monthDayKeys } from '../lib/monthCalendar';

// Month grid with per-day marks. `dots` maps dayKey -> { once, recurring, plan,
// group } counts (see planner.monthDots; `group` is added by the community
// commitments). Presentation-only: selection and month paging live upstream.
// The DOT_KINDS list and monthDayKeys() helper live in lib/monthCalendar.js.

const LEGEND = [['recurring', 'legendRecurring'], ['once', 'legendOnce'], ['plan', 'legendPlan'], ['group', 'legendGroup']];

export default function MonthCalendar({ monthDate, dots, selectedKey, onSelect, onMonthChange, lang }) {
  const DAYS = t(lang, 'days');
  const keys = monthDayKeys(monthDate);
  const leading = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
  const today = todayKey();
  const monthOf = (delta) => new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1);
  const label = (date) => date.toLocaleDateString(lang, { month: 'long', year: 'numeric' });

  // Each arrow is named by the month it leads to, in the reader's language.
  const arrow = (delta, Icon) => (
    <button type="button" onClick={() => onMonthChange(monthOf(delta))} aria-label={label(monthOf(delta))} className="icon-button pressable">
      <Icon className="rtl-mirror" size={18} aria-hidden="true" />
    </button>
  );

  return (
    <section className="calendar">
      <div className="calendar__head">
        {arrow(-1, ChevronLeft)}
        <h2 className="calendar__month">{label(monthDate)}</h2>
        {arrow(1, ChevronRight)}
      </div>

      <div className="calendar__weekdays" aria-hidden="true">
        {DAYS.map((d, i) => <span key={i}>{d}</span>)}
      </div>

      <div className="calendar__grid">
        {Array.from({ length: leading }).map((_, i) => <span key={`b${i}`} />)}
        {keys.map((key) => {
          const d = dots[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={key === selectedKey}
              aria-current={key === today ? 'date' : undefined}
              className="calendar__day"
            >
              <span className="calendar__num">{parseInt(key.slice(8, 10), 10)}</span>
              <span className="calendar__dots" aria-hidden="true">
                {d && DOT_KINDS.filter((k) => d[k]).map((k) => <span key={k} className={`cal-dot cal-dot--${k}`} />)}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="calendar__legend">
        {LEGEND.map(([k, labelKey]) => (
          <li key={k}><span className={`cal-dot cal-dot--${k}`} aria-hidden="true" /> {t(lang, labelKey)}</li>
        ))}
      </ul>
    </section>
  );
}
