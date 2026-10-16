// Where an imported prayer meeting comes from: a .ics file the person chose, or
// a link they pasted. The kinds of link:
//   • an "add to calendar" link from Google or Outlook carries the event in its
//     own address, so it is read here and nothing is requested;
//   • a calendar address (.ics, webcal://, Google's "secret address in iCal
//     format", a published Outlook or Apple calendar) is fetched by the app's
//     server (api/calendar-import.js), because a browser may not read another
//     site's calendar, and then read like a file;
//   • a calendar's page stands for its address: a Google embed or "add this
//     calendar" link names the calendar, whose public iCal address answers when
//     the calendar is public; a published Outlook page sits beside its .ics;
//   • an event's own page (calendar.google.com/calendar/event?eid=…) shows
//     nothing without signing in, and any other calendar page names no
//     calendar, so the person is pointed to the iCal address or the .ics file.
// A calendar address can be private: it is sent only to the app's own server,
// in a request body, and never logged, tracked or stored.
import { supabase } from './supabase';
import { eventFromProperties, looksLikeCalendar, readCalendar, upcomingCalendarEvents } from './icsImport';

export const MAX_CALENDAR_FILE_BYTES = 1024 * 1024;
// The most calendars one page may stand for (an embed can show several).
const MAX_CALENDARS = 5;

// The import's outcome as an i18n key, for the form to say what happened.
export const IMPORT_ERRORS = Object.freeze({
  unreadable: 'meetingImportUnreadable',
  none: 'meetingImportNone',
  eventPage: 'meetingImportEventPage',
  unreachable: 'meetingImportUnreachable',
  invalidLink: 'meetingImportInvalidLink',
  notIcal: 'meetingImportNotIcal',
});

class ImportError extends Error {
  constructor(key) {
    super(key);
    this.key = key;
  }
}

function parseUrl(text) {
  const raw = String(text || '').trim().replace(/^webcals?:\/\//i, 'https://');
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

const hostOf = (url) => url.hostname.toLowerCase().replace(/^www\./, '');
const isGoogleCalendar = (url) => ['calendar.google.com', 'google.com'].includes(hostOf(url)) && url.pathname.includes('/calendar');
const isOutlook = (url) => /(^|\.)outlook\.(live|office|office365)\.com$/.test(hostOf(url));

// Google: …/calendar/render?action=TEMPLATE&text=…&dates=20261020T180000Z/20261020T190000Z
// &details=…&location=…&ctz=Europe/Paris&recur=RRULE:FREQ=WEEKLY;BYDAY=TU
function googleTemplate(url) {
  const q = url.searchParams;
  const [start, end] = (q.get('dates') || '').split('/');
  if (!start) return null;
  const timed = (value) => ({ value, params: q.get('ctz') && !value.endsWith('Z') ? { TZID: q.get('ctz') } : {} });
  return {
    SUMMARY: { value: q.get('text') || '', params: {} },
    DESCRIPTION: { value: q.get('details') || '', params: {} },
    LOCATION: { value: q.get('location') || '', params: {} },
    DTSTART: timed(start),
    ...(end ? { DTEND: timed(end) } : {}),
    ...(q.get('recur')?.startsWith('RRULE:') ? { RRULE: { value: q.get('recur').slice(6), params: {} } } : {}),
  };
}

// "2026-10-20T18:00:00+02:00" → "20261020T160000Z"; without an offset the time
// stays as written (the member's own zone).
function outlookTime(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(String(text || '').trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, zone] = m;
  if (h === undefined) return { value: `${y}${mo}${d}`, params: { VALUE: 'DATE' } };
  if (!zone) return { value: `${y}${mo}${d}T${h}${mi}00`, params: {} };
  const iso = new Date(`${y}-${mo}-${d}T${h}:${mi}:00${zone === 'Z' ? 'Z' : zone.replace(/^([+-]\d{2})(\d{2})$/, '$1:$2')}`);
  if (Number.isNaN(iso.getTime())) return null;
  return { value: `${iso.toISOString().replace(/[-:]/g, '').slice(0, 13)}00Z`, params: {} };
}

// Outlook: …/calendar/0/deeplink/compose?subject=…&startdt=…&enddt=…&body=…&location=…
function outlookTemplate(url) {
  const q = url.searchParams;
  const start = outlookTime(q.get('startdt'));
  if (!start) return null;
  const end = outlookTime(q.get('enddt'));
  return {
    SUMMARY: { value: q.get('subject') || '', params: {} },
    DESCRIPTION: { value: q.get('body') || '', params: {} },
    LOCATION: { value: q.get('location') || '', params: {} },
    DTSTART: start,
    ...(end ? { DTEND: end } : {}),
  };
}

// The event an "add to calendar" link carries, or null for any other link.
export function templateLinkProperties(url) {
  if (isGoogleCalendar(url) && url.searchParams.has('dates')) return googleTemplate(url);
  if (isOutlook(url) && url.searchParams.has('startdt')) return outlookTemplate(url);
  return null;
}

// An event's page, which holds no details for anyone not signed in to it.
export function isEventPageLink(url) {
  if (hostOf(url) === 'calendar.app.google') return true;
  if (isGoogleCalendar(url)) return url.searchParams.has('eid') || /\/calendar\/(u\/\d+\/)?r\/event/.test(url.pathname);
  return isOutlook(url) && /\/calendar\/.*\/item\//.test(url.pathname);
}

// A calendar's id as a Google page carries it: plain ("…@group.calendar.google.com")
// or, in an "add this calendar" link, base64url-encoded (a "+" in it arrives as
// a space once the query is read).
function googleCalendarId(value) {
  const text = String(value || '').trim().replace(/ /g, '+');
  if (!text || text.includes('@')) return text || null;
  try {
    const decoded = atob(text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '='));
    return decoded.includes('@') ? decoded : null;
  } catch {
    return null;
  }
}

const googlePublicIcal = (id) => `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`;

// The calendar addresses a link stands for — { hrefs, derived }, `derived`
// when they were worked out from a page rather than pasted — or null for a
// calendar page that names no calendar.
export function calendarAddresses(url) {
  if (isGoogleCalendar(url)) {
    if (url.pathname.includes('/calendar/ical/')) return { hrefs: [url.href], derived: false };
    const ids = [...url.searchParams.getAll('src'), ...url.searchParams.getAll('cid')].map(googleCalendarId).filter(Boolean);
    return ids.length ? { hrefs: [...new Set(ids)].slice(0, MAX_CALENDARS).map(googlePublicIcal), derived: true } : null;
  }
  if (isOutlook(url)) {
    if (/\.ics$/i.test(url.pathname)) return { hrefs: [url.href], derived: false };
    if (!/\/owa\/calendar\/.+\.html$/i.test(url.pathname)) return null;
    const ics = new URL(url.href);
    ics.pathname = url.pathname.replace(/[^/]+\.html$/i, 'calendar.ics');
    return { hrefs: [ics.href], derived: true };
  }
  return { hrefs: [url.href], derived: false };
}

async function fetchCalendarText(href) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  let res;
  try {
    res = await fetch('/api/calendar-import', { method: 'POST', headers, body: JSON.stringify({ url: href }) });
  } catch {
    throw new ImportError(IMPORT_ERRORS.unreachable);
  }
  const body = await res.json().catch(() => null);
  if (res.ok && typeof body?.text === 'string') return body.text;
  if (body?.error === 'not_calendar') throw new ImportError(IMPORT_ERRORS.notIcal);
  if (body?.error === 'invalid_url') throw new ImportError(IMPORT_ERRORS.invalidLink);
  throw new ImportError(IMPORT_ERRORS.unreachable);
}

function upcomingIn(texts, context) {
  const events = readCalendar(texts, context);
  if (!events.length) throw new ImportError(IMPORT_ERRORS.none);
  return events;
}

// The calendars behind a link, read together. An address worked out from a
// page that does not answer means the calendar is not public, which
// "unreachable" says.
async function fetchCalendars({ hrefs, derived }) {
  const results = await Promise.allSettled(hrefs.map(fetchCalendarText));
  const texts = results.filter((r) => r.status === 'fulfilled' && looksLikeCalendar(r.value)).map((r) => r.value);
  if (texts.length) return texts;
  if (derived) throw new ImportError(IMPORT_ERRORS.unreachable);
  const failure = results.find((r) => r.status === 'rejected')?.reason;
  throw failure instanceof ImportError ? failure : new ImportError(IMPORT_ERRORS.notIcal);
}

// Each import resolves to { events } (upcoming, soonest first; see
// icsImport.upcomingCalendarEvents) or { error } (an i18n key). Anything
// unforeseen reads as the source's own failure: a file that can't be read, a
// link that can't be opened.
async function settle(work, fallback) {
  try {
    return { events: await work() };
  } catch (error) {
    return { error: error instanceof ImportError ? error.key : fallback };
  }
}

// context: { now, todayKey, timeZone } — the member's today and own zone.
export function importCalendarFile(file, context) {
  return settle(async () => {
    if (!file || file.size > MAX_CALENDAR_FILE_BYTES) throw new ImportError(IMPORT_ERRORS.unreadable);
    const text = await file.text();
    if (!looksLikeCalendar(text)) throw new ImportError(IMPORT_ERRORS.unreadable);
    return upcomingIn(text, context);
  }, IMPORT_ERRORS.unreadable);
}

export function importCalendarLink(text, context) {
  return settle(async () => {
    const url = parseUrl(text);
    if (!url) throw new ImportError(IMPORT_ERRORS.invalidLink);
    const template = templateLinkProperties(url);
    if (template) {
      const events = upcomingCalendarEvents([eventFromProperties(template, context.timeZone)], context);
      if (!events.length) throw new ImportError(IMPORT_ERRORS.none);
      return events;
    }
    if (isEventPageLink(url)) throw new ImportError(IMPORT_ERRORS.eventPage);
    const addresses = calendarAddresses(url);
    if (!addresses) throw new ImportError(IMPORT_ERRORS.notIcal);
    return upcomingIn(await fetchCalendars(addresses), context);
  }, IMPORT_ERRORS.unreachable);
}
