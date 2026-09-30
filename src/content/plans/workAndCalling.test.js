import { describe, it, expect } from 'vitest';
import { WORK_AND_CALLING as plan } from './workAndCalling';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: 'work21',
  count: 21,
  category: 'formation',
  mode: 'prayer',
  domains: ['christian-living'],
  movements: ['stewardship', 'character', 'calling', 'rest'],
});

const day = (n) => plan.days[n - 1];
const dayText = (n, lang) => {
  const d = day(n);
  return [d.reflection, ...d.prompts, d.selfPrompt, d.practice, d.safetyNote]
    .filter(Boolean)
    .map((v) => v[lang])
    .join(' ');
};
const allText = (lang) => proseOf(plan).filter((r) => r.lang === lang).map((r) => r.text).join(' ');

describe('work21 guardrails', () => {
  it('never promises wealth, success or a reward for giving', () => {
    expectNoProseMatching(plan, [
      /\bguarantees? (?:that|you|wealth|success|prosperity|a (?:job|promotion) for)\b/i,
      /\bGod will (?:surely |certainly |always )?(?:bless|prosper|reward|repay|multiply|promote|enrich)\b/i,
      /\bwill (?:make you|become) (?:rich|wealthy|prosperous|successful)\b/i,
      /\b(?:sow|plant) (?:a |your )?(?:seed|financial seed)\b/i,
      /\b(?:hundredfold|financial breakthrough|debt cancellation)\b/i,
      /\bgive (?:so that|in order that|to) (?:you )?(?:receive|get) (?:more|back)\b/i,
      // "Rien ici ne garantit…" is the plan's own negation, so skip "ne garantit".
      /(?<!\bne )\bgarantit (?:que|ta|ton|tes|la|le|une|un)\b/i,
      /\bDieu (?:va|te) (?:forcément |sûrement |certainement )?(?:bénir|faire prospérer|rendre riche|récompenser)\b/i,
      /\bte (?:fera|rendra) (?:prospérer|riche|réussir)\b/i,
      /\bsème (?:une |ta )?(?:semence|graine)\b/i,
      /\bau centuple\b/i,
    ]);
  });

  it('says plainly that diligence and generosity are not formulas', () => {
    expect(day(4).reflection.en).toMatch(/does not guarantee results/i);
    expect(day(4).reflection.en).toMatch(/not a formula/i);
    expect(day(4).reflection.fr).toMatch(/ne garantissent pas de résultat/i);
    expect(day(7).reflection.en).toMatch(/not a promise of wealth/i);
    expect(day(17).reflection.en).toMatch(/not a seed that obliges God/i);
    expect(day(17).reflection.fr).toMatch(/n'est pas une semence qui obligerait Dieu/i);
    expect(plan.intro.en).toMatch(/does not promise success, wealth or a new job/i);
    expect(plan.intro.fr).toMatch(/ne te promet ni réussite, ni richesse, ni nouvel emploi/i);
    expect(plan.completion.en).toMatch(/Nothing here guarantees/i);
  });

  it('never teaches one secret career the reader could miss', () => {
    expectNoProseMatching(plan, [
      /\bGod has (?:a|one) (?:single |specific |perfect |secret |hidden )?(?:career|job|profession) (?:for you|in mind)\b/i,
      /\byour (?:true|perfect|secret|destined) (?:career|job|profession)\b/i,
      /\b(?:your|a) (?:divine assignment|destiny)\b/i,
      /\bout of God's will (?:for|in) your (?:career|job)\b/i,
      /\bDieu a (?:un|le) (?:métier|emploi|poste) (?:parfait|secret|caché) pour toi\b/i,
      /\bton (?:vrai|parfait) métier\b/i,
    ]);
    expect(day(11).reflection.en).toMatch(/first calling is to belong to Jesus, not to find a single hidden career/i);
    expect(day(11).reflection.fr).toMatch(/non de trouver un unique métier caché/i);
    expect(plan.intro.en).toMatch(/will not uncover one hidden career/i);
  });

  it('does not rank ministry above other work', () => {
    expect(day(11).reflection.en).toMatch(/Neither path is holier/);
    expect(day(11).prompts.map((p) => p.en).join(' ')).toMatch(/more or less holy/);
    expect(day(11).reflection.fr).toMatch(/Aucun de ces chemins n'est plus saint/);
  });

  it('never ties unemployment, poverty or limits to shame or God’s disfavour', () => {
    expectNoProseMatching(plan, [
      /\b(?:unemployment|poverty|being without work|losing (?:your )?(?:work|job)) (?:is|means) (?:a )?(?:sign of |proof of )?(?:sin|a curse|curse|punishment|judg(?:e)?ment|laziness|failure)\b/i,
      /\bif you (?:just )?worked harder\b/i,
      /\bGod is (?:punishing|disciplining) you (?:with|through) (?:unemployment|poverty)\b/i,
      /\b(?:le chômage|la pauvreté|être sans travail) (?:est|signifie) (?:une )?(?:malédiction|punition|jugement|paresse|échec)\b/i,
    ]);
    expect(day(14).reflection.en).toMatch(/not a sign of God's disfavour, nor a measure of your worth/);
    expect(day(14).reflection.fr).toMatch(/pas un signe de la défaveur de Dieu/);
    expect(day(16).reflection.en).toMatch(/illness or disability, they are not failure/);
    expect(day(16).prompts.map((p) => p.en).join(' ')).toMatch(/free of shame/);
  });

  it('never praises hustle or makes rest a matter of guilt', () => {
    expectNoProseMatching(plan, [
      /\bhustle\b/i,
      /\brise and grind\b/i,
      /\brest is (?:lazy|laziness|selfish|a waste|for the weak)\b/i,
      /\ble repos est (?:de la paresse|égoïste|une perte de temps)\b/i,
    ]);
    expect(day(19).prompts[0].en).toMatch(/treated rest as laziness/);
    expect(day(20).reflection.en).toMatch(/a gift of freedom, not a burden of guilt/);
    expect(day(20).reflection.fr).toMatch(/un don de liberté, non un fardeau de culpabilité/);
  });

  it('handles the slavery texts with care, beside the commands to masters', () => {
    const d3 = day(3);
    expect(d3.ref).toBe('Colossians 3:22-25');
    expect(d3.related).toEqual(expect.arrayContaining(['Colossians 4:1', 'Ephesians 6:5-9', 'James 5:4']));
    expect(d3.reflection.en).toMatch(/enslaved people in Roman households/);
    expect(d3.reflection.en).toMatch(/do not endorse slavery/);
    expect(d3.reflection.fr).toMatch(/ne cautionnent pas l'esclavage/);
    expect(d3.safetyNote.en).toMatch(/misused to defend slavery/);
    expect(d3.safetyNote.en).toMatch(/forced labour/);
    expect(d3.safetyNote.en).toMatch(/police|helpline/);
    expect(d3.safetyNote.fr).toMatch(/travail forcé/);
  });

  it('never lets submission to authority require sin or enduring abuse', () => {
    const d10 = day(10);
    expect(d10.reflection.en).toMatch(/never to obey an order that requires sin/);
    expect(d10.reflection.fr).toMatch(/jamais d'obéir à un ordre qui exige de pécher/);
    expect(d10.safetyNote.en).toMatch(/never means enduring abuse or joining in wrongdoing/);
    for (const re of [/Harassment/, /reported/, /HR/, /union/, /police/, /emergency services/]) {
      expect(d10.safetyNote.en).toMatch(re);
    }
    expect(d10.safetyNote.fr).toMatch(/ne signifie jamais subir des abus/);
    expect(d10.safetyNote.fr).toMatch(/signalés/);
    expectNoProseMatching(plan, [
      /\b(?:endure|submit to|put up with) (?:the )?(?:abuse|harassment|mistreatment)\b(?! in silence)/i,
      /\bstay (?:silent|quiet) (?:about|under) (?:abuse|harassment)\b/i,
      /\bsupporte(?:r)? (?:les )?(?:abus|harcèlement)\b/i,
    ]);
  });

  it('carries a safety note exactly on the days that need one, each pointing to real help', () => {
    const withNotes = plan.days.map((d, i) => (d.safetyNote ? i + 1 : null)).filter(Boolean);
    expect(withNotes).toEqual([3, 10, 14, 19]);
    for (const n of withNotes) {
      for (const lang of ['en', 'fr']) expect(day(n).safetyNote[lang].length, `day ${n} ${lang}`).toBeGreaterThan(60);
    }
    expect(day(14).safetyNote.en).toMatch(/pastor/);
    expect(day(14).safetyNote.en).toMatch(/debt advice/);
    expect(day(14).safetyNote.en).toMatch(/crisis line or emergency services/);
    expect(day(19).safetyNote.en).toMatch(/doctor/);
    expect(day(19).safetyNote.en).toMatch(/not a lack of faith/);
  });

  it('speaks to every reader, not only the salaried', () => {
    expectNoProseMatching(plan, [
      /\byour (?:boss|salary|paycheck|pay ?slip|employer|office)\b/i,
      /\bton (?:patron|employeur|bureau)\b/i,
    ]);
    const en = allText('en');
    for (const re of [/paid or unpaid/i, /stud(?:y|ies)/i, /retire/i, /carers?/i, /parents? at home/i, /looking for work|without work/i, /ministry/i]) {
      expect(en).toMatch(re);
    }
  });

  it('witnesses without pressure', () => {
    expect(day(18).reflection.en).toMatch(/never forced/);
    expect(day(18).practice.en).toMatch(/never use your position to press anyone about faith/);
    expect(day(18).practice.fr).toMatch(/n'utilise jamais ta position pour faire pression/);
  });

  it('begins with work in God’s design and ends by following Christ', () => {
    expect(day(1).ref).toBe('Genesis 1:26-31');
    expect(day(1).reflection.en).toMatch(/Jesus Himself/);
    expect(dayText(21, 'en')).toMatch(/called once more to follow/);
    expect(dayText(21, 'fr')).toMatch(/appelé de nouveau à suivre/);
    expect(plan.completion.en).toMatch(/follow Him/);
  });

  it('keeps French devotional prose in the familiar "tu"', () => {
    expectNoProseMatching(plan, [/\b(?:vous|votre|vos)\b/i], ['fr']);
  });
});
