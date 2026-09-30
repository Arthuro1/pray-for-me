import { describe, it, expect } from 'vitest';
import { PRAYING_FOR_A_PRODIGAL as plan } from './prayingForAProdigal';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'prodigal30', count: 30, category: 'others', mode: 'prayer',
  domains: ['intercession'], movements: ['father', 'persist', 'heart', 'hope'],
});

const day = (n) => plan.days[n - 1];
const daysWhere = (test) => plan.days.flatMap((d, i) => (test(d) ? [i + 1] : []));

describe('prodigal30 guardrails', () => {
  it('never promises that the person will return, during the plan or after it', () => {
    expectNoProseMatching(plan, [
      /(?<!promise that )\b(?:they|he|she|your loved one|the person you love) will (?:surely |certainly |definitely |one day |eventually |soon )?(?:return|come back|come home|turn back)\b/i,
      /\bGod (?:will|is going to|promises to) (?:surely |certainly )?(?:bring (?:them|him|her) (?:back|home)|restore (?:them|him|her)|save (?:them|him|her))\b/i,
      /(?<!(?:not|never|does it) )\bpromises? (?:you )?(?:that )?(?:they|your loved one|the person you love) will\b/i,
      /(?<!(?:not|no|never) )\bguarantees? (?:that |their |a )/i,
      /\b(?:in|by) (?:God's|His) (?:perfect )?tim(?:e|ing),? (?:they|he|she) will\b/i,
      /\bonly a matter of time\b/i,
      /\bwhen (?:they|he|she) (?:comes? back|returns?|comes? home)\b/i,
      /\bDieu (?:va|te promet de|promet de) (?:la |le |les )?(?:ramener|sauver|restaurer)\b/i,
      /\brevien(?:dra|dront) (?:sûrement|certainement|forcément|un jour|bientôt)\b/i,
      /\bquand elle reviendra\b/i,
      /\bune question de temps\b/i,
      /(?<!ne )\bgarantit\b/i,
      /(?<!ne )\bte promet (?:que|son|sa|leur)\b/i,
    ]);
    expect(plan.intro.en).toMatch(/Nor does it promise that they will return/);
    expect(plan.intro.fr).toMatch(/ne promet pas non plus qu'elle reviendra/);
    expect(plan.completion.en).toMatch(/does not promise/);
    expect(plan.completion.fr).toMatch(/ne promet pas/);
    expect(plan.biblical.text.en).toMatch(/None of these passages promises the return of a particular person/);
  });

  it('never claims to know why the person left, and never reduces leaving to rebellion', () => {
    for (const re of [/doubt/, /hurt/, /sin/, /grief/, /trauma/, /mental illness/, /a church that failed them/, /honest questions/, /You may not know which is true/]) {
      expect(day(2).reflection.en).toMatch(re);
    }
    for (const re of [/le doute/, /une blessure/, /le péché/, /un traumatisme/, /la maladie psychique/, /une Église qui a failli/, /Tu ne sais peut-être pas laquelle est vraie/]) {
      expect(day(2).reflection.fr).toMatch(re);
    }
    expect(day(25).reflection.en).toMatch(/not every wanderer is a rebel/);
    expect(day(25).reflection.fr).toMatch(/tout égaré n'est pas un rebelle/);
    expectNoProseMatching(plan, [
      /\bthe (?:real|true) reason (?:they|he|she) left\b/i,
      /\b(?:they|he|she) (?:left|walked away|wandered off) because (?:they|he|she) (?:wanted|loved|chose)\b/i,
      /(?<!not )\b(?:every|all) (?:prodigals?|wanderers?|departures?) (?:is|are) (?:a )?(?:rebels?|rebellion|rebellious)\b/i,
      /\bbecause of (?:their|his|her) (?:sin|rebellion|pride)\b/i,
      /\bla vraie raison de son départ\b/i,
      /\btout (?:prodigue|égaré) est un rebelle\b/i,
      /\bparce qu['’]elle (?:a voulu|aimait|a choisi) (?:le péché|sa liberté)\b/i,
    ]);
  });

  it('never coaches manipulation, pressure or deception', () => {
    expectNoProseMatching(plan, [
      /\btough love\b/i,
      /\b(?:use|try) (?:guilt|shame|pressure|an ultimatum)\b/i,
      /\bmake (?:them|him|her) feel (?:guilty|ashamed)\b/i,
      /(?<!no )\b(?:give|issue) (?:them|him|her) an ultimatum\b/i,
      /\bwithout (?:them|him|her) knowing\b/i,
      /\b(?:secretly|covertly) (?:invite|bring|evangeli[sz]e|leave|send)\b/i,
      /\bamour vache\b/i,
      /\bculpabilise-la\b/i,
      /\bpose-lui un ultimatum\b/i,
      /\bsans qu['’]elle le sache\b/i,
      /\b(?:en cachette|à son insu)\b/i,
    ]);
    const kindness = day(18);
    expect(kindness.movement).toBe('heart');
    expect(kindness.ref).toBe('Romans 2:1-4');
    for (const re of [/no guilt-trips/, /no ultimatums dressed up as love/, /no conversations staged as ambushes/, /Kindness with a hidden hook is not kindness/]) {
      expect(kindness.reflection.en).toMatch(re);
    }
    for (const re of [/pas de culpabilisation/, /pas d'ultimatum/, /embuscade/]) {
      expect(kindness.reflection.fr).toMatch(re);
    }
    expect(kindness.prompts[0].en).toMatch(/Confess any way you have tried to pressure, shame or trick/);
  });

  it('teaches both when to speak and when to stay quiet', () => {
    expect(day(19).ref).toBe('1 Peter 3:13-16');
    expect(day(19).reflection.en).toMatch(/waiting to be asked/);
    expect(day(20).ref).toBe('Ecclesiastes 3:1-8');
    expect(day(20).reflection.en).toMatch(/when they have asked you to stop/);
  });

  it('carries a safety note on the letting-go, church-hurt and boundaries days, and only there', () => {
    expect(daysWhere((d) => d.safetyNote)).toEqual([3, 11, 26]);
    expect(day(3).safetyNote.en).toMatch(/emergency services/);
    expect(day(11).safetyNote.en).toMatch(/believe them/);
    expect(day(11).safetyNote.en).toMatch(/police/);
    expect(day(11).safetyNote.en).toMatch(/safeguarding lead/);

    const boundaries = day(26);
    expect(boundaries.theme.en).toBe('Love can say no');
    expect(boundaries.resourceTopics).toContain('boundaries');
    const note = boundaries.safetyNote;
    for (const re of [/not a failure of love/, /forgiveness never requires you to stay in harm's way/, /violent/, /exploiting/, /addiction/, /pastor/, /counsellor/, /family support/, /police or emergency services/, /protection services/]) {
      expect(note.en).toMatch(re);
    }
    for (const re of [/n'est pas un manque d'amour/, /rester exposé au danger/, /violente/, /addiction/, /pasteur/, /conseiller/, /police ou les services d'urgence/, /services de protection/]) {
      expect(note.fr).toMatch(re);
    }
  });

  it('tags sensitive topics only on days that name them, and gives those days a safety note', () => {
    expect(daysWhere((d) => d.resourceTopics.includes('addiction'))).toEqual([26]);
    expect(day(26).reflection.en).toMatch(/addiction/);
    expect(daysWhere((d) => d.resourceTopics.includes('church-hurt'))).toEqual([11]);
    for (const n of daysWhere((d) => d.resourceTopics.some((t) => ['addiction', 'church-hurt', 'abuse-safety', 'trauma'].includes(t)))) {
      expect(day(n).safetyNote, `day ${n}`).toBeTruthy();
    }
  });

  it('turns every day’s prayer back on the one praying', () => {
    plan.days.forEach((d, i) => {
      for (const lang of ['en', 'fr']) expect(d.selfPrompt?.[lang]?.length, `day ${i + 1} selfPrompt ${lang}`).toBeGreaterThan(15);
    });
  });

  it('is built on Luke 15, including the elder brother in the intercessor’s own heart', () => {
    expect(plan.biblical.ref).toBe('Luke 15');
    expect(daysWhere((d) => d.ref.startsWith('Luke 15:'))).toEqual([1, 2, 3, 5, 6, 15]);
    expect(day(15).movement).toBe('heart');
    expect(day(15).ref).toBe('Luke 15:25-32');
    expect(day(15).reflection.en).toMatch(/older son/);
  });

  it('honours grief and lament rather than hurrying past them', () => {
    expect(daysWhere((d) => d.resourceTopics.includes('lament')).length).toBeGreaterThanOrEqual(2);
    expect(day(7).practice.en).toMatch(/grieve honestly/);
    expect(day(22).ref).toBe('Lamentations 3:19-26');
  });

  it('ends in surrender and hope, with no deadline for the answer', () => {
    expect(day(29).ref).toBe('Mark 14:32-36');
    expect(day(30).ref).toBe('Romans 15:13');
    expect(day(30).reflection.en).toMatch(/without knowing the end of the story/);
    expect(day(27).practice.en).toMatch(/cross it out/);
  });

  it('keeps the French devotional prose in the tu register', () => {
    const fr = proseOf(plan).filter((row) => row.lang === 'fr');
    const addressed = fr.filter((row) => /\b(?:tu|te|toi|ton|ta|tes)\b|-toi\b|-le\b/i.test(row.text));
    expect(addressed.length).toBeGreaterThan(fr.length / 2);
    expect(fr.filter((row) => /\bvotre\b|\bvos\b/i.test(row.text)).map((row) => row.where)).toEqual([]);
  });
});
