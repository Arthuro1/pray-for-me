// The 21 days of "Man of God" (see ./manOfGod.js for the plan meta, the
// movements and the guardrails this content is held to).
//
// Day shape follows ./preparingInPrayerDays.js: `theme` in all 16 languages,
// a PRIMARY `ref` plus up to three `related` passages (references only — never
// Bible text), a reflection, three prayer prompts, one small practice, an
// occasional `safetyNote`, and `resourceTopics`. Prose is authored in en + fr;
// the other languages fall back through pick().
//
// The curriculum is built on male biblical examples (Adam, Jesus, Peter,
// Timothy, Joseph, David, Jonathan, Nehemiah, Daniel, Paul) and on pressures
// men commonly name. It is written for single and married men, fathers and men
// without children, young and old, leaders and men with no title at all.
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Movement 1 · A man before God (days 1–5) ─────────────────────────────
  {
    movement: 'before',
    theme: { en: "In God's image, with a garden to keep", fr: "À l'image de Dieu, un jardin à garder", es: 'A imagen de Dios, con un huerto que cuidar', pt: 'À imagem de Deus, com um jardim para cuidar', de: 'Nach Gottes Bild, mit einem Garten betraut', ru: 'Образ Божий и порученный сад', zh: '按神的形像，受托看守园子', ja: '神のかたちに造られ、園を任される', ko: '하나님의 형상, 맡겨진 동산', ar: 'على صورة الله ومؤتمن على جنة', fa: 'به صورت خدا، امانت‌دار باغ', hi: 'परमेश्वर के स्वरूप में, बाग़ का रखवाला', id: 'Segambar Allah, dipercaya menjaga taman', sw: 'Kwa mfano wa Mungu, mlinzi wa bustani', tl: 'Larawan ng Diyos, katiwala ng halamanan', am: 'በእግዚአብሔር መልክ፣ የአትክልት ጠባቂ' },
    ref: 'Genesis 2:7-15',
    related: ['Genesis 1:26-28', 'Psalm 8:3-8'],
    reflection: L(
      "Before Adam had a wife, a child or a reputation to protect, he had breath from God and a garden to work and keep — verbs that also mean to serve and to guard. Genesis 1 gives God's image and the care of creation to male and female together, so the rule it describes is stewardship, never domination. And Christ, the perfect image of God, shows what that looks like in a man's life.",
      "Avant d'avoir une épouse, un enfant ou une réputation à défendre, Adam avait le souffle de Dieu et un jardin à cultiver et à garder — des verbes qui signifient aussi servir et protéger. Genèse 1 confie l'image de Dieu et le soin de la création à l'homme et à la femme ensemble : cette domination est une intendance, jamais une oppression. Et Christ, l'image parfaite de Dieu, montre à quoi elle ressemble dans une vie d'homme.",
    ),
    prompts: [
      L('Thank God for the breath in your lungs today, received from Him before you had achieved anything.', "Remercie Dieu pour le souffle qui est dans tes poumons aujourd'hui, reçu de Lui avant le moindre accomplissement."),
      L('Ask Him to show you what He has placed in your care — people, work, a place — and how to serve and guard it.', "Demande-Lui de te montrer ce qu'Il a placé sous ta garde — des personnes, un travail, un lieu — et comment le servir et le protéger."),
      L('Confess any place where you have treated authority as a right to use people rather than a duty to care for them.', "Confesse les endroits où tu as traité l'autorité comme un droit d'utiliser les autres plutôt que comme un devoir d'en prendre soin."),
    ],
    practice: L(
      'Before tonight, write down three things entrusted to you — a relationship, a responsibility, a place — and pray one sentence over each.',
      "D'ici ce soir, note trois choses qui te sont confiées — une relation, une responsabilité, un lieu — et prie une phrase pour chacune.",
    ),
    resourceTopics: ['manhood', 'identity', 'work'],
  },
  {
    movement: 'before',
    theme: { en: 'A beloved son first', fr: "D'abord un fils bien-aimé", es: 'Primero, hijo amado', pt: 'Primeiro, filho amado', de: 'Zuerst geliebter Sohn', ru: 'Прежде всего — любимый сын', zh: '首先是蒙爱的儿子', ja: 'まず愛される息子として', ko: '먼저 사랑받는 아들', ar: 'ابنٌ محبوب أولًا', fa: 'نخست، پسری محبوب', hi: 'पहले एक प्रिय पुत्र', id: 'Pertama-tama anak yang dikasihi', sw: 'Kwanza, mwana mpendwa', tl: 'Una sa lahat, minamahal na anak', am: 'በመጀመሪያ የተወደደ ልጅ' },
    ref: 'Mark 1:9-13',
    related: ['Matthew 4:1-4', 'Romans 8:14-17'],
    reflection: L(
      "Jesus heard the Father's delight at the Jordan before He had preached a sermon or healed anyone. Then the Spirit drove Him into the wilderness, where the tempter went straight for that very thing, pressing Him to prove He was God's Son. Many men live as if sonship had to be earned by output. In Christ, Paul says, you receive the Spirit of adoption and call God Abba — a son before you are a servant.",
      "Jésus a entendu la joie du Père au Jourdain avant d'avoir prêché ou guéri qui que ce soit. Puis l'Esprit l'a poussé au désert, où le tentateur s'en est pris à cela même, en le sommant de prouver qu'Il était le Fils de Dieu. Beaucoup d'hommes vivent comme si la place de fils se méritait à force de résultats. En Christ, dit Paul, tu reçois l'Esprit d'adoption et tu appelles Dieu « Abba » — fils avant d'être serviteur.",
    ),
    prompts: [
      L('Thank the Father that in Christ you are His son by adoption, not by performance.', 'Remercie le Père : en Christ, tu es Son fils par adoption, non par tes performances.'),
      L('Tell Him where you keep trying to prove yourself — at work, at home, to other men — and ask for rest in His welcome.', "Dis-Lui où tu cherches encore à faire tes preuves — au travail, à la maison, devant d'autres hommes — et demande-Lui le repos de Son accueil."),
      L("If your own father's words or silence still weigh on you, bring that honestly to God, the Father who does not fail.", 'Si les paroles ou le silence de ton propre père pèsent encore sur toi, apporte-le honnêtement à Dieu, le Père qui ne faillit pas.'),
    ],
    practice: L(
      'Today, before you open your work or your messages, pray Romans 8:15 aloud and address God as Father.',
      "Aujourd'hui, avant d'ouvrir ton travail ou tes messages, prie à voix haute Romains 8.15 en appelant Dieu « Père ».",
    ),
    resourceTopics: ['identity', 'manhood'],
  },
  {
    movement: 'before',
    theme: { en: 'A sinful man, called anyway', fr: 'Un homme pécheur, appelé malgré tout', es: 'Un hombre pecador, llamado igualmente', pt: 'Um homem pecador, chamado mesmo assim', de: 'Ein sündiger Mann – und doch berufen', ru: 'Грешный человек — и всё же призван', zh: '是罪人，仍蒙呼召', ja: '罪深い者なのに召される', ko: '죄인이지만 부르심을 받다', ar: 'رجل خاطئ، ومع ذلك مدعوّ', fa: 'مردی گناهکار، اما خوانده‌شده', hi: 'पापी मनुष्य, फिर भी बुलाया गया', id: 'Orang berdosa, tetap dipanggil', sw: 'Mtu mwenye dhambi, bado ameitwa', tl: 'Makasalanan, ngunit tinawag pa rin', am: 'ኃጢአተኛ ሰው፣ ግን የተጠራ' },
    ref: 'Luke 5:1-11',
    related: ['Isaiah 6:1-8', '1 Timothy 1:15-16'],
    reflection: L(
      "Peter knew his own lake better than anyone, and he had caught nothing all night. When the nets began to tear at Jesus' word, Peter did not celebrate the catch; he fell at His knees and called himself a sinful man. Jesus did not argue with the confession — He answered the fear and gave him a calling. Grace does not flatter a man's competence; it meets him at the end of it.",
      "Pierre connaissait son lac mieux que personne, et il n'avait rien pris de toute la nuit. Quand les filets se sont mis à rompre sur la parole de Jésus, il n'a pas fêté la prise : il est tombé à Ses genoux en se disant homme pécheur. Jésus n'a pas contesté cet aveu ; Il a répondu à sa peur et lui a donné un appel. La grâce ne flatte pas la compétence d'un homme : elle le rejoint au bout de celle-ci.",
    ),
    prompts: [
      L('Tell Jesus plainly, as Peter did, the sin you would rather keep hidden behind your competence.', 'Dis simplement à Jésus, comme Pierre, le péché que tu préférerais cacher derrière ta compétence.'),
      L('Thank Him that Christ came into the world to save sinners, and that His mercy reaches you too.', "Remercie-Le : Christ est venu dans le monde pour sauver les pécheurs, et Sa miséricorde t'atteint, toi aussi."),
      L('Ask Him what following Him might mean in the very place where you work, and for courage to leave what He asks you to leave.', "Demande-Lui ce que Le suivre pourrait signifier là même où tu travailles, et le courage de laisser ce qu'Il te demande de laisser."),
    ],
    practice: L(
      'When you start the task you feel most competent at today, stop for ten seconds and hand it to Jesus before you begin.',
      "Au moment d'entamer la tâche où tu te sens le plus compétent aujourd'hui, arrête-toi dix secondes pour la remettre à Jésus avant de commencer.",
    ),
    resourceTopics: ['gospel', 'discipleship'],
  },
  {
    movement: 'before',
    theme: { en: 'The tears of Jesus', fr: 'Les larmes de Jésus', es: 'Las lágrimas de Jesús', pt: 'As lágrimas de Jesus', de: 'Die Tränen Jesu', ru: 'Слёзы Иисуса', zh: '耶稣的眼泪', ja: 'イエスの涙', ko: '예수님의 눈물', ar: 'دموع يسوع', fa: 'اشک‌های عیسی', hi: 'यीशु के आँसू', id: 'Air mata Yesus', sw: 'Machozi ya Yesu', tl: 'Ang mga luha ni Jesus', am: 'የኢየሱስ እንባ' },
    ref: 'John 11:32-44',
    related: ['Hebrews 5:7-8', 'Psalm 13'],
    reflection: L(
      "Jesus knew He was about to raise Lazarus, and still He stood at the grave deeply moved, troubled and in tears. The bystanders did not see weakness; they saw how much He loved. Hebrews adds that He prayed with loud cries and tears, and David's psalms put \"How long?\" on a king's lips. Whatever you were taught about men and feelings, the perfect man hid His heart neither from God nor from His friends.",
      "Jésus savait qu'Il allait ressusciter Lazare, et pourtant, devant la tombe, Il a été profondément ému, troublé, en larmes. Les témoins n'y ont pas vu de la faiblesse : ils ont vu combien Il aimait. L'épître aux Hébreux ajoute qu'Il a prié avec de grands cris et avec larmes, et les psaumes de David mettent « Jusqu'à quand ? » dans la bouche d'un roi. Quoi qu'on t'ait appris sur les hommes et les émotions, l'homme parfait n'a caché son cœur ni à Dieu ni à ses amis.",
    ),
    prompts: [
      L('Tell God honestly what you are carrying today — grief, fear, anger or tiredness — and name it with one plain word.', "Dis honnêtement à Dieu ce que tu portes aujourd'hui — chagrin, peur, colère ou fatigue — et nomme-le d'un seul mot simple."),
      L('Thank Jesus that He knows grief from the inside and is not ashamed of your tears.', "Remercie Jésus : Il connaît le chagrin de l'intérieur et n'a pas honte de tes larmes."),
      L('Pray for a man you know who is carrying something alone, that he would find someone safe to tell.', "Prie pour un homme de ton entourage qui porte quelque chose seul, afin qu'il trouve quelqu'un de sûr à qui en parler."),
    ],
    practice: L(
      'Pray Psalm 13 slowly, then write two lines of your own "How long?" and one line of trust, as David does.',
      "Prie lentement le Psaume 13, puis écris deux lignes de ton propre « Jusqu'à quand ? » et une ligne de confiance, comme David.",
    ),
    safetyNote: L(
      'If heaviness has stayed with you for weeks, or you have had thoughts of ending your life, please tell someone today — a doctor, your pastor or a trusted friend. If you are in immediate danger, call your local emergency number.',
      "Si une lourdeur te pèse depuis des semaines, ou si tu as eu des pensées de mettre fin à tes jours, parles-en aujourd'hui à quelqu'un — un médecin, ton pasteur ou un ami de confiance. Si tu es en danger immédiat, appelle le numéro d'urgence de ton pays.",
    ),
    resourceTopics: ['lament', 'manhood', 'prayer'],
  },
  {
    movement: 'before',
    theme: { en: 'Power, love and self-control', fr: 'Force, amour et maîtrise de soi', es: 'Poder, amor y dominio propio', pt: 'Poder, amor e domínio próprio', de: 'Kraft, Liebe und Besonnenheit', ru: 'Сила, любовь и самообладание', zh: '刚强、仁爱、谨守', ja: '力と愛と慎み', ko: '능력과 사랑과 절제', ar: 'القوة والمحبة وضبط النفس', fa: 'قدرت، محبت و انضباط', hi: 'सामर्थ्य, प्रेम और संयम', id: 'Kekuatan, kasih dan penguasaan diri', sw: 'Nguvu, upendo na moyo wa kiasi', tl: 'Kapangyarihan, pag-ibig at pagpipigil', am: 'ኃይል፣ ፍቅርና ራስን መግዛት' },
    ref: '2 Timothy 1:3-7',
    related: ['Acts 16:1-3', '1 Corinthians 12:12-20'],
    reflection: L(
      "Timothy's faith reached him through his grandmother Lois and his mother Eunice; Acts says only that his father was Greek. Paul sees no deficit in that: he calls it a sincere faith that now lives in Timothy too. He reminds a young and perhaps timid man that God has given a Spirit not of fear but of power, love and self-control, and urges him to fan into flame the gift he received. The Spirit is not given so that you live small, nor alone: gifts are for the body.",
      "La foi de Timothée lui est venue par sa grand-mère Loïs et sa mère Eunice ; les Actes disent seulement que son père était grec. Paul n'y voit aucun manque : il parle d'une foi sincère qui habite maintenant Timothée aussi. Il rappelle à ce jeune homme, peut-être timide, que Dieu a donné un Esprit non de crainte, mais de force, d'amour et de maîtrise de soi, et l'exhorte à ranimer le don qu'il a reçu. L'Esprit ne t'est pas donné pour vivre à l'étroit, ni pour vivre seul : les dons sont pour le corps.",
    ),
    prompts: [
      L('Thank God for the people — women and men — through whom faith reached you, naming them one by one.', "Remercie Dieu pour les personnes — femmes et hommes — par qui la foi t'est parvenue, en les nommant une à une."),
      L('Ask the Holy Spirit to fill you afresh and to stir up whatever gift has gone cold in you.', "Demande au Saint-Esprit de te remplir à nouveau et de ranimer le don qui s'est refroidi en toi."),
      L('Where fear has made you passive, ask Him for power held together by love and self-control.', "Là où la peur t'a rendu passif, demande-Lui une force tenue ensemble par l'amour et la maîtrise de soi."),
    ],
    practice: L(
      'This week, offer one concrete service in your church that uses a gift you have left unused, and tell a leader you are available.',
      'Cette semaine, propose dans ton Église un service concret qui mette en œuvre un don laissé en sommeil, et dis à un responsable que tu es disponible.',
    ),
    resourceTopics: ['spiritual-gifts', 'church', 'discipleship'],
  },

  // ── Movement 2 · Character and holiness (days 6–10) ──────────────────────
  {
    movement: 'character',
    theme: { en: 'Rooted like a tree', fr: 'Enraciné comme un arbre', es: 'Arraigado como un árbol', pt: 'Enraizado como uma árvore', de: 'Verwurzelt wie ein Baum', ru: 'Укоренён, как дерево', zh: '如树栽在溪水旁', ja: '流れのほとりに植えられた木', ko: '시냇가에 심은 나무', ar: 'كشجرة مغروسة عند المياه', fa: 'چون درختی ریشه‌دار', hi: 'जल के किनारे लगा पेड़', id: 'Seperti pohon yang berakar', sw: 'Kama mti uliopandwa', tl: 'Parang punong nakaugat', am: 'እንደ ተተከለ ዛፍ' },
    ref: 'Psalm 1',
    related: ['Jeremiah 17:5-8'],
    reflection: L(
      "Psalm 1 traces a slow drift — walking by the counsel of the wicked, then standing in their way, then sitting with the scoffers — and sets against it a man whose delight is God's instruction. Character grows the way a tree does: unseen roots, slow seasons, fruit when its time comes. Jeremiah's picture of the same tree still faces heat and drought; being rooted does not spare a man the dry year, it keeps him from withering in it.",
      "Le Psaume 1 décrit une lente dérive — marcher selon le conseil des méchants, puis s'arrêter sur leur chemin, puis s'asseoir avec les moqueurs — et lui oppose un homme qui trouve son plaisir dans l'enseignement de Dieu. Le caractère pousse comme un arbre : des racines invisibles, des saisons lentes, du fruit en son temps. Chez Jérémie, le même arbre connaît encore la chaleur et la sécheresse : être enraciné n'épargne pas l'année sèche à un homme, cela l'empêche d'y dépérir.",
    ),
    prompts: [
      L('Ask God to show you whose counsel you have been walking in lately — the voices, feeds and friends that shape your thinking.', "Demande à Dieu de te montrer selon quels conseils tu marches ces temps-ci — les voix, les fils d'actualité et les amis qui façonnent ta pensée."),
      L('Ask Him for real delight in His word, not only a sense of duty to read it.', 'Demande-Lui un vrai plaisir dans Sa Parole, et pas seulement le sentiment du devoir de la lire.'),
      L('If you are in a dry season, thank Him that roots can go on drinking when nothing seems to grow.', 'Si tu traverses une saison sèche, remercie-Le : les racines peuvent continuer à boire quand rien ne semble pousser.'),
    ],
    practice: L(
      'Choose one short passage for this week, read it each morning, and carry one phrase from it into your day.',
      'Choisis un court passage pour cette semaine, relis-le chaque matin et emporte une de ses phrases dans ta journée.',
    ),
    resourceTopics: ['character', 'spiritual-rhythms', 'wisdom'],
  },
  {
    movement: 'character',
    theme: { en: 'Joseph and the unseen test', fr: "Joseph et l'épreuve cachée", es: 'José y la prueba oculta', pt: 'José e a prova oculta', de: 'Josef und die verborgene Prüfung', ru: 'Иосиф и скрытое испытание', zh: '约瑟与无人看见的考验', ja: 'ヨセフと人知れぬ試み', ko: '요셉과 아무도 보지 않는 시험', ar: 'يوسف والامتحان الخفي', fa: 'یوسف و آزمون پنهان', hi: 'यूसुफ़ और छिपी परीक्षा', id: 'Yusuf dan ujian tersembunyi', sw: 'Yusufu na jaribu la sirini', tl: 'Si Jose at ang lihim na pagsubok', am: 'ዮሴፍና የተሰወረው ፈተና' },
    ref: 'Genesis 39:1-12',
    related: ['Genesis 39:20-23', 'Psalm 15'],
    reflection: L(
      "Joseph was a slave far from home, trusted with everything in Potiphar's house, and pressed day after day by someone with power over him. His answer was not about his reputation — no one would have known — but about trust: his master's, and above all God's. Integrity cost him his position and his freedom, and the story does not hurry to reward him; it says only that the LORD was with Joseph in the prison too.",
      "Joseph était un esclave loin de chez lui, à qui l'on avait confié toute la maison de Potiphar, et que quelqu'un qui avait autorité sur lui pressait jour après jour. Sa réponse ne tenait pas à sa réputation — personne n'en aurait rien su — mais à la confiance : celle de son maître et, avant tout, celle de Dieu. Son intégrité lui a coûté sa place et sa liberté, et le récit ne se presse pas de le récompenser ; il dit seulement que l'Éternel était avec Joseph, jusque dans la prison.",
    ),
    prompts: [
      L('Ask God for a faithfulness that stays the same whether or not anyone is watching.', "Demande à Dieu une fidélité qui reste la même, qu'on te regarde ou non."),
      L('Bring Him one area — money, time, words, a screen — where your private life and your public life have drifted apart.', "Apporte-Lui un domaine — l'argent, le temps, les paroles, un écran — où ta vie privée et ta vie publique se sont éloignées l'une de l'autre."),
      L('Pray for men who are paying a price for doing right, that they would know the Lord is with them there.', "Prie pour les hommes qui paient le prix d'avoir bien agi, afin qu'ils sachent que le Seigneur est avec eux, là où ils sont."),
    ],
    practice: L(
      'Today, finish one task or keep one commitment exactly as agreed, including the part no one will check.',
      "Aujourd'hui, termine une tâche ou tiens un engagement exactement comme convenu, y compris la partie que personne ne vérifiera.",
    ),
    resourceTopics: ['character', 'work', 'manhood'],
  },
  {
    movement: 'character',
    theme: { en: 'Honouring God with your body', fr: 'Honorer Dieu dans son corps', es: 'Honrar a Dios con el cuerpo', pt: 'Honrar a Deus com o corpo', de: 'Gott mit dem Körper ehren', ru: 'Чтить Бога в своём теле', zh: '在身子上荣耀神', ja: 'からだをもって神をあがめる', ko: '몸으로 하나님을 영화롭게', ar: 'مجّد الله في جسدك', fa: 'با بدن خود خدا را جلال بده', hi: 'अपनी देह से परमेश्वर का आदर', id: 'Menghormati Allah dengan tubuh', sw: 'Kumtukuza Mungu kwa mwili', tl: 'Parangalan ang Diyos sa katawan', am: 'እግዚአብሔርን በሰውነት ማክበር' },
    ref: '1 Thessalonians 4:1-8',
    related: ['Job 31:1', '2 Timothy 2:22'],
    reflection: L(
      "Paul sets sexual holiness inside God's will for your whole life: learning to govern your own body in holiness and honour, unlike those who do not know God. He names what men often skip — sexual sin wrongs another person, someone made in God's image and never an object. And he ends with a gift, not a threat: God gives you His Holy Spirit. Job made a covenant with his eyes; that choice is renewed daily, and not alone.",
      "Paul place la sainteté sexuelle au cœur de la volonté de Dieu pour toute ta vie : apprendre à tenir ton propre corps dans la sainteté et l'honneur, à la différence de ceux qui ne connaissent pas Dieu. Il nomme ce que les hommes oublient souvent : le péché sexuel fait du tort à une autre personne, créée à l'image de Dieu, jamais un objet. Et il termine par un don, non par une menace : Dieu te donne Son Saint-Esprit. Job avait fait un pacte avec ses yeux ; ce choix se renouvelle chaque jour, et pas seul.",
    ),
    prompts: [
      L('Tell God the truth about your sexual life and thoughts, without excuses and without hiding, knowing He already sees.', "Dis à Dieu la vérité sur ta vie et tes pensées sexuelles, sans excuse et sans te cacher, en sachant qu'Il voit déjà."),
      L('Pray for the women you will see today — on screens, at work, in the street — as sisters and mothers to be honoured, never used.', "Prie pour les femmes que tu verras aujourd'hui — sur un écran, au travail, dans la rue — comme des sœurs et des mères à honorer, jamais des objets à utiliser."),
      L('Ask the Holy Spirit for self-control, and for the humility to let another believer walk with you in this.', "Demande au Saint-Esprit la maîtrise de soi, et l'humilité de laisser un autre croyant marcher avec toi dans ce domaine."),
    ],
    practice: L(
      'Choose one practical safeguard today — a filter, a changed evening habit, a phone left outside the bedroom — and tell one trusted man you have done it.',
      "Choisis aujourd'hui une protection concrète — un filtre, une habitude du soir changée, le téléphone laissé hors de la chambre — et dis-le à un homme de confiance.",
    ),
    safetyNote: L(
      'If pornography or another sexual habit has a grip on you, you are not beyond help, and shame is not the way out. Tell a pastor, a mature believer you trust or a qualified counsellor, and consider accountability software. If anything you have viewed or done involves a minor or someone who did not consent, stop and seek professional help immediately.',
      "Si la pornographie ou une autre habitude sexuelle a prise sur toi, tu n'es pas hors d'atteinte de l'aide, et la honte n'est pas une issue. Parles-en à un pasteur, à un croyant mûr de confiance ou à un conseiller qualifié, et envisage un logiciel de redevabilité. Si ce que tu as regardé ou fait implique un mineur ou une personne non consentante, arrête-toi et cherche immédiatement une aide professionnelle.",
    ),
    resourceTopics: ['sexuality', 'purity', 'pornography', 'holiness'],
  },
  {
    movement: 'character',
    theme: { en: 'Strength under control', fr: 'La force maîtrisée', es: 'Fuerza bajo control', pt: 'Força sob controle', de: 'Beherrschte Stärke', ru: 'Сила под контролем', zh: '受约束的力量', ja: '制御された強さ', ko: '절제된 힘', ar: 'قوة منضبطة', fa: 'نیروی مهارشده', hi: 'संयमित शक्ति', id: 'Kekuatan yang terkendali', sw: 'Nguvu iliyotawaliwa', tl: 'Lakas na may pagpipigil', am: 'የተገዛ ብርታት' },
    ref: 'Titus 2:11-14',
    related: ['Titus 2:6-8', 'Proverbs 16:32', '1 Timothy 3:1-7'],
    reflection: L(
      "The one quality Paul tells Titus to urge on younger men is self-control, and he does not leave it to willpower: the grace of God that brings salvation is what trains us to say no. Proverbs calls the man who rules his own temper stronger than one who captures a city. And Paul's portrait of a church overseer — Christians differ on who may hold that office, but not on the character it describes — rules out the violent and the quarrelsome.",
      "La seule qualité que Paul demande à Tite de recommander aux jeunes hommes est la maîtrise de soi, et il ne la laisse pas à la seule volonté : c'est la grâce de Dieu, source de salut, qui nous apprend à dire non. Les Proverbes jugent l'homme qui maîtrise sa colère plus fort que celui qui prend une ville. Et le portrait que Paul fait du responsable d'Église — les chrétiens divergent sur qui peut exercer cette charge, non sur le caractère qu'elle décrit — exclut l'homme violent et querelleur.",
    ),
    prompts: [
      L('Tell God honestly what makes you angry, and what your anger has cost the people around you.', "Dis honnêtement à Dieu ce qui te met en colère, et ce que ta colère a coûté à ceux qui t'entourent."),
      L('Thank Him that His grace does not only forgive you but trains you, day by day, to live differently.', "Remercie-Le : Sa grâce ne fait pas que te pardonner, elle t'éduque jour après jour à vivre autrement."),
      L('Ask the Spirit for gentleness in the very moment you usually harden your voice or retreat into a punishing silence.', "Demande à l'Esprit la douceur au moment précis où, d'habitude, ta voix se durcit ou tu te réfugies dans un silence qui punit."),
    ],
    practice: L(
      'Name one situation that usually sets you off, and decide now what you will do when it comes: stop, breathe, and pray one sentence before you speak.',
      "Nomme une situation qui te fait habituellement exploser, et décide dès maintenant ce que tu feras quand elle arrivera : t'arrêter, respirer, prier une phrase avant de parler.",
    ),
    safetyNote: L(
      'If your anger has ever frightened, threatened or hurt someone, or you fear it might, do not wait: speak to a pastor or a counsellor this week, and look for a programme that helps men stop violent behaviour. If anyone is in danger now, call your local emergency number.',
      "Si ta colère a déjà effrayé, menacé ou blessé quelqu'un, ou si tu crains qu'elle le fasse, n'attends pas : parles-en cette semaine à un pasteur ou à un conseiller, et cherche un accompagnement qui aide les hommes à sortir de la violence. Si quelqu'un est en danger maintenant, appelle le numéro d'urgence de ton pays.",
    ),
    resourceTopics: ['character', 'manhood', 'conflict'],
  },
  {
    movement: 'character',
    theme: { en: 'David, power and repentance', fr: 'David, le pouvoir et la repentance', es: 'David, el poder y el arrepentimiento', pt: 'Davi, o poder e o arrependimento', de: 'David, Macht und Umkehr', ru: 'Давид: власть и покаяние', zh: '大卫：权力与悔改', ja: 'ダビデ――権力と悔い改め', ko: '다윗, 권력과 회개', ar: 'داود: السلطة والتوبة', fa: 'داوود، قدرت و توبه', hi: 'दाऊद: सत्ता और पश्चाताप', id: 'Daud: kuasa dan pertobatan', sw: 'Daudi: mamlaka na toba', tl: 'Si David: kapangyarihan at pagsisisi', am: 'ዳዊት፦ ሥልጣንና ንስሐ' },
    ref: '2 Samuel 12:1-13',
    related: ['2 Samuel 11:1-5', 'Psalm 51:1-12'],
    reflection: L(
      "The verbs of 2 Samuel 11 belong to the king: David stayed home, saw, sent, took, and later arranged a man's death. Nathan's story of the rich man and the poor man's lamb puts the weight exactly where it belongs — on the one with power — and Bathsheba is the lamb, not the villain. David's reply is short and unguarded: he names his sin against the LORD, with no excuse. Forgiveness came at once; the consequences did not disappear.",
      "Dans 2 Samuel 11, les verbes appartiennent au roi : David est resté chez lui, il a vu, envoyé chercher, pris, puis organisé la mort d'un homme. L'histoire que raconte Nathan — le riche et la petite brebis du pauvre — met le poids exactement là où il doit être : sur celui qui a le pouvoir, et Bath-Shéba est la brebis, non la coupable. La réponse de David est brève et sans défense : il reconnaît son péché contre l'Éternel, sans excuse. Le pardon est venu aussitôt ; les conséquences, elles, n'ont pas disparu.",
    ),
    prompts: [
      L('Ask God to show you where you have used position, strength or money to take what was not yours to take.', "Demande à Dieu de te montrer où tu as utilisé ta position, ta force ou ton argent pour prendre ce qui ne t'appartenait pas."),
      L('Confess your sin to Him plainly, as David finally did, without blaming anyone else.', "Confesse-Lui ton péché simplement, comme David a fini par le faire, sans accuser personne d'autre."),
      L('Thank God for any Nathan in your life, and ask for the humility to hear the next hard word you need.', "Remercie Dieu pour tout Nathan présent dans ta vie, et demande-Lui l'humilité d'entendre la prochaine parole difficile dont tu auras besoin."),
    ],
    practice: L(
      'Pray Psalm 51:1-12 slowly today. If there is a wrong you need to put right, write down the first honest step and who can help you take it.',
      "Prie lentement aujourd'hui Psaume 51.1-12. S'il y a un tort à réparer, note le premier pas honnête à faire et qui peut t'aider à le faire.",
    ),
    safetyNote: L(
      'If you have used power — at work, in church, at home — to pressure someone sexually or to harm them, repentance includes stopping now, seeking help from a pastor or counsellor, and accepting accountability, including before the authorities where that applies. Do not contact the person you harmed in any way that puts pressure on them.',
      "Si tu as utilisé ton pouvoir — au travail, dans l'Église, chez toi — pour faire pression sur quelqu'un sexuellement ou pour lui nuire, la repentance passe par l'arrêt immédiat, l'aide d'un pasteur ou d'un conseiller, et le fait d'accepter de rendre des comptes, y compris devant les autorités lorsque c'est le cas. Ne contacte pas la personne blessée d'une manière qui ferait pression sur elle.",
    ),
    resourceTopics: ['holiness', 'forgiveness', 'leadership'],
  },

  // ── Movement 3 · Relationships and responsibility (days 11–15) ───────────
  {
    movement: 'relationships',
    theme: { en: 'Jonathan, a friend in God', fr: 'Jonathan, un ami en Dieu', es: 'Jonatán, un amigo en Dios', pt: 'Jônatas, um amigo em Deus', de: 'Jonatan, ein Freund in Gott', ru: 'Ионафан — друг в Боге', zh: '约拿单：在神里的朋友', ja: 'ヨナタン――神にある友', ko: '요나단, 하나님 안의 친구', ar: 'يوناثان، صديق في الله', fa: 'یوناتان، دوستی در خدا', hi: 'योनातान, परमेश्वर में मित्र', id: 'Yonatan, sahabat di dalam Allah', sw: 'Yonathani, rafiki katika Mungu', tl: 'Si Jonatan, kaibigan sa Diyos', am: 'ዮናታን፣ በእግዚአብሔር ወዳጅ' },
    ref: '1 Samuel 18:1-4',
    related: ['1 Samuel 20:35-42', '1 Samuel 23:15-18', 'Proverbs 27:17'],
    reflection: L(
      "Jonathan was heir to the throne, and he handed David his robe, his sword and his bow — the signs of the future he was giving up. Later the two men kissed and wept together, David most of all, and when David was being hunted, Jonathan went out to find him and strengthened his hand in God. Many men have colleagues, teammates and contacts, yet no one who knows them like that. Covenant friendship is costly, and it belongs to a faithful life.",
      "Jonathan était l'héritier du trône, et il a remis à David son manteau, son épée et son arc — les signes de l'avenir auquel il renonçait. Plus tard, les deux hommes se sont embrassés et ont pleuré ensemble, David plus encore, et quand David était traqué, Jonathan est allé le trouver pour fortifier sa confiance en Dieu. Beaucoup d'hommes ont des collègues, des coéquipiers et des contacts, mais personne qui les connaisse ainsi. L'amitié d'alliance coûte, et elle fait partie d'une vie fidèle.",
    ),
    prompts: [
      L('Thank God for the friends who have strengthened your hand in Him, and name them before Him.', "Remercie Dieu pour les amis qui t'ont fortifié en Lui, et nomme-les devant Lui."),
      L('If you have no friend who knows you well, tell God so honestly, and ask Him to lead you to one.', "Si tu n'as aucun ami qui te connaisse vraiment, dis-le honnêtement à Dieu, et demande-Lui de te conduire vers quelqu'un."),
      L("Ask for Jonathan's freedom from rivalry, so that another man's success no longer feels like your loss.", "Demande la liberté de Jonathan face à la rivalité, pour que la réussite d'un autre homme ne te paraisse plus une perte."),
    ],
    practice: L(
      'Contact one man this week — not with a task or a favour, but to ask how he really is and to pray for him.',
      "Cette semaine, contacte un homme — non pour une tâche ou un service, mais pour lui demander comment il va vraiment et prier pour lui.",
    ),
    resourceTopics: ['friendship', 'manhood', 'community'],
  },
  {
    movement: 'relationships',
    theme: { en: 'Seeing women as Jesus did', fr: 'Regarder les femmes comme Jésus', es: 'Mirar a las mujeres como Jesús', pt: 'Ver as mulheres como Jesus', de: 'Frauen sehen wie Jesus', ru: 'Смотреть на женщин, как Иисус', zh: '像耶稣那样看待女性', ja: 'イエスのように女性を見る', ko: '예수님처럼 여성을 바라보기', ar: 'أن ترى المرأة كما رآها يسوع', fa: 'زنان را چون عیسی دیدن', hi: 'स्त्रियों को यीशु की दृष्टि से देखना', id: 'Memandang perempuan seperti Yesus', sw: 'Kuwaona wanawake kama Yesu', tl: 'Tingnan ang kababaihan gaya ni Jesus', am: 'ሴቶችን እንደ ኢየሱስ ማየት' },
    ref: 'Luke 7:36-50',
    related: ['1 Timothy 5:1-2', 'Luke 8:1-3'],
    reflection: L(
      "Simon looked at the woman at Jesus' feet and saw a category: what sort of woman she was. Jesus turned towards her and asked Simon whether he actually saw her — a person, forgiven and loving much. Luke then names women who travelled with Jesus and funded His mission, and Paul tells Timothy to treat women as mothers and sisters, in all purity. Honour means seeing a woman as a whole person, respecting her no, and never using strength or status to control her.",
      "Simon a regardé la femme aux pieds de Jésus et n'a vu qu'une étiquette : quel genre de femme c'était. Jésus s'est tourné vers elle et a demandé à Simon s'il la voyait vraiment — une personne, pardonnée, qui aimait beaucoup. Luc nomme ensuite des femmes qui accompagnaient Jésus et soutenaient Sa mission de leurs biens, et Paul demande à Timothée de traiter les femmes comme des mères et des sœurs, en toute pureté. Honorer, c'est voir une femme comme une personne entière, respecter son « non », et ne jamais user de sa force ou de son statut pour la contrôler.",
    ),
    prompts: [
      L('Ask Jesus to show you where you have seen women as categories — useful, attractive, difficult — rather than as persons.', "Demande à Jésus de te montrer où tu as vu les femmes comme des catégories — utiles, attirantes, difficiles — plutôt que comme des personnes."),
      L('Thank God for women whose faith, work and courage have blessed your life, naming them one by one.', 'Remercie Dieu pour les femmes dont la foi, le travail et le courage ont béni ta vie, en les nommant une à une.'),
      L('Pray for women near you who are being harassed, silenced or controlled, and ask Him what faithful step you could take.', "Prie pour les femmes de ton entourage qui sont harcelées, réduites au silence ou contrôlées, et demande-Lui quel pas fidèle tu pourrais faire."),
    ],
    practice: L(
      'In one conversation today, listen to a woman fully — without interrupting, correcting or steering — and thank her for what she said.',
      "Dans une conversation aujourd'hui, écoute une femme jusqu'au bout — sans l'interrompre, la corriger ni orienter l'échange — et remercie-la pour ce qu'elle a dit.",
    ),
    resourceTopics: ['manhood', 'character', 'justice'],
  },
  {
    movement: 'relationships',
    theme: { en: 'Love that lays itself down', fr: "L'amour qui se donne", es: 'El amor que se entrega', pt: 'O amor que se entrega', de: 'Liebe, die sich hingibt', ru: 'Любовь, отдающая себя', zh: '舍己的爱', ja: '自分を与える愛', ko: '자신을 내어주는 사랑', ar: 'المحبة التي تبذل ذاتها', fa: 'محبتی که خود را فدا می‌کند', hi: 'स्वयं को दे देने वाला प्रेम', id: 'Kasih yang memberi diri', sw: 'Upendo unaojitoa', tl: 'Pag-ibig na nag-aalay ng sarili', am: 'ራሱን አሳልፎ የሚሰጥ ፍቅር' },
    ref: 'Ephesians 5:21-33',
    related: ['Colossians 3:19', '1 Peter 3:7', '1 Corinthians 7:7-8'],
    reflection: L(
      "Christians who love this passage read the word 'head' differently: some see a husband's loving, servant leadership; others read verse 21, mutual submission out of reverence for Christ, as the frame for all that follows. Both readings agree on what Paul asks of husbands — to love as Christ loved the church and gave Himself up for her, to nourish and cherish, never to be harsh. And Jesus, the only perfect man, never married; Paul, too, was single when he wrote. Christlike love is every man's calling, married or single.",
      "Les chrétiens qui aiment ce passage lisent différemment le mot « chef » : certains y voient une direction aimante et servante du mari ; d'autres lisent le verset 21 — la soumission mutuelle dans la crainte de Christ — comme le cadre de tout ce qui suit. Les deux lectures s'accordent sur ce que Paul demande aux maris : aimer comme Christ a aimé l'Église et s'est livré pour elle, nourrir et chérir, ne jamais être dur. Et Jésus, le seul homme parfait, ne s'est jamais marié ; Paul, lui aussi, était célibataire quand il écrivait. Aimer à la manière de Christ est l'appel de tout homme, marié ou célibataire.",
    ),
    prompts: [
      L('Thank Christ that He gave Himself up for His people, and let that, not rank, define love for you.', "Remercie Christ de s'être livré pour Son peuple, et laisse cela, non le rang, définir l'amour pour toi."),
      L('If you are married, ask God for one concrete way to nourish and cherish your wife this week; if not, pray for the marriages around you.', "Si tu es marié, demande à Dieu une manière concrète de nourrir et chérir ta femme cette semaine ; sinon, prie pour les couples qui t'entourent."),
      L('Confess any harshness, control or self-interest you have ever called leadership, and ask for a love that serves.', "Confesse toute dureté, tout contrôle ou tout intérêt personnel que tu as un jour appelé « direction », et demande un amour qui sert."),
    ],
    practice: L(
      'Do one hidden act of service today for someone close to you — wife, family member, housemate or friend — and tell no one.',
      "Accomplis aujourd'hui un service discret pour une personne proche — ta femme, un membre de ta famille, un colocataire ou un ami — sans le dire à personne.",
    ),
    safetyNote: L(
      'This passage never licenses control, threats or violence. If anyone in your home is afraid of you, or you are afraid at home, speak to a pastor or counsellor you trust, and if someone is in danger, call your local emergency number.',
      "Ce passage n'autorise jamais le contrôle, les menaces ou la violence. Si quelqu'un chez toi a peur de toi, ou si tu as peur chez toi, parles-en à un pasteur ou à un conseiller de confiance, et si quelqu'un est en danger, appelle le numéro d'urgence de ton pays.",
    ),
    resourceTopics: ['marriage', 'marriage-roles'],
  },
  {
    movement: 'relationships',
    theme: { en: 'Protect, never exploit', fr: 'Protéger sans exploiter', es: 'Proteger, nunca explotar', pt: 'Proteger, nunca explorar', de: 'Schützen, nicht ausnutzen', ru: 'Защищать, а не использовать', zh: '保护而不剥削', ja: '守る、決して搾取しない', ko: '보호하되 착취하지 않기', ar: 'احمِ ولا تستغلّ', fa: 'محافظت کن، بهره‌کشی نکن', hi: 'रक्षा करो, शोषण नहीं', id: 'Melindungi, bukan memanfaatkan', sw: 'Linda, usinyonye', tl: 'Ipagtanggol, huwag samantalahin', am: 'ጠብቅ እንጂ አትበዝብዝ' },
    ref: 'Nehemiah 5:6-15',
    related: ['Nehemiah 4:13-14', 'Micah 6:8'],
    reflection: L(
      "When Nehemiah heard that poorer families were losing their fields, and even their daughters, to debt, he was very angry — and then he thought it through before he spoke. He confronted the powerful, made them give back what they had taken, and refused the governor's allowance his predecessors had squeezed from the people, because he feared God. Earlier he had stationed the people, clan by clan, to defend their families and homes. In Scripture, protecting means spending strength for the vulnerable, never holding power over them.",
      "Quand Néhémie a appris que des familles pauvres perdaient leurs champs, et même leurs filles, à cause des dettes, il a été très irrité — puis il a réfléchi avant de parler. Il a confronté les puissants, leur a fait rendre ce qu'ils avaient pris, et a refusé l'indemnité de gouverneur que ses prédécesseurs prélevaient sur le peuple, par crainte de Dieu. Plus tôt, il avait posté le peuple, famille par famille, pour défendre les siens et leurs maisons. Dans l'Écriture, protéger, c'est dépenser sa force pour les plus vulnérables, jamais exercer un pouvoir sur eux.",
    ),
    prompts: [
      L('Ask God to show you who is vulnerable within your reach — at home, at work, in your street — and how to stand with them.', "Demande à Dieu de te montrer qui est vulnérable autour de toi — à la maison, au travail, dans ta rue — et comment te tenir à ses côtés."),
      L('Bring Him any anger you feel at injustice, and ask for the self-control Nehemiah showed before he acted.', "Apporte-Lui ta colère face à l'injustice, et demande la maîtrise de soi dont Néhémie a fait preuve avant d'agir."),
      L("Confess any way you have called control 'protection' — deciding for others, checking up on them, limiting their freedom.", "Confesse les façons dont tu as appelé « protection » ce qui était du contrôle — décider pour les autres, les surveiller, limiter leur liberté."),
    ],
    practice: L(
      'Pray Micah 6:8 today, then take one step of justice or kindness: pay a debt, speak up for someone, or give up an advantage you hold.',
      "Prie aujourd'hui Michée 6.8, puis fais un pas de justice ou de bonté : régler une dette, prendre la parole pour quelqu'un, ou renoncer à un avantage que tu détiens.",
    ),
    resourceTopics: ['leadership', 'justice', 'manhood'],
  },
  {
    movement: 'relationships',
    theme: { en: 'Man of God: flee and pursue', fr: 'Homme de Dieu : fuis et recherche', es: 'Hombre de Dios: huye y sigue', pt: 'Homem de Deus: foge e segue', de: 'Mann Gottes: fliehe und jage nach', ru: 'Человек Божий: убегай и стремись', zh: '属神的人：逃避与追求', ja: '神の人よ、避けて追い求めよ', ko: '하나님의 사람: 피하고 따르라', ar: 'يا إنسان الله: اهرب واتبع', fa: 'مرد خدا: بگریز و پیروی کن', hi: 'परमेश्वर का जन: भाग और पीछा कर', id: 'Manusia Allah: jauhi dan kejarlah', sw: 'Mtu wa Mungu: kimbia na fuata', tl: 'Tao ng Diyos: lumayo at magsikap', am: 'የእግዚአብሔር ሰው ሆይ፦ ሽሽ ተከተልም' },
    ref: '1 Timothy 6:6-12',
    related: ['1 Timothy 5:8', 'Proverbs 30:7-9'],
    reflection: L(
      "Paul's title 'man of God' comes straight after a warning about money: those who crave riches wander from the faith and pierce themselves with many griefs. Timothy is told to flee that and to pursue righteousness, faith, love, steadfastness and gentleness. Scripture does expect you to provide for those who depend on you, as you are able; it never makes your income the measure of your worth. Agur asked for neither poverty nor riches, only enough to stay near God.",
      "Les mots « homme de Dieu » viennent juste après une mise en garde sur l'argent : ceux qui veulent s'enrichir s'égarent loin de la foi et se transpercent de bien des tourments. Timothée doit fuir cela et rechercher la justice, la foi, l'amour, la persévérance et la douceur. L'Écriture attend de toi que tu pourvoies aux besoins de ceux qui dépendent de toi, selon tes moyens ; elle ne fait jamais de ton revenu la mesure de ta valeur. Agour ne demandait ni pauvreté ni richesse, seulement de quoi rester proche de Dieu.",
    ),
    prompts: [
      L('Tell God honestly how much money, status or possessions shape the way you see yourself as a man.', "Dis honnêtement à Dieu combien l'argent, le statut ou les biens façonnent la manière dont tu te vois en tant qu'homme."),
      L('Ask Him to help you pursue gentleness and steadfastness as seriously as you pursue results.', "Demande-Lui de t'aider à rechercher la douceur et la persévérance aussi sérieusement que tu recherches les résultats."),
      L('Pray for men who are out of work, in debt or unable to provide, that they would know their worth is not their wage.', "Prie pour les hommes sans emploi, endettés ou incapables de subvenir aux besoins des leurs, afin qu'ils sachent que leur valeur n'est pas leur salaire."),
    ],
    practice: L(
      "Look over last month's spending and note one expense that fed your image rather than a need; this week, give a similar amount — however small — to someone in need.",
      "Relis tes dépenses du mois dernier et repère une dépense qui nourrissait ton image plutôt qu'un besoin ; cette semaine, donne une somme semblable — même modeste — à quelqu'un dans le besoin.",
    ),
    resourceTopics: ['finances', 'contentment', 'work'],
  },

  // ── Movement 4 · Strength, service and legacy (days 16–21) ───────────────
  {
    movement: 'legacy',
    theme: { en: 'The towel and the basin', fr: 'Le linge et le bassin', es: 'La toalla y la palangana', pt: 'A toalha e a bacia', de: 'Das Tuch und die Schüssel', ru: 'Полотенце и умывальница', zh: '毛巾与水盆', ja: '手ぬぐいとたらい', ko: '수건과 대야', ar: 'المنشفة والمغسل', fa: 'حوله و لگن', hi: 'अंगोछा और बरतन', id: 'Kain lenan dan baskom', sw: 'Kitambaa na bakuli', tl: 'Ang tuwalya at ang palanggana', am: 'ማበሻውና መታጠቢያው' },
    ref: 'John 13:1-17',
    related: ['Mark 10:42-45', 'Philippians 2:3-8', '1 Peter 5:1-5'],
    reflection: L(
      "John is careful to say what Jesus knew before He knelt: that the Father had put all things into His hands, that He had come from God and was going back to God. Secure in that, He took a servant's towel and washed feet, including those of the man who would betray Him. Elsewhere He tells His disciples that among them greatness means service, and Peter later warns elders not to domineer. The man who knows whose he is can afford to go low.",
      "Jean prend soin de dire ce que Jésus savait avant de s'agenouiller : que le Père avait tout remis entre Ses mains, qu'Il était venu de Dieu et s'en retournait à Dieu. Assuré de cela, Il a pris le linge du serviteur et lavé les pieds, y compris ceux de l'homme qui allait Le livrer. Ailleurs, Il dit à Ses disciples que parmi eux, être grand, c'est servir, et Pierre avertira plus tard les anciens de ne pas dominer. L'homme qui sait à qui il appartient peut se permettre de s'abaisser.",
    ),
    prompts: [
      L('Thank Jesus that He knelt to serve you before you had done anything for Him.', "Remercie Jésus de s'être agenouillé pour te servir avant que tu aies rien fait pour Lui."),
      L('Ask Him where your need to be respected keeps you from serving — at home, in church, at work.', "Demande-Lui où ton besoin d'être respecté t'empêche de servir — à la maison, dans l'Église, au travail."),
      L('Whether or not you hold a title, ask for a heart that measures greatness by service, as Jesus did.', 'Que tu aies un titre ou non, demande un cœur qui mesure la grandeur au service, comme Jésus.'),
    ],
    practice: L(
      'Take on one unnoticed task today that you would normally leave to someone else — the dishes, the chairs, the tidying up after a meeting.',
      "Prends aujourd'hui une tâche discrète que tu laisserais d'habitude à quelqu'un d'autre — la vaisselle, les chaises, le rangement après une réunion.",
    ),
    resourceTopics: ['leadership', 'church', 'discipleship'],
  },
  {
    movement: 'legacy',
    theme: { en: 'Courage held by love', fr: "Un courage tenu par l'amour", es: 'Valentía sostenida por el amor', pt: 'Coragem guiada pelo amor', de: 'Mut, von Liebe getragen', ru: 'Мужество, движимое любовью', zh: '有爱的勇敢', ja: '愛に支えられた勇気', ko: '사랑이 붙드는 용기', ar: 'شجاعة تحملها المحبة', fa: 'شجاعتی که محبت نگهش می‌دارد', hi: 'प्रेम से थमा साहस', id: 'Keberanian yang dipimpin kasih', sw: 'Ujasiri unaoongozwa na upendo', tl: 'Tapang na hawak ng pag-ibig', am: 'በፍቅር የተያዘ ድፍረት' },
    ref: '1 Corinthians 16:13-14',
    related: ['Joshua 1:6-9', '1 Corinthians 13:4-7'],
    reflection: L(
      "Paul's closing charge to Corinth — to be watchful, firm in the faith, courageous and strong — goes to the whole church, and he ties it at once to another command: everything is to be done in love. Courage without love turns harsh; love without courage turns passive. Joshua was handed a task he had not chosen, after a leader he could not replace, and his courage rested not on himself but on the Lord's presence and on the book of the law.",
      "L'exhortation finale de Paul aux Corinthiens — être vigilants, fermes dans la foi, courageux et forts — s'adresse à toute l'Église, et il la lie aussitôt à un autre commandement : tout doit se faire dans l'amour. Le courage sans amour devient dur ; l'amour sans courage devient passif. Josué a reçu une tâche qu'il n'avait pas choisie, à la suite d'un chef qu'il ne pouvait pas remplacer, et son courage ne reposait pas sur lui-même, mais sur la présence du Seigneur et sur le livre de la loi.",
    ),
    prompts: [
      L('Name before God the conversation or decision you have been avoiding out of fear, and ask for courage to face it.', "Nomme devant Dieu la conversation ou la décision que tu évites par peur, et demande le courage d'y faire face."),
      L('Ask Him to keep your courage tender, so that standing firm never becomes crushing others.', 'Demande-Lui de garder ton courage plein de tendresse, pour que tenir ferme ne devienne jamais écraser les autres.'),
      L('Thank the Lord that He is with you wherever you go, including into the task you did not choose.', "Remercie le Seigneur d'être avec toi partout où tu vas, y compris dans la tâche que tu n'as pas choisie."),
    ],
    practice: L(
      'Take the first step today in the hard conversation you have been putting off, and decide beforehand one loving thing you will say.',
      "Fais aujourd'hui le premier pas dans la conversation difficile que tu repousses, et décide à l'avance une parole d'amour que tu diras.",
    ),
    resourceTopics: ['manhood', 'character', 'leadership'],
  },
  {
    movement: 'legacy',
    theme: { en: "Daniel's open window", fr: 'La fenêtre ouverte de Daniel', es: 'La ventana abierta de Daniel', pt: 'A janela aberta de Daniel', de: 'Daniels offenes Fenster', ru: 'Открытое окно Даниила', zh: '但以理敞开的窗户', ja: 'ダニエルの開いた窓', ko: '다니엘의 열린 창', ar: 'نافذة دانيال المفتوحة', fa: 'پنجرهٔ گشودهٔ دانیال', hi: 'दानिय्येल की खुली खिड़की', id: 'Jendela Daniel yang terbuka', sw: 'Dirisha la Danieli lililo wazi', tl: 'Ang bukas na bintana ni Daniel', am: 'የዳንኤል ክፍት መስኮት' },
    ref: 'Daniel 6:1-10',
    related: ['Daniel 1:8', 'Daniel 3:16-18'],
    reflection: L(
      "Daniel's rivals searched his work for corruption or negligence and found none, so they went after his prayer instead. When the decree came, he staged no protest; he went home, opened his window towards Jerusalem and prayed three times a day, just as he always had. Courage was a habit built long before the crisis. Years earlier his friends had faced the furnace saying God could rescue them — and even if He did not, they would stay faithful.",
      "Les rivaux de Daniel ont passé son travail au crible pour y trouver corruption ou négligence, et n'ont rien trouvé ; alors ils s'en sont pris à sa prière. Quand le décret est tombé, il n'a monté aucune protestation : il est rentré chez lui, a ouvert sa fenêtre du côté de Jérusalem et a prié trois fois par jour, comme il l'avait toujours fait. Son courage était une habitude construite bien avant la crise. Des années plus tôt, ses amis avaient affronté la fournaise en disant que Dieu pouvait les délivrer — et que même s'Il ne le faisait pas, ils resteraient fidèles.",
    ),
    prompts: [
      L('Ask God to make your work so honest and careful that the only thing anyone could hold against you is your faith.', "Demande à Dieu de rendre ton travail si honnête et si soigné que la seule chose qu'on puisse te reprocher soit ta foi."),
      L('Thank Him for the ordinary habits of prayer that hold you, and ask for grace to keep them when they cost something.', 'Remercie-Le pour les habitudes ordinaires de prière qui te tiennent, et demande la grâce de les garder quand elles coûtent quelque chose.'),
      L('Tell Him your trust does not depend on rescue, even as you ask for His help in what you face.', "Dis-Lui que ta confiance ne dépend pas d'une délivrance, tout en Lui demandant Son aide dans ce que tu affrontes."),
    ],
    practice: L(
      'Fix one daily time and place for prayer — a window, a chair, a walk — and keep it for the next seven days.',
      'Fixe un moment et un lieu quotidiens pour prier — une fenêtre, un fauteuil, une marche — et garde-les pendant les sept prochains jours.',
    ),
    resourceTopics: ['work', 'prayer', 'spiritual-rhythms'],
  },
  {
    movement: 'legacy',
    theme: { en: 'Fathers and sons in the faith', fr: 'Pères et fils dans la foi', es: 'Padres e hijos en la fe', pt: 'Pais e filhos na fé', de: 'Väter und Söhne im Glauben', ru: 'Отцы и сыновья в вере', zh: '信心里的父与子', ja: '信仰における父と子', ko: '믿음 안의 아버지와 아들', ar: 'آباء وأبناء في الإيمان', fa: 'پدران و پسران در ایمان', hi: 'विश्वास में पिता और पुत्र', id: 'Bapa dan anak dalam iman', sw: 'Baba na wana katika imani', tl: 'Mga ama at anak sa pananampalataya', am: 'በእምነት አባቶችና ልጆች' },
    ref: '2 Timothy 2:1-7',
    related: ['1 Corinthians 4:14-17', '1 Thessalonians 2:7-12', 'Philippians 2:19-22'],
    reflection: L(
      "Paul, as far as we know, had no children of his own, yet he could tell the Corinthians they had many guides but few fathers, and call Timothy his beloved son. Fatherhood in the faith is open to every mature man, with or without children, and Paul says it carries a mother's gentleness as well as a father's urging. Its shape is in 2 Timothy 2: what you have received, entrust to faithful people who will teach others — four generations in one sentence.",
      "Paul, autant qu'on le sache, n'avait pas d'enfants, et pourtant il pouvait dire aux Corinthiens qu'ils avaient beaucoup de maîtres mais peu de pères, et appeler Timothée son fils bien-aimé. La paternité dans la foi est ouverte à tout homme mûr, qu'il ait des enfants ou non, et Paul dit qu'elle porte la douceur d'une mère autant que les exhortations d'un père. Sa forme se trouve en 2 Timothée 2 : ce que tu as reçu, confie-le à des personnes fidèles qui l'enseigneront à d'autres — quatre générations en une phrase.",
    ),
    prompts: [
      L('Thank God for the older believers who invested in you, or tell Him honestly if you longed for one and never found one.', "Remercie Dieu pour les croyants plus âgés qui ont investi en toi, ou dis-Lui honnêtement si tu en as désiré un sans jamais le trouver."),
      L('Ask Him to show you one younger man or new believer you could encourage, pray for and walk alongside.', 'Demande-Lui de te montrer un homme plus jeune ou un nouveau croyant que tu pourrais encourager, porter dans la prière et accompagner.'),
      L("If you are a father, pray by name for your children's faith; if not, pray for the fathers in your church.", "Si tu es père, prie nommément pour la foi de tes enfants ; sinon, prie pour les pères de ton Église."),
    ],
    practice: L(
      'This week, invite a younger man for a coffee or a walk, or ask an older one whether you may learn from him — and pray before you go.',
      "Cette semaine, invite un homme plus jeune à prendre un café ou à marcher, ou demande à un plus âgé si tu peux apprendre de lui — et prie avant d'y aller.",
    ),
    resourceTopics: ['discipleship', 'parenting', 'leadership'],
  },
  {
    movement: 'legacy',
    theme: { en: 'Strong when weak', fr: 'Fort dans la faiblesse', es: 'Fuerte en la debilidad', pt: 'Forte na fraqueza', de: 'Stark in der Schwachheit', ru: 'Сила в немощи', zh: '软弱时刚强', ja: '弱いときにこそ強い', ko: '약할 때 강함', ar: 'قوي حين أكون ضعيفًا', fa: 'قوی در ضعف', hi: 'निर्बलता में सामर्थ्य', id: 'Kuat dalam kelemahan', sw: 'Hodari katika udhaifu', tl: 'Malakas sa kahinaan', am: 'በድካም ብርቱ' },
    ref: '2 Corinthians 12:7-10',
    related: ['2 Corinthians 4:7-10', 'Hebrews 12:1-3'],
    reflection: L(
      "Paul pleaded three times for the thorn to be taken away, and it stayed. What he received instead was grace enough, and Christ's power resting on him in weakness. Men are often taught to hide weakness — the lost job, the failing body, the depression, the ageing that takes away old strengths. Paul learned to boast in exactly those things, not because weakness is good in itself, but because it left room for Christ. Keep your eyes on Jesus, who endured the cross.",
      "Paul a supplié trois fois que l'écharde lui soit retirée, et elle est restée. Ce qu'il a reçu à la place, c'est une grâce suffisante, et la puissance de Christ reposant sur lui dans la faiblesse. On apprend souvent aux hommes à cacher leur faiblesse — l'emploi perdu, le corps qui lâche, la dépression, l'âge qui emporte les forces d'antan. Paul a appris à se glorifier précisément de cela, non parce que la faiblesse serait bonne en soi, mais parce qu'elle laissait de la place à Christ. Garde les yeux fixés sur Jésus, qui a enduré la croix.",
    ),
    prompts: [
      L('Tell God plainly about the weakness you would most like to hide, and ask for His grace in it, whether or not He removes it.', "Parle franchement à Dieu de la faiblesse que tu voudrais le plus cacher, et demande-Lui Sa grâce en elle, qu'Il l'ôte ou non."),
      L('Thank Jesus that He endured the cross and knows what it costs to keep going.', "Remercie Jésus d'avoir enduré la croix : Il sait ce que coûte le fait de tenir bon."),
      L('Pray for a man you know who is sick, out of work or worn out, that he would not carry it alone.', "Prie pour un homme de ton entourage qui est malade, sans emploi ou épuisé, afin qu'il ne porte pas cela seul."),
    ],
    practice: L(
      'Tell one trusted person about a weakness or struggle you have kept to yourself, and ask them to pray with you.',
      "Parle à une personne de confiance d'une faiblesse ou d'un combat que tu as gardé pour toi, et demande-lui de prier avec toi.",
    ),
    resourceTopics: ['suffering', 'manhood'],
  },
  {
    movement: 'legacy',
    theme: { en: 'Finishing the race', fr: 'Achever la course', es: 'Terminar la carrera', pt: 'Completar a carreira', de: 'Den Lauf vollenden', ru: 'Окончить течение', zh: '跑完当跑的路', ja: '走るべき道のりを走り終える', ko: '달려갈 길을 마치다', ar: 'إكمال السعي', fa: 'به پایان رساندن دوره', hi: 'दौड़ पूरी करना', id: 'Mencapai garis akhir', sw: 'Kumaliza mashindano', tl: 'Tapusin ang takbuhin', am: 'ሩጫውን መጨረስ' },
    ref: '2 Timothy 4:6-8',
    related: ['2 Timothy 4:9-11', 'Psalm 71:17-18', 'Acts 20:24'],
    reflection: L(
      "Near the end, Paul could look back on a good fight fought, a race run to its end and a faith kept — the fight he had once urged on Timothy. He looked for a crown from the Lord, the righteous Judge, and not for himself alone but for all who long for Christ's appearing. In the same chapter he is lonely, deserted by some, and asks for Mark, the very man he had once refused to take along. Finishing faithfully includes reconciliation, at any age.",
      "Vers la fin, Paul pouvait regarder en arrière : un bon combat mené, une course achevée, une foi gardée — ce combat qu'il avait autrefois recommandé à Timothée. Il attendait une couronne de la part du Seigneur, le juste Juge, et pas pour lui seul, mais pour tous ceux qui désirent l'apparition de Christ. Dans le même chapitre, il est seul, abandonné par certains, et réclame Marc, celui-là même qu'il avait autrefois refusé d'emmener. Finir fidèlement inclut la réconciliation, à tout âge.",
    ),
    prompts: [
      L('Thank Jesus, who began your faith and will bring it to completion, for every day of this journey, including the hard ones.', "Remercie Jésus, qui a commencé ta foi et la mènera à son accomplissement, pour chaque jour de ce parcours, y compris les plus difficiles."),
      L('Ask Him what faithfulness looks like for you in this season — at your age, in your work, with your people.', "Demande-Lui à quoi ressemble la fidélité pour toi dans cette saison — à ton âge, dans ton travail, avec les tiens."),
      L('Name before God a broken relationship you could take one step to mend, as Paul did with Mark.', 'Nomme devant Dieu une relation brisée que tu pourrais faire un pas pour réparer, comme Paul avec Marc.'),
    ],
    practice: L(
      'Write a short letter to a younger believer, or to yourself in ten years, about what you hope to be found faithful in; keep it where you will see it.',
      "Écris une courte lettre à un croyant plus jeune, ou à toi-même dans dix ans, sur ce en quoi tu espères être trouvé fidèle ; garde-la là où tu la verras.",
    ),
    resourceTopics: ['discipleship', 'calling', 'manhood'],
  },
];
