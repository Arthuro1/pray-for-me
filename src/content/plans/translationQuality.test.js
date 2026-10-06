// A structurally complete overlay can still be worthless: an early draft of the
// couple plans filled all 14 languages with one fixed frame per field, repeated
// on every day with only the day title swapped in. Every parity test passed and
// every reader outside English and French got thirty days that said the same
// thing — worse than no overlay at all, because `mergePlan` folds it in and
// `pick()` then prefers it over the authored English and French prose.
//
// Two things are checked for every language a plan declares READY:
//
//   1. No wrong repeats. Among the days an overlay actually translates a field
//      on, it must carry as many distinct values as the source does on those
//      same days. This allows the legitimate repetition (a shared "pray
//      together" line that really is identical every day) and allows a partial
//      overlay (an untranslated field falls back to en/fr), while rejecting one
//      day's wording pasted across the others.
//   2. No frame. Values that all share a long common opening and ending are a
//      template with a variable slotted in, not translated prose.
import { describe, it, expect } from 'vitest';
import { PLANS } from '../prayerPlans';
import { overlayLanguages } from './translations';

const overlayModules = import.meta.glob(['./translations/*.json', './translations/*/*.json'], { eager: true });

// The day fields an overlay is allowed to translate.
const FIELDS = ['reflection', 'selfPrompt', 'spousePrompt', 'marriagePrompt', 'childPrompt',
  'practice', 'conversationPrompt', 'prayTogether', 'safetyNote', 'discernment.reading',
  'discernment.prayer', 'discernment.listening', 'discernment.deeper', 'discernment.journalNote', 'discernment.review'];

// How much of a value may be boilerplate shared with every other value before it
// reads as a template rather than prose, and how many days must agree first.
const MAX_SHARED_RATIO = 0.6;
const MIN_DAYS_FOR_FRAME = 5;

const atPath = (value, path) => path.split('.').reduce((current, key) => current?.[key], value);
const sourceValue = (day, field) => atPath(day, field)?.en;
const overlayValue = (overlay, i, field) => {
  const value = field === 'prompts' ? overlay?.days?.[i]?.prompts?.[0] : atPath(overlay?.days?.[i], field);
  return typeof value === 'string' && value.trim() ? value : undefined;
};

const distinct = (values) => new Set(values).size;

function commonPrefix(values) {
  let n = 0;
  while (n < values[0].length && values.every((v) => v[n] === values[0][n])) n += 1;
  return n;
}

const commonSuffix = (values) => commonPrefix(values.map((v) => [...v].reverse().join('')));

function overlayFor(planId, lang) {
  const scoped = overlayModules[`./translations/${planId}/${lang}.json`]?.default;
  const flat = overlayModules[`./translations/${lang}.json`]?.default;
  return { ...(flat || {}), ...(scoped || {}) }[planId] || null;
}

const translatedPlans = PLANS.filter((plan) => overlayLanguages(plan).length > 0);

describe('guided-plan translation overlays', () => {
  // A plan whose overlays are all still stubs serves none of them and is
  // absent here on purpose — that is the point of the allow-list.
  it('serves overlays only for the plans that declare ready languages', () => {
    expect(translatedPlans.map((p) => p.id).sort()).toEqual(['covenant21', 'discernment28', 'preparing21']);
  });

  for (const plan of translatedPlans) {
    for (const lang of overlayLanguages(plan)) {
      describe(`${plan.id} · ${lang}`, () => {
        const overlay = overlayFor(plan.id, lang);
        const days = plan.days || [];

        it('has an overlay file to serve', () => {
          expect(overlay, `${plan.id}/${lang}.json is declared ready but missing`).toBeTruthy();
        });

        it('never reuses one day\'s wording where the source differs', () => {
          for (const field of [...FIELDS, 'prompts']) {
            // Only the days this overlay actually translates the field on.
            const pairs = days
              .map((day, i) => ({
                translated: overlayValue(overlay, i, field),
                source: field === 'prompts' ? day?.prompts?.[0]?.en : sourceValue(day, field),
              }))
              .filter((pair) => pair.translated && pair.source);
            if (pairs.length < 2) continue;
            expect(
              distinct(pairs.map((p) => p.translated)),
              `${plan.id}/${lang}.json → ${field}: ${distinct(pairs.map((p) => p.translated))} distinct across `
                + `${pairs.length} translated days, where the source has ${distinct(pairs.map((p) => p.source))}`,
            ).toBe(distinct(pairs.map((p) => p.source)));
          }
        });

        it('reads as prose, not one template with the day title slotted in', () => {
          for (const field of [...FIELDS, 'prompts']) {
            const values = days.map((_, i) => overlayValue(overlay, i, field)).filter(Boolean);
            if (values.length < MIN_DAYS_FOR_FRAME || distinct(values) < 2) continue;
            const shared = commonPrefix(values) + commonSuffix(values);
            const average = values.reduce((sum, v) => sum + v.length, 0) / values.length;
            expect(
              shared / average,
              `${plan.id}/${lang}.json → ${field}: ${Math.round((shared / average) * 100)}% of every value is `
                + 'the same opening and ending — that is a template, not a translation',
            ).toBeLessThan(MAX_SHARED_RATIO);
          }
        });
      });
    }
  }
});
