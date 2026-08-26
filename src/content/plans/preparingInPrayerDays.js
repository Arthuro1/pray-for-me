// The 21 days of "Preparing in Prayer" (see ./preparingInPrayer.js for the plan
// meta, the movements and the theological guardrail this content is held to).
//
// Day shape — every field except `theme` and `ref` is optional:
//   theme           short day title, authored in ALL 16 languages (like the
//                   other plans' day themes)
//   ref             the PRIMARY passage; language-neutral, localized at render
//   related         up to 3 supporting passages, kept visually secondary
//   movement        which of the four movements this day belongs to
//   reflection      2-4 sentences of Pray4Me commentary — never Scripture text
//   prompts         3 short prayer prompts; they may paraphrase biblical themes
//                   but are NEVER presented as quotations
//   selfPrompt      the "also pray for yourself" mirror. Days 11-17 pray for a
//                   person the reader may one day marry, and every one of them
//                   turns the same prayer back on the reader
//   practice        one small, optional, concrete response for today
//   roles           OPTIONAL husband/wife reflection, shown only when the reader
//                   explicitly asked for it in onboarding. Five days out of
//                   twenty-one carry one, and none of them changes the day's
//                   Scripture, prompts or structure
//   resourceTopics  taxonomy ids used to look up approved external resources
//   emphasis        which onboarding emphasis this day serves (used to weight
//                   resources and to pre-tick the completion step, never to add
//                   or remove days)
//
// Prose is authored in en + fr; other languages arrive as overlays keyed by day
// number (see ./translations.js).
export const DAYS = [
  {
    movement: 'rooted',
    theme: { en: 'God is enough', fr: 'Dieu suffit', es: 'Dios basta', pt: 'Deus basta', de: 'Gott genügt', ru: 'Бога достаточно', zh: '有神就够了', ja: '神様だけで十分', ko: '하나님으로 충분하다', ar: 'الله يكفي', fa: 'خدا کافی است', hi: 'परमेश्वर ही पर्याप्त है', id: 'Allah sudah cukup', sw: 'Mungu anatosha', tl: 'Sapat na ang Diyos', am: 'እግዚአብሔር ይበቃል' },
    ref: 'Psalm 73:25-26',
    related: ['Psalm 63:1-3'],
    reflection: {
      en: "Begin where the psalmist ended up: with God Himself. Asaph had watched everyone else get what he wanted and had almost lost his footing over it — then he came into God's presence and found that the One he already had was the One he most needed. Before this journey asks God for anything about marriage, it asks for Him.",
      fr: "Commence là où le psalmiste est arrivé : auprès de Dieu lui-même. Asaph avait vu tous les autres obtenir ce qu'il désirait et avait failli perdre pied — puis il est entré dans la présence de Dieu et a découvert que Celui qu'il avait déjà était Celui dont il avait le plus besoin. Avant de demander quoi que ce soit au sujet du mariage, ce parcours Le demande, Lui.",
    },
    prompts: [
      { en: 'Tell God honestly that you want Him more than anything He could give.', fr: "Dis honnêtement à Dieu que tu Le veux, Lui, plus que tout ce qu'Il pourrait donner." },
      { en: 'Thank Him for being your strength when your own heart fails.', fr: "Remercie-Le d'être ta force quand ton propre cœur défaille." },
      { en: 'Ask Him to be enough for you today, in the life you actually have.', fr: "Demande-Lui de te suffire aujourd'hui, dans la vie qui est réellement la tienne." },
    ],
    selfPrompt: {
      en: 'Notice what you reached for first this morning. Bring that to God before you bring Him a request.',
      fr: "Remarque vers quoi tu t'es tourné en premier ce matin. Apporte cela à Dieu avant de Lui apporter une demande.",
    },
    practice: {
      en: "Spend the first part of today's prayer thanking God, before you ask Him for anything about marriage.",
      fr: "Passe le début de la prière d'aujourd'hui à remercier Dieu, avant de Lui demander quoi que ce soit au sujet du mariage.",
    },
    resourceTopics: ['prayer', 'spiritual-formation'],
    emphasis: ['closeness'],
  },
  {
    movement: 'rooted',
    theme: { en: 'Identity in Christ', fr: 'Mon identité en Christ', es: 'Mi identidad en Cristo', pt: 'Minha identidade em Cristo', de: 'Meine Identität in Christus', ru: 'Кто я во Христе', zh: '我在基督里的身分', ja: 'キリストにある自分', ko: '그리스도 안에서의 정체성', ar: 'هويتي في المسيح', fa: 'هویت من در مسیح', hi: 'मसीह में मेरी पहचान', id: 'Identitasku dalam Kristus', sw: 'Utambulisho wangu katika Kristo', tl: 'Ang pagkatao ko kay Cristo', am: 'ማንነቴ በክርስቶስ' },
    ref: 'Colossians 3:1-4',
    related: ['Galatians 2:20', 'Ephesians 1:3-8'],
    reflection: {
      en: 'Paul says your life is hidden with Christ in God. That settles who you are before anyone ever chooses you — and it does not change if no one ever does. Relationship status is a circumstance. It was never an identity.',
      fr: "Paul dit que ta vie est cachée avec Christ en Dieu. Cela règle la question de qui tu es avant que quiconque te choisisse — et cela ne change pas si personne ne le fait jamais. Le statut relationnel est une circonstance. Il n'a jamais été une identité.",
    },
    prompts: [
      { en: 'Ask God to set your mind on things above rather than on what you lack.', fr: "Demande à Dieu d'attacher ton cœur aux choses d'en haut plutôt qu'à ce qui te manque." },
      { en: 'Thank Him that you are already His, chosen and loved in Christ.', fr: "Remercie-Le : tu es déjà à Lui, choisi et aimé en Christ." },
      { en: 'Name one comparison you keep making, and hand it to Him.', fr: "Nomme une comparaison que tu refais sans cesse, et remets-la-Lui." },
    ],
    selfPrompt: {
      en: 'Where are you letting being single — or being chosen — decide what you are worth?',
      fr: "Où laisses-tu le célibat — ou le fait d'être choisi — décider de ta valeur ?",
    },
    roles: {
      husband: {
        en: 'Preparing to be a husband starts here, not with providing or deciding. A man who is secure in Christ has nothing to prove, and is therefore free to serve. Ask God to settle that security so deeply that you would never need a wife to supply it.',
        fr: "Se préparer à être mari commence ici, et non par le fait de pourvoir ou de décider. Un homme assuré en Christ n'a rien à prouver, et devient donc libre de servir. Demande à Dieu d'ancrer cette assurance si profondément qu'aucune épouse n'ait jamais à la fournir.",
      },
      wife: {
        ref: 'Proverbs 31:30',
        en: 'Proverbs closes its portrait of a strong woman by naming what actually lasts: not charm, not beauty, but the fear of the LORD. Ask God to root your security in Him, so that being chosen by someone is never what tells you who you are.',
        fr: "Les Proverbes achèvent le portrait d'une femme forte en nommant ce qui dure vraiment : ni la grâce, ni la beauté, mais la crainte de l'Éternel. Demande à Dieu d'enraciner ton assurance en Lui, afin qu'être choisie par quelqu'un ne te dise jamais qui tu es.",
      },
    },
    resourceTopics: ['identity', 'spiritual-formation'],
    emphasis: ['closeness', 'character'],
  },
  {
    movement: 'rooted',
    theme: { en: 'Receiving this season', fr: 'Recevoir cette saison', es: 'Recibir esta etapa', pt: 'Receber esta estação', de: 'Diese Zeit annehmen', ru: 'Принять это время', zh: '接受这个季节', ja: 'この時期を受け取る', ko: '이 계절을 받아들이라', ar: 'اقبل هذا الموسم', fa: 'این فصل را بپذیر', hi: 'इस मौसम को स्वीकार करें', id: 'Menerima musim ini', sw: 'Kupokea msimu huu', tl: 'Tanggapin ang panahong ito', am: 'ይህን ወቅት ተቀበል' },
    ref: 'Philippians 4:11-13',
    related: ['1 Corinthians 7:32-35', 'Psalm 16:5-6'],
    reflection: {
      en: 'Paul says he learned contentment — it was not his temperament. And he speaks of singleness not as a waiting room but as an undivided freedom for the Lord. Today is not the part of your life that happens before your life starts.',
      fr: "Paul dit qu'il a appris le contentement — ce n'était pas son tempérament. Et il parle du célibat non comme d'une salle d'attente, mais comme d'une liberté sans partage pour le Seigneur. Aujourd'hui n'est pas la partie de ta vie qui précède le début de ta vie.",
    },
    prompts: [
      { en: 'Ask God to teach you contentment, as something learned rather than felt.', fr: "Demande à Dieu de t'enseigner le contentement, comme une chose qui s'apprend et non qui se ressent." },
      { en: 'Thank Him for something only this season makes possible.', fr: 'Remercie-Le pour une chose que seule cette saison rend possible.' },
      { en: 'Offer Him the undivided attention you have right now.', fr: "Offre-Lui l'attention sans partage que tu as en ce moment." },
    ],
    selfPrompt: {
      en: 'Name one thing you have been postponing until you are married. Ask whether God is asking for it now.',
      fr: 'Nomme une chose que tu remets à ton mariage. Demande si Dieu ne la demande pas maintenant.',
    },
    practice: {
      en: 'Name three good gifts God has given you in this season, and thank Him for each by name.',
      fr: "Nomme trois bons dons que Dieu t'a faits dans cette saison, et remercie-Le pour chacun.",
    },
    resourceTopics: ['singleness', 'contentment'],
    emphasis: ['contentment'],
  },
  {
    movement: 'rooted',
    theme: { en: "Trusting God's timing", fr: 'Se confier au temps de Dieu', es: 'Confiar en el tiempo de Dios', pt: 'Confiar no tempo de Deus', de: 'Gottes Zeit vertrauen', ru: 'Довериться Божьему времени', zh: '信靠神的时间', ja: '神様の時を信頼する', ko: '하나님의 때를 신뢰하라', ar: 'الثقة بتوقيت الله', fa: 'به زمان خدا اعتماد کن', hi: 'परमेश्वर के समय पर भरोसा', id: 'Percaya pada waktu Allah', sw: 'Kuamini wakati wa Mungu', tl: 'Magtiwala sa panahon ng Diyos', am: 'በእግዚአብሔር ጊዜ መታመን' },
    ref: 'Proverbs 3:5-6',
    related: ['Matthew 6:31-34', 'Psalm 27:14'],
    reflection: {
      en: 'Trusting God with timing is not the same as being told the outcome. Waiting on the LORD in Scripture is never a promise about what arrives at the end of the wait — it is a promise about who holds you all the way through it.',
      fr: "Confier le temps à Dieu n'est pas recevoir le résultat à l'avance. Dans l'Écriture, s'attendre à l'Éternel n'est jamais une promesse sur ce qui arrivera au bout de l'attente — c'est une promesse sur Celui qui te tient tout au long.",
    },
    prompts: [
      { en: 'Tell God where you are leaning on your own understanding.', fr: "Dis à Dieu où tu t'appuies sur ta propre intelligence." },
      { en: 'Ask Him to make your paths straight, even if that is not the path you pictured.', fr: "Demande-Lui d'aplanir tes sentiers, même si ce n'est pas le chemin que tu imaginais." },
      { en: 'Ask for courage for today rather than certainty about the future.', fr: "Demande du courage pour aujourd'hui plutôt que des certitudes sur l'avenir." },
    ],
    selfPrompt: {
      en: "What have you been calling 'waiting' that God may simply be calling 'living'?",
      fr: "Ce que tu appelles « attendre », Dieu ne l'appelle-t-il pas simplement « vivre » ?",
    },
    resourceTopics: ['contentment', 'discernment'],
    emphasis: ['contentment'],
  },
  {
    movement: 'rooted',
    theme: { en: 'Desires with open hands', fr: 'Des désirs à mains ouvertes', es: 'Deseos con las manos abiertas', pt: 'Desejos de mãos abertas', de: 'Wünsche mit offenen Händen', ru: 'Желания с открытыми руками', zh: '张开手掌的渴望', ja: '手を開いて願う', ko: '두 손을 편 채 드리는 소원', ar: 'رغبات بأيدٍ مفتوحة', fa: 'آرزوها با دستان باز', hi: 'खुले हाथों से इच्छाएं', id: 'Kerinduan dengan tangan terbuka', sw: 'Matamanio kwa mikono wazi', tl: 'Mga hangarin nang bukas ang palad', am: 'ምኞቶች በተከፈተ እጅ' },
    ref: 'Psalm 37:4-5',
    related: ['Psalm 62:8'],
    reflection: {
      en: 'Delighting in the LORD is not a technique for obtaining the desires of your heart; it is what re-shapes them. Bring the desire for marriage into the open before God. It is not shameful — and it is not a god.',
      fr: "Faire ses délices de l'Éternel n'est pas une technique pour obtenir les désirs de son cœur ; c'est ce qui les remodèle. Expose ouvertement devant Dieu le désir du mariage. Il n'est pas honteux — et il n'est pas un dieu.",
    },
    prompts: [
      { en: 'Say the desire out loud to God, plainly, without dressing it up.', fr: "Dis ce désir à Dieu à voix haute, simplement, sans l'habiller." },
      { en: 'Ask Him to reshape whatever in it has quietly become an idol.', fr: 'Demande-Lui de remodeler ce qui, en lui, est devenu une idole sans bruit.' },
      { en: 'Commit your way to Him and leave the outcome in His hands.', fr: 'Recommande-Lui ta voie et laisse le résultat entre Ses mains.' },
    ],
    selfPrompt: {
      en: 'If God never grants this, would you still trust Him? Tell Him the honest answer.',
      fr: "Si Dieu ne l'accorde jamais, Lui feras-tu encore confiance ? Dis-Lui la réponse honnête.",
    },
    resourceTopics: ['prayer', 'singleness'],
    emphasis: ['closeness', 'contentment'],
  },
  {
    movement: 'becoming',
    theme: { en: 'Character before compatibility', fr: 'Le caractère avant la compatibilité', es: 'El carácter antes que la compatibilidad', pt: 'O caráter antes da compatibilidade', de: 'Charakter vor Kompatibilität', ru: 'Характер важнее совместимости', zh: '品格先于合适', ja: '相性より人格', ko: '궁합보다 인격', ar: 'الشخصية قبل التوافق', fa: 'شخصیت پیش از تناسب', hi: 'अनुकूलता से पहले चरित्र', id: 'Karakter sebelum kecocokan', sw: 'Tabia kabla ya ulinganifu', tl: 'Karakter bago ang pagkakatugma', am: 'ባህርይ ከመጣጣም በፊት' },
    ref: 'Galatians 5:22-23',
    related: ['Colossians 3:12-14'],
    reflection: {
      en: 'It is easier to write a list of what you want in someone else than to let God write that list about you. The fruit of the Spirit is not a screening checklist for other people; it is what He patiently grows in anyone willing to be worked on.',
      fr: "Il est plus facile d'écrire la liste de ce qu'on veut chez l'autre que de laisser Dieu écrire cette liste à notre sujet. Le fruit de l'Esprit n'est pas une grille pour évaluer les autres ; c'est ce que Dieu fait patiemment croître chez quiconque accepte d'être travaillé.",
    },
    prompts: [
      { en: 'Ask God to grow one fruit of the Spirit in you that is clearly missing.', fr: "Demande à Dieu de faire croître en toi un fruit de l'Esprit qui manque visiblement." },
      { en: 'Ask Him to make you someone who is good to live with.', fr: "Demande-Lui de faire de toi quelqu'un avec qui il fait bon vivre." },
      { en: 'Thank Him that He forms character patiently, not overnight.', fr: 'Remercie-Le de former le caractère avec patience, et non du jour au lendemain.' },
    ],
    selfPrompt: {
      en: 'Read the list again slowly and let it describe you, rather than someone you hope to meet.',
      fr: "Relis la liste lentement et laisse-la te décrire, toi, plutôt que quelqu'un que tu espères rencontrer.",
    },
    practice: {
      en: 'Choose one fruit of the Spirit and pray about it for yourself today — the same one you would want in a spouse.',
      fr: "Choisis un fruit de l'Esprit et prie-le pour toi-même aujourd'hui — celui-là même que tu voudrais chez un conjoint.",
    },
    roles: {
      husband: {
        ref: 'Mark 10:42-45',
        en: 'Jesus set the rulers who lord it over people against His own way: among you, the greatest serves. Preparing to be a husband means learning to take responsibility and to serve first, long before anyone is watching — not learning to be in charge.',
        fr: "Jésus a opposé les chefs qui dominent les gens à Sa propre voie : parmi vous, le plus grand sert. Se préparer à être mari, c'est apprendre à prendre ses responsabilités et à servir le premier, bien avant que quiconque regarde — et non apprendre à commander.",
      },
      wife: {
        ref: 'Proverbs 31:25-26',
        en: 'Strength and dignity are her clothing, and she opens her mouth with wisdom. Preparing to be a wife means growing in strength, wisdom and kindness — not in silence, appearance, or performance.',
        fr: "La force et la dignité sont son vêtement, et elle ouvre la bouche avec sagesse. Se préparer à être épouse, c'est croître en force, en sagesse et en bonté — non en silence, en apparence ou en performance.",
      },
    },
    resourceTopics: ['character', 'spiritual-formation'],
    emphasis: ['character'],
  },
  {
    movement: 'becoming',
    theme: { en: 'Healing from the past', fr: 'Guérir du passé', es: 'Sanar del pasado', pt: 'Cura do passado', de: 'Heilung von der Vergangenheit', ru: 'Исцеление от прошлого', zh: '从过去得医治', ja: '過去からの癒やし', ko: '과거로부터의 치유', ar: 'الشفاء من الماضي', fa: 'شفا از گذشته', hi: 'अतीत से चंगाई', id: 'Pemulihan dari masa lalu', sw: 'Uponyaji kutoka zamani', tl: 'Paggaling mula sa nakaraan', am: 'ከቀደመው ጉዳት መፈወስ' },
    ref: 'Psalm 147:3',
    related: ['Psalm 34:18', 'Philippians 3:13-14'],
    reflection: {
      en: 'He heals the broken-hearted and binds up their wounds. Some of what you would carry into a future relationship was put there by an old one, by a family, or by a rejection you have never said out loud. God is not embarrassed by any of it. Prayer is where this starts — it is not a replacement for the help of a pastor or a counsellor where that is needed.',
      fr: "Il guérit ceux qui ont le cœur brisé et panse leurs blessures. Une part de ce que tu porterais dans une relation future y a été mise par une relation ancienne, par une famille, ou par un rejet que tu n'as jamais dit à voix haute. Rien de tout cela n'embarrasse Dieu. La prière est le point de départ — elle ne remplace pas l'aide d'un pasteur ou d'un conseiller lorsqu'elle est nécessaire.",
    },
    prompts: [
      { en: 'Name one wound to God plainly, instead of praying around it.', fr: "Nomme une blessure à Dieu simplement, au lieu de prier autour d'elle." },
      { en: 'Ask Him to bind up what is still bleeding, at His pace.', fr: 'Demande-Lui de panser ce qui saigne encore, à Son rythme.' },
      { en: 'Ask for grace to forgive someone you have not forgiven.', fr: "Demande la grâce de pardonner à quelqu'un que tu n'as pas pardonné." },
    ],
    selfPrompt: {
      en: 'Is there something here you should also speak about with a pastor, a mature friend, or a counsellor?',
      fr: "Y a-t-il ici quelque chose dont tu devrais aussi parler à un pasteur, à un ami mûr ou à un conseiller ?",
    },
    resourceTopics: ['healing'],
    emphasis: ['healing'],
  },
  {
    movement: 'becoming',
    theme: { en: 'Purity and integrity', fr: 'Pureté et intégrité', es: 'Pureza e integridad', pt: 'Pureza e integridade', de: 'Reinheit und Integrität', ru: 'Чистота и цельность', zh: '圣洁与正直', ja: '清さと誠実さ', ko: '순결과 정직', ar: 'الطهارة والاستقامة', fa: 'پاکی و درستکاری', hi: 'पवित्रता और सत्यनिष्ठा', id: 'Kemurnian dan integritas', sw: 'Usafi na uadilifu', tl: 'Kalinisan at integridad', am: 'ንጽሕናና ታማኝነት' },
    ref: '1 Thessalonians 4:3-7',
    related: ['Psalm 119:9-11', '1 Corinthians 6:18-20'],
    reflection: {
      en: 'Paul frames purity as honour rather than disgust: learning to hold your own body, and other people, with respect instead of using them. This is whole-person faithfulness — what you look at, what you say, what you do with someone else’s heart — and it is asked of the married and the single alike. If you have already failed here, the gospel’s word for that is forgiveness, not exile.',
      fr: "Paul présente la pureté comme un honneur et non comme un dégoût : apprendre à traiter son propre corps, et les autres, avec respect au lieu de s'en servir. C'est une fidélité de toute la personne — ce que tu regardes, ce que tu dis, ce que tu fais du cœur d'un autre — et elle est demandée aux mariés comme aux célibataires. Si tu as déjà échoué ici, le mot de l'Évangile pour cela est pardon, non exil.",
    },
    prompts: [
      { en: 'Ask God for honour in how you treat your own body and other people.', fr: "Demande à Dieu de l'honneur dans la manière dont tu traites ton corps et les autres." },
      { en: 'Bring one specific area into the light instead of managing it alone.', fr: 'Amène un domaine précis à la lumière au lieu de le gérer seul.' },
      { en: 'Thank Him that His call to holiness comes with His Spirit.', fr: "Remercie-Le : Son appel à la sainteté vient avec Son Esprit." },
    ],
    selfPrompt: {
      en: 'Faithfulness is a habit long before it is a wedding vow. Where is today’s small choice?',
      fr: "La fidélité est une habitude bien avant d'être un vœu de mariage. Où se trouve le petit choix d'aujourd'hui ?",
    },
    practice: {
      en: 'Take one honest step of accountability today — a conversation, a boundary, a setting changed.',
      fr: "Fais aujourd'hui un pas honnête de responsabilité — une conversation, une limite, un réglage changé.",
    },
    resourceTopics: ['purity', 'sexuality'],
    emphasis: ['character'],
  },
  {
    movement: 'becoming',
    theme: { en: 'Wisdom and discernment', fr: 'Sagesse et discernement', es: 'Sabiduría y discernimiento', pt: 'Sabedoria e discernimento', de: 'Weisheit und Unterscheidungsvermögen', ru: 'Мудрость и рассудительность', zh: '智慧与分辨', ja: '知恵と識別', ko: '지혜와 분별', ar: 'الحكمة والتمييز', fa: 'حکمت و تشخیص', hi: 'बुद्धि और विवेक', id: 'Hikmat dan pertimbangan', sw: 'Hekima na busara', tl: 'Karunungan at pagkilatis', am: 'ጥበብና ማስተዋል' },
    ref: 'James 1:5',
    related: ['Proverbs 4:23', 'Proverbs 13:20'],
    reflection: {
      en: 'God gives wisdom generously and without reproach — you do not have to be embarrassed to ask. Discernment here is not a scoring system for judging people. It is learning to see clearly: what is healthy, whose counsel is worth taking, and where your own heart is not telling you the truth.',
      fr: "Dieu donne la sagesse avec générosité et sans reproche — tu n'as pas à avoir honte de la demander. Le discernement n'est pas ici une grille pour juger les gens. C'est apprendre à voir clair : ce qui est sain, quels conseils méritent d'être suivis, et où ton propre cœur ne te dit pas la vérité.",
    },
    prompts: [
      { en: 'Ask God for wisdom, plainly, and believe He gives it without scolding.', fr: 'Demande simplement la sagesse à Dieu, et crois qu’Il la donne sans réprimander.' },
      { en: 'Ask for honest friends who will tell you what you would rather not hear.', fr: "Demande des amis honnêtes qui te diront ce que tu préférerais ne pas entendre." },
      { en: 'Ask Him to guard your heart, since everything you do flows from it.', fr: "Demande-Lui de garder ton cœur, car tout ce que tu fais en découle." },
    ],
    selfPrompt: {
      en: 'Whose counsel have you been avoiding because you can already guess what they would say?',
      fr: "De qui évites-tu le conseil parce que tu devines déjà ce qu'il te dirait ?",
    },
    resourceTopics: ['discernment', 'dating'],
    emphasis: ['character'],
  },
  {
    movement: 'becoming',
    theme: { en: 'Friendship and community', fr: 'Amitié et communauté', es: 'Amistad y comunidad', pt: 'Amizade e comunidade', de: 'Freundschaft und Gemeinschaft', ru: 'Дружба и община', zh: '友谊与群体', ja: '友情と交わり', ko: '우정과 공동체', ar: 'الصداقة والشركة', fa: 'دوستی و جماعت', hi: 'मित्रता और संगति', id: 'Persahabatan dan persekutuan', sw: 'Urafiki na ushirika', tl: 'Pagkakaibigan at pagsasama', am: 'ወዳጅነትና ኅብረት' },
    ref: 'Hebrews 10:24-25',
    related: ['John 13:34-35', 'Proverbs 27:17'],
    reflection: {
      en: 'No spouse can carry the weight of being someone’s entire belonging. Scripture puts believers in a church, in friendships, in a body — and someone who has learned to love and be known there brings something into a marriage instead of needing one to rescue them from loneliness.',
      fr: "Aucun conjoint ne peut porter le poids d'être toute l'appartenance de quelqu'un. L'Écriture place les croyants dans une Église, dans des amitiés, dans un corps — et celui qui a appris à aimer et à être connu là apporte quelque chose dans un mariage au lieu d'en attendre un sauvetage de sa solitude.",
    },
    prompts: [
      { en: 'Ask God for friendships where you are actually known.', fr: 'Demande à Dieu des amitiés où tu es réellement connu.' },
      { en: 'Ask Him to make you the kind of friend you are hoping to find.', fr: "Demande-Lui de faire de toi le genre d'ami que tu espères trouver." },
      { en: 'Pray for your church, by name.', fr: 'Prie pour ton Église, en la nommant.' },
    ],
    selfPrompt: {
      en: 'Is there someone you have quietly withdrawn from? Ask God about that.',
      fr: "Y a-t-il quelqu'un dont tu t'es discrètement éloigné ? Parles-en à Dieu.",
    },
    practice: {
      en: 'Encourage or check in with one person in your church or community today.',
      fr: "Encourage ou prends des nouvelles d'une personne de ton Église ou de ta communauté aujourd'hui.",
    },
    resourceTopics: ['community', 'singleness'],
    emphasis: ['contentment'],
  },
  {
    movement: 'intercede',
    theme: { en: 'Their walk with God', fr: 'Leur marche avec Dieu', es: 'Su caminar con Dios', pt: 'O caminhar dessa pessoa com Deus', de: 'Der Weg dieses Menschen mit Gott', ru: 'Их путь с Богом', zh: '那人与神同行', ja: 'その人の神様との歩み', ko: '그 사람의 하나님과의 동행', ar: 'مسيرة ذلك الشخص مع الله', fa: 'راه رفتن او با خدا', hi: 'उनका परमेश्वर के साथ चलना', id: 'Perjalanan mereka dengan Allah', sw: 'Kutembea kwao na Mungu', tl: 'Ang paglakad nila kasama ng Diyos', am: 'ከእግዚአብሔር ጋር ያላቸው ጉዞ' },
    ref: 'Colossians 1:9-12',
    related: ['Philippians 1:9-11'],
    reflection: {
      en: 'From today the plan prays for a person you may one day marry — and it starts where Paul starts: not with what they are like, but with whether they know God. You are not picturing anyone. You are asking God for what matters most about someone you do not know, and every one of these prayers is meant to be prayed over you too.',
      fr: "À partir d'aujourd'hui, le parcours prie pour une personne que tu épouseras peut-être un jour — et il commence là où Paul commence : non par ce qu'elle est, mais par sa connaissance de Dieu. Tu n'imagines personne. Tu demandes à Dieu ce qui compte le plus chez quelqu'un que tu ne connais pas, et chacune de ces prières est faite pour être priée sur toi aussi.",
    },
    prompts: [
      { en: 'Grow them in knowing You.', fr: 'Fais-les croître dans la connaissance de Toi.' },
      { en: 'Give them wisdom for the decisions in front of them.', fr: 'Donne-leur de la sagesse pour les décisions devant eux.' },
      { en: 'Let their life bear good fruit, and give them endurance and patience.', fr: 'Que leur vie porte du bon fruit ; donne-leur persévérance et patience.' },
    ],
    selfPrompt: {
      en: 'Now pray those same three things for yourself, in the same words.',
      fr: 'Prie maintenant ces trois mêmes choses pour toi, avec les mêmes mots.',
    },
    practice: {
      en: 'Before you pray for another person’s walk with God, pray it once over your own.',
      fr: "Avant de prier pour la marche d'un autre avec Dieu, prie-la une fois sur la tienne.",
    },
    resourceTopics: ['future-spouse', 'prayer'],
    emphasis: ['spouse'],
  },
  {
    movement: 'intercede',
    theme: { en: 'Their character', fr: 'Leur caractère', es: 'Su carácter', pt: 'O caráter dessa pessoa', de: 'Der Charakter dieses Menschen', ru: 'Их характер', zh: '那人的品格', ja: 'その人の人格', ko: '그 사람의 인격', ar: 'شخصية ذلك الشخص', fa: 'شخصیت او', hi: 'उनका चरित्र', id: 'Karakter mereka', sw: 'Tabia yao', tl: 'Ang karakter nila', am: 'የዚያ ሰው ባሕርይ' },
    ref: 'Micah 6:8',
    related: ['Galatians 5:22-23', 'Philippians 2:3-5'],
    reflection: {
      en: 'Micah reduces a whole life to three things: do justice, love mercy, walk humbly with your God. Ask that for a person you may one day marry — and notice how quickly praying it turns into praying it for yourself. That mirror is not a trick; it is the point.',
      fr: "Michée ramène toute une vie à trois choses : pratiquer la justice, aimer la miséricorde, marcher humblement avec son Dieu. Demande-les pour une personne que tu épouseras peut-être un jour — et remarque à quelle vitesse cette prière devient une prière pour toi-même. Ce miroir n'est pas une ruse ; c'est le but.",
    },
    prompts: [
      { en: 'Make them just, merciful and humble before You.', fr: 'Rends-les justes, miséricordieux et humbles devant Toi.' },
      { en: 'Guard them from pride and from pretending.', fr: "Garde-les de l'orgueil et du faux-semblant." },
      { en: 'Grow in them the humility that counts others more significant.', fr: "Fais croître en eux l'humilité qui estime les autres supérieurs à soi." },
    ],
    selfPrompt: {
      en: 'Would the person you are praying for recognise those same three things in you?',
      fr: 'La personne pour qui tu pries reconnaîtrait-elle ces trois mêmes choses en toi ?',
    },
    resourceTopics: ['future-spouse', 'character'],
    emphasis: ['spouse', 'character'],
  },
  {
    movement: 'intercede',
    theme: { en: 'Their healing and formation', fr: 'Leur guérison et leur formation', es: 'Su sanidad y formación', pt: 'A cura e a formação dessa pessoa', de: 'Heilung und Prägung dieses Menschen', ru: 'Их исцеление и становление', zh: '那人的医治与塑造', ja: 'その人の癒やしと成長', ko: '그 사람의 치유와 성장', ar: 'شفاء ذلك الشخص وتكوينه', fa: 'شفا و شکل‌گیری او', hi: 'उनकी चंगाई और गढ़न', id: 'Pemulihan dan pembentukan mereka', sw: 'Uponyaji na ukuaji wao', tl: 'Ang paggaling at paghubog sa kanila', am: 'የዚያ ሰው ፈውስና ምስረታ' },
    ref: 'Philippians 1:6',
    related: ['Psalm 138:8'],
    reflection: {
      en: 'He who began a good work will bring it to completion. You know nothing about this person’s story, so pray for God’s work in it without inventing a wound, a past or a struggle for them. Trusting God with someone you cannot picture is good practice for trusting Him with someone you can.',
      fr: "Celui qui a commencé une bonne œuvre la mènera à son terme. Tu ne sais rien de l'histoire de cette personne : prie donc pour l'œuvre de Dieu en elle sans lui inventer une blessure, un passé ou un combat. Confier à Dieu quelqu'un que tu ne peux pas te représenter est un bon exercice avant de Lui confier quelqu'un que tu vois.",
    },
    prompts: [
      { en: 'Finish the good work You have begun in them.', fr: 'Achève la bonne œuvre que Tu as commencée en eux.' },
      { en: 'Meet them today wherever they are, in whatever You already know.', fr: "Rejoins-les aujourd'hui là où ils sont, dans tout ce que Tu sais déjà." },
      { en: 'Give them people who point them back to You.', fr: 'Donne-leur des personnes qui les ramènent à Toi.' },
    ],
    selfPrompt: {
      en: 'Ask God to finish His good work in you, at His pace rather than yours.',
      fr: "Demande à Dieu d'achever Sa bonne œuvre en toi, à Son rythme et non au tien.",
    },
    resourceTopics: ['future-spouse', 'healing'],
    emphasis: ['spouse', 'healing'],
  },
  {
    movement: 'intercede',
    theme: { en: 'Their calling and service', fr: 'Leur appel et leur service', es: 'Su llamado y servicio', pt: 'O chamado e o serviço dessa pessoa', de: 'Berufung und Dienst dieses Menschen', ru: 'Их призвание и служение', zh: '那人的呼召与服事', ja: 'その人の召しと奉仕', ko: '그 사람의 부르심과 섬김', ar: 'دعوة ذلك الشخص وخدمته', fa: 'دعوت و خدمت او', hi: 'उनका बुलावा और सेवा', id: 'Panggilan dan pelayanan mereka', sw: 'Wito na huduma yao', tl: 'Ang tawag at paglilingkod nila', am: 'የዚያ ሰው ጥሪና አገልግሎት' },
    ref: 'Ephesians 2:10',
    related: ['1 Peter 4:10'],
    reflection: {
      en: 'We are His workmanship, created for good works He prepared beforehand. Marriage is not the calling of a Christian life; faithfulness is. Pray that both of you use well whatever God has entrusted — work, gifts, money, time — whether or not your paths ever meet.',
      fr: "Nous sommes Son ouvrage, créés pour de bonnes œuvres qu'Il a préparées d'avance. Le mariage n'est pas l'appel d'une vie chrétienne ; la fidélité l'est. Prie pour que vous fassiez bon usage, l'un comme l'autre, de ce que Dieu a confié — travail, dons, argent, temps — que vos chemins se croisent un jour ou non.",
    },
    prompts: [
      { en: 'Let them walk in the good works You prepared for them.', fr: 'Fais-les marcher dans les bonnes œuvres que Tu as préparées pour eux.' },
      { en: 'Make them a faithful steward of whatever You have entrusted to them.', fr: 'Fais-en de fidèles intendants de tout ce que Tu leur as confié.' },
      { en: 'Keep them from measuring their life by whether they marry.', fr: 'Garde-les de mesurer leur vie à leur mariage ou à son absence.' },
    ],
    selfPrompt: {
      en: 'What has God entrusted to you right now that you are not yet using well?',
      fr: "Que t'a confié Dieu en ce moment dont tu ne fais pas encore bon usage ?",
    },
    resourceTopics: ['future-spouse', 'spiritual-formation', 'finances'],
    emphasis: ['spouse'],
  },
  {
    movement: 'intercede',
    theme: { en: 'Communication', fr: 'La communication', es: 'La comunicación', pt: 'A comunicação', de: 'Kommunikation', ru: 'Общение', zh: '沟通', ja: '対話', ko: '소통', ar: 'التواصل', fa: 'گفت‌وگو', hi: 'संवाद', id: 'Komunikasi', sw: 'Mawasiliano', tl: 'Komunikasyon', am: 'መግባባት' },
    ref: 'James 1:19',
    related: ['Proverbs 15:1', 'Ephesians 4:29'],
    reflection: {
      en: 'Quick to hear, slow to speak, slow to anger. Nobody becomes a good listener on their wedding day; they arrive as whatever they have practised. Pray this for a person you may one day marry — and then practise it in the conversations you will actually have today.',
      fr: "Prompt à écouter, lent à parler, lent à se mettre en colère. Personne ne devient bon auditeur le jour de son mariage ; on y arrive tel qu'on s'est exercé. Prie cela pour une personne que tu épouseras peut-être un jour — puis exerce-le dans les conversations que tu auras vraiment aujourd'hui.",
    },
    prompts: [
      { en: 'Make them quick to listen and slow to anger.', fr: 'Rends-les prompts à écouter et lents à la colère.' },
      { en: 'Give them words that build up rather than tear down.', fr: 'Donne-leur des paroles qui édifient au lieu de démolir.' },
      { en: 'Teach them to answer gently when they are provoked.', fr: "Apprends-leur à répondre avec douceur quand on les provoque." },
    ],
    selfPrompt: {
      en: 'Pray the same three for yourself — and mean the first one.',
      fr: 'Prie ces trois mêmes choses pour toi — et pense vraiment la première.',
    },
    practice: {
      en: 'Notice today whether you are listening to understand or listening to reply.',
      fr: "Observe aujourd'hui si tu écoutes pour comprendre ou pour répondre.",
    },
    roles: {
      husband: {
        ref: '1 Peter 3:7',
        en: 'Peter tells husbands to live with their wives in an understanding way and to show them honour as co-heirs of the grace of life. Understanding is learned by paying attention. Ask God to make you a man who listens closely and honours people out loud — starting now, with the people already around you.',
        fr: "Pierre demande aux maris de vivre avec leur femme avec intelligence et de leur rendre honneur comme cohéritières de la grâce de la vie. L'intelligence s'apprend en prêtant attention. Demande à Dieu de faire de toi un homme qui écoute vraiment et qui honore à voix haute — dès maintenant, avec ceux qui t'entourent déjà.",
      },
      wife: {
        ref: 'Ephesians 4:15',
        en: 'Speaking the truth in love is not a compromise between honesty and kindness; it is both at once. Ask God for the courage to say what is true rather than storing up resentment, and for the gentleness to say it well.',
        fr: "Dire la vérité dans l'amour n'est pas un compromis entre l'honnêteté et la bonté ; c'est les deux à la fois. Demande à Dieu le courage de dire ce qui est vrai plutôt que d'accumuler du ressentiment, et la douceur de bien le dire.",
      },
    },
    resourceTopics: ['communication', 'marriage'],
    emphasis: ['character'],
  },
  {
    movement: 'intercede',
    theme: { en: 'Conflict and forgiveness', fr: 'Conflit et pardon', es: 'Conflicto y perdón', pt: 'Conflito e perdão', de: 'Konflikt und Vergebung', ru: 'Конфликт и прощение', zh: '冲突与饶恕', ja: '対立と赦し', ko: '갈등과 용서', ar: 'الخلاف والغفران', fa: 'اختلاف و بخشش', hi: 'टकराव और क्षमा', id: 'Konflik dan pengampunan', sw: 'Migogoro na msamaha', tl: 'Alitan at pagpapatawad', am: 'ግጭትና ይቅርታ' },
    ref: 'Colossians 3:12-14',
    related: ['Ephesians 4:25-32', 'Matthew 6:14-15'],
    reflection: {
      en: 'Every marriage is between two people who will hurt each other. Paul does not tell the church to avoid conflict; he tells it to put on compassion, kindness, humility and patience, and to forgive as the Lord forgave. All of that is learnable now, on the people already in your life.',
      fr: "Tout mariage unit deux personnes qui se blesseront. Paul ne dit pas à l'Église d'éviter le conflit ; il lui dit de se revêtir de compassion, de bonté, d'humilité et de patience, et de pardonner comme le Seigneur a pardonné. Tout cela s'apprend maintenant, avec les personnes déjà présentes dans ta vie.",
    },
    prompts: [
      { en: 'Teach them to forgive as they have been forgiven.', fr: "Apprends-leur à pardonner comme ils ont été pardonnés." },
      { en: 'Keep them from bitterness and from keeping score.', fr: "Garde-les de l'amertume et des comptes tenus." },
      { en: 'Give them the humility to be the first to say sorry.', fr: "Donne-leur l'humilité de demander pardon les premiers." },
    ],
    selfPrompt: {
      en: 'Who are you keeping score against right now? Say the name to God.',
      fr: 'À qui tiens-tu des comptes en ce moment ? Dis le nom à Dieu.',
    },
    roles: {
      husband: {
        ref: 'Philippians 2:3-8',
        en: 'Christ did not grasp at His rights; He emptied Himself. For a husband, repentance is not weakness — refusing to repent is. Ask God to make you quick to own what is yours, without excuses and without a speech.',
        fr: "Christ n'a pas retenu Ses droits ; Il s'est dépouillé. Pour un mari, la repentance n'est pas une faiblesse — le refus de se repentir en est une. Demande à Dieu d'être prompt à reconnaître ta part, sans excuses et sans discours.",
      },
      wife: {
        ref: 'Philippians 2:3-8',
        en: 'Counting others more significant is not self-erasure — Christ did it without ceasing to be Himself. Ask God for the humility that serves and the honesty that still says what is true.',
        fr: "Estimer les autres supérieurs à soi n'est pas s'effacer — Christ l'a fait sans cesser d'être Lui-même. Demande à Dieu l'humilité qui sert et l'honnêteté qui dit quand même ce qui est vrai.",
      },
    },
    resourceTopics: ['conflict', 'forgiveness'],
    emphasis: ['character', 'healing'],
  },
  {
    movement: 'intercede',
    theme: { en: 'Covenant and sacrificial love', fr: 'Alliance et amour sacrificiel', es: 'Pacto y amor sacrificial', pt: 'Aliança e amor sacrificial', de: 'Bund und hingebende Liebe', ru: 'Завет и жертвенная любовь', zh: '盟约与舍己的爱', ja: '契約と犠牲の愛', ko: '언약과 희생의 사랑', ar: 'العهد والمحبة الباذلة', fa: 'عهد و محبت فداکارانه', hi: 'वाचा और बलिदानी प्रेम', id: 'Perjanjian dan kasih yang berkorban', sw: 'Agano na upendo wa kujitoa', tl: 'Tipan at sakripisyong pag-ibig', am: 'ቃል ኪዳንና መስዋዕታዊ ፍቅር' },
    ref: 'Ephesians 5:1-2',
    related: ['1 Corinthians 13:4-7'],
    reflection: {
      en: 'Paul’s picture of Christian love is Christ giving Himself up for us — a covenant kept, not a feeling sustained. Marriage in Scripture is measured against that, which makes it far more serious, and far kinder, than the version the culture sells.',
      fr: "L'image que Paul donne de l'amour chrétien, c'est Christ se livrant Lui-même pour nous — une alliance tenue, non un sentiment entretenu. Dans l'Écriture, le mariage se mesure à cela : bien plus sérieux, et bien plus bienveillant, que la version que vend la culture.",
    },
    prompts: [
      { en: 'Teach them a love that gives itself away.', fr: "Apprends-leur un amour qui se donne." },
      { en: 'Make them faithful in what they promise, in small things now.', fr: 'Rends-les fidèles à leurs promesses, dès les petites choses.' },
      { en: 'Guard them from a love that is mostly about being fulfilled.', fr: "Garde-les d'un amour qui cherche surtout son propre épanouissement." },
    ],
    selfPrompt: {
      en: 'Where have you already broken a small promise this week?',
      fr: 'Où as-tu déjà manqué à une petite promesse cette semaine ?',
    },
    roles: {
      husband: {
        ref: 'Ephesians 5:25-33',
        en: 'Husbands are told to love as Christ loved the church and gave Himself up for her — the standard is a cross, not a throne. Ask God to make sacrificial love your instinct, and to keep you from ever confusing love with control.',
        fr: "Il est demandé aux maris d'aimer comme Christ a aimé l'Église et s'est livré pour elle — la mesure est une croix, non un trône. Demande à Dieu que l'amour sacrificiel devienne ton réflexe, et qu'Il te garde de jamais confondre l'amour avec le contrôle.",
      },
      wife: {
        en: 'Christian love is self-giving for both people in a marriage, never only for one. Ask God to grow in you a love that gives freely and truthfully — never a love that erases you, and never one that sets out to remake someone else.',
        fr: "L'amour chrétien est un don de soi pour les deux personnes d'un mariage, jamais pour une seule. Demande à Dieu de faire croître en toi un amour qui se donne librement et dans la vérité — jamais un amour qui t'efface, jamais un amour qui entreprend de refaire l'autre.",
      },
    },
    resourceTopics: ['covenant', 'marriage'],
    emphasis: ['spouse', 'character'],
  },
  {
    movement: 'surrender',
    theme: { en: 'A future home centred on God', fr: 'Un foyer futur centré sur Dieu', es: 'Un hogar futuro centrado en Dios', pt: 'Um lar futuro centrado em Deus', de: 'Ein künftiges Zuhause mit Gott im Zentrum', ru: 'Будущий дом, где в центре Бог', zh: '以神为中心的未来的家', ja: '神様を中心とした将来の家', ko: '하나님이 중심인 미래의 가정', ar: 'بيت مستقبلي محوره الله', fa: 'خانه‌ای در آینده با محوریت خدا', hi: 'परमेश्वर पर केंद्रित भावी घर', id: 'Rumah masa depan yang berpusat pada Allah', sw: 'Nyumba ya baadaye inayomweka Mungu katikati', tl: 'Isang tahanang nakasentro sa Diyos', am: 'እግዚአብሔር ማዕከል የሆነበት የወደፊት ቤት' },
    ref: 'Joshua 24:15',
    related: ['Deuteronomy 6:4-9'],
    reflection: {
      en: 'As for me and my house, we will serve the LORD. A home is not a building and not a family size — it is whoever is under your roof and how God is honoured there. Hospitality, prayer, generosity and peace can all be practised in the home you already have.',
      fr: "Moi et ma maison, nous servirons l'Éternel. Un foyer n'est ni un bâtiment ni une taille de famille — c'est qui vit sous ton toit et comment Dieu y est honoré. L'hospitalité, la prière, la générosité et la paix se pratiquent déjà dans le logement que tu as.",
    },
    prompts: [
      { en: 'Ask God that any home you are given would serve Him.', fr: "Demande à Dieu que tout foyer qui te sera donné Le serve." },
      { en: 'Ask for generosity with money and open doors with people.', fr: "Demande la générosité avec l'argent et des portes ouvertes aux gens." },
      { en: 'Ask that His Word would be ordinary conversation there, not an event.', fr: "Demande que Sa Parole y soit une conversation ordinaire, non un événement." },
    ],
    selfPrompt: {
      en: 'What would have to change in how you live now for that to be true later?',
      fr: 'Que faudrait-il changer dans ta vie actuelle pour que cela soit vrai plus tard ?',
    },
    practice: {
      en: 'Do one thing today that makes the place you live more hospitable to someone else.',
      fr: "Fais aujourd'hui une chose qui rend ton logement plus accueillant pour quelqu'un d'autre.",
    },
    resourceTopics: ['family', 'family-discipleship', 'finances'],
    emphasis: ['character'],
  },
  {
    movement: 'surrender',
    theme: { en: 'Family and children, with open hands', fr: 'Famille et enfants, à mains ouvertes', es: 'Familia e hijos, con las manos abiertas', pt: 'Família e filhos, de mãos abertas', de: 'Familie und Kinder — mit offenen Händen', ru: 'Семья и дети — с открытыми руками', zh: '家庭与儿女，张开手掌', ja: '家族と子ども、手を開いて', ko: '가정과 자녀, 손을 펴고', ar: 'العائلة والأولاد بأيدٍ مفتوحة', fa: 'خانواده و فرزندان، با دستان باز', hi: 'परिवार और संतान, खुले हाथों से', id: 'Keluarga dan anak, dengan tangan terbuka', sw: 'Familia na watoto, kwa mikono wazi', tl: 'Pamilya at mga anak, nang bukas ang palad', am: 'ቤተሰብና ልጆች፣ በተከፈተ እጅ' },
    ref: 'Psalm 127',
    related: ['Deuteronomy 6:6-7'],
    reflection: {
      en: 'Unless the LORD builds the house, the builders labour in vain — and children, where they come, are called a gift rather than an achievement. Not every marriage has children, not everyone who longs for them can have them, and no marriage is incomplete without them. Pray here with open hands, and gently.',
      fr: "Si l'Éternel ne bâtit la maison, ceux qui la bâtissent travaillent en vain — et les enfants, là où ils viennent, sont appelés un don et non une réussite. Tous les mariages n'ont pas d'enfants, tous ceux qui en désirent ne peuvent pas en avoir, et aucun mariage n'est incomplet sans eux. Prie ici à mains ouvertes, et avec douceur.",
    },
    prompts: [
      { en: 'Ask God to build whatever house He gives you.', fr: "Demande à Dieu de bâtir Lui-même la maison qu'Il te donnera." },
      { en: 'If children are part of your future, ask for wisdom and faithfulness.', fr: 'Si des enfants font partie de ton avenir, demande sagesse et fidélité.' },
      { en: 'Ask for grace to receive what He gives, and to grieve honestly what He does not.', fr: "Demande la grâce de recevoir ce qu'Il donne, et de pleurer honnêtement ce qu'Il ne donne pas." },
    ],
    selfPrompt: {
      en: 'Which part of your future are you holding tightest? Say it to God.',
      fr: 'Quelle part de ton avenir serres-tu le plus fort ? Dis-la à Dieu.',
    },
    resourceTopics: ['parenting', 'family'],
    emphasis: ['spouse'],
  },
  {
    movement: 'surrender',
    theme: { en: 'Serving God together', fr: 'Servir Dieu ensemble', es: 'Servir a Dios juntos', pt: 'Servir a Deus juntos', de: 'Gott gemeinsam dienen', ru: 'Служить Богу вместе', zh: '一同服事神', ja: '共に神様に仕える', ko: '함께 하나님을 섬기라', ar: 'خدمة الله معًا', fa: 'با هم خدا را خدمت کردن', hi: 'मिलकर परमेश्वर की सेवा', id: 'Melayani Allah bersama', sw: 'Kumtumikia Mungu pamoja', tl: 'Sama-samang paglilingkod sa Diyos', am: 'እግዚአብሔርን በአንድነት ማገልገል' },
    ref: '1 Peter 4:10',
    related: ['Matthew 5:14-16'],
    reflection: {
      en: 'Marriage in Scripture is never an escape from the world into two people; it is two people made more useful to God together. Pray for a shared usefulness — hospitality, mission, care for the church — and start practising it single.',
      fr: "Dans l'Écriture, le mariage n'est jamais une fuite du monde à deux ; ce sont deux personnes rendues plus utiles à Dieu ensemble. Prie pour une utilité partagée — hospitalité, mission, soin de l'Église — et commence à l'exercer célibataire.",
    },
    prompts: [
      { en: 'Ask God to make you useful to others, married or not.', fr: 'Demande à Dieu de te rendre utile aux autres, marié ou non.' },
      { en: 'Ask that any future marriage would serve people beyond itself.', fr: "Demande qu'un éventuel mariage serve des gens au-delà de lui-même." },
      { en: 'Ask Him to keep your light where others can see it.', fr: "Demande-Lui que ta lumière reste là où les autres peuvent la voir." },
    ],
    selfPrompt: {
      en: 'Who is God putting in front of you right now to serve?',
      fr: 'Qui Dieu place-t-il devant toi en ce moment pour que tu le serves ?',
    },
    resourceTopics: ['marriage', 'community'],
    emphasis: ['contentment'],
  },
  {
    movement: 'surrender',
    theme: { en: 'Open hands', fr: 'Les mains ouvertes', es: 'Manos abiertas', pt: 'Mãos abertas', de: 'Offene Hände', ru: 'Открытые руки', zh: '张开的手', ja: '開いた手', ko: '펴진 두 손', ar: 'أيدٍ مفتوحة', fa: 'دستان باز', hi: 'खुले हाथ', id: 'Tangan terbuka', sw: 'Mikono wazi', tl: 'Bukas na mga palad', am: 'የተከፈቱ እጆች' },
    ref: 'Matthew 6:33-34',
    related: ['Proverbs 3:5-6', 'Psalm 73:25-26'],
    reflection: {
      en: 'The plan ends where it began: with God. Seek first His kingdom; today has enough of its own. Whatever comes next — a marriage, or a single life lived fully for Him — the prayer is the same one.',
      fr: "Le parcours s'achève là où il a commencé : auprès de Dieu. Cherche premièrement Son royaume ; à chaque jour suffit sa peine. Quoi qu'il vienne ensuite — un mariage, ou une vie célibataire pleinement vécue pour Lui — la prière reste la même.",
    },
    prompts: [
      { en: 'Seek first His kingdom — out loud, as a decision for tomorrow.', fr: "Cherche premièrement Son royaume — à voix haute, comme une décision pour demain." },
      { en: 'Entrust marriage to Him — and entrust singleness to Him too.', fr: 'Remets-Lui le mariage — et remets-Lui aussi le célibat.' },
      { en: 'Thank Him that He is still enough, exactly as on day one.', fr: "Remercie-Le : Il suffit toujours, exactement comme au premier jour." },
    ],
    selfPrompt: {
      en: 'Say it plainly: help me seek You first, and trust You with whatever You write into my future.',
      fr: "Dis-le simplement : aide-moi à Te chercher en premier et à Te confier tout ce que Tu écriras dans mon avenir.",
    },
    practice: {
      en: 'Write down one sentence you want to keep praying after today, and add it to your prayers.',
      fr: "Écris une phrase que tu veux continuer à prier après aujourd'hui, et ajoute-la à tes prières.",
    },
    resourceTopics: ['prayer', 'singleness', 'contentment'],
    emphasis: ['closeness', 'contentment'],
  },
];

export default DAYS;
