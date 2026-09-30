// The 42 days of "Psalms — Learning to Pray Everything" (see ./psalmsStudy.js
// for the plan meta, the six weekly movements and the guardrails this content
// is held to).
//
// A STUDY-mode plan: each day carries a framing `reflection` and a `study`
// layer (context, tension, questions, synthesis, prayer) rendered by
// src/components/StudyDayGuide.jsx. Study days have no prompts or practice.
//
// Original commentary only — never Bible text. Every psalm stays a reference
// for the app's own verse reader; prose describes what a passage says in its
// own words. Superscriptions are cited as ancient titles whose authorship and
// setting are debated, not as settled history.
//
// Prose is authored in en + fr; `theme` (the day title) in all 16 languages.

const L = (en, fr) => ({ en, fr });

// The despair-heavy days (lament and penitence) end their safety note with the
// same plain pointer to urgent help, after a line specific to the psalm.
const crisisNote = (en, fr) => L(
  `${en} If you feel hopeless or think about ending your life, contact your local emergency services or a crisis line now, and tell someone you trust today.`,
  `${fr} Si tu te sens sans espoir ou si tu penses à mettre fin à ta vie, contacte dès maintenant les services d’urgence ou une ligne d’écoute, et parles-en aujourd’hui à une personne de confiance.`,
);

export const DAYS = [
  // ── Week 1 · Praise and worship ──────────────────────────────────────────
  {
    movement: 'praise',
    theme: { en: 'How to read a psalm', fr: 'Comment lire un psaume', es: 'Cómo leer un salmo', pt: 'Como ler um salmo', de: 'Wie man einen Psalm liest', ru: 'Как читать псалом', zh: '如何读一篇诗篇', ja: '詩篇の読み方', ko: '시편을 읽는 법', ar: 'كيف تقرأ مزمورًا', fa: 'چگونه یک مزمور را بخوانیم', hi: 'भजन कैसे पढ़ें', id: 'Cara membaca mazmur', sw: 'Jinsi ya kusoma zaburi', tl: 'Paano basahin ang isang Awit', am: 'መዝሙርን እንዴት እናንብብ' },
    ref: 'Psalm 100',
    related: ['Psalm 95:1-7', '1 Peter 2:9-10'],
    reflection: L(
      'The Psalms are not a rulebook to apply but a prayer book to learn. For six weeks you will read one psalm a day, slowly, and put six questions to it: what it shows about God; what the psalmist is honestly living through; how the psalm moves from beginning to end; what must not be stretched into a universal promise; how it fits the wider story of Scripture; and how its words can faithfully become your own prayer. Psalm 100 is a good place to start because its shape is so clear: a call to praise, then the reason, then the call again and the reason again.',
      'Les Psaumes ne sont pas un règlement à appliquer mais un livre de prières à apprendre. Pendant six semaines, tu liras chaque jour un psaume, lentement, en lui posant six questions : ce qu’il montre de Dieu ; ce que le psalmiste vit réellement ; comment le psaume avance du début à la fin ; ce qu’il ne faut pas transformer en promesse universelle ; comment il s’inscrit dans l’ensemble de l’Écriture ; et comment ses mots peuvent devenir fidèlement ta propre prière. Le Psaume 100 est un bon point de départ, car sa forme est limpide : un appel à la louange, puis sa raison, puis de nouveau l’appel et la raison.',
    ),
    study: {
      context: L(
        'Psalm 100 is a hymn, the Psalter’s basic form of praise: commands call people to worship, and a clause beginning with “for” gives the reason. Its ancient title marks it as a psalm for thanksgiving, perhaps sung as worshippers brought a thank offering. It closes a cluster (Psalms 93–100) that celebrates the Lord as King, and it addresses the whole earth, not Israel alone. Hebrew poetry works in parallel lines — the second line echoes, sharpens or extends the first — so read in pairs of lines rather than in isolated phrases. Verse numbers in this study follow most English Bibles; some Bibles count a psalm’s title as verse 1, and some traditions number the psalms themselves one apart.',
        'Le Psaume 100 est un hymne, la forme de base de la louange dans le psautier : des impératifs appellent à l’adoration, puis une proposition introduite par « car » en donne la raison. Son titre ancien en fait un psaume pour l’action de grâces, peut-être chanté au moment d’apporter un sacrifice de reconnaissance. Il clôt un ensemble (Psaumes 93 à 100) qui célèbre le Seigneur comme Roi, et il s’adresse à toute la terre, pas seulement à Israël. La poésie hébraïque avance par vers parallèles — le second fait écho au premier, le précise ou le prolonge — : lis donc par paires de vers plutôt que par formules isolées. Les numéros de versets de cette étude suivent la numérotation des Bibles anglaises ; beaucoup de Bibles françaises (comme la Segond) comptent le titre du psaume comme verset 1, et leurs numéros sont alors décalés d’un ou deux.',
      ),
      tension: L(
        'The joy here is a summons, not a mood test. The psalm never says you must feel cheerful before you may come; the reasons it gives — who made us, whose we are, His goodness and His faithfulness — stand even on a heavy day. In the weeks ahead the same Psalter will make room for tears.',
        'La joie est ici un appel, pas un examen d’humeur. Le psaume ne dit jamais qu’il faut se sentir gai pour avoir le droit de venir ; les raisons qu’il donne — qui nous a faits, à qui nous appartenons, sa bonté et sa fidélité — tiennent même un jour de lourdeur. Dans les semaines à venir, le même psautier fera place aux larmes.',
      ),
      questions: [
        L('Observation: list every command in the psalm, then every reason introduced by “for”. How do the two lists belong together?', 'Observation : relève chaque impératif du psaume, puis chaque raison introduite par « car ». Comment les deux listes vont-elles ensemble ?'),
        L('What does this psalm reveal about God — as Maker, as Shepherd of a people, and in a faithful love that spans generations?', 'Que révèle ce psaume de Dieu — comme Créateur, comme Berger d’un peuple, et dans un amour fidèle qui traverse les générations ?'),
        L('Which of these reasons can you honestly pray today, even if your feelings lag behind?', 'Laquelle de ces raisons peux-tu prier honnêtement aujourd’hui, même si tes sentiments suivent de loin ?'),
      ],
      synthesis: L(
        'Write the six questions at the front of a notebook: 1. What does this psalm reveal about God? 2. What is the psalmist honestly experiencing? 3. What movement happens within it? 4. What should not be generalized into a universal promise? 5. How does it relate to the wider biblical story? 6. How can its language faithfully become prayer? Then answer them in a line each for Psalm 100.',
        'Note les six questions en tête d’un carnet : 1. Que révèle ce psaume de Dieu ? 2. Que vit réellement le psalmiste ? 3. Quel mouvement se produit dans le psaume ? 4. Qu’est-ce qu’il ne faut pas généraliser en promesse universelle ? 5. Comment se rattache-t-il à l’ensemble du récit biblique ? 6. Comment ses mots peuvent-ils fidèlement devenir prière ? Puis réponds en une ligne à chacune pour le Psaume 100.',
      ),
      prayer: L(
        'Lord, You made us and we belong to You. I come into Your presence with thanks — not because every part of today is easy, but because You are good and Your faithful love runs on from one generation to the next.',
        'Seigneur, c’est toi qui nous as faits et nous t’appartenons. J’entre en ta présence avec reconnaissance — non parce que tout est facile aujourd’hui, mais parce que tu es bon et que ton amour fidèle se transmet d’une génération à l’autre.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'scripture-prayer'],
  },
  {
    movement: 'praise',
    theme: { en: 'The Maker’s majesty, our dignity', fr: 'La majesté du Créateur, notre dignité', es: 'La majestad del Creador y nuestra dignidad', pt: 'A majestade do Criador e a nossa dignidade', de: 'Die Hoheit des Schöpfers, unsere Würde', ru: 'Величие Творца и наше достоинство', zh: '造物主的威严与人的尊贵', ja: '造り主の威光と人の尊さ', ko: '창조주의 위엄과 우리의 존귀함', ar: 'جلال الخالق وكرامتنا', fa: 'شکوه آفریدگار و کرامت ما', hi: 'सृष्टिकर्ता की महिमा, हमारी गरिमा', id: 'Keagungan Pencipta, martabat kita', sw: 'Utukufu wa Muumba na heshima yetu', tl: 'Kadakilaan ng Maylalang, ating dangal', am: 'የፈጣሪ ግርማና የእኛ ክብር' },
    ref: 'Psalm 8',
    related: ['Genesis 1:26-28', 'Hebrews 2:5-9', 'Matthew 21:14-16'],
    reflection: L(
      'Psalm 8 opens and closes with the same exclamation about the majesty of the Lord’s name, and everything in between sits inside that frame. Under the night sky the psalmist feels how small human beings are — and is astonished that God keeps them in mind, crowns them with glory and entrusts His works to their care. Human dignity here is a gift, not an achievement, and it lives inside God’s glory rather than competing with it.',
      'Le Psaume 8 s’ouvre et se ferme sur la même exclamation devant la majesté du nom du Seigneur, et tout ce qui se trouve entre les deux tient dans ce cadre. Sous le ciel nocturne, le psalmiste sent combien l’être humain est petit — et s’émerveille que Dieu se souvienne de lui, le couronne de gloire et lui confie ses œuvres. La dignité humaine est ici un don, non une conquête, et elle habite la gloire de Dieu au lieu de rivaliser avec elle.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, “according to the Gittith” (a musical term whose meaning is uncertain), a psalm of David. The repeated first and last verse is an inclusio, a frame that tells you what the whole poem is about. Verses 5–8 echo the creation mandate of Genesis 1:26-28. The New Testament uses the psalm three ways: Jesus cites verse 2 when children praise Him in the temple (Matthew 21:16); Hebrews 2:5-9 reads verses 4–6 as humanity’s unfinished vocation, fulfilled first in Jesus; and Paul applies verse 6 to Christ’s reign (1 Corinthians 15:27).',
        'Titre : au chef de chœur, « sur la guittith » (terme musical au sens incertain), psaume de David. Le premier et le dernier verset identiques forment une inclusion, un cadre qui indique le sujet du poème entier. Les versets 5 à 8 font écho au mandat de la création en Genèse 1.26-28. Le Nouveau Testament utilise ce psaume de trois façons : Jésus cite le verset 2 quand des enfants le louent dans le temple (Matthieu 21.16) ; Hébreux 2.5-9 lit les versets 4 à 6 comme la vocation humaine inachevée, accomplie d’abord en Jésus ; et Paul applique le verset 6 au règne du Christ (1 Corinthiens 15.27).',
      ),
      tension: L(
        'The dominion of verse 6 is delegated, royal care under God — not a licence to exploit creation or other people. Hebrews also admits plainly that we do not yet see everything subject to humanity: the psalm’s picture is fulfilled first in Jesus, not in our present achievements.',
        'La domination du verset 6 est un soin royal délégué, exercé sous l’autorité de Dieu — pas un permis d’exploiter la création ou autrui. Hébreux reconnaît d’ailleurs que nous ne voyons pas encore toutes choses soumises à l’être humain : le tableau du psaume s’accomplit d’abord en Jésus, non dans nos réussites présentes.',
      ),
      questions: [
        L('Observe the frame: what changes when you read verses 3–8 inside the refrain of verses 1 and 9?', 'Observe le cadre : qu’est-ce que cela change de lire les versets 3 à 8 à l’intérieur du refrain des versets 1 et 9 ?'),
        L('How does Hebrews 2:5-9 carry this psalm into the wider biblical story, and what does it add about Jesus?', 'Comment Hébreux 2.5-9 fait-il entrer ce psaume dans l’ensemble du récit biblique, et qu’ajoute-t-il au sujet de Jésus ?'),
        L('Where do you swing between feeling insignificant and feeling self-important? How could this psalm steady your prayer?', 'Où oscilles-tu entre te sentir insignifiant et te croire important ? Comment ce psaume pourrait-il stabiliser ta prière ?'),
      ],
      synthesis: L(
        'Draw a simple frame: write the refrain at the top and bottom of a page, and in between list what the psalm says about God, about humans and about creation. Add one thing God has entrusted to your care that you will tend this week.',
        'Dessine un cadre simple : écris le refrain en haut et en bas d’une page, et entre les deux note ce que le psaume dit de Dieu, de l’être humain et de la création. Ajoute une chose que Dieu t’a confiée et dont tu prendras soin cette semaine.',
      ),
      prayer: L(
        'Lord, when I look at the sky I feel small, and still You remember me. Thank You for the dignity You give. Keep me from grasping at it, and let my care for Your world make Your name great in all the earth.',
        'Seigneur, quand je regarde le ciel je me sens petit, et pourtant tu te souviens de moi. Merci pour la dignité que tu donnes. Garde-moi de m’en emparer, et que mon soin de ton monde rende ton nom grand sur toute la terre.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'identity'],
  },
  {
    movement: 'praise',
    theme: { en: 'Skies that speak, a word that revives', fr: 'Le ciel qui parle, la Parole qui restaure', es: 'Cielos que hablan, una Palabra que restaura', pt: 'Céus que falam, uma Palavra que restaura', de: 'Der Himmel erzählt, das Wort belebt', ru: 'Небеса говорят, Слово оживляет', zh: '诸天述说，圣言苏醒人心', ja: '語る天、生かすみことば', ko: '말하는 하늘, 소생시키는 말씀', ar: 'سماوات تتكلّم وكلمة تُحيي', fa: 'آسمان‌های گویا، کلام جان‌بخش', hi: 'बोलता आकाश, जिलाने वाला वचन', id: 'Langit yang berbicara, firman yang menyegarkan', sw: 'Mbingu zinazonena, Neno linalohuisha', tl: 'Langit na nagsasalita, Salitang nagpapanibago', am: 'የሚናገሩ ሰማያት፣ ሕይወት የሚሰጥ ቃል' },
    ref: 'Psalm 19',
    related: ['Romans 10:14-18', 'Romans 1:19-20'],
    reflection: L(
      'Psalm 19 sets two witnesses side by side. The heavens speak without words, and the sun runs its course like a bridegroom; then, abruptly, the poem turns to the Lord’s instruction, which revives the soul, gives wisdom and brings joy. Creation shows that God is glorious; His word shows who He is and how to live with Him. And the one who stands in such light becomes aware of faults he cannot even see, so the psalm ends in prayer.',
      'Le Psaume 19 place deux témoins côte à côte. Les cieux parlent sans paroles et le soleil parcourt sa course comme un jeune marié ; puis, brusquement, le poème se tourne vers l’enseignement du Seigneur, qui restaure l’âme, donne la sagesse et réjouit le cœur. La création montre que Dieu est glorieux ; sa Parole montre qui il est et comment vivre avec lui. Et celui qui se tient dans une telle lumière découvre des fautes qu’il ne voit même pas : le psaume s’achève donc en prière.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, a psalm of David. Watch the divine names: “God” (El) in the creation half, then the covenant name, the LORD, seven times in verses 7–14. Verses 7–9 use six near-synonyms for God’s instruction, each paired with a quality and an effect — a textbook case of Hebrew parallelism. Paul borrows verse 4 in Romans 10:18 to speak of the message going out to the whole world. C. S. Lewis called this the greatest poem in the Psalter.',
        'Titre : au chef de chœur, psaume de David. Observe les noms divins : « Dieu » (El) dans la partie sur la création, puis le nom de l’alliance, l’Éternel, sept fois aux versets 7 à 14. Les versets 7 à 9 emploient six quasi-synonymes pour l’enseignement de Dieu, chacun associé à une qualité et à un effet — un cas d’école de parallélisme hébraïque. Paul reprend le verset 4 en Romains 10.18 pour parler du message qui atteint le monde entier. C. S. Lewis voyait dans ce psaume le plus beau poème du psautier.',
      ),
      tension: L(
        'Creation’s witness is real but wordless; the psalm does not make nature a substitute for God’s spoken word. And “law” here is Torah — instruction given in covenant love, not a cold rulebook; the psalmist finds it sweeter than honey. Read the delight before you read the demands.',
        'Le témoignage de la création est réel mais sans paroles ; le psaume ne fait pas de la nature un substitut à la Parole de Dieu. Et la « loi » est ici la Torah — un enseignement donné dans l’amour de l’alliance, pas un règlement froid ; le psalmiste la trouve plus douce que le miel. Lis la joie avant de lire les exigences.',
      ),
      questions: [
        L('Where exactly does the psalm turn from the sky to God’s instruction? Which words and names change there?', 'À quel endroit précis le psaume passe-t-il du ciel à l’enseignement de Dieu ? Quels mots et quels noms changent à ce moment-là ?'),
        L('What does the psalmist say God’s word does in a person, and why does that lead him to pray about hidden faults and wilful sin (verses 12–13)?', 'Selon le psalmiste, que fait la Parole de Dieu dans une personne, et pourquoi cela le conduit-il à prier au sujet des fautes cachées et de l’orgueil (versets 12-13) ?'),
        L('Turn verse 14 into a prayer about the words you expect to speak today and the thoughts you have been nursing.', 'Fais du verset 14 une prière au sujet des paroles que tu t’attends à prononcer aujourd’hui et des pensées que tu entretiens.'),
      ],
      synthesis: L(
        'Make two columns: what creation tells about God, and what His word tells that creation cannot. Choose one line from verses 7–11 to read slowly each morning this week.',
        'Fais deux colonnes : ce que la création dit de Dieu, et ce que sa Parole dit que la création ne peut pas dire. Choisis une ligne des versets 7 à 11 à relire lentement chaque matin cette semaine.',
      ),
      prayer: L(
        'God of the heavens, Your glory fills the sky and Your word gives life. Cleanse me from faults I cannot see, hold me back from wilful sin, and let my words and my thoughts be pleasing to You, my Rock and my Redeemer.',
        'Dieu des cieux, ta gloire remplit le ciel et ta Parole donne la vie. Purifie-moi des fautes que je ne vois pas, retiens-moi loin de l’orgueil, et que mes paroles et mes pensées te soient agréables, toi mon Rocher et mon Rédempteur.',
      ),
    },
    resourceTopics: ['psalms', 'scripture-prayer', 'holiness'],
  },
  {
    movement: 'praise',
    theme: { en: 'The voice over the storm', fr: 'La voix au-dessus de l’orage', es: 'La voz sobre la tormenta', pt: 'A voz sobre a tempestade', de: 'Die Stimme über dem Sturm', ru: 'Глас над бурей', zh: '风暴之上的声音', ja: '嵐にまさる主の声', ko: '폭풍 위의 음성', ar: 'الصوت فوق العاصفة', fa: 'صدایی فراتر از طوفان', hi: 'तूफ़ान के ऊपर की वाणी', id: 'Suara di atas badai', sw: 'Sauti iliyo juu ya dhoruba', tl: 'Ang tinig sa ibabaw ng unos', am: 'ከማዕበሉ በላይ ያለው ድምፅ' },
    ref: 'Psalm 29',
    related: ['Mark 4:35-41', 'Genesis 9:8-17'],
    reflection: L(
      'Psalm 29 is a thunderstorm set to music. The voice of the Lord sounds seven times: over the sea, splintering the cedars of Lebanon, shaking the wilderness, while in His temple everyone cries “Glory!” Then the storm passes, and the last line is a prayer for strength and peace for His people. The power that makes forests tremble is the same power that blesses those who trust Him.',
      'Le Psaume 29 est un orage mis en musique. La voix du Seigneur retentit sept fois : sur la mer, brisant les cèdres du Liban, secouant le désert, tandis que dans son temple tous s’écrient « Gloire ! ». Puis l’orage passe, et la dernière ligne est une prière pour la force et la paix de son peuple. La puissance qui fait trembler les forêts est celle-là même qui bénit ceux qui se confient en lui.',
    ),
    study: {
      context: L(
        'Title: a psalm of David. Many scholars note that it uses imagery Israel’s neighbours applied to Baal, the Canaanite storm god, and turns it into a confession: the Lord, not Baal, rules the storm. The storm travels from the Mediterranean north to Lebanon and Sirion (Mount Hermon), then south to the wilderness of Kadesh — across the whole land. Verse 1 summons the heavenly beings to worship; verse 10 uses the rare Hebrew word for the Flood of Genesis 6–9: the Lord sits enthroned over it as King.',
        'Titre : psaume de David. Beaucoup de spécialistes remarquent qu’il reprend des images que les voisins d’Israël appliquaient à Baal, le dieu cananéen de l’orage, pour en faire une confession : c’est l’Éternel, et non Baal, qui règne sur la tempête. L’orage part de la Méditerranée, monte au nord vers le Liban et le Sirion (le mont Hermon), puis descend au sud jusqu’au désert de Kadès — à travers tout le pays. Le verset 1 invite les êtres célestes à l’adoration ; le verset 10 emploie le mot hébreu rare qui désigne le Déluge de Genèse 6 à 9 : l’Éternel y siège en Roi.',
      ),
      tension: L(
        'The psalm does not say that every storm, earthquake or disaster is a personal message from God to someone. It says that no power in creation rivals Him. When Jesus stills the storm in Mark 4, the disciples are left asking who can command wind and water — a question this psalm has already answered.',
        'Le psaume ne dit pas que chaque tempête, séisme ou catastrophe est un message personnel de Dieu à quelqu’un. Il dit qu’aucune puissance de la création ne rivalise avec lui. Quand Jésus apaise la tempête en Marc 4, les disciples se demandent qui peut commander au vent et à la mer — une question à laquelle ce psaume a déjà répondu.',
      ),
      questions: [
        L('Count the seven lines about the voice of the Lord. Where does the storm travel, and what does it do on the way?', 'Compte les sept lignes sur la voix de l’Éternel. Où l’orage passe-t-il, et que fait-il sur son chemin ?'),
        L('What does this psalm reveal about God’s power — and why does it end with strength and peace rather than fear?', 'Que révèle ce psaume de la puissance de Dieu — et pourquoi s’achève-t-il sur la force et la paix plutôt que sur la peur ?'),
        L('Which storm in your life or in the world seems to have the last word? Pray the final verse over it.', 'Quelle tempête, dans ta vie ou dans le monde, semble avoir le dernier mot ? Prie le dernier verset sur elle.'),
      ],
      synthesis: L(
        'Write one sentence contrasting how the psalm begins (heavenly beings summoned to worship) and how it ends (a people blessed with peace). Then name the place where you most need to confess today that the Lord reigns over the flood.',
        'Écris une phrase qui oppose le début du psaume (les êtres célestes appelés à l’adoration) et sa fin (un peuple béni par la paix). Puis nomme l’endroit où tu as le plus besoin de confesser aujourd’hui que l’Éternel règne sur le déluge.',
      ),
      prayer: L(
        'Lord, Your voice is stronger than any storm, and You sit as King over the flood. I give You the glory. Give strength to Your people, and bless us with Your peace.',
        'Seigneur, ta voix est plus forte que toute tempête, et tu sièges en Roi au-dessus du déluge. Je te rends gloire. Donne la force à ton peuple et bénis-nous par ta paix.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'kingdom-of-god'],
  },
  {
    movement: 'praise',
    theme: { en: 'The word that made the heavens', fr: 'La parole qui a fait les cieux', es: 'La palabra que hizo los cielos', pt: 'A palavra que fez os céus', de: 'Das Wort, das den Himmel schuf', ru: 'Слово, сотворившее небеса', zh: '造成诸天的话语', ja: '天を造ったみことば', ko: '하늘을 지은 말씀', ar: 'الكلمة التي صنعت السماوات', fa: 'کلامی که آسمان‌ها را آفرید', hi: 'वह वचन जिसने आकाश रचा', id: 'Firman yang menjadikan langit', sw: 'Neno lililoziumba mbingu', tl: 'Ang salitang lumikha ng langit', am: 'ሰማያትን የፈጠረው ቃል' },
    ref: 'Psalm 33',
    related: ['John 1:1-3', 'Hebrews 11:3'],
    reflection: L(
      'Psalm 33 calls for a new song and gives two great reasons for it: the Lord’s word made the heavens, and the Lord’s plans outlast the plans of every nation. Between them sits a sober line about kings and armies — great forces do not save. The psalm ends not with a victory parade but with a people waiting for the Lord and asking that His steadfast love rest on them as they hope in Him.',
      'Le Psaume 33 appelle un chant nouveau et en donne deux grandes raisons : la parole du Seigneur a fait les cieux, et ses projets survivent à ceux de toutes les nations. Entre les deux se trouve une ligne sobre sur les rois et les armées : les grandes forces ne sauvent pas. Le psaume ne se termine pas sur un défilé de victoire, mais sur un peuple qui attend le Seigneur et lui demande que son amour fidèle repose sur lui, selon l’espérance qu’il met en lui.',
    ),
    study: {
      context: L(
        'Psalm 33 has no title, unusual in Book 1, and reads like a companion to Psalm 32, which ends where this one begins — with the upright called to rejoice. It has twenty-two verses, the number of letters in the Hebrew alphabet: a hint of completeness, though it is not an acrostic. Verse 6 sets “word” and “breath” (ruach, also “spirit”) in parallel; Christians later read that line alongside John 1:1-3 and the Spirit’s work in creation, a fair canonical reading rather than the psalmist’s stated meaning. Hebrews 11:3 carries the same conviction.',
        'Le Psaume 33 n’a pas de titre, ce qui est rare dans le premier livre, et se lit comme le compagnon du Psaume 32, qui s’achève là où celui-ci commence — par un appel à la joie adressé aux hommes droits. Il compte vingt-deux versets, le nombre de lettres de l’alphabet hébreu : un indice de plénitude, même si ce n’est pas un acrostiche. Le verset 6 met en parallèle « parole » et « souffle » (rouah, qui signifie aussi « esprit ») ; les chrétiens ont ensuite lu cette ligne avec Jean 1.1-3 et l’œuvre de l’Esprit dans la création — une lecture canonique légitime, plutôt que le sens déclaré du psalmiste. Hébreux 11.3 porte la même conviction.',
      ),
      tension: L(
        'Verse 19 speaks of God keeping His people alive in famine. It is a confession of trust, not a guarantee that no believer will ever go hungry; Scripture itself remembers faithful people who suffered want (Hebrews 11:37). Nor is the warning about armies a defence policy: it concerns where a people place their final hope.',
        'Le verset 19 parle de Dieu qui garde son peuple en vie pendant la famine. C’est une confession de confiance, pas la garantie qu’aucun croyant n’aura jamais faim ; l’Écriture elle-même se souvient de fidèles qui ont manqué de tout (Hébreux 11.37). L’avertissement au sujet des armées n’est pas non plus une politique de défense : il porte sur l’endroit où un peuple place son espérance ultime.',
      ),
      questions: [
        L('Trace the movement: call to praise (1–3), creation by the word (4–9), the nations’ plans and God’s plan (10–19), waiting (20–22). Where is the turning point?', 'Suis le mouvement : appel à la louange (1-3), création par la parole (4-9), projets des nations et projet de Dieu (10-19), attente (20-22). Où se trouve le tournant ?'),
        L('What does it reveal about God that His word creates and His counsel stands? How does John 1:1-3 deepen this?', 'Que révèle de Dieu le fait que sa parole crée et que son dessein subsiste ? Comment Jean 1.1-3 approfondit-il cela ?'),
        L('What “war horse” — a resource you quietly trust to save you — could you name before God today?', 'Quel « cheval de guerre » — une ressource en laquelle tu te confies discrètement pour être sauvé — pourrais-tu nommer devant Dieu aujourd’hui ?'),
      ],
      synthesis: L(
        'List three human plans (yours, your church’s or your nation’s) and beside each write one line of prayer that hands it back to God’s counsel. Note what waiting might look like for one of them.',
        'Note trois projets humains (les tiens, ceux de ton Église ou de ton pays) et, à côté de chacun, écris une ligne de prière qui le remet au dessein de Dieu. Indique à quoi pourrait ressembler l’attente pour l’un d’eux.',
      ),
      prayer: L(
        'Lord, by Your word the heavens were made, and Your plans stand for ever. I let go of the false hopes I lean on. Let Your steadfast love rest on us as we put our hope in You.',
        'Seigneur, par ta parole les cieux ont été faits, et tes projets subsistent à jamais. Je lâche les faux espoirs sur lesquels je m’appuie. Que ton amour fidèle repose sur nous, selon l’espérance que nous mettons en toi.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'trust'],
  },
  {
    movement: 'praise',
    theme: { en: 'King over all the earth', fr: 'Roi de toute la terre', es: 'Rey de toda la tierra', pt: 'Rei de toda a terra', de: 'König über die ganze Erde', ru: 'Царь всей земли', zh: '全地的大君王', ja: '全地の王', ko: '온 땅의 왕', ar: 'ملك على كل الأرض', fa: 'پادشاه تمامی زمین', hi: 'सारी पृथ्वी का राजा', id: 'Raja atas seluruh bumi', sw: 'Mfalme wa dunia yote', tl: 'Hari ng buong daigdig', am: 'የምድር ሁሉ ንጉሥ' },
    ref: 'Psalm 47',
    related: ['Genesis 12:1-3', 'Galatians 3:7-9', 'Philippians 2:9-11'],
    reflection: L(
      'Psalm 47 invites every people on earth to clap and shout for Israel’s God, because He is the great King over all the earth. It ends with a startling picture: the leaders of the nations gathered as the people of the God of Abraham. The old promise that all the families of the earth would be blessed through Abraham (Genesis 12:3) is already glimmering here. The King’s rule is good news for the nations, not a trophy for one nation.',
      'Le Psaume 47 invite tous les peuples de la terre à applaudir et à acclamer le Dieu d’Israël, car il est le grand Roi de toute la terre. Il s’achève sur une image saisissante : les chefs des nations rassemblés comme peuple du Dieu d’Abraham. L’ancienne promesse selon laquelle toutes les familles de la terre seraient bénies en Abraham (Genèse 12.3) brille déjà ici. Le règne de ce Roi est une bonne nouvelle pour les nations, pas le trophée d’une seule nation.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, a psalm of the Sons of Korah, a Levite family of temple singers. It belongs with the “enthronement psalms” (47, 93, 96–99) that celebrate the Lord as King; verse 5 pictures God going up amid shouts and trumpets, perhaps recalling a procession with the ark. Verses 6–7 repeat the call to sing praises four times in quick succession. The church has long read this psalm on Ascension Day, linking it with Christ’s exaltation (Acts 1:9-11) — a liturgical reading, not a New Testament quotation.',
        'Titre : au chef de chœur, psaume des fils de Koré, une famille lévite de chantres du temple. Il fait partie des « psaumes d’intronisation » (47, 93, 96 à 99) qui célèbrent le Seigneur comme Roi ; le verset 5 montre Dieu qui monte au milieu des acclamations et du son du cor, peut-être en souvenir d’une procession avec l’arche. Les versets 6 et 7 répètent quatre fois de suite l’appel à chanter. L’Église lit depuis longtemps ce psaume le jour de l’Ascension, en le reliant à l’élévation du Christ (Actes 1.9-11) — une lecture liturgique, non une citation du Nouveau Testament.',
      ),
      tension: L(
        'Verse 3 speaks of peoples subdued under Israel. Read within the whole canon, the Lord’s kingship gives no nation, church or ethnic group licence to dominate others: by verse 9 the nations have become worshippers, and Paul sees the gospel as Abraham’s blessing reaching the nations (Galatians 3:8).',
        'Le verset 3 parle de peuples soumis à Israël. Lu dans l’ensemble du canon, le règne du Seigneur n’autorise aucune nation, Église ou ethnie à dominer les autres : au verset 9, les nations sont devenues des adorateurs, et Paul voit dans l’Évangile la bénédiction d’Abraham qui rejoint les nations (Galates 3.8).',
      ),
      questions: [
        L('Who is addressed in verse 1, and who is gathered in verse 9? What has happened between the two?', 'Qui est interpellé au verset 1, et qui est rassemblé au verset 9 ? Que s’est-il passé entre les deux ?'),
        L('How does this psalm relate to God’s promise to Abraham and to the gospel going out to the nations?', 'Comment ce psaume se rattache-t-il à la promesse faite à Abraham et à l’Évangile annoncé aux nations ?'),
        L('Which people or nation do you find hard to imagine worshipping beside you? How can you pray for them today?', 'Quel peuple ou quelle nation as-tu du mal à imaginer en train d’adorer à tes côtés ? Comment peux-tu prier pour eux aujourd’hui ?'),
      ],
      synthesis: L(
        'Write the name of one nation or people group and one concrete way to pray for them this week — perhaps through a missionary you know or a church that suffers for its faith.',
        'Écris le nom d’une nation ou d’un peuple et une manière concrète de prier pour eux cette semaine — peut-être à travers un missionnaire que tu connais ou une Église qui souffre pour sa foi.',
      ),
      prayer: L(
        'God Most High, You are King over all the earth. I sing Your praise, and I pray for the nations: gather them as Your people with the family of Abraham, under the rule of Your Son.',
        'Dieu Très-Haut, tu es Roi de toute la terre. Je chante ta louange et je prie pour les nations : rassemble-les comme ton peuple avec la famille d’Abraham, sous le règne de ton Fils.',
      ),
    },
    resourceTopics: ['psalms', 'kingdom-of-god', 'mission'],
  },
  {
    movement: 'praise',
    theme: { en: 'His glory among the nations', fr: 'Sa gloire parmi les nations', es: 'Su gloria entre las naciones', pt: 'Sua glória entre as nações', de: 'Seine Herrlichkeit unter den Völkern', ru: 'Его слава среди народов', zh: '主的荣耀在万民中', ja: '国々の中に主の栄光を', ko: '열방 가운데 그의 영광', ar: 'مجده بين الأمم', fa: 'جلال او در میان قوم‌ها', hi: 'जातियों में उसकी महिमा', id: 'Kemuliaan-Nya di antara bangsa-bangsa', sw: 'Utukufu wake kati ya mataifa', tl: 'Ang Kanyang kaluwalhatian sa mga bansa', am: 'ክብሩ በአሕዛብ መካከል' },
    ref: 'Psalm 96',
    related: ['1 Chronicles 16:23-33', 'Revelation 5:9-10'],
    reflection: L(
      'Psalm 96 takes up the new song of Psalm 33 and sends it to the ends of the earth: His salvation is to be announced day after day and His glory made known among the nations. It even borrows the opening call of Psalm 29 — but where Psalm 29 summoned heavenly beings, this psalm summons the families of the peoples. It ends with creation itself singing, because the Lord comes to judge the world in righteousness. Judgment here is good news: the world set right at last.',
      'Le Psaume 96 reprend le chant nouveau du Psaume 33 et l’envoie jusqu’aux extrémités de la terre : son salut doit être annoncé de jour en jour et sa gloire racontée parmi les nations. Il emprunte même l’appel initial du Psaume 29 — mais là où le Psaume 29 convoquait les êtres célestes, celui-ci convoque les familles des peuples. Il s’achève sur la création qui chante, car le Seigneur vient juger le monde avec justice. Le jugement est ici une bonne nouvelle : le monde enfin remis en ordre.',
    ),
    study: {
      context: L(
        'Psalm 96 has no title in the Hebrew text, but a version of it appears in 1 Chronicles 16:23-33, when David brings the ark to Jerusalem. Verse 5 plays on words: the gods of the nations are elilim, “worthless nothings”, while the Lord made the heavens. Verses 7–9 echo Psalm 29:1-2 almost exactly, now addressed to the nations. The new song returns in Revelation 5:9-10, sung to the Lamb by people from every tribe and nation.',
        'Le Psaume 96 n’a pas de titre dans le texte hébreu, mais une version s’en trouve en 1 Chroniques 16.23-33, lorsque David amène l’arche à Jérusalem. Le verset 5 joue sur les mots : les dieux des nations sont des elilim, des « néants », tandis que l’Éternel a fait les cieux. Les versets 7 à 9 reprennent presque mot pour mot Psaume 29.1-2, adressés cette fois aux nations. Le chant nouveau revient en Apocalypse 5.9-10, chanté à l’Agneau par des gens de toute tribu et de toute nation.',
      ),
      tension: L(
        'Declaring God’s reign among the nations is not the same as imposing a culture or winning an argument. The psalm’s witness is joyful worship and truthful speech, and its confidence rests on God’s coming to set things right — not on our pressure.',
        'Proclamer le règne de Dieu parmi les nations, ce n’est ni imposer une culture ni gagner un débat. Le témoignage du psaume est une adoration joyeuse et une parole vraie, et son assurance repose sur la venue de Dieu pour remettre toutes choses en ordre — non sur notre pression.',
      ),
      questions: [
        L('Compare verses 7–9 with Psalm 29:1-2. Who is invited now, and why does that matter?', 'Compare les versets 7 à 9 avec Psaume 29.1-2. Qui est invité maintenant, et pourquoi est-ce important ?'),
        L('Why does creation rejoice at God’s coming to judge (verses 11–13)? What does that reveal about His justice?', 'Pourquoi la création se réjouit-elle de la venue de Dieu pour juger (versets 11-13) ? Que révèle cela de sa justice ?'),
        L('Whom could you tell this week, in words or in kindness, what God has done?', 'À qui pourrais-tu dire cette semaine, en paroles ou par un geste de bonté, ce que Dieu a fait ?'),
      ],
      synthesis: L(
        'Week review: write one line for each psalm of this week (100, 8, 19, 29, 33, 47, 96) naming the reason it gives for praise. Review question: which reason came most easily to you in prayer, and which felt furthest away?',
        'Bilan de la semaine : écris une ligne pour chaque psaume de la semaine (100, 8, 19, 29, 33, 47, 96) en nommant la raison de louer qu’il donne. Question de bilan : quelle raison t’est venue le plus facilement dans la prière, et laquelle t’a semblé la plus lointaine ?',
      ),
      prayer: L(
        'Lord, I sing a new song to You. Let Your salvation be told from day to day, among my neighbours and among the nations, until the whole earth rejoices that You come to set the world right.',
        'Seigneur, je te chante un chant nouveau. Que ton salut soit annoncé de jour en jour, parmi mes voisins et parmi les nations, jusqu’à ce que toute la terre se réjouisse de ta venue pour remettre le monde en ordre.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'mission'],
  },

  // ── Week 2 · Trust and refuge ────────────────────────────────────────────
  {
    movement: 'trust',
    theme: { en: 'The Shepherd in the dark valley', fr: 'Le Berger dans la vallée sombre', es: 'El Pastor en el valle oscuro', pt: 'O Pastor no vale escuro', de: 'Der Hirte im finsteren Tal', ru: 'Пастырь в тёмной долине', zh: '幽谷中的牧者', ja: '暗い谷を共に行く羊飼い', ko: '어두운 골짜기의 목자', ar: 'الراعي في الوادي المظلم', fa: 'شبان در درّهٔ تاریک', hi: 'अंधेरी घाटी में चरवाहा', id: 'Gembala di lembah yang kelam', sw: 'Mchungaji katika bonde la giza', tl: 'Ang Pastol sa madilim na lambak', am: 'በጨለማው ሸለቆ ያለው እረኛ' },
    ref: 'Psalm 23',
    related: ['Ezekiel 34:11-16', 'John 10:11-15'],
    reflection: L(
      'Psalm 23 is so familiar that many people hear it only at funerals. Read slowly, it moves. The psalmist speaks about the Lord in the third person while he is led to green pasture and along right paths; then, exactly when the valley turns deathly dark, he stops speaking about Him and starts speaking to Him, because He is there. The last scene changes from shepherd to host, who spreads a table while enemies look on. Trust in this psalm is not the absence of darkness but company within it.',
      'Le Psaume 23 est si familier que beaucoup ne l’entendent plus qu’aux enterrements. Lu lentement, il avance. Le psalmiste parle du Seigneur à la troisième personne tant qu’il est conduit vers de verts pâturages et sur des sentiers droits ; puis, précisément quand la vallée devient sombre comme la mort, il cesse de parler de lui et se met à lui parler, parce qu’il est là. La dernière scène passe du berger à l’hôte, qui dresse une table sous le regard des ennemis. La confiance, dans ce psaume, n’est pas l’absence de ténèbres, mais une présence au cœur de celles-ci.',
    ),
    study: {
      context: L(
        'Title: a psalm of David. It is a psalm of trust built on two images: the shepherd (verses 1–4) and the host (verses 5–6). In the ancient Near East “shepherd” was a title for kings; Ezekiel 34 condemns Israel’s selfish shepherds and promises that God Himself will shepherd His flock. Jesus takes up that promise when He calls Himself the good shepherd who lays down His life for the sheep (John 10:11). The verb usually translated “follow” in verse 6 is stronger in Hebrew: goodness and steadfast love pursue the psalmist.',
        'Titre : psaume de David. C’est un psaume de confiance bâti sur deux images : le berger (versets 1 à 4) et l’hôte (versets 5 et 6). Dans le Proche-Orient ancien, « berger » était un titre royal ; Ézéchiel 34 condamne les bergers égoïstes d’Israël et promet que Dieu lui-même fera paître son troupeau. Jésus reprend cette promesse quand il se présente comme le bon berger qui donne sa vie pour ses brebis (Jean 10.11). Le verbe souvent traduit par « accompagner » au verset 6 est plus fort en hébreu : la bonté et l’amour fidèle poursuivent le psalmiste.',
      ),
      tension: L(
        'The psalm does not promise that believers will lack nothing they want, nor that the valley can be avoided — the right path runs through it. And it is not only for the dying: it was written for the living, surrounded by real enemies, who need to know at whose table they eat.',
        'Le psaume ne promet pas que le croyant ne manquera de rien de ce qu’il désire, ni que la vallée peut être évitée — le bon chemin la traverse. Et il n’est pas réservé aux mourants : il a été écrit pour des vivants, entourés de vrais ennemis, qui ont besoin de savoir à quelle table ils mangent.',
      ),
      questions: [
        L('Mark where the psalm shifts from “He” to “You”. What is happening in the psalm at that exact point?', 'Repère où le psaume passe de « il » à « tu ». Que se passe-t-il dans le psaume à ce moment précis ?'),
        L('How do Ezekiel 34:11-16 and John 10:11-15 carry the shepherd image through the wider biblical story?', 'Comment Ézéchiel 34.11-16 et Jean 10.11-15 prolongent-ils l’image du berger dans l’ensemble du récit biblique ?'),
        L('Through which valley are you, or someone you love, walking now? Pray verse 4 in your own words for that place.', 'Quelle vallée traverses-tu en ce moment, toi ou quelqu’un que tu aimes ? Prie le verset 4 avec tes propres mots pour ce lieu-là.'),
      ],
      synthesis: L(
        'Write two short lists: what the Shepherd does (verses 1–4) and what the Host does (verses 5–6). Circle the one you most need this week and write a one-sentence prayer from it.',
        'Écris deux courtes listes : ce que fait le Berger (versets 1 à 4) et ce que fait l’Hôte (versets 5 et 6). Entoure ce dont tu as le plus besoin cette semaine et écris-en une prière d’une phrase.',
      ),
      prayer: L(
        'Lord, You are my Shepherd. Lead me in right paths for the sake of Your name. In the dark valley I will not be alone, because You are there; let Your goodness and faithful love pursue me all my days.',
        'Seigneur, tu es mon Berger. Conduis-moi dans les bons sentiers, à cause de ton nom. Dans la vallée sombre je ne serai pas seul, car tu es là ; que ta bonté et ton amour fidèle me poursuivent tous les jours de ma vie.',
      ),
    },
    resourceTopics: ['psalms', 'trust', 'suffering'],
  },
  {
    movement: 'trust',
    theme: { en: 'The Lord, my portion', fr: 'Le Seigneur, ma part', es: 'El Señor, mi porción', pt: 'O Senhor, minha porção', de: 'Der Herr, mein Anteil', ru: 'Господь — мой удел', zh: '主是我的产业', ja: '主こそ私の受ける分', ko: '주는 나의 분깃', ar: 'الرب نصيبي', fa: 'خداوند، سهم من', hi: 'प्रभु मेरा भाग है', id: 'Tuhan, bagianku', sw: 'Bwana ndiye fungu langu', tl: 'Ang Panginoon, aking bahagi', am: 'እግዚአብሔር ዕድል ፈንታዬ' },
    ref: 'Psalm 16',
    related: ['Numbers 18:20', 'Acts 2:22-32', 'Acts 13:34-37'],
    reflection: L(
      'Psalm 16 is the prayer of someone who has chosen. Around him others run after other gods; he refuses their offerings and declares that the Lord Himself is his portion and his cup. The language comes from the sharing out of the land among Israel’s tribes: the Levites received no territory because the Lord was their inheritance. That choice gives the psalmist a strange security — even death, he says, will not have the last word — and at Pentecost Peter will stand up in Jerusalem to explain why.',
      'Le Psaume 16 est la prière de quelqu’un qui a choisi. Autour de lui, d’autres courent après d’autres dieux ; il refuse leurs offrandes et déclare que le Seigneur lui-même est sa part et sa coupe. Le vocabulaire vient du partage du pays entre les tribus d’Israël : les Lévites n’avaient reçu aucun territoire, car le Seigneur était leur héritage. Ce choix donne au psalmiste une étrange sécurité — même la mort, dit-il, n’aura pas le dernier mot — et à la Pentecôte, Pierre se lèvera à Jérusalem pour expliquer pourquoi.',
    ),
    study: {
      context: L(
        'Title: a miktam of David, a term of uncertain meaning that also heads Psalms 56–60. The “boundary lines” of verse 6 are the surveyor’s cords that marked out each family’s allotment, and “portion” recalls Numbers 18:20, where the Lord tells Aaron that He is his share among Israel. Verses 8–11 are quoted by Peter in Acts 2:25-31 and by Paul in Acts 13:35-37. Both argue that David died and his body decayed, so the psalm’s hope reaches beyond him to Jesus, whom God raised from the dead.',
        'Titre : miktam de David, un terme au sens incertain qui figure aussi en tête des Psaumes 56 à 60. Les « cordeaux » du verset 6 sont ceux de l’arpenteur qui délimitaient la parcelle de chaque famille, et la « part » rappelle Nombres 18.20, où le Seigneur dit à Aaron qu’il est lui-même sa part au milieu d’Israël. Les versets 8 à 11 sont cités par Pierre en Actes 2.25-31 et par Paul en Actes 13.35-37. Tous deux soulignent que David est mort et que son corps a connu la corruption : l’espérance du psaume va donc au-delà de lui, jusqu’à Jésus, que Dieu a ressuscité.',
      ),
      tension: L(
        'Verse 10 is not a promise that believers will escape death or serious illness. The apostles read it as fulfilled in Christ’s resurrection, and our hope rests there: because He was not abandoned to the grave, those who belong to Him will share His life. Nor should the “pleasant places” of verse 6 become a promise of comfortable circumstances; the psalmist’s delightful inheritance is God Himself.',
        'Le verset 10 ne promet pas que le croyant échappera à la mort ou à une maladie grave. Les apôtres le lisent comme accompli dans la résurrection du Christ, et c’est là que repose notre espérance : parce qu’il n’a pas été abandonné au séjour des morts, ceux qui lui appartiennent partageront sa vie. Les « lieux agréables » du verset 6 ne doivent pas non plus devenir une promesse de circonstances confortables : l’héritage qui réjouit le psalmiste, c’est Dieu lui-même.',
      ),
      questions: [
        L('What does the psalmist refuse (verse 4), and what does he choose (verses 5–6)? How does the land-inheritance language shape the meaning?', 'Que refuse le psalmiste (verset 4), et que choisit-il (versets 5-6) ? Comment le vocabulaire de l’héritage du pays éclaire-t-il le sens ?'),
        L('Read Acts 2:22-32. How does Peter’s reading of verses 8–11 connect this psalm with the resurrection of Jesus?', 'Lis Actes 2.22-32. Comment la lecture que Pierre fait des versets 8 à 11 relie-t-elle ce psaume à la résurrection de Jésus ?'),
        L('What else competes to be your “portion”? Tell God honestly, then pray verses 5 and 11 as your own choice today.', 'Qu’est-ce qui cherche à devenir ta « part » à la place de Dieu ? Dis-le-lui honnêtement, puis prie les versets 5 et 11 comme ton propre choix aujourd’hui.'),
      ],
      synthesis: L(
        'Draw a small plot of land and write inside it what makes the Lord your inheritance. Outside its border, write what you are tempted to run after instead. Note one way you will keep the Lord before you this week (verse 8).',
        'Dessine une petite parcelle et écris à l’intérieur ce qui fait du Seigneur ton héritage. À l’extérieur de la limite, écris ce après quoi tu es tenté de courir. Note une manière de garder le Seigneur devant toi cette semaine (verset 8).',
      ),
      prayer: L(
        'Lord, You are my portion and my cup; my future is in Your hands. Keep me from running after other gods. Show me the path of life, and let me find in Your presence a joy that death cannot take away.',
        'Seigneur, tu es ma part et ma coupe ; mon avenir est entre tes mains. Garde-moi de courir après d’autres dieux. Montre-moi le chemin de la vie, et fais-moi trouver en ta présence une joie que la mort ne peut pas m’enlever.',
      ),
    },
    resourceTopics: ['psalms', 'trust', 'gospel'],
  },
  {
    movement: 'trust',
    theme: { en: 'Confidence and fear in one prayer', fr: 'Confiance et crainte dans une même prière', es: 'Confianza y temor en una misma oración', pt: 'Confiança e medo na mesma oração', de: 'Vertrauen und Angst in einem Gebet', ru: 'Уверенность и страх в одной молитве', zh: '同一祷告中的信靠与惧怕', ja: '一つの祈りの中の確信と恐れ', ko: '한 기도 안의 확신과 두려움', ar: 'الثقة والخوف في صلاة واحدة', fa: 'اطمینان و ترس در یک دعا', hi: 'एक ही प्रार्थना में भरोसा और भय', id: 'Keyakinan dan takut dalam satu doa', sw: 'Ujasiri na hofu katika ombi moja', tl: 'Pagtitiwala at takot sa iisang panalangin', am: 'እምነትና ፍርሃት በአንድ ጸሎት' },
    ref: 'Psalm 27',
    related: ['Luke 10:38-42', 'Isaiah 40:27-31'],
    reflection: L(
      'Psalm 27 seems to change mood halfway through. Verses 1–6 are bold: the Lord is light and salvation, so there is no one to fear. Then from verse 7 the psalmist pleads with God not to hide His face or cast him off, as if fear had come back. Some scholars think two psalms have been joined; either way, Scripture now gives them to us as one prayer. Confidence and anxiety can live in the same heart, and the psalm ends not with a feeling but with a decision — to wait for the Lord.',
      'Le Psaume 27 semble changer d’humeur en son milieu. Les versets 1 à 6 sont audacieux : le Seigneur est lumière et salut, il n’y a donc personne à craindre. Puis, à partir du verset 7, le psalmiste supplie Dieu de ne pas lui cacher sa face ni le rejeter, comme si la peur était revenue. Certains spécialistes pensent que deux psaumes ont été réunis ; quoi qu’il en soit, l’Écriture nous les donne désormais comme une seule prière. La confiance et l’angoisse peuvent habiter le même cœur, et le psaume ne s’achève pas sur un sentiment, mais sur une décision : attendre le Seigneur.',
    ),
    study: {
      context: L(
        'Title: of David. Verses 1–6 speak about God, verses 7–14 speak to Him — a shift you will meet often in the Psalms. The “one thing” of verse 4, to dwell in the Lord’s house and gaze on His beauty, is the heart of the psalm and bridges both halves. Verse 8 records an inner dialogue: the psalmist’s heart repeats God’s own invitation to seek His face. Verse 10 speaks of father and mother forsaking him, a line many readers have prayed through real rejection.',
        'Titre : de David. Les versets 1 à 6 parlent de Dieu, les versets 7 à 14 lui parlent — un passage que tu rencontreras souvent dans les Psaumes. L’« unique demande » du verset 4, habiter la maison du Seigneur et contempler sa beauté, est le cœur du psaume et relie ses deux moitiés. Le verset 8 rapporte un dialogue intérieur : le cœur du psalmiste reprend l’invitation de Dieu lui-même à rechercher sa face. Le verset 10 évoque un père et une mère qui l’abandonnent, une ligne que beaucoup de lecteurs ont priée au milieu d’un rejet bien réel.',
      ),
      tension: L(
        'The bold opening does not mean that a person of faith no longer feels fear; the second half shows the same believer trembling. And verse 10 does not make parental abandonment a small thing: it names a real wound and entrusts it to God, who takes in the forsaken.',
        'L’ouverture audacieuse ne signifie pas qu’un croyant ne ressent plus la peur ; la seconde moitié montre le même fidèle qui tremble. Et le verset 10 ne minimise pas l’abandon par des parents : il nomme une vraie blessure et la confie à Dieu, qui recueille ceux qu’on a délaissés.',
      ),
      questions: [
        L('Mark every verse that speaks about God and every verse that speaks to Him. What changes at verse 7?', 'Repère chaque verset qui parle de Dieu et chaque verset qui s’adresse à lui. Qu’est-ce qui change au verset 7 ?'),
        L('What does the “one thing” of verse 4 reveal about what the psalmist wants most — even more than safety?', 'Que révèle l’« unique demande » du verset 4 sur ce que le psalmiste désire le plus — plus encore que la sécurité ?'),
        L('Where do confidence and fear sit side by side in you today? Pray both honestly, then pray verse 14.', 'Où la confiance et la peur se côtoient-elles en toi aujourd’hui ? Prie honnêtement l’une et l’autre, puis prie le verset 14.'),
      ],
      synthesis: L(
        'Write your own “one thing” sentence: the single request you are bringing to the Lord in this season. Underneath, write verse 14 in your own words as your response.',
        'Écris ta propre phrase d’« unique demande » : la seule chose que tu apportes au Seigneur en cette saison. En dessous, écris le verset 14 avec tes mots, comme ta réponse.',
      ),
      prayer: L(
        'Lord, You are my light and my salvation — and still I am afraid. Do not hide Your face from me. I seek You; teach me Your way. I choose to wait for You; strengthen my heart.',
        'Seigneur, tu es ma lumière et mon salut — et pourtant j’ai peur. Ne me cache pas ta face. Je te cherche ; enseigne-moi ton chemin. Je choisis de t’attendre ; fortifie mon cœur.',
      ),
    },
    resourceTopics: ['psalms', 'trust', 'fear'],
  },
  {
    movement: 'trust',
    theme: { en: 'A refuge when the earth shakes', fr: 'Un refuge quand la terre tremble', es: 'Un refugio cuando tiembla la tierra', pt: 'Um refúgio quando a terra treme', de: 'Zuflucht, wenn die Erde bebt', ru: 'Прибежище, когда колеблется земля', zh: '大地震动时的避难所', ja: '地が揺れるときの避け所', ko: '땅이 흔들릴 때의 피난처', ar: 'ملجأ حين تتزلزل الأرض', fa: 'پناهگاهی آن‌گاه که زمین می‌لرزد', hi: 'जब धरती काँपे तब शरणस्थान', id: 'Tempat perlindungan saat bumi berguncang', sw: 'Kimbilio nchi inapotikisika', tl: 'Kanlungan kapag nayayanig ang lupa', am: 'ምድር ስትናወጥ መጠጊያ' },
    ref: 'Psalm 46',
    related: ['2 Kings 19:32-36', 'Revelation 22:1-5'],
    reflection: L(
      'Psalm 46 imagines the worst: the earth giving way, mountains sliding into the sea, nations in uproar. Against that noise it sets a quiet river whose streams make the city of God glad — although Jerusalem had no river, only a spring. The picture is bigger than geography: God’s presence among His people is a source of life that no siege can cut off. Twice a refrain confesses that the Lord of armies is with His people, the God of Jacob their stronghold.',
      'Le Psaume 46 imagine le pire : la terre qui se dérobe, les montagnes qui glissent dans la mer, les nations en tumulte. Face à ce vacarme, il place un fleuve paisible dont les bras réjouissent la cité de Dieu — alors que Jérusalem n’avait pas de fleuve, seulement une source. L’image dépasse la géographie : la présence de Dieu au milieu de son peuple est une source de vie qu’aucun siège ne peut couper. Par deux fois, un refrain confesse que l’Éternel des armées est avec son peuple, le Dieu de Jacob sa forteresse.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, of the Sons of Korah, “according to Alamoth” (perhaps for high voices), a song. It is one of the Songs of Zion (with 48, 76, 84, 87 and 122) that celebrate God’s city. Its three stanzas — nature in chaos (1–3), the city secure (4–7), the nations silenced (8–11) — are marked by “Selah”, a musical or liturgical pause whose exact meaning is unknown. Some link the psalm with Jerusalem’s deliverance from Assyria (2 Kings 19), though that is uncertain. Luther’s hymn “A Mighty Fortress” grew from it, and its river flows again in Ezekiel 47 and Revelation 22.',
        'Titre : au chef de chœur, des fils de Koré, « sur alamoth » (peut-être pour voix aiguës), cantique. C’est l’un des chants de Sion (avec les Psaumes 48, 76, 84, 87 et 122) qui célèbrent la cité de Dieu. Ses trois strophes — la nature en chaos (1-3), la cité en sûreté (4-7), les nations réduites au silence (8-11) — sont marquées par « Sélah », une pause musicale ou liturgique dont le sens exact est inconnu. Certains rattachent le psaume à la délivrance de Jérusalem face à l’Assyrie (2 Rois 19), sans certitude. Le cantique de Luther, « C’est un rempart que notre Dieu », en est issu, et son fleuve coule de nouveau en Ézéchiel 47 et en Apocalypse 22.',
      ),
      tension: L(
        'The famous command of verse 10, often read as an invitation to quiet devotion, is in context closer to “Stop! Let go!” — spoken first to warring nations: lay down your weapons and acknowledge God. Stillness before God is good, but this verse is about His sovereignty over wars, not a relaxation technique. Nor does the psalm promise that no disaster will touch believers; it promises God’s presence in the middle of it.',
        'Le célèbre ordre du verset 10, souvent lu comme une invitation au recueillement, est plutôt, dans son contexte, un « Arrêtez ! Lâchez prise ! » — adressé d’abord aux nations en guerre : déposez les armes et reconnaissez Dieu. Le calme devant Dieu est une bonne chose, mais ce verset parle de sa souveraineté sur les guerres, pas d’une technique de relaxation. Le psaume ne promet pas non plus qu’aucune catastrophe n’atteindra les croyants ; il promet la présence de Dieu au cœur de celle-ci.',
      ),
      questions: [
        L('Follow the three stanzas and the refrain. How does the camera move from nature to the city to the nations?', 'Suis les trois strophes et le refrain. Comment le regard passe-t-il de la nature à la cité, puis aux nations ?'),
        L('What does a river in a city without a river reveal about God? How do Ezekiel 47 and Revelation 22 develop the image?', 'Que révèle de Dieu un fleuve dans une ville qui n’en a pas ? Comment Ézéchiel 47 et Apocalypse 22 développent-ils cette image ?'),
        L('What “weapons” — anxious control, arguments, grudges — might you need to lay down? Pray verse 10 as an act of surrender.', 'Quelles « armes » — le contrôle anxieux, les disputes, les rancunes — aurais-tu besoin de déposer ? Prie le verset 10 comme un acte d’abandon.'),
      ],
      synthesis: L(
        'Write the refrain in your own words at the top of a page, then list three things shaking your world or ours. After each one, write the refrain again as a deliberate confession.',
        'Écris le refrain avec tes mots en haut d’une page, puis note trois choses qui ébranlent ton monde ou le nôtre. Après chacune, réécris le refrain comme une confession délibérée.',
      ),
      prayer: L(
        'God, You are our refuge and strength, present in trouble. When the earth shakes and the nations rage, help me stop, let go and know that You are God — exalted among the nations, and here with us.',
        'Dieu, tu es notre refuge et notre force, présent dans la détresse. Quand la terre tremble et que les nations s’agitent, aide-moi à m’arrêter, à lâcher prise et à reconnaître que tu es Dieu — élevé parmi les nations, et ici avec nous.',
      ),
    },
    resourceTopics: ['psalms', 'trust', 'kingdom-of-god'],
  },
  {
    movement: 'trust',
    theme: { en: 'Waiting for God alone', fr: 'N’attendre que Dieu', es: 'Esperar solo en Dios', pt: 'Esperar somente em Deus', de: 'Allein auf Gott warten', ru: 'Ждать только Бога', zh: '单单等候神', ja: 'ただ神を待ち望む', ko: '오직 하나님만 기다림', ar: 'انتظار الله وحده', fa: 'تنها در انتظار خدا', hi: 'केवल परमेश्वर की बाट जोहना', id: 'Hanya menanti Allah', sw: 'Kumngoja Mungu peke yake', tl: 'Sa Diyos lamang maghintay', am: 'እግዚአብሔርን ብቻ መጠበቅ' },
    ref: 'Psalm 62',
    related: ['Romans 2:6-11', '1 Timothy 6:17-19'],
    reflection: L(
      'Psalm 62 is built around a small Hebrew word, usually translated “alone” or “only”, which appears six times. For God alone the psalmist waits in silence; He alone is rock and salvation. Watch the growth: in verse 2 he says he will not be greatly shaken, by verse 6 simply that he will not be shaken. Then he turns from his own soul to the people and urges them to pour out their hearts before God. Trust here is not tight-lipped endurance but honest speech to the only One who can bear it.',
      'Le Psaume 62 est construit autour d’un petit mot hébreu, souvent traduit par « seul » ou « seulement », qui revient six fois. C’est en Dieu seul que le psalmiste attend en silence ; lui seul est rocher et salut. Observe la progression : au verset 2, il dit qu’il ne sera guère ébranlé ; au verset 6, simplement qu’il ne sera pas ébranlé. Puis il se tourne de sa propre âme vers le peuple et l’exhorte à épancher son cœur devant Dieu. La confiance n’est pas ici une endurance les dents serrées, mais une parole honnête adressée au seul qui puisse la porter.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, according to Jeduthun (one of David’s temple musicians, 1 Chronicles 16:41), a psalm of David. The psalmist addresses three audiences: his attackers (verses 3–4), his own soul (verse 5) and the people (verse 8). Verses 9–10 weigh human beings and riches and find them as light as a breath — hebel, the “vanity” word of Ecclesiastes. The closing lines name two things that belong to God, power and steadfast love, and add that He repays each person according to their work, a line Paul echoes in Romans 2:6.',
        'Titre : au chef de chœur, selon Yedoutoun (l’un des musiciens du temple sous David, 1 Chroniques 16.41), psaume de David. Le psalmiste s’adresse à trois auditoires : ses agresseurs (versets 3-4), sa propre âme (verset 5) et le peuple (verset 8). Les versets 9 et 10 pèsent les humains et les richesses et les trouvent légers comme un souffle — hebel, le mot de la « vanité » dans l’Ecclésiaste. Les dernières lignes nomment deux choses qui appartiennent à Dieu, la puissance et l’amour fidèle, et ajoutent qu’il rend à chacun selon ses œuvres, une ligne dont Paul se fait l’écho en Romains 2.6.',
      ),
      tension: L(
        'Silence before God is not the same as suppressing what you feel; the same psalm commands pouring out your heart. And verse 10 does not call wealth evil: it warns against trusting it, extorting for it or setting your heart on it when it increases (compare 1 Timothy 6:17-19).',
        'Le silence devant Dieu n’est pas le refoulement de ce que tu ressens ; le même psaume ordonne d’épancher son cœur. Et le verset 10 ne dit pas que la richesse est mauvaise : il met en garde contre le fait de s’y fier, d’extorquer pour l’obtenir ou d’y attacher son cœur quand elle augmente (compare avec 1 Timothée 6.17-19).',
      ),
      questions: [
        L('Find each “alone” or “only” and compare verse 2 with verse 6. What has changed in the psalmist between them?', 'Repère chaque « seul » ou « seulement » et compare le verset 2 au verset 6. Qu’est-ce qui a changé chez le psalmiste entre les deux ?'),
        L('Why does it matter that power and steadfast love belong together in God (verses 11–12)? What goes wrong when one is imagined without the other?', 'Pourquoi est-il important que la puissance et l’amour fidèle aillent ensemble en Dieu (versets 11-12) ? Que se passe-t-il quand on imagine l’une sans l’autre ?'),
        L('What are you tempted to lean on — reputation, money, the approval of important people? Pour out your heart about it to God now.', 'Sur quoi es-tu tenté de t’appuyer — ta réputation, l’argent, l’approbation de gens importants ? Épanche ton cœur à ce sujet devant Dieu maintenant.'),
      ],
      synthesis: L(
        'Write verse 8 at the top of a page and pour out your heart beneath it without editing. Then write one sentence of trust that begins, “For God alone…”.',
        'Écris le verset 8 en haut d’une page et épanche ton cœur en dessous sans te corriger. Puis écris une phrase de confiance qui commence par : « En Dieu seul… ».',
      ),
      prayer: L(
        'God, You alone are my rock and my salvation. I quiet my soul before You, and I pour out my heart to You, trusting that power belongs to You — and steadfast love as well.',
        'Dieu, toi seul es mon rocher et mon salut. J’apaise mon âme devant toi et j’épanche mon cœur devant toi, avec confiance : la puissance t’appartient — et l’amour fidèle aussi.',
      ),
    },
    resourceTopics: ['psalms', 'trust', 'prayer'],
  },
  {
    movement: 'trust',
    theme: { en: 'Sheltered, not exempt', fr: 'À l’abri, sans être exempté', es: 'Protegido, no exento', pt: 'Abrigado, não isento', de: 'Geborgen, nicht verschont von allem', ru: 'Под защитой, но не в стороне от бед', zh: '蒙庇护，却非免于一切', ja: '守られても、苦難と無縁ではない', ko: '보호받되 면제되지 않음', ar: 'في حِمى الله لا في مأمن من كل شيء', fa: 'در پناه، نه مصون از همه‌چیز', hi: 'शरण में, पर हर दुख से मुक्त नहीं', id: 'Terlindung, bukan kebal', sw: 'Umehifadhiwa, si kwamba hutaguswa', tl: 'Nakakanlong, hindi ligtas sa lahat', am: 'ተጠልሎ እንጂ ከሁሉ ነጻ አይደለም' },
    ref: 'Psalm 91',
    related: ['Matthew 4:1-11', 'Romans 8:35-39'],
    reflection: L(
      'Psalm 91 is among the best-loved psalms of protection, and among the most misused. Its images — shelter, shadow, wings, shield — describe the security of the one who makes God his dwelling. But listen to the voices: someone confesses trust (verses 1–2), a second voice assures the trusting one (verses 3–13), and then God Himself speaks (verses 14–16). In that divine speech He does not promise to keep all trouble away; He promises to be with His servant in trouble and to deliver him.',
      'Le Psaume 91 est l’un des psaumes de protection les plus aimés, et l’un des plus mal employés. Ses images — abri, ombre, ailes, bouclier — décrivent la sécurité de celui qui fait de Dieu sa demeure. Mais écoute les voix : quelqu’un confesse sa confiance (versets 1-2), une deuxième voix rassure celui qui se confie (versets 3-13), puis Dieu lui-même prend la parole (versets 14-16). Dans ce discours divin, il ne promet pas d’écarter toute détresse ; il promet d’être avec son serviteur dans la détresse et de le délivrer.',
    ),
    study: {
      context: L(
        'The psalm has no title in Hebrew (the Greek translation attributes it to David). It follows naturally after Psalm 90: Moses’ meditation on human frailty is answered by this song of shelter in the Most High. In Matthew 4:5-7 the devil quotes verses 11–12 to tempt Jesus to throw Himself down from the temple; Jesus answers from Deuteronomy 6:16 that God is not to be put to the test. Luke 10:19 echoes verse 13 in Jesus’ words about authority over the power of the enemy.',
        'Le psaume n’a pas de titre en hébreu (la traduction grecque l’attribue à David). Il suit naturellement le Psaume 90 : la méditation de Moïse sur la fragilité humaine trouve sa réponse dans ce chant d’abri auprès du Très-Haut. En Matthieu 4.5-7, le diable cite les versets 11 et 12 pour pousser Jésus à se jeter du haut du temple ; Jésus répond par Deutéronome 6.16 qu’on ne met pas Dieu à l’épreuve. Luc 10.19 fait écho au verset 13 dans les paroles de Jésus sur l’autorité donnée face à la puissance de l’ennemi.',
      ),
      tension: L(
        'Psalm 91 is not a guarantee that no believer will fall ill, suffer an accident or die in an epidemic; faithful people have (Hebrews 11:35-38), and Jesus, the truest dweller in God’s shelter, was crucified. Using the psalm to demand protection, or as cover for reckless risk, is exactly the misuse Jesus refused. Its promise is God’s presence, rescue in His way and time, and a salvation that death cannot undo (Romans 8:35-39).',
        'Le Psaume 91 ne garantit pas qu’aucun croyant ne tombera malade, n’aura d’accident ou ne mourra lors d’une épidémie ; des fidèles l’ont vécu (Hébreux 11.35-38), et Jésus, celui qui a le plus pleinement demeuré à l’abri de Dieu, a été crucifié. Se servir du psaume pour exiger une protection, ou pour couvrir une prise de risque inconsidérée, c’est précisément l’usage abusif que Jésus a refusé. Sa promesse, c’est la présence de Dieu, une délivrance selon ses voies et son temps, et un salut que la mort ne peut défaire (Romains 8.35-39).',
      ),
      questions: [
        L('Identify the three voices (1–2, 3–13, 14–16). What does God Himself promise in the final speech — and what does He not promise?', 'Identifie les trois voix (1-2, 3-13, 14-16). Que promet Dieu lui-même dans le dernier discours — et que ne promet-il pas ?'),
        L('Read Matthew 4:5-7. How does Jesus’ answer to the devil teach us to pray this psalm rightly?', 'Lis Matthieu 4.5-7. Comment la réponse de Jésus au diable nous apprend-elle à prier ce psaume avec justesse ?'),
        L('Where do you need God’s shelter today? Ask for it with trust — without bargaining and without demanding a sign.', 'Où as-tu besoin de l’abri de Dieu aujourd’hui ? Demande-le avec confiance — sans marchander et sans exiger de signe.'),
      ],
      synthesis: L(
        'Write two headings, “What this psalm truly promises” and “What it does not promise”, and fill each from the text and from Matthew 4. Then write one sentence of trust you could pray whatever the outcome.',
        'Écris deux titres, « Ce que ce psaume promet vraiment » et « Ce qu’il ne promet pas », et remplis chacun à partir du texte et de Matthieu 4. Puis écris une phrase de confiance que tu pourrais prier quelle que soit l’issue.',
      ),
      prayer: L(
        'Most High, I make You my dwelling. Cover me under Your wings; be with me in trouble and rescue me in Your way. I will not put You to the test — I trust You, and I rest in the salvation You have shown in Jesus.',
        'Très-Haut, je fais de toi ma demeure. Couvre-moi de tes ailes ; sois avec moi dans la détresse et délivre-moi selon tes voies. Je ne te mettrai pas à l’épreuve — je me confie en toi, et je me repose dans le salut que tu as manifesté en Jésus.',
      ),
    },
    safetyNote: L(
      'Trusting God’s protection never means ignoring medical advice, safety precautions or real danger. If you are unwell, see a doctor; if you are in danger, contact the emergency services. Taking wise care is not a lack of faith.',
      'Se confier en la protection de Dieu ne signifie jamais ignorer un avis médical, des consignes de sécurité ou un danger réel. Si tu es malade, consulte un médecin ; si tu es en danger, contacte les services d’urgence. Prendre des précautions sages n’est pas un manque de foi.',
    ),
    resourceTopics: ['psalms', 'trust', 'suffering'],
  },
  {
    movement: 'trust',
    theme: { en: 'The Keeper who never sleeps', fr: 'Celui qui te garde ne dort pas', es: 'El Guardián que nunca duerme', pt: 'O Guarda que nunca dorme', de: 'Der Hüter, der nie schläft', ru: 'Хранитель, который не спит', zh: '保护者永不打盹', ja: '眠ることのない守り手', ko: '졸지 않으시는 지키시는 분', ar: 'الحافظ الذي لا ينام', fa: 'نگاهبانی که هرگز نمی‌خوابد', hi: 'कभी न सोने वाला रक्षक', id: 'Penjaga yang tak pernah tidur', sw: 'Mlinzi asiyelala kamwe', tl: 'Ang Tagapag-ingat na hindi natutulog', am: 'የማያንቀላፋው ጠባቂ' },
    ref: 'Psalm 121',
    related: ['1 Kings 18:25-29', 'John 17:11-15'],
    reflection: L(
      'Psalm 121 is a traveller’s song. A pilgrim looks at the hills — perhaps at the dangers of the road, perhaps at the shrines where others sought help — and asks where help will come from. The answer is the Maker of heaven and earth, and then another voice takes over and speaks to the pilgrim: the One who keeps you does not doze. The word “keep” returns six times, until the psalm covers every departure and every return, now and for ever.',
      'Le Psaume 121 est un chant de voyageur. Un pèlerin regarde les montagnes — peut-être les dangers de la route, peut-être les sanctuaires où d’autres cherchaient du secours — et se demande d’où lui viendra l’aide. La réponse, c’est le Créateur du ciel et de la terre ; puis une autre voix prend le relais et s’adresse au pèlerin : celui qui te garde ne somnole pas. Le verbe « garder » revient six fois, jusqu’à couvrir chaque départ et chaque retour, dès maintenant et pour toujours.',
    ),
    study: {
      context: L(
        'Title: a Song of Ascents, one of fifteen (Psalms 120–134) probably sung by pilgrims going up to Jerusalem for the festivals. The shift from “I” (verses 1–2) to “you” (verses 3–8) suggests a dialogue: a pilgrim’s question answered by a companion, or by a priest’s blessing. A Keeper who never sleeps may be a quiet contrast with Baal, whom Elijah mocked as perhaps asleep (1 Kings 18:27). You will meet the Songs of Ascents again in the final week.',
        'Titre : cantique des montées, l’un des quinze (Psaumes 120 à 134) probablement chantés par les pèlerins qui montaient à Jérusalem pour les fêtes. Le passage du « je » (versets 1-2) au « tu » (versets 3-8) suggère un dialogue : la question d’un pèlerin, à laquelle répond un compagnon ou la bénédiction d’un prêtre. Un Gardien qui ne dort jamais contraste peut-être discrètement avec Baal, dont Élie se moquait en disant qu’il dormait sans doute (1 Rois 18.27). Tu retrouveras les cantiques des montées lors de la dernière semaine.',
      ),
      tension: L(
        'Being kept from all harm does not mean pilgrims never met harm on the road; it means no harm could separate them from the One who keeps their life. Jesus prays for His disciples not that the Father would take them out of the world, but that He would keep them from the evil one (John 17:15).',
        'Être gardé de tout mal ne veut pas dire que les pèlerins ne rencontraient jamais le malheur sur la route ; cela veut dire qu’aucun mal ne pouvait les séparer de celui qui garde leur vie. Jésus prie pour ses disciples, non pour que le Père les retire du monde, mais pour qu’il les garde du Mauvais (Jean 17.15).',
      ),
      questions: [
        L('Where does the voice change, and how often does the word “keep” appear? What does the repetition do?', 'Où la voix change-t-elle, et combien de fois le verbe « garder » apparaît-il ? Quel effet produit cette répétition ?'),
        L('Compare verse 7 with Jesus’ prayer in John 17:11-15. What kind of keeping is promised?', 'Compare le verset 7 avec la prière de Jésus en Jean 17.11-15. De quelle sorte de garde s’agit-il ?'),
        L('What journey — literal or not — are you starting or dreading? Pray verse 8 over your going out and your coming in.', 'Quel voyage — au sens propre ou non — commences-tu ou redoutes-tu ? Prie le verset 8 sur tes départs et tes retours.'),
      ],
      synthesis: L(
        'Week review: write one line for each trust psalm (23, 16, 27, 46, 62, 91, 121) naming the picture of God it gives — shepherd, portion, light, fortress, rock, shelter, keeper. Review question: which picture helped you pray when fear was still present?',
        'Bilan de la semaine : écris une ligne pour chaque psaume de confiance (23, 16, 27, 46, 62, 91, 121) en nommant l’image de Dieu qu’il donne — berger, part, lumière, forteresse, rocher, abri, gardien. Question de bilan : quelle image t’a aidé à prier alors que la peur était encore là ?',
      ),
      prayer: L(
        'Maker of heaven and earth, my help comes from You, and You never sleep. Keep my life, my going out and my coming in, today and for ever — and keep me close to You in whatever this road holds.',
        'Créateur du ciel et de la terre, mon secours vient de toi, et tu ne dors jamais. Garde ma vie, mes départs et mes retours, aujourd’hui et pour toujours — et garde-moi près de toi quoi que réserve ce chemin.',
      ),
    },
    resourceTopics: ['psalms', 'trust', 'worship'],
  },

  // ── Week 3 · Lament ──────────────────────────────────────────────────────
  {
    movement: 'lament',
    theme: { en: 'How long? The shape of lament', fr: 'Jusqu’à quand ? La forme de la lamentation', es: '¿Hasta cuándo? La forma del lamento', pt: 'Até quando? A forma do lamento', de: 'Wie lange? Die Gestalt der Klage', ru: 'Доколе? Строение плача', zh: '要到几时？哀歌的结构', ja: 'いつまでですか――嘆きの形', ko: '언제까지입니까? 탄식의 구조', ar: 'إلى متى؟ بنية الرثاء', fa: 'تا به کی؟ ساختار مرثیه', hi: 'कब तक? विलाप का स्वरूप', id: 'Berapa lama lagi? Bentuk ratapan', sw: 'Hata lini? Muundo wa maombolezo', tl: 'Hanggang kailan? Ang anyo ng panaghoy', am: 'እስከ መቼ? የሰቆቃ ቅርጽ' },
    ref: 'Psalm 13',
    related: ['Habakkuk 1:1-4', 'Revelation 6:9-11'],
    reflection: L(
      'Psalm 13 is only six verses long, yet it is a complete school of lament. It opens with four “how long?” questions, moves to urgent requests that God would look, answer and restore light to the psalmist’s eyes, and ends with trust and a vow to sing. Nothing in the text says the circumstances changed between verse 4 and verse 5. What changed is where the psalmist stood: he remembered the steadfast love he had already trusted, and chose to speak to God rather than only about his pain.',
      'Le Psaume 13 ne compte que six versets, et pourtant c’est une école complète de la lamentation. Il s’ouvre sur quatre « jusqu’à quand ? », passe à des demandes pressantes — que Dieu regarde, réponde et rende la lumière aux yeux du psalmiste — et s’achève sur la confiance et la promesse de chanter. Rien dans le texte ne dit que la situation a changé entre le verset 4 et le verset 5. Ce qui a changé, c’est la place du psalmiste : il s’est souvenu de l’amour fidèle auquel il s’était déjà confié, et il a choisi de parler à Dieu plutôt que seulement de sa douleur.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, a psalm of David. Lament is the most common form in the Psalter — roughly a third of the psalms — and its usual elements are all here: address to God, complaint, petition, a turn to trust and a vow of praise. The complaint runs in three directions: toward God (He seems to forget and hide), within the self (sorrow in the heart all day) and toward the enemy (who seems to be winning). The plea for light in the eyes may mean renewed strength, or rescue from dying: the next line fears the sleep of death.',
        'Titre : au chef de chœur, psaume de David. La lamentation est la forme la plus fréquente du psautier — environ un tiers des psaumes — et ses éléments habituels sont tous là : l’invocation, la plainte, la demande, le basculement vers la confiance et la promesse de louange. La plainte part dans trois directions : vers Dieu (il semble oublier et se cacher), vers soi (le chagrin au cœur tout le jour) et vers l’ennemi (qui semble l’emporter). La demande de lumière pour les yeux peut désigner des forces retrouvées ou une délivrance de la mort : la ligne suivante redoute le sommeil de la mort.',
      ),
      tension: L(
        'Do not treat these six verses as a six-minute technique for fixing feelings. The turn at verse 5 may come after days or years, and one psalm you will read this week never reaches it. Nor is “how long?” a lack of faith: it is faith refusing to stop talking to God.',
        'Ne fais pas de ces six versets une technique de six minutes pour réparer tes émotions. Le basculement du verset 5 peut venir après des jours ou des années, et l’un des psaumes que tu liras cette semaine ne l’atteint jamais. Et « jusqu’à quand ? » n’est pas un manque de foi : c’est la foi qui refuse de cesser de parler à Dieu.',
      ),
      questions: [
        L('Divide the psalm into complaint (1–2), petition (3–4) and trust (5–6). Which word or phrase marks each turn?', 'Divise le psaume en plainte (1-2), demande (3-4) et confiance (5-6). Quel mot ou quelle expression marque chaque tournant ?'),
        L('What is the psalmist honestly experiencing — toward God, within himself and from others? Why does Scripture keep such words for us?', 'Que vit réellement le psalmiste — face à Dieu, en lui-même et de la part des autres ? Pourquoi l’Écriture nous garde-t-elle de telles paroles ?'),
        L('Write your own “how long?” to God as specifically as you can. Then pray verses 5–6 slowly, even if all you can say today is that you want to trust.', 'Écris ton propre « jusqu’à quand ? » à Dieu, aussi précisément que possible. Puis prie lentement les versets 5 et 6, même si tout ce que tu peux dire aujourd’hui, c’est que tu veux faire confiance.'),
      ],
      synthesis: L(
        'Write a four-part lament using the psalm’s shape: address, complaint, request, trust. Keep it short and honest; you will return to this shape all week.',
        'Écris une lamentation en quatre parties selon la forme du psaume : invocation, plainte, demande, confiance. Qu’elle soit courte et honnête ; tu reviendras à cette forme toute la semaine.',
      ),
      prayer: L(
        'Lord, how long? I feel forgotten, and my heart is heavy all day. Look at me and answer me; give light to my eyes. Yet I have trusted in Your steadfast love, and I will sing to You again.',
        'Seigneur, jusqu’à quand ? Je me sens oublié, et mon cœur est lourd tout le jour. Regarde-moi et réponds-moi ; rends la lumière à mes yeux. Pourtant je me suis confié en ton amour fidèle, et je chanterai de nouveau pour toi.',
      ),
    },
    safetyNote: crisisNote(
      'Long seasons of sorrow can become depression, which is an illness and not a failure of faith; a doctor can help.',
      'Les longues saisons de tristesse peuvent devenir une dépression, qui est une maladie et non un échec de la foi ; un médecin peut t’aider.',
    ),
    resourceTopics: ['psalms', 'lament', 'grief'],
  },
  {
    movement: 'lament',
    theme: { en: 'Thirst, memory and stubborn hope', fr: 'Soif, souvenir et espérance obstinée', es: 'Sed, memoria y esperanza obstinada', pt: 'Sede, memória e esperança teimosa', de: 'Durst, Erinnerung und trotzige Hoffnung', ru: 'Жажда, память и упорная надежда', zh: '干渴、回忆与执着的盼望', ja: '渇き、記憶、そして粘り強い望み', ko: '목마름, 기억, 그리고 끈질긴 소망', ar: 'عطش وذكرى ورجاء عنيد', fa: 'تشنگی، یاد و امیدی سرسخت', hi: 'प्यास, स्मृति और अडिग आशा', id: 'Haus, kenangan, dan harapan yang gigih', sw: 'Kiu, kumbukumbu na tumaini thabiti', tl: 'Pagkauhaw, alaala at matibay na pag-asa', am: 'ጥም፣ ትዝታና የማይበገር ተስፋ' },
    ref: 'Psalm 42',
    related: ['Psalm 43', 'Mark 14:32-36'],
    reflection: L(
      'Psalms 42 and 43 form one poem, held together by a refrain that comes three times: the psalmist asks his own soul why it is so downcast, and tells it to hope in God, whom he will yet praise. He is far from Jerusalem, near the sources of the Jordan, thirsty for God like a deer for running water, and taunted with the question of where his God is. The refrain does not make the sadness vanish — it has to be said twice more. Hope here is argued rather than felt: a believer preaching to himself.',
      'Les Psaumes 42 et 43 forment un seul poème, tenu ensemble par un refrain qui revient trois fois : le psalmiste demande à sa propre âme pourquoi elle est si abattue, et lui dit d’espérer en Dieu, qu’il louera encore. Il est loin de Jérusalem, près des sources du Jourdain, assoiffé de Dieu comme une biche d’eau vive, et on se moque de lui en lui demandant où est son Dieu. Le refrain ne fait pas disparaître la tristesse — il faut le redire deux fois encore. L’espérance est ici argumentée plutôt que ressentie : un croyant qui se prêche à lui-même.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, a maskil (perhaps an instructive or skilful song) of the Sons of Korah; it opens Book 2 of the Psalter. Psalm 43 has no title and shares the refrain (42:5, 42:11, 43:5), so many manuscripts and scholars treat the two as a single psalm. The Hebrew nephesh, usually rendered “soul”, also means throat: the thirst is felt in the body. The land of the Jordan, Hermon and Mount Mizar place the singer in the far north, cut off from the temple. In Gethsemane Jesus speaks of His soul being overwhelmed with sorrow in words that echo this refrain in the Greek Old Testament (Mark 14:34).',
        'Titre : au chef de chœur, maskil (peut-être un chant d’enseignement ou un chant savant) des fils de Koré ; il ouvre le deuxième livre du psautier. Le Psaume 43 n’a pas de titre et partage le refrain (42.5, 42.11, 43.5), si bien que beaucoup de manuscrits et de spécialistes les considèrent comme un seul psaume. Le mot hébreu nephesh, souvent rendu par « âme », signifie aussi la gorge : la soif se ressent dans le corps. Le pays du Jourdain, l’Hermon et le mont Mitsear situent le chantre à l’extrême nord, loin du temple. À Gethsémané, Jésus dit que son âme est accablée de tristesse, en des termes qui font écho à ce refrain dans l’Ancien Testament grec (Marc 14.34).',
      ),
      tension: L(
        'Speaking to your soul is not positive thinking or denial; the psalmist names his tears, his memories and the taunts. Nor is his low mood proof of weak faith: he is a faithful worshipper who, for now, cannot get to worship. If sadness settles in and does not lift, it may need medical care as well as prayer.',
        'Parler à son âme n’est ni de la pensée positive ni du déni ; le psalmiste nomme ses larmes, ses souvenirs et les moqueries. Son abattement n’est pas non plus la preuve d’une foi faible : c’est un fidèle adorateur qui, pour l’instant, ne peut pas rejoindre le culte. Si la tristesse s’installe et ne se lève pas, elle peut demander des soins médicaux autant que la prière.',
      ),
      questions: [
        L('Mark the three refrains. What, if anything, changes in the verses between them?', 'Repère les trois refrains. Qu’est-ce qui change, s’il y a un changement, dans les versets qui les séparent ?'),
        L('What does the psalmist remember (42:4, 42:6), and how does memory both wound him and help him?', 'De quoi le psalmiste se souvient-il (42.4, 42.6), et comment le souvenir le blesse-t-il et l’aide-t-il à la fois ?'),
        L('Speak to your own soul as he does: name what is downcast in you, then give it one reason to hope in God.', 'Parle à ta propre âme comme lui : nomme ce qui est abattu en toi, puis donne-lui une raison d’espérer en Dieu.'),
      ],
      synthesis: L(
        'Copy the refrain in your own words. Beneath it, write what your soul is saying today and how you want to answer it from what you know of God’s character. Note one person who could come with you to worship this week, if you cannot get there alone.',
        'Recopie le refrain avec tes mots. En dessous, écris ce que ton âme te dit aujourd’hui et ce que tu veux lui répondre à partir de ce que tu sais du caractère de Dieu. Note une personne qui pourrait t’accompagner au culte cette semaine, si tu n’arrives pas à y aller seul.',
      ),
      prayer: L(
        'Living God, my soul thirsts for You and I feel far away. Send Your light and truth to guide me home to You. Why so downcast, my soul? Hope in God — I will yet praise Him.',
        'Dieu vivant, mon âme a soif de toi et je me sens loin. Envoie ta lumière et ta vérité pour me ramener vers toi. Pourquoi t’abattre, mon âme ? Espère en Dieu — je le louerai encore.',
      ),
    },
    safetyNote: crisisNote(
      'Persistent low mood, loss of sleep or appetite, or feeling far from God for a long time can be signs of depression. Speaking to a doctor or a counsellor is wise, not faithless.',
      'Une tristesse persistante, la perte du sommeil ou de l’appétit, ou le sentiment d’être loin de Dieu depuis longtemps peuvent être des signes de dépression. Consulter un médecin ou un conseiller est sage, et non un manque de foi.',
    ),
    resourceTopics: ['psalms', 'lament', 'mental-health'],
  },
  {
    movement: 'lament',
    theme: { en: 'Fear, tears and trust', fr: 'La peur, les larmes et la confiance', es: 'Miedo, lágrimas y confianza', pt: 'Medo, lágrimas e confiança', de: 'Angst, Tränen und Vertrauen', ru: 'Страх, слёзы и доверие', zh: '惧怕、眼泪与信靠', ja: '恐れ、涙、そして信頼', ko: '두려움, 눈물, 그리고 신뢰', ar: 'الخوف والدموع والثقة', fa: 'ترس، اشک و اعتماد', hi: 'भय, आँसू और भरोसा', id: 'Takut, air mata, dan percaya', sw: 'Hofu, machozi na kumtumaini Mungu', tl: 'Takot, luha at pagtitiwala', am: 'ፍርሃት፣ እንባና መታመን' },
    ref: 'Psalm 56',
    related: ['1 Samuel 21:10-15', 'Romans 8:31-34'],
    reflection: L(
      'Psalm 56 does not pretend that trust has abolished fear. Its key line begins “when I am afraid” — not “if”. The psalmist is hunted, his words twisted, his steps watched; yet twice a refrain confesses trust in God, whose word he praises, and asks what mere mortals can finally do. At the centre stands one of Scripture’s tenderest images: God has counted his wanderings, gathered his tears in a bottle and recorded them in His book. Not one tear is lost.',
      'Le Psaume 56 ne prétend pas que la confiance a aboli la peur. Sa ligne clé commence par « quand j’ai peur » — et non par « si ». Le psalmiste est traqué, ses paroles sont déformées, ses pas épiés ; pourtant, par deux fois, un refrain confesse sa confiance en Dieu, dont il loue la parole, et demande ce que de simples mortels peuvent finalement lui faire. Au centre se trouve l’une des images les plus tendres de l’Écriture : Dieu a compté ses errances, recueilli ses larmes dans une outre et les a inscrites dans son livre. Pas une larme n’est perdue.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, “according to The Dove on Far-off Terebinths” (probably a tune), a miktam of David, when the Philistines seized him in Gath. 1 Samuel 21:10-15 tells that story: fleeing Saul, David sought refuge among Israel’s enemies, was recognised, and escaped by feigning madness. The title links the psalm with that episode, though such titles are ancient notes whose origin is debated. Verse 9, confident that God is on his side, anticipates Paul’s question in Romans 8:31, and the refrain’s question about what mortals can do returns in Psalm 118:6, quoted in Hebrews 13:6.',
        'Titre : au chef de chœur, « sur la colombe des térébinthes lointains » (probablement un air), miktam de David, lorsque les Philistins le saisirent à Gath. 1 Samuel 21.10-15 raconte cet épisode : fuyant Saül, David chercha refuge chez les ennemis d’Israël, fut reconnu, et s’échappa en simulant la folie. Le titre relie le psaume à cet épisode, même si ces titres sont des notes anciennes dont l’origine est discutée. Le verset 9, sûr que Dieu est de son côté, annonce la question de Paul en Romains 8.31, et la question du refrain sur ce que peuvent les mortels revient au Psaume 118.6, cité en Hébreux 13.6.',
      ),
      tension: L(
        'The refrain does not mean people cannot hurt you; the psalm is full of real harm. It means they cannot undo God’s hold on you. And trusting God in danger does not mean staying in danger: David fled, and you may too.',
        'Le refrain ne signifie pas que personne ne peut te faire de mal ; le psaume est rempli de torts bien réels. Il signifie qu’on ne peut pas t’arracher à la main de Dieu. Et se confier en Dieu dans le danger ne veut pas dire y rester : David a fui, et tu peux le faire aussi.',
      ),
      questions: [
        L('Where do fear and trust appear side by side? Trace the refrain in verses 3–4 and 10–11.', 'Où la peur et la confiance apparaissent-elles côte à côte ? Suis le refrain aux versets 3-4 et 10-11.'),
        L('What does the picture of tears kept in a bottle and written in God’s book reveal about Him (verse 8)?', 'Que révèle de Dieu l’image des larmes recueillies dans une outre et inscrites dans son livre (verset 8) ?'),
        L('Tell God specifically what you are afraid of today. Then pray verse 3 in your own words, beginning “When I am afraid…”.', 'Dis précisément à Dieu ce qui te fait peur aujourd’hui. Puis prie le verset 3 avec tes mots, en commençant par : « Quand j’ai peur… ».'),
      ],
      synthesis: L(
        'Write down the tears you have cried recently, for yourself or for others, as a list God already keeps. Beside it, write the refrain in your own words. If someone is threatening you, write the name of one person you will contact for help today.',
        'Note les larmes que tu as versées récemment, pour toi ou pour d’autres, comme une liste que Dieu garde déjà. À côté, écris le refrain avec tes mots. Si quelqu’un te menace, écris le nom d’une personne que tu contacteras aujourd’hui pour demander de l’aide.',
      ),
      prayer: L(
        'God, when I am afraid, I put my trust in You. You have counted my wanderings and kept my tears; not one is forgotten. I praise Your word, and I believe that You are for me.',
        'Dieu, quand j’ai peur, je me confie en toi. Tu as compté mes errances et recueilli mes larmes ; aucune n’est oubliée. Je loue ta parole, et je crois que tu es pour moi.',
      ),
    },
    safetyNote: L(
      'If someone is threatening, hurting or controlling you, trusting God includes seeking safety. Contact the emergency services if you are in immediate danger, and tell a trusted person, a pastor or a support service. Leaving danger is not a lack of faith.',
      'Si quelqu’un te menace, te fait du mal ou te contrôle, faire confiance à Dieu inclut chercher la sécurité. Contacte les services d’urgence si tu es en danger immédiat, et parles-en à une personne de confiance, à un pasteur ou à un service d’aide. Quitter le danger n’est pas un manque de foi.',
    ),
    resourceTopics: ['psalms', 'lament', 'fear'],
  },
  {
    movement: 'lament',
    theme: { en: 'Remembering in a sleepless night', fr: 'Se souvenir dans une nuit sans sommeil', es: 'Recordar en una noche sin sueño', pt: 'Lembrar numa noite sem sono', de: 'Erinnern in schlafloser Nacht', ru: 'Вспоминать в бессонную ночь', zh: '在无眠之夜回想', ja: '眠れぬ夜に思い起こす', ko: '잠 못 드는 밤에 기억하기', ar: 'التذكّر في ليلة بلا نوم', fa: 'به یاد آوردن در شبی بی‌خواب', hi: 'नींद रहित रात में स्मरण', id: 'Mengingat di malam tanpa tidur', sw: 'Kukumbuka usiku usio na usingizi', tl: 'Pag-alaala sa gabing walang tulog', am: 'እንቅልፍ በሌለበት ሌሊት ማስታወስ' },
    ref: 'Psalm 77',
    related: ['Exodus 14:21-31', 'Exodus 15:11-13'],
    reflection: L(
      'Psalm 77 begins at night. The psalmist stretches out his hands without tiring, refuses to be comforted, and finds that even thinking of God makes him groan. Six unsparing questions follow: has the Lord rejected for ever, has His steadfast love ceased, has He forgotten to be gracious? Then comes a turn — not to a feeling, but to memory. The psalmist deliberately recalls the Exodus, when God led His people through the sea by a path whose footprints no one could see.',
      'Le Psaume 77 commence la nuit. Le psalmiste tend les mains sans se lasser, refuse d’être consolé, et découvre que même penser à Dieu le fait gémir. Suivent six questions sans ménagement : le Seigneur a-t-il rejeté pour toujours, son amour fidèle a-t-il cessé, a-t-il oublié de faire grâce ? Puis vient un tournant — non vers un sentiment, mais vers la mémoire. Le psalmiste se rappelle délibérément l’Exode, quand Dieu a conduit son peuple à travers la mer par un chemin dont personne ne pouvait voir les traces.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, according to Jeduthun, a psalm of Asaph. Count the pronouns: verses 1–12 are full of “I”, verses 13–20 full of “You”. The pivot in verse 10 is notoriously hard to translate: it may voice grief that God’s mighty hand seems to have changed, or a resolve to appeal to the years when His hand acted. Verses 16–19 retell the crossing of the sea (Exodus 14–15) as a thunderstorm in which God appears. The psalm ends abruptly with Moses and Aaron leading the flock; it never returns to the psalmist’s own situation.',
        'Titre : au chef de chœur, selon Yedoutoun, psaume d’Asaph. Compte les pronoms : les versets 1 à 12 sont remplis de « je », les versets 13 à 20 de « tu ». Le pivot du verset 10 est réputé difficile à traduire : il peut exprimer la douleur de voir que la main puissante de Dieu semble avoir changé, ou la résolution d’en appeler aux années où sa main agissait. Les versets 16 à 19 racontent de nouveau la traversée de la mer (Exode 14-15) comme un orage où Dieu se manifeste. Le psaume s’arrête brusquement sur Moïse et Aaron conduisant le troupeau ; il ne revient jamais à la situation personnelle du psalmiste.',
      ),
      tension: L(
        'Memory does not work like a switch. The psalmist thinks of God in verse 3 and it makes things worse; only when he rehearses God’s specific deeds does his focus shift. And the ending does not tie up his crisis — it sets it inside a larger story. God’s footprints were unseen even while He was leading: that is honest about how faith often feels.',
        'La mémoire ne fonctionne pas comme un interrupteur. Le psalmiste pense à Dieu au verset 3 et cela aggrave les choses ; c’est seulement lorsqu’il se redit les actes précis de Dieu que son regard se déplace. Et la fin ne résout pas sa crise : elle la place dans une histoire plus grande. Les traces de Dieu restaient invisibles alors même qu’il conduisait son peuple : c’est une manière honnête de dire ce que la foi ressent souvent.',
      ),
      questions: [
        L('Count the “I” statements before verse 10 and the “You” statements after it. What happens to the psalmist’s focus?', 'Compte les phrases en « je » avant le verset 10 et les phrases en « tu » après lui. Qu’arrive-t-il au regard du psalmiste ?'),
        L('Which of the six questions in verses 7–9 have you asked yourself? What does the psalmist do with them — silence them, or bring them to God?', 'Laquelle des six questions des versets 7 à 9 t’es-tu déjà posée ? Qu’en fait le psalmiste — les fait-il taire ou les apporte-t-il à Dieu ?'),
        L('Recall one specific act of God — in Scripture and in your own story. Pray it back to Him, even if tonight you cannot see His footprints.', 'Rappelle-toi un acte précis de Dieu — dans l’Écriture et dans ta propre histoire. Redis-le-lui dans la prière, même si cette nuit tu ne vois pas ses traces.'),
      ],
      synthesis: L(
        'Make a remembrance list: three deeds of God from Scripture and three from your own life or your church’s story. Keep it where you can reach it on a sleepless night.',
        'Fais une liste de souvenirs : trois actes de Dieu tirés de l’Écriture et trois tirés de ta vie ou de l’histoire de ton Église. Garde-la à portée de main pour une nuit sans sommeil.',
      ),
      prayer: L(
        'Lord, in the night I cry to You and my soul refuses comfort. Has Your love come to an end? I will remember Your deeds of old: You made a way through the sea when no one could see Your footprints. Lead me as You led Your people.',
        'Seigneur, dans la nuit je crie vers toi et mon âme refuse d’être consolée. Ton amour a-t-il pris fin ? Je me souviendrai de tes œuvres d’autrefois : tu as ouvert un chemin à travers la mer alors que personne ne voyait tes traces. Conduis-moi comme tu as conduit ton peuple.',
      ),
    },
    safetyNote: crisisNote(
      'Sleeplessness, refusing all comfort and feeling rejected by God can be signs of depression or exhaustion. A doctor can help with sleep and mood, and a pastor can help you pray.',
      'L’insomnie, le refus de tout réconfort et le sentiment d’être rejeté par Dieu peuvent être des signes de dépression ou d’épuisement. Un médecin peut t’aider pour le sommeil et le moral, et un pasteur peut t’aider à prier.',
    ),
    resourceTopics: ['psalms', 'lament', 'suffering'],
  },
  {
    movement: 'lament',
    theme: { en: 'Anger handed over to God', fr: 'La colère remise à Dieu', es: 'La ira entregada a Dios', pt: 'A ira entregue a Deus', de: 'Zorn, in Gottes Hände gelegt', ru: 'Гнев, отданный Богу', zh: '把愤怒交托给神', ja: '怒りを神にゆだねる', ko: '하나님께 맡긴 분노', ar: 'غضب مُسلَّم إلى الله', fa: 'خشمی که به خدا سپرده شد', hi: 'परमेश्वर को सौंपा गया क्रोध', id: 'Amarah yang diserahkan kepada Allah', sw: 'Hasira iliyokabidhiwa kwa Mungu', tl: 'Galit na ipinaubaya sa Diyos', am: 'ለእግዚአብሔር የተሰጠ ቁጣ' },
    ref: 'Psalm 69',
    related: ['Psalm 137', 'Romans 12:14-21', 'Luke 23:32-36'],
    reflection: L(
      'Psalm 69 is the cry of someone sinking in deep mire, hated for no reason, mocked for his zeal for God’s house, and given bitter food and sour wine by those who should have comforted him. Then, in verses 22–28, he asks God to act against his enemies in words that shock us. The psalm does not hide that anger. What it does is address it to God: the psalmist hands judgment over instead of taking it into his own hands. And the New Testament hears this psalm again at the cross, where Jesus, offered sour wine, prays for those who crucify Him.',
      'Le Psaume 69 est le cri de quelqu’un qui s’enfonce dans une boue profonde, haï sans raison, moqué pour son zèle envers la maison de Dieu, et à qui l’on donne une nourriture amère et du vinaigre au lieu de le consoler. Puis, aux versets 22 à 28, il demande à Dieu d’agir contre ses ennemis en des termes qui nous choquent. Le psaume ne cache pas cette colère. Ce qu’il fait, c’est l’adresser à Dieu : le psalmiste remet le jugement au lieu de le prendre en main. Et le Nouveau Testament réentend ce psaume à la croix, où Jésus, à qui l’on tend du vinaigre, prie pour ceux qui le crucifient.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, “according to Lilies” (probably a tune), of David. It is among the psalms most quoted in the New Testament: verse 4 in John 15:25 (hatred without cause), verse 9 in John 2:17 and Romans 15:3 (zeal for God’s house; bearing the insults aimed at God), verse 21 behind the sour wine of the crucifixion (Matthew 27:34, 48; John 19:28-29), verses 22–23 in Romans 11:9-10 and verse 25 in Acts 1:20. Psalms that ask God to punish enemies are called imprecatory; Psalms 109 and 137 are the sharpest examples.',
        'Titre : au chef de chœur, « sur les lis » (probablement un air), de David. C’est l’un des psaumes les plus cités dans le Nouveau Testament : le verset 4 en Jean 15.25 (la haine sans cause), le verset 9 en Jean 2.17 et Romains 15.3 (le zèle pour la maison de Dieu ; les outrages dirigés contre Dieu), le verset 21 derrière le vinaigre de la crucifixion (Matthieu 27.34, 48 ; Jean 19.28-29), les versets 22 et 23 en Romains 11.9-10 et le verset 25 en Actes 1.20. On appelle « imprécatoires » les psaumes qui demandent à Dieu de punir des ennemis ; les Psaumes 109 et 137 en sont les exemples les plus durs.',
      ),
      tension: L(
        'This psalm is not a model for cursing people, nor for “prayers” that call down death, sickness or ruin on others. Jesus teaches us to love and pray for our enemies (Matthew 5:44), Paul forbids revenge and tells us to leave room for God’s judgment (Romans 12:19), and our struggle is not against flesh and blood (Ephesians 6:12). What the psalm does permit is honesty: you may tell God the full weight of an injustice and ask Him to judge rightly — then leave the judgment with Him.',
        'Ce psaume n’est pas un modèle pour maudire des personnes, ni pour des « prières » qui appellent la mort, la maladie ou la ruine sur autrui. Jésus nous apprend à aimer nos ennemis et à prier pour eux (Matthieu 5.44), Paul interdit la vengeance et demande de laisser agir le jugement de Dieu (Romains 12.19), et notre combat n’est pas contre la chair et le sang (Éphésiens 6.12). Ce que le psaume permet, c’est l’honnêteté : tu peux dire à Dieu tout le poids d’une injustice et lui demander de juger avec droiture — puis lui laisser le jugement.',
      ),
      questions: [
        L('Trace the movement: sinking (1–4), suffering for God’s sake (5–12), plea (13–21), imprecation (22–28), praise (29–36). What surprises you about the ending?', 'Suis le mouvement : l’enlisement (1-4), la souffrance à cause de Dieu (5-12), la supplication (13-21), l’imprécation (22-28), la louange (29-36). Qu’est-ce qui te surprend dans la fin ?'),
        L('How does the New Testament apply this psalm to Jesus? What is different in the way He treats those who wronged Him (Luke 23:34-36)?', 'Comment le Nouveau Testament applique-t-il ce psaume à Jésus ? Qu’y a-t-il de différent dans sa manière de traiter ceux qui lui ont fait du tort (Luc 23.34-36) ?'),
        L('Is there an injustice you have not dared to name before God? Tell Him honestly, ask Him to judge rightly, and ask for grace to bless rather than curse.', 'Y a-t-il une injustice que tu n’as pas osé nommer devant Dieu ? Dis-la-lui honnêtement, demande-lui de juger avec droiture, et demande la grâce de bénir plutôt que de maudire.'),
      ],
      synthesis: L(
        'On one side of a page, write the injustice and your honest anger. On the other, write Romans 12:19 in your own words and one step of blessing, safety or truthful action you can take instead of revenge.',
        'D’un côté d’une page, écris l’injustice et ta colère sincère. De l’autre, écris Romains 12.19 avec tes mots et une démarche de bénédiction, de mise en sécurité ou de vérité que tu peux accomplir au lieu de te venger.',
      ),
      prayer: L(
        'God, I am sinking, and I feel hated for no reason. I bring You my anger instead of acting on it. Judge rightly, defend the oppressed, and make me like Jesus, who prayed for those who wounded Him.',
        'Dieu, je m’enfonce, et je me sens haï sans raison. Je t’apporte ma colère au lieu d’agir selon elle. Juge avec droiture, défends les opprimés, et rends-moi semblable à Jésus, qui a prié pour ceux qui le blessaient.',
      ),
    },
    safetyNote: crisisNote(
      'If you are being wronged or abused, handing your anger to God does not mean staying silent or unprotected: tell a trusted person, a pastor or a safeguarding lead, and contact the police if you are in danger. If anger ever turns toward harming someone, seek help today.',
      'Si tu subis une injustice ou des abus, remettre ta colère à Dieu ne veut pas dire te taire ou rester sans protection : parles-en à une personne de confiance, à un pasteur ou à un référent protection, et contacte la police si tu es en danger. Si ta colère te pousse un jour à vouloir faire du mal à quelqu’un, cherche de l’aide dès aujourd’hui.',
    ),
    resourceTopics: ['psalms', 'lament', 'justice', 'forgiveness'],
  },
  {
    movement: 'lament',
    theme: { en: 'Forsaken — and the praise beyond', fr: 'Abandonné — et la louange au-delà', es: 'Desamparado, y la alabanza que sigue', pt: 'Desamparado — e o louvor que vem depois', de: 'Verlassen – und das Lob danach', ru: 'Оставленный — и хвала за пределами', zh: '被离弃——以及之后的赞美', ja: '見捨てられて――その先の賛美', ko: '버림받음, 그리고 그 너머의 찬양', ar: 'متروك، والتسبيح من بعد', fa: 'رهاشده، و ستایشی فراتر از آن', hi: 'त्यागा हुआ — और उसके पार स्तुति', id: 'Ditinggalkan — dan pujian sesudahnya', sw: 'Kuachwa, na sifa zinazofuata', tl: 'Pinabayaan — at ang papuri pagkatapos', am: 'ተተወ — ከዚያም በኋላ ያለ ምስጋና' },
    ref: 'Psalm 22',
    related: ['Mark 15:33-39', 'John 19:23-24', 'Hebrews 2:10-12'],
    reflection: L(
      'Psalm 22 opens with the most desolate cry in the Psalter — the cry of a sufferer who feels forsaken by his God — and Jesus prayed its first line from the cross (Mark 15:34). The psalmist alternates between what he suffers (mockery, exhaustion, bones out of joint, garments divided) and what he knows (God is holy, the ancestors trusted and were rescued, God has held him since birth). Then, suddenly, in verse 21, he says that God has answered him, and praise spreads outward: to his brothers, to Israel, to the ends of the earth, even to generations not yet born.',
      'Le Psaume 22 s’ouvre sur le cri le plus désolé du psautier — celui d’un homme souffrant qui se sent abandonné par son Dieu — et Jésus en a prié la première ligne sur la croix (Marc 15.34). Le psalmiste alterne entre ce qu’il endure (les moqueries, l’épuisement, les os disloqués, les vêtements partagés) et ce qu’il sait (Dieu est saint, les pères se sont confiés et ont été délivrés, Dieu le porte depuis sa naissance). Puis, soudain, au verset 21, il dit que Dieu lui a répondu, et la louange s’élargit : à ses frères, à Israël, aux extrémités de la terre, jusqu’aux générations encore à naître.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, “according to The Doe of the Dawn” (probably a tune), a psalm of David. The Gospels weave it through the passion: Jesus’ cry (Matthew 27:46; Mark 15:34, in Aramaic), the mockery about trusting God (Matthew 27:43), the dividing of His clothes (John 19:23-24). Hebrews 2:12 places verse 22 on the lips of the risen Christ, praising God among His brothers and sisters. Verse 16 has a textual question: the standard Hebrew text reads “like a lion”, while the Greek translation and some Hebrew manuscripts read “they pierced” (or “dug”); translations differ, and the Christian reading of the psalm does not hang on that one word.',
        'Titre : au chef de chœur, « sur la biche de l’aurore » (probablement un air), psaume de David. Les Évangiles le tissent dans le récit de la Passion : le cri de Jésus (Matthieu 27.46 ; Marc 15.34, en araméen), les moqueries sur sa confiance en Dieu (Matthieu 27.43), le partage de ses vêtements (Jean 19.23-24). Hébreux 2.12 place le verset 22 dans la bouche du Christ ressuscité, qui loue Dieu au milieu de ses frères et sœurs. Le verset 16 pose une question textuelle : le texte hébreu standard porte « comme un lion », tandis que la traduction grecque et quelques manuscrits hébreux portent « ils ont percé » (ou « creusé ») ; les traductions diffèrent, et la lecture chrétienne du psaume ne dépend pas de ce seul mot.',
      ),
      tension: L(
        'The psalm is first David’s real prayer, not a coded script; the New Testament shows how it finds its fullest meaning in Jesus. Many interpreters think that in praying the first line Jesus claimed the whole psalm, ending included — but His cry was still a real cry of abandonment, not a performance. And the turn in verse 21 is God’s gift, not a method; in your own suffering it may not come quickly.',
        'Ce psaume est d’abord la vraie prière de David, pas un texte codé ; le Nouveau Testament montre comment il trouve son sens le plus plein en Jésus. Beaucoup d’interprètes pensent qu’en priant la première ligne, Jésus faisait sien le psaume entier, fin comprise — mais son cri restait un vrai cri d’abandon, pas une mise en scène. Et le tournant du verset 21 est un don de Dieu, non une méthode ; dans ta propre souffrance, il peut tarder à venir.',
      ),
      questions: [
        L('Follow the alternation between suffering (1–2, 6–8, 12–18) and memory or trust (3–5, 9–11). Where does the psalm turn, and how far does the praise spread afterwards?', 'Suis l’alternance entre la souffrance (1-2, 6-8, 12-18) et le souvenir ou la confiance (3-5, 9-11). Où le psaume bascule-t-il, et jusqu’où la louange s’étend-elle ensuite ?'),
        L('Read Mark 15:33-39 beside this psalm. What does it mean that Jesus entered the psalmist’s forsakenness?', 'Lis Marc 15.33-39 à côté de ce psaume. Que signifie le fait que Jésus soit entré dans l’abandon du psalmiste ?'),
        L('Pray for someone who feels abandoned by God right now. Ask that they would not be alone, and that God would answer them in His time.', 'Prie pour quelqu’un qui se sent abandonné par Dieu en ce moment. Demande qu’il ne soit pas seul, et que Dieu lui réponde en son temps.'),
      ],
      synthesis: L(
        'Draw the widening circles of praise in verses 22–31: me, my brothers and sisters, Israel, the nations, the dead, those not yet born. Then write one sentence on what Jesus’ use of this psalm means for your own darkest prayers.',
        'Dessine les cercles de louange qui s’élargissent aux versets 22 à 31 : moi, mes frères et sœurs, Israël, les nations, les morts, ceux qui ne sont pas encore nés. Puis écris une phrase sur ce que l’usage de ce psaume par Jésus signifie pour tes prières les plus sombres.',
      ),
      prayer: L(
        'My God, sometimes I feel forsaken, and I cry by day and by night. Yet You are holy, and those before me trusted You. Lord Jesus, You prayed these words on the cross; stay with me in the dark, and let me live to tell of Your faithfulness.',
        'Mon Dieu, parfois je me sens abandonné, et je crie le jour et la nuit. Pourtant tu es saint, et ceux qui m’ont précédé se sont confiés en toi. Seigneur Jésus, tu as prié ces mots sur la croix ; reste avec moi dans la nuit, et donne-moi de vivre pour raconter ta fidélité.',
      ),
    },
    safetyNote: crisisNote(
      'Feeling forsaken by God can be overwhelming, especially in illness, grief or depression. You do not have to hold it alone: a pastor, a trusted believer, a doctor or a counsellor can walk with you.',
      'Se sentir abandonné par Dieu peut être écrasant, surtout dans la maladie, le deuil ou la dépression. Tu n’as pas à porter cela seul : un pasteur, un croyant de confiance, un médecin ou un conseiller peut marcher avec toi.',
    ),
    resourceTopics: ['psalms', 'lament', 'cross', 'suffering'],
  },
  {
    movement: 'lament',
    theme: { en: 'Praying in the dark', fr: 'Prier dans les ténèbres', es: 'Orar en la oscuridad', pt: 'Orar na escuridão', de: 'Beten im Dunkeln', ru: 'Молиться во тьме', zh: '在黑暗中祷告', ja: '暗闇の中で祈る', ko: '어둠 속에서 기도하기', ar: 'الصلاة في الظلمة', fa: 'دعا در تاریکی', hi: 'अंधकार में प्रार्थना', id: 'Berdoa dalam kegelapan', sw: 'Kuomba gizani', tl: 'Pananalangin sa dilim', am: 'በጨለማ መጸለይ' },
    ref: 'Psalm 88',
    related: ['1 Chronicles 6:31-33', 'Romans 8:26-27'],
    reflection: L(
      'Psalm 88 is the darkest prayer in the Bible. Heman speaks of being near the grave, shunned by his friends, overwhelmed by God’s waves, afflicted since his youth; he asks whether the dead can praise God, and receives no answer. The psalm ends with darkness as his closest companion. This study will not add a happier ending, because Scripture does not. Notice only what is already there: he calls the Lord the God of his salvation, and he keeps praying — day and night, every day, in the morning.',
      'Le Psaume 88 est la prière la plus sombre de la Bible. Héman parle d’être au bord de la tombe, évité par ses amis, submergé par les vagues de Dieu, affligé depuis sa jeunesse ; il demande si les morts peuvent louer Dieu, et ne reçoit aucune réponse. Le psaume s’achève sur les ténèbres comme compagnie la plus proche. Cette étude n’ajoutera pas de fin plus heureuse, parce que l’Écriture ne le fait pas. Remarque seulement ce qui s’y trouve déjà : il appelle le Seigneur le Dieu de son salut, et il continue de prier — le jour et la nuit, chaque jour, dès le matin.',
    ),
    study: {
      context: L(
        'Title: a song, a psalm of the Sons of Korah, for the choirmaster, “according to Mahalath Leannoth” (perhaps a tune, or a note about affliction), a maskil of Heman the Ezrahite. Heman is remembered as a wise man (1 Kings 4:31) and a temple singer (1 Chronicles 6:33). The psalm has three cycles, each beginning with a cry (verses 1, 9 and 13), and its questions in verses 10–12 argue that God’s steadfast love cannot be praised from the grave. Unlike almost every other lament, it contains no turn to trust and no vow of praise.',
        'Titre : cantique, psaume des fils de Koré, au chef de chœur, « sur mahalath leannoth » (peut-être un air, ou une indication liée à l’affliction), maskil d’Héman l’Ezrahite. Héman est mentionné comme un sage (1 Rois 4.31, ou 5.11 selon les éditions) et comme un chantre du temple (1 Chroniques 6.33). Le psaume comporte trois cycles, chacun ouvert par un cri (versets 1, 9 et 13), et ses questions des versets 10 à 12 soutiennent qu’on ne peut pas louer l’amour fidèle de Dieu depuis la tombe. Contrairement à presque toutes les autres lamentations, il ne contient ni retour à la confiance ni promesse de louange.',
      ),
      tension: L(
        'Do not rush to resolve this psalm or to explain Heman’s suffering. Its place in Scripture is itself the comfort: God’s word includes a prayer that ends in darkness, so a believer whose prayer ends there today has not failed. The psalm does not say that suffering proves God’s rejection; it shows a faithful person who still feels rejected. If you read Romans 8:26-27 beside it, read it as company rather than correction: the Spirit also prays with groaning beyond words.',
        'Ne te presse pas de résoudre ce psaume ni d’expliquer la souffrance d’Héman. Sa place dans l’Écriture est en elle-même une consolation : la Parole de Dieu contient une prière qui se termine dans les ténèbres, si bien qu’un croyant dont la prière s’y termine aujourd’hui n’a pas échoué. Le psaume ne dit pas que la souffrance prouve le rejet de Dieu ; il montre un fidèle qui se sent pourtant rejeté. Si tu lis Romains 8.26-27 à côté, lis-le comme une compagnie plutôt que comme une correction : l’Esprit prie lui aussi avec des soupirs que les mots ne peuvent dire.',
      ),
      questions: [
        L('Find the three cries (verses 1, 9 and 13). What keeps Heman praying when nothing in the psalm improves?', 'Repère les trois cris (versets 1, 9 et 13). Qu’est-ce qui fait qu’Héman continue de prier alors que rien ne s’améliore dans le psaume ?'),
        L('What does it mean that this psalm is in the Bible at all? What does its presence reveal about God and about prayer?', 'Que signifie le simple fait que ce psaume soit dans la Bible ? Que révèle sa présence au sujet de Dieu et de la prière ?'),
        L('Whom do you know who is living in Psalm 88? Pray for them without offering God a quick solution — and ask how you could keep them company.', 'Qui connais-tu qui vit le Psaume 88 ? Prie pour cette personne sans proposer à Dieu de solution rapide — et demande comment tu pourrais lui tenir compagnie.'),
      ],
      synthesis: L(
        'Week review: write one line for each lament this week (13, 42, 56, 77, 69, 22, 88), noting whether it reaches a turn and what that turn rests on. Review question: what have you learned about bringing grief and anger to God without tidying them first? Leave today’s page unfinished if that is what is honest.',
        'Bilan de la semaine : écris une ligne pour chaque lamentation de la semaine (13, 42, 56, 77, 69, 22, 88), en notant si elle atteint un tournant et sur quoi ce tournant repose. Question de bilan : qu’as-tu appris sur la manière d’apporter à Dieu le chagrin et la colère sans les mettre en ordre d’abord ? Laisse la page d’aujourd’hui inachevée si c’est cela qui est honnête.',
      ),
      prayer: L(
        'Lord, God of my salvation, I cry to You day and night. I do not understand, and the darkness is close. I will not stop calling to You. Hold me here, even where I cannot feel You.',
        'Seigneur, Dieu de mon salut, je crie vers toi le jour et la nuit. Je ne comprends pas, et les ténèbres sont proches. Je ne cesserai pas de t’appeler. Tiens-moi ici, même là où je ne te sens pas.',
      ),
    },
    safetyNote: crisisNote(
      'If this psalm describes you — especially thoughts of death, long isolation or the sense that God has cast you off — please reach out for help today; you are not meant to carry this alone.',
      'Si ce psaume te décrit — surtout si tu as des pensées de mort, un long isolement ou le sentiment que Dieu t’a rejeté —, cherche de l’aide dès aujourd’hui ; tu n’es pas fait pour porter cela seul.',
    ),
    resourceTopics: ['psalms', 'lament', 'grief', 'mental-health'],
  },
  // ── Week 4 · Repentance and mercy ────────────────────────────────────────
  {
    movement: 'mercy',
    theme: { en: 'Mercy in exhaustion', fr: 'La miséricorde dans l’épuisement', es: 'Misericordia en el agotamiento', pt: 'Misericórdia no esgotamento', de: 'Erbarmen in der Erschöpfung', ru: 'Милость в изнеможении', zh: '疲惫中的怜悯', ja: '疲れの中のあわれみ', ko: '지친 마음에 베푸시는 긍휼', ar: 'الرحمة في الإنهاك', fa: 'رحمت در فرسودگی', hi: 'थकान में दया', id: 'Belas kasihan dalam kelelahan', sw: 'Rehema katika uchovu', tl: 'Habag sa pagkapagod', am: 'በድካም ውስጥ ምሕረት' },
    ref: 'Psalm 6',
    related: ['Psalm 38', 'John 9:1-7', 'Matthew 7:21-23'],
    reflection: L(
      'Psalm 6 shows how to pray when suffering and the fear of God’s displeasure are tangled together. The psalmist is worn out. His bones shake, he soaks his bed with tears night after night, and his eyes grow dim with grief. He neither argues his innocence nor lists his sins; he appeals to one thing only — God’s steadfast love. Then, with no explanation, the tone changes at verse 8: in three short lines he says that the Lord has heard his weeping, heard his plea and received his prayer. After the unanswered night of Psalm 88, here is another sufferer given a different ending — and neither ending is a timetable for yours.',
      'Le Psaume 6 montre comment prier quand la souffrance et la crainte de déplaire à Dieu s’emmêlent. Le psalmiste est à bout. Ses os tremblent, nuit après nuit il inonde son lit de larmes, et ses yeux s’usent de chagrin. Il ne plaide pas son innocence et ne dresse pas la liste de ses péchés ; il en appelle à une seule chose — l’amour fidèle de Dieu. Puis, sans explication, le ton change au verset 8 : en trois lignes brèves, il affirme que le Seigneur a entendu ses pleurs, entendu sa supplication et accueilli sa prière. Après la nuit sans réponse du Psaume 88, voici un autre homme souffrant à qui une fin différente est donnée — et aucune de ces deux fins n’impose de calendrier à la tienne.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, with stringed instruments, “according to the Sheminith” (perhaps an eight-stringed instrument), a psalm of David — an ancient title whose authorship and setting are debated. Psalm 6 is the first of the seven penitential psalms (6, 32, 38, 51, 102, 130, 143); this week reads five of them. The structure is plea (1–3), appeal to steadfast love (4–5), tears (6–7) and sudden confidence (8–10). Verse 3 breaks off mid-sentence in an unfinished “how long?”. The same Hebrew verb for being greatly dismayed describes his bones (2) and his soul (3), then, in the last verse, his enemies (10): the dismay changes sides. Jesus takes up verse 8 in Matthew 7:23.',
        'Titre : au chef de chœur, avec instruments à cordes, « sur la Sheminith » (peut-être un instrument à huit cordes), psaume de David — un titre ancien dont l’auteur et le cadre restent discutés. Le Psaume 6 est le premier des sept psaumes pénitentiels (6, 32, 38, 51, 102, 130, 143) ; cette semaine en lit cinq. Sa structure : supplication (1-3), appel à l’amour fidèle (4-5), larmes (6-7) et confiance soudaine (8-10). Le verset 3 s’interrompt au milieu de la phrase, sur un « jusqu’à quand ? » inachevé. Le même verbe hébreu, être profondément épouvanté, décrit ses os (2) et son âme (3), puis, au dernier verset, ses ennemis (10) : l’épouvante a changé de camp. Jésus reprend le verset 8 en Matthieu 7.23.',
      ),
      tension: L(
        'Tradition calls this psalm penitential, yet it never names a sin: the psalmist fears God’s anger (verse 1) and pleads as a sufferer. Do not turn it into a formula in which suffering proves sin — Jesus refused that reasoning about the man born blind (John 9:1-3), and the book of Job resists it at length. Verse 5, which asks who praises God from the grave, is an argument for staying alive; it is not a full teaching on death. And the turn at verse 8 is a gift, not a technique; it may come only after many nights.',
        'La tradition range ce psaume parmi les psaumes pénitentiels, et pourtant il ne nomme aucun péché : le psalmiste redoute la colère de Dieu (verset 1) et supplie en homme qui souffre. N’en fais pas une formule où la souffrance prouverait le péché — Jésus a refusé ce raisonnement à propos de l’aveugle de naissance (Jean 9.1-3), et le livre de Job s’y oppose longuement. Le verset 5, qui demande qui louera Dieu depuis le séjour des morts, est un argument pour rester en vie ; ce n’est pas un enseignement complet sur la mort. Et le basculement du verset 8 est un don, non une technique ; il peut ne venir qu’après bien des nuits.',
      ),
      questions: [
        L('Observation: list the bodily details in verses 2–3 and 6–7. What single reason does the psalmist give God for showing mercy (verse 4)?', 'Observation : relève les détails corporels des versets 2-3 et 6-7. Quelle raison unique le psalmiste donne-t-il à Dieu pour faire grâce (verset 4) ?'),
        L('Meaning: nothing in the text explains the shift at verse 8. Compare it with Psalm 88, which never turns. What does it mean that Scripture keeps both endings?', 'Sens : rien dans le texte n’explique le basculement du verset 8. Compare-le au Psaume 88, qui ne bascule jamais. Que signifie le fait que l’Écriture garde les deux fins ?'),
        L('Prayer: pray verses 2–4 for yourself or for someone who is worn out, asking for mercy and healing without deciding why they are suffering.', 'Prière : prie les versets 2 à 4 pour toi ou pour une personne épuisée, en demandant miséricorde et guérison sans décider pourquoi elle souffre.'),
      ],
      synthesis: L(
        'Write a few lines about one night or season of exhaustion — yours or that of someone you love — in the psalm’s four steps: plea, reason for mercy, honest tears, and whatever confidence you can truly voice today. If that last line is only that God hears, it is enough. Then note one practical way to keep a tired person company this week without demanding that they feel better.',
        'Raconte en quelques lignes une nuit ou une saison d’épuisement — la tienne ou celle d’un proche — selon les quatre étapes du psaume : supplication, raison d’espérer la grâce, larmes honnêtes, et la confiance que tu peux vraiment exprimer aujourd’hui. Si cette dernière ligne se résume à dire que Dieu entend, cela suffit. Puis note une façon concrète de tenir compagnie à une personne fatiguée cette semaine, sans exiger qu’elle aille mieux.',
      ),
      prayer: L(
        'Lord, if You must correct me, do not do it in anger; be gracious to me, for I have no strength left. My body shakes and my soul is troubled — how long? Turn and rescue me, because Your love is steadfast. You hear my weeping; receive my prayer tonight.',
        'Seigneur, si tu dois me reprendre, que ce ne soit pas dans ta colère ; fais-moi grâce, car je suis sans force. Mon corps tremble et mon âme est troublée — jusqu’à quand ? Reviens et délivre-moi, à cause de ton amour fidèle. Tu entends mes pleurs ; accueille ma prière cette nuit.',
      ),
    },
    safetyNote: crisisNote('Persistent exhaustion, pain or distress deserves medical care as well as prayer; speak with a doctor or qualified counsellor.', 'Un épuisement, une douleur ou une détresse qui durent demandent des soins autant que la prière ; parle à un médecin ou à un professionnel qualifié.'),
    resourceTopics: ['psalms', 'lament', 'suffering', 'prayer'],
  },
  {
    movement: 'mercy',
    theme: { en: 'Teach a forgiven heart', fr: 'Enseigne à un cœur pardonné', es: 'Enseña a un corazón perdonado', pt: 'Ensina um coração perdoado', de: 'Lehre ein vergebenes Herz', ru: 'Научи прощённое сердце', zh: '教导蒙赦免的心', ja: '赦された心を教えてください', ko: '용서받은 마음을 가르치소서', ar: 'علّم قلبًا نال الغفران', fa: 'دل بخشوده را تعلیم بده', hi: 'क्षमा पाए हृदय को सिखा', id: 'Ajarlah hati yang diampuni', sw: 'Ufundishe moyo uliosamehewa', tl: 'Turuan ang pusong pinatawad', am: 'ይቅርታ ያገኘን ልብ አስተምር' },
    ref: 'Psalm 25',
    related: ['Psalm 32', 'Psalm 130', 'Psalm 34'],
    reflection: L(
      'Psalm 25 is the prayer of someone who needs three things at once: protection from enemies, forgiveness for sins old and new, and teaching for the road ahead. Because the Lord is good and upright, the psalm reasons, He shows sinners the way (verse 8): failure does not disqualify anyone from learning; it is the very reason to ask. At the exact centre of the poem, verse 11 asks pardon for a guilt the psalmist calls great, for the sake of God’s name. And the last verse widens from one lonely, troubled person to the whole of Israel.',
      'Le Psaume 25 est la prière de quelqu’un qui a besoin de trois choses à la fois : être protégé de ses ennemis, être pardonné de péchés anciens et récents, et être enseigné pour la route à venir. Parce que le Seigneur est bon et droit, raisonne le psaume, il montre le chemin aux pécheurs (verset 8) : l’échec n’exclut personne de l’apprentissage, il est justement la raison de demander. Au centre exact du poème, le verset 11 demande le pardon d’une faute que le psalmiste dit grande, à cause du nom de Dieu. Et le dernier verset s’élargit d’une personne seule et éprouvée à tout Israël.',
    ),
    study: {
      context: L(
        'Title: of David. Psalm 25 is an acrostic: each verse begins with the next letter of the Hebrew alphabet, a form that suggests completeness and aids memory. The pattern is slightly irregular: a letter or two is missing or doubled, and verse 22, the prayer for Israel, stands outside the alphabet, just as the last verse of Psalm 34 does. In verses 6–7 three requests about remembering play against each other: remember Your mercy, do not remember the sins of my youth, remember me according to Your love. The New Testament does not quote it directly.',
        'Titre : de David. Le Psaume 25 est un acrostiche : chaque verset commence par la lettre suivante de l’alphabet hébreu, une forme qui évoque la totalité et aide à mémoriser. Le schéma est un peu irrégulier : une ou deux lettres manquent ou sont doublées, et le verset 22, la prière pour Israël, se tient en dehors de l’alphabet, tout comme le dernier verset du Psaume 34. Aux versets 6 et 7, trois demandes autour du souvenir se répondent : souviens-toi de ta compassion, ne te souviens pas des péchés de ma jeunesse, souviens-toi de moi selon ton amour. Le Nouveau Testament ne le cite pas directement.',
      ),
      tension: L(
        'The tidy alphabet does not mean a tidy life: the same poem confesses great guilt, loneliness and distress (16–18). Verses 12–13 speak of those who fear the Lord living in prosperity and their children inheriting the land — covenant language for Israel’s life in the land, not a forecast of personal wealth. The hope of never being put to shame (verse 3) does not mean believers escape humiliation; Jesus Himself endured the shame of the cross (Hebrews 12:2). And the prayer for guidance seeks a life shaped by God’s love and faithfulness (verse 10), not a private answer to every decision.',
        'L’ordre de l’alphabet ne signifie pas une vie en ordre : le même poème confesse une grande faute, la solitude et la détresse (16-18). Les versets 12 et 13 parlent de ceux qui craignent le Seigneur vivant dans le bonheur et de leur descendance héritant du pays : c’est le langage de l’alliance pour la vie d’Israël dans le pays, non la prédiction d’une fortune personnelle. L’espérance de ne jamais être couvert de honte (verset 3) ne signifie pas que les croyants échappent à l’humiliation ; Jésus lui-même a enduré la honte de la croix (Hébreux 12.2). Et la prière pour être guidé cherche une vie façonnée par l’amour et la fidélité de Dieu (verset 10), non une réponse privée pour chaque décision.',
      ),
      questions: [
        L('Observation: underline the requests to be shown, taught and led (4–5, 8–9, 12), then the confessions (7, 11, 18). Why might verse 11 sit at the centre?', 'Observation : souligne les demandes d’être enseigné et conduit (4-5, 8-9, 12), puis les confessions (7, 11, 18). Pourquoi le verset 11 se trouve-t-il peut-être au centre ?'),
        L('Meaning: according to verses 8–10, what is it about God that makes Him willing to teach sinners? How does that change the way you look at your past failures?', 'Sens : d’après les versets 8 à 10, qu’est-ce qui, en Dieu, le rend disposé à enseigner les pécheurs ? En quoi cela change-t-il ton regard sur tes échecs passés ?'),
        L('Prayer: bring God, in the same prayer, one decision you face and one sin you need forgiven. Ask Him to remember you according to His love, not according to your record.', 'Prière : apporte à Dieu, dans une même prière, une décision que tu dois prendre et un péché dont tu as besoin d’être pardonné. Demande-lui de se souvenir de toi selon son amour, et non selon ton passé.'),
      ],
      synthesis: L(
        'Write your own short alphabet prayer — even five lines, each beginning with the next letter (A, B, C, D, E) — that includes one request for forgiveness, one request to be taught and, like verse 22, one line for your church or your people. Then note one act of obedience you already know you should do; guidance often begins there.',
        'Écris ta propre courte prière alphabétique — même cinq lignes, chacune commençant par la lettre suivante (A, B, C, D, E) — avec une demande de pardon, une demande d’enseignement et, comme au verset 22, une ligne pour ton Église ou ton peuple. Puis note un acte d’obéissance que tu sais déjà devoir accomplir : la direction commence souvent là.',
      ),
      prayer: L(
        'Lord, I turn my whole self toward You. Teach me how You walk and lead me in Your truth, for You are good and You show sinners the way. Forget the sins of my youth; remember me with Your steadfast love. For Your name’s sake, pardon my guilt, great as it is — and rescue Your people from all their distress.',
        'Seigneur, je me tourne vers toi de tout mon être. Apprends-moi ta manière de marcher et conduis-moi dans ta vérité, car tu es bon et tu montres le chemin aux pécheurs. Oublie les fautes de ma jeunesse ; souviens-toi de moi dans ton amour fidèle. À cause de ton nom, pardonne ma faute, si grande soit-elle — et délivre ton peuple de toutes ses détresses.',
      ),
    },
    resourceTopics: ['psalms', 'repentance', 'prayer'],
  },
  {
    movement: 'mercy',
    theme: { en: 'From concealment to confession', fr: 'Du secret à la confession', es: 'De ocultar a confesar', pt: 'Do encobrimento à confissão', de: 'Vom Verbergen zum Bekennen', ru: 'От сокрытия к исповеданию', zh: '从隐藏到认罪', ja: '隠すことから告白へ', ko: '숨김에서 고백으로', ar: 'من الإخفاء إلى الاعتراف', fa: 'از پنهان‌کاری تا اعتراف', hi: 'छिपाने से अंगीकार तक', id: 'Dari menyembunyikan ke pengakuan', sw: 'Kutoka kuficha hadi kukiri', tl: 'Mula pagtatago tungo sa pag-amin', am: 'ከመደበቅ ወደ መናዘዝ' },
    ref: 'Psalm 32',
    related: ['Romans 4:1-8', 'Proverbs 28:13'],
    reflection: L(
      'Psalm 32 is a testimony told backwards. It begins with the happiness of the forgiven (verses 1–2), then remembers how the psalmist got there: while he kept silent, his body wasted away and God’s hand lay heavy on him day and night, drying him out like summer heat. The turn comes in verse 5 — he stops covering his sin, names it, and is forgiven. Notice the wordplay: when he covered his sin, it crushed him; when he uncovered it, God covered it. The man who hid his guilt ends by calling God the place where he hides (verse 7), and then turns to teach others what he has learned.',
      'Le Psaume 32 est un témoignage raconté à rebours. Il commence par le bonheur de ceux qui sont pardonnés (versets 1-2), puis se souvient du chemin parcouru : tant que le psalmiste se taisait, son corps dépérissait et la main de Dieu pesait sur lui jour et nuit, le desséchant comme la chaleur de l’été. Le tournant vient au verset 5 : il cesse de couvrir son péché, il le nomme, et il est pardonné. Remarque le jeu de mots : quand il couvrait sa faute, elle l’écrasait ; quand il l’a découverte, c’est Dieu qui l’a couverte. Celui qui cachait sa culpabilité finit par appeler Dieu l’abri où il se cache (verset 7), puis se tourne vers les autres pour leur enseigner ce qu’il a appris.',
    ),
    study: {
      context: L(
        'Title: of David, a maskil — the first psalm with this label, perhaps meaning a skilful or instructive song. Tradition counts it as the second penitential psalm. Verses 1–2 use three words for wrongdoing (transgression, sin, iniquity) and three pictures of forgiveness (lifted away, covered, not counted); in verse 5 all three words return as the psalmist confesses. Selah marks a pause after the silence (4), the confession (5) and the hiding place (7). The voice in verses 8–9 may be God’s or the psalmist’s as teacher. Paul quotes verses 1–2 in Romans 4:6-8 to show that God credits righteousness apart from works: David, like Abraham, is blessed because the Lord does not count his sin against him. Luther counted it among his “Pauline psalms”, with 51, 130 and 143.',
        'Titre : de David, maskil — le premier psaume à porter ce nom, qui désigne peut-être un chant habile ou un chant d’enseignement. La tradition en fait le deuxième psaume pénitentiel. Les versets 1 et 2 emploient trois mots pour la faute (transgression, péché, iniquité) et trois images du pardon (enlevée, couverte, non comptée) ; au verset 5, les trois mots reviennent quand le psalmiste confesse. Le mot sélah marque une pause après le silence (4), la confession (5) et l’abri (7). La voix des versets 8 et 9 peut être celle de Dieu ou celle du psalmiste devenu enseignant. Paul cite les versets 1 et 2 en Romains 4.6-8 pour montrer que Dieu compte la justice sans les œuvres : David, comme Abraham, est déclaré heureux parce que le Seigneur ne lui tient pas compte de son péché. Luther rangeait ce psaume parmi ses « psaumes pauliniens », avec les Psaumes 51, 130 et 143.',
      ),
      tension: L(
        'The wasting body of verses 3–4 is this psalmist’s testimony, not a rule that every illness hides an unconfessed sin (John 9:1-3). Nor is confession a payment: the forgiveness of verse 5 is God’s act, and more distress does not buy more mercy. Forgiveness also leaves room for responsibility — repairing harm, telling the truth to those affected, accepting proper accountability. And verse 9 is not contempt for horses and mules; it longs for a trust that comes near willingly rather than one that has to be led by the bridle.',
        'Le corps qui dépérit aux versets 3 et 4 est le témoignage de ce psalmiste, non une règle selon laquelle chaque maladie cacherait un péché non confessé (Jean 9.1-3). La confession n’est pas non plus un paiement : le pardon du verset 5 est l’acte de Dieu, et davantage de détresse n’achète pas davantage de miséricorde. Le pardon laisse aussi place à la responsabilité : réparer le tort, dire la vérité aux personnes touchées, accepter de rendre des comptes dans un cadre approprié. Et le verset 9 ne méprise pas le cheval ou le mulet ; il appelle une confiance qui s’approche d’elle-même plutôt qu’une obéissance qu’il faut tirer par la bride.',
      ),
      questions: [
        L('Observation: find the three words for sin and the three pictures of forgiveness in verses 1–2. Where do they reappear, and what has changed?', 'Observation : trouve les trois mots pour la faute et les trois images du pardon aux versets 1 et 2. Où réapparaissent-ils, et qu’est-ce qui a changé ?'),
        L('Meaning: read Romans 4:1-8. Why does Paul set David’s confession beside Abraham’s faith? What does it teach about how God counts righteousness?', 'Sens : lis Romains 4.1-8. Pourquoi Paul place-t-il la confession de David à côté de la foi d’Abraham ? Qu’est-ce que cela enseigne sur la manière dont Dieu compte la justice ?'),
        L('Prayer: is there something you have kept silent about before God? Name it plainly, without excusing or punishing yourself, and thank Him that forgiveness is His to give.', 'Prière : y a-t-il quelque chose que tu as passé sous silence devant Dieu ? Nomme-le simplement, sans t’excuser ni te punir, et remercie-le de ce que le pardon vient de lui.'),
      ],
      synthesis: L(
        'Draw two columns headed “covered by me” and “covered by God”. In the first, note briefly what you have tried to hide; in the second, write verses 1–2 in your own words. If someone else was harmed, note one responsible step — an apology, a repayment, a conversation with a pastor — that you could take this week, and consider whether confessing to a mature believer would help (James 5:16).',
        'Trace deux colonnes intitulées « couvert par moi » et « couvert par Dieu ». Dans la première, note brièvement ce que tu as essayé de cacher ; dans la seconde, écris les versets 1 et 2 avec tes mots. Si quelqu’un d’autre a été blessé, note une démarche responsable — des excuses, une réparation, un entretien avec un pasteur — que tu pourrais accomplir cette semaine, et demande-toi s’il serait bon de te confier à un croyant mûr (Jacques 5.16).',
      ),
      prayer: L(
        'Lord, while I kept silent, my strength dried up. Now I name my sin and stop covering it, and You forgive the guilt I could not carry. Be my hiding place, surround me with Your steadfast love, and teach me to come near You willingly.',
        'Seigneur, tant que je me taisais, mes forces se desséchaient. Maintenant je nomme mon péché et je cesse de le couvrir, et tu pardonnes la faute que je ne pouvais pas porter. Sois mon abri, entoure-moi de ton amour fidèle, et apprends-moi à m’approcher de toi de bon cœur.',
      ),
    },
    resourceTopics: ['psalms', 'repentance', 'forgiveness'],
  },
  {
    movement: 'mercy',
    theme: { en: 'Guilt, pain and the need for help', fr: 'Culpabilité, douleur et besoin d’aide', es: 'Culpa, dolor y necesidad de ayuda', pt: 'Culpa, dor e necessidade de ajuda', de: 'Schuld, Schmerz und die Bitte um Hilfe', ru: 'Вина, боль и нужда в помощи', zh: '罪疚、痛苦与求助', ja: '罪責、痛み、助けの必要', ko: '죄책감과 고통 속의 도움', ar: 'الذنب والألم والحاجة إلى العون', fa: 'تقصیر، درد و نیاز به کمک', hi: 'दोष, पीड़ा और सहायता की ज़रूरत', id: 'Rasa bersalah, sakit dan pertolongan', sw: 'Hatia, maumivu na hitaji la msaada', tl: 'Sala, sakit at pangangailangan ng tulong', am: 'ጥፋት፣ ሕመምና የእርዳታ ፍላጎት' },
    ref: 'Psalm 38',
    related: ['John 9:1-7', 'Psalm 6', 'Luke 23:44-49'],
    reflection: L(
      'Psalm 38 is the heaviest of the penitential psalms. The psalmist links his illness to his own folly: his wounds fester, his back burns, his heart pounds, the light has gone from his eyes. Yet guilt is only one thread. Friends and neighbours keep their distance (verse 11), enemies set traps and repay good with evil (19–20), and he answers them like someone who can neither hear nor speak. He does not have to choose between confessing his sin and asking for protection; both are true at once. And the psalm ends not with relief but with a plea that God would not stay far away and would hurry to help.',
      'Le Psaume 38 est le plus lourd des psaumes pénitentiels. Le psalmiste relie sa maladie à sa propre folie : ses plaies s’infectent, ses reins brûlent, son cœur palpite, la lumière de ses yeux s’en est allée. Pourtant la culpabilité n’est qu’un fil parmi d’autres. Amis et proches se tiennent à distance (verset 11), des ennemis tendent des pièges et rendent le mal pour le bien (19-20), et lui leur répond comme quelqu’un qui ne peut ni entendre ni parler. Il n’a pas à choisir entre confesser son péché et demander protection : les deux sont vrais en même temps. Et le psaume ne s’achève pas sur un soulagement, mais sur la supplication que Dieu ne reste pas loin et se hâte de le secourir.',
    ),
    study: {
      context: L(
        'Title: a psalm of David, “to bring to remembrance” (the same note heads Psalm 70). It may link the psalm with the memorial portion of an offering (Leviticus 2:2) or simply ask God to remember; the title is ancient and debated. Its opening line almost repeats Psalm 6:1. It has 22 verses, the number of letters in the Hebrew alphabet, though it is not an acrostic. Verse 9 is the hinge: all his longing lies open before the Lord, and his sighing is not hidden; verse 15 waits for God to answer. Many readers hear verse 11 in Luke 23:49, where those who knew Jesus stand at a distance from the cross, and verses 13–14 in His silence before His accusers (Mark 14:61).',
        'Titre : psaume de David, « pour faire souvenir » (la même mention ouvre le Psaume 70). Elle rattache peut-être le psaume à la part d’offrande appelée « mémorial » (Lévitique 2.2), ou demande simplement à Dieu de se souvenir ; ce titre est ancien et discuté. La première ligne reprend presque mot pour mot le Psaume 6.1. Le psaume compte 22 versets, le nombre des lettres de l’alphabet hébreu, sans être un acrostiche. Le verset 9 sert de charnière : tout son désir est à découvert devant le Seigneur, et ses soupirs ne lui sont pas cachés ; le verset 15 attend la réponse de Dieu. Beaucoup entendent le verset 11 en Luc 23.49, où ceux qui connaissaient Jésus se tiennent à distance de la croix, et les versets 13 et 14 dans son silence devant ses accusateurs (Marc 14.61).',
      ),
      tension: L(
        'The psalmist connects his own illness with his own sin; that is his confession, not a diagnosis you may impose on anyone else. Scripture elsewhere refuses the formula that suffering proves sin (John 9:1-3; Luke 13:1-5), and the church must not copy the neighbours of verse 11 by keeping its distance from the sick. His silence before enemies is restraint, not a command to hide abuse or to stay near danger. And confessing your faults never means accepting blame for someone else’s violence: a guilty person can still be wronged.',
        'Le psalmiste relie sa propre maladie à son propre péché : c’est sa confession, non un diagnostic que tu pourrais imposer à quelqu’un d’autre. Ailleurs, l’Écriture refuse la formule selon laquelle la souffrance prouverait le péché (Jean 9.1-3 ; Luc 13.1-5), et l’Église ne doit pas imiter les proches du verset 11 en se tenant loin des malades. Son silence devant ses ennemis est de la retenue, non un ordre de cacher des abus ou de rester près du danger. Et confesser tes fautes ne signifie jamais porter la responsabilité de la violence d’un autre : une personne coupable peut aussi subir l’injustice.',
      ),
      questions: [
        L('Observation: sort the psalm into three strands — what the psalmist confesses (3–5, 18), what his body suffers (5–10) and what others do to him (11–12, 19–20). Which strand takes up the most space?', 'Observation : répartis le psaume en trois fils — ce que le psalmiste confesse (3-5, 18), ce que son corps endure (5-10) et ce que les autres lui font (11-12, 19-20). Quel fil prend le plus de place ?'),
        L('Meaning: verse 9 says nothing in him is hidden from God, and verse 15 that God will answer. What changes in a prayer spoken to Someone who already sees everything?', 'Sens : le verset 9 affirme que rien en lui n’est caché à Dieu, et le verset 15 que Dieu répondra. Qu’est-ce qui change dans une prière adressée à quelqu’un qui voit déjà tout ?'),
        L('Prayer: pray the last two verses for yourself or for someone who is ill and alone. Ask for forgiveness where it is needed, and for protection and care where harm is being done — without confusing the two.', 'Prière : prie les deux derniers versets pour toi ou pour une personne malade et isolée. Demande le pardon là où il est nécessaire, et la protection et les soins là où quelqu’un subit un tort — sans confondre les deux.'),
      ],
      synthesis: L(
        'Draw two columns: “responsibility I can acknowledge” and “harm or pain I need help with”. Leave either blank if that is honest; do not invent guilt to explain pain. Then think of someone who, like the psalmist in verse 11, is being avoided because of illness or shame, and note one way to come near them this week.',
        'Trace deux colonnes : « responsabilité que je peux reconnaître » et « tort subi ou douleur pour lesquels j’ai besoin d’aide ». Laisse l’une ou l’autre vide si c’est plus honnête ; n’invente pas une faute pour expliquer la douleur. Puis pense à une personne que l’on évite, comme le psalmiste au verset 11, à cause d’une maladie ou d’une honte, et note une façon de t’approcher d’elle cette semaine.',
      ),
      prayer: L(
        'Lord, all my longing lies open before You, and my sighing is not hidden from You. Where I have sinned, I confess it; where others wrong me, I wait for You to answer. Do not forsake me, my God; do not stay far away. Come quickly to help me, Lord, my salvation.',
        'Seigneur, tout mon désir est devant toi, et mes soupirs ne te sont pas cachés. Là où j’ai péché, je le confesse ; là où l’on me fait du tort, j’attends que tu répondes. Ne m’abandonne pas, mon Dieu ; ne reste pas loin de moi. Viens vite à mon secours, Seigneur, mon salut.',
      ),
    },
    safetyNote: crisisNote('For persistent pain or crushing guilt, speak with a doctor or qualified counsellor. If someone is harming you, seek independent safeguarding help; prayer does not require remaining in danger.', 'Si la douleur ou une culpabilité écrasante persistent, parle à un médecin ou à un professionnel qualifié. Si quelqu’un te fait du mal, cherche une aide indépendante pour ta protection ; prier n’exige pas de rester en danger.'),
    resourceTopics: ['psalms', 'repentance', 'suffering', 'lament'],
  },
  {
    movement: 'mercy',
    theme: { en: 'Mercy that makes a new beginning', fr: 'La miséricorde ouvre un recommencement', es: 'Misericordia para un nuevo comienzo', pt: 'Misericórdia para um novo começo', de: 'Erbarmen für einen neuen Anfang', ru: 'Милость для нового начала', zh: '带来新开始的怜悯', ja: '新しい始まりを生むあわれみ', ko: '새로운 시작을 여는 긍휼', ar: 'رحمة تفتح بداية جديدة', fa: 'رحمتی برای آغازی نو', hi: 'नई शुरुआत देने वाली दया', id: 'Belas kasihan untuk awal yang baru', sw: 'Rehema zinazoleta mwanzo mpya', tl: 'Habag na nagbubukas ng bagong simula', am: 'አዲስ ጅማሬ የሚሰጥ ምሕረት' },
    ref: 'Psalm 51',
    related: ['2 Samuel 12:1-13', 'Psalm 32'],
    reflection: L(
      'Psalm 51 begins where confession has to begin: not with excuses but with God’s character — His grace, His steadfast love, His great compassion (verse 1). Then come three verbs for what only God can do: blot out, wash thoroughly, make clean. The prayer also asks God to create a pure heart, with the verb that in the Old Testament only ever has God as its subject (Genesis 1:1), as if repentance needed a new creation. Then it turns outward, to teaching and song. Its title ties it to Nathan’s confrontation over Bathsheba and Uriah, so this repentance must face the people harmed.',
      'Le Psaume 51 commence là où toute confession doit commencer : non par des excuses, mais par le caractère de Dieu — sa grâce, son amour fidèle, sa grande compassion (verset 1). Viennent ensuite trois verbes pour ce que Dieu seul peut faire : effacer, laver à fond, purifier. La prière demande aussi à Dieu de créer un cœur pur, avec le verbe qui, dans l’Ancien Testament, n’a jamais que Dieu pour sujet (Genèse 1.1), comme si la repentance avait besoin d’une nouvelle création. Puis elle se tourne vers les autres, pour enseigner et chanter. Son titre la relie à la confrontation de Nathan au sujet de Bath-Chéba et d’Urie : cette repentance doit donc regarder les personnes blessées.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, a psalm of David, when the prophet Nathan came to him after David had gone in to Bathsheba (2 Samuel 11–12); one Hebrew verb describes both comings. The title is ancient and debated, but it is the setting the Psalter gives. This fourth penitential psalm shares Psalm 32’s three words for sin. The movement runs: appeal to mercy (1–2), confession (3–6), cleansing and new creation (7–12), witness and worship (13–17), and a prayer for Jerusalem (18–19), perhaps added after the exile. Hyssop (verse 7) was used in purification rites (Leviticus 14:4-7; Numbers 19:18). Paul quotes verse 4 in Romans 3:4: God is in the right when He judges. The phrase “Holy Spirit” (verse 11) appears in the Old Testament only here and in Isaiah 63:10-11.',
        'Titre : au chef de chœur, psaume de David, lorsque le prophète Nathan vint à lui après que David fut allé vers Bath-Chéba (2 Samuel 11-12) ; un même verbe hébreu décrit les deux venues. Ce titre ancien est discuté, mais c’est le cadre que le psautier donne. Ce quatrième psaume pénitentiel partage avec le Psaume 32 les trois mots pour le péché. Le mouvement : appel à la grâce (1-2), confession (3-6), purification et nouvelle création (7-12), témoignage et culte (13-17), puis une prière pour Jérusalem (18-19), peut-être ajoutée après l’exil. L’hysope (verset 7) servait aux rites de purification (Lévitique 14.4-7 ; Nombres 19.18). Paul cite le verset 4 en Romains 3.4 : Dieu est dans son droit quand il juge. L’expression « Esprit saint » (verset 11) n’apparaît dans l’Ancien Testament qu’ici et en Ésaïe 63.10-11.',
      ),
      tension: L(
        'The confession that David sinned against God alone (verse 4) does not deny the injury done to people: his sin cost Uriah his life — verse 14 asks for deliverance from bloodguilt — and Bathsheba, summoned by a king, had little power to refuse. Forgiveness did not remove every consequence. Verse 5 traces sin back to birth; it speaks of sin’s depth, not of conception or sex as sinful. The plea not to lose the Holy Spirit (verse 11) must not become a threat that God abandons believers after every failure. Christians differ over how it relates to new-covenant assurance (John 14:16); this plan does not settle that debate.',
        'La confession d’avoir péché contre Dieu seul (verset 4) ne nie pas le tort fait aux personnes : le péché de David a coûté la vie à Urie — le verset 14 demande d’être délivré du sang versé — et Bath-Chéba, convoquée par un roi, avait peu de pouvoir de refuser. Le pardon n’a pas effacé toutes les conséquences. Le verset 5 fait remonter le péché jusqu’à la naissance ; il dit la profondeur du péché, non que la conception ou la sexualité seraient coupables. La demande de ne pas perdre le Saint-Esprit (verset 11) ne doit pas devenir une menace selon laquelle Dieu abandonnerait les croyants après chaque faute. Les chrétiens diffèrent sur son rapport à l’assurance de la nouvelle alliance (Jean 14.16) ; ce parcours ne tranche pas ce débat.',
      ),
      questions: [
        L('Observation: list what David asks God to do in verses 1–12. Which requests concern forgiveness, and which a changed heart and renewed joy?', 'Observation : relève ce que David demande à Dieu aux versets 1 à 12. Quelles demandes concernent le pardon, et lesquelles un cœur transformé et une joie retrouvée ?'),
        L('Meaning: read 2 Samuel 12:1-13. How does Nathan’s story keep this prayer tied to the people David harmed? What does verse 14 add?', 'Sens : lis 2 Samuel 12.1-13. Comment le récit de Nathan garde-t-il cette prière liée aux personnes que David a blessées ? Qu’ajoute le verset 14 ?'),
        L('Prayer: bring God a heart that has stopped defending itself (verse 17) — not self-hatred, but honesty. Ask Him to create in you what you cannot produce, and to show you what repentance requires in action.', 'Prière : apporte à Dieu un cœur qui a cessé de se défendre (verset 17) — non la haine de soi, mais la vérité. Demande-lui de créer en toi ce que tu ne peux produire, et de te montrer ce que la repentance demande dans les actes.'),
      ],
      synthesis: L(
        'Write a prayer in three parts, following the psalm: an honest confession that names what you did and whom it affected; a request for a new heart and restored joy; and one concrete act of repair or accountability. Do not use it to demand anyone’s trust or forgiveness — those are theirs to give.',
        'Écris une prière en trois parties, selon le psaume : une confession honnête qui nomme ce que tu as fait et qui cela a touché ; une demande de cœur nouveau et de joie retrouvée ; et un acte concret de réparation ou de redevabilité. Ne t’en sers pas pour exiger la confiance ou le pardon de quiconque : c’est à eux de les donner.',
      ),
      prayer: L(
        'God of steadfast love and great compassion, be merciful to me. Wash me through and through and make me clean. Create a pure heart in me, steady my spirit and keep me near Your presence. Give me back the joy of being saved, so that my life and my lips may tell others of Your mercy.',
        'Dieu d’amour fidèle et de grande compassion, fais-moi grâce. Lave-moi entièrement et rends-moi pur. Crée en moi un cœur pur, affermis mon esprit et garde-moi près de ta présence. Rends-moi la joie d’être sauvé, afin que ma vie et mes lèvres racontent aux autres ta miséricorde.',
      ),
    },
    safetyNote: L('An apology or a claim of repentance does not oblige a harmed person to restore contact, trust or a leader’s role. Seek independent safeguarding support when abuse is involved.', 'Des excuses ou une affirmation de repentance n’obligent pas une personne blessée à rétablir le contact, la confiance ou les fonctions d’un responsable. En cas d’abus, cherche un accompagnement indépendant pour ta protection.'),
    resourceTopics: ['psalms', 'repentance', 'forgiveness'],
  },
  {
    movement: 'mercy',
    theme: { en: 'Remembering compassion', fr: 'Se souvenir de la compassion', es: 'Recordar la compasión', pt: 'Lembrar a compaixão', de: 'Sich an Erbarmen erinnern', ru: 'Помнить о сострадании', zh: '记念慈爱', ja: 'あわれみを思い起こす', ko: '긍휼을 기억하기', ar: 'تذكّر الرأفة', fa: 'به یاد آوردن شفقت', hi: 'करुणा को याद करना', id: 'Mengingat belas kasihan', sw: 'Kukumbuka huruma', tl: 'Pag-alala sa habag', am: 'ርኅራኄን ማስታወስ' },
    ref: 'Psalm 103',
    related: ['Psalm 130', 'Exodus 34:6-7'],
    reflection: L(
      'Psalm 103 begins with the psalmist talking to himself: he tells his own soul to bless the Lord and not to forget a single one of His benefits. Then he counts them, from forgiveness to strength renewed like an eagle’s. But the heart of the psalm (verses 8–14) is less what God gives than who He is: patient, rich in faithful love, not treating us as our sins deserve, carrying our wrongs as far away as sunrise is from sunset, tender toward His children as a father is, because He remembers that we are dust. His mercy meets both our sin and our frailty.',
      'Le Psaume 103 commence par un psalmiste qui se parle à lui-même : il dit à son âme de bénir le Seigneur et de n’oublier aucun de ses bienfaits. Puis il les compte, du pardon jusqu’aux forces renouvelées comme celles de l’aigle. Mais le cœur du psaume (versets 8 à 14) tient moins à ce que Dieu donne qu’à ce qu’il est : patient, riche en amour fidèle, ne nous traitant pas selon nos péchés, emportant nos fautes aussi loin que le levant l’est du couchant, plein de tendresse pour ses enfants comme un père, parce qu’il se souvient que nous sommes poussière. Sa miséricorde rejoint à la fois notre péché et notre fragilité.',
    ),
    study: {
      context: L(
        'Title: of David. Psalm 103 is a hymn of thanksgiving rather than a penitential psalm, and it opens and closes with the same summons to the soul (1, 22). Like Psalm 38 it has 22 verses, the number of letters in the Hebrew alphabet, without being an acrostic. The movement widens: my soul and its benefits (1–5), Israel’s story with God (6–18), then all creation and the angels (19–22). Verse 8 echoes God’s self-description to Moses in Exodus 34:6-7; verse 17 even turns the punished generations of Exodus 34:7 into generations who receive His righteousness. The word for compassion in verse 13 is related to the Hebrew for womb: a father’s love described with a mother’s word. Mary’s song echoes verse 17 (Luke 1:50).',
        'Titre : de David. Le Psaume 103 est un hymne d’action de grâces plutôt qu’un psaume pénitentiel, et il s’ouvre et se ferme par le même appel à l’âme (1, 22). Comme le Psaume 38, il compte 22 versets, le nombre des lettres de l’alphabet hébreu, sans être un acrostiche. Le mouvement s’élargit : mon âme et ses bienfaits (1-5), l’histoire d’Israël avec Dieu (6-18), puis toute la création et les anges (19-22). Le verset 8 reprend la manière dont Dieu s’est présenté à Moïse en Exode 34.6-7 ; le verset 17 transforme même les générations punies d’Exode 34.7 en générations qui reçoivent sa justice. Le mot traduit par « compassion » au verset 13 est apparenté au mot hébreu pour le sein maternel : l’amour d’un père dit avec un mot de mère. Le cantique de Marie fait écho au verset 17 (Luc 1.50).',
      ),
      tension: L(
        'Verse 3 praises God who heals all diseases, yet the same psalm says that we flourish like grass and are gone (15–16). Read together, they rule out any guarantee that every illness ends now: the psalm praises the Healer while admitting mortality, and ongoing illness does not show a failure of faith. The picture of a compassionate father reveals God’s care; it does not excuse a human parent’s harm, and those wounded by a father may find verse 13 hard — God is the father earthly fathers were meant to resemble, not a copy of them.',
        'Le verset 3 loue le Dieu qui guérit toutes les maladies, et pourtant le même psaume dit que nous fleurissons comme l’herbe, puis disparaissons (15-16). Lus ensemble, ces versets excluent toute garantie que chaque maladie cesse maintenant : le psaume loue celui qui guérit tout en reconnaissant notre mortalité, et une maladie qui dure ne prouve pas un manque de foi. L’image du père compatissant révèle la sollicitude de Dieu ; elle n’excuse pas le mal causé par un parent humain, et ceux qu’un père a blessés peuvent trouver le verset 13 difficile — Dieu est le père auquel les pères terrestres auraient dû ressembler, non leur copie.',
      ),
      questions: [
        L('Observation: count the benefits in verses 2–5, then trace the widening circle — my soul, Israel, all creation, the angels. Where does the psalm begin and end?', 'Observation : compte les bienfaits des versets 2 à 5, puis suis le cercle qui s’élargit — mon âme, Israël, toute la création, les anges. Où le psaume commence-t-il et où finit-il ?'),
        L('Meaning: read Exodus 34:6-7 beside verses 8–18. What does the psalm keep, and what does it leave out or transform?', 'Sens : lis Exode 34.6-7 à côté des versets 8 à 18. Qu’est-ce que le psaume garde, et qu’est-ce qu’il omet ou transforme ?'),
        L('Prayer: tell your own soul what not to forget. Thank God for specific mercies, and bring Him honestly one need that is still unmet.', 'Prière : dis à ton âme ce qu’elle ne doit pas oublier. Remercie Dieu pour des grâces précises, et apporte-lui honnêtement un besoin qui n’est pas encore comblé.'),
      ],
      synthesis: L(
        'Write your own verses 2–5: five benefits of God you have received, each as specific as you can make it (a date, a name, a place). Beside them, choose one image of compassion from verses 11–13 and explain it in a sentence. Then name one need for which you are still praying, so that your thanksgiving stays honest.',
        'Écris tes propres versets 2 à 5 : cinq bienfaits de Dieu que tu as reçus, chacun aussi précis que possible (une date, un nom, un lieu). À côté, choisis une image de compassion des versets 11 à 13 et explique-la en une phrase. Puis nomme un besoin pour lequel tu pries encore, afin que ton action de grâces reste honnête.',
      ),
      prayer: L(
        'My soul, bless the Lord, and do not forget His kindness. Father, You forgive, You heal, You redeem, You crown me with love I did not earn. You know how I am made; You remember that I am dust. Your love outlasts the grass and the wind. With the angels and all Your works, I bless You.',
        'Mon âme, bénis le Seigneur, et n’oublie aucune de ses bontés. Père, tu pardonnes, tu guéris, tu rachètes, tu me couronnes d’un amour que je n’ai pas mérité. Tu sais de quoi je suis fait ; tu te souviens que je suis poussière. Ton amour dure plus que l’herbe et le vent. Avec les anges et toutes tes œuvres, je te bénis.',
      ),
    },
    safetyNote: L('Continue appropriate medical care while praying for healing. Ongoing illness does not show a failure of faith.', 'Poursuis les soins médicaux appropriés tout en priant pour la guérison. Une maladie qui dure ne prouve pas un manque de foi.'),
    resourceTopics: ['psalms', 'forgiveness', 'worship'],
  },
  {
    movement: 'mercy',
    theme: { en: 'Forgiveness and patient hope', fr: 'Le pardon et l’espérance patiente', es: 'Perdón y esperanza paciente', pt: 'Perdão e esperança paciente', de: 'Vergebung und geduldige Hoffnung', ru: 'Прощение и терпеливая надежда', zh: '赦免与耐心的盼望', ja: '赦しと待ち望む希望', ko: '용서와 인내의 소망', ar: 'الغفران والرجاء الصابر', fa: 'بخشش و امید شکیبا', hi: 'क्षमा और धैर्य भरी आशा', id: 'Pengampunan dan harapan yang sabar', sw: 'Msamaha na tumaini lenye subira', tl: 'Kapatawaran at matiyagang pag-asa', am: 'ይቅርታና ታጋሽ ተስፋ' },
    ref: 'Psalm 130',
    related: ['Psalm 25', 'Psalm 131', 'Matthew 1:18-21'],
    reflection: L(
      'Psalm 130 starts in the depths — the word used elsewhere for deep waters (Psalm 69:2) — and climbs, line by line, toward morning. Verse 3 asks the question every penitent eventually faces: if God kept a record of every wrong, who could stand? Verse 4 answers it: with Him there is forgiveness, and forgiveness produces not carelessness but reverence. Then the psalmist waits, repeating himself like a watchman on the wall who knows morning will come but cannot hurry it. Finally he turns from his own soul to Israel: the hope learned in the depths belongs to the whole people.',
      'Le Psaume 130 part des profondeurs — le mot qui désigne ailleurs les eaux profondes (Psaume 69.2) — et remonte, ligne après ligne, vers le matin. Le verset 3 pose la question que tout pénitent finit par affronter : si Dieu tenait le compte de chaque faute, qui pourrait subsister ? Le verset 4 y répond : auprès de lui se trouve le pardon, et le pardon ne produit pas l’insouciance, mais la crainte respectueuse. Puis le psalmiste attend, en se répétant comme un veilleur sur la muraille qui sait que le matin viendra sans pouvoir le hâter. Enfin il se tourne de sa propre âme vers Israël : l’espérance apprise dans les profondeurs appartient à tout le peuple.',
    ),
    study: {
      context: L(
        'Title: a song of ascents, the eleventh of the fifteen (Psalms 120–134), which were probably pilgrim songs. It is the sixth of the seven penitential psalms, known by its Latin opening, De profundis. Its eight verses move in four pairs: cry (1–2), forgiveness (3–4), waiting (5–6), hope for Israel (7–8). A wordplay binds the middle: the verb for keeping a record of sins in verse 3 is the root of “watchmen” in verse 6 — God does not keep watch over our sins, so we keep watch for Him. Verse 8 resounds in the angel’s words about Jesus saving His people from their sins (Matthew 1:21). Luther called Psalms 32, 51, 130 and 143 the “Pauline psalms” and turned this one into a hymn; John Wesley heard it sung on the day his heart was “strangely warmed” (24 May 1738).',
        'Titre : cantique des montées, le onzième des quinze (Psaumes 120 à 134) sans doute chantés par les pèlerins qui montaient à Jérusalem. C’est le sixième des sept psaumes pénitentiels, connu par ses premiers mots latins, De profundis. Ses huit versets avancent par paires : le cri (1-2), le pardon (3-4), l’attente (5-6), l’espérance pour Israël (7-8). Un jeu de mots relie le centre : le verbe qui désigne le fait de tenir le compte des fautes au verset 3 est la racine du mot « veilleurs » au verset 6 — Dieu ne monte pas la garde sur nos péchés, alors nous montons la garde en l’attendant. Le verset 8 résonne dans la parole de l’ange sur Jésus qui sauvera son peuple de ses péchés (Matthieu 1.21). Luther appelait les Psaumes 32, 51, 130 et 143 les « psaumes pauliniens » et fit de celui-ci un cantique ; John Wesley l’entendit chanter le jour où il sentit son cœur « étrangement réchauffé » (24 mai 1738).',
      ),
      tension: L(
        'Waiting is not a way of earning forgiveness: in the psalm, forgiveness (verse 4) comes before the waiting (5–6), not after it. The watchman is sure of the morning but has no clock for it, so this psalm does not predict when grief, illness or hard consequences will lift. The reverence of verse 4 is not terror; it is the awe of someone forgiven when he could not stand. And the depths are no proof that God has gone: the psalmist prays from there, and puts his hope in God’s word (verse 5).',
        'Attendre n’est pas une façon de mériter le pardon : dans le psaume, le pardon (verset 4) vient avant l’attente (5-6), non après. Le veilleur est sûr du matin mais n’en connaît pas l’heure ; ce psaume ne prédit donc pas quand le deuil, la maladie ou des conséquences difficiles prendront fin. La crainte du verset 4 n’est pas de la terreur ; c’est le respect émerveillé de quelqu’un qui a été pardonné alors qu’il ne pouvait pas subsister. Et les profondeurs ne prouvent pas que Dieu est parti : le psalmiste prie de là, et il met son espérance dans la parole de Dieu (verset 5).',
      ),
      questions: [
        L('Observation: follow the four pairs of verses. Where does the psalmist stand at the start, what is he looking toward at the end, and to whom does he speak in verses 7–8?', 'Observation : suis les quatre paires de versets. Où se tient le psalmiste au début, vers quoi regarde-t-il à la fin, et à qui parle-t-il aux versets 7 et 8 ?'),
        L('Meaning: why does forgiveness lead to reverence rather than carelessness (verse 4)? How does Matthew 1:21 show where the psalm’s final hope is heading?', 'Sens : pourquoi le pardon conduit-il à la crainte respectueuse plutôt qu’à l’insouciance (verset 4) ? Comment Matthieu 1.21 montre-t-il où mène l’espérance finale du psaume ?'),
        L('Prayer: pray from your own depths, then pray verses 7–8 for your church or your people, asking God to redeem them from all their sins.', 'Prière : prie depuis tes propres profondeurs, puis prie les versets 7 et 8 pour ton Église ou ton peuple, en demandant à Dieu de les racheter de tous leurs péchés.'),
      ],
      synthesis: L(
        'Week review: write one line for each psalm this week (6, 25, 32, 38, 51, 103, 130), noting what it confesses, what it asks and what it says about God’s mercy. Review question: what distinguished honest confession from self-condemnation in these seven psalms, and which of them could you pray again the next time you fall?',
        'Bilan de la semaine : écris une ligne pour chaque psaume de la semaine (6, 25, 32, 38, 51, 103, 130), en notant ce qu’il confesse, ce qu’il demande et ce qu’il dit de la miséricorde de Dieu. Question de bilan : qu’est-ce qui distinguait la confession honnête de l’autocondamnation dans ces sept psaumes, et lequel pourrais-tu prier de nouveau la prochaine fois que tu tomberas ?',
      ),
      prayer: L(
        'Lord, I call to You from the depths; listen to my voice. If You counted every wrong, no one could stand — yet forgiveness is found with You, and it teaches me to revere You. I wait for You, more than the night watch waits for dawn. Redeem Your people, and me among them, from every sin.',
        'Seigneur, je t’appelle du fond de l’abîme ; écoute ma voix. Si tu comptais chaque faute, personne ne tiendrait debout — mais le pardon se trouve auprès de toi, et il m’apprend à te craindre. Je t’attends plus que la garde de nuit n’attend l’aurore. Rachète ton peuple, et moi avec lui, de tout péché.',
      ),
    },
    resourceTopics: ['psalms', 'repentance', 'forgiveness', 'prayer'],
  },
  // ── Week 5 · Wisdom, justice and the kingdom ─────────────────────────────
  {
    movement: 'justice',
    theme: { en: 'Two ways, one delight', fr: 'Deux chemins, une seule joie', es: 'Dos caminos, un solo deleite', pt: 'Dois caminhos, um só prazer', de: 'Zwei Wege, eine Freude', ru: 'Два пути и одна радость', zh: '两条道路，一种喜乐', ja: '二つの道、一つの喜び', ko: '두 길, 하나의 즐거움', ar: 'طريقان وبهجة واحدة', fa: 'دو راه، یک شادی', hi: 'दो मार्ग, एक आनंद', id: 'Dua jalan, satu kesukaan', sw: 'Njia mbili, furaha moja', tl: 'Dalawang daan, iisang kagalakan', am: 'ሁለት መንገዶች፣ አንድ ደስታ' },
    ref: 'Psalm 1',
    related: ['Jeremiah 17:5-8', 'Joshua 1:8'],
    reflection: L(
      'The Psalter opens not with a prayer but with a portrait: a person whose delight is the Lord’s instruction, who turns it over day and night, and who grows like a tree planted by streams of water. The wicked, by contrast, are chaff that the wind drives away. After four weeks of praise, trust, lament and confession, Psalm 1 asks what kind of life all that praying is meant to grow. Its first word is “blessed” — a description of a flourishing life before it is a command.',
      'Le psautier ne s’ouvre pas sur une prière mais sur un portrait : une personne qui trouve sa joie dans l’enseignement du Seigneur, qui le médite jour et nuit, et qui grandit comme un arbre planté près de cours d’eau. Les méchants, eux, sont comme la paille que le vent emporte. Après quatre semaines de louange, de confiance, de lamentation et de confession, le Psaume 1 demande quelle vie toute cette prière est appelée à faire grandir. Son premier mot est « heureux » — la description d’une vie épanouie avant d’être un ordre.',
    ),
    study: {
      context: L(
        'Psalm 1 has no title. With Psalm 2 it forms the gateway to the whole Psalter: the first begins with “blessed” and the second ends with the same word, framing both as one entrance, and some ancient copies of Acts 13:33 even call Psalm 2 “the first psalm”. It is a wisdom psalm: it teaches rather than prays. Notice the drift in verse 1 — walking, standing, then sitting — as a life settles into the company of scoffers, and the image of the tree, which Jeremiah 17:5-8 develops for the one who trusts in the Lord.',
        'Le Psaume 1 n’a pas de titre. Avec le Psaume 2, il forme la porte d’entrée de tout le psautier : le premier commence par « heureux » et le second se termine par le même mot, ce qui encadre les deux comme une seule entrée ; certaines copies anciennes d’Actes 13.33 appellent même le Psaume 2 « le premier psaume ». C’est un psaume de sagesse : il enseigne plutôt qu’il ne prie. Observe la pente du verset 1 — marcher, s’arrêter, puis s’asseoir — quand une vie s’installe dans la compagnie des moqueurs, et l’image de l’arbre, que Jérémie 17.5-8 développe pour celui qui se confie dans le Seigneur.',
      ),
      tension: L(
        'Verse 3 says that whatever this person does prospers, but the psalm describes the direction and fruit of a life before God; it does not promise wealth or a career without setbacks. The tree bears fruit when its season comes, not on demand, and the Psalter itself answers any easy reading: Psalm 73 is the prayer of a righteous person baffled by the prosperity of the wicked. The last verse speaks of the Lord knowing the way of the righteous — a relationship, not a reward.',
        'Le verset 3 affirme que tout ce que fait cette personne réussit, mais le psaume décrit l’orientation et le fruit d’une vie devant Dieu ; il ne promet ni richesse ni carrière sans revers. L’arbre porte du fruit quand sa saison vient, pas sur commande, et le psautier lui-même corrige toute lecture facile : le Psaume 73 est la prière d’un juste déconcerté par la prospérité des méchants. Le dernier verset parle du Seigneur qui connaît la voie des justes — une relation, pas une récompense.',
      ),
      questions: [
        L('Observation: compare the two ways verse by verse. What images describe each, and where does each way end?', 'Observation : compare les deux chemins verset par verset. Quelles images décrivent chacun, et où chacun aboutit-il ?'),
        L('What should not be generalized from verse 3? Read Psalm 73:1-14 beside it and say what the two psalms teach together.', 'Qu’est-ce qu’il ne faut pas généraliser à partir du verset 3 ? Lis le Psaume 73.1-14 à côté, et dis ce que les deux psaumes enseignent ensemble.'),
        L('What would it look like for God’s word to become a delight you return to, rather than a duty you tick off? Ask Him for that.', 'À quoi ressemblerait une Parole de Dieu devenue une joie vers laquelle tu reviens, plutôt qu’un devoir que tu coches ? Demande-le-lui.'),
      ],
      synthesis: L(
        'Draw a tree and a handful of chaff. Beside the tree, write the habits and friendships that root you near God’s word; beside the chaff, whatever is blowing you about. Choose one verse from the psalms you have studied so far to meditate on each morning and evening this week.',
        'Dessine un arbre et une poignée de paille. À côté de l’arbre, note les habitudes et les amitiés qui t’enracinent près de la Parole de Dieu ; à côté de la paille, ce qui te ballotte. Choisis un verset parmi les psaumes déjà étudiés pour le méditer matin et soir cette semaine.',
      ),
      prayer: L(
        'Lord, plant me beside Your streams. Make Your instruction my delight and not only my duty, keep me from settling among those who scoff, and let my life bear fruit when its season comes — known and kept by You.',
        'Seigneur, plante-moi près de tes cours d’eau. Fais de ton enseignement ma joie et pas seulement mon devoir, garde-moi de m’installer parmi les moqueurs, et que ma vie porte du fruit quand sa saison viendra — connue et gardée par toi.',
      ),
    },
    resourceTopics: ['psalms', 'scripture-prayer', 'discipleship'],
  },
  {
    movement: 'justice',
    theme: { en: 'The nations rage; the Lord’s Anointed reigns', fr: 'Les nations s’agitent, l’Oint du Seigneur règne', es: 'Las naciones se amotinan, el Ungido reina', pt: 'As nações se enfurecem, o Ungido reina', de: 'Die Völker toben, Gottes Gesalbter regiert', ru: 'Народы мятутся, Помазанник царствует', zh: '列国喧嚷，受膏者掌权', ja: '国々は騒ぎ立ち、油注がれた王が治める', ko: '열방이 분노해도 기름 부음 받은 왕이 다스리신다', ar: 'الأمم ترتجّ والمسيح يملك', fa: 'قوم‌ها می‌شورند، مسیح خداوند سلطنت می‌کند', hi: 'राष्ट्र भड़कते हैं, प्रभु का अभिषिक्त राज्य करता है', id: 'Bangsa-bangsa rusuh, Yang Diurapi memerintah', sw: 'Mataifa yanafanya ghasia, Masihi anatawala', tl: 'Nagngangalit ang mga bansa, naghahari ang Pinahiran', am: 'አሕዛብ ይታወካሉ፣ የተቀባው ይነግሣል' },
    ref: 'Psalm 2',
    related: ['Acts 4:23-31', 'Hebrews 1:1-5', 'Mark 1:9-11'],
    reflection: L(
      'Psalm 2 unfolds like a drama in four scenes: the rulers of the earth plot to throw off the Lord’s rule; the Lord in heaven laughs and announces the king He has installed on Zion; the king reports God’s decree naming him His son; and a closing warning urges the rulers to serve the Lord with trembling. The Psalter, which opened with one person’s delight in God’s word, now widens to the politics of the whole world. Its last line turns threat into invitation: whoever takes refuge in God’s King is called blessed.',
      'Le Psaume 2 se déroule comme un drame en quatre scènes : les dirigeants de la terre complotent pour se libérer de l’autorité du Seigneur ; le Seigneur, dans les cieux, en rit et annonce le roi qu’il a établi sur Sion ; le roi rapporte le décret de Dieu qui le déclare son fils ; enfin, un avertissement presse les dirigeants de servir le Seigneur avec crainte. Le psautier, ouvert sur la joie d’une personne dans la Parole de Dieu, s’élargit maintenant à la politique du monde entier. Sa dernière ligne change la menace en invitation : celui qui trouve refuge auprès du Roi de Dieu est déclaré heureux.',
    ),
    study: {
      context: L(
        'Psalm 2 is a royal psalm, probably first used when a king descended from David was crowned; the “anointed” of verse 2 is the Hebrew word behind “Messiah”. It is among the psalms the New Testament applies most often to Jesus. The first church prays verses 1–2 under threat in Acts 4:25-28; Paul applies the decree of verse 7 to the resurrection in Acts 13:33; Hebrews 1:5 and 5:5 cite it of the Son; and the voice at Jesus’ baptism echoes it (Mark 1:11). The phrase often rendered “kiss the Son” in verse 12 is difficult in Hebrew, and translations differ.',
        'Le Psaume 2 est un psaume royal, sans doute utilisé à l’origine lors du couronnement d’un roi descendant de David ; l’« oint » du verset 2 traduit le mot hébreu qui a donné « Messie ». Il fait partie des psaumes que le Nouveau Testament applique le plus souvent à Jésus. La première Église prie les versets 1 et 2 sous la menace en Actes 4.25-28 ; Paul applique le décret du verset 7 à la résurrection en Actes 13.33 ; Hébreux 1.5 et 5.5 le citent au sujet du Fils ; et la voix entendue au baptême de Jésus en fait écho (Marc 1.11). L’expression du verset 12 souvent traduite « embrassez le Fils » est difficile en hébreu, et les traductions varient.',
      ),
      tension: L(
        'Psalm 2 is fulfilled in Jesus, whose kingdom does not advance by the sword (John 18:36). It gives no nation, party or church a mandate to rule others by force; its rod of iron belongs to God’s final judgment, not to our campaigns. Nor does it make every opponent an enemy of God. When the believers of Acts 4 prayed this psalm under threat, they asked not for revenge but for boldness to speak and for God’s hand to heal.',
        'Le Psaume 2 s’accomplit en Jésus, dont le royaume ne progresse pas par l’épée (Jean 18.36). Il ne donne à aucune nation, aucun parti ni aucune Église le mandat de dominer les autres par la force ; son sceptre de fer relève du jugement final de Dieu, non de nos campagnes. Il ne fait pas non plus de chaque adversaire un ennemi de Dieu. Quand les croyants d’Actes 4 ont prié ce psaume sous la menace, ils n’ont pas demandé vengeance, mais de l’assurance pour annoncer la Parole et la main de Dieu pour guérir.',
      ),
      questions: [
        L('Mark the four scenes (verses 1–3, 4–6, 7–9, 10–12). What does each reveal about God’s rule and about human power?', 'Repère les quatre scènes (versets 1-3, 4-6, 7-9, 10-12). Que révèle chacune sur le règne de Dieu et sur le pouvoir humain ?'),
        L('Read Acts 4:23-31. How do the first Christians use this psalm, and what do they ask for — and not ask for?', 'Lis Actes 4.23-31. Comment les premiers chrétiens se servent-ils de ce psaume, et que demandent-ils — ou ne demandent-ils pas ?'),
        L('Where does the raging of the world frighten you today? Take refuge in the King, and pray for courage and gentleness.', 'Où l’agitation du monde t’effraie-t-elle aujourd’hui ? Réfugie-toi auprès du Roi, et prie pour recevoir courage et douceur.'),
      ],
      synthesis: L(
        'Write two short columns: what the powers of the world are planning (verses 1–3) and what the Lord has decided (verses 4–9). Then, like the church in Acts 4, write a prayer for one situation of pressure or persecution you know about, asking for boldness rather than revenge.',
        'Écris deux courtes colonnes : ce que projettent les puissances du monde (versets 1-3) et ce que le Seigneur a décidé (versets 4-9). Puis, comme l’Église en Actes 4, écris une prière pour une situation de pression ou de persécution que tu connais, en demandant de l’assurance plutôt que la vengeance.',
      ),
      prayer: L(
        'Lord, the nations plot and the powerful boast, yet You have set Your King on Your holy hill. I take refuge in Jesus, Your Son. Give Your church boldness to speak and hands that heal, and teach every ruler to serve You with reverence.',
        'Seigneur, les nations complotent et les puissants se vantent, mais tu as établi ton Roi sur ta sainte montagne. Je me réfugie en Jésus, ton Fils. Donne à ton Église l’assurance pour parler et des mains qui guérissent, et apprends à tout dirigeant à te servir avec respect.',
      ),
    },
    resourceTopics: ['psalms', 'kingdom-of-god', 'gospel'],
  },
  {
    movement: 'justice',
    theme: { en: 'Who may dwell with God?', fr: 'Qui peut demeurer auprès de Dieu ?', es: '¿Quién puede habitar con Dios?', pt: 'Quem pode habitar com Deus?', de: 'Wer darf bei Gott wohnen?', ru: 'Кто может обитать у Бога?', zh: '谁能与神同住？', ja: 'だれが神のもとに住めるのか', ko: '누가 하나님과 함께 거할 수 있는가', ar: 'مَن يسكن مع الله؟', fa: 'چه کسی می‌تواند با خدا ساکن شود؟', hi: 'परमेश्वर के साथ कौन रह सकता है?', id: 'Siapa boleh diam bersama Allah?', sw: 'Ni nani atakaa pamoja na Mungu?', tl: 'Sino ang maaaring manahan kasama ng Diyos?', am: 'ከእግዚአብሔር ጋር ማን ሊኖር ይችላል?' },
    ref: 'Psalm 15',
    related: ['Psalm 24:3-6', 'Isaiah 1:10-17', 'Hebrews 10:19-25'],
    reflection: L(
      'Psalm 15 asks the question every worshipper eventually faces: who may stay in the Lord’s tent and live on His holy hill? The answer is not a ritual but a life — speaking truth from the heart, refusing to slander, keeping a promise even when it costs, lending without exploiting the poor, refusing a bribe against the innocent. Worship and justice turn out to be one subject. What happens in the sanctuary cannot be separated from what we do with our words and our money.',
      'Le Psaume 15 pose la question que tout adorateur finit par rencontrer : qui peut séjourner dans la tente du Seigneur et demeurer sur sa sainte montagne ? La réponse n’est pas un rite mais une vie : dire la vérité du fond du cœur, refuser la calomnie, tenir une promesse même coûteuse, prêter sans exploiter le pauvre, refuser un pot-de-vin contre l’innocent. Le culte et la justice se révèlent un seul et même sujet. Ce qui se passe dans le sanctuaire est inséparable de ce que nous faisons de nos paroles et de notre argent.',
    ),
    study: {
      context: L(
        'Title: a psalm of David. It is an entrance liturgy: a worshipper at the gate asks the question (verse 1), and the answer, perhaps given by a priest, describes the kind of person who belongs in God’s presence (verses 2–5). Psalm 24:3-6 and Isaiah 33:14-16 follow the same pattern. The ban on lending at interest in verse 5 applies Israel’s law about loans to a poor neighbour (Leviticus 25:35-37), where charging interest meant profiting from someone’s need.',
        'Titre : psaume de David. C’est une liturgie d’entrée : un adorateur à la porte pose la question (verset 1), et la réponse, peut-être donnée par un prêtre, décrit la personne qui a sa place en présence de Dieu (versets 2 à 5). Le Psaume 24.3-6 et Ésaïe 33.14-16 suivent le même schéma. L’interdiction du prêt à intérêt au verset 5 applique la loi d’Israël sur les prêts au prochain pauvre (Lévitique 25.35-37) : exiger un intérêt revenait à profiter de son besoin.',
      ),
      tension: L(
        'This is not a checklist for earning access to God. Israel stood before Him by His covenant grace, and Christians draw near through the blood of Jesus (Hebrews 10:19-22). But grace does not make ethics optional: the prophets refused worship that ignored the oppressed (Isaiah 1:10-17). Beware too of reading verse 4 as permission for contempt; it is about refusing to admire wrongdoing, not about despising people.',
        'Ce n’est pas une liste de conditions pour mériter l’accès à Dieu. Israël se tenait devant lui par la grâce de son alliance, et les chrétiens s’approchent par le sang de Jésus (Hébreux 10.19-22). Mais la grâce ne rend pas l’éthique facultative : les prophètes refusaient un culte qui ignorait les opprimés (Ésaïe 1.10-17). Garde-toi aussi de lire le verset 4 comme un permis de mépriser : il s’agit de refuser d’admirer le mal, non de dédaigner des personnes.',
      ),
      questions: [
        L('List every trait in verses 2–5. How many concern speech, how many money, and how many loyalty to others?', 'Relève chaque trait des versets 2 à 5. Combien concernent la parole, combien l’argent, combien la loyauté envers autrui ?'),
        L('How do Psalm 24:3-6 and Hebrews 10:19-22 answer the question of verse 1 — and how do grace and a changed life belong together?', 'Comment le Psaume 24.3-6 et Hébreux 10.19-22 répondent-ils à la question du verset 1 — et comment la grâce et une vie transformée vont-elles ensemble ?'),
        L('Which trait in this psalm searches your life most today? Confess it plainly and ask the Holy Spirit to shape you there.', 'Quel trait de ce psaume sonde le plus ta vie aujourd’hui ? Confesse-le simplement et demande au Saint-Esprit de te former sur ce point.'),
      ],
      synthesis: L(
        'Choose one trait from verses 2–5 and write a concrete way to live it this week — a truthful conversation, a promise kept at a cost, a fair payment. Note how it connects your worship on Sunday with your conduct on Monday.',
        'Choisis un trait des versets 2 à 5 et écris une façon concrète de le vivre cette semaine — une conversation vraie, une promesse tenue malgré son coût, un paiement équitable. Note comment il relie ton culte du dimanche à ta conduite du lundi.',
      ),
      prayer: L(
        'Holy Lord, I cannot climb Your hill by my own merit; Jesus has opened the way. Now make my life fit for Your presence: truthful words, kept promises, clean hands with money, and a love that refuses to profit from another’s need.',
        'Seigneur saint, je ne peux pas gravir ta montagne par mon propre mérite ; Jésus en a ouvert le chemin. Rends maintenant ma vie digne de ta présence : des paroles vraies, des promesses tenues, des mains nettes avec l’argent, et un amour qui refuse de profiter du besoin d’autrui.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'holiness', 'justice'],
  },
  {
    movement: 'justice',
    theme: { en: 'Do not fret: waiting for justice', fr: 'Ne t’irrite pas : attendre la justice', es: 'No te impacientes: esperar la justicia', pt: 'Não te indignes: esperar a justiça', de: 'Entrüste dich nicht: auf Gerechtigkeit warten', ru: 'Не ревнуй: ожидание справедливости', zh: '不要心怀不平：等候公义', ja: '苛立つな――正義を待つ', ko: '불평하지 말라: 정의를 기다림', ar: 'لا تغر: انتظار العدل', fa: 'خشمگین مشو: انتظار عدالت', hi: 'कुढ़ मत: न्याय की प्रतीक्षा', id: 'Jangan marah: menantikan keadilan', sw: 'Usikasirike: kungoja haki', tl: 'Huwag mabalisa: paghihintay sa katarungan', am: 'አትቅና፤ ፍትሕን መጠበቅ' },
    ref: 'Psalm 37',
    related: ['Matthew 5:1-12', 'Romans 12:17-21'],
    reflection: L(
      'Psalm 37 speaks to someone watching dishonest people get ahead, and the temptation it names is not only envy but a slow-burning anger that eats at the heart. Its counsel comes in short, repeated sayings: do not fret, trust the Lord and do good, commit your way to Him, be still and wait. Five times it says that those who wait for the Lord, the meek or the righteous will inherit the land. The psalm does not deny injustice; it places the outcome in God’s hands and on a longer timescale.',
      'Le Psaume 37 s’adresse à quelqu’un qui voit des gens malhonnêtes réussir, et la tentation qu’il nomme n’est pas seulement l’envie, mais une colère sourde qui ronge le cœur. Ses conseils prennent la forme de courtes maximes répétées : ne t’irrite pas, confie-toi dans le Seigneur et fais le bien, remets-lui ta route, tiens-toi en silence et attends. Cinq fois, il affirme que ceux qui espèrent dans le Seigneur, les humbles ou les justes posséderont le pays. Le psaume ne nie pas l’injustice ; il en remet l’issue entre les mains de Dieu et dans une durée plus longue.',
    ),
    study: {
      context: L(
        'Title: of David. It is an acrostic wisdom psalm: in Hebrew its stanzas begin with the successive letters of the alphabet, which is why it reads as a string of proverbs rather than a story. The speaker presents himself as an older man looking back (verse 25). Jesus takes up verse 11 in the Beatitudes (Matthew 5:5), and verse 4, about delighting in the Lord and the desires of the heart, is among the most quoted lines in the Psalter.',
        'Titre : de David. C’est un psaume de sagesse acrostiche : en hébreu, ses strophes commencent par les lettres successives de l’alphabet, ce qui explique qu’il se lise comme une suite de proverbes plutôt que comme un récit. Celui qui parle se présente comme un homme âgé qui regarde en arrière (verset 25). Jésus reprend le verset 11 dans les Béatitudes (Matthieu 5.5), et le verset 4, sur la joie trouvée dans le Seigneur et les désirs du cœur, est l’une des lignes les plus citées du psautier.',
      ),
      tension: L(
        'Verse 4 is not a blank cheque: delighting in the Lord reshapes what we desire before any desire is granted. Verse 25 is an elder’s testimony, not a statistic; Scripture honours faithful people who were destitute (Hebrews 11:37), and Psalm 73 wrestles with exactly this. And being still before the Lord does not mean keeping quiet about wrongdoing: the same psalm tells us to do good, and elsewhere the Psalter cries out for justice. Leaving vengeance to God (Romans 12:19) is not the same as refusing to report a crime.',
        'Le verset 4 n’est pas un chèque en blanc : trouver sa joie dans le Seigneur transforme nos désirs avant qu’aucun ne soit exaucé. Le verset 25 est le témoignage d’un ancien, non une statistique ; l’Écriture honore des fidèles qui ont connu le dénuement (Hébreux 11.37), et le Psaume 73 se débat précisément avec cette question. Et se tenir en silence devant le Seigneur ne signifie pas taire le mal : le même psaume demande de faire le bien, et ailleurs le psautier crie pour que justice soit faite. Laisser la vengeance à Dieu (Romains 12.19) n’est pas la même chose que refuser de signaler un crime.',
      ),
      questions: [
        L('Collect the commands of verses 1–8. What do they ask you to stop, and what do they ask you to start?', 'Rassemble les impératifs des versets 1 à 8. Que te demandent-ils d’arrêter, et que te demandent-ils de commencer ?'),
        L('What is the psalmist honestly facing as the wicked prosper? Which lines should not be turned into guarantees (look especially at verses 4 and 25)?', 'À quoi le psalmiste est-il réellement confronté quand les méchants prospèrent ? Quelles lignes ne faut-il pas transformer en garanties (regarde surtout les versets 4 et 25) ?'),
        L('Name one injustice that makes you fret. Hand it to God in prayer, and ask Him what doing good looks like while you wait.', 'Nomme une injustice qui t’irrite. Remets-la à Dieu dans la prière, et demande-lui à quoi ressemble faire le bien pendant que tu attends.'),
      ],
      synthesis: L(
        'Write that injustice in one sentence. Underneath, write three lines: what I hand over to God; what good I can still do; whether any wrong needs to be reported to a proper authority.',
        'Écris cette injustice en une phrase. En dessous, écris trois lignes : ce que je remets à Dieu ; le bien que je peux encore faire ; s’il y a un tort à signaler à une autorité compétente.',
      ),
      prayer: L(
        'Lord, when I see wrongdoers thrive, my heart burns. Teach me to trust You and keep doing good, to commit my way to You and wait without bitterness. Reshape my desires until my delight is in You, and let justice come in Your time.',
        'Seigneur, quand je vois prospérer ceux qui font le mal, mon cœur s’enflamme. Apprends-moi à me confier en toi et à continuer de faire le bien, à te remettre mon chemin et à attendre sans amertume. Transforme mes désirs jusqu’à ce que tu sois ma joie, et que la justice vienne en ton temps.',
      ),
    },
    safetyNote: L(
      'Waiting for God’s justice never means staying in danger or keeping abuse secret. If you or someone else is being harmed, contact the police, the emergency services or a safeguarding lead; reporting wrongdoing to the proper authorities is not revenge.',
      'Attendre la justice de Dieu ne signifie jamais rester en danger ni garder des abus secrets. Si toi ou quelqu’un d’autre subissez des violences, contacte la police, les services d’urgence ou un responsable de la protection ; signaler un tort aux autorités compétentes n’est pas se venger.',
    ),
    resourceTopics: ['psalms', 'justice', 'trust'],
  },
  {
    movement: 'justice',
    theme: { en: 'When the wicked seem to win', fr: 'Quand les méchants semblent gagner', es: 'Cuando los malvados parecen ganar', pt: 'Quando os ímpios parecem vencer', de: 'Wenn die Gottlosen zu siegen scheinen', ru: 'Когда нечестивые будто побеждают', zh: '当恶人似乎得胜时', ja: '悪者が勝っているように見えるとき', ko: '악인이 이기는 듯 보일 때', ar: 'حين يبدو أن الأشرار ينتصرون', fa: 'وقتی شریران پیروز به نظر می‌رسند', hi: 'जब दुष्ट जीतते दिखें', id: 'Saat orang fasik tampak menang', sw: 'Waovu wanapoonekana kushinda', tl: 'Kapag tila nananalo ang masasama', am: 'ክፉዎች ያሸነፉ ሲመስሉ' },
    ref: 'Psalm 73',
    related: ['Jeremiah 12:1-4', 'Habakkuk 3:17-19'],
    reflection: L(
      'Psalm 73 is the honest counterweight to Psalms 1 and 37. Asaph begins with the creed — God is good to the pure in heart — and then admits he nearly lost his footing: the arrogant seemed healthy, rich and untroubled, and he wondered whether keeping his heart clean had been for nothing. The turn comes in verse 17, not through an argument but when he enters God’s sanctuary. What he gains is not a more prosperous life than the wicked but God Himself: though body and heart fail, God remains his portion for ever.',
      'Le Psaume 73 est le contrepoids honnête des Psaumes 1 et 37. Asaph commence par la confession de foi — Dieu est bon pour ceux qui ont le cœur pur — puis avoue qu’il a failli perdre pied : les orgueilleux semblaient en bonne santé, riches et sans souci, et il s’est demandé s’il avait gardé son cœur pur pour rien. Le tournant vient au verset 17, non par un argument, mais quand il entre dans le sanctuaire de Dieu. Ce qu’il gagne, ce n’est pas une vie plus prospère que celle des méchants, c’est Dieu lui-même : même si le corps et le cœur défaillent, Dieu reste sa part pour toujours.',
    ),
    study: {
      context: L(
        'Title: a psalm of Asaph, a Levite musician (1 Chronicles 16:4-5) whose name heads Psalms 50 and 73–83. Psalm 73 opens Book III of the Psalter, and some scholars, Walter Brueggemann among them, see it as the Psalter’s turning point, where the simple confidence of Psalm 1 passes through crisis into deeper trust. Notice the shape: the creed (verse 1), the crisis (2–16), the turn (17) and a new confession (18–28). Verse 15 shows restraint: he did not air his doubts in a way that would wound the faith of the community.',
        'Titre : psaume d’Asaph, musicien lévite (1 Chroniques 16.4-5) dont le nom figure en tête des Psaumes 50 et 73 à 83. Le Psaume 73 ouvre le troisième livre du psautier, et certains spécialistes, dont Walter Brueggemann, y voient le pivot du psautier : la confiance simple du Psaume 1 y traverse la crise pour devenir une confiance plus profonde. Observe la forme : la confession (verset 1), la crise (2-16), le tournant (17) et une nouvelle confession (18-28). Le verset 15 montre une retenue : il n’a pas étalé ses doutes d’une manière qui aurait blessé la foi de la communauté.',
      ),
      tension: L(
        'The psalm does not promise that every wicked person will visibly fall soon, and it does not cure envy by imagining their punishment; verses 18–20 speak of their end, but the heart of the answer is verses 23–26, God holding the psalmist’s hand. Nor does it condemn his doubts: the crisis is in Scripture because God’s people need its honesty. Many read verse 24 as a hope beyond death, though interpreters differ on how much the psalmist himself saw.',
        'Le psaume ne promet pas que chaque méchant tombera bientôt de façon visible, et il ne guérit pas l’envie en imaginant leur châtiment ; les versets 18 à 20 parlent de leur fin, mais le cœur de la réponse se trouve aux versets 23 à 26 : Dieu qui tient la main du psalmiste. Il ne condamne pas non plus ses doutes : la crise figure dans l’Écriture parce que le peuple de Dieu a besoin de cette honnêteté. Beaucoup lisent le verset 24 comme une espérance au-delà de la mort, même si les interprètes divergent sur ce que le psalmiste lui-même en percevait.',
      ),
      questions: [
        L('Trace the movement: where does the psalmist stand in verses 1–3, 13–16, 17 and 23–26? What changes, and what stays the same?', 'Suis le mouvement : où en est le psalmiste aux versets 1-3, 13-16, 17 et 23-26 ? Qu’est-ce qui change, et qu’est-ce qui demeure ?'),
        L('What does this psalm reveal about God when circumstances do not favour the faithful? How does it correct a careless reading of Psalm 1?', 'Que révèle ce psaume de Dieu quand les circonstances ne favorisent pas les fidèles ? Comment corrige-t-il une lecture hâtive du Psaume 1 ?'),
        L('Whose ease or success do you secretly envy? Tell God honestly, then pray verses 25–26 in your own words.', 'De qui envies-tu en secret l’aisance ou la réussite ? Dis-le honnêtement à Dieu, puis prie les versets 25 et 26 avec tes propres mots.'),
      ],
      synthesis: L(
        'Write your own sentence modelled on verse 25: name what you want besides God, then say what you want more. Be honest, even if the second half does not yet feel true, and date it so that you can come back to it.',
        'Écris ta propre phrase sur le modèle du verset 25 : nomme ce que tu désires en dehors de Dieu, puis dis ce que tu désires davantage. Sois honnête, même si la seconde partie ne te semble pas encore vraie, et date-la pour pouvoir y revenir.',
      ),
      prayer: L(
        'God, I nearly slipped when I compared my life with others. Bring me into Your presence, where I see more truly. Hold my right hand, guide me with Your counsel, and be the strength of my heart and my portion for ever.',
        'Dieu, j’ai failli glisser en comparant ma vie à celle des autres. Conduis-moi en ta présence, là où je vois plus juste. Tiens ma main droite, guide-moi par ton conseil, et sois le rocher de mon cœur et ma part pour toujours.',
      ),
    },
    resourceTopics: ['psalms', 'justice', 'suffering', 'contentment'],
  },
  {
    movement: 'justice',
    theme: { en: 'God judges the judges', fr: 'Dieu juge les juges', es: 'Dios juzga a los jueces', pt: 'Deus julga os juízes', de: 'Gott richtet die Richter', ru: 'Бог судит судей', zh: '神审判审判者', ja: '神はさばく者をさばく', ko: '재판관들을 심판하시는 하나님', ar: 'الله يدين القضاة', fa: 'خدا داوران را داوری می‌کند', hi: 'परमेश्वर न्यायियों का न्याय करता है', id: 'Allah menghakimi para hakim', sw: 'Mungu anawahukumu waamuzi', tl: 'Hinahatulan ng Diyos ang mga hukom', am: 'እግዚአብሔር ፈራጆችን ይፈርዳል' },
    ref: 'Psalm 82',
    related: ['John 10:31-39', 'Isaiah 1:16-17', 'Proverbs 31:8-9'],
    reflection: L(
      'Psalm 82 is a courtroom scene in which the defendants are the judges. God takes His place in the assembly and charges those entrusted with authority: they have favoured the wicked instead of defending the weak, the fatherless, the afflicted and the destitute. Because they have failed, the very foundations of the earth are shaken, and those who ruled as if they were gods will die like any mortal. The psalm ends by asking God Himself to rise and judge the earth, since every nation belongs to Him. Justice for the vulnerable is not a side issue to God; it is the test of every authority.',
      'Le Psaume 82 est une scène de tribunal où les accusés sont les juges. Dieu prend place dans l’assemblée et met en cause ceux à qui l’autorité a été confiée : ils ont favorisé les méchants au lieu de défendre le faible, l’orphelin, l’affligé et l’indigent. Parce qu’ils ont failli, les fondements mêmes de la terre sont ébranlés, et ceux qui régnaient comme des dieux mourront comme n’importe quel mortel. Le psaume se termine en demandant à Dieu lui-même de se lever pour juger la terre, car toutes les nations lui appartiennent. La justice envers les vulnérables n’est pas un sujet secondaire pour Dieu ; c’est l’épreuve de toute autorité.',
    ),
    study: {
      context: L(
        'Title: a psalm of Asaph. Verse 1 places God in a “divine council”, and interpreters disagree about who the “gods” are: many see heavenly beings or spiritual powers held responsible for the nations (compare Deuteronomy 32:8-9), others human rulers and judges who carried God’s authority. Jesus quotes verse 6 in John 10:34-36, arguing from the lesser to the greater: if Scripture could call “gods” those to whom God’s word came, He is not blaspheming when He calls Himself the Son of God. Verses 3–4 gather the Old Testament’s constant concern for those who have no protector.',
        'Titre : psaume d’Asaph. Le verset 1 place Dieu au milieu d’un « conseil divin », et les interprètes ne s’accordent pas sur l’identité des « dieux » : beaucoup y voient des êtres célestes ou des puissances spirituelles tenus pour responsables des nations (voir Deutéronome 32.8-9), d’autres des dirigeants et des juges humains investis de l’autorité de Dieu. Jésus cite le verset 6 en Jean 10.34-36 dans un raisonnement du moins au plus : si l’Écriture a pu appeler « dieux » ceux à qui la parole de Dieu a été adressée, il ne blasphème pas en se disant Fils de Dieu. Les versets 3 et 4 rassemblent le souci constant de l’Ancien Testament pour ceux qui n’ont aucun protecteur.',
      ),
      tension: L(
        'Whichever reading you prefer, the psalm lets no one call themselves divine, and it does not make every official an enemy of God. Nor does it give individuals the right to punish corrupt rulers themselves: it brings the case to God and calls those with authority to act justly. For most readers the pressing question is not who the “gods” are but whom our own influence — in a family, a church, a workplace or a vote — is failing to protect.',
        'Quelle que soit la lecture retenue, le psaume ne permet à personne de se dire divin, et il ne fait pas de chaque responsable un ennemi de Dieu. Il ne donne pas non plus à chacun le droit de punir lui-même les dirigeants corrompus : il porte l’affaire devant Dieu et appelle ceux qui détiennent l’autorité à agir avec justice. Pour la plupart des lecteurs, la question pressante n’est pas de savoir qui sont les « dieux », mais qui notre propre influence — dans une famille, une Église, un travail ou un vote — ne protège pas.',
      ),
      questions: [
        L('Observation: who speaks in each part of the psalm (verses 1, 2–4, 5, 6–7, 8), and what is the charge against the judges?', 'Observation : qui parle dans chaque partie du psaume (versets 1, 2-4, 5, 6-7, 8), et de quoi les juges sont-ils accusés ?'),
        L('What does this psalm reveal about God’s priorities? Compare verses 3–4 with Isaiah 1:16-17.', 'Que révèle ce psaume des priorités de Dieu ? Compare les versets 3 et 4 avec Ésaïe 1.16-17.'),
        L('Where do you hold some authority? Ask God to show you who needs your protection there, and pray for those who judge and govern.', 'Où détiens-tu une part d’autorité ? Demande à Dieu de te montrer qui a besoin de ta protection à cet endroit, et prie pour ceux qui jugent et gouvernent.'),
      ],
      synthesis: L(
        'Write down one vulnerable person or group within your reach. Note one concrete act of defence or care you could take this week — a visit, a fair decision, a word spoken for someone who has no voice (Proverbs 31:8-9).',
        'Note une personne ou un groupe vulnérable à ta portée. Écris un acte concret de défense ou de soin que tu pourrais accomplir cette semaine — une visite, une décision équitable, une parole prononcée pour quelqu’un qui n’a pas de voix (Proverbes 31.8-9).',
      ),
      prayer: L(
        'God of justice, You stand among the powerful and You see the weak. Forgive us when we favour the strong. Make those who judge and govern fair, give me courage to speak for those who have no voice, and rise to set the whole earth right.',
        'Dieu de justice, tu te tiens au milieu des puissants et tu vois les faibles. Pardonne-nous quand nous favorisons les forts. Rends justes ceux qui jugent et gouvernent, donne-moi le courage de parler pour ceux qui n’ont pas de voix, et lève-toi pour remettre toute la terre dans le droit.',
      ),
    },
    resourceTopics: ['psalms', 'justice', 'kingdom-of-god'],
  },
  {
    movement: 'justice',
    theme: { en: 'A King who defends the poor', fr: 'Un Roi qui défend les pauvres', es: 'Un Rey que defiende a los pobres', pt: 'Um Rei que defende os pobres', de: 'Ein König, der die Armen verteidigt', ru: 'Царь, защищающий бедных', zh: '为贫穷人伸冤的君王', ja: '貧しい者を守る王', ko: '가난한 자를 변호하는 왕', ar: 'ملك يدافع عن الفقراء', fa: 'پادشاهی که از فقیران دفاع می‌کند', hi: 'दीनों की रक्षा करने वाला राजा', id: 'Raja yang membela orang miskin', sw: 'Mfalme anayewatetea maskini', tl: 'Haring nagtatanggol sa mga dukha', am: 'ድሆችን የሚከላከል ንጉሥ' },
    ref: 'Psalm 72',
    related: ['Isaiah 11:1-9', '1 Timothy 2:1-4', 'Genesis 12:1-3'],
    reflection: L(
      'Psalm 72 is a prayer for a king, and it measures his greatness by an unexpected standard. It asks for long life, wide rule and gifts from distant nations — but the reason given in verses 12–14 is that he rescues the needy who cry out, pities the weak and counts the blood of the oppressed as precious. A ruler’s glory is his care for those who have no helper. The psalm closes Book II with a doxology longing for the whole earth to be filled with God’s glory, and Christians have long recognised in it the shape of Christ’s kingdom.',
      'Le Psaume 72 est une prière pour un roi, et il mesure sa grandeur à une aune inattendue. Il demande pour lui une longue vie, un règne étendu et les présents des nations lointaines — mais la raison donnée aux versets 12 à 14, c’est qu’il délivre le pauvre qui crie, qu’il a pitié du faible et que le sang des opprimés est précieux à ses yeux. La gloire d’un souverain, c’est son soin de ceux qui n’ont personne pour les aider. Le psaume clôt le deuxième livre par une doxologie qui aspire à voir toute la terre remplie de la gloire de Dieu, et les chrétiens y reconnaissent depuis longtemps la forme du royaume du Christ.',
    ),
    study: {
      context: L(
        'Title: of Solomon, or for Solomon — the Hebrew allows both, so it may be a prayer for him or one in his tradition. It is a royal psalm like Psalm 2, and verse 17 echoes God’s promise that all nations will be blessed through Abraham (Genesis 12:3). Verses 18–19 are the doxology that closes Book II, and verse 20, noting that the prayers of David son of Jesse are ended, is an editor’s marker. The New Testament does not quote Psalm 72 directly, though the gifts of the magi (Matthew 2:11) may echo verses 10–11; its messianic reading grew in both Jewish and Christian tradition, alongside Isaiah 11.',
        'Titre : de Salomon, ou pour Salomon — l’hébreu permet les deux, si bien qu’il peut s’agir d’une prière pour lui ou d’une prière dans sa tradition. C’est un psaume royal, comme le Psaume 2, et le verset 17 fait écho à la promesse que toutes les nations seront bénies en Abraham (Genèse 12.3). Les versets 18 et 19 forment la doxologie qui clôt le deuxième livre, et le verset 20, qui annonce la fin des prières de David, fils d’Isaï, est une note d’éditeur. Le Nouveau Testament ne cite pas directement le Psaume 72, même si les présents des mages (Matthieu 2.11) peuvent faire écho aux versets 10 et 11 ; sa lecture messianique s’est développée dans les traditions juive et chrétienne, à côté d’Ésaïe 11.',
      ),
      tension: L(
        'No king of Israel fully lived up to this prayer, which is why it became a hope for the Messiah; it should not be used to crown any modern ruler or nation as God’s chosen instrument. Yet it is not only about the future: it gives a standard for praying for today’s leaders (1 Timothy 2:1-2) and for judging our own use of power. Its worldwide reign comes through righteousness and care for the poor, not through domination.',
        'Aucun roi d’Israël n’a pleinement répondu à cette prière, et c’est pourquoi elle est devenue une espérance tournée vers le Messie ; elle ne doit pas servir à couronner un dirigeant ou une nation d’aujourd’hui comme l’instrument élu de Dieu. Mais elle ne concerne pas seulement l’avenir : elle donne une règle pour prier pour les dirigeants actuels (1 Timothée 2.1-2) et pour juger notre propre usage du pouvoir. Son règne universel passe par la justice et le soin des pauvres, non par la domination.',
      ),
      questions: [
        L('List what the psalm asks for the king, and underline the reason given in verses 12–14. What does that reason reveal about God’s idea of power?', 'Relève ce que le psaume demande pour le roi, et souligne la raison donnée aux versets 12 à 14. Que révèle cette raison de la manière dont Dieu conçoit le pouvoir ?'),
        L('How does this psalm relate to the wider biblical story — to Abraham (Genesis 12:3), to Isaiah 11 and to Jesus?', 'Comment ce psaume se rattache-t-il à l’ensemble du récit biblique — à Abraham (Genèse 12.3), à Ésaïe 11 et à Jésus ?'),
        L('Pray by name for those who govern your country and your city, using the priorities of this psalm.', 'Prie en les nommant pour ceux qui gouvernent ton pays et ta ville, en suivant les priorités de ce psaume.'),
      ],
      synthesis: L(
        'Week review: in one line each, what did Psalms 1, 2, 15, 37, 73, 82 and 72 teach you about God’s justice? Review question: how has this week changed the way you pray about injustice — both the wrongs done to you and the wrongs you could help to put right?',
        'Bilan de la semaine : en une ligne pour chacun, qu’ont enseigné les Psaumes 1, 2, 15, 37, 73, 82 et 72 sur la justice de Dieu ? Question de bilan : en quoi cette semaine a-t-elle changé ta manière de prier au sujet de l’injustice — celle que tu subis, et celle que tu pourrais aider à réparer ?',
      ),
      prayer: L(
        'God of justice, give our leaders Your righteousness and a heart for the poor. Let those who cry out be heard, and let the oppressed be precious in their sight. Come, Lord Jesus, King of justice and peace, and fill the whole earth with Your glory.',
        'Dieu de justice, donne à nos dirigeants ta justice et un cœur pour les pauvres. Que ceux qui crient soient entendus, et que les opprimés soient précieux à leurs yeux. Viens, Seigneur Jésus, Roi de justice et de paix, et remplis toute la terre de ta gloire.',
      ),
    },
    resourceTopics: ['psalms', 'justice', 'kingdom-of-god', 'intercession'],
  },
  // ── Week 6 · Thanksgiving, pilgrimage and hope ───────────────────────────
  {
    movement: 'hope',
    theme: { en: 'Longing for the house of God', fr: 'Le désir de la maison de Dieu', es: 'Anhelo de la casa de Dios', pt: 'Saudade da casa de Deus', de: 'Sehnsucht nach Gottes Haus', ru: 'Тоска по дому Божьему', zh: '渴慕神的殿', ja: '神の家を慕い求める', ko: '하나님의 집을 사모함', ar: 'الشوق إلى بيت الله', fa: 'اشتیاق به خانهٔ خدا', hi: 'परमेश्वर के भवन की लालसा', id: 'Rindu akan rumah Allah', sw: 'Kuitamani nyumba ya Mungu', tl: 'Pananabik sa tahanan ng Diyos', am: 'የእግዚአብሔርን ቤት መናፈቅ' },
    ref: 'Psalm 84',
    related: ['Psalm 42', 'Hebrews 12:22-24', 'John 4:19-24'],
    reflection: L(
      'The last week begins on the road. Psalm 84 is a pilgrim’s song, full of longing for the courts of the living God — even the sparrow and the swallow, the psalmist notes with a touch of envy, have found a home near His altars. The travellers pass through the Valley of Baca, a dry place whose name may recall weeping, and as they go it becomes a place of springs. They move from strength to strength, not because the road is easy but because their strength is in God and the roads to Zion are already in their hearts.',
      'La dernière semaine commence sur la route. Le Psaume 84 est un chant de pèlerin, plein du désir des parvis du Dieu vivant — même le moineau et l’hirondelle, note le psalmiste avec une pointe d’envie, ont trouvé un nid près de ses autels. Les voyageurs traversent la vallée de Baca, un lieu aride dont le nom évoque peut-être les pleurs, et sur leur passage elle devient un lieu de sources. Ils vont de force en force, non parce que la route est facile, mais parce que leur force est en Dieu et que les chemins de Sion sont déjà dans leur cœur.',
    ),
    study: {
      context: L(
        'Title: for the choirmaster, “according to the Gittith” (as in Psalm 8), a psalm of the Sons of Korah, the Levite family whose songs also include Psalm 42, Psalms 44–49 and Psalm 88; Psalm 84 shares Psalm 42’s thirst for God’s presence. It pronounces three blessings (verses 4, 5 and 12): on those who dwell in God’s house, those whose strength is in Him, and those who trust Him. Verses 8–9 pause to pray for the king, the Lord’s anointed. The meaning of Baca is uncertain: it may name a tree that grows in dry ground, or echo the Hebrew word for weeping.',
        'Titre : au chef de chœur, « sur la guittith » (comme le Psaume 8), psaume des fils de Koré, la famille lévitique à qui l’on doit aussi le Psaume 42, les Psaumes 44 à 49 et le Psaume 88 ; le Psaume 84 partage la soif de la présence de Dieu du Psaume 42. Il prononce trois béatitudes (versets 4, 5 et 12) : sur ceux qui habitent la maison de Dieu, sur ceux dont la force est en lui et sur ceux qui se confient en lui. Les versets 8 et 9 s’arrêtent pour prier pour le roi, l’oint du Seigneur. Le sens de Baca est incertain : il peut désigner un arbre qui pousse en terrain sec, ou faire écho au mot hébreu pour les pleurs.',
      ),
      tension: L(
        'Verse 11 says the Lord withholds no good thing from those who walk uprightly; like Psalm 1, it confesses God’s goodness rather than promising that every wish will be granted — God decides what is good, and Psalm 73 has already shown how different that can look. And Christians no longer travel to one building to meet God: Jesus speaks of worship in Spirit and truth (John 4:21-24), and Hebrews 12:22-24 says believers have already come to the heavenly Zion. The longing remains, but it now draws us to God Himself and to His gathered people.',
        'Le verset 11 affirme que le Seigneur ne refuse aucun bien à ceux qui marchent dans l’intégrité ; comme le Psaume 1, il confesse la bonté de Dieu plutôt qu’il ne promet que chaque souhait sera exaucé — c’est Dieu qui décide de ce qui est bon, et le Psaume 73 a déjà montré combien cela peut paraître différent. Et les chrétiens ne se rendent plus dans un seul bâtiment pour rencontrer Dieu : Jésus parle d’un culte en esprit et en vérité (Jean 4.21-24), et Hébreux 12.22-24 affirme que les croyants se sont déjà approchés de la Sion céleste. Le désir demeure, mais il nous attire désormais vers Dieu lui-même et vers son peuple rassemblé.',
      ),
      questions: [
        L('Find the three blessings (verses 4, 5 and 12). What does each reveal about where true happiness is found?', 'Repère les trois béatitudes (versets 4, 5 et 12). Que révèle chacune sur la source du vrai bonheur ?'),
        L('What is the psalmist honestly feeling in verses 1–3, and how does the journey of verses 5–7 change the dry valley?', 'Que ressent réellement le psalmiste aux versets 1 à 3, et comment la marche des versets 5 à 7 transforme-t-elle la vallée aride ?'),
        L('Where is your own Valley of Baca at present? Pray for strength to keep walking, and for springs along the way.', 'Quelle est en ce moment ta propre vallée de Baca ? Prie pour avoir la force de continuer à marcher, et pour des sources sur le chemin.'),
      ],
      synthesis: L(
        'Note what draws you to meet God with His people, and what keeps you away. Plan one concrete step toward gathered worship this week — arriving early, joining a prayer meeting, or inviting someone to come with you.',
        'Note ce qui t’attire à rencontrer Dieu avec son peuple, et ce qui t’en éloigne. Prévois un pas concret vers le culte communautaire cette semaine — arriver en avance, rejoindre une réunion de prière, ou inviter quelqu’un à venir avec toi.',
      ),
      prayer: L(
        'Lord of hosts, my heart longs for You. On the dry stretches of the road, be my strength and let springs rise where I walk. One day near You is worth more than a thousand anywhere else; keep me on the way home to You.',
        'Seigneur des armées, mon cœur soupire après toi. Sur les tronçons arides de la route, sois ma force et fais jaillir des sources là où je marche. Un seul jour près de toi vaut mieux que mille ailleurs ; garde-moi sur le chemin qui mène à toi.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'church'],
  },
  {
    movement: 'hope',
    theme: { en: 'The redeemed tell their story', fr: 'Les rachetés racontent', es: 'Los redimidos cuentan su historia', pt: 'Os resgatados contam sua história', de: 'Die Erlösten erzählen', ru: 'Искупленные рассказывают', zh: '蒙救赎的人述说', ja: '贖われた者は語る', ko: '구속받은 자들의 이야기', ar: 'المفديّون يروون قصتهم', fa: 'بازخریدشدگان روایت می‌کنند', hi: 'छुड़ाए हुए अपनी कहानी सुनाते हैं', id: 'Orang tebusan bercerita', sw: 'Waliokombolewa wanasimulia', tl: 'Nagpapatotoo ang mga tinubos', am: 'የተዋጁት ይመሰክራሉ' },
    ref: 'Psalm 107',
    related: ['Psalm 106:47-48', 'Mark 4:35-41'],
    reflection: L(
      'Psalm 107 calls those whom the Lord has redeemed to tell their story, and then tells four of them: travellers lost in the desert, prisoners in darkness, people sick to the point of death, and sailors caught in a storm. Each scene follows the same pattern — trouble, a cry to the Lord, rescue, and a call to thank Him for His steadfast love. The repetition is the lesson: thanksgiving is testimony, telling what God has done so that others hear it. The psalm ends by inviting the wise to ponder these things.',
      'Le Psaume 107 invite ceux que le Seigneur a rachetés à raconter leur histoire, puis il en raconte quatre : des voyageurs égarés dans le désert, des prisonniers dans les ténèbres, des malades au seuil de la mort et des marins pris dans la tempête. Chaque scène suit le même schéma : la détresse, un cri vers le Seigneur, la délivrance, puis un appel à le louer pour son amour fidèle. La répétition est la leçon : l’action de grâces est un témoignage, qui raconte ce que Dieu a fait pour que d’autres l’entendent. Le psaume se termine en invitant les sages à méditer ces choses.',
    ),
    study: {
      context: L(
        'Psalm 107 opens Book V of the Psalter and answers the plea that closes Book IV: Psalm 106:47 asks God to gather His people from among the nations, and Psalm 107:2-3 speaks of the redeemed gathered from east and west, north and south. Its four scenes (verses 4–9, 10–16, 17–22, 23–32) share two refrains — they cried to the Lord in their trouble, and let them thank Him — before a closing hymn about God reversing fortunes (verses 33–42). The Gospel storm on the lake (Mark 4:35-41) echoes verses 23–30, where the Lord stills the waves.',
        'Le Psaume 107 ouvre le cinquième livre du psautier et répond à la supplication qui clôt le quatrième : le Psaume 106.47 demande à Dieu de rassembler son peuple du milieu des nations, et le Psaume 107.2-3 parle des rachetés rassemblés de l’orient et de l’occident, du nord et du sud. Ses quatre scènes (versets 4-9, 10-16, 17-22, 23-32) partagent deux refrains — dans leur détresse, ils ont crié au Seigneur, et qu’ils le louent — avant un hymne final sur Dieu qui renverse les situations (versets 33-42). La tempête apaisée des Évangiles (Marc 4.35-41) fait écho aux versets 23 à 30, où le Seigneur calme les flots.',
      ),
      tension: L(
        'The refrain is testimony, not a formula: it does not promise that every cry will end in the same kind of rescue, and the Psalter has already shown prayers that wait long (Psalm 13) or end in darkness (Psalm 88). Two scenes link the trouble to rebellion or folly, but two do not — the travellers and the sailors are simply in danger — so the psalm itself forbids reading every hardship as punishment.',
        'Le refrain est un témoignage, non une formule : il ne promet pas que chaque cri aboutira au même genre de délivrance, et le psautier nous a déjà montré des prières qui attendent longtemps (Psaume 13) ou qui s’achèvent dans les ténèbres (Psaume 88). Deux scènes relient la détresse à la révolte ou à la folie, mais deux ne le font pas — les voyageurs et les marins sont simplement en danger — si bien que le psaume lui-même interdit de lire toute épreuve comme une punition.',
      ),
      questions: [
        L('Chart the four scenes: the trouble, the cry, the rescue and the response. What stays the same, and what differs?', 'Dresse un tableau des quatre scènes : la détresse, le cri, la délivrance, la réponse. Qu’est-ce qui reste identique, et qu’est-ce qui change ?'),
        L('Which scenes link trouble to sin, and which do not? What does that teach you about reading your own hardships and other people’s?', 'Quelles scènes relient la détresse au péché, et lesquelles ne le font pas ? Qu’est-ce que cela t’apprend pour lire tes propres épreuves et celles des autres ?'),
        L('Which scene is closest to a rescue you have known? Thank God for it specifically, as the refrain invites.', 'Quelle scène ressemble le plus à une délivrance que tu as connue ? Remercie Dieu précisément pour elle, comme le refrain y invite.'),
      ],
      synthesis: L(
        'Write a short testimony in the psalm’s four beats: the trouble I was in; how I cried to the Lord; what He did, quickly or slowly; and my thanks. If you are still waiting, write the first two beats and leave space. Consider sharing a finished one with someone this week.',
        'Écris un court témoignage en quatre temps, comme le psaume : la détresse où j’étais ; comment j’ai crié au Seigneur ; ce qu’il a fait, rapidement ou lentement ; et ma reconnaissance. Si tu attends encore, écris les deux premiers temps et laisse de la place. Pense à partager un témoignage achevé avec quelqu’un cette semaine.',
      ),
      prayer: L(
        'Lord, Your steadfast love endures for ever. You hear those who cry out in the desert, in the dark, in sickness and in the storm. Thank You for the rescues I have known; be with me in the ones I still wait for, and give me words to tell of Your goodness.',
        'Seigneur, ton amour fidèle dure à toujours. Tu entends ceux qui crient dans le désert, dans les ténèbres, dans la maladie et dans la tempête. Merci pour les délivrances que j’ai connues ; sois avec moi dans celles que j’attends encore, et donne-moi des mots pour raconter ta bonté.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'prayer'],
  },
  {
    movement: 'hope',
    theme: { en: 'Love and vows after rescue', fr: 'Amour et vœux après la délivrance', es: 'Amor y votos tras la liberación', pt: 'Amor e votos após o livramento', de: 'Liebe und Gelübde nach der Rettung', ru: 'Любовь и обеты после избавления', zh: '蒙拯救后的爱与还愿', ja: '救いの後の愛と誓い', ko: '구원 이후의 사랑과 서원', ar: 'محبة ونذور بعد النجاة', fa: 'محبت و نذر پس از رهایی', hi: 'छुटकारे के बाद प्रेम और मन्नतें', id: 'Kasih dan nazar setelah diselamatkan', sw: 'Upendo na nadhiri baada ya kuokolewa', tl: 'Pag-ibig at panata matapos iligtas', am: 'ከመዳን በኋላ ፍቅርና ስእለት' },
    ref: 'Psalm 116',
    related: ['2 Corinthians 4:7-15', 'Matthew 26:26-30'],
    reflection: L(
      'Psalm 116 begins with a declaration of love that has a reason: the Lord heard. The psalmist had been caught in the cords of death, called on the Lord’s name, and was brought back to walk before Him in the land of the living. Now he asks what he can give in return, and his answer is not a payment: he receives again and worships more — lifting the cup of salvation, calling on the Lord once more, keeping his vows in front of all God’s people. Gratitude here is public, embodied and lifelong.',
      'Le Psaume 116 s’ouvre sur une déclaration d’amour qui a une raison : le Seigneur a entendu. Le psalmiste avait été pris dans les liens de la mort, il a invoqué le nom du Seigneur, et il a été ramené pour marcher devant lui sur la terre des vivants. Il se demande maintenant ce qu’il peut rendre en retour, et sa réponse n’est pas un paiement : il reçoit encore et il adore davantage — élever la coupe du salut, invoquer de nouveau le Seigneur, accomplir ses vœux devant tout le peuple de Dieu. La gratitude est ici publique, incarnée et durable.',
    ),
    study: {
      context: L(
        'The psalm has no title. It belongs to the “Egyptian Hallel” (Psalms 113–118), sung at the great festivals and especially at Passover; the hymn Jesus and His disciples sang after the Last Supper (Matthew 26:30) was probably drawn from these psalms. Paul quotes verse 10 in 2 Corinthians 4:13, following the Greek translation, to explain why he keeps speaking in the middle of affliction. The poem circles through love, the memory of danger, rescue and response, and ends in the courts of the Lord’s house in Jerusalem.',
        'Le psaume n’a pas de titre. Il appartient au « Hallel égyptien » (Psaumes 113 à 118), chanté lors des grandes fêtes et surtout à la Pâque ; le cantique que Jésus et ses disciples ont chanté après le dernier repas (Matthieu 26.30) était probablement tiré de ces psaumes. Paul cite le verset 10 en 2 Corinthiens 4.13, d’après la traduction grecque, pour expliquer pourquoi il continue de parler au milieu de l’affliction. Le poème passe par l’amour, le souvenir du danger, la délivrance et la réponse, et s’achève dans les parvis de la maison du Seigneur, à Jérusalem.',
      ),
      tension: L(
        'Verse 15, which calls the death of God’s faithful ones precious to Him, does not mean that God desires or welcomes their death; the word suggests that it is costly and weighty in His eyes, which is why He rescued this psalmist. Nor is the psalm a promise that every illness or danger ends in recovery: it is one person’s testimony, in a Psalter that also contains Psalm 88. Some of those we love were not brought back, and their death was precious to God too.',
        'Le verset 15, qui dit que la mort des fidèles a du prix aux yeux du Seigneur, ne signifie pas que Dieu désire ou accueille leur mort ; le mot suggère qu’elle lui est coûteuse et pèse lourd à ses yeux, et c’est pourquoi il a délivré ce psalmiste. Ce psaume ne promet pas non plus que chaque maladie ou chaque danger s’achèvera par un rétablissement : c’est le témoignage d’une personne, dans un psautier qui contient aussi le Psaume 88. Certains de ceux que nous aimons n’ont pas été ramenés, et leur mort aussi était précieuse aux yeux de Dieu.',
      ),
      questions: [
        L('What reasons does the psalmist give for loving the Lord, and what does he remember about the danger he was in (verses 1–9)?', 'Quelles raisons le psalmiste donne-t-il d’aimer le Seigneur, et que se rappelle-t-il du danger qu’il a traversé (versets 1-9) ?'),
        L('How does Paul use verse 10 in 2 Corinthians 4:7-15, and what does that add about a faith that keeps speaking while still afflicted?', 'Comment Paul utilise-t-il le verset 10 en 2 Corinthiens 4.7-15, et qu’est-ce que cela ajoute sur une foi qui continue de parler alors qu’elle est encore dans l’affliction ?'),
        L('What rescue in your life calls for a public thank-you? Ask the question of verse 12 honestly, and consider prayerfully what response would fit.', 'Quelle délivrance de ta vie appelle un merci public ? Pose honnêtement la question du verset 12, et considère dans la prière quelle réponse conviendrait.'),
      ],
      synthesis: L(
        'Write down a rescue you have received — from illness, danger, despair or sin — and one way to give thanks in front of others: sharing a testimony, keeping a promise made in distress, or taking communion with fresh attention to the cup of salvation.',
        'Note une délivrance que tu as reçue — d’une maladie, d’un danger, du désespoir ou du péché — et une manière de rendre grâces devant d’autres : partager un témoignage, tenir une promesse faite dans la détresse, ou prendre la cène en prêtant une attention nouvelle à la coupe du salut.',
      ),
      prayer: L(
        'Lord, I love You because You heard me. When the cords of death were around me, I called on Your name. What can I give You for all Your goodness? I lift the cup of salvation, I call on You again, and I will keep my promises before Your people.',
        'Seigneur, je t’aime parce que tu m’as entendu. Quand les liens de la mort m’entouraient, j’ai invoqué ton nom. Que te rendrai-je pour toute ta bonté ? J’élève la coupe du salut, je t’invoque encore, et je tiendrai mes promesses devant ton peuple.',
      ),
    },
    safetyNote: crisisNote(
      'This psalm remembers being caught by death and then rescued. If you are still in that place, calling out for help was the psalmist’s first step, and it can be yours.',
      'Ce psaume se souvient d’avoir été saisi par la mort, puis délivré. Si tu es encore à cet endroit, appeler à l’aide a été le premier pas du psalmiste, et cela peut être le tien.',
    ),
    resourceTopics: ['psalms', 'worship', 'suffering'],
  },
  {
    movement: 'hope',
    theme: { en: 'The rejected stone, the cornerstone', fr: 'La pierre rejetée devenue angulaire', es: 'La piedra desechada, piedra angular', pt: 'A pedra rejeitada, pedra angular', de: 'Der verworfene Stein wird zum Eckstein', ru: 'Отвергнутый камень стал краеугольным', zh: '被弃的石头成了房角石', ja: '捨てられた石が要の石に', ko: '버린 돌이 머릿돌이 되다', ar: 'الحجر المرفوض صار رأس الزاوية', fa: 'سنگ ردشده، سنگ اصلی بنا', hi: 'ठुकराया पत्थर, कोने का पत्थर', id: 'Batu yang dibuang menjadi batu penjuru', sw: 'Jiwe lililokataliwa, jiwe kuu la pembeni', tl: 'Ang itinakwil na bato, naging batong panulok', am: 'የተናቀው ድንጋይ የማዕዘን ራስ ሆነ' },
    ref: 'Psalm 118',
    related: ['Matthew 21:1-11', 'Acts 4:8-12', '1 Peter 2:4-7'],
    reflection: L(
      'Psalm 118 is a festival procession. It begins with a call and response — Israel, the priests and all who fear the Lord answer that His steadfast love endures for ever — then one voice tells how, hard pressed and surrounded, he called on the Lord and was answered. At the gates of righteousness he enters to give thanks, and the crowd marvels at what God has done: the stone the builders threw aside now holds the whole building together. What people discarded, God has made the foundation.',
      'Le Psaume 118 est une procession de fête. Il commence par un chant alterné — Israël, les prêtres et tous ceux qui craignent le Seigneur répondent que son amour fidèle dure à toujours — puis une voix raconte comment, pressé et encerclé, il a invoqué le Seigneur et reçu sa réponse. Aux portes de la justice, il entre pour rendre grâces, et la foule s’émerveille de ce que Dieu a fait : la pierre que les bâtisseurs avaient mise de côté tient maintenant tout l’édifice. Ce que les hommes ont rejeté, Dieu en a fait le fondement.',
    ),
    study: {
      context: L(
        'Psalm 118 has no title and closes the Egyptian Hallel (Psalms 113–118). Verse 14 echoes the Song of Moses after the Red Sea (Exodus 15:2), so each new rescue is sung in the words of the first. The New Testament draws on it repeatedly: the crowds at Jesus’ entry into Jerusalem cry out with verses 25–26, “Hosanna” being the Hebrew plea to save (Matthew 21:9); Jesus applies the rejected stone of verse 22 to Himself (Matthew 21:42), and Peter does the same (Acts 4:11; 1 Peter 2:7); Hebrews 13:6 quotes verse 6.',
        'Le Psaume 118 n’a pas de titre et clôt le Hallel égyptien (Psaumes 113 à 118). Le verset 14 fait écho au cantique de Moïse après la mer Rouge (Exode 15.2), si bien que chaque nouvelle délivrance se chante avec les mots de la première. Le Nouveau Testament y puise souvent : à l’entrée de Jésus à Jérusalem, les foules crient les versets 25 et 26 — « Hosanna » est la supplication hébraïque pour demander le salut (Matthieu 21.9) ; Jésus s’applique la pierre rejetée du verset 22 (Matthieu 21.42), et Pierre fait de même (Actes 4.11 ; 1 Pierre 2.7) ; Hébreux 13.6 cite le verset 6.',
      ),
      tension: L(
        'Verse 24 is often sung as a general cheer for any day, but in context “this day” is the day the Lord acted — the day the rejected stone was vindicated — and Christians have long heard it of Easter. Not every line is a word spoken by Christ, and the battle language of verses 10–12 describes the Lord’s rescue of His king, not a call to fight in God’s name today. Read the psalm through Jesus, who was rejected before He was raised.',
        'Le verset 24 est souvent chanté comme un encouragement pour n’importe quel jour, mais dans son contexte « ce jour » est celui où le Seigneur a agi — le jour où la pierre rejetée a été justifiée — et les chrétiens l’entendent depuis longtemps du matin de Pâques. Toutes les lignes ne sont pas des paroles du Christ, et le langage guerrier des versets 10 à 12 décrit la délivrance du roi par le Seigneur, non un appel à combattre au nom de Dieu aujourd’hui. Lis ce psaume à travers Jésus, rejeté avant d’être ressuscité.',
      ),
      questions: [
        L('Follow the procession: the call (verses 1–4), the testimony (5–18), the gates (19–21), the crowd’s response (22–27) and the final thanks (28–29). What story is being told?', 'Suis la procession : l’appel (versets 1-4), le témoignage (5-18), les portes (19-21), la réponse de la foule (22-27) et l’action de grâces finale (28-29). Quelle histoire est racontée ?'),
        L('How does the New Testament read verses 22–26 of Jesus? What does it mean that the rejected one became the foundation?', 'Comment le Nouveau Testament lit-il les versets 22 à 26 au sujet de Jésus ? Que signifie le fait que celui qui a été rejeté soit devenu le fondement ?'),
        L('What would it mean to thank God today for what He did in Jesus’ death and resurrection, and not only for today’s circumstances?', 'Que signifierait remercier Dieu aujourd’hui pour ce qu’il a fait dans la mort et la résurrection de Jésus, et pas seulement pour les circonstances du jour ?'),
      ],
      synthesis: L(
        'Write the refrain of verses 1–4 as a call and response for your household, church or small group, and add one line of your own testimony in the pattern of verse 5: a distress, a cry, an answer.',
        'Écris le refrain des versets 1 à 4 sous forme de chant alterné pour ta famille, ton Église ou ton groupe de maison, et ajoute une ligne de ton propre témoignage sur le modèle du verset 5 : une détresse, un cri, une réponse.',
      ),
      prayer: L(
        'Lord, Your steadfast love endures for ever. When I was pushed hard and falling, You helped me. Thank You for Jesus, rejected by the builders, whom You raised and made the cornerstone. Save us, we pray, and let this be a day of joy in what You have done.',
        'Seigneur, ton amour fidèle dure à toujours. Quand j’étais poussé et que je tombais, tu m’as secouru. Merci pour Jésus, rejeté par les bâtisseurs, que tu as ressuscité et établi comme pierre angulaire. Sauve-nous, nous t’en prions, et que ce jour soit un jour de joie pour ce que tu as fait.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'cross', 'gospel'],
  },
  {
    movement: 'hope',
    theme: { en: 'Sowing in tears, reaping in joy', fr: 'Semer dans les larmes, moissonner dans la joie', es: 'Sembrar con lágrimas, cosechar con gozo', pt: 'Semear com lágrimas, colher com alegria', de: 'Mit Tränen säen, mit Freuden ernten', ru: 'Сеять со слезами, пожинать с радостью', zh: '流泪撒种，欢呼收割', ja: '涙とともに蒔き、喜びとともに刈る', ko: '눈물로 씨를 뿌리고 기쁨으로 거두다', ar: 'الزرع بالدموع والحصاد بالابتهاج', fa: 'کاشتن با اشک، درو با شادی', hi: 'आँसुओं में बोना, आनंद में काटना', id: 'Menabur dengan air mata, menuai dengan sukacita', sw: 'Kupanda kwa machozi, kuvuna kwa furaha', tl: 'Maghasik sa luha, umani sa galak', am: 'በእንባ መዝራት፣ በደስታ ማጨድ' },
    ref: 'Psalm 126',
    related: ['Ezra 3:10-13', 'Isaiah 35:1-10', 'John 16:20-22'],
    reflection: L(
      'Psalm 126 holds two times together. It remembers a restoration so wonderful that it felt like a dream, with mouths full of laughter and even the nations saying that the Lord had done great things. Then, in the same breath, it prays for restoration again, like streams returning to the dry south. The last image belongs to a farmer who walks out weeping with seed for sowing and comes home singing with sheaves. Joy remembered becomes the ground of hope while the tears are still falling.',
      'Le Psaume 126 tient ensemble deux temps. Il se souvient d’une restauration si merveilleuse qu’elle ressemblait à un rêve, la bouche pleine de rires, au point que même les nations disaient que le Seigneur avait fait de grandes choses. Puis, dans le même souffle, il prie pour une nouvelle restauration, comme des torrents qui reviennent dans le sud aride. La dernière image est celle d’un paysan qui part en pleurant avec la semence et revient en chantant, chargé de gerbes. La joie dont on se souvient devient le fondement de l’espérance alors que les larmes coulent encore.',
    ),
    study: {
      context: L(
        'A Song of Ascents (Psalms 120–134), probably sung by pilgrims going up to Jerusalem. Many link it with the return from exile in Babylon, though the setting is not certain, and verse 1 can also be read as looking forward. The Negeb of verse 4 is the arid south of Judah, whose dry stream beds can fill suddenly after rain. Ezra 3:10-13 shows the same mixture after the return: shouts of joy and loud weeping when the foundation of the temple was laid.',
        'Cantique des montées (Psaumes 120 à 134), sans doute chanté par les pèlerins en montant vers Jérusalem. Beaucoup le rattachent au retour de l’exil à Babylone, même si le cadre n’est pas certain, et le verset 1 peut aussi se lire comme tourné vers l’avenir. Le Néguev du verset 4 est le sud aride de Juda, dont les lits de torrents à sec peuvent se remplir soudain après la pluie. Esdras 3.10-13 montre le même mélange après le retour : des cris de joie et de grands pleurs lors de la pose des fondations du temple.',
      ),
      tension: L(
        'Verses 5–6 are a harvest image of hope, not a law that tears earn joy or a timetable for when grief will lift. The farmer still has to sow, and the psalm does not say how long the waiting lasts. Jesus speaks of sorrow turned into joy (John 16:20-22) without denying that the sorrow is real. If today is a sowing day, the psalm lets you weep without pretending.',
        'Les versets 5 et 6 sont une image de moisson porteuse d’espérance, non une loi selon laquelle les larmes mériteraient la joie, ni un calendrier fixant la fin du chagrin. Le paysan doit encore semer, et le psaume ne dit pas combien de temps dure l’attente. Jésus parle d’une tristesse changée en joie (Jean 16.20-22) sans nier que la tristesse soit réelle. Si aujourd’hui est un jour de semailles, le psaume te permet de pleurer sans faire semblant.',
      ),
      questions: [
        L('Divide the psalm into memory (verses 1–3) and plea (verses 4–6). How does remembering past mercy shape the way the psalmist asks?', 'Divise le psaume entre souvenir (versets 1-3) et supplication (versets 4-6). En quoi le souvenir des bontés passées façonne-t-il la manière de demander ?'),
        L('What is the psalmist honestly living through now, and what should not be generalized from the promise of verses 5–6?', 'Que vit réellement le psalmiste maintenant, et qu’est-ce qu’il ne faut pas généraliser à partir de la promesse des versets 5 et 6 ?'),
        L('What are you sowing in tears at the moment? Bring it to God, and ask for streams in your dry places.', 'Que sèmes-tu dans les larmes en ce moment ? Apporte-le à Dieu, et demande-lui des torrents dans tes lieux arides.'),
      ],
      synthesis: L(
        'Make two lists: the great things God has already done in your life or your church, and the restorations you are still asking for. Then pray from the first list into the second.',
        'Fais deux listes : les grandes choses que Dieu a déjà faites dans ta vie ou dans ton Église, et les restaurations que tu demandes encore. Puis prie en passant de la première liste à la seconde.',
      ),
      prayer: L(
        'Lord, You have done great things, and I remember them with joy. Restore us again, like streams in a dry land. I bring You the seed I am sowing in tears; bring in a harvest of joy in Your time.',
        'Seigneur, tu as fait de grandes choses, et je m’en souviens avec joie. Restaure-nous encore, comme des torrents dans une terre aride. Je t’apporte la semence que je sème dans les larmes ; fais venir en ton temps une moisson de joie.',
      ),
    },
    resourceTopics: ['psalms', 'grief', 'lament', 'prayer'],
  },
  {
    movement: 'hope',
    theme: { en: 'A quieted soul', fr: 'Une âme apaisée', es: 'Un alma sosegada', pt: 'Uma alma sossegada', de: 'Eine still gewordene Seele', ru: 'Успокоенная душа', zh: '平静安稳的心', ja: '静められた魂', ko: '고요하고 평온한 영혼', ar: 'نفس هادئة', fa: 'جانی آرام', hi: 'शांत की गई आत्मा', id: 'Jiwa yang tenang', sw: 'Nafsi iliyotulizwa', tl: 'Kaluluwang pinatahimik', am: 'ጸጥ ያለች ነፍስ' },
    ref: 'Psalm 131',
    related: ['Matthew 11:25-30', 'Isaiah 66:12-13', 'Philippians 4:11-13'],
    reflection: L(
      'Psalm 131 is three verses long and one of the most intimate prayers in Scripture. The psalmist lays down pride and ambition — no lofty looks, no reaching for matters too great — and describes a soul calmed and quieted like a weaned child resting against its mother. A weaned child no longer comes to its mother only to demand food; it can simply be with her. After weeks of loud praise, anguished lament and hard questions, this psalm teaches a quieter kind of trust.',
      'Le Psaume 131 ne compte que trois versets et c’est l’une des prières les plus intimes de l’Écriture. Le psalmiste dépose l’orgueil et l’ambition — ni regard hautain, ni prétention à des choses trop grandes — et décrit une âme calmée et apaisée, comme un enfant sevré qui repose contre sa mère. L’enfant sevré ne vient plus vers sa mère seulement pour réclamer à manger ; il peut simplement être avec elle. Après des semaines de louange éclatante, de lamentations angoissées et de questions difficiles, ce psaume enseigne une confiance plus silencieuse.',
    ),
    study: {
      context: L(
        'A Song of Ascents, with a title linking it to David. It follows Psalm 130, and both end by turning a personal prayer into a call for Israel to hope in the Lord. Because of its image of a child carried by its mother, some commentators suggest the voice may be a woman’s; the text does not say. Isaiah 66:12-13 uses a similar picture for God’s comfort, and Jesus praises the Father for revealing His ways to little children (Matthew 11:25).',
        'Cantique des montées, dont le titre le rattache à David. Il suit le Psaume 130, et tous deux se terminent en transformant une prière personnelle en appel à Israël d’espérer dans le Seigneur. À cause de l’image d’un enfant porté par sa mère, certains commentateurs suggèrent que la voix pourrait être celle d’une femme ; le texte ne le précise pas. Ésaïe 66.12-13 emploie une image semblable pour la consolation de Dieu, et Jésus loue le Père d’avoir révélé ses voies aux tout-petits (Matthieu 11.25).',
      ),
      tension: L(
        'This quietness is not a refusal to think or to ask hard questions; the same Psalter contains Psalms 73 and 88, and God welcomes both. Nor is it the silence of someone told to stop complaining. It is the rest of a person who has brought everything to God and chooses to trust Him with what remains too great to understand — a calm the psalmist has practised, not an instant feeling.',
        'Ce calme n’est pas un refus de réfléchir ou de poser des questions difficiles ; le même psautier contient les Psaumes 73 et 88, et Dieu accueille les deux. Ce n’est pas non plus le silence de quelqu’un à qui l’on aurait ordonné de cesser de se plaindre. C’est le repos de celui qui a tout apporté à Dieu et qui choisit de lui confier ce qui reste trop grand pour être compris — un calme que le psalmiste a exercé, non un sentiment instantané.',
      ),
      questions: [
        L('What does the psalmist refuse (verse 1) and what does he choose (verse 2)? What is the difference between a nursing child and a weaned one?', 'Que refuse le psalmiste (verset 1) et que choisit-il (verset 2) ? Quelle différence y a-t-il entre un nourrisson et un enfant sevré ?'),
        L('How does this short psalm relate to the wider story — to Psalm 130 before it and to Jesus’ words in Matthew 11:25-30?', 'Comment ce court psaume se rattache-t-il à l’ensemble du récit — au Psaume 130 qui le précède et aux paroles de Jésus en Matthieu 11.25-30 ?'),
        L('What matter too great for you are you trying to control or solve? Tell God, then spend a few minutes in quiet trust with Him.', 'Quelle chose trop grande pour toi essaies-tu de maîtriser ou de résoudre ? Dis-le à Dieu, puis passe quelques minutes de confiance silencieuse avec lui.'),
      ],
      synthesis: L(
        'Write down one question or burden that is too great for you, and beneath it: “I leave this with You, Lord.” Then sit in silence for three minutes, and note afterwards what quieted you and what did not.',
        'Écris une question ou un fardeau trop grand pour toi et, en dessous : « Je te le confie, Seigneur. » Puis reste en silence trois minutes, et note ensuite ce qui t’a apaisé et ce qui ne l’a pas fait.',
      ),
      prayer: L(
        'Lord, I lay down my pride and the things too great for me. Quiet my soul like a child resting against its mother, and teach me, with all Your people, to hope in You from now on and for ever.',
        'Seigneur, je dépose mon orgueil et les choses trop grandes pour moi. Apaise mon âme comme un enfant qui repose contre sa mère, et apprends-moi, avec tout ton peuple, à espérer en toi dès maintenant et pour toujours.',
      ),
    },
    resourceTopics: ['psalms', 'contentment', 'trust', 'spiritual-formation'],
  },
  {
    movement: 'hope',
    theme: { en: 'Praise as long as I live', fr: 'Louer tant que je vivrai', es: 'Alabar mientras viva', pt: 'Louvar enquanto eu viver', de: 'Loben, solange ich lebe', ru: 'Хвалить, пока живу', zh: '一生赞美', ja: '生きる限り主をほめたたえる', ko: '평생 찬양하리라', ar: 'أسبّح ما دمت حيًّا', fa: 'تا زنده‌ام ستایش می‌کنم', hi: 'जीवन भर स्तुति', id: 'Memuji selama aku hidup', sw: 'Kusifu maadamu ninaishi', tl: 'Magpupuri habang ako’y nabubuhay', am: 'በሕይወቴ ዘመን ሁሉ ማመስገን' },
    ref: 'Psalm 146',
    related: ['Psalm 145', 'Psalm 150', 'Luke 7:18-23'],
    reflection: L(
      'The journey ends where the Psalter ends: in praise. Psalm 146 opens the final five Hallelujah psalms, and its praise has passed through everything these six weeks explored. It warns against placing ultimate trust in rulers, whose plans die with them, and calls blessed the one whose help is the God of Jacob — the Maker of heaven and earth, who keeps faith for ever. Then it lists what this God does: justice for the oppressed, bread for the hungry, freedom for prisoners, sight for the blind, care for strangers, widows and orphans. Praise here is not an escape from the world’s pain; it is confidence in the King who will set it right.',
      'Le parcours s’achève là où s’achève le psautier : dans la louange. Le Psaume 146 ouvre les cinq derniers psaumes « Alléluia », et sa louange a traversé tout ce que ces six semaines ont exploré. Il met en garde contre une confiance absolue dans les dirigeants, dont les projets meurent avec eux, et déclare heureux celui qui a pour secours le Dieu de Jacob — le Créateur du ciel et de la terre, qui reste fidèle pour toujours. Puis il énumère ce que fait ce Dieu : justice pour les opprimés, pain pour les affamés, liberté pour les captifs, vue pour les aveugles, soin des immigrés, des veuves et des orphelins. La louange n’est pas ici une fuite hors de la douleur du monde ; c’est la confiance dans le Roi qui la réparera.',
    ),
    study: {
      context: L(
        'Psalm 146 has no title; it begins and ends with “Hallelujah” (praise the Lord), as do Psalms 147–150, the Psalter’s closing doxology. It takes up the vow at the end of Psalm 145 that every creature will bless God’s name. Its list of God’s works in verses 7–9 gathers the concerns of Psalms 72 and 82, and Jesus’ reply to John the Baptist (Luke 7:22), pointing to the blind receiving sight and the poor hearing good news, shows such works breaking in through His ministry, in words drawn from Isaiah. The last verse confesses that the Lord will reign for ever.',
        'Le Psaume 146 n’a pas de titre ; il commence et se termine par « Alléluia » (louez le Seigneur), comme les Psaumes 147 à 150, la doxologie finale du psautier. Il reprend le vœu, à la fin du Psaume 145, que toute créature bénisse le nom de Dieu. La liste des œuvres de Dieu aux versets 7 à 9 rassemble les préoccupations des Psaumes 72 et 82, et la réponse de Jésus à Jean-Baptiste (Luc 7.22), qui évoque les aveugles qui voient et la bonne nouvelle annoncée aux pauvres, montre de telles œuvres faisant irruption dans son ministère, avec des mots tirés d’Ésaïe. Le dernier verset confesse que le Seigneur régnera éternellement.',
      ),
      tension: L(
        'Verse 3 does not make human leaders, doctors or helpers worthless; it refuses to make them our salvation. And verses 7–9 describe God’s character and His coming reign, not a promise that every prisoner will be freed or every illness healed this year; the Psalter has taught us to hold praise and waiting together. The praise that closes the book is not naive: it comes after lament, confession and the long wait for justice.',
        'Le verset 3 ne rend pas inutiles les dirigeants, les médecins ou ceux qui aident ; il refuse d’en faire notre salut. Et les versets 7 à 9 décrivent le caractère de Dieu et son règne à venir, non la promesse que chaque prisonnier sera libéré ou chaque maladie guérie cette année ; le psautier nous a appris à tenir ensemble la louange et l’attente. La louange qui clôt le livre n’est pas naïve : elle vient après la lamentation, la confession et la longue attente de la justice.',
      ),
      questions: [
        L('List the works of God in verses 6–9. What do they reveal about His character, and whom does He notice?', 'Relève les œuvres de Dieu aux versets 6 à 9. Que révèlent-elles de son caractère, et qui remarque-t-il ?'),
        L('Go back to the six questions from day 1. Which one has most changed the way you read and pray the Psalms?', 'Reprends les six questions du premier jour. Laquelle a le plus changé ta manière de lire et de prier les Psaumes ?'),
        L('Whom are you tempted to trust as if they were your salvation? Move that trust to God, and pray for one person from the list in verses 7–9.', 'À qui es-tu tenté de faire confiance comme s’il était ton salut ? Reporte cette confiance sur Dieu, et prie pour une personne de la liste des versets 7 à 9.'),
      ],
      synthesis: L(
        'Final review: read back over your notes from these forty-two days and choose, for each week, one psalm you want to keep praying. Review question: what have the Psalms taught you about bringing everything — praise, fear, grief, anger, guilt, injustice and hope — to God? To keep going, read one psalm a day from Psalm 1 onwards, asking the same six questions.',
        'Bilan final : relis tes notes de ces quarante-deux jours et choisis, pour chaque semaine, un psaume que tu veux continuer à prier. Question de bilan : qu’est-ce que les Psaumes t’ont appris sur la manière d’apporter tout à Dieu — louange, peur, chagrin, colère, culpabilité, injustice et espérance ? Pour continuer, lis un psaume par jour à partir du Psaume 1, en posant les mêmes six questions.',
      ),
      prayer: L(
        'Lord, I will praise You as long as I live. I will not put my final trust in princes but in You, Maker of heaven and earth, who keeps faith for ever. Lift up the bowed down, feed the hungry, free the prisoner, and reign, O Lord, for ever. Hallelujah.',
        'Seigneur, je te louerai tant que je vivrai. Je ne mettrai pas ma confiance ultime dans les puissants, mais en toi, Créateur du ciel et de la terre, qui restes fidèle pour toujours. Relève ceux qui sont courbés, nourris ceux qui ont faim, libère les captifs, et règne, Seigneur, pour toujours. Alléluia.',
      ),
    },
    resourceTopics: ['psalms', 'worship', 'justice', 'kingdom-of-god'],
  },
];
