// Prayer guides: short, Scripture-first paths a believer can PRAY THROUGH — not
// prayers written for them. Each step gives a heading, a gentle prompt, and
// (usually) a passage to open in their own Bible. The aim is discipleship: to
// teach the believer to pray according to God's Word, then to pray it themselves.
//
// Shape: { id, emoji, theme, title{en,fr}, summary{en,fr}, intro{en,fr},
//          steps: [{ title{en,fr}, prompt{en,fr}, passage? }] }

const guides = [
  {
    id: 'acts',
    emoji: '🙌',
    theme: 'foundations',
    title: { en: 'The ACTS pattern', fr: 'Le modèle ACTS' },
    summary: {
      en: 'Adoration, Confession, Thanksgiving, Supplication — a simple shape for a full prayer.',
      fr: 'Adoration, Confession, Action de grâce, Supplication — une trame simple pour une prière complète.',
    },
    intro: {
      en: 'ACTS is not a formula that earns God\'s ear; it is a help to keep prayer from collapsing into a list of wants. We begin where Scripture begins — with God Himself — before we bring our needs.',
      fr: 'ACTS n\'est pas une formule qui force l\'oreille de Dieu ; c\'est une aide pour que la prière ne se réduise pas à une liste de demandes. Nous commençons là où l\'Écriture commence — par Dieu lui-même — avant d\'apporter nos besoins.',
    },
    steps: [
      {
        title: { en: 'Adoration', fr: 'Adoration' },
        prompt: {
          en: 'Praise God for who He is, not only what He gives. Read the psalm slowly and turn its words back to Him.',
          fr: 'Loue Dieu pour ce qu\'il est, pas seulement pour ce qu\'il donne. Lis lentement le psaume et renvoie-lui ses paroles.',
        },
        passage: 'Psalm 145:1-7',
      },
      {
        title: { en: 'Confession', fr: 'Confession' },
        prompt: {
          en: 'Agree with God about your sin honestly. He is faithful and just to forgive — confession is coming home, not earning love.',
          fr: 'Reconnais ton péché honnêtement devant Dieu. Il est fidèle et juste pour pardonner — la confession est un retour à la maison, non un mérite à gagner.',
        },
        passage: '1 John 1:8-9',
      },
      {
        title: { en: 'Thanksgiving', fr: 'Action de grâce' },
        prompt: {
          en: 'Name specific mercies from today and this week. Gratitude steadies the heart before it asks for anything.',
          fr: 'Nomme des grâces précises d\'aujourd\'hui et de cette semaine. La reconnaissance affermit le cœur avant même de demander quoi que ce soit.',
        },
        passage: 'Psalm 103:1-5',
      },
      {
        title: { en: 'Supplication', fr: 'Supplication' },
        prompt: {
          en: 'Now bring your requests — for yourself and others — with confidence, because of who He is. Pray through the burdens on your heart.',
          fr: 'Apporte maintenant tes demandes — pour toi et pour les autres — avec assurance, à cause de qui il est. Présente les fardeaux de ton cœur.',
        },
        passage: 'Philippians 4:6-7',
      },
    ],
  },

  {
    id: 'psalms',
    emoji: '📖',
    theme: 'scripture',
    title: { en: 'Praying through the Psalms', fr: 'Prier à travers les Psaumes' },
    summary: {
      en: 'The Psalms give us God\'s own words to pray back to Him — in joy, sorrow, and everything between.',
      fr: 'Les Psaumes nous donnent les paroles mêmes de Dieu pour les lui renvoyer — dans la joie, la peine, et tout l\'entre-deux.',
    },
    intro: {
      en: 'For centuries the church has prayed the Psalms because they teach us how to feel rightly before God. Pick one, read it slowly, and let it shape your own prayer line by line.',
      fr: 'Depuis des siècles l\'Église prie les Psaumes parce qu\'ils nous apprennent à ressentir justement devant Dieu. Choisis-en un, lis-le lentement, et laisse-le façonner ta prière, ligne après ligne.',
    },
    steps: [
      {
        title: { en: 'Read it whole', fr: 'Lis-le en entier' },
        prompt: {
          en: 'Read the psalm once, slowly, just listening. Notice what the writer says to God and about God.',
          fr: 'Lis le psaume une fois, lentement, en écoutant simplement. Remarque ce que l\'auteur dit à Dieu et sur Dieu.',
        },
        passage: 'Psalm 27',
      },
      {
        title: { en: 'Pray it back', fr: 'Renvoie-le à Dieu' },
        prompt: {
          en: 'Go through it again, this time making its words your own prayer — line by line, in your own voice.',
          fr: 'Reprends-le, en faisant cette fois de ses paroles ta propre prière — ligne après ligne, avec tes mots.',
        },
      },
      {
        title: { en: 'Bring your life into it', fr: 'Fais-y entrer ta vie' },
        prompt: {
          en: 'Where the psalm names a fear, a hope, or a praise, name yours. Let it give language to what you feel.',
          fr: 'Là où le psaume nomme une crainte, une espérance, une louange, nomme les tiennes. Laisse-le donner des mots à ce que tu ressens.',
        },
      },
    ],
  },

  {
    id: 'scripture',
    emoji: '✍️',
    theme: 'scripture',
    title: { en: 'Praying Scripture', fr: 'Prier la Parole' },
    summary: {
      en: 'Turn a passage you are reading into prayer, so your prayers are shaped by God\'s words, not only your own.',
      fr: 'Transforme en prière un passage que tu lis, pour que tes prières soient façonnées par les paroles de Dieu, et non seulement par les tiennes.',
    },
    intro: {
      en: 'Praying Scripture keeps us asking for the things God has promised to give. Paul\'s prayers in his letters are a wonderful place to learn — pray them for yourself and for others.',
      fr: 'Prier la Parole nous garde à demander ce que Dieu a promis de donner. Les prières de Paul dans ses lettres sont un excellent point de départ — prie-les pour toi et pour les autres.',
    },
    steps: [
      {
        title: { en: 'Choose a passage', fr: 'Choisis un passage' },
        prompt: {
          en: 'Read Paul\'s prayer slowly. Ask: what does he long for these believers to know and become?',
          fr: 'Lis lentement la prière de Paul. Demande-toi : que désire-t-il que ces croyants connaissent et deviennent ?',
        },
        passage: 'Ephesians 3:14-21',
      },
      {
        title: { en: 'Pray it for yourself', fr: 'Prie-la pour toi' },
        prompt: {
          en: 'Put your own name into the passage. Ask God to work these very things in you.',
          fr: 'Mets ton propre nom dans le passage. Demande à Dieu d\'opérer ces choses mêmes en toi.',
        },
      },
      {
        title: { en: 'Pray it for others', fr: 'Prie-la pour les autres' },
        prompt: {
          en: 'Name people you love and pray the same Scripture over them — for their faith, love, and rootedness in Christ.',
          fr: 'Nomme ceux que tu aimes et prie la même Écriture sur eux — pour leur foi, leur amour, leur enracinement en Christ.',
        },
      },
    ],
  },

  {
    id: 'promises',
    emoji: '🌿',
    theme: 'scripture',
    title: { en: 'Praying God\'s promises', fr: 'Prier les promesses de Dieu' },
    summary: {
      en: 'Hold God to His own word — reading each promise in context so you ask rightly, not presumptuously.',
      fr: 'Prends Dieu au mot — en lisant chaque promesse dans son contexte, pour demander justement, sans présomption.',
    },
    intro: {
      en: 'God\'s promises are "Yes" in Christ (2 Corinthians 1:20). But a promise must be read in its context: to whom it was given, and what it actually pledges. Then we can pray it with confidence.',
      fr: 'Les promesses de Dieu sont « oui » en Christ (2 Corinthiens 1:20). Mais une promesse se lit dans son contexte : à qui elle fut donnée, et ce qu\'elle engage réellement. Alors nous pouvons la prier avec assurance.',
    },
    steps: [
      {
        title: { en: 'Read it in context', fr: 'Lis-la dans son contexte' },
        prompt: {
          en: 'Read the surrounding verses, not just the promise. Who is being addressed, and what is God pledging?',
          fr: 'Lis les versets qui l\'entourent, pas seulement la promesse. À qui s\'adresse-t-elle, et qu\'engage Dieu ?',
        },
        passage: 'Romans 8:28-30',
      },
      {
        title: { en: 'Anchor it in Christ', fr: 'Ancre-la en Christ' },
        prompt: {
          en: 'Ask how this promise is fulfilled in Jesus. Every true promise leads back to Him.',
          fr: 'Demande comment cette promesse s\'accomplit en Jésus. Toute vraie promesse ramène à lui.',
        },
        passage: '2 Corinthians 1:20',
      },
      {
        title: { en: 'Pray it back to God', fr: 'Renvoie-la à Dieu' },
        prompt: {
          en: 'Ask God to do what He has promised — for His glory and your good — and rest in His faithfulness.',
          fr: 'Demande à Dieu d\'accomplir ce qu\'il a promis — pour sa gloire et ton bien — et repose-toi dans sa fidélité.',
        },
      },
    ],
  },

  {
    id: 'wisdom',
    emoji: '🧭',
    theme: 'requests',
    title: { en: 'Praying for wisdom', fr: 'Prier pour la sagesse' },
    summary: {
      en: 'When you don\'t know what to do, God invites you to ask Him for wisdom — generously given.',
      fr: 'Quand tu ne sais que faire, Dieu t\'invite à lui demander la sagesse — donnée généreusement.',
    },
    intro: {
      en: 'Wisdom is not merely cleverness; it is the skill of living God\'s way in God\'s world. James says God gives it freely to those who ask in faith.',
      fr: 'La sagesse n\'est pas la simple intelligence ; c\'est l\'art de vivre selon Dieu dans le monde de Dieu. Jacques dit que Dieu la donne librement à qui la demande avec foi.',
    },
    steps: [
      {
        title: { en: 'Ask in faith', fr: 'Demande avec foi' },
        prompt: {
          en: 'Bring the decision before God. Ask plainly for wisdom, trusting His promise to give it.',
          fr: 'Apporte la décision devant Dieu. Demande clairement la sagesse, en te fiant à sa promesse de la donner.',
        },
        passage: 'James 1:5-8',
      },
      {
        title: { en: 'Fear the Lord', fr: 'Crains l\'Éternel' },
        prompt: {
          en: 'Wisdom begins with reverence for God. Ask Him to make you want His will more than your own.',
          fr: 'La sagesse commence par la crainte de Dieu. Demande-lui de te faire désirer sa volonté plus que la tienne.',
        },
        passage: 'Proverbs 9:10',
      },
      {
        title: { en: 'Trust, don\'t lean', fr: 'Confie-toi, ne t\'appuie pas' },
        prompt: {
          en: 'Surrender your own understanding. Ask God to direct your paths as you walk forward.',
          fr: 'Renonce à ta propre intelligence. Demande à Dieu d\'aplanir tes sentiers tandis que tu avances.',
        },
        passage: 'Proverbs 3:5-6',
      },
    ],
  },

  {
    id: 'enemies',
    emoji: '🕊️',
    theme: 'others',
    title: { en: 'Praying for enemies', fr: 'Prier pour ses ennemis' },
    summary: {
      en: 'Jesus calls us to bless those who wrong us — the hardest, and most Christlike, prayer.',
      fr: 'Jésus nous appelle à bénir ceux qui nous font du mal — la prière la plus difficile, et la plus semblable à Christ.',
    },
    intro: {
      en: 'To pray for an enemy is to obey Jesus and to be set free from bitterness. We do not pray that God would crush them, but that He would have mercy on them — as He had mercy on us.',
      fr: 'Prier pour un ennemi, c\'est obéir à Jésus et être libéré de l\'amertume. Nous ne prions pas que Dieu les écrase, mais qu\'il leur fasse miséricorde — comme il nous l\'a faite.',
    },
    steps: [
      {
        title: { en: 'Hear Jesus\' command', fr: 'Écoute l\'ordre de Jésus' },
        prompt: {
          en: 'Read His words. Let them land: love your enemies, pray for those who persecute you.',
          fr: 'Lis ses paroles. Laisse-les te toucher : aimez vos ennemis, priez pour ceux qui vous persécutent.',
        },
        passage: 'Matthew 5:43-48',
      },
      {
        title: { en: 'Name them before God', fr: 'Nomme-les devant Dieu' },
        prompt: {
          en: 'Name the person honestly. Ask God to bless them, to soften them, and to save them.',
          fr: 'Nomme la personne honnêtement. Demande à Dieu de la bénir, de l\'adoucir, et de la sauver.',
        },
      },
      {
        title: { en: 'Release the offense', fr: 'Remets l\'offense' },
        prompt: {
          en: 'Hand the wrong to God, who judges justly. Ask Him to free your heart from bitterness.',
          fr: 'Remets le tort à Dieu, qui juge avec justice. Demande-lui de libérer ton cœur de l\'amertume.',
        },
        passage: 'Romans 12:17-21',
      },
    ],
  },

  {
    id: 'authorities',
    emoji: '🏛️',
    theme: 'others',
    title: { en: 'Praying for those in authority', fr: 'Prier pour les autorités' },
    summary: {
      en: 'Scripture tells us to pray for kings and all in authority — for peace, justice, and the spread of the gospel.',
      fr: 'L\'Écriture nous dit de prier pour les rois et tous ceux qui gouvernent — pour la paix, la justice et l\'avancée de l\'Évangile.',
    },
    intro: {
      en: 'Paul urges prayer for rulers so that the church may live peaceful lives and the gospel may run freely. We pray for leaders whether or not we agree with them.',
      fr: 'Paul exhorte à prier pour les dirigeants afin que l\'Église mène une vie paisible et que l\'Évangile se répande librement. Nous prions pour eux, que nous soyons d\'accord avec eux ou non.',
    },
    steps: [
      {
        title: { en: 'Pray as Scripture commands', fr: 'Prie selon le commandement' },
        prompt: {
          en: 'Read Paul\'s charge. Pray for those who govern, that we may lead peaceful and godly lives.',
          fr: 'Lis l\'exhortation de Paul. Prie pour ceux qui gouvernent, afin que nous menions une vie paisible et pieuse.',
        },
        passage: '1 Timothy 2:1-4',
      },
      {
        title: { en: 'Ask for justice and mercy', fr: 'Demande justice et miséricorde' },
        prompt: {
          en: 'Pray that leaders would govern justly, protect the weak, and restrain evil.',
          fr: 'Prie pour que les dirigeants gouvernent avec justice, protègent les faibles et répriment le mal.',
        },
        passage: 'Proverbs 21:1',
      },
      {
        title: { en: 'Pray for the gospel', fr: 'Prie pour l\'Évangile' },
        prompt: {
          en: 'Ask that the church might worship freely and that the good news of Jesus would spread under their care.',
          fr: 'Demande que l\'Église puisse adorer librement et que la bonne nouvelle de Jésus se répande sous leur gouvernement.',
        },
      },
    ],
  },

  {
    id: 'missionaries',
    emoji: '🌍',
    theme: 'others',
    title: { en: 'Praying for missionaries', fr: 'Prier pour les missionnaires' },
    summary: {
      en: 'Pray for those carrying the gospel to the nations — for open doors, boldness, and endurance.',
      fr: 'Prie pour ceux qui portent l\'Évangile aux nations — pour des portes ouvertes, de la hardiesse et de la persévérance.',
    },
    intro: {
      en: 'The harvest is plentiful but the workers are few. Jesus tells us to ask the Lord of the harvest to send them out, and Paul asks the churches to pray for his words and courage.',
      fr: 'La moisson est grande mais les ouvriers peu nombreux. Jésus nous dit de prier le Maître de la moisson d\'envoyer des ouvriers, et Paul demande aux Églises de prier pour ses paroles et son courage.',
    },
    steps: [
      {
        title: { en: 'Ask for workers', fr: 'Demande des ouvriers' },
        prompt: {
          en: 'Pray, as Jesus commanded, that God would send out laborers into His harvest.',
          fr: 'Prie, comme Jésus l\'a ordonné, que Dieu envoie des ouvriers dans sa moisson.',
        },
        passage: 'Matthew 9:37-38',
      },
      {
        title: { en: 'Pray for open doors', fr: 'Prie pour des portes ouvertes' },
        prompt: {
          en: 'Ask God to open doors for the message and to give clarity and boldness to those who preach it.',
          fr: 'Demande à Dieu d\'ouvrir des portes pour la Parole, et de donner clarté et hardiesse à ceux qui la prêchent.',
        },
        passage: 'Colossians 4:2-4',
      },
      {
        title: { en: 'Pray for endurance', fr: 'Prie pour la persévérance' },
        prompt: {
          en: 'Pray for their protection, joy, and perseverance — and for fruit that will last.',
          fr: 'Prie pour leur protection, leur joie et leur persévérance — et pour un fruit qui demeure.',
        },
      },
    ],
  },

  {
    id: 'church',
    emoji: '⛪',
    theme: 'others',
    title: { en: 'Praying for your local church', fr: 'Prier pour ton Église locale' },
    summary: {
      en: 'Pray for the people God has placed around you — for love, unity, and faithfulness to Christ.',
      fr: 'Prie pour ceux que Dieu a placés autour de toi — pour l\'amour, l\'unité et la fidélité à Christ.',
    },
    intro: {
      en: 'The church is Christ\'s body and your family. Pray for its leaders, its love, and its growth in the truth — as the first believers devoted themselves to prayer together.',
      fr: 'L\'Église est le corps de Christ et ta famille. Prie pour ses responsables, son amour et sa croissance dans la vérité — comme les premiers croyants s\'adonnaient ensemble à la prière.',
    },
    steps: [
      {
        title: { en: 'Pray for unity and love', fr: 'Prie pour l\'unité et l\'amour' },
        prompt: {
          en: 'Ask God to knit your church together in love, that the world may know you follow Jesus.',
          fr: 'Demande à Dieu d\'unir ton Église dans l\'amour, afin que le monde sache que vous suivez Jésus.',
        },
        passage: 'John 13:34-35',
      },
      {
        title: { en: 'Pray for your leaders', fr: 'Prie pour tes responsables' },
        prompt: {
          en: 'Pray for pastors and elders — that they would teach faithfully and shepherd with joy.',
          fr: 'Prie pour les pasteurs et les anciens — qu\'ils enseignent fidèlement et veillent avec joie.',
        },
        passage: 'Hebrews 13:7',
      },
      {
        title: { en: 'Pray for growth', fr: 'Prie pour la croissance' },
        prompt: {
          en: 'Ask that your church would grow up into Christ — in truth, holiness, and witness.',
          fr: 'Demande que ton Église grandisse vers Christ — dans la vérité, la sainteté et le témoignage.',
        },
        passage: 'Ephesians 4:11-16',
      },
    ],
  },

  {
    id: 'unbelievers',
    emoji: '💬',
    theme: 'others',
    title: { en: 'Praying for those who don\'t yet believe', fr: 'Prier pour ceux qui ne croient pas encore' },
    summary: {
      en: 'Pray for friends and family far from God — that their eyes would be opened to Christ.',
      fr: 'Prie pour des proches loin de Dieu — que leurs yeux s\'ouvrent à Christ.',
    },
    intro: {
      en: 'Salvation is God\'s work; only He opens blind eyes. So we pray with hope, naming the people we love and asking the God who is patient and merciful to draw them to Himself.',
      fr: 'Le salut est l\'œuvre de Dieu ; lui seul ouvre les yeux aveugles. Nous prions donc avec espérance, en nommant ceux que nous aimons et en demandant au Dieu patient et miséricordieux de les attirer à lui.',
    },
    steps: [
      {
        title: { en: 'Name them', fr: 'Nomme-les' },
        prompt: {
          en: 'Bring specific people before God by name. He knows and loves them more than you do.',
          fr: 'Apporte devant Dieu des personnes précises, par leur nom. Il les connaît et les aime plus que toi.',
        },
      },
      {
        title: { en: 'Ask God to open eyes', fr: 'Demande l\'ouverture des yeux' },
        prompt: {
          en: 'Pray that God would shine the light of the gospel into hearts now blinded.',
          fr: 'Prie pour que Dieu fasse briller la lumière de l\'Évangile dans des cœurs encore aveuglés.',
        },
        passage: '2 Corinthians 4:3-6',
      },
      {
        title: { en: 'Ask to be a witness', fr: 'Demande à être témoin' },
        prompt: {
          en: 'Pray for open doors and gracious words, that you might point them to Jesus.',
          fr: 'Prie pour des occasions et des paroles pleines de grâce, afin de les diriger vers Jésus.',
        },
        passage: 'Colossians 4:5-6',
      },
    ],
  },

  {
    id: 'suffering',
    emoji: '🌧️',
    theme: 'seasons',
    title: { en: 'Praying in suffering', fr: 'Prier dans la souffrance' },
    summary: {
      en: 'When you are in pain, you do not need polished words. Bring your honest grief to a Father who is near.',
      fr: 'Dans la douleur, tu n\'as pas besoin de mots travaillés. Apporte ta peine sincère à un Père qui est proche.',
    },
    intro: {
      en: 'Scripture gives us permission to lament — to pour out our trouble to God. He is near the brokenhearted, and Jesus Himself prayed in anguish. You are not alone, and you do not have to pretend.',
      fr: 'L\'Écriture nous permet de nous lamenter — de répandre notre détresse devant Dieu. Il est proche de ceux qui ont le cœur brisé, et Jésus lui-même a prié dans l\'angoisse. Tu n\'es pas seul, et tu n\'as pas à faire semblant.',
    },
    steps: [
      {
        title: { en: 'Pour out your heart', fr: 'Répands ton cœur' },
        prompt: {
          en: 'Tell God exactly how it is — your pain, your questions, your fear. He can bear it.',
          fr: 'Dis à Dieu les choses telles qu\'elles sont — ta douleur, tes questions, ta crainte. Il peut les porter.',
        },
        passage: 'Psalm 62:5-8',
      },
      {
        title: { en: 'Remember who He is', fr: 'Rappelle-toi qui il est' },
        prompt: {
          en: 'He is close to the brokenhearted. Cast your anxiety on Him, because He cares for you.',
          fr: 'Il est proche de ceux qui ont le cœur brisé. Décharge-toi sur lui de tes soucis, car il prend soin de toi.',
        },
        passage: '1 Peter 5:6-7',
      },
      {
        title: { en: 'Rest in His presence', fr: 'Repose-toi en sa présence' },
        prompt: {
          en: 'You may not have answers, but you have Him. Sit quietly, asking only for His nearness.',
          fr: 'Tu n\'as peut-être pas de réponses, mais tu l\'as, lui. Demeure en silence, demandant seulement sa présence.',
        },
        passage: 'Psalm 23',
      },
    ],
  },

  {
    id: 'temptation',
    emoji: '🛡️',
    theme: 'seasons',
    title: { en: 'Praying in temptation', fr: 'Prier dans la tentation' },
    summary: {
      en: 'When tempted, run to God in prayer. He provides a way out and strength to stand.',
      fr: 'Dans la tentation, cours à Dieu par la prière. Il ouvre une issue et donne la force de tenir.',
    },
    intro: {
      en: 'Jesus taught us to pray "lead us not into temptation." Temptation is not sin, but it is a battle — and prayer is how we fight it, leaning not on willpower but on God\'s power.',
      fr: 'Jésus nous a appris à prier « ne nous laisse pas entrer en tentation ». La tentation n\'est pas le péché, mais c\'est un combat — et la prière est notre arme, en nous appuyant non sur notre volonté mais sur la force de Dieu.',
    },
    steps: [
      {
        title: { en: 'Admit it to God', fr: 'Avoue-le à Dieu' },
        prompt: {
          en: 'Name the temptation honestly before Him. Bringing it into the light loosens its grip.',
          fr: 'Nomme honnêtement la tentation devant lui. L\'amener à la lumière en desserre l\'emprise.',
        },
      },
      {
        title: { en: 'Claim His promise', fr: 'Saisis sa promesse' },
        prompt: {
          en: 'God is faithful; He will provide a way of escape. Ask Him to show you the door, and take it.',
          fr: 'Dieu est fidèle ; il ménagera une issue. Demande-lui de te la montrer, et prends-la.',
        },
        passage: '1 Corinthians 10:13',
      },
      {
        title: { en: 'Ask for strength', fr: 'Demande la force' },
        prompt: {
          en: 'Pray for the Spirit\'s help to flee sin and pursue what is good. Watch and pray.',
          fr: 'Prie pour l\'aide de l\'Esprit afin de fuir le péché et de poursuivre le bien. Veille et prie.',
        },
        passage: 'Matthew 26:41',
      },
    ],
  },
];

export default guides;
