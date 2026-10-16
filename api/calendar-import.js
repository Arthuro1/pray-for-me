// Fetches a calendar a member pasted the address of (an .ics or webcal:// link,
// Google's "secret address in iCal format", a published Outlook or Apple
// calendar) so the meeting form can read it: browsers may not read another
// site's calendar directly. The browser then parses it itself
// (src/lib/icsImport.js); this function only fetches.
//
// It must never become a way into anything private, so it:
//   • requires a valid Supabase session;
//   • fetches only https on the standard port, from addresses with no
//     credentials, following at most a few redirects, each checked again;
//   • refuses any host that resolves to a private, loopback, link-local or
//     otherwise reserved address — checked at connection time (the lookup the
//     socket uses), so a name cannot resolve one way and connect another;
//   • stops after a few seconds and a megabyte, and answers only when what came
//     back is an iCalendar file.
// A calendar address can be private: it arrives in the request body, and it is
// never logged or echoed back in an error.
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';

export const MAX_CALENDAR_BYTES = 1024 * 1024;
export const MAX_URL_LENGTH = 2048;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

export class CalendarImportError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

// ── Which addresses may be fetched ─────────────────────────────────────────

const ipv4Number = (ip) => ip.split('.').reduce((n, part) => n * 256 + Number(part), 0);

// [network, prefix length]: everything that is not the public internet.
const BLOCKED_V4 = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].map(([network, bits]) => [ipv4Number(network), bits]);

function isPublicV4(ip) {
  const n = ipv4Number(ip);
  return !BLOCKED_V4.some(([network, bits]) => Math.floor(n / 2 ** (32 - bits)) === Math.floor(network / 2 ** (32 - bits)));
}

// The eight 16-bit groups of an IPv6 address ("::" expanded, an embedded IPv4
// tail folded in).
function ipv6Groups(ip) {
  let text = ip.toLowerCase().split('%')[0];
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(text)?.[1];
  if (v4) {
    const n = ipv4Number(v4);
    text = text.slice(0, -v4.length) + `${Math.floor(n / 65536).toString(16)}:${(n % 65536).toString(16)}`;
  }
  const [head, tail = null] = text.split('::');
  const part = (s) => (s ? s.split(':').map((g) => parseInt(g, 16)) : []);
  const front = part(head);
  const back = tail === null ? [] : part(tail);
  return [...front, ...Array(8 - front.length - back.length).fill(0), ...back];
}

function isPublicV6(ip) {
  const g = ipv6Groups(ip);
  if (g.length !== 8 || g.some((n) => Number.isNaN(n))) return false;
  // An IPv4 address carried inside IPv6 (::ffff:a.b.c.d, ::a.b.c.d, 64:ff9b::a.b.c.d).
  const embeddedV4 = () => [g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255].join('.');
  if (g.slice(0, 5).every((n) => n === 0) && (g[5] === 0xffff || g[5] === 0)) return g[5] === 0 && g[6] === 0 && g[7] <= 1 ? false : isPublicV4(embeddedV4());
  if (g[0] === 0x64 && g[1] === 0xff9b) return isPublicV4(embeddedV4());
  if ((g[0] & 0xfe00) === 0xfc00) return false; // unique local
  if ((g[0] & 0xffc0) === 0xfe80) return false; // link-local
  if ((g[0] & 0xff00) === 0xff00) return false; // multicast
  if (g[0] === 0x2001 && (g[1] === 0x0db8 || g[1] === 0)) return false; // documentation, Teredo
  if (g[0] === 0x2002) return false; // 6to4, which carries an IPv4 address
  return (g[0] & 0xe000) === 0x2000; // global unicast only
}

export function isPublicAddress(ip) {
  const family = net.isIP(String(ip || ''));
  if (family === 4) return isPublicV4(ip);
  if (family === 6) return isPublicV6(ip);
  return false;
}

// The address to fetch, or null: https (webcal:// read as https) on the
// standard port, no user name or password.
export function calendarUrl(text) {
  const raw = String(text || '').trim().replace(/^webcals?:\/\//i, 'https://');
  if (!raw || raw.length > MAX_URL_LENGTH) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  if (url.port && url.port !== '443') return null;
  // A socket opened to an address literal skips the name lookup that guards
  // every other connection, and calendars live at names.
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, ''))) return null;
  url.hash = '';
  return url;
}

// The lookup every connection uses: the name resolves, then only public
// addresses are handed to the socket.
export function publicLookup(resolve = dns.lookup) {
  return (hostname, options, callback) => {
    resolve(hostname, { ...options, all: true }, (error, addresses) => {
      if (error) return callback(error);
      const list = Array.isArray(addresses) ? addresses : [{ address: addresses, family: net.isIP(addresses) }];
      if (!list.length || !list.every(({ address }) => isPublicAddress(address))) {
        return callback(Object.assign(new Error('blocked'), { code: 'EBLOCKED' }));
      }
      if (options?.all) return callback(null, list);
      return callback(null, list[0].address, list[0].family);
    });
  };
}

// ── Fetching ───────────────────────────────────────────────────────────────

function getOnce(url, lookup) {
  return new Promise((resolve, reject) => {
    const fail = (code, status) => reject(new CalendarImportError(code, status));
    const req = https.get(url, {
      lookup,
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': 'QetoretCalendarImport/1.0', Accept: 'text/calendar, text/plain;q=0.8, */*;q=0.1' },
    }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        resolve({ redirect: res.headers.location });
        return;
      }
      if (status !== 200) {
        res.resume();
        fail('unreachable', 502);
        return;
      }
      const chunks = [];
      let bytes = 0;
      res.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_CALENDAR_BYTES) {
          req.destroy();
          fail('too_large', 413);
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve({ text: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', () => fail('unreachable', 502));
    });
    const deadline = setTimeout(() => req.destroy(new Error('timeout')), TIMEOUT_MS);
    req.on('close', () => clearTimeout(deadline));
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => fail('unreachable', 502));
  });
}

export async function fetchCalendar(url, { lookup = publicLookup(), get = getOnce } = {}) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const result = await get(current, lookup);
    if (result.text !== undefined) {
      const text = result.text.replace(/^\uFEFF/, '');
      if (!/^\s*BEGIN:VCALENDAR/i.test(text)) throw new CalendarImportError('not_calendar', 422);
      return text;
    }
    let next;
    try {
      next = calendarUrl(new URL(result.redirect, current).href);
    } catch {
      next = null;
    }
    if (!next) throw new CalendarImportError('unreachable', 502);
    current = next;
  }
  throw new CalendarImportError('unreachable', 502);
}

// ── The request ────────────────────────────────────────────────────────────

async function signedIn(authorization, env, fetchImpl) {
  const token = typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return false;
  const base = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!base || !anon) return false;
  try {
    const check = await fetchImpl(`${base}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: anon } });
    return check.ok;
  } catch {
    return false;
  }
}

export async function handleCalendarImport(req, res, { env = process.env, fetchImpl = globalThis.fetch, readCalendar = fetchCalendar } = {}) {
  res.setHeader?.('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!(await signedIn(req.headers?.authorization, env, fetchImpl))) return res.status(401).json({ error: 'unauthorized' });
  const url = calendarUrl(req.body?.url);
  if (!url) return res.status(400).json({ error: 'invalid_url' });
  try {
    return res.status(200).json({ text: await readCalendar(url) });
  } catch (error) {
    const safe = error instanceof CalendarImportError ? error : new CalendarImportError('unreachable', 502);
    return res.status(safe.status).json({ error: safe.code });
  }
}

export default handleCalendarImport;
