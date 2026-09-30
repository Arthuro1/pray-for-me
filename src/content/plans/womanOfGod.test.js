import { describe, it, expect } from 'vitest';
import { WOMAN_OF_GOD as plan } from './womanOfGod';
import { MAN_OF_GOD } from './manOfGod';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'womanOfGod21',
  count: 21,
  category: 'formation',
  mode: 'prayer',
  domains: ['christian-living'],
  movements: ['before', 'character', 'gifts', 'legacy'],
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

describe('womanOfGod21 guardrails', () => {
  it('never promises outcomes', () => {
    expectNoProseMatching(plan, [
      /\bguarant(?:ee|ees|eed)\b/i,
      /\bGod will (?:surely |certainly |definitely )?(?:heal|restore|give you|bless you|reward|open (?:your )?womb|send you)\b/i,
      /\bpromises? you\b/i,
      /\byou will (?:surely |certainly )?(?:marry|conceive|have a (?:child|baby|husband)|be healed|succeed|prosper)\b/i,
      /\byour (?:husband|marriage|children|family) will\b/i,
      /\bGod wants you to know\b/i,
      /\bgarant(?:it|ira|ie|ies)\b/i,
      /\bDieu (?:te )?(?:guérira|restaurera|donnera|bénira|récompensera|enverra)\b/i,
      /\btu (?:te marieras|auras un (?:enfant|bébé|mari)|seras guérie|réussiras|prospéreras)\b/i,
      /\bton (?:mari|mariage|couple) (?:va|sera|viendra|se convertira)\b/i,
      /\bte promet\b/i,
      /\bDieu veut que tu saches\b/i,
    ]);
  });

  it('never defines womanhood by appearance, marriage, motherhood, passivity or male approval', () => {
    expectNoProseMatching(plan, [
      /\breal wom[ae]n\b/i,
      /\b(?:not|never) (?:fully |truly |really |completely )?a woman (?:until|unless|without)\b/i,
      /\b(?:marriage|a husband|motherhood|children|a child|a baby) (?:makes|completes|fulfils|fulfills) (?:you |her )?(?:a )?(?:real |complete |full |true )?woman\b/i,
      /\b(?:a woman['’]s|your|her) (?:worth|value) (?:is|lies in|comes from|depends on) (?:her |your |a )?(?:husband|children|looks|beauty|appearance|body|figure|marriage)\b/i,
      /\b(?:true|real|godly|biblical) (?:femininity|womanhood) (?:is|means) (?:being )?(?:quiet|silent|passive|dependent)\b/i,
      /\bwomen (?:should|must|are to) (?:stay |be |keep )?(?:silent|passive|quiet)\b/i,
      /\bvraies? femmes?\b/i,
      /\bpas (?:vraiment |pleinement )?une femme (?:tant que|sans|avant)\b/i,
      /\b(?:le mariage|un mari|la maternité|des enfants|un enfant) (?:fait|accomplit|complète) (?:de toi )?(?:une|la) ?(?:vraie )?femme\b/i,
      /\bla valeur d['’]une femme (?:est|réside|vient|dépend)\b/i,
      /\bles femmes (?:doivent|devraient) (?:se taire|rester silencieuses|être passives)\b/i,
    ]);
    // Identity rests on God's image and on Christ, for every woman.
    expect(plan.intro.en).toMatch(/single, married or widowed, with or without children/);
    expect(plan.intro.fr).toMatch(/célibataire, mariée ou veuve, avec ou sans enfants/);
    expect(plan.biblical.text.en).toMatch(/not by appearance, marriage, motherhood or anyone's approval/);
    expect(dayText(1, 'en')).toMatch(/not her role but whose likeness she bears/);
    expect(dayText(5, 'en')).toMatch(/In Christ every believer is God's child and heir/);
    // Comparison and appearance (Leah) and the unfading beauty of 1 Peter 3.
    expect(dayText(8, 'en')).toMatch(/Her appearance did not change/);
    expect(dayText(12, 'en')).toMatch(/not your hair, clothes or figure/);
    // Wisdom acts; it is not passivity.
    expect(dayText(7, 'en')).toMatch(/did not wait passively/);
    expect(dayText(7, 'en')).toMatch(/Wisdom in Scripture is not silence/);
  });

  it('honours motherhood without making it the measure of a woman, and never treats singleness as a waiting room', () => {
    expectNoProseMatching(plan, [
      /\b(?:infertility|barrenness|childlessness) (?:is|as) (?:a )?(?:curse|failure|punishment)\b/i,
      /\b(?:l['’])?(?:infertilité|stérilité) (?:est|comme) (?:une )?(?:malédiction|échec|punition)\b/i,
    ]);
    expect(dayText(18, 'en')).toMatch(/with or without children/);
    expect(dayText(18, 'en')).toMatch(/says nothing of children of her own/);
    expect(dayText(18, 'fr')).toMatch(/avec ou sans enfants/);
    expect(dayText(11, 'en')).toMatch(/better to her than seven sons/);
    expect(dayText(20, 'en')).toMatch(/not a waiting room; they were her ministry/);
    expect(dayText(20, 'fr')).toMatch(/pas une salle d'attente/);
    expect(plan.completion.en).toMatch(/none was defined by her looks, her marriage or her children/);
  });

  it('never casts women as temptresses, the source of sin, or the weaker sex', () => {
    expectNoProseMatching(plan, [
      /\btemptress/i,
      /\bseductress/i,
      /\bwomen (?:are|as) (?:a )?(?:temptation|danger|snare|trap)\b/i,
      /\bEve (?:caused|brought|was to blame for|was responsible for)\b/i,
      /\bwomen are (?:more )?(?:emotional|weaker|easily deceived)\b/i,
      /\bweaker (?:sex|vessel)\b/i,
      /\btentatrice/i,
      /\bséductrice/i,
      /\bles femmes (?:sont|comme) (?:une )?(?:tentation|piège|danger)\b/i,
      /\bÈve (?:a causé|est responsable|est coupable)\b/i,
      /\bsexe faible\b/i,
      /\bvase (?:plus )?faible\b/i,
    ]);
    expect(dayText(3, 'en')).toMatch(/Scripture never makes women the source of the world's sin/);
    expect(dayText(3, 'en')).toMatch(/her husband was with her/);
    expect(dayText(10, 'en')).toMatch(/never been a burden laid on women alone/);
    expect(dayText(10, 'en')).toMatch(/what others did to you/);
  });

  it('reads Proverbs 31 as a poem of praise for wisdom, not a domestic checklist', () => {
    expect(day(6).ref).toBe('Proverbs 31:10-31');
    expect(day(6).related).toContain('Ruth 3:10-11');
    const en = dayText(6, 'en');
    expect(en).toMatch(/Hebrew alphabet/);
    expect(en).toMatch(/not a checklist/);
    expect(en).toMatch(/shrewd in business/);
    expect(en).toMatch(/Ruth, a poor widowed foreigner with no household to run/);
    expect(en).toMatch(/exhausting comparison/);
    expect(dayText(6, 'fr')).toMatch(/pas une liste à cocher/);
    expectNoProseMatching(plan, [
      /\b(?:every|a godly|a real|each) woman (?:must|should|has to) (?:be|do|keep|run)\b/i,
      /\b(?:toute|chaque) femme (?:doit|devrait) (?:être|faire|tenir)\b/i,
    ]);
  });

  it('names the disagreement over 1 Peter 3 fairly, without deciding it, and never makes submission mean enduring abuse', () => {
    expect(day(12).ref).toBe('1 Peter 3:1-6');
    const en = dayText(12, 'en');
    const fr = dayText(12, 'fr');
    expect(en).toMatch(/read his call for wives to submit differently/);
    expect(en).toMatch(/loving leadership/);
    expect(en).toMatch(/mutual submission/);
    expect(en).toMatch(/does not settle the question/);
    expect(en).toMatch(/both readings agree it never requires sin, silence about harm or staying in danger/);
    expect(en).toMatch(/Married, single or widowed/);
    expect(fr).toMatch(/lisent différemment/);
    expect(fr).toMatch(/soumission mutuelle/);
    expect(fr).toMatch(/ne tranche pas la question/);
    expect(fr).toMatch(/les deux lectures s'accordent/);
    expect(day(12).safetyNote.en).toMatch(/never means enduring abuse, threats, coercion or control/);
    expect(day(12).safetyNote.en).toMatch(/No teaching requires you to stay where you are being harmed/);
    expect(day(12).safetyNote.fr).toMatch(/ne signifie jamais subir des violences/);
    expectNoProseMatching(plan, [
      /\b(?:the )?(?:correct|right|true|only biblical) (?:reading|view|interpretation)\b/i,
      /\b(?:wives|a wife|women) (?:must|should) (?:always )?(?:submit|obey)\b/i,
      /\bstay (?:and pray )?(?:in|with) (?:an? )?(?:abusive|violent)\b/i,
      /\b(?:la )?(?:bonne|vraie|seule) (?:lecture|interprétation)\b/i,
      /\b(?:les épouses|une épouse|les femmes) (?:doivent|doit|devraient) (?:toujours )?(?:se soumettre|obéir)\b/i,
    ]);
  });

  it('names the disagreement over roles and church office wherever a day touches it', () => {
    expect(dayText(2, 'en')).toMatch(/Christians differ on what this chapter implies/);
    expect(dayText(14, 'en')).toMatch(/Christians differ on how women's gifts relate to some church offices/);
    expect(dayText(15, 'en')).toMatch(/Whatever conclusions Christians draw for church offices/);
    expect(dayText(18, 'en')).toMatch(/Christians draw different conclusions from her leadership/);
    expect(dayText(2, 'fr')).toMatch(/Les chrétiens divergent/);
    expect(dayText(14, 'fr')).toMatch(/Les chrétiens divergent/);
  });

  it('keeps sensitive resource topics on the one day each belongs to', () => {
    expect(daysTagged('marriage-roles')).toEqual([12]);
    expect(daysTagged('abuse-safety')).toEqual([12]);
    for (const topic of ['sexuality', 'purity']) expect(daysTagged(topic), topic).toEqual([10]);
    for (const topic of ['infertility', 'miscarriage', 'pornography']) expect(daysTagged(topic), topic).toEqual([]);
  });

  it('carries a safety note on the days that need one, pointing to real help', () => {
    const withNotes = plan.days.flatMap((d, i) => (d.safetyNote ? [i + 1] : []));
    expect(withNotes).toEqual([4, 8, 10, 11, 12]);
    for (const n of withNotes) {
      expect(day(n).safetyNote.en, `day ${n}`).toMatch(/pastor|counsellor|doctor|emergency/);
      expect(day(n).safetyNote.fr, `day ${n}`).toMatch(/pasteur|conseiller|médecin|urgence/);
    }
    // Hagar was sent back; that is not a rule that anyone must stay in harm.
    expect(day(4).safetyNote.en).toMatch(/not a rule that anyone must stay where they are being harmed/);
    // Body image names eating and self-harm without shame.
    expect(day(8).safetyNote.en).toMatch(/restrict food, binge, purge or hurt yourself/);
    // Sexual coercion is never the victim's sin.
    expect(day(10).safetyNote.en).toMatch(/is not your sin/);
    // Grief and self-harm name urgent help.
    expect(day(11).safetyNote.en).toMatch(/emergency number/);
    expect(day(11).safetyNote.fr).toMatch(/numéro d'urgence/);
  });

  it('keeps fasting safe for the body', () => {
    expect(day(17).practice.en).toMatch(/If your health allows/);
    expect(day(17).practice.en).toMatch(/pregnant, unwell or have struggled with eating/);
    expect(day(17).practice.fr).toMatch(/enceinte/);
  });

  it('never shames the reader', () => {
    expectNoProseMatching(plan, [
      /\bshame on you\b/i,
      /\b(?:disgusting|filthy|immodest|slut)\b/i,
      /\bhonte à toi\b/i,
      /\b(?:dégoûtante?|impudique)\b/i,
    ]);
  });

  it('roots identity in Christ early and ends with the risen Christ', () => {
    for (const n of [3, 5, 21]) {
      expect(dayText(n, 'en'), `day ${n}`).toMatch(/Christ|Jesus/);
      expect(dayText(n, 'fr'), `day ${n}`).toMatch(/Christ|Jésus/);
    }
    expect(day(21).ref).toBe('John 20:11-18');
    expect(dayText(21, 'en')).toMatch(/risen Lord/);
  });

  it('is built on biblical women, distinct from the Man of God plan', () => {
    const refs = plan.days.map((d) => d.ref);
    for (const expected of ['Genesis 16:6-13', 'Mark 5:25-34', '1 Samuel 25:14-35', 'Genesis 29:16-35', 'Ruth 1:6-22', 'Luke 10:38-42', 'Romans 16:1-7', 'Exodus 1:15-21', 'Esther 4:10-17', 'Judges 4:4-10', 'Luke 1:46-55', 'Luke 2:36-38', 'John 20:11-18']) {
      expect(refs).toContain(expected);
    }
    // Only Luke 7:36-50 is shared — read there from the woman's side, here as her own story.
    const manRefs = new Set(MAN_OF_GOD.days.map((d) => d.ref));
    expect(refs.filter((r) => manRefs.has(r))).toEqual(['Luke 7:36-50']);
    const manThemes = new Set(MAN_OF_GOD.days.map((d) => d.theme.en));
    expect(plan.days.filter((d) => manThemes.has(d.theme.en))).toEqual([]);
  });

  it('keeps French devotional prose in the tu register', () => {
    const vous = proseOf(plan).filter((r) => r.lang === 'fr' && /\b(?:vous|votre|vos)\b/i.test(r.text));
    expect(vous.map((r) => r.where)).toEqual([]);
  });
});
