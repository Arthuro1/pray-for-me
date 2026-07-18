import { useRef, useState } from 'react';
import { t } from '../i18n';
import { SLOTS } from '../lib/schedule';
import DisclosureRow from './shared/DisclosureRow';
import {
  ADVANCED_CHOICES,
  RECURRENCE_CHOICES,
  draftForEnd,
  draftForMode,
  draftForRecurrenceChoice,
  modeOf,
  planSummary,
  recurrenceChoiceOf,
  scheduleFromDraft,
  scheduleSentence,
} from '../lib/scheduleDraft';

// Scheduling, asked the way a person would ask it: ONE question — "when would
// you like this prayer to appear?" — with three answers.
//
//   Use my normal prayer rhythm   → no schedule at all (the weekly plan), shown
//                                   as the days it ACTUALLY produces
//   Pray once                     → a single date, revealed only when chosen
//   Choose another rhythm         → a rhythm, asked as a second question
//
// The second question offers only the three rhythms nearly everyone wants
// (every day / once a week / choose days). Every-N-days, monthly and yearly are
// no less valid — just far rarer — so they wait behind "More scheduling
// options" rather than being deleted. Preferred time and the ending rule fold
// away the same way, each still showing its current value on its own row.
//
// Nothing here is a second scheduling model: every control is a plain mapping
// onto the DRAFT the parent owns (see lib/scheduleDraft.js), scheduleFromDraft()
// turns that into the unchanged persisted schedule, and the confirmation
// sentence at the bottom is rendered from that very schedule — so what a user
// reads and what gets stored cannot drift apart.
//
// A per-prayer "follow up / check back in" reminder is NOT a recurrence and does
// not live here — it is a separate concept (see FollowUpField / followUpStore).

const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };
const FIELD_CLASS = 'w-full text-sm rounded-xl px-4 py-2.5 min-h-[44px] focus:outline-none';
const NUMBER_CLASS = 'w-20 text-sm rounded-xl px-3 py-2 min-h-[44px] text-center focus:outline-none';

const MODE_ROWS = [
  { value: 'plan', labelKey: 'schedUsePlan' },
  { value: 'once', labelKey: 'schedPrayOnce', subKey: 'schedOnceSub' },
  { value: 'recurring', labelKey: 'schedOtherRhythm', subKey: 'schedOtherRhythmSub' },
];

const RHYTHM_LABELS = {
  daily: 'schedEveryDay',
  weekly: 'schedOnceAWeek',
  days: 'schedChooseDays',
  interval: 'freqInterval',
  monthly: 'freqMonthly',
  yearly: 'freqYearly',
};

const END_KINDS = ['answered', 'date', 'count', 'never'];
const END_LABELS = { answered: 'endMarkAnswered', date: 'endOnDate', count: 'endAfterCount', never: 'endNoAutoEnd' };

// A real radio: the native input carries focus, arrow keys, Space and the
// group semantics; the ring beside it only mirrors state, and states it with a
// filled dot as well as colour so it doesn't rely on hue alone.
function RadioRow({ id, name, checked, onChange, label, sub }) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 w-full min-h-[44px] rounded-xl px-3 py-2.5 cursor-pointer"
      style={checked
        ? { background: 'var(--accent-soft)', border: '1.5px solid var(--accent)' }
        : { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}
    >
      <span className="relative w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center">
        <input
          id={id}
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <span
          aria-hidden="true"
          className="w-5 h-5 rounded-full flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
          style={{ background: 'var(--surface)', border: checked ? '1.5px solid var(--accent)' : '0.5px solid var(--input-border)' }}
        >
          {checked && <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium break-words" style={{ color: 'var(--text-1)' }}>{label}</span>
        {sub && <span className="block text-xs mt-0.5 break-words" style={{ color: 'var(--text-3)' }}>{sub}</span>}
      </span>
    </label>
  );
}

export default function ScheduleEditor({ draft, onChange, lang, planDays, idPrefix = 'sched' }) {
  const d = draft;
  const patch = (updates) => onChange({ ...d, ...updates });
  const mode = modeOf(d);
  const rhythm = recurrenceChoiceOf(d);
  const preview = scheduleFromDraft(d);

  // Only the uncommon rhythms open on their own — and only because the draft
  // already uses one, so reopening a monthly prayer never hides its own answer.
  const [moreOpen, setMoreOpen] = useState(() => ADVANCED_CHOICES.includes(recurrenceChoiceOf(d)));
  const [timeOpen, setTimeOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const id = (suffix) => `${idPrefix}-${suffix}`;
  const DAYS = t(lang, 'days');

  // Inside the new-prayer form this editor lives in a <form>: Enter in one of
  // its fields would submit the prayer instead of answering the question.
  // Radios are already selected by the time Enter arrives (arrow keys select),
  // so swallowing it costs nothing and rescues the accidental save.
  const blockImplicitSubmit = (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault();
  };

  const toggleWeekDay = (idx) => patch({
    weekDays: d.weekDays.includes(idx) ? d.weekDays.filter((x) => x !== idx) : [...d.weekDays, idx],
  });

  // Picking a time collapses the list back to its summary — but only when it
  // was picked with a pointer. Arrow keys MOVE the selection as they travel
  // through a radio group, so folding the group away on every change would
  // strand a keyboard user after one keystroke.
  const pointerPick = useRef(false);
  const pickSlot = (slot) => {
    patch({ slot });
    if (pointerPick.current) setTimeOpen(false);
    pointerPick.current = false;
  };

  const slotLabel = d.slot ? t(lang, `slot_${d.slot}`) : t(lang, 'slotAnytime');
  const planText = planSummary(planDays, lang);

  return (
    <div className="space-y-3" onKeyDown={blockImplicitSubmit}>
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'schedWhenAppear')}
        </legend>
        {MODE_ROWS.map((row) => (
          <div key={row.value} className="space-y-2">
            <RadioRow
              id={id(`mode-${row.value}`)}
              name={id('mode')}
              checked={mode === row.value}
              onChange={() => onChange(draftForMode(row.value, d))}
              label={t(lang, row.labelKey)}
              sub={row.value === 'plan' ? planText : t(lang, row.subKey)}
            />

            {row.value === 'once' && mode === 'once' && (
              <div className="ps-3">
                <label htmlFor={id('date')} className="sr-only">{t(lang, 'schedDateLabel')}</label>
                <input
                  id={id('date')}
                  type="date"
                  value={d.date}
                  onChange={(e) => e.target.value && patch({ date: e.target.value })}
                  className={FIELD_CLASS}
                  style={INPUT_STYLE}
                />
              </div>
            )}

            {row.value === 'recurring' && mode === 'recurring' && (
              <div className="ps-3 space-y-2">
                {/* One radio group across both the common rhythms and the ones
                    behind the disclosure — they are the same single choice. */}
                <fieldset className="space-y-2">
                  <legend className="sr-only">{t(lang, 'schedOtherRhythm')}</legend>
                  {RECURRENCE_CHOICES.map((choice) => (
                    <div key={choice} className="space-y-2">
                      <RadioRow
                        id={id(`freq-${choice}`)}
                        name={id('freq')}
                        checked={rhythm === choice}
                        onChange={() => onChange(draftForRecurrenceChoice(choice, d))}
                        label={t(lang, RHYTHM_LABELS[choice])}
                      />
                      {choice === 'days' && rhythm === 'days' && (
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t(lang, 'schedWeekdaysLabel')}>
                          {DAYS.map((day, idx) => {
                            const on = d.weekDays.includes(idx);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleWeekDay(idx)}
                                aria-pressed={on}
                                // Fixed target, wrapping rather than shrinking:
                                // a long localized abbreviation widens the day
                                // instead of pushing the row off-screen.
                                className="relative flex-none min-w-[44px] min-h-[44px] px-2 text-xs rounded-xl font-medium transition-colors"
                                style={on
                                  ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                                  : { background: 'var(--surface)', color: 'var(--text-3)', border: '0.5px solid var(--input-border)' }}
                              >
                                {day}
                                {/* Selection also reads without colour: a dot
                                    and a heavier border, not hue alone. */}
                                {on && <span aria-hidden="true" className="absolute bottom-1 start-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  <DisclosureRow
                    label={t(lang, 'schedMoreOptions')}
                    open={moreOpen}
                    onToggle={() => setMoreOpen((v) => !v)}
                    controlsId={id('more')}
                  />
                  {moreOpen && (
                    <div id={id('more')} className="space-y-2">
                      {ADVANCED_CHOICES.map((choice) => (
                        <div key={choice} className="space-y-2">
                          <RadioRow
                            id={id(`freq-${choice}`)}
                            name={id('freq')}
                            checked={rhythm === choice}
                            onChange={() => onChange(draftForRecurrenceChoice(choice, d))}
                            label={t(lang, RHYTHM_LABELS[choice])}
                          />
                          {choice === 'interval' && rhythm === 'interval' && (
                            <div className="flex items-center gap-2 ps-3 text-sm" style={{ color: 'var(--text-2)' }}>
                              <label htmlFor={id('interval')}>{t(lang, 'intervalEvery')}</label>
                              <input
                                id={id('interval')} type="number" min="2" max="90" value={d.interval}
                                onChange={(e) => patch({ interval: Math.max(2, parseInt(e.target.value, 10) || 2) })}
                                className={NUMBER_CLASS} style={INPUT_STYLE}
                              />
                              <span>{t(lang, 'intervalDays')}</span>
                            </div>
                          )}
                          {choice === 'monthly' && rhythm === 'monthly' && (
                            <div className="flex items-center gap-2 ps-3 text-sm" style={{ color: 'var(--text-2)' }}>
                              <label htmlFor={id('dayOfMonth')}>{t(lang, 'monthlyOnDay')}</label>
                              <input
                                id={id('dayOfMonth')} type="number" min="1" max="31" value={d.dayOfMonth}
                                onChange={(e) => patch({ dayOfMonth: Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)) })}
                                className={NUMBER_CLASS} style={INPUT_STYLE}
                              />
                            </div>
                          )}
                          {choice === 'yearly' && rhythm === 'yearly' && (
                            <div className="ps-3">
                              <label htmlFor={id('yearlyDate')} className="sr-only">{t(lang, 'schedDateLabel')}</label>
                              <input
                                id={id('yearlyDate')} type="date" value={d.yearlyDate}
                                onChange={(e) => e.target.value && patch({ yearlyDate: e.target.value })}
                                className={FIELD_CLASS} style={INPUT_STYLE}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </fieldset>
              </div>
            )}
          </div>
        ))}
      </fieldset>

      {/* Preferred time is a soft slot, not a clock — and most prayers keep
          "Anytime", so the four choices stay behind their own summary row. */}
      {mode !== 'plan' && (
        <div className="space-y-2">
          <DisclosureRow
            label={t(lang, 'schedPreferredTime')}
            value={slotLabel}
            action={t(lang, 'schedChange')}
            open={timeOpen}
            onToggle={() => setTimeOpen((v) => !v)}
            controlsId={id('time')}
          />
          {timeOpen && (
            <fieldset
              id={id('time')}
              className="space-y-2"
              onPointerDown={() => { pointerPick.current = true; }}
              onKeyDown={() => { pointerPick.current = false; }}
            >
              <legend className="sr-only">{t(lang, 'schedPreferredTime')}</legend>
              <RadioRow
                id={id('slot-any')} name={id('slot')} checked={!d.slot}
                onChange={() => pickSlot(null)}
                label={t(lang, 'slotAnytime')}
              />
              {SLOTS.map((s) => (
                <RadioRow
                  key={s} id={id(`slot-${s}`)} name={id('slot')} checked={d.slot === s}
                  onChange={() => pickSlot(s)}
                  label={t(lang, `slot_${s}`)}
                />
              ))}
            </fieldset>
          )}
        </div>
      )}

      {/* When the rhythm stops. Folded away, but its current answer is on the
          row, so an existing schedule never hides how it ends. */}
      {mode === 'recurring' && (
        <div className="space-y-2">
          <DisclosureRow
            label={t(lang, 'schedStopQuestion')}
            value={t(lang, END_LABELS[d.endKind] || 'endNoAutoEnd')}
            open={endOpen}
            onToggle={() => setEndOpen((v) => !v)}
            controlsId={id('end')}
          />
          {endOpen && (
            <fieldset id={id('end')} className="space-y-2">
              <legend className="sr-only">{t(lang, 'schedStopQuestion')}</legend>
              {END_KINDS.map((kind) => (
                <div key={kind} className="space-y-2">
                  <RadioRow
                    id={id(`end-${kind}`)}
                    name={id('end-kind')}
                    checked={d.endKind === kind}
                    onChange={() => onChange(draftForEnd(kind, d))}
                    label={t(lang, END_LABELS[kind])}
                  />
                  {kind === 'date' && d.endKind === 'date' && (
                    <div className="ps-3">
                      <label htmlFor={id('endDate')} className="sr-only">{t(lang, 'schedEndDateLabel')}</label>
                      <input
                        id={id('endDate')} type="date" value={d.endDate}
                        onChange={(e) => patch({ endDate: e.target.value })}
                        className={FIELD_CLASS} style={INPUT_STYLE}
                      />
                    </div>
                  )}
                  {kind === 'count' && d.endKind === 'count' && (
                    <div className="flex items-center gap-2 ps-3 text-sm" style={{ color: 'var(--text-2)' }}>
                      <label htmlFor={id('endCount')} className="sr-only">{t(lang, 'schedEndCountLabel')}</label>
                      <input
                        id={id('endCount')} type="number" min="1" max="365" value={d.endCount}
                        onChange={(e) => patch({ endCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className={NUMBER_CLASS} style={INPUT_STYLE}
                      />
                      <span>{t(lang, 'endTimesSuffix')}</span>
                    </div>
                  )}
                </div>
              ))}
            </fieldset>
          )}
        </div>
      )}

      {/* The whole answer in one sentence, read off the schedule that will
          actually be saved. */}
      <p
        aria-live="polite"
        className="text-sm rounded-xl px-3 py-2.5 break-words"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
      >
        {scheduleSentence(preview, lang, { planDays })}
      </p>
    </div>
  );
}
