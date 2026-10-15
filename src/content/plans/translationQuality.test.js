// A structurally complete overlay can still be worthless: an early draft of the
// couple plans filled all 14 languages with one fixed frame per field, repeated
// on every day with only the day title swapped in. Every parity test passed and
// every reader outside English and French got thirty days that said the same
// thing — worse than no overlay at all, because `mergePlan` folds it in and
// `pick()` then prefers it over the authored English and French prose.
//
// Two things are checked for every language a plan declares READY, through the
// shared detectors in src/content-quality/planChecks.js:
//
//   1. No wrong repeats. Among the days an overlay actually translates a field
//      on, it must carry as many distinct values as the source does on those
//      same days. This allows the legitimate repetition (a shared "pray
//      together" line that really is identical every day) and allows a partial
//      overlay (an untranslated field falls back to en/fr), while rejecting one
//      day's wording pasted across the others.
//   2. No frame. Values that all share a long common opening and ending are a
//      template with a variable slotted in, not translated prose.
//
// Whether a ready overlay is also natural, Christian and safe is decided by
// the plan-quality gate (planQualityGate.test.js).
import { describe, it, expect } from 'vitest';
import { PLANS } from '../prayerPlans';
import { overlayLanguages } from './translations';
import { checkOverlayRepetition } from '../../content-quality/planChecks';
import { overlayFor } from '../../content-quality/planQualityData';

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

        it('has an overlay file to serve', () => {
          expect(overlay, `${plan.id}/${lang}.json is declared ready but missing`).toBeTruthy();
        });

        it('reads as prose: no wrong repeats, no template with the day title slotted in', () => {
          const findings = checkOverlayRepetition(plan, overlay).map((f) => `${f.code} ${f.location}: ${f.message}`);
          expect(findings, `${plan.id}/${lang}.json`).toEqual([]);
        });
      });
    }
  }
});
