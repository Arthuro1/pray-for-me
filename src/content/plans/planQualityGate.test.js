// The publication gate for translated plan prose (docs/PRAYER_PLAN_QUALITY.md).
//
// At runtime a plan serves an overlay only in the languages its
// `proseTranslations` lists. This test is what makes that list honest: every
// listed language must have a serving basis — a complete native-Christian
// quality review, or the closed list of overlays that were already served
// before the quality framework existed. A file on disk, or a clean automated
// result, is never enough.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLANS } from '../prayerPlans';
import { overlayLanguages } from './translations';
import { theologyProfileProblems } from '../theologyProfiles';
import { evaluateLocalizedPlan } from '../../lib/planQuality';
import { committedPlanQualityRecords } from '../../content-quality/planQualityData';

const NON_SOURCE = ['de', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'fa', 'hi', 'id', 'sw', 'tl', 'am'];

// Served on 2026-10-12, when the framework was introduced. Closed: adding a
// language or plan here would grant an approval no human gave.
const LEGACY_SERVED = {
  preparing21: NON_SOURCE,
  discernment28: NON_SOURCE,
  covenant21: ['de', 'es', 'pt', 'ru'],
};

const records = committedPlanQualityRecords();
const servedPlans = PLANS.filter((plan) => overlayLanguages(plan).length > 0);
// Each case evaluates real plans in up to fourteen languages.
const REPOSITORY_TIMEOUT = 60_000;

describe('prayer-plan quality gate', () => {
  it('gives every plan a valid theological and audience profile', () => {
    for (const plan of PLANS) {
      expect(theologyProfileProblems(plan.theologyProfile, { lifeStage: plan.lifeStage }), plan.id).toEqual([]);
    }
  });

  for (const plan of servedPlans) {
    it(`${plan.id}: serves an overlay only on a recorded basis`, () => {
      for (const lang of overlayLanguages(plan)) {
        const result = evaluateLocalizedPlan(plan, lang);
        const blocking = result.issues.filter((i) => i.severity === 'critical' || (i.category === 'integrity' && i.severity === 'error'));
        expect(result.servingBasis, `${plan.id}/${lang}: ${result.status}, record ${records[`${lang}/${plan.id}`]?.status ?? 'missing'}; `
          + `${blocking.map((i) => `${i.code} @${i.location}`).join(', ') || 'no native review'}`).toBeTruthy();
      }
    }, REPOSITORY_TIMEOUT);
  }

  it('keeps the legacy list closed', () => {
    const legacy = Object.entries(records)
      .filter(([, record]) => record.status === 'legacy-owner-approved')
      .map(([key]) => key);
    const allowed = new Set(Object.entries(LEGACY_SERVED).flatMap(([planId, langs]) => langs.map((lang) => `${lang}/${planId}`)));
    expect(legacy.filter((key) => !allowed.has(key))).toEqual([]);
  });

  it('never approves an overlay on automated checks alone', () => {
    for (const [key, record] of Object.entries(records)) {
      if (record.status === 'human-reviewed') continue;
      const [lang, planId] = key.split('/');
      const plan = PLANS.find((p) => p.id === planId);
      expect(evaluateLocalizedPlan(plan, lang).status, key).not.toBe('approved');
    }
  }, REPOSITORY_TIMEOUT);

  it('keeps the quality tooling out of the app bundle', () => {
    const src = fileURLToPath(new URL('../../', import.meta.url));
    const tooling = /from ['"][^'"]*(?:lib\/planQuality|content-quality\/(?:planQualityData|planChecks))['"]/;
    const offenders = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) { walk(path); continue; }
        const file = relative(src, path).replaceAll('\\', '/');
        if (!/\.jsx?$/.test(file)) continue;
        const source = readFileSync(path, 'utf8');
        // Tests and test-only helpers (anything importing vitest) are tooling too.
        const isTooling = /\.(?:test|spec)\.jsx?$/.test(file) || /from ['"]vitest['"]/.test(source)
          || file.startsWith('content-quality/') || file === 'lib/planQuality.js';
        if (!isTooling && tooling.test(source)) offenders.push(file);
      }
    };
    walk(src);
    expect(offenders).toEqual([]);
  });
});
