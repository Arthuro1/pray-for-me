import { useState } from 'react';
import { t } from '../i18n';
import ScheduleEditor from './ScheduleEditor';
import { PrimaryButton, SecondaryButton } from './shared/Primitives';

// The rhythm editor that opens under the prayer form's "Prayer rhythm" row. The
// row itself states the rhythm a prayer already has — never a blank "Add a
// schedule" — so this exists only once someone asks to change it.
//
// Works on a DRAFT (lib/scheduleDraft.js) and commits through onCommit, so the
// host owns the value and the persisted shape is unchanged. Edits happen on a
// COPY: Cancel drops them, "Use this rhythm" commits them once — which is how a
// new prayer keeps its bounded weekly default without anyone confirming it.
export default function SchedulePicker({ draft, onCommit, onClose, lang, planDays, idPrefix = 'sched' }) {
  const [working, setWorking] = useState(draft);
  const commit = () => { onCommit(working); onClose(); };

  return (
    <div className="schedule-picker">
      <ScheduleEditor draft={working} onChange={setWorking} lang={lang} planDays={planDays} idPrefix={idPrefix} />
      <div className="schedule-picker__actions">
        <SecondaryButton onClick={onClose}>{t(lang, 'cancel')}</SecondaryButton>
        <PrimaryButton onClick={commit}>{t(lang, 'schedUseRhythm')}</PrimaryButton>
      </div>
    </div>
  );
}
