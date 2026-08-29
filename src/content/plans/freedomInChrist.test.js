// Content tests for "Freedom & Deliverance in Christ".
//
// This plan touches the most dangerous material the app carries, so the tests
// defend the rules rather than the prose:
//
//   1. NO SCRIPTURE TEXT IS AUTHORED OR GENERATED. Days and prayer modules carry
//      references only, and every reference must resolve deterministically
//      through the app's existing citation transform.
//   2. THE APP NEVER DIAGNOSES. No day, example, prayer module or explanation
//      may assert that a demon is present, that a curse exists, that an ancestor
//      made a covenant, that a dream proves bondage, that a hardship proves a
//      curse, or that the Holy Spirit revealed something through this app.
//   3. CULTURE IS NEVER EQUATED WITH IDOLATRY. Where a day names traditional or
//      African practice at all, it must name the actual criterion — explicit
//      worship, invocation, dependence or allegiance contrary to Christ.
//   4. CERTAINTY CHANGES THE PRAYER. Personal participation, known family
//      history, a reported story and not knowing are prayed differently, and a
//      reader is never guided to confess guilt for what someone else did.
import { describe, it, expect } from 'vitest';
import { FREEDOM_IN_CHRIST, MOVEMENTS, CONTINUE_THEMES, LOOK_BACK } from './freedomInChrist.js';
import { PRAYER_MODULES } from './freedom/prayerModules.js';
import { CERTAINTY_LEVELS, CERTAINTY_IDS, isCertainty, REMEMBRANCE_ANSWERS } from './freedom/certainty.js';
import { buildGuidedSession, OVERRIDABLE_STEPS, DAY_EXTRA_MODULES } from '../../lib/freedomSession.js';
import { PLANS, getPlan, plansByCategory, planDayContent, PLAN_CATEGORIES } from '../prayerPlans.js';
import { usfmFromReference } from '../../lib/bibleRef.js';
import { canUsePlan, isPlanReviewed } from '../../lib/planReview.js';
import { LANG_CODES, t, loadLocale } from '../../i18n.js';
import { pick } from '../teaching/pick.js';

const plan = FREEDOM_IN_CHRIST;

// Everything the plan SAYS in English, in one string — the corpus the wording
// rules below are asserted against.
const dayText = (day) => [
  pick(day.reflection, 'en'),
  pick(day.practice, 'en'),
  pick(day.safetyNote, 'en'),
  pick(day.freedom?.understand, 'en'),
  ...(day.prompts || []).map((p) => pick(p, 'en')),
  ...(day.freedom?.examples || []).map((e) => pick(e, 'en')),
  ...Object.values(day.freedom?.stepText || {}).map((s) => pick(s, 'en')),
].filter(Boolean).join(' ');

const PLAN_CORPUS = [
  pick(plan.intro, 'en'),
  pick(plan.biblical.text, 'en'),
  pick(plan.completion, 'en'),
  ...plan.days.map(dayText),
  ...Object.values(PRAYER_MODULES).map((m) => pick(m.body, 'en')),
].join(' ');

describe('the plan runs on the existing engine', () => {
  it('is one of the shipped PLANS and resolves by id', () => {
    expect(PLANS).toContain(plan);
    expect(getPlan('freedom30')).toBe(plan);
  });

  it('files under its own category, and every plan category is a known one', () => {
    expect(PLAN_CATEGORIES.map((c) => c.id)).toContain('freedom');
    const known = new Set(PLAN_CATEGORIES.map((c) => c.id));
    for (const p of PLANS) expect(known.has(p.category)).toBe(true);
  });

  it('runs for 30 days, and every day number resolves', () => {
    expect(plan.count).toBe(30);
    expect(plan.days).toHaveLength(30);
    for (let n = 1; n <= 30; n += 1) expect(planDayContent('freedom30', n)).toBe(plan.days[n - 1]);
    expect(planDayContent('freedom30', 31)).toBeNull();
    expect(planDayContent('freedom30', 0)).toBeNull();
  });

  it('keeps the five movements, in the spans the journey was designed around', () => {
    expect(MOVEMENTS.map((m) => [m.id, m.from, m.to])).toEqual([
      ['established', 1, 5], ['repentance', 6, 10], ['family', 11, 20], ['warfare', 21, 26], ['walking', 27, 30],
    ]);
    plan.days.forEach((day, i) => {
      const movement = MOVEMENTS.find((m) => i + 1 >= m.from && i + 1 <= m.to);
      expect(day.movement).toBe(movement.id);
    });
  });

  it('stays unavailable in production until a human has signed it off', () => {
    expect(isPlanReviewed(plan)).toBe(false);
    expect(canUsePlan(plan, { preview: false })).toBe(false);
    // It remains discoverable without exposing the curriculum or Start action.
    const production = plansByCategory(PLANS).flatMap((g) => g.plans);
    expect(production).toContain(plan);
    // Reviewers still see it in a development preview.
    expect(canUsePlan(plan, { preview: true })).toBe(true);
  });

  it('declares only analytics events that exist on the allowlist, and no properties', async () => {
    const { EVENTS, isEventAllowed } = await import('../../lib/analytics.js');
    for (const name of Object.values(plan.analyticsEvents)) {
      expect(isEventAllowed(name), name).toBe(true);
      expect(Object.values(EVENTS)).toContain(name);
    }
  });
});

describe('Scripture is referenced, never authored', () => {
  it('resolves every primary, related and stand-on reference to a USFM passage id', () => {
    for (const day of plan.days) {
      expect(usfmFromReference(day.ref), day.ref).toBeTruthy();
      for (const ref of day.related || []) expect(usfmFromReference(ref), ref).toBeTruthy();
      for (const ref of day.freedom?.standRefs || []) expect(usfmFromReference(ref), ref).toBeTruthy();
    }
    expect(usfmFromReference(plan.biblical.ref)).toBeTruthy();
  });

  it('resolves every reference cited by a reviewed prayer module', () => {
    for (const module of Object.values(PRAYER_MODULES)) {
      expect(module.refs.length, module.id).toBeGreaterThan(0);
      for (const ref of module.refs) expect(usfmFromReference(ref), `${module.id} / ${ref}`).toBeTruthy();
    }
  });

  it('gives every day a primary passage — including every renunciation day', () => {
    for (const day of plan.days) {
      expect(day.ref, pick(day.theme, 'en')).toBeTruthy();
      // A day that asks for renunciation must also say what it stands on.
      if (day.freedom?.inventory) expect(day.freedom.standRefs?.length, pick(day.theme, 'en')).toBeGreaterThan(0);
    }
  });

  it('never embeds quoted Bible text in a day’s prose or in a prayer module', () => {
    for (const day of plan.days) expect(dayText(day)).not.toMatch(/["“”][^"“”]{40,}["“”]/);
    for (const module of Object.values(PRAYER_MODULES)) {
      expect(pick(module.body, 'en'), module.id).not.toMatch(/["“”][^"“”]{40,}["“”]/);
    }
  });
});

describe('Praystead guides; it never diagnoses', () => {
  // Claims the app may never make. Written to catch the ASSERTION, not the
  // vocabulary: the plan talks about curses and covenants constantly, and must,
  // but it may never say that one is present.
  const FORBIDDEN = [
    /\byou have a (demon|spirit of|curse)/i,
    /\bthere is a (demon|curse|covenant) (on|over|in) you/i,
    /\bthis (is|means|proves) (a|an) (demon|curse|covenant)/i,
    /\byour ancestor (made|entered|swore)/i,
    /\bthis dream (means|proves|shows)/i,
    /\bGod (has )?revealed (to you )?that/i,
    /\bthe Holy Spirit (has )?(told|showed|revealed) (you|us) that/i,
    /\bproves? (a|an|the) (curse|covenant|demonic)/i,
    /\bis definitely (a|an|demonic|cursed)/i,
    /\bevery (illness|delay|sickness|hardship) is/i,
  ];

  it('makes none of the forbidden claims anywhere in the plan', () => {
    for (const pattern of FORBIDDEN) expect(PLAN_CORPUS, String(pattern)).not.toMatch(pattern);
  });

  it('introduces category examples as illustrative rather than definitive', async () => {
    await loadLocale('en');
    expect(t('en', 'freedomExamplesHeading')).toMatch(/can include/i);
    for (const day of plan.days) {
      for (const example of day.freedom?.examples || []) {
        expect(pick(example, 'en'), pick(day.theme, 'en')).not.toMatch(/definitely|always means|proves/i);
      }
    }
  });

  it('explains every category that carries an inventory, so a new believer is not asked to self-assess blind', () => {
    for (const day of plan.days) {
      if (!day.freedom?.inventory) continue;
      expect(pick(day.freedom.understand, 'en'), pick(day.theme, 'en')).toBeTruthy();
    }
  });

  it('says out loud that nothing coming to mind is a complete answer', async () => {
    await loadLocale('en');
    expect(t('en', 'freedomNothingReassurance')).toMatch(/do not need to force/i);
    expect(REMEMBRANCE_ANSWERS.map((a) => a.id)).toEqual(['note', 'nothing', 'unsure']);
  });
});

describe('culture is never equated with idolatry, and no one is accused', () => {
  it('names the actual criterion wherever traditional or family practice is discussed', () => {
    const idolatry = plan.days[5]; // Renouncing idolatry
    const family = plan.days[11]; // Family ancestral and spirit worship
    const objects = plan.days[14]; // Family shrines, altars and objects
    for (const day of [idolatry, family, objects]) {
      const understand = pick(day.freedom.understand, 'en');
      expect(understand, pick(day.theme, 'en')).toMatch(/worship|invocation|dependence|allegiance/i);
      expect(understand, pick(day.theme, 'en')).toMatch(/not|never/i);
    }
    expect(pick(family.freedom.understand, 'en')).toMatch(/heritage is never bondage/i);
    expect(pick(objects.freedom.understand, 'en')).toMatch(/heirloom|cultural symbol/i);
  });

  it('never condemns a name for its language, ethnicity or origin', () => {
    const naming = plan.days[17];
    const understand = pick(naming.freedom.understand, 'en');
    expect(understand).toMatch(/A name is not demonic/i);
    expect(understand).toMatch(/language|ethnicity|African origin/i);
  });

  it('tells the reader not to accuse a relative of witchcraft', () => {
    const occultHistory = plan.days[16];
    expect(pick(occultHistory.safetyNote, 'en')).toMatch(/never accuse a relative of witchcraft/i);
  });

  it('does not send anyone to destroy property, break the law or confront a relative', () => {
    const objects = plan.days[14];
    const practice = pick(objects.practice, 'en');
    expect(practice).toMatch(/do not burn/i);
    expect(practice).toMatch(/law|trespass|cultural property/i);
    expect(practice).toMatch(/pastor/i);
  });
});

describe('safety: nothing is spiritualised at the cost of real help', () => {
  it('states that prayer and medical or psychiatric care are not enemies', () => {
    const fear = plan.days[21];
    const note = pick(fear.safetyNote, 'en');
    expect(note).toMatch(/not enemies/i);
    expect(note).toMatch(/medication|psychiatric|therapy|medical/i);
    expect(note).toMatch(/emergency|doctor/i);
  });

  it('never tells anyone experiencing harm to stay, submit more, or stop seeking help', () => {
    expect(PLAN_CORPUS).not.toMatch(/simply forgive and (stay|remain)/i);
    expect(PLAN_CORPUS).not.toMatch(/submit more/i);
    expect(PLAN_CORPUS).not.toMatch(/stop seeking help/i);
    // Forgiveness day says the opposite, explicitly.
    expect(pick(plan.days[4].safetyNote, 'en')).toMatch(/never means staying/i);
  });

  it('offers fasting without prescribing it, and never makes freedom depend on it', async () => {
    await loadLocale('en');
    const body = t('en', 'freedomFastBody');
    expect(body).toMatch(/nothing in this plan depends on fasting/i);
    expect(body).toMatch(/social media|entertainment/i);
    expect(body).not.toMatch(/\b(\d+)\s*(day|days|week)s?\b/i); // no prescribed duration
    const fastingDays = plan.days.filter((d) => d.freedom?.fasting);
    expect(fastingDays.length).toBeGreaterThan(0);
    expect(fastingDays.length).toBeLessThanOrEqual(3);
  });

  it('never suggests money, payment or a minister’s fee has anything to do with freedom', () => {
    expect(PLAN_CORPUS).not.toMatch(/\b(pay|payment|fee|offering|donate|sow a seed)\b.{0,40}\b(deliverance|freedom|breakthrough)\b/i);
  });

  it('never sends a reader to investigate their history through fear or divination', () => {
    expect(PLAN_CORPUS).not.toMatch(/find out (what|who) your (ancestors|family)/i);
    expect(pick(plan.days[10].practice, 'en')).toMatch(/do not go looking for it through fear/i);
    expect(pick(PRAYER_MODULES.entrustUnknown.body, 'en')).toMatch(/will not go looking/i);
  });
});

describe('certainty changes the prayer', () => {
  it('offers the five distinct levels, and treats an unknown value as unanswered', () => {
    expect(CERTAINTY_IDS).toEqual(['personal', 'known_family_history', 'reported_family_history', 'uncertain', 'none']);
    for (const id of CERTAINTY_IDS) expect(isCertainty(id)).toBe(true);
    expect(isCertainty('anything-else')).toBe(false);
    expect(isCertainty(undefined)).toBe(false);
  });

  const inventoryDay = () => FREEDOM_IN_CHRIST.days.find((d) => d.freedom?.inventory);

  it('gives personal participation repentance AND renunciation', () => {
    const ids = buildGuidedSession(inventoryDay(), 'personal').map((s) => s.id);
    expect(ids).toContain('repentPersonal');
    expect(ids).toContain('renouncePersonal');
  });

  it('gives known family history a family module and no personal confession of guilt', () => {
    const ids = buildGuidedSession(inventoryDay(), 'known_family_history').map((s) => s.id);
    expect(ids).toContain('bringKnownFamily');
    expect(ids).toContain('renounceFamilyAgreement');
    expect(ids).not.toContain('repentPersonal');
    expect(ids).not.toContain('renouncePersonal');
  });

  it('gives a reported story the uncertainty module, and never a confession of guilt', () => {
    const ids = buildGuidedSession(inventoryDay(), 'reported_family_history').map((s) => s.id);
    expect(ids).toContain('bringReportedFamily');
    expect(ids).toContain('rejectFear');
    expect(ids).not.toContain('repentPersonal');
  });

  it('turns not knowing into trust rather than investigation', () => {
    const ids = buildGuidedSession(inventoryDay(), 'uncertain').map((s) => s.id);
    expect(ids).toContain('entrustUnknown');
    expect(ids).toContain('rejectFear');
    expect(ids).not.toContain('repentPersonal');
    expect(ids).not.toContain('renouncePersonal');
  });

  it('treats "not applicable" as exactly that: no category module at all', () => {
    const ids = buildGuidedSession(inventoryDay(), 'none').map((s) => s.id);
    for (const id of ['repentPersonal', 'renouncePersonal', 'bringKnownFamily', 'bringReportedFamily', 'entrustUnknown']) {
      expect(ids, id).not.toContain(id);
    }
    // The day is still a complete prayer: it opens with the Holy Spirit, prays
    // the Word, and closes in thanksgiving (with the day's practical step, when
    // it has one, after it).
    expect(ids[0]).toBe('inviteSpirit');
    expect(ids).toContain('prayTheWord');
    expect(ids).toContain('thanksgiving');
    expect(ids.at(-1)).toMatch(/thanksgiving|practicalObedience/);
  });

  it('prays the general form when the question was never answered', () => {
    const ids = buildGuidedSession(inventoryDay(), null).map((s) => s.id);
    expect(ids).toContain('bringBeforeGod');
    expect(ids).not.toContain('repentPersonal');
    expect(ids).not.toContain('renouncePersonal');
  });

  it('never treats an answer as proof that anything is true', () => {
    // The certainty ids themselves are the whole vocabulary — there is no
    // "confirmed", "diagnosed" or "detected" state anywhere in the model.
    expect(CERTAINTY_LEVELS.map((c) => c.id).join(' ')).not.toMatch(/confirm|diagnos|detect|proven/i);
  });
});

describe('the guided session is deterministic, ordered and non-duplicating', () => {
  const day = () => FREEDOM_IN_CHRIST.days.find((d) => d.freedom?.inventory);

  it('produces the same steps for the same inputs', () => {
    const a = buildGuidedSession(day(), 'personal').map((s) => s.id);
    const b = buildGuidedSession(day(), 'personal').map((s) => s.id);
    expect(a).toEqual(b);
  });

  it('keeps the biblical order: God is invited and Christ confessed before anything is examined', () => {
    for (const level of [...CERTAINTY_IDS, null]) {
      const ids = buildGuidedSession(day(), level).map((s) => s.id);
      expect(ids[0]).toBe('inviteSpirit');
      expect(ids[1]).toBe('confessChrist');
      expect(ids.at(-1)).toMatch(/thanksgiving|practicalObedience/);
    }
  });

  it('puts repentance before renunciation, and Scripture before standing', () => {
    const ids = buildGuidedSession(day(), 'personal').map((s) => s.id);
    expect(ids.indexOf('repentPersonal')).toBeLessThan(ids.indexOf('renouncePersonal'));
    expect(ids.indexOf('renouncePersonal')).toBeLessThan(ids.indexOf('prayTheWord'));
    expect(ids.indexOf('prayTheWord')).toBeLessThan(ids.indexOf('standInChrist'));
    expect(ids.indexOf('standInChrist')).toBeLessThan(ids.indexOf('askFilled'));
  });

  it('never repeats a module, even when a day and a certainty both ask for one', () => {
    const comprehensive = FREEDOM_IN_CHRIST.days[19]; // day 20 adds forgiveness
    for (const level of [...CERTAINTY_IDS, null]) {
      const ids = buildGuidedSession(comprehensive, level).map((s) => s.id);
      expect(new Set(ids).size, `${level}`).toBe(ids.length);
    }
  });

  it('only lets a day name reviewed modules, and only reword the steps it may', () => {
    for (const day_ of plan.days) {
      for (const id of day_.freedom?.modules || []) {
        expect(DAY_EXTRA_MODULES, `${pick(day_.theme, 'en')} / ${id}`).toContain(id);
      }
      for (const id of Object.keys(day_.freedom?.stepText || {})) {
        expect(OVERRIDABLE_STEPS, `${pick(day_.theme, 'en')} / ${id}`).toContain(id);
      }
    }
  });

  it('resolves every assembled step to an authored body and a localized title', async () => {
    await loadLocale('en');
    for (const step of buildGuidedSession(day(), 'personal')) {
      expect(pick(step.body, 'en'), step.id).toBeTruthy();
      expect(t('en', step.titleKey), step.id).not.toBe(step.titleKey);
    }
  });

  it('never produces a session so long that it becomes a wall of text', () => {
    for (const day_ of plan.days) {
      for (const level of [...CERTAINTY_IDS, null]) {
        const steps = buildGuidedSession(day_, level);
        expect(steps.length, `${pick(day_.theme, 'en')} / ${level}`).toBeGreaterThanOrEqual(6);
        expect(steps.length, `${pick(day_.theme, 'en')} / ${level}`).toBeLessThanOrEqual(12);
      }
    }
  });
});

describe('day 20 gathers rather than introduces', () => {
  it('adds no category the reader has not already met', () => {
    const comprehensive = plan.days[19];
    expect(comprehensive.freedom.examples).toBeUndefined();
    expect(pick(comprehensive.freedom.understand, 'en')).toMatch(/no new categories/i);
  });
});

describe('the plan is centred on Christ, not on evil', () => {
  it('opens at the cross and closes in the vine', () => {
    expect(plan.days[0].ref).toBe('Colossians 2:13-15');
    expect(plan.days[29].ref).toBe('John 15:1-11');
  });

  it('names Christ far more often than it names what opposes Him', () => {
    const christ = (PLAN_CORPUS.match(/\b(Christ|Jesus|God|Holy Spirit|Lord)\b/gi) || []).length;
    const evil = (PLAN_CORPUS.match(/\b(demon|demonic|Satan|devil|curse|curses|occult|witchcraft)\b/gi) || []).length;
    expect(christ).toBeGreaterThan(evil * 2);
  });

  it('invites the Holy Spirit as the first step of every guided session', () => {
    for (const day of plan.days) {
      expect(buildGuidedSession(day, null)[0].id).toBe('inviteSpirit');
    }
  });

  it('ends the plan by refusing the fear of having missed something', () => {
    expect(pick(plan.days[29].freedom.understand, 'en')).toMatch(/do not need to keep discovering/i);
    expect(pick(plan.completion, 'en')).toMatch(/do not need to keep discovering/i);
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
      expect(day.reflection.en && day.reflection.fr, pick(day.theme, 'en')).toBeTruthy();
      expect(pick(day.reflection, 'ko')).toBe(day.reflection.en);
    }
    for (const module of Object.values(PRAYER_MODULES)) {
      expect(module.body.en && module.body.fr, module.id).toBeTruthy();
    }
  });

  it('declares no prose overlays until competent speakers have reviewed one', () => {
    // A structural stub DISPLACES the authored English and French once merged,
    // so an unreviewed overlay is worse than none. See docs/FREEDOM_DELIVERANCE.md.
    expect(plan.proseTranslations).toEqual([]);
  });

  it('resolves every UI label the plan and its guided walk need, in all 16 languages', async () => {
    const keys = [
      plan.titleKey, plan.subKey, 'planCategoryFreedom', 'planLookBackHeading',
      ...MOVEMENTS.map((m) => m.titleKey),
      ...CONTINUE_THEMES.flatMap((c) => [c.titleKey, c.descKey]),
      ...LOOK_BACK,
      ...CERTAINTY_LEVELS.map((c) => c.labelKey),
      ...REMEMBRANCE_ANSWERS.map((a) => a.labelKey),
      ...Object.values(PRAYER_MODULES).map((m) => m.titleKey),
      'freedomCertaintyQuestion', 'freedomCertaintyPrivacy', 'freedomQuietSpace',
      'freedomRemembranceQuestion', 'freedomNothingReassurance', 'freedomNoteHint',
      'freedomWhatThisMeans', 'freedomExamplesHeading',
      'freedomModeQuestion', 'freedomModeGuided', 'freedomModeGuidedDesc',
      'freedomModePoints', 'freedomModePointsDesc', 'freedomModeFree', 'freedomModeFreeDesc',
      'freedomModeRecommended', 'freedomModeFreeHint', 'freedomResumeGuided',
      'freedomGuidedSessionLabel', 'freedomStepOf', 'freedomGuidedPrayerLabel',
      'freedomPausePrayer', 'freedomAmenFinish', 'freedomNextStep',
      'freedomFastHeading', 'freedomFastBody',
    ];
    for (const code of LANG_CODES) {
      await loadLocale(code);
      for (const key of keys) {
        const value = t(code, key);
        expect(value, `${key} / ${code}`).not.toBe(key);
        expect(value.length, `${key} / ${code}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the {n} / {total} placeholders intact in every language', async () => {
    for (const code of LANG_CODES) {
      await loadLocale(code);
      const value = t(code, 'freedomStepOf', { n: 3, total: 9 });
      expect(value, code).toMatch(/3/);
      expect(value, code).toMatch(/9/);
      expect(value, code).not.toMatch(/\{n\}|\{total\}/);
    }
  });
});

describe('resource topics', () => {
  it('tags every day with topics the resolver can look up', async () => {
    const { RESOURCE_TOPICS } = await import('../resources/topics.js');
    for (const day of plan.days) {
      expect(day.resourceTopics.length, pick(day.theme, 'en')).toBeGreaterThan(0);
      for (const topic of day.resourceTopics) expect(RESOURCE_TOPICS, topic).toContain(topic);
    }
  });

  it('gives every movement its own shelf topics', async () => {
    const { RESOURCE_TOPICS } = await import('../resources/topics.js');
    for (const movement of MOVEMENTS) {
      expect(movement.resourceTopics.length, movement.id).toBeGreaterThan(0);
      for (const topic of movement.resourceTopics) expect(RESOURCE_TOPICS, topic).toContain(topic);
    }
  });

  it('declares a perspective order made only of known perspectives', async () => {
    const { RESOURCE_PERSPECTIVES } = await import('../resources/topics.js');
    expect(plan.resourcePerspectives[0]).toBe('african-pentecostal');
    for (const p of plan.resourcePerspectives) expect(RESOURCE_PERSPECTIVES, p).toContain(p);
  });
});
