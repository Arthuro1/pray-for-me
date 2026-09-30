import { describe, it, expect } from 'vitest';
import { FRUIT_OF_THE_SPIRIT as plan } from './fruitOfTheSpirit';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'fruit10', count: 10, category: 'formation', mode: 'prayer',
  domains: ['christian-living'], movements: ['spirit', 'others', 'steadfast'],
});

const day = (n) => plan.days[n - 1];

describe('fruit10 guardrails', () => {
  it('never promises growth, feelings or results', () => {
    expectNoProseMatching(plan, [
      /\b(?:will|shall) (?:surely|certainly|definitely|always)\b/i,
      /\bguarantee(?:s|d)? (?:that|you|your)\b/i,
      /\bpromises? you (?:a|an|that)\b/i,
      /\byou will (?:feel|become|be) (?:more )?(?:patient|joyful|peaceful|kind|gentle|different|changed|free)\b/i,
      /\b(?:in|after) (?:just )?(?:ten|10) days,? you will\b/i,
      /\bgaranti(?:t|e|ssons)\b/i,
      /\bDieu (?:va|te donnera) (?:forcément|sûrement|certainement)\b/i,
      /\bte promet (?:que|un|une)\b/i,
      /\btu (?:seras|deviendras) (?:plus )?(?:patient|joyeux|paisible|bon|doux|différent|changé|libre)\b/i,
    ]);
  });

  it('frames character as fruit of the Spirit, not moral self-effort or shame', () => {
    expectNoProseMatching(plan, [
      /\btry harder\b/i,
      /\b(?:should|ought to) be ashamed\b/i,
      /\bpull yourself together\b/i,
      /\bearn (?:God's|His) (?:love|favour|favor|approval)\b/i,
      /\bhonte à toi\b/i,
      /\bfais (?:plus )?d['’]efforts\b/i,
      /\bmériter (?:l['’]amour|la faveur) de Dieu\b/i,
    ]);
    for (const lang of ['en', 'fr']) {
      expect(plan.intro[lang], lang).toMatch(lang === 'en' ? /Spirit who produces/ : /l'Esprit qui produit/);
      expect(plan.biblical.text[lang], lang).toMatch(lang === 'en' ? /one fruit of one Spirit/ : /un seul fruit d'un seul Esprit/);
    }
    expect(plan.biblical.ref).toBe('Galatians 5:22-23');
  });

  it('carries a safety note on the patience and gentleness days, and only there', () => {
    const withNotes = plan.days.flatMap((d, i) => (d.safetyNote ? [i + 1] : []));
    expect(withNotes).toEqual([5, 9]);
    expect(day(5).safetyNote.en).toMatch(/never means staying in danger/);
    expect(day(5).safetyNote.en).toMatch(/pastor|counsellor/);
    expect(day(5).safetyNote.en).toMatch(/emergency services/);
    expect(day(5).safetyNote.fr).toMatch(/services d'urgence/);
    expect(day(9).safetyNote.en).toMatch(/safeguarding lead/);
    expect(day(9).safetyNote.fr).toMatch(/responsable de la protection/);
  });

  it('opens on walking by the Spirit in Galatians 5 and closes on keeping in step', () => {
    expect(day(1).ref).toBe('Galatians 5:13-26');
    expect(day(10).related).toContain('Galatians 5:24-25');
    expect(day(10).reflection.en).toMatch(/keep in step with Him/);
    expect(day(10).reflection.fr).toMatch(/marchons aussi à Son pas/);
  });

  it('gives one day to each part of the fruit, in the order Paul names them', () => {
    const order = [/Walking by the Spirit/, /Love/, /Joy/, /Peace/, /patience/, /Kindness/, /Goodness/, /Faithful/, /gentleness/, /Self-control/];
    order.forEach((re, i) => expect(plan.days[i].theme.en, `day ${i + 1}`).toMatch(re));
  });

  it('runs receive → examine → pray → practise on every day', () => {
    for (const [i, d] of plan.days.entries()) {
      for (const lang of ['en', 'fr']) {
        expect(d.selfPrompt?.[lang]?.length, `day ${i + 1} selfPrompt ${lang}`).toBeGreaterThan(30);
        expect(d.practice?.[lang]?.length, `day ${i + 1} practice ${lang}`).toBeGreaterThan(30);
      }
      expect(d.prompts, `day ${i + 1}`).toHaveLength(3);
      expect(d.resourceTopics, `day ${i + 1}`).toContain('fruit-of-the-spirit');
    }
  });

  it('guards each virtue against its counterfeit', () => {
    expect(day(3).reflection.en).toMatch(/not forced cheerfulness/);
    expect(day(4).reflection.en).toMatch(/does not deny trouble, grief or disagreement/);
    expect(day(5).reflection.en).toMatch(/never calls wrong right/);
    expect(day(9).reflection.en).toMatch(/Gentleness still confronts/);
    expect(day(9).related).toContain('Galatians 6:1-2');
    expect(day(10).reflection.en).toMatch(/not numbness/);
  });

  it('addresses the French reader as "tu", never "vous"', () => {
    const french = proseOf(plan).filter((row) => row.lang === 'fr');
    expect(french.length).toBeGreaterThan(0);
    const vous = french.filter((row) => /\bvous\b/i.test(row.text)).map((row) => row.where);
    expect(vous).toEqual([]);
  });
});
