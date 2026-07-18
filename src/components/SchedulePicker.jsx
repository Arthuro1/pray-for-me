import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import ScheduleEditor from './ScheduleEditor';
import DisclosureRow from './shared/DisclosureRow';
import { modeOf, planSummary, scheduleFromDraft, scheduleSummary } from '../lib/scheduleDraft';

// Scheduling as ONE line until someone asks for more:
//
//     Prayer rhythm
//     Every Tue · Anytime                                   Change
//     You can change this later.
//
// The rhythm a prayer already has is stated — never a blank "Add a schedule" —
// and the full editor only exists after Change. Saving with it untouched keeps
// exactly the draft that was passed in, which is how a new prayer keeps its
// bounded weekly default without anyone confirming a schedule.
//
// Works on a DRAFT (lib/scheduleDraft.js) and commits through onCommit, so the
// host owns the value and the persisted shape is unchanged. Edits happen on a
// COPY: Cancel drops them, "Use this rhythm" commits them once.
export default function SchedulePicker({ draft, onCommit, lang, planDays, idPrefix = 'sched' }) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(draft);
  const triggerRef = useRef(null);
  const returnFocus = useRef(false);

  // Closing returns focus to the row that opened the editor — the control the
  // user actually left, not the top of the form.
  useEffect(() => {
    if (!open && returnFocus.current) {
      returnFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  const start = () => { setWorking(draft); setOpen(true); };
  const close = () => { returnFocus.current = true; setOpen(false); };
  const commit = () => { onCommit(working); close(); };

  if (!open) {
    const schedule = scheduleFromDraft(draft);
    return (
      <div className="space-y-1.5">
        <DisclosureRow
          ref={triggerRef}
          label={t(lang, 'schedRhythmLabel')}
          value={schedule ? scheduleSummary(schedule, lang, { showAnytime: true }) : planSummary(planDays, lang)}
          action={t(lang, 'schedChange')}
          open={false}
          onToggle={start}
          controlsId={`${idPrefix}-editor`}
        />
        <p className="text-xs px-1" style={{ color: 'var(--text-3)' }}>
          {modeOf(draft) === 'plan' ? t(lang, 'rhythmPlanHint') : t(lang, 'schedChangeLater')}
        </p>
      </div>
    );
  }

  return (
    <div id={`${idPrefix}-editor`} className="space-y-3 rounded-2xl p-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <ScheduleEditor draft={working} onChange={setWorking} lang={lang} planDays={planDays} idPrefix={idPrefix} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={close}
          className="flex-1 py-2.5 min-h-[44px] rounded-xl text-sm"
          style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
        >
          {t(lang, 'cancel')}
        </button>
        <button
          type="button"
          onClick={commit}
          className="flex-1 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          {t(lang, 'schedUseRhythm')}
        </button>
      </div>
    </div>
  );
}
