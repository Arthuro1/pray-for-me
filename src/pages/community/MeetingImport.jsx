import { useId, useRef, useState } from 'react';
import { CalendarArrowDown, ChevronDown, FileUp, Loader2 } from 'lucide-react';
import { t } from '../../i18n';
import { todayKey } from '../../lib/prayedLog';
import { deviceTimeZone } from '../../lib/meetingTime';
import { scheduleSummary } from '../../lib/scheduleDraft';
import { importCalendarFile, importCalendarLink } from '../../lib/calendarImport';
import { Input, SecondaryButton } from '../../components/shared/Primitives';

// "Import from a calendar", folded at the top of the meeting form: a .ics file
// or a calendar link fills the form, which the person then checks and saves as
// usual. A calendar with several upcoming events asks which one this is.
function EventChoice({ event, lang, onChoose }) {
  const { fields, schedule, next } = event;
  const when = next.start.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const time = next.start.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  return (
    <li>
      <button type="button" onClick={() => onChoose(fields)} className="meeting-import__choice pressable">
        <span className="meeting-import__choice-title">{fields.title || t(lang, 'meetingDefaultTitle')}</span>
        <span className="q-meta">{when} · {time}</span>
        {schedule.type === 'recurring' && <span className="q-meta">{scheduleSummary(schedule, lang)}</span>}
      </button>
    </li>
  );
}

export default function MeetingImport({ lang, onImport }) {
  const panelId = useId();
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [choices, setChoices] = useState([]);

  const apply = (fields) => {
    onImport(fields);
    setOpen(false);
    setChoices([]);
    setLink('');
  };

  const settle = async (work) => {
    setBusy(true);
    setError(null);
    setChoices([]);
    const result = await work({ now: new Date(), todayKey: todayKey(), timeZone: deviceTimeZone() });
    setBusy(false);
    if (result.error) setError(result.error);
    else if (result.events.length === 1) apply(result.events[0].fields);
    else setChoices(result.events);
  };

  const chooseFile = (event) => {
    const [file] = event.target.files || [];
    event.target.value = '';
    if (file) settle((context) => importCalendarFile(file, context));
  };

  const importLink = () => {
    if (link.trim() && !busy) settle((context) => importCalendarLink(link, context));
  };

  return (
    <div className="meeting-import">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="meeting-import__toggle pressable"
      >
        <CalendarArrowDown size={16} aria-hidden="true" />
        <span>{t(lang, 'meetingImport')}</span>
        <ChevronDown size={16} aria-hidden="true" className="meeting-import__chevron" />
      </button>

      {open && (
        <div id={panelId} className="meeting-import__panel">
          <p className="q-field__hint">{t(lang, 'meetingImportHint')}</p>
          <div>
            <SecondaryButton icon={FileUp} iconSize={16} onClick={() => fileRef.current?.click()} disabled={busy}>
              {t(lang, 'meetingImportFile')}
            </SecondaryButton>
            <input ref={fileRef} type="file" accept=".ics,text/calendar" hidden onChange={chooseFile} />
          </div>
          <div className="q-field">
            <label htmlFor={`${panelId}-link`} className="q-field__label">{t(lang, 'meetingImportLinkLabel')}</label>
            <div className="meeting-import__link">
              <Input
                id={`${panelId}-link`}
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                // Enter imports the link; it never submits the meeting form around it.
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); importLink(); } }}
                placeholder="https://"
                autoComplete="off"
                spellCheck={false}
              />
              <SecondaryButton onClick={importLink} disabled={busy || !link.trim()}>
                {busy ? <Loader2 size={14} className="animate-spin" aria-label={t(lang, 'meetingImportBusy')} /> : t(lang, 'meetingImportLinkCta')}
              </SecondaryButton>
            </div>
          </div>
          {error && <p className="q-field__hint q-field__hint--error" role="alert">{t(lang, error)}</p>}
          {choices.length > 0 && (
            <div className="q-field">
              <p className="q-field__label">{t(lang, 'meetingImportChoose')}</p>
              <ul className="meeting-import__choices">
                {choices.map((event) => (
                  <EventChoice key={`${event.fields.title}-${event.next.start.getTime()}`} event={event} lang={lang} onChoose={apply} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
