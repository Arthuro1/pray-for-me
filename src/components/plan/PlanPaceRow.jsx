import { t } from '../../i18n';
import RadioRow from '../shared/RadioRow';
import { PACE_LABEL_KEYS, PLAN_PAUSED, paceOf, repacePlan, upcomingPlanDay } from '../../lib/planTempo';
import { nextReturnLabel } from '../../lib/scheduleDraft';
import { todayKey } from '../../lib/prayedLog';

// How often a running plan comes back, asked on the plan's own card.
//
// Pace belongs WITH the day it paces: a reader who finds a daily plan too fast
// is looking at the day, not hunting through the ⋯ menu for a recurrence
// editor. The three answers are the ones nearly everyone wants, plus pausing;
// anything rarer (monthly, every N days, a preferred time) is still the full
// scheduler's job, and re-anchors through the very same helper.
//
// The one promise this control makes — and the reason it can be answered
// instantly, with no save button — is that changing the pace never changes
// WHICH day you are on. It is stated on the row, not just implemented.

const PACE_ROWS = [
  { value: 'daily' },
  { value: 'someDays' },
  { value: 'alternate' },
  { value: PLAN_PAUSED, subKey: 'planPacePauseSub' },
];

export default function PlanPaceRow({ schedule, lang, planCount = null, onChange, idPrefix = 'plan-pace' }) {
  const pace = paceOf(schedule);
  // A finished run has no next day to protect, so there is nothing to re-pace.
  const upcoming = upcomingPlanDay(schedule, todayKey());
  if (!pace || !upcoming) return null;

  const id = (suffix) => `${idPrefix}-${suffix}`;
  const DAYS = t(lang, 'days');
  const weekDays = schedule.freq === 'weekly' ? (schedule.weekDays || []) : [];

  const apply = (nextPace, days = null) => {
    const next = repacePlan(schedule, nextPace, { total: planCount || 0, weekDays: days });
    if (next) onChange(next);
  };

  // The last remaining day can't be turned off — a week with no days in it is
  // not a rhythm, and silently keeping the old one would be a lie.
  const toggleWeekDay = (idx) => {
    const on = weekDays.includes(idx);
    if (on && weekDays.length === 1) return;
    apply('someDays', on ? weekDays.filter((x) => x !== idx) : [...weekDays, idx]);
  };

  const returns = schedule.type === 'recurring'
    ? nextReturnLabel(schedule, lang, { fromKey: todayKey() })
    : null;

  return (
    <fieldset className="space-y-2">
      {/* The disclosure row that reveals this control already carries the
          visible heading; the legend is what names the group to a screen
          reader. */}
      <legend className="sr-only">{t(lang, 'planPaceTitle')}</legend>

      {PACE_ROWS.map((row) => (
        <div key={row.value} className="space-y-2">
          <RadioRow
            id={id(row.value)}
            name={id('choice')}
            checked={pace === row.value}
            onChange={() => apply(row.value)}
            label={t(lang, PACE_LABEL_KEYS[row.value])}
            sub={row.subKey ? t(lang, row.subKey) : undefined}
          />
          {row.value === 'someDays' && pace === 'someDays' && (
            <div className="flex flex-wrap gap-1.5 ps-3" role="group" aria-label={t(lang, 'schedWeekdaysLabel')}>
              {DAYS.map((day, idx) => {
                const on = weekDays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekDay(idx)}
                    aria-pressed={on}
                    className="relative flex-none min-w-[44px] min-h-[44px] px-2 text-xs rounded-xl font-medium transition-colors"
                    style={on
                      ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                      : { background: 'var(--surface)', color: 'var(--text-3)', border: '0.5px solid var(--input-border)' }}
                  >
                    {day}
                    {on && <span aria-hidden="true" className="absolute bottom-1 start-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* A rhythm only the full scheduler can express stays visible and stays
          selected, so opening this row never makes it look like the plan is
          running daily when it is not. */}
      {pace === 'custom' && (
        <RadioRow id={id('custom')} name={id('choice')} checked disabled onChange={() => {}} label={t(lang, PACE_LABEL_KEYS.custom)} />
      )}

      <p aria-live="polite" className="text-xs px-1" style={{ color: 'var(--text-3)' }}>
        {t(lang, 'planPaceKeepsPlace', { n: upcoming })}
        {returns ? ` ${t(lang, 'planPaceNext', { when: returns })}` : ''}
      </p>
    </fieldset>
  );
}
