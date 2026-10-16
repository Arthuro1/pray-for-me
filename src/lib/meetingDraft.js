// The meeting form's state, kept apart from the component so it can be tested:
// what the person chose (a rhythm, days, a time, where) maps onto the very
// schedule shape the prayer engine already understands (lib/schedule.js), and
// back again when a meeting is edited. No second scheduling model.
import { parseKey } from './schedule';
import { safeMeetingUrl } from './meetingLink';

// The rhythms offered, most frequent first.
export const REPEATS = Object.freeze(['daily', 'weekly', 'biweekly', 'monthly', 'once']);
export const DURATIONS = Object.freeze([30, 45, 60, 90, 120]);
// Any other length is set by its end time, from a short gathering to a night of
// prayer. The database holds the same bounds (group_meetings_duration).
export const DURATION_MIN = 15;
export const DURATION_MAX = 720;
export const MEETING_TEXT_MAX = 80;
export const MEETING_NOTES_MAX = 500;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_MINUTES = 24 * 60;
const weekdayOf = (key) => parseKey(key).getDay();
const minutesOf = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const pad = (n) => String(n).padStart(2, '0');

export const isPresetDuration = (minutes) => DURATIONS.includes(minutes);

// "20:00" + 90 → "21:30"; past midnight it wraps ("21:00" + 480 → "05:00").
export function endTimeOf(start, duration) {
  if (!TIME_RE.test(start || '') || !Number.isInteger(duration)) return '';
  const end = (minutesOf(start) + duration) % DAY_MINUTES;
  return `${pad(Math.floor(end / 60))}:${pad(end % 60)}`;
}

// Minutes from a start to an end time; an end at or before the start is read as
// the next morning, the way a night of prayer is written ("21:00 → 05:00").
export function durationBetween(start, end) {
  if (!TIME_RE.test(start || '') || !TIME_RE.test(end || '')) return null;
  const diff = (minutesOf(end) - minutesOf(start) + DAY_MINUTES) % DAY_MINUTES;
  return diff === 0 ? DAY_MINUTES : diff;
}

// "45 min", "2 h", "8 h 30 min", in the reader's language.
export function durationLabel(minutes, lang) {
  const unit = (n, unitName) => new Intl.NumberFormat(lang, { style: 'unit', unit: unitName, unitDisplay: 'short' }).format(n);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return unit(rest, 'minute');
  return rest ? `${unit(hours, 'hour')} ${unit(rest, 'minute')}` : unit(hours, 'hour');
}

export function newMeetingDraft(todayKey, timezone) {
  return {
    title: '',
    mode: 'online',
    link: '',
    place: '',
    notes: '',
    repeat: 'weekly',
    weekDays: [weekdayOf(todayKey)],
    date: todayKey,
    dayOfMonth: parseKey(todayKey).getDate(),
    time: '20:00',
    duration: 60,
    timezone,
  };
}

// A saved meeting (decrypted) back into the form.
export function draftFromMeeting(meeting, todayKey) {
  const s = meeting.schedule || {};
  const draft = {
    ...newMeetingDraft(todayKey, meeting.timezone),
    title: meeting.title || '',
    mode: meeting.mode === 'in_person' ? 'in_person' : 'online',
    link: meeting.link || '',
    place: meeting.place || '',
    notes: meeting.notes || '',
    time: (meeting.start_time || '20:00').slice(0, 5),
    duration: meeting.duration_minutes || 60,
  };
  if (s.type === 'once') return { ...draft, repeat: 'once', date: s.date };
  if (s.freq === 'daily') return { ...draft, repeat: 'daily', date: s.startDate };
  if (s.freq === 'interval') return { ...draft, repeat: 'biweekly', date: s.startDate };
  if (s.freq === 'monthly') return { ...draft, repeat: 'monthly', dayOfMonth: s.dayOfMonth || 1, date: s.startDate };
  return { ...draft, repeat: 'weekly', weekDays: s.weekDays?.length ? [...s.weekDays] : draft.weekDays, date: s.startDate };
}

// The engine's schedule for the draft. Recurring meetings start on the chosen
// date (or today), so a past occurrence is never invented.
export function scheduleFromMeetingDraft(d, todayKey) {
  const startDate = d.date && d.date > todayKey ? d.date : todayKey;
  switch (d.repeat) {
    case 'once':
      return { type: 'once', date: d.date };
    case 'daily':
      return { type: 'recurring', freq: 'daily', startDate };
    case 'biweekly':
      // Every second week on the first meeting's weekday.
      return { type: 'recurring', freq: 'interval', interval: 14, startDate: d.date || todayKey };
    case 'monthly':
      return { type: 'recurring', freq: 'monthly', dayOfMonth: Number(d.dayOfMonth), startDate };
    default:
      return { type: 'recurring', freq: 'weekly', weekDays: [...d.weekDays].sort((a, b) => a - b), startDate };
  }
}

// The first problem with the draft as an i18n key, or null when it can be saved.
export function meetingDraftError(d, todayKey) {
  if (d.mode === 'online' && !safeMeetingUrl(d.link)) return 'meetingLinkInvalid';
  if (d.mode === 'in_person' && !d.place.trim()) return 'meetingPlaceRequired';
  if (d.repeat === 'weekly' && d.weekDays.length === 0) return 'meetingDaysRequired';
  if ((d.repeat === 'once' || d.repeat === 'biweekly') && (!d.date || d.date < todayKey)) return 'meetingDateRequired';
  if (d.repeat === 'monthly') {
    const day = Number(d.dayOfMonth);
    if (!Number.isInteger(day) || day < 1 || day > 31) return 'meetingDayOfMonthInvalid';
  }
  if (!TIME_RE.test(d.time)) return 'meetingTimeRequired';
  if (!Number.isInteger(d.duration) || d.duration < DURATION_MIN || d.duration > DURATION_MAX) return 'meetingDurationInvalid';
  return null;
}

// What is encrypted: only the fields that belong to the chosen place.
export function meetingDetails(d) {
  const online = d.mode === 'online';
  return {
    title: d.title.trim().slice(0, MEETING_TEXT_MAX),
    mode: online ? 'online' : 'in_person',
    link: online ? safeMeetingUrl(d.link) : '',
    place: online ? '' : d.place.trim().slice(0, MEETING_TEXT_MAX),
    notes: d.notes.trim().slice(0, MEETING_NOTES_MAX),
  };
}
