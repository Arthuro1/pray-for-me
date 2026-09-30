import { describe, it, expect } from 'vitest';
import { YOUR_KINGDOM_COME as plan } from './yourKingdomCome';
import { runNewPlanContract, expectNoProseMatching } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'kingdomCome14',
  count: 14,
  category: 'formation',
  mode: 'prayer',
  domains: ['christian-living'],
  movements: ['father', 'daily', 'sent'],
});

const day = (n) => plan.days[n - 1];

describe('kingdomCome14 guardrails', () => {
  it('prays in two movements every day: intercession, then submission to His reign', () => {
    for (const [i, d] of plan.days.entries()) {
      expect(d.prompts, `day ${i + 1}`).toHaveLength(3);
      expect(d.selfPrompt?.en, `day ${i + 1} selfPrompt en`).toMatch(/\bunder His reign\b/);
      expect(d.selfPrompt?.fr, `day ${i + 1} selfPrompt fr`).toMatch(/\bson règne\b/);
    }
  });

  it('never equates the kingdom with a nation, party, government or prosperity', () => {
    expectNoProseMatching(plan, [
      /\bkingdom (?:of God |of heaven )?(?:is|means|equals) (?:a |an |our |your |the )?(?:nation|country|party|government|state|denomination|movement|culture|prosperity|wealth|riches|success)\b/i,
      /\b(?:Christian|godly) (?:nation|government|party)\b/i,
      /\b(?:take|win|reclaim|conquer) (?:back )?(?:the |our |your )?(?:nation|country|culture|mountains?)\b/i,
      /\bkingdom (?:wealth|prosperity|finances?|riches)\b/i,
      /\b(?:will|shall) (?:make you|bring you) (?:rich|wealthy|prosperity|success)\b/i,
      /\b(?:règne|royaume) (?:de Dieu |des cieux )?(?:est|signifie|équivaut à) (?:une |un |la |le |notre |ta )?(?:nation|pays|parti|gouvernement|État|dénomination|mouvement|culture|prospérité|richesse|réussite)\b/i,
      /\b(?:reconquérir|conquérir|reprendre) (?:la |le |notre |ta )?(?:nation|pays|culture)\b/i,
      /\bte rendra (?:riche|prospère)\b/i,
    ]);
    // …and says so in its own words where the subject comes up.
    expect(day(3).reflection.en).toMatch(/No nation, party or movement owns it/);
    expect(day(3).reflection.fr).toMatch(/Aucune nation, aucun parti, aucun mouvement ne le possède/);
    expect(day(6).reflection.en).toMatch(/does not promise wealth/);
    expect(day(6).reflection.fr).toMatch(/ne promet pas la richesse/);
    expect(day(12).reflection.en).toMatch(/do not seize control/);
  });

  it('never promises an outcome for prayer', () => {
    expectNoProseMatching(plan, [
      /\bguarantee/i,
      /\b(?:surely|certainly|definitely|without fail)\b/i,
      /\byour (?:prayers?|requests?) will be (?:answered|granted)\b/i,
      /\bGod (?:will|is going to) (?:heal|save|provide|bless you with|give you|bring (?:them|him|her) back)\b/i,
      /\bprayer (?:unlocks|releases|activates|forces)\b/i,
      /\bgaranti/i,
      /\b(?:certainement|forcément|sûrement|à coup sûr)\b/i,
      /\bDieu (?:va|te) (?:guérir|sauver|donner)\b/i,
      /\bla prière (?:débloque|libère|active|force)\b/i,
    ]);
  });

  it('never asks a wounded reader to picture God through an earthly father', () => {
    expectNoProseMatching(plan, [
      /\b(?:like|as) your (?:earthly |own )?(?:dad|father)\b/i,
      /\bcomme ton (?:propre )?(?:papa|père)\b/i,
    ]);
    expect(day(1).related).toContain('Luke 15:11-24');
    expect(day(1).reflection.en).toMatch(/let Jesus define it/);
  });

  it('keeps Gethsemane honest: surrender without denying sorrow', () => {
    expect(day(4).ref).toBe('Matthew 26:36-46');
    expect(day(4).reflection.en).toMatch(/grief/);
    expect(day(4).reflection.en).toMatch(/not pretending to be fine/);
    expect(day(4).reflection.fr).toMatch(/tristesse/);
    expect(day(4).reflection.fr).toMatch(/faire semblant/);
  });

  it('says forgiveness does not require trust, reconciliation or unsafe access', () => {
    const note = day(9).safetyNote;
    expect(note.en).toMatch(/does not mean/);
    expect(note.en).toMatch(/trusting them again/);
    expect(note.en).toMatch(/access to you/);
    expect(note.en).toMatch(/emergency services/);
    expect(note.fr).toMatch(/ne signifie pas/);
    expect(note.fr).toMatch(/accès/);
    expect(note.fr).toMatch(/services d'urgence/);
    expect(day(9).reflection.en).toMatch(/not the same as trust or reconciliation/);
  });

  it('carries a safety note exactly on the forgiveness and deliverance days', () => {
    const withNote = plan.days.flatMap((d, i) => (d.safetyNote ? [i + 1] : []));
    expect(withNote).toEqual([9, 11]);
    for (const n of withNote) {
      expect(day(n).safetyNote.en).toMatch(/emergency services/);
      expect(day(n).safetyNote.fr).toMatch(/services d'urgence/);
    }
  });

  it('treats temptation and evil soberly: names the translation question, diagnoses nothing', () => {
    expect(day(10).reflection.en).toMatch(/translations differ/);
    expect(day(10).reflection.en).toMatch(/God tempts no one/);
    expect(day(11).reflection.en).toMatch(/evil one/);
    expect(day(11).reflection.en).toMatch(/translations differ/);
    expect(day(11).reflection.fr).toMatch(/Malin/);
    expectNoProseMatching(plan, [
      /\b(?:a|the) (?:demon|spirit|curse) (?:is|may be) (?:behind|causing)\b/i,
      /\b(?:your|this) (?:illness|sickness|depression|problem) is (?:a |an )?(?:spiritual attack|curse|demonic)\b/i,
      /\b(?:un démon|un esprit|une malédiction) (?:est|pourrait être) (?:derrière|la cause)\b/i,
    ]);
    for (const d of plan.days) expect(d.resourceTopics).not.toContain('spiritual-warfare');
  });

  it('hopes for Christ’s return without setting dates', () => {
    expect(day(14).reflection.en).toMatch(/no one knows the day/);
    expect(day(14).reflection.fr).toMatch(/personne ne connaît le jour/);
    expectNoProseMatching(plan, [
      /\b(?:19|20)\d\d\b/,
      /\b(?:in|within) (?:our|this) generation\b/i,
      /\bsooner than (?:you|we) think\b/i,
      /\bnotre génération (?:verra|sera)\b/i,
    ]);
  });

  it('opens with the Father and closes with the prayer for Christ’s coming', () => {
    expect(day(1).ref).toBe('Matthew 6:5-13');
    expect(day(14).ref).toBe('Revelation 21:1-7');
    expect(day(14).related).toContain('Revelation 22:17-21');
  });
});
