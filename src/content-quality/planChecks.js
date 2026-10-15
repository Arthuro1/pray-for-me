// Automated detectors for the prayer-plan quality framework.
//
// Each detector reports FACTS as raw findings — `{ code, location, message,
// excerpt?, qualified?, scope? }` — and never decides what a finding means.
// Severity, score ceilings and the publication verdict belong to the model in
// src/lib/planQuality.js, which owns the issue-code catalogue. Detectors are
// pure: the per-locale data (glossary, detection rules) is passed in.
//
// None of this can judge whether a sentence is natural, faithful or wise. It
// finds risks for a native Christian reviewer, whose judgment is final.
import { flattenStrings, localizedFields } from './entries';
import { theologyProfileProblems } from '../content/theologyProfiles';

export const SOURCE_LOCALES = ['en', 'fr'];

// --- Rows: the text a reader of one locale sees -----------------------------

// Plan-object keys that hold no reader-facing prose of this release.
const SKIPPED_KEYS = new Set(['review', 'versions', 'theologyProfile']);

export function planFields(plan) {
  const subset = Object.fromEntries(Object.entries(plan).filter(([key]) => !SKIPPED_KEYS.has(key)));
  return localizedFields(subset);
}

// 'days[3].prompts[0]' → 'day-4.prompts[0]'; 'biblical.text' → 'biblical'.
export function locationOf(key) {
  if (key === 'biblical.text') return 'biblical';
  return key.replace(/^days\[(\d+)\]/, (_, i) => `day-${Number(i) + 1}`);
}

// What a field is FOR, which decides the checks that apply to it.
export function kindOf(key) {
  if (/(?:^|\.)(?:theme|title)$/.test(key)) return 'title';
  if (/(?:discernment|study)\.prayer$/.test(key)) return 'prayer';
  if (/prompts\[\d+\]$|(?:spouse|marriage|child)Prompt$/.test(key)) return 'prompt';
  if (/questions\[\d+\]$|(?:self|conversation)Prompt$/.test(key)) return 'question';
  if (/practice$/.test(key)) return 'practice';
  if (/safetyNote$|discernment\.review$/.test(key)) return 'safety';
  return 'prose';
}

const dayIndexOf = (key) => {
  const match = key.match(/^days\[(\d+)\]/);
  return match ? Number(match[1]) : null;
};

// Every localized string of `plan` as `locale` reads it. A field without a
// value in that locale falls back to the authored en/fr prose at runtime and is
// evaluated there, so it is not a row of this locale.
export function localeRows(plan, locale, overlay = null) {
  const translated = overlay ? flattenStrings(overlay) : {};
  const rows = [];
  for (const [key, field] of Object.entries(planFields(plan))) {
    const overlayKey = key === 'biblical.text' ? 'biblical' : key;
    const fromOverlay = !SOURCE_LOCALES.includes(locale) && typeof translated[overlayKey] === 'string';
    const text = fromOverlay ? translated[overlayKey] : field[locale];
    if (typeof text !== 'string' || !text.trim()) continue;
    rows.push({
      key, location: locationOf(key), kind: kindOf(key), day: dayIndexOf(key),
      text, source: field.en ?? field.fr ?? '', fromOverlay,
    });
  }
  return rows;
}

// The localized fields an overlay is able to carry (see translations.js); the
// rest — day titles, onboarding and so on — is authored inline in every locale.
const OVERLAY_FIELD = [
  /^(?:intro|completion|biblical\.text)$/,
  /^days\[\d+\]\.(?:withChildren\.)?(?:reflection|selfPrompt|spousePrompt|marriagePrompt|childPrompt|practice|conversationPrompt|prayTogether|safetyNote|prompts\[\d+\]|roles\.\w+)$/,
  /^days\[\d+\]\.(?:study|discernment)\.(?:\w+|questions\[\d+\])$/,
];

export const isOverlayField = (key) => OVERLAY_FIELD.some((re) => re.test(key));

export function overlayFieldCount(plan) {
  return Object.keys(planFields(plan)).filter(isOverlayField).length;
}

// --- Pattern helpers ----------------------------------------------------------

const BOUNDARY = '[\\p{L}\\p{M}\\p{N}]';
const compiled = new Map();

export function compilePattern(pattern, wordBoundaries = true) {
  const cacheKey = `${wordBoundaries ? 'b' : 'n'}:${pattern}`;
  if (!compiled.has(cacheKey)) {
    const source = wordBoundaries ? `(?<!${BOUNDARY})(?:${pattern})(?!${BOUNDARY})` : pattern;
    compiled.set(cacheKey, new RegExp(source, 'iu'));
  }
  return compiled.get(cacheKey);
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const excerptOf = (text, max = 80) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

// Scripture quotations carry the Bible's authority, not ours: claim checks
// look only at our own words. Straight single quotes count only when they open
// after a space, so "God's" is never mistaken for a quotation.
const QUOTED = /“[^”]*”|"[^"]*"|«[^»]*»|„[^“”]*[“”]|「[^」]*」|『[^』]*』|(?:^|(?<=[\s(]))'[^']{3,300}'(?=[\s.,;:!?)]|$)/g;
const withoutQuotations = (text) => text.replace(QUOTED, ' ');

const SENTENCE_BREAK = /[.!?;。！？؟।።\n]+/;
const sentencesOf = (text) => text.split(SENTENCE_BREAK).map((s) => s.trim()).filter(Boolean);

// --- Integrity: overlay structure --------------------------------------------

const PROSE_DAY_FIELDS = ['reflection', 'selfPrompt', 'spousePrompt', 'marriagePrompt', 'childPrompt',
  'practice', 'conversationPrompt', 'prayTogether', 'safetyNote'];
const NESTED_DAY_FIELDS = ['prompts', 'withChildren', 'study', 'discernment', 'roles'];
const STRUCTURAL_FIELDS = ['ref', 'related', 'readingRefs', 'movement', 'resourceTopics', 'theme', 'emphasis', 'lifeStage'];
const STUDY_FIELDS = ['context', 'tension', 'synthesis', 'prayer', 'questions'];
const DISCERNMENT_FIELDS = ['reading', 'prayer', 'listening', 'deeper', 'journalNote', 'review', 'questions'];
const OVERLAY_TOP_FIELDS = ['intro', 'biblical', 'completion', 'days'];

function checkTextList(values, sourceValues, where, out) {
  if (!Array.isArray(values)) {
    out.push({ code: 'OVERLAY_MALFORMED', location: where, message: 'Expected a list of strings.' });
    return;
  }
  if (values.length !== (sourceValues || []).length) {
    out.push({ code: 'OVERLAY_PROMPT_COUNT', location: where, message: `${values.length} items where the source has ${(sourceValues || []).length}; items are matched by position.` });
  }
  if (values.some((value) => typeof value !== 'string')) out.push({ code: 'OVERLAY_MALFORMED', location: where, message: 'Every item must be a string.' });
}

function checkKeyedStrings(value, source, allowed, where, out) {
  for (const [key, text] of Object.entries(value)) {
    const at = `${where}.${key}`;
    if (!allowed.includes(key)) { out.push({ code: 'OVERLAY_UNKNOWN_FIELD', location: at, message: `Unknown field "${key}".` }); continue; }
    if (!source?.[key]) { out.push({ code: 'OVERLAY_FIELD_NOT_IN_SOURCE', location: at, message: `The source has no "${key}" here, so it would never render.` }); continue; }
    if (key === 'questions') checkTextList(text, source.questions, at, out);
    else if (typeof text !== 'string') out.push({ code: 'OVERLAY_MALFORMED', location: at, message: 'Expected a string.' });
  }
}

function checkOverlayDay(day, source, where, out) {
  if (!day || typeof day !== 'object') { out.push({ code: 'OVERLAY_MALFORMED', location: where, message: 'A day must be an object.' }); return; }
  for (const [field, value] of Object.entries(day)) {
    const at = `${where}.${field}`;
    if (STRUCTURAL_FIELDS.includes(field)) { out.push({ code: 'OVERLAY_STRUCTURAL_FIELD', location: at, message: `Overlays must not carry "${field}"; structure and Scripture stay in the source.` }); continue; }
    if (!PROSE_DAY_FIELDS.includes(field) && !NESTED_DAY_FIELDS.includes(field)) { out.push({ code: 'OVERLAY_UNKNOWN_FIELD', location: at, message: `Unknown field "${field}".` }); continue; }
    if (field === 'prompts') { checkTextList(value, source?.prompts, at, out); continue; }
    if (!source?.[field]) { out.push({ code: 'OVERLAY_FIELD_NOT_IN_SOURCE', location: at, message: `The source has no "${field}" here, so it would never render.` }); continue; }
    if (field === 'withChildren') checkOverlayDay(value, source.withChildren, at, out);
    else if (field === 'study') checkKeyedStrings(value, source.study, STUDY_FIELDS, at, out);
    else if (field === 'discernment') checkKeyedStrings(value, source.discernment, DISCERNMENT_FIELDS, at, out);
    else if (field === 'roles') checkKeyedStrings(value, source.roles, Object.keys(source.roles), at, out);
    else if (typeof value !== 'string') out.push({ code: 'OVERLAY_MALFORMED', location: at, message: 'Expected a string.' });
  }
}

// Overlays are matched to the authored plan BY POSITION: a wrong count would
// silently attach a translation to the wrong prayer.
export function checkOverlayStructure(plan, overlay) {
  const out = [];
  if (!overlay || typeof overlay !== 'object') return [{ code: 'OVERLAY_MALFORMED', location: 'overlay', message: 'The overlay must be an object.' }];
  for (const key of Object.keys(overlay)) {
    if (!OVERLAY_TOP_FIELDS.includes(key)) out.push({ code: 'OVERLAY_UNKNOWN_FIELD', location: key, message: `Unknown field "${key}".` });
  }
  for (const field of ['intro', 'biblical', 'completion']) {
    if (overlay[field] !== undefined && typeof overlay[field] !== 'string') out.push({ code: 'OVERLAY_MALFORMED', location: field, message: 'Expected a string.' });
  }
  if (!Array.isArray(overlay.days)) return [...out, { code: 'OVERLAY_MALFORMED', location: 'days', message: 'An overlay needs a days list.' }];
  if (overlay.days.length !== (plan.days || []).length) {
    out.push({ code: 'OVERLAY_DAY_COUNT', location: 'days', message: `${overlay.days.length} days where the plan has ${(plan.days || []).length}.` });
  }
  overlay.days.forEach((day, i) => checkOverlayDay(day, plan.days?.[i], `day-${i + 1}`, out));
  return out;
}

// --- Integrity: Scripture stays in the source ---------------------------------

// The discernment manuscript discusses passages in context, so its prose may
// repeat a citation the source makes at the same place — never a new one.
const CITING_PLANS = new Set(['discernment28']);
const CITATION_RANGE = /(?<![\p{L}\p{N}])(\d{1,3})[.:：](\d{1,3})\s*[-–—]\s*(\d{1,3})(?![\p{L}\p{N}])/gu;
const COLON_RANGE = /(?<![\p{L}\p{N}])\d{1,3}:\d{1,3}\s*[-–]\s*\d{1,3}(?![\p{L}\p{N}])/gu;
const rangesIn = (value) => [...JSON.stringify(value ?? '').matchAll(CITATION_RANGE)].map((m) => m.slice(1).join(':'));

export function checkScriptureReferences(plan, overlay) {
  const out = [];
  const report = (location, citations) => {
    if (citations.length) out.push({ code: 'SCRIPTURE_REFERENCE_INVENTED', location, message: `Passage range not cited by the source here: ${citations.join(', ')}.`, excerpt: citations[0] });
  };
  if (!CITING_PLANS.has(plan.id)) {
    report('overlay', JSON.stringify(overlay).match(COLON_RANGE) || []);
    return out;
  }
  (overlay.days || []).forEach((day, i) => {
    const allowed = new Set(rangesIn(plan.days?.[i]));
    report(`day-${i + 1}`, rangesIn(day).filter((citation) => !allowed.has(citation)));
  });
  for (const field of ['intro', 'biblical', 'completion']) {
    const allowed = new Set(rangesIn(plan[field]));
    report(field, rangesIn(overlay[field]).filter((citation) => !allowed.has(citation)));
  }
  return out;
}

// --- Editorial: repeated or templated overlay prose ----------------------------

const REPETITION_FIELDS = [...PROSE_DAY_FIELDS, 'discernment.reading', 'discernment.prayer',
  'discernment.listening', 'discernment.deeper', 'discernment.journalNote', 'discernment.review', 'prompts'];
// A value whose shared opening + ending exceeds this share of its length, on at
// least this many days, is one template with a variable slotted in.
const MAX_SHARED_RATIO = 0.6;
const MIN_DAYS_FOR_FRAME = 5;

const atPath = (value, path) => path.split('.').reduce((current, key) => current?.[key], value);
const overlayDayValue = (overlay, i, field) => {
  const value = field === 'prompts' ? overlay?.days?.[i]?.prompts?.[0] : atPath(overlay?.days?.[i], field);
  return typeof value === 'string' && value.trim() ? value : undefined;
};
const sourceDayValue = (day, field) => (field === 'prompts' ? day?.prompts?.[0]?.en : atPath(day, field)?.en);
const distinct = (values) => new Set(values).size;

function commonPrefix(values) {
  let n = 0;
  while (n < values[0].length && values.every((v) => v[n] === values[0][n])) n += 1;
  return n;
}
const commonSuffix = (values) => commonPrefix(values.map((v) => [...v].reverse().join('')));

export function checkOverlayRepetition(plan, overlay) {
  const out = [];
  const days = plan.days || [];
  for (const field of REPETITION_FIELDS) {
    // Only the days this overlay translates: a partial overlay falls back.
    const pairs = days
      .map((day, i) => ({ translated: overlayDayValue(overlay, i, field), source: sourceDayValue(day, field) }))
      .filter((pair) => pair.translated && pair.source);
    if (pairs.length >= 2) {
      const translated = distinct(pairs.map((p) => p.translated));
      const source = distinct(pairs.map((p) => p.source));
      if (translated !== source) {
        out.push({ code: 'WRONG_REPEAT', location: `days.${field}`, message: `The translation says ${translated === 1 ? 'the same thing' : `only ${translated} different things`} on ${pairs.length} days, where the source says ${source}.` });
      }
    }
    const values = days.map((_, i) => overlayDayValue(overlay, i, field)).filter(Boolean);
    if (values.length < MIN_DAYS_FOR_FRAME || distinct(values) < 2) continue;
    const shared = commonPrefix(values) + commonSuffix(values);
    const average = values.reduce((sum, v) => sum + v.length, 0) / values.length;
    if (shared / average >= MAX_SHARED_RATIO) {
      out.push({ code: 'TEMPLATE_FRAME', location: `days.${field}`, message: `${Math.round((shared / average) * 100)}% of every value is the same opening and ending — a template, not a translation.` });
    }
  }
  return out;
}

// --- Integrity and linguistic signals in translated rows -----------------------

const PLACEHOLDER = /\{[A-Za-z][\w]*\}/g;
const placeholdersOf = (text) => [...new Set(text.match(PLACEHOLDER) || [])].sort().join(',');

// English function words that are not also common words in the other Latin-
// script locales ("in", "on", "will", "die" are deliberately absent).
const EN_FUNCTION_WORDS = new Set(['the', 'and', 'of', 'to', 'you', 'your', 'with', 'that', 'this', 'are', 'for', 'be', 'our', 'his', 'who', 'what', 'when', 'from', 'have', 'has']);
const LATIN_SCRIPT_LOCALES = new Set(['en', 'fr', 'de', 'es', 'pt', 'id', 'sw', 'tl']);
const MIN_UNTRANSLATED_LENGTH = 20;

const MT_ARTIFACTS = [
  /&[a-z]+;/i, /<\/?[a-z][^>]*>/i, /\\n/, /\{\{|\}\}/, /\[(?:todo|tbd|translate|translation)\]/i,
  /(?:^|\s)(?:translation|traduction|übersetzung|traducción|tradução)\s*:/i,
  /(?<![.?!])[,;:]{2,}|(?<!\.)\.\.(?!\.)/, /%s|\$\d/,
];

export function checkTranslatedRows(rows, locale, { contentRules } = {}) {
  if (SOURCE_LOCALES.includes(locale)) return [];
  const out = [];
  const traditional = contentRules?.forbiddenCharacters?.[locale];
  for (const row of rows) {
    const { text, source, location } = row;
    if (placeholdersOf(text) !== placeholdersOf(source)) {
      out.push({ code: 'PLACEHOLDER_MISMATCH', location, message: `Placeholders {${placeholdersOf(text)}} differ from the source's {${placeholdersOf(source)}}.` });
    }
    if (text.trim() === source.trim() && text.length >= MIN_UNTRANSLATED_LENGTH) {
      out.push({ code: 'UNTRANSLATED_COPY', location, message: 'Identical to the English source.', excerpt: excerptOf(text) });
      continue;
    }
    const bare = text.replace(PLACEHOLDER, ' ');
    if (LATIN_SCRIPT_LOCALES.has(locale)) {
      const words = bare.toLowerCase().match(/\p{L}+/gu) || [];
      const english = words.filter((w) => EN_FUNCTION_WORDS.has(w));
      if (english.length >= 4 && english.length / words.length >= 0.15) {
        out.push({ code: 'ENGLISH_FRAGMENT', location, message: `English function words (${[...new Set(english)].join(', ')}) suggest untranslated text.`, excerpt: excerptOf(text) });
      }
    } else {
      const latin = bare.match(/[A-Za-z]{3,}/g) || [];
      if (latin.length >= 2) out.push({ code: 'MIXED_SCRIPT', location, message: `Latin-script words in ${locale} text: ${[...new Set(latin)].slice(0, 5).join(', ')}.`, excerpt: excerptOf(text) });
    }
    const foreign = traditional ? [...new Set([...text].filter((char) => traditional.chars.includes(char)))] : [];
    if (foreign.length) out.push({ code: 'SCRIPT_MISMATCH', location, message: `${traditional.message} (${foreign.join('')})` });
    const artifact = MT_ARTIFACTS.find((re) => re.test(text));
    if (artifact) out.push({ code: 'MT_ARTIFACT', location, message: 'Looks like a machine-translation or editing artifact.', excerpt: excerptOf(text.match(artifact)?.[0] || text) });
    if (row.fromOverlay && quotations(text, LONG_QUOTE) > quotations(source, SHORT_QUOTE)) {
      out.push({ code: 'SCRIPTURE_TEXT_SUSPECTED', location, message: 'A long quotation the source does not have — Bible text must come from the Scripture pipeline, never an overlay.', excerpt: excerptOf(text) });
    }
  }
  return out;
}

// A translation may lengthen a short quoted example; only a long quotation
// where the source quotes nothing at all suggests pasted Bible text. Single
// quotes are left out: they double as apostrophes ("Siya'y", "l'amour").
const LONG_QUOTE = 60;
const SHORT_QUOTE = 12;
const quotations = (text, minLength) => (text.match(new RegExp(`[“"«„「『‘][^”"»“」』’]{${minLength},}[”"»“」』’]`, 'g')) || []).length;

// --- Christian language: glossary terms ----------------------------------------

// How often each competing rendering of a concept appears, longest pattern
// first so that a longer rendering is not also counted as a shorter one.
// `variants` lists renderings that compete (Saint-Esprit / Esprit saint), not
// every acceptable synonym: a concept without them is never checked.
function variantCounts(texts, variants, wordBoundaries) {
  const patterns = variants.slice().sort((a, b) => b.length - a.length);
  const counts = new Map();
  for (const original of texts) {
    let text = original;
    for (const pattern of patterns) {
      const re = new RegExp(compilePattern(pattern, wordBoundaries).source, 'giu');
      const matches = text.match(re);
      if (!matches) continue;
      counts.set(pattern, (counts.get(pattern) || 0) + matches.length);
      text = text.replace(re, (m) => ' '.repeat(m.length));
    }
  }
  return counts;
}

export function checkTerminology(rows, { glossary, rules } = {}) {
  const out = [];
  const wordBoundaries = rules?.wordBoundaries !== false;
  for (const [concept, term] of Object.entries(glossary?.terms || {})) {
    for (const phrase of term.avoid || []) {
      const re = compilePattern(escapeRegExp(phrase), wordBoundaries);
      const hit = rows.find((row) => re.test(row.text));
      if (hit) out.push({ code: 'TERM_AVOIDED', location: hit.location, message: `Avoid “${phrase}” (${concept}); consider “${term.preferred}” in context.`, excerpt: phrase });
    }
    if (!(term.variants?.length >= 2)) continue;
    const counts = variantCounts(rows.map((row) => row.text), term.variants, wordBoundaries);
    if (counts.size < 2) continue;
    const summary = [...counts.entries()].map(([pattern, n]) => `${pattern.replace(/\\p\{L\}\*/g, '…')} ×${n}`).join(', ');
    out.push({ code: 'TERM_INCONSISTENCY', location: `plan.${concept}`, message: `“${concept}” is rendered in ${counts.size} competing ways in one plan (${summary}). Choose one, or record why both belong.` });
  }
  return out;
}

// --- Theology and pastoral safety: claims --------------------------------------

// The part of a sentence where a negation turns a matched claim into its
// denial: before it in verb-medial languages ("it never asks anyone to submit
// to abuse"), after it where the verb comes last (Japanese, Hindi…), or either
// side (`negationScope` in the locale rules).
function negationContext(sentence, match, scope) {
  const before = sentence.slice(0, match.index);
  const after = sentence.slice(match.index + match[0].length);
  if (scope === 'after') return after;
  if (scope === 'both') return `${before} ${after}`;
  return before;
}

// A claim is `qualified` when its sentence frames it as hope, prayer,
// possibility or what Scripture teaches, and `negated` when the sentence
// denies it — usually a safeguard rather than the harm itself. The model
// decides what each one is worth.
export function checkClaims(rows, rules) {
  const out = [];
  const wordBoundaries = rules?.wordBoundaries !== false;
  const qualifiers = (rules?.qualifiers || []).map((q) => compilePattern(q, wordBoundaries));
  const negations = (rules?.negations || []).map((n) => compilePattern(n, wordBoundaries));
  const split = rows.map((row) => ({ row, sentences: sentencesOf(withoutQuotations(row.text)) }));
  for (const [code, patterns] of Object.entries(rules?.patterns || {})) {
    const regexes = patterns.map((p) => compilePattern(p, wordBoundaries));
    for (const { row, sentences } of split) {
      for (const sentence of sentences) {
        const match = regexes.map((re) => sentence.match(re)).find(Boolean);
        if (!match) continue;
        const context = negationContext(sentence, match, rules?.negationScope);
        out.push({
          code, location: row.location, kind: row.kind, excerpt: excerptOf(match[0]),
          qualified: qualifiers.some((q) => q.test(sentence)),
          negated: negations.some((n) => n.test(context)),
          message: `“${excerptOf(match[0])}”`,
        });
      }
    }
  }
  return out;
}

// --- Prayer authenticity ---------------------------------------------------------

const MIN_PROMPTS_FOR_CENTERING = 2;

export function checkPrayerStyle(rows, rules) {
  const out = [];
  const wordBoundaries = rules?.wordBoundaries !== false;
  const refs = (rules?.godReferences || []).map((p) => compilePattern(p, wordBoundaries));
  if (!refs.length) return out;
  const mentionsGod = (text) => refs.some((re) => re.test(text));
  // "Ask for humility…" under a Prayer heading is a direction to pray, not a
  // prayer that forgot to address God. Where the verb comes last, the
  // direction ends the text instead of opening it.
  const directions = (rules?.prayerDirections || []).map((p) => compilePattern(p, wordBoundaries));
  const isDirection = (text) => directions.some((re) => {
    const trimmed = text.trim();
    const match = re.exec(trimmed);
    return !!match && (match.index === 0 || match.index + match[0].length === trimmed.length);
  });
  for (const row of rows.filter((r) => r.kind === 'prayer')) {
    if (!mentionsGod(row.text) && !isDirection(row.text)) out.push({ code: 'PRAYER_NOT_ADDRESSED_TO_GOD', location: row.location, message: 'Presented as a prayer, but never addresses or names God.', excerpt: excerptOf(row.text) });
  }
  const promptsByDay = new Map();
  for (const row of rows.filter((r) => r.kind === 'prompt' && r.day !== null)) {
    promptsByDay.set(row.day, [...(promptsByDay.get(row.day) || []), row]);
  }
  for (const [day, prompts] of promptsByDay) {
    if (prompts.length >= MIN_PROMPTS_FOR_CENTERING && !prompts.some((row) => mentionsGod(row.text))) {
      out.push({ code: 'PROMPTS_NOT_GOD_CENTERED', location: `day-${day + 1}.prompts`, message: 'None of the day’s prayer prompts names or addresses God.' });
    }
  }
  return out;
}

// --- Theology profile (plan-level, judged on the authored source) ----------------

const PROTESTANT_TRADITIONS = new Set(['pentecostal-charismatic', 'broad-evangelical']);

function firstMarker(rows, patterns, wordBoundaries) {
  const regexes = patterns.map((p) => compilePattern(p, wordBoundaries));
  for (const row of rows) {
    const match = regexes.map((re) => withoutQuotations(row.text).match(re)).find(Boolean);
    if (match) return { row, excerpt: excerptOf(match[0]) };
  }
  return null;
}

// `sources`: [{ rows, rules }] for each authored source locale.
export function checkTheologyProfile(plan, sources) {
  const profile = plan.theologyProfile;
  const problems = theologyProfileProblems(profile, { lifeStage: plan.lifeStage });
  if (!profile) return [{ code: 'UNDECLARED_THEOLOGY_PROFILE', location: 'plan.theologyProfile', scope: 'plan', message: problems[0] }];
  const out = problems.map((message) => ({ code: 'INVALID_THEOLOGY_PROFILE', location: 'plan.theologyProfile', scope: 'plan', message }));
  const find = (topic) => sources
    .map(({ rows, rules }) => firstMarker(rows, rules?.markers?.[topic] || [], rules?.wordBoundaries !== false))
    .find(Boolean);
  const topics = new Set(sources.flatMap(({ rules }) => Object.keys(rules?.markers || {})));
  for (const topic of topics) {
    if (topic === 'saint-intercession' || (profile.disputedTopics || []).includes(topic)) continue;
    const hit = find(topic);
    if (hit) out.push({ code: 'UNDECLARED_DISPUTED_TOPIC', location: hit.row.location, scope: 'plan', excerpt: hit.excerpt, message: `Engages “${topic}” (“${hit.excerpt}”) without declaring it in theologyProfile.disputedTopics.` });
  }
  if (profile.charismatic === false) {
    const hit = find('spiritual-gifts');
    if (hit) out.push({ code: 'CHARISMATIC_CONFLICT', location: hit.row.location, scope: 'plan', excerpt: hit.excerpt, message: `Declared non-charismatic, but speaks of charismatic practice (“${hit.excerpt}”).` });
  }
  if (PROTESTANT_TRADITIONS.has(profile.tradition)) {
    const hit = find('saint-intercession');
    if (hit) out.push({ code: 'TRADITION_CONFLICT', location: hit.row.location, scope: 'plan', excerpt: hit.excerpt, message: `A ${profile.tradition} plan speaks of a practice outside that tradition (“${hit.excerpt}”).` });
  }
  return out;
}

// --- All detectors for one plan in one locale ------------------------------------

// ctx: { overlay, glossary, rules, contentRules, sources: [{ rows, rules }] }
export function checkLocalizedPlan(plan, locale, ctx = {}) {
  const { overlay = null, glossary, rules, contentRules, sources = [] } = ctx;
  const rows = localeRows(plan, locale, overlay);
  const findings = [];
  if (overlay) {
    findings.push(...checkOverlayStructure(plan, overlay), ...checkScriptureReferences(plan, overlay), ...checkOverlayRepetition(plan, overlay));
    const translated = rows.filter((row) => row.fromOverlay).length;
    const expected = overlayFieldCount(plan);
    if (translated < expected) {
      findings.push({ code: 'MISSING_TRANSLATION', location: 'overlay', message: `${expected - translated} of ${expected} prose fields fall back to the authored English/French.` });
    }
  }
  findings.push(
    ...checkTranslatedRows(rows, locale, { contentRules }),
    ...checkTerminology(rows, { glossary, rules }),
    ...checkClaims(rows, rules),
    ...checkPrayerStyle(rows, rules),
    ...checkTheologyProfile(plan, sources),
  );
  return { rows, findings };
}
