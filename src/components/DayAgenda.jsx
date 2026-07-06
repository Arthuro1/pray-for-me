import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, SkipForward, CalendarClock, Undo2, Sunrise, Sun, Moon, Clock, Users, CircleOff } from 'lucide-react';
import { t } from '../i18n';
import { parseKey, planDayNumber } from '../lib/schedule';
import { groupBySlot, SLOT_ORDER } from '../lib/planner';
import { planDayContent } from '../content/prayerPlans';
import { pick } from '../content/teaching';
import { scheduleSummary } from './ScheduleEditor';
import { DOT_COLORS } from './MonthCalendar';
import OverflowMenu from './OverflowMenu';

// Agenda for one selected day: planned prayers grouped by prayer-time slot,
// with per-occurrence actions (mark prayed, skip, move, restore) and any group
// commitments claimed for that day. Pure presentation — actions come from the
// store via props.

const SLOT_ICONS = { morning: Sunrise, midday: Sun, evening: Moon, anytime: Clock };

function SourceDot({ source }) {
  return <span className="rounded-full shrink-0" style={{ width: 6, height: 6, background: DOT_COLORS[source === 'days' || source === 'category' ? 'plan' : source] }} />;
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
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <p className="text-sm font-semibold capitalize mb-2" style={{ color: 'var(--text-1)' }}>{dayLabel}</p>

      {isEmpty && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--text-3)' }}>🕊️ {t(lang, 'noPrayersThisDay')}</p>
      )}

      {SLOT_ORDER.map((slot) => {
        const slotEntries = groups[slot];
        if (!slotEntries || slotEntries.length === 0) return null;
        const Icon = SLOT_ICONS[slot];
        const showHeader = entries.some((e) => e.slot); // headers only once slots are in use
        return (
          <div key={slot} className="mb-2">
            {showHeader && (
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                <Icon size={11} /> {t(lang, slot === 'anytime' ? 'slotAnytime' : `slot_${slot}`)}
              </p>
            )}
            <div className="space-y-1.5">
              {slotEntries.map(({ prayer, source }) => {
                const prayed = (completions[prayer.id] || []).includes(dayKey);
                const hasSchedule = !!prayer.schedule;
                const override = prayer.schedule_overrides?.[dayKey];
                return (
                  <div key={prayer.id} className="rounded-xl px-3 py-2.5" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
                    <div className="flex items-center gap-2.5">
                      <SourceDot source={source} />
                      <button onClick={() => navigate(`/prayers/${prayer.id}`)} className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)', textDecoration: prayed ? 'line-through' : 'none', opacity: prayed ? 0.6 : 1 }}>
                          {tr(prayer.title, lang)}
                        </p>
                        {hasSchedule && (
                          <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>
                            {(() => {
                              // Plan prayers show "Day n of N · theme" for the
                              // selected day; other schedules show their summary.
                              const plan = prayer.schedule.plan;
                              const n = plan ? planDayNumber(prayer.schedule, dayKey) : null;
                              const content = n && planDayContent(plan.id, n);
                              if (content) {
                                return `${t(lang, 'planDayOf', { n, total: prayer.schedule.end?.count || '' })} · ${pick(content.theme, lang)}`;
                              }
                              return scheduleSummary(prayer.schedule, lang);
                            })()}
                          </p>
                        )}
                      </button>
                      <button
                        onClick={() => onTogglePrayed(prayer.id, dayKey, prayed)}
                        title={t(lang, prayed ? 'prayedOnDay' : 'markPrayed')}
                        aria-label={t(lang, prayed ? 'prayedOnDay' : 'markPrayed')}
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={prayed
                          ? { background: 'var(--success)', color: '#fff' }
                          : { background: 'var(--surface)', border: '1.5px solid var(--input-border)', color: 'var(--text-3)' }}
                      >
                        <Check size={13} />
                      </button>
                      {hasSchedule && (
                        // Occurrence edit scopes: skip/move = "this day only",
                        // end series = "this and future". "All" = edit the
                        // schedule itself from the prayer's edit form.
                        <OverflowMenu
                          lang={lang}
                          triggerClassName="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          triggerStyle={{ background: 'var(--surface)', border: '0.5px solid var(--input-border)', color: 'var(--text-3)' }}
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
                      <input
                        type="date"
                        autoFocus
                        onChange={(e) => {
                          if (!e.target.value || e.target.value === dayKey) return;
                          onMove(prayer.id, dayKey, e.target.value);
                          setMovingId(null);
                        }}
                        className="w-full mt-2 text-sm rounded-lg px-3 py-2 focus:outline-none"
                        style={{ background: 'var(--surface)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {commitments.length > 0 && (
        <div className="mt-3 pt-2" style={{ borderTop: '0.5px solid var(--border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color: DOT_COLORS.group }}>
            <Users size={11} /> {t(lang, 'myCommitments')}
          </p>
          <div className="space-y-1.5">
            {commitments.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/community/group/${c.group_id}/prayer/${c.community_prayer_id}`)}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}
              >
                <span className="rounded-full shrink-0" style={{ width: 6, height: 6, background: DOT_COLORS.group }} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{c.title}</span>
                  {c.group_name && <span className="block text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{c.group_name}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
