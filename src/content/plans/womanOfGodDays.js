// The 21 days of "Woman of God" (see ./womanOfGod.js for the plan meta, the
// movements and the guardrails this content is held to).
//
// Each day studies one woman — or one passage about women — of Scripture, read
// in context: narrative describes what happened, it does not turn every detail
// into a rule. The curriculum is written for every woman: single, married,
// widowed, with or without children, young or old, working in or outside the
// home. Womanhood is never defined here by appearance, marriage, motherhood,
// passivity or male approval.
//
// Day shape follows ./preparingInPrayerDays.js: `theme` in all 16 languages,
// a PRIMARY `ref` plus up to three `related` passages (references only — never
// Bible text), a reflection, three prayer prompts, one small practice, an
// occasional `selfPrompt` or `safetyNote`, and `resourceTopics`. Prose is
// authored in en + fr (French uses "tu" and feminine agreement); the other
// languages fall back through pick().
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Movement 1 · A woman before God (days 1–5) ───────────────────────────
  {
    movement: 'before',
    theme: { en: "Bearing God's image", fr: "Porter l'image de Dieu", es: 'Portadora de la imagen de Dios', pt: 'Portadora da imagem de Deus', de: 'Gottes Ebenbild tragen', ru: 'Носительница образа Божьего', zh: '承载神的形像', ja: '神のかたちを映す者', ko: '하나님의 형상을 지닌 여인', ar: 'حاملة صورة الله', fa: 'حامل صورت خدا', hi: 'परमेश्वर के स्वरूप को धारण करना', id: 'Menyandang gambar Allah', sw: 'Kubeba mfano wa Mungu', tl: 'Nagtataglay ng larawan ng Diyos', am: 'የእግዚአብሔርን መልክ መሸከም' },
    ref: 'Genesis 1:26-31',
    related: ['Genesis 5:1-2', 'Psalm 8:3-8'],
    reflection: L(
      "Before Scripture mentions marriage, children, work or appearance, it says that God made humanity male and female in His own image — then blessed them together and gave them together the task of filling and caring for the earth. The first thing the Bible says about a woman is not her role but whose likeness she bears and whose work she shares. Nothing that comes later in your life can add to that dignity or take it away.",
      "Avant de parler de mariage, d'enfants, de travail ou d'apparence, l'Écriture dit que Dieu a créé l'être humain homme et femme à Son image — puis qu'Il les a bénis ensemble et leur a confié ensemble la tâche de remplir la terre et d'en prendre soin. La première chose que la Bible dit d'une femme ne concerne pas son rôle, mais la ressemblance qu'elle porte et l'œuvre qu'elle partage. Rien de ce qui viendra ensuite dans ta vie ne peut ajouter à cette dignité, ni te la retirer.",
    ),
    prompts: [
      L('Praise God for making you in His image and blessing you, long before you could achieve or earn anything.', "Loue Dieu de t'avoir créée à Son image et bénie, bien avant que tu puisses accomplir ou mériter quoi que ce soit."),
      L("Tell Him honestly what you most often let define you — your appearance, your relationship status, your family, someone's approval — and hand it back to Him.", "Dis-Lui honnêtement ce que tu laisses le plus souvent te définir — ton apparence, ta situation conjugale, ta famille, l'approbation de quelqu'un — et remets-le-Lui."),
      L('Pray for women whose dignity is trampled — through trafficking, violence or contempt — asking God to protect them and to raise up people who treat them as His image-bearers.', 'Prie pour les femmes dont la dignité est bafouée — par la traite, la violence ou le mépris — en demandant à Dieu de les protéger et de susciter des personnes qui les traitent comme porteuses de Son image.'),
    ],
    practice: L(
      'Choose three women you know — one older than you, one younger, one you find difficult — and thank God by name today for His image in each of them.',
      "Choisis trois femmes que tu connais — une plus âgée que toi, une plus jeune, une avec qui c'est difficile — et remercie Dieu aujourd'hui, en les nommant, pour Son image en chacune d'elles.",
    ),
    resourceTopics: ['womanhood', 'identity'],
  },
  {
    movement: 'before',
    theme: { en: 'A strong helper', fr: 'Une aide forte', es: 'Una ayuda fuerte', pt: 'Uma auxiliadora forte', de: 'Eine starke Hilfe', ru: 'Сильная помощница', zh: '刚强的帮助者', ja: '力ある助け手', ko: '강한 돕는 자', ar: 'معينة قوية', fa: 'یاوری نیرومند', hi: 'एक सामर्थी सहायक', id: 'Penolong yang kuat', sw: 'Msaidizi mwenye nguvu', tl: 'Isang malakas na katuwang', am: 'ብርቱ ረዳት' },
    ref: 'Genesis 2:18-25',
    related: ['Psalm 121:1-2', 'Psalm 33:20-22'],
    reflection: L(
      "The first thing in creation God calls not good is the man being alone. The word Genesis uses for the woman — ezer, usually translated 'helper' — is used most often in the Old Testament for God Himself coming to rescue His people (Psalm 121). It describes strength brought to a need, not a lower rank. Christians differ on what this chapter implies for roles in marriage and church; they agree that the woman was made as a true counterpart, not an afterthought.",
      "La première chose que Dieu déclare « pas bonne » dans la création, c'est que l'homme soit seul. Le mot que la Genèse emploie pour la femme — ezer, souvent traduit par « aide » — désigne le plus souvent, dans l'Ancien Testament, Dieu Lui-même venant au secours de Son peuple (Psaume 121). Il parle d'une force apportée là où il y a un besoin, non d'un rang inférieur. Les chrétiens divergent sur ce que ce chapitre implique pour les rôles dans le couple et dans l'Église ; ils s'accordent pour dire que la femme a été créée comme un vis-à-vis véritable, non comme un ajout.",
    ),
    prompts: [
      L('Thank God that the word Genesis uses for the first woman is one He also uses for Himself — a word of strength, not of lesser worth.', "Remercie Dieu : le mot que la Genèse emploie pour la première femme, Il l'emploie aussi pour Lui-même — un mot de force, non de moindre valeur."),
      L('Ask Him where your strength is meant to come alongside others — in your family, your church, your work or your friendships.', 'Demande-Lui où ta force est appelée à venir en aide aux autres — dans ta famille, ton Église, ton travail ou tes amitiés.'),
      L('Pray for the men and women you work and serve alongside, that you would be real partners rather than rivals.', "Prie pour les hommes et les femmes aux côtés desquels tu travailles et sers, afin qu'entre eux et toi règne un vrai partenariat plutôt que la rivalité."),
    ],
    practice: L(
      'Today, offer concrete help to one person facing something hard — a meal, a call, an hour of your time — as strength brought alongside, not as a favour.',
      "Aujourd'hui, offre une aide concrète à une personne qui traverse une épreuve — un repas, un appel, une heure de ton temps — comme une force qui vient à ses côtés, non comme une faveur.",
    ),
    resourceTopics: ['womanhood', 'calling'],
  },
  {
    movement: 'before',
    theme: { en: 'Eve: grace after the fall', fr: 'Ève : la grâce après la chute', es: 'Eva: gracia después de la caída', pt: 'Eva: graça depois da queda', de: 'Eva: Gnade nach dem Fall', ru: 'Ева: благодать после грехопадения', zh: '夏娃：堕落之后的恩典', ja: 'エバ――堕落の後の恵み', ko: '하와: 타락 후의 은혜', ar: 'حواء: نعمة بعد السقوط', fa: 'حوا: فیض پس از سقوط', hi: 'हव्वा: पतन के बाद अनुग्रह', id: 'Hawa: anugerah setelah kejatuhan', sw: 'Hawa: neema baada ya anguko', tl: 'Eva: biyaya matapos ang pagkahulog', am: 'ሔዋን፦ ከውድቀት በኋላ ጸጋ' },
    ref: 'Genesis 3:1-15',
    related: ['Genesis 3:20-21', 'Romans 5:12-19'],
    reflection: L(
      "The serpent spoke to the woman, but Genesis notes that her husband was with her: both ate, both hid, and both shifted the blame. Scripture never makes women the source of the world's sin — Paul traces its entrance through Adam (Romans 5). And before God sends them out, He speaks the first promise of a Rescuer from the woman's offspring, and clothes them with His own hands. Eve's story is not a warning about women; it is the first place grace appears.",
      "Le serpent s'adresse à la femme, mais la Genèse précise que son mari était avec elle : tous deux mangent, tous deux se cachent, tous deux rejettent la faute. L'Écriture ne fait jamais des femmes la source du péché du monde — Paul en fait remonter l'entrée à Adam (Romains 5). Et avant de les renvoyer, Dieu prononce la première promesse d'un Libérateur issu de la descendance de la femme, et Il les habille de Ses propres mains. L'histoire d'Ève n'est pas un avertissement contre les femmes : c'est le premier endroit où paraît la grâce.",
    ),
    prompts: [
      L('Confess to God one place where, like Eve and Adam, you have hidden or passed on the blame, and receive His forgiveness in Christ.', 'Confesse à Dieu un domaine où, comme Ève et Adam, tu t\'es cachée ou tu as rejeté la faute, et reçois Son pardon en Christ.'),
      L('Thank Him that His first word after the fall was a promise, and that the promised Rescuer has come in Jesus.', 'Remercie-Le : Sa première parole après la chute a été une promesse, et le Libérateur promis est venu en Jésus.'),
      L('Ask Him to free you from any shame you carry simply for being a woman, and to replace it with the dignity He gave.', "Demande-Lui de te libérer de toute honte que tu portes simplement parce que tu es une femme, et de la remplacer par la dignité qu'Il t'a donnée."),
    ],
    practice: L(
      'Write down one failure you keep replaying. Under it, write Genesis 3:21, and thank God that He covers what He forgives.',
      "Note un échec que tu ressasses sans cesse. En dessous, écris Genèse 3.21, et remercie Dieu de couvrir ce qu'Il pardonne.",
    ),
    resourceTopics: ['gospel', 'womanhood'],
  },
  {
    movement: 'before',
    theme: { en: 'Hagar: the God who sees', fr: 'Agar : le Dieu qui voit', es: 'Agar: el Dios que ve', pt: 'Agar: o Deus que vê', de: 'Hagar: der Gott, der sieht', ru: 'Агарь: Бог, Который видит', zh: '夏甲：看顾人的神', ja: 'ハガル――見てくださる神', ko: '하갈: 살피시는 하나님', ar: 'هاجر: الإله الذي يرى', fa: 'هاجر: خدایی که می‌بیند', hi: 'हाजिरा: देखने वाला परमेश्वर', id: 'Hagar: Allah yang melihat', sw: 'Hajiri: Mungu anayeona', tl: 'Hagar: ang Diyos na nakakakita', am: 'አጋር፦ የሚያይ አምላክ' },
    ref: 'Genesis 16:6-13',
    related: ['Genesis 21:14-19'],
    reflection: L(
      "Hagar was an enslaved Egyptian woman, used to solve someone else's problem and then mistreated until she fled into the desert. There the angel of the LORD found her by a spring, called her by name and asked where she had come from and where she was going. Scripture records that she gave the LORD a name: the God who sees me. Whoever overlooks you — at home, at work, in church — you are not unseen by Him.",
      "Agar était une esclave égyptienne, utilisée pour résoudre le problème d'autrui, puis maltraitée au point de fuir dans le désert. Là, l'ange de l'Éternel la trouve près d'une source, l'appelle par son nom et lui demande d'où elle vient et où elle va. L'Écriture rapporte qu'elle donne un nom à l'Éternel : le Dieu qui me voit. Qui que ce soit qui t'ignore — à la maison, au travail, à l'Église —, tu n'es pas invisible à Ses yeux.",
    ),
    prompts: [
      L("Answer the angel's questions honestly before God: where have you come from, and where are you going?", "Réponds honnêtement devant Dieu aux questions de l'ange : d'où viens-tu, et où vas-tu ?"),
      L('Thank Him that He sees the work, the pain and the faithfulness that no one else notices.', "Remercie-Le de voir le travail, la douleur et la fidélité que personne d'autre ne remarque."),
      L('Pray for women who are used or mistreated in homes and workplaces, especially migrant and domestic workers, that God would see them and send them help.', 'Prie pour les femmes exploitées ou maltraitées dans des foyers et des lieux de travail, en particulier les travailleuses migrantes et domestiques, afin que Dieu les voie et leur envoie du secours.'),
    ],
    practice: L(
      'Notice one person today whose work usually goes unseen — a cleaner, a carer, a colleague — and thank them by name.',
      "Remarque aujourd'hui une personne dont le travail passe d'habitude inaperçu — agent d'entretien, aide-soignante, collègue — et remercie-la en l'appelant par son nom.",
    ),
    safetyNote: L(
      'In verse 9 the angel sends Hagar back with a promise for her son. That word belonged to her situation; it is not a rule that anyone must stay where they are being harmed — and in chapter 21 God meets her again on the road away. If you are being mistreated at home or at work, talk to someone you trust or to a pastor, and contact local emergency services if you are in danger.',
      "Au verset 9, l'ange renvoie Agar avec une promesse pour son fils. Cette parole concernait sa situation ; ce n'est pas une règle obligeant quiconque à rester là où on lui fait du mal — et au chapitre 21, Dieu la rejoint de nouveau sur le chemin du départ. Si tu es maltraitée à la maison ou au travail, parles-en à une personne de confiance ou à un pasteur, et contacte les services d'urgence si tu es en danger.",
    ),
    resourceTopics: ['identity', 'suffering'],
  },
  {
    movement: 'before',
    theme: { en: 'Called daughter', fr: 'Appelée « ma fille »', es: 'Llamada «hija»', pt: 'Chamada de filha', de: 'Tochter genannt', ru: 'Названа дочерью', zh: '被称为女儿', ja: '「娘よ」と呼ばれて', ko: '딸이라 불리다', ar: 'مدعوّة ابنة', fa: 'دختر خوانده شده', hi: 'बेटी कहलाई', id: 'Dipanggil anak-Ku', sw: 'Aitwa binti', tl: 'Tinawag na anak', am: 'ልጄ ተብላ' },
    ref: 'Mark 5:25-34',
    related: ['Galatians 3:26-29', 'Galatians 4:4-7'],
    reflection: L(
      "For twelve years this woman's bleeding had left her ritually unclean, isolated and poorer after every doctor. She hoped to touch Jesus's cloak and slip away unseen. Jesus stopped the crowd — not to shame her, but to call her Daughter in front of everyone. In Christ every believer is God's child and heir, with the Spirit of His Son in her heart (Galatians 4). Not every illness is healed in this life, but no one who comes to Him is turned away.",
      "Depuis douze ans, ses pertes de sang rendaient cette femme impure selon la Loi, l'isolaient et l'appauvrissaient à chaque médecin consulté. Elle espérait toucher le vêtement de Jésus et repartir sans être vue. Jésus arrête la foule — non pour lui faire honte, mais pour l'appeler « ma fille » devant tous. En Christ, chaque croyant est enfant et héritier de Dieu, et l'Esprit de Son Fils habite son cœur (Galates 4). Toute maladie n'est pas guérie dans cette vie, mais aucun de ceux qui viennent à Lui n'est repoussé.",
    ),
    prompts: [
      L('Tell Jesus the whole truth, as she did — including whatever you have been hiding in the crowd.', "Dis à Jésus toute la vérité, comme elle l'a fait — y compris ce que tu cachais jusqu'ici dans la foule."),
      L('Thank God that in Christ you are His daughter and heir, and that His Spirit lives in you.', 'Remercie Dieu : en Christ, tu es Sa fille et Son héritière, et Son Esprit habite en toi.'),
      L('Pray for a woman you know who lives with long illness or isolation, asking Jesus to draw near to her and His church to welcome her.', "Prie pour une femme de ton entourage qui vit une longue maladie ou l'isolement, en demandant à Jésus de s'approcher d'elle et à Son Église de l'accueillir."),
    ],
    practice: L(
      "Read Galatians 4:4-7 aloud today, then pray it back to God in your own words, putting your name where Paul speaks of God's child and heir.",
      "Lis aujourd'hui Galates 4.4-7 à voix haute, puis prie-le à Dieu avec tes propres mots, en mettant ton prénom là où Paul parle de l'enfant et de l'héritier de Dieu.",
    ),
    resourceTopics: ['identity', 'gospel'],
  },

  // ── Movement 2 · Character, wisdom and holiness (days 6–10) ──────────────
  {
    movement: 'character',
    theme: { en: 'The woman of valour', fr: 'La femme vaillante', es: 'La mujer valiente', pt: 'A mulher valorosa', de: 'Die tüchtige Frau', ru: 'Добродетельная жена', zh: '才德的妇人', ja: 'しっかりした女性', ko: '현숙한 여인', ar: 'المرأة الفاضلة', fa: 'زن صالحه', hi: 'गुणवती स्त्री', id: 'Perempuan yang cakap', sw: 'Mwanamke hodari', tl: 'Ang babaeng may kagitingan', am: 'ልባም ሴት' },
    ref: 'Proverbs 31:10-31',
    related: ['Ruth 3:10-11', 'Proverbs 9:10'],
    reflection: L(
      "Proverbs ends with a poem, each line beginning with the next letter of the Hebrew alphabet, in praise of the 'woman of valour': strong, shrewd in business, generous to the poor, prepared, wise in speech, able to laugh at the days to come. It is a portrait of wisdom embodied, not a checklist — Boaz uses the same phrase of Ruth, a poor widowed foreigner with no household to run. What the poem finally praises is open to every woman: the fear of the LORD (v30).",
      "Les Proverbes s'achèvent sur un poème dont chaque vers commence par la lettre suivante de l'alphabet hébreu, à la louange de la « femme vaillante » : forte, avisée en affaires, généreuse envers les pauvres, prévoyante, sage dans ses paroles, capable de rire de l'avenir. C'est le portrait de la sagesse incarnée, pas une liste à cocher — Boaz emploie la même expression pour Ruth, une veuve étrangère et pauvre, sans maison à diriger. Ce que le poème loue en fin de compte est ouvert à toute femme : la crainte de l'Éternel (v. 30).",
    ),
    prompts: [
      L('Thank God for one woman whose strength, generosity or wisdom has shaped your life, naming her before Him.', 'Remercie Dieu pour une femme dont la force, la générosité ou la sagesse a marqué ta vie, en la nommant devant Lui.'),
      L('Ask Him to grow in you the fear of the LORD, which the poem praises above charm and beauty.', "Demande-Lui de faire grandir en toi la crainte de l'Éternel, que le poème loue au-dessus du charme et de la beauté."),
      L('Lay down before Him any exhausting comparison with an ideal woman, and ask for wisdom for the tasks actually in front of you.', 'Dépose devant Lui toute comparaison épuisante avec une femme idéale, et demande la sagesse pour les tâches qui sont réellement devant toi.'),
    ],
    practice: L(
      'Send a short message today to a woman whose strength you admire, telling her specifically what you see in her — and thank God for her.',
      "Envoie aujourd'hui un court message à une femme dont tu admires la force, en lui disant précisément ce que tu vois en elle — et remercie Dieu pour elle.",
    ),
    resourceTopics: ['wisdom', 'character', 'work', 'womanhood'],
  },
  {
    movement: 'character',
    theme: { en: 'Abigail: wisdom that acts', fr: 'Abigaïl : une sagesse qui agit', es: 'Abigail: sabiduría que actúa', pt: 'Abigail: sabedoria que age', de: 'Abigajil: Weisheit, die handelt', ru: 'Авигея: мудрость в действии', zh: '亚比该：付诸行动的智慧', ja: 'アビガイル――行動する知恵', ko: '아비가일: 행동하는 지혜', ar: 'أبيجايل: حكمة تتصرّف', fa: 'ابیجایل: حکمتی که عمل می‌کند', hi: 'अबीगैल: कार्य करने वाली बुद्धि', id: 'Abigail: hikmat yang bertindak', sw: 'Abigaili: hekima inayotenda', tl: 'Abigail: karunungang kumikilos', am: 'አቢግያ፦ የምትሠራ ጥበብ' },
    ref: '1 Samuel 25:14-35',
    related: ['Proverbs 15:1', 'James 3:13-18'],
    reflection: L(
      "Nabal's insult put his whole household in danger, and David was riding out for revenge. Abigail did not wait passively for disaster: she moved quickly, brought provisions and met an armed man with humility, courage and clear words about God's purposes. Her counsel kept David from bloodshed he would have regretted, and he blessed God for her good judgement. Wisdom in Scripture is not silence; it is the right word, at the right time, in the right spirit.",
      "L'insulte de Nabal mettait toute sa maison en danger, et David venait se venger. Abigaïl n'attend pas passivement la catastrophe : elle agit vite, apporte des provisions et affronte un homme armé avec humilité, courage et des paroles claires sur les desseins de Dieu. Son conseil épargne à David un sang versé qu'il aurait regretté, et il bénit Dieu pour son bon sens. Dans l'Écriture, la sagesse n'est pas le silence : c'est la parole juste, au bon moment, dans le bon esprit.",
    ),
    prompts: [
      L('Ask God for the wisdom from above that James describes — peaceable, gentle, sincere — for a tense situation you are facing.', 'Demande à Dieu la sagesse d\'en haut que décrit Jacques — pacifique, douce, sincère — pour une situation tendue que tu traverses.'),
      L('Pray for courage to speak when silence would let harm go ahead, and for restraint when your words would only inflame.', 'Prie pour avoir le courage de parler quand le silence laisserait le mal avancer, et la retenue quand tes paroles ne feraient qu\'enflammer.'),
      L('Thank Him for someone whose timely word once kept you from a decision you would have regretted.', "Remercie-Le pour quelqu'un dont la parole, au bon moment, t'a un jour gardée d'une décision que tu aurais regrettée."),
    ],
    practice: L(
      'Before a conversation you are dreading, write in one sentence what you believe God cares about most in it, and take that sentence with you.',
      "Avant une conversation que tu redoutes, écris en une phrase ce qui, selon toi, compte le plus pour Dieu dans cet échange, et garde cette phrase avec toi.",
    ),
    resourceTopics: ['wisdom', 'character', 'conflict'],
  },
  {
    movement: 'character',
    theme: { en: 'Leah: beyond comparison', fr: 'Léa : au-delà de la comparaison', es: 'Lea: más allá de la comparación', pt: 'Lia: além da comparação', de: 'Lea: frei vom Vergleichen', ru: 'Лия: свобода от сравнения', zh: '利亚：不再与人比较', ja: 'レア――比べることからの自由', ko: '레아: 비교를 넘어서', ar: 'ليئة: ما وراء المقارنة', fa: 'لیه: فراتر از مقایسه', hi: 'लिआ: तुलना से परे', id: 'Lea: melampaui perbandingan', sw: 'Lea: zaidi ya kujilinganisha', tl: 'Lea: lampas sa paghahambing', am: 'ልያ፦ ከንጽጽር ባሻገር' },
    ref: 'Genesis 29:16-35',
    related: ['Psalm 139:13-16', '1 Samuel 16:7'],
    reflection: L(
      "Genesis sets Leah beside her beautiful sister and says plainly that Jacob loved Rachel. Leah named her first sons after her longing to be loved by her husband, until, with her fourth, she chose a name of praise to the LORD instead. Her appearance did not change, and neither did Jacob; her gaze did. The LORD had seen her all along (v31), and through Judah her line led to David and to Christ.",
      "La Genèse place Léa à côté de sa sœur si belle et dit sans détour que Jacob aimait Rachel. Léa donne à ses premiers fils des noms qui disent son désir d'être aimée de son mari, jusqu'à ce que, pour le quatrième, elle choisisse plutôt un nom de louange à l'Éternel. Son apparence n'a pas changé, Jacob non plus ; c'est son regard qui a changé. L'Éternel la voyait depuis le début (v. 31), et par Juda sa lignée a conduit à David et au Christ.",
    ),
    prompts: [
      L('Name before God the comparison that most often steals your peace — a sister, a friend, a stranger on a screen — and ask Him to turn your gaze toward Him.', "Nomme devant Dieu la comparaison qui te vole le plus souvent la paix — une sœur, une amie, une inconnue sur un écran — et demande-Lui de tourner ton regard vers Lui."),
      L('Thank Him, as Psalm 139 does, for the body He knit together, including the parts you find hardest to accept.', "Remercie-Le, comme le Psaume 139, pour le corps qu'Il a tissé, y compris ce que tu as le plus de mal à accepter."),
      L('Pray for the girls and young women you know who are learning to measure themselves by their looks, that they would know they are seen and loved by God.', "Prie pour les filles et les jeunes femmes de ton entourage qui apprennent à se mesurer à leur apparence, afin qu'elles se sachent vues et aimées de Dieu."),
    ],
    selfPrompt: L(
      'Whose approval is still steering your choices? Tell God, and choose one act of praise instead.',
      "Quelle approbation continue de guider tes choix ? Dis-le à Dieu, et choisis à la place un acte de louange.",
    ),
    practice: L(
      "For one day, each time you catch yourself comparing your looks or your life with someone else's, turn it into a one-line prayer of thanks — for her and for you.",
      "Pendant une journée, chaque fois que tu te surprends à comparer ton apparence ou ta vie à celle d'une autre, transforme-la en une courte prière de reconnaissance — pour elle et pour toi.",
    ),
    safetyNote: L(
      'If thoughts about your body or appearance are leading you to restrict food, binge, purge or hurt yourself, you do not have to carry that alone. Please speak to a doctor or someone you trust this week, and seek urgent help if you are thinking of harming yourself.',
      "Si tes pensées sur ton corps ou ton apparence te poussent à te restreindre, à manger de façon compulsive, à te faire vomir ou à te faire du mal, tu n'as pas à porter cela seule. Parles-en cette semaine à un médecin ou à une personne de confiance, et cherche une aide urgente si tu penses à te faire du mal.",
    ),
    resourceTopics: ['contentment', 'identity'],
  },
  {
    movement: 'character',
    theme: { en: 'Forgiven much, loving much', fr: 'Beaucoup pardonnée, elle a beaucoup aimé', es: 'Mucho perdón, mucho amor', pt: 'Muito perdão, muito amor', de: 'Viel vergeben, viel geliebt', ru: 'Много прощено, много любви', zh: '蒙赦免多，爱也多', ja: '多く赦され、多く愛する', ko: '많이 용서받고 많이 사랑하다', ar: 'غُفر لها كثيرًا فأحبّت كثيرًا', fa: 'بسیار بخشیده شد، بسیار محبت کرد', hi: 'बहुत क्षमा, बहुत प्रेम', id: 'Banyak diampuni, banyak mengasihi', sw: 'Amesamehewa mengi, apenda sana', tl: 'Pinatawad nang malaki, nagmahal nang malaki', am: 'ብዙ ተሰረየላት፥ ብዙ ወደደች' },
    ref: 'Luke 7:36-50',
    related: ['Psalm 32:1-5'],
    reflection: L(
      'Simon the Pharisee saw a woman with a reputation, and a teacher who should have known better. Jesus turned toward her and asked Simon whether he really saw her: she had given the welcome Simon withheld, with her tears, her hair and her perfume. Her great love was the fruit of great forgiveness, not its price. Holiness in Scripture grows from being forgiven, not from managing what others think of you.',
      "Simon le pharisien voyait une femme à la réputation douteuse, et un maître qui aurait dû s'en rendre compte. Jésus se tourne vers elle et demande à Simon s'il la voit vraiment : elle a offert l'accueil que Simon avait refusé, avec ses larmes, ses cheveux et son parfum. Son grand amour était le fruit d'un grand pardon, non son prix. Dans l'Écriture, la sainteté naît du pardon reçu, non de la gestion de ce que les autres pensent de toi.",
    ),
    prompts: [
      L('Bring Jesus what you are most ashamed of, and thank Him that those who come to Him in faith are forgiven.', 'Apporte à Jésus ce dont tu as le plus honte, et remercie-Le : ceux qui viennent à Lui avec foi sont pardonnés.'),
      L('Ask Him to free you from living for your reputation, so that your love for Him can be as unguarded as hers.', 'Demande-Lui de te libérer du souci de ta réputation, afin que ton amour pour Lui soit aussi libre que le sien.'),
      L('Pray for a woman whose past is still held against her — in a family, a town or a church — that she would find welcome among Christ\'s people.', "Prie pour une femme à qui l'on reproche encore son passé — dans une famille, une ville ou une Église — afin qu'elle trouve un accueil parmi le peuple du Christ."),
    ],
    practice: L(
      'Tonight, pray Psalm 32:1-5 slowly, using verse 5 as your pattern to confess one thing you have kept silent about.',
      'Ce soir, prie lentement Psaume 32.1-5, en prenant le verset 5 comme modèle pour confesser une chose que tu as gardée sous silence.',
    ),
    resourceTopics: ['forgiveness', 'gospel', 'holiness'],
  },
  {
    movement: 'character',
    theme: { en: 'Holy in body and heart', fr: 'Sainte de corps et de cœur', es: 'Santa en cuerpo y corazón', pt: 'Santa no corpo e no coração', de: 'Heilig an Leib und Herz', ru: 'Святость тела и сердца', zh: '身心圣洁', ja: 'からだも心も聖く', ko: '몸과 마음의 거룩함', ar: 'قداسة الجسد والقلب', fa: 'قدوسیت در بدن و دل', hi: 'शरीर और हृदय में पवित्र', id: 'Kudus dalam tubuh dan hati', sw: 'Utakatifu wa mwili na moyo', tl: 'Banal sa katawan at puso', am: 'በሥጋና በልብ ቅድስና' },
    ref: '1 Corinthians 6:12-20',
    related: ['1 Thessalonians 4:3-8', 'Hebrews 13:4'],
    reflection: L(
      "Paul's warning in Corinth was aimed first at men who thought what they did with their bodies did not matter to God. His answer applies to every believer: your body belongs to the Lord, is a temple of the Holy Spirit and was bought at a price. Sexual holiness has never been a burden laid on women alone, and it is not the same as shame. God made the body and sexuality good — and just before this, Paul reminds the Corinthians that they had been washed (v11).",
      "À Corinthe, l'avertissement de Paul visait d'abord des hommes persuadés que ce qu'ils faisaient de leur corps n'importait pas à Dieu. Sa réponse vaut pour tout croyant : ton corps appartient au Seigneur, il est le temple du Saint-Esprit et il a été racheté à grand prix. La sainteté sexuelle n'a jamais été un fardeau réservé aux femmes, et elle n'est pas la même chose que la honte. Dieu a fait le corps et la sexualité bons — et juste avant, Paul rappelle aux Corinthiens qu'ils ont été lavés (v. 11).",
    ),
    prompts: [
      L('Thank God that your body is His workmanship and a dwelling for His Spirit — not something to despise, and not something to display.', "Remercie Dieu : ton corps est Son œuvre et la demeure de Son Esprit — ni une chose à mépriser, ni une chose à exhiber."),
      L('Ask the Holy Spirit to make you holy in thought, desire and action, whether you are single or married, and to strengthen you where you are weak.', 'Demande au Saint-Esprit de te sanctifier dans tes pensées, tes désirs et tes actes, que tu sois célibataire ou mariée, et de te fortifier là où tu es faible.'),
      L('Where you have sinned sexually, confess it plainly; where you carry shame for what others did to you, tell Him that too, and receive His cleansing and care.', "Là où tu as péché dans ta sexualité, confesse-le simplement ; là où tu portes la honte de ce que d'autres t'ont fait, dis-le-Lui aussi, et reçois Sa purification et Son soin."),
    ],
    practice: L(
      'Identify one input — an app, a series, a conversation — that pulls your heart away from holiness, and put one practical boundary around it this week.',
      'Repère une influence — une application, une série, une conversation — qui éloigne ton cœur de la sainteté, et pose une limite concrète autour d\'elle cette semaine.',
    ),
    safetyNote: L(
      'If someone has pressured, coerced or forced you sexually — now or in the past — what was done to you is not your sin. Please speak to someone you trust, a counsellor or a pastor, and contact the police or emergency services if you are in danger.',
      "Si quelqu'un a fait pression sur toi, t'a contrainte ou forcée sexuellement — aujourd'hui ou par le passé —, ce qu'on t'a fait n'est pas ton péché. Parles-en à une personne de confiance, à un conseiller ou à un pasteur, et contacte la police ou les services d'urgence si tu es en danger.",
    ),
    resourceTopics: ['sexuality', 'holiness', 'purity'],
  },

  // ── Movement 3 · Relationships, gifts and calling (days 11–15) ───────────
  {
    movement: 'gifts',
    theme: { en: 'Ruth and Naomi: loyal love', fr: 'Ruth et Noémi : un amour fidèle', es: 'Rut y Noemí: amor leal', pt: 'Rute e Noemi: amor leal', de: 'Rut und Noomi: treue Liebe', ru: 'Руфь и Ноеминь: верная любовь', zh: '路得与拿俄米：忠诚的爱', ja: 'ルツとナオミ――誠実な愛', ko: '룻과 나오미: 신실한 사랑', ar: 'راعوث ونعمي: محبة وفية', fa: 'روت و نعومی: محبتی وفادار', hi: 'रूत और नाओमी: विश्वासयोग्य प्रेम', id: 'Rut dan Naomi: kasih yang setia', sw: 'Ruthu na Naomi: upendo wa uaminifu', tl: 'Ruth at Noemi: tapat na pag-ibig', am: 'ሩት እና ኑኃሚን፦ ታማኝ ፍቅር' },
    ref: 'Ruth 1:6-22',
    related: ['Ruth 4:14-17', 'Proverbs 17:17'],
    reflection: L(
      "Naomi came home from Moab a widow who had also buried both her sons, and asked the women of Bethlehem to call her 'Bitter'. Scripture records her complaint without rebuke. Ruth, a foreign widow herself, bound herself to this older woman, to her people and to her God, with a loyal love that cost her everything familiar. By the end the same women tell Naomi that Ruth is better to her than seven sons — in a world that measured a woman's security by her sons. God's faithfulness often reaches us through a friend who stays.",
      "Noémi revient de Moab veuve, après avoir aussi enterré ses deux fils, et elle demande aux femmes de Bethléhem de l'appeler « Amère ». L'Écriture rapporte sa plainte sans la lui reprocher. Ruth, elle-même veuve et étrangère, s'attache à cette femme plus âgée, à son peuple et à son Dieu, d'un amour fidèle qui lui coûte tout ce qui lui était familier. À la fin, ces mêmes femmes disent à Noémi que Ruth vaut mieux pour elle que sept fils — dans un monde qui mesurait la sécurité d'une femme à ses fils. La fidélité de Dieu nous rejoint souvent par une amie qui reste.",
    ),
    prompts: [
      L('Thank God for a woman who stayed with you through a hard season, and ask Him to bless her today.', 'Remercie Dieu pour une femme qui est restée à tes côtés dans une période difficile, et demande-Lui de la bénir aujourd\'hui.'),
      L('If you feel emptied, as Naomi did, tell God so in your own words — Scripture shows He can hear that kind of honesty.', "Si tu te sens vidée, comme Noémi, dis-le à Dieu avec tes propres mots — l'Écriture montre qu'Il peut entendre une telle franchise."),
      L('Ask Him for friendships that cross the lines of age, culture and circumstance, and for grace to be the friend who stays.', "Demande-Lui des amitiés qui franchissent les barrières de l'âge, de la culture et de la situation, et la grâce d'être l'amie qui reste."),
    ],
    practice: L(
      'This week, contact a woman who is grieving or new to your area and suggest one specific time to meet — a walk, a meal, a visit.',
      'Cette semaine, contacte une femme en deuil ou nouvellement arrivée près de chez toi, et propose-lui un moment précis pour la voir — une promenade, un repas, une visite.',
    ),
    safetyNote: L(
      "Naomi's grief was deep, and Scripture lets her say so. If grief or emptiness has settled on you for a long time — if you cannot sleep, eat or cope, or you feel life is not worth living — please talk to a doctor, a pastor or someone you trust, and seek urgent help or call your local emergency number if you are thinking of ending your life.",
      "Le deuil de Noémi était profond, et l'Écriture la laisse le dire. Si le chagrin ou le vide s'est installé en toi depuis longtemps — si tu n'arrives plus à dormir, à manger ou à faire face, ou si tu as le sentiment que la vie ne vaut plus la peine — parles-en à un médecin, à un pasteur ou à une personne de confiance, et cherche une aide urgente ou appelle le numéro d'urgence local si tu penses à mettre fin à tes jours.",
    ),
    resourceTopics: ['friendship', 'grief', 'community'],
  },
  {
    movement: 'gifts',
    theme: { en: 'Unfading beauty, free from fear', fr: 'Beauté intérieure, cœur sans crainte', es: 'Belleza interior, sin temor', pt: 'Beleza interior, sem medo', de: 'Unvergängliche Schönheit, ohne Furcht', ru: 'Нетленная красота, без страха', zh: '不朽的美，不再惧怕', ja: '朽ちない美しさ、恐れのない心', ko: '썩지 않는 아름다움, 두려움 없이', ar: 'جمال لا يفنى، بلا خوف', fa: 'زیبایی فناناپذیر، بی‌ترس', hi: 'अविनाशी सुंदरता, बिना भय के', id: 'Keindahan yang tak pudar, tanpa takut', sw: 'Uzuri usioharibika, bila hofu', tl: 'Kagandahang di kumukupas, walang takot', am: 'የማይጠፋ ውበት፥ ያለ ፍርሃት' },
    ref: '1 Peter 3:1-6',
    related: ['1 Peter 2:11-12', '1 Peter 3:7'],
    reflection: L(
      "Peter wrote to Christians living as foreigners under pressure, urging them to do good even under rulers, masters and — here — husbands who did not share their faith. His concern is witness: a wife's quiet trust in God, more than argument, might win her husband, though nothing makes that certain. The beauty he prizes is not hair, gold or clothes but a heart at rest in God, and Sarah's daughters are those who do good without giving way to fear. Christians read his call for wives to submit differently: some see a lasting pattern for marriage under a husband's loving leadership; others, missional counsel for that culture within the mutual submission Paul describes (Ephesians 5:21). This plan does not settle the question; both readings agree it never requires sin, silence about harm or staying in danger.",
      "Pierre écrit à des chrétiens qui vivent en étrangers sous la pression, et il les appelle à faire le bien même sous l'autorité de gouvernants, de maîtres et — ici — de maris qui ne partagent pas leur foi. Son souci est le témoignage : la confiance paisible d'une femme en Dieu, plus que les arguments, pourrait gagner son mari, sans que rien le rende certain. La beauté qu'il estime n'est ni la coiffure, ni l'or, ni les vêtements, mais un cœur en repos en Dieu — et les filles de Sara sont celles qui font le bien sans se laisser gagner par la peur. Les chrétiens lisent différemment son appel à la soumission des épouses : certains y voient un modèle durable pour le couple, sous la conduite aimante du mari ; d'autres, un conseil missionnaire adapté à cette culture, dans la soumission mutuelle dont parle Paul (Éphésiens 5.21). Ce parcours ne tranche pas la question ; les deux lectures s'accordent pour dire qu'elle n'exige jamais le péché, ni le silence sur le mal subi, ni de rester en danger.",
    ),
    prompts: [
      L('Thank God that the beauty He treasures in you is not your hair, clothes or figure, but a heart that hopes in Him — a beauty that does not fade.', "Remercie Dieu : la beauté qu'Il chérit en toi n'est ni ta coiffure, ni tes vêtements, ni ta silhouette, mais un cœur qui espère en Lui — une beauté qui ne se fane pas."),
      L('Married, single or widowed, name before Him the fear that most often drives you, and ask for the freedom from fear Peter holds out to Sarah\'s daughters.', 'Mariée, célibataire ou veuve, nomme devant Lui la peur qui te pousse le plus souvent, et demande la liberté face à la peur que Pierre offre aux filles de Sara.'),
      L('Pray for women whose husbands do not share their faith, that they would be strengthened, honoured and safe, and that their husbands would come to know Christ.', "Prie pour les femmes dont le mari ne partage pas la foi, afin qu'elles soient fortifiées, honorées et en sécurité, et que leur mari vienne à connaître le Christ."),
    ],
    practice: L(
      'As you get dressed tomorrow morning, pray one sentence asking God to clothe your heart with trust in Him before anything else you put on.',
      'Demain matin, en t\'habillant, prie une phrase pour demander à Dieu de revêtir ton cœur de confiance en Lui, avant tout ce que tu porteras.',
    ),
    safetyNote: L(
      'Submission, as Peter describes it, never means enduring abuse, threats, coercion or control, and never means keeping silent about harm — Peter himself tells women not to give way to fear. If you are afraid of your husband or partner, speak to someone you trust, a pastor or a counsellor, and contact the police or emergency services if you are in danger. No teaching requires you to stay where you are being harmed.',
      "La soumission dont parle Pierre ne signifie jamais subir des violences, des menaces, de la contrainte ou du contrôle, ni se taire sur le mal subi — Pierre lui-même dit aux femmes de ne pas se laisser gagner par la peur. Si tu as peur de ton mari ou de ton conjoint, parles-en à une personne de confiance, à un pasteur ou à un conseiller, et contacte la police ou les services d'urgence si tu es en danger. Aucun enseignement ne t'oblige à rester là où l'on te fait du mal.",
    ),
    resourceTopics: ['marriage-roles', 'marriage', 'abuse-safety'],
  },
  {
    movement: 'gifts',
    theme: { en: 'Martha and Mary: disciples first', fr: 'Marthe et Marie : disciples avant tout', es: 'Marta y María: discípulas ante todo', pt: 'Marta e Maria: discípulas antes de tudo', de: 'Marta und Maria: zuerst Jüngerinnen', ru: 'Марфа и Мария: прежде всего ученицы', zh: '马大和马利亚：首先是门徒', ja: 'マルタとマリア――まず弟子として', ko: '마르다와 마리아: 먼저 제자로', ar: 'مرثا ومريم: تلميذتان أولًا', fa: 'مارتا و مریم: نخست شاگرد', hi: 'मार्था और मरियम: पहले शिष्या', id: 'Marta dan Maria: murid terlebih dahulu', sw: 'Martha na Mariamu: wanafunzi kwanza', tl: 'Marta at Maria: alagad muna', am: 'ማርታ እና ማርያም፦ በመጀመሪያ ደቀ መዛሙርት' },
    ref: 'Luke 10:38-42',
    related: ['John 11:20-27', 'John 12:1-3'],
    reflection: L(
      "Mary took the place of a disciple, sitting at the Lord's feet to learn — a place women were rarely given — and when Martha objected, Jesus defended it as the one thing needed, which would not be taken from her. Martha's fault was not serving but being anxious and pulled apart by many things; Jesus answers her gently, saying her name twice. And it is Martha who later makes one of the Gospels' clearest confessions of who He is (John 11:27). Before any gift or calling, a woman of God is first a disciple who listens to Jesus.",
      "Marie prend la place d'une disciple, assise aux pieds du Seigneur pour apprendre — une place rarement accordée aux femmes — et quand Marthe proteste, Jésus la défend : c'est la seule chose nécessaire, et elle ne lui sera pas ôtée. La faute de Marthe n'est pas de servir, mais d'être inquiète et tiraillée par beaucoup de choses ; Jésus lui répond avec douceur, en l'appelant deux fois par son nom. Et c'est Marthe qui fera plus tard l'une des confessions les plus claires des Évangiles sur qui Il est (Jean 11.27). Avant tout don et tout appel, une femme de Dieu est d'abord une disciple qui écoute Jésus.",
    ),
    prompts: [
      L('Tell Jesus, one by one, the many things pulling you apart this week, and ask Him to show you what is truly needed today.', 'Dis à Jésus, une à une, les nombreuses choses qui te tiraillent cette semaine, et demande-Lui de te montrer ce qui est vraiment nécessaire aujourd\'hui.'),
      L('Thank Him that He welcomes women as disciples at His feet, and ask for a deeper hunger to learn from His Word.', "Remercie-Le d'accueillir les femmes comme disciples à Ses pieds, et demande une faim plus profonde d'apprendre de Sa Parole."),
      L('Pray for the women carrying heavy service in your church or family, that they would find rest with Jesus and be honoured rather than taken for granted.', 'Prie pour les femmes qui portent un lourd service dans ton Église ou ta famille, afin qu\'elles trouvent du repos auprès de Jésus et soient honorées plutôt que tenues pour acquises.'),
    ],
    practice: L(
      'Before you start your tasks tomorrow, sit for ten minutes with one Gospel passage and a notebook, and write down one thing Jesus says or does.',
      "Demain, avant de commencer tes tâches, assieds-toi dix minutes avec un passage d'un Évangile et un carnet, et note une chose que Jésus dit ou fait.",
    ),
    resourceTopics: ['discipleship', 'spiritual-rhythms'],
  },
  {
    movement: 'gifts',
    theme: { en: 'The Spirit on sons and daughters', fr: "L'Esprit sur les fils et les filles", es: 'El Espíritu sobre hijos e hijas', pt: 'O Espírito sobre filhos e filhas', de: 'Der Geist über Söhnen und Töchtern', ru: 'Дух на сыновьях и дочерях', zh: '圣灵浇灌儿子和女儿', ja: '息子にも娘にも注がれる御霊', ko: '아들과 딸에게 부어지는 성령', ar: 'الروح على البنين والبنات', fa: 'روح بر پسران و دختران', hi: 'बेटों और बेटियों पर पवित्र आत्मा', id: 'Roh atas putra dan putri', sw: 'Roho juu ya wana na binti', tl: 'Ang Espiritu sa mga anak na lalaki at babae', am: 'መንፈስ በወንዶችና በሴቶች ልጆች ላይ' },
    ref: 'Acts 2:14-21',
    related: ['Acts 1:12-14', 'Acts 21:8-9', '1 Corinthians 12:4-11'],
    reflection: L(
      "Luke notes that women were among those praying in the upper room (Acts 1:14), and when the Spirit came, Peter explained it with Joel: God pours out His Spirit on sons and daughters, on His servants, men and women alike. Later Philip has four daughters who prophesy, and Paul teaches that every believer is given a gift of the Spirit for the common good, as He chooses. Christians differ on how women's gifts relate to some church offices; they agree that the Spirit gifts women, and that the church is poorer when those gifts are buried.",
      "Luc note que des femmes faisaient partie de ceux qui priaient dans la chambre haute (Actes 1.14), et quand l'Esprit est venu, Pierre l'a expliqué avec Joël : Dieu répand Son Esprit sur les fils et les filles, sur Ses serviteurs comme sur Ses servantes. Plus tard, Philippe a quatre filles qui prophétisent, et Paul enseigne que chaque croyant reçoit un don de l'Esprit pour l'utilité commune, comme Il le veut. Les chrétiens divergent sur la manière dont les dons des femmes s'articulent avec certains ministères de l'Église ; ils s'accordent pour dire que l'Esprit accorde des dons aux femmes, et que l'Église s'appauvrit quand ces dons restent enfouis.",
    ),
    prompts: [
      L('Thank God that the Spirit poured out at Pentecost is given to His daughters as fully as to His sons.', "Remercie Dieu : l'Esprit répandu à la Pentecôte est donné à Ses filles aussi pleinement qu'à Ses fils."),
      L('Ask the Holy Spirit to fill you afresh and to show you how He has gifted you, ready to receive whatever He gives, as He chooses.', "Demande au Saint-Esprit de te remplir à nouveau et de te montrer les dons qu'Il t'a faits, prête à recevoir ce qu'Il donne, comme Il le veut."),
      L('Pray for the women in your church whose gifts are unrecognised or unused, that they would be encouraged, trained and given room to serve.', "Prie pour les femmes de ton Église dont les dons ne sont ni reconnus ni employés, afin qu'elles soient encouragées, formées, et qu'on leur laisse de la place pour servir."),
    ],
    practice: L(
      'Ask a mature believer who knows you well what gift of God they see in you, and write down their answer to pray over this week.',
      'Demande à un croyant mûr qui te connaît bien quel don de Dieu il voit en toi, et note sa réponse pour la porter dans la prière cette semaine.',
    ),
    resourceTopics: ['spiritual-gifts', 'holy-spirit', 'church'],
  },
  {
    movement: 'gifts',
    theme: { en: 'Co-workers in the gospel', fr: "Collaboratrices de l'Évangile", es: 'Colaboradoras en el evangelio', pt: 'Cooperadoras no evangelho', de: 'Mitarbeiterinnen am Evangelium', ru: 'Сотрудницы в благовестии', zh: '为福音同工的妇女', ja: '福音のために共に働く女性たち', ko: '복음의 여성 동역자들', ar: 'عاملات معًا في الإنجيل', fa: 'زنانِ همکار در انجیل', hi: 'सुसमाचार में सहकर्मी स्त्रियाँ', id: 'Rekan sekerja dalam Injil', sw: 'Watendakazi pamoja katika injili', tl: 'Mga kamanggagawa sa ebanghelyo', am: 'በወንጌል አብረው የሠሩ ሴቶች' },
    ref: 'Romans 16:1-7',
    related: ['Acts 16:13-15', 'Acts 18:1-3', 'Acts 18:24-26'],
    reflection: L(
      "Paul's closing greetings read like a roll of honour, and many of the names are women's. Phoebe, a servant of the church at Cenchreae — the word can also be translated deacon — and a benefactor of many, was probably trusted to carry the letter. Priscilla, a tentmaker, hosted a church in her home, risked her life for Paul and, with Aquila, explained the way of God more accurately to Apollos; Lydia, a trader in purple cloth, opened her house in Philippi. Whatever conclusions Christians draw for church offices today, calling here is lived in workshops, homes and budgets as much as in public ministry.",
      "Les salutations finales de Paul ressemblent à un tableau d'honneur, et beaucoup de noms sont ceux de femmes. Phœbé, servante de l'Église de Cenchrées — le mot peut aussi se traduire par « diaconesse » — et bienfaitrice de beaucoup, a sans doute été chargée de porter la lettre. Priscille, fabricante de tentes, accueillait une Église dans sa maison, a risqué sa vie pour Paul et, avec Aquilas, a exposé plus exactement la voie de Dieu à Apollos ; Lydie, marchande de pourpre, a ouvert sa maison à Philippes. Quelles que soient les conclusions que les chrétiens en tirent pour les ministères aujourd'hui, l'appel se vit ici à l'atelier, à la maison et dans le budget autant que dans le ministère public.",
    ),
    prompts: [
      L('Thank God for the women whose often unseen work — hosting, giving, organising, teaching — carried the gospel to you.', "Remercie Dieu pour les femmes dont le travail souvent discret — accueillir, donner, organiser, enseigner — a porté l'Évangile jusqu'à toi."),
      L('Offer Him your daily work, paid or unpaid, and ask how it can serve His kingdom where you are.', 'Offre-Lui ton travail quotidien, rémunéré ou non, et demande-Lui comment il peut servir Son règne là où tu es.'),
      L('Pray for women in ministry and in the workplace who feel alone, that God would give them faithful co-workers, as Paul found in Priscilla and Aquila.', "Prie pour les femmes engagées dans le ministère ou dans le monde du travail qui se sentent seules, afin que Dieu leur donne des collaborateurs fidèles, comme Paul en a trouvé en Priscille et Aquilas."),
    ],
    practice: L(
      'Write a short note of thanks, as Paul did, to a woman who has worked hard for the Lord in your church, naming exactly what she did.',
      'Écris, comme Paul, un petit mot de remerciement à une femme qui a beaucoup travaillé pour le Seigneur dans ton Église, en nommant précisément ce qu\'elle a fait.',
    ),
    resourceTopics: ['calling', 'work', 'church', 'hospitality'],
  },

  // ── Movement 4 · Courage, service and legacy (days 16–21) ────────────────
  {
    movement: 'legacy',
    theme: { en: 'Shiphrah and Puah: fearing God', fr: 'Schiphra et Pua : la crainte de Dieu', es: 'Sifra y Fúa: el temor de Dios', pt: 'Sifrá e Puá: o temor a Deus', de: 'Schifra und Pua: Gottesfurcht', ru: 'Шифра и Фуа: страх Божий', zh: '施弗拉和普阿：敬畏神', ja: 'シフラとプア――神を恐れる', ko: '십브라와 부아: 하나님을 경외함', ar: 'شفرة وفوعة: مخافة الله', fa: 'شِفره و فوعه: ترس خدا', hi: 'शिप्रा और पूआ: परमेश्वर का भय', id: 'Sifra dan Pua: takut akan Allah', sw: 'Shifra na Pua: kumcha Mungu', tl: 'Sifra at Pua: may takot sa Diyos', am: 'ሲፎራ እና ፎሐ፦ እግዚአብሔርን መፍራት' },
    ref: 'Exodus 1:15-21',
    related: ['Exodus 2:1-10', 'Acts 5:27-29'],
    reflection: L(
      "Pharaoh ordered two Hebrew midwives to kill every boy they helped bring into the world. Shiphrah and Puah feared God more than the king, and quietly refused: the boys lived. Scripture remembers their names, while the most powerful man in the land goes unnamed. Their courage was lived out in an ordinary job, at the bedside of women in labour, and it helped preserve the people from whom Moses would come. Fearing God is what freed them from fearing Pharaoh.",
      "Pharaon ordonne à deux sages-femmes hébreues de faire mourir tous les garçons qu'elles aideraient à naître. Schiphra et Pua craignent Dieu plus que le roi, et refusent discrètement : les garçons vivent. L'Écriture retient leurs noms, tandis que l'homme le plus puissant du pays reste anonyme. Leur courage s'exerce dans un métier ordinaire, au chevet de femmes en travail, et il contribue à préserver le peuple d'où viendra Moïse. C'est la crainte de Dieu qui les a libérées de la crainte de Pharaon.",
    ),
    prompts: [
      L('Ask God for a fear of Him greater than your fear of anyone with power over you — a boss, a relative, public opinion.', "Demande à Dieu une crainte de Lui plus grande que ta crainte de quiconque a du pouvoir sur toi — un patron, un proche, l'opinion publique."),
      L('Bring Him any place in your work where you are pressed to cut corners or to harm others, and ask for wisdom and courage to do right.', "Présente-Lui tout endroit de ton travail où l'on te pousse à tricher ou à nuire à d'autres, et demande la sagesse et le courage de faire le bien."),
      L('Pray for midwives, nurses, doctors and all who protect vulnerable lives, especially where the law or those in power make that costly.', 'Prie pour les sages-femmes, les infirmières, les médecins et tous ceux qui protègent des vies vulnérables, surtout là où la loi ou les puissants rendent cela coûteux.'),
    ],
    practice: L(
      'Find out about one organisation near you that protects vulnerable women or children, and give to it, volunteer or pray for it by name this week.',
      'Renseigne-toi sur une association proche de chez toi qui protège des femmes ou des enfants vulnérables, et donne-lui, engage-toi ou prie pour elle en la nommant cette semaine.',
    ),
    resourceTopics: ['justice', 'work', 'character'],
  },
  {
    movement: 'legacy',
    theme: { en: 'Esther: courage born in fasting', fr: 'Esther : un courage né du jeûne', es: 'Ester: valor nacido del ayuno', pt: 'Ester: coragem nascida do jejum', de: 'Ester: Mut, der im Fasten wächst', ru: 'Есфирь: мужество, рождённое в посте', zh: '以斯帖：禁食中生出的勇气', ja: 'エステル――断食から生まれた勇気', ko: '에스더: 금식에서 나온 용기', ar: 'أستير: شجاعة وُلدت في الصوم', fa: 'استر: شجاعتی زاده از روزه', hi: 'एस्तेर: उपवास से जन्मा साहस', id: 'Ester: keberanian yang lahir dari puasa', sw: 'Esta: ujasiri uliozaliwa katika kufunga', tl: 'Ester: tapang na isinilang sa pag-aayuno', am: 'አስቴር፦ ከጾም የተወለደ ድፍረት' },
    ref: 'Esther 4:10-17',
    related: ['Esther 5:1-3', 'Esther 8:3-6'],
    reflection: L(
      "Esther had not chosen the palace, and she knew that going to the king uninvited could cost her life. Mordecai did not promise her success; he asked a question — who knew whether she had come to her position for a moment like this? Esther answered by calling her people to fast with her for three days, and then she went, knowing she might die. God is never named in the book, yet His quiet care runs through it. Courage in Scripture is rarely the absence of fear; it is fear carried to God together with others, followed by a step of obedience.",
      "Esther n'avait pas choisi le palais, et elle savait que se présenter au roi sans y être appelée pouvait lui coûter la vie. Mardochée ne lui promet pas le succès ; il pose une question — qui sait si elle n'est pas parvenue à sa position pour un moment comme celui-là ? Esther répond en appelant son peuple à jeûner avec elle pendant trois jours, puis elle y va, en sachant qu'elle peut mourir. Dieu n'est jamais nommé dans le livre, et pourtant Sa providence discrète le traverse. Dans l'Écriture, le courage est rarement l'absence de peur : c'est la peur portée devant Dieu avec d'autres, puis un pas d'obéissance.",
    ),
    prompts: [
      L('Tell God honestly what frightens you about a step you know you should take, as Esther did before she went.', "Dis honnêtement à Dieu ce qui t'effraie dans un pas que tu sais devoir faire, comme Esther avant d'y aller."),
      L('Ask Him whether the place you did not choose — your workplace, your family, your nation — could be where you are to speak up for others.', "Demande-Lui si l'endroit que tu n'as pas choisi — ton travail, ta famille, ton pays — pourrait être celui où tu dois prendre la parole pour d'autres."),
      L('Intercede for a people at risk — persecuted Christians, refugees, a community facing violence — asking God to raise up protectors and advocates.', 'Intercède pour un peuple menacé — des chrétiens persécutés, des réfugiés, une communauté exposée à la violence — en demandant à Dieu de susciter des protecteurs et des défenseurs.'),
    ],
    practice: L(
      'If your health allows, skip one meal this week and use the time to pray, with a friend if possible, for the people you named today. If you are pregnant, unwell or have struggled with eating, fast from something other than food.',
      "Si ta santé le permet, saute un repas cette semaine et consacre ce temps à prier, avec une amie si possible, pour ceux que tu as nommés aujourd'hui. Si tu es enceinte, malade ou que tu as connu des difficultés avec l'alimentation, jeûne d'autre chose que de nourriture.",
    ),
    resourceTopics: ['intercession', 'calling', 'justice'],
  },
  {
    movement: 'legacy',
    theme: { en: 'Deborah: a mother in Israel', fr: 'Débora : une mère en Israël', es: 'Débora: una madre en Israel', pt: 'Débora: uma mãe em Israel', de: 'Debora: eine Mutter in Israel', ru: 'Девора: мать во Израиле', zh: '底波拉：以色列的母', ja: 'デボラ――イスラエルの母', ko: '드보라: 이스라엘의 어머니', ar: 'دبورة: أمّ في إسرائيل', fa: 'دبوره: مادری در اسرائیل', hi: 'दबोरा: इस्राएल में एक माता', id: 'Debora: seorang ibu di Israel', sw: 'Debora: mama katika Israeli', tl: 'Debora: isang ina sa Israel', am: 'ዲቦራ፦ በእስራኤል እናት' },
    ref: 'Judges 4:4-10',
    related: ['Judges 5:6-9', 'Romans 16:13', '2 Timothy 1:5'],
    reflection: L(
      "Deborah was a prophet who judged Israel under a palm tree. She summoned Barak with the LORD's command, went with him when he asked her to, and gave God the credit for the victory. In her song she calls herself a mother in Israel — and the text says nothing of children of her own: her motherhood was her care for a frightened people who no longer dared to travel the roads. Christians draw different conclusions from her leadership for church life today; what the text plainly honours is a woman who nurtured faith and courage in others. Paul, too, had a spiritual mother (Romans 16:13).",
      "Débora était prophétesse et jugeait Israël sous un palmier. Elle convoque Barak de la part de l'Éternel, l'accompagne quand il le lui demande, et attribue la victoire à Dieu. Dans son cantique, elle se dit « mère en Israël » — et le texte ne parle d'aucun enfant qu'elle aurait eu : sa maternité, c'était le soin d'un peuple effrayé qui n'osait plus emprunter les routes. Les chrétiens tirent de son autorité des conclusions différentes pour la vie de l'Église aujourd'hui ; ce que le texte honore clairement, c'est une femme qui a fait grandir la foi et le courage chez les autres. Paul aussi avait une mère spirituelle (Romains 16.13).",
    ),
    prompts: [
      L('Thank God for the spiritual mothers who have nurtured your faith, whether or not they ever had children of their own.', "Remercie Dieu pour les mères spirituelles qui ont nourri ta foi, qu'elles aient eu des enfants ou non."),
      L('Ask Him to show you whose faith and courage you are called to nurture — with or without children, at any age.', 'Demande-Lui de te montrer chez qui tu es appelée à nourrir la foi et le courage — avec ou sans enfants, à tout âge.'),
      L('Pray for the younger women and new believers in your church, that each would have an older sister in the faith walking beside her.', "Prie pour les jeunes femmes et les nouvelles croyantes de ton Église, afin que chacune ait une sœur aînée dans la foi qui marche à ses côtés."),
    ],
    practice: L(
      'This month, invite one younger woman or new believer for a coffee or a walk, and ask her how you can pray for her.',
      'Ce mois-ci, invite une jeune femme ou une nouvelle croyante à prendre un café ou à marcher, et demande-lui comment tu peux prier pour elle.',
    ),
    resourceTopics: ['discipleship', 'leadership', 'womanhood'],
  },
  {
    movement: 'legacy',
    theme: { en: 'Mary: a song for every generation', fr: 'Marie : un cantique pour toutes les générations', es: 'María: un cántico para todas las generaciones', pt: 'Maria: um cântico para todas as gerações', de: 'Maria: ein Lied für alle Generationen', ru: 'Мария: песнь для всех поколений', zh: '马利亚：世世代代的颂歌', ja: 'マリア――すべての世代への賛歌', ko: '마리아: 모든 세대를 위한 노래', ar: 'مريم: ترنيمة لكل الأجيال', fa: 'مریم: سرودی برای همه نسل‌ها', hi: 'मरियम: हर पीढ़ी के लिए एक गीत', id: 'Maria: nyanyian bagi segala generasi', sw: 'Mariamu: wimbo kwa vizazi vyote', tl: 'Maria: awit para sa bawat salinlahi', am: 'ማርያም፦ ለትውልድ ሁሉ መዝሙር' },
    ref: 'Luke 1:46-55',
    related: ['Luke 1:34-38', '1 Samuel 2:1-10'],
    reflection: L(
      "The angel's message waited for Mary's answer. She asked an honest question, then gave herself to God as His servant, knowing what it might cost her good name. Her song is woven from Hannah's prayer and the Psalms — Scripture she had clearly made her own — and it praises God who humbles the proud, lifts the lowly, feeds the hungry and keeps His promises. Every generation calls her blessed not for her status but for what the Mighty One did through her. The legacy she sings of is His mercy, handed on from generation to generation.",
      "Le message de l'ange attend la réponse de Marie. Elle pose une vraie question, puis se donne à Dieu comme Sa servante, en sachant ce que cela pourrait coûter à sa réputation. Son cantique est tissé de la prière d'Anne et des Psaumes — une Écriture qu'elle avait manifestement faite sienne — et il loue Dieu qui abaisse les orgueilleux, relève les humbles, rassasie les affamés et tient Ses promesses. Toutes les générations la disent bienheureuse, non pour son rang, mais pour ce que le Tout-Puissant a fait en elle. L'héritage qu'elle chante, c'est Sa miséricorde, transmise de génération en génération.",
    ),
    prompts: [
      L('Bring God your honest questions about what He is asking of you, as Mary did, and then tell Him what you are ready to trust Him with.', "Apporte à Dieu tes vraies questions sur ce qu'Il te demande, comme Marie, puis dis-Lui ce que tu es prête à Lui confier."),
      L('Praise Him in your own words for one way He has lifted the lowly or fed the hungry, in your life or around you.', 'Loue-Le avec tes propres mots pour une manière dont Il a relevé les humbles ou rassasié les affamés, dans ta vie ou autour de toi.'),
      L('Pray that the next generation of women in your family, church or town would know His mercy, and that your life would help hand it on.', 'Prie pour que la prochaine génération de femmes de ta famille, de ton Église ou de ta ville connaisse Sa miséricorde, et que ta vie aide à la lui transmettre.'),
    ],
    practice: L(
      'Read Luke 1:46-55 aloud, then write your own short song of praise: three great things God has done, and the name of one person you will tell.',
      'Lis Luc 1.46-55 à voix haute, puis écris ton propre petit cantique : trois grandes choses que Dieu a faites, et le nom d\'une personne à qui tu les raconteras.',
    ),
    resourceTopics: ['worship', 'calling', 'justice'],
  },
  {
    movement: 'legacy',
    theme: { en: 'Anna: faithful into old age', fr: 'Anne : fidèle jusque dans la vieillesse', es: 'Ana: fiel hasta la vejez', pt: 'Ana: fiel até a velhice', de: 'Hanna: treu bis ins Alter', ru: 'Анна: верность до старости', zh: '亚拿：年老仍忠心', ja: 'アンナ――老年に至るまで忠実に', ko: '안나: 늙기까지 신실하게', ar: 'حنّة: أمينة حتى الشيخوخة', fa: 'حنا: وفادار تا دوران پیری', hi: 'हन्नाह: बुढ़ापे तक विश्वासयोग्य', id: 'Hana: setia sampai masa tua', sw: 'Ana: mwaminifu hadi uzeeni', tl: 'Ana: tapat hanggang sa katandaan', am: 'ሐና፦ እስከ እርጅና ታማኝ' },
    ref: 'Luke 2:36-38',
    related: ['1 Timothy 5:5', 'Psalm 92:12-15'],
    reflection: L(
      "Anna had been married only seven years when she was widowed, and she spent the long decades after in the temple, worshipping God night and day with fasting and prayer. Her years without a husband were not a waiting room; they were her ministry. When Mary and Joseph brought in the infant Jesus, this woman of great age recognised Him, gave thanks, and spoke about Him to everyone longing for God's redemption. Age did not retire her — it ripened her, like the righteous of Psalm 92 who still bear fruit when they are old.",
      "Anne n'avait été mariée que sept ans quand elle est devenue veuve, et elle a passé les longues décennies suivantes au temple, servant Dieu nuit et jour par le jeûne et la prière. Ses années sans mari n'étaient pas une salle d'attente : c'était son ministère. Quand Marie et Joseph présentent l'enfant Jésus, cette femme très âgée Le reconnaît, rend grâces et parle de Lui à tous ceux qui attendent la délivrance de Dieu. L'âge ne l'a pas mise à la retraite, il l'a mûrie — comme les justes du Psaume 92, qui portent encore du fruit dans la vieillesse.",
    ),
    prompts: [
      L('Thank God for the older women of faith you know, and ask Him to renew their strength and to use their prayers.', "Remercie Dieu pour les femmes âgées de foi que tu connais, et demande-Lui de renouveler leurs forces et de se servir de leurs prières."),
      L('Whatever your age or season of life, ask Him to make this season fruitful now — not only the one you are waiting for.', 'Quel que soit ton âge ou ta saison de vie, demande-Lui de rendre cette saison féconde dès maintenant — et pas seulement celle que tu attends.'),
      L('Pray for the widows and women living alone in your church and neighbourhood, that they would be seen, cared for and given a place to serve.', "Prie pour les veuves et les femmes qui vivent seules dans ton Église et ton quartier, afin qu'elles soient vues, entourées, et qu'on leur donne une place pour servir."),
    ],
    practice: L(
      'Ask an older woman in your church how she kept praying through hard years, and listen well — or, if you are the older one, tell a younger believer one thing you have seen God do.',
      "Demande à une femme âgée de ton Église comment elle a continué à prier pendant les années difficiles, et écoute-la vraiment — ou, si c'est toi l'aînée, raconte à une jeune croyante une chose que tu as vu Dieu faire.",
    ),
    resourceTopics: ['prayer', 'singleness', 'spiritual-rhythms'],
  },
  {
    movement: 'legacy',
    theme: { en: 'Mary Magdalene: sent with good news', fr: 'Marie de Magdala : envoyée avec la bonne nouvelle', es: 'María Magdalena: enviada con buenas noticias', pt: 'Maria Madalena: enviada com a boa-nova', de: 'Maria aus Magdala: gesandt mit guter Nachricht', ru: 'Мария Магдалина: посланная с благой вестью', zh: '抹大拉的马利亚：奉差传好信息', ja: 'マグダラのマリア――良い知らせを携えて', ko: '막달라 마리아: 기쁜 소식을 들고 보냄 받다', ar: 'مريم المجدلية: مُرسَلة بالبشارة', fa: 'مریم مجدلیه: فرستاده با خبر خوش', hi: 'मरियम मगदलीनी: शुभ समाचार के साथ भेजी गई', id: 'Maria Magdalena: diutus membawa kabar baik', sw: 'Mariamu Magdalene: ametumwa na habari njema', tl: 'Maria Magdalena: isinugo na may mabuting balita', am: 'መግደላዊት ማርያም፦ በምሥራች የተላከች' },
    ref: 'John 20:11-18',
    related: ['Luke 8:1-3', 'Luke 24:1-11'],
    reflection: L(
      "Jesus had freed Mary Magdalene from seven demons, and she followed Him and helped support His ministry from her own means (Luke 8:2-3). She stayed near the cross when most had fled, and came to the tomb while it was still dark. Weeping, she did not recognise the risen Lord until He called her by name — and then He sent her to tell His brothers. In a world that gave little weight to a woman's testimony, Jesus made women the first witnesses of His resurrection, and Mary the first He sent. Like her, a woman of God is known by name by the risen Christ, and sent with good news to share.",
      "Jésus avait délivré Marie de Magdala de sept démons, et elle Le suivait et soutenait Son ministère de ses propres biens (Luc 8.2-3). Elle reste près de la croix quand la plupart ont fui, et vient au tombeau alors qu'il fait encore nuit. En larmes, elle ne reconnaît le Seigneur ressuscité que lorsqu'Il l'appelle par son nom — puis Il l'envoie l'annoncer à Ses frères. Dans un monde qui accordait peu de crédit au témoignage d'une femme, Jésus fait des femmes les premiers témoins de Sa résurrection, et de Marie la première envoyée. Comme elle, une femme de Dieu est connue du Christ ressuscité, appelée par son nom et envoyée avec une bonne nouvelle à partager.",
    ),
    prompts: [
      L('Thank Jesus that He is risen, that He knows you by name, and that nothing in your past disqualifies you from following Him.', 'Remercie Jésus : Il est ressuscité, Il te connaît par ton nom, et rien dans ton passé ne te disqualifie pour Le suivre.'),
      L('Looking back over these twenty-one days, tell Him what you have learned of Him, and ask the Holy Spirit to keep forming Christ in you.', 'En repensant à ces vingt et un jours, dis-Lui ce que tu as appris de Lui, et demande au Saint-Esprit de continuer à former le Christ en toi.'),
      L('Ask Him for courage to tell someone about Him this week, simply and in your own words, as Mary did.', 'Demande-Lui le courage de parler de Lui à quelqu\'un cette semaine, simplement et avec tes propres mots, comme Marie.'),
    ],
    practice: L(
      'Choose one person — a friend, a colleague, a younger woman — and tell them this week, in two or three sentences, what Jesus means to you.',
      'Choisis une personne — une amie, une collègue, une jeune femme — et dis-lui cette semaine, en deux ou trois phrases, ce que Jésus représente pour toi.',
    ),
    resourceTopics: ['evangelism', 'gospel', 'calling'],
  },
];
