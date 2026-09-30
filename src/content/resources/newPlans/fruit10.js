// Candidates for fruit10 (The Fruit of the Spirit), researched 2026-09-29. NONE
// is approved: every entry is needs_review with no sign-off, so the resolver
// never shows it. See docs/resources/candidates/fruit10.md for the verification
// worksheet.
//
// Shelf: domain `christian-living`, shared by the seven "Growing in Christ"
// plans. Topics follow the plan's real day topics (fruit-of-the-spirit on every
// day; holy-spirit days 1 and 10; character 2/5/8; holiness 7/10; …). No
// manhood/womanhood tags.
const V = '2026-09-29';
const bp = (title, url, publisher = 'BibleProject') => ({
  title, author: 'BibleProject', publisher, url, available: true, lastVerifiedAt: V,
});
const gq = (title, url) => ({
  title, author: 'GotQuestions.org', publisher: 'Got Questions Ministries', url, available: true, lastVerifiedAt: V,
});

export const FRUIT10_CANDIDATES = [
  {
    id: 'wright-cultivating-the-fruit-of-the-spirit',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'character'],
    perspective: ['evangelical', 'anglican'],
    status: 'needs_review',
    description: {
      en: 'Nine short chapters, one per quality in Galatians 5, by an Old Testament scholar and Langham pastor: the fruit as the Spirit growing Christ’s likeness in us, between legalism and licence, with questions for reflection.',
      fr: 'Neuf courts chapitres, un par qualité de Galates 5, par un bibliste et pasteur de Langham : le fruit comme l’Esprit qui forme en nous la ressemblance du Christ, loin du légalisme comme du laxisme, avec des questions de réflexion.',
    },
    editions: {
      en: { title: 'Cultivating the Fruit of the Spirit: Growing in Christlikeness', author: 'Christopher J. H. Wright', publisher: 'IVP', url: 'https://www.ivpress.com/cultivating-the-fruit-of-the-spirit', available: true, lastVerifiedAt: V },
      es: { title: 'Ser como Jesús', author: 'Christopher J. H. Wright', publisher: 'Ediciones Puma', url: 'https://edicionespuma.org/product/ser-como-jesus/', available: true, lastVerifiedAt: V },
      pt: { title: 'Aprendendo a viver como Jesus', author: 'Christopher J. H. Wright', publisher: 'Editora Mundo Cristão', url: 'https://www.mundocristao.com.br/produto/aprendendo-a-viver-como-jesus/', available: true, lastVerifiedAt: V },
    },
  },
  {
    id: 'bridges-practice-of-godliness',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['character', 'holiness', 'fruit-of-the-spirit', 'contentment'],
    perspective: ['evangelical', 'reformed'],
    status: 'needs_review',
    description: {
      en: 'The sequel to The Pursuit of Holiness: devotion to God comes first, then Christlike character (humility, contentment, joy, self-control and more) grown by grace, with a study guide.',
      fr: 'La suite de « The Pursuit of Holiness » : l’attachement à Dieu d’abord, puis un caractère semblable au Christ (humilité, contentement, joie, maîtrise de soi…) que la grâce fait grandir, avec un guide d’étude.',
    },
    editions: {
      en: { title: 'The Practice of Godliness', author: 'Jerry Bridges', publisher: 'NavPress', url: 'https://www.tyndale.com/p/the-practice-of-godliness/9781631465949', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Language hubs (ru … am) list the video by title; the per-video pages
    // exist only for en/fr/es/pt. fa: the Persian hub labels BOTH the Galatians
    // slot and the Colossians slot "مروری بر غلاطیان" (two different videos);
    // the edition below is the Galatians slot — a reviewer should play it once.
    id: 'bibleproject-galatians-overview',
    type: 'video',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'spiritual-formation'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A free nine-minute animated overview of Galatians: saved by the gospel rather than by the Torah, one multi-ethnic family, and the Spirit who empowers love — the setting of Galatians 5.',
      fr: 'Un panorama animé gratuit de neuf minutes sur Galates : sauvés par l’Évangile et non par la Torah, une seule famille issue de tous les peuples, et l’Esprit qui rend capable d’aimer — le cadre de Galates 5.',
    },
    editions: {
      en: bp('Galatians', 'https://bibleproject.com/videos/galatians/'),
      fr: bp('Galates', 'https://bibleproject.com/fr/videos/galates/'),
      es: bp('Gálatas', 'https://bibleproject.com/es/videos/galatas/'),
      pt: bp('Resumo do livro de Gálatas', 'https://bibleproject.com/pt-br/videos/galatas/'),
      de: bp('Galater', 'https://bibleproject.visiomedia.org/video/galater/', 'BibleProject – Deutsch (Visiomedia)'),
      ru: bp('Обзор: Галатам', 'https://bibleproject.com/ru/'),
      zh: bp('加拉太书 - Galatians', 'https://bibleproject.com/zh-hans/'),
      ja: bp('ガラテヤ人への手紙 Galatians【概観】', 'https://bibleproject.com/ja/'),
      ko: bp('갈라디아서 개요 Galatians', 'https://bibleproject.com/ko/'),
      ar: bp('نظرة عامّة: الرسالة إلى غلاطية', 'https://bibleproject.com/ar/'),
      fa: bp('مروری بر غلاطیان', 'https://bibleproject.com/fa/'),
      hi: bp('अवलोकन: गलातियों Galatians', 'https://bibleproject.com/hi/'),
      id: bp('Ringkasan: Galatia', 'https://bibleproject.com/id/'),
      sw: bp('Muhtasari: Wagalatia', 'https://bibleproject.com/sw/'),
      tl: bp('Buong-ideya: Galacia', 'https://bibleproject.com/tl/'),
      am: bp('ዳሰሳ፦ ገላቲያ', 'https://bibleproject.com/am/'),
    },
  },
  {
    // A word study for day 4 (peace). Part of BibleProject's Advent series;
    // the other language hubs were not checked for it.
    id: 'bibleproject-shalom-peace',
    type: 'video',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'conflict'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A free four-minute word study: biblical shalom is not only the absence of conflict but wholeness restored in Jesus, who reconciles divided people and calls them to unity with humility, gentleness and patience.',
      fr: 'Une étude de mot gratuite de quatre minutes : le shalom biblique n’est pas seulement l’absence de conflit mais une plénitude rétablie en Jésus, qui réconcilie les divisés et les appelle à l’unité dans l’humilité, la douceur et la patience.',
    },
    editions: {
      en: bp('Shalom / Peace', 'https://bibleproject.com/videos/shalom-peace/'),
      fr: bp('Shalom / Paix', 'https://bibleproject.com/fr/videos/shalom-paix/'),
      es: bp('Shalom / Paz', 'https://bibleproject.com/es/videos/shalom-paz/'),
      pt: bp('Shalom / Paz', 'https://bibleproject.com/pt-br/videos/shalom-paz/'),
    },
  },
  {
    id: 'stott-message-of-galatians',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'holiness'],
    perspective: ['evangelical', 'anglican'],
    status: 'needs_review',
    description: {
      en: 'A classic, readable passage-by-passage exposition of Galatians (revised edition): one way to God through Christ, and the Spirit-led life of love that flows from it in chapters 5–6.',
      fr: 'Une exposition classique et accessible de Galates, passage par passage (édition révisée) : un seul chemin vers Dieu par le Christ, et la vie d’amour conduite par l’Esprit qui en découle aux chapitres 5 et 6.',
    },
    editions: {
      en: { title: 'The Message of Galatians (The Bible Speaks Today)', author: 'John Stott', publisher: 'IVP Academic', url: 'https://www.ivpress.com/the-message-of-galatians', available: true, lastVerifiedAt: V },
    },
  },
  {
    id: 'ligonier-what-is-the-fruit-of-the-spirit',
    type: 'article',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit'],
    perspective: ['reformed'],
    status: 'needs_review',
    description: {
      en: 'A short, free article on the nine graces of Galatians 5:22-23 as the Spirit’s work that grows over time, “not a to-do list” — a good first read for day 1.',
      fr: 'Un court article gratuit sur les neuf grâces de Galates 5.22-23, œuvre de l’Esprit qui mûrit avec le temps et non liste de choses à faire — une bonne première lecture pour le jour 1.',
    },
    editions: {
      en: { title: 'What Is the Fruit of the Spirit?', author: 'Jonathan Landry Cruse', publisher: 'Ligonier Ministries', url: 'https://learn.ligonier.org/articles/what-is-the-fruit-of-the-holy-spirit', available: true, lastVerifiedAt: V },
      es: { title: '¿Qué es el fruto del Espíritu?', author: 'Jonathan L. Cruse', publisher: 'Ministerios Ligonier', url: 'https://es.ligonier.org/articulos/que-es-el-fruto-del-espiritu/', available: true, lastVerifiedAt: V },
      zh: { title: '圣灵的果子是什么？', author: 'Jonathan Cruse', publisher: 'Ligonier Ministries (中文)', url: 'https://zh.ligonier.org/sc/articles/what-is-the-fruit-of-the-spirit/', available: true, lastVerifiedAt: V },
    },
  },
  {
    id: 'rossi-obra-del-espiritu-santo-segun-galatas',
    type: 'article',
    originalLanguage: 'es',
    domains: ['christian-living'],
    topics: ['holy-spirit', 'fruit-of-the-spirit', 'holiness'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A Dominican Baptist writer traces the Spirit’s work through Galatians: sons by faith, walking by the Spirit, and fruit that reflects Christ — with a warning against seeking holiness by legalistic effort. In Spanish.',
      fr: 'Un auteur baptiste dominicain suit l’œuvre de l’Esprit à travers Galates : fils par la foi, marche par l’Esprit, fruit qui reflète le Christ — et met en garde contre une sainteté recherchée par l’effort légaliste. En espagnol.',
    },
    editions: {
      es: { title: 'La obra del Espíritu Santo según Gálatas', author: 'Fabio Rossi', publisher: 'Coalición por el Evangelio', url: 'https://www.coalicionporelevangelio.org/articulo/la-obra-del-espiritu-santo-segun-galatas/', available: true, lastVerifiedAt: V },
    },
  },
  {
    id: 'charriere-le-fruit-de-l-esprit',
    type: 'article',
    originalLanguage: 'fr',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'character'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A French-language magazine article walking through the nine qualities as the result of the Spirit’s presence rather than our own efforts, a fruit that ripens slowly, often through trials. In French.',
      fr: 'Un article de la revue Promesses qui parcourt les neuf qualités comme le fruit de la présence de l’Esprit et non de nos efforts, un fruit qui mûrit lentement, souvent à travers l’épreuve.',
    },
    editions: {
      fr: { title: 'Le fruit de l’Esprit', author: 'Pierre-Yves Charrière', publisher: 'Promesses (revue, n° 180)', url: 'https://promesses.org/le-fruit-de-lesprit/', available: true, lastVerifiedAt: V },
    },
  },
  {
    id: 'vollkommer-frucht-die-nach-gott-schmeckt',
    type: 'book',
    originalLanguage: 'de',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'character', 'spiritual-formation'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A book written in German with one chapter per quality of Galatians 5:22-23, each defined from Scripture and made concrete through Bible stories and everyday life.',
      fr: 'Un livre écrit en allemand, un chapitre par qualité de Galates 5.22-23, chacune définie à partir de l’Écriture et rendue concrète par des récits bibliques et la vie quotidienne.',
    },
    editions: {
      de: { title: 'Frucht, die nach Gott schmeckt: Wie Gott in unserem Leben sichtbar wird', author: 'Nicola Vollkommer', publisher: 'SCM Hänssler', url: 'https://www.scm-shop.de/frucht-die-nach-gott-schmeckt.html', available: true, lastVerifiedAt: V },
    },
  },
  {
    id: 'lopes-galatas-carta-da-liberdade-crista',
    type: 'book',
    originalLanguage: 'pt',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'holiness'],
    perspective: ['reformed', 'evangelical'],
    status: 'needs_review',
    description: {
      en: 'An expository commentary on Galatians by a Brazilian Presbyterian pastor: freedom in Christ against both legalism and licence, a freedom that leads to love and life in the Spirit. In Portuguese.',
      fr: 'Un commentaire d’exposition sur Galates par un pasteur presbytérien brésilien : la liberté en Christ face au légalisme comme au laxisme, une liberté qui conduit à l’amour et à la vie par l’Esprit. En portugais.',
    },
    editions: {
      pt: { title: 'Gálatas: A carta da liberdade cristã (Comentários Expositivos Hagnos)', author: 'Hernandes Dias Lopes', publisher: 'Hagnos', url: 'https://www.hagnos.com.br/galatas-comentarios-expositivos-hagnos', available: true, lastVerifiedAt: V },
    },
  },
  {
    id: 'lohmann-der-heilige-geist-und-seine-frucht',
    type: 'teaching',
    originalLanguage: 'de',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'spiritual-formation'],
    perspective: ['reformed', 'evangelical'],
    status: 'needs_review',
    description: {
      en: 'A free conference talk by a Hamburg pastor on Galatians 5:16-26: freed by grace alone, not free to sin, and led by the Spirit whose fruit matters even more than his gifts. In German.',
      fr: 'Une conférence gratuite d’un pasteur de Hambourg sur Galates 5.16-26 : libérés par la seule grâce, non pour pécher, et conduits par l’Esprit dont le fruit compte plus encore que les dons. En allemand.',
    },
    editions: {
      de: { title: 'Der Heilige Geist und seine Frucht', author: 'Matthias Lohmann', publisher: 'Evangelium21', url: 'https://www.evangelium21.net/media/4751/der-heilige-geist-und-seine-frucht', available: true, lastVerifiedAt: V },
    },
  },
  {
    // A Pentecostal classic (1928) by the British Assemblies of God leader.
    // The English revised edition's Gospel Publishing House page returned 410
    // Gone, so only the French edition is recorded.
    id: 'gee-fruit-of-the-spirit',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'holiness'],
    perspective: ['pentecostal'],
    status: 'needs_review',
    description: {
      en: 'A short Pentecostal classic that holds spiritual gifts and the fruit of the Spirit together, and presents holiness as the natural fruit of the Spirit’s work rather than the product of our works. In French.',
      fr: 'Un court classique pentecôtiste qui tient ensemble les dons spirituels et le fruit de l’Esprit, et présente la sainteté comme le fruit naturel de l’œuvre de l’Esprit plutôt que le produit de nos œuvres.',
    },
    editions: {
      fr: { title: 'Le fruit de l’Esprit', author: 'Donald Gee', publisher: 'Viens & Vois', url: 'https://viensetvois.fr/produit/le-fruit-de-l-esprit/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Only the free Spanish page is recorded. The English lecture
    // (learn.ligonier.org/series/foundations/the-fruit-of-the-holy-spirit,
    // 24 min) was opened but is locked behind a Ligonier account.
    id: 'sproul-fruit-of-the-holy-spirit',
    type: 'teaching',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'spiritual-formation'],
    perspective: ['reformed'],
    status: 'needs_review',
    description: {
      en: 'A free video lecture with transcript in which R. C. Sproul walks through Galatians 5:16-26: the Spirit’s chief aim is to apply the gospel, so growth is measured by fruit rather than by spectacular gifts. In Spanish.',
      fr: 'Une conférence vidéo gratuite, avec transcription, où R. C. Sproul parcourt Galates 5.16-26 : le but premier de l’Esprit est d’appliquer l’Évangile, si bien que la croissance se mesure au fruit plutôt qu’aux dons spectaculaires. En espagnol.',
    },
    editions: {
      es: { title: 'El fruto del Espíritu (Fundamentos III)', author: 'R. C. Sproul', publisher: 'Ministerios Ligonier', url: 'https://es.ligonier.org/videos/fundamentos-iii/el-fruto-del-espiritu/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Pentecostal voice. Presents Spirit baptism (as a distinct experience)
    // as increasing the capacity for Christlike character — a disputed
    // subsequence view stated as settled; flagged for the theology reviewer.
    // Opened via firecrawl (WebFetch 403). Canonical og:url is
    // /en/article-repository/news/2021/05/credibility-the-fruit-of-the-spirit-in-witness.
    id: 'ag-credibility-fruit-of-the-spirit-in-witness',
    type: 'article',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'spirit-baptism'],
    perspective: ['pentecostal'],
    status: 'needs_review',
    description: {
      en: 'An Assemblies of God article: alongside boldness to speak, the Spirit forms the character of Jesus in believers, and that quiet fruit — not self-effort — is what makes a witness credible.',
      fr: 'Un article des Assemblées de Dieu : en plus de l’audace pour témoigner, l’Esprit forme le caractère de Jésus dans les croyants, et ce fruit discret — non l’effort personnel — rend le témoignage crédible.',
    },
    editions: {
      en: { title: 'Credibility – the Fruit of the Spirit in Witness', author: 'Randy Hurst', publisher: 'Assemblies of God (AG News)', url: 'https://news.ag.org/en/features/credibility-the-fruit-of-the-spirit-in-witness', available: true, lastVerifiedAt: V },
    },
  },
  {
    // The publisher lists editions in ko, pt, id, pl, nl, es, de; only es was
    // opened and verified (Poiema; Shopify .js shows available: true).
    id: 'keller-galatians-for-you',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit', 'holiness'],
    perspective: ['reformed', 'evangelical'],
    status: 'needs_review',
    description: {
      en: 'An accessible expository guide to Galatians, usable as daily reading with reflection questions: freedom in the gospel, walking by the Spirit (5:13-26) and bearing one another’s burdens (6:1-10).',
      fr: 'Un guide d’exposition accessible sur Galates, utilisable en lecture quotidienne avec des questions : la liberté de l’Évangile, marcher par l’Esprit (5.13-26) et porter les fardeaux les uns des autres (6.1-10).',
    },
    editions: {
      en: { title: 'Galatians For You', author: 'Timothy Keller', publisher: 'The Good Book Company', url: 'https://www.thegoodbook.co.uk/galatians-for-you', available: true, lastVerifiedAt: V },
      es: { title: 'Gálatas para ti', author: 'Timothy Keller', publisher: 'Poiema Publicaciones', url: 'https://poiema.co/products/galatas-para-ti', available: true, lastVerifiedAt: V },
    },
  },
  {
    // The EN page links a separate short article for each of the nine
    // qualities (e.g. /fruit-Holy-Spirit-patience.html), useful per day; only
    // the overview is recorded here. Translations are Got Questions' own.
    id: 'gotquestions-fruit-of-the-holy-spirit',
    type: 'article',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['fruit-of-the-spirit', 'holy-spirit'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A short, free answer on Galatians 5:22-23: the nine qualities as the Spirit’s work in a believer, set against the works of the flesh — with a separate page for each quality.',
      fr: 'Une réponse courte et gratuite sur Galates 5.22-23 : les neuf qualités comme l’œuvre de l’Esprit dans le croyant, face aux œuvres de la chair.',
    },
    editions: {
      en: gq('What is the fruit of the Holy Spirit?', 'https://www.gotquestions.org/fruit-of-the-Holy-Spirit.html'),
      fr: gq('Quels sont les fruits de l’Esprit ?', 'https://www.gotquestions.org/Francais/fruit-lEsprit.html'),
      es: gq('¿Qué es el fruto del Espíritu?', 'https://www.gotquestions.org/Espanol/fruto-Espiritu.html'),
      pt: gq('O que é o fruto do Espírito Santo?', 'https://www.gotquestions.org/Portugues/fruto-do-Espirito.html'),
      de: gq('Was ist die Frucht des Heiligen Geistes?', 'https://www.gotquestions.org/Deutsch/Frucht-des-Geistes.html'),
      ru: gq('Что такое плод Святого Духа?', 'https://www.gotquestions.org/Russian/Russian-fruit-Spirit.html'),
      zh: gq('什么是圣灵的果子？', 'https://www.gotquestions.org/Chinese/Chinese-fruit-Spirit.html'),
      ja: gq('聖霊の実とは何ですか？', 'https://www.gotquestions.org/Japanese/Japanese-fruit-Spirit.html'),
      ko: gq('성령의 열매란 무엇인가?', 'https://www.gotquestions.org/Korean/Korean-fruit-of-the-Holy-Spirit.html'),
      id: gq('Apakah buah Roh Kudus?', 'https://www.gotquestions.org/Indonesia/buah-Roh.html'),
      ar: gq('ما هو ثمر الروح القدس؟', 'https://www.gotquestions.org/Arabic/Arabic-fruit-Spirit.html'),
      fa: gq('میوه روح القدس چیست؟', 'https://www.gotquestions.org/Farsi/Farsi-fruit-spirit.html'),
      hi: gq('पवित्र आत्मा का फल क्या है?', 'https://www.gotquestions.org/Hindi/Hindi-fruit-Spirit.html'),
      sw: gq('Matunda ya Roho Mtakatifu ni gani?', 'https://www.gotquestions.org/Kiswahili/Matunda-ya-Roho.html'),
      am: gq('የመንፈስ ቅዱስ ፍሬ ምንድነው?', 'https://www.gotquestions.org/Amharic/Amharic-fruit-of-the-Holy-Spirit.html'),
    },
  },
];
