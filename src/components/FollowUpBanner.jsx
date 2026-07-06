import { useState } from 'react';
import { Bell, Check, Clock, Plus, CalendarClock, X } from 'lucide-react';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import useFollowUpStore, { isFollowUpDue, followUpWhenLabel } from '../store/followUpStore';
import FollowUpField from './FollowUpField';

// A per-prayer follow-up reminder surfaced on the prayer's own screen. It is the
// in-app delivery of the "remind me to follow up" choice made in PrayerForm —
// separate from the recurrence schedule and from the account-level cadence.
//
// SCAFFOLD: delivery is in-app only (this banner) for now. See followUpStore for
// the TODO on moving to server-side push. Snooze / Set another / Dismiss are
// handled here; Add update and Mark answered reuse the prayer's existing flows.
export default function FollowUpBanner({ prayer, lang, onAddUpdate, onMarkAnswered }) {
  const followUp = useFollowUpStore((s) => s.followUps[prayer?.id]);
  const snoozeFollowUp = useFollowUpStore((s) => s.snoozeFollowUp);
  const clearFollowUp = useFollowUpStore((s) => s.clearFollowUp);
  const setFollowUp = useFollowUpStore((s) => s.setFollowUp);
  const [picking, setPicking] = useState(false);

  if (!followUp || followUp.status !== 'pending') return null;
  const due = isFollowUpDue(followUp);

  const btn = (onClick, icon, labelKey) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
    >
      {icon} {t(lang, labelKey)}
    </button>
  );

  const handleSnooze = () => { snoozeFollowUp(prayer.id, 3); toast.success(t(lang, 'followUpSetToast')); };
  const handleDismiss = () => { clearFollowUp(prayer.id); toast.success(t(lang, 'followUpDoneToast')); };
  const handleAddUpdate = () => { onAddUpdate?.(); };
  const handleMarkAnswered = () => { onMarkAnswered?.(); };

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={due
        ? { background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }
        : { background: 'var(--surface)', border: '0.5px solid var(--border)' }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-soft)' }}>
          {due ? <Bell size={15} style={{ color: 'var(--accent)' }} /> : <CalendarClock size={15} style={{ color: 'var(--accent)' }} />}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
            {due ? t(lang, 'followUpDue') : t(lang, 'followUpSetFor', { date: followUpWhenLabel(followUp.date, lang) })}
          </p>
        </div>
      </div>

      {picking ? (
        <div className="space-y-2">
          <FollowUpField value={followUp.date} onChange={(d) => setFollowUp(prayer.id, d)} lang={lang} />
          <button
            type="button"
            onClick={() => setPicking(false)}
            className="text-xs font-medium"
            style={{ color: 'var(--accent)' }}
          >
            {t(lang, 'close')}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {onAddUpdate && btn(handleAddUpdate, <Plus size={12} />, 'followUpAddUpdate')}
          {onMarkAnswered && btn(handleMarkAnswered, <Check size={12} />, 'markAnswered')}
          {btn(handleSnooze, <Clock size={12} />, 'followUpSnooze')}
          {btn(() => setPicking(true), <CalendarClock size={12} />, 'followUpAnother')}
          {btn(handleDismiss, <X size={12} />, 'followUpDismiss')}
        </div>
      )}
    </div>
  );
}
