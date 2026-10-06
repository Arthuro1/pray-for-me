// The content contract every plan drafted on 2026-09-23 must satisfy (see
// docs/NEW_PLANS_2026-09-23.md). A plan's own test file calls
// `runNewPlanContract(plan, spec)` and then adds the guardrail tests specific to
// its subject — pregnancy, church hurt, guidance claims and so on.
//
// Test-only module: it imports vitest, so nothing in the app may import it.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPlan, planDayContent, plansByCategory } from '../../prayerPlans';
import { usfmFromReference } from '../../../lib/bibleRef';
import { localizeRef, pick } from '../../teaching/pick';
import { canUsePlan, isPlanReviewed } from '../../../lib/planReview';
import { LANG_CODES } from '../../../i18n';
import { RESOURCE_DOMAINS, RESOURCE_TOPICS } from '../../resources/topics';
import { RESOURCES } from '../../resources/catalogue';
import { resolveResources } from '../../../lib/resources';
import { NEW_PLAN_APPROVALS, NEW_PLAN_IDS } from '../../reviews/paulNewPlans20260930';
import rules from '../../../content-quality/content-rules.json';

const SOURCE_LANGS = ['en', 'fr'];
const TRADITIONAL_ONLY = new Set([...rules.forbiddenCharacters.zh.chars]);

// Wording no day of any plan may use, in any context: Praystead never speaks
// for God to the reader.
const NEVER = [
  /\bGod (?:has )?told you\b/i,
  /\bGod is telling you\b/i,
  /\bthe Lord (?:has )?told you\b/i,
  /\bDieu t['’]a dit\b/i,
  /\bDieu te dit que\b/i,
  /\ble Seigneur t['’]a dit\b/i,
];

// Every EN/FR string a reader can see in the plan: meta, days, study layers.
export function proseOf(plan) {
  const out = [];
  const add = (value, where) => {
    if (!value) return;
    if (typeof value === 'string') { out.push({ where, text: value }); return; }
    for (const lang of SOURCE_LANGS) if (typeof value[lang] === 'string') out.push({ where: `${where}.${lang}`, lang, text: value[lang] });
  };
  add(plan.intro, 'intro');
  add(plan.biblical?.text, 'biblical');
  add(plan.completion, 'completion');
  plan.days.forEach((day, i) => {
    const at = `day ${i + 1}`;
    add(day.reflection, `${at} reflection`);
    (day.prompts || []).forEach((p, j) => add(p, `${at} prompt ${j + 1}`));
    for (const field of ['selfPrompt', 'practice', 'safetyNote', 'conversationPrompt', 'prayTogether']) add(day[field], `${at} ${field}`);
    if (day.study) {
      for (const field of ['context', 'tension', 'synthesis', 'prayer']) add(day.study[field], `${at} study.${field}`);
      (day.study.questions || []).forEach((q, j) => add(q, `${at} question ${j + 1}`));
    }
  });
  return out;
}

// Asserts no prose matches any of `patterns`. Returns the offending rows so a
// failure names the day and field instead of dumping the whole plan.
export function expectNoProseMatching(plan, patterns, langs = SOURCE_LANGS) {
  const offending = proseOf(plan)
    .filter((row) => !row.lang || langs.includes(row.lang))
    .flatMap((row) => patterns.filter((re) => re.test(row.text)).map((re) => `${row.where}: ${re} → “${row.text}”`));
  expect(offending).toEqual([]);
}

// spec: { id, count, category, mode ('prayer' | 'study'), domains, movements }
export function runNewPlanContract(plan, spec) {
  afterEach(() => vi.unstubAllEnvs());

  describe(`${spec.id} — shared content contract`, () => {
    it('is registered once, versioned, and grouped in its category', () => {
      expect(NEW_PLAN_IDS).toContain(spec.id);
      expect(plan.id).toBe(spec.id);
      expect(plan.version).toBe(1);
      expect(getPlan(spec.id, 1)).toBe(plan);
      expect(getPlan(spec.id, 2)).toBeNull();
      expect(plan.category).toBe(spec.category);
      expect(plansByCategory().find((g) => g.id === spec.category)?.plans).toContain(plan);
      expect(plan.count).toBe(spec.count);
      expect(plan.days).toHaveLength(spec.count);
      expect(plan.mode ?? 'prayer').toBe(spec.mode);
      expect(plan.resourceDomains).toEqual(spec.domains);
      for (const domain of plan.resourceDomains) expect(RESOURCE_DOMAINS).toContain(domain);
      expect(plan.proseTranslations).toEqual([]);
      expect(typeof plan.emoji).toBe('string');
    });

    it("carries Paul's dated sign-off and is public in production", () => {
      expect(plan.review).toBe(NEW_PLAN_APPROVALS[spec.id]);
      expect(plan.review.status).toBe('approved');
      expect(plan.review.contentVersion).toBe(plan.version);
      expect(isPlanReviewed(plan)).toBe(true);
      expect(canUsePlan(plan, { preview: false })).toBe(true);
      vi.stubEnv('DEV', false);
      expect(planDayContent(spec.id, 1)).not.toBeNull();
      // Every gate counts: without the safety sign-off it is a draft again.
      expect(isPlanReviewed({ ...plan, review: { ...plan.review, safety: null } })).toBe(false);
    });

    it('divides the days into contiguous movements that every day names', () => {
      expect(plan.movements.map((m) => m.id)).toEqual(spec.movements);
      let next = 1;
      for (const m of plan.movements) {
        expect(m.from, m.id).toBe(next);
        expect(m.to, m.id).toBeGreaterThanOrEqual(m.from);
        expect(m.titleKey, m.id).toMatch(/^plan[A-Z]\w+$/);
        next = m.to + 1;
      }
      expect(next - 1).toBe(spec.count);
      plan.days.forEach((day, i) => {
        const m = plan.movements.find((x) => x.from <= i + 1 && x.to >= i + 1);
        expect(day.movement, `day ${i + 1}`).toBe(m.id);
      });
    });

    it('titles every day in all sixteen languages, distinctly, in Simplified Chinese', () => {
      for (const [i, day] of plan.days.entries()) {
        for (const lang of LANG_CODES) {
          expect(day.theme?.[lang]?.trim().length, `day ${i + 1} ${lang}`).toBeGreaterThan(0);
        }
        const traditional = [...day.theme.zh].filter((c) => TRADITIONAL_ONLY.has(c));
        expect(traditional, `day ${i + 1} zh`).toEqual([]);
      }
      for (const lang of SOURCE_LANGS) {
        expect(new Set(plan.days.map((d) => d.theme[lang])).size, lang).toBe(spec.count);
      }
    });

    it('cites only references the Bible pipeline resolves, in every language', () => {
      const refs = [plan.biblical.ref, ...plan.days.flatMap((d) => [d.ref, ...(d.related || [])])];
      for (const day of plan.days) expect((day.related || []).length).toBeLessThanOrEqual(3);
      for (const ref of refs) {
        const usfm = usfmFromReference(ref);
        expect(usfm, ref).toBeTruthy();
        for (const lang of LANG_CODES) expect(usfmFromReference(localizeRef(ref, lang)), `${lang}/${ref}`).toBe(usfm);
      }
    });

    it('authors every piece of prose in English and French, and never embeds Bible text', () => {
      for (const field of ['intro', 'completion']) {
        for (const lang of SOURCE_LANGS) expect(plan[field]?.[lang]?.length, `${field}.${lang}`).toBeGreaterThan(80);
      }
      for (const lang of SOURCE_LANGS) expect(plan.biblical.text[lang]?.length, `biblical.${lang}`).toBeGreaterThan(80);
      for (const lang of SOURCE_LANGS) {
        expect(new Set(plan.days.map((d) => d.reflection[lang])).size, `distinct reflections ${lang}`).toBe(spec.count);
      }
      for (const [i, day] of plan.days.entries()) {
        const at = `day ${i + 1}`;
        for (const lang of SOURCE_LANGS) expect(day.reflection?.[lang]?.length, `${at} reflection ${lang}`).toBeGreaterThan(60);
        for (const forbidden of ['verseText', 'scriptureText', 'text', 'readingRefs']) expect(day[forbidden], `${at} ${forbidden}`).toBeUndefined();
        if (spec.mode === 'study') {
          expect(day.study, at).toBeTruthy();
          expect(day.study.questions.length, at).toBeGreaterThanOrEqual(2);
          for (const f of [...day.study.questions, day.study.synthesis, day.study.prayer]) {
            for (const lang of SOURCE_LANGS) expect(f?.[lang]?.length, `${at} study ${lang}`).toBeGreaterThan(10);
          }
        } else {
          expect(day.study, at).toBeUndefined();
          expect(day.prompts?.length, `${at} prompts`).toBeGreaterThanOrEqual(2);
          expect(day.prompts.length, `${at} prompts`).toBeLessThanOrEqual(4);
          for (const p of day.prompts) for (const lang of SOURCE_LANGS) expect(p?.[lang]?.length, `${at} prompt ${lang}`).toBeGreaterThan(15);
          for (const lang of SOURCE_LANGS) expect(day.practice?.[lang]?.length, `${at} practice ${lang}`).toBeGreaterThan(15);
        }
        // Other languages fall back to the authored English prose.
        expect(pick(day.reflection, 'de')).toBe(day.reflection.en);
      }
    });

    it('never speaks for God to the reader', () => {
      expectNoProseMatching(plan, NEVER);
    });

    it('tags every day with known resource topics and keeps the shelf inside its domains', () => {
      for (const [i, day] of plan.days.entries()) {
        expect(day.resourceTopics?.length, `day ${i + 1}`).toBeGreaterThan(0);
        for (const topic of day.resourceTopics) expect(RESOURCE_TOPICS, `day ${i + 1}`).toContain(topic);
        const rows = resolveResources({ topics: day.resourceTopics, domains: plan.resourceDomains, languages: LANG_CODES });
        for (const row of rows) {
          const entry = RESOURCES.find((r) => r.id === row.id);
          expect(entry.domains.some((d) => plan.resourceDomains.includes(d)), `${row.id} on day ${i + 1}`).toBe(true);
        }
      }
    });

    it('has its title, subtitle and movement names in all sixteen locales', async () => {
      for (const lang of LANG_CODES) {
        const locale = (await import(`../../../i18n/locales/${lang}.js`)).default;
        for (const key of [plan.titleKey, plan.subKey, ...plan.movements.map((m) => m.titleKey)]) {
          expect(locale[key]?.trim().length, `${lang}/${key}`).toBeGreaterThan(0);
        }
      }
    });
  });
}
