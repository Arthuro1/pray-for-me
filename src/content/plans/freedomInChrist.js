// "Freedom & Deliverance in Christ" — a 30-day Scripture-centred journey of
// prayer, repentance, renunciation, spiritual warfare and walking in freedom.
//
// It runs on the SAME engine as every other guided plan (src/content/prayerPlans.js):
// starting it creates ONE recurring daily prayer capped after 30 occurrences,
// `schedule.plan = { id, version, startDate }` numbers the days, and
// `planDayContent()` supplies the day. There is no parallel prayer engine, no
// parallel Scripture reader, no parallel notes system and no parallel resource
// catalogue — only richer CONTENT and one extra, optional layer of guidance
// (`day.freedom`, rendered by src/components/deliverance/).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE THEOLOGICAL MODEL, AND WHY THE CONTENT READS THE WAY IT DOES
// ─────────────────────────────────────────────────────────────────────────────
//   The Word of God defines truth.
//   The Holy Spirit applies the Word personally.
//   The believer responds through repentance, faith, renunciation, prayer and
//   obedience.
//   Jesus Christ remains the foundation and the centre of freedom.
//
// So the spiritual centre of every day is Christ — never demons, Satan, curses,
// ancestors, spiritual enemies, manifestations or deliverance ministers. The
// plan opens at the cross (day 1) and closes in the vine (day 30), and a reader
// should finish more conscious of Christ's lordship than of anything opposing it.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THE APP MAY AND MAY NOT SAY
// ─────────────────────────────────────────────────────────────────────────────
// Pray4Me GUIDES. It is not a spiritual diagnostician. It may explain commonly
// recognised categories within African/Pentecostal deliverance teaching, give
// illustrative examples, guide biblical self-examination, and offer
// Scripture-centred prayers. It may never claim that a particular demon is
// present, that a curse definitely exists, that an ancestor definitely made a
// covenant, that a dream proves bondage, that a life problem proves a curse,
// that the Holy Spirit revealed something through this app, or that any illness,
// delay, financial difficulty, fertility problem, relationship breakdown,
// mental-health condition or recurring hardship is demonic.
//
// The ONLY personalization is the certainty a reader volunteers about a category
// (see freedom/certainty.js), and it is used to pick between AUTHORED prayer
// modules (src/lib/freedomSession.js). No model writes, extends, interprets or
// translates a word of this plan, and nothing a reader selects, writes, records
// or prays is stored, synced, shared or sent to analytics.
//
// ─────────────────────────────────────────────────────────────────────────────
// RELEASE GATE
// ─────────────────────────────────────────────────────────────────────────────
// `review.status` is deliberately `needs_review`: canUsePlan() therefore keeps
// this plan out of a PRODUCTION build entirely until a named human has signed
// off theology, safety and every shipped locale (src/lib/planReview.js). Given
// the subject, that gate is the point — see docs/FREEDOM_DELIVERANCE.md for the
// checklist a reviewer works through.
import { DAYS } from './freedomInChristDays';

// The five movements. A reader sees these as calm milestones; the content model
// is what actually carries them (every day names its movement).
//
// `resourceTopics` is the movement-level "Go deeper" shelf (§ section-level
// recommendations): what the whole movement is about, used to resolve approved
// resources once the reader has finished a day inside it.
export const MOVEMENTS = [
  { id: 'established', from: 1, to: 5, titleKey: 'planFreedomMovementEstablished', resourceTopics: ['identity', 'holy-spirit', 'scripture-prayer', 'victory'] },
  { id: 'repentance', from: 6, to: 10, titleKey: 'planFreedomMovementRepentance', resourceTopics: ['repentance', 'renunciation', 'covenants', 'deliverance'] },
  { id: 'family', from: 11, to: 20, titleKey: 'planFreedomMovementFamily', resourceTopics: ['family-line', 'covenants', 'curses', 'altars', 'deliverance'] },
  { id: 'warfare', from: 21, to: 26, titleKey: 'planFreedomMovementWarfare', resourceTopics: ['spiritual-warfare', 'strongholds', 'armor-of-god', 'scripture-prayer'] },
  { id: 'walking', from: 27, to: 30, titleKey: 'planFreedomMovementWalking', resourceTopics: ['holy-spirit', 'discipleship', 'spiritual-formation', 'community'] },
];

// What a reader can carry on as ordinary recurring prayers after day 30. Plain
// prayer requests built from i18n keys, so they arrive in the reader's own
// language and then behave like anything else in the Journal.
export const CONTINUE_THEMES = [
  { id: 'walk', titleKey: 'planFreedomContinueWalk', descKey: 'planFreedomContinueWalkDesc' },
  { id: 'spirit', titleKey: 'planFreedomContinueSpirit', descKey: 'planFreedomContinueSpiritDesc' },
  { id: 'mind', titleKey: 'planFreedomContinueMind', descKey: 'planFreedomContinueMindDesc' },
  { id: 'word', titleKey: 'planFreedomContinueWord', descKey: 'planFreedomContinueWordDesc' },
  { id: 'temptation', titleKey: 'planFreedomContinueTemptation', descKey: 'planFreedomContinueTemptationDesc' },
  { id: 'forgiveness', titleKey: 'planFreedomContinueForgiveness', descKey: 'planFreedomContinueForgivenessDesc' },
  { id: 'family', titleKey: 'planFreedomContinueFamily', descKey: 'planFreedomContinueFamilyDesc' },
  { id: 'community', titleKey: 'planFreedomContinueCommunity', descKey: 'planFreedomContinueCommunityDesc' },
];

// The "Look back" questions offered once the last day is behind the reader.
// They ask about Scripture, surrender, practical change and remaining prayer —
// never "which demons left you?".
export const LOOK_BACK = [
  'planFreedomLookBackScripture',
  'planFreedomLookBackSurrendered',
  'planFreedomLookBackChanges',
  'planFreedomLookBackPrayer',
  'planFreedomLookBackTalk',
];

export const FREEDOM_IN_CHRIST = {
  id: 'freedom30',
  emoji: '🕊️',
  count: 30,
  version: 1,
  category: 'freedom',
  titleKey: 'planFreedomTitle',
  subKey: 'planFreedomSub',
  // Prose stays in the authored English and French until competent speakers have
  // reviewed a translation. "Deliverance", "covenant", "curse", "ancestral
  // worship", "shrine", "altar", "divination", "initiation", "renunciation" and
  // "spiritual warfare" translate very differently across cultures, and a bad
  // rendering here could equate culture with witchcraft, ancestors with demons,
  // or ethnicity with bondage. Day titles and every UI label ARE authored in all
  // 16 languages; the longer prose falls back through pick(). See
  // docs/FREEDOM_DELIVERANCE.md § Localization.
  proseTranslations: [],
  // Not a life-stage plan: it asks nothing about marriage, age or household, and
  // the resource resolver must therefore not filter its shelf by life stage.
  lifeStage: null,
  // For this plan the "Go deeper" shelf prefers African Pentecostal and African
  // deliverance resources, then international Pentecostal/charismatic, then
  // complementary evangelical freedom and discipleship material. Ordering only —
  // every entry still has to be individually approved, and a perspective label
  // is context, never a judgement.
  resourcePerspectives: ['african-pentecostal', 'pentecostal', 'charismatic', 'evangelical'],
  // And it draws ONLY from freedom material. The shared topic taxonomy is what
  // makes this necessary: 'discernment', 'healing', 'identity' and 'family-line'
  // all mean something different on a marriage shelf, and without this scope a
  // reader renouncing an occult covenant on day 7 was offered books on choosing
  // a spouse. Unlike perspective, this filters — see § domain in
  // src/lib/resources.js.
  resourceDomains: ['freedom'],
  // Content-free product events, opt-in per plan. The names must exist on the
  // EVENTS allowlist in src/lib/analytics.js. Nothing a person selects, writes,
  // records, prays or remembers is ever attached to them — in particular no
  // certainty selection, category, note or prayer text ever leaves the device.
  analyticsEvents: {
    started: 'deliverance_plan_started',
    dayCompleted: 'deliverance_plan_day_completed',
    completed: 'deliverance_plan_completed',
  },
  review: { status: 'needs_review' },
  movements: MOVEMENTS,
  continueThemes: CONTINUE_THEMES,
  lookBack: LOOK_BACK,
  intro: {
    en: 'Thirty days of Scripture, prayer, repentance, renunciation, spiritual warfare and walking in freedom through Jesus Christ. We do not search anxiously for hidden demons or unknown covenants. We search the Word of God, submit ourselves to Christ, invite the Holy Spirit to search us, repent where Scripture calls for repentance, renounce known spiritual allegiances contrary to Christ, resist evil, and stand on God’s Word. If nothing dramatic ever comes to mind, this journey is still complete.',
    fr: "Trente jours d'Écriture, de prière, de repentance, de renoncement, de combat spirituel et de marche dans la liberté par Jésus-Christ. Nous ne cherchons pas anxieusement des démons cachés ou des alliances inconnues. Nous cherchons la Parole de Dieu, nous nous soumettons à Christ, nous invitons le Saint-Esprit à nous sonder, nous nous repentons là où l'Écriture appelle à la repentance, nous renonçons aux allégeances spirituelles connues contraires à Christ, nous résistons au mal, et nous nous appuyons sur la Parole de Dieu. Si rien de spectaculaire ne te vient jamais à l'esprit, ce parcours reste entier.",
  },
  biblical: {
    ref: 'Colossians 2:13-15',
    text: {
      en: 'Paul tells the Colossians that God made them alive with Christ, cancelled the record of debt that stood against them by nailing it to the cross, and there disarmed the rulers and authorities, triumphing over them (Colossians 2:13-15). The same letter says God has already delivered us from the domain of darkness and transferred us into the kingdom of His beloved Son (Colossians 1:13-14), and Hebrews says Jesus shared our flesh and blood so that through death He might free those held in lifelong slavery to the fear of death (Hebrews 2:14-15). Freedom in the New Testament is Christ’s accomplished victory, applied by His Spirit to people who belong to Him.',
      fr: "Paul dit aux Colossiens que Dieu les a rendus vivants avec Christ, qu'Il a effacé l'acte qui les condamnait en le clouant à la croix, et qu'Il y a dépouillé les dominations et les autorités en triomphant d'elles (Colossiens 2:13-15). La même lettre affirme que Dieu nous a déjà délivrés de la puissance des ténèbres et transportés dans le royaume de Son Fils bien-aimé (Colossiens 1:13-14), et l'épître aux Hébreux dit que Jésus a participé à notre chair et à notre sang afin de délivrer par Sa mort ceux que la crainte de la mort retenait toute leur vie dans l'esclavage (Hébreux 2:14-15). Dans le Nouveau Testament, la liberté est la victoire accomplie de Christ, appliquée par Son Esprit à ceux qui sont à Lui.",
    },
  },
  completion: {
    en: 'Thirty days of Scripture, prayer, repentance, renunciation, spiritual warfare and walking with the Holy Spirit. You have prayed God’s Word, brought your life and what you know of your family history before Christ, repented where repentance was needed, renounced what you no longer want allegiance to, and learned to ask the Holy Spirit to lead you. You do not need to keep discovering more in order to be safe. Whatever comes next, that belongs to you — and it continues tomorrow in ordinary discipleship.',
    fr: "Trente jours d'Écriture, de prière, de repentance, de renoncement, de combat spirituel et de marche avec le Saint-Esprit. Tu as prié la Parole de Dieu, apporté devant Christ ta vie et ce que tu sais de ton histoire familiale, tu t'es repenti là où c'était nécessaire, tu as renoncé à ce dont tu ne voulais plus l'allégeance, et tu as appris à demander au Saint-Esprit de te conduire. Tu n'as pas besoin de continuer à découvrir davantage pour être en sécurité. Quoi qu'il arrive ensuite, cela t'appartient — et cela continue demain dans une simple vie de disciple.",
  },
  days: DAYS,
};

export default FREEDOM_IN_CHRIST;
