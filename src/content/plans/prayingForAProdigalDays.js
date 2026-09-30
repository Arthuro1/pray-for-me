// The 30 days of "Praying for a Prodigal" (see ./prayingForAProdigal.js for the
// plan meta, the movements and the guardrails this content is held to).
//
// Each day follows one rhythm: receive (reflection), pray for the person you
// love (prompts), turn the same prayer back on your own heart (selfPrompt —
// present on EVERY day of this intercession plan), respond (practice).
// Prose is authored in en + fr; `theme` is authored in all 16 languages.
// Scripture is stored as references only — no Bible text lives in this file.
//
// French prose names the loved one « la personne que tu aimes » and follows
// with « elle »: the grammatical feminine of « personne », not an assumption
// about who the reader is praying for.
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── The Father's heart (1–7) ───────────────────────────────────────────────
  {
    movement: 'father',
    theme: { en: 'The Shepherd who goes looking', fr: 'Le Berger qui part à la recherche', es: 'El Pastor que sale a buscar', pt: 'O Pastor que sai à procura', de: 'Der Hirte, der suchen geht', ru: 'Пастырь, который идёт искать', zh: '出去寻找的牧人', ja: '捜しに行く羊飼い', ko: '찾아 나서는 목자', ar: 'الراعي الذي يخرج باحثًا', fa: 'شبانی که به جست‌وجو می‌رود', hi: 'खोजने निकलने वाला चरवाहा', id: 'Gembala yang pergi mencari', sw: 'Mchungaji anayekwenda kutafuta', tl: 'Ang Pastol na humahanap', am: 'ፍለጋ የሚወጣ እረኛ' },
    ref: 'Luke 15:1-7',
    related: ['Matthew 18:12-14', 'Luke 19:10'],
    reflection: L(
      'Luke 15 begins with a complaint. Tax collectors and sinners were drawing near to Jesus, and the religious leaders grumbled that He welcomed them and even ate with them. Jesus answered with a shepherd who leaves the ninety-nine to go after the one, then carries it home rejoicing. Before these stories say anything about the person you love, they tell you who God is: not the grumbler at the door, but the Shepherd who goes looking.',
      "Luc 15 commence par un murmure. Des collecteurs d'impôts et des pécheurs s'approchaient de Jésus, et les chefs religieux se plaignaient qu'Il les accueille et mange même avec eux. Jésus leur répond par l'histoire d'un berger qui laisse les quatre-vingt-dix-neuf pour aller chercher celle qui est perdue, puis la ramène, plein de joie. Avant de parler de la personne que tu aimes, ces récits te disent qui est Dieu : non celui qui murmure à la porte, mais le Berger qui part à la recherche.",
    ),
    prompts: [
      L('Say the name of the one you are praying for, and thank God that He knows them better than you do.', "Prononce le nom de la personne pour qui tu pries, et remercie Dieu de la connaître mieux que toi."),
      L('Ask the Good Shepherd to go where you cannot go, and to find them there.', "Demande au bon Berger d'aller là où tu ne peux pas aller, et de l'y trouver."),
      L('Thank Jesus that He welcomed people others had written off — and that He welcomed you.', "Remercie Jésus d'avoir accueilli des gens que d'autres avaient déjà rejetés — et de t'avoir accueilli, toi aussi."),
    ],
    selfPrompt: L(
      'Were you ever the one the Shepherd went after? Thank Him for the day He found you.',
      "As-tu été un jour la brebis que le Berger est allé chercher ? Remercie-Le pour le jour où Il t'a trouvé.",
    ),
    practice: L(
      'Write the name of the person you are carrying in this plan somewhere you will see it each day, such as inside your Bible or on a card by your bed.',
      "Écris le nom de la personne que tu portes dans ce parcours à un endroit où tu le verras chaque jour : dans ta Bible, ou sur une carte près de ton lit.",
    ),
    resourceTopics: ['prodigals', 'intercession'],
  },
  {
    movement: 'father',
    theme: { en: 'Many ways of being lost', fr: "Bien des manières d'être perdu", es: 'Muchas maneras de perderse', pt: 'Muitas maneiras de se perder', de: 'Viele Arten, verloren zu sein', ru: 'Потеряться можно по-разному', zh: '迷失的方式各不相同', ja: '失われ方はさまざま', ko: '잃어버림의 여러 모습', ar: 'طرق كثيرة للضياع', fa: 'راه‌های گوناگونِ گم‌شدن', hi: 'खो जाने के कई तरीके', id: 'Banyak cara untuk tersesat', sw: 'Njia nyingi za kupotea', tl: 'Maraming paraan ng pagkaligaw', am: 'የመጥፋት ብዙ መንገዶች' },
    ref: 'Luke 15:8-10',
    related: ['1 Samuel 16:7'],
    reflection: L(
      'Jesus tells three stories of lostness, and they are not the same. A sheep wanders off. A coin is lost inside the house and never went anywhere. A son chooses to leave. People drift from faith for many reasons: doubt, hurt, sin, grief, trauma, mental illness, a church that failed them, honest questions left unanswered. You may not know which is true, and you do not have to. The woman lit a lamp and swept until she found what she treasured.',
      "Jésus raconte trois histoires de perte, et elles ne se ressemblent pas. Une brebis s'égare. Une pièce se perd à l'intérieur de la maison, sans jamais être allée nulle part. Un fils choisit de partir. On s'éloigne de la foi pour bien des raisons : le doute, une blessure, le péché, le deuil, un traumatisme, la maladie psychique, une Église qui a failli, des questions sincères restées sans réponse. Tu ne sais peut-être pas laquelle est vraie, et tu n'as pas besoin de le savoir. La femme a allumé une lampe et balayé jusqu'à retrouver ce qui lui était précieux.",
    ),
    prompts: [
      L('Confess any explanation you have settled on too quickly, and ask God for humility about what you do not know.', "Confesse l'explication que tu as peut-être adoptée trop vite, et demande à Dieu l'humilité devant ce que tu ignores."),
      L('Thank God that the person you love has not lost their worth to Him, wherever they are.', "Remercie Dieu : la personne que tu aimes n'a rien perdu de sa valeur à Ses yeux, où qu'elle soit."),
      L('Ask Him to bring His light into whatever part of their story is hidden from you.', "Demande-Lui de porter Sa lumière sur la part de son histoire qui t'est cachée."),
    ],
    selfPrompt: L(
      'Which reason for their leaving would be hardest for you to hear? Tell God why, honestly.',
      "Quelle raison de son départ te serait la plus difficile à entendre ? Dis à Dieu pourquoi, en toute franchise.",
    ),
    practice: L(
      'Write down what you actually know about why they stepped away, and, separately, what you have only assumed.',
      "Écris ce que tu sais réellement des raisons de son éloignement, puis, à part, ce que tu as seulement supposé.",
    ),
    resourceTopics: ['prodigals', 'intercession'],
  },
  {
    movement: 'father',
    theme: { en: 'The father let him go', fr: "Le père l'a laissé partir", es: 'El padre lo dejó ir', pt: 'O pai o deixou partir', de: 'Der Vater ließ ihn gehen', ru: 'Отец отпустил его', zh: '父亲让他离去', ja: '父は彼を行かせた', ko: '아버지는 그를 보내 주었다', ar: 'الأب تركه يمضي', fa: 'پدر گذاشت که برود', hi: 'पिता ने उसे जाने दिया', id: 'Sang ayah membiarkannya pergi', sw: 'Baba alimwacha aende', tl: 'Hinayaan siyang umalis ng ama', am: 'አባትየው እንዲሄድ ተወው' },
    ref: 'Luke 15:11-16',
    related: ['Matthew 23:37'],
    reflection: L(
      "The younger son asks for his share while his father is still alive, and the father gives it. He does not lock the gate or follow him into the far country with a lecture. What follows is hard: the money runs out, a famine comes, and no one gives him anything. Letting go is not approval, and it is not indifference. It is grief that refuses to control. The father's love kept the door open; it did not drag his son back through it.",
      "Le fils cadet réclame sa part alors que son père est encore en vie, et le père la lui donne. Il ne ferme pas le portail à clé, il ne le suit pas au pays lointain pour lui faire la morale. La suite est dure : l'argent s'épuise, la famine arrive, et personne ne lui donne rien. Laisser partir n'est ni approuver ni se désintéresser. C'est un chagrin qui refuse de contrôler. L'amour du père a gardé la porte ouverte ; il n'y a pas ramené son fils de force.",
    ),
    prompts: [
      L('Tell God how it felt when they walked away, or when you realised they had.', "Dis à Dieu ce que tu as ressenti au moment de son départ, ou quand tu en as pris conscience."),
      L('Pray for them in whatever far country they are in now: for protection, for true friends, for mercy in the hard places.', "Prie pour la personne que tu aimes, dans le pays lointain où elle se trouve aujourd'hui : pour sa protection, pour de vrais amis, pour de la miséricorde dans les lieux difficiles."),
      L('Ask the Father to keep your heart open without making you their jailer.', "Demande au Père de garder ton cœur ouvert, sans faire de toi son geôlier."),
    ],
    selfPrompt: L(
      'Where are you still trying to steer their life from a distance? Hand one of those levers back to God.',
      "Où essaies-tu encore de diriger sa vie à distance ? Remets à Dieu l'un de ces leviers.",
    ),
    practice: L(
      'Name one decision that belongs to them, not to you, and tell God aloud that you release it to Him.',
      "Nomme une décision qui appartient à la personne que tu aimes, et non à toi, et dis à Dieu à voix haute que tu la Lui remets.",
    ),
    safetyNote: L(
      'Letting someone face the consequences of their choices never means ignoring danger. If you believe the person you love may harm themselves or someone else, contact emergency services or a crisis line now, and tell someone you trust.',
      "Laisser quelqu'un assumer les conséquences de ses choix ne veut jamais dire ignorer un danger. Si tu crains que la personne que tu aimes se fasse du mal ou en fasse à quelqu'un, contacte sans attendre les services d'urgence ou une ligne d'écoute, et préviens une personne de confiance.",
    ),
    resourceTopics: ['prodigals', 'family', 'trust'],
  },
  {
    movement: 'father',
    theme: { en: 'No far country beyond God', fr: 'Aucun pays trop lointain pour Dieu', es: 'Ningún país lejos de Dios', pt: 'Nenhuma terra longe de Deus', de: 'Kein Land zu fern für Gott', ru: 'Нет страны, далёкой от Бога', zh: '没有神到不了的远方', ja: '神様の届かない遠い国はない', ko: '하나님이 닿지 않는 먼 나라는 없다', ar: 'لا أرض بعيدة عن الله', fa: 'هیچ سرزمینی از خدا دور نیست', hi: 'कोई देश परमेश्वर से दूर नहीं', id: 'Tak ada negeri jauh bagi Allah', sw: 'Hakuna nchi iliyo mbali na Mungu', tl: 'Walang malayong lupain para sa Diyos', am: 'ከእግዚአብሔር የራቀ አገር የለም' },
    ref: 'Psalm 139:7-12',
    related: ['Luke 15:13', 'Romans 8:38-39'],
    reflection: L(
      "David asks where he could go to escape God's presence, and every answer comes back the same: the heights, the depths, the far side of the sea, the darkness itself — God is there. You cannot follow the person you love into every room, city or conversation. You cannot see their thoughts at three in the morning. God can. Their distance from you, and from the faith they once held, does not put them out of His reach.",
      "David se demande où il pourrait aller loin de la présence de Dieu, et chaque réponse revient au même : les hauteurs, les profondeurs, l'autre rive de la mer, les ténèbres elles-mêmes — Dieu est là. Tu ne peux pas suivre la personne que tu aimes dans chaque pièce, chaque ville, chaque conversation. Tu ne vois pas ses pensées à trois heures du matin. Dieu, Lui, les voit. Qu'elle se soit éloignée de toi, et de la foi qu'elle a connue, ne la met pas hors de portée de Dieu.",
    ),
    prompts: [
      L('Picture where they are right now, and thank God that He is already there.', "Représente-toi l'endroit où se trouve en ce moment la personne que tu aimes, et remercie Dieu d'y être déjà."),
      L('Ask Him to be light in whatever darkness they are facing, even if they do not recognise Him.', "Demande-Lui d'être lumière dans les ténèbres qu'elle traverse, même si elle ne Le reconnaît pas."),
      L('Pray for their protection tonight: their body, their mind and their relationships.', "Prie pour sa protection cette nuit : son corps, son esprit, ses relations."),
    ],
    selfPrompt: L(
      'Is there a place in your own life where you have been hiding from God? He is there too, and not to shame you.',
      "Y a-t-il un endroit de ta propre vie où tu te caches de Dieu ? Il y est aussi, et pas pour te faire honte.",
    ),
    practice: L(
      'Tonight, before you sleep, pray one sentence for them by name, entrusting them to the God who never sleeps.',
      "Ce soir, avant de dormir, prie une phrase en prononçant son nom, et confie cette personne au Dieu qui ne dort jamais.",
    ),
    resourceTopics: ['prodigals', 'trust'],
  },
  {
    movement: 'father',
    theme: { en: 'When he came to himself', fr: 'Rentré en lui-même', es: 'Cuando volvió en sí', pt: 'Quando caiu em si', de: 'Als er zu sich kam', ru: 'Придя в себя', zh: '他醒悟过来', ja: '我に返ったとき', ko: '스스로 돌이켜', ar: 'حين رجع إلى نفسه', fa: 'وقتی به خود آمد', hi: 'जब वह अपने आपे में आया', id: 'Ketika ia menyadari keadaannya', sw: 'Alipozinduka', tl: "Nang siya'y natauhan", am: 'ወደ ልቡ በተመለሰ ጊዜ' },
    ref: 'Luke 15:17-19',
    related: ['Psalm 119:59', 'Lamentations 3:40'],
    reflection: L(
      "The turning happens far from home, among the pigs, and it begins inside: the son comes to himself. What surfaces is a memory — even his father's hired workers have bread to spare. His motives are mixed and his speech is rehearsed, yet the memory of his father's goodness is what sets him walking. You cannot produce that moment in someone else. You can pray that what the person you love once knew of God's goodness would rise again.",
      "Le retournement se produit loin de la maison, au milieu des porcs, et il commence de l'intérieur : le fils rentre en lui-même. Ce qui remonte, c'est un souvenir — même les ouvriers de son père ont du pain en abondance. Ses motifs sont mêlés, son discours est préparé d'avance ; pourtant, c'est le souvenir de la bonté de son père qui le remet en marche. Tu ne peux pas provoquer ce moment chez quelqu'un d'autre. Tu peux prier pour que la personne que tu aimes se souvienne de ce qu'elle a connu de la bonté de Dieu.",
    ),
    prompts: [
      L('Ask God to bring back to their mind what was true and good in what they once knew of Him.', "Demande à Dieu de rappeler à sa mémoire ce qui était vrai et bon dans ce qu'elle a connu de Lui."),
      L('Pray for moments of clarity, when the noise stops and they can look at their life honestly.', "Prie pour des moments de lucidité, où le bruit s'arrête et où elle peut regarder sa vie en vérité."),
      L('Thank God that He does not wait for perfectly pure motives before He welcomes anyone home.', "Remercie Dieu : Il n'attend pas des motifs parfaitement purs pour accueillir quelqu'un à la maison."),
    ],
    selfPrompt: L(
      'When did you last come to yourself before God? Ask Him to show you one place where you need to turn back to Him.',
      "Quand es-tu rentré en toi-même devant Dieu pour la dernière fois ? Demande-Lui de te montrer un domaine où tu as besoin de revenir à Lui.",
    ),
    practice: L(
      'Write down one good memory of faith you shared with them — a song, a meal, a prayer — and thank God for it.',
      "Note un bon souvenir de foi que vous avez partagé — un chant, un repas, une prière — et remercies-en Dieu.",
    ),
    resourceTopics: ['repentance', 'prodigals'],
  },
  {
    movement: 'father',
    theme: { en: 'While he was still far off', fr: 'Encore loin de la maison', es: 'Cuando aún estaba lejos', pt: 'Quando ainda estava longe', de: 'Als er noch weit weg war', ru: 'Когда он был ещё далеко', zh: '相离还远', ja: 'まだ遠く離れていたのに', ko: '아직 거리가 먼데', ar: 'وإذ كان لم يزل بعيدًا', fa: 'هنوز دور بود که', hi: 'जब वह अभी दूर ही था', id: 'Ketika ia masih jauh', sw: 'Alipokuwa bado mbali', tl: 'Malayo pa siya noon', am: 'ገና ሩቅ ሳለ' },
    ref: 'Luke 15:20-24',
    related: ['Romans 5:8', 'Zephaniah 3:17'],
    reflection: L(
      'The father sees his son while he is still a long way off, which suggests a father who kept looking down the road. Then he does something a man of his standing would rarely do: he runs. The son begins his rehearsed speech, but the father interrupts it with a robe, a ring, sandals and a feast. There is no probation period. This is the heart of God toward every sinner who turns home, and He showed it to you first.',
      "Le père voit son fils alors qu'il est encore loin, ce qui laisse deviner un père qui scrutait la route. Puis il fait ce qu'un homme de son rang ne faisait guère : il court. Le fils commence son discours préparé, mais le père l'interrompt avec une robe, une bague, des sandales et un festin. Il n'y a pas de période d'essai. Tel est le cœur de Dieu envers tout pécheur qui revient vers Lui, et c'est d'abord envers toi qu'Il l'a montré.",
    ),
    prompts: [
      L('Thank God for the welcome you received in Christ, when you had nothing to offer but your need.', "Remercie Dieu pour l'accueil que tu as reçu en Christ, quand tu n'avais rien d'autre à offrir que ton besoin."),
      L('Ask Him to shape your heart now, so that compassion would come before questions if they ever turn toward home.', "Demande-Lui de façonner ton cœur dès maintenant, pour que la compassion passe avant les questions si un jour elle reprend le chemin de la maison."),
      L('Pray that the person you love would come to know the Father as He is, not as they fear He is.', "Prie pour que la personne que tu aimes connaisse le Père tel qu'Il est, et non tel qu'elle Le redoute."),
    ],
    selfPrompt: L(
      'Are you still living like a hired servant with God, trying to earn what He has already given? Receive the robe.',
      "Vis-tu encore avec Dieu comme un ouvrier, en essayant de mériter ce qu'Il t'a déjà donné ? Reçois la robe.",
    ),
    practice: L(
      "Think of one way your home could say welcome rather than prove yourself — a meal they like, a standing invitation — and write it down.",
      "Pense à une manière dont ton foyer pourrait dire « bienvenue » plutôt que « fais tes preuves » — un plat qu'elle aime, une invitation permanente — et note-la.",
    ),
    resourceTopics: ['prodigals', 'repentance', 'forgiveness'],
  },
  {
    movement: 'father',
    theme: { en: "The grief in God's own heart", fr: 'Le chagrin du cœur de Dieu', es: 'El dolor en el corazón de Dios', pt: 'A dor no coração de Deus', de: 'Der Schmerz in Gottes Herzen', ru: 'Боль в сердце Бога', zh: '神心中的忧伤', ja: '神様ご自身の心の痛み', ko: '하나님 마음의 슬픔', ar: 'الحزن في قلب الله', fa: 'اندوه در دل خدا', hi: 'परमेश्वर के हृदय का दुःख', id: 'Duka di hati Allah', sw: 'Huzuni moyoni mwa Mungu', tl: 'Ang dalamhati sa puso ng Diyos', am: 'በእግዚአብሔር ልብ ያለ ኀዘን' },
    ref: 'Hosea 11:1-9',
    related: ['Luke 19:41-42'],
    reflection: L(
      "Hosea lets us hear God speak like a parent. He called Israel out of Egypt as His son, taught him to walk, held him by the arms — and the more He called, the further they went. Hosea does not hide the consequences that follow. Yet the passage turns on God's anguished question of how He could give them up, and on a compassion that stirs within Him. If you grieve over someone who has turned away, you are not alone in it. God knows that ache.",
      "Osée nous fait entendre Dieu parler comme un père. Il a appelé Israël hors d'Égypte comme Son fils, lui a appris à marcher, l'a tenu par les bras — et plus Il appelait, plus ils s'éloignaient. Osée ne cache pas les conséquences qui suivent. Mais le passage bascule sur la question déchirante de Dieu, qui se demande comment Il pourrait les abandonner, et sur une compassion qui s'émeut en Lui. Si tu pleures quelqu'un qui s'est détourné, tu n'es pas seul dans ce chagrin. Dieu connaît cette douleur.",
    ),
    prompts: [
      L('Tell God about your grief without tidying it up; Hosea shows He is no stranger to it.', "Parle à Dieu de ton chagrin sans l'arranger ; Osée montre qu'Il ne lui est pas étranger."),
      L('Thank Him that His compassion for the person you love runs deeper than yours.', "Remercie-Le : Sa compassion pour la personne que tu aimes est plus profonde encore que la tienne."),
      L("Pray for them with God's tenderness, and bring Him the anger you may also feel.", "Prie pour elle avec la tendresse de Dieu, et apporte-Lui aussi la colère que tu ressens peut-être."),
    ],
    selfPrompt: L(
      'Where has grief turned into numbness or bitterness in you? Ask God to keep your heart tender.',
      "Où le chagrin s'est-il changé en engourdissement ou en amertume chez toi ? Demande à Dieu de garder ton cœur tendre.",
    ),
    practice: L(
      'Take ten quiet minutes today to grieve honestly before God — write, weep or simply sit — without trying to fix anything.',
      "Prends aujourd'hui dix minutes de calme pour pleurer honnêtement devant Dieu — écrire, verser des larmes ou simplement rester là — sans chercher à rien réparer.",
    ),
    resourceTopics: ['grief', 'lament', 'prodigals'],
  },

  // ── Persistent intercession (8–14) ─────────────────────────────────────────
  {
    movement: 'persist',
    theme: { en: 'Pray and do not lose heart', fr: 'Prier sans se décourager', es: 'Orar sin desanimarse', pt: 'Orar sem desanimar', de: 'Beten und nicht aufgeben', ru: 'Молиться и не унывать', zh: '常常祷告，不可灰心', ja: '失望せずに祈り続ける', ko: '낙심하지 말고 기도하라', ar: 'صلِّ ولا تملّ', fa: 'دعا کن و دلسرد مشو', hi: 'प्रार्थना करो और हियाव न छोड़ो', id: 'Berdoa dan jangan jemu', sw: 'Omba wala usikate tamaa', tl: 'Manalangin at huwag manghina', am: 'ጸልይ፤ ተስፋም አትቍረጥ' },
    ref: 'Luke 18:1-8',
    related: ['Colossians 4:2'],
    reflection: L(
      'Luke gives the reason for this parable before he tells it: so that we would keep praying and not lose heart. A widow wears down a judge who cares for no one. Jesus argues from the lesser to the greater: God is not that judge. Persistence does not pry a favour out of a reluctant God; it is what trust looks like when the answer is slow. Jesus ends with a question about faith — the kind that keeps on praying.',
      "Luc donne la raison de cette parabole avant de la raconter : pour qu'on prie sans cesse et qu'on ne se décourage pas. Une veuve finit par lasser un juge qui ne se soucie de personne. Jésus raisonne du moindre au plus grand : Dieu n'est pas ce juge. La persévérance n'arrache pas une faveur à un Dieu réticent ; c'est la forme que prend la confiance quand la réponse tarde. Jésus termine par une question sur la foi — celle qui continue de prier.",
    ),
    prompts: [
      L('Tell God plainly how long you have been praying, and how tired you are.', "Dis simplement à Dieu depuis combien de temps tu pries, et combien tu es fatigué."),
      L('Thank Him that He is not a reluctant judge but a Father who hears His children day and night.', "Remercie-Le : Il n'est pas un juge réticent, mais un Père qui entend Ses enfants jour et nuit."),
      L('Bring the person you love to Him again today, as if for the first time.', "Présente-Lui encore aujourd'hui la personne que tu aimes, comme si c'était la première fois."),
    ],
    selfPrompt: L(
      'Has discouragement quietly shrunk your prayers to a sigh? Ask for a faith that keeps coming back.',
      "Le découragement a-t-il, sans bruit, réduit tes prières à un soupir ? Demande une foi qui revient sans cesse.",
    ),
    practice: L(
      'Choose a fixed time for this prayer — after breakfast, on your commute, before bed — and set a reminder for it for the rest of the plan.',
      "Choisis un moment fixe pour cette prière — après le petit-déjeuner, pendant ton trajet, avant de dormir — et programme un rappel pour toute la suite du parcours.",
    ),
    resourceTopics: ['intercession', 'prayer'],
  },
  {
    movement: 'persist',
    theme: { en: 'Jesus prayed for Peter', fr: 'Jésus a prié pour Pierre', es: 'Jesús oró por Pedro', pt: 'Jesus orou por Pedro', de: 'Jesus betete für Petrus', ru: 'Иисус молился о Петре', zh: '耶稣为彼得祷告', ja: 'イエス様はペテロのために祈られた', ko: '예수님은 베드로를 위해 기도하셨다', ar: 'صلّى يسوع لأجل بطرس', fa: 'عیسی برای پطرس دعا کرد', hi: 'यीशु ने पतरस के लिए प्रार्थना की', id: 'Yesus mendoakan Petrus', sw: 'Yesu alimwombea Petro', tl: 'Ipinanalangin ni Jesus si Pedro', am: 'ኢየሱስ ስለ ጴጥሮስ ጸለየ' },
    ref: 'Luke 22:31-34',
    related: ['Hebrews 7:25', 'Romans 8:34'],
    reflection: L(
      "Jesus knew Peter was about to deny Him, and He prayed for him before it happened — not that Peter would be spared the sifting, but that his faith would not fail. He even spoke of the day Peter would turn back. That was the Lord's own knowledge of Peter, not a formula for every story. Yet it shows you something sure: the risen Christ lives to intercede, and your prayers are not the only ones being prayed.",
      "Jésus savait que Pierre allait Le renier, et Il a prié pour lui avant que cela n'arrive — non pour qu'il échappe au crible, mais pour que sa foi ne défaille pas. Il a même parlé du jour où Pierre reviendrait. C'était la connaissance que le Seigneur avait de Pierre, et non une formule valable pour chaque histoire. Mais cela montre une chose sûre : le Christ ressuscité vit pour intercéder, et tes prières ne sont pas les seules à monter vers le Père.",
    ),
    prompts: [
      L('Thank Jesus that He prays for His own, and ask Him to hold the person you love in His intercession.', "Remercie Jésus de prier pour les Siens, et demande-Lui de porter la personne que tu aimes dans Son intercession."),
      L('Pray that whatever faith remains in them, however small, would not fail.', "Prie pour que la foi qui demeure en elle, si petite soit-elle, ne défaille pas."),
      L('Pray against despair in them, that failure would not have the last word over their life.', "Prie contre le désespoir en elle : que l'échec n'ait pas le dernier mot sur sa vie."),
    ],
    selfPrompt: L(
      "Peter was sure he would never fall. Where are you relying on your own steadiness rather than on Christ's prayer for you?",
      "Pierre était sûr de ne jamais tomber. Où comptes-tu sur ta propre solidité plutôt que sur la prière de Christ pour toi ?",
    ),
    practice: L(
      'Ask one trusted believer to pray with you for this person this week, sharing only what the person would be comfortable having shared.',
      "Demande à un croyant de confiance de prier avec toi pour cette personne cette semaine, en ne partageant que ce qu'elle accepterait qu'on dise d'elle.",
    ),
    resourceTopics: ['intercession', 'prodigals'],
  },
  {
    movement: 'persist',
    theme: { en: "God's invitation to return", fr: "L'invitation de Dieu au retour", es: 'La invitación de Dios a volver', pt: 'O convite de Deus para voltar', de: 'Gottes Einladung zur Umkehr', ru: 'Божий призыв вернуться', zh: '神呼召人回转', ja: '立ち返れという神様の招き', ko: '돌아오라는 하나님의 초대', ar: 'دعوة الله إلى الرجوع', fa: 'دعوت خدا به بازگشت', hi: 'लौट आने का परमेश्वर का निमंत्रण', id: 'Undangan Allah untuk kembali', sw: 'Mwaliko wa Mungu wa kurudi', tl: 'Ang paanyaya ng Diyos na bumalik', am: 'የእግዚአብሔር የመመለስ ጥሪ' },
    ref: 'Hosea 14:1-4',
    related: ['Jeremiah 3:12-14', 'Jeremiah 3:22'],
    reflection: L(
      "Hosea's book ends with an invitation. God calls Israel to return, even gives them the words to bring, and promises to heal their waywardness and love them freely. Jeremiah hears the same call: God summons His faithless children back and promises to heal their unfaithfulness. These words were spoken to a nation, and they do not tell you in advance how any one person will respond. But they show you what to pray for: not a grudging readmission, but healing and freely given love.",
      "Le livre d'Osée se termine sur une invitation. Dieu appelle Israël à revenir, lui donne même les paroles à apporter, et promet de guérir son égarement et de l'aimer de bon cœur. Jérémie entend le même appel : Dieu invite Ses enfants infidèles à revenir et promet de guérir leur infidélité. Ces paroles ont été adressées à un peuple ; elles ne disent pas d'avance comment une personne y répondra. Mais elles te montrent quoi demander : non une réadmission du bout des lèvres, mais la guérison et un amour donné gratuitement.",
    ),
    prompts: [
      L('Pray the invitation of Hosea 14 over the person you love, asking God to make His call heard in their heart.', "Prie l'invitation d'Osée 14 pour la personne que tu aimes, en demandant à Dieu de faire entendre Son appel à son cœur."),
      L('Ask God to heal whatever wound or waywardness lies beneath their distance.', "Demande à Dieu de guérir la blessure ou l'égarement qui se cache sous son éloignement."),
      L('Thank Him that His love is given freely, not rationed out to those who have earned it.', "Remercie-Le : Son amour est donné gratuitement, et non distribué au compte-gouttes à ceux qui l'auraient mérité."),
    ],
    selfPrompt: L(
      'God gave Israel words to bring back to Him. What words do you need to bring Him today about your own wanderings?',
      "Dieu a donné à Israël les paroles à apporter en revenant. Quelles paroles dois-tu Lui apporter aujourd'hui au sujet de tes propres égarements ?",
    ),
    practice: L(
      'Write a two-line prayer in your own words, drawn from Hosea 14, and pray it for them each morning this week.',
      "Écris une prière de deux lignes, avec tes propres mots, inspirée d'Osée 14, et prie-la pour la personne que tu aimes chaque matin cette semaine.",
    ),
    resourceTopics: ['repentance', 'intercession', 'prodigals'],
  },
  {
    movement: 'persist',
    theme: { en: 'The Shepherd who binds up wounds', fr: 'Le Berger qui panse les plaies', es: 'El Pastor que venda las heridas', pt: 'O Pastor que trata as feridas', de: 'Der Hirte, der Wunden verbindet', ru: 'Пастырь, перевязывающий раны', zh: '缠裹伤处的牧人', ja: '傷を包む羊飼い', ko: '상처를 싸매시는 목자', ar: 'الراعي الذي يعصب الجروح', fa: 'شبانی که زخم‌ها را می‌بندد', hi: 'घावों पर पट्टी बाँधने वाला चरवाहा', id: 'Gembala yang membalut luka', sw: 'Mchungaji afungaye majeraha', tl: 'Ang Pastol na nagbebenda ng sugat', am: 'ቍስልን የሚያስር እረኛ' },
    ref: 'Ezekiel 34:11-16',
    related: ['Ezekiel 34:1-6', 'Isaiah 42:3'],
    reflection: L(
      "Before God promises to seek His scattered sheep, He indicts Israel's shepherds: they fed themselves, left the injured unbandaged, and ruled with force and harshness until the flock scattered. Some people leave the faith because they were wounded — sometimes by those who claimed to speak for God. If that is part of your loved one's story, do not defend what was done to them. God did not. He promises to search for the lost Himself, bind up the injured and strengthen the weak.",
      "Avant de promettre qu'Il ira chercher Ses brebis dispersées, Dieu met en accusation les bergers d'Israël : ils se nourrissaient eux-mêmes, laissaient les blessées sans soin et régnaient avec violence et dureté, jusqu'à disperser le troupeau. Certains quittent la foi parce qu'ils ont été blessés — parfois par ceux qui prétendaient parler au nom de Dieu. Si cela fait partie de l'histoire de la personne que tu aimes, ne défends pas ce qu'on lui a fait. Dieu, Lui, ne l'a pas défendu. Il promet de chercher Lui-même celles qui sont perdues, de panser celles qui sont blessées et de fortifier celles qui sont faibles.",
    ),
    prompts: [
      L('If you know they were hurt by a church or a Christian, name it before God as wrong, without softening it.', "Si tu sais qu'elle a été blessée par une Église ou par un chrétien, nomme-le devant Dieu comme un mal, sans l'atténuer."),
      L('Ask the Shepherd to bind up their wounds, including the ones they have never spoken of.', "Demande au Berger de panser ses blessures, y compris celles dont elle n'a jamais parlé."),
      L('Pray that they would one day be able to tell Jesus apart from the people who misrepresented Him.', "Prie pour qu'elle puisse un jour distinguer Jésus des personnes qui L'ont mal représenté."),
    ],
    selfPrompt: L(
      'Have you ever been part of the harm — a harsh word, a pressured decision, a defence of the indefensible? Confess it, and consider whether an apology is owed.',
      "As-tu toi-même contribué à la blessure — une parole dure, une décision imposée, la défense de l'indéfendable ? Confesse-le, et demande-toi si des excuses sont dues.",
    ),
    practice: L(
      "If they have told you they were hurt in church, find a moment to say simply that you are sorry it happened to them — without adding a 'but'.",
      "Si elle t'a dit avoir été blessée dans une Église, trouve un moment pour lui dire simplement : « Je suis désolé que tu aies vécu ça » — sans ajouter de « mais ».",
    ),
    safetyNote: L(
      "If the person you love was abused in a church or ministry setting, believe them, and do not press them to forgive or to return. Where a crime or a risk to others is involved, encourage a report to the police and to the church's safeguarding lead, and suggest a trained counsellor.",
      "Si la personne que tu aimes a subi des abus dans un cadre d'Église ou de ministère, crois-la, et ne la presse ni de pardonner ni de revenir. S'il y a eu un délit ou un risque pour d'autres, encourage un signalement à la police et au référent chargé de la protection des personnes dans l'Église, et suggère l'aide d'un conseiller formé.",
    ),
    resourceTopics: ['church-hurt', 'prodigals', 'intercession'],
  },
  {
    movement: 'persist',
    theme: { en: 'Freedom from the snare', fr: 'Échapper au piège', es: 'Libres de la trampa', pt: 'Livres da armadilha', de: 'Frei aus der Schlinge', ru: 'Освобождение из сети', zh: '脱离网罗', ja: 'わなからの解放', ko: '올무에서 벗어나다', ar: 'التحرر من الفخ', fa: 'رهایی از دام', hi: 'फन्दे से छुटकारा', id: 'Lepas dari jerat', sw: 'Kuwekwa huru kutoka mtegoni', tl: 'Paglaya mula sa bitag', am: 'ከወጥመድ መፈታት' },
    ref: '2 Timothy 2:24-26',
    related: ['2 Corinthians 4:4-6', 'John 8:31-32'],
    reflection: L(
      "Paul is writing about people in the church who had turned against the truth. He sees a spiritual snare behind it, and he sees the way out as God's gift: God may grant repentance, and they may come to their senses. Notice what Paul asks of the Lord's servant meanwhile — no quarrelling, but kindness, patience and gentleness. Deception is real, and it is resisted in prayer rather than by winning arguments. Pray boldly for their freedom; speak to them gently.",
      "Paul parle de personnes de l'Église qui s'étaient retournées contre la vérité. Il voit derrière cela un piège spirituel, et il voit l'issue comme un don de Dieu : Dieu peut leur accorder la repentance, et elles peuvent revenir à la raison. Remarque ce que Paul demande entre-temps au serviteur du Seigneur : pas de querelles, mais de la bonté, de la patience et de la douceur. La tromperie est réelle, et on lui résiste dans la prière plutôt qu'en gagnant des débats. Prie avec hardiesse pour sa liberté ; parle-lui avec douceur.",
    ),
    prompts: [
      L('In the name of Jesus, pray for the person you love to be set free from every lie that holds them, whatever its source.', "Au nom de Jésus, prie pour que la personne que tu aimes soit libérée de tout mensonge qui la retient, quelle qu'en soit la source."),
      L('Ask God to grant what you cannot give: a change of mind and heart that leads to the truth.', "Demande à Dieu d'accorder ce que tu ne peux pas donner : un changement de pensée et de cœur qui conduit à la vérité."),
      L('Ask the Holy Spirit to bring the truth to them gently, in ways that do not depend on you.', "Demande au Saint-Esprit de lui faire connaître la vérité avec douceur, par des chemins qui ne dépendent pas de toi."),
    ],
    selfPrompt: L(
      'Where has your own heart grown quarrelsome in all this? Ask for the gentleness Paul describes.',
      "Où ton propre cœur est-il devenu querelleur dans tout cela ? Demande la douceur que décrit Paul.",
    ),
    practice: L(
      'The next time a conversation with them starts turning into a debate, decide in advance to stop, and say something kind instead.',
      "La prochaine fois qu'une conversation avec elle tourne au débat, décide d'avance de t'arrêter et de dire plutôt une parole bienveillante.",
    ),
    resourceTopics: ['intercession', 'repentance', 'prodigals'],
  },
  {
    movement: 'persist',
    theme: { en: 'What true repentance looks like', fr: 'À quoi ressemble la vraie repentance', es: 'Cómo es el verdadero arrepentimiento', pt: 'Como é o verdadeiro arrependimento', de: 'Wie echte Umkehr aussieht', ru: 'Каково истинное покаяние', zh: '真正的悔改是什么样子', ja: '真の悔い改めとは', ko: '참된 회개의 모습', ar: 'كيف تبدو التوبة الحقيقية', fa: 'توبهٔ واقعی چگونه است', hi: 'सच्चा पश्चाताप कैसा होता है', id: 'Seperti apa pertobatan sejati', sw: 'Toba ya kweli ikoje', tl: 'Ano ang tunay na pagsisisi', am: 'እውነተኛ ንስሐ ምን ይመስላል' },
    ref: 'Psalm 51:1-12',
    related: ['Psalm 51:17', '2 Corinthians 7:10'],
    reflection: L(
      "David's prayer shows what repentance is, and what it is not. It is addressed to God, not staged for an audience. It is honest about sin, and it asks for a clean heart, a steady spirit and the return of joy. It is not a performance of shame for the family. When you pray for the repentance of the person you love, this is what you are asking for: that they would meet God's mercy, and not first that they would apologise to you.",
      "La prière de David montre ce qu'est la repentance, et ce qu'elle n'est pas. Elle s'adresse à Dieu, elle ne se joue pas devant un public. Elle est honnête sur le péché, et elle demande un cœur pur, un esprit ferme et le retour de la joie. Ce n'est pas une mise en scène de la honte devant la famille. Quand tu pries pour la repentance de la personne que tu aimes, c'est cela que tu demandes : qu'elle rencontre la miséricorde de Dieu, et pas d'abord qu'elle te présente des excuses.",
    ),
    prompts: [
      L("Pray that the person you love would meet God's mercy before they meet anyone's verdict.", "Prie pour que la personne que tu aimes rencontre la miséricorde de Dieu avant le verdict de quiconque."),
      L('Ask God for joy restored in them, not merely behaviour corrected.', "Demande à Dieu de restaurer la joie en elle, et pas seulement de corriger sa conduite."),
      L('Thank Him that a broken and humbled heart is never turned away by Him — theirs or yours.', "Remercie-Le : jamais Il ne repousse un cœur brisé et humilié — ni le sien, ni le tien."),
    ],
    selfPrompt: L(
      "Pray David's request for a clean heart for yourself before you pray it for anyone else.",
      "Demande pour toi-même un cœur pur, comme David, avant de le demander pour quelqu'un d'autre.",
    ),
    practice: L(
      'Read Psalm 51 slowly today and mark one line you want to pray for yourself and another you want to pray for them.',
      "Lis lentement le Psaume 51 aujourd'hui, et marque une ligne que tu veux prier pour toi et une autre pour la personne que tu aimes.",
    ),
    resourceTopics: ['repentance', 'prayer'],
  },
  {
    movement: 'persist',
    theme: { en: 'Other voices God may send', fr: "D'autres voix que Dieu peut envoyer", es: 'Otras voces que Dios puede enviar', pt: 'Outras vozes que Deus pode enviar', de: 'Andere Stimmen, die Gott senden kann', ru: 'Другие голоса, которые может послать Бог', zh: '神可以差派别人', ja: '神様が遣わすほかの人々', ko: '하나님이 보내실 다른 목소리', ar: 'أصوات أخرى قد يرسلها الله', fa: 'صداهای دیگری که خدا می‌فرستد', hi: 'दूसरी आवाज़ें जिन्हें परमेश्वर भेज सकता है', id: 'Suara lain yang dapat Allah utus', sw: 'Sauti nyingine Mungu anazoweza kutuma', tl: 'Ibang tinig na maaaring isugo ng Diyos', am: 'እግዚአብሔር ሊልካቸው የሚችሉ ሌሎች ድምፆች' },
    ref: 'Matthew 9:35-38',
    related: ['1 Corinthians 3:5-7', 'James 5:19-20'],
    reflection: L(
      'Jesus looked at the crowds with compassion, because they were harassed and helpless, like sheep without a shepherd. His response was to tell His disciples to ask the Lord of the harvest for workers. You may not be the voice the person you love can hear right now, and that is not a failure. Paul planted, Apollos watered, and God gave the growth. Pray for the colleague, friend or stranger God might place in their path.',
      "Jésus a regardé les foules avec compassion, parce qu'elles étaient harassées et abattues, comme des brebis sans berger. Sa réponse a été d'inviter Ses disciples à demander des ouvriers au Maître de la moisson. Tu n'es peut-être pas, en ce moment, la voix que la personne que tu aimes peut entendre, et ce n'est pas un échec. Paul a planté, Apollos a arrosé, et Dieu a fait croître. Prie pour le collègue, l'ami ou l'inconnu que Dieu pourrait placer sur son chemin.",
    ),
    prompts: [
      L('Ask the Lord of the harvest to send someone wise, kind and trustworthy into their life.', "Demande au Maître de la moisson d'envoyer dans sa vie quelqu'un de sage, de bon et de digne de confiance."),
      L('Pray for any believers already around them — at work, in their street, among their friends — to live and speak well.', "Prie pour les croyants qui sont déjà autour d'elle — au travail, dans son quartier, parmi ses amis — afin qu'ils vivent et parlent avec justesse."),
      L('Thank God that the growth is His work, and let go of needing to be the one who brings them back.', "Remercie Dieu : c'est Lui qui fait croître. Renonce au besoin d'être celui ou celle qui la ramène."),
    ],
    selfPrompt: L(
      'Would you be glad if someone else became the voice they listen to? Ask God to free you from needing the credit.',
      "Te réjouirais-tu si quelqu'un d'autre devenait la voix qu'elle écoute ? Demande à Dieu de te libérer du besoin d'en avoir le mérite.",
    ),
    practice: L(
      'Pray by name for one believer you know who is already part of their life and, if it is appropriate, thank that person for their friendship.',
      "Prie nommément pour un croyant que tu connais et qui fait déjà partie de sa vie ; si c'est approprié, remercie cette personne pour son amitié.",
    ),
    resourceTopics: ['intercession', 'prodigals'],
  },

  // ── The intercessor's own heart (15–21) ────────────────────────────────────
  {
    movement: 'heart',
    theme: { en: 'The son who stayed home', fr: 'Le fils resté à la maison', es: 'El hijo que se quedó en casa', pt: 'O filho que ficou em casa', de: 'Der Sohn, der zu Hause blieb', ru: 'Сын, который остался дома', zh: '留在家里的儿子', ja: '家にとどまった息子', ko: '집에 남아 있던 아들', ar: 'الابن الذي بقي في البيت', fa: 'پسری که در خانه ماند', hi: 'घर पर रहने वाला बेटा', id: 'Anak yang tetap di rumah', sw: 'Mwana aliyebaki nyumbani', tl: 'Ang anak na nanatili sa bahay', am: 'በቤት የቀረው ልጅ' },
    ref: 'Luke 15:25-32',
    related: ['Luke 15:1-2'],
    reflection: L(
      'The story does not end at the feast. The older son comes in from the field, hears the music and refuses to go in. He has served for years without disobeying, and he is angry that his brother is welcomed without a reckoning. The father goes out to him too, and pleads with him. Jesus leaves the ending open: we never learn whether he went in. The parable was aimed at people who grumbled at grace, and anyone who has prayed for years may find that older brother in their own heart.',
      "L'histoire ne s'arrête pas au festin. Le fils aîné revient des champs, entend la musique et refuse d'entrer. Il sert son père depuis des années sans jamais désobéir, et il est en colère que son frère soit accueilli sans avoir de comptes à rendre. Le père sort aussi vers lui, et le supplie. Jésus laisse la fin ouverte : on ne saura jamais s'il est entré. La parabole visait ceux qui murmuraient contre la grâce, et quiconque prie depuis des années peut retrouver ce fils aîné dans son propre cœur.",
    ),
    prompts: [
      L('Tell God honestly if part of you resents the idea of them being welcomed back without a reckoning.', "Dis honnêtement à Dieu si une part de toi s'irrite à l'idée qu'elle soit accueillie sans avoir de comptes à rendre."),
      L('Thank the Father that He goes out to the angry son as well, and pleads instead of scolding.', "Remercie le Père de sortir aussi vers le fils en colère, et de le supplier plutôt que de le réprimander."),
      L('Pray for any brother, sister, parent or child who feels overlooked because so much attention goes to the one who left.', "Prie pour le frère, la sœur, le parent ou l'enfant qui se sent oublié parce que tant d'attention va à la personne qui est partie."),
    ],
    selfPrompt: L(
      'Where are you standing outside the feast, keeping count of your own faithfulness? Let the Father remind you that all He has is already yours.',
      "Où te tiens-tu à l'écart du festin, à compter tes propres années de fidélité ? Laisse le Père te rappeler que tout ce qui est à Lui est déjà à toi.",
    ),
    practice: L(
      'This week, spend unhurried time with someone in the family who stayed, and ask how they are doing without talking about the one who left.',
      "Cette semaine, passe un moment sans te presser avec un membre de la famille qui est resté, et demande-lui comment il va, sans parler de la personne qui est partie.",
    ),
    resourceTopics: ['prodigals', 'family', 'forgiveness'],
  },
  {
    movement: 'heart',
    theme: { en: 'Forgiving what it has cost you', fr: "Pardonner ce que cela t'a coûté", es: 'Perdonar lo que te ha costado', pt: 'Perdoar o que isso te custou', de: 'Vergeben, was es dich gekostet hat', ru: 'Простить то, чего это тебе стоило', zh: '饶恕你所受的伤害与损失', ja: '受けた痛みを赦す', ko: '내가 입은 상처를 용서하기', ar: 'أن تغفر ما كلّفك إياه', fa: 'بخشیدنِ آنچه برایت گران تمام شد', hi: 'जो चोट लगी, उसे क्षमा करना', id: 'Mengampuni luka yang kautanggung', sw: 'Kusamehe yale yaliyokugharimu', tl: 'Pagpapatawad sa sakit na idinulot nito', am: 'የደረሰውን ጉዳት ይቅር ማለት' },
    ref: 'Ephesians 4:30-32',
    related: ['Matthew 18:21-22', 'Romans 12:17-19'],
    reflection: L(
      "Sometimes a loved one's leaving comes with real wrongs: cruel words, lies, money taken, a wedding or a funeral spoiled. Paul tells believers to put away bitterness and rage and to forgive as God in Christ forgave them. That does not mean pretending nothing happened, trusting again straight away, or waiting for an apology first. It means handing the debt to God and leaving justice to Him. When Peter asked how often he must forgive, Jesus' answer amounted to: keep going. You may need to choose it again tomorrow.",
      "Il arrive que le départ d'un proche s'accompagne de vrais torts : des paroles cruelles, des mensonges, de l'argent pris, un mariage ou des obsèques gâchés. Paul demande aux croyants de rejeter l'amertume et la colère, et de pardonner comme Dieu leur a pardonné en Christ. Cela ne veut pas dire faire comme si rien ne s'était passé, faire de nouveau confiance tout de suite, ni attendre d'abord des excuses. Cela veut dire remettre la dette à Dieu et Lui laisser la justice. Quand Pierre a demandé combien de fois il devait pardonner, la réponse de Jésus revenait à dire : continue. Tu devras peut-être le choisir à nouveau demain.",
    ),
    prompts: [
      L('Name before God one specific way the person you love has hurt you, and tell Him what it cost.', "Nomme devant Dieu une blessure précise que la personne que tu aimes t'a infligée, et dis-Lui ce qu'elle t'a coûté."),
      L('Ask for grace to release that debt into His hands, even if you must do it again tomorrow.', "Demande la grâce de remettre cette dette entre Ses mains, même s'il faut recommencer demain."),
      L('Pray for good things for them today — rest, provision, true friends — with no lesson attached.', "Demande pour elle aujourd'hui de bonnes choses — du repos, de quoi vivre, de vrais amis — sans aucune leçon attachée."),
    ],
    selfPrompt: L(
      'You have been forgiven far more than you can measure. Ask God to let that mercy sink deep enough in you to flow out.',
      "Il t'a été pardonné bien plus que tu ne peux le mesurer. Demande à Dieu que cette miséricorde descende assez profond en toi pour déborder.",
    ),
    practice: L(
      'Write down the hurt and pray over it, handing it to God. If it involves money, safety or the law, also ask a pastor or a trusted adviser about wise next steps.',
      "Écris cette blessure et prie à son sujet, en la remettant à Dieu. Si elle touche à l'argent, à la sécurité ou à la loi, demande aussi conseil à un pasteur ou à une personne de confiance pour les prochaines étapes.",
    ),
    resourceTopics: ['forgiveness', 'family'],
  },
  {
    movement: 'heart',
    theme: { en: 'When the whole family hurts', fr: 'Quand toute la famille a mal', es: 'Cuando toda la familia sufre', pt: 'Quando toda a família sofre', de: 'Wenn die ganze Familie leidet', ru: 'Когда страдает вся семья', zh: '当全家都在伤痛中', ja: '家族みんなが痛むとき', ko: '온 가족이 아파할 때', ar: 'حين تتألم العائلة كلها', fa: 'وقتی همهٔ خانواده رنج می‌برند', hi: 'जब पूरा परिवार दुःखी हो', id: 'Ketika seluruh keluarga terluka', sw: 'Familia nzima inapoumia', tl: 'Kapag nasasaktan ang buong pamilya', am: 'መላው ቤተሰብ ሲጎዳ' },
    ref: 'Psalm 34:15-18',
    related: ['Galatians 6:2', 'Romans 12:15'],
    reflection: L(
      "A loved one's wandering rarely hurts only one person. Parents may blame each other or themselves; brothers and sisters can grow resentful or anxious; grandparents grieve quietly; the wanderer's own children may be caught in the middle, and holidays turn tense. David found that the Lord draws near to people whose hearts are broken. Near — not always fixing things at once, but near. And the church is meant to carry burdens together. You were never meant to bear this alone.",
      "L'éloignement d'un proche fait rarement souffrir une seule personne. Des parents s'accusent l'un l'autre, ou eux-mêmes ; frères et sœurs deviennent amers ou inquiets ; des grands-parents pleurent en silence ; les enfants de la personne partie peuvent se retrouver pris entre deux feux, et les fêtes deviennent tendues. David a découvert que le Seigneur s'approche de ceux qui ont le cœur brisé. Proche — sans toujours tout arranger tout de suite, mais proche. Et l'Église est faite pour porter les fardeaux ensemble. Tu n'as jamais été censé porter cela seul.",
    ),
    prompts: [
      L('Bring each member of your family to God by name, especially the ones who hurt quietly.', "Présente à Dieu chaque membre de ta famille par son nom, surtout ceux qui souffrent en silence."),
      L('Where blame has come between you and others in the family, ask God to turn it into shared prayer.', "Là où les reproches se sont glissés entre toi et d'autres membres de la famille, demande à Dieu d'en faire une prière partagée."),
      L('Thank Him that He is near to broken hearts, even on the days you cannot feel it.', "Remercie-Le d'être proche des cœurs brisés, même les jours où tu ne le ressens pas."),
    ],
    selfPrompt: L(
      'Where are you blaming yourself for their choices? Confess what is truly yours to confess, and hand God the blame that is not.',
      "Où te reproches-tu ses choix ? Confesse ce qui t'appartient vraiment, et remets à Dieu la culpabilité qui n'est pas la tienne.",
    ),
    practice: L(
      'Before the next family meal or holiday, agree with one relative how you will handle the empty chair or a tense moment, and pray about it together.',
      "Avant le prochain repas de famille ou la prochaine fête, mets-toi d'accord avec un proche sur la manière d'accueillir la chaise vide ou un moment de tension, et priez-en ensemble.",
    ),
    resourceTopics: ['family', 'grief', 'lament'],
  },
  {
    movement: 'heart',
    theme: { en: 'Kindness, not pressure', fr: 'La bonté, pas la pression', es: 'Bondad, no presión', pt: 'Bondade, não pressão', de: 'Güte statt Druck', ru: 'Доброта, а не давление', zh: '以恩慈，而非施压', ja: '圧力ではなく慈しみを', ko: '압박이 아닌 인자하심', ar: 'اللطف لا الضغط', fa: 'مهربانی، نه فشار', hi: 'दबाव नहीं, कृपा', id: 'Kebaikan, bukan tekanan', sw: 'Wema, si shinikizo', tl: 'Kabaitan, hindi pamimilit', am: 'ቸርነት እንጂ ግፊት አይደለም' },
    ref: 'Romans 2:1-4',
    related: ['2 Corinthians 4:2', '1 Corinthians 13:4-7'],
    reflection: L(
      "Paul's line about God's kindness leading to repentance was not first written to the wanderer. It was written to the one who judges — someone condemning others while presuming on God's patience himself. Repentance is drawn out by God's kindness, not by pressure. Paul refuses underhanded methods, and love does not force its own way. So no guilt-trips, no ultimatums dressed up as love, no conversations staged as ambushes, no tricking them into a church event. Kindness with a hidden hook is not kindness.",
      "La phrase de Paul sur la bonté de Dieu qui pousse à la repentance ne s'adressait pas d'abord à celui qui s'est éloigné. Elle s'adressait à celui qui juge — quelqu'un qui condamne les autres tout en abusant lui-même de la patience de Dieu. C'est la bonté de Dieu qui suscite la repentance, non la pression. Paul refuse les procédés cachés, et l'amour n'impose pas sa volonté. Donc pas de culpabilisation, pas d'ultimatum déguisé en amour, pas de conversation montée comme une embuscade, pas de ruse pour l'emmener à un événement d'Église. Une bonté qui cache un hameçon n'est pas de la bonté.",
    ),
    prompts: [
      L('Confess any way you have tried to pressure, shame or trick the person you love toward faith.', "Confesse les moments où tu as essayé de pousser la personne que tu aimes vers la foi par la pression, la honte ou la ruse."),
      L('Ask God to make your kindness toward them genuine, with nothing hidden behind it.', "Demande à Dieu que ta bonté envers elle soit sincère, sans rien de caché derrière."),
      L('Pray that they would taste His kindness this week, even where you play no part.', "Prie pour qu'elle goûte à Sa bonté cette semaine, même là où tu n'as aucun rôle."),
    ],
    selfPrompt: L(
      "Paul wrote those words to the judge. Where have you judged the person you love while quietly relying on God's patience with your own sin?",
      "Paul écrivait à celui qui juge. Où as-tu jugé la personne que tu aimes tout en comptant, sans le dire, sur la patience de Dieu envers ton propre péché ?",
    ),
    practice: L(
      'Before you next message or call them, reread what you plan to say and remove any hint of guilt, pressure or sermon, keeping only what is kind and true.',
      "Avant ton prochain message ou appel, relis ce que tu comptes dire et retire toute trace de culpabilisation, de pression ou de sermon, pour ne garder que ce qui est bon et vrai.",
    ),
    resourceTopics: ['prodigals', 'communication', 'family'],
  },
  {
    movement: 'heart',
    theme: { en: 'Ready when they ask', fr: 'Être prêt quand viendra la question', es: 'Con la respuesta lista cuando pregunten', pt: 'Com a resposta pronta quando perguntarem', de: 'Bereit, wenn die Frage kommt', ru: 'Быть готовым, когда спросят', zh: '被问起时，随时预备回答', ja: '尋ねられたときに備えて', ko: '물어올 때를 위한 준비', ar: 'مستعدًّا للجواب حين تُسأل', fa: 'آماده برای وقتی که می‌پرسند', hi: 'जब वे पूछें, तब तैयार रहना', id: 'Siap ketika ditanya', sw: 'Tayari wanapouliza', tl: 'Handa kapag sila ay nagtanong', am: 'ሲጠይቁ ዝግጁ መሆን' },
    ref: '1 Peter 3:13-16',
    related: ['Colossians 4:5-6', 'Proverbs 15:1'],
    reflection: L(
      "Peter pictures a conversation that begins with someone else's question: they ask about the hope you have, and you are ready to answer, with gentleness, respect and a clear conscience. Readiness is not an ambush. Often, knowing when to speak means waiting to be asked, then answering honestly — even admitting that you do not know. Paul asks for speech that is gracious and fitted to each person. If the person you love opens a door, even slightly, go through it gently, and do not go further than what they actually asked.",
      "Pierre imagine une conversation qui commence par la question de quelqu'un d'autre : on t'interroge sur ton espérance, et tu es prêt à répondre, avec douceur, avec respect et avec une bonne conscience. Être prêt, ce n'est pas tendre une embuscade. Souvent, savoir quand parler, c'est attendre qu'on te pose la question, puis répondre honnêtement — quitte à reconnaître que tu ne sais pas. Paul demande une parole aimable et ajustée à chacun. Si la personne que tu aimes entrouvre une porte, entre avec douceur, sans aller plus loin que ce qu'elle a réellement demandé.",
    ),
    prompts: [
      L('Ask God to prepare you for a conversation you cannot schedule, so that you are ready if they ever ask.', "Demande à Dieu de te préparer à une conversation que tu ne peux pas programmer, pour être prêt si un jour elle te questionne."),
      L('Pray about the questions they carry — about God, suffering or the church — and that they would find honest answers.', "Prie au sujet des questions qu'elle porte — sur Dieu, la souffrance ou l'Église — pour qu'elle trouve des réponses honnêtes."),
      L('Ask the Holy Spirit for gentleness and respect, especially if they raise something that stings.', "Demande au Saint-Esprit la douceur et le respect, surtout si elle aborde un sujet qui te blesse."),
    ],
    selfPrompt: L(
      'Could you put into words the hope you have in Christ today? Ask God to renew it, so that your answer would be honest when the moment comes.',
      "Pourrais-tu dire avec des mots l'espérance que tu as en Christ aujourd'hui ? Demande à Dieu de la renouveler, pour que ta réponse soit sincère le moment venu.",
    ),
    practice: L(
      'Write three or four plain sentences on why you still hope in Jesus — not an argument, just your story — so they are ready if you are ever asked.',
      "Écris trois ou quatre phrases simples sur la raison pour laquelle tu espères encore en Jésus — pas un argument, juste ton histoire —, pour être prêt si on te le demande un jour.",
    ),
    resourceTopics: ['communication', 'apologetics', 'prodigals'],
  },
  {
    movement: 'heart',
    theme: { en: 'A time to keep silent', fr: 'Un temps pour se taire', es: 'Tiempo de callar', pt: 'Tempo de calar', de: 'Eine Zeit zum Schweigen', ru: 'Время молчать', zh: '静默有时', ja: '黙るのに時がある', ko: '잠잠할 때', ar: 'للسكوت وقت', fa: 'زمانی برای خاموشی', hi: 'चुप रहने का समय', id: 'Ada waktu untuk berdiam diri', sw: 'Wakati wa kunyamaza', tl: 'Panahon ng pananahimik', am: 'ዝም የማለት ጊዜ' },
    ref: 'Ecclesiastes 3:1-8',
    related: ['James 1:19-20', 'Psalm 62:5-8'],
    reflection: L(
      'Among the seasons the Preacher lists is one for staying silent and one for speaking; neither is right all the time. After years of praying, silence can feel like giving up. Sometimes it is the most loving choice: when every conversation becomes a fight, when they have asked you to stop, or when your words would only land as pressure. James urges us to be quick to listen and slow to speak. Your silence with them need not be empty. In Psalm 62, David pours out his heart to God.',
      "Parmi les saisons de la vie qu'énumère l'Ecclésiaste, il y en a une pour se taire et une pour parler ; aucune ne dure toujours. Après des années de prière, le silence peut ressembler à un abandon. Parfois, c'est pourtant le choix le plus aimant : quand chaque conversation tourne à la dispute, quand elle t'a demandé d'arrêter, ou quand tes paroles ne seraient reçues que comme une pression. Jacques nous invite à être prompts à écouter et lents à parler. Ton silence avec elle n'a pas besoin d'être vide. Dans le Psaume 62, David répand son cœur devant Dieu.",
    ),
    prompts: [
      L('Ask God to show you whether this is a season for speaking with them or for keeping quiet.', "Demande à Dieu de te montrer si c'est une saison pour lui parler ou pour te taire."),
      L('Pour out to Him every word you are holding back, all of them, for as long as it takes.', "Répands devant Lui toutes les paroles que tu retiens, sans rien laisser, aussi longtemps qu'il le faudra."),
      L('Pray that your quietness toward them would carry warmth, not coldness or punishment.', "Prie pour que ton silence envers elle soit chaleureux, et non froid ou punitif."),
    ],
    selfPrompt: L(
      'Is your silence toward them peaceful, or has it become a way of punishing them? Ask God to make it clean.',
      "Ton silence envers elle est-il paisible, ou est-il devenu une façon de la punir ? Demande à Dieu de le purifier.",
    ),
    practice: L(
      'Next time you are together, aim to listen twice as much as you speak, and ask one question about their life that has nothing to do with faith.',
      "La prochaine fois que vous serez ensemble, efforce-toi d'écouter deux fois plus que tu ne parles, et pose une question sur sa vie qui n'ait rien à voir avec la foi.",
    ),
    resourceTopics: ['listening', 'communication', 'prodigals'],
  },
  {
    movement: 'heart',
    theme: { en: 'Your own road with Jesus', fr: 'Ton propre chemin avec Jésus', es: 'Tu propio camino con Jesús', pt: 'Seu próprio caminho com Jesus', de: 'Dein eigener Weg mit Jesus', ru: 'Твой собственный путь с Иисусом', zh: '你自己与耶稣同行的路', ja: 'あなた自身のイエス様との歩み', ko: '예수님과 함께하는 나의 길', ar: 'طريقك أنت مع يسوع', fa: 'راه خودت با عیسی', hi: 'यीशु के साथ तुम्हारी अपनी राह', id: 'Jalanmu sendiri bersama Yesus', sw: 'Njia yako mwenyewe pamoja na Yesu', tl: 'Ang sarili mong lakad kasama si Jesus', am: 'ከኢየሱስ ጋር የራስህ መንገድ' },
    ref: 'John 21:15-22',
    related: ['Luke 22:61-62'],
    reflection: L(
      "Beside a charcoal fire, Jesus restores Peter, who had denied Him beside another fire. Three questions answer three denials; there is no humiliation, only love and a renewed call to care for His sheep. Then Peter points at another disciple and asks what will become of him. Jesus replies that this is not Peter's concern: Peter is to follow Him. You cannot write the next chapter of someone else's story. You can follow Jesus today, and your walk with Him does not have to wait on what they decide.",
      "Près d'un feu de braises, Jésus relève Pierre, qui L'avait renié près d'un autre feu. Trois questions répondent aux trois reniements ; aucune humiliation, seulement de l'amour et un appel renouvelé à prendre soin de Ses brebis. Puis Pierre désigne un autre disciple et demande ce qu'il adviendra de lui. Jésus lui répond que cela ne le regarde pas : lui, qu'il Le suive. Tu ne peux pas écrire le prochain chapitre de l'histoire de quelqu'un d'autre. Tu peux suivre Jésus aujourd'hui, et ta marche avec Lui n'a pas à attendre ce qu'elle décidera.",
    ),
    prompts: [
      L('Thank Jesus that He restores failed disciples face to face, without shaming them.', "Remercie Jésus de relever face à face les disciples qui ont failli, sans les humilier."),
      L('Hand Him the question you keep asking about what will become of the person you love.', "Remets-Lui la question que tu poses sans cesse sur ce que deviendra la personne que tu aimes."),
      L('Ask Him for fresh love for Himself, and for the people He has placed in your care today.', "Demande-Lui un amour renouvelé pour Lui, et pour les personnes qu'Il a confiées à tes soins aujourd'hui."),
    ],
    selfPrompt: L(
      'Jesus asked Peter three times about his love. Let Him ask you, answer Him honestly, and then follow Him into today.',
      "Jésus a interrogé Pierre trois fois sur son amour. Laisse-Le t'interroger, réponds-Lui honnêtement, puis suis-Le dans ta journée.",
    ),
    practice: L(
      'Choose one thing you have neglected while carrying this burden — a friendship, rest, serving at church — and take one step back into it this week.',
      "Choisis une chose que tu as négligée en portant ce fardeau — une amitié, le repos, un service à l'Église — et fais un pas pour y revenir cette semaine.",
    ),
    resourceTopics: ['discipleship', 'spiritual-formation', 'prodigals'],
  },

  // ── Hope, wisdom and surrender (22–30) ─────────────────────────────────────
  {
    movement: 'hope',
    theme: { en: 'Mercies new every morning', fr: 'Des bontés nouvelles chaque matin', es: 'Misericordias nuevas cada mañana', pt: 'Misericórdias novas a cada manhã', de: 'Gnade, jeden Morgen neu', ru: 'Милость, новая каждое утро', zh: '每早晨都有新的怜悯', ja: '朝ごとに新しいあわれみ', ko: '아침마다 새로운 긍휼', ar: 'مراحم جديدة كل صباح', fa: 'رحمت‌هایی تازه در هر بامداد', hi: 'हर सुबह नई करुणा', id: 'Rahmat yang baru setiap pagi', sw: 'Rehema mpya kila asubuhi', tl: 'Bagong habag tuwing umaga', am: 'በየማለዳው አዲስ ምሕረት' },
    ref: 'Lamentations 3:19-26',
    related: ['Psalm 130:5-6'],
    reflection: L(
      "Lamentations is written among the ruins of Jerusalem, and in chapter 3 the poet does not pretend. He remembers his affliction, and his soul is bowed down. Then he calls something else to mind: the Lord's steadfast love has not run out, His compassion is renewed each morning, and it is good to wait quietly for Him. Hope here is not a forecast of how things will turn out. It is a choice to remember who God is while the ruins are still in view.",
      "Les Lamentations sont écrites au milieu des ruines de Jérusalem, et au chapitre 3 le poète ne fait pas semblant. Il se souvient de sa détresse, et son âme en est accablée. Puis il rappelle autre chose à sa mémoire : l'amour fidèle du Seigneur n'est pas épuisé, Sa compassion se renouvelle chaque matin, et il est bon d'attendre en silence Son secours. L'espérance, ici, n'est pas une prévision sur la façon dont les choses tourneront. C'est le choix de se souvenir de qui est Dieu alors que les ruines sont encore sous les yeux.",
    ),
    prompts: [
      L('Tell God where things stand today with the person you love, without dressing it up.', "Dis à Dieu où en sont les choses aujourd'hui avec la personne que tu aimes, sans rien embellir."),
      L("Call to mind one way God's faithfulness has held you through this, and thank Him for it.", "Rappelle-toi une manière dont la fidélité de Dieu t'a tenu dans cette épreuve, et remercie-L'en."),
      L("Ask for this morning's mercy for them — whatever they need today, even if they never know you asked.", "Demande pour elle la miséricorde de ce matin — ce dont elle a besoin aujourd'hui, même si elle ne sait jamais que tu l'as demandé."),
    ],
    selfPrompt: L(
      'Has your hope quietly shifted from God to an outcome? Ask Him to anchor it again in who He is.',
      "Ton espérance s'est-elle déplacée, sans bruit, de Dieu vers un résultat ? Demande-Lui de l'ancrer de nouveau en ce qu'Il est.",
    ),
    practice: L(
      'Tomorrow morning, before you look at your phone, name one mercy from the day before and thank God for it.',
      "Demain matin, avant de regarder ton téléphone, nomme une grâce reçue la veille et remercies-en Dieu.",
    ),
    resourceTopics: ['lament', 'trust', 'suffering'],
  },
  {
    movement: 'hope',
    theme: { en: 'The word that does not return empty', fr: 'La parole qui ne revient pas sans effet', es: 'La palabra que no vuelve vacía', pt: 'A palavra que não volta vazia', de: 'Das Wort, das nicht leer zurückkommt', ru: 'Слово, которое не возвращается тщетным', zh: '不徒然返回的话语', ja: '空しく帰ることのないみことば', ko: '헛되이 돌아오지 않는 말씀', ar: 'الكلمة التي لا ترجع فارغة', fa: 'کلامی که بی‌ثمر بازنمی‌گردد', hi: 'वह वचन जो व्यर्थ नहीं लौटता', id: 'Firman yang tidak kembali sia-sia', sw: 'Neno lisilorudi bure', tl: 'Ang salitang hindi babalik nang walang bunga', am: 'በከንቱ የማይመለስ ቃል' },
    ref: 'Isaiah 55:6-11',
    related: ['2 Timothy 3:14-15'],
    reflection: L(
      'Isaiah invites the wicked to abandon their way and return to the Lord, who will have compassion and pardon generously. Then God explains why His mercy outruns ours: His thoughts and ways are higher than ours. As rain and snow soak the earth and make it fruitful, His word accomplishes what He purposes — His purpose, which we do not always see. If the person you love once learned Scripture, pray that it would still do its work, in His time and way, without deciding in advance what that work must be.',
      "Ésaïe invite le méchant à abandonner sa voie et à revenir au Seigneur, qui aura compassion de lui et pardonnera largement. Puis Dieu explique pourquoi Sa miséricorde dépasse la nôtre : Ses pensées et Ses voies sont plus hautes que les nôtres. Comme la pluie et la neige abreuvent la terre et la rendent féconde, Sa parole accomplit ce qu'Il veut — Son dessein, que nous ne voyons pas toujours. Si la personne que tu aimes a appris l'Écriture, prie pour qu'elle fasse encore son œuvre, au temps et à la manière de Dieu, sans décider d'avance ce que doit être cette œuvre.",
    ),
    prompts: [
      L('Pray the invitation of Isaiah 55 for the person you love: that they would seek the Lord and find Him near.', "Prie pour la personne que tu aimes l'invitation d'Ésaïe 55 : qu'elle cherche le Seigneur et Le trouve proche."),
      L('Thank God that His pardon is generous, larger than anything they have done, and anything you have done.', "Remercie Dieu : Son pardon est généreux, plus grand que tout ce qu'elle a pu faire, et que tout ce que tu as pu faire."),
      L('Ask Him to bring back to their mind any Scripture they once learned, and to let it bear fruit in His time.', "Demande-Lui de rappeler à sa mémoire les passages de l'Écriture qu'elle a appris, et de les rendre féconds en Son temps."),
    ],
    selfPrompt: L(
      'His thoughts are higher than yours, including your plans for how this story should end. Tell Him which plan is hardest to hold loosely.',
      "Ses pensées sont plus hautes que les tiennes, y compris tes plans sur la fin de cette histoire. Dis-Lui lequel de ces plans tu as le plus de mal à lâcher.",
    ),
    practice: L(
      'If you know a verse or song they once loved, write it in your journal and pray over it; share it with them only if it would be welcome, never as a hint.',
      "Si tu connais un verset ou un chant qu'elle a aimé, note-le dans ton journal et prie à son sujet ; ne le lui partage que s'il serait bien reçu, et jamais comme une allusion.",
    ),
    resourceTopics: ['repentance', 'trust', 'prodigals'],
  },
  {
    movement: 'hope',
    theme: { en: 'Wisdom for each decision', fr: 'La sagesse pour chaque décision', es: 'Sabiduría para cada decisión', pt: 'Sabedoria para cada decisão', de: 'Weisheit für jede Entscheidung', ru: 'Мудрость для каждого решения', zh: '在每个抉择中求智慧', ja: '一つひとつの決断に知恵を', ko: '하나하나의 결정에 필요한 지혜', ar: 'حكمة لكل قرار', fa: 'حکمت برای هر تصمیم', hi: 'हर निर्णय के लिए बुद्धि', id: 'Hikmat untuk setiap keputusan', sw: 'Hekima kwa kila uamuzi', tl: 'Karunungan sa bawat pasya', am: 'ለእያንዳንዱ ውሳኔ ጥበብ' },
    ref: 'James 1:5-8',
    related: ['James 3:17-18', 'Proverbs 3:5-7'],
    reflection: L(
      'Loving someone who has wandered raises a hundred practical questions. Do you lend the money? Go to the wedding? Welcome their partner at Christmas? Mention church, or leave it? James tells anyone who lacks wisdom to ask God, who gives freely and without finding fault. That is not a script for every decision, but it is an invitation to ask without shame. Later he describes the wisdom from above: it makes peace, it is gentle, it listens to reason and it is full of mercy. Let that test the answers you reach.',
      "Aimer quelqu'un qui s'est éloigné soulève mille questions concrètes. Prêter l'argent ? Aller au mariage ? Accueillir son compagnon ou sa compagne à Noël ? Parler de l'Église, ou pas ? Jacques dit à celui qui manque de sagesse de la demander à Dieu, qui donne généreusement et sans faire de reproche. Ce n'est pas un mode d'emploi pour chaque décision, mais c'est une invitation à demander sans honte. Plus loin, il décrit la sagesse d'en haut : elle fait la paix, elle est douce, elle écoute la raison et elle est pleine de miséricorde. Que ce soit la pierre de touche de tes réponses.",
    ),
    prompts: [
      L('Bring God one decision you are facing about the person you love, and ask Him plainly for wisdom.', "Présente à Dieu une décision que tu dois prendre au sujet de la personne que tu aimes, et demande-Lui simplement la sagesse."),
      L('If you share this burden with a spouse or other relatives, pray for unity between you in the choices you make.', "Si tu portes ce fardeau avec un conjoint ou d'autres proches, prie pour l'unité entre vous dans les choix que vous faites."),
      L('Thank God that He gives wisdom freely and does not hold your asking against you.', "Remercie Dieu : Il donne la sagesse généreusement et ne te reproche pas de la demander."),
    ],
    selfPrompt: L(
      'Are you asking God for wisdom, or for permission to do what you have already decided? Ask Him to make you truly open.',
      "Demandes-tu à Dieu la sagesse, ou la permission de faire ce que tu as déjà décidé ? Demande-Lui de te rendre vraiment ouvert.",
    ),
    practice: L(
      'List the decisions you face about them, choose the most pressing, and talk it through this week with a pastor or a mature believer who knows your family.',
      "Fais la liste des décisions qui t'attendent à son sujet, choisis la plus urgente, et parles-en cette semaine avec un pasteur ou un croyant mûr qui connaît ta famille.",
    ),
    resourceTopics: ['wisdom', 'discernment', 'family'],
  },
  {
    movement: 'hope',
    theme: { en: 'When hard times come', fr: 'Quand viennent les temps durs', es: 'Cuando llegan los tiempos difíciles', pt: 'Quando chegam os tempos difíceis', de: 'Wenn harte Zeiten kommen', ru: 'Когда приходят трудные времена', zh: '当艰难临到', ja: '苦難が訪れるとき', ko: '어려움이 닥칠 때', ar: 'حين تأتي الأوقات الصعبة', fa: 'وقتی روزهای سخت می‌رسد', hi: 'जब कठिन समय आए', id: 'Ketika masa sulit datang', sw: 'Nyakati ngumu zinapofika', tl: 'Kapag dumating ang mahihirap na panahon', am: 'አስቸጋሪ ጊዜ ሲመጣ' },
    ref: 'Psalm 107:1-9',
    related: ['Psalm 107:10-16', 'Psalm 107:17-22'],
    reflection: L(
      'Psalm 107 gathers people in very different troubles. Some wandered in the desert, lost and hungry. Some sat in darkness because they had rebelled. Some fell ill through their own folly; others were caught in a storm while simply doing their work. Not every trouble is a punishment, and not every wanderer is a rebel. Yet each group cried to the Lord, and each found His steadfast love. When hard times reach the person you love, resist both the urge to rescue at once and the urge to read it as a verdict.',
      "Le Psaume 107 rassemble des gens pris dans des détresses très différentes. Certains erraient au désert, perdus et affamés. D'autres étaient assis dans les ténèbres parce qu'ils s'étaient révoltés. D'autres encore étaient tombés malades par leur propre folie, ou pris dans une tempête alors qu'ils faisaient simplement leur travail. Toute épreuve n'est pas une punition, et tout égaré n'est pas un rebelle. Pourtant, chacun a crié vers le Seigneur, et chacun a trouvé Son amour fidèle. Quand des temps durs atteignent la personne que tu aimes, résiste à la fois à l'envie de la secourir aussitôt et à celle d'y lire un verdict.",
    ),
    prompts: [
      L('Pray for the person you love in whatever trouble they face now, that it would become a place where they cry out and find mercy.', "Prie pour la personne que tu aimes dans la difficulté qu'elle traverse, afin qu'elle y crie vers Dieu et y trouve Sa miséricorde."),
      L('Ask God to guard your heart from any secret satisfaction, from every unspoken "I told you so".', "Demande à Dieu de garder ton cœur de toute satisfaction secrète, de tout « je te l'avais bien dit » inavoué."),
      L('Ask Him for wisdom to tell help that heals from rescue that only postpones the problem.', "Demande-Lui la sagesse de distinguer l'aide qui guérit du sauvetage qui ne fait que repousser le problème."),
    ],
    selfPrompt: L(
      'Recall a time you cried out to God in trouble of your own making, and thank Him for the steadfast love you found.',
      "Souviens-toi d'un moment où tu as crié vers Dieu dans une détresse dont tu étais toi-même la cause, et remercie-Le pour l'amour fidèle que tu as trouvé.",
    ),
    practice: L(
      'When their next crisis comes, if it is not an emergency, take a day to pray before you respond, and ask one wise person what real help would look like.',
      "À sa prochaine crise, si ce n'est pas une urgence, prends un jour pour prier avant de répondre, et demande à une personne sage à quoi ressemblerait une aide véritable.",
    ),
    resourceTopics: ['suffering', 'wisdom', 'prodigals'],
  },
  {
    movement: 'hope',
    theme: { en: 'Love can say no', fr: "L'amour peut dire non", es: 'El amor puede decir no', pt: 'O amor pode dizer não', de: 'Liebe kann Nein sagen', ru: 'Любовь может сказать «нет»', zh: '爱也可以说“不”', ja: '愛は「いいえ」と言える', ko: '사랑은 거절할 수 있다', ar: 'المحبة تستطيع أن تقول لا', fa: 'محبت می‌تواند «نه» بگوید', hi: 'प्रेम ना भी कह सकता है', id: 'Kasih bisa berkata tidak', sw: 'Upendo unaweza kusema hapana', tl: 'Ang pag-ibig ay maaaring tumanggi', am: 'ፍቅር እምቢ ማለት ይችላል' },
    ref: 'Galatians 6:1-5',
    related: ['Proverbs 22:3', 'Luke 4:28-30'],
    reflection: L(
      "Paul holds three things together. Restore gently the one who has stumbled, keeping watch on yourself. Carry one another's heavy burdens. And remember that each person must still carry their own load. Love helps with what is too heavy to bear alone; it does not take over what belongs to someone else. So love can say no: no to money that feeds an addiction, no to lies, no to abuse in your home. The prudent see danger and take shelter, and Jesus Himself walked away from a crowd that meant Him harm.",
      "Paul tient trois choses ensemble. Relever avec douceur celui qui a trébuché, en veillant sur soi-même. Porter les fardeaux trop lourds les uns des autres. Et se rappeler que chacun doit tout de même porter sa propre charge. L'amour aide à porter ce qui est trop lourd pour une seule personne ; il ne prend pas en main ce qui appartient à l'autre. L'amour peut donc dire non : non à l'argent qui alimente une addiction, non aux mensonges, non à la violence sous ton toit. L'homme prudent voit le danger et se met à l'abri, et Jésus Lui-même s'est éloigné d'une foule qui voulait Lui faire du mal.",
    ),
    prompts: [
      L('Ask God to show you one place where you have been carrying a load that belongs to the person you love.', "Demande à Dieu de te montrer un domaine où tu portes une charge qui appartient à la personne que tu aimes."),
      L('Pray for courage to say a clear, kind no where love requires it, and for peace after you have said it.', "Prie pour avoir le courage de dire un non clair et bienveillant là où l'amour l'exige, et pour la paix une fois que tu l'auras dit."),
      L("Pray for their safety, and for everyone affected by their choices, especially any children.", "Prie pour sa sécurité et pour toutes les personnes touchées par ses choix, en particulier les enfants."),
    ],
    selfPrompt: L(
      'Do you fear that a boundary makes you a worse Christian? Bring that fear to God, and ask Him for a love that is both warm and wise.',
      "Crains-tu qu'une limite fasse de toi un moins bon chrétien ? Apporte cette crainte à Dieu, et demande-Lui un amour à la fois chaleureux et sage.",
    ),
    practice: L(
      'Write down one boundary you need in a single calm sentence, and talk it over with a pastor, counsellor or trusted believer before you share it.',
      "Écris en une phrase calme une limite dont tu as besoin, et parles-en avec un pasteur, un conseiller ou un croyant de confiance avant de la communiquer.",
    ),
    safetyNote: L(
      'Protecting yourself and others is not a failure of love, and forgiveness never requires you to stay in harm\'s way. If the person you love is violent, threatening, exploiting you or others, or caught in an addiction, you do not have to face it alone: talk to your pastor, a counsellor, or an addiction or family support service. If anyone is in immediate danger, call the police or emergency services. If children or vulnerable adults are at risk, contact the relevant protection services.',
      "Te protéger et protéger les autres n'est pas un manque d'amour, et le pardon ne t'oblige jamais à rester exposé au danger. Si la personne que tu aimes est violente, menaçante, t'exploite ou exploite d'autres personnes, ou si elle est prise dans une addiction, tu n'as pas à y faire face seul : parles-en à ton pasteur, à un conseiller, ou à un service d'aide aux personnes dépendantes et à leurs familles. Si quelqu'un est en danger immédiat, appelle la police ou les services d'urgence. Si des enfants ou des adultes vulnérables sont menacés, contacte les services de protection compétents.",
    ),
    resourceTopics: ['boundaries', 'addiction', 'family'],
  },
  {
    movement: 'hope',
    theme: { en: "God's patience is longer than ours", fr: 'La patience de Dieu dépasse la nôtre', es: 'La paciencia de Dios supera la nuestra', pt: 'A paciência de Deus vai além da nossa', de: 'Gottes Geduld reicht weiter als unsere', ru: 'Терпение Бога больше нашего', zh: '神的忍耐比我们长久', ja: '神様の忍耐は私たちより長い', ko: '우리보다 오래 참으시는 하나님', ar: 'صبر الله أطول من صبرنا', fa: 'صبر خدا از صبر ما بیشتر است', hi: 'परमेश्वर का धीरज हमसे बड़ा है', id: 'Kesabaran Allah melampaui kesabaran kita', sw: 'Uvumilivu wa Mungu unazidi wetu', tl: 'Mas mahaba ang pagtitiis ng Diyos kaysa sa atin', am: 'የእግዚአብሔር ትዕግሥት ከእኛ ይበልጣል' },
    ref: '2 Peter 3:8-9',
    related: ['1 Timothy 2:3-4', 'Psalm 31:14-15'],
    reflection: L(
      "Peter writes to believers unsettled by scoffers who asked why the Lord's promised coming was taking so long. His answer: God does not measure time as we do, and what looks like slowness is patience, because He wants no one to be lost and everyone to turn back to Him. This shows God's heart, not a timetable for the person you love, and it does not settle in advance how any one story ends. But it means the waiting you share with God is patience, not neglect.",
      "Pierre écrit à des croyants troublés par des moqueurs qui demandaient pourquoi le retour promis du Seigneur tardait tant. Sa réponse : Dieu ne mesure pas le temps comme nous, et ce qui ressemble à de la lenteur est de la patience, car Il ne veut qu'aucun ne se perde et désire que tous reviennent à Lui. Cela révèle le cœur de Dieu, non un calendrier pour la personne que tu aimes, et cela ne décide pas d'avance de la fin d'une histoire particulière. Mais l'attente que tu partages avec Dieu est patience, et non abandon.",
    ),
    prompts: [
      L('Thank God that His patience toward the person you love is greater than yours.', "Remercie Dieu : Sa patience envers la personne que tu aimes est plus grande que la tienne."),
      L('Tell Him honestly where your own patience has run out, and ask Him to renew it.', "Dis-Lui honnêtement où ta propre patience s'est épuisée, et demande-Lui de la renouveler."),
      L('Place their times in His hands, as David did with his own, and let go of any deadline you have set.', "Remets son temps entre Ses mains, comme David l'a fait pour le sien, et renonce à toute échéance que tu t'es fixée."),
    ],
    selfPrompt: L(
      'How patient has God been with you? Name one area where He waited for you longer than you deserved, and thank Him.',
      "Combien Dieu a-t-Il été patient avec toi ? Nomme un domaine où Il t'a attendu plus longtemps que tu ne le méritais, et remercie-Le.",
    ),
    practice: L(
      'If you have set a private deadline for their return — a birthday, a wedding, a year — write it down, then cross it out as an act of trust.',
      "Si tu t'es fixé une échéance secrète pour son retour — un anniversaire, un mariage, une année —, écris-la, puis barre-la en signe de confiance.",
    ),
    resourceTopics: ['trust', 'repentance', 'prodigals'],
  },
  {
    movement: 'hope',
    theme: { en: 'Prayers kept before God', fr: 'Des prières gardées devant Dieu', es: 'Oraciones guardadas ante Dios', pt: 'Orações guardadas diante de Deus', de: 'Gebete, bei Gott bewahrt', ru: 'Молитвы, хранимые перед Богом', zh: '在神面前存留的祷告', ja: '神様の前に覚えられている祈り', ko: '하나님 앞에 간직된 기도', ar: 'صلوات محفوظة أمام الله', fa: 'دعاهایی که نزد خدا نگاه داشته می‌شوند', hi: 'परमेश्वर के सामने रखी गई प्रार्थनाएँ', id: 'Doa yang tersimpan di hadapan Allah', sw: 'Maombi yaliyohifadhiwa mbele za Mungu', tl: 'Mga panalanging iniingatan sa harap ng Diyos', am: 'በእግዚአብሔር ፊት የተጠበቁ ጸሎቶች' },
    ref: 'Revelation 5:8',
    related: ['Revelation 8:3-4', 'Psalm 56:8', 'Hebrews 11:13'],
    reflection: L(
      "In John's vision of heaven, the elders hold golden bowls full of incense, and the incense is the prayers of God's people; later those prayers rise before God with the smoke. It is picture language, and it does not tell us how or when each prayer will be answered. But it shows prayers gathered and held before the throne, not lost. David trusted that God kept count of his tears. Some who pray faithfully do not see the answer in this life. Their prayers are still before Him.",
      "Dans la vision de Jean, les anciens tiennent des coupes d'or remplies de parfums, et ces parfums sont les prières du peuple de Dieu ; plus loin, ces prières montent devant Dieu avec la fumée de l'encens. C'est un langage imagé, qui ne dit ni comment ni quand chaque prière sera exaucée. Mais il montre les prières recueillies et gardées devant le trône, et non perdues. David savait que Dieu tenait le compte de ses larmes. Certains prient fidèlement sans voir la réponse en cette vie. Leurs prières demeurent devant Lui.",
    ),
    prompts: [
      L('Thank God that not one of the prayers you have prayed for the person you love has been forgotten before Him.', "Remercie Dieu : aucune des prières que tu as faites pour la personne que tu aimes n'est oubliée devant Lui."),
      L('Bring Him the tears you have cried over them, and trust Him with every one.', "Apporte-Lui les larmes que tu as versées pour elle, et confie-Lui chacune d'elles."),
      L('Pray for them again today, adding one more prayer to all the others.', "Prie encore pour elle aujourd'hui, et ajoute une prière à toutes les autres."),
    ],
    selfPrompt: L(
      'Do you fear that your prayers have been wasted? Tell God that fear, and ask Him to steady you with what Scripture shows of His care.',
      "Crains-tu que tes prières aient été vaines ? Dis cette crainte à Dieu, et demande-Lui de t'affermir par ce que l'Écriture montre de Son attention.",
    ),
    practice: L(
      'Look back through your journal or your memory, write down three things you have asked for them over the years, and thank God that He holds every one.',
      "Parcours ton journal ou ta mémoire, note trois choses que tu as demandées pour elle au fil des années, et remercie Dieu de les garder toutes.",
    ),
    resourceTopics: ['intercession', 'prayer', 'grief'],
  },
  {
    movement: 'hope',
    theme: { en: "Into the Father's hands", fr: 'Entre les mains du Père', es: 'En las manos del Padre', pt: 'Nas mãos do Pai', de: 'In die Hände des Vaters', ru: 'В руки Отца', zh: '交在天父手中', ja: '御父の御手にゆだねる', ko: '아버지의 손에 맡기다', ar: 'بين يدي الآب', fa: 'در دستان پدر', hi: 'पिता के हाथों में', id: 'Ke dalam tangan Bapa', sw: 'Mikononi mwa Baba', tl: 'Sa mga kamay ng Ama', am: 'በአብ እጆች' },
    ref: 'Mark 14:32-36',
    related: ['1 Peter 5:6-7', 'Psalm 131'],
    reflection: L(
      "In Gethsemane Jesus is deeply distressed, and He does not hide it. He calls God Abba, says that everything is possible for Him, and asks plainly for the cup to be taken away. Then He yields His will to the Father's. Surrender is not giving up on prayer, and it is not pretending you want nothing. It is asking with your whole heart for what you long for, and then placing the person you love, and yourself, in the Father's hands.",
      "À Gethsémané, Jésus est profondément troublé, et Il ne le cache pas. Il appelle Dieu « Abba », affirme que tout Lui est possible, et Lui demande sans détour d'éloigner cette coupe. Puis Il remet Sa volonté à celle du Père. S'abandonner ainsi, ce n'est ni renoncer à prier, ni faire semblant de ne rien désirer. C'est demander de tout ton cœur ce que tu désires, puis remettre la personne que tu aimes, et toi-même, entre les mains du Père.",
    ),
    prompts: [
      L('Ask God, with your whole heart, for what you most long for in the life of the person you love.', "Demande à Dieu, de tout ton cœur, ce que tu désires le plus pour la vie de la personne que tu aimes."),
      L("Then place them in the Father's hands, and tell Him you trust Him with what you cannot control.", "Puis remets-la entre les mains du Père, et dis-Lui que tu Lui fais confiance pour ce que tu ne maîtrises pas."),
      L('Cast onto Him the particular anxiety that wakes you at night, knowing that He cares about you.', "Décharge sur Lui l'inquiétude précise qui te réveille la nuit, sachant qu'Il prend soin de toi."),
    ],
    selfPrompt: L(
      'What would it mean for you to be at peace even if this prayer is not answered as you hope? Tell God honestly how far you can say yes to that today.',
      "Que signifierait pour toi être en paix, même si cette prière n'est pas exaucée comme tu l'espères ? Dis honnêtement à Dieu jusqu'où tu peux y consentir aujourd'hui.",
    ),
    practice: L(
      "As you pray today, rest your open hands on your lap as a sign that you are placing them, and yourself, in the Father's care.",
      "En priant aujourd'hui, pose tes mains ouvertes sur tes genoux, en signe que tu remets la personne que tu aimes, et toi-même, aux soins du Père.",
    ),
    resourceTopics: ['trust', 'prayer', 'prodigals'],
  },
  {
    movement: 'hope',
    theme: { en: 'The God of hope', fr: "Le Dieu de l'espérance", es: 'El Dios de la esperanza', pt: 'O Deus da esperança', de: 'Der Gott der Hoffnung', ru: 'Бог надежды', zh: '使人有盼望的神', ja: '希望の神', ko: '소망의 하나님', ar: 'إله الرجاء', fa: 'خدای امید', hi: 'आशा का परमेश्वर', id: 'Allah sumber pengharapan', sw: 'Mungu wa tumaini', tl: 'Ang Diyos ng pag-asa', am: 'የተስፋ አምላክ' },
    ref: 'Romans 15:13',
    related: ['Luke 15:20', 'Jude 1:24-25'],
    reflection: L(
      'Paul ends the main teaching of Romans with a prayer: that the God of hope would fill believers with joy and peace as they trust Him, so that they overflow with hope by the power of the Holy Spirit. Christian hope rests not on reading the future but on who God is, and His Spirit sustains it. You finish this plan without knowing the end of the story of the one you love. Like the father in the parable, keep watching the road, keep praying, and let the Spirit keep your hope alive.',
      "Paul conclut l'essentiel de sa lettre aux Romains par une prière : que le Dieu de l'espérance remplisse les croyants de joie et de paix dans la foi, pour qu'ils débordent d'espérance par la puissance du Saint-Esprit. L'espérance chrétienne ne repose pas sur la lecture de l'avenir, mais sur ce qu'est Dieu, et c'est Son Esprit qui la soutient. Tu termines ce parcours sans connaître la fin de l'histoire de la personne que tu aimes. Comme le père de la parabole, continue de regarder la route, continue de prier, et laisse l'Esprit garder ton espérance vivante.",
    ),
    prompts: [
      L('Thank God for carrying you through these thirty days, and for every way He met you in them.', "Remercie Dieu de t'avoir porté pendant ces trente jours, et pour chaque manière dont Il t'y a rejoint."),
      L('Entrust the person you love once more to the One who is able to keep them from stumbling, and ask Him to watch over them.', "Confie encore la personne que tu aimes à Celui qui peut la garder de toute chute, et demande-Lui de veiller sur elle."),
      L('Ask the Holy Spirit to fill you with a hope that does not depend on what you can see, and to keep you praying.', "Demande au Saint-Esprit de te remplir d'une espérance qui ne dépend pas de ce que tu vois, et de te garder dans la prière."),
    ],
    selfPrompt: L(
      'What has God changed in you during this plan? Name it, thank Him, and ask Him to keep shaping your heart as you go on praying.',
      "Qu'est-ce que Dieu a changé en toi pendant ce parcours ? Nomme-le, remercie-Le, et demande-Lui de continuer à façonner ton cœur tandis que tu continues de prier.",
    ),
    practice: L(
      'Decide how you will keep praying for them from here — a set day each week, one line each morning, a friend to pray with — and put it in your calendar today.',
      "Décide comment tu continueras à prier pour elle à partir de maintenant — un jour fixe chaque semaine, une phrase chaque matin, un ami avec qui prier — et inscris-le aujourd'hui dans ton agenda.",
    ),
    resourceTopics: ['intercession', 'trust', 'holy-spirit'],
  },
];
