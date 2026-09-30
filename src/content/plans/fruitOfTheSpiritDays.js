// The 10 days of "The Fruit of the Spirit" (see ./fruitOfTheSpirit.js for the
// plan meta, the movements and the guardrails this content is held to).
//
// Each day follows one rhythm: receive (reflection), examine (selfPrompt —
// honest, gracious, never shaming), pray (prompts), practise (practice).
// Prose is authored in en + fr; `theme` is authored in all 16 languages.
// Scripture is stored as references only — no Bible text lives in this file.
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Life in the Spirit ─────────────────────────────────────────────────────
  {
    movement: 'spirit',
    theme: { en: 'Walking by the Spirit', fr: "Marcher selon l'Esprit", es: 'Andar en el Espíritu', pt: 'Andar no Espírito', de: 'Im Geist leben', ru: 'Поступать по Духу', zh: '顺着圣灵而行', ja: '御霊によって歩む', ko: '성령을 따라 행하기', ar: 'السلوك بالروح', fa: 'رفتار کردن به روح', hi: 'आत्मा के अनुसार चलना', id: 'Hidup oleh Roh', sw: 'Kuenenda kwa Roho', tl: 'Paglakad ayon sa Espiritu', am: 'በመንፈስ መመላለስ' },
    ref: 'Galatians 5:13-26',
    related: ['John 15:1-8', 'Romans 8:12-14'],
    reflection: L(
      "Paul was writing to churches where believers had begun to turn on one another. Freedom in Christ, he insists, is no opening for the flesh; it is freedom to serve one another in love. Notice his contrast: the flesh produces many \"works\", more than half of them quarrels and divisions, while the Spirit bears one fruit. You cannot manufacture fruit. You can walk by the Spirit, keep in step with Him, and stay joined to Christ, the true vine.",
      "Paul écrivait à des Églises où les croyants avaient commencé à se déchirer. La liberté en Christ, insiste-t-il, n'ouvre pas la porte à la chair : c'est la liberté de se mettre au service les uns des autres par amour. Remarque le contraste : la chair produit de nombreuses « œuvres », dont plus de la moitié sont des querelles et des divisions, tandis que l'Esprit porte un seul fruit. Tu ne peux pas fabriquer ce fruit. Tu peux marcher selon l'Esprit, marcher à Son pas, et demeurer attaché à Christ, le vrai cep.",
    ),
    prompts: [
      L('Thank God that in Christ you are free, and ask Him to turn that freedom toward serving the people around you.', "Remercie Dieu : en Christ, tu es libre. Demande-Lui de tourner cette liberté vers le service des personnes qui t'entourent."),
      L('Ask the Holy Spirit to fill you afresh today and to lead you step by step, not all at once.', "Demande au Saint-Esprit de te remplir à nouveau aujourd'hui et de te conduire pas à pas, pas tout d'un coup."),
      L('Confess one work of the flesh that has been shaping your words or reactions, and receive His forgiveness.', 'Confesse une œuvre de la chair qui a marqué tes paroles ou tes réactions, et reçois Son pardon.'),
    ],
    selfPrompt: L(
      'Where have you been trying to build good character by willpower alone? Tell God plainly, without shame: fruit grows on branches that stay joined to the vine.',
      "Où as-tu essayé de te construire un bon caractère à la seule force de ta volonté ? Dis-le simplement à Dieu, sans honte : le fruit pousse sur les sarments qui restent attachés au cep.",
    ),
    practice: L(
      'Before you open your messages or leave home today, take one minute to ask the Spirit to lead your next conversation.',
      "Aujourd'hui, avant d'ouvrir tes messages ou de sortir de chez toi, prends une minute pour demander à l'Esprit de conduire ta prochaine conversation.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'holy-spirit', 'spiritual-formation'],
  },
  {
    movement: 'spirit',
    theme: { en: 'Love that never ends', fr: "L'amour qui ne passe jamais", es: 'Un amor que no se acaba', pt: 'Um amor que não acaba', de: 'Eine Liebe, die bleibt', ru: 'Любовь, которая не проходит', zh: '永不消逝的爱', ja: '終わることのない愛', ko: '끝나지 않는 사랑', ar: 'محبة لا تنتهي', fa: 'محبتی که پایان ندارد', hi: 'कभी न मिटने वाला प्रेम', id: 'Kasih yang tidak pernah berakhir', sw: 'Upendo usiokoma', tl: 'Pag-ibig na walang katapusan', am: 'የማያልቅ ፍቅር' },
    ref: '1 Corinthians 13:1-7',
    related: ['Romans 5:5', '1 John 4:7-12'],
    reflection: L(
      "Corinth had no shortage of spiritual gifts — tongues, prophecy, knowledge — yet Paul says that without love all of it adds up to nothing. The love he goes on to describe is patient, unselfish and slow to take offence: less a feeling than a way of treating people, and a portrait of Christ Himself. You do not squeeze it out of your own reserves. Paul tells the Romans that God's love has been poured into our hearts through the Holy Spirit.",
      "Les dons spirituels ne manquaient pas à Corinthe — langues, prophétie, connaissance —, et pourtant Paul affirme que sans l'amour, tout cela ne vaut rien. L'amour qu'il décrit ensuite est patient, désintéressé, lent à s'offenser : moins un sentiment qu'une manière de traiter les autres, et un portrait de Christ lui-même. Tu ne le tires pas de tes propres réserves. Paul écrit aux Romains que l'amour de Dieu a été répandu dans nos cœurs par le Saint-Esprit.",
    ),
    prompts: [
      L('Thank God that His love reached you first, in Christ, before you had anything to offer Him.', "Remercie Dieu : Son amour t'a rejoint le premier, en Christ, avant que tu aies quoi que ce soit à Lui offrir."),
      L('If you use spiritual gifts, ask the Spirit to make love both the reason and the manner of every one of them.', "Si tu exerces des dons spirituels, demande à l'Esprit que l'amour en soit toujours le motif et la manière."),
      L('Pray by name for someone you find hard to love, and ask God to show you one way to seek their good.', 'Prie nommément pour une personne que tu as du mal à aimer, et demande à Dieu de te montrer une manière de rechercher son bien.'),
    ],
    selfPrompt: L(
      'Read the description of love slowly, putting your own name where the word "love" stands. Where does it stop being true? Bring that to God without condemning yourself.',
      "Relis lentement la description de l'amour en mettant ton prénom à la place du mot « amour ». À quel endroit cela cesse-t-il d'être vrai ? Apporte-le à Dieu sans te condamner.",
    ),
    practice: L(
      'Do one unnoticed act of love today for someone at home, at church or at work, and tell no one about it.',
      "Pose aujourd'hui un geste d'amour discret pour quelqu'un de ta maison, de ton Église ou de ton travail, sans en parler à personne.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'character', 'community'],
  },
  {
    movement: 'spirit',
    theme: { en: 'Joy in the midst of sorrow', fr: 'La joie au milieu des larmes', es: 'Gozo en medio de la tristeza', pt: 'Alegria em meio à tristeza', de: 'Freude mitten im Kummer', ru: 'Радость среди печали', zh: '忧愁中的喜乐', ja: '悲しみの中の喜び', ko: '슬픔 가운데 기쁨', ar: 'فرح في وسط الحزن', fa: 'شادی در میان اندوه', hi: 'दुःख के बीच आनन्द', id: 'Sukacita di tengah dukacita', sw: 'Furaha katikati ya huzuni', tl: 'Kagalakan sa gitna ng lungkot', am: 'በሐዘን መካከል ደስታ' },
    ref: 'John 15:9-11',
    related: ['Nehemiah 8:9-12', '1 Thessalonians 1:6', 'Romans 14:17'],
    reflection: L(
      "Jesus spoke of His joy on the night He was betrayed, hours before the cross. The joy He shares with those who remain in His love cannot mean the absence of sorrow. In Nehemiah, people weeping over God's law were told to celebrate and to send portions to those who had nothing; the Thessalonians welcomed the word in great hardship, with joy given by the Spirit. This joy is not forced cheerfulness. It grows from belonging to Him.",
      "Jésus a parlé de Sa joie le soir où Il a été livré, quelques heures avant la croix. La joie qu'Il partage avec ceux qui demeurent dans Son amour ne peut donc pas être l'absence de tristesse. Chez Néhémie, un peuple en larmes devant la loi de Dieu est invité à faire la fête et à envoyer des portions à ceux qui n'ont rien ; les Thessaloniciens ont accueilli la Parole au milieu de grandes épreuves, avec la joie que donne l'Esprit. Cette joie n'est pas une gaieté forcée. Elle naît du fait de Lui appartenir.",
    ),
    prompts: [
      L('Thank Jesus for one concrete sign of His love that you can name today, however small.', "Remercie Jésus pour une marque concrète de Son amour que tu peux nommer aujourd'hui, même petite."),
      L('Tell God honestly about any sadness you carry, and ask Him for His joy alongside it rather than instead of it.', "Dis honnêtement à Dieu la tristesse que tu portes, et demande-Lui Sa joie à côté d'elle plutôt qu'à sa place."),
      L("Pray for someone who is grieving, that they may know the Lord's nearness in the middle of it.", "Prie pour une personne en deuil, afin qu'elle connaisse la proximité du Seigneur au cœur de son chagrin."),
    ],
    selfPrompt: L(
      'Where have you been pretending to be fine, or measuring your faith by your mood? Let God meet you as you really are today.',
      "Où as-tu fait semblant d'aller bien, ou mesuré ta foi à ton humeur ? Laisse Dieu te rejoindre tel que tu es vraiment aujourd'hui.",
    ),
    practice: L(
      'Like the people in Nehemiah, share something good today — a meal, a small treat or a note of thanks — with someone who has less than you.',
      "Comme le peuple au temps de Néhémie, partage aujourd'hui quelque chose de bon — un repas, une petite douceur ou un mot de gratitude — avec quelqu'un qui a moins que toi.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'worship', 'contentment'],
  },
  {
    movement: 'spirit',
    theme: { en: 'Peace that does not pretend', fr: 'Une paix qui ne fait pas semblant', es: 'Una paz que no finge', pt: 'Uma paz que não finge', de: 'Frieden, der nichts vortäuscht', ru: 'Мир без притворства', zh: '不假装的平安', ja: '見せかけではない平安', ko: '꾸미지 않는 평안', ar: 'سلام لا يتظاهر', fa: 'آرامشی بی‌تظاهر', hi: 'बिना दिखावे की शान्ति', id: 'Damai yang tidak berpura-pura', sw: 'Amani isiyo ya kujifanya', tl: 'Kapayapaang hindi nagkukunwari', am: 'የማያስመስል ሰላም' },
    ref: 'Philippians 4:2-9',
    related: ['John 14:27', 'Romans 5:1', 'Colossians 3:15'],
    reflection: L(
      "Paul's words on peace come straight after he names two co-workers, Euodia and Syntyche, who could not agree. He does not pretend the conflict away; he asks a trusted companion to help them. Peace here begins as peace with God through Christ, and becomes a guarded heart as we bring every worry to Him with thanksgiving. It does not deny trouble, grief or disagreement. It is Christ's presence in the middle of them.",
      "Les paroles de Paul sur la paix viennent juste après qu'il a nommé deux collaboratrices, Évodie et Syntyche, qui ne parvenaient pas à s'entendre. Il ne fait pas comme si le conflit n'existait pas : il demande à un compagnon fidèle de les aider. La paix commence ici par la paix avec Dieu par Christ, et devient un cœur gardé lorsque nous Lui présentons chaque souci avec des actions de grâces. Elle ne nie ni les difficultés, ni le deuil, ni les désaccords. C'est la présence de Christ au milieu d'eux.",
    ),
    prompts: [
      L('Thank God that through Christ you have peace with Him, whatever your feelings are doing today.', "Remercie Dieu : par Christ, tu es en paix avec Lui, quoi qu'en disent tes émotions aujourd'hui."),
      L('Bring Him each worry by name, and set beside it one thing you can thank Him for.', "Présente-Lui chacun de tes soucis en le nommant, et place à côté un sujet d'action de grâces."),
      L('Pray for a relationship or a church where there is tension, asking for honest words and real reconciliation.', 'Prie pour une relation ou une Église où règnent des tensions : demande des paroles vraies et une réconciliation réelle.'),
    ],
    selfPrompt: L(
      'Is there a disagreement you have been avoiding just to keep things quiet? Ask God what a peacemaking step could look like.',
      "Y a-t-il un désaccord que tu évites simplement pour avoir la paix ? Demande à Dieu à quoi pourrait ressembler un pas vers une paix véritable.",
    ),
    practice: L(
      'Write down the worry that returns most often today, and beside it one thing that is true and good to fix your mind on, as Paul urges.',
      "Note le souci qui revient le plus souvent aujourd'hui, et à côté une chose vraie et bonne sur laquelle arrêter ta pensée, comme Paul y invite.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'conflict', 'prayer'],
  },

  // ── Toward others ──────────────────────────────────────────────────────────
  {
    movement: 'others',
    theme: { en: 'The patience of the farmer', fr: 'La patience du cultivateur', es: 'La paciencia del labrador', pt: 'A paciência do lavrador', de: 'Die Geduld des Bauern', ru: 'Терпение земледельца', zh: '农夫的忍耐', ja: '農夫の忍耐', ko: '농부의 인내', ar: 'صبر الفلاح', fa: 'صبر کشاورز', hi: 'किसान का धीरज', id: 'Kesabaran seorang petani', sw: 'Uvumilivu wa mkulima', tl: 'Ang pagtitiyaga ng magsasaka', am: 'የገበሬው ትዕግሥት' },
    ref: 'James 5:7-11',
    related: ['1 Timothy 1:15-16', 'Ephesians 4:1-3'],
    reflection: L(
      "James calls for patience straight after denouncing rich landowners who held back their workers' wages. Patience, then, never calls wrong right; it leaves the final judgment to the Lord, like a farmer who has done his work and waits for the rains. Paul calls himself living proof of Christ's patience with sinners. The patience the Spirit grows in us begins as the patience we have received: slow to anger, ready to bear with others.",
      "Jacques appelle à la patience juste après avoir dénoncé des riches propriétaires qui retenaient le salaire de leurs ouvriers. La patience n'appelle donc jamais bien ce qui est mal : elle laisse le jugement final au Seigneur, comme un cultivateur qui a fait son travail et attend les pluies. Paul se présente comme la preuve vivante de la patience du Christ envers les pécheurs. La patience que l'Esprit fait grandir en nous commence par celle que nous avons reçue : lente à la colère, prête à supporter les autres.",
    ),
    prompts: [
      L('Thank Christ for the patience He has shown you, naming one way He has borne with you this year.', "Remercie Christ pour la patience qu'Il a eue envers toi, en nommant une manière dont Il t'a supporté cette année."),
      L('Bring to God the person or situation that most tries your patience, and ask for grace to respond in love.', "Apporte à Dieu la personne ou la situation qui met le plus ta patience à l'épreuve, et demande la grâce d'y répondre avec amour."),
      L('Pray for people waiting on what they cannot hurry — a diagnosis, a job, justice — that they would not lose heart.', "Prie pour ceux qui attendent ce qu'ils ne peuvent pas hâter — un diagnostic, un emploi, la justice —, afin qu'ils ne perdent pas courage."),
    ],
    selfPrompt: L(
      'Notice where impatience showed up this week: in traffic, in a queue, with the people closest to you. Name it honestly, and receive His patience before you try to show any.',
      "Remarque où l'impatience s'est montrée cette semaine : dans les bouchons, dans une file d'attente, avec tes proches. Nomme-la honnêtement, et reçois Sa patience avant d'essayer d'en faire preuve.",
    ),
    practice: L(
      'The next time you are kept waiting today, use those minutes to pray for the people who are holding you up.',
      "La prochaine fois qu'on te fera attendre aujourd'hui, utilise ces minutes pour prier pour les personnes qui te retardent.",
    ),
    safetyNote: L(
      'Patience never means staying in danger or putting up with abuse. If someone is hurting, threatening or controlling you, talk to someone you trust — a pastor, a counsellor or a mature believer — and if you are in immediate danger, contact the emergency services.',
      "La patience ne signifie jamais rester en danger ni supporter des abus. Si quelqu'un te fait du mal, te menace ou te contrôle, parles-en à une personne de confiance — un pasteur, un conseiller ou un chrétien mûr —, et si tu es en danger immédiat, contacte les services d'urgence.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'character', 'boundaries'],
  },
  {
    movement: 'others',
    theme: { en: 'Kindness that remembers grace', fr: 'Une bonté qui se souvient de la grâce', es: 'Una amabilidad que recuerda la gracia', pt: 'Amabilidade que lembra a graça', de: 'Freundlichkeit aus erfahrener Gnade', ru: 'Доброта, помнящая о благодати', zh: '记得恩典的恩慈', ja: '恵みを覚える親切', ko: '은혜를 기억하는 친절', ar: 'لطف يتذكّر النعمة', fa: 'مهربانی‌ای که فیض را به یاد دارد', hi: 'अनुग्रह से जन्मी दयालुता', id: 'Kemurahan yang lahir dari anugerah', sw: 'Utu wema unaotokana na neema', tl: 'Kagandahang-loob mula sa biyaya', am: 'ከጸጋ የሚመነጭ ቸርነት' },
    ref: 'Titus 3:1-7',
    related: ['Ephesians 4:31-32', 'Luke 6:35-36'],
    reflection: L(
      "Paul asks Titus to teach believers courtesy toward everyone, including people who are hard to like. His reason is not etiquette but memory: we too were once foolish and full of hostility, and then God showed His kindness and love by sending the Saviour. He saved us out of mercy, washing and renewing us by the Holy Spirit. Christian kindness remembers where it came from. Jesus adds that the Most High is kind even to the ungrateful.",
      "Paul demande à Tite d'enseigner aux croyants la courtoisie envers tous, y compris envers ceux qu'on a du mal à apprécier. Sa raison n'est pas la politesse, mais la mémoire : nous aussi, nous étions autrefois insensés et pleins d'hostilité, puis Dieu a manifesté Sa bonté et Son amour en envoyant le Sauveur. Il nous a sauvés par miséricorde, en nous lavant et en nous renouvelant par le Saint-Esprit. La bonté chrétienne se souvient d'où elle vient. Jésus ajoute que le Très-Haut est bon même envers les ingrats.",
    ),
    prompts: [
      L('Thank God for a time when His kindness reached you before you had changed at all.', "Remercie Dieu pour un moment où Sa bonté t'a rejoint avant même que tu aies changé."),
      L('Ask the Spirit to soften any bitterness or harsh speech in you, and to make you tender-hearted instead.', "Demande à l'Esprit d'adoucir en toi toute amertume ou toute parole dure, et de te rendre plutôt compatissant."),
      L('Pray for someone who is ungrateful or unkind to you, asking God to bless them and to guard your own heart.', "Prie pour quelqu'un qui se montre ingrat ou dur envers toi : demande à Dieu de le bénir et de garder ton propre cœur."),
    ],
    selfPrompt: L(
      'Toward whom are you kind only when kindness is returned? Ask God to show you, gently, where your kindness keeps accounts.',
      "Envers qui n'es-tu bon que lorsqu'on te le rend ? Demande à Dieu de te montrer, avec douceur, où ta bonté tient des comptes.",
    ),
    practice: L(
      'Do one kind thing today for someone who cannot repay you: a visit, a meal, a lift or an hour of your time.',
      "Fais aujourd'hui une chose bonne pour quelqu'un qui ne peut pas te la rendre : une visite, un repas, un trajet ou une heure de ton temps.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'forgiveness', 'hospitality'],
  },
  {
    movement: 'others',
    theme: { en: 'Goodness that keeps sowing', fr: 'Continuer à semer le bien', es: 'Bondad que sigue sembrando', pt: 'Bondade que continua semeando', de: 'Güte, die weiter sät', ru: 'Сеять добро без устали', zh: '持续撒种的良善', ja: '蒔き続ける善意', ko: '계속 심는 선함', ar: 'صلاح يواصل الزرع', fa: 'نیکویی که همچنان می‌کارد', hi: 'भलाई जो बोती रहती है', id: 'Kebaikan yang terus menabur', sw: 'Fadhili zinazoendelea kupanda', tl: 'Kabutihang patuloy na naghahasik', am: 'መዝራቱን የማያቆም በጎነት' },
    ref: 'Galatians 6:7-10',
    related: ['Acts 10:38', 'Romans 12:9-21'],
    reflection: L(
      "Near the end of Galatians, Paul turns the fruit into a farming picture: what is sown to the Spirit, the Spirit brings to harvest. Goodness is more than niceness. In Romans, Paul pairs holding fast to what is good with hating what is evil, and calls us to overcome evil with good. Peter summed up Jesus' ministry as the Spirit's power at work in doing good and freeing the oppressed. Paul's plea is simply that we not grow weary: the harvest keeps God's time, not ours.",
      "Vers la fin de Galates, Paul reprend l'image des semailles : ce qui est semé pour l'Esprit, l'Esprit le mène jusqu'à la moisson. Le bien dont il parle est plus qu'une simple gentillesse. Aux Romains, Paul associe l'attachement au bien et l'horreur du mal, et appelle à vaincre le mal par le bien. Pierre résume le ministère de Jésus comme la puissance de l'Esprit à l'œuvre pour faire le bien et libérer les opprimés. Paul demande simplement que nous ne nous lassions pas : la moisson suit le temps de Dieu, pas le nôtre.",
    ),
    prompts: [
      L('Thank Jesus for the good He did in healing and setting people free, and for the good He has done in your own life.', "Remercie Jésus pour le bien qu'Il a fait en guérissant et en libérant, et pour le bien qu'Il a accompli dans ta propre vie."),
      L('Ask the Spirit to give you a love for what is good and a real hatred of whatever harms people.', "Demande à l'Esprit de te donner l'amour du bien et une vraie horreur de tout ce qui fait du mal aux autres."),
      L('Pray for a believer in your church who is tired of doing good, that God would renew their strength.', 'Prie pour un croyant de ton Église qui est fatigué de faire le bien, afin que Dieu renouvelle ses forces.'),
    ],
    selfPrompt: L(
      'Where have you grown weary of doing good, or started doing it for applause? Tell God honestly, and ask Him for fresh strength.',
      "Où t'es-tu lassé de faire le bien, ou as-tu commencé à le faire pour être applaudi ? Dis-le honnêtement à Dieu, et demande-Lui une force nouvelle.",
    ),
    practice: L(
      'Choose one person in your church family today and do them a practical good: a meal, an errand or a word of encouragement.',
      "Choisis aujourd'hui une personne de ta famille d'Église et fais-lui un bien concret : un repas, une course ou un mot d'encouragement.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'generosity', 'holiness'],
  },

  // ── Steady character ───────────────────────────────────────────────────────
  {
    movement: 'steadfast',
    theme: { en: 'Faithful because He is faithful', fr: "Fidèle, parce qu'Il est fidèle", es: 'Fiel porque Él es fiel', pt: 'Fiel porque Ele é fiel', de: 'Treu, weil er treu ist', ru: 'Верный, потому что Он верен', zh: '因神信实而忠心', ja: '神が真実だから誠実に', ko: '그분이 신실하시기에 신실하게', ar: 'أمين لأنه أمين', fa: 'وفادار، چون او وفادار است', hi: 'विश्वासयोग्य, क्योंकि वह विश्वासयोग्य है', id: 'Setia karena Dia setia', sw: 'Mwaminifu kwa kuwa Yeye ni mwaminifu', tl: 'Tapat dahil Siya ay tapat', am: 'እርሱ ታማኝ ስለሆነ ታማኝ' },
    ref: 'Lamentations 3:19-26',
    related: ['Luke 16:10-12', '2 Timothy 2:11-13'],
    reflection: L(
      "Lamentations was written among the ruins of Jerusalem, and this passage does not hide its bitterness. Yet in the middle of it the poet chooses to call to mind the Lord's unfailing love and ever-renewed mercy, and confesses how great His faithfulness is. Faithfulness in us is an echo of His. Jesus says it shows first in very small things, and Paul reminds Timothy that even when we fail Him, Christ stays true to who He is.",
      "Les Lamentations ont été écrites au milieu des ruines de Jérusalem, et ce passage ne cache rien de son amertume. Pourtant, au cœur de ce chagrin, le poète choisit de se rappeler l'amour indéfectible du Seigneur et Sa compassion qui se renouvelle, et confesse la grandeur de Sa fidélité. La fidélité en nous est un écho de la Sienne. Jésus dit qu'elle se montre d'abord dans les toutes petites choses, et Paul rappelle à Timothée que, même quand nous Lui manquons, Christ reste fidèle à ce qu'Il est.",
    ),
    prompts: [
      L('Remember one specific time God was faithful to you in a hard season, and thank Him for it in detail.', "Souviens-toi d'un moment précis où Dieu t'a été fidèle dans une période difficile, et remercie-Le en détail."),
      L('Ask the Spirit to make you dependable in small things: your word, your time, the tasks nobody checks.', "Demande à l'Esprit de te rendre fiable dans les petites choses : ta parole, ton temps, les tâches que personne ne vérifie."),
      L('Pray for someone who has stayed faithful over many years — a pastor, a parent, an older believer — and ask God to sustain them.', "Prie pour quelqu'un qui est resté fidèle pendant de longues années — un pasteur, un parent, un croyant âgé — et demande à Dieu de le soutenir."),
    ],
    selfPrompt: L(
      'Is there a promise you made, to God or to someone else, that has quietly slipped? Bring it to Him honestly, and ask what faithfulness looks like now.',
      "Y a-t-il une promesse, faite à Dieu ou à quelqu'un, que tu as laissée glisser sans bruit ? Apporte-la-Lui honnêtement, et demande-Lui à quoi ressemble la fidélité aujourd'hui.",
    ),
    practice: L(
      'Keep one small commitment today exactly as you said you would — a call, a deadline, a time — and offer it to God as worship.',
      "Tiens aujourd'hui un petit engagement exactement comme tu l'avais dit — un appel, une échéance, un horaire — et offre-le à Dieu comme un acte d'adoration.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'character', 'trust'],
  },
  {
    movement: 'steadfast',
    theme: { en: 'The gentleness of Christ', fr: 'La douceur de Christ', es: 'La mansedumbre de Cristo', pt: 'A mansidão de Cristo', de: 'Die Sanftmut Christi', ru: 'Кротость Христа', zh: '基督的温柔', ja: 'キリストの柔和', ko: '그리스도의 온유', ar: 'وداعة المسيح', fa: 'ملایمت مسیح', hi: 'मसीह की नम्रता', id: 'Kelemahlembutan Kristus', sw: 'Upole wa Kristo', tl: 'Ang kaamuan ni Cristo', am: 'የክርስቶስ የዋህነት' },
    ref: 'Matthew 11:28-30',
    related: ['Galatians 6:1-2', '2 Timothy 2:24-26'],
    reflection: L(
      "When Jesus invites the weary to come to Him, He describes His own heart in terms of gentleness and humility, in contrast with teachers who loaded heavy burdens onto others. Yet the same Jesus drove the traders out of the temple. Gentleness is strength held in the service of love, not weakness. That is why Paul can ask spiritual believers to restore, gently, someone caught in sin, while watching themselves. Gentleness still confronts; it simply refuses to crush.",
      "Quand Jésus invite ceux qui sont fatigués à venir à Lui, Il décrit Son propre cœur par la douceur et l'humilité, à l'opposé de maîtres qui chargeaient les autres de fardeaux pesants. Pourtant, ce même Jésus a chassé les marchands du temple. La douceur est une force mise au service de l'amour, et non une faiblesse. C'est pourquoi Paul peut demander aux croyants spirituels de relever avec douceur celui qui est tombé dans une faute, en veillant sur eux-mêmes. La douceur sait encore reprendre ; elle refuse seulement d'écraser.",
    ),
    prompts: [
      L('Come to Jesus with whatever is wearing you out today, and thank Him that His heart toward you is gentle.', "Viens à Jésus avec ce qui t'épuise aujourd'hui, et remercie-Le : Son cœur envers toi est plein de douceur."),
      L('Ask the Spirit for gentleness in a conversation you need to have, so that truth is spoken to restore rather than to win.', "Demande à l'Esprit de la douceur pour une conversation que tu dois avoir, afin que la vérité soit dite pour relever, et non pour gagner."),
      L('Pray for pastors and leaders who must correct others, that they would do it with gentleness and humility.', "Prie pour les pasteurs et les responsables qui doivent reprendre les autres, afin qu'ils le fassent avec douceur et humilité."),
    ],
    selfPrompt: L(
      'Are you quicker to correct than to restore, or so eager to avoid conflict that you never speak? Ask God which way your heart leans.',
      "Es-tu plus prompt à corriger qu'à relever, ou si soucieux d'éviter le conflit que tu ne dis jamais rien ? Demande à Dieu de quel côté penche ton cœur.",
    ),
    practice: L(
      'Before you send a difficult message or have a hard conversation today, read it again and soften the tone without softening the truth.',
      "Avant d'envoyer un message difficile ou d'avoir une conversation délicate aujourd'hui, relis-toi et adoucis le ton sans affaiblir la vérité.",
    ),
    safetyNote: L(
      "Gentleness is never silence about harm. If a child or a vulnerable adult may be at risk, tell your church's safeguarding lead or the authorities. And if someone is harming you, seeking help and safety is not a failure of gentleness.",
      "La douceur n'est jamais le silence face au mal. Si un enfant ou un adulte vulnérable est peut-être en danger, préviens le responsable de la protection dans ton Église ou les autorités. Et si quelqu'un te fait du mal, chercher de l'aide et te mettre en sécurité n'est pas un manque de douceur.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'conflict', 'discipleship'],
  },
  {
    movement: 'steadfast',
    theme: { en: 'Self-control, trained by grace', fr: "La maîtrise de soi à l'école de la grâce", es: 'Dominio propio enseñado por la gracia', pt: 'Domínio próprio ensinado pela graça', de: 'Selbstbeherrschung, von der Gnade erzogen', ru: 'Самообладание, воспитанное благодатью', zh: '恩典教导的节制', ja: '恵みに教えられる自制', ko: '은혜가 가르치는 절제', ar: 'ضبط النفس بتعليم النعمة', fa: 'خویشتنداری که فیض می‌آموزد', hi: 'अनुग्रह से सीखा संयम', id: 'Penguasaan diri yang dididik anugerah', sw: 'Kiasi kinachofundishwa na neema', tl: 'Pagpipigil sa sarili na turo ng biyaya', am: 'ጸጋ የሚያስተምረው ራስን መግዛት' },
    ref: 'Titus 2:11-14',
    related: ['1 Corinthians 9:24-27', 'Galatians 5:24-25', '2 Peter 1:3-8'],
    reflection: L(
      "Paul writes that the same grace that saves us also schools us, teaching us to refuse what is ungodly and to live with self-control as we wait for Christ. Grace is the trainer. The effort is real, as Paul's picture of the disciplined athlete shows, but it is a response, not a wage. Self-control is not numbness either: Jesus wept, and grew angry without sin. Galatians ends its portrait of the fruit with a call: since the Spirit gives us life, let us keep in step with Him.",
      "Paul écrit que la grâce qui nous sauve est aussi celle qui nous éduque : elle nous apprend à refuser ce qui est impie et à vivre avec maîtrise de nous-mêmes en attendant Christ. La grâce est l'entraîneur. L'effort est réel, comme le montre l'image de l'athlète discipliné, mais c'est une réponse, non un salaire. La maîtrise de soi n'est pas non plus l'insensibilité : Jésus a pleuré, et s'est mis en colère sans pécher. Galates achève son portrait du fruit par un appel : puisque l'Esprit nous fait vivre, marchons aussi à Son pas.",
    ),
    prompts: [
      L('Thank God that His grace does not only forgive you but also trains you, patiently, day by day.', "Remercie Dieu : Sa grâce ne fait pas que te pardonner, elle t'éduque aussi, patiemment, jour après jour."),
      L('Name one desire or habit that tends to rule you, and ask the Spirit for strength to say no to it today.', "Nomme un désir ou une habitude qui a tendance à te dominer, et demande à l'Esprit la force de lui dire non aujourd'hui."),
      L('Looking back over these ten days, ask the Spirit to keep growing His fruit in you, and commit to keeping in step with Him.', "En repensant à ces dix jours, demande à l'Esprit de continuer à faire grandir Son fruit en toi, et engage-toi à marcher à Son pas."),
    ],
    selfPrompt: L(
      "Do you try to control your emotions by burying them, or let them make your choices for you? Bring both to God: the Spirit's self-control steadies the heart; it does not numb it.",
      "Essaies-tu de maîtriser tes émotions en les enfouissant, ou les laisses-tu décider à ta place ? Apporte l'un et l'autre à Dieu : la maîtrise que donne l'Esprit affermit le cœur, elle ne l'anesthésie pas.",
    ),
    practice: L(
      'Choose one small fast for today — your phone for an hour, a snack, or the last word in an argument — and turn each moment of wanting into a moment of prayer.',
      "Choisis pour aujourd'hui un petit jeûne — ton téléphone pendant une heure, un grignotage, ou le dernier mot dans une discussion — et fais de chaque envie un moment de prière.",
    ),
    resourceTopics: ['fruit-of-the-spirit', 'holiness', 'spiritual-rhythms', 'holy-spirit'],
  },
];
