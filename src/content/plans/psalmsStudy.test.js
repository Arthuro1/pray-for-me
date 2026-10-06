import { describe, it, expect } from 'vitest';
import { PSALMS_STUDY as plan } from './psalmsStudy';
import { runNewPlanContract, expectNoProseMatching } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'psalms42', count: 42, category: 'bible-study', mode: 'study',
  domains: ['bible-study'], movements: ['praise', 'trust', 'lament', 'mercy', 'justice', 'hope'],
});

const day = (n) => plan.days[n - 1];
const studyText = (n, lang) => Object.values(day(n).study).flat().map((f) => f[lang]).join(' ');

describe('psalms42 guardrails', () => {
  it('never promises healing, protection, prosperity or any outcome', () => {
    expectNoProseMatching(plan, [
      /\bpromises? you (?:a|an|that)\b/i,
      /\b(?:God|the Lord|He) (?:will|shall) (?:surely|certainly|definitely|always) (?:heal|protect|prosper|deliver|give|restore)\b/i,
      /\byou will (?:never|not) (?:suffer|fall ill|be harmed|get sick|be sick|lack)\b/i,
      /\b(?:this psalm|the psalm|it) guarantees\b/i,
      /\bguaranteed (?:healing|protection|prosperity|wealth|success|recovery)\b/i,
      /\bte promet (?:que|un|une)\b/i,
      /\bDieu (?:va|te) (?:forcément|sûrement|certainement)\b/i,
      /\b(?:ce psaume|le psaume) (?:te )?garantit que\b/i,
      /\btu ne (?:seras|tomberas) jamais (?:malade|atteint)\b/i,
      /\bguérison garantie\b/i,
    ]);
  });

  it('never licenses curses or revenge from the imprecatory lines', () => {
    expectNoProseMatching(plan, [
      /\b(?:you may|you can|feel free to|it is right to|go ahead and) (?:curse|take revenge|get even|avenge)\b/i,
      /\bcurse (?:them|him|her|your enem(?:y|ies)|those who)\b/i,
      /\b(?:take|get|seek) (?:your )?(?:own )?(?:revenge|vengeance)\b/i,
      /\bpray (?:down )?(?:curses|destruction|death) (?:on|upon|against)\b/i,
      /\bmaudis(?:-les| tes ennemis)\b/i,
      /\b(?:venge-toi|tu peux te venger|prends ta revanche)\b/i,
      /\bprie (?:pour|afin) que (?:tes ennemis|ils) (?:meurent|soient détruits|souffrent)\b/i,
    ]);
    // Psalm 69 hands the anger to God under Jesus' teaching on enemies.
    expect(day(19).ref).toBe('Psalm 69');
    expect(studyText(19, 'en')).toMatch(/Matthew 5:44/);
    expect(studyText(19, 'en')).toMatch(/Romans 12:19/);
    expect(studyText(19, 'fr')).toMatch(/Matthieu 5\.44/);
    // Psalm 2's rod of iron is no mandate for coercion; Psalm 37 leaves vengeance to God.
    expect(day(30).study.tension.en).toMatch(/not for revenge/);
    expect(day(30).study.tension.en).toMatch(/John 18:36/);
    expect(day(32).study.tension.en).toMatch(/Romans 12:19/);
    expect(day(32).safetyNote.en).toMatch(/not revenge/);
  });

  it('lets Psalm 88 end in darkness instead of forcing a happy ending', () => {
    expect(day(21).ref).toBe('Psalm 88');
    expect(day(21).reflection.en).toMatch(/will not add a happier ending/);
    expect(day(21).reflection.fr).toMatch(/n’ajoutera pas de fin plus heureuse/);
    expect(day(21).study.tension.en).toMatch(/Do not rush to resolve/);
    expect(day(21).study.context.en).toMatch(/no turn to trust/);
    expect(day(21).study.prayer.en).not.toMatch(/\b(?:joy|rejoic\w*|victory|breakthrough|triumph\w*)\b/i);
    expect(day(21).study.prayer.fr).not.toMatch(/\b(?:joie|victoire|triomphe)\b/i);
  });

  it('reads Psalm 91 as shelter, not a guarantee against all harm', () => {
    expect(day(13).ref).toBe('Psalm 91');
    expect(day(13).related).toContain('Matthew 4:1-11');
    expect(day(13).study.context.en).toMatch(/Matthew 4:5-7/);
    expect(day(13).study.tension.en).toMatch(/Psalm 91 is not a guarantee/);
    expect(day(13).study.tension.fr).toMatch(/ne garantit pas/);
    expect(day(13).safetyNote.en).toMatch(/medical advice/);
  });

  it('keeps Psalm 73 as the counterweight to any prosperity reading of Psalms 1 and 37', () => {
    expect(day(29).ref).toBe('Psalm 1');
    expect(day(32).ref).toBe('Psalm 37');
    expect(day(33).ref).toBe('Psalm 73');
    expect(day(29).study.tension.en).toMatch(/Psalm 73/);
    expect(day(32).study.tension.en).toMatch(/Psalm 73/);
  });

  it('never claims that every psalm is spoken by Christ, and names genuine New Testament uses', () => {
    expectNoProseMatching(plan, [
      /\bevery psalm (?:is|was) (?:spoken|prayed|voiced) by (?:Christ|Jesus)\b/i,
      /\ball the psalms are (?:the words|the voice) of (?:Christ|Jesus)\b/i,
      /\btous les psaumes sont (?:les paroles|la voix) (?:du Christ|de Jésus)\b/i,
    ]);
    expect(day(30).study.context.en).toMatch(/Acts 13:33/);
    expect(day(39).study.context.en).toMatch(/Matthew 21:42/);
    expect(day(39).study.tension.en).toMatch(/Not every line is a word spoken by Christ/);
  });

  it('carries a safety note on the days that need one, with a crisis pointer on the despair-heavy ones', () => {
    const withNotes = plan.days.flatMap((d, i) => (d.safetyNote ? [i + 1] : []));
    expect(withNotes).toEqual([13, 15, 16, 17, 18, 19, 20, 21, 22, 25, 26, 27, 32, 38]);
    // Psalms 13, 42, 77, 69, 22, 88, then 6, 38 and 116.
    for (const n of [15, 16, 18, 19, 20, 21, 22, 25, 38]) {
      expect(day(n).safetyNote.en, `day ${n}`).toMatch(/crisis line/);
      expect(day(n).safetyNote.en, `day ${n}`).toMatch(/someone you trust/);
      expect(day(n).safetyNote.fr, `day ${n}`).toMatch(/ligne d’écoute/);
    }
    expect(day(32).safetyNote.en).toMatch(/safeguarding lead/);
    expect(day(32).safetyNote.fr).toMatch(/responsable de la protection/);
  });

  it('teaches the six questions on day 1 and reviews them at every week boundary', () => {
    expect(day(1).study.synthesis.en).toMatch(/1\. What does this psalm reveal about God\?/);
    expect(day(1).study.synthesis.en).toMatch(/6\. How can its language faithfully become prayer\?/);
    for (const n of [7, 14, 21, 28, 35, 42]) {
      expect(day(n).study.synthesis.en, `day ${n}`).toMatch(/review/i);
      expect(day(n).study.synthesis.en, `day ${n}`).toMatch(/\?/);
      expect(day(n).study.synthesis.fr, `day ${n}`).toMatch(/bilan/i);
    }
  });

  it('stays off the shelves of the other Bible studies', () => {
    for (const [i, d] of plan.days.entries()) {
      expect(d.resourceTopics, `day ${i + 1}`).not.toContain('wisdom-literature');
      expect(d.resourceTopics, `day ${i + 1}`).not.toContain('david');
      expect(d.resourceTopics, `day ${i + 1}`).toContain('psalms');
    }
  });

  it('studies one psalm a day, never the same psalm twice', () => {
    for (const [i, d] of plan.days.entries()) expect(d.ref, `day ${i + 1}`).toMatch(/^Psalm \d+$/);
    expect(new Set(plan.days.map((d) => d.ref)).size).toBe(42);
  });
});
