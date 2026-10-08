import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, SkipForward, CalendarClock, Undo2, Sunrise, Sun, Moon, Clock, Users, CircleOff, CalendarCheck } from 'lucide-react';
import { t, tp } from '../i18n';
import { parseKey, planDayNumber } from '../lib/schedule';
import { planTotal } from '../lib/planTempo';
import { groupBySlot, SLOT_ORDER } from '../lib/planner';
import { planDayContent } from '../content/prayerPlans';
import { planById } from '../lib/guidedPlan';
import { todayKey } from '../lib/prayedLog';
import { pick } from '../content/teaching';
import { scheduleSummary } from '../lib/scheduleDraft';
import { dotKind } from '../lib/monthCalendar';
import { Input, SectionLabel } from './shared/Primitives';
import OverflowMenu from './shared/OverflowMenu';
import PrayerMark from './shared/PrayerMark';

// Agenda for one selected day: planned prayers grouped by prayer-time slot,
// with per-occurrence actions (mark prayed, skip, move, restore) and any group
// commitments claimed for that day. Pure presentation — actions come from the
// store via props. Each row leads with the prayer's own mark (its circle, or
// its plan's emblem) as in the Journal; the small calendar mark beside its
// rhythm matches the month's legend.

const SLOT_ICONS = { morning: Sunrise, midday: Sun, evening: Moon, anytime: Clock };

function SourceDot({ kind }) {
  return <span className={`cal-dot cal-dot--${kind}`} aria-hidden="true" />;
}

export default function DayAgenda({
  dayKey, lang, tr, entries, completions, commitments = [],
  onTogglePrayed, onSkip, onMove, onRestore, onEndSeries,
}) {
  const navigate = useNavigate();
  const [movingId, setMovingId] = useState(null);
  const groups = groupBySlot(entries);
  const date = parseKey(dayKey);
  const weekday = date.toLocaleDateString(lang, { weekday: 'long' });
  const dayMonth = date.toLocaleDateString(lang, { day: 'numeric', month: 'long' });
  const count = entries.length + commitments.length;
  const isEmpty = count === 0;

  return (
    <section className="agenda">
      <header className="agenda__head">
        {/* One heading, read as "Thursday 8 October"; the weekday sits above
            the date as its eyebrow, with "Today" when it is. */}
        <h2 className="agenda__day">
          <span className="agenda__weekday">
            {dayKey === todayKey() ? `${t(lang, 'today')} · ${weekday}` : weekday}
          </span>
          {' '}
          <span>{dayMonth}</span>
        </h2>
        {!isEmpty && <span className="agenda__count">{tp(lang, 'circlePrayerCount', count)}</span>}
      </header>

      {isEmpty && (
        <p className="agenda__empty">
          <CalendarCheck size={22} strokeWidth={1.6} aria-hidden="true" />
          <span>{t(lang, 'noPrayersThisDay')}</span>
        </p>
      )}

      {SLOT_ORDER.map((slot) => {
        const slotEntries = groups[slot];
        if (!slotEntries || slotEntries.length === 0) return null;
        const Icon = SLOT_ICONS[slot];
        const showHeader = entries.some((e) => e.slot); // headers only once slots are in use
        return (
          <div key={slot} className="agenda__slot">
            {showHeader && (
              <SectionLabel className="agenda__slot-label">
                <Icon size={12} aria-hidden="true" /> {t(lang, slot === 'anytime' ? 'slotAnytime' : `slot_${slot}`)}
              </SectionLabel>
            )}
            <ul className="agenda__list">
              {slotEntries.map(({ prayer, source }) => {
                const prayed = (completions[prayer.id] || []).includes(dayKey);
                const hasSchedule = !!prayer.schedule;
                const override = prayer.schedule_overrides?.[dayKey];
                // On a plan day the row opens THAT day of the plan rather than
                // today's: selecting a day on the calendar is how a reader goes
                // back to a day they missed, or reads the next one. Anything
                // else opens the prayer plainly.
                const plan = prayer.schedule?.plan;
                const planDayNo = plan ? planDayNumber(prayer.schedule, dayKey) : null;
                const href = planDayNo ? `/prayers/${prayer.id}?day=${dayKey}` : `/prayers/${prayer.id}`;
                return (
                  <li key={prayer.id} className={`agenda-row ${prayed ? 'agenda-row--prayed' : ''}`}>
                    <div className="agenda-row__main">
                      <PrayerMark prayer={prayer} planCategory={plan ? planById(plan.id)?.category : null} />
                      <button type="button" onClick={() => navigate(href)} className="agenda-row__open">
                        <span className="agenda-row__title">{tr(prayer.title, lang)}</span>
                        {hasSchedule && (
                          <span className="agenda-row__meta">
                            <SourceDot kind={dotKind(source)} />
                            <span className="truncate">
                              {(() => {
                                // Plan prayers show "Day n of N · theme" for the
                                // selected day; other schedules show their summary.
                                const content = planDayNo && planDayContent(plan.id, planDayNo, null, plan.version || null);
                                if (content) {
                                  return `${t(lang, 'planDayOf', { n: planDayNo, total: planTotal(prayer.schedule) || '' })} · ${pick(content.theme, lang)}`;
                                }
                                return scheduleSummary(prayer.schedule, lang);
                              })()}
                            </span>
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePrayed(prayer.id, dayKey, prayed)}
                        title={t(lang, prayed ? 'prayedOnDay' : 'markPrayed')}
                        aria-label={t(lang, prayed ? 'prayedOnDay' : 'markPrayed')}
                        aria-pressed={prayed}
                        className="agenda-check pressable"
                      >
                        <span aria-hidden="true"><Check size={14} strokeWidth={2.4} /></span>
                      </button>
                      {hasSchedule && (
                        // Occurrence edit scopes: skip/move = "this day only",
                        // end series = "this and future". "All" = edit the
                        // schedule itself from the prayer's edit form.
                        <OverflowMenu
                          lang={lang}
                          triggerClassName="icon-button pressable"
                          items={[
                            { key: 'skip', icon: SkipForward, label: t(lang, 'skipThisDay'), onClick: () => onSkip(prayer.id, dayKey), hidden: prayed || !!override },
                            { key: 'move', icon: CalendarClock, label: t(lang, 'moveThisDay'), onClick: () => setMovingId(prayer.id), hidden: prayed || !!override },
                            { key: 'restore', icon: Undo2, label: t(lang, 'restoreOccurrence'), onClick: () => onRestore(prayer.id, dayKey), hidden: !override },
                            { key: 'end', icon: CircleOff, label: t(lang, 'endSeriesHere'), onClick: () => onEndSeries(prayer.id, dayKey), danger: true, hidden: prayer.schedule?.type !== 'recurring' },
                          ]}
                        />
                      )}
                    </div>
                    {movingId === prayer.id && (
                      <Input
                        type="date"
                        autoFocus
                        aria-label={t(lang, 'moveThisDay')}
                        onChange={(e) => {
                          if (!e.target.value || e.target.value === dayKey) return;
                          onMove(prayer.id, dayKey, e.target.value);
                          setMovingId(null);
                        }}
                        className="agenda-row__move"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {commitments.length > 0 && (
        <div className="agenda__slot">
          <SectionLabel className="agenda__slot-label">
            <Users size={12} aria-hidden="true" /> {t(lang, 'myCommitments')}
          </SectionLabel>
          <ul className="agenda__list">
            {commitments.map((c) => (
              <li key={c.id} className="agenda-row">
                <div className="agenda-row__main">
                  <span className="icon-tile tone-plum" aria-hidden="true"><Users size={18} strokeWidth={1.8} /></span>
                  <button
                    type="button"
                    onClick={() => navigate(`/community/group/${c.group_id}/prayer/${c.community_prayer_id}`)}
                    className="agenda-row__open"
                  >
                    <span className="agenda-row__title">{c.title}</span>
                    {c.group_name && <span className="agenda-row__meta"><SourceDot kind="group" /><span className="truncate">{c.group_name}</span></span>}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
