// The 21 days of "Intimacy with the Holy Spirit" (see ./intimacyWithTheSpirit.js
// for the plan meta, the movements and the guardrails this content is held to).
//
// Prayer-mode day shape: theme (16 languages), ref, related, reflection,
// prompts, optional selfPrompt, practice, optional safetyNote, resourceTopics.
// Prose is authored in en + fr only; other languages fall back through pick().
// References only — no Bible text is stored or paraphrased as a quotation.
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Movement 1 · Know the Holy Spirit (days 1–5) ─────────────────────────
  {
    movement: 'know',
    theme: { en: 'The Holy Spirit is God', fr: 'Le Saint-Esprit est Dieu', es: 'El Espíritu Santo es Dios', pt: 'O Espírito Santo é Deus', de: 'Der Heilige Geist ist Gott', ru: 'Святой Дух — Бог', zh: '圣灵是神', ja: '聖霊は神である', ko: '성령은 하나님이시다', ar: 'الروح القدس هو الله', fa: 'روح‌القدس خداست', hi: 'पवित्र आत्मा परमेश्वर है', id: 'Roh Kudus adalah Allah', sw: 'Roho Mtakatifu ni Mungu', tl: 'Ang Espiritu Santo ay Diyos', am: 'መንፈስ ቅዱስ አምላክ ነው' },
    ref: 'Matthew 28:18-20',
    related: ['Acts 5:3-4', 'Psalm 139:7-10', 'Genesis 1:1-2'],
    reflection: L(
      'Jesus sends His disciples to baptise in one name — the name of the Father, the Son and the Holy Spirit. Scripture never ranks the Spirit below the other two: Peter treats lying to the Spirit as lying to God, and the psalmist finds no place beyond His presence. The Spirit who hovered over the waters at creation is not a lesser helper sent on errands. When He draws near, God Himself draws near.',
      "Jésus envoie ses disciples baptiser au nom — un seul nom — du Père, du Fils et du Saint-Esprit. L'Écriture ne place jamais l'Esprit au-dessous des deux autres : pour Pierre, mentir à l'Esprit, c'est mentir à Dieu, et le psalmiste ne trouve aucun lieu hors de sa présence. L'Esprit qui planait au-dessus des eaux à la création n'est pas un auxiliaire de second rang. Quand Il s'approche, c'est Dieu lui-même qui s'approche.",
    ),
    prompts: [
      L('Worship the Holy Spirit as God, with the Father and the Son, and thank Him for being near.', "Adore le Saint-Esprit comme Dieu, avec le Père et le Fils, et remercie-Le d'être proche."),
      L('Confess any way you have thought of the Spirit as a force or a feeling rather than as God.', "Confesse les fois où tu as pensé à l'Esprit comme à une force ou à une émotion plutôt que comme à Dieu."),
      L('Ask Him to make these three weeks about knowing Him, not about collecting experiences.', 'Demande-Lui que ces trois semaines servent à Le connaître, et non à collectionner des expériences.'),
    ],
    practice: L(
      'Before you pray today, read Psalm 139:7-10 slowly and name one place in your day — your commute, your kitchen, your desk — where He is already present.',
      'Avant de prier aujourd’hui, lis lentement Psaume 139:7-10 et nomme un lieu de ta journée — ton trajet, ta cuisine, ton bureau — où Il est déjà présent.',
    ),
    resourceTopics: ['holy-spirit', 'worship'],
  },
  {
    movement: 'know',
    theme: { en: 'The Holy Spirit is personal', fr: 'Le Saint-Esprit est une Personne', es: 'El Espíritu Santo es una persona', pt: 'O Espírito Santo é uma pessoa', de: 'Der Heilige Geist ist eine Person', ru: 'Святой Дух — Личность', zh: '圣灵是有位格的', ja: '聖霊は人格を持つお方', ko: '성령은 인격이시다', ar: 'الروح القدس شخص', fa: 'روح‌القدس شخص است', hi: 'पवित्र आत्मा एक व्यक्ति है', id: 'Roh Kudus adalah Pribadi', sw: 'Roho Mtakatifu ni Nafsi', tl: 'Ang Espiritu Santo ay isang Persona', am: 'መንፈስ ቅዱስ አካል ነው' },
    ref: 'John 14:15-27',
    related: ['Ephesians 4:30', '1 Corinthians 12:11'],
    reflection: L(
      'On the night before the cross, Jesus promised His friends another Advocate — one like Himself, who would stay with them and live in them. He does not describe a power to be switched on but Someone who teaches, reminds and gives peace. Paul adds that the Spirit can be grieved, and only a person can be grieved. Fellowship with the Spirit begins here: He is Someone to know, not something to use.',
      "La veille de la croix, Jésus promet à ses amis un autre Consolateur — quelqu'un comme Lui, qui resterait avec eux et habiterait en eux. Il ne décrit pas une puissance qu'on allume, mais Quelqu'un qui enseigne, rappelle et donne la paix. Paul ajoute que l'on peut attrister l'Esprit ; or seule une personne peut être attristée. La communion avec l'Esprit commence ici : Il est Quelqu'un à connaître, non quelque chose dont on se sert.",
    ),
    prompts: [
      L('Speak to the Holy Spirit directly today, as you would to the Father or to Jesus.', "Adresse-toi aujourd'hui directement au Saint-Esprit, comme tu le ferais au Père ou à Jésus."),
      L('Thank Jesus that He did not leave you on your own but sent the Spirit to be with you.', "Remercie Jésus de ne pas t'avoir laissé seul, mais de t'avoir envoyé l'Esprit pour être avec toi."),
      L('Ask Him to show you where you have tried to use Him instead of knowing Him.', "Demande-Lui de te montrer où tu as cherché à te servir de Lui plutôt qu'à Le connaître."),
    ],
    practice: L(
      'Read John 14:15-27 and note every verb Jesus uses for what the Spirit does. Keep the list for the days ahead.',
      "Lis Jean 14:15-27 et relève chaque verbe que Jésus emploie pour dire ce que fait l'Esprit. Garde cette liste pour les jours à venir.",
    ),
    resourceTopics: ['holy-spirit', 'spiritual-formation'],
  },
  {
    movement: 'know',
    theme: { en: 'The Spirit glorifies Jesus', fr: "L'Esprit glorifie Jésus", es: 'El Espíritu glorifica a Jesús', pt: 'O Espírito glorifica Jesus', de: 'Der Geist verherrlicht Jesus', ru: 'Дух прославляет Иисуса', zh: '圣灵荣耀耶稣', ja: '聖霊はイエス様の栄光を現す', ko: '성령은 예수님을 영화롭게 하신다', ar: 'الروح يمجّد يسوع', fa: 'روح، عیسی را جلال می‌دهد', hi: 'आत्मा यीशु की महिमा करता है', id: 'Roh memuliakan Yesus', sw: 'Roho humtukuza Yesu', tl: 'Niluluwalhati ng Espiritu si Jesus', am: 'መንፈስ ኢየሱስን ያከብራል' },
    ref: 'John 16:5-15',
    related: ['John 15:26-27', '1 Corinthians 12:1-3'],
    reflection: L(
      'Jesus tells His grieving disciples that His going away is for their good, because then the Spirit will come. And the Spirit’s work, as Jesus describes it, points away from Himself: He takes what belongs to Jesus and makes it known. That gives you a simple test for any spiritual experience or teaching: does it make Jesus clearer, dearer and more obeyed? The Spirit is never in competition with the Son.',
      "Jésus dit à ses disciples attristés qu'il leur est avantageux qu'Il s'en aille, car alors l'Esprit viendra. Et l'œuvre de l'Esprit, telle que Jésus la décrit, ne se tourne pas vers elle-même : Il prend ce qui est à Jésus et le fait connaître. Cela te donne un critère simple pour toute expérience ou tout enseignement spirituel : Jésus en devient-Il plus clair, plus cher, mieux obéi ? L'Esprit n'est jamais en rivalité avec le Fils.",
    ),
    prompts: [
      L('Ask the Spirit to show you more of Jesus — His character, His cross, His lordship.', "Demande à l'Esprit de te montrer davantage Jésus — son caractère, sa croix, sa seigneurie."),
      L('Thank God that you can call Jesus Lord, and that this confession is itself the Spirit’s work.', "Remercie Dieu de pouvoir appeler Jésus Seigneur : cette confession est déjà l'œuvre de l'Esprit."),
      L('Bring Him any teaching or experience that has drawn your attention away from Jesus, and ask for clarity.', "Apporte-Lui tout enseignement ou toute expérience qui a détourné ton attention de Jésus, et demande-Lui d'y voir clair."),
    ],
    practice: L(
      'Write one sentence about who Jesus is to you today, and read it aloud as the start of your prayer.',
      "Écris une phrase sur ce que Jésus est pour toi aujourd'hui, et lis-la à voix haute pour commencer ta prière.",
    ),
    resourceTopics: ['holy-spirit', 'gospel'],
  },
  {
    movement: 'know',
    theme: { en: 'Born of the Spirit', fr: "Né de l'Esprit", es: 'Nacido del Espíritu', pt: 'Nascido do Espírito', de: 'Aus dem Geist geboren', ru: 'Рождённый от Духа', zh: '从圣灵生的', ja: '御霊によって生まれる', ko: '성령으로 난 사람', ar: 'المولود من الروح', fa: 'مولود از روح', hi: 'आत्मा से जन्मा', id: 'Lahir dari Roh', sw: 'Kuzaliwa kwa Roho', tl: 'Ipinanganak sa Espiritu', am: 'ከመንፈስ መወለድ' },
    ref: 'John 3:1-8',
    related: ['Ezekiel 36:25-27', 'Titus 3:4-7'],
    reflection: L(
      'Nicodemus came at night as a respected teacher, and Jesus told him he needed a birth he could not produce. No one gives birth to himself; new life comes from the Spirit, like wind you can hear but cannot direct. Ezekiel had promised exactly this: a new heart and God’s own Spirit within. Your life with the Spirit did not start with your effort, and it will not be sustained by it either.',
      "Nicodème vient de nuit, en maître respecté, et Jésus lui dit qu'il a besoin d'une naissance qu'il ne peut pas produire. Personne ne se fait naître soi-même : la vie nouvelle vient de l'Esprit, comme un vent qu'on entend sans pouvoir le diriger. Ézéchiel avait promis exactement cela : un cœur nouveau et l'Esprit de Dieu lui-même au-dedans. Ta vie avec l'Esprit n'a pas commencé par tes efforts, et ce ne sont pas eux qui la feront durer.",
    ),
    prompts: [
      L('Thank God for the new birth — that your life with Him began as His gift, not your achievement.', 'Remercie Dieu pour la nouvelle naissance : ta vie avec Lui a commencé comme un don, non comme une réussite.'),
      L('If you are unsure you have been born again, tell Jesus so honestly and ask Him for new life.', "Si tu n'es pas sûr d'être né de nouveau, dis-le franchement à Jésus et demande-Lui la vie nouvelle."),
      L('Pray for someone who, like Nicodemus, knows a lot about God but has not yet come to new life.', "Prie pour quelqu'un qui, comme Nicodème, en sait beaucoup sur Dieu mais n'a pas encore reçu la vie nouvelle."),
    ],
    practice: L(
      'Write down in two or three lines how you came to faith in Jesus — or where you are with Him now — and thank Him for it.',
      "Écris en deux ou trois lignes comment tu es venu à la foi en Jésus — ou où tu en es avec Lui aujourd'hui — et remercie-Le.",
    ),
    resourceTopics: ['holy-spirit', 'gospel'],
  },
  {
    movement: 'know',
    theme: { en: 'The Spirit lives in you', fr: "L'Esprit habite en toi", es: 'El Espíritu vive en ti', pt: 'O Espírito vive em você', de: 'Der Geist wohnt in dir', ru: 'Дух живёт в тебе', zh: '圣灵住在你里面', ja: '聖霊はあなたの内に住まわれる', ko: '성령이 네 안에 사신다', ar: 'الروح يسكن فيك', fa: 'روح در تو ساکن است', hi: 'आत्मा तुम में वास करता है', id: 'Roh diam di dalammu', sw: 'Roho anakaa ndani yako', tl: 'Nananahan sa iyo ang Espiritu', am: 'መንፈስ በአንተ ውስጥ ይኖራል' },
    ref: 'Romans 8:9-17',
    related: ['Ephesians 1:13-14', '1 Corinthians 6:19-20', 'Galatians 4:4-7'],
    reflection: L(
      'Paul does not divide Christians into those who have the Spirit and those who do not: to belong to Christ is to have His Spirit. That is a fact before it is a feeling. The same Spirit leads God’s children, frees them from fear and moves them to call God Abba, Father. On days you sense much and on days you sense little, He is not a visitor who comes and goes. He lives in you.',
      "Paul ne partage pas les chrétiens entre ceux qui ont l'Esprit et ceux qui ne l'ont pas : appartenir à Christ, c'est avoir son Esprit. C'est un fait avant d'être un ressenti. Ce même Esprit conduit les enfants de Dieu, les libère de la peur et leur fait appeler Dieu « Abba, Père ». Les jours où tu ressens beaucoup comme ceux où tu ressens peu, Il n'est pas un visiteur de passage. Il habite en toi.",
    ),
    prompts: [
      L('Thank God that, if you belong to Christ, His Spirit already lives in you.', 'Remercie Dieu : si tu appartiens à Christ, son Esprit habite déjà en toi.'),
      L('Call God your Father today in your own words, and let the Spirit’s assurance quiet your fear.', "Appelle aujourd'hui Dieu ton Père, avec tes propres mots, et laisse l'assurance de l'Esprit apaiser ta peur."),
      L('Offer Him your body — your eyes, hands, habits and rest — as a place where He is honoured.', 'Offre-Lui ton corps — tes yeux, tes mains, tes habitudes, ton repos — comme un lieu où Il est honoré.'),
    ],
    practice: L(
      'Choose one ordinary moment today — washing up, walking, waiting — to say quietly: Holy Spirit, thank You that You are here.',
      "Choisis un moment ordinaire aujourd'hui — la vaisselle, la marche, une attente — pour dire doucement : « Saint-Esprit, merci d'être là. »",
    ),
    resourceTopics: ['holy-spirit', 'identity'],
  },

  // ── Movement 2 · Learning to walk with Him (days 6–10) ───────────────────
  {
    movement: 'walk',
    theme: { en: 'Walk by the Spirit', fr: "Marcher par l'Esprit", es: 'Andar en el Espíritu', pt: 'Andar no Espírito', de: 'Im Geist wandeln', ru: 'Поступать по духу', zh: '顺着圣灵而行', ja: '御霊によって歩む', ko: '성령을 따라 행하라', ar: 'اسلك بالروح', fa: 'به روح رفتار کن', hi: 'आत्मा के अनुसार चलो', id: 'Hidup oleh Roh', sw: 'Kuenenda kwa Roho', tl: 'Lumakad ayon sa Espiritu', am: 'በመንፈስ መመላለስ' },
    ref: 'Galatians 5:13-18',
    related: ['Romans 8:12-14'],
    reflection: L(
      'Paul’s picture is walking: ordinary steps, taken daily, in one direction. He sets it inside a warning — freedom is not a licence for the flesh but an opening to serve one another in love. He also admits the struggle: flesh and Spirit pull against each other. Feeling that tension is not a sign that the Spirit has left you; it is often a sign that He is at work.',
      "L'image de Paul, c'est la marche : des pas ordinaires, faits chaque jour, dans une même direction. Il l'inscrit dans un avertissement : la liberté n'est pas un prétexte pour la chair, mais une porte ouverte pour se mettre, par amour, au service les uns des autres. Il reconnaît aussi le combat : la chair et l'Esprit tirent en sens contraire. Sentir cette tension n'est pas le signe que l'Esprit t'a quitté ; c'est souvent le signe qu'Il est à l'œuvre.",
    ),
    prompts: [
      L('Ask the Spirit to lead your next step today, not your whole year.', "Demande à l'Esprit de conduire ton prochain pas aujourd'hui, pas toute ton année."),
      L('Name honestly one desire of the flesh that pulls at you, and ask Him for strength to say no.', "Nomme honnêtement un désir de la chair qui t'attire, et demande-Lui la force de dire non."),
      L('Pray for one person you can serve in love this week, and ask Him to show you how.', 'Prie pour une personne que tu peux servir avec amour cette semaine, et demande-Lui de te montrer comment.'),
    ],
    practice: L(
      'Pause three times today — morning, midday, evening — and ask in one sentence: Holy Spirit, how do I walk with You in this?',
      "Marque trois pauses aujourd'hui — matin, midi, soir — et demande en une phrase : « Saint-Esprit, comment marcher avec Toi dans cette situation ? »",
    ),
    resourceTopics: ['holy-spirit', 'holiness', 'spiritual-formation'],
  },
  {
    movement: 'walk',
    theme: { en: 'The Spirit and the Word', fr: "L'Esprit et la Parole", es: 'El Espíritu y la Palabra', pt: 'O Espírito e a Palavra', de: 'Der Geist und das Wort', ru: 'Дух и Слово', zh: '圣灵与神的话语', ja: '聖霊とみことば', ko: '성령과 말씀', ar: 'الروح والكلمة', fa: 'روح و کلام', hi: 'आत्मा और वचन', id: 'Roh dan Firman', sw: 'Roho na Neno', tl: 'Ang Espiritu at ang Salita', am: 'መንፈስና ቃሉ' },
    ref: '1 Corinthians 2:9-16',
    related: ['2 Peter 1:19-21', 'John 14:25-26'],
    reflection: L(
      'Paul’s famous words about what God has prepared for those who love Him are often read as a description of heaven, yet the very next verse says God has revealed these things by His Spirit. The Spirit who searches the depths of God is the One who carried the prophets as they spoke, and He now opens our understanding of what God has given. He does not lead us away from Scripture or around it, but into it. Word and Spirit are never rivals.',
      "Les paroles célèbres de Paul sur ce que Dieu a préparé pour ceux qui L'aiment sont souvent lues comme une description du ciel ; pourtant, le verset suivant dit que Dieu nous l'a révélé par son Esprit. L'Esprit qui sonde les profondeurs de Dieu est Celui qui portait les prophètes quand ils parlaient, et Il ouvre aujourd'hui notre intelligence à ce que Dieu nous a donné. Il ne nous éloigne pas de l'Écriture et ne la contourne pas : Il nous y fait entrer. La Parole et l'Esprit ne sont jamais rivaux.",
    ),
    prompts: [
      L('Before you read today, ask the Spirit who inspired Scripture to open your understanding.', "Avant de lire aujourd'hui, demande à l'Esprit qui a inspiré l'Écriture d'ouvrir ton intelligence."),
      L('Thank God that you do not have to discover Him alone — He has made Himself known.', "Remercie Dieu de ne pas avoir à Le découvrir seul : Il s'est fait connaître."),
      L('Ask Him to guard you from any impression that would pull you away from what Scripture plainly teaches.', "Demande-Lui de te garder de toute impression qui t'éloignerait de ce que l'Écriture enseigne clairement."),
    ],
    practice: L(
      'Read 1 Corinthians 2:9-16 slowly twice, then write down one thing it made clearer to you and turn it into a prayer.',
      "Lis lentement 1 Corinthiens 2:9-16 deux fois, puis note une chose que le texte t'a rendue plus claire et fais-en une prière.",
    ),
    resourceTopics: ['holy-spirit', 'scripture-prayer', 'discernment'],
  },
  {
    movement: 'walk',
    theme: { en: 'Learning to listen', fr: 'Apprendre à écouter', es: 'Aprender a escuchar', pt: 'Aprender a ouvir', de: 'Hören lernen', ru: 'Учиться слушать', zh: '学习聆听', ja: '聞くことを学ぶ', ko: '듣는 법을 배우라', ar: 'تعلُّم الإصغاء', fa: 'یاد گرفتن گوش دادن', hi: 'सुनना सीखना', id: 'Belajar mendengar', sw: 'Kujifunza kusikiliza', tl: 'Pag-aaral makinig', am: 'ማዳመጥን መማር' },
    ref: '1 Samuel 3:1-10',
    related: ['John 10:1-5', 'Acts 13:1-3'],
    reflection: L(
      'Samuel did not recognise the Lord’s call at first; three times he ran to Eli. It took an older, flawed priest to help him understand what was happening and how to answer. Samuel’s calling was unique, but the pattern is worth noticing: listening is learned slowly, and rarely alone. In Acts 13 the church in Antioch heard the Spirit together, while worshipping and fasting, and acted as a community.',
      "Samuel n'a pas reconnu tout de suite l'appel du Seigneur : trois fois, il a couru vers Éli. Il a fallu un prêtre âgé, et imparfait, pour l'aider à comprendre ce qui se passait et comment répondre. L'appel de Samuel était unique, mais le schéma mérite d'être remarqué : on apprend à écouter lentement, et rarement seul. En Actes 13, l'Église d'Antioche a entendu l'Esprit ensemble, en adorant et en jeûnant, puis elle a agi en communauté.",
    ),
    prompts: [
      L('Tell God you want to listen, and ask Him to quiet the noise you usually bring into prayer.', "Dis à Dieu que tu veux écouter, et demande-Lui d'apaiser le bruit que tu apportes d'ordinaire dans la prière."),
      L('Thank Him for the Elis in your life — the believers who help you understand what God may be doing.', "Remercie-Le pour les Éli de ta vie : ces croyants qui t'aident à comprendre ce que Dieu est peut-être en train de faire."),
      L('Ask for the humility to hold what you sense loosely, and to let others help you weigh it.', "Demande l'humilité de tenir sans crispation ce que tu ressens, et de laisser d'autres t'aider à le peser."),
    ],
    practice: L(
      'Spend five minutes in silence after reading 1 Samuel 3:1-10. If something comes to mind, write it down to test later — do not act on it yet.',
      "Passe cinq minutes en silence après avoir lu 1 Samuel 3:1-10. Si quelque chose te vient à l'esprit, note-le pour l'éprouver plus tard — sans agir pour l'instant.",
    ),
    safetyNote: L(
      'Not every thought, dream, feeling, coincidence or inner voice comes from God, and none should be acted on untested. Anything that urges you to harm yourself or others, to stop medical or mental-health treatment, or to cut off the people who care for you does not bear the character of Jesus. If you hear voices that frighten you or give you orders, or you can no longer sleep or think clearly, please speak to a doctor as well as a pastor — seeking help is not a lack of faith.',
      "Toute pensée, tout rêve, toute émotion, toute coïncidence ou voix intérieure ne vient pas de Dieu, et rien de cela ne doit être suivi sans avoir été éprouvé. Ce qui te pousse à te faire du mal ou à en faire à d'autres, à arrêter un traitement médical ou psychologique, ou à te couper de ceux qui prennent soin de toi, ne porte pas le caractère de Jésus. Si tu entends des voix qui t'effraient ou te donnent des ordres, ou si tu ne peux plus dormir ni penser clairement, parles-en à un médecin autant qu'à un pasteur : demander de l'aide n'est pas un manque de foi.",
    ),
    resourceTopics: ['listening', 'discernment', 'holy-spirit'],
  },
  {
    movement: 'walk',
    theme: { en: 'Test what you hear', fr: 'Éprouve ce que tu entends', es: 'Examina lo que oyes', pt: 'Examine o que você ouve', de: 'Prüfe, was du hörst', ru: 'Испытывай то, что слышишь', zh: '察验你所听见的', ja: '聞いたことを吟味する', ko: '들은 것을 분별하라', ar: 'امتحن ما تسمعه', fa: 'آنچه می‌شنوی را بیازما', hi: 'जो सुनते हो उसे परखो', id: 'Ujilah apa yang kaudengar', sw: 'Pima unachosikia', tl: 'Suriin ang iyong naririnig', am: 'የምትሰማውን ፈትን' },
    ref: '1 John 4:1-6',
    related: ['1 Corinthians 14:29-33', 'Acts 15:22-29', 'Acts 17:10-12'],
    reflection: L(
      'John writes to beloved believers, not to sceptics, and tells them not to believe every spirit but to test them. Testing is not unbelief; it is obedience. His first test is Jesus: what honours Christ come in the flesh? Scripture adds others — agreement with God’s Word, the fruit a claim produces, the counsel of mature believers, humility about what we cannot yet know. Even the apostles in Acts 15 spoke of what seemed good to the Spirit and to them, together.',
      "Jean écrit à des croyants bien-aimés, non à des sceptiques, et leur dit de ne pas croire tout esprit, mais de les éprouver. Éprouver n'est pas douter ; c'est obéir. Son premier critère, c'est Jésus : qu'est-ce qui honore Christ venu dans la chair ? L'Écriture en ajoute d'autres : l'accord avec la Parole de Dieu, le fruit que produit une affirmation, le conseil de croyants mûrs, l'humilité devant ce que l'on ne sait pas encore. En Actes 15, les apôtres eux-mêmes parlent de ce qui a paru bon à l'Esprit et à eux, ensemble.",
    ),
    prompts: [
      L('Bring God one impression or word you have received, and ask Him to help you weigh it honestly.', "Apporte à Dieu une impression ou une parole que tu as reçue, et demande-Lui de t'aider à la peser honnêtement."),
      L('Ask for the courage to say “I may be wrong” about what you sense, and for friends who will tell you the truth.', "Demande le courage de dire « je me trompe peut-être » sur ce que tu ressens, et des amis qui te diront la vérité."),
      L('Pray for anyone who has been hurt by words spoken in God’s name, that they would find safety and truth.', "Prie pour ceux qui ont été blessés par des paroles prononcées au nom de Dieu, afin qu'ils trouvent sécurité et vérité."),
    ],
    selfPrompt: L(
      'Have you ever said “I feel led” to end a discussion or get your way? Bring that honestly to God.',
      "T'est-il déjà arrivé de dire « je me sens conduit » pour clore une discussion ou obtenir ce que tu voulais ? Apporte-le honnêtement à Dieu.",
    ),
    practice: L(
      'Take one impression you wrote down and put it to four questions: Does it agree with Scripture? Does it look like Jesus? What do two mature believers think? What fruit would it bear?',
      "Reprends une impression notée et soumets-la à quatre questions : s'accorde-t-elle avec l'Écriture ? Ressemble-t-elle à Jésus ? Qu'en pensent deux croyants mûrs ? Quel fruit porterait-elle ?",
    ),
    safetyNote: L(
      'No one has the right to use “God told me” as leverage over you. A claim such as “God told me you must marry me” — or that you must give money, obey without question, keep a secret or accept being touched — is not consistent with the Spirit of Jesus, and you are free to say no. Praystead never gives personal prophecy; be very cautious with any word that predicts a marriage, a pregnancy, an illness, a death, money or political events. If you feel pressured or unsafe, talk to a pastor or a mature believer you trust, and in danger contact emergency services.',
      "Personne n'a le droit de se servir de « Dieu m'a dit » comme d'un moyen de pression sur toi. Une affirmation comme « Dieu m'a dit que tu dois m'épouser » — ou que tu dois donner de l'argent, obéir sans poser de questions, garder un secret ou accepter d'être touché — n'est pas conforme à l'Esprit de Jésus, et tu es libre de dire non. Praystead ne donne jamais de prophétie personnelle ; sois très prudent face à toute parole qui annonce un mariage, une grossesse, une maladie, un décès, de l'argent ou des événements politiques. Si tu te sens sous pression ou en danger, parles-en à un pasteur ou à un croyant mûr en qui tu as confiance, et en cas de danger, contacte les services d'urgence.",
    ),
    resourceTopics: ['discernment', 'prophecy', 'holy-spirit'],
  },
  {
    movement: 'walk',
    theme: { en: 'Obedience in small things', fr: "L'obéissance dans les petites choses", es: 'Obediencia en lo pequeño', pt: 'Obediência nas pequenas coisas', de: 'Gehorsam im Kleinen', ru: 'Послушание в малом', zh: '在小事上顺服', ja: '小さなことに従う', ko: '작은 일에 순종하라', ar: 'الطاعة في الأمور الصغيرة', fa: 'اطاعت در کارهای کوچک', hi: 'छोटी बातों में आज्ञाकारिता', id: 'Taat dalam perkara kecil', sw: 'Utii katika mambo madogo', tl: 'Pagsunod sa maliliit na bagay', am: 'በትንሽ ነገር መታዘዝ' },
    ref: 'Acts 8:26-40',
    related: ['Luke 16:10', 'James 1:22-25'],
    reflection: L(
      'Philip left a city full of joy for a desert road, and the Spirit’s leading narrowed to one man in one chariot. Philip ran, listened to the question the man was asking, and began from his Scripture to speak about Jesus. Luke tells this as history, not as a template for how every leading comes. Most of what the Spirit asks is already written plainly: love, forgive, tell the truth, be generous. Faithfulness there trains the ear for the rest.',
      "Philippe quitte une ville pleine de joie pour une route déserte, et la conduite de l'Esprit se resserre sur un seul homme, dans un seul char. Philippe court, écoute la question que cet homme se pose, et part de son texte de l'Écriture pour lui annoncer Jésus. Luc raconte un fait, non un modèle de la façon dont toute direction doit venir. L'essentiel de ce que l'Esprit demande est déjà écrit clairement : aimer, pardonner, dire la vérité, donner. La fidélité dans ces choses exerce l'oreille pour le reste.",
    ),
    prompts: [
      L('Ask the Spirit to show you one plain act of obedience you have been putting off.', "Demande à l'Esprit de te montrer un acte d'obéissance tout simple que tu repousses."),
      L('Thank God that He cares for one person at a time, as He did for the traveller on the desert road.', "Remercie Dieu de prendre soin de chaque personne, comme Il l'a fait pour le voyageur sur la route déserte."),
      L('Pray for readiness to notice the person in front of you today, and to listen before you speak.', "Prie pour être prêt à remarquer la personne qui se tient devant toi aujourd'hui, et à écouter avant de parler."),
    ],
    practice: L(
      'Do today the small, clear thing you already know to do — the apology, the call, the repayment, the kind word — without waiting for a feeling.',
      "Fais aujourd'hui la petite chose claire que tu sais déjà devoir faire — l'excuse, l'appel, le remboursement, le mot gentil — sans attendre d'en avoir envie.",
    ),
    resourceTopics: ['holy-spirit', 'discipleship', 'evangelism'],
  },

  // ── Movement 3 · Prayer, presence and transformation (days 11–14) ────────
  {
    movement: 'presence',
    theme: { en: 'The Spirit helps us pray', fr: "L'Esprit nous aide à prier", es: 'El Espíritu nos ayuda a orar', pt: 'O Espírito nos ajuda a orar', de: 'Der Geist hilft uns beten', ru: 'Дух помогает нам молиться', zh: '圣灵帮助我们祷告', ja: '聖霊は祈りを助けてくださる', ko: '성령께서 우리의 기도를 도우신다', ar: 'الروح يعيننا في الصلاة', fa: 'روح ما را در دعا یاری می‌کند', hi: 'आत्मा प्रार्थना में हमारी सहायता करता है', id: 'Roh menolong kita berdoa', sw: 'Roho hutusaidia kuomba', tl: 'Tinutulungan tayo ng Espiritu sa pananalangin', am: 'መንፈስ በጸሎት ይረዳናል' },
    ref: 'Romans 8:26-27',
    related: ['Romans 8:22-25', 'Ephesians 6:18-20'],
    reflection: L(
      'Paul places the Spirit’s help in the middle of groaning: creation groans, we groan, and the Spirit Himself intercedes for us with longings deeper than words. The help comes in our weakness, precisely when we do not know what to pray. You do not need polished words, the right mood or strong faith to begin. The Spirit prays in line with the will of God, and the Father who searches hearts understands Him.',
      "Paul situe l'aide de l'Esprit au milieu des gémissements : la création gémit, nous gémissons, et l'Esprit lui-même intercède pour nous par des soupirs plus profonds que les mots. Cette aide vient dans notre faiblesse, justement quand nous ne savons pas quoi demander. Tu n'as besoin ni de belles phrases, ni de la bonne disposition, ni d'une grande foi pour commencer. L'Esprit prie selon la volonté de Dieu, et le Père qui sonde les cœurs Le comprend.",
    ),
    prompts: [
      L('Tell God plainly where you do not know what to pray, and ask the Spirit to pray with you.', "Dis simplement à Dieu là où tu ne sais pas quoi prier, et demande à l'Esprit de prier avec toi."),
      L('Bring Him one burden without searching for the right words — a sigh is enough to start.', 'Apporte-Lui un fardeau sans chercher les bons mots : un soupir suffit pour commencer.'),
      L('Pray for someone who is too weary to pray, trusting the Spirit’s intercession for them.', "Prie pour quelqu'un qui est trop épuisé pour prier, en te confiant dans l'intercession de l'Esprit pour lui."),
    ],
    practice: L(
      'Set a timer for ten minutes and pray about one situation without rushing to a request. When words run out, stay quiet before Him.',
      'Mets un minuteur sur dix minutes et prie pour une seule situation sans te précipiter vers une demande. Quand les mots manquent, reste en silence devant Lui.',
    ),
    resourceTopics: ['prayer', 'holy-spirit', 'intercession'],
  },
  {
    movement: 'presence',
    theme: { en: 'Praying in the Spirit', fr: "Prier par l'Esprit", es: 'Orar en el Espíritu', pt: 'Orar no Espírito', de: 'Im Geist beten', ru: 'Молиться Духом', zh: '在圣灵里祷告', ja: '御霊によって祈る', ko: '성령 안에서 기도하라', ar: 'الصلاة بالروح', fa: 'دعا در روح', hi: 'आत्मा में प्रार्थना करना', id: 'Berdoa dalam Roh', sw: 'Kuomba katika Roho', tl: 'Manalangin sa Espiritu', am: 'በመንፈስ መጸለይ' },
    ref: '1 Corinthians 14:13-19',
    related: ['1 Corinthians 12:27-31', 'Jude 1:20-21', 'John 4:23-24'],
    reflection: L(
      'Paul says he speaks in tongues more than all the Corinthians, and he values that prayer; yet in the church he would rather say a few words everyone understands. His rule is to pray with the spirit and with the mind as well. Pentecostal and charismatic Christians treasure tongues as a gift for prayer and worship, as Paul did. Yet when he lists the church’s gifts, he also asks whether all speak in tongues, and the expected answer is no. Whatever your gifts, you can pray in the Spirit: honestly, dependently, in spirit and in truth.',
      "Paul dit qu'il parle en langues plus que tous les Corinthiens, et il tient à cette prière ; pourtant, dans l'Église, il préfère dire quelques mots que chacun comprend. Sa règle : prier avec l'esprit, et prier aussi avec l'intelligence. Les chrétiens pentecôtistes et charismatiques chérissent le parler en langues comme un don pour la prière et l'adoration, à l'exemple de Paul. Mais quand il énumère les dons dans l'Église, il demande aussi si tous parlent en langues, et la réponse attendue est non. Quels que soient tes dons, tu peux prier par l'Esprit : avec franchise, avec dépendance, en esprit et en vérité.",
    ),
    prompts: [
      L('Ask the Spirit to help you pray with your whole self — with your spirit and with your understanding.', "Demande à l'Esprit de t'aider à prier de tout ton être : avec ton esprit et avec ton intelligence."),
      L('Thank God for the ways He has given you to pray, without comparing your gifts with anyone else’s.', "Remercie Dieu pour les manières de prier qu'Il t'a données, sans comparer tes dons à ceux des autres."),
      L('If you long for more of the Spirit’s gifts in prayer, ask the Father simply and leave the answer with Him.', "Si tu désires davantage des dons de l'Esprit dans la prière, demande-le simplement au Père, et laisse-Lui la réponse."),
    ],
    practice: L(
      'Pray today for one situation in your own words, then spend a few minutes simply worshipping — in your own language or, if you have received the gift, in tongues.',
      "Prie aujourd'hui pour une situation avec tes propres mots, puis prends quelques minutes pour simplement adorer — dans ta langue ou, si tu as reçu ce don, en langues.",
    ),
    safetyNote: L(
      'Speaking in tongues is not a measure of your worth, your faith or the Spirit’s presence in you — everyone who belongs to Christ has the Spirit. No one should pressure you, shame you or coach you to copy sounds. The Spirit gives gifts as He chooses; no technique produces them. If a group leaves you feeling like a second-class Christian, talk it through with a pastor you trust.',
      "Parler en langues n'est pas la mesure de ta valeur, de ta foi ni de la présence de l'Esprit en toi : quiconque appartient à Christ a l'Esprit. Personne ne doit te mettre la pression, te faire honte ou t'apprendre à imiter des sons. L'Esprit accorde les dons comme Il le veut ; aucune technique ne les produit. Si un groupe te donne l'impression d'être un chrétien de seconde zone, parles-en avec un pasteur de confiance.",
    ),
    resourceTopics: ['prayer', 'spirit-baptism', 'spiritual-gifts', 'worship'],
  },
  {
    movement: 'presence',
    theme: { en: 'The love of God poured into our hearts', fr: "L'amour de Dieu répandu dans nos cœurs", es: 'El amor de Dios derramado en nuestros corazones', pt: 'O amor de Deus derramado em nosso coração', de: 'Gottes Liebe, ausgegossen in unsere Herzen', ru: 'Божья любовь, излитая в наши сердца', zh: '神的爱浇灌在我们心里', ja: '心に注がれた神様の愛', ko: '우리 마음에 부어진 하나님의 사랑', ar: 'محبة الله المنسكبة في قلوبنا', fa: 'محبت خدا که در دل‌های ما ریخته شده', hi: 'हमारे हृदयों में उंडेला गया परमेश्वर का प्रेम', id: 'Kasih Allah dicurahkan dalam hati kita', sw: 'Upendo wa Mungu umemiminwa mioyoni mwetu', tl: 'Ang pag-ibig ng Diyos na ibinuhos sa ating puso', am: 'በልባችን የፈሰሰው የእግዚአብሔር ፍቅር' },
    ref: 'Romans 5:1-5',
    related: ['Psalm 63:1-8', 'Ephesians 3:14-19'],
    reflection: L(
      'Paul speaks of God’s love poured into our hearts through the Holy Spirit — in a paragraph about suffering, endurance and hope. The pouring is something God has done, not a mood you must keep up. Some days His love will feel near and warm; other days prayer will feel dry, as it did for David in a weary land. God’s presence is not measured by how strongly you sense it. In dry seasons, keep coming: the love was poured out before you ever felt it.',
      "Paul parle de l'amour de Dieu répandu dans nos cœurs par le Saint-Esprit — dans un passage consacré à la souffrance, à la persévérance et à l'espérance. Ce don est une chose que Dieu a faite, non un état d'âme que tu devrais entretenir. Certains jours, son amour te semblera proche et chaleureux ; d'autres jours, la prière sera sèche, comme pour David dans une terre aride. La présence de Dieu ne se mesure pas à l'intensité avec laquelle tu la ressens. Dans les saisons de sécheresse, continue de venir : l'amour a été répandu avant même que tu le ressentes.",
    ),
    prompts: [
      L('Thank God that His love for you rests on what Christ has done, not on how you feel today.', "Remercie Dieu : son amour pour toi repose sur ce que Christ a fait, non sur ce que tu ressens aujourd'hui."),
      L('If prayer feels dry, tell Him so honestly, as David did, and ask for the grace to keep seeking Him.', 'Si la prière te paraît sèche, dis-le-Lui franchement, comme David, et demande la grâce de continuer à Le chercher.'),
      L('Ask the Spirit to strengthen you inwardly to grasp how wide and deep the love of Christ is.', "Demande à l'Esprit de te fortifier intérieurement pour saisir la largeur et la profondeur de l'amour de Christ."),
    ],
    practice: L(
      'Write down three ways God has shown you His love in the past — including in a hard season — and read them again the next time prayer feels empty.',
      'Note trois manières dont Dieu t’a montré son amour par le passé — y compris dans une période difficile — et relis-les la prochaine fois que la prière te semblera vide.',
    ),
    safetyNote: L(
      'Spiritual dryness is common and is not a sign of failure. If a long season of feeling nothing comes with persistent low mood, changes in sleep or appetite, or thoughts of harming yourself, please also speak to a doctor or counsellor — and if you are in immediate danger, contact emergency services.',
      "La sécheresse spirituelle est fréquente et n'est pas un signe d'échec. Si une longue période où tu ne ressens rien s'accompagne d'une tristesse persistante, de troubles du sommeil ou de l'appétit, ou de pensées de te faire du mal, parles-en aussi à un médecin ou à un conseiller — et si tu es en danger immédiat, contacte les services d'urgence.",
    ),
    resourceTopics: ['holy-spirit', 'suffering', 'prayer'],
  },
  {
    movement: 'presence',
    theme: { en: 'From glory to glory', fr: 'De gloire en gloire', es: 'De gloria en gloria', pt: 'De glória em glória', de: 'Von Herrlichkeit zu Herrlichkeit', ru: 'От славы в славу', zh: '荣上加荣', ja: '栄光から栄光へ', ko: '영광에서 영광으로', ar: 'من مجد إلى مجد', fa: 'از جلال به جلال', hi: 'महिमा से महिमा तक', id: 'Dari kemuliaan kepada kemuliaan', sw: 'Kutoka utukufu hadi utukufu', tl: 'Mula sa kaluwalhatian tungo sa kaluwalhatian', am: 'ከክብር ወደ ክብር' },
    ref: '2 Corinthians 3:12-18',
    related: ['Romans 8:1-4', 'Philippians 2:12-13'],
    reflection: L(
      'Moses veiled his face so that Israel would not watch a fading glory. Paul says that in Christ the veil is removed, and all of us, looking on the Lord’s glory, are being changed into His likeness — gradually, from one degree of glory to the next. Change comes by beholding rather than straining, and it is the Spirit who brings it about. When He convicts you of sin, it is to free you, not to condemn you: in Christ there is no condemnation.',
      "Moïse voilait son visage pour qu'Israël ne voie pas une gloire qui s'effaçait. Paul dit qu'en Christ le voile est ôté et que nous tous, contemplant la gloire du Seigneur, sommes transformés à son image — progressivement, de gloire en gloire. Le changement vient de la contemplation plutôt que de l'effort crispé, et c'est l'Esprit qui l'opère. Quand Il te convainc de péché, c'est pour te libérer, non pour te condamner : en Christ, il n'y a aucune condamnation.",
    ),
    prompts: [
      L('Take a few moments simply to look at Jesus — His kindness, His holiness — and worship Him.', 'Prends quelques instants pour simplement contempler Jésus — sa bonté, sa sainteté — et adore-Le.'),
      L('Ask the Spirit to convict you where you need to change, and receive it as kindness, not accusation.', "Demande à l'Esprit de te convaincre là où tu as besoin de changer, et reçois-le comme une bonté, non comme une accusation."),
      L('Thank Him for one way He has already changed you, however small.', "Remercie-Le pour une manière dont Il t'a déjà changé, même minime."),
    ],
    practice: L(
      'Confess one specific sin to God today, receive His forgiveness and, if it hurt someone, take one step to make it right.',
      "Confesse aujourd'hui un péché précis à Dieu, reçois son pardon et, s'il a blessé quelqu'un, fais un pas pour réparer.",
    ),
    resourceTopics: ['holiness', 'repentance', 'spiritual-formation'],
  },

  // ── Movement 4 · Fruit and gifts (days 15–17) ────────────────────────────
  {
    movement: 'fruitGifts',
    theme: { en: 'The fruit of His presence', fr: 'Le fruit de sa présence', es: 'El fruto de su presencia', pt: 'O fruto da sua presença', de: 'Die Frucht seiner Gegenwart', ru: 'Плод Его присутствия', zh: '圣灵同在的果子', ja: '聖霊の臨在が結ぶ実', ko: '성령의 임재가 맺는 열매', ar: 'ثمر حضوره', fa: 'ثمرهٔ حضور او', hi: 'उसकी उपस्थिति का फल', id: 'Buah hadirat-Nya', sw: 'Tunda la uwepo wake', tl: 'Ang bunga ng Kanyang presensya', am: 'የመገኘቱ ፍሬ' },
    ref: 'Galatians 5:19-23',
    related: ['John 15:4-8'],
    reflection: L(
      'Paul lists the works of the flesh — many, scattered, destructive — and then speaks of the fruit of the Spirit, a single harvest with many flavours. Fruit is not manufactured; it grows where a branch stays joined to the vine, and it grows slowly. The first mark Paul names is love, not intensity. The clearest sign of the Spirit’s presence in your life may be the patience and kindness others notice long before you do.',
      "Paul énumère les œuvres de la chair — nombreuses, dispersées, destructrices — puis parle du fruit de l'Esprit : une seule récolte aux multiples saveurs. Un fruit ne se fabrique pas ; il pousse là où le sarment reste attaché au cep, et il pousse lentement. La première marque que Paul nomme, c'est l'amour, non l'intensité. Le signe le plus clair de la présence de l'Esprit dans ta vie sera peut-être la patience et la bonté que d'autres remarquent bien avant toi.",
    ),
    prompts: [
      L('Read the fruit list slowly and ask the Spirit to grow in you the quality you most lack.', "Relis lentement la liste du fruit et demande à l'Esprit de faire grandir en toi la qualité qui te manque le plus."),
      L('Confess one work of the flesh that has shown up in your words or reactions this week.', "Confesse une œuvre de la chair qui s'est manifestée cette semaine dans tes paroles ou tes réactions."),
      L('Ask Jesus to keep you joined to Him, like a branch to the vine, through the ordinary hours of today.', "Demande à Jésus de te garder attaché à Lui, comme le sarment au cep, tout au long des heures ordinaires d'aujourd'hui."),
    ],
    practice: L(
      'Ask someone who knows you well which fruit of the Spirit they see growing in you, and which they would pray for. Thank God for their answer.',
      "Demande à quelqu'un qui te connaît bien quelle part du fruit de l'Esprit il voit grandir en toi, et laquelle il demanderait pour toi dans la prière. Remercie Dieu pour sa réponse.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'character', 'holy-spirit'],
  },
  {
    movement: 'fruitGifts',
    theme: { en: 'Gifts of the Spirit', fr: "Les dons de l'Esprit", es: 'Los dones del Espíritu', pt: 'Os dons do Espírito', de: 'Die Gaben des Geistes', ru: 'Дары Духа', zh: '圣灵的恩赐', ja: '御霊の賜物', ko: '성령의 은사', ar: 'مواهب الروح', fa: 'عطایای روح', hi: 'आत्मा के वरदान', id: 'Karunia-karunia Roh', sw: 'Karama za Roho', tl: 'Mga kaloob ng Espiritu', am: 'የመንፈስ ስጦታዎች' },
    ref: '1 Corinthians 12:4-13',
    related: ['Romans 12:3-8', 'Numbers 11:24-29', '1 Corinthians 14:1-5'],
    reflection: L(
      'Paul names wisdom, knowledge, faith, healing, miracles, prophecy, discernment, tongues and interpretation, then insists on two things: each gift is given for the common good, and the Spirit distributes them as He chooses. Gifts are not badges of maturity but tools for serving others. Prophecy, Paul says, strengthens, encourages and comforts, and it is always weighed. When Joshua wanted to stop others prophesying, Moses wished instead that all the Lord’s people had the Spirit — a longing Pentecost began to fulfil.',
      "Paul nomme la sagesse, la connaissance, la foi, les guérisons, les miracles, la prophétie, le discernement, les langues et leur interprétation, puis il insiste sur deux choses : chaque don est accordé pour le bien commun, et l'Esprit les distribue comme Il le veut. Les dons ne sont pas des insignes de maturité, mais des outils pour servir les autres. La prophétie, dit Paul, édifie, encourage et console, et elle est toujours examinée. Quand Josué voulait empêcher d'autres de prophétiser, Moïse souhaitait au contraire que tout le peuple du Seigneur reçoive l'Esprit — un désir que la Pentecôte a commencé d'exaucer.",
    ),
    prompts: [
      L('Thank the Spirit for the gifts you see in the believers around you, naming a few of them.', "Remercie l'Esprit pour les dons que tu vois chez les croyants qui t'entourent, en nommant quelques-uns d'entre eux."),
      L('Ask Him how you can serve the common good this week with what He has given you.', "Demande-Lui comment servir le bien commun cette semaine avec ce qu'Il t'a donné."),
      L('If you desire spiritual gifts, ask for them humbly, for the sake of others, and leave the choice to the Spirit.', "Si tu désires des dons spirituels, demande-les humblement, pour le bien des autres, et laisse le choix à l'Esprit."),
    ],
    practice: L(
      'Send a short note to someone whose gift has blessed you, and tell them specifically how.',
      "Envoie un petit mot à quelqu'un dont le don t'a béni, en lui disant précisément en quoi.",
    ),
    safetyNote: L(
      'Gifts of the Spirit never override Scripture, consent or care. Prayer for healing goes hand in hand with medical treatment — never stop a treatment because of a prophetic word. Be very cautious with anyone who charges money for a word, claims certainty about a marriage, a pregnancy, an illness, a death, finances or politics, or refuses to have their words weighed. Praystead does not give personal prophecy; weigh every word with Scripture and with mature leaders in your church.',
      "Les dons de l'Esprit ne passent jamais au-dessus de l'Écriture, du consentement ni des soins. La prière pour la guérison va de pair avec les traitements médicaux — n'arrête jamais un traitement à cause d'une parole prophétique. Sois très prudent envers quiconque fait payer une parole, prétend avoir une certitude sur un mariage, une grossesse, une maladie, un décès, des finances ou la politique, ou refuse que ses paroles soient examinées. Praystead ne donne pas de prophétie personnelle ; examine chaque parole à la lumière de l'Écriture et avec des responsables mûrs de ton Église.",
    ),
    resourceTopics: ['spiritual-gifts', 'prophecy', 'church'],
  },
  {
    movement: 'fruitGifts',
    theme: { en: 'Gifts without love are empty', fr: "Sans l'amour, les dons sont vides", es: 'Sin amor, los dones están vacíos', pt: 'Sem amor, os dons são vazios', de: 'Gaben ohne Liebe sind leer', ru: 'Дары без любви пусты', zh: '没有爱，恩赐就是空的', ja: '愛のない賜物はむなしい', ko: '사랑 없는 은사는 공허하다', ar: 'المواهب بلا محبة فارغة', fa: 'عطایا بدون محبت تهی‌اند', hi: 'प्रेम के बिना वरदान व्यर्थ हैं', id: 'Karunia tanpa kasih itu hampa', sw: 'Karama bila upendo ni bure', tl: 'Walang saysay ang kaloob kung walang pag-ibig', am: 'ፍቅር የሌለበት ስጦታ ከንቱ ነው' },
    ref: '1 Corinthians 13:1-7',
    related: ['1 Corinthians 13:8-13', '1 Corinthians 14:1'],
    reflection: L(
      'This chapter is often read at weddings, but Paul wrote it between two chapters about spiritual gifts, to a church rich in gifts and poor in love. Tongues, prophecy, knowledge and mountain-moving faith amount to nothing without love. Yet Paul does not tell them to abandon the gifts; he tells them to pursue love and eagerly desire the gifts. Love is not an alternative to the Spirit’s power. It is the way His power is meant to move.',
      "Ce chapitre est souvent lu aux mariages, mais Paul l'a écrit entre deux chapitres consacrés aux dons spirituels, pour une Église riche en dons et pauvre en amour. Les langues, la prophétie, la connaissance et une foi à déplacer les montagnes ne sont rien sans l'amour. Pourtant, Paul ne leur dit pas de renoncer aux dons ; il leur dit de rechercher l'amour et de désirer ardemment les dons. L'amour n'est pas une alternative à la puissance de l'Esprit. C'est la manière dont sa puissance est appelée à agir.",
    ),
    prompts: [
      L('Read the qualities of love slowly and ask the Spirit to show you where your service has lacked them.', "Relis lentement les qualités de l'amour et demande à l'Esprit de te montrer où ton service en a manqué."),
      L('Confess any way you have used a gift, a role or spiritual language to be seen rather than to serve.', 'Confesse toute manière dont tu as utilisé un don, une fonction ou un langage spirituel pour être vu plutôt que pour servir.'),
      L('Pray for your church, that its gifts would be used with patience and kindness toward the weakest.', "Prie pour ton Église, afin que ses dons s'exercent avec patience et bonté envers les plus fragiles."),
    ],
    practice: L(
      'Choose one person who is hard for you to love and do one patient, kind thing for them today, without mentioning it to anyone.',
      "Choisis une personne qu'il t'est difficile d'aimer et fais pour elle aujourd'hui une chose patiente et bienveillante, sans en parler à personne.",
    ),
    resourceTopics: ['spiritual-gifts', 'character', 'church'],
  },

  // ── Movement 5 · Power, community and daily fellowship (days 18–21) ──────
  {
    movement: 'power',
    theme: { en: 'Power to be a witness', fr: 'Une puissance pour être témoin', es: 'Poder para ser testigo', pt: 'Poder para ser testemunha', de: 'Kraft, Zeuge zu sein', ru: 'Сила быть свидетелем', zh: '得着能力作见证', ja: '証人となる力', ko: '증인이 되는 권능', ar: 'قوة لتكون شاهدًا', fa: 'قدرت برای شاهد بودن', hi: 'गवाह बनने की सामर्थ', id: 'Kuasa untuk menjadi saksi', sw: 'Nguvu ya kuwa shahidi', tl: 'Kapangyarihang maging saksi', am: 'ምስክር ለመሆን ኃይል' },
    ref: 'Acts 1:4-8',
    related: ['Acts 2:1-4', 'Acts 10:44-48', 'Luke 11:9-13'],
    reflection: L(
      'The disciples had walked with Jesus and seen Him risen, yet He told them to wait for the Father’s promise: power to be His witnesses to the ends of the earth. Pentecostal Christians understand this baptism in the Spirit as an empowering experience that can follow conversion, often with speaking in tongues, as in Acts 2, 10 and 19. Other Christians hold that every believer is baptised in the Spirit at conversion and then filled again and again, as in Acts 4:31. Both can agree: the Father gives the Spirit to those who ask, and the power is for witness, not status.',
      "Les disciples avaient marché avec Jésus et L'avaient vu ressuscité ; pourtant, Il leur demande d'attendre la promesse du Père : une puissance pour être ses témoins jusqu'aux extrémités de la terre. Les chrétiens pentecôtistes comprennent ce baptême dans le Saint-Esprit comme une expérience de puissance qui peut suivre la conversion, souvent accompagnée du parler en langues, comme en Actes 2, 10 et 19. D'autres chrétiens estiment que tout croyant est baptisé dans l'Esprit à sa conversion, puis rempli de nouveau, encore et encore, comme en Actes 4:31. Tous peuvent s'accorder : le Père donne l'Esprit à ceux qui le Lui demandent, et cette puissance sert le témoignage, non le prestige.",
    ),
    prompts: [
      L('Ask the Father, simply and as His child, to fill you with the Holy Spirit, and trust His goodness with how He answers.', "Demande au Père, simplement et comme son enfant, de te remplir du Saint-Esprit, et confie à sa bonté la manière dont Il répondra."),
      L('Pray for the boldness to speak of Jesus to one person in your life, with gentleness and respect.', "Prie pour avoir l'audace de parler de Jésus à une personne de ton entourage, avec douceur et respect."),
      L('Pray for believers who understand Spirit baptism differently from you, that you would honour one another.', "Prie pour les croyants qui comprennent le baptême dans l'Esprit autrement que toi, afin que vous vous honoriez les uns les autres."),
    ],
    practice: L(
      'Write down the name of one person who does not yet know Jesus, and pray for them by name each day this week.',
      'Note le nom d’une personne qui ne connaît pas encore Jésus, et prie pour elle par son nom chaque jour de cette semaine.',
    ),
    resourceTopics: ['spirit-baptism', 'evangelism', 'holy-spirit'],
  },
  {
    movement: 'power',
    theme: { en: 'The Spirit builds the church', fr: "L'Esprit bâtit l'Église", es: 'El Espíritu edifica la iglesia', pt: 'O Espírito edifica a igreja', de: 'Der Geist baut die Gemeinde', ru: 'Дух созидает Церковь', zh: '圣灵建造教会', ja: '聖霊は教会を建てる', ko: '성령께서 교회를 세우신다', ar: 'الروح يبني الكنيسة', fa: 'روح، کلیسا را بنا می‌کند', hi: 'आत्मा कलीसिया का निर्माण करता है', id: 'Roh membangun jemaat', sw: 'Roho hujenga kanisa', tl: 'Itinatayo ng Espiritu ang iglesya', am: 'መንፈስ ቤተ ክርስቲያንን ያንጻል' },
    ref: 'Acts 2:37-47',
    related: ['Acts 2:14-21', 'Ephesians 2:19-22', 'Ephesians 4:1-6'],
    reflection: L(
      'Pentecost did not produce a few spiritual heroes; it produced a table. Peter explained the outpouring through the promise in Joel — the Spirit on sons and daughters, young and old, servants too — and those who welcomed the message gave themselves to learning, sharing life, eating together and praying. Paul says believers are being built together into a dwelling place for God by the Spirit. No one grows in the Spirit apart from His people.',
      "La Pentecôte n'a pas produit quelques héros spirituels ; elle a produit une table. Pierre explique l'effusion par la promesse de Joël — l'Esprit sur les fils et les filles, les jeunes et les anciens, les serviteurs aussi — et ceux qui ont accueilli le message se sont consacrés à l'enseignement, au partage de la vie, aux repas en commun et à la prière. Paul dit que les croyants sont édifiés ensemble pour devenir une demeure de Dieu par l'Esprit. Personne ne grandit dans l'Esprit à l'écart de son peuple.",
    ),
    prompts: [
      L('Thank God for your local church, naming people through whom the Spirit has built you up.', "Remercie Dieu pour ton Église locale, en nommant des personnes par qui l'Esprit t'a fait grandir."),
      L('Pray for unity in your congregation, especially where there is tension or misunderstanding.', 'Prie pour l’unité dans ton assemblée, surtout là où il y a des tensions ou des malentendus.'),
      L('Ask the Spirit to show you your place among His people — where to give, to serve or simply to show up.', "Demande à l'Esprit de te montrer ta place dans son peuple : où donner, où servir, ou simplement où être présent."),
    ],
    practice: L(
      'Share a meal or a coffee with another believer this week, and end by praying for each other.',
      "Partage un repas ou un café avec un autre croyant cette semaine, et terminez en priant l'un pour l'autre.",
    ),
    resourceTopics: ['church', 'community', 'holy-spirit'],
  },
  {
    movement: 'power',
    theme: { en: 'Do not quench the Spirit', fr: "N'éteins pas l'Esprit", es: 'No apagues el Espíritu', pt: 'Não apague o Espírito', de: 'Lösch den Geist nicht aus', ru: 'Не угашай Духа', zh: '不要消灭圣灵的感动', ja: '御霊を消してはならない', ko: '성령을 소멸하지 말라', ar: 'لا تطفئ الروح', fa: 'روح را خاموش نکن', hi: 'आत्मा को मत बुझाओ', id: 'Jangan padamkan Roh', sw: 'Usimzimishe Roho', tl: 'Huwag patayin ang apoy ng Espiritu', am: 'መንፈስን አታጥፋ' },
    ref: '1 Thessalonians 5:16-24',
    related: ['Ephesians 4:29-32', '2 Timothy 1:6-7'],
    reflection: L(
      'In a few short lines Paul warns against quenching the Spirit and despising prophecy, and in the same breath tells the church to test everything and hold on to what is good. Both errors are possible: shutting down what God may be doing, and swallowing everything uncritically. Elsewhere he links grieving the Spirit with bitter, careless words and an unforgiving heart. The fire is more often dampened by ordinary unkindness and prayerlessness than by a lack of dramatic moments.',
      "En quelques lignes, Paul met en garde contre le fait d'éteindre l'Esprit et de mépriser les prophéties, et dans le même souffle il demande à l'Église de tout examiner et de retenir ce qui est bon. Les deux dérives sont possibles : étouffer ce que Dieu est peut-être en train de faire, et tout accepter sans discernement. Ailleurs, il relie le fait d'attrister l'Esprit aux paroles amères ou blessantes et au cœur qui refuse de pardonner. Le feu est plus souvent étouffé par la dureté ordinaire et le manque de prière que par l'absence de moments spectaculaires.",
    ),
    prompts: [
      L('Ask the Spirit to show you any bitterness, harsh speech or unforgiveness that grieves Him, and lay it down before Him.', "Demande à l'Esprit de te montrer toute amertume, toute parole dure ou tout refus de pardonner qui L'attriste, et dépose-les devant Lui."),
      L('Thank God for the gift He has placed in you, and ask Him to fan it into flame with power, love and self-control.', "Remercie Dieu pour le don qu'Il a placé en toi, et demande-Lui de le raviver avec puissance, amour et maîtrise de soi."),
      L('Pray for a heart that is both open to the Spirit and careful to test what claims to come from Him.', "Prie pour avoir un cœur à la fois ouvert à l'Esprit et attentif à éprouver ce qui prétend venir de Lui."),
    ],
    practice: L(
      'Forgive someone by name in prayer today and, if it is safe and wise, take one step toward peace with them.',
      "Pardonne aujourd'hui quelqu'un dans la prière, en le nommant, et, si c'est sûr et sage, fais un pas vers la paix avec lui.",
    ),
    safetyNote: L(
      'Paul’s warning against quenching the Spirit is never a reason to silence your questions or ignore your concerns. Disagreeing with a leader is not resisting the Spirit, and testing is exactly what this passage asks of you. If anyone uses the Spirit’s name to push you to give money, keep secrets, cut off your family or stay somewhere unsafe, speak to another trusted leader or a counsellor, and in danger contact emergency services.',
      "L'avertissement de Paul contre le fait d'éteindre l'Esprit n'est jamais une raison de faire taire tes questions ou d'ignorer tes inquiétudes. Être en désaccord avec un responsable, ce n'est pas résister à l'Esprit, et examiner les choses, c'est justement ce que ce passage te demande. Si quelqu'un se sert du nom de l'Esprit pour te pousser à donner de l'argent, à garder des secrets, à couper les liens avec ta famille ou à rester dans une situation dangereuse, parles-en à un autre responsable de confiance ou à un conseiller, et en cas de danger, contacte les services d'urgence.",
    ),
    resourceTopics: ['discernment', 'holy-spirit', 'forgiveness'],
  },
  {
    movement: 'power',
    theme: { en: 'Keep in step with the Spirit', fr: "Marcher au pas de l'Esprit", es: 'Andar al paso del Espíritu', pt: 'Andar no compasso do Espírito', de: 'Mit dem Geist Schritt halten', ru: 'Идти в ногу с Духом', zh: '与圣灵同步而行', ja: '御霊に歩調を合わせる', ko: '성령과 발맞추어 걸으라', ar: 'سِر على خطى الروح', fa: 'هم‌گام با روح', hi: 'आत्मा के साथ कदम मिलाकर चलो', id: 'Seirama dengan Roh', sw: 'Enenda sambamba na Roho', tl: 'Makisabay sa hakbang ng Espiritu', am: 'ከመንፈስ ጋር አብሮ መራመድ' },
    ref: 'Galatians 5:24-26',
    related: ['Ephesians 5:15-21', '2 Corinthians 13:14'],
    reflection: L(
      'Paul’s phrase pictures walking in line, one step after another, behind someone who leads. He follows it at once with a warning against conceit, provocation and envy: life in the Spirit shows in how we treat one another. In Ephesians, being filled with the Spirit is a continuing call whose marks are ordinary — songs, thanksgiving, mutual submission. There will be bright days and dry ones. Keeping in step means taking the next step with Him, not feeling the whole road at once.',
      "L'expression de Paul évoque une marche en rang, pas après pas, derrière celui qui conduit. Il enchaîne aussitôt sur une mise en garde contre la vanité, la provocation et l'envie : la vie dans l'Esprit se voit dans la manière dont nous nous traitons les uns les autres. En Éphésiens, être rempli de l'Esprit est un appel continu, aux signes ordinaires : des chants, l'action de grâces, la soumission mutuelle. Il y aura des jours lumineux et des jours arides. Marcher au pas de l'Esprit, c'est faire avec Lui le pas suivant, non ressentir toute la route d'un coup.",
    ),
    prompts: [
      L('Thank the Father, the Son and the Holy Spirit for their fellowship with you over these three weeks.', 'Remercie le Père, le Fils et le Saint-Esprit pour leur communion avec toi au cours de ces trois semaines.'),
      L('Ask to be filled with the Spirit again today, for the tasks and the people in front of you.', "Demande à être de nouveau rempli de l'Esprit aujourd'hui, pour les tâches et les personnes qui sont devant toi."),
      L('Commit to Jesus one habit of prayer, Scripture or fellowship you will keep, and ask for grace to persevere through dry days.', 'Confie à Jésus une habitude de prière, de lecture de la Bible ou de communion fraternelle que tu garderas, et demande la grâce de persévérer dans les jours arides.'),
    ],
    practice: L(
      'Choose one simple daily rhythm from this plan — welcoming the Spirit in the morning, a pause at midday, thanks at night — and write it where you will see it tomorrow.',
      "Choisis un rythme quotidien simple parmi ceux de ce parcours — accueillir l'Esprit le matin, une pause à midi, une action de grâces le soir — et écris-le là où tu le verras demain.",
    ),
    resourceTopics: ['holy-spirit', 'spiritual-rhythms', 'worship'],
  },
];
