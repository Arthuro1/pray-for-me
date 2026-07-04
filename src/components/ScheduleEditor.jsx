import { useState } from 'react';
import { Repeat, CalendarDays, Sunrise, Sun, Moon, Check, ChevronDown, Sparkles } from 'lucide-react';
import { t } from '../i18n';
import { normalizeSchedule, parseKey, SLOTS } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { isSupporterFeature, FEATURES } from '../lib/plan';

// Plain-language recurrence picker. Deliberately presets-first (no cron-style
// builder): one-time / daily / weekdays / every-N-days / monthly / yearly,
// prayer-time slots instead of clock times, and four end conditions including
// the prayer-specific "until answered".
//
// Works on a DRAFT object the parent owns; scheduleFromDraft() turns it into
// the persisted schedule (or null = follows the weekly category plan).

const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };
const SLOT_ICONS = { morning: Sunrise, midday: Sun, evening: Moon };

// Simple/Advanced split (Task 3). "Simple" covers the everyday cases — daily or
// weekly recurrence that runs forever or "until answered". The Supporter-tier
// ADVANCED_SCHEDULING controls (custom recurrence rules + bounded end dates) live
// behind an "Advanced options" toggle carrying a soft, non-blocking Supporter tag.
// Nothing is locked while BILLING_ENABLED is false — the tag is a gentle
// thank-you hint, not a gate, so every existing schedule keeps working.
const ADVANCED_FREQS = ['interval', 'monthly', 'yearly'];
const ADVANCED_END_KINDS = ['date', 'count'];

// True when a draft already uses an advanced control. Used to auto-open the
// advanced section when editing an existing schedule so nothing is hidden.
export function isAdvancedDraft(d) {
  if (!d || d.mode !== 'recurring') return false;
  return ADVANCED_FREQS.includes(d.freq) || ADVANCED_END_KINDS.includes(d.endKind);
}

export function emptyDraft() {
  return {
    mode: 'plan', // 'plan' (no schedule) | 'once' | 'recurring'
    date: todayKey(),
    freq: 'daily',
    weekDays: [],
    interval: 3,
    dayOfMonth: parseInt(todayKey().slice(8, 10), 10),
    yearlyDate: todayKey(),
    slot: null,
    endKind: 'never', // 'never' | 'date' | 'count' | 'answered'
    endDate: '',
    endCount: 21,
  };
}

export function draftFromSchedule(s) {
  const d = emptyDraft();
  if (!s) return d;
  if (s.type === 'once') {
    return { ...d, mode: 'once', date: s.date, slot: s.slot || null };
  }
  d.mode = 'recurring';
  d.freq = s.freq || 'daily';
  d.weekDays = s.weekDays || [];
  d.interval = s.interval || 3;
  d.dayOfMonth = s.dayOfMonth || d.dayOfMonth;
  if (s.freq === 'yearly' && s.month && s.day) {
    const y = new Date().getFullYear();
    d.yearlyDate = `${y}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`;
  }
  d.slot = s.slot || null;
  d.endKind = s.end?.kind || 'never';
  d.endDate = s.end?.date || '';
  d.endCount = s.end?.count || 21;
  d.startDate = s.startDate;
  d.plan = s.plan;
  return d;
}

// Draft → persisted schedule (null = no schedule, follow the weekly plan).
export function scheduleFromDraft(d, existing = null) {
  if (!d || d.mode === 'plan') return null;
  if (d.mode === 'once') {
    return normalizeSchedule({ type: 'once', date: d.date, slot: d.slot }, todayKey());
  }
  const yearly = d.yearlyDate ? parseKey(d.yearlyDate) : new Date();
  return normalizeSchedule({
    type: 'recurring',
    freq: d.freq,
    weekDays: d.weekDays,
    interval: d.interval,
    dayOfMonth: d.dayOfMonth,
    month: yearly.getMonth() + 1,
    day: yearly.getDate(),
    // Editing keeps the original series anchor so counts don't restart.
    startDate: d.startDate || existing?.startDate,
    slot: d.slot,
    end: { kind: d.endKind, date: d.endDate, count: d.endCount },
    plan: d.plan || existing?.plan,
  }, todayKey());
}

// One-line human summary ("Every Tue, Fri · morning · until answered").
// Also used by PrayerDetail and the day agenda.
export function scheduleSummary(s, lang) {
  if (!s) return '';
  const dayNames = t(lang, 'days');
  const fmt = (key) => parseKey(key).toLocaleDateString(lang, { day: 'numeric', month: 'short' });
  let base;
  if (s.type === 'once') {
    base = `${t(lang, 'schedOnce')} · ${fmt(s.date)}`;
  } else {
    switch (s.freq) {
      case 'daily': base = t(lang, 'schedDaily'); break;
      case 'weekly': base = t(lang, 'schedWeekly', { days: (s.weekDays || []).map((i) => dayNames[i]).join(', ') }); break;
      case 'interval': base = t(lang, 'schedInterval', { n: s.interval }); break;
      case 'monthly': base = t(lang, 'schedMonthly', { d: s.dayOfMonth }); break;
      case 'yearly': base = t(lang, 'schedYearly', { date: parseKey(`2026-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`).toLocaleDateString(lang, { day: 'numeric', month: 'long' }) }); break;
      default: base = '';
    }
  }
  const parts = [base];
  if (s.slot) parts.push(t(lang, `slot_${s.slot}`));
  const end = s.end || {};
  if (end.kind === 'date' && end.date) parts.push(t(lang, 'schedUntilDate', { date: fmt(end.date) }));
  if (end.kind === 'count' && end.count) parts.push(t(lang, 'schedTimes', { n: end.count }));
  if (end.kind === 'answered') parts.push(t(lang, 'schedUntilAnswered'));
  return parts.filter(Boolean).join(' · ');
}

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
  const showSupporterTag = isSupporterFeature(FEATURES.ADVANCED_SCHEDULING);
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

  return (
    <div className="space-y-3">
      {label('scheduleLabel')}
      <div className="flex flex-wrap gap-2" style={{ marginTop: 0 }}>
        <Chip active={d.mode === 'plan'} onClick={() => patch({ mode: 'plan' })}>{t(lang, 'schedFollowPlan')}</Chip>
        <Chip active={d.mode === 'once'} onClick={() => patch({ mode: 'once' })}><CalendarDays size={12} /> {t(lang, 'schedOnce')}</Chip>
        <Chip active={d.mode === 'recurring'} onClick={() => patch({ mode: 'recurring' })}><Repeat size={12} /> {t(lang, 'schedRecurring')}</Chip>
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
          <div className="flex flex-wrap gap-2">
            <Chip active={d.freq === 'daily'} onClick={() => patch({ freq: 'daily' })}>{t(lang, 'freqDaily')}</Chip>
            <Chip active={d.freq === 'weekly'} onClick={() => patch({ freq: 'weekly' })}>{t(lang, 'freqWeekly')}</Chip>
            {advanced && <>
              <Chip active={d.freq === 'interval'} onClick={() => patch({ freq: 'interval' })}>{t(lang, 'freqInterval')}</Chip>
              <Chip active={d.freq === 'monthly'} onClick={() => patch({ freq: 'monthly' })}>{t(lang, 'freqMonthly')}</Chip>
              <Chip active={d.freq === 'yearly'} onClick={() => patch({ freq: 'yearly' })}>{t(lang, 'freqYearly')}</Chip>
            </>}
          </div>

          {d.freq === 'weekly' && (
            <div className="flex gap-1">
              {DAYS.map((day, idx) => {
                const active = d.weekDays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => patch({ weekDays: active ? d.weekDays.filter((x) => x !== idx) : [...d.weekDays, idx] })}
                    className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
                    style={active ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--input-bg)', color: 'var(--text-3)' }}
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
            {showSupporterTag && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
              >
                <Sparkles size={9} /> {t(lang, 'supporterTag')}
              </span>
            )}
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
