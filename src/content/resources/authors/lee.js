// Nicky & Sila Lee. Their Pre-Marriage Course reading plan is in
// ../discernmentResources.js. The courses link to the ministry's own course
// pages; leaders' guides, DVDs and promotional material are left out.
import { edition, authorBook } from './shared';

const LEES = 'Nicky and Sila Lee';
const alphaShop = (title, product, extra) => edition(title, LEES, 'Hodder & Stoughton / Alpha', `https://shop.alpha.org/${product}`, extra);
const courseSite = (title, path) => edition(title, LEES, 'The Marriage Course', `https://www.themarriagecourse.org/${path}`);
const youVersion = (title, author, plan) => edition(title, author, 'Alpha / YouVersion', `https://www.bible.com/${plan}`);

export const LEE_BOOKS = [
  authorBook({
    id: 'lee-parenting-book',
    language: 'en',
    domains: ['relationships'],
    topics: ['parenting', 'children', 'family', 'family-discipleship'],
    lifeStages: ['married'],
    description: {
      en: 'A practical parenting guide on meeting children’s needs, setting boundaries and passing on faith and values.',
      fr: 'Un guide pratique pour répondre aux besoins des enfants, poser des limites et transmettre la foi et les valeurs.',
    },
    editions: {
      en: alphaShop('The Parenting Book', 'the-parenting-book', { isbn: '9781473681569' }),
    },
  }),
  authorBook({
    id: 'lee-marriage-book',
    language: 'en',
    domains: ['relationships'],
    topics: ['marriage', 'communication', 'conflict', 'forgiveness', 'family-of-origin', 'sexual-intimacy'],
    lifeStages: ['single', 'engaged', 'married'],
    // Sensitive: has a chapter on sex.
    description: {
      en: 'A practical guide to closeness, communication, conflict, forgiveness, in-laws and sex in marriage.',
      fr: 'Un guide pratique sur la proximité, la communication, les conflits, le pardon, les belles-familles et la sexualité dans le couple.',
    },
    editions: {
      en: alphaShop('The Marriage Book', 'the-marriage-book', { isbn: '9781473694217' }),
    },
  }),
  authorBook({
    id: 'alpha-marriage-course',
    type: 'study',
    language: 'en',
    domains: ['relationships'],
    topics: ['marriage', 'communication', 'conflict', 'forgiveness', 'sexual-intimacy'],
    lifeStages: ['married'],
    // Sensitive: day 6 is on sex.
    description: {
      en: 'Seven short readings from The Marriage Course on connection, communication, conflict, forgiveness and intimacy.',
      fr: 'Sept courtes lectures tirées du cours sur le mariage d’Alpha : lien, communication, conflits, pardon et intimité.',
      de: 'Sieben kurze Lesungen aus dem Ehe-Kurs über Nähe, Kommunikation, Konflikte, Vergebung und Intimität.',
      es: 'Siete lecturas breves del curso matrimonial sobre conexión, comunicación, conflictos, perdón e intimidad.',
      pt: 'Sete leituras breves do curso de casamento sobre conexão, comunicação, conflitos, perdão e intimidade.',
    },
    editions: {
      en: youVersion('The Marriage Course', LEES, 'reading-plans/19833-the-marriage-course'),
      fr: youVersion('Cours sur le mariage', 'Nicky et Sila Lee', 'fr/reading-plans/19833-the-marriage-course'),
      de: youVersion('Der Ehe-Kurs', 'Nicky und Sila Lee', 'de/reading-plans/19833-the-marriage-course'),
      es: youVersion('El curso matrimonial', 'Nicky y Sila Lee', 'es/reading-plans/19833-the-marriage-course'),
      pt: youVersion('O Curso de Casamento', 'Nicky e Sila Lee', 'pt/reading-plans/19833-the-marriage-course'),
      ru: youVersion('Брачный курс', 'Nicky & Sila Lee', 'ru/reading-plans/19833-the-marriage-course'),
      id: youVersion('Bimbingan Pernikahan', 'Nicky & Sila Lee', 'id/reading-plans/19833-the-marriage-course'),
      zh: youVersion('婚姻课程', 'Nicky & Sila Lee', 'zh-CN/reading-plans/19833-the-marriage-course'),
    },
  }),
  authorBook({
    id: 'lee-the-marriage-course',
    type: 'study',
    language: 'en',
    domains: ['relationships'],
    topics: ['marriage', 'communication', 'conflict', 'forgiveness', 'sexual-intimacy'],
    lifeStages: ['married'],
    // Sensitive: one session is on sex.
    description: {
      en: 'The course itself, run by churches in person and online, for couples who want to strengthen their marriage.',
      fr: 'Le cours lui-même, proposé par des Églises en présentiel et en ligne, pour les couples qui veulent fortifier leur mariage.',
    },
    editions: {
      en: courseSite('The Marriage Course', 'course/the-marriage-course'),
    },
  }),
  authorBook({
    id: 'lee-the-pre-marriage-course',
    type: 'study',
    language: 'en',
    domains: ['relationships'],
    topics: ['premarital', 'communication', 'conflict', 'sexual-intimacy'],
    lifeStages: ['dating', 'engaged'],
    // Sensitive: one session is on sex.
    description: {
      en: 'The course for engaged couples, run by churches in person and online.',
      fr: 'Le cours pour les couples fiancés, proposé par des Églises en présentiel et en ligne.',
    },
    editions: {
      en: courseSite('The Pre-Marriage Course', 'course/the-pre-marriage-course'),
    },
  }),
  authorBook({
    id: 'lee-parenting-children-course',
    type: 'study',
    language: 'en',
    domains: ['relationships'],
    topics: ['parenting', 'children', 'family'],
    lifeStages: ['married'],
    description: {
      en: 'Five sessions for parents and carers of children up to ten, and parents-to-be.',
      fr: 'Cinq séances pour les parents et éducateurs d’enfants jusqu’à dix ans, et les futurs parents.',
    },
    editions: {
      en: courseSite('The Parenting Children Course', 'host/the-parenting-children-course'),
    },
  }),
  authorBook({
    id: 'lee-parenting-teenagers-course',
    type: 'study',
    language: 'en',
    domains: ['relationships'],
    topics: ['parenting', 'children', 'family'],
    lifeStages: ['married'],
    description: {
      en: 'A course for parents of teenagers, whether parenting alone, as a step-parent or as a couple.',
      fr: 'Un cours pour les parents d’adolescents, qu’ils les élèvent seuls, en famille recomposée ou en couple.',
    },
    editions: {
      en: courseSite('The Parenting Teenagers Course', 'host/the-parenting-teenagers-course'),
    },
  }),
];
