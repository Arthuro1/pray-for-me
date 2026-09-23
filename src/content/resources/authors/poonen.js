// Zac Poonen, with the books by Annie Poonen and Santosh Poonen that his
// church publishes beside his. All are free to read on cfcindia.com and its
// language sites. Left out: Spanish, because espanol.cfcindia.com redirects
// every book to a separate site (zacpoonen-spanish.org); Portuguese "Finding
// God's Will", whose page on the same path carries a different title ("Onde
// irei daqui, ó Deus?"); and the booklet reprint of "Fifty Marks of Pharisees",
// which is the same text as the book.
import { edition, authorBook } from './shared';

const cfc = (title, url, author = 'Zac Poonen') => edition(title, author, 'Christian Fellowship Church, Bangalore', url);
const en = (title, slug, author) => cfc(title, `https://www.cfcindia.com/books/${slug}`, author);
const site = (sub, path) => `https://${sub}.cfcindia.com/${path}`;
const EVANGELICAL = ['evangelical'];
const FREE = { en: ' Free to read online.', fr: ' Lecture gratuite en ligne.' };
const describe = (enText, frText) => ({ en: enText + FREE.en, fr: frText + FREE.fr });

// A book held on the christian-living shelf for a plan still being written.
const later = (book) => authorBook({ language: 'en', domains: ['christian-living'], perspective: EVANGELICAL, ...book });

export const POONEN_BOOKS = [
  // ── On the current plans ─────────────────────────────────────────────────
  authorBook({
    id: 'poonen-god-centred-praying',
    language: 'en',
    domains: ['relationships', 'freedom'],
    perspective: EVANGELICAL,
    topics: ['prayer'],
    description: describe('On prayer that begins with God’s concerns rather than our own.', 'Sur une prière qui commence par les préoccupations de Dieu plutôt que par les nôtres.'),
    editions: {
      en: en('God Centred Praying', 'god-centred-praying'),
      de: cfc('Gottzentriertes Gebet', site('deutsch', 'de/books/god-centred-praying')),
      pt: cfc('Oração centrada em Deus', site('portugues', 'pt/books/god-centred-praying')),
      ko: cfc('하나님 중심의 기도', site('korean', 'books/god-centred-praying-1')),
      hi: cfc('परमेश्वर केन्द्रित प्रार्थना', site('hindi', 'hi/books/god-centred-praying')),
    },
  }),
  authorBook({
    id: 'poonen-finding-gods-will',
    language: 'en',
    domains: ['relationships'],
    topics: ['discernment', 'work'],
    description: describe('How to seek God’s guidance through Scripture, the inner witness and circumstances, including for one’s calling.', 'Comment chercher la direction de Dieu par l’Écriture, le témoignage intérieur et les circonstances, y compris pour sa vocation.'),
    editions: {
      en: en('Finding God’s Will', 'finding-gods-will'),
      fr: cfc('Trouver la volonté de Dieu', site('francais', 'fr/books/finding-gods-will')),
      de: cfc('Gottes Willen finden', site('deutsch', 'de/books/finding-gods-will')),
      hi: cfc('पाइए परमेश्वर की इच्छा', site('hindi', 'hi/books/finding-gods-will')),
    },
  }),
  authorBook({
    id: 'poonen-hear-o-my-sons',
    language: 'en',
    domains: ['relationships'],
    topics: ['character', 'spiritual-formation'],
    lifeStages: ['single'],
    description: describe('Letters a father wrote to his sons while they were single and away from home, on following Christ wholeheartedly.', 'Les lettres d’un père à ses fils, célibataires et loin de la maison, sur le fait de suivre Christ de tout cœur.'),
    editions: {
      en: en('Hear! O My Sons', 'hear-o-my-sons'),
      fr: cfc('Écoutez, ô mes fils', site('francais', 'fr/books/hear-o-my-sons')),
      de: cfc('Hört, meine Söhne!', site('deutsch', 'de/books/hear-o-my-sons')),
      ko: cfc('들어라! 오 나의 아들들아', site('korean', 'books/hear-o-my-sons-0')),
    },
  }),
  authorBook({
    id: 'poonen-one-body-in-christ',
    language: 'en',
    domains: ['relationships', 'freedom'],
    perspective: EVANGELICAL,
    topics: ['community', 'church'],
    description: describe('On love and unity among believers, and repairing strained relationships in the church.', 'Sur l’amour et l’unité entre croyants, et la réparation des relations abîmées dans l’Église.'),
    editions: {
      en: en('One Body in Christ', 'one-body-in-christ'),
      de: cfc('Ein Leib in Christus', site('deutsch', 'de/books/one-body-in-christ')),
      hi: cfc('मसीह में एक देह', site('hindi', 'hi/books/one-body-in-christ')),
    },
  }),
  authorBook({
    id: 'poonen-the-purpose-of-failure',
    language: 'en',
    domains: ['relationships', 'freedom'],
    perspective: EVANGELICAL,
    topics: ['repentance', 'healing', 'discipleship'],
    description: describe('For anyone who feels like a failure: God can still fulfil his purpose after many new beginnings.', 'Pour qui se sent en échec : Dieu peut encore accomplir son dessein, même après bien des nouveaux départs.'),
    editions: {
      en: en('The Purpose of Failure', 'the-purpose-of-failure'),
      fr: cfc('Le but de l’échec', site('francais', 'fr/books/the-purpose-of-failure')),
      de: cfc('Wie Gott Versagen benutzt', site('deutsch', 'de/books/the-purpose-of-failure')),
      pt: cfc('O propósito da falha', site('portugues', 'pt/books/the-purpose-of-failure')),
      ru: cfc('Божия цель в провалах человека', site('russian', 'ru/books/the-purpose-of-failure')),
      zh: cfc('失败的目的', site('chinese-simplified', 'zh-si/books/the-purpose-of-failure')),
      ja: cfc('失敗における神の目的', site('japanese', 'ja/books/the-purpose-of-failure')),
      hi: cfc('असफलता का उद्देश्य', site('hindi', 'hi/books/the-purpose-of-failure')),
    },
  }),
  authorBook({
    id: 'poonen-secrets-of-victory',
    language: 'en',
    domains: ['freedom'],
    perspective: EVANGELICAL,
    topics: ['victory', 'discipleship', 'identity'],
    description: describe('On living in daily victory over sin, secure in God’s love.', 'Sur une vie de victoire quotidienne sur le péché, dans l’assurance de l’amour de Dieu.'),
    editions: {
      en: en('Secrets of Victory', 'secrets-of-victory'),
      de: cfc('Geheimnisse des Sieges', site('deutsch', 'de/books/secrets-of-victory')),
      pt: cfc('Segredos da vitória', site('portugues', 'pt/books/secrets-of-victory')),
      zh: cfc('得胜的秘诀', site('chinese-simplified', 'zh-si/books/secrets-of-victory')),
      ja: cfc('勝利の秘訣', site('japanese', 'ja/books/secrets-of-victory')),
      ko: cfc('승리의 비밀', site('korean', 'books/secrets-of-victory-2')),
      hi: cfc('जय के रहस्य', site('hindi', 'hi/books/secrets-of-victory')),
    },
  }),
  authorBook({
    id: 'poonen-practical-discipleship',
    language: 'en',
    domains: ['freedom'],
    perspective: EVANGELICAL,
    topics: ['discipleship'],
    description: describe('What following Jesus as a disciple looks like in everyday choices.', 'Ce que signifie suivre Jésus en disciple dans les choix de tous les jours.'),
    editions: {
      en: en('Practical Discipleship', 'practical-discipleship'),
      de: cfc('Praktische Jüngerschaft', site('deutsch', 'de/books/practical-discipleship')),
      ja: cfc('主の弟子となるために', site('japanese', 'ja/books/practical-discipleship')),
      hi: cfc('प्रायोगिक शिष्यता', site('hindi', 'hi/books/practical-discipleship')),
    },
  }),
  authorBook({
    id: 'poonen-living-as-jesus-lived',
    language: 'en',
    domains: ['freedom'],
    perspective: EVANGELICAL,
    topics: ['discipleship', 'holy-spirit', 'spiritual-formation'],
    description: describe('Jesus as the example of a life lived in the Spirit and in obedience to the Father.', 'Jésus comme modèle d’une vie menée par l’Esprit dans l’obéissance au Père.'),
    editions: {
      en: en('Living as Jesus Lived', 'living-as-jesus-lived'),
      de: cfc('Leben wie Jesus gelebt hat', site('deutsch', 'de/books/living-as-jesus-lived')),
      pt: cfc('Viver como Jesus viveu', site('portugues', 'pt/books/living-as-jesus-lived')),
      ja: cfc('イエスが生きたように生きる', site('japanese', 'ja/books/living-as-jesus-lived-0')),
      hi: cfc('यीशु की तरह जीना', site('hindi', 'hi/books/living-as-jesus-lived')),
    },
  }),
  authorBook({
    id: 'poonen-a-heavenly-home',
    language: 'en',
    domains: ['relationships'],
    topics: ['marriage', 'covenant', 'spiritual-formation', 'marriage-roles'],
    lifeStages: ['engaged', 'married'],
    // Sensitive: sets out a wife's submission and a husband's headship (Ephesians 5).
    description: describe('The messages Zac Poonen gave at his sons’ weddings, on building a Christ-centred home.', 'Les messages donnés par Zac Poonen aux mariages de ses fils, sur un foyer centré sur Christ.'),
    editions: {
      en: en('A Heavenly Home', 'a-heavenly-home'),
      de: cfc('Ein himmlisches Zuhause', site('deutsch', 'de/books/a-heavenly-home')),
      ja: cfc('天国のような家', site('japanese', 'ja/books/a-heavenly-home')),
      hi: cfc('एक स्वर्ग समान घर', site('hindi', 'hi/books/a-heavenly-home')),
    },
  }),
  authorBook({
    id: 'poonen-a-godly-family-life',
    language: 'en',
    domains: ['relationships'],
    topics: ['marriage', 'parenting', 'family', 'marriage-roles'],
    lifeStages: ['married'],
    // Sensitive: includes a chapter titled "The Glory of Submission".
    description: describe('Short chapters on marriage, understanding each other and raising children, ending with questions and answers.', 'De courts chapitres sur le mariage, la compréhension mutuelle et l’éducation des enfants, suivis de questions-réponses.'),
    editions: {
      en: en('A Godly Family Life', 'a-godly-family-life'),
      ko: cfc('경건한 가정생활', site('korean', 'books/a-godly-family-life-0')),
    },
  }),
  authorBook({
    id: 'poonen-sex-love-marriage',
    language: 'en',
    domains: ['relationships'],
    topics: ['sexuality', 'purity', 'dating', 'future-spouse', 'premarital'],
    lifeStages: ['single', 'dating', 'engaged'],
    // Sensitive: sexuality.
    description: describe('Plain biblical guidance for young people on sexuality, falling in love and choosing a spouse.', 'Des repères bibliques clairs pour les jeunes sur la sexualité, le sentiment amoureux et le choix du conjoint.'),
    editions: {
      en: en('Sex, Love & Marriage', 'sex-love-marriage'),
      de: cfc('Sex, Liebe und Ehe', site('deutsch', 'de/books/sex-love-marriage')),
      hi: cfc('प्रेम यौन और विवाह', site('hindi', 'hi/books/sex-love-marriage')),
    },
  }),
  authorBook({
    id: 'poonen-know-your-enemy',
    language: 'en',
    domains: ['freedom'],
    perspective: EVANGELICAL,
    topics: ['spiritual-warfare', 'victory'],
    // Sensitive: spiritual warfare.
    description: describe('Written for young people, on Satan’s tactics and Christ’s victory at the cross.', 'Écrit pour les jeunes, sur les stratégies de Satan et la victoire du Christ à la croix.'),
    editions: {
      en: en('Know Your Enemy', 'know-your-enemy'),
      de: cfc('Erkenne deinen Feind', site('deutsch', 'de/books/know-your-enemy')),
      pt: cfc('Conheça seu inimigo', site('portugues', 'pt/books/know-your-enemy')),
      ja: cfc('敵を知る', site('japanese', 'ja/books/know-your-enemy')),
      hi: cfc('अपने शत्रु को जानें', site('hindi', 'hi/books/know-your-enemy')),
    },
  }),
  authorBook({
    id: 'poonen-the-way-of-wisdom',
    language: 'en',
    domains: ['bible-study'],
    topics: ['wisdom-literature'],
    description: describe('A verse-by-verse exposition of Proverbs.', 'Un commentaire verset par verset du livre des Proverbes.'),
    editions: {
      en: en('The Way of Wisdom', 'the-way-of-wisdom'),
    },
  }),
  authorBook({
    id: 'annie-poonen-woman-why-are-you-weeping',
    language: 'en',
    domains: ['relationships'],
    topics: ['suffering', 'grief'],
    description: describe('Comfort for women going through suffering.', 'Du réconfort pour les femmes qui traversent la souffrance.'),
    editions: {
      en: en('Woman, Why Are You Weeping?', 'woman-why-are-you-weeping', 'Annie Poonen'),
      de: cfc('Frau, warum weinst du?', site('deutsch', 'de/books/woman-why-are-you-weeping'), 'Annie Poonen'),
      hi: cfc('हे नारी, तू क्यों रोती है?', site('hindi', 'hi/books/woman-why-are-you-weeping'), 'Annie Poonen'),
    },
  }),
  authorBook({
    id: 'annie-poonen-mother-in-law-bond',
    language: 'en',
    domains: ['relationships'],
    topics: ['family-of-origin', 'family'],
    lifeStages: ['engaged', 'married'],
    description: describe('On how love can heal a strained bond between a mother-in-law and a daughter-in-law.', 'Sur l’amour qui peut guérir une relation tendue entre belle-mère et belle-fille.'),
    editions: {
      en: en('Mother-in-Law and Daughter-in-Law Bond', 'motherinlaw-and-daughterinlaw-bond', 'Annie Poonen'),
    },
  }),
  authorBook({
    id: 'annie-poonen-encouragement-for-mothers',
    language: 'en',
    domains: ['relationships'],
    topics: ['parenting', 'family'],
    lifeStages: ['married'],
    description: describe('The truths that helped the author build a godly home, for mothers who want to grow as parents.', 'Les vérités qui ont aidé l’autrice à bâtir un foyer selon Dieu, pour les mères qui veulent grandir comme parents.'),
    editions: {
      en: en('Encouragement for Mothers', 'encouragement-for-mothers', 'Annie Poonen'),
      de: cfc('Ermutigung für Mütter', site('deutsch', 'de/books/encouragement-for-mothers'), 'Annie Poonen'),
      pt: cfc('Encorajamento às mães', site('portugues', 'pt/books/encouragement-for-mothers'), 'Annie Poonen'),
      hi: cfc('माताओं के लिए प्रोत्साहन', site('hindi', 'hi/books/encouragement-for-mothers'), 'Annie Poonen'),
    },
  }),
  authorBook({
    id: 'annie-poonen-god-made-mothers',
    language: 'en',
    domains: ['relationships'],
    topics: ['parenting', 'children', 'family'],
    lifeStages: ['married'],
    description: describe('Answers to the questions mothers have asked the author over many years.', 'Des réponses aux questions que des mères ont posées à l’autrice au fil des années.'),
    editions: {
      en: en('God Made Mothers', 'god-made-mothers', 'Annie Poonen'),
      de: cfc('Gott schuf Mütter', site('deutsch', 'de/books/god-made-mothers'), 'Annie Poonen'),
      hi: cfc('परमेश्वर ने माँ की रचना की', site('hindi', 'hi/books/god-made-mothers'), 'Annie Poonen'),
    },
  }),
  authorBook({
    id: 'annie-poonen-a-girls-viewpoint',
    language: 'en',
    domains: ['relationships'],
    topics: ['singleness', 'dating', 'character'],
    lifeStages: ['single', 'dating'],
    description: describe('A young woman’s story from her teenage years to the early days of marriage.', 'L’histoire d’une jeune femme, de l’adolescence aux débuts du mariage.'),
    editions: {
      en: en('A Girl’s Viewpoint', 'a-girls-viewpoint', 'Annie Poonen'),
      de: cfc('Aus Sicht eines Mädchens', site('deutsch', 'de/books/a-girls-viewpoint'), 'Annie Poonen'),
      hi: cfc('एक लड़की का दृष्टिकोण', site('hindi', 'hi/books/a-girls-viewpoint'), 'Annie Poonen'),
    },
  }),

  // ── Held for coming plans ────────────────────────────────────────────────
  // Bible study: on the Bible-study shelf, under topics no current study uses.
  authorBook({
    id: 'poonen-through-the-bible',
    language: 'en',
    domains: ['bible-study'],
    perspective: EVANGELICAL,
    topics: ['bible-overview'],
    description: describe('A commentary on all sixty-six books of the Bible, showing each one’s message for today.', 'Un commentaire des soixante-six livres de la Bible, montrant le message de chacun pour aujourd’hui.'),
    editions: {
      en: en('Through the Bible', 'through-the-bible'),
      fr: cfc('La Bible, du début à la fin', site('francais', 'fr/books/through-the-bible')),
      de: cfc('Durch die Bibel', site('deutsch', 'de/books/through-the-bible')),
      ko: cfc('성경을 통해', site('korean', 'books/through-the-bible-0')),
    },
  }),
  authorBook({
    id: 'poonen-the-final-triumph',
    language: 'en',
    domains: ['bible-study'],
    perspective: EVANGELICAL,
    topics: ['end-times'],
    description: describe('A verse-by-verse study of Revelation.', 'Une étude verset par verset de l’Apocalypse.'),
    editions: {
      en: en('The Final Triumph', 'the-final-triumph'),
      de: cfc('Der finale Triumph', site('deutsch', 'de/books/the-final-triumph')),
      ko: cfc('최후의 승리', site('korean', 'books/the-final-triumph-1')),
    },
  }),
  authorBook({
    id: 'poonen-the-lord-and-his-church',
    language: 'en',
    domains: ['bible-study'],
    perspective: EVANGELICAL,
    topics: ['church'],
    description: describe('A study of Revelation 1–3: the risen Lord and his letters to seven churches.', 'Une étude d’Apocalypse 1 à 3 : le Seigneur ressuscité et ses lettres à sept Églises.'),
    editions: {
      en: en('The Lord and His Church', 'the-lord-and-his-church'),
      de: cfc('Der Herr und seine Gemeinde', site('deutsch', 'de/books/the-lord-and-his-church')),
      hi: cfc('प्रभु और उसकी कलीसिया', site('hindi', 'hi/books/the-lord-and-his-church')),
    },
  }),

  // The gospel and the foundations of faith
  later({
    id: 'poonen-the-real-truth',
    topics: ['gospel'],
    description: describe('The message of salvation explained simply, for someone who knows nothing of the Christian faith.', 'Le message du salut expliqué simplement, pour qui ne connaît rien de la foi chrétienne.'),
    editions: {
      en: en('The Real Truth', 'the-real-truth'),
      fr: cfc('La vérité', site('francais', 'fr/books/the-real-truth')),
      de: cfc('Die echte Wahrheit', site('deutsch', 'de/books/the-real-truth')),
      ja: cfc('本当の真理', site('japanese', 'ja/books/the-real-truth')),
      hi: cfc('वास्तविक सत्य', site('hindi', 'hi/books/the-real-truth')),
      am: cfc('ትክክለኛው እውነት', site('amharic', 'am/books/the-real-truth')),
    },
  }),
  later({
    id: 'poonen-amazing-facts',
    topics: ['gospel'],
    description: describe('An elementary booklet about God and humanity.', 'Un petit livret élémentaire sur Dieu et l’être humain.'),
    editions: {
      en: en('Amazing Facts', 'amazing-facts'),
      fr: cfc('Surprenantes réalités', site('francais', 'fr/books/amazing-facts')),
      de: cfc('Erstaunliche Tatsachen', site('deutsch', 'de/books/amazing-facts')),
      ja: cfc('素晴らしい真実', site('japanese', 'ja/books/amazing-facts')),
      hi: cfc('अद्भुत वास्तविकताएं', site('hindi', 'hi/books/amazing-facts')),
    },
  }),
  later({
    id: 'poonen-the-full-gospel',
    topics: ['gospel', 'holiness'],
    description: describe('On the whole counsel of God, and freedom from sin’s power as the proof of having heard the truth.', 'Sur tout le conseil de Dieu, et la liberté face au pouvoir du péché comme preuve d’avoir entendu la vérité.'),
    editions: {
      en: en('The Full Gospel', 'the-full-gospel'),
      de: cfc('Das volle Evangelium', site('deutsch', 'de/books/the-full-gospel')),
      ko: cfc('완전한 복음', site('korean', 'books/the-full-gospel-3')),
    },
  }),
  later({
    id: 'poonen-fundamental-biblical-truths',
    topics: ['gospel', 'discipleship'],
    description: describe('Short teachings on the foundations of the faith: new birth, baptism, the Holy Spirit and the Word.', 'De courts enseignements sur les fondements de la foi : nouvelle naissance, baptême, Saint-Esprit et Parole.'),
    editions: {
      en: en('Fundamental Biblical Truths', 'fundamental-biblical-truths'),
      ko: cfc('근본적 성경 진리', site('korean', 'books/fundamental-biblical-truths-1')),
    },
  }),
  later({
    id: 'poonen-basic-christian-teachings',
    topics: ['discipleship', 'gospel', 'marriage-roles'],
    // Sensitive: several lessons set out the duties of husbands and wives.
    description: describe('Short lessons on the Christian life, from repentance and faith to money, marriage and raising children.', 'De courtes leçons sur la vie chrétienne, de la repentance et la foi à l’argent, au mariage et à l’éducation des enfants.'),
    editions: {
      en: en('Basic Christian Teachings', 'basic-christian-teachings'),
      de: cfc('Christliche Grundlehren', site('deutsch', 'de/books/basic-christian-teachings')),
    },
  }),
  later({
    id: 'poonen-a-good-foundation',
    topics: ['discipleship', 'character'],
    description: describe('For young people: laying a foundation for life that storms will not shake.', 'Pour les jeunes : poser pour sa vie un fondement que les tempêtes n’ébranleront pas.'),
    editions: {
      en: en('A Good Foundation', 'a-good-foundation'),
      fr: cfc('Une bonne fondation', site('francais', 'fr/books/a-good-foundation')),
      de: cfc('Ein gutes Fundament', site('deutsch', 'de/books/a-good-foundation')),
      pt: cfc('Uma boa fundação', site('portugues', 'pt/books/a-good-foundation')),
      ja: cfc('丈夫な土台', site('japanese', 'ja/books/a-good-foundation')),
      hi: cfc('एक अच्छी नींव', site('hindi', 'hi/books/a-good-foundation')),
      am: cfc('ጽኑ መሠረት', site('amharic', 'am/books/a-good-foundation')),
    },
  }),
  later({
    id: 'poonen-all-that-jesus-taught',
    topics: ['discipleship'],
    description: describe('Studies on everything Jesus told his disciples to teach.', 'Des études sur tout ce que Jésus a demandé à ses disciples d’enseigner.'),
    editions: {
      en: en('All That Jesus Taught', 'all-that-jesus-taught'),
    },
  }),
  later({
    id: 'poonen-being-ready-for-christs-return',
    topics: ['end-times'],
    description: describe('On being ready for Christ’s return rather than mastering every prophetic detail.', 'Sur le fait d’être prêt pour le retour du Christ plutôt que de maîtriser chaque détail prophétique.'),
    editions: {
      en: en('Being Ready for Christ’s Return', 'being-ready-for-christs-return'),
    },
  }),

  // Holiness and the inner life
  later({
    id: 'poonen-beauty-for-ashes',
    topics: ['spiritual-formation', 'holiness'],
    description: describe('On exchanging a self-centred life for the life of Christ.', 'Sur l’échange d’une vie centrée sur soi contre la vie du Christ.'),
    editions: {
      en: en('Beauty for Ashes', 'beauty-for-ashes'),
      de: cfc('Schönheit statt Asche', site('deutsch', 'de/books/beauty-for-ashes')),
      ko: cfc('재 대신 아름다움을', site('korean', 'books/beauty-for-ashes-3')),
      hi: cfc('मिट्टी से सोना', site('hindi', 'hi/books/beauty-for-ashes')),
    },
  }),
  later({
    id: 'poonen-knowing-gods-ways',
    topics: ['spiritual-formation'],
    description: describe('On knowing God and his ways rather than only his mighty acts.', 'Sur la connaissance de Dieu et de ses voies, et pas seulement de ses actes puissants.'),
    editions: {
      en: en('Knowing God’s Ways', 'knowing-gods-ways'),
      de: cfc('Gottes Wege erkennen', site('deutsch', 'de/books/knowing-gods-ways')),
      hi: cfc('परमेश्वर के मार्गों को जानिए', site('hindi', 'hi/books/knowing-gods-ways')),
    },
  }),
  later({
    id: 'poonen-the-supreme-priorities',
    topics: ['discipleship', 'spiritual-formation'],
    description: describe('On choosing what lasts for eternity over what passes away.', 'Sur le choix de ce qui demeure pour l’éternité plutôt que de ce qui passe.'),
    editions: {
      en: en('The Supreme Priorities', 'the-supreme-priorities'),
      de: cfc('Die höchsten Prioritäten', site('deutsch', 'de/books/the-supreme-priorities')),
      ja: cfc('最優先すべきこと', site('japanese', 'ja/books/the-supreme-priorities')),
      hi: cfc('सर्वश्रेष्ठ आवश्यकताएं', site('hindi', 'hi/books/the-supreme-priorities')),
    },
  }),
  later({
    id: 'poonen-gaining-gods-approval',
    topics: ['holiness', 'discipleship'],
    description: describe('On seeking God’s approval above honour and material gain.', 'Sur la recherche de l’approbation de Dieu plutôt que des honneurs et des biens.'),
    editions: {
      en: en('Gaining God’s Approval', 'gaining-gods-approval'),
      de: cfc('Gottes Anerkennung gewinnen', site('deutsch', 'de/books/gaining-gods-approval')),
      pt: cfc('Obtendo a aprovação de Deus', site('portugues', 'pt/books/gaining-gods-approval')),
      hi: cfc('परमेश्वर की स्वीकृति प्राप्त करना', site('hindi', 'hi/books/gaining-gods-approval')),
    },
  }),
  later({
    id: 'poonen-fifty-marks-of-pharisees',
    topics: ['holiness', 'character'],
    description: describe('Fifty signs of religious pride, for examining yourself rather than others.', 'Cinquante signes d’orgueil religieux, pour s’examiner soi-même plutôt que les autres.'),
    editions: {
      en: en('Fifty Marks of Pharisees', 'fifty-marks-of-pharisees'),
      de: cfc('Fünfzig Kennzeichen von Pharisäern', site('deutsch', 'de/books/fifty-marks-of-pharisees')),
      pt: cfc('Cinquenta marcas de fariseus', site('portugues', 'pt/books/fifty-marks-of-pharisees')),
      ko: cfc('바리새인들의 50가지 특징', site('korean', 'books/fifty-marks-of-pharisees-2')),
      hi: cfc('फरीसियों के पचास चिन्ह्', site('hindi', 'hi/books/fifty-marks-of-pharisees')),
      am: cfc('የፈሪሳውያን 50 ምልክቶች', site('amharic', 'am/books/fifty-marks-of-pharisees')),
    },
  }),
  later({
    id: 'poonen-fifty-marks-of-godly-men',
    topics: ['holiness', 'character'],
    description: describe('A short booklet on what true godliness looks like.', 'Un court livret sur ce qu’est la vraie piété.'),
    editions: {
      en: en('Fifty Marks of Godly Men', 'fifty-marks-of-godly-men-booklet'),
      pt: cfc('Cinquenta marcas de homens de Deus', site('portugues', 'pt/books/fifty-marks-of-godly-men-booklet')),
      ja: cfc('神を恐れる人の５０の特性', site('japanese', 'ja/books/fifty-marks-of-godly-men-booklet')),
      ko: cfc('경건한 사람들의 50가지 특징', site('korean', 'books/fifty-marks-of-godly-men-booklet-1')),
      am: cfc('ሃምሳ የእግዚአብሔር ሰው ምልክቶች', site('amharic', 'am/books/fifty-marks-of-godly-men-booklet')),
    },
  }),

  // Serving God and the church
  later({
    id: 'poonen-needed-men-of-god',
    topics: ['leadership', 'holiness'],
    description: describe('On what it takes to become a man of God.', 'Sur ce qu’il faut pour devenir un homme de Dieu.'),
    editions: {
      en: en('Needed: Men of God', 'neededmen-of-god'),
      de: cfc('Gesucht – Männer Gottes', site('deutsch', 'de/books/neededmen-of-god')),
      hi: cfc('ज़रूरत है परमेश्वर के जनों की', site('hindi', 'hi/books/neededmen-of-god')),
    },
  }),
  later({
    id: 'poonen-a-spiritual-leader',
    topics: ['leadership'],
    description: describe('On becoming a servant-leader who can say, “Follow me as I follow Christ.”', 'Sur le fait de devenir un serviteur-leader capable de dire : « Suivez mon exemple, comme je suis celui de Christ. »'),
    editions: {
      en: en('A Spiritual Leader', 'a-spiritual-leader'),
      de: cfc('Ein geistlicher Leiter', site('deutsch', 'de/books/a-spiritual-leader')),
      pt: cfc('Um líder espiritual', site('portugues', 'pt/books/a-spiritual-leader')),
      zh: cfc('属灵领袖', site('chinese-simplified', 'zh-si/books/a-spiritual-leader')),
      ja: cfc('霊的な指導者', site('japanese', 'ja/books/a-spiritual-leader')),
      hi: cfc('आत्मिक अगुवा', site('hindi', 'hi/books/a-spiritual-leader')),
    },
  }),
  later({
    id: 'poonen-principles-of-serving-god',
    topics: ['leadership', 'church'],
    description: describe('On serving God out of time spent in his presence, hearing his voice.', 'Sur un service de Dieu qui naît du temps passé en sa présence, à l’écoute de sa voix.'),
    editions: {
      en: en('Principles of Serving God', 'principles-of-serving-god'),
      de: cfc('Prinzipien, Gott zu dienen', site('deutsch', 'de/books/principles-of-serving-god')),
      pt: cfc('Princípios de servir a Deus', site('portugues', 'pt/books/principles-of-serving-god')),
      ru: cfc('Принципы в служении Богу', site('russian', 'ru/books/principles-of-serving-god')),
      hi: cfc('परमेवर की सेवा के सिध्दान्त', site('hindi', 'hi/books/principles-of-serving-god')),
    },
  }),
  later({
    id: 'poonen-the-new-covenant-servant',
    topics: ['leadership', 'church'],
    description: describe('A call to servants of God who have overcome conscious sin, hate money and seek no one’s honour.', 'Un appel aux serviteurs de Dieu qui ont vaincu le péché conscient, haïssent l’argent et ne cherchent l’honneur de personne.'),
    editions: {
      en: en('The New Covenant Servant', 'the-new-covenant-servant'),
      de: cfc('Der Diener des Neuen Bundes', site('deutsch', 'de/books/the-new-covenant-servant')),
      ru: cfc('Служитель Нового Завета', site('russian', 'ru/books/the-new-covenant-servant')),
      ko: cfc('새 언약의 종', site('korean', 'books/the-new-covenant-servant-1')),
      hi: cfc('नई वाचा का सेवक', site('hindi', 'hi/books/the-new-covenant-servant')),
    },
  }),
  later({
    id: 'poonen-gods-work-done-in-gods-way',
    topics: ['church', 'leadership'],
    description: describe('How a network of churches has sought to do God’s work the way Jesus and the apostles did.', 'Comment un réseau d’Églises a cherché à faire l’œuvre de Dieu comme Jésus et les apôtres.'),
    editions: {
      en: en('God’s Work Done in God’s Way', 'gods-work-done-in-gods-way'),
      de: cfc('Gottes Werk auf Gottes Weise getan', site('deutsch', 'de/books/gods-work-done-in-gods-way')),
      ko: cfc('하나님의 방법대로 행한 하나님의 일', site('korean', 'books/gods-work-done-in-gods-way-0')),
      hi: cfc('परमेश्वर का काम परमेश्वर के तरीक़े से', site('hindi', 'hi/books/gods-work-done-in-gods-way')),
    },
  }),
  later({
    id: 'poonen-the-day-of-small-beginnings',
    topics: ['church', 'leadership'],
    description: describe('Lessons Zac Poonen and his co-workers learned in building a church: small decisions shape the work.', 'Les leçons tirées par Zac Poonen et ses collaborateurs en bâtissant une Église : de petites décisions façonnent l’œuvre.'),
    editions: {
      en: en('The Day of Small Beginnings', 'the-day-of-small-beginnings'),
      de: cfc('Aus bescheidenen Anfängen', site('deutsch', 'de/books/the-day-of-small-beginnings')),
    },
  }),
  later({
    id: 'poonen-new-wine-in-new-wineskins',
    topics: ['church'],
    description: describe('Tests the traditions that have built up in the church against God’s Word.', 'Examine à la lumière de la Parole de Dieu les traditions accumulées dans l’Église.'),
    editions: {
      en: en('New Wine in New Wineskins', 'new-wine-in-new-wineskins'),
      de: cfc('Neuer Wein in neuen Schläuchen', site('deutsch', 'de/books/new-wine-in-new-wineskins')),
      ja: cfc('新しいぶどう酒と新しい革袋', site('japanese', 'ja/books/new-wine-in-new-wineskins')),
      hi: cfc('नयी दाखमधु नयी दाखमधु की मशकों में', site('hindi', 'hi/books/new-wine-in-new-wineskins')),
    },
  }),
  later({
    id: 'santosh-poonen-congregation-club-church',
    topics: ['church'],
    description: describe('On the difference between a congregation, a club and a church.', 'Sur la différence entre une assemblée, un club et une Église.'),
    editions: {
      en: en('The Congregation, the Club and the Church', 'the-congregation-the-club-and-the-church', 'Santosh Poonen'),
      de: cfc('Die Versammlung, der Club und die Gemeinde', site('deutsch', 'de/books/the-congregation-the-club-and-the-church'), 'Santosh Poonen'),
      ja: cfc('会衆、クラブ、教会', site('japanese', 'ja/books/the-congregation-the-club-and-the-church'), 'Santosh Poonen'),
      am: cfc('ጉባኤ ከበብ ቤተ ክርስቲያን', site('amharic', 'am/books/the-congregation-the-club-and-the-church-0'), 'Santosh Poonen'),
    },
  }),
  later({
    id: 'annie-poonen-what-the-lord-has-done-for-me',
    topics: ['gospel', 'family'],
    description: describe('Annie Poonen’s testimony: her conversion, work with leprosy patients, marriage and family life.', 'Le témoignage d’Annie Poonen : sa conversion, son travail auprès de lépreux, son mariage et sa vie de famille.'),
    editions: {
      en: en('What the Lord Has Done for Me', 'what-the-lord-has-done-for-me', 'Annie Poonen'),
    },
  }),
];
