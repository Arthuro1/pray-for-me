// Content tests for "Preparing in Prayer".
//
// Two things are being defended here, and they are the whole reason the plan
// exists in the shape it does:
//
//   1. NO SCRIPTURE TEXT IS AUTHORED OR GENERATED. Days carry references only,
//      and every reference must resolve deterministically to a USFM passage id
//      through the app's existing citation transform — no AI round-trip, no
//      invented wording.
//   2. NOTHING PROMISES MARRIAGE. The plan may pray honestly about it, but it
//      may never assert that a spouse exists, is coming, or is "yours".
import { describe, it, expect } from 'vitest';
import { PREPARING_IN_PRAYER, MOVEMENTS, CONTINUE_THEMES } from './preparingInPrayer.js';
import { PLANS, getPlan, plansByCategory, planDayContent, PLAN_CATEGORIES } from '../prayerPlans.js';
import { usfmFromReference } from '../../lib/bibleRef.js';
import { LANG_CODES, t, loadLocale } from '../../i18n.js';
import { pick } from '../teaching/pick.js';

const plan = PREPARING_IN_PRAYER;
const allText = (day) => [
  pick(day.reflection, 'en'),
  pick(day.selfPrompt, 'en'),
  pick(day.practice, 'en'),
  ...(day.prompts || []).map((p) => pick(p, 'en')),
  ...Object.values(day.roles || {}).map((r) => pick(r, 'en')),
].filter(Boolean).join(' ');

describe('the plan is registered on the existing engine', () => {
  it('is one of the shipped PLANS and resolves by id', () => {
    expect(PLANS).toContain(plan);
    expect(getPlan('preparing21')).toBe(plan);
  });

  it('appears under Relationships & family, and every category is a known one', () => {
    const relationships = plansByCategory().find((g) => g.id === 'relationships');
    expect(relationships.plans).toContain(plan);
    const known = new Set(PLAN_CATEGORIES.map((c) => c.id));
    for (const p of PLANS) expect(known.has(p.category)).toBe(true);
  });

  it('runs for 21 days, and every day number resolves', () => {
    expect(plan.count).toBe(21);
    expect(plan.days).toHaveLength(21);
    for (let n = 1; n <= 21; n++) expect(planDayContent('preparing21', n)).toBe(plan.days[n - 1]);
    // Off the end, and before the start, there is simply nothing.
    expect(planDayContent('preparing21', 22)).toBeNull();
    expect(planDayContent('preparing21', 0)).toBeNull();
  });

  it('keeps the four movements, in the spans the journey was designed around', () => {
    expect(MOVEMENTS.map((m) => [m.id, m.from, m.to])).toEqual([
      ['rooted', 1, 5], ['becoming', 6, 10], ['intercede', 11, 17], ['surrender', 18, 21],
    ]);
    plan.days.forEach((day, i) => {
      const movement = MOVEMENTS.find((m) => i + 1 >= m.from && i + 1 <= m.to);
      expect(day.movement).toBe(movement.id);
    });
  });
});

describe('Scripture is referenced, never authored', () => {
  it('resolves every primary and related reference to a USFM passage id', () => {
    for (const day of plan.days) {
      expect(usfmFromReference(day.ref), day.ref).toBeTruthy();
      for (const ref of day.related || []) expect(usfmFromReference(ref), ref).toBeTruthy();
      for (const role of Object.values(day.roles || {})) {
        if (role.ref) expect(usfmFromReference(role.ref), role.ref).toBeTruthy();
      }
    }
    expect(usfmFromReference(plan.biblical.ref)).toBeTruthy();
  });

  it('never embeds quoted Bible text in a day’s prose', () => {
    // A quotation mark around a whole sentence is how Scripture text would slip
    // in; the reflections paraphrase instead, and cite by reference.
    for (const day of plan.days) {
      expect(allText(day)).not.toMatch(/["“”][^"“”]{40,}["“”]/);
    }
  });

  it('keeps related passages to a handful, so the primary one stays dominant', () => {
    for (const day of plan.days) expect((day.related || []).length).toBeLessThanOrEqual(3);
  });
});

describe('nothing promises marriage', () => {
  // Phrasings that would assert a spouse exists or is on the way. Kept narrow on
  // purpose: "the One he already had" (day 1, about God) is exactly the sentence
  // this plan is built on, so only the romantic sense of the phrase is banned.
  const FORBIDDEN = [
    /your (future )?(husband|wife)\b/i,
    /your spouse\b/i,
    /(find|finding|meet|meeting) "?the one"?\b/i,
    /is waiting for you/i,
    /has someone (prepared|waiting|for you)/i,
    /when God sends (them|him|her)/i,
    /will (bring|send) you a (spouse|husband|wife)/i,
    /god will bring/i,
  ];

  it('avoids language that guarantees a spouse anywhere in the plan', () => {
    const corpus = [
      pick(plan.intro, 'en'), pick(plan.biblical.text, 'en'), pick(plan.completion, 'en'),
      ...plan.days.map(allText), ...plan.days.map((d) => pick(d.theme, 'en')),
    ].join(' ');
    for (const pattern of FORBIDDEN) expect(corpus, String(pattern)).not.toMatch(pattern);
  });

  it('opens and closes with God rather than with marriage', () => {
    expect(pick(plan.days[0].theme, 'en')).toMatch(/God/i);
    expect(plan.days[20].ref).toBe('Matthew 6:33-34');
  });

  it('mirrors every intercession day back onto the reader', () => {
    // Days 11-17 pray for a person the reader may one day marry; each must also
    // turn the same prayer on the reader.
    for (const day of plan.days.filter((d) => d.movement === 'intercede')) {
      expect(pick(day.selfPrompt, 'en')).toBeTruthy();
    }
  });
});

describe('role-specific material stays small and opt-in', () => {
  it('carries husband/wife reflections on only a few of the 21 days', () => {
    const withRoles = plan.days.filter((d) => d.roles);
    expect(withRoles.length).toBeGreaterThan(0);
    expect(withRoles.length / plan.days.length).toBeLessThanOrEqual(0.25);
  });

  it('offers both roles wherever it offers one, and never changes the day’s Scripture', () => {
    for (const day of plan.days.filter((d) => d.roles)) {
      expect(Object.keys(day.roles).sort()).toEqual(['husband', 'wife']);
      // A role reflection may cite an extra passage, but never replaces the day's.
      for (const role of Object.values(day.roles)) {
        if (role.ref) expect(role.ref).not.toBe(day.ref);
      }
    }
  });

  it('does not reduce either role to a cultural stereotype', () => {
    const husband = plan.days.filter((d) => d.roles).map((d) => pick(d.roles.husband, 'en')).join(' ');
    const wife = plan.days.filter((d) => d.roles).map((d) => pick(d.roles.wife, 'en')).join(' ');
    // Prescriptions, not vocabulary: the wife reflections DO say "not in
    // silence, appearance, or performance", and naming a stereotype in order to
    // reject it is the opposite of teaching it. So these match the imperative.
    expect(husband).not.toMatch(/\b(provide for|be the provider|breadwinner|earn more|be dominant|take charge|make (every|the final) decision)\b/i);
    expect(wife).not.toMatch(/\b(must (obey|submit|be silent)|keep (silent|quiet)|stay quiet|her place is|look your best|please (him|your husband))\b/i);
    // Both are pointed at Christlike service instead.
    expect(husband).toMatch(/serve|responsibility|repent|listen/i);
    expect(wife).toMatch(/strength|wisdom|honest|security/i);
  });
});

describe('localization', () => {
  it('authors every day title in all 16 supported languages', () => {
    for (const day of plan.days) {
      for (const code of LANG_CODES) expect(day.theme[code], `${day.theme.en} / ${code}`).toBeTruthy();
    }
  });

  it('authors the longer prose in en + fr, which pick() falls back through', () => {
    for (const day of plan.days) {
      expect(day.reflection.en && day.reflection.fr).toBeTruthy();
      for (const prompt of day.prompts) expect(prompt.en && prompt.fr).toBeTruthy();
      // An unauthored language resolves to English rather than to nothing.
      expect(pick(day.reflection, 'ko')).toBe(day.reflection.en);
    }
  });

  it('resolves its title, subtitle, audience and movement labels from i18n', async () => {
    for (const code of LANG_CODES) {
      await loadLocale(code);
      for (const key of [plan.titleKey, plan.subKey, ...MOVEMENTS.map((m) => m.titleKey)]) {
        const value = t(code, key);
        expect(value, `${key} / ${code}`).not.toBe(key);
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it('gives every continue-praying theme a localized title and description', async () => {
    await loadLocale('en');
    for (const theme of CONTINUE_THEMES) {
      expect(t('en', theme.titleKey)).not.toBe(theme.titleKey);
      expect(t('en', theme.descKey)).not.toBe(theme.descKey);
    }
  });
});

describe('resource topics', () => {
  it('tags every day with at least one topic the resolver can look up', async () => {
    const { RESOURCE_TOPICS } = await import('../resources/topics.js');
    for (const day of plan.days) {
      expect(day.resourceTopics.length).toBeGreaterThan(0);
      for (const topic of day.resourceTopics) expect(RESOURCE_TOPICS, topic).toContain(topic);
    }
  });
});
