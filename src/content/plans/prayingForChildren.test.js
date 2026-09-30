import { describe, it, expect } from 'vitest';
import { PRAYING_FOR_CHILDREN as plan } from './prayingForChildren';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';
import { resolveResources, availableResourceLanguages } from '../../lib/resources';

runNewPlanContract(plan, {
  id: 'children21', count: 21, category: 'relationships', mode: 'prayer',
  domains: ['relationships'], movements: ['belonging', 'character', 'relationships', 'calling'],
});

const day = (n) => plan.days[n - 1];
const daysWhere = (test) => plan.days.flatMap((d, i) => (test(d) ? [i + 1] : []));

describe('children21 guardrails', () => {
  it('never promises a child’s conversion, safety, health, success or future', () => {
    expectNoProseMatching(plan, [
      /(?<!not |never |n't )\bguarantees? (?:that|your|their|a|the|each|every)\b/i,
      /\bpromises? (?:you|that (?:your|every|each|the) child)\b/i,
      /\bwill (?:surely|certainly|definitely|always) (?:be saved|come back|return|believe|be safe|be protected|succeed|be healed|marry)\b/i,
      /\bGod (?:will|promises to) (?:save|protect|keep|heal|bring back|bless) (?:your|every|each|all|the)\b/i,
      /\b(?:if|when|as long as) you pray\b[^.]*\bwill (?:be saved|return|come back|be safe|believe|turn out)\b/i,
      /\bfaithful (?:parents|prayer) (?:produce|guarantee|ensure)s?\b/i,
      /(?<!ne )\bgarantit (?:que|la|le|leur|sa|son|ta|ton|chaque)\b/i,
      /\bte promet (?:que|un|une)\b/i,
      /\bDieu (?:va|te promet de) (?:sauver|protéger|garder|guérir|ramener|bénir)\b/i,
      /\bser(?:a|ont) (?:forcément|certainement|sûrement) (?:sauvés?|protégés?|en sécurité|guéris?|croyants?)\b/i,
    ]);
  });

  it('reads Proverbs as wisdom, never as an unconditional promise', () => {
    const proverbsDays = daysWhere((d) => [d.ref, ...(d.related || [])].some((r) => r.startsWith('Proverbs 22')));
    expect(proverbsDays).toEqual([7]);
    expect(day(7).reflection.en).toMatch(/not an unconditional promise/);
    expect(day(7).reflection.fr).toMatch(/non une promesse inconditionnelle/);
    expectNoProseMatching(plan, [
      /\bProverbs(?: 22(?::6)?)? (?:promises|guarantees)\b/i,
      /\bProverbes(?: 22)? (?:promet|garantit)\b/i,
    ]);
  });

  it('never blames parents for a child’s path', () => {
    expectNoProseMatching(plan, [
      /\b(?:it is|it's) (?:your|the parents'?) fault\b/i,
      /\bbecause you (?:did not|didn't) pray\b/i,
      /\bfailed (?:as a|your) (?:parent|child)\b/i,
      /\bc['’]est (?:de )?ta faute\b/i,
      /\bparce que tu n['’]as pas (?:assez )?prié\b/i,
    ]);
    expect(day(7).reflection.en).toMatch(/not a verdict on the adults who loved them/);
    for (const lang of ['en', 'fr']) {
      expect(plan.intro[lang], lang).toMatch(lang === 'en' ? /not a verdict on you/ : /pas un verdict sur toi/);
    }
  });

  it('welcomes those without children, those who long for children and the bereaved', () => {
    for (const re of [/grandparents/, /godparents/, /mentors/, /spiritual parents/, /long for children/, /lost a child/, /far from God or from you/]) {
      expect(plan.intro.en).toMatch(re);
    }
    for (const re of [/grands-parents/, /parrains et marraines/, /parents spirituels/, /désires des enfants/, /perdu un enfant/]) {
      expect(plan.intro.fr).toMatch(re);
    }
    expect(plan.lifeStage).toBeUndefined();
  });

  it('carries a safety note on the protection and sexuality days, and only there', () => {
    expect(daysWhere((d) => d.safetyNote)).toEqual([13, 14]);
    const protection = day(13).safetyNote;
    expect(protection.en).toMatch(/prayer goes together with action/);
    expect(protection.en).toMatch(/emergency services/);
    expect(protection.en).toMatch(/police/);
    expect(protection.en).toMatch(/child-protection services/);
    expect(protection.en).toMatch(/safeguarding lead/);
    expect(protection.en).toMatch(/do not record any details/);
    expect(protection.fr).toMatch(/services d'urgence/);
    expect(protection.fr).toMatch(/services de protection de l'enfance/);
    expect(protection.fr).toMatch(/aucun détail/);
    const sexuality = day(14).safetyNote;
    expect(sexuality.en).toMatch(/emergency services/);
    expect(sexuality.en).toMatch(/child-protection services/);
    expect(sexuality.en).toMatch(/do not promise to keep it secret/);
    expect(sexuality.fr).toMatch(/services d'urgence/);
  });

  // The relationships domain is mostly couples' and dating material, and broad
  // tags (sexuality, singleness, friendship, identity, character, family, trust,
  // church, prayer, abuse-safety) pull those books onto a children's shelf. So
  // every day is tagged through children/parenting/family-discipleship, and
  // every book the shelf shows must carry one of those tags.
  it('keeps the shelf about children, never couples’ or dating books', () => {
    const CHILD_TOPICS = ['children', 'parenting', 'family-discipleship'];
    const ADULT_TOPICS = ['sexuality', 'sexual-intimacy', 'purity', 'marriage', 'dating', 'singleness', 'premarital', 'future-spouse', 'friendship', 'abuse-safety'];
    const languages = availableResourceLanguages();
    for (const [i, d] of plan.days.entries()) {
      expect(d.resourceTopics.some((t) => CHILD_TOPICS.includes(t)), `day ${i + 1}`).toBe(true);
      expect(d.resourceTopics.filter((t) => ADULT_TOPICS.includes(t)), `day ${i + 1}`).toEqual([]);
      const shelf = resolveResources({ topics: d.resourceTopics, domains: plan.resourceDomains, languages });
      for (const row of shelf) {
        expect(row.topics.some((t) => CHILD_TOPICS.includes(t)), `${row.id} on day ${i + 1}`).toBe(true);
      }
    }
  });

  it('handles sexuality without shame and the digital world with wisdom rather than fear', () => {
    expect(day(14).theme.en).toBe('Purity without shame');
    expect(day(14).reflection.en).toMatch(/not from shame/);
    expect(day(14).reflection.fr).toMatch(/non de la honte/);
    expect(day(14).reflection.en).toMatch(/at a pace that fits their age/);
    expect(day(15).reflection.en).toMatch(/fear rarely makes a child wise/);
    expect(day(15).reflection.fr).toMatch(/la peur rend rarement un enfant sage/);
  });

  it('mirrors every day back on the adult who prays', () => {
    for (const [i, d] of plan.days.entries()) {
      for (const lang of ['en', 'fr']) {
        expect(d.selfPrompt?.[lang]?.length, `day ${i + 1} selfPrompt ${lang}`).toBeGreaterThan(30);
        expect(d.practice?.[lang]?.length, `day ${i + 1} practice ${lang}`).toBeGreaterThan(30);
      }
      expect(d.prompts, `day ${i + 1}`).toHaveLength(3);
    }
  });

  it('prays for children, never for control over them, and without stereotypes', () => {
    expectNoProseMatching(plan, [
      /\bmake (?:them|him|her|your child|each child) (?:obey|believe|submit|comply)\b/i,
      /\b(?:force|control) (?:them|him|her|your child|each child|their choices)\b/i,
      /\b(?:boys|girls) (?:are|should|must|need to)\b/i,
      /\bles (?:garçons|filles) (?:sont|doivent)\b/i,
      /\b(?:contrôler|forcer) (?:leurs choix|ton enfant|chaque enfant)\b/i,
    ]);
    expect(day(4).prompts[0].en).toMatch(/freely/);
    expect(day(4).reflection.en).toMatch(/cannot be inherited/);
  });

  it('opens on children as God’s heritage and closes on surrender, reading Hannah as narrative', () => {
    expect(plan.biblical.ref).toBe('Psalm 127');
    expect(day(1).ref).toBe('Psalm 127');
    expect(day(1).reflection.en).toMatch(/not the owner of their future/);
    expect(day(21).ref).toBe('1 Samuel 1:21-28');
    expect(day(21).reflection.en).toMatch(/no one is asked to leave a child at a sanctuary/);
    expect(day(21).reflection.fr).toMatch(/personne n'est appelé à laisser un enfant/);
    expect(day(16).reflection.en).toMatch(/does not promise the same outcome/);
  });

  it('keeps every passage the plan spec asks for', () => {
    const refs = plan.days.flatMap((d) => [d.ref, ...(d.related || [])]);
    for (const ref of [
      'Psalm 127', 'Psalm 78:1-8', 'Deuteronomy 6:4-9', 'Mark 10:13-16', 'Luke 2:40', 'Luke 2:41-52',
      'Ephesians 6:1-4', '2 Timothy 1:3-7', '2 Timothy 3:14-17', 'Psalm 139:13-18', 'Psalm 145:4',
      'Joel 1:3', '1 Samuel 1:21-28', 'Daniel 1:8-17', '1 Timothy 4:12-16', 'Matthew 18:1-10',
    ]) expect(refs, ref).toContain(ref);
  });

  it('never quotes a whole verse as prose', () => {
    // A long run inside quotation marks would be a quotation; the plan cites instead.
    const quoted = proseOf(plan).filter((row) => /[“"«][^”"»]{40,}[”"»]/.test(row.text));
    expect(quoted).toEqual([]);
  });
});
