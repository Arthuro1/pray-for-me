import { digest, fingerprints, groupEntries } from './runtime.mjs';

export function auditEntries(entries, rules, glossaries) {
  const issues = [];
  const add = (entry, rule, message) => issues.push({
    locale: entry.locale, id: entry.id, rule, message,
    fingerprint: digest([entry.locale, entry.id, rule, entry.text, entry.source]),
  });
  const seen = new Map();
  for (const entry of entries) {
    const { text, source, locale, key, surface } = entry;
    if (typeof text !== 'string' || !text.trim()) { add(entry, 'missing-copy', 'Missing or empty authored wording; runtime may use a fallback.'); continue; }
    if (rules.shortKeys.includes(key) && [...text].length > rules.maxShortLength) add(entry, 'long-control', `Control exceeds ${rules.maxShortLength} characters.`);
    if (locale !== 'en' && text === source && text.length >= rules.untranslatedMinLength && !/verse|ref/i.test(key)) add(entry, 'possible-untranslated', 'Matches English; verify whether this is intentional.');
    for (const [term, rule] of Object.entries(glossaries[locale]?.terms ?? {})) {
      for (const phrase of rule.avoid) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').test(text)) add(entry, `term:${term}:${phrase}`, `Avoid “${phrase}”; consider “${rule.preferred}” in context.`);
      }
    }
    const script = rules.forbiddenCharacters?.[locale];
    const foreign = script ? [...new Set([...text].filter((char) => script.chars.includes(char)))] : [];
    if (foreign.length) add(entry, 'script', `${script.message} (${foreign.join('')})`);
    for (const phrase of rules.forbiddenPhrases[locale] ?? []) if (text.toLocaleLowerCase(locale).includes(phrase.toLocaleLowerCase(locale))) add(entry, `phrase:${phrase}`, 'Flagged semantic phrasing.');
    if (entry.sensitivity === 'sensitive' && text.length >= rules.duplicateMinLength && !/biblical/.test(key)) {
      const normalized = text.replace(/\s+/g, ' ').trim();
      const duplicateKey = `${locale}/${surface}/${normalized}`;
      const previous = seen.get(duplicateKey);
      if (previous && previous.source !== source) add(entry, 'repeated-prose', `Repeats ${previous.key} while the English source differs.`);
      else seen.set(duplicateKey, entry);
    }
  }
  return issues;
}

export function validateMetadata(entries, metadata, glossaries, locales) {
  const errors = [];
  if (metadata.version !== 1 || metadata.semanticSource !== 'en') errors.push('Invalid metadata version or semantic source.');
  for (const locale of locales) {
    const glossary = glossaries[locale];
    if (!glossary || glossary.locale !== locale || !['draft', 'human-approved'].includes(glossary.status)) errors.push(`Invalid glossary: ${locale}`);
    for (const term of Object.keys(glossaries.en?.terms ?? {})) {
      const item = glossary?.terms?.[term];
      if (!item || !item.preferred || !Array.isArray(item.allowed) || !Array.isArray(item.avoid) || !item.example || !item.note) errors.push(`Incomplete glossary: ${locale}/${term}`);
    }
    if (glossary?.status === 'human-approved' && (!glossary.reviewer || !validDate(glossary.reviewedAt))) errors.push(`Glossary approval lacks human evidence: ${locale}`);
    errors.push(...glossaryProfileErrors(locale, glossary));
  }
  for (const [id, group] of groupEntries(entries)) {
    const record = metadata.bundles?.[id];
    if (!record || !['needs-review', 'ai-reviewed', 'human-approved'].includes(record.status)) { errors.push(`Missing or invalid review metadata: ${id}`); continue; }
    if (!/^[a-f0-9]{64}$/.test(record.contentHash ?? '') || !/^[a-f0-9]{64}$/.test(record.sourceHash ?? '')) errors.push(`Invalid content fingerprints: ${id}`);
    if (record.status !== 'needs-review') {
      const current = fingerprints(group);
      if (record.contentHash !== current.contentHash || record.sourceHash !== current.sourceHash) errors.push(`Stale review: ${id}; reset to needs-review.`);
    }
    if (record.status === 'human-approved' && (!record.reviewer?.trim() || !validDate(record.reviewedAt) || !record.nativeLanguageReview || (group[0].sensitivity === 'sensitive' && !record.christianReview))) errors.push(`Human approval lacks required evidence: ${id}`);
  }
  return errors;
}

// A locale's Christian-language profile: how Christians who speak it write and
// pray, and which competing renderings of a concept must not be mixed in one
// plan (`variants`, regular expressions). See docs/PRAYER_PLAN_QUALITY.md.
const PROFILE_FIELDS = ['region', 'christianRegister', 'prayerRegister', 'readerAddress', 'godAddress'];
const compiles = (pattern) => {
  try { return typeof pattern === 'string' && !!new RegExp(pattern, 'iu'); } catch { return false; }
};

export function glossaryProfileErrors(locale, glossary) {
  const errors = [];
  const profile = glossary?.profile;
  const complete = profile && PROFILE_FIELDS.every((field) => typeof profile[field] === 'string' && profile[field].trim())
    && Array.isArray(profile.notes) && profile.regions && typeof profile.regions === 'object';
  if (!complete) errors.push(`Incomplete glossary profile: ${locale}`);
  for (const [tag, region] of Object.entries(profile?.regions || {})) {
    if (!tag.startsWith(`${locale}-`) || !Array.isArray(region?.notes)) errors.push(`Invalid regional profile: ${locale}/${tag}`);
  }
  for (const [term, item] of Object.entries(glossary?.terms || {})) {
    if (item.variants !== undefined && !(Array.isArray(item.variants) && item.variants.length >= 2 && item.variants.every(compiles))) {
      errors.push(`Invalid variants: ${locale}/${term}`);
    }
  }
  return errors;
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
