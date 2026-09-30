import { describe, it, expect } from 'vitest';
import { IDENTITY_IN_CHRIST as plan } from './identityInChrist';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'identity21',
  count: 21,
  category: 'formation',
  mode: 'prayer',
  domains: ['christian-living'],
  movements: ['rescued', 'united', 'belonging', 'living'],
});

const day = (n) => plan.days[n - 1];
const dayText = (n, lang) => {
  const d = day(n);
  return [d.reflection, ...d.prompts, d.selfPrompt, d.practice, d.safetyNote]
    .filter(Boolean)
    .map((v) => v[lang])
    .join(' ');
};
const allText = (lang) => proseOf(plan).filter((r) => r.lang === lang).map((r) => r.text).join(' ');

describe('identity21 guardrails', () => {
  it('never claims present sinless perfection', () => {
    expectNoProseMatching(plan, [
      /\bsinless\b/i,
      /\b(?:you|we) (?:are|'re) (?:now |already )?(?:perfect|without sin)\b/i,
      /\b(?:you|we) (?:no longer|never) (?:sin|struggle|fall)\b/i,
      /\bnever (?:sin|struggle|fall) again\b/i,
      /\byour (?:battle|struggle) (?:with sin )?is (?:already )?over\b/i,
      /\btu (?:ne )?(?:pèches|luttes|tombes) plus\b/i,
      /\bplus jamais (?:pécher|lutter|tomber)\b/i,
      /\btu es (?:désormais |déjà |maintenant )?(?:parfait|sans péché)\b/i,
      /\bton combat (?:contre le péché )?est (?:déjà )?(?:fini|terminé)\b/i,
    ]);
  });

  it('keeps struggle and repentance beside "new creation" and "free from sin"', () => {
    for (const n of [8, 16]) {
      expect(dayText(n, 'en'), `day ${n} en`).toMatch(/struggl|repent|confess|refuse/i);
      expect(dayText(n, 'fr'), `day ${n} fr`).toMatch(/combat|repentance|confess|refuse/i);
    }
    expect(dayText(4, 'en')).toMatch(/confess/i);
    expect(dayText(19, 'en')).toMatch(/not finished/i);
  });

  it('never uses self-esteem or self-help framing', () => {
    expectNoProseMatching(plan, [
      /\b(?:boost|build|raise|improve) (?:your )?self-esteem\b/i,
      /\bbelieve in yourself\b/i,
      /\blove yourself first\b/i,
      /\byou are enough\b/i,
      /\byou deserve\b/i,
      /\b(?:repeat|speak) (?:these |your )?(?:affirmations|declarations)\b/i,
      /\b(?:booster|renforcer|augmenter|améliorer) (?:ton |l['’])estime de soi\b/i,
      /\bcrois en toi\b/i,
      /\baime-toi d['’]abord\b/i,
      /\btu (?:te )?suffis\b/i,
      /\btu mérites\b/i,
    ]);
  });

  it('never promises an outcome or a feeling', () => {
    expectNoProseMatching(plan, [
      /\bguarantees? (?:that|you)\b/i,
      /\bGod will (?:surely|certainly|always) (?:give|make|remove|heal|change)\b/i,
      /(?<!(?:not|never) promise that )\byou will (?:surely |certainly )?(?:feel|be) (?:free|healed|different|new)\b/i,
      /\bgarantit (?:que|ta|ton|tes)\b/i,
      /\bDieu va (?:forcément|sûrement|certainement)\b/i,
      /\btu te sentiras (?:libre|guéri|différent|nouveau)\b/i,
    ]);
    expect(plan.intro.en).toMatch(/does not promise/i);
    expect(plan.intro.fr).toMatch(/ne te promet pas/i);
  });

  it('names the false sources of identity it sets out to address', () => {
    const en = allText('en');
    const fr = allText('fr');
    for (const re of [/achievement/i, /career/i, /money/i, /looks|appearance/i, /relationship status/i, /failure/i, /shame/i, /approval/i, /ministry success/i]) {
      expect(en).toMatch(re);
    }
    for (const re of [/accomplissement|réussite/i, /carrière/i, /argent/i, /apparence/i, /situation amoureuse/i, /échec/i, /honte/i, /approbation/i, /succès dans le ministère/i]) {
      expect(fr).toMatch(re);
    }
  });

  it('writes adoption for readers with painful family histories', () => {
    expect(dayText(10, 'en')).toMatch(/painful/i);
    expect(dayText(10, 'en')).toMatch(/not ask you to picture the father you had/i);
    expect(dayText(9, 'en')).toMatch(/family tree/i);
  });

  it('keeps "chosen" with Ephesians 1 rather than a debate on election', () => {
    expect(day(11).ref).toBe('Ephesians 1:3-14');
    expect(dayText(11, 'en')).toMatch(/worship, not argument/i);
    expectNoProseMatching(plan, [/\b(?:predestin|reprobat|limited atonement|irresistible grace)/i, /\b(?:prédestin|réprobation)/i]);
  });

  it('carries a safety note on the days that need one, pointing to real help', () => {
    const withNotes = plan.days.flatMap((d, i) => (d.safetyNote ? [i + 1] : []));
    expect(withNotes).toEqual([10, 13, 17]);
    for (const n of withNotes) {
      expect(day(n).safetyNote.en, `day ${n}`).toMatch(/pastor|counsellor/i);
      expect(day(n).safetyNote.fr, `day ${n}`).toMatch(/pasteur|conseiller/i);
    }
    for (const n of [13, 17]) {
      expect(day(n).safetyNote.en, `day ${n}`).toMatch(/emergency services/i);
      expect(day(n).safetyNote.fr, `day ${n}`).toMatch(/services d['’]urgence/i);
    }
    expect(day(17).safetyNote.en).toMatch(/harming yourself/i);
  });

  it('treats the past with grace without minimising harm done or suffered', () => {
    expect(dayText(17, 'en')).toMatch(/does not erase/i);
    expect(dayText(17, 'en')).toMatch(/repair|make it right/i);
    expect(dayText(17, 'en')).toMatch(/not as your guilt/i);
    expect(day(13).safetyNote.en).toMatch(/not yours/i);
  });

  it('opens and closes in Christ', () => {
    for (const n of [1, 21]) {
      expect(day(n).reflection.en, `day ${n}`).toMatch(/Christ/);
      expect(day(n).reflection.fr, `day ${n}`).toMatch(/Christ/);
    }
    expect(day(21).ref).toBe('Colossians 3:1-4');
  });
});
