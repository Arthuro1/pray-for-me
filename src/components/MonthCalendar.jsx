import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../i18n';
import { toKey } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';

// Month grid with per-day dots. `dots` maps dayKey -> { once, recurring, plan,
// group } counts (see planner.monthDots; `group` is added by the community
// commitments). Presentation-only: selection and month paging live upstream.

export const DOT_COLORS = {
  recurring: 'var(--accent)',
  once: '#d97706',
  plan: '#94a3b8',
  group: '#0891b2',
};

export function monthDayKeys(monthDate) {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => toKey(new Date(y, m, i + 1)));
}

export default function MonthCalendar({ monthDate, dots, selectedKey, onSelect, onMonthChange, lang }) {
  const DAYS = t(lang, 'days');
  const keys = monthDayKeys(monthDate);
  const leading = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
  const today = todayKey();
  const monthLabel = monthDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' });

  const move = (delta) => onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1));

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => move(-1)} aria-label="←" className="p-1.5 rounded-lg" style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}>
          <ChevronLeft size={15} />
        </button>
        <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-1)' }}>{monthLabel}</p>
        <button onClick={() => move(1)} aria-label="→" className="p-1.5 rounded-lg" style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}>
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d, i) => (
          <p key={i} className="text-center text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>{d}</p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leading }).map((_, i) => <div key={`b${i}`} />)}
        {keys.map((key) => {
          const d = dots[key];
          const isToday = key === today;
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="flex flex-col items-center rounded-lg py-1 transition-colors"
              style={{
                background: isSelected ? 'var(--accent-soft)' : 'transparent',
                border: isSelected ? '1px solid var(--accent-border)' : isToday ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              <span className="text-xs" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-2)', fontWeight: isToday || isSelected ? 700 : 400 }}>
                {parseInt(key.slice(8, 10), 10)}
              </span>
              <span className="flex gap-0.5 mt-0.5" style={{ height: 4 }}>
                {d && ['recurring', 'once', 'plan', 'group'].filter((k) => d[k]).slice(0, 4).map((k) => (
                  <span key={k} className="rounded-full" style={{ width: 4, height: 4, background: DOT_COLORS[k] }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-2" style={{ borderTop: '0.5px solid var(--border)' }}>
        {[['recurring', 'legendRecurring'], ['once', 'legendOnce'], ['plan', 'legendPlan'], ['group', 'legendGroup']].map(([k, labelKey]) => (
          <span key={k} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-3)' }}>
            <span className="rounded-full" style={{ width: 5, height: 5, background: DOT_COLORS[k] }} /> {t(lang, labelKey)}
          </span>
        ))}
      </div>
    </div>
  );
}
