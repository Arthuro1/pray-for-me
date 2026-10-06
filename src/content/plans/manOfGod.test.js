import { describe, it, expect } from 'vitest';
import { MAN_OF_GOD as plan } from './manOfGod';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'manOfGod21',
  count: 21,
  category: 'formation',
  mode: 'prayer',
  domains: ['christian-living'],
  movements: ['before', 'character', 'relationships', 'legacy'],
});

const day = (n) => plan.days[n - 1];
const dayText = (n, lang) => {
  const d = day(n);
  return [d.reflection, ...d.prompts, d.selfPrompt, d.practice, d.safetyNote]
    .filter(Boolean)
    .map((v) => v[lang])
    .join(' ');
};
const daysTagged = (topic) => plan.days.flatMap((d, i) => (d.resourceTopics.includes(topic) ? [i + 1] : []));

describe('manOfGod21 guardrails', () => {
  it('never promises outcomes', () => {
    expectNoProseMatching(plan, [
      /\bguarant(?:ee|ees|eed)\b/i,
      /\bGod will (?:surely |certainly |definitely )?(?:heal|restore|prosper|reward|bless you|give you|make you)\b/i,
      /\bpromises? you\b/i,
      /\byou will (?:surely |certainly )?(?:prosper|succeed|be rewarded|be healed|be set free)\b/i,
      /\byour (?:marriage|career|business|finances|children) will\b/i,
      /\bGod wants you to know\b/i,
      /\bgarant(?:it|ira|ie|ies)\b/i,
      /\bDieu (?:te )?(?:guérira|restaurera|donnera|bénira|récompensera)\b/i,
      /\btu (?:réussiras|prospéreras|seras récompensé|seras guéri)\b/i,
      /\bte promet\b/i,
      /\bDieu veut que tu saches\b/i,
    ]);
  });

  it('never teaches that men should not cry or should hide their feelings', () => {
    expectNoProseMatching(plan, [
      /\breal m[ae]n\b/i,
      /\b(?:boys|men) (?:don['’]t|do not|never) cry\b/i,
      /\bman up\b/i,
      /\btoughen up\b/i,
      /\b(?:hide|bury|suppress|swallow|push down) your (?:feelings|emotions|tears)\b/i,
      /\bvrais? hommes?\b/i,
      /\bles (?:garçons|hommes) ne pleurent (?:pas|jamais)\b/i,
      /\bsois un homme\b/i,
      /\b(?:cache|refoule|ravale|étouffe|retiens) tes (?:émotions|sentiments|larmes)\b/i,
    ]);
    // …and positively models tears and honesty in Jesus and David (day 4).
    expect(dayText(4, 'en')).toMatch(/tears/);
    expect(dayText(4, 'en')).toMatch(/David/);
    expect(dayText(4, 'fr')).toMatch(/larmes/);
  });

  it('never equates manhood with domination, violence or wealth', () => {
    expectNoProseMatching(plan, [
      /\b(?:a man|men|husbands?) (?:must|should|is called to|are called to|is meant to|are meant to) (?:dominate|rule over|control|be obeyed)\b/i,
      /\b(?:violence|fighting|aggression|fists?) (?:is|shows|proves) (?:your |a man['’]s |real )?strength\b/i,
      /\b(?:wealth|money|income|success|salary|possessions) (?:proves?|shows?|makes?) (?:you )?(?:a )?(?:man|manhood)\b/i,
      /\b(?:un homme|les hommes|le mari|les maris) (?:doit|doivent) (?:dominer|contrôler|être obéis?)\b/i,
      /\b(?:la violence|les poings|l['’]agressivité) (?:est|montre|prouve) (?:ta |la )?(?:force|virilité)\b/i,
      /\b(?:l['’]argent|la richesse|le salaire|la réussite|le revenu) (?:prouve|fait) (?:de toi )?(?:un|l['’]) ?homme\b/i,
    ]);
    // Rule in Genesis is stewardship; strength is self-mastery; income is not worth.
    expect(dayText(1, 'en')).toMatch(/stewardship, never domination/);
    expect(dayText(9, 'en')).toMatch(/rules his own temper stronger than one who captures a city/);
    expect(dayText(14, 'en')).toMatch(/never holding power over them/);
    expect(dayText(15, 'en')).toMatch(/never makes your income the measure of your worth/);
  });

  it('never makes marriage or fatherhood a condition of full manhood', () => {
    expectNoProseMatching(plan, [
      /\b(?:not|never) (?:fully |truly |really |completely )?a man (?:until|unless|without)\b/i,
      /\b(?:marriage|a wife|fatherhood|children|a family) (?:makes|completes) (?:you )?(?:a )?(?:real |complete |full )?man\b/i,
      /\bpas (?:vraiment |pleinement )?un homme (?:tant que|sans|avant)\b/i,
      /\b(?:le mariage|une épouse|la paternité|des enfants) (?:fait|accomplit|complète) (?:de toi )?(?:un|l['’]) ?homme\b/i,
    ]);
    expect(plan.intro.en).toMatch(/single and married men, fathers and men without children/);
    expect(dayText(13, 'en')).toMatch(/Jesus, the only perfect man, never married/);
    expect(dayText(13, 'en')).toMatch(/married or single/);
    expect(dayText(13, 'fr')).toMatch(/célibataire/);
    expect(dayText(19, 'en')).toMatch(/with or without children/);
    expect(dayText(19, 'fr')).toMatch(/qu'il ait des enfants ou non/);
  });

  it('never casts women as temptresses or objects', () => {
    expectNoProseMatching(plan, [
      /\btemptress/i,
      /\bseductress/i,
      /\bwomen (?:are|as) (?:a )?(?:temptation|danger|snare|trap)/i,
      /\bBathsheba (?:seduced|tempted)/i,
      /\btentatrice/i,
      /\bséductrice/i,
      /\bles femmes (?:sont|comme) (?:une )?(?:tentation|piège|danger)/i,
      /\bBath-Shéba (?:a séduit|a tenté)/i,
    ]);
    // Joseph was pressed by someone with power over him; David's sin is David's.
    expect(dayText(7, 'en')).toMatch(/someone with power over him/);
    expect(dayText(10, 'en')).toMatch(/on the one with power/);
    expect(dayText(10, 'en')).toMatch(/not the villain/);
    expect(dayText(8, 'en')).toMatch(/never an object/);
    expect(dayText(12, 'en')).toMatch(/respecting her no/);
  });

  it('names the disagreement over Ephesians 5 fairly without deciding it', () => {
    const en = dayText(13, 'en');
    const fr = dayText(13, 'fr');
    expect(day(13).ref).toBe('Ephesians 5:21-33');
    expect(en).toMatch(/read the word 'head' differently/);
    expect(en).toMatch(/servant leadership/);
    expect(en).toMatch(/mutual submission/);
    expect(en).toMatch(/Both readings agree/);
    expect(fr).toMatch(/lisent différemment/);
    expect(fr).toMatch(/soumission mutuelle/);
    expect(fr).toMatch(/Les deux lectures s'accordent/);
    expectNoProseMatching(plan, [
      /\b(?:the )?(?:correct|right|true|only biblical) (?:reading|view|interpretation)\b/i,
      /\b(?:la )?(?:bonne|vraie|seule) (?:lecture|interprétation)\b/i,
    ]);
  });

  it('keeps sensitive resource topics on the one day each belongs to', () => {
    expect(daysTagged('marriage-roles')).toEqual([13]);
    for (const topic of ['sexuality', 'purity', 'pornography']) expect(daysTagged(topic), topic).toEqual([8]);
  });

  it('carries a safety note on the days that need one, pointing to real help', () => {
    const withNotes = plan.days.flatMap((d, i) => (d.safetyNote ? [i + 1] : []));
    expect(withNotes).toEqual([4, 8, 9, 10, 13]);
    for (const n of withNotes) {
      expect(day(n).safetyNote.en, `day ${n}`).toMatch(/pastor|counsellor|doctor|emergency/);
      expect(day(n).safetyNote.fr, `day ${n}`).toMatch(/pasteur|conseiller|médecin|urgence/);
    }
    // Despair, anger and the misuse of Ephesians 5 all name emergency help.
    for (const n of [4, 9, 13]) {
      expect(day(n).safetyNote.en, `day ${n}`).toMatch(/emergency number/);
      expect(day(n).safetyNote.fr, `day ${n}`).toMatch(/numéro d'urgence/);
    }
    // The sexuality note offers help without shame, and names consent and minors.
    expect(day(8).safetyNote.en).toMatch(/not beyond help/);
    expect(day(8).safetyNote.en).toMatch(/shame is not the way out/);
    expect(day(8).safetyNote.en).toMatch(/accountability/);
    expect(day(8).safetyNote.en).toMatch(/minor or someone who did not consent/);
    expect(day(8).safetyNote.fr).toMatch(/redevabilité/);
    // Abuse of power: stop, get help, accept accountability, never pressure the person harmed.
    expect(day(10).safetyNote.en).toMatch(/accountability/);
    expect(day(10).safetyNote.en).toMatch(/Do not contact the person you harmed/);
  });

  it('never shames the reader', () => {
    expectNoProseMatching(plan, [
      /\bshame on you\b/i,
      /\b(?:disgusting|pervert|filthy)\b/i,
      /\bhonte à toi\b/i,
      /\b(?:dégoûtant|pervers)\b/i,
    ]);
  });

  it('opens and closes with Christ', () => {
    for (const n of [1, 21]) {
      expect(dayText(n, 'en'), `day ${n}`).toMatch(/Christ|Jesus/);
      expect(dayText(n, 'fr'), `day ${n}`).toMatch(/Christ|Jésus/);
    }
  });

  it('is built on male biblical examples, distinct from the Woman of God plan', () => {
    const refs = plan.days.map((d) => d.ref);
    for (const expected of ['Genesis 39:1-12', '1 Samuel 18:1-4', '2 Samuel 12:1-13', 'Nehemiah 5:6-15', 'Daniel 6:1-10', '2 Timothy 2:1-7', 'John 11:32-44', 'John 13:1-17']) {
      expect(refs).toContain(expected);
    }
  });

  it('keeps French devotional prose in the tu register', () => {
    const vous = proseOf(plan).filter((r) => r.lang === 'fr' && /\b(?:vous|votre|vos)\b/i.test(r.text));
    expect(vous.map((r) => r.where)).toEqual([]);
  });
});
