import { useState } from 'react';
import { Repeat, CalendarClock, Edit2 } from 'lucide-react';
import { t } from '../i18n';
import ScheduleEditor from './ScheduleEditor';
import { draftFromSchedule, scheduleFromDraft, scheduleSummary } from '../lib/scheduleDraft';

// Prayer-plan (recurrence) editor for the prayer detail page, so a plan can be
// added or changed AFTER a prayer is created — not only in the new-prayer form.
// Wraps the shared ScheduleEditor and commits through onSave (updatePrayer),
// which accepts null to clear the plan (the "Follows weekly plan" mode), so the
// user can also drop a plan they set earlier.
//
// `defaultEditing` opens straight into the editor (used when reached from the
// overflow menu's Schedule action); `onDone` (optional) is called after a save
// or cancel so the host can close its disclosure.
export default function SchedulePlanner({ schedule, onSave, lang, defaultEditing = false, onDone }) {
  const [editing, setEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState(() => draftFromSchedule(schedule));

  // Always re-seed from the current schedule so a cancelled edit or an external
  // change (translation toggle, sync) can't leave a stale draft behind.
  const startEdit = () => { setDraft(draftFromSchedule(schedule)); setEditing(true); };
  const close = () => { setEditing(false); onDone?.(); };
  const save = () => { onSave(scheduleFromDraft(draft, schedule)); close(); };

  if (editing) {
    return (
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
        <ScheduleEditor draft={draft} onChange={setDraft} lang={lang} />
        <div className="flex gap-2">
          <button
            onClick={close}
            className="flex-1 py-2.5 min-h-[44px] rounded-xl text-sm"
            style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
          >
            {t(lang, 'cancel')}
          </button>
          <button
            onClick={save}
            className="flex-1 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            {t(lang, 'save')}
          </button>
        </div>
      </div>
    );
  }

  // Existing plan → tappable summary pill that opens the editor.
  if (schedule) {
    return (
      <button
        onClick={startEdit}
        title={t(lang, 'editSchedule')}
        className="w-full min-h-[44px] text-xs flex items-center gap-1.5 rounded-xl px-3 py-2"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
      >
        <Repeat size={12} className="shrink-0" />
        <span className="flex-1 text-start">{scheduleSummary(schedule, lang)}</span>
        <Edit2 size={12} className="shrink-0 opacity-60" />
      </button>
    );
  }

  // No plan yet → entry point to add one.
  return (
    <button
      onClick={startEdit}
      className="w-full min-h-[44px] text-xs font-medium flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5"
      style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
    >
      <CalendarClock size={13} /> {t(lang, 'addSchedule')}
    </button>
  );
}
