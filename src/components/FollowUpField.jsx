import { Bell, CalendarClock } from 'lucide-react';
import { t } from '../i18n';
import { todayKey } from '../lib/prayedLog';
import { FOLLOW_UP_OPTIONS, followUpDateFor } from '../store/followUpStore';

// "Remind me to follow up" — a per-prayer, one-time check-back reminder chosen
// when creating or editing a prayer. It is intentionally NOT part of the
// recurrence schedule (ScheduleEditor); a follow-up says "nudge me to look at
// THIS prayer again", not "add another praying day". Value is a plain day-key
// (YYYY-MM-DD) or null for "no reminder"; the parent form persists it via
// followUpStore once the prayer's id is known.

const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };

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

// Which preset (if any) a stored date matches today — else 'pick' for a custom
// date, or 'off' when there's no reminder.
function activeId(value) {
  if (!value) return 'off';
  const today = todayKey();
  const match = FOLLOW_UP_OPTIONS.find((o) => o.days != null && followUpDateFor(o, today) === value);
  return match ? match.id : 'pick';
}

export default function FollowUpField({ value = null, onChange, lang }) {
  const active = activeId(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Bell size={13} style={{ color: 'var(--text-3)' }} />
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{t(lang, 'followUpTitle')}</p>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'followUpHint')}</p>

      <div className="flex flex-wrap gap-2">
        {FOLLOW_UP_OPTIONS.map((o) => (
          <Chip key={o.id} active={active === o.id} onClick={() => onChange(followUpDateFor(o))}>
            {t(lang, o.labelKey)}
          </Chip>
        ))}
        <Chip active={active === 'pick'} onClick={() => onChange(value || todayKey())}>
          <CalendarClock size={12} /> {t(lang, 'followUpPickDate')}
        </Chip>
      </div>

      {active === 'pick' && (
        <input
          type="date"
          value={value || ''}
          min={todayKey()}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none"
          style={INPUT_STYLE}
        />
      )}
    </div>
  );
}
