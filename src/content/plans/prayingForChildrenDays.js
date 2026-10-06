// The 21 days of "Praying for Children & the Next Generation" (see
// ./prayingForChildren.js for the plan meta, the movements and the guardrails
// this content is held to).
//
// Each day brings children to God and then turns the same prayer back on the
// adult praying (`selfPrompt`, on every day): our own example, our own heart.
// Prompts pray FOR children, never for control over them.
// Prose is authored in en + fr; `theme` is authored in all 16 languages.
// Scripture is stored as references only — no Bible text lives in this file.
// `resourceTopics` always go through children / parenting / family-discipleship:
// in the relationships domain, broader tags (sexuality, singleness, friendship,
// identity, character, family, trust…) pull couples' and dating books onto the
// shelf. Day-specific tags are added only where they bring nothing adult.
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Belonging to God ───────────────────────────────────────────────────────
  {
    movement: 'belonging',
    theme: { en: 'Entrusted, not owned', fr: 'Confiés, non possédés', es: 'Confiados, no poseídos', pt: 'Confiados, não possuídos', de: 'Anvertraut, nicht besessen', ru: 'Доверены нам, а не принадлежат нам', zh: '是托付，不是占有', ja: '託されたもの、所有物ではない', ko: '소유가 아닌 맡기신 선물', ar: 'أمانة لا مُلك', fa: 'امانت، نه مِلک', hi: 'सौंपे गए, हमारी संपत्ति नहीं', id: 'Titipan, bukan milik', sw: 'Wamekabidhiwa, si mali yetu', tl: 'Ipinagkatiwala, hindi pag-aari', am: 'አደራ እንጂ ንብረት አይደሉም' },
    ref: 'Psalm 127',
    related: ['Genesis 33:5'],
    reflection: L(
      "Psalm 127 opens with builders and watchmen labouring in vain unless the LORD builds and guards. Only then does it call children a heritage from Him: an inheritance received, not a project achieved. Jacob, introducing his family to Esau, called them the children God had graciously given him. Whether the children you carry are your own, your grandchildren, godchildren or the young people of your church, they belong to God first. You are a steward of their days, not the owner of their future.",
      "Le Psaume 127 s'ouvre sur des bâtisseurs et des sentinelles qui peinent en vain si l'Éternel ne bâtit pas et ne garde pas. C'est seulement ensuite qu'il appelle les enfants un héritage qui vient de Lui : un don reçu, non un projet réussi. Présentant sa famille à Ésaü, Jacob parlait des enfants que Dieu lui avait accordés par grâce. Que les enfants que tu portes dans la prière soient les tiens, tes petits-enfants, tes filleuls ou les jeunes de ton Église, ils appartiennent d'abord à Dieu. Ils te sont confiés ; leur avenir ne t'appartient pas.",
    ),
    prompts: [
      L('Thank God by name for each child you are carrying in prayer, as a gift He has entrusted rather than a reward you earned.', "Remercie Dieu nommément pour chaque enfant que tu portes dans la prière : un don qu'Il t'a confié, non une récompense que tu aurais méritée."),
      L('Ask the Lord to build what you cannot build and to watch over what you cannot guard.', 'Demande au Seigneur de bâtir ce que tu ne peux pas bâtir, et de garder ce que tu ne peux pas garder.'),
      L("Pray that each of these children would one day know that they belong to God, not to anyone's plans for them.", "Prie pour que chacun de ces enfants sache un jour qu'il appartient à Dieu, et non aux projets que d'autres font pour lui."),
    ],
    selfPrompt: L(
      "Where have you been toiling anxiously, as if a child's future rested on you alone? The same psalm says God gives sleep to those He loves. Hand that weight back to Him.",
      "Où t'es-tu épuisé d'inquiétude, comme si l'avenir d'un enfant reposait sur toi seul ? Le même psaume dit que Dieu donne le sommeil à ceux qu'Il aime. Rends-Lui ce poids.",
    ),
    practice: L(
      'Write the names of the children you will carry through these 21 days on a card, and keep it where you pray.',
      "Écris sur une carte le prénom des enfants que tu porteras pendant ces 21 jours, et garde-la là où tu pries.",
    ),
    resourceTopics: ['children', 'parenting'],
  },
  {
    movement: 'belonging',
    theme: { en: 'Brought to Jesus', fr: 'Amenés à Jésus', es: 'Traídos a Jesús', pt: 'Levados a Jesus', de: 'Zu Jesus gebracht', ru: 'Приведённые к Иисусу', zh: '带到耶稣面前', ja: 'イエス様のもとへ', ko: '예수님께 데려오라', ar: 'إحضارهم إلى يسوع', fa: 'آوردن آنها نزد عیسی', hi: 'यीशु के पास लाए गए', id: 'Dibawa kepada Yesus', sw: 'Kuwaleta kwa Yesu', tl: 'Dalhin sila kay Jesus', am: 'ወደ ኢየሱስ ማምጣት' },
    ref: 'Mark 10:13-16',
    related: ['Luke 18:15-17'],
    reflection: L(
      "People kept bringing children to Jesus, and the disciples kept turning them away, sure He had more important work. Mark says Jesus was indignant. He took the children in His arms, laid His hands on them and blessed them; Luke adds that some were babies, too young to understand anything, yet not too young to be blessed. Praying for a child is this same movement: bringing them to Jesus, and letting nothing, not even our own busyness, stand in the way.",
      "On amenait des enfants à Jésus, et les disciples les repoussaient, persuadés que le Maître avait mieux à faire. Marc dit que Jésus s'indigna. Il prit les enfants dans Ses bras, posa les mains sur eux et les bénit ; Luc précise que certains étaient des nourrissons, trop petits pour comprendre quoi que ce soit, mais pas trop petits pour être bénis. Prier pour un enfant, c'est ce même geste : l'amener à Jésus, sans laisser rien ni personne, pas même nos agendas chargés, lui barrer le chemin.",
    ),
    prompts: [
      L('Bring each child to Jesus by name, and ask Him to hold them and bless them.', 'Amène chaque enfant à Jésus en le nommant, et demande-Lui de le prendre dans Ses bras et de le bénir.'),
      L('Ask the Lord to remove whatever in your home or church makes it harder for children to come to Him.', "Demande au Seigneur d'ôter ce qui, dans ton foyer ou ton Église, rend plus difficile aux enfants de venir à Lui."),
      L('Pray for children in your church and neighbourhood who have no one bringing them to Jesus.', "Prie pour les enfants de ton Église ou de ton quartier que personne n'amène à Jésus."),
    ],
    selfPrompt: L(
      'Jesus says the kingdom must be received like a little child. Come to Him today with nothing to prove, and let Him bless you too.',
      "Jésus dit qu'il faut recevoir le Royaume comme un petit enfant. Viens à Lui aujourd'hui sans rien avoir à prouver, et laisse-Le te bénir, toi aussi.",
    ),
    practice: L(
      "Speak a short blessing over one child today, openly and with their parents' knowledge, or write it down and pray it over them tonight.",
      "Prononce aujourd'hui une courte bénédiction sur un enfant, ouvertement et au su de ses parents, ou écris-la et prie-la pour lui ce soir.",
    ),
    resourceTopics: ['children', 'intercession'],
  },
  {
    movement: 'belonging',
    theme: { en: 'Known, made and loved', fr: 'Connus, formés et aimés', es: 'Conocidos, formados y amados', pt: 'Conhecidos, formados e amados', de: 'Gekannt, geschaffen, geliebt', ru: 'Знаемы, сотворены, любимы', zh: '被认识、被造、被爱', ja: '知られ、造られ、愛されて', ko: '알려지고 지음받고 사랑받는', ar: 'معروفون ومخلوقون ومحبوبون', fa: 'شناخته، آفریده و محبوب', hi: 'जाने गए, रचे गए, प्रिय', id: 'Dikenal, dibentuk, dikasihi', sw: 'Wanajulikana, wameumbwa, wanapendwa', tl: 'Kilala, nilikha at minamahal', am: 'የታወቁ፣ የተፈጠሩ፣ የተወደዱ' },
    ref: 'Psalm 139:13-18',
    related: ['Psalm 139:1-6', '1 John 3:1-2'],
    reflection: L(
      "David marvels that God formed him in secret and saw his whole life before a single day of it had come. Every child you pray for is known like this, more fully than any parent, teacher or friend will ever know them, including the parts they hide. John goes further: in Christ, God calls people His own children. A child's worth does not rest on grades, looks, followers or our approval. It rests on being made and loved by God.",
      "David s'émerveille : Dieu l'a formé dans le secret et a vu toute sa vie avant qu'un seul de ses jours n'existe. Chaque enfant pour qui tu pries est connu ainsi, plus pleinement qu'aucun parent, enseignant ou ami ne le connaîtra jamais, y compris dans ce qu'il cache. Jean va plus loin : en Christ, Dieu appelle des hommes et des femmes Ses propres enfants. La valeur d'un enfant ne repose ni sur ses notes, ni sur son apparence, ni sur ses abonnés, ni sur notre approbation. Elle repose sur le fait d'avoir été créé et d'être aimé par Dieu.",
    ),
    prompts: [
      L('Praise God for the particular way He has made each child, in temperament, body and mind, including what you do not yet understand.', "Loue Dieu pour la manière particulière dont Il a formé chaque enfant, dans son tempérament, son corps et son intelligence, y compris ce que tu ne comprends pas encore."),
      L('Ask Him to root their sense of worth in His love rather than in comparison or performance.', "Demande-Lui d'enraciner leur valeur dans Son amour plutôt que dans la comparaison ou la performance."),
      L('Pray for any child who feels unseen or unwanted, that they would come to know they are known and loved by God.', "Prie pour tout enfant qui se sent invisible ou de trop, afin qu'il découvre qu'il est connu et aimé de Dieu."),
    ],
    selfPrompt: L(
      'Do you quietly measure a child, or yourself, by results? Receive again that God knew you before you had achieved anything.',
      "Mesures-tu en secret un enfant, ou toi-même, à ses résultats ? Reçois de nouveau cette vérité : Dieu t'a connu avant que tu aies accompli quoi que ce soit.",
    ),
    practice: L(
      'Tell one child today something you value in who they are, not in what they have done.',
      "Dis aujourd'hui à un enfant une chose que tu apprécies dans ce qu'il est, et non dans ce qu'il a fait.",
    ),
    resourceTopics: ['children', 'parenting'],
  },
  {
    movement: 'belonging',
    theme: { en: 'A faith of their own', fr: 'Une foi personnelle', es: 'Una fe propia', pt: 'Uma fé própria', de: 'Ein eigener Glaube', ru: 'Собственная вера', zh: '属于他们自己的信心', ja: '自分自身の信仰', ko: '자기 자신의 믿음', ar: 'إيمان خاص بهم', fa: 'ایمانی از آنِ خودشان', hi: 'उनका अपना विश्वास', id: 'Iman milik mereka sendiri', sw: 'Imani yao wenyewe', tl: 'Sariling pananampalataya', am: 'የራሳቸው እምነት' },
    ref: '2 Timothy 1:3-7',
    related: ['Acts 16:1', 'John 1:12-13'],
    reflection: L(
      "Paul says the sincere faith in Timothy lived first in his grandmother Lois and his mother Eunice, and now, he is convinced, in Timothy himself. Acts names only his mother as a believer; his father was a Greek. Faith can be lived in front of a child, but it cannot be inherited: John says God's children are born of God, not of human decision. So we pray and we live our faith honestly, and we leave the new birth to Him.",
      "Paul écrit que la foi sincère de Timothée a d'abord habité sa grand-mère Loïs et sa mère Eunice, et qu'elle l'habite maintenant, il en est persuadé, lui aussi. Les Actes ne présentent que sa mère comme croyante ; son père était grec. On peut vivre la foi sous les yeux d'un enfant, mais on ne peut pas la lui léguer : Jean dit que les enfants de Dieu naissent de Dieu, et non d'une volonté humaine. Alors nous prions, nous vivons notre foi avec honnêteté, et nous laissons la nouvelle naissance à Dieu.",
    ),
    prompts: [
      L('Pray that each child would come to know Jesus personally: freely, from the heart, and not only because the adults around them believe.', "Prie pour que chaque enfant connaisse Jésus personnellement : librement, de tout son cœur, et pas seulement parce que les adultes autour de lui croient."),
      L('Pray for children growing up where only one adult believes, or none, and for the grandparents and friends praying for them.', "Prie pour les enfants qui grandissent là où un seul adulte croit, ou aucun, et pour les grands-parents et les amis qui prient pour eux."),
      L('If a child you love does not yet believe, tell God honestly how that feels, and entrust their heart to Him.', "Si un enfant que tu aimes ne croit pas encore, dis honnêtement à Dieu ce que tu ressens, et confie-Lui son cœur."),
    ],
    selfPrompt: L(
      'What would a child learn about Jesus by watching your faith this week: its joy, its honesty, your failures and your repentance? Ask the Spirit to make it sincere.',
      "Qu'est-ce qu'un enfant apprendrait de Jésus en observant ta foi cette semaine : sa joie, son honnêteté, tes chutes et ta repentance ? Demande à l'Esprit de la rendre sincère.",
    ),
    practice: L(
      'Let a child see you pray today, at a meal or in a short prayer with them before school or bed.',
      "Laisse un enfant te voir prier aujourd'hui, à table ou par une courte prière avec lui avant l'école ou le coucher.",
    ),
    resourceTopics: ['family-discipleship', 'children', 'gospel'],
  },
  {
    movement: 'belonging',
    theme: { en: "Loving God's word", fr: 'Aimer la Parole de Dieu', es: 'Amar la Palabra de Dios', pt: 'Amar a Palavra de Deus', de: 'Gottes Wort lieben', ru: 'Любить Слово Божье', zh: '爱慕神的话语', ja: '神のみことばを愛する', ko: '하나님의 말씀을 사랑하라', ar: 'محبة كلمة الله', fa: 'دوست داشتن کلام خدا', hi: 'परमेश्वर के वचन से प्रेम', id: 'Mencintai firman Allah', sw: 'Kulipenda Neno la Mungu', tl: 'Pag-ibig sa Salita ng Diyos', am: 'የእግዚአብሔርን ቃል መውደድ' },
    ref: 'Deuteronomy 6:4-9',
    related: ['2 Timothy 3:14-17', 'Psalm 119:103-105'],
    reflection: L(
      "Before Moses tells parents to teach their children, he tells them to love the LORD with all their heart and to keep His words on their own hearts. Only then come the ordinary places: at home and on the road, at bedtime and at breakfast. Paul reminds Timothy that the Scriptures he had known since childhood could give him the wisdom that leads to salvation through faith in Christ. The aim is not a child who knows verses, but one who meets Jesus in them.",
      "Avant de dire aux parents d'enseigner leurs enfants, Moïse leur demande d'aimer l'Éternel de tout leur cœur et de garder Ses paroles dans leur propre cœur. Viennent ensuite les lieux ordinaires : à la maison et en chemin, au coucher et au lever. Paul rappelle à Timothée que les Écritures qu'il connaissait depuis l'enfance pouvaient lui donner la sagesse qui conduit au salut par la foi en Christ. Le but n'est pas un enfant qui connaît des versets, mais un enfant qui y rencontre Jésus.",
    ),
    prompts: [
      L('Ask God to give each child a love for Scripture, not as a rulebook, but as the place where they meet Jesus.', "Demande à Dieu de donner à chaque enfant l'amour de l'Écriture, non comme un règlement, mais comme le lieu où il rencontre Jésus."),
      L("Pray for the parents, grandparents and children's workers who open the Bible with children, that they would not lose heart.", "Prie pour les parents, les grands-parents et les moniteurs qui ouvrent la Bible avec des enfants, afin qu'ils ne se découragent pas."),
      L("Ask the Holy Spirit to bring back to a child's mind, at the right moment, what they have heard from His word.", "Demande au Saint-Esprit de rappeler à un enfant, au bon moment, ce qu'il a entendu de Sa Parole."),
    ],
    selfPrompt: L(
      "Are God's words on your own heart, or only on your list of things to teach? Ask Him to make His word sweet to you again.",
      "Les paroles de Dieu sont-elles dans ton propre cœur, ou seulement sur ta liste de choses à enseigner ? Demande-Lui de rendre Sa Parole de nouveau douce pour toi.",
    ),
    practice: L(
      'Read a short Bible passage with a child today, at a meal, in the car or at bedtime, and ask what they noticed first.',
      "Lis aujourd'hui un court passage biblique avec un enfant, à table, en voiture ou au coucher, et demande-lui ce qu'il a remarqué en premier.",
    ),
    resourceTopics: ['family-discipleship', 'children', 'parenting'],
  },

  // ── Character and wisdom ───────────────────────────────────────────────────
  {
    movement: 'character',
    theme: { en: 'Growing in every way', fr: 'Grandir en tout', es: 'Crecer en todo', pt: 'Crescer em tudo', de: 'In allem wachsen', ru: 'Расти во всём', zh: '在各方面成长', ja: 'あらゆる面で成長する', ko: '모든 면에서 자라가기', ar: 'النمو في كل شيء', fa: 'رشد در همه جنبه‌ها', hi: 'हर बात में बढ़ना', id: 'Bertumbuh dalam segala hal', sw: 'Kukua katika kila eneo', tl: 'Paglago sa lahat ng bagay', am: 'በሁሉ ነገር ማደግ' },
    ref: 'Luke 2:41-52',
    related: ['Luke 2:40', '1 Samuel 2:26'],
    reflection: L(
      "Luke says twice that the boy Jesus grew, in wisdom and in stature, in favour with God and with people, echoing what was said of the young Samuel. Between those two lines sits an anxious search: Mary and Joseph lost Him for three days and did not understand His answer. Growth is slow and touches the whole person: body, mind, faith and friendships. Even the parents of the one perfect child were sometimes puzzled; not understanding is not the same as failing.",
      "Luc dit deux fois que l'enfant Jésus grandissait, en sagesse et en stature, en grâce devant Dieu et devant les hommes, comme on l'avait dit du jeune Samuel. Entre ces deux phrases se trouve une recherche angoissée : Marie et Joseph L'ont perdu trois jours et n'ont pas compris Sa réponse. Grandir prend du temps et touche tout l'être : le corps, l'intelligence, la foi, les amitiés. Même les parents du seul enfant parfait ont parfois été déroutés ; ne pas comprendre n'est pas échouer.",
    ),
    prompts: [
      L('Pray for each child to grow in body, mind, faith and friendships, at the pace God gives rather than the pace we want.', "Prie pour que chaque enfant grandisse dans son corps, son intelligence, sa foi et ses amitiés, au rythme que Dieu donne et non à celui que nous voudrions."),
      L('Ask God for patience and understanding with a child who puzzles or worries you right now.', "Demande à Dieu de la patience et de l'intelligence envers un enfant qui te déroute ou t'inquiète en ce moment."),
      L('Pray for children living with illness, disability or delays, that they would be surrounded by patient love and good care.', "Prie pour les enfants qui vivent avec une maladie, un handicap ou un retard, afin qu'ils soient entourés d'un amour patient et de bons soins."),
    ],
    selfPrompt: L(
      "Mary treasured in her heart what she did not yet understand. What about a child's growth, or your own, do you need to hold before God without forcing an answer?",
      "Marie gardait dans son cœur ce qu'elle ne comprenait pas encore. Qu'y a-t-il dans la croissance d'un enfant, ou dans la tienne, que tu dois garder devant Dieu sans forcer de réponse ?",
    ),
    practice: L(
      'Ask one child a question today about something they are learning or enjoying, and listen to the whole answer.',
      "Pose aujourd'hui à un enfant une question sur ce qu'il apprend ou aime en ce moment, et écoute sa réponse jusqu'au bout.",
    ),
    resourceTopics: ['children', 'parenting'],
  },
  {
    movement: 'character',
    theme: { en: "Wisdom as God's gift", fr: 'La sagesse, don de Dieu', es: 'La sabiduría, don de Dios', pt: 'A sabedoria, dom de Deus', de: 'Weisheit als Gottes Geschenk', ru: 'Мудрость — дар Божий', zh: '智慧是神的恩赐', ja: '神様の賜物である知恵', ko: '하나님의 선물인 지혜', ar: 'الحكمة عطية من الله', fa: 'حکمت، هدیهٔ خدا', hi: 'बुद्धि परमेश्वर का वरदान', id: 'Hikmat, karunia Allah', sw: 'Hekima ni zawadi ya Mungu', tl: 'Karunungan, kaloob ng Diyos', am: 'ጥበብ የእግዚአብሔር ስጦታ' },
    ref: 'Proverbs 2:1-11',
    related: ['Proverbs 22:6', 'James 1:5'],
    reflection: L(
      "The father in Proverbs 2 urges his child to search for wisdom like hidden treasure, and then admits where it comes from: it is the LORD who gives wisdom. Parents and mentors can plead, teach and model; only God can give. That is also how to read the familiar saying about starting a child on the right way (Proverbs 22:6). It is a wise observation of how life usually goes, not an unconditional promise. A child's later choices are not a verdict on the adults who loved them.",
      "Le père de Proverbes 2 presse son enfant de chercher la sagesse comme un trésor caché, puis reconnaît d'où elle vient : c'est l'Éternel qui donne la sagesse. Parents et mentors peuvent supplier, enseigner, montrer l'exemple ; Dieu seul peut donner. C'est aussi ainsi qu'il faut lire le proverbe bien connu sur l'enfant qu'on instruit dès le départ dans la bonne voie (Proverbes 22). C'est une observation sage sur le cours habituel de la vie, non une promesse inconditionnelle. Les choix ultérieurs d'un enfant ne sont pas un verdict sur les adultes qui l'ont aimé.",
    ),
    prompts: [
      L('Ask God to give each child wisdom: a love for what is true and good, and the sense to choose it when no one is watching.', "Demande à Dieu de donner la sagesse à chaque enfant : l'amour de ce qui est vrai et bon, et le discernement de le choisir quand personne ne regarde."),
      L('Pray that they would learn to ask God for wisdom themselves, trusting that He gives generously and without reproach.', "Prie pour qu'ils apprennent à demander eux-mêmes la sagesse à Dieu, confiants qu'Il donne généreusement et sans reproche."),
      L("If you carry guilt about a child's path, bring it to God: confess what is yours, and lay down what is not.", "Si tu portes une culpabilité au sujet du chemin d'un enfant, apporte-la à Dieu : confesse ce qui t'appartient, et dépose ce qui ne t'appartient pas."),
    ],
    selfPrompt: L(
      'Where do you need wisdom today in how you speak to, guide or pray for a child? Ask for it plainly; James says God gives generously.',
      "Où as-tu besoin de sagesse aujourd'hui pour parler à un enfant, le guider ou prier pour lui ? Demande-la simplement : Jacques dit que Dieu donne généreusement.",
    ),
    practice: L(
      'Tell a child about one wise choice you are glad you made, and one you wish you had made, in words they can understand.',
      "Raconte à un enfant un choix sage que tu es content d'avoir fait, et un que tu regrettes de ne pas avoir fait, avec des mots à sa portée.",
    ),
    resourceTopics: ['wisdom', 'wisdom-literature', 'parenting'],
  },
  {
    movement: 'character',
    theme: { en: 'A guarded heart, a clear conscience', fr: 'Un cœur gardé, une conscience claire', es: 'Un corazón guardado, una conciencia limpia', pt: 'Um coração guardado, uma consciência limpa', de: 'Ein behütetes Herz, ein reines Gewissen', ru: 'Хранимое сердце, чистая совесть', zh: '保守的心，无亏的良心', ja: '守られた心と清い良心', ko: '지켜진 마음, 깨끗한 양심', ar: 'قلب محفوظ وضمير صالح', fa: 'دلی محفوظ، وجدانی پاک', hi: 'सुरक्षित मन, शुद्ध विवेक', id: 'Hati yang terjaga, nurani yang murni', sw: 'Moyo uliolindwa, dhamiri safi', tl: 'Pusong iniingatan, malinis na budhi', am: 'የተጠበቀ ልብ፣ ንጹሕ ሕሊና' },
    ref: 'Proverbs 4:20-27',
    related: ['Acts 24:16', '1 Timothy 1:5'],
    reflection: L(
      "The father's picture in Proverbs 4 moves through the whole person: the heart to be guarded above all, then the mouth, the eyes and the feet. Integrity means that the inside and the outside match. Standing before a Roman governor, Paul said he worked to keep a clear conscience before God and people. Pray for children's consciences to be tender without being crushed: alert to what is wrong, yet sure of the forgiveness Christ gives, so that guilt sends them toward Him instead of into hiding.",
      "Dans Proverbes 4, le père passe en revue toute la personne : le cœur, à garder plus que tout, puis la bouche, les yeux et les pieds. L'intégrité, c'est quand l'intérieur et l'extérieur s'accordent. Devant un gouverneur romain, Paul affirmait s'efforcer d'avoir une conscience sans reproche devant Dieu et devant les hommes. Prie pour que la conscience des enfants soit sensible sans être écrasée : éveillée à ce qui est mal, mais sûre du pardon que Christ donne, afin que la culpabilité les pousse vers Lui plutôt qu'à se cacher.",
    ),
    prompts: [
      L('Pray that each child would be the same person in private as in public, online as well as offline.', "Prie pour que chaque enfant soit la même personne en privé et en public, en ligne comme hors ligne."),
      L('Ask God to keep their conscience tender, and to free any child who lives with heavy, anxious guilt.', "Demande à Dieu de garder leur conscience sensible, et de libérer tout enfant qui vit avec une culpabilité lourde et anxieuse."),
      L('Pray that when they do wrong, they would run toward Jesus and toward safe adults rather than hide.', "Prie pour que, lorsqu'ils font le mal, ils courent vers Jésus et vers des adultes de confiance plutôt que de se cacher."),
    ],
    selfPrompt: L(
      'Is there a gap between the person children see and the person you are in private? Bring it to Christ without shame, and receive His cleansing.',
      "Y a-t-il un écart entre la personne que les enfants voient et celle que tu es en privé ? Apporte-le à Christ sans honte, et reçois Sa purification.",
    ),
    practice: L(
      'The next time a child owns up to something, thank them for telling the truth before you deal with what they did.',
      "La prochaine fois qu'un enfant avoue une faute, remercie-le d'avoir dit la vérité avant de parler de ce qu'il a fait.",
    ),
    resourceTopics: ['children', 'holiness'],
  },
  {
    movement: 'character',
    theme: { en: 'Honour and gentleness at home', fr: 'Honneur et douceur à la maison', es: 'Honra y ternura en casa', pt: 'Honra e mansidão em casa', de: 'Ehre und Sanftmut zu Hause', ru: 'Почтение и кротость в доме', zh: '家中的尊重与温柔', ja: '家庭での敬いと優しさ', ko: '가정 안의 공경과 온유', ar: 'الإكرام واللطف في البيت', fa: 'احترام و ملایمت در خانه', hi: 'घर में आदर और नम्रता', id: 'Hormat dan kelembutan di rumah', sw: 'Heshima na upole nyumbani', tl: 'Paggalang at kahinahunan sa tahanan', am: 'በቤት ውስጥ ክብርና የዋህነት' },
    ref: 'Ephesians 6:1-4',
    related: ['Colossians 3:20-21', 'Proverbs 1:8-9'],
    reflection: L(
      "Paul speaks to children directly, as members of the church who would hear his letter read aloud. He asks them to obey and honour their parents, and in the same breath tells fathers not to exasperate their children but to bring them up in the Lord's training and instruction. Colossians gives the reason: so that they do not lose heart. Honour is meant to flow both ways. A home can be firm and still be a place where no child is crushed.",
      "Paul s'adresse directement aux enfants, comme à des membres de l'Église qui entendraient sa lettre lue à voix haute. Il leur demande d'obéir à leurs parents et de les honorer et, dans le même souffle, il demande aux pères de ne pas irriter leurs enfants, mais de les élever en les formant et en les instruisant selon le Seigneur. Colossiens en donne la raison : afin qu'ils ne se découragent pas. L'honneur est appelé à circuler dans les deux sens. Un foyer peut être ferme et rester un lieu où aucun enfant n'est écrasé.",
    ),
    prompts: [
      L('Pray that each child would learn to honour their parents and others in authority, from the heart rather than from fear.', "Prie pour que chaque enfant apprenne à honorer ses parents et ceux qui ont autorité sur lui, de bon cœur et non par peur."),
      L('Ask God to make the adults in their lives, including you, firm, fair and slow to provoke.', "Demande à Dieu de rendre les adultes qui les entourent, toi compris, fermes, justes et lents à les irriter."),
      L('Where a relationship between a parent and a child, young or grown, is strained or broken, pray for honesty, humility and, where it is safe, reconciliation.', "Là où la relation entre un parent et un enfant, petit ou adulte, est tendue ou rompue, prie pour l'honnêteté, l'humilité et, lorsque c'est sans danger, la réconciliation."),
    ],
    selfPrompt: L(
      'When did you last exasperate a child, with sarcasm, impatience or unfair demands? Confess it to God, and consider saying sorry to them.',
      "Quand as-tu irrité un enfant pour la dernière fois, par l'ironie, l'impatience ou des exigences injustes ? Confesse-le à Dieu, et envisage de lui demander pardon.",
    ),
    practice: L(
      'If you owe a child an apology, give it today: simply, specifically and without excuses.',
      "Si tu dois des excuses à un enfant, présente-les aujourd'hui : simplement, précisément et sans te justifier.",
    ),
    resourceTopics: ['parenting', 'family-discipleship'],
  },
  {
    movement: 'character',
    theme: { en: 'A compassionate heart', fr: 'Un cœur plein de compassion', es: 'Un corazón compasivo', pt: 'Um coração compassivo', de: 'Ein mitfühlendes Herz', ru: 'Сострадательное сердце', zh: '怜悯的心', ja: 'あわれみ深い心', ko: '긍휼히 여기는 마음', ar: 'قلب رحيم', fa: 'دلی پر از شفقت', hi: 'करुणामय हृदय', id: 'Hati yang berbelas kasihan', sw: 'Moyo wa huruma', tl: 'Pusong mahabagin', am: 'ርኅሩኅ ልብ' },
    ref: 'Colossians 3:12-17',
    related: ['Ephesians 4:26-32'],
    reflection: L(
      "Paul tells believers to clothe themselves with compassion, kindness, humility, gentleness and patience, but first he names who they already are: chosen by God, holy and dearly loved. Character grows out of belonging, not the other way round. Ephesians adds that anger is not in itself sin, yet it must not be left to fester. Pray for children to learn both: to feel deeply, name what they feel and bring it to God, and to notice and care for the hurting person beside them.",
      "Paul demande aux croyants de se revêtir de compassion, de bonté, d'humilité, de douceur et de patience, mais il nomme d'abord ce qu'ils sont déjà : choisis par Dieu, saints et bien-aimés. Le caractère naît de l'appartenance, et non l'inverse. Éphésiens ajoute que la colère n'est pas en elle-même un péché, mais qu'il ne faut pas la laisser s'installer. Prie pour que les enfants apprennent les deux : ressentir profondément, nommer ce qu'ils éprouvent et l'apporter à Dieu, et remarquer la personne qui souffre à côté d'eux pour en prendre soin.",
    ),
    prompts: [
      L('Pray that each child would know themselves chosen and dearly loved in Christ, and that compassion would grow from there.', "Prie pour que chaque enfant se sache choisi et bien-aimé en Christ, et que la compassion grandisse à partir de là."),
      L('Ask God to help them name their feelings, calm down after anger, and trust safe adults with what overwhelms them.', "Demande à Dieu de les aider à nommer leurs émotions, à s'apaiser après la colère, et à confier à des adultes de confiance ce qui les submerge."),
      L('Pray that they would notice the lonely, excluded or struggling child and find the courage to be kind.', "Prie pour qu'ils remarquent l'enfant seul, exclu ou en difficulté, et qu'ils trouvent le courage d'être bons envers lui."),
    ],
    selfPrompt: L(
      'Children learn emotional honesty by watching it. How do you handle your own anger and sadness in front of them? Ask the Spirit for gentleness.',
      "Les enfants apprennent l'honnêteté émotionnelle en l'observant. Comment vis-tu ta propre colère et ta tristesse devant eux ? Demande à l'Esprit la douceur.",
    ),
    practice: L(
      'Do one act of kindness together with a child today: a card, a visit or a meal for someone who needs it.',
      "Accomplis aujourd'hui, avec un enfant, un geste de bonté : une carte, une visite ou un repas pour quelqu'un qui en a besoin.",
    ),
    resourceTopics: ['children', 'parenting'],
  },

  // ── Relationships and protection ───────────────────────────────────────────
  {
    movement: 'relationships',
    theme: { en: 'Friends who strengthen faith', fr: 'Des amis qui fortifient la foi', es: 'Amigos que fortalecen la fe', pt: 'Amigos que fortalecem a fé', de: 'Freunde, die im Glauben stärken', ru: 'Друзья, укрепляющие веру', zh: '坚固信心的朋友', ja: '信仰を強める友', ko: '믿음을 세워 주는 친구', ar: 'أصدقاء يقوّون الإيمان', fa: 'دوستانی که ایمان را تقویت می‌کنند', hi: 'विश्वास को दृढ़ करने वाले मित्र', id: 'Sahabat yang menguatkan iman', sw: 'Marafiki wanaoimarisha imani', tl: 'Mga kaibigang nagpapatibay ng pananampalataya', am: 'እምነትን የሚያጸኑ ጓደኞች' },
    ref: '1 Samuel 23:15-18',
    related: ['Proverbs 13:20', 'Ecclesiastes 4:9-12'],
    reflection: L(
      "While Saul was hunting David in the wilderness, Jonathan, the king's own son and heir, went out to find him and helped him find strength in God. That friendship cost Jonathan something, and it pointed David beyond himself. Proverbs observes that we become like those we walk with. Pray for children to find friends like that and to be friends like that, and remember the child who has no close friend yet, for whom loneliness is a daily weight.",
      "Pendant que Saül traquait David dans le désert, Jonathan, le propre fils du roi et son héritier, alla le trouver et fortifia sa confiance en Dieu. Cette amitié coûtait quelque chose à Jonathan, et elle tournait David vers plus grand que lui. Les Proverbes observent qu'on devient semblable à ceux avec qui l'on marche. Prie pour que les enfants trouvent de tels amis et deviennent de tels amis, et souviens-toi de l'enfant qui n'a pas encore d'ami proche, pour qui la solitude pèse chaque jour.",
    ),
    prompts: [
      L("Pray by name for each child's friendships, that they would find at least one friend who strengthens their trust in God.", "Prie nommément pour les amitiés de chaque enfant, afin qu'il trouve au moins un ami qui fortifie sa confiance en Dieu."),
      L('Ask God to make them loyal, generous friends who include others rather than leave them out.', "Demande à Dieu d'en faire des amis loyaux et généreux, qui intègrent les autres au lieu de les exclure."),
      L('Pray for any child who is lonely, left out or bullied, and for an adult who will notice and step in.', "Prie pour tout enfant seul, mis à l'écart ou harcelé, et pour qu'un adulte le remarque et intervienne."),
    ],
    selfPrompt: L(
      'Who has been a Jonathan to you, and to whom are you one? Thank God for your friends, and ask Him to make you a friend who points others to Him.',
      "Qui a été un Jonathan pour toi, et pour qui en es-tu un ? Remercie Dieu pour tes amis, et demande-Lui de faire de toi un ami qui tourne les autres vers Lui.",
    ),
    practice: L(
      "Choose one simple way to welcome a child's friends, such as a meal, a game or a lift, and set a date for it today.",
      "Choisis aujourd'hui une manière simple d'accueillir les amis d'un enfant, comme un repas, un jeu ou un trajet en voiture, et fixe une date.",
    ),
    resourceTopics: ['children', 'parenting'],
  },
  {
    movement: 'relationships',
    theme: { en: 'Voices that point to God', fr: 'Des voix qui orientent vers Dieu', es: 'Voces que señalan a Dios', pt: 'Vozes que apontam para Deus', de: 'Stimmen, die auf Gott hinweisen', ru: 'Голоса, указывающие на Бога', zh: '指向神的声音', ja: '神様を指し示す声', ko: '하나님을 가리키는 목소리', ar: 'أصوات تشير إلى الله', fa: 'صداهایی که به خدا اشاره می‌کنند', hi: 'परमेश्वर की ओर ले जाने वाली आवाज़ें', id: 'Suara yang menunjuk kepada Allah', sw: 'Sauti zinazoelekeza kwa Mungu', tl: 'Mga tinig na tumuturo sa Diyos', am: 'ወደ እግዚአብሔር የሚያመለክቱ ድምጾች' },
    ref: '1 Samuel 3:1-10',
    related: ['2 Timothy 2:1-2', 'Titus 2:6-8'],
    reflection: L(
      "The boy Samuel served in the house of the LORD but did not yet know the LORD. When God called him in the night, he ran to Eli three times before the old priest understood what was happening and taught him how to answer. Eli was tired and far from perfect, yet he helped a child recognise God's call. Children need voices beyond their parents: teachers, coaches, youth leaders, grandparents, godparents and older believers who help them recognise God and respond to Him.",
      "Le jeune Samuel servait dans la maison de l'Éternel, mais il ne connaissait pas encore l'Éternel. Quand Dieu l'appela dans la nuit, il courut trois fois vers Éli avant que le vieux prêtre comprenne ce qui se passait et lui apprenne comment répondre. Éli était fatigué et loin d'être parfait ; il a pourtant aidé un enfant à reconnaître l'appel de Dieu. Les enfants ont besoin d'autres voix que celles de leurs parents : enseignants, entraîneurs, responsables de jeunes, grands-parents, parrains et marraines, croyants plus âgés qui les aident à reconnaître Dieu et à Lui répondre.",
    ),
    prompts: [
      L('Pray by name for the teachers, coaches and leaders who shape the children you love, asking for wisdom, patience and integrity.', "Prie nommément pour les enseignants, les entraîneurs et les responsables qui façonnent les enfants que tu aimes : sagesse, patience et intégrité."),
      L('Ask God to give each child at least one older believer, besides their parents, who helps them recognise and answer His voice.', "Demande à Dieu de donner à chaque enfant au moins un croyant plus âgé, en plus de ses parents, qui l'aide à reconnaître Sa voix et à y répondre."),
      L("Pray for your church's children's and youth workers, that they would be trustworthy, faithful and kept from burning out.", "Prie pour les moniteurs et les responsables de jeunesse de ton Église, afin qu'ils soient dignes de confiance, fidèles, et préservés de l'épuisement."),
    ],
    selfPrompt: L(
      'Could you be an Eli for someone: not perfect, but present enough to help a young person hear God? Ask Him whom you might encourage.',
      "Pourrais-tu être un Éli pour quelqu'un : pas parfait, mais assez présent pour aider un jeune à entendre Dieu ? Demande-Lui qui tu pourrais encourager.",
    ),
    practice: L(
      "Send a short note of thanks today to a teacher, coach or children's worker who has invested in a child you love.",
      "Envoie aujourd'hui un petit mot de remerciement à un enseignant, un entraîneur ou un moniteur qui s'est investi auprès d'un enfant que tu aimes.",
    ),
    resourceTopics: ['family-discipleship', 'children'],
  },
  {
    movement: 'relationships',
    theme: { en: 'Protecting the little ones', fr: 'Protéger les petits', es: 'Proteger a los pequeños', pt: 'Proteger os pequeninos', de: 'Die Kleinen schützen', ru: 'Защищать малых', zh: '保护这些小孩子', ja: '小さな者たちを守る', ko: '작은 자들을 보호하라', ar: 'حماية الصغار', fa: 'محافظت از کوچکان', hi: 'छोटों की रक्षा', id: 'Melindungi anak-anak kecil', sw: 'Kuwalinda wadogo', tl: 'Pag-iingat sa maliliit', am: 'ታናናሾችን መጠበቅ' },
    ref: 'Matthew 18:1-10',
    related: ['Psalm 82:3-4', 'Proverbs 31:8-9'],
    reflection: L(
      "When the disciples asked who was greatest, Jesus placed a child among them. Then He spoke some of His most severe words, about a millstone and the depths of the sea, against anyone who causes one of these little ones to stumble, and told His followers never to despise them, because their angels always see the Father's face. Jesus takes harm to children with the utmost seriousness. Scripture also calls God's people to defend the weak. Praying for a child's protection and acting to protect them belong together.",
      "Quand les disciples demandèrent qui était le plus grand, Jésus plaça un enfant au milieu d'eux. Puis Il prononça quelques-unes de Ses paroles les plus sévères, une meule et le fond de la mer, contre quiconque ferait tomber l'un de ces petits, et demanda à Ses disciples de ne jamais les mépriser, car leurs anges voient continuellement la face du Père. Jésus prend le mal fait aux enfants avec le plus grand sérieux. L'Écriture appelle aussi le peuple de Dieu à défendre le faible. Prier pour la protection d'un enfant et agir pour le protéger vont ensemble.",
    ),
    prompts: [
      L('Ask God to guard each child you love, in body, mind and soul, at home, at school, online and in church.', "Demande à Dieu de garder chaque enfant que tu aimes, dans son corps, son esprit et son âme, à la maison, à l'école, en ligne et à l'Église."),
      L('Pray for children who are being harmed right now, that they would be seen, believed and brought to safety.', "Prie pour les enfants qui subissent des violences en ce moment, afin qu'ils soient vus, crus et mis en sécurité."),
      L('Pray for everyone who protects children, from social workers and police to teachers and safeguarding leads, asking for courage and wisdom.', "Prie pour tous ceux qui protègent les enfants, travailleurs sociaux, policiers, enseignants, responsables de la protection de l'enfance : courage et sagesse."),
    ],
    selfPrompt: L(
      'Would a frightened child find you safe to talk to? Ask God to make you someone who listens, believes and acts.',
      "Un enfant effrayé trouverait-il en toi quelqu'un de sûr à qui parler ? Demande à Dieu de faire de toi quelqu'un qui écoute, qui croit et qui agit.",
    ),
    practice: L(
      "Find out today who your church's or school's safeguarding lead is, and how to contact them if you ever need to.",
      "Renseigne-toi aujourd'hui : qui est le responsable de la protection de l'enfance dans ton Église ou à l'école, et comment le joindre si un jour c'est nécessaire ?",
    ),
    safetyNote: L(
      "If you know or suspect that a child is being harmed or is at risk, prayer goes together with action. If a child is in immediate danger, call the police or emergency services now. Otherwise, contact your local child-protection services and, where a church, school or club is involved, its safeguarding lead, and follow their procedures. Do not confront the person you suspect, and do not record any details of a child's situation in this app.",
      "Si tu sais ou soupçonnes qu'un enfant subit des violences ou court un danger, la prière va de pair avec l'action. Si un enfant est en danger immédiat, appelle tout de suite la police ou les services d'urgence. Sinon, contacte les services de protection de l'enfance de ta région et, si une Église, une école ou un club est concerné, son responsable de la protection de l'enfance, et suis leurs procédures. Ne confronte pas la personne que tu soupçonnes, et n'inscris dans cette application aucun détail sur la situation d'un enfant.",
    ),
    resourceTopics: ['children', 'intercession'],
  },
  {
    movement: 'relationships',
    theme: { en: 'Purity without shame', fr: 'Une pureté sans honte', es: 'Pureza sin vergüenza', pt: 'Pureza sem vergonha', de: 'Reinheit ohne Scham', ru: 'Чистота без стыда', zh: '没有羞耻的纯洁', ja: '恥によらない純潔', ko: '수치심 없는 순결', ar: 'طهارة بلا خجل', fa: 'پاکی بدون شرم', hi: 'लज्जा के बिना पवित्रता', id: 'Kemurnian tanpa rasa malu', sw: 'Usafi bila aibu', tl: 'Kalinisan nang walang kahihiyan', am: 'ያለ ኀፍረት ንጽሕና' },
    ref: '1 Corinthians 6:18-20',
    related: ['Genesis 1:27-31', '1 Thessalonians 4:3-8'],
    reflection: L(
      "Genesis calls the human body, made male and female, very good. When Paul urges the Corinthians to flee sexual immorality, he grounds it not in disgust or fear but in worth: their bodies are temples of the Holy Spirit, bought at a price. Purity is meant to grow from belonging, not from shame. Pray that children would learn about their bodies and sexuality honestly, at a pace that fits their age, from people who love them, and that they would be protected from anyone who would exploit them.",
      "La Genèse déclare très bon le corps humain, créé homme et femme. Quand Paul exhorte les Corinthiens à fuir l'immoralité sexuelle, il ne s'appuie ni sur le dégoût ni sur la peur, mais sur la valeur : leur corps est le temple du Saint-Esprit, racheté à grand prix. La pureté est appelée à naître de l'appartenance, et non de la honte. Prie pour que les enfants découvrent leur corps et leur sexualité avec honnêteté, à un rythme adapté à leur âge, auprès de personnes qui les aiment, et qu'ils soient protégés de quiconque voudrait les exploiter.",
    ),
    prompts: [
      L("Thank God that He made our bodies good, and ask Him to give each child a healthy, unashamed respect for their own body and for other people's.", "Remercie Dieu d'avoir créé nos corps bons, et demande-Lui de donner à chaque enfant un respect sain et sans honte pour son propre corps et pour celui des autres."),
      L('Pray that they would feel free to ask questions about what they see and hear, and find trustworthy adults ready to listen.', "Prie pour qu'ils se sentent libres de poser des questions sur ce qu'ils voient et entendent, et qu'ils trouvent des adultes dignes de confiance, prêts à écouter."),
      L('Ask God to guard them from pornography, grooming and exploitation, and to surround with grace any child who already carries shame.', "Demande à Dieu de les protéger de la pornographie, des manipulations de prédateurs et de l'exploitation, et d'entourer de grâce tout enfant qui porte déjà de la honte."),
    ],
    selfPrompt: L(
      'What did you learn about your body and sexuality growing up, and does any shame still cling to it? Bring it to Christ, who cleanses and restores.',
      "Qu'as-tu appris sur ton corps et ta sexualité en grandissant, et une honte y reste-t-elle attachée ? Apporte-la à Christ, qui purifie et restaure.",
    ),
    practice: L(
      "If you are a parent or carer, prepare today a calm, truthful answer to a child's next question about bodies or relationships; if not, pray for a family facing these conversations.",
      "Si tu es parent ou si tu as la charge d'un enfant, prépare aujourd'hui une réponse calme et vraie à sa prochaine question sur le corps ou les relations ; sinon, prie pour une famille qui affronte ces conversations.",
    ),
    safetyNote: L(
      "If a child tells you about unwanted sexual contact, or you notice signs of grooming or exploitation, including online, stay calm, believe them and do not promise to keep it secret. Call the police or emergency services if they are in immediate danger; otherwise contact child-protection services or the relevant safeguarding lead. You do not need to investigate it yourself.",
      "Si un enfant te parle d'un contact sexuel non désiré, ou si tu remarques des signes de manipulation ou d'exploitation, y compris en ligne, reste calme, crois-le et ne lui promets pas de garder le secret. Appelle la police ou les services d'urgence s'il est en danger immédiat ; sinon, contacte les services de protection de l'enfance ou le responsable de la protection de l'enfance concerné. Tu n'as pas à mener l'enquête toi-même.",
    ),
    resourceTopics: ['children', 'parenting'],
  },
  {
    movement: 'relationships',
    theme: { en: 'Wise in a digital world', fr: 'Sages dans un monde numérique', es: 'Sabios en un mundo digital', pt: 'Sábios num mundo digital', de: 'Weise in einer digitalen Welt', ru: 'Мудрость в цифровом мире', zh: '在数码世界中有智慧', ja: 'デジタル世界での知恵', ko: '디지털 세상 속의 지혜', ar: 'حكماء في عالم رقمي', fa: 'حکمت در دنیای دیجیتال', hi: 'डिजिटल दुनिया में समझदारी', id: 'Bijak di dunia digital', sw: 'Hekima katika ulimwengu wa kidijitali', tl: 'Marunong sa digital na mundo', am: 'በዲጂታሉ ዓለም ጥበበኛ መሆን' },
    ref: 'Philippians 4:4-9',
    related: ['Ephesians 5:15-17'],
    reflection: L(
      "Paul's words about setting the mind on whatever is true and good come right after his call not to be anxious about anything but to pray. That order helps with screens and media: fear rarely makes a child wise. Phones, games and feeds can carry good things and harmful ones; children need adults who pray, set loving limits and talk openly. Paul also asks the Philippians to practise what they have seen in him. Our own habits teach more than our rules.",
      "Les paroles de Paul sur ce qui doit occuper nos pensées, tout ce qui est vrai et bon, viennent juste après son appel à ne s'inquiéter de rien, mais à prier. Cet ordre aide face aux écrans et aux médias : la peur rend rarement un enfant sage. Téléphones, jeux et fils d'actualité peuvent transmettre du bon comme du nuisible ; les enfants ont besoin d'adultes qui prient, posent des limites avec amour et parlent ouvertement. Paul demande aussi aux Philippiens de mettre en pratique ce qu'ils ont vu en lui. Nos propres habitudes enseignent plus que nos règles.",
    ),
    prompts: [
      L('Ask God to give each child wisdom and self-control with screens, and a growing taste for what is true and good.', "Demande à Dieu de donner à chaque enfant sagesse et maîtrise de soi face aux écrans, et un goût grandissant pour ce qui est vrai et bon."),
      L('Pray against the comparison, cruelty and endless scrolling that can wear children down, and for friendships that are real.', "Prie contre la comparaison, la cruauté et le défilement sans fin qui peuvent épuiser les enfants, et pour des amitiés bien réelles."),
      L('Pray for parents and carers deciding about phones and apps, that they would choose with wisdom and peace rather than panic.', "Prie pour les parents et les éducateurs qui prennent des décisions sur les téléphones et les applications, afin qu'ils choisissent avec sagesse et paix plutôt que dans la panique."),
    ],
    selfPrompt: L(
      'What would a child learn from watching your own screen habits this week? Ask the Spirit for self-control and for attention to the people in front of you.',
      "Qu'apprendrait un enfant en observant ton propre usage des écrans cette semaine ? Demande à l'Esprit la maîtrise de soi et l'attention aux personnes qui sont devant toi.",
    ),
    practice: L(
      'Put your phone away for one meal or conversation with a child today, and let them see you do it.',
      "Range ton téléphone pendant un repas ou une conversation avec un enfant aujourd'hui, et laisse-le te voir le faire.",
    ),
    resourceTopics: ['wisdom', 'parenting', 'family-discipleship'],
  },

  // ── Calling, faith and surrender ───────────────────────────────────────────
  {
    movement: 'calling',
    theme: { en: 'Courage under pressure', fr: 'Du courage sous la pression', es: 'Valentía bajo presión', pt: 'Coragem sob pressão', de: 'Mut unter Druck', ru: 'Мужество под давлением', zh: '在压力下的勇气', ja: '圧力の中での勇気', ko: '압박 속의 용기', ar: 'الشجاعة تحت الضغط', fa: 'شجاعت زیر فشار', hi: 'दबाव में साहस', id: 'Keberanian di bawah tekanan', sw: 'Ujasiri chini ya shinikizo', tl: 'Tapang sa gitna ng panggigipit', am: 'በጫና ውስጥ ድፍረት' },
    ref: 'Daniel 1:8-17',
    related: ['Daniel 1:3-7'],
    reflection: L(
      "Daniel and his friends were young men, probably still in their teens, taken far from home, given new names and trained for a foreign king's service. Daniel resolved not to defile himself with the king's food, yet he asked respectfully, proposed a ten-day test and took the official's fear seriously. Courage here is neither loud nor rude. The text says God gave these young men favour and understanding; it does not promise the same outcome to every young believer under pressure. Pray for conviction held with grace.",
      "Daniel et ses amis étaient de jeunes hommes, sans doute encore adolescents, emmenés loin de chez eux, rebaptisés et formés pour le service d'un roi étranger. Daniel résolut de ne pas se souiller avec les mets du roi ; pourtant, il demanda avec respect, proposa un essai de dix jours et prit au sérieux la peur du responsable. Le courage, ici, n'est ni bruyant ni insolent. Le texte dit que Dieu accorda à ces jeunes faveur et intelligence ; il ne garantit pas la même issue à tout jeune croyant sous pression. Prie pour des convictions portées avec grâce.",
    ),
    prompts: [
      L('Pray that each child would hold their convictions with courage and respect, even when it makes them stand out.', "Prie pour que chaque enfant tienne à ses convictions avec courage et respect, même quand cela le distingue des autres."),
      L("Ask God for wisdom for them to know when to stand firm and when to adapt; Daniel accepted a new name but drew a line at the king's food.", "Demande à Dieu qu'Il leur donne la sagesse de savoir quand tenir bon et quand s'adapter : Daniel accepta un nouveau nom, mais refusa les mets du roi."),
      L('Pray for young believers facing mockery, exclusion or persecution for their faith, in your country and elsewhere.', "Prie pour les jeunes croyants qui subissent moqueries, exclusion ou persécution à cause de leur foi, dans ton pays et ailleurs."),
    ],
    selfPrompt: L(
      'Where are you going along with a pressure you know you should resist? Ask God for courage, and for the grace to stand without harshness.',
      "Où cèdes-tu à une pression à laquelle tu sais devoir résister ? Demande à Dieu du courage, et la grâce de tenir bon sans dureté.",
    ),
    practice: L(
      'Ask a young person today where it is hardest to live out their faith, and listen without rushing to give advice.',
      "Demande aujourd'hui à un jeune où il lui est le plus difficile de vivre sa foi, et écoute-le sans te précipiter pour donner des conseils.",
    ),
    resourceTopics: ['children', 'persecution'],
  },
  {
    movement: 'calling',
    theme: { en: 'Gifts for the church today', fr: "Des dons pour l'Église d'aujourd'hui", es: 'Dones para la iglesia de hoy', pt: 'Dons para a igreja de hoje', de: 'Gaben für die Gemeinde heute', ru: 'Дары для церкви уже сегодня', zh: '今天为教会所用的恩赐', ja: '今の教会のための賜物', ko: '오늘의 교회를 위한 은사', ar: 'مواهب للكنيسة اليوم', fa: 'عطایایی برای کلیسای امروز', hi: 'आज की कलीसिया के लिए वरदान', id: 'Karunia bagi gereja masa kini', sw: 'Karama kwa ajili ya kanisa leo', tl: 'Mga kaloob para sa iglesya ngayon', am: 'ለዛሬዋ ቤተ ክርስቲያን የሚሆኑ ስጦታዎች' },
    ref: '1 Timothy 4:12-16',
    related: ['Romans 12:4-8', '1 Peter 4:10-11'],
    reflection: L(
      "Paul told the young Timothy not to let anyone look down on him for his youth, but to be an example in how he spoke, lived, loved and believed, and not to neglect the gift he had received when the elders laid hands on him. Young people are not only the church of tomorrow; they belong to Christ's body now, with gifts the church needs. Pray for children to discover how God has made and gifted them, whether up front or unseen, and for churches that make room for them to serve.",
      "Paul demandait au jeune Timothée de ne laisser personne le mépriser à cause de sa jeunesse, mais d'être un exemple dans sa manière de parler, de vivre, d'aimer et de croire, et de ne pas négliger le don reçu quand les anciens lui avaient imposé les mains. Les jeunes ne sont pas seulement l'Église de demain ; ils font partie du corps de Christ dès maintenant, avec des dons dont l'Église a besoin. Prie pour que les enfants découvrent comment Dieu les a formés et doués, sur le devant de la scène ou dans l'ombre, et pour des Églises qui leur font de la place pour servir.",
    ),
    prompts: [
      L('Ask the Holy Spirit to awaken and shape the gifts He gives each child, and to keep them humble in using them.', "Demande au Saint-Esprit d'éveiller et de façonner les dons qu'Il accorde à chaque enfant, et de les garder humbles dans leur usage."),
      L('Thank God for the abilities you already see in each child, practical, creative, relational or academic, and name them before Him.', "Remercie Dieu pour les capacités que tu vois déjà chez chaque enfant, pratiques, créatives, relationnelles ou intellectuelles, et nomme-les devant Lui."),
      L('Pray that your church would welcome children and young people as real members who serve, not only as an audience.', "Prie pour que ton Église accueille les enfants et les jeunes comme de vrais membres qui servent, et pas seulement comme un public."),
    ],
    selfPrompt: L(
      'Have you neglected a gift God has given you? Ask Him to rekindle it; children notice adults who serve with joy.',
      "As-tu négligé un don que Dieu t'a fait ? Demande-Lui de le raviver : les enfants remarquent les adultes qui servent avec joie.",
    ),
    practice: L(
      'Tell one child or young person today about a specific gift you see in them, and one way it could serve others.',
      "Dis aujourd'hui à un enfant ou à un jeune quel don précis tu vois en lui, et une manière dont il pourrait servir les autres.",
    ),
    resourceTopics: ['spiritual-gifts', 'children'],
  },
  {
    movement: 'calling',
    theme: { en: 'Work as a calling', fr: 'Le travail comme vocation', es: 'El trabajo como vocación', pt: 'O trabalho como vocação', de: 'Arbeit als Berufung', ru: 'Труд как призвание', zh: '以工作为呼召', ja: '召しとしての仕事', ko: '소명으로서의 일', ar: 'العمل كدعوة', fa: 'کار به‌عنوان دعوت', hi: 'बुलाहट के रूप में काम', id: 'Pekerjaan sebagai panggilan', sw: 'Kazi kama wito', tl: 'Trabaho bilang tawag', am: 'ሥራ እንደ ጥሪ' },
    ref: 'Exodus 31:1-6',
    related: ['Colossians 3:23-24'],
    reflection: L(
      "Among the first people Scripture describes as filled with the Spirit of God is not a priest or a prophet but Bezalel, a craftsman, given wisdom and skill to work in metal, stone and wood for God's dwelling. Paul later tells believers doing the humblest work to do it wholeheartedly, as for the Lord. Every honest kind of work can be offered to God. So pray for children's futures without ranking careers by prestige, and without making success, status or income the measure of a good life.",
      "Parmi les premiers que l'Écriture décrit comme remplis de l'Esprit de Dieu, on ne trouve pas un prêtre ou un prophète, mais Betsaleel, un artisan, doté de sagesse et d'habileté pour travailler le métal, la pierre et le bois pour la demeure de Dieu. Plus tard, Paul demande aux croyants qui font les travaux les plus humbles de s'en acquitter de bon cœur, comme pour le Seigneur. Tout travail honnête peut être offert à Dieu. Prie donc pour l'avenir des enfants sans classer les métiers selon leur prestige, et sans faire de la réussite, du statut ou du revenu la mesure d'une vie réussie.",
    ),
    prompts: [
      L('Ask God to guide each child toward work where their gifts can serve others, whether that work is noticed or not.', "Demande à Dieu de guider chaque enfant vers un travail où ses dons pourront servir les autres, que ce travail soit remarqué ou non."),
      L('Pray for young people facing exams, training choices or unemployment, that they would find wise counsel and not lose hope.', "Prie pour les jeunes qui affrontent des examens, des choix d'orientation ou le chômage, afin qu'ils trouvent de sages conseils et ne perdent pas espoir."),
      L('Ask the Spirit to equip them for whatever work they will do, as He filled Bezalel for his craft.', "Demande à l'Esprit de les équiper pour le travail qu'ils feront, quel qu'il soit, comme Il a rempli Betsaleel pour son métier."),
    ],
    selfPrompt: L(
      'Do you quietly hope a child will fulfil your ambitions or make you look good? Release that to God, and offer Him your own work today.',
      "Espères-tu en secret qu'un enfant réalise tes ambitions ou te fasse honneur ? Remets cela à Dieu, et offre-Lui ton propre travail aujourd'hui.",
    ),
    practice: L(
      'Tell a child about your own work, or a job you admire, and why it can be done for God.',
      "Parle à un enfant de ton propre travail, ou d'un métier que tu admires, et explique-lui pourquoi on peut le faire pour Dieu.",
    ),
    resourceTopics: ['calling', 'children'],
  },
  {
    movement: 'calling',
    theme: { en: 'Love in their future relationships', fr: "L'amour dans leurs relations futures", es: 'El amor en sus relaciones futuras', pt: 'O amor nos seus relacionamentos futuros', de: 'Liebe in künftigen Beziehungen', ru: 'Любовь в будущих отношениях', zh: '未来关系中的爱', ja: '将来の人間関係と愛', ko: '미래의 관계 속의 사랑', ar: 'المحبة في علاقاتهم المستقبلية', fa: 'محبت در روابط آینده', hi: 'भविष्य के संबंधों में प्रेम', id: 'Kasih dalam relasi masa depan', sw: 'Upendo katika mahusiano ya baadaye', tl: 'Pag-ibig sa mga relasyon sa hinaharap', am: 'በወደፊት ግንኙነቶቻቸው ውስጥ ፍቅር' },
    ref: '1 Corinthians 7:32-35',
    related: ['1 Corinthians 7:7', '1 Corinthians 13:4-7'],
    reflection: L(
      "Paul, unmarried when he wrote, calls both marriage and singleness gifts from God and wants every believer free for undivided devotion to the Lord. That frees us to pray for children's future relationships without scripting them. Some will marry and some will not; neither is a lesser life. Pray for the love Paul describes to the same church, patient, kind and unselfish, to mark every friendship, courtship and home they may one day build.",
      "Paul, célibataire lorsqu'il écrit, présente le mariage comme le célibat comme des dons de Dieu, et souhaite que chaque croyant soit libre de s'attacher au Seigneur sans partage. Cela nous libère pour prier pour les relations futures des enfants sans en écrire le scénario. Certains se marieront, d'autres non ; aucune de ces vies n'est inférieure. Prie pour que l'amour que Paul décrit à la même Église, patient, bon et désintéressé, marque chaque amitié, chaque fréquentation et chaque foyer qu'ils formeront peut-être un jour.",
    ),
    prompts: [
      L('Pray that each child would grow into someone capable of faithful, respectful love, as a friend and perhaps one day as a spouse.', "Prie pour que chaque enfant devienne capable d'un amour fidèle et respectueux, comme ami et peut-être un jour comme conjoint."),
      L('Ask God to protect them from controlling or abusive relationships, and to give them wisdom about whom they trust.', "Demande à Dieu de les préserver des relations d'emprise ou de violence, et de leur donner la sagesse dans le choix de ceux à qui ils se fient."),
      L('Pray that whether they marry or remain single, they would know their life is whole in Christ.', "Prie pour que, qu'ils se marient ou restent célibataires, ils sachent que leur vie est complète en Christ."),
    ],
    selfPrompt: L(
      'What do the children around you learn about love from your own relationships, whether marriage, friendship or singleness? Ask God to make your love patient and kind.',
      "Qu'apprennent les enfants qui t'entourent sur l'amour en observant tes propres relations, dans le mariage, l'amitié ou le célibat ? Demande à Dieu de rendre ton amour patient et bon.",
    ),
    practice: L(
      'Tell a young person about a marriage, friendship or single life you have seen honour God, and what you admire in it.',
      "Parle à un jeune d'un mariage, d'une amitié ou d'une vie de célibataire qui, à tes yeux, honore Dieu, et de ce que tu y admires.",
    ),
    resourceTopics: ['children', 'parenting'],
  },
  {
    movement: 'calling',
    theme: { en: 'From generation to generation', fr: 'De génération en génération', es: 'De generación en generación', pt: 'De geração em geração', de: 'Von Generation zu Generation', ru: 'Из рода в род', zh: '世世代代', ja: '代々に', ko: '대대로', ar: 'من جيل إلى جيل', fa: 'نسل به نسل', hi: 'पीढ़ी से पीढ़ी तक', id: 'Dari generasi ke generasi', sw: 'Kizazi hadi kizazi', tl: "Sa sali't salinlahi", am: 'ከትውልድ እስከ ትውልድ' },
    ref: 'Psalm 78:1-8',
    related: ['Psalm 145:4', 'Joel 1:3'],
    reflection: L(
      "Psalm 78 asks one generation to tell the next, even children not yet born, what the LORD has done, so that they would set their hope in God. Then it spends most of its length retelling Israel's failures, so that the next generation would not repeat them. Joel even asks for a disaster to be retold to children and grandchildren. Faith is handed on through honest stories: God's faithfulness, and our failures too. Your testimony may reach children you will never meet.",
      "Le Psaume 78 demande à une génération de raconter à la suivante, et même aux enfants qui ne sont pas encore nés, ce que l'Éternel a fait, afin qu'ils mettent en Dieu leur espérance. Puis il consacre l'essentiel de sa longueur à raconter les échecs d'Israël, pour que la génération suivante ne les répète pas. Joël demande même qu'une catastrophe soit racontée aux enfants et aux petits-enfants. La foi se transmet par des récits honnêtes : la fidélité de Dieu, et nos échecs aussi. Ton témoignage atteindra peut-être des enfants que tu ne rencontreras jamais.",
    ),
    prompts: [
      L('Pray for the children of the children you love, generations you may never see, that they too would set their hope in God.', "Prie pour les enfants des enfants que tu aimes, des générations que tu ne verras peut-être pas, afin qu'eux aussi mettent leur espérance en Dieu."),
      L('Thank God for one thing He has done in your life that the next generation should hear about.', "Remercie Dieu pour une chose qu'Il a faite dans ta vie et que la génération suivante devrait entendre."),
      L('Ask God for grace to name, and to turn from, the habits in your family or church that you do not want to pass on.', "Demande à Dieu la grâce de nommer les travers de ta famille ou de ton Église que tu ne veux pas transmettre, et de t'en détourner."),
    ],
    selfPrompt: L(
      'Which of your failures, told humbly, could help a younger believer? Ask God for the courage to share your story, both the grace and the mistakes.',
      "Lequel de tes échecs, raconté avec humilité, pourrait aider un croyant plus jeune ? Demande à Dieu le courage de partager ton histoire, la grâce comme les erreurs.",
    ),
    practice: L(
      'Tell a child or young person one short testimony today, something God has done for you, in a few plain sentences.',
      "Raconte aujourd'hui à un enfant ou à un jeune un court témoignage, quelque chose que Dieu a fait pour toi, en quelques phrases simples.",
    ),
    resourceTopics: ['family-discipleship', 'children'],
  },
  {
    movement: 'calling',
    theme: { en: "Into God's hands", fr: 'Entre les mains de Dieu', es: 'En las manos de Dios', pt: 'Nas mãos de Deus', de: 'In Gottes Hände', ru: 'В Божьи руки', zh: '交托在神手中', ja: '神様の御手に委ねる', ko: '하나님의 손에 맡기며', ar: 'بين يدي الله', fa: 'به دستان خدا', hi: 'परमेश्वर के हाथों में', id: 'Ke dalam tangan Allah', sw: 'Mikononi mwa Mungu', tl: 'Sa mga kamay ng Diyos', am: 'በእግዚአብሔር እጅ' },
    ref: '1 Samuel 1:21-28',
    related: ['1 Samuel 2:18-19', 'Psalm 31:14-15'],
    reflection: L(
      "Hannah had begged God for a son, and when Samuel was weaned she brought him to Shiloh and gave him to the LORD for his whole life. Her vow belonged to her own story; no one is asked to leave a child at a sanctuary. Yet its heart applies to every adult who loves a child: they were God's before they were ours. Giving him to God did not end Hannah's love. Every year she made Samuel a little robe and brought it to him. Letting go into God's hands is not letting go of love.",
      "Anne avait supplié Dieu de lui donner un fils ; quand Samuel fut sevré, elle l'amena à Silo et le donna à l'Éternel pour toute sa vie. Son vœu appartenait à sa propre histoire ; personne n'est appelé à laisser un enfant dans un sanctuaire. Mais le cœur de ce geste concerne tout adulte qui aime un enfant : il était à Dieu avant d'être à nous. Remettre Samuel à Dieu n'a pas mis fin à l'amour d'Anne. Chaque année, elle lui confectionnait une petite robe et la lui apportait. S'en remettre à Dieu, ce n'est pas cesser d'aimer.",
    ),
    prompts: [
      L('Name each child before God one more time, and entrust them to Him: their faith, their safety, their choices and their future.', "Nomme une fois encore chaque enfant devant Dieu, et remets-les-Lui : leur foi, leur sécurité, leurs choix et leur avenir."),
      L('Tell God honestly which child you find hardest to release, and why.', "Dis honnêtement à Dieu quel enfant tu as le plus de mal à Lui remettre, et pourquoi."),
      L("Ask Him for a love that keeps showing up, like Hannah's robes, without needing to control the outcome.", "Demande-Lui un amour qui reste présent, comme les petites robes d'Anne, sans avoir besoin de maîtriser l'issue."),
    ],
    selfPrompt: L(
      "David placed his own times in God's hand. Can you do the same with your life today, including your fears for the children you love?",
      "David remettait sa propre vie entre les mains de Dieu. Peux-tu en faire autant aujourd'hui, y compris avec tes craintes pour les enfants que tu aimes ?",
    ),
    practice: L(
      'Choose one way to keep praying for these children after today: a set day each week, a list in your Bible or a prayer on each birthday.',
      "Choisis une manière de continuer à prier pour ces enfants après aujourd'hui : un jour fixe chaque semaine, une liste dans ta Bible ou une prière à chaque anniversaire.",
    ),
    resourceTopics: ['children', 'parenting', 'intercession'],
  },
];
