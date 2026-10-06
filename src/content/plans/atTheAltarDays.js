// The 10 days of "At the Altar: Learning to Carry Prayer" (see ./atTheAltar.js
// for the plan meta, the movements and the guardrails this content is held to).
//
// Every day prays in two movements with existing fields:
//   prompts     INTERCESSION — carrying others before God
//   selfPrompt  the reader's own heart before God
// Plus a reflection (Qetoret commentary, never Scripture text), one small
// practice, up to three related passages and resource topics.
//
// Prose is authored in en + fr; the other languages fall back through pick().
// Day titles (`theme`) are authored in all 16 languages.
const L = (en, fr) => ({ en, fr });

export const DAYS = [
  // ── Movement 1 · At the altar (days 1–3) ──────────────────────────────────
  {
    movement: 'altar',
    theme: { en: 'Called before God', fr: 'Appelé devant Dieu', es: 'Llamado ante Dios', pt: 'Chamado diante de Deus', de: 'Vor Gott gerufen', ru: 'Призван предстать перед Богом', zh: '蒙召来到神面前', ja: '神の前に召されて', ko: '하나님 앞으로 부르심', ar: 'مدعوٌّ إلى محضر الله', fa: 'فراخوانده به حضور خدا', hi: 'परमेश्वर के सामने बुलाए गए', id: 'Dipanggil ke hadapan Tuhan', sw: 'Ameitwa mbele za Mungu', tl: 'Tinawag sa harap ng Diyos', am: 'በእግዚአብሔር ፊት የተጠራ' },
    ref: 'Luke 1:5-10',
    related: ['Hebrews 4:14-16', '1 Peter 2:9'],
    reflection: L(
      'Zechariah did not choose the day he entered the sanctuary; the lot fell to him, perhaps once in a lifetime. He came before God because he was called, not because he had earned it. In Christ, the way into God’s presence is no longer a rare lot: Jesus, the Great High Priest, has opened it to every believer (Hebrews 4:14-16). Prayer begins here — not with what you bring, but with the One who invites you.',
      'Zacharie n’a pas choisi le jour où il entrerait dans le sanctuaire : le sort est tombé sur lui, peut-être une seule fois dans sa vie. Il s’est présenté devant Dieu parce qu’il était appelé, non parce qu’il l’avait mérité. En Christ, l’accès à la présence de Dieu n’est plus un sort rare : Jésus, le grand-prêtre, l’a ouvert à chaque croyant (Hébreux 4:14-16). La prière commence là — non par ce que tu apportes, mais par Celui qui t’invite.',
    ),
    prompts: [
      L('Thank God that you may come before Him because of Jesus, not because of your record.', 'Remercie Dieu de pouvoir venir devant Lui grâce à Jésus, et non grâce à tes mérites.'),
      L('Pray for someone who feels too far from God to pray, that they would hear the invitation of Christ.', 'Prie pour quelqu’un qui se sent trop loin de Dieu pour prier, afin qu’il entende l’invitation du Christ.'),
      L('Pray for those who serve in your church this week, that their service would begin in God’s presence.', 'Prie pour ceux qui servent dans ton Église cette semaine, afin que leur service commence dans la présence de Dieu.'),
    ],
    selfPrompt: L(
      'Come as you are. Tell God plainly what is on your heart today, and rest in the access Christ has given you.',
      'Viens tel que tu es. Dis simplement à Dieu ce que tu as sur le cœur aujourd’hui, et repose-toi sur l’accès que le Christ t’a donné.',
    ),
    practice: L(
      'Before you pray today, take one minute of silence to remember that you are invited, then begin.',
      'Avant de prier aujourd’hui, prends une minute de silence pour te rappeler que tu es invité, puis commence.',
    ),
    resourceTopics: ['prayer', 'biblical-narrative'],
  },
  {
    movement: 'altar',
    theme: { en: 'The altar of incense', fr: 'L’autel des parfums', es: 'El altar del incienso', pt: 'O altar do incenso', de: 'Der Räucheraltar', ru: 'Жертвенник курения', zh: '香坛', ja: '香の祭壇', ko: '분향단', ar: 'مذبح البخور', fa: 'مذبح بخور', hi: 'धूप की वेदी', id: 'Mezbah pembakaran ukupan', sw: 'Madhabahu ya kufukizia uvumba', tl: 'Ang dambana ng insenso', am: 'የዕጣን መሠዊያ' },
    ref: 'Exodus 30:1-8',
    related: ['Psalm 141:2', 'Revelation 8:3-4'],
    reflection: L(
      'In Exodus the incense was offered every morning and every evening, a regular offering before the Lord. The Psalms and Revelation later use rising incense as a picture of prayer coming before God. The picture is about faithfulness more than intensity: prayer offered again and again, on ordinary days. The incense did not make the worshipper acceptable; God Himself gave the way to come near. So it is with us in Christ.',
      'Dans l’Exode, le parfum était offert chaque matin et chaque soir, une offrande régulière devant l’Éternel. Les Psaumes et l’Apocalypse reprennent plus tard l’image de l’encens qui monte pour parler de la prière qui s’élève devant Dieu. L’image parle de fidélité plus que d’intensité : une prière offerte encore et encore, dans des jours ordinaires. Ce n’est pas l’encens qui rendait l’adorateur acceptable ; c’est Dieu lui-même qui donnait le moyen de s’approcher. Il en est ainsi pour nous en Christ.',
    ),
    prompts: [
      L('Offer God your praise this morning or this evening, simply, as a regular offering.', 'Offre à Dieu ta louange ce matin ou ce soir, simplement, comme une offrande régulière.'),
      L('Pray for believers whose prayer has become dry or irregular, that they would return without shame.', 'Prie pour les croyants dont la prière est devenue sèche ou irrégulière, afin qu’ils y reviennent sans honte.'),
      L('Pray for your household, that prayer would become a natural rhythm of your home.', 'Prie pour ta maison, afin que la prière devienne un rythme naturel de ton foyer.'),
    ],
    selfPrompt: L(
      'Look at your own rhythm of prayer without guilt. Where could a simple morning or evening return to God take root?',
      'Regarde ton propre rythme de prière sans culpabilité. Où un simple retour vers Dieu, le matin ou le soir, pourrait-il prendre racine ?',
    ),
    practice: L(
      'Choose one time — morning or evening — and pray at that time for the next three days, even briefly.',
      'Choisis un moment — le matin ou le soir — et prie à ce moment-là pendant les trois prochains jours, même brièvement.',
    ),
    resourceTopics: ['prayer', 'spiritual-rhythms', 'worship'],
  },
  {
    movement: 'altar',
    theme: { en: 'A people praying together', fr: 'Un peuple qui prie ensemble', es: 'Un pueblo que ora unido', pt: 'Um povo que ora junto', de: 'Ein Volk, das gemeinsam betet', ru: 'Народ, молящийся вместе', zh: '同心祷告的百姓', ja: 'ともに祈る民', ko: '함께 기도하는 백성', ar: 'شعبٌ يصلّي معًا', fa: 'قومی که با هم دعا می‌کنند', hi: 'एक साथ प्रार्थना करते लोग', id: 'Umat yang berdoa bersama', sw: 'Watu wanaoomba pamoja', tl: 'Bayang sama-samang nananalangin', am: 'በአንድነት የሚጸልይ ሕዝብ' },
    ref: 'Luke 1:8-10',
    related: ['Acts 1:14', 'Acts 12:5', 'Matthew 18:19-20'],
    reflection: L(
      'While Zechariah served inside, the whole crowd of the people was praying outside at the hour of incense. Private and shared prayer were happening at the same time, in the same direction. The early church kept this pattern, praying together while waiting, in danger and in hope. You are not the only one at the altar; others are praying with you, and you can carry their prayers too.',
      'Pendant que Zacharie servait à l’intérieur, toute la multitude du peuple priait dehors, à l’heure du parfum. La prière personnelle et la prière commune se faisaient au même moment, dans la même direction. L’Église primitive a gardé ce modèle, priant ensemble dans l’attente, dans le danger et dans l’espérance. Tu n’es pas seul à l’autel : d’autres prient avec toi, et tu peux porter leurs prières aussi.',
    ),
    prompts: [
      L('Thank God for the people who have prayed for you, whether you know them or not.', 'Remercie Dieu pour les personnes qui ont prié pour toi, que tu les connaisses ou non.'),
      L('Pray for a prayer group or church you belong to, that it would be a place of intercession rather than performance.', 'Prie pour un groupe de prière ou une Église dont tu fais partie, afin qu’il soit un lieu d’intercession plutôt que de démonstration.'),
      L('Carry one request someone else has shared with you, as if it were your own.', 'Porte une requête que quelqu’un t’a confiée, comme si c’était la tienne.'),
    ],
    selfPrompt: L(
      'Ask yourself honestly whether you pray alone by choice or by habit. Who could you pray with this week?',
      'Demande-toi honnêtement si tu pries seul par choix ou par habitude. Avec qui pourrais-tu prier cette semaine ?',
    ),
    practice: L(
      'Send a short message to someone: tell them you are praying for them today, and do it.',
      'Envoie un court message à quelqu’un : dis-lui que tu pries pour lui aujourd’hui, et fais-le.',
    ),
    resourceTopics: ['prayer-together', 'church', 'intercession'],
  },

  // ── Movement 2 · Carrying and waiting (days 4–7) ──────────────────────────
  {
    movement: 'waiting',
    theme: { en: 'The prayer you have carried', fr: 'La prière que tu as portée', es: 'La oración que has llevado', pt: 'A oração que você levou', de: 'Das Gebet, das du getragen hast', ru: 'Молитва, которую ты нёс', zh: '你长久背负的祷告', ja: 'あなたが抱え続けてきた祈り', ko: '오래 품어 온 기도', ar: 'الصلاة التي حملتها', fa: 'دعایی که با خود حمل کرده‌ای', hi: 'वह प्रार्थना जो आपने उठाए रखी', id: 'Doa yang telah lama Anda bawa', sw: 'Ombi ulilolibeba', tl: 'Ang panalanging matagal mong pinasan', am: 'ተሸክመውት የኖሩት ጸሎት' },
    ref: 'Luke 1:11-13',
    related: ['1 Samuel 1:10-18', 'Psalm 13:1-6'],
    reflection: L(
      'Gabriel’s first words were that Zechariah’s prayer had been heard. Luke does not say exactly which prayer he meant — the old prayer for a son, the prayer for Israel’s redemption, or both — but it had been carried a long time. Elizabeth and Zechariah were old. God had not forgotten. That does not mean every long prayer will be answered as we hope; it means no prayer offered in faith is lost before Him.',
      'Les premières paroles de Gabriel ont été pour dire à Zacharie que sa prière avait été entendue. Luc ne précise pas de quelle prière il s’agissait — l’ancienne prière pour un fils, la prière pour la délivrance d’Israël, ou les deux — mais elle avait été portée longtemps. Élisabeth et Zacharie étaient âgés. Dieu n’avait pas oublié. Cela ne signifie pas que chaque longue prière sera exaucée comme nous l’espérons ; cela signifie qu’aucune prière offerte avec foi n’est perdue devant Lui.',
    ),
    prompts: [
      L('Bring before God the prayer you have carried the longest. Tell Him how long it has been.', 'Apporte devant Dieu la prière que tu portes depuis le plus longtemps. Dis-Lui depuis combien de temps.'),
      L('Pray for someone who has waited years for an answer and is tired of asking.', 'Prie pour quelqu’un qui attend une réponse depuis des années et qui est las de demander.'),
      L('Thank God that He hears, even when you cannot see what He is doing.', 'Remercie Dieu d’entendre, même quand tu ne vois pas ce qu’Il fait.'),
    ],
    selfPrompt: L(
      'Is there a long-carried prayer you have quietly put down? You may pick it up again, or honestly entrust it to Him.',
      'Y a-t-il une prière longtemps portée que tu as discrètement déposée ? Tu peux la reprendre, ou la Lui confier honnêtement.',
    ),
    practice: L(
      'Write down the date you first remember praying this prayer. Keep it as a record of faithfulness, not as a deadline.',
      'Note la date à laquelle tu te souviens avoir prié cette prière pour la première fois. Garde-la comme le signe d’une fidélité, non comme une échéance.',
    ),
    resourceTopics: ['prayer', 'trust', 'lament'],
  },
  {
    movement: 'waiting',
    theme: { en: 'Waiting when nothing changes', fr: 'Attendre quand rien ne change', es: 'Esperar cuando nada cambia', pt: 'Esperar quando nada muda', de: 'Warten, wenn sich nichts ändert', ru: 'Ждать, когда ничего не меняется', zh: '在毫无改变中等候', ja: '何も変わらないときに待つ', ko: '아무것도 변하지 않을 때 기다리기', ar: 'الانتظار حين لا يتغيّر شيء', fa: 'انتظار وقتی هیچ چیز تغییر نمی‌کند', hi: 'जब कुछ नहीं बदलता तब प्रतीक्षा', id: 'Menanti saat tak ada yang berubah', sw: 'Kungoja wakati hakuna kinachobadilika', tl: 'Paghihintay kapag walang nagbabago', am: 'ምንም ሳይለወጥ መጠበቅ' },
    ref: 'Luke 1:5-7',
    related: ['Psalm 130:1-6', 'Romans 8:24-27'],
    reflection: L(
      'Luke describes Zechariah and Elizabeth as righteous before God — and childless. Their waiting was not a punishment, and their faithfulness did not purchase an answer. They kept walking with God in the same ordinary obedience, year after year. The psalmist waits for the Lord more than watchmen wait for the morning, and Paul says the Spirit helps us when we do not know how to pray. Waiting is not wasted time before God.',
      'Luc décrit Zacharie et Élisabeth comme justes devant Dieu — et sans enfant. Leur attente n’était pas une punition, et leur fidélité n’achetait pas une réponse. Ils ont continué à marcher avec Dieu dans la même obéissance ordinaire, année après année. Le psalmiste attend le Seigneur plus que les veilleurs n’attendent le matin, et Paul dit que l’Esprit nous aide quand nous ne savons pas comment prier. L’attente n’est pas du temps perdu devant Dieu.',
    ),
    prompts: [
      L('Tell God honestly what waiting has felt like — the hope, the disappointment, the silence.', 'Dis honnêtement à Dieu ce que l’attente t’a fait vivre — l’espoir, la déception, le silence.'),
      L('Pray for couples longing for children, gently and without assuming what God will do.', 'Prie pour les couples qui désirent des enfants, avec délicatesse et sans présumer de ce que Dieu fera.'),
      L('Pray for people whose faithfulness goes unseen, that they would know God sees them.', 'Prie pour les personnes dont la fidélité passe inaperçue, afin qu’elles sachent que Dieu les voit.'),
    ],
    selfPrompt: L(
      'Where are you tempted to think your faithfulness should have earned an answer by now? Bring that thought to Him and rest in grace.',
      'Où es-tu tenté de penser que ta fidélité aurait dû te valoir une réponse ? Apporte-Lui cette pensée et repose-toi dans la grâce.',
    ),
    practice: L(
      'Read Psalm 130 slowly, and stay with the picture of watchmen waiting for the morning.',
      'Lis lentement le Psaume 130, et arrête-toi sur l’image des veilleurs qui attendent le matin.',
    ),
    resourceTopics: ['lament', 'trust', 'suffering'],
  },
  {
    movement: 'waiting',
    theme: { en: 'When faith becomes tired', fr: 'Quand la foi se fatigue', es: 'Cuando la fe se cansa', pt: 'Quando a fé se cansa', de: 'Wenn der Glaube müde wird', ru: 'Когда вера устаёт', zh: '当信心疲惫时', ja: '信仰が疲れるとき', ko: '믿음이 지칠 때', ar: 'حين يتعب الإيمان', fa: 'وقتی ایمان خسته می‌شود', hi: 'जब विश्वास थक जाता है', id: 'Saat iman menjadi lelah', sw: 'Imani inapochoka', tl: 'Kapag napapagod ang pananampalataya', am: 'እምነት ሲደክም' },
    ref: 'Luke 1:18-20',
    related: ['Mark 9:21-24', 'Isaiah 40:28-31'],
    reflection: L(
      'When the answer finally came, Zechariah asked how he could be sure of it. Years of waiting had worn something down. Gabriel’s word stood anyway, and Zechariah was silent until it was fulfilled. God’s faithfulness was not cancelled by Zechariah’s tired faith. The father in Mark 9 asked Jesus to help his unbelief, and Jesus did not turn him away. Tired faith can still bring its tiredness to God.',
      'Quand la réponse est enfin venue, Zacharie a demandé comment il pourrait en être sûr. Des années d’attente avaient usé quelque chose en lui. La parole de Gabriel s’est pourtant accomplie, et Zacharie est resté muet jusqu’à ce qu’elle se réalise. La fidélité de Dieu n’a pas été annulée par la foi fatiguée de Zacharie. Le père de Marc 9 a demandé à Jésus de venir en aide à son incrédulité, et Jésus ne l’a pas renvoyé. Une foi fatiguée peut encore apporter sa fatigue à Dieu.',
    ),
    prompts: [
      L('Name honestly where your faith feels tired, and ask God to help your unbelief.', 'Nomme honnêtement où ta foi se sent fatiguée, et demande à Dieu de venir en aide à ton incrédulité.'),
      L('Pray for a weary friend, that God would renew their strength as Isaiah describes.', 'Prie pour un ami épuisé, afin que Dieu renouvelle ses forces comme le décrit Ésaïe.'),
      L('Pray for pastors and leaders who are tired, that they would find rest in God.', 'Prie pour les pasteurs et les responsables fatigués, afin qu’ils trouvent du repos en Dieu.'),
    ],
    selfPrompt: L(
      'You do not need to pretend to be stronger than you are. Let God meet you in your tiredness today.',
      'Tu n’as pas besoin de faire semblant d’être plus fort que tu ne l’es. Laisse Dieu te rejoindre dans ta fatigue aujourd’hui.',
    ),
    practice: L(
      'Pray today in one short sentence, asking God to help your faith where it is tired — then leave it with Him.',
      'Prie aujourd’hui en une phrase courte, en demandant à Dieu d’aider ta foi là où elle est fatiguée — puis laisse-Lui cela.',
    ),
    resourceTopics: ['trust', 'suffering', 'prayer'],
  },
  {
    movement: 'waiting',
    theme: { en: 'God’s timing', fr: 'Le temps de Dieu', es: 'El tiempo de Dios', pt: 'O tempo de Deus', de: 'Gottes Zeit', ru: 'Божье время', zh: '神的时间', ja: '神の時', ko: '하나님의 때', ar: 'توقيت الله', fa: 'زمان‌بندی خدا', hi: 'परमेश्वर का समय', id: 'Waktu Tuhan', sw: 'Wakati wa Mungu', tl: 'Panahon ng Diyos', am: 'የእግዚአብሔር ጊዜ' },
    ref: 'Luke 1:21-25',
    related: ['Galatians 4:4-5', 'Ecclesiastes 3:1-11', '2 Peter 3:8-9'],
    reflection: L(
      'Elizabeth said the Lord had looked on her and taken away her disgrace. The answer came late by human measure, but it came within the fullness of time God was preparing for His Son (Galatians 4:4). This is not a formula: we cannot conclude that every delay hides a bigger plan we will one day understand. We can trust that God’s timing is not careless, and that He is patient, not slow (2 Peter 3:9).',
      'Élisabeth a dit que le Seigneur avait jeté les yeux sur elle pour lui ôter son opprobre. La réponse est venue tard selon la mesure humaine, mais elle est venue dans la plénitude des temps que Dieu préparait pour son Fils (Galates 4:4). Ce n’est pas une formule : nous ne pouvons pas conclure que chaque retard cache un plan plus grand que nous comprendrons un jour. Nous pouvons croire que le temps de Dieu n’est pas négligent, et qu’Il est patient, non lent (2 Pierre 3:9).',
    ),
    prompts: [
      L('Hand over to God the timing of the prayer you carry, and ask Him for patience that is not resignation.', 'Remets à Dieu le moment de la prière que tu portes, et demande-Lui une patience qui ne soit pas de la résignation.'),
      L('Pray for someone facing a decision who feels rushed, that they would wait for wisdom.', 'Prie pour quelqu’un qui doit prendre une décision et se sent pressé, afin qu’il attende la sagesse.'),
      L('Pray for those who carry shame because of what has not happened in their lives, that they would know God’s regard.', 'Prie pour ceux qui portent une honte à cause de ce qui ne s’est pas produit dans leur vie, afin qu’ils connaissent le regard de Dieu sur eux.'),
    ],
    selfPrompt: L(
      'Where are you trying to set God’s schedule for Him? Bring that place under His care today.',
      'Où essaies-tu de fixer à Dieu son calendrier ? Place cet endroit sous ses soins aujourd’hui.',
    ),
    practice: L(
      'Look back over one season of your life and write down one thing God did that you only understood later.',
      'Repense à une période de ta vie et note une chose que Dieu a faite et que tu n’as comprise que plus tard.',
    ),
    resourceTopics: ['trust', 'discernment', 'prayer'],
  },

  // ── Movement 3 · Answer and purpose (days 8–10) ───────────────────────────
  {
    movement: 'purpose',
    theme: { en: 'Personal prayer and Kingdom purpose', fr: 'Prière personnelle et dessein du Royaume', es: 'Oración personal y propósito del Reino', pt: 'Oração pessoal e propósito do Reino', de: 'Persönliches Gebet und Gottes Reich', ru: 'Личная молитва и цель Царства', zh: '个人的祷告与神国的旨意', ja: '個人的な祈りと御国の目的', ko: '개인의 기도와 하나님 나라의 목적', ar: 'الصلاة الشخصية وقصد الملكوت', fa: 'دعای شخصی و هدف ملکوت', hi: 'व्यक्तिगत प्रार्थना और राज्य का उद्देश्य', id: 'Doa pribadi dan maksud Kerajaan', sw: 'Ombi binafsi na kusudi la Ufalme', tl: 'Personal na panalangin at layunin ng Kaharian', am: 'የግል ጸሎትና የመንግሥቱ ዓላማ' },
    ref: 'Luke 1:14-17',
    related: ['Isaiah 40:3-5', 'Luke 3:2-6'],
    reflection: L(
      'The son promised to Zechariah would be a joy to his parents — and much more. John would turn many hearts back to the Lord and prepare a people for Him. A personal longing was answered inside a purpose far larger than one family. This does not make personal prayer small; it shows that God weaves our own prayers into His work in the world. We pray for our needs, and we hold them open to His Kingdom.',
      'Le fils promis à Zacharie serait une joie pour ses parents — et bien plus. Jean ramènerait beaucoup de cœurs au Seigneur et préparerait un peuple pour Lui. Un désir personnel a été exaucé à l’intérieur d’un dessein bien plus vaste qu’une seule famille. Cela ne rend pas la prière personnelle insignifiante ; cela montre que Dieu tisse nos propres prières dans son œuvre dans le monde. Nous prions pour nos besoins, et nous les gardons ouverts à son Royaume.',
    ),
    prompts: [
      L('Bring your own needs to God, and ask Him to use your life for His purposes beyond them.', 'Apporte tes besoins à Dieu, et demande-Lui d’utiliser ta vie pour ses desseins, au-delà d’eux.'),
      L('Pray for children and young people you know, that they would grow up to know and serve the Lord.', 'Prie pour les enfants et les jeunes que tu connais, afin qu’ils grandissent en connaissant et en servant le Seigneur.'),
      L('Pray for the gospel to reach people who have not yet heard it, in your city and among the nations.', 'Prie pour que l’Évangile atteigne ceux qui ne l’ont pas encore entendu, dans ta ville et parmi les nations.'),
    ],
    selfPrompt: L(
      'Which of your prayers have stayed only about you? Without letting go of them, ask how they might serve His Kingdom.',
      'Lesquelles de tes prières sont restées centrées sur toi seul ? Sans les abandonner, demande comment elles pourraient servir son Royaume.',
    ),
    practice: L(
      'Add one prayer today for your church, your city or a nation, beside the prayers you already carry.',
      'Ajoute aujourd’hui une prière pour ton Église, ta ville ou une nation, à côté des prières que tu portes déjà.',
    ),
    resourceTopics: ['kingdom-of-god', 'mission', 'calling'],
  },
  {
    movement: 'purpose',
    theme: { en: 'From answer to testimony', fr: 'De l’exaucement au témoignage', es: 'De la respuesta al testimonio', pt: 'Da resposta ao testemunho', de: 'Von der Erhörung zum Zeugnis', ru: 'От ответа к свидетельству', zh: '从应允到见证', ja: '答えから証しへ', ko: '응답에서 간증으로', ar: 'من الاستجابة إلى الشهادة', fa: 'از پاسخ تا شهادت', hi: 'उत्तर से गवाही तक', id: 'Dari jawaban menuju kesaksian', sw: 'Kutoka jibu hadi ushuhuda', tl: 'Mula sa sagot tungo sa patotoo', am: 'ከመልስ ወደ ምስክርነት' },
    ref: 'Luke 1:57-66',
    related: ['Psalm 66:16-20', 'Psalm 40:1-3'],
    reflection: L(
      'When John was born, the neighbours and relatives shared Elizabeth’s joy, and the story spread through the hill country. People kept asking what this child would become. An answered prayer became a testimony that others carried in their hearts. Testimony is not boasting about our prayers; it is remembering what God has done so that others may trust Him too.',
      'Quand Jean est né, les voisins et les parents ont partagé la joie d’Élisabeth, et le récit s’est répandu dans la région montagneuse. Les gens se demandaient ce que deviendrait cet enfant. Une prière exaucée est devenue un témoignage que d’autres gardaient dans leur cœur. Témoigner n’est pas se vanter de nos prières ; c’est se souvenir de ce que Dieu a fait, pour que d’autres Lui fassent confiance aussi.',
    ),
    prompts: [
      L('Remember one thing God has done in your life, and thank Him for it in detail.', 'Souviens-toi d’une chose que Dieu a faite dans ta vie, et remercie-Le en détail.'),
      L('Pray for someone who needs encouragement today, and ask whether your testimony could help them.', 'Prie pour quelqu’un qui a besoin d’encouragement aujourd’hui, et demande-toi si ton témoignage pourrait l’aider.'),
      L('Pray for your church to become a place where people tell what God has done, humbly and truthfully.', 'Prie pour que ton Église devienne un lieu où l’on raconte ce que Dieu a fait, avec humilité et vérité.'),
    ],
    selfPrompt: L(
      'Have you kept God’s faithfulness to yourself out of shyness or forgetfulness? Ask Him whom you might tell.',
      'As-tu gardé pour toi la fidélité de Dieu, par timidité ou par oubli ? Demande-Lui à qui tu pourrais en parler.',
    ),
    practice: L(
      'Record a testimony today — a few sentences about how you have seen God at work — and keep it where you will see it again.',
      'Note un témoignage aujourd’hui — quelques phrases sur la manière dont tu as vu Dieu à l’œuvre — et garde-le là où tu le reverras.',
    ),
    resourceTopics: ['worship', 'evangelism', 'prayer'],
  },
  {
    movement: 'purpose',
    theme: { en: 'Preparing the way', fr: 'Préparer le chemin', es: 'Preparar el camino', pt: 'Preparar o caminho', de: 'Den Weg bereiten', ru: 'Приготовить путь', zh: '预备道路', ja: '道を備える', ko: '길을 예비하라', ar: 'إعداد الطريق', fa: 'آماده کردن راه', hi: 'मार्ग तैयार करना', id: 'Mempersiapkan jalan', sw: 'Kuitengeneza njia', tl: 'Paghahanda ng daan', am: 'መንገድን ማዘጋጀት' },
    ref: 'Luke 1:67-80',
    related: ['John 1:6-8', 'John 3:27-30'],
    reflection: L(
      'Zechariah’s silence ended in praise. Filled with the Holy Spirit, he blessed God for visiting His people, and spoke of his son as the one who would go before the Lord to prepare His ways. John later said that Jesus must become greater and he himself less. This is where the story of the altar leads: not to our own greatness, but to Christ being made known. Prayer prepares us to point to Him.',
      'Le silence de Zacharie s’est achevé dans la louange. Rempli du Saint-Esprit, il a béni Dieu d’avoir visité son peuple, et a parlé de son fils comme de celui qui marcherait devant le Seigneur pour préparer ses voies. Jean dira plus tard que Jésus devait grandir et lui-même s’effacer. Voilà où mène l’histoire de l’autel : non pas à notre propre grandeur, mais au Christ rendu connu. La prière nous prépare à pointer vers Lui.',
    ),
    prompts: [
      L('Bless God for the ways He has visited you and your people.', 'Bénis Dieu pour la manière dont Il t’a visité, toi et les tiens.'),
      L('Pray for someone near you who does not yet know Christ, that your life and words would prepare the way for Him.', 'Prie pour quelqu’un de proche qui ne connaît pas encore le Christ, afin que ta vie et tes paroles Lui préparent le chemin.'),
      L('Pray for the Church in your nation to point to Jesus rather than to itself.', 'Prie pour que l’Église de ton pays pointe vers Jésus plutôt que vers elle-même.'),
    ],
    selfPrompt: L(
      'Where do you want to be seen more than you want Christ to be seen? Bring that desire to Him, and ask Him to become greater in you.',
      'Où désires-tu être vu plus que tu ne désires que le Christ soit vu ? Apporte-Lui ce désir, et demande-Lui de grandir en toi.',
    ),
    practice: L(
      'Is there a faithful next step from these ten days — someone to encourage, to forgive, to serve or to tell about Jesus? Take it this week.',
      'Y a-t-il un pas fidèle à faire après ces dix jours — quelqu’un à encourager, à qui pardonner, à servir, ou à qui parler de Jésus ? Fais-le cette semaine.',
    ),
    resourceTopics: ['evangelism', 'calling', 'holy-spirit'],
  },
];
