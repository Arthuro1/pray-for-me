// The 30 days of "Praying for those who don't yet believe" (see
// ./prayingForUnbelievers.js for the plan meta, the movements and the
// guardrails this content is held to).
//
// Day shape follows ./preparingInPrayerDays.js: `theme` in all 16 languages,
// a PRIMARY `ref` plus up to three `related` passages (references only — never
// Bible text), a reflection, three prayer prompts, a `selfPrompt` on EVERY day
// (this is an intercession plan: each day turns the prayer back on the one
// praying), one small practice, an occasional `safetyNote`, and
// `resourceTopics`. Prose is authored in en + fr; the other languages fall back
// through pick().
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Movement 1 · God's heart for the lost (days 1–7) ─────────────────────
  {
    movement: 'heart',
    theme: { en: 'The God who goes searching', fr: 'Le Dieu qui part à la recherche', es: 'El Dios que sale a buscar', pt: 'O Deus que sai à procura', de: 'Der Gott, der sucht', ru: 'Бог, Который ищет', zh: '寻找失丧者的神', ja: '捜し求める神', ko: '찾아 나서시는 하나님', ar: 'الله الذي يبحث عن الضال', fa: 'خدایی که به جست‌وجو می‌رود', hi: 'खोजने वाला परमेश्वर', id: 'Allah yang mencari', sw: 'Mungu anayetafuta', tl: 'Ang Diyos na naghahanap', am: 'የሚፈልግ አምላክ' },
    ref: 'Luke 15:1-10',
    related: ['Ezekiel 34:11-16'],
    reflection: L(
      "Luke says Jesus told these stories because religious leaders were grumbling that He welcomed sinners and ate with them. The shepherd goes after the one sheep until he finds it; the woman sweeps until the coin turns up; both call their neighbours to celebrate. Before you pray for anyone, notice the order: the searching starts with God, and heaven rejoices when one person turns home. Your prayer joins a search already under way.",
      "Luc précise que Jésus a raconté ces histoires parce que des responsables religieux murmuraient : Il accueillait les pécheurs et mangeait avec eux. Le berger part après la brebis jusqu'à ce qu'il la trouve ; la femme balaie jusqu'à retrouver la pièce ; tous deux invitent leurs voisins à se réjouir. Avant de prier pour qui que ce soit, remarque l'ordre : la recherche commence en Dieu, et le ciel se réjouit quand une seule personne revient. Ta prière rejoint une recherche déjà en cours.",
    ),
    prompts: [
      L('Thank God that He goes looking for people long before anyone looks for Him.', "Remercie Dieu : Il part à la recherche des gens bien avant que quiconque Le cherche."),
      L('Name before Him, one by one, the people you will carry in prayer these thirty days.', "Nomme devant Lui, un par un, les personnes que tu porteras dans la prière pendant ces trente jours."),
      L("Ask Him to give you a share in heaven's joy over one person who turns to Him, rather than in the onlookers' grumbling.", "Demande-Lui de te donner part à la joie du ciel pour une seule personne qui revient à Lui, plutôt qu'aux murmures des spectateurs."),
    ],
    selfPrompt: L(
      'Ask God to search your motives as you begin: do you long for these people to know Christ, or mostly to agree with you?',
      "Demande à Dieu de sonder tes motivations au départ : désires-tu que ces personnes connaissent Christ, ou surtout qu'elles te donnent raison ?",
    ),
    practice: L(
      'Write the first names of one to three people who do not yet know Christ and whom you will pray for during this plan. Keep the list private.',
      "Écris le prénom d'une à trois personnes qui ne connaissent pas encore Christ et pour qui tu prieras pendant ce parcours. Garde cette liste pour toi.",
    ),
    resourceTopics: ['intercession', 'gospel'],
  },
  {
    movement: 'heart',
    theme: { en: 'Called by name in the crowd', fr: 'Appelé par son nom dans la foule', es: 'Llamado por su nombre entre la multitud', pt: 'Chamado pelo nome no meio da multidão', de: 'Mitten in der Menge beim Namen gerufen', ru: 'Названный по имени в толпе', zh: '在人群中被叫出名字', ja: '群衆の中で名を呼ばれる', ko: '군중 속에서 이름이 불리다', ar: 'مدعوٌّ باسمه وسط الجموع', fa: 'در میان جمعیت، به نام خوانده شد', hi: 'भीड़ में नाम से पुकारा गया', id: 'Dipanggil namanya di tengah orang banyak', sw: 'Kuitwa kwa jina katikati ya umati', tl: 'Tinawag sa pangalan sa gitna ng karamihan', am: 'በሕዝብ መካከል በስም መጠራት' },
    ref: 'Luke 19:1-10',
    related: ['Luke 5:27-32'],
    reflection: L(
      "Zacchaeus was rich, a chief tax collector and widely despised; short and curious, he climbed a tree. Jesus stopped, called him by name and invited Himself to his house while the crowd muttered. Change followed welcome: Zacchaeus promised half his goods to the poor and fourfold repayment to anyone he had cheated. Jesus summed up His mission in one line — He came to seek and to save what was lost. No one you pray for is too compromised for Him to stop under their tree.",
      "Zachée était riche, chef des collecteurs d'impôts et méprisé de tous ; petit et curieux, il est monté dans un arbre. Jésus s'est arrêté, l'a appelé par son nom et s'est invité chez lui, tandis que la foule murmurait. Le changement a suivi l'accueil : Zachée a promis la moitié de ses biens aux pauvres et le quadruple à ceux qu'il avait lésés. Jésus a résumé Sa mission en une phrase : Il est venu chercher et sauver ce qui était perdu. Aucune des personnes pour qui tu pries n'est trop compromise pour qu'Il s'arrête sous son arbre.",
    ),
    prompts: [
      L('Pray for each person on your heart by name, as Jesus called Zacchaeus by his.', "Prie pour chaque personne que tu portes en la nommant, comme Jésus a appelé Zachée par son nom."),
      L('Ask God to meet them where their curiosity already is — a question, a doubt, a longing they have mentioned.', "Demande à Dieu de les rejoindre là où leur curiosité se trouve déjà — une question, un doute, un désir qu'ils ont exprimé."),
      L("Thank Jesus that His welcome came before Zacchaeus changed, not after.", "Remercie Jésus : Son accueil est venu avant le changement de Zachée, non après."),
    ],
    selfPrompt: L(
      'Is there someone you have quietly written off as too far gone? Confess it, and ask for the eyes Jesus had in Jericho.',
      "Y a-t-il quelqu'un que tu as discrètement jugé perdu d'avance ? Confesse-le, et demande le regard que Jésus avait à Jéricho.",
    ),
    practice: L(
      'This week, share a meal or a coffee with someone outside your church circle, simply to enjoy their company.',
      "Cette semaine, partage un repas ou un café avec quelqu'un d'extérieur à ton cercle d'Église, simplement pour apprécier sa compagnie.",
    ),
    resourceTopics: ['gospel', 'friendship', 'hospitality'],
  },
  {
    movement: 'heart',
    theme: { en: 'Sent to save, not to condemn', fr: 'Envoyé pour sauver, non pour condamner', es: 'Enviado para salvar, no para condenar', pt: 'Enviado para salvar, não para condenar', de: 'Gesandt, um zu retten, nicht zu richten', ru: 'Послан спасти, а не судить', zh: '差来拯救，不是定罪', ja: '裁くためでなく救うために', ko: '정죄가 아닌 구원을 위해 보내심', ar: 'أُرسل ليخلِّص لا ليدين', fa: 'فرستاده شد تا نجات دهد، نه محکوم کند', hi: 'दोषी ठहराने नहीं, उद्धार करने भेजा गया', id: 'Diutus untuk menyelamatkan, bukan menghakimi', sw: 'Alitumwa kuokoa, si kuhukumu', tl: 'Isinugo upang magligtas, hindi upang humatol', am: 'ለማዳን እንጂ ለመፍረድ አልተላከም' },
    ref: 'John 3:14-21',
    related: ['Numbers 21:4-9', '1 John 4:9-10'],
    reflection: L(
      "Jesus points Nicodemus back to the bronze serpent Moses lifted up in the wilderness: whoever looked at it lived. So the Son would be lifted up on the cross, the gift of a God who loved the world. He was not sent to condemn; yet Jesus is honest that people can prefer darkness, because light exposes. Pray with both truths in view: the cross is God's rescue, and no one is dragged into the light by force.",
      "Jésus renvoie Nicodème au serpent de bronze que Moïse avait élevé dans le désert : quiconque le regardait vivait. Ainsi le Fils serait élevé sur la croix, don d'un Dieu qui a aimé le monde. Il n'a pas été envoyé pour condamner ; pourtant Jésus reconnaît franchement que l'on peut préférer les ténèbres, parce que la lumière dévoile. Prie en gardant ces deux vérités ensemble : la croix est le sauvetage de Dieu, et personne n'est traîné de force dans la lumière.",
    ),
    prompts: [
      L('Thank God that He gave His Son for a world that had not asked for Him.', "Remercie Dieu d'avoir donné Son Fils pour un monde qui ne L'avait pas demandé."),
      L('Pray that the people you carry would see Jesus lifted up — His love at the cross, not only the rules they associate with Christians.', "Prie pour que les personnes que tu portes voient Jésus élevé — Son amour à la croix, et pas seulement les règles qu'elles associent aux chrétiens."),
      L('Ask the Father to let the light feel like mercy to them rather than exposure.', "Demande au Père que la lumière soit pour elles une miséricorde plutôt qu'une mise à nu."),
    ],
    selfPrompt: L(
      'Where do you still hide from the light yourself? Bring it to the One who came not to condemn.',
      "Où te caches-tu encore toi-même de la lumière ? Apporte-le à Celui qui n'est pas venu condamner.",
    ),
    practice: L(
      'Read John 3:16-17 slowly today, then put it into one sentence of your own, as you would say it to a friend over coffee.',
      "Lis lentement Jean 3.16-17 aujourd'hui, puis redis-le en une phrase avec tes propres mots, comme tu le dirais à un ami autour d'un café.",
    ),
    resourceTopics: ['gospel', 'cross'],
  },
  {
    movement: 'heart',
    theme: { en: 'Seeing crowds with His compassion', fr: 'Voir les foules avec Sa compassion', es: 'Ver a las multitudes con su compasión', pt: 'Ver as multidões com a sua compaixão', de: 'Menschen mit seinem Erbarmen sehen', ru: 'Видеть людей с Его состраданием', zh: '以祂的怜悯看待众人', ja: '主のあわれみで人々を見る', ko: '주님의 긍휼로 무리를 보라', ar: 'أن نرى الجموع بعين رحمته', fa: 'دیدن مردم با شفقت او', hi: 'उसकी करुणा से भीड़ को देखना', id: 'Melihat orang banyak dengan belas kasihan-Nya', sw: 'Kuwaona watu kwa huruma yake', tl: 'Tingnan ang mga tao nang may habag Niya', am: 'ሰዎችን በእርሱ ርኅራኄ ማየት' },
    ref: 'Matthew 9:35-38',
    related: ['Mark 6:34', 'Matthew 10:1-8'],
    reflection: L(
      "Jesus was travelling, teaching and healing when He looked at the crowds and was moved: they were worn out and defenceless, like sheep with no shepherd. He did not scold them for wandering. The first prayer He gave His disciples for them was a request for workers — and in the very next chapter He sent those same disciples out. Praying for the harvest may end with being sent into it.",
      "Jésus parcourait les villes, enseignait et guérissait lorsqu'Il a regardé les foules et en a été ému : elles étaient épuisées et sans défense, comme des brebis sans berger. Il ne leur a pas reproché de s'égarer. La première prière qu'Il a confiée à Ses disciples à leur sujet était une demande d'ouvriers — et, dès le chapitre suivant, Il a envoyé ces mêmes disciples. Prier pour la moisson peut finir par t'y envoyer.",
    ),
    prompts: [
      L('Ask Jesus to let you see the people around you as He saw those crowds — weary and scattered, not simply wrong.', "Demande à Jésus de te faire voir les gens autour de toi comme Il voyait ces foules — las et dispersés, pas simplement dans l'erreur."),
      L('Pray to the Lord of the harvest to send workers into the places where the people you love live, work and study.', "Prie le Maître de la moisson d'envoyer des ouvriers là où vivent, travaillent et étudient ceux que tu aimes."),
      L('Bring Him one specific burden you know someone on your list is carrying.', "Apporte-Lui un fardeau précis que tu sais porté par une personne de ta liste."),
    ],
    selfPrompt: L(
      'Tell Jesus honestly whether you are willing to be one of the workers you are asking Him to send.',
      "Dis honnêtement à Jésus si tu es prêt à être l'un des ouvriers que tu Lui demandes d'envoyer.",
    ),
    practice: L(
      'On a commute or a walk today, pray silently for three strangers you pass, asking God to send each of them someone who knows Him.',
      "Pendant un trajet ou une marche aujourd'hui, prie en silence pour trois inconnus que tu croises, en demandant à Dieu d'envoyer à chacun quelqu'un qui Le connaît.",
    ),
    resourceTopics: ['intercession', 'mission'],
  },
  {
    movement: 'heart',
    theme: { en: 'God desires all people to be saved', fr: 'Dieu veut que tous soient sauvés', es: 'Dios quiere que todos sean salvos', pt: 'Deus deseja que todos sejam salvos', de: 'Gott will, dass alle gerettet werden', ru: 'Бог хочет, чтобы все спаслись', zh: '神愿意万人得救', ja: 'すべての人の救いを望む神', ko: '모든 사람의 구원을 원하시는 하나님', ar: 'الله يريد أن جميع الناس يخلصون', fa: 'خدا می‌خواهد همه نجات یابند', hi: 'परमेश्वर चाहता है कि सब उद्धार पाएँ', id: 'Allah menghendaki semua orang diselamatkan', sw: 'Mungu anataka watu wote waokolewe', tl: 'Nais ng Diyos na maligtas ang lahat', am: 'እግዚአብሔር ሰዎች ሁሉ እንዲድኑ ይወዳል' },
    ref: '1 Timothy 2:1-6',
    related: ['Ezekiel 33:11'],
    reflection: L(
      "Paul asks for prayer for all people, naming even kings and those in authority — rulers who, when he wrote, did not share the faith. His reason is God Himself: God our Saviour desires all people to be saved and to come to know the truth, and Christ gave Himself as a ransom for all. Christians explain differently how that desire relates to who actually comes. Paul's instruction is simpler: pray widely, because God's heart is wide.",
      "Paul demande que l'on prie pour tous les hommes, en nommant même les rois et ceux qui exercent l'autorité — des dirigeants qui, à l'époque, ne partageaient pas la foi. Sa raison, c'est Dieu Lui-même : Dieu notre Sauveur veut que tous les hommes parviennent au salut et à la connaissance de la vérité, et Christ s'est donné en rançon pour tous. Les chrétiens expliquent diversement comment ce désir s'articule avec ceux qui viennent réellement. La consigne de Paul est plus simple : prie largement, car le cœur de Dieu est large.",
    ),
    prompts: [
      L('Pray for leaders in your city and country who do not know Christ: wisdom for them, and peace for the people they serve.', "Prie pour les dirigeants de ta ville et de ton pays qui ne connaissent pas Christ : la sagesse pour eux, et la paix pour ceux qu'ils servent."),
      L('Thank Jesus, the one mediator between God and humanity, that He gave Himself as a ransom for all.', "Remercie Jésus, l'unique médiateur entre Dieu et les hommes, de s'être donné en rançon pour tous."),
      L('Widen your prayer today to someone you would never have thought to pray for.', "Élargis ta prière aujourd'hui à quelqu'un pour qui tu n'aurais jamais pensé prier."),
    ],
    selfPrompt: L(
      'Ask God to widen your own heart wherever it has grown narrow toward a group of people.',
      "Demande à Dieu d'élargir ton propre cœur partout où il s'est rétréci envers un groupe de personnes.",
    ),
    practice: L(
      'Choose one public figure you find hard to like, and pray for them by name each day this week.',
      "Choisis une personnalité publique que tu as du mal à apprécier, et prie pour elle en la nommant chaque jour de cette semaine.",
    ),
    resourceTopics: ['intercession', 'prayer', 'gospel'],
  },
  {
    movement: 'heart',
    theme: { en: "Paul's anguish for his people", fr: "L'angoisse de Paul pour les siens", es: 'La angustia de Pablo por los suyos', pt: 'A angústia de Paulo pelos seus', de: 'Paulus trauert um sein Volk', ru: 'Скорбь Павла о своём народе', zh: '保罗为同胞忧伤', ja: '同胞を思うパウロの痛み', ko: '동족을 향한 바울의 근심', ar: 'حزن بولس على أبناء شعبه', fa: 'اندوه پولس برای قوم خود', hi: 'अपने लोगों के लिए पौलुस का दुःख', id: 'Dukacita Paulus bagi bangsanya', sw: 'Huzuni ya Paulo kwa watu wake', tl: 'Ang dalamhati ni Pablo para sa kanyang bayan', am: 'ጳውሎስ ለወገኖቹ ያዘነው ሐዘን' },
    ref: 'Romans 9:1-5',
    related: ['Romans 10:1'],
    reflection: L(
      "Paul opens this demanding section of Romans not with an argument but with grief: great sorrow and unceasing anguish for his own people, so deep that he could wish himself cut off for their sake. Notice how he speaks of them — he lists with honour everything God had entrusted to them. The apostle who goes on to write about God's sovereign choice also prays plainly for their salvation. Grief and respect, not contempt, are the soil of this kind of prayer.",
      "Paul ouvre cette section exigeante de l'épître aux Romains non par un argument mais par un chagrin : une grande tristesse et une douleur continuelle pour son propre peuple, au point de souhaiter être lui-même retranché à sa place. Remarque comment il parle d'eux : il énumère avec honneur tout ce que Dieu leur avait confié. L'apôtre qui écrit ensuite sur le choix souverain de Dieu prie aussi, très simplement, pour leur salut. Le chagrin et le respect, non le mépris, sont le terreau de cette prière.",
    ),
    prompts: [
      L('Tell God honestly how much — or how little — it grieves you that people you love do not know Christ.', "Dis honnêtement à Dieu combien — ou combien peu — cela t'attriste que des personnes que tu aimes ne connaissent pas Christ."),
      L("Thank Him for what is good in each person you pray for, naming it as Paul named his people's gifts.", "Remercie-Le pour ce qui est bon chez chaque personne pour qui tu pries, en le nommant comme Paul a nommé les dons de son peuple."),
      L('Pray for relatives who do not share your faith, with the patience of someone who will love them either way.', "Prie pour les membres de ta famille qui ne partagent pas ta foi, avec la patience de quelqu'un qui les aimera quoi qu'il arrive."),
    ],
    selfPrompt: L(
      'Ask God to guard your heart from contempt toward those who see the world differently from you.',
      "Demande à Dieu de garder ton cœur du mépris envers ceux qui voient le monde autrement que toi.",
    ),
    practice: L(
      'Write one sentence of honest thanks for each person on your list — something you genuinely admire in them.',
      "Écris une phrase de reconnaissance sincère pour chaque personne de ta liste — une chose que tu admires vraiment chez elle.",
    ),
    resourceTopics: ['intercession', 'family'],
  },
  {
    movement: 'heart',
    theme: { en: 'We too were once far off', fr: 'Nous aussi, nous étions loin', es: 'También nosotros estábamos lejos', pt: 'Nós também estávamos longe', de: 'Auch wir waren einmal fern', ru: 'И мы когда-то были далеко', zh: '我们从前也远离神', ja: '私たちもかつては遠く離れていた', ko: '우리도 한때 멀리 있었다', ar: 'نحن أيضًا كنّا بعيدين', fa: 'ما نیز روزی دور بودیم', hi: 'हम भी कभी दूर थे', id: 'Kita pun dahulu jauh', sw: 'Sisi pia tulikuwa mbali', tl: 'Tayo rin ay dating malayo', am: 'እኛም በአንድ ወቅት ሩቅ ነበርን' },
    ref: 'Ephesians 2:1-10',
    related: ['Ephesians 2:13', 'Titus 3:3-7'],
    reflection: L(
      "Paul is not describing outsiders here; he is describing his readers, and himself — dead in trespasses, following the course of this world, by nature under wrath like everyone else. Then comes God's mercy, rich and undeserved, making them alive with Christ. Titus 3 says the same: we too were once foolish and astray, until God's kindness appeared. Whoever prays for unbelievers stands on the same ground they do: grace, and nothing else.",
      "Paul ne décrit pas ici les gens du dehors ; il décrit ses lecteurs, et lui-même — morts par leurs fautes, suivant le train de ce monde, par nature sous la colère comme les autres. Puis vient la miséricorde de Dieu, riche et imméritée, qui les rend vivants avec Christ. Tite 3 dit la même chose : nous aussi, nous étions autrefois insensés et égarés, jusqu'à ce que la bonté de Dieu se manifeste. Celui qui prie pour ceux qui ne croient pas se tient sur le même terrain qu'eux : la grâce, et rien d'autre.",
    ),
    prompts: [
      L('Thank God for the specific ways His mercy reached you before you were looking for Him.', "Remercie Dieu pour les façons concrètes dont Sa miséricorde t'a rejoint avant que tu Le cherches."),
      L('Pray for the people on your heart as fellow human beings who need the same grace, not as projects to complete.', "Prie pour les personnes que tu portes comme pour des semblables qui ont besoin de la même grâce, et non comme des projets à mener à bien."),
      L('Ask Him to make the kindness that appeared in Christ visible to them this week.', "Demande-Lui de rendre visible pour elles, cette semaine, la bonté qui est apparue en Christ."),
    ],
    selfPrompt: L(
      'Where do you feel superior to the people you pray for? Confess it and receive grace again.',
      "En quoi te sens-tu supérieur aux personnes pour qui tu pries ? Confesse-le et reçois de nouveau la grâce.",
    ),
    practice: L(
      "Write three lines about how you came to faith — what drew you, who helped, what you still don't fully understand — and keep them for day 18.",
      "Écris trois lignes sur la manière dont tu es venu à la foi — ce qui t'a attiré, qui t'a aidé, ce que tu ne comprends toujours pas entièrement — et garde-les pour le jour 18.",
    ),
    resourceTopics: ['gospel', 'intercession'],
  },

  // ── Movement 2 · Pray for understanding and repentance (days 8–14) ───────
  {
    movement: 'understanding',
    theme: { en: 'Light for minds that cannot yet see', fr: 'La lumière pour des yeux encore voilés', es: 'Luz para mentes que aún no ven', pt: 'Luz para mentes que ainda não veem', de: 'Licht für Augen, die noch nicht sehen', ru: 'Свет для тех, кто ещё не видит', zh: '照亮尚未看见的心', ja: 'まだ見えない心に光を', ko: '아직 보지 못하는 마음에 빛을', ar: 'نورٌ لأذهانٍ لم تُبصر بعد', fa: 'نوری برای ذهن‌هایی که هنوز نمی‌بینند', hi: 'जो अभी नहीं देखते उनके लिए ज्योति', id: 'Terang bagi pikiran yang belum melihat', sw: 'Nuru kwa akili ambazo bado hazioni', tl: 'Liwanag para sa isipang hindi pa nakakakita', am: 'ገና ለማያዩ አእምሮዎች ብርሃን' },
    ref: '2 Corinthians 4:1-6',
    related: ['2 Corinthians 3:14-18'],
    reflection: L(
      "Paul admits that for some people the gospel is veiled, and he names a spiritual blindness deeper than stubbornness. His answer is not a technique. He refuses deception and underhanded methods, sets out the truth plainly, and preaches Jesus as Lord rather than himself. Then he points back to creation: the God who first called light out of darkness is the One who made His light shine in Paul's own heart. Only God gives that sight; you can ask for it, and keep your own witness honest.",
      "Paul reconnaît que, pour certains, l'Évangile reste voilé, et il nomme un aveuglement spirituel plus profond que l'entêtement. Sa réponse n'est pas une technique. Il refuse la ruse et les procédés cachés, expose simplement la vérité et prêche Jésus comme Seigneur plutôt que lui-même. Puis il renvoie à la création : le Dieu qui a d'abord fait jaillir la lumière des ténèbres est Celui qui a fait briller Sa lumière dans le cœur de Paul. Dieu seul donne cette vue ; tu peux la Lui demander, et garder ton propre témoignage honnête.",
    ),
    prompts: [
      L('Ask God to lift the veil for the people you carry, so they may see the glory of Christ for themselves.', "Demande à Dieu d'ôter le voile pour les personnes que tu portes, afin qu'elles voient par elles-mêmes la gloire de Christ."),
      L('Pray soberly against every lie that keeps them from Jesus, and leave that battle in God’s hands rather than in a formula.', "Prie avec sobriété contre tout mensonge qui les tient loin de Jésus, et laisse ce combat entre les mains de Dieu plutôt que dans une formule."),
      L('Thank Him for the day His light first reached your own heart.', "Remercie-Le pour le jour où Sa lumière a atteint ton propre cœur."),
    ],
    selfPrompt: L(
      'Ask God to show you any pressure, exaggeration or hidden agenda in the way you talk about faith, and to make you plain and truthful.',
      "Demande à Dieu de te montrer toute pression, exagération ou intention cachée dans ta manière de parler de la foi, et de te rendre simple et vrai.",
    ),
    practice: L(
      'Before your next conversation with someone on your list, pray one sentence: Lord, let them see Jesus, not me.',
      "Avant ta prochaine conversation avec une personne de ta liste, prie une seule phrase : Seigneur, qu'elle voie Jésus, et non moi.",
    ),
    resourceTopics: ['gospel', 'evangelism', 'intercession'],
  },
  {
    movement: 'understanding',
    theme: { en: 'A heart the Lord opens', fr: 'Un cœur que le Seigneur ouvre', es: 'Un corazón que el Señor abre', pt: 'Um coração que o Senhor abre', de: 'Ein Herz, das der Herr öffnet', ru: 'Сердце, которое открывает Господь', zh: '主开启的心', ja: '主が開かれる心', ko: '주께서 여시는 마음', ar: 'قلبٌ يفتحه الرب', fa: 'دلی که خداوند می‌گشاید', hi: 'वह हृदय जिसे प्रभु खोलता है', id: 'Hati yang dibuka oleh Tuhan', sw: 'Moyo ambao Bwana anaufungua', tl: 'Pusong binubuksan ng Panginoon', am: 'ጌታ የሚከፍተው ልብ' },
    ref: 'Acts 16:11-15',
    related: ['Luke 24:44-45'],
    reflection: L(
      "Outside Philippi, Paul went looking for a place of prayer by the river, sat down and talked with the women gathered there. Lydia, a trader in purple cloth, already worshipped God and was listening. Luke then says it was the Lord who opened her heart to pay attention to what Paul said. Both parts matter: Paul turned up and spoke plainly; God did what no speaker can. Soon Lydia's home was open to the apostles as well.",
      "Hors de Philippes, Paul est allé chercher un lieu de prière au bord de la rivière ; il s'est assis et a parlé avec les femmes réunies là. Lydie, marchande de pourpre, adorait déjà Dieu et écoutait. Luc précise alors que c'est le Seigneur qui a ouvert son cœur pour qu'elle soit attentive aux paroles de Paul. Les deux comptent : Paul s'est rendu présent et a parlé simplement ; Dieu a fait ce qu'aucun orateur ne peut faire. Bientôt, la maison de Lydie s'est ouverte, elle aussi, aux apôtres.",
    ),
    prompts: [
      L('Ask the Lord to open the heart of each person you pray for, as He opened Lydia’s.', "Demande au Seigneur d'ouvrir le cœur de chaque personne pour qui tu pries, comme Il a ouvert celui de Lydie."),
      L('Pray for the seekers you know — people already asking about God — that they would meet someone who can talk with them simply.', "Prie pour ceux qui cherchent autour de toi — des personnes qui s'interrogent déjà sur Dieu — afin qu'elles rencontrent quelqu'un qui puisse leur parler simplement."),
      L('Thank God that opening a heart is His work, so no one depends on your eloquence.', "Remercie Dieu : ouvrir un cœur est Son œuvre, et personne ne dépend de ton éloquence."),
    ],
    selfPrompt: L(
      'Ask Him to open your own heart again to His Word, so that you speak from what you are receiving.',
      "Demande-Lui d'ouvrir de nouveau ton propre cœur à Sa Parole, afin que tu parles de ce que tu reçois toi-même.",
    ),
    practice: L(
      'Notice where people already gather in your week — a café, the school gate, a club — and go there once this week simply to be present, friendly and available.',
      "Repère où les gens se retrouvent déjà dans ta semaine — un café, la sortie de l'école, un club — et vas-y une fois cette semaine, simplement pour être présent, aimable et disponible.",
    ),
    resourceTopics: ['intercession', 'evangelism', 'holy-spirit'],
  },
  {
    movement: 'understanding',
    theme: { en: 'Drawn to Jesus by the Father', fr: 'Attiré vers Jésus par le Père', es: 'Atraídos a Jesús por el Padre', pt: 'Atraídos a Jesus pelo Pai', de: 'Vom Vater zu Jesus gezogen', ru: 'Отец привлекает к Иисусу', zh: '父吸引人归向耶稣', ja: '父がイエスへと引き寄せる', ko: '아버지께서 예수께로 이끄심', ar: 'الآب يجتذب إلى يسوع', fa: 'پدر به سوی عیسی جذب می‌کند', hi: 'पिता यीशु की ओर खींचता है', id: 'Ditarik Bapa kepada Yesus', sw: 'Baba huwavuta kwa Yesu', tl: 'Inilalapit ng Ama kay Jesus', am: 'አብ ወደ ኢየሱስ ይስባል' },
    ref: 'John 6:35-45',
    related: ['John 12:32'],
    reflection: L(
      "Jesus holds two things together in one breath. He invites everyone: whoever comes to Him He will never turn away, and all who look to the Son and believe receive eternal life. He also says no one can come unless the Father draws them. Christians have long disagreed about how that drawing works, and this plan does not settle it. Both sides agree on what matters for prayer: coming to Christ is never a human achievement, so we ask the Father to draw, and we keep inviting.",
      "Jésus tient deux choses ensemble, d'un même souffle. Il invite tout le monde : celui qui vient à Lui, Il ne le rejettera pas, et quiconque regarde au Fils et croit reçoit la vie éternelle. Il dit aussi que personne ne peut venir si le Père ne l'attire. Les chrétiens débattent depuis longtemps de la manière dont agit cette attirance, et ce parcours ne tranche pas la question. Tous s'accordent sur l'essentiel pour la prière : venir à Christ n'est jamais un exploit humain ; alors nous demandons au Père d'attirer, et nous continuons d'inviter.",
    ),
    prompts: [
      L('Ask the Father to draw each person you carry toward Jesus, in His way and His time.', "Demande au Père d'attirer vers Jésus chaque personne que tu portes, à Sa manière et en Son temps."),
      L('Thank Jesus that He turns away no one who comes to Him.', "Remercie Jésus : Il ne rejette aucun de ceux qui viennent à Lui."),
      L('Wherever you fear that everything depends on you, hand that weight back to the Father in prayer.', "Là où tu crains que tout dépende de toi, remets ce poids au Père dans la prière."),
    ],
    selfPrompt: L(
      'Tell the Father honestly whether you have drifted into despair or into presumption about the people you love, and ask Him for quiet trust.',
      "Dis honnêtement au Père si tu as glissé vers le découragement ou vers la présomption au sujet de ceux que tu aimes, et demande-Lui une confiance paisible.",
    ),
    practice: L(
      'Read John 6:35-40 aloud, then turn Jesus’ invitation into a prayer for one person on your list, using their name.',
      "Lis Jean 6.35-40 à voix haute, puis fais de l'invitation de Jésus une prière pour une personne de ta liste, en la nommant.",
    ),
    resourceTopics: ['gospel', 'intercession'],
  },
  {
    movement: 'understanding',
    theme: { en: 'Someone to explain the Scriptures', fr: 'Quelqu’un pour expliquer les Écritures', es: 'Alguien que explique las Escrituras', pt: 'Alguém que explique as Escrituras', de: 'Jemand, der die Schrift erklärt', ru: 'Тот, кто объяснит Писание', zh: '有人讲解圣经', ja: '聖書を解き明かす人', ko: '성경을 풀어 줄 사람', ar: 'مَن يشرح الكتاب المقدس', fa: 'کسی که کتاب‌مقدس را توضیح دهد', hi: 'पवित्रशास्त्र समझाने वाला कोई', id: 'Seseorang yang menjelaskan Kitab Suci', sw: 'Mtu wa kueleza Maandiko', tl: 'May magpapaliwanag ng Kasulatan', am: 'መጻሕፍትን የሚያብራራ ሰው' },
    ref: 'Acts 8:26-39',
    related: ['1 Corinthians 2:9-14'],
    reflection: L(
      "An Ethiopian official, returning from worship in Jerusalem, was reading Isaiah aloud in his chariot and could not make sense of it. The Spirit sent Philip to him. Philip did not open with a speech; he asked whether the man understood what he was reading, and was invited to sit beside him. Starting from that very passage, he told him the good news about Jesus. The question was the reader's own, the Spirit arranged the meeting, and Philip simply began where the man already was.",
      "Un haut fonctionnaire éthiopien, qui rentrait après être allé adorer à Jérusalem, lisait Ésaïe à voix haute sur son char sans parvenir à le comprendre. L'Esprit a envoyé Philippe vers lui. Philippe n'a pas commencé par un discours : il lui a demandé s'il comprenait ce qu'il lisait, et l'homme l'a invité à s'asseoir à ses côtés. Partant de ce passage même, il lui a annoncé la bonne nouvelle de Jésus. La question venait du lecteur, l'Esprit avait préparé la rencontre, et Philippe a simplement commencé là où l'homme se trouvait déjà.",
    ),
    prompts: [
      L('Pray for people you know who are reading, watching or searching about faith, that they would find a trustworthy guide.', "Prie pour les personnes de ton entourage qui lisent, regardent ou cherchent au sujet de la foi, afin qu'elles trouvent un guide digne de confiance."),
      L('Ask the Holy Spirit to arrange meetings you could never plan, and to make you attentive when He does.', "Demande au Saint-Esprit d'organiser des rencontres que tu ne pourrais jamais prévoir, et de te rendre attentif quand Il le fait."),
      L('Pray that the Scriptures would come alive for them and lead them to Jesus.', "Prie pour que les Écritures prennent vie pour elles et les conduisent à Jésus."),
    ],
    selfPrompt: L(
      'Ask God to deepen your own grasp of Scripture, so you can show simply where Jesus is in it — and admit what you do not know.',
      "Demande à Dieu d'approfondir ta propre connaissance des Écritures, pour que tu puisses montrer simplement où Jésus s'y trouve — et reconnaître ce que tu ignores.",
    ),
    practice: L(
      'Choose one Gospel you could read with a friend if they ever asked, and read its first chapter yourself this week.',
      "Choisis un Évangile que tu pourrais lire avec un ami s'il te le demandait un jour, et lis-en toi-même le premier chapitre cette semaine.",
    ),
    resourceTopics: ['evangelism', 'holy-spirit'],
  },
  {
    movement: 'understanding',
    theme: { en: 'The Spirit who convinces', fr: 'L’Esprit qui convainc', es: 'El Espíritu que convence', pt: 'O Espírito que convence', de: 'Der Geist, der überführt', ru: 'Дух, Который обличает', zh: '使人知罪的圣灵', ja: '罪を示す聖霊', ko: '깨닫게 하시는 성령', ar: 'الروح الذي يُبكِّت', fa: 'روحی که ملزم می‌سازد', hi: 'कायल करने वाला आत्मा', id: 'Roh yang menginsafkan', sw: 'Roho anayehakikisha moyoni', tl: 'Ang Espiritung sumusumbat sa puso', am: 'የሚወቅሰው መንፈስ' },
    ref: 'John 16:7-15',
    related: ['Acts 2:36-41'],
    reflection: L(
      "On His last night, Jesus told His disciples it was better for them that He go, because He would send the Advocate. The Spirit would show the world the truth about sin, righteousness and judgment — and He would glorify Jesus, not Himself. Conviction is His work, and it differs from shame: shame drives a person away, while the Spirit's conviction draws them toward Christ. At Pentecost, Peter's hearers were deeply convicted and asked him what they should do. You do not need to manufacture guilt in anyone.",
      "Lors de Sa dernière nuit, Jésus a dit à Ses disciples qu'il valait mieux pour eux qu'Il s'en aille, car Il enverrait le Défenseur. L'Esprit montrerait au monde la vérité sur le péché, la justice et le jugement — et Il glorifierait Jésus, non Lui-même. La conviction est Son œuvre, et elle diffère de la honte : la honte éloigne, tandis que la conviction de l'Esprit attire vers Christ. À la Pentecôte, ceux qui écoutaient Pierre ont été profondément touchés et lui ont demandé ce qu'ils devaient faire. Tu n'as pas à fabriquer de culpabilité chez qui que ce soit.",
    ),
    prompts: [
      L('Ask the Holy Spirit to convince the people you carry of the truth about Jesus, gently and deeply.', "Demande au Saint-Esprit de convaincre les personnes que tu portes de la vérité sur Jésus, avec douceur et profondeur."),
      L('Pray that where they feel shame, they would find the mercy of Christ rather than condemnation.', "Prie pour que, là où elles ressentent de la honte, elles trouvent la miséricorde de Christ plutôt que la condamnation."),
      L('Thank the Spirit that He always points to Jesus.', "Remercie l'Esprit : Il désigne toujours Jésus."),
    ],
    selfPrompt: L(
      'Ask the Spirit to convict you, too, wherever you have tried to do His work through guilt, argument or nagging.',
      "Demande à l'Esprit de te convaincre toi aussi, partout où tu as voulu faire Son œuvre par la culpabilisation, les arguments ou l'insistance.",
    ),
    practice: L(
      'Notice one moment today when you are tempted to correct or lecture someone, and ask a kind question instead.',
      "Repère aujourd'hui un moment où tu es tenté de corriger quelqu'un ou de lui faire la leçon, et pose plutôt une question bienveillante.",
    ),
    resourceTopics: ['holy-spirit', 'repentance'],
  },
  {
    movement: 'understanding',
    theme: { en: 'The kindness that leads to repentance', fr: 'La bonté qui pousse à la repentance', es: 'La bondad que guía al arrepentimiento', pt: 'A bondade que conduz ao arrependimento', de: 'Güte, die zur Umkehr führt', ru: 'Благость, ведущая к покаянию', zh: '引人悔改的恩慈', ja: '悔い改めに導く慈愛', ko: '회개로 이끄는 인자하심', ar: 'اللطف الذي يقود إلى التوبة', fa: 'مهربانی‌ای که به توبه می‌انجامد', hi: 'मन फिराव की ओर ले जाने वाली कृपा', id: 'Kemurahan yang menuntun kepada pertobatan', sw: 'Wema unaoongoza kwenye toba', tl: 'Kabutihang umaakay sa pagsisisi', am: 'ወደ ንስሐ የሚመራ ቸርነት' },
    ref: 'Romans 2:1-4',
    related: ['Luke 18:9-14'],
    reflection: L(
      "The line about God's kindness leading to repentance is often quoted about unbelievers. In context, Paul is addressing the person who judges others while doing the same things, and he warns that such a person is despising God's patience. Before you pray for anyone else to repent, the passage turns the mirror around. Repentance is not humiliation, nor adopting a church's habits; it is turning to God, drawn by a patience you have received as well.",
      "La phrase sur la bonté de Dieu qui pousse à la repentance est souvent citée à propos des non-croyants. Dans son contexte, Paul s'adresse à celui qui juge les autres tout en faisant les mêmes choses, et l'avertit qu'il méprise ainsi la patience de Dieu. Avant de prier pour que quelqu'un d'autre se repente, ce passage retourne le miroir. La repentance n'est ni une humiliation ni l'adoption des habitudes d'une Église ; c'est se tourner vers Dieu, attiré par une patience que tu as reçue, toi aussi.",
    ),
    prompts: [
      L('Pray that God’s kindness — in needs met, in beauty, in other people’s goodness — would draw each person you carry toward Him.', "Prie pour que la bonté de Dieu — dans les besoins comblés, dans la beauté, dans la bonté des autres — attire vers Lui chaque personne que tu portes."),
      L('Ask that any repentance in their lives would be a turning to God Himself, not merely a change of habits.', "Demande que toute repentance dans leur vie soit un retour à Dieu Lui-même, et pas seulement un changement d'habitudes."),
      L('Thank God for His patience with you on the days you took it for granted.', "Remercie Dieu pour Sa patience envers toi, les jours où tu la tenais pour acquise."),
    ],
    selfPrompt: L(
      'Name before God one way you judge others for what you excuse in yourself, and turn from it.',
      "Nomme devant Dieu une façon dont tu juges chez les autres ce que tu excuses chez toi, et détourne-t'en.",
    ),
    practice: L(
      'Do one quiet kindness today for someone on your list, with no spiritual message attached.',
      "Accomplis aujourd'hui un geste de bonté discret pour une personne de ta liste, sans y attacher de message spirituel.",
    ),
    resourceTopics: ['repentance', 'intercession'],
  },
  {
    movement: 'understanding',
    theme: { en: 'From darkness to light', fr: 'Des ténèbres à la lumière', es: 'De las tinieblas a la luz', pt: 'Das trevas para a luz', de: 'Von der Finsternis zum Licht', ru: 'Из тьмы к свету', zh: '从黑暗到光明', ja: '闇から光へ', ko: '어둠에서 빛으로', ar: 'من الظلمة إلى النور', fa: 'از تاریکی به نور', hi: 'अंधकार से ज्योति की ओर', id: 'Dari gelap kepada terang', sw: 'Kutoka gizani hadi nuruni', tl: 'Mula sa kadiliman tungo sa liwanag', am: 'ከጨለማ ወደ ብርሃን' },
    ref: 'Acts 26:12-20',
    related: ['Colossians 1:13-14', '1 Timothy 1:12-16'],
    reflection: L(
      "Before King Agrippa, Paul tells how the risen Jesus stopped him on the road to Damascus — a man who had been hunting Christians. Jesus then sent him to open people's eyes, so that they might leave darkness for light, pass from Satan's power into God's, and receive forgiveness. Paul adds that he called people to repent and to show it by their deeds. The fiercest opponent in the story became its messenger. No one you carry is beyond Christ's reach, and the turning is His gift, received freely.",
      "Devant le roi Agrippa, Paul raconte comment Jésus ressuscité l'a arrêté sur le chemin de Damas — lui qui traquait les chrétiens. Jésus l'a ensuite envoyé ouvrir les yeux des gens, pour qu'ils quittent les ténèbres pour la lumière, passent de la puissance de Satan à celle de Dieu, et reçoivent le pardon. Paul ajoute qu'il appelait chacun à se repentir et à le montrer par ses actes. Le plus farouche adversaire du récit en est devenu le messager. Aucune des personnes que tu portes n'est hors de portée de Christ, et ce retournement est Son don, reçu gratuitement.",
    ),
    prompts: [
      L('Pray, soberly and without formulas, that Christ would open the eyes of those you carry and free them from whatever holds them.', "Prie, avec sobriété et sans formule, pour que Christ ouvre les yeux de ceux que tu portes et les libère de ce qui les retient."),
      L('Ask God that they might know the forgiveness of sins as a gift, not a reward.', "Demande à Dieu qu'ils connaissent le pardon des péchés comme un don, et non comme une récompense."),
      L('Pray for someone who is openly hostile to faith, remembering who Paul had been.', "Prie pour quelqu'un d'ouvertement hostile à la foi, en te souvenant de ce qu'avait été Paul."),
    ],
    selfPrompt: L(
      'Ask God to show you any area where your own repentance has stayed in words and not yet reached your deeds.',
      "Demande à Dieu de te montrer où ta propre repentance est restée dans les paroles sans encore atteindre tes actes.",
    ),
    practice: L(
      'Write the name of the person you find hardest to imagine following Jesus, and pray today for their good — health, work, family — as well as their faith.',
      "Écris le nom de la personne que tu as le plus de mal à imaginer suivre Jésus, et prie aujourd'hui pour son bien — sa santé, son travail, sa famille — autant que pour sa foi.",
    ),
    resourceTopics: ['repentance', 'gospel', 'evangelism'],
  },

  // ── Movement 3 · Pray for witnesses, conversations and community (15–21) ─
  {
    movement: 'witness',
    theme: { en: 'Sent so that others may hear', fr: 'Envoyés pour que d’autres entendent', es: 'Enviados para que otros oigan', pt: 'Enviados para que outros ouçam', de: 'Gesandt, damit andere hören', ru: 'Посланы, чтобы другие услышали', zh: '奉差遣，使人得听见', ja: '人々が聞くために遣わされる', ko: '듣게 하려고 보내심', ar: 'مُرسَلون لكي يسمع الآخرون', fa: 'فرستاده‌شدگان تا دیگران بشنوند', hi: 'भेजे गए ताकि दूसरे सुनें', id: 'Diutus supaya orang lain mendengar', sw: 'Kutumwa ili wengine wasikie', tl: 'Isinugo upang makarinig ang iba', am: 'ሌሎች እንዲሰሙ የተላኩ' },
    ref: 'Romans 10:11-17',
    related: ['Isaiah 52:7-10'],
    reflection: L(
      "Paul insists that the same Lord is generous to all who call on Him, with no distinction between Jew and Greek. Then he traces a chain backwards: calling needs believing, believing needs hearing, hearing needs someone speaking, and speaking needs someone sent. He also admits honestly that not everyone welcomed the message. God's ordinary way includes human voices — a friend, a colleague, a preacher — and faith grows from hearing the word about Christ.",
      "Paul affirme que le même Seigneur est généreux envers tous ceux qui L'invoquent, sans distinction entre Juif et Grec. Puis il remonte une chaîne : invoquer suppose de croire, croire suppose d'entendre, entendre suppose que quelqu'un parle, et parler suppose que quelqu'un soit envoyé. Il reconnaît aussi, honnêtement, que tous n'ont pas accueilli le message. La manière ordinaire de Dieu passe par des voix humaines — un ami, un collègue, un prédicateur — et la foi naît de ce qu'on entend de la parole du Christ.",
    ),
    prompts: [
      L('Ask God to place believers who love Him and speak plainly in the daily lives of the people you carry.', "Demande à Dieu de placer, dans le quotidien des personnes que tu portes, des croyants qui L'aiment et qui parlent simplement."),
      L('Pray for preachers, evangelists and Bible teachers in your city, that they would speak of Christ clearly and humbly.', "Prie pour les prédicateurs, les évangélistes et les enseignants de la Bible de ta ville, afin qu'ils parlent de Christ clairement et humblement."),
      L('Pray that when the people you love hear about Jesus, they would hear good news, not a list of demands.', "Prie pour que, lorsque ceux que tu aimes entendent parler de Jésus, ils entendent une bonne nouvelle, et non une liste d'exigences."),
    ],
    selfPrompt: L(
      'Tell God whether you are willing to be one of the voices in someone’s story, and what makes you hesitate.',
      "Dis à Dieu si tu es prêt à être l'une des voix dans l'histoire de quelqu'un, et ce qui te fait hésiter.",
    ),
    practice: L(
      'Thank the person who first spoke to you about Jesus — send them a message today, or thank God for them if you cannot reach them.',
      "Remercie la personne qui t'a parlé de Jésus la première — envoie-lui un message aujourd'hui, ou remercie Dieu pour elle si tu ne peux pas la joindre.",
    ),
    resourceTopics: ['evangelism', 'mission'],
  },
  {
    movement: 'witness',
    theme: { en: 'Boldness from the Holy Spirit', fr: 'L’assurance que donne le Saint-Esprit', es: 'Valentía que da el Espíritu Santo', pt: 'Ousadia que vem do Espírito Santo', de: 'Freimut durch den Heiligen Geist', ru: 'Смелость от Святого Духа', zh: '圣灵所赐的胆量', ja: '聖霊による大胆さ', ko: '성령이 주시는 담대함', ar: 'جرأة من الروح القدس', fa: 'دلیری از روح‌القدس', hi: 'पवित्र आत्मा से मिलने वाला साहस', id: 'Keberanian dari Roh Kudus', sw: 'Ujasiri kutoka kwa Roho Mtakatifu', tl: 'Katapangang mula sa Espiritu Santo', am: 'ከመንፈስ ቅዱስ የሚገኝ ድፍረት' },
    ref: 'Acts 4:23-31',
    related: ['Romans 1:16-17', '2 Timothy 1:7-8'],
    reflection: L(
      "Peter and John had just been threatened and ordered to stop speaking about Jesus. They went back to their community, and everyone prayed together. Strikingly, they did not ask for the threats to disappear; they asked for boldness to keep speaking, and for God to heal and act in Jesus' name. The place shook, they were all filled with the Holy Spirit, and they spoke God's word boldly. Paul later writes that he is not ashamed of the gospel, because the power in it is God's, not ours.",
      "Pierre et Jean venaient d'être menacés et sommés de ne plus parler de Jésus. Ils sont retournés auprès des leurs, et tous ont prié ensemble. Fait frappant : ils n'ont pas demandé que les menaces disparaissent ; ils ont demandé l'assurance de continuer à parler, et que Dieu guérisse et agisse au nom de Jésus. Le lieu a tremblé, tous ont été remplis du Saint-Esprit, et ils annonçaient la parole de Dieu avec assurance. Paul écrira plus tard qu'il n'a pas honte de l'Évangile, parce que la puissance qui s'y trouve est celle de Dieu, non la nôtre.",
    ),
    prompts: [
      L('Ask the Holy Spirit to fill you, and the believers around the people you carry, with courage that stays kind.', "Demande au Saint-Esprit de te remplir, toi et les croyants qui entourent les personnes que tu portes, d'un courage qui reste bienveillant."),
      L('Pray for Christians who face mockery, pressure or threats for speaking of Jesus at work, at school or at home.', "Prie pour les chrétiens qui subissent moqueries, pressions ou menaces parce qu'ils parlent de Jésus au travail, à l'école ou chez eux."),
      L('Ask God to act in Jesus’ name in the lives of those you love — through healing, provision or answered prayer — so that Christ is honoured.', "Demande à Dieu d'agir au nom de Jésus dans la vie de ceux que tu aimes — par la guérison, la provision ou des prières exaucées — afin que Christ soit honoré."),
    ],
    selfPrompt: L(
      'Name the fear that most often keeps you silent about Jesus, and ask to be filled with the Spirit in its place.',
      "Nomme la peur qui te fait le plus souvent taire au sujet de Jésus, et demande à être rempli du Saint-Esprit à sa place.",
    ),
    practice: L(
      'Pray today with one other believer — in person or by phone — specifically for courage to speak of Jesus this week.',
      "Prie aujourd'hui avec un autre croyant — en personne ou par téléphone — précisément pour avoir le courage de parler de Jésus cette semaine.",
    ),
    resourceTopics: ['holy-spirit', 'evangelism', 'prayer-together'],
  },
  {
    movement: 'witness',
    theme: { en: 'Open doors and gracious words', fr: 'Des portes ouvertes, des paroles pleines de grâce', es: 'Puertas abiertas y palabras llenas de gracia', pt: 'Portas abertas e palavras cheias de graça', de: 'Offene Türen und freundliche Worte', ru: 'Открытые двери и благодатные слова', zh: '敞开的门与恩慈的话语', ja: '開かれた門と恵みある言葉', ko: '열린 문과 은혜로운 말', ar: 'أبوابٌ مفتوحة وكلامٌ مملوء نعمة', fa: 'درهای گشوده و سخنان پر از فیض', hi: 'खुले द्वार और अनुग्रहपूर्ण वचन', id: 'Pintu terbuka dan perkataan penuh kasih karunia', sw: 'Milango iliyo wazi na maneno ya neema', tl: 'Bukas na pinto at pananalitang may biyaya', am: 'የተከፈቱ በሮችና ጸጋ ያለበት ንግግር' },
    ref: 'Colossians 4:2-6',
    related: ['Ephesians 6:18-20'],
    reflection: L(
      "Paul writes in chains, yet he does not ask for release. He asks the Colossians to keep praying, alert and thankful, that God would open a door for the message and that he would make Christ clear. Then he turns to them: they are to be wise toward outsiders, make the most of each opportunity, and keep their speech gracious and seasoned, so they can answer each person. Prayer comes before conversation, and every answer is shaped for a particular person, not recited to a crowd.",
      "Paul écrit enchaîné, et pourtant il ne demande pas sa libération. Il invite les Colossiens à persévérer dans la prière, vigilants et reconnaissants, pour que Dieu ouvre une porte au message et qu'il puisse présenter Christ clairement. Puis il se tourne vers eux : qu'ils agissent avec sagesse envers ceux du dehors, qu'ils saisissent chaque occasion, que leurs paroles soient aimables et assaisonnées, afin de savoir répondre à chacun. La prière précède la conversation, et chaque réponse se façonne pour une personne précise, au lieu d'être récitée à une foule.",
    ),
    prompts: [
      L('Ask God to open doors for the gospel in the particular places where the people you carry spend their days.', "Demande à Dieu d'ouvrir des portes à l'Évangile dans les lieux précis où les personnes que tu portes passent leurs journées."),
      L('Pray for clarity for everyone who speaks of Christ this week — yourself, your pastor, a friend.', "Prie pour la clarté de tous ceux qui parleront de Christ cette semaine — toi-même, ton pasteur, un ami."),
      L('Thank God for one conversation about faith that went better than you expected.', "Remercie Dieu pour une conversation sur la foi qui s'est mieux passée que tu ne l'attendais."),
    ],
    selfPrompt: L(
      'Ask Him to season your everyday words — at work, online, at home — with grace, so they do not contradict the gospel you pray about.',
      "Demande-Lui d'assaisonner de grâce tes paroles de tous les jours — au travail, en ligne, à la maison — afin qu'elles ne contredisent pas l'Évangile pour lequel tu pries.",
    ),
    practice: L(
      'Before you open your messages or social media today, pray for the people you are about to talk with.',
      "Avant d'ouvrir tes messages ou tes réseaux sociaux aujourd'hui, prie pour les personnes avec qui tu vas échanger.",
    ),
    resourceTopics: ['evangelism', 'prayer', 'wisdom'],
  },
  {
    movement: 'witness',
    theme: { en: 'A reason for your hope, gently given', fr: 'Rendre compte de ton espérance, avec douceur', es: 'Razón de tu esperanza, con mansedumbre', pt: 'A razão da tua esperança, com mansidão', de: 'Sanft Rechenschaft über deine Hoffnung geben', ru: 'С кротостью дать ответ о надежде', zh: '温柔地说明心中的盼望', ja: '希望の理由を穏やかに語る', ko: '온유함으로 소망의 이유를 전하라', ar: 'جوابٌ عن رجائك بوداعة', fa: 'دلیل امید خود را با ملایمت بگو', hi: 'नम्रता से अपनी आशा का कारण बताना', id: 'Alasan pengharapanmu, dengan lemah lembut', sw: 'Sababu ya tumaini lako, kwa upole', tl: 'Dahilan ng iyong pag-asa, nang may kahinahunan', am: 'የተስፋህን ምክንያት በገርነት መግለጽ' },
    ref: '1 Peter 3:13-17',
    related: ['2 Timothy 2:23-26'],
    reflection: L(
      "Peter wrote to believers who were being slandered for their faith. He tells them not to be afraid, to honour Christ as Lord in their hearts, and to be ready to explain their hope to anyone who asks — with gentleness and respect, keeping a clear conscience. Notice the order: first a life that raises questions, then an answer when someone asks. Paul adds elsewhere that the Lord's servant is not quarrelsome but kind, and patient with opponents. The goal is not to win an argument but to honour Christ.",
      "Pierre écrivait à des croyants calomniés à cause de leur foi. Il leur dit de ne pas avoir peur, de reconnaître dans leur cœur Christ comme Seigneur, et d'être prêts à expliquer leur espérance à quiconque la leur demande — avec douceur et respect, en gardant une bonne conscience. Remarque l'ordre : d'abord une vie qui suscite des questions, ensuite une réponse quand quelqu'un demande. Paul ajoute ailleurs que le serviteur du Seigneur ne cherche pas la querelle, mais se montre bienveillant et patient envers ceux qui s'opposent. Le but n'est pas de gagner un débat, mais d'honorer Christ.",
    ),
    prompts: [
      L('Pray that the people you carry would feel free to ask their real questions about God, without fear of being lectured.', "Prie pour que les personnes que tu portes se sentent libres de poser leurs vraies questions sur Dieu, sans craindre de recevoir une leçon."),
      L('Ask God for gentleness and respect in every answer you give, especially to people who mock or disagree.', "Demande à Dieu la douceur et le respect dans chacune de tes réponses, surtout envers ceux qui se moquent ou qui ne sont pas d'accord."),
      L('Thank Christ for the living hope you would explain if someone asked you today.', "Remercie Christ pour l'espérance vivante que tu expliquerais si quelqu'un te la demandait aujourd'hui."),
    ],
    selfPrompt: L(
      'Ask Him to keep your conscience clear, so that nothing in your life contradicts what you say.',
      "Demande-Lui de garder ta conscience pure, pour que rien dans ta vie ne contredise ce que tu dis.",
    ),
    practice: L(
      'Take the three lines you wrote on day 7 and shape them into a two-minute account of your hope, including one thing you still wonder about.',
      "Reprends les trois lignes écrites au jour 7 et fais-en un récit de deux minutes sur ton espérance, en y incluant une question que tu te poses encore.",
    ),
    resourceTopics: ['apologetics', 'evangelism'],
  },
  {
    movement: 'witness',
    theme: { en: 'Listening at the well', fr: 'À l’écoute, près du puits', es: 'Escuchar junto al pozo', pt: 'Escutar junto ao poço', de: 'Zuhören am Brunnen', ru: 'Слушать у колодца', zh: '在井旁倾听', ja: '井戸のそばで聴く', ko: '우물가에서 귀 기울이기', ar: 'الإصغاء عند البئر', fa: 'گوش‌سپردن کنار چاه', hi: 'कुएँ के पास सुनना', id: 'Mendengarkan di tepi sumur', sw: 'Kusikiliza kisimani', tl: 'Pakikinig sa tabi ng balon', am: 'በጉድጓዱ አጠገብ ማዳመጥ' },
    ref: 'John 4:7-26',
    related: ['John 4:39-42'],
    reflection: L(
      "Jesus crossed several lines at once — Jew and Samaritan, man and woman, rabbi and stranger — and He began by asking her for help: a drink of water. He let her questions shape the conversation, including her question about where true worship belongs. When He spoke about her life, He did it without contempt, and she went back to tell her town about the man who knew her. Conversations about faith are rarely monologues. Jesus asked, listened and answered the person in front of Him.",
      "Jésus a franchi plusieurs barrières à la fois — Juif et Samaritaine, homme et femme, rabbi et inconnue — et Il a commencé par lui demander un service : un peu d'eau. Il a laissé ses questions orienter la conversation, y compris celle sur le lieu du vrai culte. Quand Il a parlé de sa vie, Il l'a fait sans mépris, et elle est retournée dire à sa ville qu'elle avait rencontré un homme qui la connaissait. Les conversations sur la foi sont rarement des monologues. Jésus a questionné, écouté et répondu à la personne en face de Lui.",
    ),
    prompts: [
      L('Pray that the people you carry would meet Christians who listen well and take their questions seriously.', "Prie pour que les personnes que tu portes rencontrent des chrétiens qui écoutent vraiment et prennent leurs questions au sérieux."),
      L('Ask Jesus to meet each of them at their own well — the ordinary place where their thirst shows.', "Demande à Jésus de rejoindre chacune d'elles à son propre puits — ce lieu ordinaire où sa soif se révèle."),
      L('Pray for people separated from you by culture, background or history, that Christ would cross that distance.', "Prie pour des personnes que la culture, l'origine ou l'histoire séparent de toi, afin que Christ franchisse cette distance."),
    ],
    selfPrompt: L(
      'Confess any habit of talking more than you listen, and ask for the patience to hear someone’s whole story.',
      "Confesse toute habitude de parler plus que tu n'écoutes, et demande la patience d'entendre l'histoire entière de quelqu'un.",
    ),
    practice: L(
      'In your next real conversation with someone on your list, ask one open question about what matters to them and listen without steering the answer.',
      "Lors de ta prochaine vraie conversation avec une personne de ta liste, pose une question ouverte sur ce qui compte pour elle, et écoute sans orienter la réponse.",
    ),
    resourceTopics: ['listening', 'evangelism', 'friendship'],
  },
  {
    movement: 'witness',
    theme: { en: 'Witness at home, with respect', fr: 'Témoigner chez soi, avec respect', es: 'Testificar en casa, con respeto', pt: 'Testemunhar em casa, com respeito', de: 'Zeugnis zu Hause – mit Respekt', ru: 'Свидетельство дома — с уважением', zh: '在家中以尊重作见证', ja: '家族の中で、敬意をもって証しする', ko: '존중하며 가정에서 증언하기', ar: 'الشهادة في البيت باحترام', fa: 'شهادت در خانه، با احترام', hi: 'घर में आदर के साथ गवाही', id: 'Bersaksi di rumah dengan hormat', sw: 'Kushuhudia nyumbani kwa heshima', tl: 'Pagsaksi sa tahanan nang may paggalang', am: 'በቤት ውስጥ በአክብሮት መመስከር' },
    ref: 'Mark 5:18-20',
    related: ['John 7:1-5', 'Acts 1:12-14'],
    reflection: L(
      "The man Jesus set free among the Gerasenes begged to go with Him. Jesus refused and sent him home to tell his own people how much the Lord had done for him. Home is often the hardest place to speak, because people remember who you were. Even Jesus' own brothers did not believe in Him for a time; later they are found praying with the disciples. That is their story, not a promise about your family — but it shows that home can become a place of patience.",
      "L'homme que Jésus avait libéré dans le pays des Géraséniens Le suppliait de pouvoir L'accompagner. Jésus a refusé et l'a renvoyé chez lui raconter aux siens tout ce que le Seigneur avait fait pour lui. La maison est souvent le lieu le plus difficile pour parler, car on s'y souvient de qui tu étais. Même les frères de Jésus n'ont pas cru en Lui pendant un temps ; plus tard, on les retrouve en prière avec les disciples. C'est leur histoire, non une promesse pour ta famille — mais elle montre que la maison peut devenir un lieu de patience.",
    ),
    prompts: [
      L('Pray by name for each relative who does not share your faith, asking God to bless their health, work and relationships.', "Prie pour chaque membre de ta famille qui ne partage pas ta foi, en le nommant, et demande à Dieu de bénir sa santé, son travail et ses relations."),
      L('Ask for wisdom to know when to speak of what the Lord has done for you, and when love means staying quiet.', "Demande la sagesse de savoir quand parler de ce que le Seigneur a fait pour toi, et quand l'amour consiste à te taire."),
      L('Bring to God any family tension that faith has caused, and ask Him for peace and humility on your side.', "Apporte à Dieu toute tension familiale causée par la foi, et demande-Lui la paix et l'humilité de ton côté."),
    ],
    selfPrompt: L(
      'Ask God to make your life at home consistent with your prayers — patient, honest and quick to apologise.',
      "Demande à Dieu que ta vie à la maison soit cohérente avec tes prières — patiente, honnête et prompte à demander pardon.",
    ),
    practice: L(
      'If a relative has asked you not to raise the subject of faith, honour that this week, and show your love in a practical way instead.',
      "Si un proche t'a demandé de ne pas aborder le sujet de la foi, respecte-le cette semaine, et montre-lui plutôt ton amour de façon concrète.",
    ),
    safetyNote: L(
      "Respect a relative's freedom and boundaries: love and prayer need no permission, but conversations do. If a relationship at home is controlling, abusive or unsafe, your safety comes first — talk to a pastor, a counsellor or another trusted person, and in immediate danger contact emergency services. Faithful witness never requires staying in danger.",
      "Respecte la liberté et les limites d'un proche : l'amour et la prière n'ont pas besoin de permission, mais les conversations, si. Si une relation à la maison est contrôlante, violente ou dangereuse, ta sécurité passe d'abord — parles-en à un pasteur, à un conseiller ou à une autre personne de confiance, et, en cas de danger immédiat, contacte les services d'urgence. Un témoignage fidèle n'exige jamais de rester en danger.",
    ),
    resourceTopics: ['family', 'evangelism', 'boundaries'],
  },
  {
    movement: 'witness',
    theme: { en: 'When Christians have caused harm', fr: 'Quand des chrétiens ont fait du mal', es: 'Cuando los cristianos han hecho daño', pt: 'Quando cristãos causaram feridas', de: 'Wenn Christen Schaden angerichtet haben', ru: 'Когда христиане причинили боль', zh: '当基督徒造成伤害时', ja: 'クリスチャンが人を傷つけたとき', ko: '그리스도인이 상처를 주었을 때', ar: 'حين يسبّب المسيحيون الأذى', fa: 'وقتی مسیحیان آسیب زده‌اند', hi: 'जब मसीहियों ने चोट पहुँचाई हो', id: 'Ketika orang Kristen telah melukai', sw: 'Wakristo wanapokuwa wameumiza wengine', tl: 'Kapag nakasakit ang mga Kristiyano', am: 'ክርስቲያኖች ጉዳት ሲያደርሱ' },
    ref: 'John 17:20-23',
    related: ['1 Peter 2:11-12', 'Daniel 9:4-10'],
    reflection: L(
      "On the night before the cross, Jesus prayed for everyone who would later believe through His disciples' message: that they would be one, so that the world might believe the Father had sent Him. The love of His people was meant to make Him credible. The reverse is also true: abuse, hypocrisy and division in churches have made faith harder to believe for many. Daniel confessed his people's sins as his own, saying 'we'. Before God, honest confession serves better than defending the church's reputation.",
      "La veille de la croix, Jésus a prié pour tous ceux qui croiraient plus tard grâce à la parole de Ses disciples : qu'ils soient un, afin que le monde croie que le Père L'avait envoyé. L'amour de Son peuple devait Le rendre crédible. L'inverse est vrai aussi : les abus, l'hypocrisie et les divisions dans les Églises ont rendu la foi plus difficile à croire pour beaucoup. Daniel a confessé les péchés de son peuple comme les siens, en disant « nous ». Devant Dieu, une confession honnête vaut mieux que la défense de la réputation de l'Église.",
    ),
    prompts: [
      L('Pray for people who have been hurt by Christians or by a church, that they would find safety, justice and people who believe them.', "Prie pour les personnes blessées par des chrétiens ou par une Église, afin qu'elles trouvent sécurité, justice et des gens qui les croient."),
      L('Confess before God the sins of the church that you know have damaged people’s trust, without excusing them.', "Confesse devant Dieu les péchés de l'Église dont tu sais qu'ils ont abîmé la confiance des gens, sans les excuser."),
      L('Ask Jesus to make your local church a place of unity and love that makes Him believable.', "Demande à Jésus de faire de ton Église locale un lieu d'unité et d'amour qui Le rende crédible."),
    ],
    selfPrompt: L(
      'Ask God to show you any way you have damaged someone’s view of Him, and whether you owe them an apology.',
      "Demande à Dieu de te montrer comment tu as pu abîmer l'image qu'une personne se fait de Lui, et si tu lui dois des excuses.",
    ),
    practice: L(
      'If someone has told you a church hurt them, the next time it comes up, listen without defending anyone and simply say you are sorry it happened.',
      "Si quelqu'un t'a confié avoir été blessé par une Église, la prochaine fois que le sujet revient, écoute sans défendre personne et dis simplement que tu regrettes ce qui s'est passé.",
    ),
    safetyNote: L(
      'If someone tells you they were abused by a church leader or another Christian, believe them, do not push them back toward church, and do not press them to forgive or reconcile. Encourage them to report it to the church’s safeguarding lead and, where a crime may have been committed, to the police; a counsellor can also help.',
      "Si quelqu'un te dit avoir subi des abus de la part d'un responsable d'Église ou d'un autre chrétien, crois-le, ne le pousse pas à revenir à l'Église et ne le presse pas de pardonner ou de se réconcilier. Encourage-le à le signaler à la personne chargée de la prévention des abus dans l'Église et, si un délit a pu être commis, à la police ; un conseiller peut aussi l'aider.",
    ),
    resourceTopics: ['church-hurt', 'repentance', 'church'],
  },

  // ── Movement 4 · Mission, perseverance and surrender (days 22–30) ────────
  {
    movement: 'mission',
    theme: { en: 'Neighbours of other faiths', fr: 'Nos voisins d’autres religions', es: 'Vecinos de otras religiones', pt: 'Vizinhos de outras religiões', de: 'Nachbarn anderen Glaubens', ru: 'Соседи иной веры', zh: '其他信仰的邻舍', ja: '他の信仰をもつ隣人', ko: '다른 신앙을 가진 이웃', ar: 'جيرانٌ من أديان أخرى', fa: 'همسایگانی از ادیان دیگر', hi: 'दूसरे धर्मों के पड़ोसी', id: 'Sesama dari agama lain', sw: 'Majirani wa imani nyingine', tl: 'Mga kapitbahay na iba ang pananampalataya', am: 'የሌላ እምነት ተከታይ ጎረቤቶች' },
    ref: 'Acts 17:22-31',
    related: ['Acts 17:16-21', 'Acts 17:32-34'],
    reflection: L(
      "In Athens, Paul was deeply troubled by what he saw, yet he walked the city, looked carefully and listened before he spoke. At the Areopagus he began with respect — they were plainly religious people — named an altar he had noticed, and quoted their own poets. He did not hide his message: the Creator calls all people everywhere to turn to Him, and He has raised Jesus from the dead. Some mocked, some wanted to hear more, some believed. Respect and clarity belong together.",
      "À Athènes, Paul était profondément troublé par ce qu'il voyait ; pourtant, il a parcouru la ville, observé avec attention et écouté avant de parler. À l'Aréopage, il a commencé avec respect — c'étaient à l'évidence des gens très religieux —, a évoqué un autel qu'il avait remarqué et cité leurs propres poètes. Il n'a pas caché son message : le Créateur appelle tous les hommes, partout, à se tourner vers Lui, et Il a ressuscité Jésus d'entre les morts. Certains se sont moqués, d'autres voulaient l'entendre encore, quelques-uns ont cru. Le respect et la clarté vont ensemble.",
    ),
    prompts: [
      L('Pray by name for neighbours, colleagues or classmates of other religious backgrounds: for their families, their work and their wellbeing.', "Prie pour des voisins, collègues ou camarades d'autres traditions religieuses, en les nommant : pour leur famille, leur travail et leur bien-être."),
      L('Ask God to let them encounter Jesus as He truly is, and to give them freedom to follow what they come to believe.', "Demande à Dieu qu'ils rencontrent Jésus tel qu'Il est vraiment, et qu'ils aient la liberté de suivre ce qu'ils en viendront à croire."),
      L('Ask the Creator, who is not far from any of us, to make Himself known to them.', "Demande au Créateur, qui n'est loin d'aucun de nous, de se faire connaître d'eux."),
    ],
    selfPrompt: L(
      'Ask God to root out any caricature or contempt you hold toward people of another faith, and to give you genuine curiosity and respect.',
      "Demande à Dieu d'arracher en toi toute caricature ou tout mépris envers les personnes d'une autre religion, et de te donner une curiosité et un respect sincères.",
    ),
    practice: L(
      'Ask a friend or colleague of another faith what one of their festivals or practices means to them, and listen to learn, not to rebut.',
      "Demande à un ami ou à un collègue d'une autre religion ce que représente pour lui l'une de ses fêtes ou de ses pratiques, et écoute pour apprendre, non pour réfuter.",
    ),
    resourceTopics: ['evangelism', 'listening', 'apologetics'],
  },
  {
    movement: 'mission',
    theme: { en: 'Every nation, every language', fr: 'Toutes les nations, toutes les langues', es: 'Todas las naciones, todas las lenguas', pt: 'Todas as nações, todas as línguas', de: 'Alle Völker, alle Sprachen', ru: 'Все народы, все языки', zh: '万国万族，各种语言', ja: 'すべての国、すべての言語', ko: '모든 민족, 모든 언어', ar: 'كلُّ أمة وكلُّ لسان', fa: 'هر قوم و هر زبان', hi: 'हर जाति, हर भाषा', id: 'Setiap bangsa, setiap bahasa', sw: 'Kila taifa, kila lugha', tl: 'Bawat bansa, bawat wika', am: 'ሁሉም ሕዝብ፣ ሁሉም ቋንቋ' },
    ref: 'Psalm 67',
    related: ['Numbers 6:24-26', 'Isaiah 49:6', 'Matthew 28:18-20'],
    reflection: L(
      "Psalm 67 echoes the priestly blessing of Numbers 6, then gives that blessing a direction: it asks for God's favour so that His ways and His salvation would become known among every nation. Blessing is not meant to stop with the people who receive it. Isaiah calls God's servant a light for the nations, and the risen Jesus sent His disciples to make disciples of all nations. Many peoples today still have few or no followers of Jesus among them, and some have no Scripture in their own language.",
      "Le Psaume 67 fait écho à la bénédiction sacerdotale de Nombres 6, puis lui donne une direction : il demande la faveur de Dieu pour que Ses voies et Son salut soient connus parmi toutes les nations. La bénédiction n'est pas faite pour s'arrêter à ceux qui la reçoivent. Ésaïe appelle le serviteur de Dieu une lumière pour les nations, et Jésus ressuscité a envoyé Ses disciples faire de toutes les nations des disciples. Aujourd'hui encore, bien des peuples ne comptent que peu de disciples de Jésus, voire aucun, et certains n'ont pas les Écritures dans leur propre langue.",
    ),
    prompts: [
      L('Pray for one people or country with few followers of Jesus, that the gospel would take root there in its own language and culture.', "Prie pour un peuple ou un pays qui compte peu de disciples de Jésus, afin que l'Évangile s'y enracine dans sa propre langue et sa propre culture."),
      L('Ask God to bless the Bible translators, local churches and believers already serving among them.', "Demande à Dieu de bénir les traducteurs de la Bible, les Églises locales et les croyants qui y servent déjà."),
      L('Thank Him that His blessing on you is meant to flow on to others.', "Remercie-Le : Sa bénédiction sur toi est faite pour se répandre vers les autres."),
    ],
    selfPrompt: L(
      'Ask God where His blessing in your life — time, money, skills, the languages you speak — could reach beyond your own circle.',
      "Demande à Dieu où la bénédiction qu'Il t'accorde — ton temps, ton argent, tes compétences, les langues que tu parles — pourrait aller au-delà de ton propre cercle.",
    ),
    practice: L(
      'Use a mission prayer guide your church trusts to learn about one people group this week, and pray for them by name.',
      "Utilise un guide de prière missionnaire recommandé par ton Église pour découvrir un peuple cette semaine, et prie pour lui en le nommant.",
    ),
    resourceTopics: ['mission', 'intercession'],
  },
  {
    movement: 'mission',
    theme: { en: 'Praying and fasting for those who go', fr: 'Prier et jeûner pour ceux qui partent', es: 'Orar y ayunar por los que van', pt: 'Orar e jejuar pelos que vão', de: 'Beten und fasten für die Gesandten', ru: 'Молитва и пост за посланных', zh: '为被差遣的人祷告禁食', ja: '遣わされる人のために祈り断食する', ko: '보냄받은 이들을 위한 기도와 금식', ar: 'الصلاة والصوم لأجل المُرسَلين', fa: 'دعا و روزه برای فرستادگان', hi: 'भेजे जाने वालों के लिए प्रार्थना और उपवास', id: 'Berdoa dan berpuasa bagi mereka yang diutus', sw: 'Kuomba na kufunga kwa ajili ya wanaotumwa', tl: 'Pananalangin at pag-aayuno para sa mga isinusugo', am: 'ለሚላኩት መጸለይና መጾም' },
    ref: 'Acts 13:1-4',
    related: ['2 Thessalonians 3:1-2', 'Philippians 1:3-5'],
    reflection: L(
      "The church in Antioch had a varied leadership — among them a man called Niger, another from Cyrene in North Africa, a man brought up with Herod, and Saul. While they were worshipping the Lord and fasting, the Holy Spirit told them to set apart Barnabas and Saul for the work He had called them to. They fasted and prayed again, laid hands on them and sent them off. This mission began in worship, not in a strategy meeting, and those who stayed behind remained partners through prayer.",
      "L'Église d'Antioche avait des responsables très divers — parmi eux un homme appelé Niger, un autre originaire de Cyrène en Afrique du Nord, un homme élevé avec Hérode, et Saul. Tandis qu'ils rendaient un culte au Seigneur et jeûnaient, le Saint-Esprit leur a dit de mettre à part Barnabas et Saul pour l'œuvre à laquelle Il les avait appelés. Ils ont de nouveau jeûné et prié, leur ont imposé les mains et les ont laissés partir. Cette mission est née dans l'adoration, non dans une réunion de stratégie, et ceux qui restaient demeuraient partenaires par la prière.",
    ),
    prompts: [
      L('Pray by name for missionaries you know or your church supports: for health, perseverance, good relationships and fruitful work.', "Prie pour les missionnaires que tu connais ou que ton Église soutient, en les nommant : pour leur santé, leur persévérance, de bonnes relations et un travail fécond."),
      L('Ask that the Lord’s message would spread and be honoured where they serve, and that they would be kept from harm.', "Demande que la parole du Seigneur se répande et soit honorée là où ils servent, et qu'ils soient gardés du mal."),
      L('Ask the Holy Spirit to call and set apart new workers from your own church, and to prepare your church to send them well.', "Demande au Saint-Esprit d'appeler et de mettre à part de nouveaux ouvriers dans ton Église, et de préparer celle-ci à bien les envoyer."),
    ],
    selfPrompt: L(
      'Ask the Spirit whether your part is to go, to send or to pray — and to make you faithful in the part you discern.',
      "Demande à l'Esprit si ta part est de partir, d'envoyer ou de prier — et de te rendre fidèle dans la part que tu discerneras.",
    ),
    practice: L(
      'If your health allows, skip one meal today and use that time to pray for a missionary; then send them a short note of encouragement.',
      "Si ta santé le permet, saute un repas aujourd'hui et consacre ce temps à prier pour un missionnaire ; puis envoie-lui un petit mot d'encouragement.",
    ),
    resourceTopics: ['mission', 'prayer', 'holy-spirit'],
  },
  {
    movement: 'mission',
    theme: { en: 'Remembering the persecuted church', fr: 'Se souvenir de l’Église persécutée', es: 'Recordar a la iglesia perseguida', pt: 'Lembrar a igreja perseguida', de: 'An die verfolgte Kirche denken', ru: 'Помнить о гонимой Церкви', zh: '记念受逼迫的教会', ja: '迫害下にある教会を覚える', ko: '박해받는 교회를 기억하기', ar: 'تذكُّر الكنيسة المضطهَدة', fa: 'به یاد کلیسای زیر جفا', hi: 'सताई गई कलीसिया को स्मरण करना', id: 'Mengingat gereja yang teraniaya', sw: 'Kukumbuka kanisa linaloteswa', tl: 'Pag-alala sa inuusig na iglesya', am: 'የምትሰደደውን ቤተ ክርስቲያን ማሰብ' },
    ref: 'Hebrews 13:1-3',
    related: ['Acts 12:1-12', 'Matthew 5:43-48'],
    reflection: L(
      "Hebrews asks believers to remember those in prison as if they were in chains with them, and those who are mistreated as if they shared their suffering. When Herod arrested Peter, the church prayed earnestly; Peter was freed, but James had already been killed. Prayer did not spare the church every loss, and it still mattered. Jesus also taught His followers to love their enemies and pray for those who persecute them — and one of the fiercest persecutors, Saul, became an apostle.",
      "L'épître aux Hébreux demande aux croyants de se souvenir des prisonniers comme s'ils étaient enchaînés avec eux, et de ceux qui sont maltraités comme s'ils partageaient leurs souffrances. Quand Hérode a fait arrêter Pierre, l'Église a prié avec ferveur ; Pierre a été libéré, mais Jacques avait déjà été mis à mort. La prière n'a pas épargné à l'Église toutes ses pertes, et pourtant elle comptait. Jésus a aussi enseigné à Ses disciples d'aimer leurs ennemis et de prier pour ceux qui les persécutent — et l'un des persécuteurs les plus acharnés, Saul, est devenu apôtre.",
    ),
    prompts: [
      L('Pray for Christians imprisoned or mistreated for their faith: courage, provision, faithful friends and, as God wills, release.', "Prie pour les chrétiens emprisonnés ou maltraités à cause de leur foi : courage, provision, amis fidèles et, si Dieu le veut, libération."),
      L('Pray for those who persecute them — officials, neighbours, sometimes their own relatives — that they would encounter Christ as Saul did.', "Prie pour ceux qui les persécutent — autorités, voisins, parfois leurs propres proches — afin qu'ils rencontrent Christ comme Saul."),
      L('Ask God for freedom of conscience and belief for people of every faith and none, in every country.', "Demande à Dieu la liberté de conscience et de croyance pour les personnes de toute religion ou sans religion, dans tous les pays."),
    ],
    selfPrompt: L(
      'Ask God to guard you from hatred and us-against-them thinking, even when you hear of injustice done to believers.',
      "Demande à Dieu de te garder de la haine et de la logique « nous contre eux », même quand tu apprends des injustices commises contre des croyants.",
    ),
    practice: L(
      'Learn the story of one country where believers face persecution, and pray for both the believers there and their neighbours.',
      "Découvre la situation d'un pays où les croyants sont persécutés, et prie à la fois pour ces croyants et pour leurs voisins.",
    ),
    resourceTopics: ['persecution', 'intercession'],
  },
  {
    movement: 'mission',
    theme: { en: 'Keep praying; do not lose heart', fr: 'Continuer à prier sans se décourager', es: 'Seguir orando sin desanimarse', pt: 'Continuar orando sem desanimar', de: 'Weiterbeten, ohne mutlos zu werden', ru: 'Молиться, не унывая', zh: '持续祷告，不要灰心', ja: '失望せずに祈り続ける', ko: '낙심하지 말고 계속 기도하기', ar: 'واظب على الصلاة ولا تيأس', fa: 'به دعا ادامه بده و دلسرد مشو', hi: 'प्रार्थना करते रहना, हियाव न छोड़ना', id: 'Terus berdoa, jangan jemu', sw: 'Endelea kuomba, usikate tamaa', tl: 'Patuloy na manalangin, huwag manghina', am: 'ሳይታክቱ መጸለይ' },
    ref: 'Luke 18:1-8',
    related: ['1 Samuel 12:19-24'],
    reflection: L(
      "Luke tells us why Jesus told this parable: so that His disciples would keep praying and not lose heart. The widow wanted justice, and the judge cared about neither God nor people; he gave in only to be rid of her. Jesus' point is the contrast: God is not that judge. Persistence does not wear Him down or pry anything out of Him. It keeps you near Him while you wait, and it stops your love for people from quietly growing cold.",
      "Luc précise pourquoi Jésus a raconté cette parabole : pour que Ses disciples prient sans cesse et ne se découragent pas. La veuve réclamait justice, et le juge ne craignait ni Dieu ni personne ; il a cédé uniquement pour être débarrassé d'elle. Le propos de Jésus tient dans le contraste : Dieu n'est pas ce juge. La persévérance ne L'use pas et ne Lui arrache rien. Elle te garde près de Lui pendant l'attente, et empêche ton amour pour les autres de se refroidir sans bruit.",
    ),
    prompts: [
      L('Bring each name on your list to God again today, even if you feel nothing has changed.', "Apporte de nouveau à Dieu chaque nom de ta liste aujourd'hui, même si tu as l'impression que rien n'a changé."),
      L('Tell Him honestly where you have grown tired of praying for someone, and ask for fresh faith.', "Dis-Lui honnêtement pour qui tu t'es lassé de prier, et demande-Lui une foi renouvelée."),
      L('Pray today for someone you stopped praying for long ago.', "Prie aujourd'hui pour quelqu'un pour qui tu as cessé de prier depuis longtemps."),
    ],
    selfPrompt: L(
      'Samuel counted it a sin against the Lord to stop praying for his people; ask God to keep you faithful in intercession when it feels fruitless.',
      "Samuel considérait comme un péché contre le Seigneur de cesser de prier pour son peuple ; demande à Dieu de te garder fidèle dans l'intercession quand elle te semble stérile.",
    ),
    practice: L(
      'Set a simple rhythm for after this plan — for example, one name each weekday — and write it where you will see it.',
      "Fixe un rythme simple pour après ce parcours — par exemple un nom chaque jour de la semaine — et note-le là où tu le verras.",
    ),
    resourceTopics: ['prayer', 'intercession'],
  },
  {
    movement: 'mission',
    theme: { en: 'The patience of God', fr: 'La patience de Dieu', es: 'La paciencia de Dios', pt: 'A paciência de Deus', de: 'Die Geduld Gottes', ru: 'Долготерпение Божье', zh: '神的忍耐', ja: '神の忍耐', ko: '하나님의 오래 참으심', ar: 'أناة الله', fa: 'صبر خدا', hi: 'परमेश्वर का धीरज', id: 'Kesabaran Allah', sw: 'Uvumilivu wa Mungu', tl: 'Ang pagtitiis ng Diyos', am: 'የእግዚአብሔር ትዕግሥት' },
    ref: '2 Peter 3:8-15',
    related: ['1 Timothy 1:16'],
    reflection: L(
      "Some in Peter's day mocked the idea that Christ would return, since nothing seemed to change. Peter answers that God does not measure time as we do: what looks like slowness is patience, because He does not want anyone to perish but wants all to come to repentance. Christians read 'anyone' here in different ways, yet the direction of God's heart is plain. Peter does not cancel the coming day of the Lord; he tells believers to count God's patience as salvation — including the years He waited for them.",
      "Du temps de Pierre, certains se moquaient de l'idée du retour de Christ, puisque rien ne semblait changer. Pierre répond que Dieu ne mesure pas le temps comme nous : ce qui ressemble à de la lenteur est de la patience, car Il ne veut pas que quiconque périsse, mais que tous parviennent à la repentance. Les chrétiens comprennent de diverses façons ce « quiconque », mais l'orientation du cœur de Dieu est claire. Pierre n'annule pas le jour du Seigneur à venir ; il invite les croyants à voir dans la patience de Dieu leur salut — y compris les années pendant lesquelles Il les a attendus.",
    ),
    prompts: [
      L('Thank God for His patience with the people you love — every year He gives them is mercy.', "Remercie Dieu pour Sa patience envers ceux que tu aimes — chaque année qu'Il leur donne est une grâce."),
      L('Ask Him to make His patience yours, so that you stop setting deadlines for other people’s faith.', "Demande-Lui de faire de Sa patience la tienne, pour que tu cesses de fixer des échéances à la foi des autres."),
      L('Pray for those who mock faith, that God’s patience would reach them too.', "Prie pour ceux qui se moquent de la foi, afin que la patience de Dieu les rejoigne eux aussi."),
    ],
    selfPrompt: L(
      'Remember how long God waited for you, and ask Him to keep your life holy and hopeful while you wait for others.',
      "Souviens-toi combien de temps Dieu t'a attendu, et demande-Lui de garder ta vie sainte et pleine d'espérance pendant que tu attends pour d'autres.",
    ),
    practice: L(
      'Work out roughly how long passed between first hearing about Jesus and trusting Him yourself, and let that number shape your patience today.',
      "Calcule à peu près combien de temps s'est écoulé entre le moment où tu as entendu parler de Jésus et celui où tu Lui as fait confiance, et laisse ce chiffre nourrir ta patience aujourd'hui.",
    ),
    resourceTopics: ['trust', 'intercession'],
  },
  {
    movement: 'mission',
    theme: { en: 'We plant and water; God gives growth', fr: 'Planter, arroser ; Dieu fait croître', es: 'Plantar y regar; Dios da el crecimiento', pt: 'Plantar e regar; Deus dá o crescimento', de: 'Pflanzen, begießen – Gott lässt wachsen', ru: 'Сажать и поливать; растит Бог', zh: '栽种浇灌，神使生长', ja: '植えて水を注ぐ。育てるのは神', ko: '심고 물 주되 자라게 하시는 하나님', ar: 'نغرس ونسقي، والله يُنمي', fa: 'می‌کاریم و آب می‌دهیم؛ رشد از خداست', hi: 'हम लगाते और सींचते हैं; बढ़ाता परमेश्वर है', id: 'Kita menanam dan menyiram; Allah memberi pertumbuhan', sw: 'Tunapanda na kutia maji; Mungu hukuza', tl: 'Nagtatanim at nagdidilig tayo; Diyos ang nagpapalago', am: 'እኛ እንተክላለን፣ እናጠጣለን፤ የሚያሳድገው እግዚአብሔር ነው' },
    ref: '1 Corinthians 3:5-9',
    related: ['Mark 4:26-29'],
    reflection: L(
      "The Corinthians were ranking their teachers. Paul refuses the contest: he planted, Apollos watered, but only God made anything grow. Jesus told of a farmer who sleeps and rises while the seed sprouts in ways he does not understand. You may plant something in a person's life and never see what comes of it; someone else may water it years later. Faithfulness is not measured by how many people you see come to faith. The growth, and the credit, belong to God.",
      "Les Corinthiens classaient leurs enseignants. Paul refuse la compétition : lui a planté, Apollos a arrosé, mais Dieu seul a fait croître. Jésus a parlé d'un paysan qui dort et se lève tandis que la semence germe d'une manière qu'il ne comprend pas. Tu planteras peut-être quelque chose dans la vie de quelqu'un sans jamais voir ce que cela deviendra ; un autre l'arrosera peut-être des années plus tard. La fidélité ne se mesure pas au nombre de personnes que tu vois venir à la foi. La croissance, et le mérite, reviennent à Dieu.",
    ),
    prompts: [
      L('Thank God for everyone who planted or watered in your own life, including people you have lost touch with.', "Remercie Dieu pour tous ceux qui ont planté ou arrosé dans ta propre vie, y compris ceux que tu as perdus de vue."),
      L('Pray for the other Christians whose paths will cross those of the people you carry, that they would water what has been planted.', "Prie pour les autres chrétiens qui croiseront la route des personnes que tu portes, afin qu'ils arrosent ce qui a été planté."),
      L('Release to God the outcome in each life you pray for, and ask Him to give growth in His time.', "Remets à Dieu l'issue de chaque vie pour laquelle tu pries, et demande-Lui de donner la croissance en Son temps."),
    ],
    selfPrompt: L(
      'Confess any wish to be the one who gets the credit for someone’s faith, and ask to be content as a servant.',
      "Confesse tout désir d'être celui à qui l'on attribuera la foi de quelqu'un, et demande à être content d'être un serviteur.",
    ),
    practice: L(
      'Encourage another Christian today who is patiently loving someone far from God; tell them their quiet work matters.',
      "Encourage aujourd'hui un autre chrétien qui aime patiemment quelqu'un d'éloigné de Dieu ; dis-lui que son travail discret compte.",
    ),
    resourceTopics: ['evangelism', 'trust'],
  },
  {
    movement: 'mission',
    theme: { en: 'Trusting what we cannot fathom', fr: 'Se confier en ce qui nous dépasse', es: 'Confiar en lo que no podemos comprender', pt: 'Confiar no que não conseguimos compreender', de: 'Vertrauen, wo wir nicht begreifen', ru: 'Доверие там, где мы не понимаем', zh: '信靠我们无法测透的神', ja: '計り知れない神に信頼する', ko: '헤아릴 수 없는 하나님을 신뢰함', ar: 'الثقة بما لا نستطيع إدراكه', fa: 'اعتماد به آنچه درکش نمی‌کنیم', hi: 'जिसे हम समझ नहीं सकते, उस पर भरोसा', id: 'Percaya pada yang tak terselami', sw: 'Kumtumaini Mungu asiyechunguzika', tl: 'Pagtitiwala sa hindi natin maarok', am: 'ልንመረምረው በማንችለው መታመን' },
    ref: 'Romans 11:33-36',
    related: ['Genesis 18:22-33'],
    reflection: L(
      "Romans 9 to 11 is Paul's long wrestling with election, unbelief and mercy — the same chapters in which he grieved for his people. He ends not with a tidy system but with worship: God's wisdom runs deeper than we can trace, and all things are from Him, through Him and for Him. Abraham, pleading for Sodom, rested on a similar trust: the Judge of all the earth does what is right. You can leave the people you love with a God more just and more merciful than you.",
      "Les chapitres 9 à 11 de Romains sont le long combat de Paul avec l'élection, l'incrédulité et la miséricorde — ceux-là mêmes où il pleurait sur son peuple. Il conclut non par un système bien ordonné, mais par l'adoration : la sagesse de Dieu est plus profonde que nous ne pouvons la sonder, et toutes choses sont de Lui, par Lui et pour Lui. Abraham, plaidant pour Sodome, s'appuyait sur une confiance semblable : le Juge de toute la terre agit avec justice. Tu peux remettre ceux que tu aimes à un Dieu plus juste et plus miséricordieux que toi.",
    ),
    prompts: [
      L('Bring God the questions about salvation you cannot resolve, and worship Him in the middle of them.', "Apporte à Dieu les questions sur le salut que tu ne peux pas résoudre, et adore-Le au milieu d'elles."),
      L('Plead boldly for the people you carry, as Abraham did, and then entrust them to the Judge who does right.', "Plaide avec hardiesse pour les personnes que tu portes, comme Abraham, puis confie-les au Juge qui agit avec justice."),
      L('Surrender each name to God’s wisdom and mercy, one at a time.', "Remets chaque nom, un à un, à la sagesse et à la miséricorde de Dieu."),
    ],
    selfPrompt: L(
      'Ask God to free you from needing to understand everything before you trust Him with the people you love.',
      "Demande à Dieu de te libérer du besoin de tout comprendre avant de Lui confier ceux que tu aimes.",
    ),
    practice: L(
      'Read Romans 11:33-36 aloud as your own act of worship, then stay silent before God for two minutes.',
      "Lis Romains 11.33-36 à voix haute comme ton propre acte d'adoration, puis reste deux minutes en silence devant Dieu.",
    ),
    resourceTopics: ['trust', 'worship', 'prayer'],
  },
  {
    movement: 'mission',
    theme: { en: 'Salvation belongs to our God', fr: 'Le salut appartient à notre Dieu', es: 'La salvación pertenece a nuestro Dios', pt: 'A salvação pertence ao nosso Deus', de: 'Das Heil gehört unserem Gott', ru: 'Спасение принадлежит нашему Богу', zh: '救恩归于我们的神', ja: '救いは私たちの神のもの', ko: '구원은 우리 하나님께 있다', ar: 'الخلاص لإلهنا', fa: 'نجات از آنِ خدای ماست', hi: 'उद्धार हमारे परमेश्वर का है', id: 'Keselamatan milik Allah kita', sw: 'Wokovu ni wa Mungu wetu', tl: 'Ang kaligtasan ay sa ating Diyos', am: 'ማዳን የአምላካችን ነው' },
    ref: 'Revelation 7:9-12',
    related: ['Luke 15:7'],
    reflection: L(
      "This plan began with a shepherd searching for one lost sheep. It ends with a crowd no one can count, from every nation, tribe, people and language, standing before the throne and before the Lamb. Their song is not about themselves, nor about those who prayed for them: salvation belongs to God and to the Lamb. That is where the people you carry belong in your prayers — in His hands, not yours. Keep loving them, keep praying, and leave the outcome with Him.",
      "Ce parcours a commencé avec un berger à la recherche d'une seule brebis perdue. Il s'achève sur une foule que personne ne peut compter, de toute nation, tribu, peuple et langue, debout devant le trône et devant l'Agneau. Leur chant ne parle ni d'eux-mêmes ni de ceux qui ont prié pour eux : le salut appartient à Dieu et à l'Agneau. C'est là que les personnes que tu portes ont leur place dans tes prières — entre Ses mains, non entre les tiennes. Continue de les aimer, continue de prier, et laisse-Lui l'issue.",
    ),
    prompts: [
      L('Worship the Lamb who was slain, and thank Him for every person from every nation who already belongs to Him.', "Adore l'Agneau immolé, et remercie-Le pour chaque personne de toute nation qui Lui appartient déjà."),
      L('Name once more each person you have carried these thirty days, and place them in God’s hands.', "Nomme une fois encore chaque personne que tu as portée pendant ces trente jours, et remets-la entre les mains de Dieu."),
      L('Ask for heaven’s joy to shape your hope, whatever you see or do not see in your lifetime.', "Demande que la joie du ciel façonne ton espérance, quoi que tu voies ou ne voies pas de ton vivant."),
    ],
    selfPrompt: L(
      'Thank God that your own salvation belongs to Him too, and ask Him to keep you faithful, loving and unafraid as a witness.',
      "Remercie Dieu : ton propre salut Lui appartient aussi, et demande-Lui de te garder fidèle, aimant et sans crainte comme témoin.",
    ),
    practice: L(
      'Add each person from your list to your prayer journal as an ongoing prayer, with a rhythm you can keep.',
      "Ajoute chaque personne de ta liste à ton journal de prière comme un sujet de prière durable, avec un rythme que tu peux tenir.",
    ),
    resourceTopics: ['intercession', 'worship', 'mission'],
  },
];
