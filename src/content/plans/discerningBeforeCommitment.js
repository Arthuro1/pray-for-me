// Complete 28-day curriculum. Translation drafts remain behind the existing
// publication gate until named reviewers approve this new content explicitly.
import fr from './discernment/fr.json';
import en from './discernment/en.json';
import themes from './discernment/themes.json';
import scripture from './discernment/references.json';
import { LANG_CODES } from '../../i18n';

const localized = (french, english) => ({ fr: french, en: english });

const topics = [
  ['discernment', 'prayer'], ['spiritual-formation'], ['prayer', 'spiritual-formation'],
  ['identity', 'discernment'], ['singleness'], ['contentment', 'discernment'], ['prayer'],
  ['marriage', 'covenant'], ['dating', 'character'], ['character', 'spiritual-formation'],
  ['character'], ['trust'], ['communication', 'listening', 'conflict'], ['discernment'],
  ['premarital', 'spiritual-formation'], ['finances', 'work'], ['family', 'children'],
  ['purity', 'sexuality'], ['dating', 'discernment'], ['dating', 'discernment'], ['discernment'],
  ['prayer', 'discernment'], ['discernment'], ['community', 'discernment'],
  ['healing'], ['discernment'], ['communication'], ['prayer', 'singleness', 'discernment'],
];

export const MOVEMENTS = ['heart', 'know', 'shared', 'choose'].map((id, index) => ({
  id, from: index * 7 + 1, to: index * 7 + 7, titleKey: `planDiscernmentMovement${index + 1}`,
}));

export const DISCERNING_BEFORE_COMMITMENT = {
  id: 'discernment28', emoji: '🧭', count: 28, version: 1,
  category: 'relationships', lifeStage: 'single', resourceDomains: ['relationships'],
  titleKey: 'planDiscernmentTitle', subKey: 'planDiscernmentSub',
  proseTranslations: LANG_CODES.filter((lang) => !['en', 'fr'].includes(lang)),
  review: {
    status: 'draft', theology: { status: 'pending' }, safety: { status: 'pending' },
    locales: Object.fromEntries(LANG_CODES.map((lang) => [lang, { status: 'pending' }])),
  },
  movements: MOVEMENTS,
  intro: localized(fr.intro.replace(/\n{3,}/g, '\n\n').replace(/ - /g, '\n- '), en.intro),
  biblical: { ref: 'James 1:2-8', text: localized(fr.biblical, en.biblical) },
  completion: localized(fr.completion, en.completion),
  days: fr.days.map((day, index) => ({
    theme: themes[index],
    ref: scripture[index][0], readingRefs: scripture[index][1], related: scripture[index][2],
    movement: MOVEMENTS[Math.floor(index / 7)].id,
    reflection: localized(day.reflection, en.days[index].reflection),
    practice: localized(day.practice, en.days[index].practice),
    discernment: Object.fromEntries(Object.entries(day.discernment).map(([key, value]) => [
      key, Array.isArray(value)
        ? value.map((question, i) => localized(question, en.days[index].discernment[key][i]))
        : localized(value, en.days[index].discernment[key]),
    ])),
    resourceTopics: topics[index],
  })),
};

export default DISCERNING_BEFORE_COMMITMENT;
