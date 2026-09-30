// The 21 days of "Work, Calling & Faithfulness" (see ./workAndCalling.js for
// the plan meta, the movements and the guardrails this content is held to).
//
// Every day must work for EVERY reader: employees and employers, students,
// the unemployed, retirees, parents at home, caregivers, tradespeople,
// professionals and ministry workers. So the prose says "your work — paid or
// unpaid", "your studies", "the work in front of you", and never assumes a
// salary, a boss or a career.
//
// Day shape: theme (16 languages), ref, related (≤ 3), reflection, three
// prompts, an optional selfPrompt, one small practice, a safetyNote on the
// days that need one, and resourceTopics. Prose is authored in en + fr; the
// other languages fall back through pick(). No Bible text is stored here.
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Movement 1 · Work as stewardship (days 1–5) ────────────────────────────
  {
    movement: 'stewardship',
    theme: { en: "Made in God's image to work", fr: "Créé à l'image de Dieu pour travailler", es: 'Creados a imagen de Dios para trabajar', pt: 'Criados à imagem de Deus para trabalhar', de: 'Nach Gottes Bild zur Arbeit geschaffen', ru: 'Созданы по образу Божьему для труда', zh: '按神的形象被造去工作', ja: '神のかたちに造られ、働く者', ko: '하나님의 형상으로 일하도록 지음 받다', ar: 'مخلوقون على صورة الله لنعمل', fa: 'آفریده به صورت خدا برای کار', hi: 'परमेश्वर के स्वरूप में काम के लिए रचे गए', id: 'Diciptakan menurut gambar Allah untuk bekerja', sw: 'Tumeumbwa kwa mfano wa Mungu ili tufanye kazi', tl: 'Nilikha sa larawan ng Diyos upang gumawa', am: 'በእግዚአብሔር መልክ ለሥራ ተፈጠርን' },
    ref: 'Genesis 1:26-31',
    related: ['Genesis 2:15', 'Psalm 8:3-8', 'Mark 6:1-3'],
    reflection: L(
      "Before there was a job title or a wage, there was work. Genesis gives the first humans, made in God's image, the task of filling the earth and ruling it on His behalf, and places them in the garden to work it and keep it — to cultivate and to guard. Work is not a result of the Fall; it belongs to what it means to be human. And Jesus Himself spent most of His years as a craftsman in Nazareth (Mark 6:3).",
      "Avant tout titre de poste et tout salaire, il y avait le travail. La Genèse confie aux premiers humains, créés à l'image de Dieu, la tâche de remplir la terre et de la gouverner en son nom, et les place dans le jardin pour le cultiver et le garder. Le travail n'est pas une conséquence de la chute ; il fait partie de ce que signifie être humain. Et Jésus lui-même a passé la plupart de ses années comme artisan à Nazareth (Marc 6:3).",
    ),
    prompts: [
      L('Thank God that your work — paid or unpaid, visible or not — has a place in His purpose for the world.', "Remercie Dieu : ton travail, rémunéré ou non, visible ou non, a sa place dans son projet pour le monde."),
      L("Ask Him to help you see today's tasks as caring for what He has made, not only as things to get through.", "Demande-Lui de t'aider à voir les tâches d'aujourd'hui comme un soin apporté à ce qu'Il a créé, et pas seulement comme des choses à expédier."),
      L('Pray for people whose work is overlooked — cleaners, carers, farmers, parents at home — that they may know its dignity.', "Prie pour ceux dont le travail passe inaperçu — agents d'entretien, aidants, agriculteurs, parents au foyer — afin qu'ils en connaissent la dignité."),
    ],
    selfPrompt: L(
      "What do you count as “real work”? Tell God honestly where you have looked down on your own work, or on someone else's.",
      "Qu'appelles-tu du « vrai travail » ? Dis honnêtement à Dieu où tu as méprisé ton propre travail, ou celui d'un autre.",
    ),
    practice: L(
      'Write down the main kinds of work you do in a week — paid, unpaid, study, care for others — and offer the list to God item by item.',
      "Note les principales formes de travail que tu accomplis dans une semaine — rémunéré, bénévole, études, soin des autres — et offre cette liste à Dieu, point par point.",
    ),
    resourceTopics: ['work', 'calling', 'identity'],
  },
  {
    movement: 'stewardship',
    theme: { en: 'Thorns, sweat and toil', fr: 'Épines, sueur et labeur', es: 'Espinos, sudor y fatiga', pt: 'Espinhos, suor e fadiga', de: 'Dornen, Schweiß und Mühe', ru: 'Терния, пот и тяжкий труд', zh: '荆棘、汗水与劳苦', ja: 'いばらと汗と労苦', ko: '가시덤불과 땀과 수고', ar: 'شوك وعرق وتعب', fa: 'خار، عرق و رنج', hi: 'काँटे, पसीना और परिश्रम', id: 'Duri, keringat, dan jerih lelah', sw: 'Miiba, jasho na taabu', tl: 'Tinik, pawis at pagod', am: 'እሾህ፣ ላብና ድካም' },
    ref: 'Genesis 3:17-19',
    related: ['Ecclesiastes 2:18-23', 'Romans 8:18-23'],
    reflection: L(
      "It is the ground that is cursed — not the man, and not work itself. After the Fall, work remains but becomes toil: thorns grow where fruit was expected, effort meets frustration, and every worker returns to dust. Ecclesiastes adds the sleepless nights and the fear of leaving it all to someone careless. If your work is hard, it may not mean you are failing. You live in a groaning creation that, Paul says, is waiting to be set free (Romans 8:19-21).",
      "C'est le sol qui est maudit — ni l'homme, ni le travail lui-même. Après la chute, le travail demeure, mais il devient labeur : les épines poussent là où l'on attendait du fruit, l'effort se heurte à la frustration, et tout travailleur retourne à la poussière. L'Ecclésiaste ajoute les nuits sans repos et la crainte de tout laisser à quelqu'un d'insouciant. Si ton travail est pénible, ce n'est pas nécessairement que tu échoues. Tu vis dans une création qui gémit et qui, dit Paul, attend d'être libérée (Romains 8:19-21).",
    ),
    prompts: [
      L('Tell God honestly what feels like thorns in your work or your studies right now.', "Dis honnêtement à Dieu ce qui ressemble à des épines dans ton travail ou tes études en ce moment."),
      L('Pray for people whose work is dangerous, exhausting or poorly paid, that they would be protected and treated justly.', "Prie pour ceux dont le travail est dangereux, épuisant ou mal payé, afin qu'ils soient protégés et traités avec justice."),
      L('Thank God that frustration is not His last word over creation, and ask Him for hope to keep working well.', "Remercie Dieu : la frustration n'est pas son dernier mot sur la création. Demande-Lui l'espérance pour continuer à bien travailler."),
    ],
    practice: L(
      'Name one recurring frustration in your work and one small change that is within your power. Make that change this week and hand the rest to God.',
      "Nomme une frustration qui revient sans cesse dans ton travail, et un petit changement qui est en ton pouvoir. Fais ce changement cette semaine et remets le reste à Dieu.",
    ),
    resourceTopics: ['work', 'suffering'],
  },
  {
    movement: 'stewardship',
    theme: { en: 'You serve the Lord Christ', fr: "C'est le Seigneur Christ que tu sers", es: 'Sirves a Cristo el Señor', pt: 'Você serve a Cristo, o Senhor', de: 'Du dienst dem Herrn Christus', ru: 'Ты служишь Господу Христу', zh: '你是在事奉主基督', ja: '主キリストに仕える', ko: '너는 주 그리스도를 섬긴다', ar: 'أنت تخدم الرب المسيح', fa: 'تو مسیحِ خداوند را خدمت می‌کنی', hi: 'तुम प्रभु मसीह की सेवा करते हो', id: 'Engkau melayani Tuhan Kristus', sw: 'Unamtumikia Bwana Kristo', tl: 'Ang Panginoong Cristo ang iyong pinaglilingkuran', am: 'ጌታ ክርስቶስን ታገለግላለህ' },
    ref: 'Colossians 3:22-25',
    related: ['Colossians 4:1', 'Ephesians 6:5-9', 'James 5:4'],
    reflection: L(
      "Paul wrote these lines to enslaved people in Roman households, who had no choice over their work and no legal right to inherit. The verses do not endorse slavery: in the same letter Paul tells masters that they have a Master in heaven and must give what is just and fair (Colossians 4:1). But he gives the powerless a dignity no owner could take away — the Lord Christ saw their hidden work, and He promised them an inheritance. Whatever you do today, paid or unpaid, you can do it for Him.",
      "Paul a écrit ces lignes à des esclaves de maisonnées romaines, qui n'avaient aucun choix quant à leur travail ni aucun droit d'hériter. Ces versets ne cautionnent pas l'esclavage : dans la même lettre, Paul rappelle aux maîtres qu'ils ont un Maître dans le ciel et qu'ils doivent donner ce qui est juste et équitable (Colossiens 4:1). Mais il donne aux sans-pouvoir une dignité qu'aucun propriétaire ne pouvait leur retirer : le Seigneur Christ voyait leur travail caché, et Il leur promettait un héritage. Quoi que tu fasses aujourd'hui, rémunéré ou non, tu peux le faire pour Lui.",
    ),
    prompts: [
      L('Offer God the tasks no one will thank you for today, and ask for grace to do them wholeheartedly, as for Him.', "Offre à Dieu les tâches pour lesquelles personne ne te remerciera aujourd'hui, et demande la grâce de les accomplir de bon cœur, comme pour Lui."),
      L('Pray for people trapped in forced labour or trafficking, that they would be found, freed and restored.', "Prie pour les personnes prisonnières du travail forcé ou de la traite, afin qu'elles soient retrouvées, libérées et relevées."),
      L("If you have authority over anyone's work, ask God to make you just and fair, remembering your own Master.", "Si tu as autorité sur le travail de quelqu'un, demande à Dieu de te rendre juste et équitable, en te souvenant de ton propre Maître."),
    ],
    practice: L(
      'Pick one task today that you would normally do carefully only when someone is watching, and do it well with no one checking.',
      "Choisis aujourd'hui une tâche que tu ne soignerais d'ordinaire que sous le regard des autres, et fais-la bien sans que personne ne vérifie.",
    ),
    safetyNote: L(
      'These verses have been misused to defend slavery and to demand silent endurance of mistreatment. They require neither. If someone holds your documents, withholds your wages, threatens you or stops you from leaving a job, that is forced labour: contact the police or an anti-trafficking helpline.',
      "Ces versets ont été détournés pour défendre l'esclavage et pour exiger qu'on endure les mauvais traitements en silence. Ils n'exigent ni l'un ni l'autre. Si quelqu'un confisque tes papiers, retient ton salaire, te menace ou t'empêche de quitter un emploi, c'est du travail forcé : contacte la police ou une ligne d'aide contre la traite des êtres humains.",
    ),
    resourceTopics: ['work', 'justice'],
  },
  {
    movement: 'stewardship',
    theme: { en: 'Diligence, not a formula', fr: 'La diligence, pas une formule', es: 'Diligencia, no una fórmula', pt: 'Diligência, não uma fórmula', de: 'Fleiß ohne Erfolgsformel', ru: 'Усердие — не формула успеха', zh: '殷勤，不是成功公式', ja: '勤勉は成功の公式ではない', ko: '성실함은 성공 공식이 아니다', ar: 'الاجتهاد ليس معادلة نجاح', fa: 'کوشایی، نه فرمول موفقیت', hi: 'परिश्रम, सफलता का सूत्र नहीं', id: 'Rajin, bukan rumus sukses', sw: 'Bidii, si fomula ya mafanikio', tl: 'Sipag, hindi pormula ng tagumpay', am: 'ትጋት፣ የስኬት ቀመር አይደለም' },
    ref: 'Proverbs 6:6-11',
    related: ['Proverbs 22:29', 'Ecclesiastes 9:11'],
    reflection: L(
      "The ant needs no supervisor; she gathers at harvest what she will need in winter. Proverbs commends that steady, self-starting work, and warns that drift — just a little more sleep — has consequences. But Proverbs describes how life usually goes; it does not guarantee results. Ecclesiastes adds that bread does not always go to the wise, nor riches to the skilful: time and chance happen to everyone. Diligence is faithfulness to God, not a formula that obliges Him to make you prosper.",
      "La fourmi n'a besoin d'aucun chef ; elle amasse pendant la moisson ce dont elle aura besoin en hiver. Les Proverbes louent ce travail régulier, qui n'attend pas d'être surveillé, et avertissent que le laisser-aller — juste un peu plus de sommeil — a des conséquences. Mais les Proverbes décrivent comment va d'ordinaire la vie ; ils ne garantissent pas de résultat. L'Ecclésiaste ajoute que le pain ne va pas toujours aux sages, ni la richesse aux habiles : le temps et les circonstances atteignent chacun. La diligence est une fidélité envers Dieu, non une formule qui L'obligerait à te faire prospérer.",
    ),
    prompts: [
      L('Ask God for steady faithfulness in the work in front of you, whether anyone is watching or not.', "Demande à Dieu une fidélité constante dans le travail qui est devant toi, que quelqu'un regarde ou non."),
      L('Confess one area where you drift or keep putting off what needs doing, and ask for help to begin.', "Confesse un domaine où tu te laisses aller ou repousses sans cesse ce qui doit être fait, et demande de l'aide pour commencer."),
      L('Pray for someone who works hard and still struggles to make ends meet; ask God to provide for them and to move others to act justly.', "Prie pour quelqu'un qui travaille dur et peine pourtant à joindre les deux bouts ; demande à Dieu de pourvoir à ses besoins et de pousser d'autres à agir avec justice."),
    ],
    practice: L(
      'Choose the task you have been putting off longest and give it twenty focused minutes today, offering them to God before you start.',
      "Choisis la tâche que tu repousses depuis le plus longtemps et consacre-lui vingt minutes de concentration aujourd'hui, en les offrant à Dieu avant de commencer.",
    ),
    resourceTopics: ['work', 'wisdom', 'character'],
  },
  {
    movement: 'stewardship',
    theme: { en: 'Skill as a gift of the Spirit', fr: "Le savoir-faire, don de l'Esprit", es: 'La habilidad, un don del Espíritu', pt: 'A habilidade, dom do Espírito', de: 'Können als Gabe des Geistes', ru: 'Мастерство — дар Духа', zh: '技艺是圣灵的恩赐', ja: '技能は御霊の賜物', ko: '솜씨는 성령의 선물', ar: 'المهارة عطية من الروح', fa: 'مهارت، عطای روح', hi: 'कौशल, आत्मा का वरदान', id: 'Keterampilan, karunia Roh', sw: 'Ustadi ni karama ya Roho', tl: 'Kasanayan, kaloob ng Espiritu', am: 'ክህሎት የመንፈስ ስጦታ ነው' },
    ref: 'Exodus 31:1-6',
    related: ['Exodus 35:30-35', 'Psalm 90:17'],
    reflection: L(
      "Among the first people Scripture describes as filled with the Spirit of God is Bezalel — not a prophet or a priest, but a craftsman, gifted for metal, stone, wood and design. He did not work alone: Oholiab and every skilled worker shared the task, and Bezalel was also given the ability to teach (Exodus 35:34). His excellence served God's dwelling and other people, not his own image. Perfectionism makes the work about you; excellence offers God your best and leaves the rest with Him.",
      "Parmi les premiers que l'Écriture dit remplis de l'Esprit de Dieu se trouve Betsaleel — ni prophète ni prêtre, mais artisan, doué pour le métal, la pierre, le bois et la conception. Il ne travaillait pas seul : Oholiab et tous les ouvriers habiles partageaient la tâche, et Betsaleel reçut aussi le don d'enseigner (Exode 35:34). Son excellence servait la demeure de Dieu et les autres, non sa propre image. Le perfectionnisme fait du travail une affaire de soi ; l'excellence offre à Dieu ce que tu as de meilleur et Lui laisse le reste.",
    ),
    prompts: [
      L('Thank the Holy Spirit for a skill He has given you — with your hands, your mind or your care for people.', "Remercie le Saint-Esprit pour un savoir-faire qu'Il t'a donné — de tes mains, de ton intelligence ou dans ton soin des autres."),
      L('Ask to be filled with the Spirit for ordinary work today: for wisdom, skill and patience in the details.', "Demande à être rempli de l'Esprit pour ton travail ordinaire d'aujourd'hui : sagesse, savoir-faire et patience dans les détails."),
      L('Tell God where perfectionism drives you, and ask Him to free you to do your best and then stop.', "Dis à Dieu où le perfectionnisme te pousse, et demande-Lui de te rendre libre de faire de ton mieux, puis de t'arrêter."),
    ],
    practice: L(
      'Thank someone today, specifically, for the skill in their work — a mechanic, a cook, a nurse, a colleague, a teacher.',
      "Remercie aujourd'hui quelqu'un, précisément, pour le savoir-faire de son travail — un mécanicien, une cuisinière, une infirmière, un collègue, une enseignante.",
    ),
    resourceTopics: ['work', 'holy-spirit', 'calling'],
  },

  // ── Movement 2 · Character at work (days 6–10) ─────────────────────────────
  {
    movement: 'character',
    theme: { en: 'Honest scales, honest hours', fr: 'Balance juste, heures honnêtes', es: 'Balanza justa, horas honestas', pt: 'Balança justa, horas honestas', de: 'Ehrliche Waage, ehrliche Stunden', ru: 'Верные весы, честные часы', zh: '公道的天平，诚实的工时', ja: '正しいはかり、誠実な時間', ko: '정직한 저울, 정직한 시간', ar: 'ميزان عادل وساعات أمينة', fa: 'ترازوی درست، ساعات صادقانه', hi: 'सच्चा तराज़ू, ईमानदार घंटे', id: 'Timbangan jujur, jam kerja jujur', sw: 'Mizani ya haki, saa za uaminifu', tl: 'Tapat na timbangan, tapat na oras', am: 'ትክክለኛ ሚዛን፣ ታማኝ ሰዓት' },
    ref: 'Luke 3:7-14',
    related: ['Ephesians 4:28', 'Proverbs 11:1'],
    reflection: L(
      "When the crowds asked John the Baptist what repentance should look like, he did not send tax collectors and soldiers out of their jobs. He told them to stop overcharging, stop extorting and threatening, and be content with their pay. Repentance showed up at the tax booth and on patrol. Paul goes further: the one who used to steal now works honestly in order to have something to give (Ephesians 4:28). Integrity is rarely dramatic; it lives in honest figures, fair hours and true reports.",
      "Quand les foules demandèrent à Jean-Baptiste à quoi devait ressembler la repentance, il n'a pas renvoyé les collecteurs d'impôts et les soldats de leur métier. Il leur a dit de cesser d'exiger plus que leur dû, de cesser d'extorquer et de menacer, et de se contenter de leur solde. La repentance se voyait au bureau des taxes et en patrouille. Paul va plus loin : celui qui volait travaille désormais honnêtement pour avoir de quoi donner (Éphésiens 4:28). L'intégrité est rarement spectaculaire ; elle habite des chiffres exacts, des heures justes et des rapports vrais.",
    ),
    prompts: [
      L('Ask God to show you one place where small dishonesty has become normal around you — or in you.', "Demande à Dieu de te montrer un endroit où de petites malhonnêtetés sont devenues normales autour de toi — ou en toi."),
      L('Pray for courage to be truthful in your reports, timesheets, homework, invoices or promises, even when it costs you.', "Prie pour avoir le courage d'être vrai dans tes rapports, tes feuilles d'heures, tes devoirs, tes factures ou tes promesses, même quand cela te coûte."),
      L('Pray for people pressured at work to cut corners or cover up wrongdoing, that they would find a safe way to stand firm.', "Prie pour ceux que l'on pousse, au travail, à tricher ou à couvrir des fautes, afin qu'ils trouvent un moyen sûr de tenir bon."),
    ],
    practice: L(
      'Put one small thing right today: correct an inaccurate figure, return something that is not yours, or own a mistake before anyone finds it.',
      "Répare aujourd'hui une petite chose : corrige un chiffre inexact, rends ce qui ne t'appartient pas, ou reconnais une erreur avant que quelqu'un la découvre.",
    ),
    resourceTopics: ['character', 'work'],
  },
  {
    movement: 'character',
    theme: { en: 'Provision without anxiety', fr: "Pourvu, sans t'inquiéter", es: 'Provisión sin afán', pt: 'Provisão sem ansiedade', de: 'Versorgt, ohne zu sorgen', ru: 'Обеспечение без тревоги', zh: '神的供应，不必忧虑', ja: '思い煩わずに養われる', ko: '염려 없이 공급받다', ar: 'الرزق بلا قلق', fa: 'روزی، بدون نگرانی', hi: 'चिंता के बिना परमेश्वर का प्रबंध', id: 'Pemeliharaan tanpa kekhawatiran', sw: 'Riziki bila wasiwasi', tl: 'Panustos na walang pag-aalala', am: 'ስለ ኑሮ አለመጨነቅ' },
    ref: 'Matthew 6:25-34',
    related: ['Matthew 6:19-24', 'Philippians 4:11-13'],
    reflection: L(
      "Jesus does not tell His hearers to stop working. Birds neither sow nor reap, yet people must; what He forbids is anxious worry, because the Father knows what they need. Seeking His kingdom first reorders the heart, not the effort. This is not a promise of wealth, nor a promise that believers never go without — Paul knew hunger as well as plenty (Philippians 4:12). It is an invitation to trust the Father one day at a time, since each day brings enough trouble of its own.",
      "Jésus ne demande pas à ceux qui l'écoutent de cesser de travailler. Les oiseaux ne sèment ni ne moissonnent, mais les hommes, eux, le doivent ; ce qu'Il interdit, c'est l'inquiétude, car le Père sait ce dont ils ont besoin. Chercher d'abord son royaume remet le cœur en ordre, non l'effort. Ce n'est pas une promesse de richesse, ni l'assurance que les croyants ne manquent jamais de rien — Paul a connu la faim comme l'abondance (Philippiens 4:12). C'est une invitation à te confier au Père jour après jour, puisque chaque jour porte déjà assez de difficultés.",
    ),
    prompts: [
      L('Tell your Father the money worries you are carrying today, naming them one by one, and leave them with Him.', "Dis à ton Père les soucis d'argent que tu portes aujourd'hui, en les nommant un par un, et laisse-les-Lui."),
      L('Ask Him to show you whether you serve money in any way, and to set your treasure on what lasts.', "Demande-Lui de te montrer si tu sers l'argent d'une manière ou d'une autre, et de placer ton trésor dans ce qui dure."),
      L('Pray for households facing debt, rising costs or an uncertain income this month, that they would receive practical help.', "Prie pour les foyers qui font face aux dettes, à la hausse des prix ou à un revenu incertain ce mois-ci, afin qu'ils reçoivent une aide concrète."),
    ],
    practice: L(
      "Spend ten minutes looking honestly at this month's income and expenses — wage, pension, allowance or gift — then pray over the figures one by one.",
      "Prends dix minutes pour regarder honnêtement les revenus et les dépenses de ce mois — salaire, pension, allocation ou aide reçue —, puis prie sur ces chiffres un par un.",
    ),
    resourceTopics: ['finances', 'contentment', 'trust'],
  },
  {
    movement: 'character',
    theme: { en: 'When others seem to get more', fr: 'Quand les autres semblent recevoir plus', es: 'Cuando otros parecen recibir más', pt: 'Quando outros parecem receber mais', de: 'Wenn andere mehr zu bekommen scheinen', ru: 'Когда другим, кажется, достаётся больше', zh: '当别人似乎得的更多', ja: '他の人がもっと得ているように見えるとき', ko: '남들이 더 받는 것 같을 때', ar: 'حين يبدو أن غيرك ينال أكثر', fa: 'وقتی دیگران بیشتر می‌گیرند', hi: 'जब दूसरों को अधिक मिलता दिखे', id: 'Ketika orang lain tampak mendapat lebih', sw: 'Wengine wanapoonekana kupata zaidi', tl: 'Kapag tila mas marami ang natatanggap ng iba', am: 'ሌሎች የበለጠ የሚያገኙ ሲመስል' },
    ref: 'Matthew 20:1-16',
    related: ['John 21:20-22', 'Galatians 6:4-5'],
    reflection: L(
      "The workers hired at dawn were not cheated; they received exactly what they had agreed. Their complaint was that the landowner had been generous to others. Comparison can turn grace into a grievance. Notice, too, the ones still standing in the marketplace late in the day because no one had hired them — and the landowner paid them a full day's wage. When Peter looked at John and asked about his future, Jesus turned him back to his own path of following (John 21:22).",
      "Les ouvriers embauchés à l'aube n'ont pas été lésés : ils ont reçu exactement ce qui avait été convenu. Leur plainte, c'est que le maître ait été généreux envers d'autres. La comparaison peut changer la grâce en grief. Remarque aussi ceux qui attendaient encore sur la place en fin de journée, parce que personne ne les avait embauchés — le maître leur a versé le salaire d'une journée entière. Quand Pierre regarda Jean et s'interrogea sur son avenir, Jésus le ramena à son propre chemin : Le suivre (Jean 21:22).",
    ),
    prompts: [
      L('Name before God the person whose pay, success or opportunities you keep measuring yourself against, and ask Him to bless them.', "Nomme devant Dieu la personne à qui tu ne cesses de te mesurer — son salaire, sa réussite, ses occasions — et demande-Lui de la bénir."),
      L('Thank God for His generosity to you, which you did not earn, and ask Him to heal any resentment at His generosity to others.', "Remercie Dieu pour sa générosité envers toi, que tu n'as pas méritée, et demande-Lui de guérir toute rancœur devant sa générosité envers d'autres."),
      L('Pray for people still waiting in the marketplace today — looking for work and not being chosen.', "Prie pour ceux qui attendent encore sur la place aujourd'hui — qui cherchent du travail sans être choisis."),
    ],
    selfPrompt: L(
      'Where does comparison — online, at work, among friends or in church — steal your joy? Bring it to Jesus and return to your own path of following Him.',
      "Où la comparaison — en ligne, au travail, entre amis ou à l'église — te vole-t-elle ta joie ? Apporte-la à Jésus et reviens à ton propre chemin : Le suivre.",
    ),
    practice: L(
      'Congratulate someone sincerely today on something good that has happened in their work or studies.',
      "Félicite sincèrement quelqu'un aujourd'hui pour une bonne chose qui lui est arrivée dans son travail ou ses études.",
    ),
    resourceTopics: ['contentment', 'identity', 'work'],
  },
  {
    movement: 'character',
    theme: { en: 'Ambition that serves', fr: 'Une ambition qui sert', es: 'Una ambición que sirve', pt: 'Uma ambição que serve', de: 'Ehrgeiz, der dient', ru: 'Амбиции, которые служат', zh: '服事人的抱负', ja: '仕えるための志', ko: '섬기는 야망', ar: 'طموح يخدم', fa: 'بلندپروازی‌ای که خدمت می‌کند', hi: 'सेवा करने वाली महत्वाकांक्षा', id: 'Ambisi yang melayani', sw: 'Ukuu kwa njia ya huduma', tl: 'Ambisyong naglilingkod', am: 'የሚያገለግል ምኞት' },
    ref: 'Mark 10:35-45',
    related: ['Jeremiah 45:1-5', 'Deuteronomy 24:14-15'],
    reflection: L(
      "James and John asked for the best seats in the coming kingdom, and the other ten were indignant — perhaps because they wanted the same. Jesus did not scold the desire to be great; He redefined greatness. The rulers of the nations lord it over people; among His followers, the great one serves, because the Son of Man came to serve and to give His life. Whoever has power over someone else's day — manager, owner, parent, supervisor, pastor — is asked to use it the way He did.",
      "Jacques et Jean ont demandé les meilleures places dans le royaume à venir, et les dix autres se sont indignés — peut-être parce qu'ils voulaient la même chose. Jésus n'a pas condamné le désir d'être grand ; Il a redéfini la grandeur. Les chefs des nations dominent sur les peuples ; parmi ses disciples, le plus grand sert, car le Fils de l'homme est venu pour servir et donner sa vie. Quiconque a du pouvoir sur la journée d'un autre — responsable, patron, parent, chef d'équipe, pasteur — est appelé à l'exercer comme Lui.",
    ),
    prompts: [
      L('Tell Jesus honestly what you want to achieve, and ask Him to purify the motives underneath it.', "Dis honnêtement à Jésus ce que tu veux accomplir, et demande-Lui de purifier les motivations qui s'y cachent."),
      L('If you lead anyone — at work, at home, in church or on a team — ask for grace to use that power to serve them.', "Si tu diriges qui que ce soit — au travail, à la maison, à l'église ou dans une équipe —, demande la grâce d'utiliser ce pouvoir pour le servir."),
      L('Pray for the employers and managers you know, that they would pay fairly and promptly and never exploit the vulnerable.', "Prie pour les employeurs et les responsables que tu connais, afin qu'ils paient avec justice et sans retard, et n'exploitent jamais les plus vulnérables."),
    ],
    selfPrompt: L(
      'Baruch was warned against chasing greatness for himself (Jeremiah 45:5). Which kind of greatness are you chasing that you need to hand back to God?',
      "Baruc fut mis en garde contre la recherche de grandeur pour lui-même (Jérémie 45:5). Quelle grandeur poursuis-tu pour toi, qu'il te faudrait remettre à Dieu ?",
    ),
    practice: L(
      "Do one unglamorous piece of work today that serves someone else's success more than your own.",
      "Accomplis aujourd'hui une tâche sans éclat qui sert la réussite de quelqu'un d'autre plus que la tienne.",
    ),
    resourceTopics: ['leadership', 'character', 'work'],
  },
  {
    movement: 'character',
    theme: { en: 'Hard colleagues, hard authority', fr: 'Collègues difficiles, autorité difficile', es: 'Compañeros difíciles, autoridad difícil', pt: 'Colegas difíceis, autoridade difícil', de: 'Schwierige Kollegen, schwierige Vorgesetzte', ru: 'Трудные коллеги, трудное начальство', zh: '难相处的同事与上司', ja: '難しい同僚、難しい上司', ko: '어려운 동료, 어려운 상사', ar: 'زملاء صعبون وسلطة صعبة', fa: 'همکاران دشوار، مافوق دشوار', hi: 'कठिन सहकर्मी, कठिन अधिकारी', id: 'Rekan dan atasan yang sulit', sw: 'Wenzako na wakubwa wagumu', tl: 'Mahirap na katrabaho at amo', am: 'አስቸጋሪ ባልደረቦችና አለቆች' },
    ref: 'Daniel 6:1-10',
    related: ['Romans 12:17-21', 'Acts 5:27-29', 'James 5:1-6'],
    reflection: L(
      "Daniel served a foreign king, and served so well that his rivals searched his work for negligence or corruption and found none. So they built a trap out of his faithfulness to God. Daniel neither retaliated nor stopped praying; he kept his habit, windows open, and accepted the cost. Scripture asks you to work honestly under authority and to live at peace as far as it depends on you (Romans 12:18) — but never to obey an order that requires sin (Acts 5:29).",
      "Daniel servait un roi étranger, et il le servait si bien que ses rivaux, fouillant son travail à la recherche de négligence ou de corruption, n'en trouvèrent aucune. Ils tendirent donc un piège à sa fidélité envers Dieu. Daniel ne s'est pas vengé et n'a pas cessé de prier ; il a gardé son habitude, fenêtres ouvertes, et en a accepté le prix. L'Écriture te demande de travailler honnêtement sous l'autorité et de vivre en paix autant que cela dépend de toi (Romains 12:18) — mais jamais d'obéir à un ordre qui exige de pécher (Actes 5:29).",
    ),
    prompts: [
      L('Pray by name for a colleague, classmate or boss you find difficult; ask God to bless them and to guard your words.', "Prie nommément pour un collègue, un camarade ou un supérieur que tu trouves difficile ; demande à Dieu de le bénir et de garder tes paroles."),
      L("Ask for Daniel's kind of integrity: work that gives no ground for accusation, and a prayer life that does not bend under pressure.", "Demande l'intégrité de Daniel : un travail qui ne prête pas à l'accusation, et une vie de prière qui ne plie pas sous la pression."),
      L('Pray for workers who are harassed, cheated of their wages or pushed into wrongdoing, that they would find protection and justice.', "Prie pour les travailleurs harcelés, privés de leur salaire ou poussés à mal agir, afin qu'ils trouvent protection et justice."),
    ],
    selfPrompt: L(
      'Ask God honestly whether you are the difficult colleague for someone else, and what one change would help.',
      "Demande honnêtement à Dieu si tu n'es pas, pour quelqu'un, le collègue difficile, et quel changement pourrait aider.",
    ),
    practice: L(
      'Show one deliberate kindness today to someone you find hard to work with: a greeting, a word of credit, an offer of help.',
      "Fais aujourd'hui un geste de bonté délibéré envers quelqu'un avec qui il t'est difficile de travailler : une salutation, une parole de reconnaissance, une offre d'aide.",
    ),
    safetyNote: L(
      'Working under authority never means enduring abuse or joining in wrongdoing. Harassment, discrimination, threats, unsafe conditions, unpaid wages or pressure to break the law should be written down and reported — to HR, a union or staff representative, a labour inspectorate or the police. If you are in danger, contact emergency services. A pastor or a trusted believer can walk with you.',
      "Travailler sous une autorité ne signifie jamais subir des abus ni participer à ce qui est mal. Le harcèlement, la discrimination, les menaces, les conditions dangereuses, les salaires impayés ou la pression pour enfreindre la loi doivent être notés et signalés — aux ressources humaines, à un syndicat ou à un représentant du personnel, à l'inspection du travail ou à la police. Si tu es en danger, contacte les services d'urgence. Un pasteur ou un croyant de confiance peut t'accompagner.",
    ),
    resourceTopics: ['work', 'character', 'justice'],
  },

  // ── Movement 3 · Calling, decisions and relationships (days 11–15) ─────────
  {
    movement: 'calling',
    theme: { en: 'Called to Christ before a career', fr: 'Appelé à Christ avant un métier', es: 'Llamados a Cristo antes que a una carrera', pt: 'Chamados a Cristo antes de uma carreira', de: 'Zuerst zu Christus berufen', ru: 'Призваны ко Христу прежде карьеры', zh: '先蒙召归向基督，而非职业', ja: '職業より先にキリストへ召される', ko: '직업보다 먼저 그리스도께 부르심', ar: 'مدعوون إلى المسيح قبل أي مهنة', fa: 'دعوت به مسیح، پیش از هر شغل', hi: 'पेशे से पहले मसीह के लिए बुलाए गए', id: 'Dipanggil kepada Kristus sebelum karier', sw: 'Kuitwa kwa Kristo kabla ya kazi', tl: 'Tinawag kay Cristo bago sa karera', am: 'ከሙያ በፊት ወደ ክርስቶስ ተጠርተናል' },
    ref: '1 Corinthians 7:17-24',
    related: ['Mark 1:16-20', 'Mark 5:18-20', 'Ephesians 4:1-3'],
    reflection: L(
      "Paul uses the word “calling” first for the moment God calls someone to Christ. Then, three times, he tells the Corinthians to live out that calling in the situation where it found them — while urging those who can gain their freedom to take it (v. 21, as most translations read it). Your first calling is to belong to Jesus, not to find a single hidden career or miss it forever. Some disciples left their nets (Mark 1:18); the healed man in Mark 5 was sent home. Neither path is holier.",
      "Paul emploie d'abord le mot « appel » pour le moment où Dieu appelle quelqu'un à Christ. Puis, par trois fois, il demande aux Corinthiens de vivre cet appel dans la situation où il les a trouvés — tout en encourageant ceux qui peuvent devenir libres à saisir cette occasion (v. 21, selon la plupart des traductions). Ton premier appel est d'appartenir à Jésus, non de trouver un unique métier caché, au risque de le manquer pour toujours. Certains disciples ont quitté leurs filets (Marc 1:18) ; l'homme guéri de Marc 5 a été renvoyé chez lui. Aucun de ces chemins n'est plus saint.",
    ),
    prompts: [
      L('Thank God that He called you to Himself before He gave you any task, role or title.', "Remercie Dieu de t'avoir appelé à Lui avant de te confier quelque tâche, rôle ou titre que ce soit."),
      L('Ask Him how to live as His disciple where you are right now — job, studies, home, retirement or the search for work.', "Demande-Lui comment vivre en disciple là où tu es aujourd'hui — emploi, études, foyer, retraite ou recherche de travail."),
      L("Pray for those in church ministry and those in ordinary jobs alike, that none would think their work more or less holy than another's.", "Prie à la fois pour ceux qui servent dans un ministère d'Église et pour ceux qui exercent un métier ordinaire, afin qu'aucun ne croie son travail plus ou moins saint que celui d'un autre."),
    ],
    selfPrompt: L(
      'Have you been afraid of missing “the one thing” God wants you to do? Tell Him so, and rest in the calling you already have: to follow Jesus.',
      "As-tu eu peur de manquer « la seule chose » que Dieu attend de toi ? Dis-le-Lui, et repose-toi dans l'appel que tu as déjà : suivre Jésus.",
    ),
    practice: L(
      'Finish this sentence in writing and keep it where you work or study: “Wherever I am this week, I am first called to…”',
      "Complète par écrit cette phrase et garde-la là où tu travailles ou étudies : « Où que je sois cette semaine, je suis d'abord appelé à… »",
    ),
    resourceTopics: ['calling', 'identity'],
  },
  {
    movement: 'calling',
    theme: { en: 'Faithful with what is entrusted', fr: "Fidèle dans ce qui t'est confié", es: 'Fieles con lo que se nos confió', pt: 'Fiéis com o que nos foi confiado', de: 'Treu mit dem Anvertrauten', ru: 'Верны в доверенном', zh: '在所托付的事上忠心', ja: '任されたものに忠実に', ko: '맡겨진 것에 충성하라', ar: 'أمناء على ما اؤتمنّا عليه', fa: 'امین در آنچه سپرده شده', hi: 'जो सौंपा गया उसमें विश्वासयोग्य', id: 'Setia dengan yang dipercayakan', sw: 'Waaminifu kwa tulichokabidhiwa', tl: 'Tapat sa ipinagkatiwala', am: 'በአደራ በተሰጠን ታማኝ መሆን' },
    ref: 'Matthew 25:14-30',
    related: ['1 Peter 4:10-11', 'Romans 12:4-8'],
    reflection: L(
      "The master's praise is word for word the same for the servant given five talents and the one given two: what mattered was faithfulness with what each received, not the size of the return. The third servant buried his talent because he feared a harsh master — his picture of the master shaped his work. The parable is about readiness for Christ's return, not an investment strategy. Peter applies the same idea to gifts: each has received one, to serve others as a steward of God's varied grace (1 Peter 4:10).",
      "L'éloge du maître est le même, mot pour mot, pour le serviteur qui a reçu cinq talents et pour celui qui en a reçu deux : ce qui comptait, c'était la fidélité de chacun envers ce qu'il avait reçu, non l'ampleur du rendement. Le troisième a enfoui son talent parce qu'il craignait un maître dur : l'image qu'il se faisait du maître a façonné son travail. La parabole parle d'être prêt pour le retour de Christ, non d'une stratégie d'investissement. Pierre applique la même idée aux dons : chacun en a reçu un, pour servir les autres en intendant de la grâce variée de Dieu (1 Pierre 4:10).",
    ),
    prompts: [
      L('Name before God the gifts, skills and opportunities you have received, and thank Him for trusting you with them.', "Nomme devant Dieu les dons, les compétences et les occasions que tu as reçus, et remercie-Le de te les avoir confiés."),
      L('Tell Him where fear of failure, or a harsh picture of Him, has made you bury something He gave you.', "Dis-Lui où la peur d'échouer, ou une image dure de Lui, t'a poussé à enfouir quelque chose qu'Il t'avait donné."),
      L('Pray for someone whose gifts are going unused — through illness, unemployment, discouragement or lack of opportunity.', "Prie pour quelqu'un dont les dons restent inemployés — à cause de la maladie, du chômage, du découragement ou du manque d'occasions."),
    ],
    practice: L(
      'Ask a trusted friend or church leader which gift they see in you, and look for one way to use it for someone else this week.',
      "Demande à un ami de confiance ou à un responsable d'Église quel don il voit en toi, et cherche une manière de l'utiliser pour quelqu'un d'autre cette semaine.",
    ),
    resourceTopics: ['calling', 'spiritual-gifts', 'work'],
  },
  {
    movement: 'calling',
    theme: { en: 'Deciding with prayer and a plan', fr: 'Décider avec la prière et un plan', es: 'Decidir con oración y un plan', pt: 'Decidir com oração e um plano', de: 'Mit Gebet und Plan entscheiden', ru: 'Решать с молитвой и планом', zh: '以祷告和计划做决定', ja: '祈りと計画をもって決める', ko: '기도와 계획으로 결정하기', ar: 'القرار بالصلاة والتخطيط', fa: 'تصمیم با دعا و برنامه', hi: 'प्रार्थना और योजना के साथ निर्णय', id: 'Memutuskan dengan doa dan rencana', sw: 'Kuamua kwa maombi na mpango', tl: 'Pagpapasya sa panalangin at plano', am: 'በጸሎትና በዕቅድ መወሰን' },
    ref: 'Nehemiah 2:1-9',
    related: ['Proverbs 16:1-9', 'James 1:5-8'],
    reflection: L(
      "Nehemiah had prayed and fasted for months before the king asked why he looked so sad. In that moment he breathed a silent prayer — and then answered with a detailed plan: how long he would be away, which letters he needed, where the timber would come from. Prayer did not replace preparation, and preparation did not replace prayer. Most decisions about work and study are made this way: asking God for wisdom (James 1:5), weighing gifts, needs and wise counsel, and then taking a step.",
      "Néhémie priait et jeûnait depuis des mois quand le roi lui demanda pourquoi il avait l'air si triste. À cet instant, il adressa à Dieu une prière silencieuse — puis répondit par un plan précis : la durée de son absence, les lettres dont il aurait besoin, l'endroit d'où viendrait le bois. La prière ne remplaçait pas la préparation, et la préparation ne remplaçait pas la prière. La plupart des décisions concernant le travail ou les études se prennent ainsi : demander à Dieu la sagesse (Jacques 1:5), peser ses dons, les besoins et les conseils avisés, puis faire un pas.",
    ),
    prompts: [
      L('Bring one decision you face about work, study or service to God, and lay your options before Him honestly.', "Apporte à Dieu une décision que tu dois prendre au sujet de ton travail, de tes études ou de ton service, et expose-Lui honnêtement tes options."),
      L('Ask Him for wisdom, and for the humility to seek advice from people who know you and the situation.', "Demande-Lui la sagesse, et l'humilité de chercher conseil auprès de personnes qui te connaissent et connaissent la situation."),
      L('Pray for students, job-seekers and anyone facing a big decision this season, that they would have wisdom and peace.', "Prie pour les étudiants, les demandeurs d'emploi et tous ceux qui ont une grande décision à prendre en ce moment, afin qu'ils aient sagesse et paix."),
    ],
    selfPrompt: L(
      'Are you waiting for a sign so that you never risk being wrong? Tell God honestly, and ask for courage to take the next faithful step.',
      "Attends-tu un signe pour ne jamais courir le risque de te tromper ? Dis-le honnêtement à Dieu, et demande-Lui le courage de faire le prochain pas fidèle.",
    ),
    practice: L(
      "Write your decision on one page: the options, what Scripture says, your gifts, the needs around you and one wise person's advice. Then pray over the page.",
      "Écris ta décision sur une page : les options, ce que dit l'Écriture, tes dons, les besoins autour de toi et le conseil d'une personne sage. Puis prie sur cette page.",
    ),
    resourceTopics: ['discernment', 'wisdom', 'calling'],
  },
  {
    movement: 'calling',
    theme: { en: 'When work is lost or hard to find', fr: 'Quand le travail vient à manquer', es: 'Cuando falta el trabajo', pt: 'Quando falta trabalho', de: 'Wenn Arbeit fehlt', ru: 'Когда нет работы', zh: '失业或难找工作时', ja: '仕事を失ったとき、見つからないとき', ko: '일을 잃었거나 찾기 어려울 때', ar: 'حين يُفقد العمل أو يصعب إيجاده', fa: 'وقتی کار از دست رفته یا پیدا نمی‌شود', hi: 'जब काम छूट जाए या न मिले', id: 'Ketika kehilangan atau sulit mencari kerja', sw: 'Kazi inapopotea au kukosekana', tl: 'Kapag nawalan o hirap maghanap ng trabaho', am: 'ሥራ ሲጠፋ ወይም ሲቸግር' },
    ref: 'Ruth 2:1-12',
    related: ['Leviticus 19:9-10', 'Psalm 34:17-18', '1 Kings 19:3-8'],
    reflection: L(
      "Ruth was a widow and a foreigner with no income, and she went out to look for work. God's law had already made room for people like her: farmers were to leave the edges of their fields for the poor and the stranger (Leviticus 19:9-10). Boaz went beyond the law, protecting her and letting her glean freely. Being without work is not a sign of God's disfavour, nor a measure of your worth. Scripture treats it as a need the community is meant to carry together.",
      "Ruth était veuve, étrangère et sans revenu, et elle est sortie chercher du travail. La loi de Dieu avait déjà fait une place aux gens comme elle : les cultivateurs devaient laisser le bord de leurs champs aux pauvres et aux étrangers (Lévitique 19:9-10). Boaz est allé au-delà de la loi, en la protégeant et en la laissant glaner librement. Être sans travail n'est pas un signe de la défaveur de Dieu, ni la mesure de ta valeur. L'Écriture le traite comme un besoin que la communauté est appelée à porter ensemble.",
    ),
    prompts: [
      L('If you are without work, tell God honestly how it feels — the fear, the waiting, the questions — and ask Him for strength for each day.', "Si tu es sans travail, dis honnêtement à Dieu ce que tu ressens — la peur, l'attente, les questions — et demande-Lui la force pour chaque jour."),
      L('Pray for people who have lost work through illness, disability, age, redundancy or crisis, that they would be treated with dignity and helped in practical ways.', "Prie pour ceux qui ont perdu leur travail à cause de la maladie, du handicap, de l'âge, d'un licenciement ou d'une crise, afin qu'ils soient traités avec dignité et aidés concrètement."),
      L("Ask God to make your church like Boaz's field: a place where people looking for work find welcome, contacts and help.", "Demande à Dieu de faire de ton Église un lieu comme le champ de Boaz, où ceux qui cherchent du travail trouvent accueil, contacts et aide."),
    ],
    selfPrompt: L(
      'Whether you have work or not, ask God where your sense of worth has rested on your job, and let Him anchor it again in Christ.',
      "Que tu aies du travail ou non, demande à Dieu où ton sentiment de valeur reposait sur ton emploi, et laisse-Le l'ancrer de nouveau en Christ.",
    ),
    practice: L(
      'Do one concrete thing today: send one application or message to a contact — or, if you have work, share a job lead, a reference or a meal with someone who is looking.',
      "Fais aujourd'hui une chose concrète : envoie une candidature ou un message à un contact — ou, si tu as du travail, partage une piste d'emploi, une recommandation ou un repas avec quelqu'un qui cherche.",
    ),
    safetyNote: L(
      'Losing work can bring debt, deep discouragement and sometimes thoughts of despair. You do not have to carry it alone: tell your pastor or a trusted believer, and seek free debt advice early. If you have thoughts of harming yourself, contact a crisis line or emergency services now.',
      "Perdre son travail peut entraîner des dettes, un profond découragement et parfois des pensées de désespoir. Tu n'as pas à porter cela seul : parles-en à ton pasteur ou à un croyant de confiance, et cherche tôt un conseil gratuit pour tes dettes. Si tu as des pensées de te faire du mal, contacte dès maintenant une ligne d'écoute ou les services d'urgence.",
    ),
    resourceTopics: ['work', 'suffering', 'finances'],
  },
  {
    movement: 'calling',
    theme: { en: 'The hidden work God sees', fr: 'Le travail caché que Dieu voit', es: 'El trabajo oculto que Dios ve', pt: 'O trabalho escondido que Deus vê', de: 'Die verborgene Arbeit, die Gott sieht', ru: 'Незаметный труд, который видит Бог', zh: '神看见的隐藏工作', ja: '神が見ておられる隠れた働き', ko: '하나님이 보시는 숨은 수고', ar: 'العمل الخفي الذي يراه الله', fa: 'کار پنهانی که خدا می‌بیند', hi: 'छिपा काम जिसे परमेश्वर देखता है', id: 'Pekerjaan tersembunyi yang dilihat Allah', sw: 'Kazi iliyofichika ambayo Mungu anaiona', tl: 'Ang nakatagong gawaing nakikita ng Diyos', am: 'እግዚአብሔር የሚያየው የተሰወረ ሥራ' },
    ref: 'Acts 9:36-42',
    related: ['Matthew 10:40-42', 'Matthew 6:1-4'],
    reflection: L(
      "Luke remembers Tabitha for her constant good deeds and her help to the poor. When she died, the widows of Joppa did not make speeches; they showed Peter the tunics and garments she had made for them. Her work was unpaid, practical and mostly unseen — and it was woven into the lives of people who had little. Luke goes on to tell how she was raised, but the widows' grief had already shown what her work meant. Caring, cooking, sewing, visiting and nursing are not small to God.",
      "Luc se souvient de Tabitha pour ses bonnes œuvres constantes et son aide aux pauvres. Quand elle mourut, les veuves de Joppé ne firent pas de discours : elles montrèrent à Pierre les tuniques et les vêtements qu'elle avait confectionnés pour elles. Son travail était bénévole, concret et presque invisible — et il était tissé dans la vie de gens qui avaient peu. Luc raconte ensuite qu'elle fut ramenée à la vie, mais le deuil des veuves avait déjà montré ce que valait son travail. Prendre soin, cuisiner, coudre, visiter, soigner : rien de cela n'est petit pour Dieu.",
    ),
    prompts: [
      L('Thank God for someone whose hidden work has shaped your life — a parent, a carer, a volunteer, a teacher — and pray for them by name.', "Remercie Dieu pour quelqu'un dont le travail caché a marqué ta vie — un parent, un aidant, un bénévole, un enseignant — et prie pour lui nommément."),
      L('Offer God the unseen work you will do today — at home, in caring for someone, in study or behind the scenes — as service to Christ.', "Offre à Dieu le travail invisible que tu accompliras aujourd'hui — à la maison, auprès d'un proche, dans tes études ou en coulisses — comme un service rendu à Christ."),
      L('Pray for carers and parents at home who feel invisible or exhausted, that they would be seen, supported and given rest.', "Prie pour les aidants et les parents au foyer qui se sentent invisibles ou épuisés, afin qu'ils soient vus, soutenus et qu'ils trouvent du repos."),
    ],
    practice: L(
      'Notice one piece of hidden work someone does for you or your community, and thank them for it today, in person or in writing.',
      "Remarque un travail caché que quelqu'un accomplit pour toi ou pour ta communauté, et remercie-le aujourd'hui, de vive voix ou par écrit.",
    ),
    resourceTopics: ['work', 'calling', 'family'],
  },

  // ── Movement 4 · Limits, generosity, witness and rest (days 16–21) ─────────
  {
    movement: 'rest',
    theme: { en: 'Limits are not failure', fr: "Une limite n'est pas un échec", es: 'Los límites no son un fracaso', pt: 'Limites não são fracasso', de: 'Grenzen sind kein Versagen', ru: 'Ограничения — не провал', zh: '有限不是失败', ja: '限界は失敗ではない', ko: '한계는 실패가 아니다', ar: 'الحدود ليست فشلاً', fa: 'محدودیت شکست نیست', hi: 'सीमाएँ असफलता नहीं हैं', id: 'Keterbatasan bukan kegagalan', sw: 'Mipaka si kushindwa', tl: 'Ang limitasyon ay hindi kabiguan', am: 'ውስንነት ውድቀት አይደለም' },
    ref: 'Exodus 18:13-23',
    related: ['Ecclesiastes 4:4-8', '2 Corinthians 12:9-10'],
    reflection: L(
      "Moses sat judging the people from morning until evening, and his father-in-law told him plainly that it was not good: he would wear himself out, and the people with him. Moses' limit was not a moral failure but a reality to respect, and Jethro's answer was to share the load with capable, trustworthy people. Ecclesiastes pictures a man who never stops toiling and never asks whom it is for (Ecclesiastes 4:8). Whether your limits come from time, age, illness or disability, they are not failure; God's grace meets you in weakness (2 Corinthians 12:9).",
      "Moïse siégeait pour juger le peuple du matin au soir, et son beau-père lui dit franchement que ce n'était pas bien : il allait s'épuiser, et le peuple avec lui. La limite de Moïse n'était pas une faute morale, mais une réalité à respecter, et la réponse de Jéthro fut de partager la charge avec des hommes capables et dignes de confiance. L'Ecclésiaste dépeint un homme qui ne cesse jamais de peiner et ne se demande jamais pour qui (Ecclésiaste 4:8). Que tes limites viennent du temps, de l'âge, de la maladie ou d'un handicap, elles ne sont pas un échec ; la grâce de Dieu te rejoint dans la faiblesse (2 Corinthiens 12:9).",
    ),
    prompts: [
      L('Tell God where you are trying to carry more than one person can — at work, at home, in your studies or in ministry.', "Dis à Dieu où tu essaies de porter plus qu'une seule personne ne le peut — au travail, à la maison, dans tes études ou dans ton service."),
      L('Ask Him for the humility to share the load, and for trustworthy people to share it with.', "Demande-Lui l'humilité de partager la charge, et des personnes dignes de confiance avec qui la partager."),
      L('Pray for people whose illness, disability, age or caring duties limit the work they can do, that they would be free of shame and valued in their church.', "Prie pour ceux que la maladie, le handicap, l'âge ou le soin d'un proche limitent dans leur travail, afin qu'ils soient libérés de la honte et estimés dans leur Église."),
    ],
    selfPrompt: L(
      'Bring God a failure at work or in your studies that still weighs on you. Tell Him what happened, and ask for grace for what you cannot undo.',
      "Apporte à Dieu un échec dans ton travail ou tes études qui pèse encore sur toi. Dis-Lui ce qui s'est passé, et demande la grâce pour ce que tu ne peux pas défaire.",
    ),
    practice: L(
      'Choose one task you can hand over, share or drop this week, and speak today to the person it concerns.',
      "Choisis une tâche que tu peux confier, partager ou abandonner cette semaine, et parles-en dès aujourd'hui à la personne concernée.",
    ),
    resourceTopics: ['sabbath', 'work', 'leadership'],
  },
  {
    movement: 'rest',
    theme: { en: 'Rich in good deeds', fr: 'Riche en bonnes œuvres', es: 'Ricos en buenas obras', pt: 'Ricos em boas obras', de: 'Reich an guten Werken', ru: 'Богатеть добрыми делами', zh: '在善行上富足', ja: '良い行いに富む', ko: '선한 일에 부요하라', ar: 'أغنياء في الأعمال الصالحة', fa: 'دولتمند در کارهای نیکو', hi: 'भले कामों में धनी', id: 'Kaya dalam kebajikan', sw: 'Matajiri katika matendo mema', tl: 'Mayaman sa mabubuting gawa', am: 'በመልካም ሥራ ባለጠጋ መሆን' },
    ref: '1 Timothy 6:17-19',
    related: ['1 Timothy 6:6-10', '2 Corinthians 8:1-5', 'Luke 12:15-21'],
    reflection: L(
      "Paul does not tell the wealthy to be ashamed of what they have. He tells them not to be proud, and to set their hope not on riches, which are uncertain, but on God, who gives generously and gives good things to enjoy — and to be rich in good deeds, ready to share. A few verses earlier he warns that the love of money has led some away from the faith and into much grief (1 Timothy 6:10). Generosity is not a seed that obliges God to repay you: the Macedonians gave out of deep poverty (2 Corinthians 8:2), because they had first given themselves to the Lord.",
      "Paul ne demande pas aux riches d'avoir honte de ce qu'ils possèdent. Il leur demande de ne pas s'enorgueillir, et de mettre leur espérance non dans des richesses incertaines, mais en Dieu, qui donne avec largesse et donne de bonnes choses dont on peut se réjouir — et d'être riches en bonnes œuvres, prêts à partager. Quelques versets plus haut, il avertit que l'amour de l'argent en a égaré certains loin de la foi et leur a causé bien des tourments (1 Timothée 6:10). La générosité n'est pas une semence qui obligerait Dieu à te rembourser : les Macédoniens ont donné du fond de leur pauvreté (2 Corinthiens 8:2), parce qu'ils s'étaient d'abord donnés eux-mêmes au Seigneur.",
    ),
    prompts: [
      L('Thank God for what your work — paid or unpaid — has provided this month, and ask Him to keep you from clutching it.', "Remercie Dieu pour ce que ton travail, rémunéré ou non, t'a apporté ce mois-ci, et demande-Lui de t'aider à ne pas t'y agripper."),
      L('Ask Him to show you with whom you could share your money, time, skill or contacts this week.', "Demande-Lui de te montrer avec qui tu pourrais partager cette semaine ton argent, ton temps, ton savoir-faire ou tes relations."),
      L('Pray for believers who give generously out of very little, that they would be sustained and never manipulated into giving.', "Prie pour les croyants qui donnent généreusement de leur peu, afin qu'ils soient soutenus et que personne ne les manipule pour les faire donner."),
    ],
    practice: L(
      'Give something away quietly this week — money, a meal, an hour of your skill or your time — without telling anyone.',
      "Donne discrètement quelque chose cette semaine — de l'argent, un repas, une heure de ton savoir-faire ou de ton temps — sans le dire à personne.",
    ),
    resourceTopics: ['generosity', 'finances', 'contentment'],
  },
  {
    movement: 'rest',
    theme: { en: 'A quiet life that bears witness', fr: 'Une vie paisible qui témoigne', es: 'Una vida tranquila que da testimonio', pt: 'Uma vida tranquila que testemunha', de: 'Ein stilles Leben, das Zeugnis gibt', ru: 'Тихая жизнь как свидетельство', zh: '安静生活中的见证', ja: '静かな生活による証し', ko: '조용한 삶으로 드러나는 증거', ar: 'حياة هادئة تشهد', fa: 'زندگی آرامی که شهادت می‌دهد', hi: 'शांत जीवन जो गवाही देता है', id: 'Hidup tenang yang bersaksi', sw: 'Maisha ya utulivu yanayoshuhudia', tl: 'Tahimik na buhay na nagpapatotoo', am: 'የሚመሰክር ጸጥ ያለ ሕይወት' },
    ref: '1 Thessalonians 4:9-12',
    related: ['Acts 18:1-4', 'Colossians 4:5-6', '1 Peter 3:15-16'],
    reflection: L(
      "Paul urges the Thessalonians to aim at a quiet life: attending to their own affairs and working with their hands, so that outsiders would respect the way they live. He practised it himself. In Corinth he made tents alongside Aquila and Priscilla during the week and reasoned in the synagogue every Sabbath (Acts 18:3-4). Witness at work begins with trustworthy work and love for the people beside you. Then words, when they come, can be gracious and wise (Colossians 4:5-6), offered with gentleness and respect (1 Peter 3:15-16) — never forced.",
      "Paul exhorte les Thessaloniciens à viser une vie paisible : s'occuper de leurs propres affaires et travailler de leurs mains, afin que ceux du dehors respectent leur manière de vivre. Il le vivait lui-même. À Corinthe, il fabriquait des tentes avec Aquilas et Priscille pendant la semaine et, chaque sabbat, il discutait à la synagogue (Actes 18:3-4). Le témoignage au travail commence par un travail digne de confiance et par l'amour des personnes qui t'entourent. Puis les paroles, quand elles viennent, peuvent être pleines de grâce et de sagesse (Colossiens 4:5-6), offertes avec douceur et respect (1 Pierre 3:15-16) — jamais imposées.",
    ),
    prompts: [
      L('Pray by name for three people you work, study or live alongside, asking God to draw them to Himself.', "Prie nommément pour trois personnes avec qui tu travailles, étudies ou vis, en demandant à Dieu de les attirer à Lui."),
      L('Ask the Holy Spirit for boldness and gentleness together, and for an open door to speak of Jesus at the right moment.', "Demande au Saint-Esprit à la fois l'audace et la douceur, et une porte ouverte pour parler de Jésus au bon moment."),
      L('Ask God to guard you from anything in your work — shortcuts, gossip, constant complaining — that would make the gospel harder to hear.', "Demande à Dieu de te garder de tout ce qui, dans ton travail — raccourcis, commérages, plaintes continuelles —, rendrait l'Évangile plus difficile à entendre."),
    ],
    practice: L(
      'Look for one natural moment this week to say why you pray or what your faith means to you. If you manage others, never use your position to press anyone about faith.',
      "Guette cette semaine un moment naturel pour dire pourquoi tu pries ou ce que ta foi représente pour toi. Si tu encadres d'autres personnes, n'utilise jamais ta position pour faire pression sur quelqu'un au sujet de la foi.",
    ),
    resourceTopics: ['evangelism', 'work', 'character'],
  },
  {
    movement: 'rest',
    theme: { en: 'Sleep as an act of trust', fr: 'Le sommeil, un acte de confiance', es: 'Dormir como acto de confianza', pt: 'Dormir como ato de confiança', de: 'Schlaf als Akt des Vertrauens', ru: 'Сон как проявление доверия', zh: '睡眠是信靠的表现', ja: '眠りは信頼のしるし', ko: '신뢰의 행위인 잠', ar: 'النوم فعل ثقة', fa: 'خواب، نشانهٔ اعتماد', hi: 'नींद, भरोसे का कार्य', id: 'Tidur sebagai tindakan percaya', sw: 'Usingizi kama tendo la kuamini', tl: 'Pagtulog bilang pagtitiwala', am: 'እንቅልፍ የመታመን ምልክት' },
    ref: 'Psalm 127:1-2',
    related: ['Mark 6:30-32', 'Matthew 11:28-30'],
    reflection: L(
      "This psalm carries the name of Solomon, Israel's great builder, and yet it says that building the house, guarding the city, rising early and toiling late are all in vain unless the Lord is at work. Then it adds that He gives sleep to those He loves — or, as some translations read, provides for them while they sleep. Either way, sleep becomes an act of trust: the world does not depend on your staying awake. Jesus took His worn-out apostles away to rest while the crowds and their needs were still there (Mark 6:31).",
      "Ce psaume porte le nom de Salomon, le grand bâtisseur d'Israël, et pourtant il affirme que bâtir la maison, garder la ville, se lever tôt et peiner tard, tout cela est vain si le Seigneur n'est pas à l'œuvre. Puis il ajoute qu'Il donne le sommeil à ceux qu'Il aime — ou, selon certaines traductions, qu'Il pourvoit à leurs besoins pendant qu'ils dorment. Dans les deux cas, le sommeil devient un acte de confiance : le monde ne dépend pas de ta veille. Jésus a emmené ses apôtres épuisés se reposer à l'écart, alors que les foules et leurs besoins étaient encore là (Marc 6:31).",
    ),
    prompts: [
      L('Confess any way you have treated rest as laziness, or tiredness as a badge of faithfulness.', "Confesse la manière dont tu as pu traiter le repos comme de la paresse, ou la fatigue comme une preuve de fidélité."),
      L('Tonight, before you sleep, hand God the work you have not finished and ask Him for rest.', "Ce soir, avant de dormir, remets à Dieu le travail que tu n'as pas terminé et demande-Lui le repos."),
      L('Pray for night workers, new parents, carers and people holding several jobs, who cannot rest as they need; ask God to sustain them and open ways to relief.', "Prie pour ceux qui travaillent la nuit, les jeunes parents, les aidants et ceux qui cumulent plusieurs emplois sans pouvoir se reposer comme il le faudrait ; demande à Dieu de les soutenir et d'ouvrir des chemins de soulagement."),
    ],
    practice: L(
      'Choose a time to stop work tonight — messages and study included — and keep it. If that is impossible, take one short pause today and spend it with Jesus.',
      "Choisis une heure pour arrêter le travail ce soir — messages et études compris — et tiens-la. Si c'est impossible, prends aujourd'hui une courte pause et passe-la avec Jésus.",
    ),
    safetyNote: L(
      'If exhaustion, sleeplessness or low mood last for weeks, talk to a doctor. Burnout is real and can be treated, and needing help is not a lack of faith.',
      "Si l'épuisement, l'insomnie ou un moral en berne durent depuis des semaines, parles-en à un médecin. L'épuisement professionnel est réel et se soigne, et avoir besoin d'aide n'est pas un manque de foi.",
    ),
    resourceTopics: ['sabbath', 'trust', 'work'],
  },
  {
    movement: 'rest',
    theme: { en: 'Sabbath: a rest that sets free', fr: 'Le sabbat, un repos qui libère', es: 'El día de reposo que libera', pt: 'O sábado, descanso que liberta', de: 'Sabbat: Ruhe, die befreit', ru: 'Суббота — покой, дающий свободу', zh: '安息日：使人自由的安息', ja: '安息日—自由にする休み', ko: '자유롭게 하는 안식일의 쉼', ar: 'السبت: راحة تحرّر', fa: 'سَبَت، آرامیِ رهایی‌بخش', hi: 'सब्त: मुक्त करने वाला विश्राम', id: 'Sabat: perhentian yang membebaskan', sw: 'Sabato: pumziko linaloweka huru', tl: 'Sabbath: pahingang nagpapalaya', am: 'ሰንበት፦ ነጻ የሚያወጣ ዕረፍት' },
    ref: 'Deuteronomy 5:12-15',
    related: ['Exodus 20:8-11', 'Mark 2:23-28'],
    reflection: L(
      "The two tellings of the Sabbath commandment give two reasons. In Exodus, God rested after creating; in Deuteronomy, Israel must remember that they were slaves in Egypt — people who were never allowed to stop. So the rest reaches servants, foreigners and even animals: no one's day off is to be bought with someone else's exhaustion. Jesus taught that the Sabbath exists for people's good, not the reverse, and called Himself its Lord (Mark 2:27-28). Christians differ on how the command applies today (Romans 14:5-6), but a weekly rhythm of stopping, worship and delight is a gift of freedom, not a burden of guilt.",
      "Les deux formulations du commandement du sabbat donnent deux raisons. Dans l'Exode, Dieu s'est reposé après la création ; dans le Deutéronome, Israël doit se souvenir qu'il a été esclave en Égypte — un peuple à qui l'on ne permettait jamais de s'arrêter. Le repos s'étend donc aux serviteurs, aux étrangers et même aux bêtes : le repos des uns ne doit pas se payer de l'épuisement des autres. Jésus a enseigné que le sabbat existe pour le bien de l'homme, et non l'inverse, et Il s'en est dit le Seigneur (Marc 2:27-28). Les chrétiens divergent sur l'application de ce commandement aujourd'hui (Romains 14:5-6), mais un rythme hebdomadaire d'arrêt, d'adoration et de joie est un don de liberté, non un fardeau de culpabilité.",
    ),
    prompts: [
      L('Thank God that your worth does not depend on how much you produce, and that He invites you to stop.', "Remercie Dieu : ta valeur ne dépend pas de ce que tu produis, et Il t'invite à t'arrêter."),
      L('Ask Him to show you what a weekly day or half-day of rest could look like in your present season of life.', "Demande-Lui de te montrer à quoi pourrait ressembler, dans ta saison de vie actuelle, un jour ou une demi-journée de repos chaque semaine."),
      L("Pray for workers who get no rest because others' convenience depends on them, and ask how your own habits could lighten their load.", "Prie pour les travailleurs privés de repos parce que le confort des autres dépend d'eux, et demande à Dieu comment tes propres habitudes pourraient alléger leur charge."),
    ],
    practice: L(
      'Plan your next day or half-day of rest now: what you will stop, where you will worship, and what you will enjoy — alone or with others.',
      "Planifie dès maintenant ton prochain jour ou ta prochaine demi-journée de repos : ce que tu arrêteras, où tu adoreras Dieu, et ce qui te réjouira, seul ou avec d'autres.",
    ),
    resourceTopics: ['sabbath', 'spiritual-rhythms', 'justice'],
  },
  {
    movement: 'rest',
    theme: { en: 'Holding your plans with open hands', fr: "Tenir tes projets d'une main ouverte", es: 'Tus planes en manos abiertas', pt: 'Seus planos em mãos abertas', de: 'Pläne mit offenen Händen halten', ru: 'Держать планы в открытых ладонях', zh: '敞开双手交托你的计划', ja: '計画を開いた手で持つ', ko: '열린 손으로 계획을 붙들기', ar: 'خططك بين يدين مفتوحتين', fa: 'برنامه‌هایت در دستان باز', hi: 'खुले हाथों में अपनी योजनाएँ', id: 'Memegang rencana dengan tangan terbuka', sw: 'Kushika mipango kwa mikono iliyo wazi', tl: 'Hawak ang mga plano sa bukas na kamay', am: 'ዕቅድን በተከፈተ እጅ መያዝ' },
    ref: 'James 4:13-17',
    related: ['John 21:15-19', 'Ecclesiastes 3:9-13'],
    reflection: L(
      "James does not rebuke the traders for planning a year of business; he rebukes them for speaking as if tomorrow belonged to them. Life is a mist, so every plan is held under the Lord's will (James 4:15). Some of your plans will succeed, some will fail, and some will be taken from you. After a night of empty nets (John 21:3) and the far deeper failure of his denials, Peter met the risen Jesus by the lake. He was restored, told that one day others would lead him where he did not want to go, and called once more to follow (John 21:18-19).",
      "Jacques ne reproche pas aux marchands de prévoir une année d'affaires ; il leur reproche de parler comme si demain leur appartenait. La vie est une vapeur : tout projet se tient donc sous la volonté du Seigneur (Jacques 4:15). Certains de tes projets réussiront, d'autres échoueront, d'autres encore te seront retirés. Après une nuit de filets vides (Jean 21:3) et l'échec bien plus profond de ses reniements, Pierre retrouva Jésus ressuscité au bord du lac. Il fut restauré, apprit qu'un jour d'autres le conduiraient là où il ne voudrait pas aller, et fut appelé de nouveau à suivre (Jean 21:18-19).",
    ),
    prompts: [
      L('Lay your plans for work, study or retirement before God one by one, and tell Him you want His will above your own.', "Dépose devant Dieu, un par un, tes projets de travail, d'études ou de retraite, et dis-Lui que tu veux sa volonté plus que la tienne."),
      L('Hand Him the successes you are proud of and the failures you regret, and ask Him to hold both.', "Remets-Lui les réussites dont tu es fier et les échecs que tu regrettes, et demande-Lui de tenir les uns comme les autres."),
      L('Pray for someone whose working life has been cut short by illness, redundancy, injustice or age, that they would find their calling in Christ still whole.', "Prie pour quelqu'un dont la vie professionnelle a été interrompue par la maladie, un licenciement, une injustice ou l'âge, afin qu'il découvre que son appel en Christ demeure entier."),
    ],
    selfPrompt: L(
      "This plan began with work as part of God's good design. Tell Jesus what you want to carry into your work tomorrow, and ask Him to keep calling you to follow Him there.",
      "Ce plan a commencé avec le travail comme partie du bon dessein de Dieu. Dis à Jésus ce que tu veux emporter dans ton travail demain, et demande-Lui de continuer à t'appeler à Le suivre là aussi.",
    ),
    practice: L(
      'Write one sentence that hands your work — paid or unpaid — back to God, and pray it at the start of each working day this week.',
      "Écris une phrase qui remet ton travail, rémunéré ou non, entre les mains de Dieu, et prie-la au début de chaque journée de travail cette semaine.",
    ),
    resourceTopics: ['calling', 'discipleship', 'work'],
  },
];
