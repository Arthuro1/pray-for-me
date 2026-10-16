import { useId, useState } from 'react';
import { ArrowRight, Bell, CalendarCheck, CalendarClock, Loader2, Lock, MapPin, Video } from 'lucide-react';
import { t } from '../../i18n';
import { todayKey } from '../../lib/prayedLog';
import { weekdayName } from '../../lib/scheduleDraft';
import { deviceTimeZone, nextMeeting } from '../../lib/meetingTime';
import { meetingPlatform, placeMapUrl } from '../../lib/meetingLink';
import {
  DURATIONS, MEETING_NOTES_MAX, MEETING_TEXT_MAX, REPEATS,
  draftFromMeeting, durationBetween, durationLabel, endTimeOf, isPresetDuration, meetingDetails, meetingDraftError,
  newMeetingDraft, scheduleFromMeetingDraft,
} from '../../lib/meetingDraft';
import { Field, Input, PrimaryButton, SecondaryButton, Textarea } from '../../components/shared/Primitives';
import { Modal } from './GroupFriendModals';
import GroupMeetingCard from './GroupMeetingCard';
import MeetingImport from './MeetingImport';

// Schedule (or change) a group's "we pray together" time. The app supports the
// meeting; it isn't the meeting: it keeps the time, the place or the call link,
// and reminds everyone shortly before. The details are encrypted for the group.
//
// One calm form in the order people think of a meeting: its name, where (two
// tiles), when (a rhythm, its days, from when until when), a note — then the
// card the group will see, built from these answers as they are given. The
// actions stay in view at the foot of the dialog.
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

// A part of the meeting ("Where?", "When?"), set apart on its own ground.
function Section({ icon: Icon, tone, title, children }) {
  const titleId = useId();
  return (
    <section className="meeting-form__section" aria-labelledby={titleId}>
      <h3 id={titleId} className="meeting-form__section-title">
        <span className={`icon-tile icon-tile--sm ${tone}`} aria-hidden="true"><Icon size={14} strokeWidth={2} /></span>
        {title}
      </h3>
      {children}
    </section>
  );
}

// Online or in person: two tiles, each saying what it means.
function ModeChoice({ lang, value, onChange }) {
  const base = useId();
  const options = [
    { mode: 'online', icon: Video, tone: 'tone-indigo', label: t(lang, 'meetingOnline'), hint: t(lang, 'meetingLinkHint') },
    { mode: 'in_person', icon: MapPin, tone: 'tone-teal', label: t(lang, 'meetingInPerson'), hint: t(lang, 'meetingInPersonHint') },
  ];
  return (
    <div className="meeting-mode" role="group" aria-label={t(lang, 'meetingWhereLabel')}>
      {options.map(({ mode, icon: Icon, tone, label, hint }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          aria-label={label}
          aria-describedby={`${base}-${mode}`}
          onClick={() => onChange(mode)}
          className="meeting-mode__option pressable"
        >
          <span className={`icon-tile ${tone}`} aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
          <span className="meeting-mode__label">{label}</span>
          <span id={`${base}-${mode}`} className="meeting-mode__hint">{hint}</span>
        </button>
      ))}
    </div>
  );
}

// The days of a weekly meeting, one round button each, Monday first.
function WeekdayPicker({ lang, value, onToggle }) {
  const labelId = useId();
  return (
    <div className="q-field">
      <p id={labelId} className="q-field__label">{t(lang, 'meetingDaysLabel')}</p>
      <div className="meeting-days" role="group" aria-labelledby={labelId}>
        {WEEK_ORDER.map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={value.includes(day)}
            aria-label={weekdayName(lang, day)}
            onClick={() => onToggle(day)}
            className="meeting-days__day pressable"
          >
            {weekdayName(lang, day, 'short').replace(/\.$/, '')}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GroupMeetingForm({ lang, meeting, onSave, onClose }) {
  const formId = useId();
  const today = todayKey();
  const [draft, setDraft] = useState(() => (meeting ? draftFromMeeting(meeting, today) : newMeetingDraft(today, deviceTimeZone())));
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imported, setImported] = useState(false);
  const patch = (updates) => setDraft((d) => ({ ...d, ...updates }));
  const error = meetingDraftError(draft, today);
  const errorFor = (key) => (tried && error === key ? t(lang, key) : null);
  const platform = draft.mode === 'online' ? meetingPlatform(draft.link) : null;
  const mapUrl = draft.mode === 'in_person' ? placeMapUrl(draft.place) : null;
  const otherZone = draft.timezone !== deviceTimeZone();
  const endTime = endTimeOf(draft.time, draft.duration);
  const needsDate = draft.repeat === 'once' || draft.repeat === 'biweekly';

  // The card the group will see, once the answers make a meeting.
  const preview = error ? null : {
    id: 'preview',
    schedule: scheduleFromMeetingDraft(draft, today),
    start_time: draft.time,
    timezone: draft.timezone,
    duration_minutes: draft.duration,
    ...meetingDetails(draft),
  };

  const importEvent = (fields) => {
    patch(fields);
    setImported(true);
  };

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

  const actions = (
    <div className="q-dialog__actions">
      <SecondaryButton onClick={onClose}>{t(lang, 'cancel')}</SecondaryButton>
      <PrimaryButton type="submit" form={formId} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : t(lang, 'save')}
      </PrimaryButton>
    </div>
  );

  return (
    <Modal title={t(lang, meeting ? 'meetingFormTitleEdit' : 'meetingFormTitleNew')} lang={lang} onClose={onClose} footer={actions}>
      <form id={formId} onSubmit={submit} className="meeting-form" noValidate>
        <p className="meeting-form__intro">{t(lang, 'meetingIntro')}</p>

        {!meeting && <MeetingImport lang={lang} onImport={importEvent} />}
        {imported && (
          <p className="q-meta meeting-form__note" role="status"><CalendarCheck size={13} aria-hidden="true" /> {t(lang, 'meetingImported')}</p>
        )}

        <Field label={t(lang, 'meetingNameLabel')}>
          {(ids) => (
            <Input {...ids} value={draft.title} maxLength={MEETING_TEXT_MAX} onChange={(e) => patch({ title: e.target.value })} placeholder={t(lang, 'meetingNamePlaceholder')} autoComplete="off" className="q-input--editorial" />
          )}
        </Field>

        <Section icon={MapPin} tone="tone-teal" title={t(lang, 'meetingWhereLabel')}>
          <ModeChoice lang={lang} value={draft.mode} onChange={(mode) => patch({ mode })} />
          {draft.mode === 'online' ? (
            <Field label={t(lang, 'meetingLinkLabel')} hint={platform} error={errorFor('meetingLinkInvalid')}>
              {(ids) => (
                <Input {...ids} type="url" inputMode="url" value={draft.link} onChange={(e) => patch({ link: e.target.value })} placeholder="https://" autoComplete="off" spellCheck={false} />
              )}
            </Field>
          ) : (
            <Field label={t(lang, 'meetingPlaceLabel')} error={errorFor('meetingPlaceRequired')}>
              {(ids) => (
                <>
                  <Input {...ids} value={draft.place} maxLength={MEETING_TEXT_MAX} onChange={(e) => patch({ place: e.target.value })} placeholder={t(lang, 'meetingPlacePlaceholder')} autoComplete="off" />
                  {mapUrl && (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="meeting-form__map">
                      <MapPin size={13} aria-hidden="true" /> {t(lang, 'meetingOpenMap')}
                    </a>
                  )}
                </>
              )}
            </Field>
          )}
        </Section>

        <Section icon={CalendarClock} tone="tone-indigo" title={t(lang, 'meetingWhenLabel')}>
          <div className="q-chips" role="group" aria-label={t(lang, 'meetingWhenLabel')}>
            {REPEATS.map((repeat) => (
              <Chip key={repeat} pressed={draft.repeat === repeat} onClick={() => patch({ repeat })}>{t(lang, REPEAT_LABELS[repeat])}</Chip>
            ))}
          </div>

          {draft.repeat === 'weekly' && <WeekdayPicker lang={lang} value={draft.weekDays} onToggle={toggleDay} />}
          {errorFor('meetingDaysRequired') && <p className="q-field__hint q-field__hint--error" role="alert">{errorFor('meetingDaysRequired')}</p>}

          {needsDate && (
            <Field label={t(lang, draft.repeat === 'once' ? 'meetingDateLabel' : 'meetingFirstDateLabel')} error={errorFor('meetingDateRequired')}>
              {(ids) => <Input {...ids} type="date" min={today} value={draft.date} onChange={(e) => patch({ date: e.target.value })} />}
            </Field>
          )}

          {draft.repeat === 'monthly' && (
            <Field label={t(lang, 'meetingDayOfMonthLabel')} error={errorFor('meetingDayOfMonthInvalid')}>
              {(ids) => (
                <Input {...ids} type="number" inputMode="numeric" min={1} max={31} value={draft.dayOfMonth} onChange={(e) => patch({ dayOfMonth: e.target.value })} className="meeting-form__short" />
              )}
            </Field>
          )}

          {/* From when until when. Any length is its end time (a night of
              prayer ends the next morning); the chips are quick lengths. */}
          <div className="meeting-times">
            <Field label={t(lang, 'meetingTimeLabel')} error={errorFor('meetingTimeRequired')}>
              {(ids) => <Input {...ids} type="time" value={draft.time} onChange={(e) => patch({ time: e.target.value })} />}
            </Field>
            <ArrowRight size={16} aria-hidden="true" className="meeting-times__arrow rtl-mirror" />
            <Field label={t(lang, 'meetingEndLabel')} error={errorFor('meetingDurationInvalid')}>
              {(ids) => (
                <Input {...ids} type="time" value={endTime} onChange={(e) => patch({ duration: durationBetween(draft.time, e.target.value) })} />
              )}
            </Field>
          </div>
          <Chips label={t(lang, 'meetingDurationLabel')}>
            {DURATIONS.map((minutes) => (
              <Chip key={minutes} pressed={draft.duration === minutes} onClick={() => patch({ duration: minutes })}>
                {durationLabel(minutes, lang)}
              </Chip>
            ))}
            {draft.duration && !isPresetDuration(draft.duration) && (
              <span className="q-chip meeting-times__custom">{durationLabel(draft.duration, lang)}</span>
            )}
          </Chips>
          {otherZone && <p className="q-field__hint">{t(lang, 'meetingTimeZoneNote', { zone: zoneName(draft.timezone) })}</p>}
        </Section>

        <Field label={t(lang, 'meetingNotesLabel')}>
          {(ids) => (
            <Textarea {...ids} rows={3} value={draft.notes} maxLength={MEETING_NOTES_MAX} onChange={(e) => patch({ notes: e.target.value })} placeholder={t(lang, 'meetingNotesPlaceholder')} />
          )}
        </Field>

        {preview && (
          <div className="meeting-form__preview">
            <p className="section-label">{t(lang, 'meetingPreviewLabel')}</p>
            <ul className="together-list together-list--cards">
              <GroupMeetingCard meeting={preview} next={nextMeeting(preview)} lang={lang} preview />
            </ul>
          </div>
        )}

        <div className="meeting-form__notes">
          <p className="q-meta meeting-form__note"><Lock size={13} aria-hidden="true" /> {t(lang, 'meetingPrivacy')}</p>
          <p className="q-meta meeting-form__note"><Bell size={13} aria-hidden="true" /> {t(lang, 'meetingReminderNote')}</p>
        </div>
      </form>
    </Modal>
  );
}
