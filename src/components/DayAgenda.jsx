import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, SkipForward, CalendarClock, Undo2, Sunrise, Sun, Moon, Clock, Users, CircleOff } from 'lucide-react';
import { t } from '../i18n';
import { parseKey, planDayNumber } from '../lib/schedule';
import { planTotal } from '../lib/planTempo';
import { groupBySlot, SLOT_ORDER } from '../lib/planner';
import { planDayContent } from '../content/prayerPlans';
import { pick } from '../content/teaching';
import { scheduleSummary } from '../lib/scheduleDraft';
import { dotKind } from '../lib/monthCalendar';
import { Input, SectionLabel } from './shared/Primitives';
import OverflowMenu from './shared/OverflowMenu';

// Agenda for one selected day: planned prayers grouped by prayer-time slot,
// with per-occurrence actions (mark prayed, skip, move, restore) and any group
// commitments claimed for that day. Pure presentation — actions come from the
// store via props.

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
  const dayLabel = parseKey(dayKey).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const isEmpty = entries.length === 0 && commitments.length === 0;

  return (
    <section className="agenda">
      <h2 className="agenda__day">{dayLabel}</h2>

      {isEmpty && <p className="agenda__empty">{t(lang, 'noPrayersThisDay')}</p>}

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
                      <SourceDot kind={dotKind(source)} />
                      <button type="button" onClick={() => navigate(href)} className="agenda-row__open">
                        <span className="agenda-row__title">{tr(prayer.title, lang)}</span>
                        {hasSchedule && (
                          <span className="agenda-row__meta">
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
                  <SourceDot kind="group" />
                  <button
                    type="button"
                    onClick={() => navigate(`/community/group/${c.group_id}/prayer/${c.community_prayer_id}`)}
                    className="agenda-row__open"
                  >
                    <span className="agenda-row__title">{c.title}</span>
                    {c.group_name && <span className="agenda-row__meta">{c.group_name}</span>}
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
