// Structural validation of every shipped plan-translation overlay.
//
// Overlays are matched to the authored plan BY POSITION, so a file with the
// wrong number of days — or a day with the wrong number of prompts — would
// silently attach a translation to the wrong prayer. This test makes that a
// build failure instead of a quiet content bug.
//
// It deliberately checks STRUCTURE only, through the same detectors the
// plan-quality evaluation uses (src/content-quality/planChecks.js). Whether a
// translation reads well, or says what the English says, is a native-review
// question — see docs/PRAYER_PLAN_QUALITY.md.
import { describe, it, expect } from 'vitest';
import { PLANS } from '../prayerPlans.js';
import { LANG_CODES } from '../../i18n.js';
import { checkOverlayStructure, checkScriptureReferences } from '../../content-quality/planChecks';

const overlays = import.meta.glob(['./translations/*.json', './translations/*/*.json'], { eager: true });
const entries = Object.entries(overlays).map(([path, mod]) => [
  path.split('/').at(-1).replace('.json', ''),
  mod.default,
]);

const PLANS_BY_ID = Object.fromEntries(PLANS.map((plan) => [plan.id, plan]));
const described = (findings) => findings.map((f) => `${f.code} @${f.location}: ${f.message}`);

describe('plan translation overlays', () => {
  it('are named after a supported language, and never en/fr (those are authored)', () => {
    for (const [lang] of entries) {
      expect(LANG_CODES, lang).toContain(lang);
      expect(['en', 'fr'], lang).not.toContain(lang);
    }
  });

  it.each(entries)('%s matches the authored plan structure', (lang, overlay) => {
    for (const [planId, translated] of Object.entries(overlay)) {
      const plan = PLANS_BY_ID[planId];
      expect(plan, `${lang}: unknown plan id "${planId}"`).toBeTruthy();
      expect(described(checkOverlayStructure(plan, translated)), `${lang}/${planId}`).toEqual([]);
    }
  });

  it('keeps Scripture references in the source and preserves manuscript citations', () => {
    for (const [lang, overlay] of entries) {
      for (const [planId, translated] of Object.entries(overlay)) {
        expect(described(checkScriptureReferences(PLANS_BY_ID[planId], translated)), `${lang}/${planId}`).toEqual([]);
      }
    }
  });
});
