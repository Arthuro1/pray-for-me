// The 14 days of "Your Kingdom Come" (see ./yourKingdomCome.js for the plan
// meta, the movements and the guardrails this content is held to).
//
// Every day prays in TWO movements, using existing fields only:
//   prompts     INTERCESSION — what are we asking God to do?
//   selfPrompt  SUBMISSION — what in my own life must come under the reign I
//               am praying for? Present on every day.
// Plus a reflection (Praystead commentary, never Scripture text), one small
// practice, up to three related passages and resource topics.
//
// Prose is authored in en + fr; the other languages fall back through pick().
// Day titles (`theme`) are authored in all 16 languages and follow each
// language's familiar wording of the Lord's Prayer where one exists.
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Movement 1 · Your name, your kingdom, your will (days 1–6) ─────────────
  {
    movement: 'father',
    theme: { en: 'Our Father', fr: 'Notre Père', es: 'Padre nuestro', pt: 'Pai nosso', de: 'Vater unser', ru: 'Отче наш', zh: '我们的天父', ja: '私たちの父よ', ko: '하늘에 계신 우리 아버지', ar: 'أبانا الذي في السماوات', fa: 'ای پدر ما', hi: 'हे हमारे पिता', id: 'Bapa kami', sw: 'Baba yetu', tl: 'Ama namin', am: 'አባታችን ሆይ' },
    ref: 'Matthew 6:5-13',
    related: ['Luke 15:11-24', 'Matthew 7:7-11', 'Romans 8:14-17'],
    reflection: L(
      "Jesus sets this prayer against two distortions: praying to be seen, and piling up words to be heard. Neither is needed, because your Father sees in secret and knows what you need before you ask. The prayer begins with “our”, so no one prays it alone. If “father” is a painful word for you, let Jesus define it: the Father who runs to meet a returning son (Luke 15) and gives good gifts to His children (Matthew 7:9-11).",
      "Jésus oppose cette prière à deux dérives : prier pour être vu, et multiplier les mots pour être entendu. Ni l'une ni l'autre n'est nécessaire, car ton Père voit dans le secret et sait de quoi tu as besoin avant même que tu demandes. La prière commence par « notre » : personne ne la prie seul. Si le mot « père » réveille une blessure, laisse Jésus lui donner son sens : le Père qui court au-devant du fils qui revient (Luc 15) et qui donne de bonnes choses à ses enfants (Matthieu 7:9-11).",
    ),
    prompts: [
      L('Thank your Father that He sees you in secret and knows what you need before you say a word.', "Remercie ton Père : Il te voit dans le secret et sait ce dont tu as besoin avant que tu dises un mot."),
      L('Pray for someone for whom “father” is a hard word, that they may come to know the Father Jesus reveals.', "Prie pour quelqu'un pour qui le mot « père » est difficile, afin qu'il découvre le Père que Jésus fait connaître."),
      L('Pray for the believers who will say this same prayer today in other languages and places — you are praying it with them.', "Prie pour les croyants qui diront cette même prière aujourd'hui, dans d'autres langues et d'autres lieux : tu la pries avec eux."),
    ],
    selfPrompt: L(
      'Bring your way of praying under His reign. Where do you perform for others, or try to earn a hearing with many words? Speak to Him simply, as His child.',
      "Place ta manière de prier sous son règne. Où cherches-tu à être vu, ou à mériter d'être entendu à force de mots ? Parle-Lui simplement, comme son enfant.",
    ),
    practice: L(
      "Find a quiet place today, close the door as Jesus describes, and pray the Lord's Prayer slowly, pausing after its first two words.",
      "Trouve aujourd'hui un endroit tranquille, ferme la porte comme Jésus le décrit, et prie lentement le Notre Père en t'arrêtant après ses deux premiers mots.",
    ),
    resourceTopics: ['lords-prayer', 'prayer'],
  },
  {
    movement: 'father',
    theme: { en: 'Hallowed be your name', fr: 'Que ton nom soit sanctifié', es: 'Santificado sea tu nombre', pt: 'Santificado seja o teu nome', de: 'Geheiligt werde dein Name', ru: 'Да святится имя Твоё', zh: '愿人都尊你的名为圣', ja: '御名があがめられますように', ko: '이름이 거룩히 여김을 받으시오며', ar: 'ليتقدس اسمك', fa: 'نام تو مقدس باد', hi: 'तेरा नाम पवित्र माना जाए', id: 'Dikuduskanlah nama-Mu', sw: 'Jina lako litukuzwe', tl: 'Sambahin nawa ang pangalan mo', am: 'ስምህ ይቀደስ' },
    ref: 'Ezekiel 36:22-28',
    related: ['Matthew 6:9', 'Exodus 34:5-7'],
    reflection: L(
      "In Ezekiel, God's name had been dishonoured among the nations by the conduct of His own people. His answer was not to abandon them but to act: to cleanse them, give them a new heart and put His Spirit within them, so that the nations would see His holiness. Praying “hallowed be your name” asks God to show who He is — and in Ezekiel He begins with the people who bear His name.",
      "Dans Ézéchiel, le nom de Dieu avait été déshonoré parmi les nations par la conduite de son propre peuple. Sa réponse n'a pas été de l'abandonner, mais d'agir : le purifier, lui donner un cœur nouveau et mettre en lui son Esprit, afin que les nations voient sa sainteté. Prier « que ton nom soit sanctifié », c'est demander à Dieu de montrer qui Il est — et dans Ézéchiel, Il commence par le peuple qui porte son nom.",
    ),
    prompts: [
      L('Worship God for what His name reveals in Exodus 34: compassion, grace, patience, steadfast love and faithfulness.', "Adore Dieu pour ce que son nom révèle en Exode 34 : compassion, grâce, patience, amour fidèle et vérité."),
      L('Ask God to make His name honoured where it is mocked, ignored or misused — in your street, your workplace, your nation.', "Demande à Dieu que son nom soit honoré là où on le moque, l'ignore ou l'emploie à tort : dans ta rue, à ton travail, dans ton pays."),
      L('Pray for churches whose conduct has brought His name into disrepute, that He would cleanse and renew them by His Spirit.', "Prie pour les Églises dont la conduite a jeté le discrédit sur son nom, afin qu'Il les purifie et les renouvelle par son Esprit."),
    ],
    selfPrompt: L(
      'Bring your words and conduct under His reign. Where have you used His name lightly, or lived in a way that dims it? Ask Him to make your life honour Him.',
      "Soumets tes paroles et ta conduite à son règne. Où as-tu employé son nom à la légère, ou vécu d'une manière qui le ternit ? Demande-Lui que ta vie L'honore.",
    ),
    practice: L(
      'Write down three things Exodus 34:5-7 says about the Lord, and pray them back to Him before you sleep tonight.',
      "Note trois choses qu'Exode 34:5-7 dit du Seigneur, et redis-les-Lui dans la prière ce soir, avant de dormir.",
    ),
    resourceTopics: ['lords-prayer', 'worship', 'holiness'],
  },
  {
    movement: 'father',
    theme: { en: 'Your kingdom come', fr: 'Que ton règne vienne', es: 'Venga tu reino', pt: 'Venha o teu reino', de: 'Dein Reich komme', ru: 'Да придёт Царствие Твоё', zh: '愿你的国降临', ja: '御国が来ますように', ko: '나라가 임하시오며', ar: 'ليأتِ ملكوتك', fa: 'ملکوت تو بیاید', hi: 'तेरा राज्य आए', id: 'Datanglah Kerajaan-Mu', sw: 'Ufalme wako uje', tl: 'Dumating nawa ang kaharian mo', am: 'መንግሥትህ ትምጣ' },
    ref: 'Mark 1:14-15',
    related: ['Matthew 12:28', 'John 18:36', 'Daniel 7:13-14'],
    reflection: L(
      "Jesus began His ministry announcing that the time had come: God's kingdom had drawn near, so turn and believe. The kingdom is God's reign arriving in Jesus Himself — seen when He forgave, healed and drove out demons by the Spirit (Matthew 12:28). Yet He taught His disciples to keep asking for it to come: already begun, not yet complete. Before Pilate He said His kingdom does not come from this world. No nation, party or movement owns it.",
      "Jésus a commencé son ministère en annonçant que le moment était venu : le règne de Dieu s'était approché, il fallait se tourner vers Dieu et croire. Ce règne arrive en Jésus lui-même — on l'a vu quand Il pardonnait, guérissait et chassait les démons par l'Esprit (Matthieu 12:28). Pourtant, Il a appris à ses disciples à continuer de demander qu'il vienne : déjà commencé, pas encore achevé. Devant Pilate, Il a dit que son royaume ne vient pas de ce monde. Aucune nation, aucun parti, aucun mouvement ne le possède.",
    ),
    prompts: [
      L('Ask God to make His reign visible where people live without hope, as it was when Jesus forgave, healed and set people free.', "Demande à Dieu de rendre son règne visible là où des gens vivent sans espérance, comme lorsque Jésus pardonnait, guérissait et libérait."),
      L('Pray for people you know to hear the good news of the kingdom and to turn to Christ.', "Prie pour que des personnes que tu connais entendent la bonne nouvelle du Royaume et se tournent vers Christ."),
      L("Pray for Christians tempted to confuse God's kingdom with a nation, a party or a cause, that they would follow the King above every flag.", "Prie pour les chrétiens tentés de confondre le règne de Dieu avec une nation, un parti ou une cause, afin qu'ils suivent le Roi au-dessus de tout drapeau."),
    ],
    selfPrompt: L(
      'Name the area of your life where you still act as your own king. Bring it under His reign, and ask Him for grace to turn.',
      "Nomme le domaine de ta vie où tu agis encore comme ton propre roi. Place-le sous son règne, et demande-Lui la grâce de te tourner vers Lui.",
    ),
    practice: L(
      'Read Mark 1:14-15 aloud, then name one concrete way you will turn toward Christ today — a habit, a conversation or a choice.',
      "Lis Marc 1:14-15 à voix haute, puis nomme une manière concrète de te tourner vers Christ aujourd'hui : une habitude, une conversation ou un choix.",
    ),
    resourceTopics: ['kingdom-of-god', 'repentance', 'gospel'],
  },
  {
    movement: 'father',
    theme: { en: 'Your will, not mine', fr: 'Ta volonté, non la mienne', es: 'Tu voluntad, no la mía', pt: 'A tua vontade, não a minha', de: 'Dein Wille, nicht meiner', ru: 'Твоя воля, а не моя', zh: '不要照我的意思', ja: '私の願いではなく、みこころを', ko: '내 뜻대로 마시고 아버지의 뜻대로', ar: 'مشيئتك لا مشيئتي', fa: 'ارادهٔ تو، نه ارادهٔ من', hi: 'मेरी नहीं, तेरी इच्छा', id: 'Kehendak-Mu, bukan kehendakku', sw: 'Mapenzi yako, si yangu', tl: 'Ang kalooban mo, hindi ang akin', am: 'የእኔ ሳይሆን ፈቃድህ ይሁን' },
    ref: 'Matthew 26:36-46',
    related: ['Hebrews 5:7-9', 'Romans 12:1-2'],
    reflection: L(
      "The words of the Lord's Prayer return in Gethsemane, on Jesus' own lips (Matthew 26:42). He told His friends that grief was crushing Him almost to death, fell on His face and asked three times for the cup to pass — and each time yielded to His Father. Surrender here is not pretending to be fine. It is honest desire, spoken aloud and placed under the Father's will. Hebrews remembers His loud cries and tears.",
      "Les mots du Notre Père reviennent à Gethsémané, sur les lèvres mêmes de Jésus (Matthieu 26:42). Il a dit à ses amis que la tristesse L'écrasait jusqu'à la mort, Il est tombé face contre terre et a demandé trois fois que la coupe s'éloigne — et chaque fois, Il s'en est remis à son Père. Ici, s'abandonner ne veut pas dire faire semblant d'aller bien. C'est un désir honnête, dit à voix haute et placé sous la volonté du Père. L'épître aux Hébreux se souvient de ses grands cris et de ses larmes.",
    ),
    prompts: [
      L('Tell the Father honestly what you want in a situation you are facing, without dressing it up.', "Dis honnêtement au Père ce que tu désires dans une situation que tu traverses, sans l'enjoliver."),
      L('Pray for someone walking a road they did not choose, that the Father would strengthen them and keep them close to Him.', "Prie pour quelqu'un qui marche sur un chemin qu'il n'a pas choisi, afin que le Père le fortifie et le garde près de Lui."),
      L('Ask God to do His will in a situation where you cannot see the way forward, and to give you peace in not knowing.', "Demande à Dieu de faire sa volonté dans une situation où tu ne vois pas d'issue, et de te donner la paix dans ce que tu ignores."),
    ],
    selfPrompt: L(
      'Name one plan you are holding tightly. Bring it under His reign in your own words, even if your voice shakes as you do.',
      "Nomme un projet auquel tu t'agrippes. Place-le sous son règne avec tes propres mots, même si ta voix tremble.",
    ),
    practice: L(
      "Tonight, set a ten-minute timer and keep watch in prayer, as Jesus asked His friends to do: bring one hard situation, yours or someone else's.",
      "Ce soir, règle une minuterie sur dix minutes et veille dans la prière, comme Jésus l'a demandé à ses amis : apporte-Lui une situation difficile, la tienne ou celle de quelqu'un d'autre.",
    ),
    resourceTopics: ['lords-prayer', 'trust', 'suffering'],
  },
  {
    movement: 'father',
    theme: { en: 'On earth as in heaven', fr: 'Sur la terre comme au ciel', es: 'En la tierra como en el cielo', pt: 'Assim na terra como no céu', de: 'Wie im Himmel, so auf Erden', ru: 'И на земле, как на небе', zh: '在地上如同在天上', ja: '天で行われるように地でも', ko: '하늘에서처럼 땅에서도', ar: 'كما في السماء كذلك على الأرض', fa: 'در زمین، چنانکه در آسمان', hi: 'जैसे स्वर्ग में, वैसे पृथ्वी पर', id: 'Di bumi seperti di surga', sw: 'Duniani kama mbinguni', tl: 'Dito sa lupa gaya ng sa langit', am: 'በሰማይ እንደ ሆነ በምድርም' },
    ref: 'Luke 4:16-21',
    related: ['Psalm 72:1-14', 'Isaiah 11:1-9'],
    reflection: L(
      "In heaven God's will is done without resistance; Jesus asks that earth become like that. In the synagogue at Nazareth He showed what it looks like, reading from Isaiah: by the Spirit's anointing, good news reaches the poor, captives are released, the blind see and the crushed go free. This petition is not an escape from the world. It asks for God's justice and mercy to reach the places where His will is least done.",
      "Au ciel, la volonté de Dieu s'accomplit sans résistance ; Jésus demande que la terre devienne ainsi. Dans la synagogue de Nazareth, Il a montré à quoi cela ressemble en lisant Ésaïe : par l'onction de l'Esprit, la bonne nouvelle atteint les pauvres, les captifs sont relâchés, les aveugles voient et les opprimés sont libérés. Cette demande n'est pas une fuite hors du monde. Elle réclame que la justice et la miséricorde de Dieu atteignent les lieux où sa volonté est le moins faite.",
    ),
    prompts: [
      L("Pray for the poor, the imprisoned and the oppressed in your city, that God's justice and mercy would reach them, also through His people.", "Prie pour les pauvres, les prisonniers et les opprimés de ta ville, afin que la justice et la miséricorde de Dieu les atteignent, y compris par son peuple."),
      L('Ask the Holy Spirit to anoint your church for the work Jesus announced in Nazareth.', "Demande au Saint-Esprit d'oindre ton Église pour l'œuvre que Jésus a annoncée à Nazareth."),
      L('Pray for those who govern and judge, that they would defend the weak and the needy, as Psalm 72 asks of a king.', "Prie pour ceux qui gouvernent et qui jugent, afin qu'ils défendent le faible et le pauvre, comme le Psaume 72 le demande à un roi."),
    ],
    selfPrompt: L(
      'Bring your time and money under His reign. Where do your own choices resist His will on earth, and where could you become part of His answer?',
      "Place ton temps et ton argent sous son règne. Où tes propres choix résistent-ils à sa volonté sur la terre, et où pourrais-tu faire partie de sa réponse ?",
    ),
    practice: L(
      'Find one local ministry that serves the poor, prisoners or refugees, pray for it by name today, and ask what help it needs.',
      "Trouve un ministère près de chez toi qui sert les pauvres, les prisonniers ou les réfugiés, prie pour lui en le nommant aujourd'hui, et demande de quelle aide il a besoin.",
    ),
    resourceTopics: ['justice', 'kingdom-of-god', 'mission'],
  },
  {
    movement: 'father',
    theme: { en: 'Seek first the kingdom', fr: "Chercher d'abord le Royaume", es: 'Buscar primero el reino', pt: 'Buscar primeiro o reino', de: 'Zuerst Gottes Reich suchen', ru: 'Ищите прежде Царства Божьего', zh: '先求神的国', ja: 'まず神の国を求める', ko: '먼저 그의 나라를 구하라', ar: 'اطلبوا أولاً ملكوت الله', fa: 'اول ملکوت خدا را بطلبید', hi: 'पहले परमेश्वर के राज्य की खोज', id: 'Carilah dahulu Kerajaan Allah', sw: 'Utafuteni kwanza ufalme wa Mungu', tl: 'Unahin ang kaharian ng Diyos', am: 'አስቀድማችሁ መንግሥቱን ፈልጉ' },
    ref: 'Matthew 6:19-34',
    related: ['Luke 12:32-34', 'Romans 14:17'],
    reflection: L(
      "Jesus places the call to seek first God's kingdom at the end of warnings about stored-up treasure, divided loyalty and worry. The kingdom is not a route to getting more: your Father already knows what you need. Paul adds that God's kingdom is not a matter of food and drink but of a life made right with God, with the peace and joy the Holy Spirit gives (Romans 14:17). Seeking it first does not promise wealth; it reorders what you love and loosens worry's grip.",
      "Jésus place l'appel à chercher d'abord le Royaume à la fin de mises en garde sur les trésors amassés, le cœur partagé et l'inquiétude. Le Royaume n'est pas un moyen d'obtenir davantage : ton Père sait déjà ce dont tu as besoin. Paul ajoute que le règne de Dieu n'est pas affaire de nourriture et de boisson, mais d'une vie rendue juste devant Dieu, avec la paix et la joie que donne le Saint-Esprit (Romains 14:17). Le chercher d'abord ne promet pas la richesse ; cela remet en ordre ce que tu aimes et desserre l'étau de l'inquiétude.",
    ),
    prompts: [
      L('Thank the Father who feeds the birds and clothes the wild flowers, and who knows exactly what you need.', "Remercie le Père qui nourrit les oiseaux et habille les fleurs des champs, et qui sait exactement ce dont tu as besoin."),
      L("Pray for believers crushed by worry about money or tomorrow, that they may know the Father's care and find practical help in the church.", "Prie pour les croyants écrasés par l'inquiétude au sujet de l'argent ou du lendemain, afin qu'ils connaissent les soins du Père et trouvent une aide concrète dans l'Église."),
      L('Ask God to free His church from divided loyalty, so that it treasures His reign above comfort, reputation and wealth.', "Demande à Dieu de libérer son Église d'un cœur partagé, pour qu'elle chérisse son règne plus que le confort, la réputation et la richesse."),
    ],
    selfPrompt: L(
      'Name what you actually seek first, often without meaning to. Bring it under His reign and give Him that first place.',
      "Nomme ce que tu recherches vraiment en premier, souvent sans le vouloir. Place-le sous son règne et rends-Lui cette première place.",
    ),
    practice: L(
      "Look back over last week's spending or calendar, circle one item that shows what you truly seek, and pray over it honestly.",
      "Parcours tes dépenses ou ton agenda de la semaine passée, entoure un élément qui montre ce que tu recherches vraiment, et prie honnêtement à son sujet.",
    ),
    resourceTopics: ['kingdom-of-god', 'contentment', 'generosity'],
  },

  // ── Movement 2 · Our bread, our debts, our trials (days 7–11) ─────────────
  {
    movement: 'daily',
    theme: { en: 'Our daily bread', fr: 'Notre pain de ce jour', es: 'El pan nuestro de cada día', pt: 'O pão nosso de cada dia', de: 'Unser tägliches Brot', ru: 'Хлеб наш насущный', zh: '我们日用的饮食', ja: '日ごとの糧', ko: '일용할 양식', ar: 'خبزنا كفافنا', fa: 'نان کفاف ما', hi: 'हमारी दिन भर की रोटी', id: 'Makanan kami yang secukupnya', sw: 'Utupe leo riziki yetu', tl: 'Ang aming pagkain sa araw-araw', am: 'የዕለት እንጀራችን' },
    ref: 'Luke 11:1-13',
    related: ['Exodus 16:13-21', '2 Corinthians 8:13-15'],
    reflection: L(
      "In Luke, Jesus follows His prayer with a man knocking at midnight for bread — not for himself, but for a hungry guest. He keeps asking, and he receives. “Daily bread” recalls the manna Israel gathered one day at a time, and Paul uses that same story to urge the churches to share, so that no one goes short. The “us” matters: to ask for our bread is to care about your neighbour's table too.",
      "Dans Luc, Jésus fait suivre sa prière de l'histoire d'un homme qui frappe à minuit pour demander du pain — non pour lui-même, mais pour un hôte affamé. Il insiste, et il reçoit. Le « pain de ce jour » rappelle la manne qu'Israël ramassait jour après jour, et Paul reprend cette histoire pour inviter les Églises au partage, afin que personne ne manque. Le « nous » compte : demander notre pain, c'est aussi te soucier de la table de ton prochain.",
    ),
    prompts: [
      L('Ask the Father plainly for what you and your household need today, not for the years ahead.', "Demande simplement au Père ce dont toi et ta maison avez besoin aujourd'hui, et non pour les années à venir."),
      L("Pray for families near you and far away who do not know where today's food will come from.", "Prie pour les familles, proches ou lointaines, qui ne savent pas d'où viendra leur nourriture aujourd'hui."),
      L('Ask your Father for the Holy Spirit, as Jesus encourages His disciples to do at the end of this passage.', "Demande à ton Père le Saint-Esprit, comme Jésus y encourage ses disciples à la fin de ce passage."),
    ],
    selfPrompt: L(
      'Bring your storehouse under His reign. Where are you piling up security instead of trusting Him for today? Ask what He would have you release.',
      "Place tes réserves sous son règne. Où accumules-tu de la sécurité au lieu de Lui faire confiance pour aujourd'hui ? Demande-Lui ce qu'Il t'invite à lâcher.",
    ),
    practice: L(
      'This week, give the cost of one meal — as food, money or time — to someone in need or to a food bank, and pray for them as you give.',
      "Cette semaine, donne l'équivalent d'un repas — en nourriture, en argent ou en temps — à quelqu'un dans le besoin ou à une banque alimentaire, et prie pour eux en donnant.",
    ),
    resourceTopics: ['lords-prayer', 'generosity', 'prayer'],
  },
  {
    movement: 'daily',
    theme: { en: 'Forgive us our debts', fr: 'Pardonne-nous nos offenses', es: 'Perdónanos nuestras deudas', pt: 'Perdoa-nos as nossas dívidas', de: 'Vergib uns unsere Schuld', ru: 'Прости нам долги наши', zh: '免我们的债', ja: '私たちの負い目をお赦しください', ko: '우리 죄를 사하여 주시옵고', ar: 'اغفر لنا ذنوبنا', fa: 'قرض‌های ما را ببخش', hi: 'हमारे अपराध क्षमा कर', id: 'Ampunilah kesalahan kami', sw: 'Utusamehe deni zetu', tl: 'Patawarin mo ang aming mga kasalanan', am: 'በደላችንን ይቅር በለን' },
    ref: 'Psalm 32:1-7',
    related: ['1 John 1:5-9', 'Colossians 2:13-14'],
    reflection: L(
      "Jesus puts the request for forgiveness right beside the request for bread: His disciples will need both every day. Matthew calls sins “debts” — what we owe and cannot repay. David describes the weight of keeping quiet about his sin, his strength drying up as in summer heat, and the relief when he finally confessed and was forgiven. Confession is not self-punishment. It brings the debt to the One who cancelled it at the cross (Colossians 2:13-14).",
      "Jésus place la demande de pardon juste à côté de celle du pain : ses disciples auront besoin des deux chaque jour. Matthieu appelle les péchés des « dettes » : ce que nous devons sans pouvoir le rembourser. David décrit le poids de son silence sur sa faute, sa vigueur desséchée comme par la chaleur de l'été, puis le soulagement quand il l'a enfin confessée et a été pardonné. La confession n'est pas une punition qu'on s'inflige. Elle apporte la dette à Celui qui l'a annulée à la croix (Colossiens 2:13-14).",
    ),
    prompts: [
      L('Confess to God one specific sin you have been keeping quiet about, and receive His forgiveness in Christ.', "Confesse à Dieu un péché précis sur lequel tu gardais le silence, et reçois son pardon en Christ."),
      L('Thank Jesus that the record of your debt was cancelled at the cross.', "Remercie Jésus : l'acte de ta dette a été annulé à la croix."),
      L('Pray for someone weighed down by guilt, that they would come to Christ and know His mercy.', "Prie pour quelqu'un qui ploie sous la culpabilité, afin qu'il vienne à Christ et connaisse sa miséricorde."),
    ],
    selfPrompt: L(
      'Bring your excuses under His reign. Where do you minimise, shift the blame or hide? Tell Him the truth without defending yourself.',
      "Soumets tes excuses à son règne. Où minimises-tu, rejettes-tu la faute ou te caches-tu ? Dis-Lui la vérité sans te défendre.",
    ),
    practice: L(
      'Write down what you confessed, thank God for His forgiveness, then tear up the paper. If a sin keeps its grip on you, tell a trusted mature believer (James 5:16).',
      "Écris ce que tu as confessé, remercie Dieu pour son pardon, puis déchire la feuille. Si un péché garde son emprise sur toi, parles-en à un croyant mûr en qui tu as confiance (Jacques 5:16).",
    ),
    resourceTopics: ['forgiveness', 'repentance', 'lords-prayer'],
  },
  {
    movement: 'daily',
    theme: { en: 'As we forgive', fr: 'Comme nous pardonnons', es: 'Como nosotros perdonamos', pt: 'Assim como nós perdoamos', de: 'Wie auch wir vergeben', ru: 'Как и мы прощаем', zh: '如同我们免了人的债', ja: '私たちも赦します', ko: '우리가 용서한 것 같이', ar: 'كما نغفر نحن أيضاً', fa: 'چنانکه ما نیز می‌بخشیم', hi: 'जैसे हम क्षमा करते हैं', id: 'Seperti kami juga mengampuni', sw: 'Kama tunavyowasamehe wengine', tl: 'Gaya ng pagpapatawad namin', am: 'እኛም ይቅር እንደምንል' },
    ref: 'Matthew 18:21-35',
    related: ['Matthew 6:14-15', 'Romans 12:17-21', 'Ephesians 4:31-32'],
    reflection: L(
      "Peter asks how often he must forgive. Jesus answers with a king who cancels a debt no servant could ever repay, and a servant who then seizes a colleague by the throat over a small sum. Forgiveness flows from what we have been forgiven. It means releasing the debt to God, who judges justly (Romans 12:19). It is not calling the wrong small, and it is not the same as trust or reconciliation, which may take time or may not be safe.",
      "Pierre demande combien de fois il doit pardonner. Jésus répond par l'histoire d'un roi qui efface une dette qu'aucun serviteur ne pourrait jamais rembourser, et d'un serviteur qui prend ensuite un collègue à la gorge pour une petite somme. Le pardon découle de ce qui nous a été pardonné. Il consiste à remettre la dette à Dieu, qui juge avec justice (Romains 12:19). Ce n'est pas dire que le tort était petit, et ce n'est pas la même chose que la confiance ou la réconciliation, qui peuvent demander du temps ou ne pas être sûres.",
    ),
    prompts: [
      L('Name before God someone who has wronged you, and tell Him honestly what it cost you.', "Nomme devant Dieu quelqu'un qui t'a fait du tort, et dis-Lui honnêtement ce que cela t'a coûté."),
      L('Ask the Father for grace to release that debt into His hands, trusting Him to judge justly.', "Demande au Père la grâce de remettre cette dette entre ses mains, en Lui faisant confiance pour juger avec justice."),
      L("Pray for that person's good as far as you are able today, even if it is one honest sentence.", "Prie pour le bien de cette personne, dans la mesure où tu le peux aujourd'hui, même si ce n'est qu'une phrase sincère."),
    ],
    selfPrompt: L(
      'Bring your resentment under His reign. Where do you keep replaying the wrong, waiting for them to pay? Jesus speaks of forgiving from the heart; ask Him to begin that work in you, however long it takes.',
      "Place ton ressentiment sous son règne. Où rejoues-tu sans cesse le tort subi, en attendant que l'autre paie ? Jésus parle de pardonner du fond du cœur ; demande-Lui de commencer cette œuvre en toi, quel que soit le temps qu'elle prendra.",
    ),
    practice: L(
      'Write down what this person owes you, then pray through the list, handing each item to God as the just Judge. If the hurt is deep, talk it through with a pastor or counsellor.',
      "Écris ce que cette personne te doit, puis parcours la liste dans la prière en remettant chaque élément à Dieu, le juste Juge. Si la blessure est profonde, parles-en avec un pasteur ou un conseiller.",
    ),
    safetyNote: L(
      'Forgiving someone does not mean excusing abuse, trusting them again straight away, reconciling on their terms, or giving them access to you or your children. Forgiveness can happen at a distance. If someone is harming you or you are in danger, contact emergency services, and speak with a pastor, safeguarding lead or counsellor you trust.',
      "Pardonner ne signifie pas excuser des violences, refaire confiance tout de suite, se réconcilier aux conditions de l'autre, ni lui donner accès à toi ou à tes enfants. Le pardon peut se vivre à distance. Si quelqu'un te fait du mal ou si tu es en danger, contacte les services d'urgence, et parle à un pasteur, à un référent en protection des personnes ou à un conseiller en qui tu as confiance.",
    ),
    resourceTopics: ['forgiveness', 'boundaries', 'conflict'],
  },
  {
    movement: 'daily',
    theme: { en: 'Lead us not into temptation', fr: 'Ne nous laisse pas entrer en tentation', es: 'No nos metas en tentación', pt: 'Não nos deixes cair em tentação', de: 'Führe uns nicht in Versuchung', ru: 'Не введи нас в искушение', zh: '不叫我们遇见试探', ja: '試みにあわせないでください', ko: '시험에 들게 하지 마시옵고', ar: 'لا تدخلنا في تجربة', fa: 'ما را در آزمایش میاور', hi: 'हमें परीक्षा में न ला', id: 'Janganlah membawa kami ke dalam pencobaan', sw: 'Usitutie majaribuni', tl: 'Huwag mo kaming hayaang matukso', am: 'ወደ ፈተና አታግባን' },
    ref: 'Matthew 4:1-11',
    related: ['James 1:13-15', '1 Corinthians 10:12-13', 'Hebrews 4:14-16'],
    reflection: L(
      "The word behind “temptation” can also mean testing or trial, and translations differ; James is clear that God tempts no one to sin. The petition asks the Father not to lead us into a trial that would overwhelm us, and to keep us from falling. Jesus Himself, led by the Spirit into the wilderness, met each temptation hungry and alone, answering with Scripture. Paul adds that God is faithful and provides a way out; this prayer asks for eyes to see it and the will to take it.",
      "Le mot traduit par « tentation » peut aussi signifier épreuve, et les traductions diffèrent ; Jacques affirme clairement que Dieu ne pousse personne au péché. Cette demande prie le Père de ne pas nous conduire dans une épreuve qui nous submergerait, et de nous garder de tomber. Jésus lui-même, conduit par l'Esprit au désert, a affronté chaque tentation affamé et seul, en répondant par les Écritures. Paul ajoute que Dieu est fidèle et prépare une issue ; cette prière demande des yeux pour la voir et la volonté de la prendre.",
    ),
    prompts: [
      L('Ask the Father to keep you from trials that would overwhelm your faith, and to show you the way out when temptation comes.', "Demande au Père de te garder des épreuves qui submergeraient ta foi, et de te montrer l'issue quand la tentation vient."),
      L('Pray for a believer you know who is fighting a temptation, that God would strengthen them and give them honest friends.', "Prie pour un croyant de ton entourage qui lutte contre une tentation, afin que Dieu le fortifie et lui donne des amis francs."),
      L('Thank Jesus that He faced every kind of temptation without sinning, and that He understands your weakness.', "Remercie Jésus : Il a connu toutes sortes de tentations sans pécher, et Il comprend ta faiblesse."),
    ],
    selfPrompt: L(
      'Bring your weak places under His reign. Name the situation, time of day or screen where you usually fall, and ask for wisdom to change what you can.',
      "Soumets tes points faibles à son règne. Nomme la situation, le moment de la journée ou l'écran où tu tombes d'habitude, et demande la sagesse de changer ce qui peut l'être.",
    ),
    practice: L(
      'Pick one predictable trigger and change one thing about it today — move the phone, take another route, or tell a friend. The way out is often ordinary.',
      "Choisis un déclencheur prévisible et change une chose à son sujet aujourd'hui : déplace ton téléphone, prends un autre chemin ou parles-en à un ami. L'issue est souvent très ordinaire.",
    ),
    resourceTopics: ['holiness', 'lords-prayer', 'discipleship'],
  },
  {
    movement: 'daily',
    theme: { en: 'Deliver us from evil', fr: 'Délivre-nous du mal', es: 'Líbranos del mal', pt: 'Livra-nos do mal', de: 'Erlöse uns von dem Bösen', ru: 'Избавь нас от лукавого', zh: '救我们脱离凶恶', ja: '悪からお救いください', ko: '다만 악에서 구하시옵소서', ar: 'نجّنا من الشرير', fa: 'از شریر ما را رهایی ده', hi: 'बुराई से बचा', id: 'Lepaskanlah kami dari yang jahat', sw: 'Utuokoe na yule mwovu', tl: 'Iligtas mo kami sa masama', am: 'ከክፉ አድነን' },
    ref: 'John 17:13-19',
    related: ['Colossians 1:13-14', 'Ephesians 6:10-18', '2 Thessalonians 3:1-3'],
    reflection: L(
      "The last petition can be read “deliver us from evil” or “from the evil one”; the Greek allows both, and translations differ. Either way, Jesus takes evil seriously without making it the centre. In John 17 He asks the Father not to take His followers out of the world but to protect them from the evil one. Paul describes the believer's defence as truth, righteousness, the gospel, faith, God's word and prayer — not fear, and not suspicion behind every misfortune.",
      "La dernière demande peut se lire « délivre-nous du mal » ou « du Malin » ; le grec permet les deux, et les traductions diffèrent. Dans les deux cas, Jésus prend le mal au sérieux sans en faire le centre. En Jean 17, Il demande au Père non pas de retirer ses disciples du monde, mais de les garder du Malin. Paul décrit la défense du croyant : la vérité, la justice, l'Évangile, la foi, la Parole de Dieu et la prière — et non la peur, ni le soupçon derrière chaque malheur.",
    ),
    prompts: [
      L("Thank the Father that in Christ you no longer belong to darkness but to His Son's kingdom.", "Remercie le Père : en Christ, tu n'appartiens plus aux ténèbres mais au royaume de son Fils."),
      L('Pray for Christians facing persecution or violence, that God would protect them and keep them faithful.', "Prie pour les chrétiens qui subissent la persécution ou la violence, afin que Dieu les protège et les garde fidèles."),
      L('Pray for people trapped in evil — trafficking, abuse, violence — and for those who work to set them free.', "Prie pour les personnes prises au piège du mal — traite, abus, violence — et pour ceux qui travaillent à les libérer."),
    ],
    selfPrompt: L(
      'Bring your fears under His reign. Rather than guessing at hidden causes behind your troubles, take up what Paul names — truth, faith, the word — and pray.',
      "Place tes peurs sous son règne. Plutôt que de chercher des causes cachées derrière tes difficultés, reprends ce que Paul nomme — la vérité, la foi, la Parole — et prie.",
    ),
    practice: L(
      'Pray through the pieces Paul lists in Ephesians 6:14-18 one by one, then pray for one fellow believer by name, as he urges.',
      "Parcours dans la prière, un par un, les éléments que Paul énumère en Éphésiens 6:14-18, puis prie pour un frère ou une sœur en le nommant, comme il y invite.",
    ),
    safetyNote: L(
      'Praying against evil never replaces practical help. If you or someone else is in danger, contact emergency services. If fear or distress stays with you, talk with a pastor and with a doctor or counsellor; spiritual and practical care belong together.',
      "Prier contre le mal ne remplace jamais l'aide concrète. Si toi ou quelqu'un d'autre êtes en danger, contacte les services d'urgence. Si la peur ou la détresse ne te quittent pas, parles-en à un pasteur et à un médecin ou un conseiller : le soin spirituel et le soin concret vont ensemble.",
    ),
    resourceTopics: ['lords-prayer', 'persecution', 'fear'],
  },

  // ── Movement 3 · Kingdom people, sent in hope (days 12–14) ────────────────
  {
    movement: 'sent',
    theme: { en: 'Kingdom people', fr: 'Le peuple du Royaume', es: 'El pueblo del reino', pt: 'O povo do reino', de: 'Menschen des Reiches Gottes', ru: 'Народ Царства', zh: '天国的子民', ja: '神の国の民', ko: '하나님 나라의 백성', ar: 'شعب الملكوت', fa: 'قوم ملکوت', hi: 'परमेश्वर के राज्य के लोग', id: 'Umat Kerajaan Allah', sw: 'Watu wa ufalme wa Mungu', tl: 'Mga tao ng kaharian ng Diyos', am: 'የመንግሥቱ ሕዝብ' },
    ref: 'Matthew 5:1-16',
    related: ['Matthew 20:20-28', 'Romans 12:1-2'],
    reflection: L(
      "The Sermon on the Mount opens by calling blessed the people the world overlooks: the poor in spirit, mourners, the meek, the merciful, peacemakers, the persecuted. Then Jesus calls them salt and light — distinctive and visible, but never domineering. When James and John wanted the places of honour, He said greatness among His followers means serving, as He came to serve and give His life (Matthew 20:25-28). Kingdom people do not seize control; they carry the King's character.",
      "Le Sermon sur la montagne s'ouvre en déclarant heureux ceux que le monde ignore : les pauvres en esprit, ceux qui pleurent, les doux, les miséricordieux, les artisans de paix, les persécutés. Puis Jésus les appelle sel et lumière — différents et visibles, mais jamais dominateurs. Quand Jacques et Jean ont voulu les places d'honneur, Il a répondu que chez ses disciples, être grand, c'est servir, comme Lui-même est venu servir et donner sa vie (Matthieu 20:25-28). Le peuple du Royaume ne cherche pas à prendre le contrôle ; il porte le caractère du Roi.",
    ),
    prompts: [
      L('Pray for peacemakers in places of conflict — in families, churches and nations — that God would sustain them.', "Prie pour les artisans de paix au cœur des conflits — dans les familles, les Églises et les nations —, afin que Dieu les soutienne."),
      L('Ask God to make His church in your town salt and light, known for good works that point to the Father rather than for power or pride.', "Demande à Dieu de faire de son Église dans ta ville un sel et une lumière, connue pour des œuvres bonnes qui renvoient au Père plutôt que pour son pouvoir ou son orgueil."),
      L('Pray for those who mourn and those who feel overlooked, that they would know the blessing Jesus spoke over them.', "Prie pour ceux qui pleurent et ceux qui se sentent oubliés, afin qu'ils connaissent la bénédiction que Jésus a prononcée sur eux."),
    ],
    selfPrompt: L(
      "Bring your ambition under His reign. Where are you seeking status rather than service? Offer Him your body and your plans as a living sacrifice, and ask for a servant's heart.",
      "Place ton ambition sous son règne. Où recherches-tu le prestige plutôt que le service ? Offre-Lui ton corps et tes projets comme un sacrifice vivant, et demande-Lui un cœur de serviteur.",
    ),
    practice: L(
      'Do one hidden act of service today for someone who cannot repay you, and tell no one about it.',
      "Accomplis aujourd'hui un service caché pour quelqu'un qui ne peut pas te le rendre, et n'en parle à personne.",
    ),
    resourceTopics: ['kingdom-of-god', 'character', 'leadership'],
  },
  {
    movement: 'sent',
    theme: { en: 'Sent into the world', fr: 'Envoyés dans le monde', es: 'Enviados al mundo', pt: 'Enviados ao mundo', de: 'Gesandt in die Welt', ru: 'Посланные в мир', zh: '奉差遣进入世界', ja: '世へと遣わされて', ko: '세상으로 보냄 받은 사람들', ar: 'مُرسَلون إلى العالم', fa: 'فرستاده به جهان', hi: 'संसार में भेजे गए', id: 'Diutus ke dalam dunia', sw: 'Tumetumwa ulimwenguni', tl: 'Isinugo sa sanlibutan', am: 'ወደ ዓለም የተላኩ' },
    ref: 'Matthew 9:35-38',
    related: ['Isaiah 52:7-10', 'Acts 1:6-8', 'Matthew 28:18-20'],
    reflection: L(
      "Jesus saw crowds worn out and scattered, with no one to shepherd them, and His heart went out to them. His response was a prayer request: ask the Lord of the harvest to send out workers. In the very next chapter, the ones asked to pray are themselves sent. Later, when the disciples asked whether He would now restore the kingdom to Israel, Jesus redirected them: the Spirit would come on them with power, and they would be His witnesses to the ends of the earth.",
      "Jésus a vu des foules épuisées et dispersées, sans personne pour les conduire, et Il a été ému de compassion. Sa réponse a été une demande de prière : prier le Maître de la moisson d'envoyer des ouvriers. Au chapitre suivant, ceux à qui Il a demandé de prier sont eux-mêmes envoyés. Plus tard, quand les disciples Lui ont demandé s'Il allait maintenant rétablir le royaume pour Israël, Jésus les a réorientés : l'Esprit viendrait sur eux avec puissance, et ils seraient ses témoins jusqu'aux extrémités de la terre.",
    ),
    prompts: [
      L('Ask the Lord of the harvest to send workers to places and peoples with little or no gospel witness.', "Prie le Maître de la moisson d'envoyer des ouvriers vers les lieux et les peuples où l'Évangile est peu ou pas annoncé."),
      L('Pray by name for missionaries, evangelists or church planters you know: for courage, perseverance and joy.', "Prie, en les nommant, pour des missionnaires, des évangélistes ou des implanteurs d'Églises que tu connais : pour leur courage, leur persévérance et leur joie."),
      L("Ask for the Holy Spirit's power to be a faithful witness where you already live, study or work.", "Demande la puissance du Saint-Esprit pour être un témoin fidèle là où tu vis, étudies ou travailles déjà."),
    ],
    selfPrompt: L(
      "Bring your comfort under His reign. Tell Him you are willing to be part of the answer to today's prayer, and ask Him where.",
      "Place ton confort sous son règne. Dis-Lui que tu es prêt à faire partie de la réponse à la prière d'aujourd'hui, et demande-Lui où.",
    ),
    practice: L(
      'Write down the names of three people who do not yet know Christ, pray for each, and look for one natural way this week to show kindness or share your hope.',
      "Écris le nom de trois personnes qui ne connaissent pas encore Christ, prie pour chacune, et cherche cette semaine une manière naturelle de leur montrer de la bonté ou de partager ton espérance.",
    ),
    resourceTopics: ['mission', 'evangelism', 'intercession'],
  },
  {
    movement: 'sent',
    theme: { en: 'Come, Lord Jesus', fr: 'Viens, Seigneur Jésus', es: 'Ven, Señor Jesús', pt: 'Vem, Senhor Jesus', de: 'Komm, Herr Jesus', ru: 'Приди, Господи Иисусе', zh: '主耶稣啊，愿你来', ja: '主イエスよ、来てください', ko: '주 예수여, 오시옵소서', ar: 'تعالَ أيها الرب يسوع', fa: 'بیا ای خداوند عیسی', hi: 'आ, हे प्रभु यीशु', id: 'Datanglah, Tuhan Yesus', sw: 'Njoo, Bwana Yesu', tl: 'Pumarito ka, Panginoong Jesus', am: 'ጌታ ኢየሱስ ሆይ፥ ና' },
    ref: 'Revelation 21:1-7',
    related: ['1 Corinthians 15:20-28', 'Revelation 11:15', 'Revelation 22:17-21'],
    reflection: L(
      "Scripture ends where the Lord's Prayer points: God dwelling with His people, every tear wiped away, death gone, all things made new. Paul says Christ must reign until every enemy is under His feet, and that death itself will be the last enemy defeated. The Bible's closing prayer asks the Lord Jesus to come. Jesus said no one knows the day or the hour (Matthew 24:36), so this hope is not about calculating dates but about living ready — and praying for His kingdom until it fills the earth.",
      "L'Écriture s'achève là où pointe le Notre Père : Dieu habitant avec son peuple, toute larme essuyée, la mort disparue, toutes choses faites nouvelles. Paul dit que Christ doit régner jusqu'à ce que tout ennemi soit sous ses pieds, et que la mort sera le dernier ennemi vaincu. La dernière prière de la Bible demande au Seigneur Jésus de venir. Jésus a dit que personne ne connaît le jour ni l'heure (Matthieu 24:36) : cette espérance ne consiste pas à calculer des dates, mais à vivre prêt — et à prier pour son règne jusqu'à ce qu'il remplisse la terre.",
    ),
    prompts: [
      L('Ask Jesus to come and complete what He began: the dead raised, justice done for the wronged, creation made new.', "Demande à Jésus de venir achever ce qu'Il a commencé : les morts relevés, la justice rendue aux opprimés, la création renouvelée."),
      L('Pray for people who are grieving or suffering today, that they would find hope in the day God wipes away every tear.', "Prie pour ceux qui sont dans le deuil ou la souffrance aujourd'hui, afin qu'ils trouvent l'espérance dans le jour où Dieu essuiera toute larme."),
      L('Worship Christ as the King whose reign will one day fill the whole world, as Revelation 11 announces.', "Adore Christ, le Roi dont le règne remplira un jour le monde entier, comme l'annonce Apocalypse 11."),
    ],
    selfPrompt: L(
      'Bring your whole future under His reign. What would change today if you truly expected His return? Offer Him that change.',
      "Place tout ton avenir sous son règne. Qu'est-ce qui changerait aujourd'hui si tu attendais vraiment son retour ? Offre-Lui ce changement.",
    ),
    practice: L(
      "Each morning this coming week, pray the Lord's Prayer slowly, pausing at each petition to name one person or situation you are carrying.",
      "Chaque matin de la semaine qui vient, prie lentement le Notre Père en t'arrêtant à chaque demande pour nommer une personne ou une situation que tu portes.",
    ),
    resourceTopics: ['end-times', 'kingdom-of-god', 'lords-prayer'],
  },
];
