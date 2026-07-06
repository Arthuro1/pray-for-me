import { useState } from 'react';
import { Repeat, CalendarDays, Sunrise, Sun, Moon, Check, ChevronDown } from 'lucide-react';
import { t } from '../i18n';
import { SLOTS, parseKey } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import {
  ADVANCED_FREQS,
  ADVANCED_END_KINDS,
  isAdvancedDraft,
  presetOf,
  scheduleFromDraft,
  scheduleSummary,
} from '../lib/scheduleDraft';

// Plain-language recurrence picker. Deliberately presets-first (no cron-style
// builder): one-time / daily / weekdays / every-N-days / monthly / yearly,
// prayer-time slots instead of clock times, and four end conditions including
// the prayer-specific "until answered".
//
// Works on a DRAFT object the parent owns (see lib/scheduleDraft.js);
// scheduleFromDraft() turns it into the persisted schedule (or null = follows
// the weekly category plan).
//
// A per-prayer "follow up / check back in" reminder is NOT a recurrence and does
// not live here — it is a separate concept (see FollowUpField / followUpStore).

const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };
const SLOT_ICONS = { morning: Sunrise, midday: Sun, evening: Moon };

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={active
        ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
        : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
    >
      {children}
    </button>
  );
}

export default function ScheduleEditor({ draft, onChange, lang }) {
  const d = draft;
  const patch = (updates) => onChange({ ...d, ...updates });
  const [advanced, setAdvanced] = useState(() => isAdvancedDraft(draft));
  // Collapsing means "I just want the simple version" — fall back to simple
  // defaults so the draft matches the visible controls (no hidden selection).
  const toggleAdvanced = () => {
    if (advanced) {
      const reset = {};
      if (ADVANCED_FREQS.includes(d.freq)) reset.freq = 'daily';
      if (ADVANCED_END_KINDS.includes(d.endKind)) reset.endKind = 'never';
      if (Object.keys(reset).length) patch(reset);
    }
    setAdvanced(!advanced);
  };
  const DAYS = t(lang, 'days');
  const label = (key) => (
    <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>{t(lang, key)}</p>
  );
  const preview = scheduleFromDraft(d);
  const active = presetOf(d);

  // Human-first presets: one-tap habits instead of "plan / once / recurring".
  // Each just sets the underlying draft; "Advanced options" stays for custom
  // recurrence rules and bounded end dates.
  const defaultWeekDays = () => (d.weekDays.length ? d.weekDays : [parseKey(todayKey()).getDay()]);
  const setPlan = () => patch({ mode: 'plan' });
  const setToday = () => patch({ mode: 'once', date: todayKey() });
  const setDaily = () => patch({ mode: 'recurring', freq: 'daily' });
  const setWeekly = () => patch({ mode: 'recurring', freq: 'weekly', weekDays: defaultWeekDays() });

  return (
    <div className="space-y-3">
      {label('scheduleHowOften')}
      <div className="flex flex-wrap gap-2" style={{ marginTop: 0 }}>
        <Chip active={active === 'plan'} onClick={setPlan}>{t(lang, 'schedFollowPlan')}</Chip>
        <Chip active={active === 'today'} onClick={setToday}><CalendarDays size={12} /> {t(lang, 'schedPrayToday')}</Chip>
        <Chip active={active === 'daily'} onClick={setDaily}><Repeat size={12} /> {t(lang, 'schedPrayDaily')}</Chip>
        <Chip active={active === 'weekly'} onClick={setWeekly}><CalendarDays size={12} /> {t(lang, 'schedPrayWeekly')}</Chip>
      </div>

      {d.mode === 'once' && (
        <input
          type="date"
          value={d.date}
          onChange={(e) => e.target.value && patch({ date: e.target.value })}
          className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none"
          style={INPUT_STYLE}
        />
      )}

      {d.mode === 'recurring' && (
        <div className="space-y-3">
          {/* Full recurrence control lives under "Advanced options"; the presets
              above already cover the everyday daily/weekly cases. */}
          {advanced && (
            <div className="flex flex-wrap gap-2">
              <Chip active={d.freq === 'daily'} onClick={() => patch({ freq: 'daily' })}>{t(lang, 'freqDaily')}</Chip>
              <Chip active={d.freq === 'weekly'} onClick={() => patch({ freq: 'weekly', weekDays: defaultWeekDays() })}>{t(lang, 'freqWeekly')}</Chip>
              <Chip active={d.freq === 'interval'} onClick={() => patch({ freq: 'interval' })}>{t(lang, 'freqInterval')}</Chip>
              <Chip active={d.freq === 'monthly'} onClick={() => patch({ freq: 'monthly' })}>{t(lang, 'freqMonthly')}</Chip>
              <Chip active={d.freq === 'yearly'} onClick={() => patch({ freq: 'yearly' })}>{t(lang, 'freqYearly')}</Chip>
            </div>
          )}

          {d.freq === 'weekly' && (
            <div className="flex gap-1">
              {DAYS.map((day, idx) => {
                const on = d.weekDays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => patch({ weekDays: on ? d.weekDays.filter((x) => x !== idx) : [...d.weekDays, idx] })}
                    className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
                    style={on ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--input-bg)', color: 'var(--text-3)' }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}

          {advanced && d.freq === 'interval' && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <span>{t(lang, 'intervalEvery')}</span>
              <input
                type="number" min="2" max="90" value={d.interval}
                onChange={(e) => patch({ interval: Math.max(2, parseInt(e.target.value, 10) || 2) })}
                className="w-16 text-sm rounded-xl px-3 py-2 text-center focus:outline-none"
                style={INPUT_STYLE}
              />
              <span>{t(lang, 'intervalDays')}</span>
            </div>
          )}

          {advanced && d.freq === 'monthly' && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <span>{t(lang, 'monthlyOnDay')}</span>
              <input
                type="number" min="1" max="31" value={d.dayOfMonth}
                onChange={(e) => patch({ dayOfMonth: Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)) })}
                className="w-16 text-sm rounded-xl px-3 py-2 text-center focus:outline-none"
                style={INPUT_STYLE}
              />
            </div>
          )}

          {advanced && d.freq === 'yearly' && (
            <input
              type="date"
              value={d.yearlyDate}
              onChange={(e) => e.target.value && patch({ yearlyDate: e.target.value })}
              className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none"
              style={INPUT_STYLE}
            />
          )}

          <button
            type="button"
            onClick={toggleAdvanced}
            aria-expanded={advanced}
            className="flex items-center gap-1.5 text-xs font-medium pt-0.5"
            style={{ color: 'var(--text-3)' }}
          >
            <ChevronDown size={13} style={{ transform: advanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            {t(lang, 'schedAdvanced')}
          </button>
        </div>
      )}

      {d.mode !== 'plan' && (
        <div>
          {label('slotLabel')}
          <div className="flex flex-wrap gap-2">
            <Chip active={!d.slot} onClick={() => patch({ slot: null })}>{t(lang, 'slotAnytime')}</Chip>
            {SLOTS.map((s) => {
              const Icon = SLOT_ICONS[s];
              return (
                <Chip key={s} active={d.slot === s} onClick={() => patch({ slot: s })}>
                  <Icon size={12} /> {t(lang, `slot_${s}`)}
                </Chip>
              );
            })}
          </div>
        </div>
      )}

      {d.mode === 'recurring' && (
        <div>
          {label('endsLabel')}
          <div className="flex flex-wrap gap-2">
            <Chip active={d.endKind === 'never'} onClick={() => patch({ endKind: 'never' })}>{t(lang, 'endNever')}</Chip>
            <Chip active={d.endKind === 'answered'} onClick={() => patch({ endKind: 'answered' })}><Check size={12} /> {t(lang, 'endWhenAnswered')}</Chip>
            {advanced && <>
              <Chip active={d.endKind === 'date'} onClick={() => patch({ endKind: 'date' })}>{t(lang, 'endOnDate')}</Chip>
              <Chip active={d.endKind === 'count'} onClick={() => patch({ endKind: 'count' })}>{t(lang, 'endAfterCount')}</Chip>
            </>}
          </div>
          {advanced && d.endKind === 'date' && (
            <input
              type="date"
              value={d.endDate}
              onChange={(e) => patch({ endDate: e.target.value })}
              className="w-full mt-2 text-sm rounded-xl px-4 py-2.5 focus:outline-none"
              style={INPUT_STYLE}
            />
          )}
          {advanced && d.endKind === 'count' && (
            <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <input
                type="number" min="1" max="365" value={d.endCount}
                onChange={(e) => patch({ endCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className="w-20 text-sm rounded-xl px-3 py-2 text-center focus:outline-none"
                style={INPUT_STYLE}
              />
              <span>{t(lang, 'endTimesSuffix')}</span>
            </div>
          )}
        </div>
      )}

      {preview && (
        <p className="text-xs flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
          <Repeat size={12} className="shrink-0" /> {scheduleSummary(preview, lang)}
        </p>
      )}
    </div>
  );
}
