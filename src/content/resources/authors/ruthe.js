// Reinhold Ruthe. His earlier titles are in ../relationshipBooks.js. Left out:
// greeting booklets and cards, an Advent desk calendar ("Dem Erlöser
// begegnen"), and titles the publisher lists as sold out ("Geschenke der
// Hoffnung", "Glaube verleiht Flügel", "Täglich unterwegs mit Gott").
import { edition, authorBook } from './shared';

const RUTHE = 'Reinhold Ruthe';
const kawohl = (title, product, extra) => edition(title, RUTHE, 'Kawohl', `https://www.kawohl.de/${product}`, extra);
// Brendow's backlist is sold as e-books through the Fontis shop.
const fontis = (title, product, publisher = 'Brendow') => edition(title, RUTHE, publisher, `https://www.fontis-shop.de/products/${product}`);

export const RUTHE_BOOKS = [
  // ── On the current plans ─────────────────────────────────────────────────
  authorBook({
    id: 'ruthe-check-up-fuer-die-liebe',
    language: 'de',
    domains: ['relationships'],
    topics: ['spiritual-rhythms', 'friendship', 'contentment'],
    lifeStages: ['married'],
    description: {
      de: '52 geistliche Impulse für Ehepaare, gedacht zum gemeinsamen Lesen im Wochenrhythmus.',
      en: 'Fifty-two short spiritual reflections for married couples to read together, one a week.',
      fr: 'Cinquante-deux courtes méditations pour couples mariés, à lire ensemble au rythme d’une par semaine.',
    },
    editions: {
      de: fontis('Check-up für die Liebe (E-Book)', 'check-up-fur-die-liebe-e-book'),
    },
  }),
  authorBook({
    id: 'ruthe-taegliche-audienz-bei-gott',
    language: 'de',
    domains: ['relationships'],
    topics: ['prayer', 'spiritual-rhythms'],
    description: {
      de: '365 Andachten zu Bibeltexten, jede mit einem kurzen Gebet.',
      en: 'A year of daily Bible readings, each ending with a short prayer.',
      fr: 'Une année de méditations bibliques quotidiennes, chacune suivie d’une courte prière.',
    },
    editions: {
      de: kawohl('Tägliche Audienz bei Gott: 365 Andachten', 'taegliche-audienz-bei-gott-5023', { isbn: '9783863380236' }),
    },
  }),
  authorBook({
    id: 'ruthe-sehen-was-gott-tut',
    language: 'de',
    domains: ['relationships'],
    topics: ['prayer', 'spiritual-formation'],
    description: {
      de: 'Warum Christen Gottes Nähe so unterschiedlich erleben – und wie man sein Wirken im Alltag wahrnimmt.',
      en: 'Why Christians sense God’s nearness so differently, and how to notice his work in everyday life.',
      fr: 'Pourquoi les chrétiens ressentent si différemment la proximité de Dieu, et comment discerner son action au quotidien.',
    },
    editions: {
      de: fontis('Sehen, was Gott tut (E-Book)', 'sehen-was-gott-tut-e-book'),
    },
  }),
  authorBook({
    id: 'ruthe-was-meine-seele-stark-macht',
    language: 'de',
    domains: ['relationships'],
    topics: ['suffering', 'healing'],
    description: {
      de: 'Über Resilienz: wie die Seele in Krisen widerstandsfähig wird – psychologisch und aus christlicher Sicht.',
      en: 'On resilience in hard seasons, drawing on psychology and Christian faith.',
      fr: 'Sur la résilience dans les temps difficiles, à la lumière de la psychologie et de la foi chrétienne.',
    },
    editions: {
      de: kawohl('Was meine Seele stark macht: Mit Resilienz das Leben meistern', 'was-meine-seele-stark-macht-5003', { isbn: '9783863380038' }),
    },
  }),
  authorBook({
    id: 'ruthe-charlotte-geht',
    language: 'de',
    domains: ['relationships'],
    topics: ['illness', 'grief', 'suffering', 'marriage'],
    lifeStages: ['married'],
    // Sensitive: illness (dementia) and bereavement.
    description: {
      de: 'Ein Eheberater über die Demenz seiner Frau und den langsamen Abschied im hohen Alter.',
      en: 'A marriage counsellor on his wife’s dementia and their long farewell in old age.',
      fr: 'Un conseiller conjugal raconte la démence de son épouse et leur long adieu dans le grand âge.',
    },
    editions: {
      de: kawohl('Charlotte geht: Das hohe Alter, die Demenz und der Abschied von meiner Frau', 'charlotte-geht-5020', { isbn: '9783863380205' }),
    },
  }),
  authorBook({
    // A four-temperaments typology with a self-test rather than a book of
    // Christian formation.
    id: 'ruthe-typen-und-temperamente',
    language: 'de',
    domains: ['relationships'],
    topics: ['character', 'communication'],
    description: {
      de: 'Vier Temperamentstypen mit Selbsttest, um eigene Stärken und Schwächen und die anderer besser zu verstehen.',
      en: 'Four temperament types with a self-test, to understand your own strengths and weaknesses and those of others.',
      fr: 'Quatre types de tempérament, avec un test, pour mieux comprendre ses forces et faiblesses et celles des autres.',
    },
    editions: {
      de: fontis('Typen und Temperamente (E-Book)', 'typen-und-temperamente-e-book'),
    },
  }),

  // ── Held on the christian-living shelf for coming plans ──────────────────
  authorBook({
    id: 'ruthe-glueck',
    language: 'de',
    domains: ['christian-living'],
    topics: ['contentment'],
    description: {
      de: 'Ein Seelsorger über Wege zum Glück – ohne Erfolgsrezept, aber mit einer Strategie für das Wohlbefinden.',
      en: 'A counsellor on paths to happiness: no recipe for success, but a strategy for well-being.',
      fr: 'Un conseiller sur les chemins du bonheur : pas de recette, mais une stratégie pour le bien-être.',
    },
    editions: {
      de: fontis('Glück', 'gluck', 'Fontis'),
    },
  }),
  authorBook({
    id: 'ruthe-hochsensibilitaet-und-depression',
    language: 'de',
    domains: ['christian-living'],
    topics: ['mental-health'],
    // Sensitive: depression.
    description: {
      de: 'Über Hochsensibilität, Stimmungsschwankungen und Depression – und wie Betroffene damit leben lernen.',
      en: 'On high sensitivity, mood swings and depression, and how to live with them.',
      fr: 'Sur l’hypersensibilité, les sautes d’humeur et la dépression, et comment vivre avec.',
    },
    editions: {
      de: fontis('Hochsensibilität und Depression (E-Book)', 'hochsensibilitat-und-depression-e-book'),
    },
  }),
  authorBook({
    id: 'ruthe-heilsame-gespraeche',
    language: 'de',
    domains: ['christian-living'],
    topics: ['pastoral-care', 'mental-health'],
    // Sensitive: retold counselling cases, including compulsions.
    description: {
      de: 'Nacherzählte Gespräche aus der Beratung, etwa über Eifersucht, Zwänge und Angst vor Nähe.',
      en: 'Real counselling conversations retold, on jealousy, compulsions and fear of closeness.',
      fr: 'Des entretiens de conseil réels, racontés : jalousie, compulsions, peur de l’intimité.',
    },
    editions: {
      de: edition('Heilsame Gespräche (E-Book)', RUTHE, 'SCM Hänssler', 'https://www.scm-shop.de/heilsame-gespraeche-137132.html'),
    },
  }),
  authorBook({
    id: 'ruthe-handbuch-der-therapeutischen-seelsorge',
    language: 'de',
    domains: ['christian-living'],
    topics: ['pastoral-care'],
    description: {
      de: 'Ein Handbuch für Seelsorgende: ein an der Bibel orientiertes therapeutisches Konzept mit praktischen Anleitungen.',
      en: 'A handbook for pastoral counsellors: a Bible-based therapeutic approach with practical guidance.',
      fr: 'Un manuel pour l’accompagnement pastoral : une approche thérapeutique fondée sur la Bible, avec des conseils pratiques.',
    },
    editions: {
      de: fontis('Handbuch der therapeutischen Seelsorge (E-Book)', 'handbuch-der-therapeutischen-seelsorge-e-book'),
    },
  }),
  authorBook({
    // Also contained in the Handbuch above; sold on its own as well.
    id: 'ruthe-gespraechsfuehrung-in-der-seelsorge',
    language: 'de',
    domains: ['christian-living'],
    topics: ['pastoral-care'],
    description: {
      de: 'Über die Gesprächsführung in der Seelsorge, aus langjähriger Beratungspraxis.',
      en: 'On conducting pastoral conversations, from long counselling experience.',
      fr: 'Sur la conduite des entretiens d’accompagnement pastoral, fruit d’une longue expérience.',
    },
    editions: {
      de: fontis('Gesprächsführung in der Seelsorge (E-Book)', 'gesprachsfuhrung-in-der-seelsorge-e-book'),
    },
  }),
];
