// Theology explanations: short, pastoral, Scripture-rooted readings that teach
// the "why" behind prayer and the Christian life. These are learning sections,
// not prayers to recite. Every section is anchored in Scripture references the
// reader can open and weigh for themselves.
//
// Shape: { id, emoji, theme, title{en,fr}, summary{en,fr},
//          sections: [{ heading{en,fr}, body{en,fr}, refs: [] }] }

const articles = [
  {
    id: 'why-pray',
    relatedJourneyId: 'hope-behind-prayer',
    journeyInviteKey: 'gospelInviteWhyPray',
    emoji: '🤔',
    theme: 'foundations',
    title: { en: 'Why Christians pray', fr: 'Pourquoi les chrétiens prient' },
    summary: {
      en: 'Prayer is not informing a distant God of our needs, but communing with a Father who invites us near.',
      fr: 'La prière n\'est pas informer un Dieu lointain de nos besoins, mais communier avec un Père qui nous invite auprès de lui.',
    },
    sections: [
      {
        heading: { en: 'God invites us', fr: 'Dieu nous invite' },
        body: {
          en: 'We pray because God commands and welcomes it. Through Christ we have access to the Father — not as strangers, but as beloved children who may come boldly.',
          fr: 'Nous prions parce que Dieu le commande et nous y accueille. Par Christ, nous avons accès au Père — non comme des étrangers, mais comme des enfants bien-aimés qui peuvent venir avec assurance.',
        },
        refs: ['Hebrews 4:14-16', 'Romans 8:15'],
      },
      {
        heading: { en: 'It is dependence, not performance', fr: 'C\'est de la dépendance, non de la performance' },
        body: {
          en: 'Prayer confesses that we are not self-sufficient. Jesus says our Father already knows what we need — so we ask not to inform Him but to depend on Him.',
          fr: 'La prière confesse que nous ne nous suffisons pas à nous-mêmes. Jésus dit que notre Père sait déjà ce dont nous avons besoin — nous demandons donc non pour l\'informer, mais pour dépendre de lui.',
        },
        refs: ['Matthew 6:7-8', 'Philippians 4:6-7'],
      },
      {
        heading: { en: 'It changes us', fr: 'Elle nous transforme' },
        body: {
          en: 'In prayer we are shaped to want what God wants. We pray "your will be done," and slowly our hearts are bent toward His.',
          fr: 'Dans la prière, nous sommes façonnés pour vouloir ce que Dieu veut. Nous prions « que ta volonté soit faite », et peu à peu nos cœurs se tournent vers le sien.',
        },
        refs: ['Matthew 6:10', '1 John 5:14-15'],
      },
    ],
  },

  {
    id: 'jesus-taught',
    emoji: '🧎',
    theme: 'foundations',
    title: { en: 'How Jesus taught us to pray', fr: 'Comment Jésus nous a appris à prier' },
    summary: {
      en: 'Jesus taught prayer by His words and His life — simple, honest, trusting, and persistent.',
      fr: 'Jésus a enseigné la prière par ses paroles et sa vie — simple, sincère, confiante et persévérante.',
    },
    sections: [
      {
        heading: { en: 'Pray simply and sincerely', fr: 'Prie avec simplicité et sincérité' },
        body: {
          en: 'Jesus warned against showy, wordy prayers. Prayer is meant for the Father\'s ears, not the crowd\'s applause — honesty matters more than eloquence.',
          fr: 'Jésus a mis en garde contre les prières ostentatoires et verbeuses. La prière est destinée aux oreilles du Père, non aux applaudissements de la foule — la sincérité compte plus que l\'éloquence.',
        },
        refs: ['Matthew 6:5-8'],
      },
      {
        heading: { en: 'Pray with trust', fr: 'Prie avec confiance' },
        body: {
          en: 'He told us to ask, seek, and knock, because our Father gives good gifts to His children. We come to a good God, not a reluctant one.',
          fr: 'Il nous a dit de demander, chercher, frapper, parce que notre Père donne de bonnes choses à ses enfants. Nous venons à un Dieu bon, non réticent.',
        },
        refs: ['Matthew 7:7-11'],
      },
      {
        heading: { en: 'Pray persistently', fr: 'Prie avec persévérance' },
        body: {
          en: 'Jesus told parables urging us not to lose heart but to keep praying. And He showed us by example, often withdrawing to pray alone.',
          fr: 'Jésus a raconté des paraboles nous exhortant à ne pas nous décourager mais à prier sans cesse. Et il nous l\'a montré par l\'exemple, se retirant souvent pour prier seul.',
        },
        refs: ['Luke 18:1-8', 'Luke 5:16'],
      },
    ],
  },

  {
    id: 'lords-prayer',
    emoji: '🙏',
    theme: 'foundations',
    title: { en: 'The Lord\'s Prayer', fr: 'Le Notre Père' },
    summary: {
      en: 'The prayer Jesus gave us is a pattern for all prayer — God\'s glory first, then our needs.',
      fr: 'La prière que Jésus nous a donnée est un modèle pour toute prière — la gloire de Dieu d\'abord, puis nos besoins.',
    },
    sections: [
      {
        heading: { en: 'God\'s name, kingdom, will', fr: 'Le nom, le règne, la volonté de Dieu' },
        body: {
          en: 'We begin by addressing God as Father and seeking His glory: that His name be honored, His kingdom come, His will be done. Prayer starts with Him, not us.',
          fr: 'Nous commençons en nous adressant à Dieu comme Père et en cherchant sa gloire : que son nom soit honoré, que son règne vienne, que sa volonté soit faite. La prière commence par lui, non par nous.',
        },
        refs: ['Matthew 6:9-10'],
      },
      {
        heading: { en: 'Our daily needs', fr: 'Nos besoins quotidiens' },
        body: {
          en: 'Then we ask for daily bread, for forgiveness as we forgive others, and for deliverance from temptation and evil. God cares about ordinary, daily dependence.',
          fr: 'Puis nous demandons le pain quotidien, le pardon comme nous pardonnons aux autres, et la délivrance de la tentation et du mal. Dieu se soucie de la dépendance ordinaire et quotidienne.',
        },
        refs: ['Matthew 6:11-13'],
      },
      {
        heading: { en: 'A pattern, not a script', fr: 'Un modèle, non une formule' },
        body: {
          en: 'You can pray these very words, or use them as a frame to expand in your own. Either way, let them reorder your priorities God-ward.',
          fr: 'Tu peux prier ces paroles mêmes, ou t\'en servir comme cadre à développer avec tes mots. Dans les deux cas, laisse-les réordonner tes priorités vers Dieu.',
        },
        refs: ['Luke 11:1-4'],
      },
    ],
  },

  {
    id: 'intercession',
    emoji: '🤲',
    theme: 'practices',
    title: { en: 'What intercession is', fr: 'Qu\'est-ce que l\'intercession' },
    summary: {
      en: 'Intercession is standing before God on behalf of others — carrying their needs as our own.',
      fr: 'L\'intercession, c\'est se tenir devant Dieu en faveur des autres — porter leurs besoins comme les nôtres.',
    },
    sections: [
      {
        heading: { en: 'Praying for others', fr: 'Prier pour les autres' },
        body: {
          en: 'To intercede is to ask God to act for someone else. Scripture is full of intercessors — Abraham, Moses, Paul — who pleaded for others before God.',
          fr: 'Intercéder, c\'est demander à Dieu d\'agir pour quelqu\'un d\'autre. L\'Écriture est pleine d\'intercesseurs — Abraham, Moïse, Paul — qui ont plaidé pour d\'autres devant Dieu.',
        },
        refs: ['1 Timothy 2:1', 'Ephesians 6:18'],
      },
      {
        heading: { en: 'Christ intercedes for us', fr: 'Christ intercède pour nous' },
        body: {
          en: 'Our intercession echoes a greater one: Jesus Himself lives to intercede for His people, and the Spirit prays within us when we have no words.',
          fr: 'Notre intercession fait écho à une plus grande : Jésus lui-même est toujours vivant pour intercéder en faveur des siens, et l\'Esprit prie en nous quand les mots nous manquent.',
        },
        refs: ['Hebrews 7:25', 'Romans 8:26-27'],
      },
    ],
  },

  {
    id: 'confession',
    emoji: '🕊️',
    theme: 'practices',
    title: { en: 'What confession is', fr: 'Qu\'est-ce que la confession' },
    summary: {
      en: 'Confession is agreeing with God about our sin — and finding Him faithful to forgive.',
      fr: 'La confession, c\'est reconnaître notre péché devant Dieu — et le trouver fidèle pour pardonner.',
    },
    sections: [
      {
        heading: { en: 'Honesty before God', fr: 'L\'honnêteté devant Dieu' },
        body: {
          en: 'To confess is to stop hiding and to call sin what God calls it. We do not clean ourselves up first; we come as we are.',
          fr: 'Confesser, c\'est cesser de se cacher et d\'appeler le péché comme Dieu l\'appelle. Nous ne nous purifions pas d\'abord ; nous venons tels que nous sommes.',
        },
        refs: ['Psalm 32:3-5'],
      },
      {
        heading: { en: 'A faithful forgiver', fr: 'Un Dieu fidèle pour pardonner' },
        body: {
          en: 'God promises that if we confess, He is faithful and just to forgive and cleanse us. Forgiveness rests on Christ\'s finished work, not our performance.',
          fr: 'Dieu promet que si nous confessons, il est fidèle et juste pour pardonner et purifier. Le pardon repose sur l\'œuvre achevée de Christ, non sur notre performance.',
        },
        refs: ['1 John 1:8-9'],
      },
    ],
  },

  {
    id: 'repentance',
    relatedJourneyId: 'hope-behind-prayer',
    journeyInviteKey: 'gospelInviteRepentance',
    emoji: '🔄',
    theme: 'practices',
    title: { en: 'Repentance', fr: 'La repentance' },
    summary: {
      en: 'Repentance is a change of mind that turns the whole life back toward God.',
      fr: 'La repentance est un changement de pensée qui ramène toute la vie vers Dieu.',
    },
    sections: [
      {
        heading: { en: 'Turning around', fr: 'Faire demi-tour' },
        body: {
          en: 'Repentance is more than feeling sorry; it is turning from sin to God. It was the first word of Jesus\' preaching: "Repent, for the kingdom is near."',
          fr: 'La repentance est plus qu\'un regret ; c\'est se détourner du péché pour se tourner vers Dieu. Ce fut le premier mot de la prédication de Jésus : « Repentez-vous, car le royaume est proche. »',
        },
        refs: ['Matthew 4:17', 'Acts 3:19'],
      },
      {
        heading: { en: 'A gift of God\'s kindness', fr: 'Un don de la bonté de Dieu' },
        body: {
          en: 'It is God\'s kindness that leads us to repentance, and godly grief produces life, not despair. Repentance is the doorway to joy, not its enemy.',
          fr: 'C\'est la bonté de Dieu qui nous pousse à la repentance, et la tristesse selon Dieu produit la vie, non le désespoir. La repentance est la porte de la joie, non son ennemie.',
        },
        refs: ['Romans 2:4', '2 Corinthians 7:10'],
      },
    ],
  },

  {
    id: 'thanksgiving',
    emoji: '🌾',
    theme: 'practices',
    title: { en: 'Thanksgiving', fr: 'L\'action de grâce' },
    summary: {
      en: 'Gratitude is the natural breath of a heart that knows everything it has is grace.',
      fr: 'La reconnaissance est le souffle naturel d\'un cœur qui sait que tout ce qu\'il a est grâce.',
    },
    sections: [
      {
        heading: { en: 'Give thanks in everything', fr: 'Rendez grâce en toute chose' },
        body: {
          en: 'Scripture calls us to give thanks in all circumstances — not for evil, but trusting God\'s good purpose even in hard places. Thanksgiving guards us from grumbling and fear.',
          fr: 'L\'Écriture nous appelle à rendre grâce en toute circonstance — non pour le mal, mais en nous confiant au bon dessein de Dieu, même dans les épreuves. L\'action de grâce nous garde du murmure et de la peur.',
        },
        refs: ['1 Thessalonians 5:16-18', 'Philippians 4:6'],
      },
      {
        heading: { en: 'Remembering His works', fr: 'Se souvenir de ses œuvres' },
        body: {
          en: 'The Psalms model gratitude by recounting God\'s deeds. Naming specific mercies keeps our worship rooted in reality, not vague feeling.',
          fr: 'Les Psaumes modèlent la reconnaissance en rappelant les œuvres de Dieu. Nommer des grâces précises ancre notre adoration dans le réel, non dans un sentiment vague.',
        },
        refs: ['Psalm 103:1-5'],
      },
    ],
  },

  {
    id: 'lament',
    emoji: '😢',
    theme: 'practices',
    title: { en: 'Lament', fr: 'La lamentation' },
    summary: {
      en: 'Lament is honest grief brought to God — sorrow that still speaks to Him, and often ends in trust.',
      fr: 'La lamentation est une peine sincère apportée à Dieu — une douleur qui lui parle encore, et qui souvent débouche sur la confiance.',
    },
    sections: [
      {
        heading: { en: 'Permission to grieve', fr: 'La permission de pleurer' },
        body: {
          en: 'A third of the Psalms are laments. God is not afraid of our tears or our questions; He invites us to bring them rather than bury them.',
          fr: 'Un tiers des Psaumes sont des lamentations. Dieu ne craint ni nos larmes ni nos questions ; il nous invite à les apporter plutôt qu\'à les enfouir.',
        },
        refs: ['Psalm 13', 'Lamentations 3:19-24'],
      },
      {
        heading: { en: 'Grief that turns to trust', fr: 'Une peine qui se tourne vers la confiance' },
        body: {
          en: 'Biblical lament rarely stays in despair. It pours out the pain, then turns — often slowly — back to remembering who God is and what He has promised.',
          fr: 'La lamentation biblique reste rarement dans le désespoir. Elle répand la douleur, puis se tourne — souvent lentement — vers le souvenir de qui est Dieu et de ce qu\'il a promis.',
        },
        refs: ['Psalm 42:5-11'],
      },
    ],
  },

  {
    id: 'faith',
    relatedJourneyId: 'hope-behind-prayer',
    journeyInviteKey: 'gospelInviteFaith',
    emoji: '⚓',
    theme: 'virtues',
    title: { en: 'Faith', fr: 'La foi' },
    summary: {
      en: 'Faith is trusting God\'s character and promises — resting on Him rather than on ourselves.',
      fr: 'La foi, c\'est se confier au caractère et aux promesses de Dieu — s\'appuyer sur lui plutôt que sur soi.',
    },
    sections: [
      {
        heading: { en: 'Assurance and trust', fr: 'Assurance et confiance' },
        body: {
          en: 'Faith is "the assurance of things hoped for." It is not blind; it rests on the trustworthy God who has revealed Himself. We are saved by grace through faith — His gift, not our achievement.',
          fr: 'La foi est « la ferme assurance des choses qu\'on espère ». Elle n\'est pas aveugle ; elle repose sur le Dieu digne de confiance qui s\'est révélé. Nous sommes sauvés par grâce, au moyen de la foi — son don, non notre œuvre.',
        },
        refs: ['Hebrews 11:1', 'Ephesians 2:8-9'],
      },
      {
        heading: { en: 'Faith grows by the Word', fr: 'La foi grandit par la Parole' },
        body: {
          en: 'Faith comes by hearing the word of Christ. We ask God to strengthen weak faith — and He welcomes even the prayer "I believe; help my unbelief."',
          fr: 'La foi vient de ce qu\'on entend la parole de Christ. Nous demandons à Dieu d\'affermir une foi faible — et il accueille même la prière « je crois ; viens au secours de mon incrédulité ».',
        },
        refs: ['Romans 10:17', 'Mark 9:24'],
      },
    ],
  },

  {
    id: 'hope',
    emoji: '🌅',
    theme: 'virtues',
    title: { en: 'Hope', fr: 'L\'espérance' },
    summary: {
      en: 'Christian hope is not wishful thinking but confident expectation grounded in the risen Christ.',
      fr: 'L\'espérance chrétienne n\'est pas un vœu pieux mais une attente assurée, fondée sur le Christ ressuscité.',
    },
    sections: [
      {
        heading: { en: 'A living hope', fr: 'Une espérance vivante' },
        body: {
          en: 'Through Christ\'s resurrection we are born again to a living hope and an inheritance that cannot fade. Our hope has a name and a future — not merely a feeling.',
          fr: 'Par la résurrection de Christ, nous sommes régénérés pour une espérance vivante et un héritage qui ne se flétrit pas. Notre espérance a un nom et un avenir — pas seulement un sentiment.',
        },
        refs: ['1 Peter 1:3-5'],
      },
      {
        heading: { en: 'An anchor for the soul', fr: 'Une ancre pour l\'âme' },
        body: {
          en: 'Hope holds us steady in suffering, because the God who promised is faithful. It does not put us to shame, for God\'s love is poured into our hearts.',
          fr: 'L\'espérance nous tient fermes dans la souffrance, car le Dieu qui a promis est fidèle. Elle ne trompe pas, car l\'amour de Dieu est répandu dans nos cœurs.',
        },
        refs: ['Hebrews 6:19', 'Romans 5:3-5'],
      },
    ],
  },

  {
    id: 'love',
    emoji: '❤️',
    theme: 'virtues',
    title: { en: 'Love', fr: 'L\'amour' },
    summary: {
      en: 'Love is the heart of God and the mark of His people — first received from Him, then given to others.',
      fr: 'L\'amour est le cœur de Dieu et la marque de son peuple — d\'abord reçu de lui, puis donné aux autres.',
    },
    sections: [
      {
        heading: { en: 'We love because He first loved us', fr: 'Nous aimons parce qu\'il nous a aimés le premier' },
        body: {
          en: 'God showed His love by sending His Son to die for us while we were still sinners. Our love is always a response to a love we did not earn.',
          fr: 'Dieu a montré son amour en envoyant son Fils mourir pour nous alors que nous étions encore pécheurs. Notre amour est toujours une réponse à un amour que nous n\'avons pas mérité.',
        },
        refs: ['1 John 4:19', 'Romans 5:8'],
      },
      {
        heading: { en: 'The shape of love', fr: 'Le visage de l\'amour' },
        body: {
          en: 'Real love is patient and kind, not self-seeking. Jesus said the world would know us by our love for one another — it is the proof of true discipleship.',
          fr: 'L\'amour véritable est patient et bon, non égoïste. Jésus a dit que le monde nous reconnaîtrait à notre amour les uns pour les autres — c\'est la preuve d\'un vrai disciple.',
        },
        refs: ['1 Corinthians 13:4-7', 'John 13:34-35'],
      },
    ],
  },

  {
    id: 'grace',
    relatedJourneyId: 'hope-behind-prayer',
    journeyInviteKey: 'gospelInviteGrace',
    emoji: '🎁',
    theme: 'virtues',
    title: { en: 'Grace', fr: 'La grâce' },
    summary: {
      en: 'Grace is God\'s unearned favor — His gift of salvation and His daily strength for the weak.',
      fr: 'La grâce est la faveur imméritée de Dieu — son don du salut et sa force quotidienne pour les faibles.',
    },
    sections: [
      {
        heading: { en: 'Saved by grace', fr: 'Sauvés par grâce' },
        body: {
          en: 'We are justified freely by His grace through the redemption in Christ. Salvation is a gift, so no one can boast — we receive what we could never deserve.',
          fr: 'Nous sommes justifiés gratuitement par sa grâce, par la rédemption en Christ. Le salut est un don, afin que nul ne se glorifie — nous recevons ce que nous ne pourrions jamais mériter.',
        },
        refs: ['Ephesians 2:8-9', 'Romans 3:23-24'],
      },
      {
        heading: { en: 'Grace for every day', fr: 'La grâce pour chaque jour' },
        body: {
          en: 'Grace is not only for the start; God\'s grace is sufficient in our weakness, and His power is made perfect there. We come to His throne to receive grace to help in time of need.',
          fr: 'La grâce n\'est pas seulement pour le début ; la grâce de Dieu suffit dans notre faiblesse, et sa puissance s\'y accomplit. Nous venons à son trône pour recevoir grâce et secours au moment opportun.',
        },
        refs: ['2 Corinthians 12:9', 'Hebrews 4:16'],
      },
    ],
  },

  {
    id: 'sanctification',
    emoji: '🌱',
    theme: 'virtues',
    title: { en: 'Sanctification', fr: 'La sanctification' },
    summary: {
      en: 'Sanctification is the lifelong work of God making us more like Jesus — His doing and our pursuit.',
      fr: 'La sanctification est l\'œuvre de toute une vie par laquelle Dieu nous rend plus semblables à Jésus — son œuvre et notre poursuite.',
    },
    sections: [
      {
        heading: { en: 'God\'s work in us', fr: 'L\'œuvre de Dieu en nous' },
        body: {
          en: 'God Himself sanctifies us and will complete the work He began. We are not left to change ourselves; the Spirit transforms us from one degree of glory to another.',
          fr: 'Dieu lui-même nous sanctifie et achèvera l\'œuvre qu\'il a commencée. Nous ne sommes pas laissés à nous changer nous-mêmes ; l\'Esprit nous transforme de gloire en gloire.',
        },
        refs: ['1 Thessalonians 5:23-24', 'Philippians 1:6'],
      },
      {
        heading: { en: 'Our active pursuit', fr: 'Notre poursuite active' },
        body: {
          en: 'Yet we are told to pursue holiness and to work it out, because God works in us. Growth takes time — be patient with the slow, sure work of God in your life.',
          fr: 'Pourtant il nous est dit de poursuivre la sainteté et de la mettre en œuvre, car Dieu agit en nous. La croissance prend du temps — sois patient envers l\'œuvre lente et sûre de Dieu dans ta vie.',
        },
        refs: ['Hebrews 12:14', 'Philippians 2:12-13'],
      },
    ],
  },

  {
    id: 'holy-spirit-prayer',
    emoji: '🔥',
    theme: 'practices',
    title: { en: 'The Holy Spirit in prayer', fr: 'Le Saint-Esprit dans la prière' },
    summary: {
      en: 'We do not pray alone: the Spirit helps us, prays within us, and gives us access to the Father.',
      fr: 'Nous ne prions pas seuls : l\'Esprit nous aide, prie en nous, et nous donne accès au Père.',
    },
    sections: [
      {
        heading: { en: 'He helps our weakness', fr: 'Il vient au secours de notre faiblesse' },
        body: {
          en: 'When we do not know what to pray, the Spirit Himself intercedes for us, according to God\'s will. Our halting prayers are carried by Him.',
          fr: 'Quand nous ne savons pas comment prier, l\'Esprit lui-même intercède pour nous, selon la volonté de Dieu. Nos prières hésitantes sont portées par lui.',
        },
        refs: ['Romans 8:26-27'],
      },
      {
        heading: { en: 'He gives us access', fr: 'Il nous donne accès' },
        body: {
          en: 'By one Spirit we have access to the Father, and it is the Spirit who lets us cry "Abba, Father." Prayer is a work of the whole Trinity on our behalf.',
          fr: 'Par un seul Esprit nous avons accès auprès du Père, et c\'est l\'Esprit qui nous fait crier « Abba, Père ». La prière est une œuvre de toute la Trinité en notre faveur.',
        },
        refs: ['Ephesians 2:18', 'Galatians 4:6'],
      },
    ],
  },

  {
    id: 'unanswered',
    emoji: '🤍',
    theme: 'hard-questions',
    title: { en: 'Understanding unanswered prayer', fr: 'Comprendre la prière sans réponse' },
    summary: {
      en: 'When God seems silent, He is still good. "No" and "not yet" are answers from a wise and loving Father.',
      fr: 'Quand Dieu semble silencieux, il reste bon. « Non » et « pas encore » sont des réponses d\'un Père sage et aimant.',
    },
    sections: [
      {
        heading: { en: 'God is still good and wise', fr: 'Dieu reste bon et sage' },
        body: {
          en: 'Even Jesus prayed "let this cup pass," yet surrendered to the Father\'s will. Paul asked three times for relief and received grace instead. A loving Father sometimes gives what we need over what we want.',
          fr: 'Jésus lui-même a prié « que cette coupe s\'éloigne », tout en se soumettant à la volonté du Père. Paul a demandé trois fois d\'être délivré et a reçu la grâce à la place. Un Père aimant donne parfois ce dont nous avons besoin plutôt que ce que nous voulons.',
        },
        refs: ['Matthew 26:39', '2 Corinthians 12:8-9'],
      },
      {
        heading: { en: 'Keep asking, keep trusting', fr: 'Continue à demander, continue à te confier' },
        body: {
          en: 'Delay is not denial. Jesus taught us to keep praying and not lose heart, trusting that our Father gives good gifts in His perfect timing.',
          fr: 'Le retard n\'est pas un refus. Jésus nous a appris à prier sans cesse et à ne pas nous décourager, confiants que notre Père donne de bonnes choses en son temps parfait.',
        },
        refs: ['Luke 18:1-8', 'Matthew 7:9-11'],
      },
    ],
  },

  {
    id: 'suffering-life',
    relatedJourneyId: 'hope-behind-prayer',
    journeyInviteKey: 'gospelInviteSuffering',
    emoji: '🌷',
    theme: 'hard-questions',
    title: { en: 'How suffering fits the Christian life', fr: 'La place de la souffrance dans la vie chrétienne' },
    summary: {
      en: 'Suffering is not a sign God has left us; in Christ, it is woven into a story that ends in glory.',
      fr: 'La souffrance n\'est pas le signe que Dieu nous a quittés ; en Christ, elle est tissée dans une histoire qui s\'achève dans la gloire.',
    },
    sections: [
      {
        heading: { en: 'Expected, not abnormal', fr: 'Attendue, non anormale' },
        body: {
          en: 'Jesus told us we would have trouble in this world — but to take heart, because He has overcome it. Suffering does not mean our faith has failed.',
          fr: 'Jésus nous a dit que nous aurions des afflictions dans ce monde — mais de prendre courage, car il l\'a vaincu. La souffrance ne signifie pas que notre foi a échoué.',
        },
        refs: ['John 16:33', '1 Peter 4:12-13'],
      },
      {
        heading: { en: 'God works through it', fr: 'Dieu agit à travers elle' },
        body: {
          en: 'God works all things for the good of those who love Him, and uses our trials to form endurance, character, and hope. We are never wasted in His hands.',
          fr: 'Dieu fait concourir toutes choses au bien de ceux qui l\'aiment, et se sert de nos épreuves pour former la persévérance, le caractère et l\'espérance. Rien n\'est perdu entre ses mains.',
        },
        refs: ['Romans 8:28', 'Romans 5:3-5'],
      },
      {
        heading: { en: 'A hope beyond it', fr: 'Une espérance au-delà' },
        body: {
          en: 'Present sufferings are not worth comparing with the glory to come. One day God will wipe away every tear; this is not the end of the story.',
          fr: 'Les souffrances présentes ne sont rien au prix de la gloire à venir. Un jour, Dieu essuiera toute larme ; ce n\'est pas la fin de l\'histoire.',
        },
        refs: ['Romans 8:18', 'Revelation 21:3-4'],
      },
    ],
  },
];

export default articles;
