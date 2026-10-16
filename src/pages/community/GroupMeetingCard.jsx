import { CalendarPlus, ExternalLink, Lock, MapPin, Pencil, Trash2, Video } from 'lucide-react';
import { t } from '../../i18n';
import { scheduleSummary } from '../../lib/scheduleDraft';
import { deviceTimeZone } from '../../lib/meetingTime';
import { meetingPlatform, placeMapUrl, safeMeetingUrl } from '../../lib/meetingLink';
import { buildMeetingICS } from '../../utils/ics';
import { FILE_PREFIX } from '../../lib/brand';
import { StatusLabel } from '../../components/shared/Primitives';
import OverflowMenu from '../../components/shared/OverflowMenu';

// One of the group's prayer meetings: what and when (the next time in the
// reader's own timezone, and the group's time when it differs), where — a call
// link to join, or the place to meet — and a way to keep it in one's calendar.
// Joining opens the call in its own tab; nothing about it is recorded.
const JOIN_SOON_MS = 15 * 60_000;

const zoneName = (timeZone) => timeZone.split('/').pop().replace(/_/g, ' ');

function timeIn(date, lang, timeZone) {
  return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZone });
}

function downloadCalendar(meeting, title) {
  const ics = buildMeetingICS(meeting, { title, place: meeting.place, link: safeMeetingUrl(meeting.link), notes: meeting.notes });
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${FILE_PREFIX}-prayer-meeting.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

// The place to meet, opening in Google Maps (lib/meetingLink.js).
function MeetingPlace({ place, lang }) {
  const href = placeMapUrl(place);
  if (!href) return <span className="together-row__meta">{place}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="together-row__meta meeting-card__place"
      aria-label={t(lang, 'meetingOpenMapFor', { place })}
    >
      <MapPin size={12} aria-hidden="true" />
      <span>{place}</span>
    </a>
  );
}

// `preview`: the meeting form showing the card its answers make — the join
// link works (a way to test it), the menu is left out.
export default function GroupMeetingCard({ meeting, next, lang, canManage = false, onEdit, onEnd, preview = false, now = new Date() }) {
  const locked = !!meeting._locked;
  const online = meeting.mode !== 'in_person';
  const title = (!locked && meeting.title) || t(lang, 'meetingDefaultTitle');
  const link = !locked && online ? safeMeetingUrl(meeting.link) : null;
  const platform = link ? meetingPlatform(link) : null;
  const joinSoon = !!next && (next.live || next.start - now <= JOIN_SOON_MS);
  const viewerZone = deviceTimeZone();
  const groupTime = next && meeting.timezone !== viewerZone
    && timeIn(next.start, lang, meeting.timezone) !== timeIn(next.start, lang, viewerZone)
    ? t(lang, 'meetingGroupTime', { time: timeIn(next.start, lang, meeting.timezone), zone: zoneName(meeting.timezone) })
    : null;
  const when = next && next.start.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });

  const menuItems = [];
  if (!preview && !locked && next) {
    menuItems.push({ key: 'calendar', icon: CalendarPlus, label: t(lang, 'meetingAddToCalendar'), onClick: () => downloadCalendar(meeting, title) });
  }
  if (canManage && !locked) menuItems.push({ key: 'edit', icon: Pencil, label: t(lang, 'edit'), onClick: onEdit });
  if (canManage) menuItems.push({ key: 'end', icon: Trash2, label: t(lang, 'meetingEnd'), danger: true, onClick: onEnd });

  return (
    <li className="together-row q-card meeting-card">
      <span className={`icon-tile ${online ? 'tone-indigo' : 'tone-teal'}`} aria-hidden="true">
        {online ? <Video size={18} strokeWidth={1.8} /> : <MapPin size={18} strokeWidth={1.8} />}
      </span>
      <span className="together-row__body">
        <span className="together-row__name together-row__name--editorial">{title}</span>
        <span className="together-row__meta">
          {scheduleSummary(meeting.schedule, lang)}
          {next && <> · {timeIn(next.start, lang)}–{timeIn(next.end, lang)}</>}
        </span>
        {next ? (
          <span className="together-row__meta">
            {next.live ? (
              <StatusLabel tone="royal">{t(lang, 'meetingLive')}</StatusLabel>
            ) : (
              t(lang, 'meetingNext', { when })
            )}
            {groupTime && <> · {groupTime}</>}
          </span>
        ) : (
          <span className="together-row__meta">{t(lang, 'meetingOver')}</span>
        )}
        {locked ? (
          <span className="together-row__meta meeting-card__locked"><Lock size={12} aria-hidden="true" /> {t(lang, 'meetingLocked')}</span>
        ) : online ? (
          <span className="together-row__meta">{platform || t(lang, 'meetingOnline')}</span>
        ) : (
          <MeetingPlace place={meeting.place} lang={lang} />
        )}
        {!locked && meeting.notes && <span className="meeting-card__notes">{meeting.notes}</span>}
      </span>
      <span className="together-row__actions">
        {link && next && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`${joinSoon ? 'primary-button' : 'secondary-button'} pressable meeting-card__join`}
            aria-label={platform ? t(lang, 'meetingJoinOn', { platform }) : t(lang, 'meetingJoin')}
          >
            <ExternalLink size={16} aria-hidden="true" />
            <span>{t(lang, 'meetingJoin')}</span>
          </a>
        )}
        {menuItems.length > 0 && (
          <OverflowMenu lang={lang} ariaLabel={title} items={menuItems} triggerClassName="icon-button pressable shrink-0" />
        )}
      </span>
    </li>
  );
}
