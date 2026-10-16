// Reading a calendar event (iCalendar, RFC 5545) into the meeting form, so a
// prayer meeting a member already keeps in Google, Outlook or Apple Calendar
// fills the form instead of being typed again. Pure: the text comes from a
// chosen .ics file or a calendar link (lib/calendarImport.js), and nothing here
// touches the network. Only what the form holds is kept: a title, where, when,
// how long, how often and a note. The person checks it and saves as usual.
import { addDays, diffDays, parseKey } from './schedule';
import { dayKeyIn, isValidTimeZone, nextMeeting, zonedInstant } from './meetingTime';
import { meetingPlatform, safeMeetingUrl } from './meetingLink';
import {
  DURATION_MAX, DURATION_MIN, MEETING_NOTES_MAX, MEETING_TEXT_MAX, newMeetingDraft, scheduleFromMeetingDraft,
} from './meetingDraft';

// How many upcoming events a calendar offers to choose from.
export const MAX_IMPORT_CHOICES = 20;

const WEEKDAYS = Object.freeze({ SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 });

// Outlook names its zones the Windows way; the zones most members live in.
const WINDOWS_ZONES = Object.freeze({
  'UTC': 'UTC',
  'GMT Standard Time': 'Europe/London',
  'Greenwich Standard Time': 'Atlantic/Reykjavik',
  'W. Europe Standard Time': 'Europe/Berlin',
  'Romance Standard Time': 'Europe/Paris',
  'Central Europe Standard Time': 'Europe/Budapest',
  'Central European Standard Time': 'Europe/Warsaw',
  'E. Europe Standard Time': 'Europe/Chisinau',
  'FLE Standard Time': 'Europe/Kiev',
  'GTB Standard Time': 'Europe/Bucharest',
  'Russian Standard Time': 'Europe/Moscow',
  'W. Central Africa Standard Time': 'Africa/Lagos',
  'South Africa Standard Time': 'Africa/Johannesburg',
  'E. Africa Standard Time': 'Africa/Nairobi',
  'Egypt Standard Time': 'Africa/Cairo',
  'Morocco Standard Time': 'Africa/Casablanca',
  'Arab Standard Time': 'Asia/Riyadh',
  'Arabian Standard Time': 'Asia/Dubai',
  'Iran Standard Time': 'Asia/Tehran',
  'India Standard Time': 'Asia/Kolkata',
  'SE Asia Standard Time': 'Asia/Bangkok',
  'Singapore Standard Time': 'Asia/Singapore',
  'China Standard Time': 'Asia/Shanghai',
  'Tokyo Standard Time': 'Asia/Tokyo',
  'Korea Standard Time': 'Asia/Seoul',
  'AUS Eastern Standard Time': 'Australia/Sydney',
  'Eastern Standard Time': 'America/New_York',
  'Central Standard Time': 'America/Chicago',
  'Mountain Standard Time': 'America/Denver',
  'Pacific Standard Time': 'America/Los_Angeles',
  'E. South America Standard Time': 'America/Sao_Paulo',
  'SA Pacific Standard Time': 'America/Bogota',
});

// ── Reading the text ─────────────────────────────────────────────────────

// Long lines are folded: a line break followed by a space or a tab continues it.
const unfold = (text) => String(text || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '');

// "DTSTART;TZID=Europe/Paris:20261020T200000" → { name, params, value }. The
// value starts at the first colon outside a quoted parameter.
function parseLine(line) {
  let quoted = false;
  let at = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') quoted = !quoted;
    else if (line[i] === ':' && !quoted) { at = i; break; }
  }
  if (at <= 0) return null;
  const [name, ...rawParams] = line.slice(0, at).split(';');
  const params = {};
  for (const param of rawParams) {
    const eq = param.indexOf('=');
    if (eq > 0) params[param.slice(0, eq).toUpperCase()] = param.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), params, value: line.slice(at + 1) };
}

// Each VEVENT's own properties, by name (the first of each kind). Components
// nested inside an event (an alarm) are skipped.
export function parseIcsEvents(text) {
  const events = [];
  let current = null;
  let nested = 0;
  for (const line of unfold(text).split('\n')) {
    const prop = parseLine(line.trimEnd());
    if (!prop) continue;
    const component = prop.value.trim().toUpperCase();
    if (prop.name === 'BEGIN') {
      if (current) nested++;
      else if (component === 'VEVENT') current = {};
    } else if (prop.name === 'END') {
      if (current && nested) nested--;
      else if (current && component === 'VEVENT') { events.push(current); current = null; }
    } else if (current && !nested && !(prop.name in current)) {
      current[prop.name] = prop;
    }
  }
  return events;
}

export const looksLikeCalendar = (text) => /^\s*BEGIN:VCALENDAR/i.test(String(text || '').replace(/^\uFEFF/, ''));

// ── Values ───────────────────────────────────────────────────────────────

const unescapeText = (value) => String(value || '').replace(/\\([\\;,nN])/g, (_, c) => (c === 'n' || c === 'N' ? '\n' : c));

const ENTITIES = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" });

// A description may arrive as HTML; only its words are kept.
function plainText(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, name) => ENTITIES[name]);
}

// The join instructions Google Meet and Microsoft Teams append to an invitation
// (the link is read from them first) are not part of the meeting's note.
const stripJoinBlocks = (text) => text
  .replace(/-::~[:~]*::-[\s\S]*?(-::~[:~]*::-|$)/g, '')
  .replace(/_{20,}[\s\S]*?(_{20,}|$)/g, '');

function cleanNotes(raw) {
  return stripJoinBlocks(plainText(unescapeText(raw)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MEETING_NOTES_MAX);
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

// The call to join, if the event has one: a conference the calendar attached,
// an address in its location, or a known meeting service named in its words.
function meetingLinkOf(props, location, description) {
  const attached = [props['X-GOOGLE-CONFERENCE'], props['X-MICROSOFT-SKYPETEAMSMEETINGURL'], props['X-MICROSOFT-ONLINEMEETINGCONFLINK']]
    .map((prop) => safeMeetingUrl(prop?.value))
    .find(Boolean);
  if (attached) return attached;
  if (/^https?:\/\//i.test(location)) return safeMeetingUrl(location);
  const candidates = [props.URL?.value, ...(`${location}\n${description}`.match(URL_RE) || [])];
  return candidates.map((text) => (meetingPlatform(text) ? safeMeetingUrl(text) : null)).find(Boolean) || null;
}

// A zone a calendar names: an IANA zone, a Windows one, or an IANA name behind
// a vendor prefix ("/mozilla.org/20050126_1/Europe/Paris").
export function resolveZone(tzid) {
  const name = String(tzid || '').trim();
  if (!name) return null;
  if (isValidTimeZone(name)) return name;
  if (WINDOWS_ZONES[name]) return WINDOWS_ZONES[name];
  const tail = /([A-Za-z_]+\/[A-Za-z_+-]+(?:\/[A-Za-z_+-]+)?)$/.exec(name)?.[1];
  return tail && isValidTimeZone(tail) ? tail : null;
}

const pad = (n) => String(n).padStart(2, '0');

function wallTimeIn(instant, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' })
    .formatToParts(instant).map((part) => [part.type, part.value]));
  return `${pad(Number(parts.hour) % 24)}:${parts.minute}`;
}

// A DTSTART/DTEND value as a wall-clock day and time in a zone, plus the
// instant it names. A UTC or floating time is read in the member's own zone.
function readDateTime(prop, fallbackZone) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(prop?.value || '').trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, , utc] = m;
  const day = `${y}-${mo}-${d}`;
  if (h === undefined || prop.params.VALUE === 'DATE') return { day, time: null, timezone: fallbackZone, allDay: true, instant: Date.UTC(+y, mo - 1, +d) };
  if (utc) {
    const instant = new Date(Date.UTC(+y, mo - 1, +d, +h, +mi));
    return { day: dayKeyIn(instant, fallbackZone), time: wallTimeIn(instant, fallbackZone), timezone: fallbackZone, allDay: false, utcDay: day, instant: instant.getTime() };
  }
  const timezone = resolveZone(prop.params.TZID) || fallbackZone;
  const time = `${h}:${mi}`;
  return { day, time, timezone, allDay: false, instant: zonedInstant(day, time, timezone).getTime() };
}

// "PT1H30M" → 90, "P1D" → 1440.
function durationMinutes(value) {
  const m = /^[+]?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:\d+S)?)?$/.exec(String(value || '').trim());
  if (!m) return null;
  const [, w = 0, d = 0, h = 0, mi = 0] = m;
  return ((+w * 7 + +d) * 24 + +h) * 60 + +mi;
}

// "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;UNTIL=20261231T000000Z" → its parts. A
// weekday counted within a month ("1SU", first Sunday) has no form here and
// reads as that month's date, which the person sees and can correct.
function readRule(value) {
  if (!value) return null;
  const parts = Object.fromEntries(String(value).split(';').map((pair) => pair.split('=')).filter(([k, v]) => k && v)
    .map(([k, v]) => [k.toUpperCase(), v.toUpperCase()]));
  if (!parts.FREQ) return null;
  const byDay = (parts.BYDAY || '').split(',').map((code) => WEEKDAYS[code.replace(/^[+-]?\d+/, '')]).filter((day) => day !== undefined);
  const until = /^(\d{4})(\d{2})(\d{2})/.exec(parts.UNTIL || '');
  return {
    freq: parts.FREQ,
    interval: Math.max(1, Number(parts.INTERVAL) || 1),
    byDay: [...new Set(byDay)],
    byMonthDay: Number(String(parts.BYMONTHDAY || '').split(',')[0]) || null,
    until: until ? `${until[1]}-${until[2]}-${until[3]}` : null,
  };
}

// One event's properties → what the form can hold. `null` for an event that
// is not a meeting to import: cancelled, an exception inside a series (the
// series itself is imported), or one without a readable start.
export function eventFromProperties(props, fallbackZone) {
  if (props.STATUS?.value?.toUpperCase() === 'CANCELLED' || props['RECURRENCE-ID']) return null;
  const start = readDateTime(props.DTSTART, fallbackZone);
  if (!start) return null;
  const end = readDateTime(props.DTEND, start.timezone);
  const duration = props.DURATION
    ? durationMinutes(props.DURATION.value)
    : (end ? Math.round((end.instant - start.instant) / 60_000) : null);
  const location = plainText(unescapeText(props.LOCATION?.value)).trim();
  const description = plainText(unescapeText(props.DESCRIPTION?.value));
  const link = meetingLinkOf(props, location, description);
  const rule = readRule(props.RRULE?.value);
  // A UTC start can fall on another day where the member lives; the weekdays
  // and the date of the month move with it.
  const shift = start.utcDay ? diffDays(start.utcDay, start.day) : 0;
  if (rule && shift) {
    rule.byDay = rule.byDay.map((day) => (day + shift + 7) % 7);
    if (rule.byMonthDay) rule.byMonthDay = Math.min(31, Math.max(1, rule.byMonthDay + shift));
  }
  return {
    title: unescapeText(props.SUMMARY?.value).replace(/^🙏\s*/u, '').trim().slice(0, MEETING_TEXT_MAX),
    notes: cleanNotes(props.DESCRIPTION?.value),
    link,
    place: link ? '' : location.slice(0, MEETING_TEXT_MAX),
    day: start.day,
    time: start.time,
    timezone: start.timezone,
    duration: start.allDay ? null : duration,
    rule,
  };
}

// ── Into the form ────────────────────────────────────────────────────────

// The first day of an every-other-week rhythm that is not in the past.
function alignForward(day, step, todayKey) {
  if (day >= todayKey) return day;
  return addDays(day, Math.ceil(diffDays(day, todayKey) / step) * step);
}

// The event's next anniversary, for a yearly rule the form cannot repeat.
function nextAnniversary(day, todayKey) {
  const year = Number(todayKey.slice(0, 4));
  const thisYear = `${year}${day.slice(4)}`;
  return thisYear >= todayKey ? thisYear : `${year + 1}${day.slice(4)}`;
}

function repeatOf({ day, rule }, todayKey) {
  if (!rule) return { repeat: 'once', date: day };
  const { freq, interval, byDay, byMonthDay } = rule;
  if (freq === 'DAILY' && interval !== 7 && interval !== 14) return { repeat: 'daily', date: day };
  if ((freq === 'WEEKLY' && interval === 2) || (freq === 'DAILY' && interval === 14)) {
    return { repeat: 'biweekly', date: alignForward(day, 14, todayKey) };
  }
  if (freq === 'WEEKLY' || freq === 'DAILY') {
    return { repeat: 'weekly', weekDays: byDay.length ? byDay : [parseKey(day).getDay()], date: day };
  }
  if (freq === 'MONTHLY') return { repeat: 'monthly', dayOfMonth: byMonthDay > 0 ? byMonthDay : parseKey(day).getDate(), date: day };
  return { repeat: 'once', date: nextAnniversary(day, todayKey) };
}

// The form fields an event fills. Anything it doesn't say keeps what the form
// already holds.
export function eventToDraft(event, todayKey) {
  const fields = { title: event.title, notes: event.notes, timezone: event.timezone, ...repeatOf(event, todayKey) };
  if (event.link) Object.assign(fields, { mode: 'online', link: event.link });
  else if (event.place) Object.assign(fields, { mode: 'in_person', place: event.place });
  if (event.time) fields.time = event.time;
  if (event.duration >= DURATION_MIN && event.duration <= DURATION_MAX) fields.duration = event.duration;
  return fields;
}

// The events of a calendar that still lie ahead, soonest first, each with the
// form fields it fills and when it next takes place.
export function upcomingCalendarEvents(events, { now = new Date(), todayKey }) {
  return events
    .filter((event) => event && !(event.rule?.until && event.rule.until < todayKey))
    .map((event) => {
      const fields = eventToDraft(event, todayKey);
      const draft = { ...newMeetingDraft(todayKey, event.timezone), ...fields };
      const schedule = scheduleFromMeetingDraft(draft, todayKey);
      const next = nextMeeting({ schedule, start_time: draft.time, timezone: draft.timezone, duration_minutes: draft.duration }, now);
      return { fields, schedule, next };
    })
    .filter(({ next }) => next)
    .sort((a, b) => a.next.start - b.next.start)
    .slice(0, MAX_IMPORT_CHOICES);
}

// A calendar file, or several read together (a page that shows more than one
// calendar) → their upcoming events (see upcomingCalendarEvents).
export function readCalendar(texts, { now = new Date(), todayKey, timeZone }) {
  const events = [texts].flat().flatMap((text) => parseIcsEvents(text).map((props) => eventFromProperties(props, timeZone)));
  return upcomingCalendarEvents(events, { now, todayKey });
}
