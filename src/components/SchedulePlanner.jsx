import { useState } from 'react';
import { Repeat, CalendarClock } from 'lucide-react';
import { t } from '../i18n';
import ScheduleEditor from './ScheduleEditor';
import { PrimaryButton, SecondaryButton } from './shared/Primitives';
import { draftFromSchedule, scheduleFromDraft, scheduleSummary } from '../lib/scheduleDraft';

// Prayer-plan (recurrence) editor for the prayer detail page, so a plan can be
// added or changed AFTER a prayer is created — not only in the new-prayer form.
// Wraps the shared ScheduleEditor and commits through onSave (updatePrayer).
// Choosing "No fixed schedule" commits an explicit { type: 'none' } — the prayer
// stays in the Journal but lands on no dated day — so a plan set earlier can be
// dropped without falling back to a category-driven rhythm (labels don't schedule).
//
// `defaultEditing` opens straight into the editor (used when reached from the
// overflow menu's Schedule action); `onDone` (optional) is called after a save
// or cancel so the host can close its disclosure and take focus back.
export default function SchedulePlanner({ schedule, onSave, lang, planDays, defaultEditing = false, onDone }) {
  const [editing, setEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState(() => draftFromSchedule(schedule));

  // Always re-seed from the current schedule so a cancelled edit or an external
  // change (translation toggle, sync) can't leave a stale draft behind.
  const startEdit = () => { setDraft(draftFromSchedule(schedule)); setEditing(true); };
  const close = () => { setEditing(false); onDone?.(); };
  const save = () => { onSave(scheduleFromDraft(draft, schedule)); close(); };

  if (editing) {
    return (
      <div className="schedule-picker">
        <ScheduleEditor draft={draft} onChange={setDraft} lang={lang} planDays={planDays} />
        <div className="schedule-picker__actions">
          <SecondaryButton onClick={close}>{t(lang, 'cancel')}</SecondaryButton>
          <PrimaryButton onClick={save}>{t(lang, 'schedUseRhythm')}</PrimaryButton>
        </div>
      </div>
    );
  }

  // Existing rhythm → its summary, which opens the editor.
  if (schedule) {
    return (
      <SecondaryButton icon={Repeat} iconSize={16} onClick={startEdit} title={t(lang, 'editSchedule')} className="w-full">
        {scheduleSummary(schedule, lang)}
      </SecondaryButton>
    );
  }

  // No rhythm yet → entry point to add one.
  return (
    <SecondaryButton icon={CalendarClock} iconSize={16} onClick={startEdit} className="w-full">
      {t(lang, 'addSchedule')}
    </SecondaryButton>
  );
}
