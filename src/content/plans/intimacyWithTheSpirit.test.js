import { describe, it, expect } from 'vitest';
import { INTIMACY_WITH_THE_SPIRIT as plan } from './intimacyWithTheSpirit';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'holySpirit21',
  count: 21,
  category: 'formation',
  mode: 'prayer',
  domains: ['christian-living'],
  movements: ['know', 'walk', 'presence', 'fruitGifts', 'power'],
});

const day = (n) => plan.days[n - 1];
const allText = (d) => JSON.stringify(d);

describe('holySpirit21 guardrails', () => {
  it('never speaks for God or treats an impression as His voice', () => {
    expectNoProseMatching(plan, [
      /\bGod (?:is )?(?:saying|says) (?:to )?you\b/i,
      /\bGod wants you to know\b/i,
      /\bthe (?:Holy )?Spirit (?:is )?(?:telling|saying to|says to|told) you\b/i,
      /\bthis (?:thought|dream|feeling|impression) is (?:from )?(?:God|the Spirit)\b/i,
      /\bDieu veut que tu saches\b/i,
      /\bl['’]Esprit (?:te dit|t['’]a dit)\b/i,
      /\bcette (?:pensée|impression|émotion) vient de Dieu\b/i,
    ]);
  });

  it('never promises an experience, a gift, a healing or any other outcome', () => {
    expectNoProseMatching(plan, [
      /\bguarantee(?:s|d)? (?:that|you)\b/i,
      /\bGod will (?:surely|certainly|always)\b/i,
      /\byou will (?:speak in tongues|receive the gift|be healed|be filled|feel|marry|conceive|recover|prosper)\b/i,
      /\b(?:this|these) (?:steps?|prayers?|techniques?) will (?:bring|produce|release|unlock)\b/i,
      /\bgaranti(?:t|e|ssent)?\b/i,
      /\bDieu va (?:forcément|sûrement|certainement)\b/i,
      /\btu (?:parleras en langues|recevras le don|seras (?:guéri|rempli)|te marieras|guériras)\b/i,
    ]);
  });

  it('never gives coercive guidance or uses the Spirit as leverage', () => {
    expectNoProseMatching(plan, [
      /\bobey (?:your|the) (?:leaders?|pastors?|prophets?) without question/i,
      /\bdo not question (?:your|the) (?:leader|pastor|prophet|word)/i,
      /\bdisagree\w* with (?:a|your) (?:leader|pastor) is resisting\b/i,
      /\b(?:sow|give|pay)\b[^.]{0,30}\bto (?:receive|unlock|release) (?:the |a |your )?(?:gift|anointing|word|blessing)/i,
      /\brepeat (?:these|the|after) (?:sounds|syllables)\b/i,
      /\b(?:the Spirit|God) (?:will )?(?:leads?|tells?) you to (?:leave|stop|cut off)\b/i,
      /\bobéis (?:à ton|au) (?:responsable|pasteur|prophète) sans\b/i,
      /\bne remets? pas en question (?:ton|le) (?:pasteur|responsable|prophète)\b/i,
      /\bc['’]est résister à l['’]Esprit\b/i,
      /\bsème(?:r)? une (?:semence|offrande) pour\b/i,
      /\brépète (?:ces|les) (?:sons|syllabes)\b/i,
    ]);
  });

  it('names "God told me you must marry me" as inconsistent with the Spirit of Jesus (day 9)', () => {
    const note = day(9).safetyNote;
    expect(note.en).toMatch(/God told me you must marry me/);
    expect(note.en).toMatch(/not consistent with the Spirit of Jesus/);
    expect(note.en).toMatch(/free to say no/);
    expect(note.fr).toMatch(/Dieu m['’]a dit que tu dois m['’]épouser/);
    expect(note.fr).toMatch(/n['’]est pas conforme à l['’]Esprit de Jésus/);
  });

  it('carries a safety note on the listening, testing, tongues, prophecy and quenching days', () => {
    for (const n of [8, 9, 12, 13, 16, 20]) {
      for (const lang of ['en', 'fr']) expect(day(n).safetyNote?.[lang]?.length, `day ${n} ${lang}`).toBeGreaterThan(80);
    }
    // Hearing God: not every impression is from Him; real help is named.
    expect(day(8).safetyNote.en).toMatch(/Not every thought, dream, feeling, coincidence or inner voice comes from God/);
    expect(day(8).safetyNote.en).toMatch(/doctor/);
    // Prophecy: no personal prophecy, no predictions, treatment continues.
    for (const n of [9, 16]) expect(day(n).safetyNote.en).toMatch(/(?:never|does not) give[s]? personal prophecy/);
    expect(day(16).safetyNote.en).toMatch(/never stop a treatment/);
    expect(day(20).safetyNote.en).toMatch(/Disagreeing with a leader is not resisting the Spirit/);
  });

  it('never says or implies the Spirit is absent from a believer who has not spoken in tongues', () => {
    expectNoProseMatching(plan, [
      /\binitial evidence\b/i,
      /\btongues (?:is|are) (?:the )?(?:proof|evidence|sign) (?:that|of)\b/i,
      /\b(?:without|never (?:spoken|spoke)|not (?:yet )?(?:spoken|speak(?:ing)?)) in tongues\b[^.]*\b(?:not|never|no)\b[^.]*\b(?:have|received?) the (?:Holy )?Spirit\b/i,
      /\bpreuve initiale\b/i,
      /\bsigne initial\b/i,
      /\bsans (?:avoir )?parl\w* en langues\b[^.]*\bpas\b[^.]*\bl['’]Esprit\b/i,
    ]);
    // …and says the opposite plainly, in both languages.
    expect(day(5).reflection.en).toMatch(/to belong to Christ is to have His Spirit/);
    expect(day(5).reflection.fr).toMatch(/appartenir à Christ, c['’]est avoir son Esprit/);
    expect(day(12).safetyNote.en).toMatch(/everyone who belongs to Christ has the Spirit/);
    expect(day(12).safetyNote.fr).toMatch(/quiconque appartient à Christ a l['’]Esprit/);
  });

  it('presents Spirit baptism as the Pentecostal understanding and names the other reading fairly (day 18)', () => {
    const r = day(18).reflection;
    expect(r.en).toMatch(/Pentecostal Christians understand/);
    expect(r.en).toMatch(/Other Christians hold/);
    expect(r.fr).toMatch(/Les chrétiens pentecôtistes comprennent/);
    expect(r.fr).toMatch(/D['’]autres chrétiens estiment/);
  });

  it('includes a reflection on spiritual dryness: presence is not measured by awareness', () => {
    const dry = plan.days.filter((d) => /\bdry\b/i.test(d.reflection.en) && /not measured/i.test(d.reflection.en));
    expect(dry.length).toBeGreaterThan(0);
    const sec = plan.days.filter((d) => /sèche|sécheresse/i.test(d.reflection.fr) && /ne se mesure pas/i.test(d.reflection.fr));
    expect(sec.length).toBeGreaterThan(0);
  });

  it('keeps the Spirit personal — never a force, energy or technique', () => {
    expectNoProseMatching(plan, [
      /\b(?:the )?(?:Holy )?Spirit is (?:a|an) (?:force|energy|power|feeling)\b/i,
      /\b(?:tap into|harness|activate) (?:the )?(?:Holy )?Spirit\b/i,
      /\bl['’]Esprit est une (?:force|énergie|puissance)\b/i,
      /\bactive[rz]? (?:le Saint-Esprit|l['’]Esprit)\b/i,
    ]);
    expect(day(2).reflection.en).toMatch(/Someone to know, not something to use/);
  });

  it('opens and closes pointing to Jesus', () => {
    expect(allText(day(1))).toMatch(/Jesus/);
    expect(allText(day(21))).toMatch(/Jesus/);
  });

  it('tags prophecy resources only on the prophecy days', () => {
    const prophecyDays = plan.days.flatMap((d, i) => (d.resourceTopics.includes('prophecy') ? [i + 1] : []));
    expect(prophecyDays).toEqual([9, 16]);
  });

  it('keeps French devotional prose in "tu"', () => {
    const vous = proseOf(plan).filter((row) => row.lang === 'fr' && /\b(?:vous|votre|vos)\b/i.test(row.text)
      // "vous vous honoriez" addresses the reader AND other believers together.
      && !/vous vous honoriez/.test(row.text));
    expect(vous.map((row) => row.where)).toEqual([]);
  });
});
