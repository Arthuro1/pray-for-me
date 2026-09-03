// Structural validation of every shipped plan-translation overlay.
//
// Overlays are matched to the authored plan BY POSITION, so a file with the
// wrong number of days — or a day with the wrong number of prompts — would
// silently attach a translation to the wrong prayer. This test makes that a
// build failure instead of a quiet content bug.
//
// It deliberately checks STRUCTURE only. Whether a translation reads well, or
// says what the English says, is a native-review question — see
// docs/I18N_REVIEW.md.
import { describe, it, expect } from 'vitest';
import { PLANS } from '../prayerPlans.js';
import { LANG_CODES } from '../../i18n.js';

const overlays = import.meta.glob(['./translations/*.json', './translations/*/*.json'], { eager: true });
const entries = Object.entries(overlays).map(([path, mod]) => [
  path.split('/').at(-1).replace('.json', ''),
  mod.default,
]);

const PLANS_BY_ID = Object.fromEntries(PLANS.map((plan) => [plan.id, plan]));

describe('plan translation overlays', () => {
  it('are named after a supported language, and never en/fr (those are authored)', () => {
    for (const [lang] of entries) {
      expect(LANG_CODES, lang).toContain(lang);
      expect(['en', 'fr'], lang).not.toContain(lang);
    }
  });

  it.each(entries)('%s matches the authored plan structure', (lang, overlay) => {
    for (const [planId, tr] of Object.entries(overlay)) {
      const plan = PLANS_BY_ID[planId];
      expect(plan, `${lang}: unknown plan id "${planId}"`).toBeTruthy();

      // Days are positional: the count must match exactly.
      expect(tr.days, `${lang}/${planId}: day count`).toHaveLength(plan.days.length);

      const validateDay = (day, source, where) => {
        expect(source, `${where}: source day`).toBeTruthy();
        // Prompts are positional too.
        if (day.prompts) {
          expect(day.prompts, `${where}: prompt count`).toHaveLength(source.prompts.length);
          for (const prompt of day.prompts) expect(typeof prompt, `${where}: prompt type`).toBe('string');
        }
        // A translated field must correspond to a field the source actually has,
        // or it would translate something that never renders.
        for (const field of ['reflection', 'selfPrompt', 'spousePrompt', 'marriagePrompt', 'childPrompt',
          'practice', 'conversationPrompt', 'prayTogether', 'safetyNote']) {
          if (day[field] !== undefined) {
            expect(source[field], `${where}: "${field}" is not in the source`).toBeTruthy();
            expect(typeof day[field], `${where}: "${field}" type`).toBe('string');
          }
        }
        if (day.withChildren) {
          expect(source.withChildren, `${where}: source has no child variant`).toBeTruthy();
          validateDay(day.withChildren, source.withChildren, `${where} child variant`);
        }
        if (day.study) {
          expect(source.study, `${where}: source has no study`).toBeTruthy();
          const allowed = ['context', 'tension', 'synthesis', 'prayer', 'questions'];
          for (const key of Object.keys(day.study)) expect(allowed, `${where}: unknown study field`).toContain(key);
          for (const key of allowed.filter((key) => key !== 'questions')) {
            if (day.study[key] !== undefined) {
              expect(source.study[key], `${where}: missing study source ${key}`).toBeTruthy();
              expect(typeof day.study[key]).toBe('string');
            }
          }
          if (day.study.questions) {
            expect(day.study.questions).toHaveLength(source.study.questions.length);
            for (const question of day.study.questions) expect(typeof question).toBe('string');
          }
        }
        if (day.roles) {
          expect(source.roles, `${where}: source has no role reflections`).toBeTruthy();
          for (const role of Object.keys(day.roles)) {
            expect(source.roles[role], `${where}: unknown role "${role}"`).toBeTruthy();
            expect(typeof day.roles[role], `${where}: role "${role}" type`).toBe('string');
          }
        }
        // Structure never moves: an overlay may not carry Scripture, ids,
        // movements or topics.
        for (const forbidden of ['ref', 'related', 'movement', 'resourceTopics', 'theme', 'emphasis', 'lifeStage']) {
          expect(day[forbidden], `${where}: overlays must not carry "${forbidden}"`).toBeUndefined();
        }
      };
      tr.days.forEach((day, i) => {
        validateDay(day, plan.days[i], `${lang}/${planId} day ${i + 1}`);
      });

      for (const field of ['intro', 'biblical', 'completion']) {
        if (tr[field] !== undefined) expect(typeof tr[field], `${lang}/${planId}: ${field}`).toBe('string');
      }
    }
  });

  it('never contains a Bible reference — Scripture stays in the source', () => {
    // A chapter:verse citation in translated prose would mean someone moved a
    // reference out of the source, where localizeRef can no longer reach it.
    for (const [lang, overlay] of entries) {
      const prose = JSON.stringify(overlay);
      expect(prose, `${lang}`).not.toMatch(/\b\d{1,3}:\d{1,3}\s*[-–]\s*\d{1,3}\b/);
    }
  });
});
