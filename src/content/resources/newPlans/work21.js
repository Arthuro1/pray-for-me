// Candidates for work21 (Work, Calling & Faithfulness), researched 2026-09-29.
// NONE is approved: every entry is needs_review with no sign-off, so the
// resolver never shows it. See docs/resources/candidates/work21.md for the
// verification worksheet.
//
// Shelf: domain `christian-living`, shared by the seven "Growing in Christ"
// plans. Topics follow the plan's real day topics (work, calling, character,
// finances, generosity, leadership, sabbath, justice, …). No manhood/womanhood
// tags; `blessing` avoided on purpose (it pulls prosperity-leaning titles).
const V = '2026-09-29';
const bp = (title, url, publisher = 'BibleProject') => ({
  title, author: 'BibleProject', publisher, url, available: true, lastVerifiedAt: V,
});

export const WORK21_CANDIDATES = [
  {
    id: 'keller-every-good-endeavor',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['work', 'calling'],
    perspective: ['evangelical', 'reformed'],
    status: 'needs_review',
    description: {
      en: 'A pastor and a former executive trace work from creation through the Fall to the gospel: why all honest work matters to God, why it frustrates us, and how to serve others without making a career an idol.',
      fr: 'Un pasteur et une ancienne dirigeante d’entreprise suivent le travail de la création à la chute puis à l’Évangile : pourquoi tout travail honnête compte pour Dieu, pourquoi il nous frustre, et comment servir sans faire de sa carrière une idole.',
    },
    editions: {
      en: { title: 'Every Good Endeavor: Connecting Your Work to God’s Work', author: 'Timothy Keller with Katherine Leary Alsdorf', publisher: 'Penguin Books (Penguin Random House)', url: 'https://www.penguinrandomhouse.com/books/307223/every-good-endeavor-by-timothy-keller-with-katherine-leary-alsdorf/', available: true, lastVerifiedAt: V },
      fr: { title: 'Dieu dans mon travail', author: 'Timothy Keller et Katherine Leary Alsdorf', publisher: 'Ourania (La Maison de la Bible)', url: 'https://maisonbible.fr/fr/9965-dieu-dans-mon-travail-9782940335879.html', isbn: '9782940335879', available: true, lastVerifiedAt: V },
      de: { title: 'Berufung: Eine neue Sicht für unsere Arbeit', author: 'Timothy Keller und Katherine Leary Alsdorf', publisher: 'Brunnen Verlag', url: 'https://brunnen-verlag.de/193371/berufung.html', available: true, lastVerifiedAt: V },
      es: { title: 'Toda buena obra', author: 'Timothy Keller', publisher: 'B&H Español', url: 'https://www.bhpublishinggroup.com/product/toda-buena-obra-2/toda-buena-obra/', isbn: '9781462791798', available: true, lastVerifiedAt: V },
      pt: { title: 'Como integrar fé e trabalho: nossa profissão a serviço do reino de Deus', author: 'Timothy Keller e Katherine Leary Alsdorf', publisher: 'Edições Vida Nova', url: 'https://www.vidanova.com.br/livros/como-integrar-fe-e-trabalho-nossa-profissao-a-servico-do-reino-de-deus', isbn: '9788527505741', available: true, lastVerifiedAt: V },
      ko: { title: '팀 켈러의 일과 영성', author: '팀 켈러 (Timothy Keller)', publisher: '두란노 (Duranno)', url: 'https://www.duranno.com/books/view/bookdetail.asp?bcod=5497', isbn: '9788953119901', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Free. Board-adopted TOW overview (David Kim, Leah Archibald). Covers
    // Deuteronomy 5 (Sabbath as release from slavery) and Romans 14:5-6
    // (Christians differ on weekly observance) — matches day 20's even-handed note.
    id: 'theologyofwork-rest-and-work',
    type: 'article',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['sabbath', 'work', 'spiritual-rhythms', 'trust'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A free overview of what the whole Bible says about rest: why we need it, why the Fall makes it hard, why distrust keeps us working, and how Christ frees us to keep a rhythm of work and rest as a gift, not a burden.',
      fr: 'Un panorama gratuit de ce que toute la Bible dit du repos : pourquoi nous en avons besoin, pourquoi la chute le rend difficile, pourquoi la méfiance nous fait travailler sans fin, et comment le Christ nous libère pour vivre un rythme de travail et de repos comme un don, non un fardeau.',
    },
    editions: {
      en: { title: 'Balancing Rhythms of Rest and Work (Overview)', author: 'Theology of Work Project', publisher: 'Theology of Work Project', url: 'https://www.theologyofwork.org/key-topics/rest-and-work-overview/', available: true, lastVerifiedAt: V },
      es: { title: 'Equilibrio en los ritmos de descanso y trabajo: Panorama', author: 'Proyecto Teología del Trabajo', publisher: 'Theology of Work Project', url: 'https://www.teologiadeltrabajo.org/temas-clave/equilibrio-en-los-ritmos-de-descanso-y-trabajo-panorama', available: true, lastVerifiedAt: V },
      id: { title: 'Menyelaraskan Irama Istirahat dan Kerja (Tinjauan Umum)', author: 'Theology of Work Project', publisher: 'Theology of Work Project (Teologi Kerja)', url: 'https://www.teologikerja.org/topik-utama/menyelaraskan-irama-istirahat-dan-kerja-tinjauan-umum/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Free, board-adopted TOW overview (William Messenger, 2010), on TOW's own
    // es/zh-hans/id/ko sites. Directly supports day 11: "the calling to follow
    // Christ lies at the root of every other calling"; unpaid work included.
    id: 'theologyofwork-calling-and-vocation',
    type: 'article',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['calling', 'discernment', 'work'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A free overview of calling in the Bible: first a call to belong to Christ, then the call to work, paid or unpaid; guidance is discerned through needs, gifts and desires with prayer and the counsel of others, not by finding one hidden job.',
      fr: 'Un panorama gratuit de l’appel dans la Bible : d’abord l’appel à appartenir au Christ, puis l’appel à travailler, rémunéré ou non ; la direction se discerne par les besoins, les dons et les désirs, dans la prière et le conseil d’autrui, non en cherchant un emploi caché.',
    },
    editions: {
      en: { title: 'Calling & Vocation (Overview)', author: 'William Messenger (Theology of Work Project)', publisher: 'Theology of Work Project', url: 'https://www.theologyofwork.org/key-topics/vocation-overview-article/', available: true, lastVerifiedAt: V },
      es: { title: 'Llamado: una perspectiva bíblica', author: 'William Messenger (Proyecto Teología del Trabajo)', publisher: 'Theology of Work Project', url: 'https://www.teologiadeltrabajo.org/temas-clave/llamado', available: true, lastVerifiedAt: V },
      zh: { title: '从圣经的角度看召命', author: 'Theology of Work Project（工作神学）', publisher: 'Theology of Work Project', url: 'https://zh-hans.theologyofwork.org/key-topics/vocation-overview-article', available: true, lastVerifiedAt: V },
      id: { title: 'Panggilan & Vokasi (Tinjauan Umum)', author: 'Theology of Work Project', publisher: 'Theology of Work Project (Teologi Kerja)', url: 'https://www.teologikerja.org/topik-utama/panggilan-vokasi-tinjauan-umum/', available: true, lastVerifiedAt: V },
      ko: { title: '소명에 대한 개요', author: 'Theology of Work Project', publisher: 'Theology of Work Project', url: 'https://www.theologyofwork.or.kr/ko-key-topics/ko-vocation-overview-article', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Free 7-day devotional (also on YouVersion). No job promise, no shame.
    id: 'theologyofwork-finding-god-in-unemployment',
    type: 'study',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['work', 'suffering', 'identity'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A free seven-day devotional for anyone out of work: it promises no job, but helps you bring fear and lost self-respect to God and rest your worth in his love rather than in a career.',
      fr: 'Un parcours gratuit de sept jours pour qui est sans emploi : il ne promet aucun travail, mais aide à porter devant Dieu la peur et l’estime de soi blessée, et à fonder sa valeur sur son amour plutôt que sur une carrière.',
    },
    editions: {
      en: { title: 'Finding God in Unemployment (Devotional)', author: 'Theology of Work Project', publisher: 'Theology of Work Project', url: 'https://www.theologyofwork.org/devotions/finding-god-in-unemployment-devotional/', available: true, lastVerifiedAt: V },
      zh: { title: '在失业中寻找神', author: 'Theology of Work Project（工作神学）', publisher: 'Theology of Work Project', url: 'https://zh-hans.theologyofwork.org/devotions/finding-god-unemployment', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Free commentary section on day 17's own passage; explicitly rejects the
    // idea that godliness brings financial gain.
    id: 'theologyofwork-godliness-with-contentment',
    type: 'article',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['generosity', 'finances', 'contentment'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A free commentary on 1 Timothy 6: godliness is no route to wealth; the real gain is contentment with enough, honest work to provide for others, and being rich in good deeds, generous and ready to share.',
      fr: 'Un commentaire gratuit de 1 Timothée 6 : la piété n’est pas un moyen de s’enrichir ; le vrai gain est d’être content du nécessaire, de travailler honnêtement pour pourvoir aux autres et d’être riche en œuvres bonnes, généreux et prêt à partager.',
    },
    editions: {
      en: { title: 'Godliness With Contentment Is Great Gain (1 Timothy 6:3-10, 17-19)', author: 'Theology of Work Project', publisher: 'Theology of Work Project', url: 'https://www.theologyofwork.org/new-testament/pastoral-epistles/1-timothy-working-for-order-in-gods-household/godliness-with-contentment-is-great-gain-1-timothy-63-10-17-19/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // en: the author's own page (20th-anniversary edition); it does not name
    // the publisher — Thomas Nelson per ISBN 9780785220077 (reviewer to confirm).
    id: 'guinness-the-call',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['calling', 'identity', 'work'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A reflective classic on calling: we are called first to Someone, not to something, so every task, paid or unpaid, can be done for God — a strong answer to the idea of one hidden career we might miss.',
      fr: 'Un classique méditatif sur la vocation : nous sommes appelés d’abord à Quelqu’un, non à quelque chose, si bien que toute tâche, rémunérée ou non, peut être faite pour Dieu — une vraie réponse à l’idée d’une seule carrière cachée qu’on pourrait manquer.',
    },
    editions: {
      en: { title: 'The Call: Finding and Fulfilling the Central Purpose of Your Life (20th Anniversary Edition)', author: 'Os Guinness', publisher: 'Thomas Nelson', url: 'https://osguinness.com/books-type/the-call-2/', available: true, lastVerifiedAt: V },
      pt: { title: 'A Chamada: Alcançar o Propósito da Sua Vida', author: 'Os Guinness', publisher: 'Dikaion (Portugal)', url: 'https://dikaion.pt/product/a-chamada-alcancar-o-proposito-da-sua-vida/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // LICC also offers a small-group course; the book is the individual entry.
    id: 'greene-fruitfulness-on-the-frontline',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['work', 'evangelism', 'character'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'Six simple ways to be fruitful for Christ where you already spend your week — at work, school, home or the school gate — with real stories and no pressure tactics.',
      fr: 'Six manières simples de porter du fruit pour le Christ là où l’on passe déjà sa semaine — au travail, aux études, à la maison ou à la sortie de l’école — avec des histoires vraies et sans méthodes de pression.',
    },
    editions: {
      en: { title: 'Fruitfulness on the Frontline: Making a Difference Where You Are (10th Anniversary Updated Edition)', author: 'Mark Greene', publisher: 'IVP (UK)', url: 'https://ivpbooks.com/fruitfulness-on-the-frontline-second-edition', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Sabbath is one of the book's four practices (silence and solitude,
    // Sabbath, simplicity, slowing); the publisher blurb does not name it.
    id: 'comer-ruthless-elimination-of-hurry',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['sabbath', 'spiritual-rhythms', 'work'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A pastor’s case against hurry as an enemy of the spiritual life, with practices — Sabbath among them — for living at the pace of Jesus when work and screens never stop.',
      fr: 'Un pasteur montre que la précipitation est ennemie de la vie spirituelle et propose des pratiques — dont le sabbat — pour vivre au rythme de Jésus quand le travail et les écrans ne s’arrêtent jamais.',
    },
    editions: {
      en: { title: 'The Ruthless Elimination of Hurry: How to Stay Emotionally Healthy and Spiritually Alive in the Chaos of the Modern World', author: 'John Mark Comer', publisher: 'WaterBrook (Penguin Random House)', url: 'https://www.penguinrandomhouse.com/books/600096/the-ruthless-elimination-of-hurry-by-john-mark-comer-foreword-by-john-ortberg/', available: true, lastVerifiedAt: V },
    },
  },
  {
    id: 'dawn-keeping-the-sabbath-wholly',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['sabbath', 'spiritual-rhythms'],
    status: 'needs_review',
    description: {
      en: 'A theologian’s practical guide to the Sabbath in four movements — ceasing, resting, embracing, feasting — drawing on Scripture and Jewish practice to make rest a joyful gift rather than a rule.',
      fr: 'Le guide pratique d’une théologienne pour vivre le sabbat en quatre temps — cesser, se reposer, accueillir, célébrer — nourri de l’Écriture et de la pratique juive, pour faire du repos un don joyeux plutôt qu’une règle.',
    },
    editions: {
      en: { title: 'Keeping the Sabbath Wholly: Ceasing, Resting, Embracing, Feasting', author: 'Marva J. Dawn', publisher: 'Eerdmans', url: 'https://www.eerdmans.com/9780802804570/keeping-the-sabbath-wholly/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Per-video pages exist for en/fr/es/pt (hreflang on the EN page) and on the
    // German Visiomedia site; ru/zh/ja/ko/hi/id hubs list the video by title.
    // Not found on the ar/fa/sw/tl/am hubs.
    id: 'bibleproject-sabbath',
    type: 'video',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['sabbath', 'spiritual-rhythms'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A free animated theme video tracing Sabbath from God’s rest on the seventh day through Israel’s law to Jesus, who made rest part of his mission — rest as partnership with God, not a burden.',
      fr: 'Une vidéo animée gratuite qui suit le thème du sabbat, du repos de Dieu le septième jour à la loi d’Israël puis à Jésus, qui a fait du repos une part de sa mission — le repos comme communion avec Dieu, non comme un fardeau.',
    },
    editions: {
      en: bp('Sabbath', 'https://bibleproject.com/videos/sabbath-video/'),
      fr: bp('Sabbat', 'https://bibleproject.com/fr/videos/sabbat/'),
      es: bp('El Sabbat', 'https://bibleproject.com/es/videos/sabbat-video/'),
      pt: bp('O Sábado', 'https://bibleproject.com/pt-br/videos/o-sabado/'),
      de: bp('Sabbat', 'https://bibleproject.visiomedia.org/video/sabbat/', 'BibleProject – Deutsch (Visiomedia)'),
      ru: bp('Суббота', 'https://bibleproject.com/ru/'),
      zh: bp('安息 - Sabbath', 'https://bibleproject.com/zh-hans/'),
      ja: bp('安息日 Sabbath', 'https://bibleproject.com/ja/'),
      ko: bp('안식일 Sabbath', 'https://bibleproject.com/ko/'),
      hi: bp('सातवें दिन का विश्राम Sabbath', 'https://bibleproject.com/hi/'),
      id: bp('Sabat', 'https://bibleproject.com/id/'),
    },
  },
  {
    // Reaches days 3, 10 and 20 (justice) and 17 (generosity). Written for
    // believers and sceptics; not a workplace book as such.
    id: 'keller-generous-justice',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['justice', 'generosity'],
    perspective: ['evangelical', 'reformed'],
    status: 'needs_review',
    description: {
      en: 'Why grace makes people just: from the Law and the Prophets to Jesus, God’s concern for the poor and the powerless calls believers to fairness and generosity in how they earn, spend and treat others.',
      fr: 'Pourquoi la grâce rend juste : de la Loi et des Prophètes jusqu’à Jésus, le souci de Dieu pour le pauvre et le faible appelle les croyants à l’équité et à la générosité dans leur manière de gagner, de dépenser et de traiter les autres.',
    },
    editions: {
      en: { title: 'Generous Justice: How God’s Grace Makes Us Just', author: 'Timothy Keller', publisher: 'Penguin Books (Penguin Random House)', url: 'https://www.penguinrandomhouse.com/books/305142/generous-justice-by-timothy-keller/', available: true, lastVerifiedAt: V },
      pt: { title: 'Justiça generosa: a graça de Deus e a justiça social', author: 'Timothy Keller', publisher: 'Edições Vida Nova', url: 'https://www.vidanova.com.br/livros/justica-generosa-a-graca-de-deus-e-a-justica-social', isbn: '9788527505390', available: true, lastVerifiedAt: V },
      ko: { title: '팀 켈러의 정의란 무엇인가', author: '팀 켈러 (Timothy Keller)', publisher: '두란노 (Duranno)', url: 'https://www.duranno.com/books/view/bookdetail.asp?bcod=4898', isbn: '9788953117099', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Eternal-treasure motivation, not give-to-get: no material return is
    // promised. Reviewer: check the tithing chapter against day 17's
    // "no manipulation in giving" guardrail.
    id: 'alcorn-treasure-principle',
    type: 'book',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['generosity', 'finances', 'contentment'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A short book on Jesus’ words about storing up treasure in heaven: money is entrusted to us, so joyful giving is freedom from possessions — with no promise of getting more back here.',
      fr: 'Un petit livre sur la parole de Jésus « amassez des trésors dans le ciel » : l’argent nous est confié, et donner avec joie libère de l’emprise des biens — sans promesse d’en recevoir davantage ici-bas.',
    },
    editions: {
      en: { title: 'The Treasure Principle, Revised and Updated: Unlocking the Secret of Joyful Giving', author: 'Randy Alcorn', publisher: 'Multnomah (Penguin Random House)', url: 'https://www.penguinrandomhouse.com/books/1674/the-treasure-principle-revised-and-updated-by-randy-alcorn/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Both pages blocked plain fetchers (403); verified through a Firecrawl
    // scrape (title, site, language, content). Author named via the TGC
    // Australia author profile / search snippet, not read on the page itself.
    id: 'martin-you-are-never-without-work',
    type: 'article',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['work', 'identity', 'suffering'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A short, gentle reflection for anyone out of work: unpaid work still counts, your identity and worth come from being loved by God rather than a job title, and the church is meant to carry you through.',
      fr: 'Une courte réflexion bienveillante pour qui est au chômage : le travail non rémunéré compte aussi, l’identité et la valeur viennent de l’amour de Dieu et non d’un titre de poste, et l’Église est là pour porter celui qui cherche.',
    },
    editions: {
      en: { title: 'You Are Never Without Work (A Biblical Reflection on Unemployment)', author: 'Kara Martin', publisher: 'The Gospel Coalition Australia', url: 'https://au.thegospelcoalition.org/article/you-are-never-without-work-a-biblical-reflection-on-unemployment/', available: true, lastVerifiedAt: V },
      fr: { title: 'Vous n’êtes jamais sans travail (une réflexion biblique sur le chômage)', author: 'Kara Martin', publisher: 'Évangile 21', url: 'https://evangile21.thegospelcoalition.org/article/vous-netes-jamais-sans-travail-une-reflexion-biblique-sur-le-chomage/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Native Spanish (Dominican Republic): 16 free recorded sermons in five
    // sections — nature of work, prudence, diligence and justice in business,
    // truthfulness, contentment. Spanish only.
    id: 'michelen-la-teologia-del-trabajo',
    type: 'teaching',
    originalLanguage: 'es',
    domains: ['christian-living'],
    topics: ['work', 'character', 'wisdom', 'contentment'],
    perspective: ['evangelical', 'reformed'],
    status: 'needs_review',
    description: {
      en: 'A free Spanish-language sermon course by a Dominican pastor on what the Bible teaches about work: diligence, honest dealing, fairness, prudence and contentment, joining Sunday faith to weekday work.',
      fr: 'Un cours gratuit en espagnol, fait de prédications d’un pasteur dominicain, sur ce que la Bible enseigne du travail : diligence, honnêteté, équité, prudence et contentement, pour relier la foi du dimanche au travail de la semaine.',
    },
    editions: {
      es: { title: 'La teología del trabajo', author: 'Sugel Michelén', publisher: 'Coalición por el Evangelio (Cursos Coalición)', url: 'https://www.coalicionporelevangelio.org/curso/la-teologia-del-trabajo/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Free; TOW's own translations on its es/pt/id sites (same author named on
    // each page). zh-hans and Korean TOW sites checked: not found.
    id: 'theologyofwork-10-key-points-work',
    type: 'article',
    originalLanguage: 'en',
    domains: ['christian-living'],
    topics: ['work', 'calling', 'character'],
    perspective: ['evangelical'],
    status: 'needs_review',
    description: {
      en: 'A free one-page primer: work sits within creation, fall and redemption; every honest job, paid or unpaid, matters to God; character, service to others and a rhythm of work and rest belong to faithful work.',
      fr: 'Une introduction gratuite d’une page : le travail s’inscrit dans la création, la chute et la rédemption ; tout travail honnête, rémunéré ou non, compte pour Dieu ; le caractère, le service des autres et un rythme de travail et de repos font partie d’un travail fidèle.',
    },
    editions: {
      en: { title: '10 Key Points About Work in the Bible Every Christian Should Know', author: 'Andy Mills', publisher: 'Theology of Work Project', url: 'https://www.theologyofwork.org/resources/what-does-the-bible-say-about-work/', available: true, lastVerifiedAt: V },
      es: { title: '10 puntos claves sobre el trabajo en la Biblia que cada cristiano debe conocer', author: 'Andy Mills', publisher: 'Proyecto Teología del Trabajo (Theology of Work Project)', url: 'https://www.teologiadeltrabajo.org/resources/10-puntos-claves-sobre-el-trabajo-en-la-biblia-que-cada-cristiano-debe-cono', available: true, lastVerifiedAt: V },
      pt: { title: '10 Pontos-Chave Sobre Trabalho na Bíblia que Todo Cristão Deveria Saber', author: 'Andy Mills', publisher: 'Projeto Teologia do Trabalho (Theology of Work Project)', url: 'https://www.teologiadotrabalho.org/recursos/10-pontos-chave-sobre-trabalho-na-b%C3%ADblia-que-todo-crist%C3%A3o-deveria-saber', available: true, lastVerifiedAt: V },
      id: { title: '10 Hal Penting tentang Pekerjaan dalam Alkitab yang Harus Diketahui Setiap Orang Kristen', author: 'Andy Mills', publisher: 'Theology of Work Project (Teologi Kerja)', url: 'https://www.teologikerja.org/resources/10-hal-penting-tentang-pekerjaan-dalam-alkitab-yang-harus-diketahui-setiap-orang-kristen/', available: true, lastVerifiedAt: V },
    },
  },
  {
    // Native German (Martin Bucer Seminar, Munich), part 1 of a 4-part series
    // (2026). Only part 1 was opened; parts 2–4 are listed in the worksheet.
    id: 'graber-beruf-und-berufung',
    type: 'article',
    originalLanguage: 'de',
    domains: ['christian-living'],
    topics: ['calling', 'work'],
    perspective: ['evangelical', 'reformed'],
    status: 'needs_review',
    description: {
      en: 'A German seminary lecturer on the Reformation teaching of calling: first God’s call to Christ, then the everyday “stations” of family, work and citizenship where every believer, not only the clergy, serves their neighbour.',
      fr: 'Un enseignant de séminaire allemand présente la doctrine réformatrice de la vocation : d’abord l’appel de Dieu au Christ, puis les « états » du quotidien — famille, travail, cité — où chaque croyant, pas seulement le clergé, sert son prochain.',
    },
    editions: {
      de: { title: 'Beruf und Berufung – Teil 1', author: 'Ben Graber', publisher: 'Evangelium21', url: 'https://www.evangelium21.net/media/5221/beruf-und-berufung-teil-1', available: true, lastVerifiedAt: V },
    },
  },
];
