// Mohammed & Lilliane Sanogo, from their publisher's shop (Sanogo Books). Their
// two earlier titles are in ../relationshipBooks.js.
//
// Left out: the boxed sets (the same books sold together), the Italian editions
// (not an app language), "Je suis une personne heureuse" (sold out), and the
// German and Spanish "J'ai donné ma vie à Jésus" and German "Devenir un intime
// de Dieu", whose shop titles are garbled, so the printed title could not be
// confirmed. Two English editions are sold under their French titles
// ("Renverser les autels…", "Sagesses pour multiplier ses grâces"), so no
// English title is recorded for them. A work in two parts links to part 1.
import { edition, authorBook } from './shared';

const sanogoBooks = (title, author, handle) => edition(title, author, 'Sanogo Books', `https://www.sanogobooks.com/products/${handle}`);
const mohammed = (title, handle) => sanogoBooks(title, 'Mohammed Sanogo', handle);
const lilliane = (title, handle) => sanogoBooks(title, 'Lilliane Sanogo', handle);
const AFRICAN_PENTECOSTAL = ['african-pentecostal', 'pentecostal'];

// A book held on the christian-living shelf for a plan still being written.
const later = ({ topics, reviewLevel, ...book }) => authorBook({
  language: 'fr', domains: ['christian-living'], perspective: AFRICAN_PENTECOSTAL, topics, reviewLevel, ...book,
});

export const SANOGO_BOOKS = [
  // ── On the current plans ─────────────────────────────────────────────────
  authorBook({
    id: 'sanogo-apprends-moi-a-prier',
    language: 'fr',
    domains: ['relationships', 'freedom'],
    perspective: AFRICAN_PENTECOSTAL,
    topics: ['prayer'],
    description: {
      en: 'A short introduction to how, where and when to pray, starting from the disciples’ request in Luke 11:1.',
      fr: 'Une courte initiation à la prière — comment, où et quand prier — à partir de la demande des disciples en Luc 11.1.',
    },
    editions: {
      fr: mohammed('Apprends-moi à prier', 'apprends-moi-a-prier-mohammed-sanogo'),
    },
  }),
  authorBook({
    id: 'sanogo-grandir-dans-l-intimite-avec-dieu',
    language: 'fr',
    domains: ['relationships', 'freedom'],
    perspective: AFRICAN_PENTECOSTAL,
    topics: ['prayer', 'spiritual-formation'],
    description: {
      en: 'On growing a close friendship with God through prayer and his presence.',
      fr: 'Grandir dans une amitié profonde avec Dieu, par la prière et sa présence.',
    },
    editions: {
      fr: mohammed('Grandir dans l’intimité avec Dieu', 'grandir-dans-lintimite-avec-dieu-mohammed-sanogo'),
      en: mohammed('Develop Your Intimacy with God', 'grandir-dans-lintimite-avec-dieu-mohammed-sanogo-version-francaise'),
    },
  }),
  authorBook({
    id: 'sanogo-cheminer-vers-plus-de-profondeur',
    language: 'fr',
    domains: ['relationships', 'freedom'],
    perspective: AFRICAN_PENTECOSTAL,
    topics: ['spiritual-formation', 'discipleship'],
    description: {
      en: 'Helps readers see where they stand with God and take steps toward a deeper relationship with him.',
      fr: 'Aide à situer sa relation avec Dieu et à progresser vers plus de profondeur.',
      de: 'Hilft, die eigene Beziehung zu Gott einzuschätzen und in ihr zu wachsen.',
    },
    editions: {
      fr: mohammed('Cheminer vers plus de profondeur avec Dieu', 'cheminer-vers-plus-de-profondeur-avec-dieu-mohammed-sanogo'),
      en: mohammed('Going Deeper with God', 'going-deeper-with-god-mohammed-sanogo-english-version'),
      de: mohammed('Den Weg zu mehr Tiefe beschreiten', 'den-weg-zu-mehr-tiefe-beschreiten-mohammed-sanogo-deutsche-version'),
    },
  }),
  authorBook({
    id: 'sanogo-j-ai-donne-ma-vie-a-jesus',
    language: 'fr',
    domains: ['freedom'],
    perspective: AFRICAN_PENTECOSTAL,
    topics: ['discipleship', 'identity', 'holy-spirit'],
    description: {
      en: 'First steps for a new believer, from a pastor who came to Christ from a Muslim background.',
      fr: 'Les premiers pas d’un nouveau croyant, par un pasteur d’origine musulmane venu à Christ.',
    },
    editions: {
      fr: mohammed('J’ai donné ma vie à Jésus, que dois-je faire ?', 'jai-donne-ma-vie-a-jesus-que-dois-je-faire-mohammed-sanogo'),
      en: mohammed('I Gave My Life to Jesus, What’s Next?', 'i-gave-my-life-to-jesus-whats-next-mohammed-sanogo-english-version'),
    },
  }),
  authorBook({
    id: 'sanogo-marcher-au-son-de-sa-voix',
    language: 'fr',
    domains: ['freedom'],
    perspective: AFRICAN_PENTECOSTAL,
    topics: ['holy-spirit', 'discipleship'],
    description: {
      en: 'On obeying God’s voice, not only praying, as the way to become a blessing to others.',
      fr: 'Sur l’obéissance à la voix de Dieu, et pas seulement la prière, comme chemin pour devenir une bénédiction.',
      es: 'Sobre obedecer la voz de Dios, y no solo orar, como camino para ser de bendición.',
    },
    editions: {
      fr: mohammed('Marcher au son de sa voix', 'marcher-au-son-de-sa-voix-mohammed-sanogo-version-francaise'),
      es: mohammed('Caminar al sonido de su voz', 'caminar-al-sonido-de-su-voz-mohammed-sanogo-version-espanol'),
    },
  }),
  authorBook({
    id: 'sanogo-vin-nouveau-pour-mon-mariage',
    language: 'fr',
    domains: ['relationships'],
    topics: ['marriage', 'future-spouse', 'marriage-crisis'],
    lifeStages: ['single', 'engaged', 'married'],
    // Sensitive: restoring broken marriages. Tome 2 is sanogo-six-sagesses-mariage.
    description: {
      en: 'First volume of Sanogo’s series on the wedding at Cana: choosing a spouse, building a home and restoring a strained marriage.',
      fr: 'Premier tome de la série de Sanogo sur les noces de Cana : choisir son conjoint, bâtir son foyer et restaurer un couple fragilisé.',
    },
    editions: {
      fr: mohammed('J’ai besoin d’un vin nouveau pour mon mariage (Tome 1)', 'jai-besoin-dun-vin-nouveau-pour-mon-mariage-tome-1-mohammed-sanogo'),
    },
  }),
  authorBook({
    id: 'lilliane-sanogo-sept-secrets-couple',
    language: 'fr',
    domains: ['relationships'],
    topics: ['marriage', 'communication', 'conflict', 'marriage-crisis'],
    lifeStages: ['engaged', 'married'],
    // Sensitive: written for couples whose marriage is in decline. Sold as a
    // men's and a women's edition; the link is the publisher's pack of both.
    description: {
      en: 'Seven practices for a lasting marriage — honouring each other, communication, conflict and shared dreams — in an edition for husbands and one for wives.',
      fr: 'Sept pratiques pour un mariage durable — s’honorer, communiquer, gérer les conflits, rêver ensemble — en une édition pour l’homme et une pour la femme.',
    },
    editions: {
      fr: lilliane('7 secrets pour sauver votre couple et construire un mariage solide et heureux', 'pack-duo-7-secrets-pour-sauver-votre-couple-homme-femme-lilliane-sanogo'),
    },
  }),
  authorBook({
    id: 'lilliane-sanogo-4-m-femme-de-dieu',
    language: 'fr',
    domains: ['relationships'],
    topics: ['identity', 'work', 'parenting', 'marriage-roles'],
    lifeStages: ['single', 'married'],
    // Sensitive: a woman's calling in marriage and motherhood is a roles subject.
    description: {
      en: 'A pastor and mother on four areas of a Christian woman’s life: ministry, marriage, motherhood and work.',
      fr: 'Une pasteure, épouse et mère sur quatre domaines de la vie d’une femme chrétienne : ministère, mariage, maternité et métier.',
    },
    editions: {
      fr: lilliane('Les 4 M de la femme de Dieu', 'les-4-m-de-la-femme-de-dieu-lilliane-sanogo-version-francaise'),
    },
  }),
  authorBook({
    id: 'sanogo-vaincre-les-attaques-du-malin',
    language: 'fr',
    domains: ['freedom'],
    perspective: AFRICAN_PENTECOSTAL,
    topics: ['spiritual-warfare', 'fear'],
    // Sensitive: spiritual warfare.
    description: {
      en: 'An African Pentecostal pastor on recognising and resisting spiritual attack, from his own experience.',
      fr: 'Un pasteur pentecôtiste africain sur la manière de reconnaître les attaques spirituelles et d’y résister, à partir de sa propre expérience.',
    },
    editions: {
      fr: mohammed('Vaincre les attaques majeures du malin', 'vaincre-les-attaques-de-lennemi-mohammed-sanogo'),
    },
  }),
  authorBook({
    id: 'sanogo-renverser-les-autels-d-appauvrissement',
    language: 'fr',
    domains: ['freedom'],
    perspective: AFRICAN_PENTECOSTAL,
    topics: ['altars', 'idolatry', 'family-line'],
    // Sensitive: altars in the family line, read through the lens of poverty.
    description: {
      en: 'Reads Gideon tearing down his father’s altar (Judges 6) as a pattern for breaking with idolatry in a family, with a focus on poverty.',
      fr: 'Lit la destruction de l’autel du père de Gédéon (Juges 6) comme un modèle de rupture avec l’idolâtrie familiale, avec un accent sur la pauvreté.',
    },
    editions: {
      fr: mohammed('Renverser les autels d’appauvrissement', 'renverser-les-autels-dappauvrissements'),
    },
  }),
  authorBook({
    id: 'sanogo-neutraliser-la-malediction-de-pauvrete',
    language: 'fr',
    domains: ['freedom'],
    perspective: AFRICAN_PENTECOSTAL,
    topics: ['curses'],
    // Sensitive: curses, and promises about money.
    description: {
      en: 'On poverty as a curse broken in Christ, and on taking responsibility for one’s resources.',
      fr: 'Sur la pauvreté comme malédiction brisée en Christ, et sur la responsabilité de faire fructifier ses ressources.',
    },
    editions: {
      fr: mohammed('Neutraliser la malédiction de pauvreté', 'neutraliser-les-maledictions-de-la-pauvrete'),
    },
  }),

  // ── Held on the christian-living shelf for coming plans ──────────────────
  // The Holy Spirit, anointing and consecration
  later({
    id: 'sanogo-la-3e-presence-de-dieu-l-onction',
    topics: ['holy-spirit'],
    description: {
      en: 'On the anointing as God’s power to act, the third of the ways God is present after his face and his voice.',
      fr: 'Sur l’onction, puissance de Dieu pour agir : la troisième présence de Dieu, après sa face et sa voix.',
    },
    editions: { fr: mohammed('La 3e présence de Dieu : l’onction', 'la-3e-presence-de-dieu-lonction-mohammed-sanogo-version-francaise') },
  }),
  later({
    id: 'sanogo-activer-l-onction-fraiche',
    topics: ['holy-spirit'],
    description: {
      en: 'On receiving and renewing the anointing with respect and preparation.',
      fr: 'Sur l’onction à recevoir et à renouveler, avec respect et préparation.',
    },
    editions: { fr: mohammed('Activer l’onction fraîche', 'activer-lonction-fraiche-mohammed-sanogo-version-francaise') },
  }),
  later({
    id: 'sanogo-attirer-les-differentes-onctions',
    topics: ['holy-spirit', 'holiness'],
    description: {
      en: 'On wholehearted consecration to God and the anointings that go with it.',
      fr: 'Sur une consécration sans réserve à Dieu et les onctions qui l’accompagnent.',
    },
    editions: { fr: mohammed('Attirer les différentes onctions pour une consécration inébranlable', 'attirer-les-differentes-onctions-pour-une-consecration-inebranlable-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-comment-se-consacrer-a-dieu',
    topics: ['holiness', 'spiritual-formation'],
    description: {
      en: 'Distinguishes consecration to God from consecration for God, and why a relationship with Christ comes before fruitfulness.',
      fr: 'Distingue la consécration à Dieu de la consécration pour Dieu, et montre pourquoi la relation avec Christ précède le fruit.',
    },
    editions: { fr: mohammed('Comment se consacrer à Dieu', 'comment-se-consacrer-a-dieu-mohammed-sanogo-version-francaise') },
  }),
  later({
    id: 'sanogo-oint-et-consacre',
    topics: ['calling', 'holiness'],
    description: {
      en: 'On recognising one’s calling and its battles, and the believer’s identity as king, priest and ambassador.',
      fr: 'Sur la reconnaissance de son appel et de ses combats, et l’identité du croyant comme roi, prêtre et ambassadeur.',
    },
    editions: { fr: mohammed('Oint et consacré', 'oint-et-consacre-mohammed-sanogo-version-francaise') },
  }),
  later({
    id: 'sanogo-marcher-devant-la-face-de-dieu',
    topics: ['holiness', 'spiritual-formation'],
    description: {
      en: 'Why people who once knew God’s presence can still fall, and how to live steadily before his face.',
      fr: 'Pourquoi ceux qui ont connu la présence de Dieu peuvent tomber, et comment vivre avec constance devant sa face.',
      es: 'Por qué quienes conocieron la presencia de Dios pueden caer, y cómo vivir con constancia delante de su rostro.',
    },
    editions: {
      fr: mohammed('Marcher devant la face de Dieu', 'marcher-devant-la-face-de-dieu-mohammed-sanogo'),
      es: mohammed('Caminar delante del rostro de Dios', 'caminar-delante-del-rostro-de-dios'),
    },
  }),
  later({
    id: 'sanogo-le-pouvoir-de-marcher-dans-la-saintete',
    topics: ['holiness'],
    description: {
      en: 'On holiness as ongoing consecration, from the blessings of Deuteronomy 28.',
      fr: 'Sur la sainteté comme consécration continue, à partir des bénédictions de Deutéronome 28.',
    },
    editions: { fr: mohammed('Le pouvoir de marcher dans la sainteté', 'le-pouvoir-de-marcher-dans-la-saintete-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-devenir-un-intime-de-dieu',
    topics: ['spiritual-formation', 'prayer'],
    description: {
      en: 'On the intimacy with God through which he reveals himself and shows his glory.',
      fr: 'Sur l’intimité avec Dieu, par laquelle il se révèle et manifeste sa gloire.',
    },
    editions: { fr: mohammed('Devenir un intime de Dieu pour manifester sa gloire', 'devenir-un-intime-de-dieu-pour-manifester-sa-gloire-mohammed-sanogo') },
  }),

  // The fruit of the Spirit ("À son image pour dominer")
  later({
    id: 'sanogo-les-fruits-d-une-vie-ordonnee-la-paix',
    topics: ['character', 'spiritual-formation'],
    description: {
      en: 'On God’s peace as part of being transformed into the image of Christ.',
      fr: 'Sur la paix de Dieu dans la transformation à l’image de Christ.',
    },
    editions: { fr: mohammed('Les fruits d’une vie ordonnée : la paix', 'les-fruits-dune-vie-ordonnee-la-paix-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-les-fruits-d-une-vie-ordonnee-la-joie',
    topics: ['character', 'spiritual-formation'],
    description: {
      en: 'On a joy from God that does not depend on circumstances.',
      fr: 'Sur une joie qui vient de Dieu et ne dépend pas des circonstances.',
    },
    editions: { fr: mohammed('Les fruits d’une vie ordonnée : la joie', 'les-fruits-dune-vie-ordonnee-la-joie-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-le-mystere-de-la-joie-divine',
    topics: ['character', 'spiritual-formation'],
    description: {
      en: 'On joy as a fruit of God’s love at work in the believer.',
      fr: 'Sur la joie comme fruit de l’amour de Dieu à l’œuvre dans le croyant.',
    },
    editions: { fr: mohammed('Le mystère de la joie divine', 'le-mystere-de-la-joie-divine-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-reflete-la-paix-divine',
    topics: ['character', 'spiritual-formation'],
    description: {
      en: 'On acting from God’s rest rather than from inner agitation.',
      fr: 'Sur une action qui naît du repos de Dieu plutôt que de l’agitation intérieure.',
    },
    editions: { fr: mohammed('Reflète la paix divine : vis dans le repos', 'reflete-la-paix-divine-vis-dans-le-repos-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-la-patience-divine',
    topics: ['character', 'spiritual-formation'],
    description: {
      en: 'On patience as the fruit that lets God’s promises ripen in their time.',
      fr: 'Sur la patience, fruit qui laisse mûrir les promesses de Dieu en leur temps.',
    },
    editions: { fr: mohammed('La patience divine pour posséder tes trésors et ressources cachés', 'la-patience-divine-pour-posseder-tes-tresors-et-ressources-caches-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-manifeste-la-bonte-comme-dieu',
    topics: ['character', 'spiritual-formation'],
    description: {
      en: 'On goodness as God’s character at work in good deeds, in two parts.',
      fr: 'Sur la bonté, caractère de Dieu à l’œuvre dans les bonnes œuvres, en deux parties.',
    },
    editions: { fr: mohammed('Manifeste la bonté comme Dieu', 'manifeste-la-bonte-comme-dieu-partie-1') },
  }),
  later({
    id: 'sanogo-la-benignite',
    topics: ['character', 'spiritual-formation'],
    description: {
      en: 'On kindness as God’s character in us, learned through testing, in two parts.',
      fr: 'Sur la bénignité, caractère de Dieu en nous, apprise dans l’épreuve, en deux parties.',
    },
    editions: { fr: mohammed('La bénignité : fondement de la foi de Dieu', 'la-benegnite-fondement-de-la-foi-de-dieu-partie-1') },
  }),
  later({
    id: 'sanogo-la-fidelite',
    topics: ['character', 'spiritual-formation'],
    description: {
      en: 'On faithfulness in small things, in money and in love, in two parts.',
      fr: 'Sur la fidélité dans les petites choses, dans l’argent et dans l’amour, en deux parties.',
    },
    editions: { fr: mohammed('La fidélité pour réaliser de grandes choses pour Dieu', 'la-fidelite-pour-realiser-de-grandes-choses-pour-dieu-partie-1') },
  }),
  later({
    id: 'sanogo-aimer-comme-christ',
    topics: ['character', 'spiritual-formation'],
    description: {
      en: 'On love as the mark of being made in God’s image (1 John 4:7–8).',
      fr: 'Sur l’amour comme marque de l’image de Dieu en nous (1 Jean 4.7-8).',
    },
    editions: { fr: mohammed('Aimer comme Christ', 'aimer-comme-christ-mohammed-sanogo') },
  }),

  // Blessing ("Pleinement béni", from Deuteronomy 28, and "Béni pour bénir")
  later({
    id: 'sanogo-posseder-son-territoire-de-faveur',
    topics: ['blessing'],
    description: {
      en: 'On discerning the place where God means to bless you (Deuteronomy 28:3).',
      fr: 'Sur le discernement du lieu où Dieu veut te bénir (Deutéronome 28.3).',
    },
    editions: { fr: mohammed('Posséder son territoire de faveur', 'posseder-son-territoire-de-faveur-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-benediction-de-la-fecondite-divine',
    topics: ['blessing', 'work'],
    description: {
      en: 'On fruitfulness and productivity as a blessing received in Christ (Deuteronomy 28:4).',
      fr: 'Sur la fécondité et la productivité comme bénédiction reçue en Christ (Deutéronome 28.4).',
    },
    editions: { fr: mohammed('Bénédiction de la fécondité divine', 'benediction-de-la-fecondite-divine-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-la-benediction-de-la-provision-divine',
    topics: ['blessing', 'finances'],
    description: {
      en: 'On God’s provision for physical, spiritual and emotional needs (Deuteronomy 28:5).',
      fr: 'Sur la provision de Dieu pour les besoins physiques, spirituels et affectifs (Deutéronome 28.5).',
    },
    editions: { fr: mohammed('La bénédiction de la provision divine', 'la-benediction-de-la-provision-divine-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-commencer-et-achever-avec-grace',
    topics: ['blessing', 'calling'],
    description: {
      en: 'On the grace to start and finish what God calls you to do.',
      fr: 'Sur la grâce de commencer et d’achever ce que Dieu t’appelle à faire.',
    },
    editions: { fr: mohammed('Commencer et achever avec grâce', 'commencer-et-achever-avec-grace-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-quand-la-benediction-te-poursuit',
    topics: ['blessing'],
    description: {
      en: 'On blessing as something that follows the believer wherever they go.',
      fr: 'Sur la bénédiction qui accompagne le croyant partout où il va.',
    },
    editions: { fr: mohammed('Quand la bénédiction te poursuit', 'quand-la-benediction-te-poursuit-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-vaincre-les-5-types-d-avatars-ennemis',
    topics: ['blessing', 'spiritual-warfare'],
    // Sensitive: spiritual warfare.
    description: {
      en: 'On victory over every kind of adversity and enemy (Deuteronomy 28:7).',
      fr: 'Sur la victoire face à toute forme d’adversité et d’ennemi (Deutéronome 28.7).',
    },
    editions: { fr: mohammed('Vaincre les 5 types d’avatars ennemis', 'vaincre-les-5-types-d-avatars-ennemis') },
  }),
  later({
    id: 'sanogo-la-benediction-de-la-faveur-des-hommes',
    topics: ['blessing'],
    description: {
      en: 'On the favour of others as a grace that opens hearts to you and your plans (Deuteronomy 28:10).',
      fr: 'Sur la faveur des hommes, grâce qui incline les cœurs vers toi et tes projets (Deutéronome 28.10).',
    },
    editions: { fr: mohammed('La bénédiction de la faveur des hommes', 'la-benediction-de-la-faveur-des-hommes-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-la-benediction-de-la-vie-abondante',
    topics: ['blessing'],
    description: {
      en: 'On multiplication and prosperity in every area of life (Deuteronomy 28:11).',
      fr: 'Sur la multiplication et la prospérité à tous égards (Deutéronome 28.11).',
    },
    editions: { fr: mohammed('La bénédiction de la vie abondante', 'la-benediction-de-la-vie-abondante-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-la-benediction-du-ciel-ouvert',
    topics: ['blessing'],
    description: {
      en: 'On grace and access to spiritual things under an open heaven (Deuteronomy 28:12).',
      fr: 'Sur la grâce et l’accès aux réalités spirituelles sous un ciel ouvert (Deutéronome 28.12).',
    },
    editions: { fr: mohammed('La bénédiction du ciel ouvert', 'la-benediction-du-ciel-ouvert-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-la-benediction-de-l-influence',
    topics: ['blessing', 'leadership'],
    description: {
      en: 'On depending on God alone and the influence that follows (Deuteronomy 28:12).',
      fr: 'Sur la dépendance envers Dieu seul et l’influence qui en découle (Deutéronome 28.12).',
    },
    editions: { fr: mohammed('La bénédiction de l’influence', 'la-benediction-de-l-influence-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-la-benediction-de-l-elevation',
    topics: ['blessing'],
    description: {
      en: 'On being “the head and not the tail”: staying above what would pull you under (Deuteronomy 28:13).',
      fr: 'Sur le fait d’être « la tête et non la queue » : rester au-dessus de ce qui voudrait te submerger (Deutéronome 28.13).',
    },
    editions: { fr: mohammed('La bénédiction de l’élévation', 'la-benediction-de-l-elevation') },
  }),
  later({
    id: 'sanogo-sagesses-pour-multiplier-ses-graces',
    topics: ['blessing', 'wisdom'],
    description: {
      en: 'Principles for growing in abundance and passing God’s ways on to one’s household, in two parts.',
      fr: 'Des principes pour grandir dans l’abondance et transmettre les voies de Dieu à sa maison, en deux parties.',
    },
    editions: { fr: mohammed('Sagesses pour multiplier ses grâces', 'sagesses-pour-multiplier-ses-graces-partie-1') },
  }),
  later({
    id: 'sanogo-quand-ta-vie-amene-la-faveur',
    topics: ['blessing', 'mission'],
    description: {
      en: 'On choosing to bring blessing rather than judgement to the places you enter (Joshua 1:3).',
      fr: 'Sur le choix de porter la bénédiction plutôt que le jugement là où tu vas (Josué 1.3).',
    },
    editions: { fr: mohammed('Quand ta vie amène la faveur sur tout lieu que tes pieds foulent', 'quand-ta-vie-amene-la-faveur-sur-tout-lieu-que-tes-pieds-foulent') },
  }),
  later({
    id: 'sanogo-mene-une-vie-fructueuse',
    topics: ['blessing', 'calling'],
    description: {
      en: 'On fruitfulness in every area of life as God’s first mandate (Genesis 1:28).',
      fr: 'Sur une vie féconde à tous égards, premier mandat de Dieu (Genèse 1.28).',
    },
    editions: { fr: mohammed('Mène une vie fructueuse à tous égards', 'mene-une-vie-fructueuse-a-tous-egards') },
  }),
  later({
    id: 'sanogo-source-de-benediction',
    topics: ['blessing', 'curses'],
    // Sensitive: curses.
    description: {
      en: 'On becoming a source of blessing and removing what blocks it, from Isaac’s blessing of Jacob and Esau.',
      fr: 'Sur le fait de devenir une source de bénédiction et d’ôter ce qui la bloque, à partir de la bénédiction d’Isaac sur Jacob et Ésaü.',
    },
    editions: { fr: mohammed('Source de bénédiction : neutralise les blocages dans tes territoires', 'source-de-benediction-neutralise-les-blocages-dans-tes-territoires-mohammed-sanogo') },
  }),

  // Prayer, calling and mission
  later({
    id: 'sanogo-provoquer-la-pluie-d-en-haut',
    topics: ['prayer', 'repentance'],
    description: {
      en: 'On repentance and prayer that open a shut heaven (1 Kings 8:35–36).',
      fr: 'Sur la repentance et la prière qui ouvrent un ciel fermé (1 Rois 8.35-36).',
    },
    editions: {
      fr: mohammed('Provoquer la pluie d’en haut', 'provoquer-la-pluie-den-haut'),
      en: mohammed('Triggering Rain from Above', 'triggering-rain-from-above-mohammed-sanogo-version-francaise-copie'),
    },
  }),
  later({
    id: 'sanogo-recevoir-la-pluie-d-en-haut',
    topics: ['prayer'],
    description: {
      en: 'On the authority Christ gives believers to influence heaven through prayer (Matthew 16:19).',
      fr: 'Sur l’autorité que Christ donne au croyant pour influencer le ciel par la prière (Matthieu 16.19).',
    },
    editions: {
      fr: mohammed('Recevoir la pluie d’en haut', 'recevoir-la-pluie-den-haut'),
      en: mohammed('Receiving Rain from Above', 'receiving-rain-from-above-mohammed-sanogo-english-version'),
    },
  }),
  later({
    id: 'sanogo-insatisfait',
    topics: ['contentment'],
    description: {
      en: 'On the endless chain of wants — a job, marriage, children, possessions — and where satisfaction is really found.',
      fr: 'Sur la chaîne sans fin des désirs — emploi, mariage, enfants, biens — et le vrai lieu de la satisfaction.',
      es: 'Sobre la cadena sin fin de deseos —empleo, matrimonio, hijos, bienes— y dónde se halla la verdadera satisfacción.',
    },
    editions: {
      fr: mohammed('Insatisfait', 'insatisfait-mohammed-sanogo'),
      en: mohammed('Dissatisfied', 'dissatisfied-sanogo-yeregnan-english-version'),
      es: mohammed('Insatisfecho', 'insatisfecho-mohammed-sanogo-version-espanol'),
    },
  }),
  later({
    id: 'sanogo-developper-la-mentalite-de-conquete',
    topics: ['holiness', 'calling'],
    description: {
      en: 'On resisting the world’s influence so as to become a source of blessing (Genesis 12:2).',
      fr: 'Sur la résistance à l’influence du monde pour devenir une source de bénédiction (Genèse 12.2).',
    },
    editions: { fr: mohammed('Développer la mentalité de conquête', 'developper-la-mentalite-de-conquete-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-a-l-assaut',
    topics: ['calling', 'mission'],
    description: {
      en: 'On seeing the problems around you as the task God is calling you to take on (Joshua 11:23).',
      fr: 'Sur les problèmes qui t’entourent comme la tâche que Dieu t’appelle à conquérir (Josué 11.23).',
    },
    editions: { fr: mohammed('À l’assaut', 'a-lassaut') },
  }),
  later({
    id: 'sanogo-12-portes-d-influence',
    topics: ['mission', 'leadership'],
    description: {
      en: 'Twelve spheres of influence through which the gospel can reach a nation.',
      fr: 'Douze sphères d’influence par lesquelles l’Évangile peut atteindre une nation.',
    },
    editions: {
      fr: mohammed('12 portes d’influence pour transformer une nation', '12-portes-dinfluence-pour-transformer-une-nation-broche'),
      en: mohammed('12 Gates of Influence to Transform a Nation', '12-gates-of-influence-to-transform-a-nation-paperback-sanogo-yeregnan-english-version'),
    },
  }),
  later({
    id: 'sanogo-comment-devenir-plus-productif',
    topics: ['work', 'calling'],
    description: {
      en: 'On growing from small beginnings into a productive life (Mark 4:31–32).',
      fr: 'Sur la croissance d’un petit commencement vers une vie productive (Marc 4.31-32).',
    },
    editions: { fr: mohammed('Comment devenir plus productif', 'comment-devenir-plus-productif') },
  }),

  // Wisdom, priorities and order
  later({
    id: 'sanogo-la-lumiere-pour-mieux-gerer-tes-priorites',
    topics: ['work', 'wisdom'],
    description: {
      en: 'On seeking God’s light first, before organising your plans.',
      fr: 'Sur la lumière de Dieu à rechercher d’abord, avant d’organiser ses projets.',
    },
    editions: { fr: mohammed('La lumière pour mieux gérer tes priorités', 'la-lumiere-pour-mieux-gerer-tes-priorites-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-controle-les-petits-chiens',
    topics: ['work', 'wisdom'],
    description: {
      en: 'Biblical principles for managing competing priorities and discerning God’s seasons.',
      fr: 'Des principes bibliques pour gérer des priorités concurrentes et discerner les saisons de Dieu.',
    },
    editions: {
      fr: mohammed('Contrôle les petits chiens pour mieux gérer tes priorités', 'controle-les-petits-chiens-pour-mieux-gere-tes-priorites-mohammed-sanogo-copie'),
      en: mohammed('Control the Little Dogs to Better Manage Your Priorities', 'control-the-little-dogs-to-better-manage-your-priorities-sanogo-yeregnan-english-version'),
    },
  }),
  later({
    id: 'sanogo-comment-bien-organiser-ta-vie',
    topics: ['work', 'wisdom'],
    description: {
      en: 'On ordering your life by God’s order rather than a human one.',
      fr: 'Sur l’organisation de sa vie selon l’ordre divin plutôt que l’ordre humain.',
    },
    editions: { fr: mohammed('Comment bien organiser ta vie ?', 'comment-bien-organiser-ta-vie-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-decouvrir-et-comprendre-la-sagesse-divine',
    topics: ['wisdom'],
    description: {
      en: 'Why intelligence is not enough, and what sets God’s wisdom apart (James 3).',
      fr: 'Pourquoi l’intelligence ne suffit pas, et ce qui distingue la sagesse de Dieu (Jacques 3).',
    },
    editions: { fr: mohammed('Découvrir et comprendre la sagesse divine', 'decouvrir-et-comprendre-la-sagesse-divine-mohammed-sanogo') },
  }),
  later({
    id: 'sanogo-marcher-dans-les-sept-colonnes-de-la-sagesse',
    topics: ['wisdom'],
    description: {
      en: 'On wisdom as something gained by those who seek it, through seven principles.',
      fr: 'Sur la sagesse qui s’acquiert en la cherchant, à travers sept principes.',
    },
    editions: { fr: mohammed('Marcher dans les sept colonnes de la sagesse', 'marcher-dans-les-sept-colonnes-de-la-sagesse-mohammed-sagesse') },
  }),
  later({
    id: 'sanogo-reussir-sa-vie-par-la-sagesse-divine',
    topics: ['wisdom'],
    description: {
      en: 'Continues the seven pillars of wisdom, drawn from the days of creation.',
      fr: 'Suite des sept colonnes de la sagesse, tirées des jours de la création.',
    },
    editions: { fr: mohammed('Réussir sa vie par la sagesse divine', 'reussir-sa-vie-par-la-sagesse-divine-mohammed-sanogo') },
  }),

  // Lilliane Sanogo
  later({
    id: 'lilliane-sanogo-bouillon-de-graces',
    topics: ['spiritual-formation'],
    description: {
      en: 'On God’s love and grace as the answer to a confused age.',
      fr: 'Sur l’amour et la grâce de Dieu comme réponse à une époque de confusion.',
    },
    editions: { fr: lilliane('Bouillon de grâces', 'bouillon-de-graces-lilliane-sanogo') },
  }),
  later({
    id: 'lilliane-sanogo-lumiere-de-sagesse-pour-une-femme',
    topics: ['wisdom', 'blessing'],
    description: {
      en: 'Draws on the midwives Shiphrah and Puah (Exodus 1) for a wisdom that brings blessing in dark times.',
      fr: 'S’inspire des sages-femmes Schiphra et Pua (Exode 1) pour une sagesse qui porte la bénédiction dans les temps sombres.',
    },
    editions: { fr: lilliane('Lumière de sagesse et de bénédiction pour une femme', 'lumiere-de-sagesse-et-de-benediction-pour-une-femme-mohammed-sanogo') },
  }),
];
