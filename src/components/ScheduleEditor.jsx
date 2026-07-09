import { useState } from 'react';
import { Repeat, CalendarDays, Sunrise, Sun, Moon, Check, ChevronDown } from 'lucide-react';
import { t } from '../i18n';
import { SLOTS, parseKey } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import {
  ADVANCED_END_KINDS,
  isAdvancedDraft,
  presetOf,
  scheduleFromDraft,
  scheduleSummary,
} from '../lib/scheduleDraft';

// Plain-language recurrence picker, in two questions: WHAT KIND of schedule
// (follow the weekly plan / pray once / pray regularly), then — only when it
// recurs — WHICH RHYTHM (daily / weekly / every-N-days / monthly / yearly).
// Prayer-time slots stand in for clock times, and four end conditions include
// the prayer-specific "until answered".
//
// The top row names the MODE, never one of its values. An earlier version
// offered "pray today" and "pray daily", which were really "once, defaulting to
// today" and "recurring, defaulting to daily" — so moving the date or picking
// monthly left the schedule with no chip highlighted at all. Naming the mode
// keeps the chip lit for every value it can hold (see presetOf).
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
  // Collapsing means "I just want the simple version" — fall back to a simple
  // end condition so the draft matches the visible controls (no hidden selection).
  const toggleAdvanced = () => {
    if (advanced && ADVANCED_END_KINDS.includes(d.endKind)) patch({ endKind: 'never' });
    setAdvanced(!advanced);
  };
  const DAYS = t(lang, 'days');
  const label = (key) => (
    <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>{t(lang, key)}</p>
  );
  const preview = scheduleFromDraft(d);
  const mode = presetOf(d);

  // Each chip sets only its mode and leaves the draft's values alone, so
  // switching away and back doesn't silently discard a chosen date or rhythm.
  const defaultWeekDays = () => (d.weekDays.length ? d.weekDays : [parseKey(todayKey()).getDay()]);
  const setPlan = () => patch({ mode: 'plan' });
  const setOnce = () => patch({ mode: 'once', date: d.date || todayKey() });
  const setRecurring = () => patch({ mode: 'recurring' });
  // Weekly is the one rhythm that needs a value seeded, or it would match no days.
  const setFreq = (freq) => patch(freq === 'weekly' ? { freq, weekDays: defaultWeekDays() } : { freq });

  return (
    <div className="space-y-3">
      {label('scheduleHowOften')}
      <div className="flex flex-wrap gap-2" style={{ marginTop: 0 }}>
        <Chip active={mode === 'plan'} onClick={setPlan}>{t(lang, 'schedFollowPlan')}</Chip>
        <Chip active={mode === 'once'} onClick={setOnce}><CalendarDays size={12} /> {t(lang, 'schedPrayOnce')}</Chip>
        <Chip active={mode === 'recurring'} onClick={setRecurring}><Repeat size={12} /> {t(lang, 'schedPrayRecurring')}</Chip>
      </div>

      {mode === 'once' && (
        <input
          type="date"
          value={d.date}
          onChange={(e) => e.target.value && patch({ date: e.target.value })}
          className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none"
          style={INPUT_STYLE}
        />
      )}

      {mode === 'recurring' && (
        <div className="space-y-3">
          {/* "Pray regularly" is the mode; this row is which rhythm. None of it
              hides behind "Advanced options" — a monthly prayer is no more
              advanced than a daily one, just less common. */}
          <div className="flex flex-wrap gap-2">
            <Chip active={d.freq === 'daily'} onClick={() => setFreq('daily')}>{t(lang, 'freqDaily')}</Chip>
            <Chip active={d.freq === 'weekly'} onClick={() => setFreq('weekly')}>{t(lang, 'freqWeekly')}</Chip>
            <Chip active={d.freq === 'interval'} onClick={() => setFreq('interval')}>{t(lang, 'freqInterval')}</Chip>
            <Chip active={d.freq === 'monthly'} onClick={() => setFreq('monthly')}>{t(lang, 'freqMonthly')}</Chip>
            <Chip active={d.freq === 'yearly'} onClick={() => setFreq('yearly')}>{t(lang, 'freqYearly')}</Chip>
          </div>

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

          {d.freq === 'interval' && (
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

          {d.freq === 'monthly' && (
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

          {d.freq === 'yearly' && (
            <input
              type="date"
              value={d.yearlyDate}
              onChange={(e) => e.target.value && patch({ yearlyDate: e.target.value })}
              className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none"
              style={INPUT_STYLE}
            />
          )}
        </div>
      )}

      {mode !== 'plan' && (
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

      {mode === 'recurring' && (
        <div>
          {label('endsLabel')}
          {/* "Advanced options" now holds exactly one thing: the two bounded end
              conditions. Everyday prayers end never or when answered. */}
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
          <button
            type="button"
            onClick={toggleAdvanced}
            aria-expanded={advanced}
            className="flex items-center gap-1.5 text-xs font-medium pt-2"
            style={{ color: 'var(--text-3)' }}
          >
            <ChevronDown size={13} style={{ transform: advanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            {t(lang, 'schedAdvanced')}
          </button>
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
