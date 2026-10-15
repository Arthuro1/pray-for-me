import { describe, expect, it } from 'vitest';
import {
  checkClaims, checkOverlayRepetition, checkOverlayStructure, checkPrayerStyle, checkScriptureReferences,
  checkTerminology, checkTheologyProfile, checkTranslatedRows, kindOf, localeRows, locationOf,
} from './planChecks';
import { PLAN_RULE_LOCALES, glossaryFor, planRulesFor } from './planQualityData';
import { PATTERN_CODES } from '../lib/planQuality';
import { theologyProfile } from '../content/theologyProfiles';
import { LANG_CODES } from '../i18n';
import { glossaryProfileErrors } from '../../scripts/content-quality/checks.mjs';
import contentRules from './content-rules.json';

const row = (text, extra = {}) => ({ key: 'days[0].reflection', location: 'day-1.reflection', kind: 'prose', day: 0, text, source: 'English source text for this row.', fromOverlay: true, ...extra });
const codes = (findings) => findings.map((f) => f.code);
const claim = (lang, text, kind = 'prose') => checkClaims([row(text, { kind })], planRulesFor(lang));

const day = (n) => ({
  theme: { en: `Day ${n}`, fr: `Jour ${n}` },
  ref: 'Psalm 23:1-3',
  reflection: { en: `The Lord is a shepherd who leads, day ${n}.`, fr: `Le Seigneur est un berger qui conduit, jour ${n}.` },
  prompts: [{ en: 'Lord, lead me today.', fr: 'Seigneur, conduis-moi aujourd’hui.' }, { en: 'Father, thank you for {partner}.', fr: 'Père, merci pour {partner}.' }],
});
const plan = { id: 'checksTest', theologyProfile: theologyProfile(), days: [1, 2, 3, 4, 5, 6].map(day) };

describe('locale rows', () => {
  it('names and classifies every localized field', () => {
    expect(locationOf('days[3].prompts[1]')).toBe('day-4.prompts[1]');
    expect(locationOf('biblical.text')).toBe('biblical');
    expect(kindOf('days[0].discernment.prayer')).toBe('prayer');
    expect(kindOf('days[0].prompts[2]')).toBe('prompt');
    expect(kindOf('days[0].selfPrompt')).toBe('question');
    expect(kindOf('days[0].theme')).toBe('title');
  });

  it('reads an overlay for a translated locale and the authored text for a source one', () => {
    const overlay = { days: [{ reflection: 'Der Herr ist ein Hirte.' }] };
    const de = localeRows(plan, 'de', overlay);
    expect(de.map((r) => r.location)).toEqual(['day-1.reflection']);
    expect(de[0].fromOverlay).toBe(true);
    expect(localeRows(plan, 'fr').find((r) => r.location === 'day-1.reflection').text).toMatch(/berger/);
  });
});

describe('translation integrity', () => {
  const good = { days: plan.days.map(() => ({ reflection: 'x', prompts: ['a', 'b'] })) };

  it('accepts an overlay with the authored structure', () => {
    expect(checkOverlayStructure(plan, good)).toEqual([]);
  });

  it('rejects wrong counts, unknown fields, structural fields and malformed values', () => {
    expect(codes(checkOverlayStructure(plan, { days: good.days.slice(1) }))).toContain('OVERLAY_DAY_COUNT');
    expect(codes(checkOverlayStructure(plan, { days: [{ prompts: ['only one'] }, ...good.days.slice(1)] }))).toContain('OVERLAY_PROMPT_COUNT');
    expect(codes(checkOverlayStructure(plan, { days: [{ blessing: 'x' }, ...good.days.slice(1)] }))).toContain('OVERLAY_UNKNOWN_FIELD');
    expect(codes(checkOverlayStructure(plan, { days: [{ ref: 'John 3:16' }, ...good.days.slice(1)] }))).toContain('OVERLAY_STRUCTURAL_FIELD');
    expect(codes(checkOverlayStructure(plan, { days: [{ practice: 'x' }, ...good.days.slice(1)] }))).toContain('OVERLAY_FIELD_NOT_IN_SOURCE');
    expect(codes(checkOverlayStructure(plan, { days: [{ reflection: 3 }, ...good.days.slice(1)] }))).toContain('OVERLAY_MALFORMED');
    expect(codes(checkOverlayStructure(plan, { ...good, title: 'x' }))).toContain('OVERLAY_UNKNOWN_FIELD');
  });

  it('keeps Scripture in the source: no invented passage ranges', () => {
    expect(codes(checkScriptureReferences(plan, { days: [{ reflection: 'Lies Johannes 3:16-18.' }] }))).toEqual(['SCRIPTURE_REFERENCE_INVENTED']);
    expect(checkScriptureReferences(plan, good)).toEqual([]);
  });

  it('flags placeholders, untranslated English and pasted quotations', () => {
    const source = 'Father, thank you for {partner} and for this day together.';
    expect(codes(checkTranslatedRows([row('Vater, danke für diesen Tag.', { source })], 'de'))).toContain('PLACEHOLDER_MISMATCH');
    expect(codes(checkTranslatedRows([row(source, { source })], 'de'))).toContain('UNTRANSLATED_COPY');
    const quoted = 'Lies dies: „Der Herr ist mein Hirte, mir wird nichts mangeln. Er weidet mich auf einer grünen Aue.“';
    expect(codes(checkTranslatedRows([row(quoted)], 'de'))).toContain('SCRIPTURE_TEXT_SUSPECTED');
  });

  it('spots English left in a translation without rejecting shared words', () => {
    expect(codes(checkTranslatedRows([row('Bete heute: the Lord is with you and your family for the rest of this day.')], 'de'))).toContain('ENGLISH_FRAGMENT');
    expect(checkTranslatedRows([row('Jesus, Amen. Danke für deine Gnade und deine Treue.')], 'de')).toEqual([]);
    expect(checkTranslatedRows([row('Berdoalah dan bersyukurlah kepada Allah untuk hari ini.')], 'id')).toEqual([]);
  });

  it('spots the wrong script and machine-translation artifacts', () => {
    expect(codes(checkTranslatedRows([row('Господь — мой Shepherd, и я trust Ему.')], 'ru'))).toContain('MIXED_SCRIPT');
    expect(codes(checkTranslatedRows([row('在基督裡的自由')], 'zh', { contentRules }))).toContain('SCRIPT_MISMATCH');
    expect(codes(checkTranslatedRows([row('Bete [TODO] heute für deine Familie.')], 'de'))).toContain('MT_ARTIFACT');
    // Reduplication is grammatical in many languages: never an artifact.
    expect(checkTranslatedRows([row('Ni yale yale maneno ya Mungu.')], 'sw')).toEqual([]);
  });

  it('rejects one day pasted across the others and a templated frame', () => {
    const pasted = { days: plan.days.map(() => ({ reflection: 'Derselbe Text für jeden Tag.' })) };
    expect(codes(checkOverlayRepetition(plan, pasted))).toContain('WRONG_REPEAT');
    const framed = { days: plan.days.map((_, i) => ({ reflection: `Heute lenkt die Schrift unseren Blick auf Tag ${i + 1}, und wir beten gemeinsam weiter.` })) };
    expect(codes(checkOverlayRepetition(plan, framed))).toContain('TEMPLATE_FRAME');
  });
});

describe('Christian language', () => {
  it('flags a glossary avoid term at word boundaries only', () => {
    const de = { glossary: glossaryFor('de'), rules: planRulesFor('de') };
    expect(codes(checkTerminology([row('Teile deine Gebetsanfrage.')], de))).toContain('TERM_AVOIDED');
    expect(codes(checkTerminology([row('Die Gebetsanfragenliste ist leer.')], de))).not.toContain('TERM_AVOIDED');
  });

  it('flags competing renderings of one concept in one plan', () => {
    const fr = { glossary: glossaryFor('fr'), rules: planRulesFor('fr') };
    const drift = [row('Le Saint-Esprit nous guide.'), row('Demande à l’Esprit Saint sa paix.', { location: 'day-2.reflection' })];
    const found = checkTerminology(drift, fr).find((f) => f.code === 'TERM_INCONSISTENCY');
    expect(found.location).toBe('plan.holySpirit');
  });

  it('does not mistake grammatical variation for drift', () => {
    const de = { glossary: glossaryFor('de'), rules: planRulesFor('de') };
    expect(codes(checkTerminology([row('Umkehr ist ein Geschenk.'), row('Umkehren heißt vertrauen.')], de))).not.toContain('TERM_INCONSISTENCY');
    const ru = { glossary: glossaryFor('ru'), rules: planRulesFor('ru') };
    expect(codes(checkTerminology([row('Покаяние открывает путь.'), row('Плод покаяния — радость.')], ru))).not.toContain('TERM_INCONSISTENCY');
    expect(codes(checkTerminology([row('Покаяние открывает путь.'), row('Раскаяние приходит позже.')], ru))).toContain('TERM_INCONSISTENCY');
  });

  it('flags self-help vocabulary', () => {
    expect(codes(claim('en', 'Manifest your desires and the universe will answer.'))).toContain('SELF_HELP_LANGUAGE');
    expect(codes(claim('es', 'Sé la mejor versión de ti mismo.'))).toContain('SELF_HELP_LANGUAGE');
  });
});

describe('God claims: Scripture teaches, but the app never speaks for God', () => {
  it.each([
    ['en', 'God is telling you to marry her.'],
    ['fr', 'Dieu t’a dit que ce chemin est le bon.'],
    ['de', 'Gott hat dir gesagt, dass du gehen sollst.'],
    ['es', 'Dios te dijo que esperaras.'],
    ['pt', 'Deus te disse que esta é a pessoa.'],
    ['ru', 'Бог сказал тебе, что это твой путь.'],
    ['zh', '神已经告诉你要嫁给他。'],
    ['ko', '하나님께서 당신에게 말씀하셨습니다.'],
    ['sw', 'Mungu amekuambia uolewe naye.'],
  ])('%s: speaking for God is flagged and cannot be qualified away', (lang, text) => {
    const found = claim(lang, text).find((f) => f.code === 'GOD_SPEAKS_FOR_READER');
    expect(found, text).toBeTruthy();
    expect(found.negated).toBe(false);
  });

  it('allows what Scripture teaches and what we hope or pray', () => {
    expect(claim('en', 'Scripture teaches that God is faithful to his promises.')).toEqual([]);
    expect(claim('en', 'We pray that God will heal you, and we trust him with the outcome.')[0]).toMatchObject({ code: 'GUARANTEED_HEALING', qualified: true });
    expect(claim('fr', 'Prie pour que Dieu te guérisse, selon sa volonté.').every((f) => f.qualified || f.negated)).toBe(true);
  });

  it('flags unqualified certainty', () => {
    expect(claim('en', 'God has already chosen your future spouse.')[0]).toMatchObject({ code: 'CERTAINTY_CLAIM', qualified: false });
    expect(claim('en', 'If you pray correctly, God will answer.')[0].code).toBe('PRAYER_TECHNIQUE');
    expect(claim('en', 'This suffering happened because you needed a lesson.')[0].code).toBe('CERTAINTY_CLAIM');
  });

  it('reads a denial as a safeguard, not a claim', () => {
    expect(claim('en', 'This plan never claims that God is telling you whom to marry.')[0]).toMatchObject({ code: 'GOD_SPEAKS_FOR_READER', negated: true });
    expect(claim('sw', 'Neno linalorudiwa havitoshi kuthibitisha kwamba Mungu anakuambia ufunge ndoa.')[0]).toMatchObject({ negated: true });
  });

  it('ignores Scripture inside quotation marks', () => {
    expect(claim('en', 'Jesus said, “Go; your faith has made you well.”')).toEqual([]);
  });
});

describe('pastoral safety', () => {
  it.each([
    ['GUARANTEED_HEALING', 'God will surely heal you this year.'],
    ['GUARANTEED_MARRIAGE', 'God will bring you a husband.'],
    ['PROSPERITY_PROMISE', 'Sow a seed and receive a harvest of money.'],
    ['FAITH_DEFICIT_BLAME', 'You were not healed because of your lack of faith.'],
    ['SUFFERING_BLAME', 'Your infertility is a punishment of hidden sin.'],
    ['SHAME_LANGUAGE', 'After that, you are damaged goods.'],
    ['ABUSE_ENDANGERMENT', 'Stay with your abusive husband and pray harder.'],
    ['CARE_REPLACEMENT', 'Stop taking your medication and trust God.'],
    ['COERCIVE_CONFRONTATION', 'Rebuke him until he repents.'],
    ['SPIRITUAL_MANIPULATION', 'Your blessing depends on how much you give.'],
  ])('flags %s', (code, text) => {
    const found = claim('en', text).find((f) => f.code === code);
    expect(found, text).toBeTruthy();
    expect(found.negated).toBe(false);
  });

  it('keeps the existing safeguards readable as safeguards', () => {
    expect(claim('en', 'Those steps never require anyone to confront an abuser alone.')[0]).toMatchObject({ code: 'ABUSE_ENDANGERMENT', negated: true });
    expect(claim('en', 'Prayer goes with medical care: do not stop taking your medication.')[0]).toMatchObject({ code: 'CARE_REPLACEMENT', negated: true });
    expect(claim('fr', 'Accomplis un acte caché et n’en parle à personne (Matthieu 6).')).toEqual([]);
  });

  it.each([
    ['de', 'GUARANTEED_HEALING', 'Gott wird dich ganz sicher heilen.'],
    ['es', 'GUARANTEED_MARRIAGE', 'Dios te va a dar un esposo.'],
    ['pt', 'CARE_REPLACEMENT', 'Você não precisa de médico, só de fé.'],
    ['ru', 'SUFFERING_BLAME', 'Бог наказывает тебя за это.'],
    ['ja', 'FAITH_DEFICIT_BLAME', '信仰が足りないから癒やされないのです。'],
    ['ar', 'ABUSE_ENDANGERMENT', 'لا تبلغ الشرطة عن زوجك.'],
    ['id', 'PROSPERITY_PROMISE', 'Allah akan membuatmu kaya.'],
    ['tl', 'GUARANTEED_HEALING', 'Siguradong gagaling ka.'],
  ])('%s: flags %s', (lang, code, text) => {
    expect(claim(lang, text).map((f) => f.code), text).toContain(code);
  });
});

describe('prayer authenticity', () => {
  const style = (lang, text, kind = 'prayer') => codes(checkPrayerStyle([row(text, { kind, location: 'day-1.discernment.prayer' })], planRulesFor(lang)));

  it('flags a prayer that never addresses God', () => {
    expect(style('en', 'I will be calmer and more organised this week.')).toContain('PRAYER_NOT_ADDRESSED_TO_GOD');
    expect(style('en', 'Father, give me a calm heart this week.')).toEqual([]);
    expect(style('de', 'Vater, gib mir ein ruhiges Herz.')).toEqual([]);
    expect(style('ja', '父よ、私に平安をお与えください。')).toEqual([]);
  });

  it('reads a direction to pray as a direction', () => {
    expect(style('en', 'Ask for wisdom before you decide.')).toEqual([]);
    expect(style('fr', 'Demande la sagesse avant de décider.')).toEqual([]);
  });

  it('flags motivational coaching', () => {
    expect(codes(claim('en', 'Believe in yourself: you have got this!', 'prayer'))).toContain('COACHING_TONE');
  });
});

describe('theology profiles', () => {
  const sources = (en) => [{ rows: [row(en, { fromOverlay: false })], rules: planRulesFor('en') }];

  it('requires a valid, declared profile', () => {
    expect(codes(checkTheologyProfile({ id: 'x', days: [] }, []))).toEqual(['UNDECLARED_THEOLOGY_PROFILE']);
    expect(codes(checkTheologyProfile({ theologyProfile: theologyProfile({ audience: 'everyone' }) }, []))).toEqual(['INVALID_THEOLOGY_PROFILE']);
    expect(codes(checkTheologyProfile({ lifeStage: 'married', theologyProfile: theologyProfile() }, []))).toEqual(['INVALID_THEOLOGY_PROFILE']);
  });

  it('asks a plan to declare the disputed topics it engages', () => {
    const tongues = 'Some believers pray in tongues; others do not.';
    expect(codes(checkTheologyProfile({ theologyProfile: theologyProfile() }, sources(tongues)))).toEqual(['UNDECLARED_DISPUTED_TOPIC']);
    expect(checkTheologyProfile({ theologyProfile: theologyProfile({ disputedTopics: ['spiritual-gifts'] }) }, sources(tongues))).toEqual([]);
  });

  it('flags practice that conflicts with the declared audience or tradition', () => {
    const nonCharismatic = theologyProfile({ tradition: 'broad-evangelical', charismatic: false, disputedTopics: ['spiritual-gifts'] });
    expect(codes(checkTheologyProfile({ theologyProfile: nonCharismatic }, sources('Ask God for the gift of tongues.')))).toEqual(['CHARISMATIC_CONFLICT']);
    expect(codes(checkTheologyProfile({ theologyProfile: theologyProfile() }, sources('End the day with the rosary.')))).toEqual(['TRADITION_CONFLICT']);
  });
});

describe('locale detection rules and terminology profiles', () => {
  it('exist for every app language', () => {
    expect(PLAN_RULE_LOCALES).toEqual([...LANG_CODES].sort());
  });

  it.each(LANG_CODES)('%s rules are complete, valid regular expressions', (lang) => {
    const rules = planRulesFor(lang);
    expect(rules.locale).toBe(lang);
    expect(['draft', 'human-approved']).toContain(rules.status);
    expect(['before', 'after', 'both']).toContain(rules.negationScope);
    expect(Object.keys(rules.patterns).sort()).toEqual([...PATTERN_CODES].sort());
    for (const code of PATTERN_CODES.filter((c) => c !== 'LITERAL_CALQUE')) expect(rules.patterns[code].length, `${lang}/${code}`).toBeGreaterThan(0);
    const all = [...rules.godReferences, ...rules.prayerDirections, ...rules.qualifiers, ...rules.negations,
      ...Object.values(rules.patterns).flat(), ...Object.values(rules.markers || {}).flat()];
    for (const pattern of all) expect(() => new RegExp(pattern, 'iu'), `${lang}: ${pattern}`).not.toThrow();
    // Theology markers judge the authored source only.
    expect(Boolean(rules.markers), lang).toBe(['en', 'fr'].includes(lang));
  });

  it.each(LANG_CODES)('%s glossary carries a complete Christian-language profile', (lang) => {
    expect(glossaryProfileErrors(lang, glossaryFor(lang))).toEqual([]);
  });
});
