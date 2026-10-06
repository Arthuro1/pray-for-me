import { describe, it, expect } from 'vitest';
import { PRAYING_FOR_UNBELIEVERS as plan } from './prayingForUnbelievers';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'unbelievers30', count: 30, category: 'others', mode: 'prayer',
  domains: ['mission'], movements: ['heart', 'understanding', 'witness', 'mission'],
});

const day = (n) => plan.days[n - 1];
const daysWhere = (test) => plan.days.flatMap((d, i) => (test(d) ? [i + 1] : []));
const allText = (d, lang) => [d.reflection, ...d.prompts, d.selfPrompt, d.practice, d.safetyNote]
  .filter(Boolean).map((f) => f[lang]).join(' ');

describe('unbelievers30 guardrails', () => {
  it('never promises anyone’s conversion or ties salvation to the amount of prayer', () => {
    expectNoProseMatching(plan, [
      /\bwill (?:surely |certainly |definitely )?(?:be saved|believe|come to (?:faith|Christ)|turn to (?:God|Christ|Him)|be converted)\b/i,
      /\bclaim(?:ing)? (?:their|his|her|your \w+['’]s?) salvation\b/i,
      /\bGod (?:will|promises to) save\b/i,
      /\bbecause you (?:have )?pray(?:ed)?\b/i,
      /(?<!not |never |n't )\bguarantees? (?:that|their|his|her|a|the)\b/i,
      /\bser(?:a|ont) sauvée?s?\b/i,
      /\bDieu (?:les|le|la) sauvera\b/i,
      /\bviendr(?:a|ont) à (?:la foi|Christ)\b/i,
      /\bréclam\w* (?:leur|son|sa) salut\b/i,
      /\bparce que tu as prié\b/i,
      /(?<!ne )\bgarantit (?:que|leur|son|sa)\b/i,
    ]);
  });

  it('uses no pressure tactics and never treats friendship as a technique', () => {
    expectNoProseMatching(plan, [
      /\bbefore it['’]s too late\b/i,
      /\bavant qu['’]il (?:ne )?soit trop tard\b/i,
      /\bclose the deal\b/i,
      /\bdon['’]t take no for an answer\b/i,
      /\bfriendship (?:is|as) (?:a |your )?(?:tool|tactic|strategy)\b/i,
      /\bl['’]amitié (?:est|comme) (?:un |une )?(?:outil|tactique|stratégie)\b/i,
      /\b(?:scare|frighten|guilt[- ]trip) (?:them|him|her)\b/i,
      /\bfais(?:-leur)? peur\b/i,
    ]);
    // The intro says so plainly, in both source languages.
    expect(plan.intro.en).toMatch(/never as projects/);
    expect(plan.intro.fr).toMatch(/jamais comme des projets/);
    expect(plan.intro.en).toMatch(/no plan can promise anyone's conversion/);
    expect(plan.intro.fr).toMatch(/aucun parcours ne peut promettre la conversion/);
  });

  it('prays against spiritual blindness soberly, with no binding formulas', () => {
    expectNoProseMatching(plan, [
      /\bI bind\b/i,
      /\bbind(?:ing)? (?:the |their |his |her )?(?:minds?|spirits?|strongman|strongholds?)\b/i,
      /\bI command\b/i,
      /\bje (?:lie|commande)\b/i,
      /\blier (?:leur|son|sa|l['’]esprit|les esprits)\b/i,
    ]);
    for (const n of [8, 14]) expect(allText(day(n), 'en'), `day ${n}`).toMatch(/soberly/);
  });

  it('speaks of other faiths with respect and without caricature', () => {
    expectNoProseMatching(plan, [
      /\b(?:false religions?|heathens?|pagans?|infidels?|idol[- ]worshippers?|cults?)\b/i,
      /\b(?:fausses? religions?|païens?|païennes?|idolâtres?|sectes?)\b/i,
    ]);
    expect(day(22).theme.en).toMatch(/other faiths/);
    expect(allText(day(22), 'en')).toMatch(/respect/i);
    expect(allText(day(22), 'fr')).toMatch(/respect/i);
    expect(day(22).practice.en).toMatch(/listen/);
  });

  it('prays for persecutors and for freedom of belief on the persecuted-church day', () => {
    expect(day(25).resourceTopics).toContain('persecution');
    expect(day(25).prompts.some((p) => /those who persecute/.test(p.en))).toBe(true);
    expect(day(25).prompts.some((p) => /ceux qui les persécutent/.test(p.fr))).toBe(true);
    expect(day(25).prompts.some((p) => /every faith and none/.test(p.en))).toBe(true);
    expect(day(25).selfPrompt.en).toMatch(/us-against-them/);
  });

  it('names the disagreement over election instead of settling it', () => {
    expect(day(10).reflection.en).toMatch(/disagreed/);
    expect(day(10).reflection.en).toMatch(/does not settle it/);
    expect(day(10).reflection.fr).toMatch(/ne tranche pas/);
    expect(day(27).reflection.en).toMatch(/in different ways/);
  });

  it('turns every day back on the one praying', () => {
    for (const [i, d] of plan.days.entries()) {
      for (const lang of ['en', 'fr']) expect(d.selfPrompt?.[lang]?.length, `day ${i + 1} ${lang}`).toBeGreaterThan(15);
    }
  });

  it('carries a safety note exactly on the family-boundaries and church-harm days', () => {
    expect(daysWhere((d) => d.safetyNote)).toEqual([20, 21]);
    expect(day(20).safetyNote.en).toMatch(/emergency services/);
    expect(day(20).safetyNote.fr).toMatch(/services d'urgence/);
    expect(day(20).safetyNote.en).toMatch(/never requires staying in danger/);
    expect(day(21).safetyNote.en).toMatch(/safeguarding/);
    expect(day(21).safetyNote.en).toMatch(/police/);
    expect(day(21).safetyNote.fr).toMatch(/police/);
  });

  it('stays with people who have not yet believed (prodigals have their own plan)', () => {
    expectNoProseMatching(plan, [/\bprodigal/i, /\bprodigue/i]);
  });

  it('opens with God’s searching heart and closes with salvation belonging to God and the Lamb', () => {
    expect(day(1).ref).toBe('Luke 15:1-10');
    expect(day(30).reflection.en).toMatch(/salvation belongs to God and to the Lamb/);
    expect(day(30).reflection.fr).toMatch(/le salut appartient à Dieu et à l'Agneau/);
  });

  it('keeps French devotional prose in the tu register', () => {
    const vous = proseOf(plan).filter((row) => row.lang === 'fr' && /\b(?:vous|votre|vos)\b/i.test(row.text));
    expect(vous.map((row) => row.where)).toEqual([]);
  });
});
