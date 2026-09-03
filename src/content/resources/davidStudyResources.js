// Verified links are NOT human editorial approval. These candidates remain
// excluded by the shared resolver until a curator reviews and publishes them.
// No embedded third-party media, invented translations or copied article text.
const L = (en, fr) => ({ en, fr });
const edition = (title, author, publisher, url) => ({ title, author, publisher, url, available: true, lastVerifiedAt: '2026-09-03' });

export const DAVID_STUDY_RESOURCES = [
  {
    id: 'cdf-origins-monarchy-2026', type: 'study', originalLanguage: 'fr', status: 'needs_review', reviewLevel: 'sensitive',
    topics: ['david', 'ancient-israel', 'kingship', 'biblical-narrative', 'ancient-worship'], lifeStages: [],
    description: L('Academic lectures on Samuel, the early monarchy and David; historical-critical reconstructions must be distinguished from established facts and theological interpretation.', 'Cours universitaires sur Samuel, la première monarchie et David ; distinguer les reconstructions historico-critiques, les faits établis et l’interprétation théologique.'),
    editions: { fr: edition('Les origines de la monarchie israélite : Saül, David et Salomon', 'Thomas Römer', 'Collège de France', 'https://www.college-de-france.fr/fr/agenda/cours/les-origines-de-la-monarchie-israelite-saul-david-et-salomon') },
  },
  {
    id: 'jewish-museum-tel-dan', type: 'article', originalLanguage: 'en', status: 'needs_review',
    topics: ['biblical-archaeology', 'kingship'], lifeStages: [],
    description: L('Ninth-century BCE inscription referring to the House of David: evidence of a named dynasty, not independent confirmation of every episode in David’s life.', 'Inscription du IXe siècle av. J.-C. évoquant la maison de David : témoignage d’une dynastie nommée, non confirmation indépendante de chaque épisode de sa vie.'),
    editions: { en: edition('Tel Dan Stele', 'The Jewish Museum', 'The Jewish Museum', 'https://thejewishmuseum.org/exhibitions/tel-dan-stele/') },
  },
  {
    id: 'louvre-mesha-stele', type: 'article', originalLanguage: 'fr', status: 'needs_review',
    topics: ['biblical-archaeology', 'kingship'], lifeStages: [],
    description: L('Museum record for the ninth-century BCE Moabite royal inscription; later than David, it illuminates royal accounts of conflict rather than his personal character.', 'Notice de l’inscription royale moabite du IXe siècle av. J.-C. ; postérieure à David, elle éclaire les récits royaux de conflit, non son caractère personnel.'),
    editions: { fr: edition('Stèle de Mesha', 'Musée du Louvre, Département des Antiquités orientales', 'Musée du Louvre', 'https://collections.louvre.fr/ark:/53355/cl010120339') },
  },
  {
    id: 'mesha-reading-hypothetical', type: 'article', originalLanguage: 'en', status: 'needs_review',
    topics: ['biblical-archaeology'], lifeStages: [],
    description: L('Epigraphists explain why reading House of David on Mesha remains uncertain; read alongside the defence of that reading, not as a settled verdict.', 'Des épigraphistes expliquent pourquoi la lecture maison de David sur Mésha reste incertaine ; à lire avec sa défense, non comme un verdict définitif.'),
    editions: { en: edition('Why Mesha’s “House of David” Remains Hypothetical', 'Matthieu Richelle and Andrew Burlingame', 'Biblical Archaeology Society', 'https://www.biblicalarchaeology.org/daily/biblical-artifacts/inscriptions/mesha-stele/why-meshas-house-of-david-remains-hypothetical/') },
  },
  {
    id: 'mesha-reading-defence', type: 'article', originalLanguage: 'en', status: 'needs_review',
    topics: ['biblical-archaeology'], lifeStages: [],
    description: L('A defence of the proposed House of David reading on Mesha using photographs and the squeeze; the conclusion is contested, so compare the published objections.', 'Défense de la lecture proposée maison de David sur Mésha à partir des photographies et de l’estampage ; conclusion contestée, à confronter aux objections publiées.'),
    editions: { en: edition('Defending the “House of David”', 'André Lemaire and Jean-Philippe Delorme', 'Biblical Archaeology Society', 'https://www.biblicalarchaeology.org/daily/biblical-artifacts/inscriptions/defending-the-house-of-david/') },
  },
  {
    id: 'daahl-atlas', type: 'study', originalLanguage: 'en', status: 'needs_review',
    topics: ['biblical-geography', 'ancient-israel'], lifeStages: [],
    description: L('Archaeological atlas for locating sites and comparing periods; site identification and mapped remains do not establish David’s exact journeys or ancient borders.', 'Atlas archéologique pour situer les sites et comparer les périodes ; leurs vestiges ne déterminent pas à eux seuls les itinéraires exacts de David ni les frontières anciennes.'),
    editions: { en: edition('The Digital Archaeological Atlas of the Holy Land', 'DAAHL project', 'Digital Archaeological Atlas of the Holy Land', 'https://gaialab.terrawatchers.org/DAAHL/Home.php') },
  },
  {
    id: 'british-museum-philistine-pottery', type: 'article', originalLanguage: 'en', status: 'needs_review',
    topics: ['philistines'], lifeStages: [],
    description: L('A pottery sherd with Philistine-style painted decoration illustrates material culture; it is not an object linked to Goliath or proof of the duel.', 'Un tesson au décor peint de style philistin illustre une culture matérielle ; il ne s’agit ni d’un objet lié à Goliath ni d’une preuve du duel.'),
    editions: { en: edition('vessel', 'British Museum', 'British Museum', 'https://www.britishmuseum.org/collection/object/W_1927-0411-125') },
  },
  {
    id: 'iaa-qeiyafa-2013', type: 'article', originalLanguage: 'en', status: 'needs_review',
    topics: ['philistines', 'biblical-archaeology'], lifeStages: [],
    description: L('Excavation report on a fortified site near the Valley of Elah; distinguish excavated remains and dating from the excavators’ debated political identification.', 'Rapport de fouille d’un site fortifié proche de la vallée d’Éla ; distinguer vestiges et datation de l’identification politique discutée proposée par les fouilleurs.'),
    editions: { en: edition('Khirbat Qeiyafa – 2013', 'Yossi Garfinkel and Sa‘ar Ganor', 'Israel Antiquities Authority — Hadashot Arkheologiyot', 'https://hadashot.iaa.org.il/report_detail_eng.aspx?id=10576&mag_id=121') },
  },
  {
    id: 'tau-ancient-jerusalem', type: 'article', originalLanguage: 'en', status: 'needs_review',
    topics: ['biblical-geography', 'ancient-worship'], lifeStages: [],
    description: L('Research programme on Jerusalem’s households, fortifications and growth across several periods; later remains must not be presented as David’s city without dating evidence.', 'Programme de recherche sur les habitats, fortifications et développements de Jérusalem à plusieurs époques ; ne pas attribuer les vestiges postérieurs à David sans preuve de datation.'),
    editions: { en: edition('Exploring Ancient Jerusalem – City of David', 'Yuval Gadot', 'Tel Aviv University, Institute of Archaeology', 'https://en-humanities.tau.ac.il/Archaeology/excavations%26projects/currentexcavations/cityofdavid') },
  },
];
