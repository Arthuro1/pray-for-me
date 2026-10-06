import { useState } from 'react';
import { Bell, Check, Clock, Plus, CalendarClock, X } from 'lucide-react';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import useFollowUpStore, { isFollowUpDue, followUpWhenLabel } from '../store/followUpStore';
import FollowUpField from './FollowUpField';
import { QuietButton } from './shared/Primitives';

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
    <QuietButton icon={icon} iconSize={15} onClick={onClick}>{t(lang, labelKey)}</QuietButton>
  );

  const handleSnooze = () => { snoozeFollowUp(prayer.id, 3); toast.success(t(lang, 'followUpSetToast')); };
  const handleDismiss = () => { clearFollowUp(prayer.id); toast.success(t(lang, 'followUpDoneToast')); };
  const handleAddUpdate = () => { onAddUpdate?.(); };
  const handleMarkAnswered = () => { onMarkAnswered?.(); };

  return (
    <section className={`follow-up ${due ? 'follow-up--due' : ''}`}>
      <p className="follow-up__title">
        {due ? <Bell size={16} aria-hidden="true" /> : <CalendarClock size={16} aria-hidden="true" />}
        {due ? t(lang, 'followUpDue') : t(lang, 'followUpSetFor', { date: followUpWhenLabel(followUp.date, lang) })}
      </p>

      {picking ? (
        <div className="grid gap-2">
          <FollowUpField value={followUp.date} onChange={(d) => setFollowUp(prayer.id, d)} lang={lang} />
          <QuietButton onClick={() => setPicking(false)} className="-ms-3 justify-self-start">{t(lang, 'close')}</QuietButton>
        </div>
      ) : (
        <div className="follow-up__actions">
          {onAddUpdate && btn(handleAddUpdate, Plus, 'followUpAddUpdate')}
          {onMarkAnswered && btn(handleMarkAnswered, Check, 'markAnswered')}
          {btn(handleSnooze, Clock, 'followUpSnooze')}
          {btn(() => setPicking(true), CalendarClock, 'followUpAnother')}
          {btn(handleDismiss, X, 'followUpDismiss')}
        </div>
      )}
    </section>
  );
}
