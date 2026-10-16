import { useId, useState } from 'react';
import { Bell, Loader2, Lock, MapPin, Video } from 'lucide-react';
import { t } from '../../i18n';
import { todayKey } from '../../lib/prayedLog';
import { weekdayName } from '../../lib/scheduleDraft';
import { deviceTimeZone } from '../../lib/meetingTime';
import { meetingPlatform } from '../../lib/meetingLink';
import {
  DURATIONS, MEETING_NOTES_MAX, MEETING_TEXT_MAX, REPEATS,
  draftFromMeeting, meetingDetails, meetingDraftError, newMeetingDraft, scheduleFromMeetingDraft,
} from '../../lib/meetingDraft';
import { Field, Input, PrimaryButton, SecondaryButton, SegmentedControl, Textarea } from '../../components/shared/Primitives';
import { Modal } from './GroupFriendModals';

// Schedule (or change) a group's "we pray together" time. The app supports the
// meeting; it isn't the meeting: it keeps the time, the place or the call link,
// and reminds everyone shortly before. The details are encrypted for the group.
const REPEAT_LABELS = {
  weekly: 'meetingRepeatWeekly',
  biweekly: 'meetingRepeatBiweekly',
  monthly: 'meetingRepeatMonthly',
  daily: 'meetingRepeatDaily',
  once: 'meetingRepeatOnce',
};
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

// "Europe/Paris" → "Paris", the way people name a time zone.
const zoneName = (timeZone) => timeZone.split('/').pop().replace(/_/g, ' ');

function Chips({ label, children }) {
  const labelId = useId();
  return (
    <div className="q-field">
      <p id={labelId} className="q-field__label">{label}</p>
      <div className="q-chips" role="group" aria-labelledby={labelId}>{children}</div>
    </div>
  );
}

function Chip({ pressed, onClick, children }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className="q-chip pressable">{children}</button>
  );
}

export default function GroupMeetingForm({ lang, meeting, onSave, onClose }) {
  const today = todayKey();
  const [draft, setDraft] = useState(() => (meeting ? draftFromMeeting(meeting, today) : newMeetingDraft(today, deviceTimeZone())));
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const patch = (updates) => setDraft((d) => ({ ...d, ...updates }));
  const error = meetingDraftError(draft, today);
  const platform = draft.mode === 'online' ? meetingPlatform(draft.link) : null;
  const otherZone = draft.timezone !== deviceTimeZone();

  const toggleDay = (day) => patch({
    weekDays: draft.weekDays.includes(day) ? draft.weekDays.filter((d) => d !== day) : [...draft.weekDays, day],
  });

  const submit = async (event) => {
    event.preventDefault();
    setTried(true);
    if (error || saving) return;
    setSaving(true);
    const saved = await onSave({
      schedule: scheduleFromMeetingDraft(draft, today),
      startTime: draft.time,
      timezone: draft.timezone,
      durationMinutes: draft.duration,
      details: meetingDetails(draft),
    });
    if (!saved) setSaving(false);
  };

  const needsDate = draft.repeat === 'once' || draft.repeat === 'biweekly';

  return (
    <Modal title={t(lang, meeting ? 'meetingFormTitleEdit' : 'meetingFormTitleNew')} lang={lang} onClose={onClose}>
      <form onSubmit={submit} className="meeting-form" noValidate>
        <p className="q-field__hint">{t(lang, 'meetingIntro')}</p>

        <Field label={t(lang, 'meetingNameLabel')}>
          {(ids) => (
            <Input {...ids} value={draft.title} maxLength={MEETING_TEXT_MAX} onChange={(e) => patch({ title: e.target.value })} placeholder={t(lang, 'meetingNamePlaceholder')} autoComplete="off" />
          )}
        </Field>

        <div className="q-field">
          <p className="q-field__label">{t(lang, 'meetingWhereLabel')}</p>
          <SegmentedControl
            label={t(lang, 'meetingWhereLabel')}
            value={draft.mode}
            onChange={(mode) => patch({ mode })}
            options={[
              { value: 'online', label: t(lang, 'meetingOnline'), icon: Video },
              { value: 'in_person', label: t(lang, 'meetingInPerson'), icon: MapPin },
            ]}
          />
        </div>

        {draft.mode === 'online' ? (
          <Field
            label={t(lang, 'meetingLinkLabel')}
            hint={platform || t(lang, 'meetingLinkHint')}
            error={tried && error === 'meetingLinkInvalid' ? t(lang, error) : null}
          >
            {(ids) => (
              <Input {...ids} type="url" inputMode="url" value={draft.link} onChange={(e) => patch({ link: e.target.value })} placeholder="https://" autoComplete="off" spellCheck={false} />
            )}
          </Field>
        ) : (
          <Field label={t(lang, 'meetingPlaceLabel')} error={tried && error === 'meetingPlaceRequired' ? t(lang, error) : null}>
            {(ids) => (
              <Input {...ids} value={draft.place} maxLength={MEETING_TEXT_MAX} onChange={(e) => patch({ place: e.target.value })} placeholder={t(lang, 'meetingPlacePlaceholder')} autoComplete="off" />
            )}
          </Field>
        )}

        <Chips label={t(lang, 'meetingWhenLabel')}>
          {REPEATS.map((repeat) => (
            <Chip key={repeat} pressed={draft.repeat === repeat} onClick={() => patch({ repeat })}>{t(lang, REPEAT_LABELS[repeat])}</Chip>
          ))}
        </Chips>

        {draft.repeat === 'weekly' && (
          <Chips label={t(lang, 'meetingDaysLabel')}>
            {WEEK_ORDER.map((day) => (
              <Chip key={day} pressed={draft.weekDays.includes(day)} onClick={() => toggleDay(day)}>{weekdayName(lang, day)}</Chip>
            ))}
          </Chips>
        )}
        {tried && error === 'meetingDaysRequired' && <p className="q-field__hint q-field__hint--error" role="alert">{t(lang, error)}</p>}

        {needsDate && (
          <Field
            label={t(lang, draft.repeat === 'once' ? 'meetingDateLabel' : 'meetingFirstDateLabel')}
            error={tried && error === 'meetingDateRequired' ? t(lang, error) : null}
          >
            {(ids) => <Input {...ids} type="date" min={today} value={draft.date} onChange={(e) => patch({ date: e.target.value })} />}
          </Field>
        )}

        {draft.repeat === 'monthly' && (
          <Field label={t(lang, 'meetingDayOfMonthLabel')} error={tried && error === 'meetingDayOfMonthInvalid' ? t(lang, error) : null}>
            {(ids) => (
              <Input {...ids} type="number" inputMode="numeric" min={1} max={31} value={draft.dayOfMonth} onChange={(e) => patch({ dayOfMonth: e.target.value })} className="meeting-form__short" />
            )}
          </Field>
        )}

        <Field
          label={t(lang, 'meetingTimeLabel')}
          hint={otherZone ? t(lang, 'meetingTimeZoneNote', { zone: zoneName(draft.timezone) }) : null}
          error={tried && error === 'meetingTimeRequired' ? t(lang, error) : null}
        >
          {(ids) => <Input {...ids} type="time" value={draft.time} onChange={(e) => patch({ time: e.target.value })} className="meeting-form__short" />}
        </Field>

        <Chips label={t(lang, 'meetingDurationLabel')}>
          {DURATIONS.map((minutes) => (
            <Chip key={minutes} pressed={draft.duration === minutes} onClick={() => patch({ duration: minutes })}>{t(lang, 'minutesShort', { n: minutes })}</Chip>
          ))}
        </Chips>

        <Field label={t(lang, 'meetingNotesLabel')}>
          {(ids) => (
            <Textarea {...ids} rows={3} value={draft.notes} maxLength={MEETING_NOTES_MAX} onChange={(e) => patch({ notes: e.target.value })} placeholder={t(lang, 'meetingNotesPlaceholder')} />
          )}
        </Field>

        <p className="q-meta meeting-form__note"><Lock size={13} aria-hidden="true" /> {t(lang, 'meetingPrivacy')}</p>
        <p className="q-meta meeting-form__note"><Bell size={13} aria-hidden="true" /> {t(lang, 'meetingReminderNote')}</p>

        <div className="q-dialog__actions">
          <SecondaryButton onClick={onClose}>{t(lang, 'cancel')}</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : t(lang, 'save')}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
