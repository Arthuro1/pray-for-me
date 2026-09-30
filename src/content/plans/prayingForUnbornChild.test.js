import { describe, it, expect } from 'vitest';
import { PRAYING_FOR_UNBORN_CHILD as plan } from './prayingForUnbornChild';
import { runNewPlanContract, expectNoProseMatching } from './testing/newPlanContract';
import { resolveResources, availableResourceLanguages } from '../../lib/resources';
import { RESOURCES } from '../resources/catalogue';

runNewPlanContract(plan, {
  id: 'unborn21', count: 21, category: 'relationships', mode: 'prayer',
  domains: ['relationships'], movements: ['known', 'care', 'future', 'trust'],
});

const day = (n) => plan.days[n - 1];
const daysWhere = (test) => plan.days.flatMap((d, i) => (test(d) ? [i + 1] : []));
const refsOf = (d) => [d.ref, ...(d.related || [])];

describe('unborn21 guardrails', () => {
  it('never promises a healthy pregnancy, a safe birth or any particular outcome', () => {
    expectNoProseMatching(plan, [
      /(?<!not |not a |never |n't |no )\bguarantees? (?:that|a|the|your|this|every|each|safe|healthy)\b/i,
      /(?<!not |never |n't )\bpromises? (?:you|a healthy|a safe|a live|that (?:your|the|this) (?:baby|child|pregnancy|birth))\b/i,
      /\bwill (?:surely |certainly |definitely |always )?(?:be born (?:healthy|safely|well)|have a healthy|carry to term|go smoothly|end well|turn out (?:well|fine))\b/i,
      /\bGod (?:will|promises to) (?:heal|protect|keep|save|give you) (?:your|the|this|every|each)\b/i,
      /\b(?:if|when|as long as) you (?:pray|believe|have faith)\b[^.]*\bwill (?:be|have|go|carry|end)\b/i,
      /\b(?:claim|declare|decree) (?:a|your|this) (?:healthy|safe|perfect|full-term)\b/i,
      /(?<!ne |n['’]|non l['’]|pas )\bgarantit (?:que|une|un|la|le)\b/i,
      /\bte promet (?:que|un|une)\b/i,
      /\bDieu (?:va|te promet de|promet de) (?:guérir|protéger|garder|sauver|te donner)\b/i,
      /\bnaîtra (?:en bonne santé|sans problème|à terme)\b/i,
      /\btout se passera bien\b/i,
      /\b(?:proclame|déclare|décrète) (?:un|une|la|ta) (?:naissance|grossesse|accouchement)\b/i,
    ]);
    for (const lang of ['en', 'fr']) {
      expect(plan.intro[lang], lang).toMatch(lang === 'en'
        ? /does not promise a healthy pregnancy or a particular birth outcome/
        : /ne promet ni une grossesse sans complication ni une issue particulière/);
    }
  });

  it('never blames a loss or a complication on faith, sin or the parents', () => {
    expectNoProseMatching(plan, [
      /\b(?:lack of|weak|little|insufficient|not enough) faith (?:caused|causes|led to|leads to)\b/i,
      /\bbecause (?:you|she|they|the mother|the parents) (?:did not|didn't|does not|doesn't) (?:pray|believe|have (?:enough )?faith)\b/i,
      /\b(?:loss|miscarriage|stillbirth|complications?) (?:is|are|was|were) (?:a |God's )?(?:punishment|judgement|judgment|curse)\b/i,
      /\b(?:it is|it's|it was) your fault\b/i,
      /\bbecause of (?:your|her|their|the parents') sins?\b/i,
      /\bcurse (?:on|over) (?:the|your|this) (?:womb|pregnancy|child|baby)\b/i,
      /\bc['’]est (?:de )?ta faute\b/i,
      /\bparce que tu n['’]as pas (?:assez )?(?:prié|cru|eu la foi)\b/i,
      /\bmanque de foi (?:a |aurait )?(?:causé|provoqué|entraîné)\b/i,
      /\b(?:punition|châtiment|malédiction) (?:de Dieu|divine?|sur (?:le|ton|cet) (?:ventre|enfant|bébé))\b/i,
    ]);
    expect(day(16).safetyNote.en).toMatch(/it is not your fault and it is not a failure of faith/);
    expect(day(16).safetyNote.fr).toMatch(/ce n'est pas ta faute et ce n'est pas un échec de ta foi/);
    expect(plan.intro.en).toMatch(/that is not a failure of faith/);
    expect(plan.intro.fr).toMatch(/pas un échec de ta foi/);
    expect(day(19).reflection.en).toMatch(/no way of giving birth is a spiritual failure/);
    expect(day(19).reflection.fr).toMatch(/aucune manière d'accoucher n'est un échec spirituel/);
    expect(day(20).reflection.en).toMatch(/none of these is a sign of weak faith/);
  });

  it('keeps prayer alongside medical care, never instead of it', () => {
    expectNoProseMatching(plan, [
      /\b(?:instead of|no need (?:for|to see)|without (?:seeing|asking)) (?:a |the |your )?(?:doctor|midwife|medical|hospital|medicine|appointments?|care)\b/i,
      /\b(?:skip|cancel|stop|miss) (?:the |your |an? )?(?:appointments?|medication|treatment|scans?|check-ups?)\b/i,
      /\bprayer (?:replaces|is enough without|instead of)\b/i,
      /\bau lieu (?:de consulter|du médecin|de la sage-femme|des soins|du suivi)\b/i,
      /\bpas besoin (?:de|d['’]un) (?:médecin|sage-femme|soins|suivi)\b/i,
      /\b(?:annule|saute|manque) (?:le|les|ton|tes) (?:rendez-vous|traitements?|échographies?)\b/i,
    ]);
    expect(plan.intro.en).toMatch(/Prayer goes hand in hand with prenatal and medical care/);
    expect(plan.intro.en).toMatch(/keep every appointment/);
    expect(plan.intro.fr).toMatch(/va de pair avec le suivi prénatal et les soins médicaux/);
    expect(plan.intro.fr).toMatch(/honore chaque rendez-vous/);
    expect(day(1).safetyNote.en).toMatch(/Prayer and medical care belong together/);
    expect(day(6).prompts[1].en).toMatch(/midwife or doctor/);
    expect(day(10).practice.en).toMatch(/Keep every appointment/);
    expect(day(10).selfPrompt.en).toMatch(/seeking medical help shows weak faith/);
  });

  it('carries a safety note on the symptom, abuse, loss and after-birth days, and only there', () => {
    expect(daysWhere((d) => d.safetyNote)).toEqual([1, 8, 16, 20]);

    const symptoms = day(1).safetyNote;
    for (const re of [/bleeding/, /severe pain/, /reduced baby movements/, /midwife or doctor now/, /emergency services/]) {
      expect(symptoms.en).toMatch(re);
    }
    for (const re of [/saignements/, /mouvements du bébé/, /sage-femme ou ton médecin maintenant/, /secours/]) {
      expect(symptoms.fr).toMatch(re);
    }

    const abuse = day(8).safetyNote;
    for (const re of [/hurting, threatening or controlling/, /in confidence/, /domestic abuse helpline/, /emergency services/]) {
      expect(abuse.en).toMatch(re);
    }
    for (const re of [/confidentialité/, /violences conjugales/, /secours/]) expect(abuse.fr).toMatch(re);

    const loss = day(16).safetyNote;
    for (const re of [/lost a pregnancy before/, /ends in loss/, /pastor/, /bereavement support/, /midwife or doctor/]) {
      expect(loss.en).toMatch(re);
    }
    for (const re of [/deuil périnatal/, /pasteur/, /sage-femme ou ton médecin/]) expect(loss.fr).toMatch(re);

    const afterBirth = day(20).safetyNote;
    for (const re of [/Low mood, anxiety/, /after a birth or after a loss/, /not a failure of faith/, /thoughts of harming yourself or your baby/, /emergency services immediately/]) {
      expect(afterBirth.en).toMatch(re);
    }
    for (const re of [/déprime, l'anxiété/, /te faire du mal ou de faire du mal à ton bébé/, /immédiatement/, /secours/]) {
      expect(afterBirth.fr).toMatch(re);
    }

    // Calm, not alarmist.
    expectNoProseMatching(plan, [/\b(?:danger(?:ous)? sign|you must act now|could die|deadly|fatal)\b/i, /\b(?:mortel|tu pourrais mourir)\b/i]);
  });

  it('reads Jeremiah 1:5 as Jeremiah’s own calling, never a destiny promised to every child', () => {
    expect(daysWhere((d) => refsOf(d).some((r) => r.startsWith('Jeremiah')))).toEqual([11]);
    expect(day(11).ref).toBe('Jeremiah 1:4-5');
    expect(day(11).reflection.en).toMatch(/That appointment was Jeremiah's own calling, not a promise that every child will be a prophet or have a particular destiny/);
    expect(day(11).reflection.fr).toMatch(/Cette mission était la vocation propre de Jérémie : ce n'est pas une promesse que chaque enfant sera prophète/);
    expect(plan.biblical.ref.startsWith('Jeremiah')).toBe(false);
    expectNoProseMatching(plan, [
      /\b(?:every|each|your|this) (?:child|baby) (?:is|has been|will be) (?:called|appointed|set apart|destined) (?:to be |as )?(?:a )?(?:prophet|to the nations|for greatness)\b/i,
      /\bGod has (?:a|the same) (?:destiny|calling) (?:for|over) (?:every|each|your) (?:child|baby)\b/i,
      /\b(?:chaque|ton|cet) (?:enfant|bébé) (?:est|sera) (?:appelé|destiné|mis à part) (?:à être |comme )?prophète\b/i,
    ]);
  });

  it('reads Luke 1, Hannah, Psalm 121 and Romans 8:28 in context, as narrative or trust — never as a template or guarantee', () => {
    expect(day(4).reflection.en).toMatch(/not a pattern every pregnancy must reproduce/);
    expect(day(4).reflection.fr).toMatch(/n'est pas un modèle à reproduire dans chaque grossesse/);
    expect(day(16).related).toContain('1 Samuel 1:15-18');
    expect(day(16).reflection.en).toMatch(/still not knowing what would happen/);
    expect(day(16).reflection.en).toMatch(/does not say that prayer secures the outcome we want/);
    expect(day(18).ref).toBe('Psalm 121');
    expect(day(18).reflection.en).toMatch(/a song of trust, not a guarantee that nothing hard will ever happen/);
    expect(day(18).reflection.fr).toMatch(/non l'assurance que rien de difficile n'arrivera jamais/);
    expect(day(21).related).toContain('Romans 8:26-28');
    expect(day(21).reflection.en).toMatch(/often quoted as if it promised that everything will turn out as we hope/);
    expect(day(21).reflection.en).toMatch(/being shaped into the likeness of Christ/);
    expect(day(2).reflection.en).toMatch(/not a fertility guarantee/);
  });

  it('completes well whatever the stage or the outcome, and never assumes a live birth', () => {
    const { en, fr } = plan.completion;
    for (const re of [/still waiting/, /have welcomed a baby/, /grieving a loss/, /never depended on how things turned out/, /do not oblige Him/]) {
      expect(en).toMatch(re);
    }
    for (const re of [/encore dans l'attente/, /accueilli un bébé/, /deuil d'une perte/, /n'a jamais dépendu de l'issue/]) {
      expect(fr).toMatch(re);
    }
    for (const re of [
      /\bcongratulations\b/i, /\bnew arrival\b/i, /\bnewborn\b/i,
      /\b(?:now that|since) (?:your|the) (?:baby|child) (?:is|has been|was) (?:born|here|home)\b/i,
      /\byour (?:baby|child) (?:is|has been) born\b/i,
    ]) expect(en).not.toMatch(re);
    for (const re of [/\bfélicitations\b/i, /\bnouveau-né\b/i, /\bmaintenant que (?:ton|le|votre) (?:bébé|enfant)\b/i, /\bton bébé est né\b/i]) {
      expect(fr).not.toMatch(re);
    }
    // The after-birth day also holds after a loss.
    expect(day(20).reflection.en).toMatch(/the same is true after a loss/);
    expect(day(20).reflection.fr).toMatch(/il en va de même après une perte/);
  });

  it('is written for everyone who prays for the child, not only the parents', () => {
    expect(plan.lifeStage).toBeUndefined();
    for (const re of [/Mothers, fathers/, /adoptive or foster parents-to-be/, /grandparents/, /friends/, /where a prompt names the mother and you are she, pray it for yourself/]) {
      expect(plan.intro.en).toMatch(re);
    }
    for (const re of [/Mères, pères/, /parents adoptifs ou d'accueil/, /grands-parents/, /amis/]) expect(plan.intro.fr).toMatch(re);
    expect(day(7).prompts[2].en).toMatch(/If the father is absent or unsafe/);
  });

  it('mirrors every day back on the one who prays', () => {
    for (const [i, d] of plan.days.entries()) {
      for (const lang of ['en', 'fr']) {
        expect(d.selfPrompt?.[lang]?.length, `day ${i + 1} selfPrompt ${lang}`).toBeGreaterThan(30);
        expect(d.practice?.[lang]?.length, `day ${i + 1} practice ${lang}`).toBeGreaterThan(30);
      }
      expect(d.prompts, `day ${i + 1}`).toHaveLength(3);
    }
  });

  // The relationships domain is mostly couples' and dating material. Broad tags
  // (parenting, family, prayer, trust, character, community, church, grief,
  // suffering, illness, abuse-safety…) pull those books onto this shelf, so the
  // days stay on pregnancy/children plus tags that pull nothing adult, and the
  // sensitive tags are confined to the one day each is about.
  //
  // Days 16, 20 and 21 may be read after a loss, so they anchor on loss,
  // postpartum care or entrusting instead: a pregnancy devotional or a
  // parenting book must not be what greets a grieving reader there.
  it('keeps the shelf about pregnancy and children, never couples’ or dating books', () => {
    const LOSS_AWARE_DAYS = [16, 20, 21];
    const CORE_TOPICS = ['pregnancy', 'children'];
    const LOSS_AWARE_TOPICS = ['miscarriage', 'mental-health', 'intercession'];
    const CHILD_TOPICS = ['pregnancy', 'children', 'parenting', 'family-discipleship', 'miscarriage', 'infertility', 'mental-health'];
    const ADULT_TOPICS = ['marriage', 'dating', 'singleness', 'premarital', 'future-spouse', 'sexual-intimacy', 'sexuality', 'purity', 'marriage-crisis', 'marriage-roles', 'infidelity', 'divorce', 'covenant', 'friendship'];
    // A book may carry `sexuality` when it is about raising children (the
    // German "Sexualerziehung ist Familiensache" parenting title); on a shelf
    // row only the couples' and dating tags disqualify.
    const ADULT_ROW_TOPICS = ADULT_TOPICS.filter((t) => t !== 'sexuality');
    const ADULT_STAGES = ['single', 'dating', 'engaged'];
    const languages = availableResourceLanguages();
    for (const [i, d] of plan.days.entries()) {
      if (LOSS_AWARE_DAYS.includes(i + 1)) {
        expect(d.resourceTopics.some((t) => LOSS_AWARE_TOPICS.includes(t)), `day ${i + 1}`).toBe(true);
        expect(d.resourceTopics.filter((t) => CORE_TOPICS.includes(t)), `day ${i + 1}`).toEqual([]);
      } else {
        expect(d.resourceTopics.some((t) => CORE_TOPICS.includes(t)), `day ${i + 1}`).toBe(true);
      }
      expect(d.resourceTopics.filter((t) => ADULT_TOPICS.includes(t)), `day ${i + 1}`).toEqual([]);
      const shelf = resolveResources({ topics: d.resourceTopics, domains: plan.resourceDomains, languages });
      for (const row of shelf) {
        const entry = RESOURCES.find((r) => r.id === row.id);
        expect(row.topics.some((t) => CHILD_TOPICS.includes(t)), `${row.id} on day ${i + 1}`).toBe(true);
        expect(row.topics.filter((t) => ADULT_ROW_TOPICS.includes(t)), `${row.id} on day ${i + 1}`).toEqual([]);
        expect((entry.lifeStages || []).filter((s) => ADULT_STAGES.includes(s)), `${row.id} on day ${i + 1}`).toEqual([]);
      }
    }
    expect(daysWhere((d) => d.resourceTopics.includes('miscarriage'))).toEqual([16]);
    expect(daysWhere((d) => d.resourceTopics.includes('mental-health'))).toEqual([20]);
    // The loss-aware days serve a reader who may be grieving: no parenting shelf.
    for (const n of [16, 20, 21]) expect(day(n).resourceTopics, `day ${n}`).not.toContain('children');
    for (const tag of ['illness', 'grief', 'infertility', 'abuse-safety', 'parenting', 'family', 'prayer', 'trust']) {
      expect(daysWhere((d) => d.resourceTopics.includes(tag)), tag).toEqual([]);
    }
  });

  it('opens with God who knows the child and closes on the love of Christ', () => {
    expect(day(1).ref).toBe('Psalm 139:13-18');
    expect(plan.biblical.ref).toBe('Psalm 139:13-16');
    expect(day(1).reflection.en).toMatch(/not a forecast of how a pregnancy will unfold/);
    expect(day(21).ref).toBe('Romans 8:31-39');
    expect(day(21).reflection.en).toMatch(/love in Christ Jesus/);
    expect(day(21).reflection.fr).toMatch(/amour en Jésus-Christ/);
  });

  it('keeps every passage the plan spec asks for', () => {
    const refs = plan.days.flatMap(refsOf);
    for (const ref of [
      'Psalm 139:13-18', 'Psalm 22:9-10', 'Psalm 121', 'Psalm 127', 'Luke 1:39-45', 'James 1:5',
      'Philippians 4:6-7', 'Isaiah 40:11', 'Jeremiah 1:4-5', 'Isaiah 49:13-16', 'Psalm 71:5-9',
      'Genesis 1:26-28', '1 Samuel 1:15-18', 'Matthew 6:25-34', 'Romans 8:26-28',
    ]) expect(refs, ref).toContain(ref);
  });

  it('never speaks for God, even softly', () => {
    expectNoProseMatching(plan, [
      /\bGod wants you to know\b/i,
      /\bthe Lord (?:is saying|says to you)\b/i,
      /\bDieu veut que tu saches\b/i,
      /\ble Seigneur (?:te dit|dit à toi)\b/i,
    ]);
  });
});
