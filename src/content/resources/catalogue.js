// The curated external-resource catalogue behind "Go deeper".
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY PUBLICATION AND LINK VERIFICATION ARE SEPARATE GATES
// ─────────────────────────────────────────────────────────────────────────────
// Recommending a book or a teaching to someone praying about marriage is a
// pastoral act, so publication is gated on a human:
//
//   • Only `status: 'approved'` entries are eligible (src/lib/resources.js drops
//     everything else). Sensitive entries additionally require explicit content
//     and safety sign-offs, and every rendered edition requires a verified date
//     and usable HTTPS URL.
//   • Approved entries below retain their prior editorial status, while their
//     current editions point to official publisher/ministry pages verified on
//     the recorded date. No title, edition, ISBN or locale is invented.
//   • New or unverified entries remain a curation worksheet until a human checks
//     the content and canonical link. If nothing qualifies, the app shows no
//     "Go deeper" section; external material is never load-bearing.
//
// ─────────────────────────────────────────────────────────────────────────────
// MULTILINGUAL SHAPE
// ─────────────────────────────────────────────────────────────────────────────
// `editions` is keyed by language. A language is present ONLY when a real
// edition in that language has been verified. Locales are NOT expected to match:
// a German reader may get a completely different, German-authored resource on
// the same topic, and that is preferred over a translation. See §fallback in
// src/lib/resources.js for how the app language, configured fallback languages,
// and the entry's original language are ranked.
//
// Entry shape:
//   id                  stable id, referenced by replacementResourceId
//   type                one of RESOURCE_TYPES
//   originalLanguage    the language it was written/produced in
//   topics              RESOURCE_TOPICS ids
//   domains             RESOURCE_DOMAINS ids — the families of plans this entry
//                       belongs on. Applied per collection below; an entry only
//                       states its own when it belongs on more than one shelf.
//   lifeStages          who it actually helps
//   status              draft | needs_review | approved | retired
//   reviewLevel         standard | sensitive (standard when omitted)
//   contentReview       { status: 'approved', reviewedBy, reviewedAt }
//   safetyReview        { status: 'approved', reviewedBy, reviewedAt }
//                       Both are mandatory for sensitive material. `approved`
//                       status alone can never publish a sensitive entry.
//   replacementResourceId  set when retiring something that has a successor
//   description         Praystead-authored, one sentence, why it fits — localized
//                       like the rest of our content ({ en, fr, ... })
//   editions            { <lang>: { title, author, publisher, url, available,
//                                   lastVerifiedAt, thumbnail } }
//
// `thumbnail` is OPTIONAL and must be a path to a cover file we host ourselves
// (public/resources/covers/…). Never a publisher's or a retailer's image URL:
// loading one would tell that host the reader's IP and which subject they are
// praying about, before they tap anything. Leave it out and the card draws a
// calm generated tile instead — see src/lib/resourceThumbnail.js.
import { RESOURCE_TOPICS, RESOURCE_DOMAINS, LIFE_STAGES, RESOURCE_TYPES, RESOURCE_STATUSES, RESOURCE_REVIEW_LEVELS } from './topics';
import { PAUL_RESOURCE_SIGNOFF } from '../reviews/paul20260903';
import { RELATIONSHIP_BOOKS } from './relationshipBooks';
import { DELIVERANCE_BOOKS } from './deliveranceBooks';
import { DAVID_STUDY_RESOURCES } from './davidStudyResources';
import { DISCERNMENT_RESOURCES } from './discernmentResources';

export { RESOURCE_TOPICS, RESOURCE_DOMAINS, LIFE_STAGES, RESOURCE_TYPES, RESOURCE_STATUSES, RESOURCE_REVIEW_LEVELS };

// The original curated set: marriage, singleness and preparation titles, plus a
// few general discipleship books that are not about relationships at all.
const CORE_RESOURCES = [
  {
    id: 'piper-momentary-marriage',
    type: 'book',
    originalLanguage: 'en',
    topics: ['marriage', 'covenant', 'spiritual-formation'],
    lifeStages: ['single', 'engaged', 'married'],
    status: 'approved',
    reviewLevel: 'sensitive',
    contentReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    safetyReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    description: {
      en: 'Reads marriage as a picture of Christ’s covenant love rather than a route to personal fulfilment.',
      fr: "Lit le mariage comme une image de l'amour d'alliance du Christ plutôt que comme une voie vers l'épanouissement personnel.",
    },
    editions: {
      en: { title: 'This Momentary Marriage', author: 'John Piper', publisher: 'Crossway', url: 'https://www.crossway.org/books/this-momentary-marriage-tpb/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'keller-meaning-of-marriage',
    type: 'book',
    originalLanguage: 'en',
    topics: ['marriage', 'covenant', 'communication', 'character'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    reviewLevel: 'sensitive',
    contentReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    safetyReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    description: {
      en: 'Works through commitment, service and friendship in marriage, with a chapter written for single readers.',
      fr: "Parcourt l'engagement, le service et l'amitié dans le mariage, avec un chapitre écrit pour les lecteurs célibataires.",
      de: 'Behandelt Verbindlichkeit, Dienst und Freundschaft in der Ehe und enthält ein Kapitel für alleinstehende Leserinnen und Leser.',
      pt: 'Explora compromisso, serviço e amizade no casamento, com um capítulo escrito para leitores solteiros.',
      es: 'Explora el compromiso, el servicio y la amistad en el matrimonio, con un capítulo escrito para lectores solteros.',
      ja: '結婚における献身、仕えること、友情を扱い、独身の読者に向けた章も収録しています。',
      ru: 'О верности, служении и дружбе в браке, с отдельной главой для неженатых и незамужних читателей.',
      ko: '결혼 안에서의 헌신, 섬김, 우정을 다루며 미혼 독자를 위한 장도 포함합니다.',
      id: 'Membahas komitmen, pelayanan, dan persahabatan dalam pernikahan, termasuk satu bab bagi pembaca lajang.',
    },
    editions: {
      en: { title: 'The Meaning of Marriage', author: 'Timothy Keller with Kathy Keller', publisher: 'Penguin Books', url: 'https://www.penguinrandomhouse.com/books/309809/the-meaning-of-marriage-by-timothy-keller-with-kathy-keller/', available: true, lastVerifiedAt: '2026-08-26' },
      fr: { title: 'Le mariage', author: 'Timothy Keller et Kathy Keller', publisher: 'Éditions Clé', url: 'https://editionscle.com/vie-chretienne/222-le-mariage-edition-brochee-9782358430432.html', available: true, lastVerifiedAt: '2026-08-28' },
      de: { title: 'Ehe: Gottes Idee für das größte Versprechen des Lebens', author: 'Kathy & Timothy Keller', publisher: 'Brunnen Verlag', url: 'https://brunnen-verlag.de/191305/ehe.html', available: true, lastVerifiedAt: '2026-08-28' },
      pt: { title: 'O significado do casamento', author: 'Timothy Keller com Kathy Keller', publisher: 'Vida Nova', url: 'https://www.vidanova.com.br/livros/significado-do-casamento-o', available: true, lastVerifiedAt: '2026-08-28' },
      es: { title: 'El significado del matrimonio', author: 'Timothy Keller', publisher: 'B&H Español', url: 'https://www.bhpublishinggroup.com/product/el-significado-del-matrimonio-2/', available: true, lastVerifiedAt: '2026-08-28' },
      ja: { title: '結婚の意味 わかりあえない2人のために', author: 'ティモシー・ケラー、キャシー・ケラー', publisher: 'いのちのことば社', url: 'https://www.wlpm.or.jp/pub/?sh_cd=96747', available: true, lastVerifiedAt: '2026-08-28' },
      ru: { title: 'Замысел брака', author: 'Тимоти Келлер и Кэти Келлер', publisher: 'Левит', url: 'https://levitbooks.com/ru/products/zamisel-braka', isbn: '9786177662500', available: true, lastVerifiedAt: '2026-08-28' },
      ko: { title: '팀 켈러, 결혼을 말하다', author: '팀 켈러, 캐시 켈러', publisher: '두란노', url: 'https://www.lifebook.co.kr/goods/detail.asp?cate=172&gno=88527', isbn: '9788953120501', available: true, lastVerifiedAt: '2026-08-28' },
      id: { title: 'Makna Pernikahan: Menghadapi Kompleksitas Komitmen dengan Hikmat Allah', author: 'Timothy Keller dan Kathy Keller', publisher: 'Pionir Jaya', url: 'https://library.sttrii.ac.id/index.php?id=16420&keywords=&p=show_detail', isbn: '9789795423607', available: true, lastVerifiedAt: '2026-08-28' },
    },
  },
  {
    id: 'allberry-7-myths-singleness',
    type: 'book',
    originalLanguage: 'en',
    topics: ['singleness', 'identity', 'contentment', 'community'],
    lifeStages: ['single'],
    status: 'approved',
    reviewLevel: 'sensitive',
    contentReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    safetyReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    description: {
      en: 'Takes apart the assumptions that make singleness feel like a waiting room.',
      fr: "Démonte les idées reçues qui font du célibat une salle d'attente.",
      es: 'Desmonta las ideas que hacen que la soltería parezca una sala de espera.',
    },
    editions: {
      en: { title: '7 Myths About Singleness', author: 'Sam Allberry', publisher: 'Crossway', url: 'https://www.crossway.org/books/7-myths-about-singleness-tpb/', available: true, lastVerifiedAt: '2026-08-26' },
      fr: { title: '7 mensonges sur le célibat', author: 'Sam Allberry', publisher: 'BLF Éditions', url: 'https://blfstore.com/products/7-mensonges-sur-le-celibat', available: true, lastVerifiedAt: '2026-08-28' },
      es: { title: '7 mitos sobre la soltería', author: 'Sam Allberry', publisher: 'B&H Español', url: 'https://bhespanol.bhpublishinggroup.com/product/7-mitos-sobre-la-solteria-2/', available: true, lastVerifiedAt: '2026-08-28' },
    },
  },
  {
    id: 'danylak-redeeming-singleness',
    type: 'book',
    originalLanguage: 'en',
    topics: ['singleness', 'contentment', 'spiritual-formation'],
    lifeStages: ['single'],
    status: 'approved',
    description: {
      en: 'A biblical-theology treatment of singleness, from the Old Testament promise of offspring to the New Testament church.',
      fr: "Une théologie biblique du célibat, de la promesse d'une descendance dans l'Ancien Testament à l'Église du Nouveau.",
    },
    editions: {
      en: { title: 'Redeeming Singleness', author: 'Barry Danylak', publisher: 'Crossway', url: 'https://www.crossway.org/books/redeeming-singleness-tpb/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'tripp-what-did-you-expect',
    type: 'book',
    originalLanguage: 'en',
    topics: ['marriage', 'conflict', 'forgiveness', 'communication'],
    lifeStages: ['engaged', 'married'],
    status: 'approved',
    description: {
      en: 'On what two sinners actually owe each other: confession, forgiveness and daily repair.',
      fr: 'Sur ce que deux pécheurs se doivent réellement : la confession, le pardon et la réparation quotidienne.',
    },
    editions: {
      en: { title: 'What Did You Expect?', author: 'Paul David Tripp', publisher: 'Crossway', url: 'https://www.crossway.org/books/what-did-you-expect-ebook/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'lane-tripp-how-people-change',
    type: 'book',
    originalLanguage: 'en',
    // General Christian formation rather than a relationships book, so it stands
    // on the freedom shelf too: the "complementary evangelical freedom and
    // discipleship material" that plan's resourcePerspectives asks for. It was
    // already on that shelf before domains existed; only the dating and marriage
    // titles beside it were wrong.
    domains: ['relationships', 'freedom'],
    topics: ['character', 'healing', 'spiritual-formation'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    description: {
      en: 'How change actually happens in a Christian — useful for anyone praying about their own character.',
      fr: 'Comment le changement se produit réellement chez un chrétien — utile à quiconque prie pour son propre caractère.',
    },
    editions: {
      en: { title: 'How People Change', author: 'Timothy S. Lane and Paul David Tripp', publisher: 'New Growth Press', url: 'https://newgrowthpress.com/christian-books/biblical-counseling-books/how-people-change/', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'welch-when-people-are-big',
    type: 'book',
    originalLanguage: 'en',
    // General Christian formation rather than a relationships book, so it stands
    // on the freedom shelf too: the "complementary evangelical freedom and
    // discipleship material" that plan's resourcePerspectives asks for. It was
    // already on that shelf before domains existed; only the dating and marriage
    // titles beside it were wrong.
    domains: ['relationships', 'freedom'],
    topics: ['identity', 'character', 'healing'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    description: {
      en: 'On the fear of other people, and why being chosen can never settle who you are.',
      fr: "Sur la peur des autres, et pourquoi être choisi ne pourra jamais dire qui tu es.",
    },
    editions: {
      en: { title: 'When People Are Big and God Is Small, Second Edition', author: 'Edward T. Welch', publisher: 'P&R Publishing', url: 'https://www.prpbooks.com/book/when-people-are-big-and-god-is-small-second-edition', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'cloud-townsend-boundaries-dating',
    type: 'book',
    originalLanguage: 'en',
    topics: ['dating', 'discernment', 'character'],
    lifeStages: ['single', 'dating'],
    status: 'approved',
    description: {
      en: 'Practical wisdom on healthy limits while getting to know someone.',
      fr: "Sagesse pratique sur les limites saines quand on apprend à connaître quelqu'un.",
    },
    editions: {
      en: { title: 'Boundaries in Dating', author: 'Henry Cloud and John Townsend', publisher: 'Zondervan', url: 'https://faithgateway.com/products/boundaries-in-dating-how-healthy-choices-grow-healthy-relationships?variant=13762905571439', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'elliot-passion-and-purity',
    type: 'book',
    originalLanguage: 'en',
    topics: ['purity', 'contentment', 'singleness'],
    lifeStages: ['single', 'dating'],
    status: 'approved',
    reviewLevel: 'sensitive',
    contentReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    safetyReview: {
      status: 'approved',
      reviewedBy: 'Paul',
      reviewedAt: '2026-08-26',
    },
    description: {
      en: 'A personal account of bringing romantic desire under Christ’s authority over many years of waiting.',
      fr: "Un récit personnel : soumettre le désir amoureux à l'autorité du Christ au fil de longues années d'attente.",
    },
    editions: {
      en: { title: 'Passion and Purity', author: 'Elisabeth Elliot', publisher: 'Revell', url: 'https://bakerpublishinggroup.com/products/9780800746667_passion-and-purity', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
  {
    id: 'ortlund-gentle-and-lowly',
    type: 'book',
    originalLanguage: 'en',
    // General Christian formation rather than a relationships book, so it stands
    // on the freedom shelf too: the "complementary evangelical freedom and
    // discipleship material" that plan's resourcePerspectives asks for. It was
    // already on that shelf before domains existed; only the dating and marriage
    // titles beside it were wrong.
    domains: ['relationships', 'freedom'],
    topics: ['healing', 'identity', 'spiritual-formation'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    description: {
      en: 'On the heart of Christ towards the hurting — a good companion for the healing days of this plan.',
      fr: 'Sur le cœur du Christ envers ceux qui souffrent — un bon compagnon pour les jours de guérison de ce parcours.',
      de: 'Über das Herz Christi für verletzte Menschen – ein guter Begleiter für die Tage dieses Plans, die der Heilung gewidmet sind.',
      pt: 'Sobre o coração de Cristo para com quem sofre — um bom companheiro para os dias de cura deste plano.',
      es: 'Sobre el corazón de Cristo hacia quienes sufren; un buen compañero para los días de sanidad de este plan.',
      ja: '傷ついた人に向けられたキリストの心を描き、このプランの癒やしの日々に寄り添う一冊です。',
      zh: '本书描绘基督对受伤者的心，是这个祷告计划中医治主题日的合适陪伴。',
    },
    editions: {
      en: { title: 'Gentle and Lowly', author: 'Dane C. Ortlund', publisher: 'Crossway', url: 'https://www.crossway.org/books/gentle-and-lowly-hcj/', available: true, lastVerifiedAt: '2026-08-26', thumbnail: '/resources/covers/ortlund-gentle-and-lowly-en.webp' },
      de: { title: 'Gütig und Sanft', author: 'Dane Ortlund', publisher: '3L Verlag', url: 'https://www.3lverlag.de/kategorien/1815-guetig-und-sanft.html', available: true, lastVerifiedAt: '2026-08-28' },
      pt: { title: 'Manso e humilde', author: 'Dane C. Ortlund', publisher: 'Thomas Nelson Brasil', url: 'https://thomasnelson.com.br/products/manso-e-humilde-dane-c-ortlund', available: true, lastVerifiedAt: '2026-08-28' },
      es: { title: 'Manso y humilde', author: 'Dane C. Ortlund', publisher: 'B&H Español', url: 'https://bhespanol.bhpublishinggroup.com/product/manso-y-humilde-2/', available: true, lastVerifiedAt: '2026-08-28' },
      ja: { title: 'わたしは心が柔和でへりくだっているから キリストの心をさぐる23章', author: 'デイン・オートランド', publisher: 'いのちのことば社', url: 'https://www.wlpm.or.jp/pub/?sh_cd=113670', available: true, lastVerifiedAt: '2026-08-28' },
      zh: { title: '柔和谦卑：基督对罪人和困苦人的心', author: '戴恩·奥特伦', publisher: '十架路出版社 / 福音联盟中文', url: 'https://www.tgcchinese.org/book/gentle-and-lowly', isbn: '9781433586811', available: true, lastVerifiedAt: '2026-08-28' },
    },
  },
  {
    id: 'fdm-marriage-is-a-ministry',
    type: 'study',
    originalLanguage: 'en',
    topics: ['premarital', 'marriage', 'covenant', 'communication', 'sexual-intimacy', 'marriage-roles'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    contentReview: { ...PAUL_RESOURCE_SIGNOFF },
    safetyReview: { ...PAUL_RESOURCE_SIGNOFF },
    reviewLevel: 'sensitive',
    description: {
      en: 'Five marriage workbooks on biblical foundations, love, intimacy, roles and mutual service; optional reading when considering life together.',
      fr: 'Cinq cahiers sur les fondements bibliques du mariage, l’amour, l’intimité, les rôles et le service mutuel ; une lecture facultative pour envisager la vie commune.',
      es: 'Cinco cuadernos sobre fundamentos bíblicos del matrimonio, amor, intimidad, roles y servicio mutuo; lectura opcional al considerar una vida compartida.',
    },
    editions: {
      en: { title: 'Marriage Is a Ministry', author: 'Craig Caster', publisher: 'Family Discipleship Ministries', url: 'https://fdm.world/resources/marriage/', available: true, lastVerifiedAt: '2026-08-28' },
      es: { title: 'El matrimonio es un ministerio', author: 'Craig Caster', publisher: 'Family Discipleship Ministries', url: 'https://fdm.world/languages/spanish/', available: true, lastVerifiedAt: '2026-08-28' },
      hi: { title: 'विवाह एक सेवकाई है', author: 'Craig Caster', publisher: 'Family Discipleship Ministries', url: 'https://fdm.world/languages/hindi/', available: true, lastVerifiedAt: '2026-08-28' },
      sw: { title: 'Ndoa ni huduma', author: 'Craig Caster', publisher: 'Family Discipleship Ministries', url: 'https://fdm.world/languages/swahili/', available: true, lastVerifiedAt: '2026-08-28' },
      am: { title: 'ጋብቻ አገልግሎት ነው', author: 'Craig Caster', publisher: 'Family Discipleship Ministries', url: 'https://fdm.world/languages/amharic/', available: true, lastVerifiedAt: '2026-08-28' },
    },
  },
  {
    id: 'shepherds-global-christian-family',
    type: 'study',
    originalLanguage: 'en',
    topics: ['singleness', 'premarital', 'marriage', 'communication', 'sexuality', 'family', 'parenting', 'family-discipleship'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    contentReview: { ...PAUL_RESOURCE_SIGNOFF },
    safetyReview: { ...PAUL_RESOURCE_SIGNOFF },
    reviewLevel: 'sensitive',
    description: {
      en: 'A fifteen-lesson Christian family course covering singleness, preparation for marriage, marriage, sexuality and parenting.',
    },
    editions: {
      en: { title: 'Christian Family', author: 'Stephen Gibson', publisher: 'Shepherds Global Classroom', url: 'https://courses.shepherdsglobal.org/english/christian-family', available: true, lastVerifiedAt: '2026-09-03' },
      fr: { title: 'La famille chrétienne', author: 'Stephen Gibson', publisher: 'Shepherds Global Classroom', url: 'https://courses.shepherdsglobal.org/french/christian-family', available: true, lastVerifiedAt: '2026-09-03' },
      es: { title: 'La Familia Cristiana', author: 'Stephen Gibson', publisher: 'Shepherds Global Classroom', url: 'https://courses.shepherdsglobal.org/spanish/christian-family', available: true, lastVerifiedAt: '2026-09-03' },
      pt: { title: 'Família Cristã', author: 'Stephen Gibson', publisher: 'Shepherds Global Classroom', url: 'https://courses.shepherdsglobal.org/portuguese/christian-family', available: true, lastVerifiedAt: '2026-09-03' },
      ar: { title: 'الأسرة المسيحية', author: 'Stephen Gibson', publisher: 'Shepherds Global Classroom', url: 'https://courses.shepherdsglobal.org/arabic/christian-family', available: true, lastVerifiedAt: '2026-09-03' },
      sw: { title: 'Familia ya Kikristo — Useja', author: 'Stephen Gibson', publisher: 'Shepherds Global Classroom', url: 'https://courses.shepherdsglobal.org/kiswahili/christian-family/lesson/5-useja', available: true, lastVerifiedAt: '2026-09-03' },
      zh: { title: '基督徒家庭', author: 'Stephen Gibson', publisher: 'Shepherds Global Classroom', url: 'https://courses.shepherdsglobal.org/simplified-chinese/christian-family', available: true, lastVerifiedAt: '2026-08-28' },
      hi: { title: 'मसीही परिवार', author: 'Stephen Gibson', publisher: 'Shepherds Global Classroom', url: 'https://courses.shepherdsglobal.org/hindi/christian-family', available: true, lastVerifiedAt: '2026-08-28' },
      tl: { title: 'Pamilyang Kristiyano', author: 'Stephen Gibson', publisher: 'Shepherds Global Classroom', url: 'https://courses.shepherdsglobal.org/tagalog/christian-family', available: true, lastVerifiedAt: '2026-08-28' },
    },
  },
  {
    id: 'dg-ask-pastor-john',
    type: 'podcast',
    originalLanguage: 'en',
    topics: ['singleness', 'purity', 'marriage', 'discernment'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    status: 'approved',
    contentReview: { ...PAUL_RESOURCE_SIGNOFF },
    safetyReview: { ...PAUL_RESOURCE_SIGNOFF },
    reviewLevel: 'sensitive',
    description: {
      en: 'Short question-and-answer episodes, many of them on singleness, dating and purity.',
      fr: 'De courts épisodes de questions-réponses, dont beaucoup portent sur le célibat, les fréquentations et la pureté.',
    },
    editions: {
      en: { title: 'Ask Pastor John', author: 'John Piper', publisher: 'Desiring God', url: 'https://www.desiringgod.org/ask-pastor-john', available: true, lastVerifiedAt: '2026-08-26' },
    },
  },
];

// A file IS a collection here, so a domain is stamped on the whole collection
// rather than repeated on eighty entries. An entry that states its own `domains`
// keeps them, which is how a general discipleship title earns a place on more
// than one shelf.
const inDomain = (domain, entries) => entries.map((entry) => ({ domains: [domain], ...entry }));

export const RESOURCES = [
  ...inDomain('relationships', CORE_RESOURCES),
  ...inDomain('relationships', RELATIONSHIP_BOOKS),
  ...inDomain('relationships', DISCERNMENT_RESOURCES),
  // Deliverance material is sensitive without exception, so each of these
  // renders only on two named human sign-offs. See ./deliveranceBooks.js for
  // which languages have a verified edition and which deliberately have none.
  ...inDomain('freedom', DELIVERANCE_BOOKS),
  ...inDomain('bible-study', DAVID_STUDY_RESOURCES),
];

export default RESOURCES;
