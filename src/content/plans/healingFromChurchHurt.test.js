import { describe, it, expect } from 'vitest';
import { HEALING_FROM_CHURCH_HURT as plan } from './healingFromChurchHurt';
import { runNewPlanContract, expectNoProseMatching } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'churchHurt21', count: 21, category: 'freedom', mode: 'prayer',
  domains: ['care'], movements: ['lament', 'shepherd', 'boundaries', 'hope'],
});

const day = (n) => plan.days[n - 1];
const daysWhere = (test) => plan.days.flatMap((d, i) => (test(d) ? [i + 1] : []));
const cites = (d, prefix) => [d.ref, ...(d.related || [])].some((r) => r.startsWith(prefix));
const textOf = (d, lang) => [d.reflection, ...(d.prompts || []), d.practice, d.safetyNote]
  .filter(Boolean).map((field) => field[lang]).join(' ');

// A safety note must name at least one source of real, human help.
const REAL_HELP = {
  en: /\b(?:police|emergency services|safeguarding|victim-support|counsellor|lawyer|legal adviser|doctor|pastor)\b/i,
  fr: /(?:police|services d’urgence|protection des personnes|organisme .*protection|aide aux victimes|conseiller|avocat|médecin|pasteur)/i,
};

describe('churchHurt21 guardrails', () => {
  it('never tells a wounded reader to submit, go back or keep quiet', () => {
    expectNoProseMatching(plan, [
      /\bsubmit (?:anyway|regardless|no matter what)\b/i,
      /\bsubmit to (?:him|her|them|your (?:leaders?|pastor)) (?:anyway|regardless)\b/i,
      /\b(?:go|going|come|coming) back (?:anyway|regardless|no matter what)\b/i,
      /\breturn (?:anyway|regardless|no matter what)\b/i,
      /\byou (?:must|should|need to|have to) (?:go back|return) to (?:that|the|your) church\b/i,
      /\b(?:do not|don['’]t|never) (?:report|go to the police|call the police|tell the police|tell anyone)\b/i,
      /\b(?:keep|handle|settle|deal with) (?:it|this|the matter) (?:privately|quiet|in-house|within the church|inside the church)\b/i,
      /\byou (?:must|should|need to) (?:stay|keep) (?:quiet|silent)\b/i,
      /\b(?:cover|hush) (?:it|this|things) up\b/i,
      /\bGod wants you to (?:go back|return|forgive|submit|stay)\b/i,
      /\bsoumets?-toi (?:quand même|malgré tout|coûte que coûte)\b/i,
      /\b(?:retourne|reviens)(?:-y)? (?:quand même|malgré tout|coûte que coûte)\b/i,
      /\btu (?:dois|devrais) (?:retourner|revenir) (?:dans|à) (?:cette|ton|l['’])\s?Église\b/i,
      /\bne (?:le |la |les )?signale pas\b/i,
      /\bn['’]appelle pas la police\b/i,
      /\bne porte pas plainte\b/i,
      /\brégler (?:ça|cela|l['’]affaire) (?:en privé|entre vous)\b/i,
      /\btu (?:dois|devrais) te taire\b/i,
      /\bDieu veut que tu (?:retournes|reviennes|pardonnes|te soumettes|restes)\b/i,
    ]);
  });

  it('never treats reporting as unforgiveness, or leaving abuse as rebellion', () => {
    expectNoProseMatching(plan, [
      /\breporting (?:abuse |it |this |them )?(?:is|would be|was) (?:a sign of |a form of )?(?:unforgiveness|bitterness|gossip|slander|rebellion|revenge|vengeance)\b/i,
      /\bto report (?:is|would be) (?:unforgiving|bitter|rebellious)\b/i,
      /\b(?:leaving|to leave) (?:the |a |your |that )?(?:church|ministry|leader)s? (?:is|was|would be|means) (?:rebellion|rebelling|sin|disobedience)\b/i,
      /\btouch(?:ing)? (?:not )?(?:the Lord['’]s|God['’]s|my) anointed\b/i,
      /\bsignaler (?:des |les |ces )?(?:violences |abus |faits )?(?:est|serait|c['’]est) (?:de la |un |une )?(?:rancune|manque de pardon|médisance|rébellion|vengeance|amertume)\b/i,
      /\bquitter (?:l['’]Église|ton Église|une Église|ce ministère|un responsable) (?:est|serait|c['’]est) (?:une )?(?:rébellion|péché|désobéissance)\b/i,
      /\bse rebeller contre l['’]oint\b/i,
    ]);
  });

  it('never equates forgiveness with restored trust, reconciliation or access', () => {
    expectNoProseMatching(plan, [
      /\bforgiv(?:e|es|ing|eness)(?:\s+(?:him|her|them|someone|the person|your abuser))?\s+(?:means|requires|restores|includes|implies)\s+(?:\w+\s+){0,3}?(?:trust|reconcil\w*|contact|access|return\w*|going back|staying)\b/i,
      /\bto forgive is to (?:trust|reconcile|return|forget)\b/i,
      /\bif you (?:have |had )?(?:truly |really )?forgiven?\b[^.]*\byou (?:would|will|must|should|could) (?:trust|go back|return|reconcile|meet|let)\b/i,
      /\b(?:true|real|genuine) forgiveness (?:means|requires|restores|includes)\b/i,
      /\bforgive and forget\b/i,
      /\bpardonner,? c['’]est (?:faire confiance|se réconcilier|revenir|retourner|oublier)\b/i,
      /\ble (?:vrai )?pardon (?:exige|implique|rétablit|restaure|signifie|suppose) (?:\S+ ){0,3}?(?:la confiance|la réconciliation|le contact|l['’]accès|le retour|de revenir|de retourner)/i,
      /\bsi tu (?:as |avais )?(?:vraiment )?pardonné\b[^.]*\btu (?:dois|devrais|vas|pourras) (?:lui )?(?:faire confiance|revenir|retourner|te réconcilier|le rencontrer|la rencontrer)\b/i,
      /\bpardonner et oublier\b/i,
    ]);
  });

  it('never promises healing, restoration or any outcome', () => {
    expectNoProseMatching(plan, [
      /\byou will (?:be )?(?:healed|restored|whole again|fully healed)\b/i,
      /\bGod (?:will|is going to|promises to) (?:surely |certainly )?(?:heal|restore|vindicate|repay)\b/i,
      /\bguarantees? (?:that|your|a|you)\b/i,
      /\b(?:the pain|this wound|your wound) will (?:soon |surely )?(?:be gone|heal|disappear|end)\b/i,
      /(?<!(?:not|never) )\bpromises? (?:you )?(?:that )?(?:your|the) (?:healing|pain|wound|relationship)\b/i,
      /\btu seras (?:guéri|restauré|rétabli)/i,
      /\bDieu (?:va|te promet de|promet de) (?:te )?(?:guérir|restaurer|réparer)\b/i,
      /(?<!ne )\bgarantit\b/i,
      /(?<!ne )\bte promet (?:que|la|une)\b/i,
    ]);
    expect(plan.intro.en).toMatch(/does not promise a particular outcome/);
    expect(plan.intro.fr).toMatch(/ne promet aucun résultat particulier/);
    expect(plan.completion.en).toMatch(/does not promise/);
    expect(plan.completion.fr).toMatch(/ne promet pas/);
  });

  it('writes the non-negotiable principles into the days themselves', () => {
    expect(day(5).reflection.en).toMatch(/Spiritual authority never excuses abuse or coercion; leaving abuse is not rebellion against God/);
    expect(day(5).reflection.fr).toMatch(/L’autorité spirituelle n’excuse jamais les violences ni la contrainte ; quitter un milieu abusif n’est pas se rebeller contre Dieu/);

    expect(day(11).reflection.en).toMatch(/Forgiveness is not denial/);
    expect(day(11).reflection.fr).toMatch(/Le pardon n’est pas un déni/);

    expect(day(12).reflection.en).toMatch(/Forgiveness does not automatically restore trust, and it does not require continued access/);
    expect(day(12).reflection.fr).toMatch(/Le pardon ne rétablit pas automatiquement la confiance et n’exige pas de maintenir l’accès/);

    expect(day(13).reflection.en).toMatch(/Refusing revenge therefore does not mean refusing justice/);
    expect(day(13).reflection.en).toMatch(/reconciliation may not be appropriate or possible/);
    expect(day(13).reflection.fr).toMatch(/la réconciliation peut ne pas être appropriée, ni même possible/);
    expect(day(13).safetyNote.en).toMatch(/^Reporting abuse is not unforgiveness\./);
    expect(day(13).safetyNote.fr).toMatch(/^Signaler des violences n’est pas un manque de pardon\./);

    expect(day(14).reflection.en).toMatch(/Criminal conduct must not be concealed under church discipline/);
    expect(day(14).reflection.fr).toMatch(/Des actes criminels ne doivent jamais être dissimulés sous couvert de discipline d’Église/);

    expect(day(19).safetyNote.en).toMatch(/You are never required to return to a church where you were abused/);
    expect(day(19).safetyNote.fr).toMatch(/Tu n’es jamais obligé de retourner dans une Église où tu as subi des abus/);
  });

  it('serves the whole range, from disappointment to abuse', () => {
    for (const text of [day(1).reflection.en, plan.intro.en]) {
      expect(text).toMatch(/disappointment (?:or|and) conflict/);
      expect(text).toMatch(/spiritual, emotional, sexual or financial abuse/);
    }
    expect(day(1).reflection.fr).toMatch(/d’une déception ou d’un conflit/);
    expect(day(1).reflection.fr).toMatch(/spirituelles, psychologiques, sexuelles ou financières/);
    expect(day(1).reflection.en).toMatch(/You do not have to minimise what happened, label it immediately, or recount it here/);
  });

  it('carries a safety note on the days that need one, each naming real help', () => {
    expect(daysWhere((d) => d.safetyNote)).toEqual([1, 5, 11, 12, 13, 14, 15, 19, 21]);
    for (const n of daysWhere((d) => d.safetyNote)) {
      expect(day(n).safetyNote.en, `day ${n} en`).toMatch(REAL_HELP.en);
      expect(day(n).safetyNote.fr, `day ${n} fr`).toMatch(REAL_HELP.fr);
    }
    // The opening day: danger, abuse, and the duty to report harm to the vulnerable.
    expect(day(1).safetyNote.en).toMatch(/emergency services or police/);
    expect(day(1).safetyNote.en).toMatch(/abuse of a child or a vulnerable adult must be reported/);
    expect(day(1).safetyNote.en).toMatch(/without waiting for church permission/);
    expect(day(1).safetyNote.fr).toMatch(/services d’urgence ou la police/);
    expect(day(1).safetyNote.fr).toMatch(/enfant ou d’un adulte vulnérable doit être signalé/);
  });

  it('keeps the forgiveness days safe: no silence, no forced contact, real help named', () => {
    const forgivenessDays = daysWhere((d) => d.resourceTopics.includes('forgiveness'));
    expect(forgivenessDays).toEqual([11, 12, 13, 15]);
    for (const n of forgivenessDays) expect(day(n).safetyNote, `day ${n}`).toBeTruthy();
    expect(day(11).safetyNote.en).toMatch(/Forgiveness never requires you to stay silent about abuse, to remain in contact, or to stay in a place where you are not safe/);
    expect(day(11).safetyNote.en).toMatch(/counsellor/);
    expect(day(12).safetyNote.en).toMatch(/You may decline contact/);
    expect(day(12).safetyNote.en).toMatch(/police/);
    expect(day(15).safetyNote.en).toMatch(/You are not obliged to meet someone who harmed you in order to hear an apology/);
  });

  it('keeps the reporting and justice days pointed at the police and safeguarding', () => {
    const reportingDays = daysWhere((d) => /\breport/i.test(textOf(d, 'en')));
    expect(reportingDays).toEqual(expect.arrayContaining([1, 13, 14]));
    for (const n of reportingDays) expect(day(n).safetyNote, `day ${n}`).toBeTruthy();
    for (const n of [13, 14]) {
      expect(day(n).safetyNote.en, `day ${n}`).toMatch(/police/);
      expect(day(n).safetyNote.en, `day ${n}`).toMatch(/vulnerable adult/);
      expect(day(n).safetyNote.fr, `day ${n}`).toMatch(/police/);
    }
    expect(day(13).safetyNote.en).toMatch(/immediate danger, call emergency services/);
    expect(day(14).safetyNote.en).toMatch(/you do not have to meet them first/);
  });

  it('never uses Matthew 18:15 as a script for confronting an abuser', () => {
    const matthew18 = daysWhere((d) => cites(d, 'Matthew 18:15'));
    expect(matthew18).toEqual([14]);
    expect(day(14).reflection.en).toMatch(/they never require anyone to confront an abuser alone/);
    expect(day(14).reflection.fr).toMatch(/elle n’oblige jamais personne à confronter seul un agresseur/);
  });

  it('uses Hebrews 13:17 only with its limit stated', () => {
    for (const n of daysWhere((d) => cites(d, 'Hebrews 13'))) {
      expect(day(n).reflection.en, `day ${n}`).toMatch(/it never asks anyone to submit to abuse/);
      expect(day(n).reflection.fr, `day ${n}`).toMatch(/il ne demande jamais à personne de se soumettre à des abus/);
    }
  });

  it('offers Hebrews 10:25 only as an invitation, with permission to take time', () => {
    const hebrews10 = daysWhere((d) => cites(d, 'Hebrews 10'));
    expect(hebrews10).toEqual([19]);
    for (const n of hebrews10) {
      expect(day(n).reflection.en).toMatch(/an invitation to encouragement, not a rule to be used against the wounded/);
      expect(day(n).reflection.en).toMatch(/You may take your time and choose a safe community/);
      expect(day(n).reflection.fr).toMatch(/Tu peux prendre ton temps et choisir une communauté sûre/);
      expect(day(n).movement).toBe('hope');
      expect(day(n).safetyNote).toBeTruthy();
    }
  });

  it('names the reader who has also caused hurt once, without moving the focus off the wounded', () => {
    expect(daysWhere((d) => /(?:you have also wounded others|If you have hurt others)/.test(textOf(d, 'en')))).toEqual([15]);
    expect(day(15).reflection.en).toMatch(/if you know you have also wounded others/);
    expect(day(15).reflection.en).toMatch(/without cancelling what was done to you/);
    expect(day(15).reflection.fr).toMatch(/si tu sais avoir toi aussi blessé d’autres personnes/);
    expect(day(15).safetyNote.en).toMatch(/If you have abused someone yourself/);
  });

  it('turns the Shepherd movement toward Jesus', () => {
    for (let n = 6; n <= 10; n += 1) {
      expect(day(n).movement).toBe('shepherd');
      expect(day(n).reflection.en, `day ${n}`).toMatch(/\bJesus\b/);
      expect(day(n).reflection.fr, `day ${n}`).toMatch(/\bJésus\b/);
    }
    expect(day(6).ref).toBe('John 10:1-15');
    expect(day(21).reflection.en).toMatch(/Lamb/);
  });

  it('keeps deliverance material off this shelf', () => {
    expect(plan.resourceDomains).toEqual(['care']);
    const deliverance = ['deliverance', 'spiritual-warfare', 'renunciation', 'curses', 'strongholds', 'occult', 'covenants', 'altars', 'generational-patterns'];
    for (const [i, d] of plan.days.entries()) {
      for (const topic of d.resourceTopics) expect(deliverance, `day ${i + 1}`).not.toContain(topic);
    }
  });
});
