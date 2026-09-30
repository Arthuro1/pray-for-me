// The 21 days of "Identity in Christ" (see ./identityInChrist.js for the plan
// meta, the movements and the guardrails this content is held to).
//
// Day shape follows ./preparingInPrayerDays.js: `theme` in all 16 languages,
// a PRIMARY `ref` plus up to three `related` passages (references only — never
// Bible text), a reflection, three prayer prompts, one small practice, an
// occasional `safetyNote`, and `resourceTopics`. Prose is authored in en + fr;
// the other languages fall back through pick().
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Movement 1 · Created, fallen and rescued (days 1–5) ──────────────────
  {
    movement: 'rescued',
    theme: { en: "Created in God's image", fr: "À l'image de Dieu", es: 'A imagen de Dios', pt: 'À imagem de Deus', de: 'Nach Gottes Bild geschaffen', ru: 'По образу Божьему', zh: '按神的形像被造', ja: '神のかたちに造られた', ko: '하나님의 형상대로 지음받음', ar: 'على صورة الله', fa: 'آفریده به صورت خدا', hi: 'परमेश्वर के स्वरूप में रचा गया', id: 'Diciptakan menurut gambar Allah', sw: 'Umeumbwa kwa mfano wa Mungu', tl: 'Nilikha ayon sa larawan ng Diyos', am: 'በእግዚአብሔር መልክ መፈጠር' },
    ref: 'Genesis 1:26-31',
    related: ['Psalm 8:3-8', 'James 3:9-10'],
    reflection: L(
      "Before Genesis says anything about what humans do, it says whose image they bear — and it says it of every man and woman, before a single achievement. Your dignity was given, not earned, and James 3 insists it remains even in people we find hard to bless. The New Testament calls Christ the image of the invisible God (Colossians 1): the likeness you were made for is seen fully in Him.",
      "Avant de dire quoi que ce soit de ce que font les humains, la Genèse dit de qui ils portent l'image — et elle le dit de chaque homme et de chaque femme, avant le moindre accomplissement. Ta dignité t'a été donnée, pas méritée, et Jacques 3 affirme qu'elle demeure même chez ceux que nous avons du mal à bénir. Le Nouveau Testament appelle Christ l'image du Dieu invisible (Colossiens 1) : la ressemblance pour laquelle tu as été créé se voit pleinement en Lui.",
    ),
    prompts: [
      L('Thank God that your worth began with His decision to make you, not with anything you have done.', "Remercie Dieu : ta valeur a commencé avec Sa décision de te créer, non avec ce que tu as accompli."),
      L('Ask Him to show you where you have let your work, your looks or your reputation tell you who you are.', "Demande-Lui de te montrer où tu as laissé ton travail, ton apparence ou ta réputation te dire qui tu es."),
      L('Pray for someone you find hard to respect, naming them before God as a person who bears His image.', "Prie pour quelqu'un que tu as du mal à respecter, en le nommant devant Dieu comme une personne qui porte Son image."),
    ],
    practice: L(
      'Tonight, write down one thing you were tempted to measure yourself by today — a result, a mirror, a comment. Beside it, write Genesis 1:27.',
      "Ce soir, note une chose à laquelle tu as été tenté de te mesurer aujourd'hui — un résultat, un miroir, une remarque. À côté, écris Genèse 1.27.",
    ),
    resourceTopics: ['identity', 'calling'],
  },
  {
    movement: 'rescued',
    theme: { en: 'Fully known by God', fr: 'Dieu me connaît', es: 'Dios me conoce', pt: 'Deus me conhece', de: 'Von Gott ganz erkannt', ru: 'Бог знает меня', zh: '神完全认识我', ja: '神に知られている', ko: '하나님이 나를 아신다', ar: 'الله يعرفني', fa: 'خدا مرا می‌شناسد', hi: 'परमेश्वर मुझे जानता है', id: 'Allah mengenal aku', sw: 'Mungu ananijua', tl: 'Kilala ako ng Diyos', am: 'እግዚአብሔር ያውቀኛል' },
    ref: 'Psalm 139:1-18',
    related: ['Psalm 139:23-24', 'Galatians 4:8-9'],
    reflection: L(
      "David begins with being searched, not with being admired: God knows when he sits and rises, knows his words before he speaks them, and there is nowhere to flee from His presence. That could be frightening. David finds it a refuge, because the One who sees everything is the One who formed him with care. You do not have to manage God's opinion of you; He already knows the whole story.",
      "David commence par le fait d'être sondé, non d'être admiré : Dieu sait quand il s'assied et quand il se lève, connaît ses paroles avant qu'il les prononce, et il n'y a nulle part où fuir Sa présence. Cela pourrait effrayer. David y trouve un refuge, car Celui qui voit tout est Celui qui l'a formé avec soin. Tu n'as pas à gérer l'opinion que Dieu a de toi : Il connaît déjà toute l'histoire.",
    ),
    prompts: [
      L('Tell God one thing about yourself that you usually hide from others, knowing it is already known to Him.', "Dis à Dieu une chose sur toi que tu caches d'habitude aux autres, en sachant qu'Il la connaît déjà."),
      L('Thank Him that no darkness in your life is dark to Him.', "Remercie-Le : aucune obscurité de ta vie n'est obscure pour Lui."),
      L('Ask Him, as David does at the end of the psalm, to search your heart and lead you in His way.', "Demande-Lui, comme David à la fin du psaume, de sonder ton cœur et de te conduire sur Son chemin."),
    ],
    practice: L(
      'This evening, pray Psalm 139:23-24 slowly and aloud, then stay silent before God for one full minute.',
      "Ce soir, prie lentement et à voix haute Psaume 139.23-24, puis reste une bonne minute en silence devant Dieu.",
    ),
    resourceTopics: ['identity', 'prayer'],
  },
  {
    movement: 'rescued',
    theme: { en: 'Saved by grace, not by effort', fr: "Le salut par grâce, non par l'effort", es: 'Salvos por gracia, no por esfuerzo', pt: 'Salvos pela graça, não pelo esforço', de: 'Aus Gnade gerettet, nicht durch Leistung', ru: 'Спасены по благодати, а не усилиями', zh: '因恩典得救，不是靠努力', ja: '努力ではなく恵みによって救われた', ko: '노력이 아닌 은혜로 구원받음', ar: 'مخلَّصون بالنعمة لا بالجهد', fa: 'نجات به فیض، نه با تلاش', hi: 'प्रयास से नहीं, अनुग्रह से उद्धार', id: 'Diselamatkan oleh kasih karunia, bukan usaha', sw: 'Kuokolewa kwa neema, si kwa juhudi', tl: 'Iniligtas ng biyaya, hindi ng pagsisikap', am: 'በጥረት ሳይሆን በጸጋ መዳን' },
    ref: 'Ephesians 2:1-9',
    related: ['Genesis 3:7-10', 'Romans 3:21-24'],
    reflection: L(
      "Paul's diagnosis is blunter than “wounded”: dead in trespasses, following the course of this world. Since Eden, people have stitched fig leaves and hidden from God rather than run to Him. Then two words change everything: “But God.” Being made alive with Christ is His act of mercy, received through faith — a gift, so that nobody can boast, not even about how far they have come.",
      "Le diagnostic de Paul est plus rude que « blessé » : morts dans nos fautes, suivant le train de ce monde. Depuis Éden, l'être humain coud des feuilles de figuier et se cache de Dieu au lieu de courir vers Lui. Puis deux mots changent tout : « Mais Dieu ». Être rendu vivant avec Christ est un acte de Sa miséricorde, reçu par la foi — un don, afin que personne ne se glorifie, pas même du chemin parcouru.",
    ),
    prompts: [
      L('Thank God that He made you alive when you could contribute nothing to it.', "Remercie Dieu de t'avoir rendu vivant alors que tu ne pouvais rien y apporter."),
      L('Name one fig leaf you still reach for when you feel exposed — busyness, a joke, an achievement — and lay it down before Him.', "Nomme une feuille de figuier que tu attrapes encore quand tu te sens exposé — l'agitation, une plaisanterie, une réussite — et dépose-la devant Lui."),
      L('Ask Him to keep you from boasting, whether in your progress or in how dramatic your past was.', "Demande-Lui de te garder de te glorifier, que ce soit de tes progrès ou du caractère spectaculaire de ton passé."),
    ],
    practice: L(
      'Write one sentence of testimony that begins with what God did rather than with what you did, and keep it where you will see it this week.',
      "Écris une phrase de témoignage qui commence par ce que Dieu a fait plutôt que par ce que tu as fait, et garde-la là où tu la verras cette semaine.",
    ),
    resourceTopics: ['gospel', 'identity'],
  },
  {
    movement: 'rescued',
    theme: { en: 'Forgiven: no more hiding', fr: 'Le pardon : ne plus se cacher', es: 'Perdón: salir del escondite', pt: 'Perdão: sair do esconderijo', de: 'Vergeben – kein Verstecken mehr', ru: 'Прощение: больше не прятаться', zh: '蒙赦免，不再躲藏', ja: '赦され、もう隠れない', ko: '용서받아 더 이상 숨지 않음', ar: 'مغفور لك، فلا تختبئ بعد', fa: 'بخشیده شده، دیگر پنهان نشو', hi: 'क्षमा मिली, अब छिपना नहीं', id: 'Diampuni, tak perlu bersembunyi', sw: 'Umesamehewa, usijifiche tena', tl: 'Pinatawad, hindi na magtatago', am: 'ይቅር ተብለሃል፤ ከእንግዲህ አትደበቅ' },
    ref: 'Psalm 32:1-7',
    related: ['1 John 1:8-9', 'Colossians 2:13-14'],
    reflection: L(
      "Psalm 32 does not bless the person who never sinned, but the one whose sin is covered. While David kept silent, guilt wore him down, body and soul; when he stopped hiding his sin, God Himself became his hiding place. John writes the same pattern for believers: we do not claim to be without sin, we confess, and God is faithful to forgive. Forgiven people keep confessing — that is not failure but how the relationship breathes.",
      "Le Psaume 32 ne déclare pas heureux celui qui n'a jamais péché, mais celui dont le péché est couvert. Tant que David se taisait, la culpabilité l'usait, corps et âme ; quand il a cessé de cacher sa faute, Dieu Lui-même est devenu son refuge. Jean décrit la même chose pour les croyants : nous ne prétendons pas être sans péché, nous confessons, et Dieu est fidèle pour pardonner. Les pardonnés continuent de confesser — ce n'est pas un échec, c'est ainsi que la relation respire.",
    ),
    prompts: [
      L('Tell God plainly about a sin you have been keeping quiet about, without excuses.', "Parle simplement à Dieu d'un péché que tu gardes sous silence, sans excuses."),
      L('Thank Him that forgiveness rests on the cross of Christ, not on how sorry you manage to feel.', "Remercie-Le : le pardon repose sur la croix de Christ, non sur l'intensité de tes regrets."),
      L('Ask Him to be your hiding place today instead of the silence you used to hide in.', "Demande-Lui d'être aujourd'hui ton refuge, au lieu du silence dans lequel tu te cachais."),
    ],
    practice: L(
      'If one sin keeps returning, choose a mature believer you trust and arrange this week to confess it and pray together (James 5:16).',
      "Si un péché revient sans cesse, choisis un croyant mûr en qui tu as confiance et prévois cette semaine de le lui confesser et de prier ensemble (Jacques 5.16).",
    ),
    resourceTopics: ['forgiveness', 'repentance'],
  },
  {
    movement: 'rescued',
    theme: { en: 'No condemnation in Christ', fr: 'Aucune condamnation en Christ', es: 'Ninguna condenación en Cristo', pt: 'Nenhuma condenação em Cristo', de: 'Keine Verdammnis in Christus', ru: 'Нет осуждения во Христе', zh: '在基督里不被定罪', ja: 'キリストにあって罪に定められない', ko: '그리스도 안에서 정죄함이 없음', ar: 'لا دينونة في المسيح', fa: 'هیچ محکومیتی در مسیح نیست', hi: 'मसीह में कोई दण्ड नहीं', id: 'Tidak ada penghukuman dalam Kristus', sw: 'Hakuna hukumu ndani ya Kristo', tl: 'Walang kahatulan kay Cristo', am: 'በክርስቶስ ኵነኔ የለም' },
    ref: 'Romans 8:1-4',
    related: ['Romans 7:21-25', 'Romans 8:31-34'],
    reflection: L(
      "Paul announces “no condemnation” immediately after the cry at the end of Romans 7, where he asks who will rescue him. The verdict does not wait until the struggle is over; it rests on what God did in sending His Son to deal with sin. Later in the chapter Paul asks who could bring a charge against God's people, and answers that Christ, who died and was raised, is interceding for them.",
      "Paul annonce « aucune condamnation » juste après le cri de la fin de Romains 7, où il demande qui le délivrera. Le verdict n'attend pas la fin du combat : il repose sur ce que Dieu a fait en envoyant Son Fils pour régler la question du péché. Plus loin dans le chapitre, Paul demande qui accusera le peuple de Dieu, et répond que Christ, mort et ressuscité, intercède pour lui.",
    ),
    prompts: [
      L('When an accusing thought comes today, answer it in prayer with what Christ has done, not with your record.', "Quand une pensée accusatrice viendra aujourd'hui, réponds-y dans la prière par ce que Christ a fait, et non par ton bilan."),
      L('Thank Jesus that He is interceding for you at this moment.', "Remercie Jésus d'intercéder pour toi en ce moment même."),
      L("Ask the Holy Spirit to help you tell His conviction, which leads you to Him, from condemnation, which drives you into hiding.", "Demande au Saint-Esprit de t'aider à distinguer Sa conviction, qui te conduit vers Lui, de la condamnation, qui te pousse à te cacher."),
    ],
    practice: L(
      'Write Romans 8:1 on a card or in a phone note, and read it the next time you catch yourself replaying a failure.',
      "Écris Romains 8.1 sur une carte ou dans une note de ton téléphone, et relis-le la prochaine fois que tu te surprends à ressasser un échec.",
    ),
    resourceTopics: ['gospel', 'identity'],
  },

  // ── Movement 2 · United with Christ (days 6–10) ──────────────────────────
  {
    movement: 'united',
    theme: { en: 'Christ lives in me', fr: 'Christ vit en moi', es: 'Cristo vive en mí', pt: 'Cristo vive em mim', de: 'Christus lebt in mir', ru: 'Христос живёт во мне', zh: '基督在我里面活着', ja: 'キリストが私のうちに生きている', ko: '그리스도께서 내 안에 사신다', ar: 'المسيح يحيا فيّ', fa: 'مسیح در من زندگی می‌کند', hi: 'मसीह मुझ में जीवित है', id: 'Kristus hidup di dalamku', sw: 'Kristo anaishi ndani yangu', tl: 'Si Cristo ay nabubuhay sa akin', am: 'ክርስቶስ በእኔ ይኖራል' },
    ref: 'Galatians 2:16-21',
    related: ['Galatians 2:11-14', 'Romans 5:1-2'],
    reflection: L(
      "This passage starts at a dinner table: Peter had stopped eating with Gentile believers because he feared what certain people would think. Paul answers with his most personal words about identity. The old “I” that tried to stand right before God by keeping rules was crucified with Christ; the life Paul lives now, he lives trusting the Son of God, whose love for him went as far as giving Himself up. Seeking approval is not a small weakness — it quietly denies that Christ's love is enough.",
      "Ce passage commence autour d'une table : Pierre avait cessé de manger avec les croyants non juifs, par crainte de ce que certains penseraient. Paul répond par ses paroles les plus personnelles sur l'identité. L'ancien « moi » qui voulait être juste devant Dieu en observant des règles a été crucifié avec Christ ; la vie que Paul mène désormais, il la vit dans la confiance au Fils de Dieu, dont l'amour pour lui est allé jusqu'au don de Lui-même. Chercher l'approbation n'est pas une petite faiblesse : c'est nier en silence que l'amour de Christ suffit.",
    ),
    prompts: [
      L("Confess any place where fear of someone's opinion is shaping how you treat other people.", "Confesse les domaines où la peur de l'opinion de quelqu'un façonne ta manière de traiter les autres."),
      L('Thank Jesus, personally and by name, that He loved you and gave Himself for you.', "Remercie Jésus, personnellement et par Son nom, de t'avoir aimé et de S'être livré pour toi."),
      L('Ask Him to let His life in you, rather than your need for approval, drive the choices you make today.', "Demande-Lui que Sa vie en toi, plutôt que ton besoin d'approbation, guide les choix que tu feras aujourd'hui."),
    ],
    practice: L(
      'Today, reach out to one believer you have kept at a distance because of what others might think — a message, a coffee, a seat beside them.',
      "Aujourd'hui, fais un pas vers un croyant que tu as tenu à distance à cause de ce que d'autres pourraient penser — un message, un café, une place à côté de lui.",
    ),
    resourceTopics: ['identity', 'gospel'],
  },
  {
    movement: 'united',
    theme: { en: 'A branch in the true Vine', fr: 'Un sarment sur le vrai cep', es: 'Un pámpano en la vid verdadera', pt: 'Um ramo na videira verdadeira', de: 'Eine Rebe am wahren Weinstock', ru: 'Ветвь на истинной лозе', zh: '真葡萄树上的枝子', ja: 'まことのぶどうの木の枝', ko: '참포도나무의 가지', ar: 'غصن في الكرمة الحقيقية', fa: 'شاخه‌ای در تاک حقیقی', hi: 'सच्ची दाखलता की डाली', id: 'Ranting pada pokok anggur yang benar', sw: 'Tawi katika mzabibu wa kweli', tl: 'Sanga sa tunay na puno ng ubas', am: 'በእውነተኛው የወይን ግንድ ላይ ቅርንጫፍ' },
    ref: 'John 15:1-11',
    related: ['Colossians 2:6-7', 'Galatians 5:22-23'],
    reflection: L(
      "Jesus says this on the night before the cross, to disciples who are about to fail Him. A branch does not produce fruit by straining; it stays joined to the vine, and the Father prunes it so that it bears more. In this chapter, abiding means remaining in His words and in His love. Fruitfulness — including any ministry you have — is the Vine's life showing through you, never the measure of your worth.",
      "Jésus dit cela la veille de la croix, à des disciples sur le point de Le lâcher. Un sarment ne porte pas de fruit à force d'efforts : il reste attaché au cep, et le Père l'émonde pour qu'il en porte davantage. Dans ce chapitre, demeurer, c'est rester dans Ses paroles et dans Son amour. La fécondité — y compris ton ministère, si tu en as un — est la vie du Cep qui se manifeste à travers toi, jamais la mesure de ta valeur.",
    ),
    prompts: [
      L('Tell Jesus where you have been trying to bear fruit on your own strength.', "Dis à Jésus où tu as essayé de porter du fruit par tes propres forces."),
      L('Ask the Father to prune what needs pruning, and to give you trust while He does it.', "Demande au Père d'émonder ce qui doit l'être, et de te donner confiance pendant qu'Il le fait."),
      L('Thank Jesus that His aim is for His joy to be in you and your joy to be complete.', "Remercie Jésus : Son but est que Sa joie soit en toi et que ta joie soit parfaite."),
    ],
    practice: L(
      'Choose one verse of John 15 and come back to it three times today — morning, midday and evening — turning it each time into one sentence of prayer.',
      "Choisis un verset de Jean 15 et reviens-y trois fois aujourd'hui — le matin, à midi et le soir — en le transformant chaque fois en une phrase de prière.",
    ),
    resourceTopics: ['spiritual-formation', 'prayer'],
  },
  {
    movement: 'united',
    theme: { en: 'A new creation', fr: 'Une nouvelle création', es: 'Una nueva creación', pt: 'Uma nova criação', de: 'Eine neue Schöpfung', ru: 'Новое творение', zh: '新造的人', ja: '新しく造られた者', ko: '새로운 피조물', ar: 'خليقة جديدة', fa: 'خلقتی تازه', hi: 'नई सृष्टि', id: 'Ciptaan baru', sw: 'Kiumbe kipya', tl: 'Isang bagong nilalang', am: 'አዲስ ፍጥረት' },
    ref: '2 Corinthians 5:14-17',
    related: ['Ephesians 4:22-24', 'Galatians 6:14-15'],
    reflection: L(
      "Paul's “new creation” comes in a paragraph about how he now sees people: since Christ died for all, he no longer sizes anyone up by worldly standards. The new has come because in Christ a new age has broken in, not because you feel different each morning. That is why Ephesians still urges believers to put off the old self and put on the new. A new creation still has to learn to live newly, with real struggles and real repentance along the way.",
      "La « nouvelle création » de Paul se trouve dans un paragraphe sur sa manière de regarder les gens : puisque Christ est mort pour tous, il ne jauge plus personne selon les critères du monde. Le nouveau est là parce qu'en Christ un monde nouveau a fait irruption, non parce que tu te sens différent chaque matin. C'est pourquoi l'épître aux Éphésiens exhorte encore les croyants à se dépouiller du vieil homme et à revêtir l'homme nouveau. Une nouvelle création doit encore apprendre à vivre de façon nouvelle, avec de vrais combats et une vraie repentance en chemin.",
    ),
    prompts: [
      L('Thank God that being in Christ places you in His new creation, whatever you feel today.', "Remercie Dieu : être en Christ te place dans Sa nouvelle création, quoi que tu ressentes aujourd'hui."),
      L('Ask Him to stop you measuring people — yourself included — by status, looks or usefulness.', "Demande-Lui de t'empêcher de mesurer les gens — toi compris — à leur statut, leur apparence ou leur utilité."),
      L('Confess one old habit you are still putting off, and ask the Spirit for help to put on the new.', "Confesse une vieille habitude dont tu dois encore te dépouiller, et demande à l'Esprit de t'aider à revêtir le nouveau."),
    ],
    practice: L(
      'Notice the first time today you size someone up by appearance, money or rank, and quietly pray a one-line blessing over that person instead.',
      "Remarque la première fois aujourd'hui où tu jauges quelqu'un à son apparence, à son argent ou à son rang, et prie plutôt en silence une bénédiction d'une phrase sur cette personne.",
    ),
    resourceTopics: ['identity', 'holiness'],
  },
  {
    movement: 'united',
    theme: { en: 'Born of God', fr: 'Naître de Dieu', es: 'Nacer de Dios', pt: 'Nascer de Deus', de: 'Aus Gott geboren', ru: 'Рождённые от Бога', zh: '从神而生', ja: '神から生まれた', ko: '하나님께로부터 난 자', ar: 'المولودون من الله', fa: 'زاده از خدا', hi: 'परमेश्वर से उत्पन्न', id: 'Lahir dari Allah', sw: 'Kuzaliwa na Mungu', tl: 'Ipinanganak ng Diyos', am: 'ከእግዚአብሔር መወለድ' },
    ref: 'John 1:9-14',
    related: ['1 John 3:1', 'John 3:3-8'],
    reflection: L(
      "John says that those who receive Christ are given the right to become children of God, and that this new birth comes from God Himself — not from ancestry, human effort or anyone's choice. Your place in God's family does not depend on your family tree, your nation or whether you were wanted. The Word became flesh and lived among us: the Son entered our human family so that we could be brought into His Father's.",
      "Jean dit que ceux qui reçoivent Christ reçoivent le droit de devenir enfants de Dieu, et que cette nouvelle naissance vient de Dieu Lui-même — ni de l'ascendance, ni de l'effort humain, ni du choix de qui que ce soit. Ta place dans la famille de Dieu ne dépend ni de ton arbre généalogique, ni de ta nation, ni du fait d'avoir été désiré. La Parole a été faite chair et a habité parmi nous : le Fils est entré dans notre famille humaine pour que nous soyons introduits dans celle de Son Père.",
    ),
    prompts: [
      L('Thank God that becoming His child was His gift, not the result of your ancestry or achievement.', "Remercie Dieu : devenir Son enfant a été Son don, non le fruit de tes origines ou de tes accomplissements."),
      L('Bring Him anything in your family story that has made you feel you do not belong.', "Apporte-Lui ce qui, dans ton histoire familiale, t'a donné le sentiment de ne pas avoir ta place."),
      L('Ask Him to help you receive Christ again today as a child receives, not as an employee earns.', "Demande-Lui de t'aider à recevoir Christ aujourd'hui encore comme un enfant reçoit, et non comme un employé gagne son salaire."),
    ],
    practice: L(
      'Write down one way your family, culture or background has shaped how you see yourself. Beside it, write John 1:12, and pray over both.',
      "Note une manière dont ta famille, ta culture ou ton milieu a façonné ton regard sur toi-même. À côté, écris Jean 1.12, et prie sur les deux.",
    ),
    resourceTopics: ['identity', 'gospel'],
  },
  {
    movement: 'united',
    theme: { en: 'Adopted: calling God Abba', fr: 'Adoptés : appeler Dieu Abba', es: 'Adoptados: llamar a Dios Abba', pt: 'Adotados: chamar Deus de Aba', de: 'Angenommen: Gott Abba nennen', ru: 'Усыновлённые: звать Бога «Авва»', zh: '得着儿子的名分：称神为阿爸', ja: '神の子とされ、アバと呼ぶ', ko: '양자 되어 아빠라 부름', ar: 'التبنّي: ندعو الله «أبّا»', fa: 'فرزندخواندگی: خدا را ابّا خواندن', hi: 'गोद लिए गए: परमेश्वर को अब्बा कहना', id: 'Diangkat anak: memanggil Allah Abba', sw: 'Kufanywa wana: kumwita Mungu Aba', tl: 'Inampon: tinatawag ang Diyos na Abba', am: 'ልጅነት፦ እግዚአብሔርን አባ ብሎ መጥራት' },
    ref: 'Galatians 4:1-7',
    related: ['Romans 8:14-17', 'Psalm 27:10'],
    reflection: L(
      "Paul contrasts an heir still treated like a slave with a child given full rights at the time the father set. God sent His Son to redeem, then sent the Spirit of His Son into our hearts, crying “Abba, Father.” If “father” is a painful word for you, notice that Paul does not ask you to picture the father you had. The Father is known through the Son who reveals Him, and the Spirit gives the cry before you can form it yourself.",
      "Paul oppose un héritier encore traité comme un esclave à un enfant qui reçoit tous ses droits au moment fixé par le père. Dieu a envoyé Son Fils pour racheter, puis l'Esprit de Son Fils dans nos cœurs, qui crie « Abba, Père ». Si le mot « père » est douloureux pour toi, remarque que Paul ne te demande pas d'imaginer le père que tu as eu. Le Père se fait connaître par le Fils qui Le révèle, et l'Esprit donne ce cri avant même que tu puisses le formuler.",
    ),
    prompts: [
      L('If you can, call God “Abba, Father” in prayer today, and simply rest there for a moment.', "Si tu le peux, appelle Dieu « Abba, Père » dans ta prière aujourd'hui, et repose-toi simplement là un instant."),
      L('Tell Him honestly what the word “father” stirs in you, whether pain, longing or gratitude.', "Dis-Lui honnêtement ce que le mot « père » remue en toi, que ce soit de la douleur, un manque ou de la gratitude."),
      L('Thank Him that through Christ you are no longer a slave but a child, and an heir.', "Remercie-Le : par Christ, tu n'es plus esclave mais enfant, et héritier."),
    ],
    practice: L(
      "Pray the Lord's Prayer slowly today, pausing after its opening words to be still before the Father.",
      "Prie lentement le Notre Père aujourd'hui, en t'arrêtant après les premiers mots pour rester silencieux devant le Père.",
    ),
    safetyNote: L(
      'If this day brings back painful memories of a parent or of home, you do not have to carry them alone. A pastor or a counsellor you trust can walk with you.',
      "Si cette journée réveille des souvenirs douloureux d'un parent ou de ton foyer, tu n'as pas à les porter seul. Un pasteur ou un conseiller en qui tu as confiance peut cheminer avec toi.",
    ),
    resourceTopics: ['identity', 'holy-spirit', 'prayer'],
  },

  // ── Movement 3 · Belonging to God's people (days 11–15) ──────────────────
  {
    movement: 'belonging',
    theme: { en: 'Chosen in Christ', fr: 'Choisis en Christ', es: 'Escogidos en Cristo', pt: 'Escolhidos em Cristo', de: 'In Christus erwählt', ru: 'Избранные во Христе', zh: '在基督里蒙拣选', ja: 'キリストにあって選ばれた', ko: '그리스도 안에서 택함받음', ar: 'مختارون في المسيح', fa: 'برگزیده در مسیح', hi: 'मसीह में चुने गए', id: 'Dipilih di dalam Kristus', sw: 'Wateule katika Kristo', tl: 'Pinili kay Cristo', am: 'በክርስቶስ የተመረጡ' },
    ref: 'Ephesians 1:3-14',
    related: ['Deuteronomy 7:6-8', '1 Peter 2:9-10'],
    reflection: L(
      "Ephesians 1 is one long outburst of praise, and almost every clause returns to “in Him.” Being chosen is not a prize for the deserving — Deuteronomy says God set His love on Israel when they were few and unimpressive — and it is always plural: “us,” a people. It also has a purpose: to be holy and blameless before Him, to the praise of His grace. Christians have long discussed how God's choosing relates to our response; Paul's own emphasis here is worship, not argument.",
      "Éphésiens 1 est un long jaillissement de louange, et presque chaque phrase revient à « en Lui ». Être choisi n'est pas une récompense pour les méritants — le Deutéronome dit que Dieu s'est attaché à Israël quand il était petit et sans éclat — et c'est toujours au pluriel : « nous », un peuple. Ce choix a aussi un but : être saints et irréprochables devant Lui, à la louange de Sa grâce. Les chrétiens débattent depuis longtemps du lien entre le choix de Dieu et notre réponse ; ici, l'accent de Paul est l'adoration, non la controverse.",
    ),
    prompts: [
      L('Praise God for the blessings Paul lists: redemption, forgiveness, and being sealed with the promised Holy Spirit.', "Loue Dieu pour les bénédictions que Paul énumère : la rédemption, le pardon, et le sceau du Saint-Esprit promis."),
      L('Ask Him to make you holy in the way you actually live, since that is what He chose you for.', "Demande-Lui de te rendre saint dans ta manière concrète de vivre, puisque c'est pour cela qu'Il t'a choisi."),
      L('Pray for your local church, that together you would live to the praise of His glory.', "Prie pour ton Église locale, afin qu'ensemble vous viviez à la louange de Sa gloire."),
    ],
    practice: L(
      'Read Ephesians 1:3-14 aloud and count how many times it says “in Him” or “in Christ”; thank God for each one.',
      "Lis Éphésiens 1.3-14 à voix haute et compte combien de fois reviennent « en Lui » ou « en Christ » ; remercie Dieu pour chacune.",
    ),
    resourceTopics: ['identity', 'worship', 'church'],
  },
  {
    movement: 'belonging',
    theme: { en: "No longer strangers: God's household", fr: 'Plus des étrangers : la maison de Dieu', es: 'Ya no extranjeros: la familia de Dios', pt: 'Não mais estrangeiros: a família de Deus', de: 'Keine Fremden mehr: Gottes Hausgenossen', ru: 'Не чужие: Божья семья', zh: '不再作外人：神家里的人', ja: 'もはや他国人ではない：神の家族', ko: '더 이상 외인이 아님: 하나님의 가족', ar: 'لسنا غرباء بعد: أهل بيت الله', fa: 'دیگر بیگانه نیستیم: اهل خانهٔ خدا', hi: 'अब परदेशी नहीं: परमेश्वर का घराना', id: 'Bukan orang asing lagi: keluarga Allah', sw: 'Si wageni tena: familia ya Mungu', tl: 'Hindi na dayuhan: sambahayan ng Diyos', am: 'ከእንግዲህ እንግዶች አይደለንም፦ የእግዚአብሔር ቤተሰብ' },
    ref: 'Ephesians 2:11-22',
    related: ['Ephesians 2:10', 'Romans 15:7'],
    reflection: L(
      "Right after calling believers God's workmanship, Paul shows what that workmanship looks like: people who were far off and people who were near, made into one new humanity through the cross, both with access to the Father by one Spirit. You were not saved into a private spirituality. You were welcomed into a household where the dividing wall is down — which means the people on the other side of your old walls are now family.",
      "Juste après avoir dit que les croyants sont l'ouvrage de Dieu, Paul montre à quoi ressemble cet ouvrage : ceux qui étaient loin et ceux qui étaient près, réunis par la croix en une seule humanité nouvelle, avec un même accès auprès du Père par un seul Esprit. Tu n'as pas été sauvé pour une spiritualité privée. Tu as été accueilli dans une maison où le mur de séparation est tombé — ce qui veut dire que ceux qui se tenaient de l'autre côté de tes anciens murs sont désormais ta famille.",
    ),
    prompts: [
      L('Thank God that in Christ you come to the Father by one Spirit, not as a guest but as family.', "Remercie Dieu : en Christ, tu t'approches du Père par un seul Esprit, non comme un invité mais comme un membre de la famille."),
      L('Name a wall — of ethnicity, class, politics or church background — that you still keep up, and ask Christ to bring it down in you.', "Nomme un mur — d'origine, de classe sociale, de politique ou de tradition d'Église — que tu maintiens encore, et demande à Christ de le faire tomber en toi."),
      L('Pray by name for a believer whose background is very different from yours.', "Prie nommément pour un croyant dont le parcours est très différent du tien."),
    ],
    practice: L(
      'At your next church gathering, greet someone you would not naturally talk to, and ask how you can pray for them this week.',
      "Lors de ta prochaine réunion d'Église, va saluer quelqu'un vers qui tu n'irais pas naturellement, et demande-lui comment tu peux prier pour lui cette semaine.",
    ),
    resourceTopics: ['church', 'community'],
  },
  {
    movement: 'belonging',
    theme: { en: 'A temple of the Holy Spirit', fr: 'Temple du Saint-Esprit', es: 'Templo del Espíritu Santo', pt: 'Templo do Espírito Santo', de: 'Tempel des Heiligen Geistes', ru: 'Храм Святого Духа', zh: '圣灵的殿', ja: '聖霊の宮', ko: '성령의 전', ar: 'هيكل للروح القدس', fa: 'معبد روح‌القدس', hi: 'पवित्र आत्मा का मन्दिर', id: 'Bait Roh Kudus', sw: 'Hekalu la Roho Mtakatifu', tl: 'Templo ng Espiritu Santo', am: 'የመንፈስ ቅዱስ ቤተ መቅደስ' },
    ref: '1 Corinthians 6:12-20',
    related: ['1 Corinthians 3:16-17', 'Romans 12:1'],
    reflection: L(
      "Some in Corinth argued that the body did not matter, so what they did with it did not matter either. Paul answers that the body is meant for the Lord, that the believer is joined to Him in one spirit, and that the Holy Spirit lives in them as in a temple. You are not your own; you were bought at a price. That rules out despising your body as firmly as it rules out using it however you like: your body is honoured, because God dwells there.",
      "À Corinthe, certains affirmaient que le corps ne comptait pas, et donc que ce qu'on en faisait ne comptait pas non plus. Paul répond que le corps est pour le Seigneur, que le croyant Lui est uni en un seul esprit, et que le Saint-Esprit habite en lui comme dans un temple. Tu ne t'appartiens pas ; tu as été racheté à un grand prix. Cela exclut autant le mépris de ton corps que le fait d'en user à ta guise : ton corps est honoré, parce que Dieu y habite.",
    ),
    prompts: [
      L('Thank the Holy Spirit that He makes His home in you, body and all.', "Remercie le Saint-Esprit de faire Sa demeure en toi, corps compris."),
      L('Offer your body to God today — your eyes, habits, sleep, sexuality and appetite — as belonging to Him.', "Offre ton corps à Dieu aujourd'hui — tes yeux, tes habitudes, ton sommeil, ta sexualité et ton appétit — comme Lui appartenant."),
      L('Ask Him to free you both from contempt for your body and from misusing it.', "Demande-Lui de te libérer à la fois du mépris de ton corps et du mauvais usage que tu pourrais en faire."),
    ],
    practice: L(
      'Choose one ordinary bodily habit — sleep, food, screen time or rest — and make one change today as a way of honouring God with your body.',
      "Choisis une habitude corporelle ordinaire — le sommeil, la nourriture, les écrans ou le repos — et fais aujourd'hui un changement pour honorer Dieu dans ton corps.",
    ),
    safetyNote: L(
      "If your body was harmed by someone else, that was their sin, not yours, and this passage does not blame you. A pastor, counsellor or doctor you trust can help you carry it. If you are in danger now, contact your local emergency services.",
      "Si ton corps a été blessé par quelqu'un d'autre, c'était son péché, pas le tien, et ce passage ne t'accuse pas. Un pasteur, un conseiller ou un médecin en qui tu as confiance peut t'aider à porter cela. Si tu es en danger maintenant, contacte les services d'urgence.",
    ),
    resourceTopics: ['holy-spirit', 'holiness', 'purity'],
  },
  {
    movement: 'belonging',
    theme: { en: "A member of Christ's body", fr: 'Membre du corps de Christ', es: 'Miembro del cuerpo de Cristo', pt: 'Membro do corpo de Cristo', de: 'Glied am Leib Christi', ru: 'Член Тела Христова', zh: '基督身上的肢体', ja: 'キリストのからだの一部', ko: '그리스도의 몸의 지체', ar: 'عضو في جسد المسيح', fa: 'عضوی از بدن مسیح', hi: 'मसीह की देह का अंग', id: 'Anggota tubuh Kristus', sw: 'Kiungo cha mwili wa Kristo', tl: 'Bahagi ng katawan ni Cristo', am: 'የክርስቶስ አካል ብልት' },
    ref: '1 Corinthians 12:12-27',
    related: ['Romans 12:4-8', 'Ephesians 4:15-16'],
    reflection: L(
      "Paul writes to a church where some felt superior because of their spiritual gifts and others felt they did not belong. His picture refuses both. The foot cannot opt out because it is not a hand, and the eye cannot tell the hand it is not needed; God arranged the members as He chose, and the parts that seem weaker are indispensable. You are not a spectator of Christ's body: your gifts are for others, and theirs are for you.",
      "Paul écrit à une Église où certains se sentaient supérieurs à cause de leurs dons spirituels, et d'autres avaient l'impression de ne pas y avoir leur place. Son image refuse les deux. Le pied ne peut pas se retirer parce qu'il n'est pas une main, et l'œil ne peut pas dire à la main qu'il n'a pas besoin d'elle ; Dieu a disposé les membres comme Il l'a voulu, et ceux qui paraissent les plus faibles sont indispensables. Tu n'es pas spectateur du corps de Christ : tes dons sont pour les autres, et les leurs sont pour toi.",
    ),
    prompts: [
      L('Thank God for the place He has given you in His body, even if it feels small or hidden.', "Remercie Dieu pour la place qu'Il t'a donnée dans Son corps, même si elle te semble petite ou cachée."),
      L('Ask the Holy Spirit to show you which gifts He has given you for the good of others.', "Demande au Saint-Esprit de te montrer quels dons Il t'a confiés pour le bien des autres."),
      L('Pray for one member of your church who seems overlooked, and for one who carries a heavy load.', "Prie pour un membre de ton Église qui semble oublié, et pour un autre qui porte une lourde charge."),
    ],
    practice: L(
      'Send a short message today to someone whose quiet service in your church helps you, and tell them specifically what it means to you.',
      "Envoie aujourd'hui un court message à quelqu'un dont le service discret dans ton Église t'aide, et dis-lui précisément ce que cela représente pour toi.",
    ),
    resourceTopics: ['church', 'spiritual-gifts', 'community'],
  },
  {
    movement: 'belonging',
    theme: { en: 'Citizens of heaven', fr: 'Citoyens des cieux', es: 'Ciudadanos del cielo', pt: 'Cidadãos do céu', de: 'Bürger des Himmels', ru: 'Граждане небес', zh: '天上的国民', ja: '国籍は天にある', ko: '하늘의 시민', ar: 'مواطنتنا في السماوات', fa: 'شهروندان آسمان', hi: 'स्वर्ग के नागरिक', id: 'Warga kerajaan sorga', sw: 'Raia wa mbinguni', tl: 'Mamamayan ng langit', am: 'የሰማይ ዜጎች' },
    ref: 'Philippians 3:17-21',
    related: ['1 Peter 2:11-12', 'Hebrews 11:13-16'],
    reflection: L(
      "Philippi was a Roman colony, and its citizens were proud of their Roman status. Paul tells the church that their citizenship is in heaven, and that they are waiting for a Saviour who will transform their frail bodies to be like His glorious body. Peter calls believers foreigners and exiles in this world. Belonging to heaven does not make you careless about earth; it frees you from needing any nation, party or social circle to tell you who you are.",
      "Philippes était une colonie romaine, et ses habitants étaient fiers de leur citoyenneté romaine. Paul dit à l'Église que sa citoyenneté est dans les cieux, et qu'elle attend un Sauveur qui transformera leurs corps fragiles pour les rendre semblables à Son corps glorieux. Pierre appelle les croyants étrangers et voyageurs en ce monde. Appartenir au ciel ne te rend pas indifférent à la terre ; cela te libère du besoin qu'une nation, un parti ou un cercle social te dise qui tu es.",
    ),
    prompts: [
      L('Thank God that your truest citizenship is secure with Christ, whatever your passport or social standing.', "Remercie Dieu : ta citoyenneté la plus profonde est en sûreté auprès de Christ, quels que soient ton passeport ou ton rang social."),
      L('Ask Him to loosen your grip on any group you look to for your sense of worth.', "Demande-Lui de desserrer ton emprise sur tout groupe auquel tu demandes de te donner ta valeur."),
      L("Pray for believers who live today as refugees or migrants, that they would find a true home among God's people.", "Prie pour les croyants qui vivent aujourd'hui comme réfugiés ou migrants, afin qu'ils trouvent un vrai foyer au sein du peuple de Dieu."),
    ],
    practice: L(
      'Read 1 Peter 2:11-12 and choose one good and honourable thing you can do today where people who do not share your faith will see it.',
      "Lis 1 Pierre 2.11-12 et choisis une chose bonne et honorable que tu peux faire aujourd'hui sous le regard de personnes qui ne partagent pas ta foi.",
    ),
    resourceTopics: ['kingdom-of-god', 'identity', 'church'],
  },

  // ── Movement 4 · Living from your new identity (days 16–21) ──────────────
  {
    movement: 'living',
    theme: { en: 'Free from slavery to sin', fr: "Libérés de l'esclavage du péché", es: 'Libres de la esclavitud del pecado', pt: 'Livres da escravidão do pecado', de: 'Frei von der Knechtschaft der Sünde', ru: 'Свобода от рабства греху', zh: '脱离罪的奴役', ja: '罪の奴隷から解放された', ko: '죄의 종노릇에서 해방됨', ar: 'أحرار من عبودية الخطية', fa: 'آزاد از بندگی گناه', hi: 'पाप की दासता से स्वतंत्र', id: 'Bebas dari perbudakan dosa', sw: 'Huru kutoka utumwa wa dhambi', tl: 'Malaya sa pagkaalipin sa kasalanan', am: 'ከኃጢአት ባርነት ነጻ' },
    ref: 'Romans 6:1-14',
    related: ['Romans 6:15-18', 'Galatians 5:16-17'],
    reflection: L(
      "Paul expects the objection: if grace abounds, why not keep sinning? His answer is union: baptized into Christ's death, so that just as Christ was raised, we too may live a new life. Then come the commands: count yourself dead to sin, do not let it reign, offer yourself to God. He would not need to write them if the battle were already over. Freedom here means sin is no longer your rightful master, even while you still have to refuse its orders day by day.",
      "Paul anticipe l'objection : si la grâce abonde, pourquoi ne pas continuer à pécher ? Sa réponse, c'est l'union : baptisés dans la mort de Christ, afin que, comme Christ est ressuscité, nous vivions nous aussi une vie nouvelle. Viennent ensuite les appels : considère-toi comme mort au péché, ne le laisse pas régner, offre-toi à Dieu. Paul n'aurait pas besoin de les écrire si le combat était déjà terminé. Être libre, ici, veut dire que le péché n'est plus ton maître légitime, même si tu dois encore refuser ses ordres jour après jour.",
    ),
    prompts: [
      L('Thank God that sin is no longer your rightful master, because you belong to Christ.', "Remercie Dieu : le péché n'est plus ton maître légitime, parce que tu appartiens à Christ."),
      L('Name one area where sin still behaves as if it ruled you, and refuse it before God.', "Nomme un domaine où le péché se comporte encore comme s'il te gouvernait, et refuse-le devant Dieu."),
      L('Offer yourself to God today, piece by piece — your words, your time, your desires.', "Offre-toi à Dieu aujourd'hui, morceau par morceau — tes paroles, ton temps, tes désirs."),
    ],
    practice: L(
      'Identify the moment of the day when one particular temptation is strongest, and decide now what you will do instead — a call, a walk, a prayer.',
      "Repère le moment de la journée où une tentation précise est la plus forte, et décide dès maintenant ce que tu feras à la place — un appel, une marche, une prière.",
    ),
    resourceTopics: ['holiness', 'discipleship', 'repentance'],
  },
  {
    movement: 'living',
    theme: { en: 'Your past is not your master', fr: "Ton passé n'est pas ton maître", es: 'Tu pasado no es tu amo', pt: 'Seu passado não é seu senhor', de: 'Deine Vergangenheit ist nicht dein Herr', ru: 'Прошлое тебе не хозяин', zh: '过去不再辖制你', ja: '過去はあなたの主人ではない', ko: '과거는 너의 주인이 아니다', ar: 'ماضيك ليس سيّدك', fa: 'گذشته‌ات ارباب تو نیست', hi: 'तुम्हारा अतीत तुम्हारा स्वामी नहीं', id: 'Masa lalumu bukan tuanmu', sw: 'Zamani zako si bwana wako', tl: 'Hindi mo panginoon ang nakaraan mo', am: 'ያለፈው ሕይወትህ ጌታህ አይደለም' },
    ref: '1 Timothy 1:12-17',
    related: ['Luke 19:1-10', '1 Corinthians 6:9-11'],
    reflection: L(
      "Paul names his past without softening it — a blasphemer, a persecutor, a violent man — and never pretends it did no harm. Yet he calls himself the prime example of Christ's patience. Zacchaeus shows what receiving such grace can look like: he sets out to repay the people he cheated. Grace does not erase what happened. It breaks the past's right to define you, and it often leads you to repair what can be repaired.",
      "Paul nomme son passé sans l'adoucir — blasphémateur, persécuteur, homme violent — et ne prétend jamais qu'il n'a pas fait de mal. Pourtant, il se présente comme le premier exemple de la patience de Christ. Zachée montre à quoi peut ressembler l'accueil d'une telle grâce : il entreprend de rembourser ceux qu'il a volés. La grâce n'efface pas ce qui s'est passé. Elle brise le droit du passé à te définir, et elle conduit souvent à réparer ce qui peut l'être.",
    ),
    prompts: [
      L('Tell God the part of your past you most often use to define yourself, and let Him name you instead as someone shown mercy.', "Dis à Dieu quelle part de ton passé tu utilises le plus souvent pour te définir, et laisse-Le plutôt te nommer comme quelqu'un qui a reçu miséricorde."),
      L('If you have harmed someone, ask Him for courage to confess it and, where it is wise and safe, to make it right.', "Si tu as fait du tort à quelqu'un, demande-Lui le courage de le confesser et, là où c'est sage et sans danger, de réparer."),
      L('If someone has harmed you, bring it to Him as a wound, not as your guilt, and ask for help to carry it.', "Si quelqu'un t'a fait du mal, apporte-le-Lui comme une blessure, non comme ta culpabilité, et demande-Lui de l'aide pour le porter."),
    ],
    practice: L(
      'If there is a wrong you can repair, decide today on one step — an apology, a repayment, an honest conversation — and ask a pastor or mature believer to help you think it through.',
      "S'il y a un tort que tu peux réparer, décide aujourd'hui d'un pas — des excuses, un remboursement, une conversation franche — et demande à un pasteur ou à un croyant mûr de t'aider à y réfléchir.",
    ),
    safetyNote: L(
      "If shame about your past brings thoughts of harming yourself, please talk today with a pastor, counsellor or doctor you trust. If you are in immediate danger, contact your local emergency services now.",
      "Si la honte liée à ton passé fait naître des pensées de te faire du mal, parles-en dès aujourd'hui à un pasteur, un conseiller ou un médecin en qui tu as confiance. Si tu es en danger immédiat, contacte tout de suite les services d'urgence.",
    ),
    resourceTopics: ['forgiveness', 'repentance', 'gospel'],
  },
  {
    movement: 'living',
    theme: { en: 'Your worth is not earned', fr: 'Ta valeur ne se mérite pas', es: 'Tu valor no se gana', pt: 'Seu valor não se conquista', de: 'Deinen Wert musst du nicht verdienen', ru: 'Твою ценность не нужно заслуживать', zh: '你的价值不是赚来的', ja: 'あなたの価値は勝ち取るものではない', ko: '너의 가치는 얻어내는 것이 아니다', ar: 'قيمتك ليست مكتسبة', fa: 'ارزش تو به دست آوردنی نیست', hi: 'तुम्हारा मूल्य कमाया नहीं जाता', id: 'Nilaimu bukan hasil usaha', sw: 'Thamani yako haipatikani kwa kazi', tl: 'Hindi pinaghihirapan ang halaga mo', am: 'ዋጋህ በሥራ የሚገኝ አይደለም' },
    ref: 'Philippians 3:4-11',
    related: ['Luke 10:17-20', 'Jeremiah 9:23-24'],
    reflection: L(
      "Paul had an impressive record — pedigree, zeal, a blameless religious performance — and he counts all of it as loss compared with knowing Christ and being found in Him, with a righteousness that comes from God. When the disciples Jesus had sent out came back thrilled that demons submitted to them, He told them to rejoice rather that their names are written in heaven. Career, money, looks, relationship status, approval, even ministry success: good gifts, perhaps, but none of them can carry your worth.",
      "Paul avait un parcours impressionnant — ascendance, zèle, pratique religieuse irréprochable — et il considère tout cela comme une perte à côté de la connaissance de Christ et du fait d'être trouvé en Lui, avec une justice qui vient de Dieu. Quand les disciples envoyés par Jésus sont revenus tout joyeux de ce que les démons leur étaient soumis, Il leur a dit de se réjouir plutôt de ce que leurs noms sont écrits dans les cieux. Carrière, argent, apparence, situation amoureuse, approbation des autres, et même succès dans le ministère : de bons dons, peut-être, mais aucun ne peut porter ta valeur.",
    ),
    prompts: [
      L('List before God what you are tempted to be proud of, and tell Him that knowing Christ is worth more than all of it.', "Énumère devant Dieu ce dont tu es tenté de t'enorgueillir, et dis-Lui que connaître Christ vaut plus que tout cela."),
      L('Confess where you have treated a success or a failure as the verdict on your worth.', "Confesse les moments où tu as pris une réussite ou un échec pour le verdict sur ta valeur."),
      L('Thank Him that your name is written in heaven, and that no result this week can change what that means.', "Remercie-Le : ton nom est écrit dans les cieux, et aucun résultat de cette semaine ne peut changer ce que cela signifie."),
    ],
    practice: L(
      'Do one hidden act of kindness today that nobody will know about, and do not mention it to anyone (Matthew 6:3-4).',
      "Accomplis aujourd'hui un acte de bonté caché que personne ne connaîtra, et n'en parle à personne (Matthieu 6.3-4).",
    ),
    resourceTopics: ['identity', 'work', 'contentment'],
  },
  {
    movement: 'living',
    theme: { en: 'Being conformed to Christ', fr: "Transformés à l'image de Christ", es: 'Transformados a la imagen de Cristo', pt: 'Transformados à imagem de Cristo', de: 'In Christi Bild verwandelt', ru: 'Преображаемые в образ Христа', zh: '变成基督的形像', ja: 'キリストの姿に変えられていく', ko: '그리스도의 형상으로 변화됨', ar: 'نتغيّر إلى صورة المسيح', fa: 'دگرگونی به شباهت مسیح', hi: 'मसीह के स्वरूप में बदलते जाना', id: 'Diubah menjadi serupa Kristus', sw: 'Kubadilishwa kufanana na Kristo', tl: 'Binabago ayon sa larawan ni Cristo', am: 'ክርስቶስን እንድንመስል መለወጥ' },
    ref: '2 Corinthians 3:12-18',
    related: ['Romans 8:28-30', 'Philippians 1:6'],
    reflection: L(
      "Moses veiled his face as the glory faded; in Christ the veil is taken away, and believers who behold the Lord's glory are being changed into His image, step by step. The verb is ongoing, and the work is the Spirit's. Romans 8 names God's purpose as conforming His children to the image of His Son — the image of Genesis 1, restored in Christ. You are not finished, and you are not left alone in the process.",
      "Moïse voilait son visage tandis que la gloire s'effaçait ; en Christ, le voile est ôté, et les croyants qui contemplent la gloire du Seigneur sont transformés en Son image, pas à pas. Le verbe exprime une action qui dure, et l'œuvre est celle de l'Esprit. Romains 8 dit que le dessein de Dieu est de rendre Ses enfants semblables à l'image de Son Fils — l'image de Genèse 1, restaurée en Christ. Tu n'es pas achevé, et tu n'es pas seul dans ce chemin.",
    ),
    prompts: [
      L('Thank the Holy Spirit that He is at work in you, even where change feels slow.', "Remercie le Saint-Esprit d'être à l'œuvre en toi, même là où le changement te semble lent."),
      L('Ask to see more of the glory of Christ in Scripture this week, since that is how this change comes.', "Demande à contempler davantage la gloire de Christ dans l'Écriture cette semaine, puisque c'est ainsi que vient ce changement."),
      L('Name one way you long to become more like Jesus, and ask the Spirit for it in faith, without setting Him deadlines.', "Nomme une manière dont tu désires ressembler davantage à Jésus, et demande-la à l'Esprit avec foi, sans Lui fixer d'échéance."),
    ],
    practice: L(
      'Read one Gospel story about Jesus today, and write down one thing you see in Him that you would like the Spirit to form in you.',
      "Lis aujourd'hui un récit des Évangiles sur Jésus, et note une chose que tu vois en Lui et que tu aimerais que l'Esprit forme en toi.",
    ),
    resourceTopics: ['holy-spirit', 'spiritual-formation', 'holiness'],
  },
  {
    movement: 'living',
    theme: { en: "Christ's ambassadors", fr: 'Ambassadeurs pour Christ', es: 'Embajadores de Cristo', pt: 'Embaixadores de Cristo', de: 'Botschafter an Christi statt', ru: 'Посланники от имени Христа', zh: '基督的使者', ja: 'キリストの使節', ko: '그리스도의 대사', ar: 'سفراء عن المسيح', fa: 'سفیران مسیح', hi: 'मसीह के राजदूत', id: 'Utusan Kristus', sw: 'Mabalozi wa Kristo', tl: 'Mga sugo ni Cristo', am: 'የክርስቶስ መልእክተኞች' },
    ref: '2 Corinthians 5:18-21',
    related: ['Matthew 5:13-16', '1 Peter 3:15-16'],
    reflection: L(
      "An ambassador speaks for someone else and carries a message they did not write. God reconciled us to Himself through Christ, then entrusted us with the message of reconciliation, as though He were making His appeal through us. The tone is pleading, not pressuring. Your identity in Christ is not only something to enjoy; it sends you, with gentleness and respect, to people who have not yet heard what He has done.",
      "Un ambassadeur parle au nom d'un autre et porte un message qu'il n'a pas rédigé. Dieu nous a réconciliés avec Lui par Christ, puis nous a confié le message de la réconciliation, comme si c'était Lui qui exhortait par nous. Le ton est celui de la supplication, non de la pression. Ton identité en Christ n'est pas seulement une chose dont tu jouis ; elle t'envoie, avec douceur et respect, vers ceux qui n'ont pas encore entendu ce qu'Il a fait.",
    ),
    prompts: [
      L('Thank God for the person who first carried the message of reconciliation to you.', "Remercie Dieu pour la personne qui t'a apporté la première le message de la réconciliation."),
      L('Pray by name for one person who does not yet know Christ, asking God to draw them to Himself.', "Prie nommément pour une personne qui ne connaît pas encore Christ, en demandant à Dieu de l'attirer à Lui."),
      L('Ask Him for gentleness and courage to speak of Jesus when an opening comes, without forcing one.', "Demande-Lui la douceur et le courage de parler de Jésus quand une occasion se présente, sans la forcer."),
    ],
    practice: L(
      'Today, ask one person who does not share your faith how you can pray for them, and pray for it that same day.',
      "Aujourd'hui, demande à une personne qui ne partage pas ta foi comment tu peux prier pour elle, et prie pour cela le jour même.",
    ),
    resourceTopics: ['evangelism', 'calling'],
  },
  {
    movement: 'living',
    theme: { en: 'Hidden with Christ in God', fr: 'Une vie cachée avec Christ en Dieu', es: 'Una vida escondida con Cristo en Dios', pt: 'Uma vida escondida com Cristo em Deus', de: 'Mit Christus verborgen in Gott', ru: 'Жизнь, сокрытая со Христом в Боге', zh: '与基督一同藏在神里面', ja: 'キリストとともに神のうちに隠されたいのち', ko: '그리스도와 함께 하나님 안에 감추어진 생명', ar: 'حياة مستترة مع المسيح في الله', fa: 'زندگی پنهان با مسیح در خدا', hi: 'मसीह के साथ परमेश्वर में छिपा जीवन', id: 'Hidup tersembunyi bersama Kristus di dalam Allah', sw: 'Uzima uliofichwa pamoja na Kristo ndani ya Mungu', tl: 'Buhay na nakatago kasama ni Cristo sa Diyos', am: 'ከክርስቶስ ጋር በእግዚአብሔር የተሰወረ ሕይወት' },
    ref: 'Colossians 3:1-4',
    related: ['Colossians 3:9-11', '1 John 3:2'],
    reflection: L(
      "Paul tells the Colossians that they have died and their life is hidden with Christ in God — kept safe, and not yet fully visible. So they set their minds on things above, where Christ is. A few lines later he lists the labels that used to divide people — nation, culture, slave, free — and says that Christ is all, and in all. The journey ends where it began, with who He is: when Christ appears, you will appear with Him.",
      "Paul dit aux Colossiens qu'ils sont morts et que leur vie est cachée avec Christ en Dieu — gardée en sûreté, et pas encore pleinement visible. Alors ils attachent leurs pensées aux choses d'en haut, là où est Christ. Quelques lignes plus loin, il énumère les étiquettes qui divisaient les gens — nation, culture, esclave, homme libre — et dit que Christ est tout et en tous. Le parcours s'achève là où il a commencé, avec qui Il est : quand Christ paraîtra, tu paraîtras avec Lui.",
    ),
    prompts: [
      L('Thank God that your life is kept with Christ in Him, where no failure, loss or label can reach it.', "Remercie Dieu : ta vie est gardée avec Christ en Lui, là où aucun échec, aucune perte, aucune étiquette ne peut l'atteindre."),
      L('Ask Him to keep your mind set on things above as you return to ordinary days.', "Demande-Lui de garder tes pensées attachées aux choses d'en haut alors que tu retrouves des jours ordinaires."),
      L('Pray over the three truths from these days you most need to remember, and ask the Holy Spirit to keep them alive in you.', "Prie sur les trois vérités de ces jours dont tu as le plus besoin de te souvenir, et demande au Saint-Esprit de les garder vivantes en toi."),
    ],
    practice: L(
      'Write down three truths about who you are in Christ from this plan, each with its reference, and put them where you will see them tomorrow morning.',
      "Note trois vérités de ce parcours sur qui tu es en Christ, chacune avec sa référence, et place-les là où tu les verras demain matin.",
    ),
    resourceTopics: ['identity', 'spiritual-formation', 'gospel'],
  },
];
