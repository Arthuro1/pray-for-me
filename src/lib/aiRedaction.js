// Browser-side sensitive-data filtering, applied to prayer text BEFORE it is sent
// to the AI gateway. It replaces high-confidence sensitive tokens (emails, phone
// numbers, identifiable street addresses, API keys / bearer tokens, password-like
// secrets, and URLs carrying sensitive query parameters) with stable placeholders
// like [EMAIL_1]. The placeholder→original map is kept ONLY in browser memory for
// the duration of the request, and `restore` puts values back where appropriate.
//
// Ordinary people's NAMES are never redacted — names are usually the point of a
// prayer, and prayer content is bound for the owner's own local AI.

// Ordered so more specific patterns run first (a token inside a URL is caught by
// the URL rule, etc.). Each rule has a type label used for the placeholder.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// URLs whose query string contains a sensitive-looking parameter.
const SENSITIVE_URL =
  /https?:\/\/[^\s]+\?[^\s]*\b(?:token|key|secret|password|pwd|auth|session|access[_-]?token|api[_-]?key|sig|signature)\b[^\s]*/gi;

// Provider-style API keys and common secret prefixes.
const API_KEY = /\b(?:sk|pk|rk|api)[-_][A-Za-z0-9]{16,}\b|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{20,}\b/g;

// Bearer / "password: value" style secrets.
const LABELLED_SECRET = /\b(?:bearer|password|passwd|pwd|secret|api[_-]?key)\b\s*[:=]?\s*([A-Za-z0-9._~+/=-]{6,})/gi;

// A high-entropy token: 32+ chars from a base64/hex-ish alphabet, containing a
// digit and mixed case — very unlikely to be natural-language text.
const HIGH_ENTROPY = /\b(?=[A-Za-z0-9+/_=-]*\d)(?=[A-Za-z0-9+/_=-]*[a-z])(?=[A-Za-z0-9+/_=-]*[A-Z])[A-Za-z0-9+/_=-]{32,}\b/g;

// Street address: a house number followed by words ending in a street-type token.
const STREET_TYPES = 'street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl|terrace|ter|square|sq';
const ADDRESS = new RegExp(`\\b\\d{1,5}\\s+(?:[A-Za-z0-9.'-]+\\s+){0,4}(?:${STREET_TYPES})\\b\\.?`, 'gi');

// Phone: a run with 7–15 digits and phone-ish separators. We validate the digit
// count so verse ranges ("4:6-7") and years never match.
const PHONE_CANDIDATE = /\+?\d[\d\s().-]{5,}\d/g;

const RULES = [
  { type: 'EMAIL', re: EMAIL },
  { type: 'URL', re: SENSITIVE_URL },
  { type: 'SECRET', re: API_KEY },
  { type: 'SECRET', re: LABELLED_SECRET },
  { type: 'SECRET', re: HIGH_ENTROPY },
  { type: 'ADDRESS', re: ADDRESS },
];

function digitCount(s) {
  let n = 0;
  for (const ch of s) if (ch >= '0' && ch <= '9') n += 1;
  return n;
}

// Redact a batch of strings, sharing placeholder numbering so an identical value
// in two strings maps to the SAME placeholder (and restores consistently).
export function redactMany(texts) {
  const map = new Map(); // original value -> placeholder
  const counters = Object.create(null);

  const placeholderFor = (type, value) => {
    if (map.has(value)) return map.get(value);
    counters[type] = (counters[type] || 0) + 1;
    const ph = `[${type}_${counters[type]}]`;
    map.set(value, ph);
    return ph;
  };

  const redactOne = (input) => {
    let out = input;
    for (const { type, re } of RULES) {
      out = out.replace(re, (match) => placeholderFor(type, match));
    }
    // Phones need a digit-count check to avoid false positives.
    out = out.replace(PHONE_CANDIDATE, (match) => {
      const digits = digitCount(match);
      if (digits < 7 || digits > 15) return match;
      return placeholderFor('PHONE', match.trim());
    });
    return out;
  };

  const redacted = (texts || []).map((t) => (typeof t === 'string' ? redactOne(t) : t));

  // Return the map as placeholder -> original for restoration.
  const restoreMap = {};
  for (const [value, ph] of map) restoreMap[ph] = value;
  return { texts: redacted, map: restoreMap };
}

// Convenience for a single string.
export function redactSensitive(text) {
  const { texts, map } = redactMany([text]);
  return { text: texts[0], map };
}

// Restore placeholders to their original values. Applied to AI output that may
// echo a placeholder (e.g. translations that preserved [EMAIL_1] verbatim).
export function restore(text, map) {
  if (typeof text !== 'string' || !map) return text;
  let out = text;
  for (const [ph, value] of Object.entries(map)) {
    out = out.split(ph).join(value);
  }
  return out;
}
