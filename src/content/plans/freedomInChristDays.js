// The 30 days of "Freedom & Deliverance in Christ".
// See ./freedomInChrist.js for the plan meta, the five movements, and the
// theological guardrail this content is held to.
//
// DAY SHAPE — `theme` and `ref` are required, everything else is optional:
//   theme           short day title, authored in ALL 16 languages
//   ref             the PRIMARY passage; language-neutral, localized at render
//   related         supporting passages, kept visually secondary
//   movement        which of the five movements this day belongs to
//   reflection      2-4 sentences of Praystead commentary — never Scripture text
//   prompts         short prayer points (the "Give me prayer points" path)
//   practice        one small, optional, concrete response for today
//   safetyNote      contextual safeguarding copy (health, abuse, dreams)
//   resourceTopics  taxonomy ids used to look up approved external resources
//   freedom         everything specific to this plan (see below)
//
// `freedom` — the deliverance-specific layer:
//   understand      "What this can mean": the category defined plainly, for a
//                   reader who has never met the terminology
//   examples        ILLUSTRATIVE, never diagnostic. The UI introduces them with
//                   "Examples can include", and no example is ever presented as
//                   proof that something applies to the reader
//   inventory       true → the day asks what the reader actually KNOWS
//                   (see freedom/certainty.js), which is the only input that
//                   changes which reviewed prayer modules are assembled
//   modules         extra reviewed modules this day adds to the guided walk
//   stepText        this day's own wording for the handful of steps a day may
//                   reword (see OVERRIDABLE_STEPS in src/lib/freedomSession.js)
//   standRefs       the passages "Pray the Word" points the reader at
//   fasting         offer the optional fast-and-pray note on this day
//
// HARD RULES this file is written under (enforced in freedomInChrist.test.js):
//   • No Bible text is ever authored, translated or generated here. Days carry
//     references; the app resolves the text through its existing authoritative
//     pipeline.
//   • No sentence may assert that a demon is present, that a curse exists, that
//     an ancestor made a covenant, that a dream proves anything, that a hardship
//     proves a curse, or that the Holy Spirit has revealed something through
//     this app.
//   • African and traditional culture is never equated with idolatry. The
//     criterion named everywhere is explicit worship, invocation, dependence or
//     spiritual allegiance contrary to Christ — never ethnicity, language,
//     heritage, an object's age, or the fact that a practice is traditional.
//
// Prose is authored in en + fr. Other languages fall back through pick() until a
// competent speaker has reviewed a translation — these are exactly the terms a
// machine translation gets dangerously wrong (see docs/FREEDOM_DELIVERANCE.md).
export const DAYS = [
  // ── Movement 1 · Established in Christ ────────────────────────────────────
  {
    movement: 'established',
    theme: { en: 'The victory of Jesus Christ', fr: 'La victoire de Jésus-Christ', es: 'La victoria de Jesucristo', pt: 'A vitória de Jesus Cristo', de: 'Der Sieg Jesu Christi', ru: 'Победа Иисуса Христа', zh: '耶穌基督的得勝', ja: 'イエス・キリストの勝利', ko: '예수 그리스도의 승리', ar: 'انتصار يسوع المسيح', fa: 'پیروزی عیسی مسیح', hi: 'यीशु मसीह की विजय', id: 'Kemenangan Yesus Kristus', sw: 'Ushindi wa Yesu Kristo', tl: 'Ang tagumpay ni Jesu-Cristo', am: 'የኢየሱስ ክርስቶስ ድል' },
    ref: 'Colossians 2:13-15',
    related: ['Colossians 1:13-14', 'Hebrews 2:14-15'],
    reflection: {
      en: 'This journey begins with Christ, not with what you are afraid of. Paul says the record of debt standing against us was nailed to the cross, and that there Jesus disarmed the rulers and authorities and made a public spectacle of them. Freedom is not something you must go and win; it is something He has already accomplished and now applies to those who are His.',
      fr: "Ce parcours commence par Christ, non par ce qui te fait peur. Paul dit que l'acte qui nous accusait a été cloué à la croix, et que Jésus y a dépouillé les dominations et les autorités en les livrant publiquement en spectacle. La liberté n'est pas une chose que tu dois aller conquérir : c'est une chose qu'Il a déjà accomplie et qu'Il applique maintenant à ceux qui sont à Lui.",
    },
    prompts: [
      { en: 'Thank Jesus for the cross, before you ask Him for anything.', fr: 'Remercie Jésus pour la croix, avant de Lui demander quoi que ce soit.' },
      { en: 'Confess out loud that Jesus Christ is Lord, and that you are His.', fr: 'Confesse à voix haute que Jésus-Christ est Seigneur, et que tu es à Lui.' },
      { en: 'Ask Him for truth rather than for experiences, and refuse fear as your motive for praying.', fr: "Demande-Lui la vérité plutôt que des expériences, et refuse que la peur soit ton motif de prière." },
    ],
    practice: {
      en: 'Read Colossians 2 slowly, all the way through, before you pray anything else today.',
      fr: 'Lis lentement Colossiens 2 en entier, avant de prier quoi que ce soit d’autre aujourd’hui.',
    },
    resourceTopics: ['victory', 'cross', 'identity', 'scripture-prayer'],
    freedom: {
      understand: {
        en: 'These thirty days are not a search for hidden enemies. They are a deliberate walk through Scripture: submitting to Christ, inviting the Holy Spirit to search you, repenting where God’s Word calls for repentance, renouncing what is genuinely contrary to Christ, and learning to stand on what God has said. You should finish more conscious of Christ’s lordship than of anything opposing it.',
        fr: "Ces trente jours ne sont pas une chasse aux ennemis cachés. Ils sont une marche délibérée dans l'Écriture : se soumettre à Christ, inviter le Saint-Esprit à te sonder, se repentir là où la Parole de Dieu appelle à la repentance, renoncer à ce qui est réellement contraire à Christ, et apprendre à s'appuyer sur ce que Dieu a dit. Tu devrais en sortir plus conscient de la seigneurie de Christ que de quoi que ce soit qui s'y oppose.",
      },
      modules: ['thanksCross'],
      standRefs: ['Colossians 2:13-15', 'Hebrews 2:14-15'],
    },
  },
  {
    movement: 'established',
    theme: { en: 'Delivered from darkness', fr: 'Délivré des ténèbres', es: 'Librados de las tinieblas', pt: 'Libertos das trevas', de: 'Aus der Finsternis befreit', ru: 'Избавлен от тьмы', zh: '從黑暗中被拯救', ja: '闇から救い出された', ko: '어둠에서 건짐받다', ar: 'مُنقَذ من الظلمة', fa: 'رهایی از تاریکی', hi: 'अंधकार से छुड़ाया गया', id: 'Dilepaskan dari kegelapan', sw: 'Umeokolewa kutoka gizani', tl: 'Iniligtas mula sa kadiliman', am: 'ከጨለማ የተላቀቅህ' },
    ref: 'Colossians 1:13-14',
    related: ['2 Corinthians 5:17', 'Romans 8:1-2'],
    reflection: {
      en: 'Freedom begins with belonging, not with discovering everything that may have happened in your past. Paul writes in the past tense: God has delivered us from the domain of darkness and transferred us into the kingdom of His beloved Son. Your identity was settled by that transfer, and no part of your history gets a vote on whose you are.',
      fr: "La liberté commence par l'appartenance, et non par la découverte de tout ce qui a pu se passer dans ton passé. Paul écrit au passé : Dieu nous a délivrés de la puissance des ténèbres et nous a transportés dans le royaume de Son Fils bien-aimé. Ton identité a été réglée par ce transfert, et aucune partie de ton histoire n'a voix au chapitre sur ce à qui tu appartiens.",
    },
    prompts: [
      { en: 'Tell God plainly: my identity and my allegiance belong to Jesus Christ.', fr: "Dis simplement à Dieu : mon identité et mon allégeance appartiennent à Jésus-Christ." },
      { en: 'Thank Him that this transfer is already done, and did not depend on you.', fr: "Remercie-Le : ce transfert est déjà accompli, et il n'a pas dépendu de toi." },
      { en: 'Name one place you have been living as though you still belonged to the old kingdom.', fr: "Nomme un endroit où tu vis encore comme si tu appartenais à l'ancien royaume." },
    ],
    resourceTopics: ['identity', 'victory', 'discipleship'],
    freedom: {
      understand: {
        en: 'You do not need to identify every possible event in your history before you can be secure in Christ. Some of what these thirty days touch will be known to you, some will not, and some will never be knowable. What God asks is honesty about what you do know and trust about what you do not.',
        fr: "Tu n'as pas besoin d'identifier chaque événement possible de ton histoire avant d'être en sécurité en Christ. Une partie de ce que ces trente jours abordent te sera connue, une autre non, et une autre ne le sera jamais. Ce que Dieu demande, c'est l'honnêteté sur ce que tu sais et la confiance pour ce que tu ignores.",
      },
      standRefs: ['Colossians 1:13-14', 'Romans 8:1-2'],
    },
  },
  {
    movement: 'established',
    theme: { en: 'The Holy Spirit leads into truth', fr: "L'Esprit conduit dans la vérité", es: 'El Espíritu guía a la verdad', pt: 'O Espírito guia à verdade', de: 'Der Geist führt in die Wahrheit', ru: 'Дух наставляет на истину', zh: '聖靈引導進入真理', ja: '御霊は真理に導く', ko: '성령이 진리로 인도하신다', ar: 'الروح يرشد إلى الحق', fa: 'روح‌القدس به راستی هدایت می‌کند', hi: 'पवित्र आत्मा सत्य में ले चलता है', id: 'Roh Kudus memimpin ke dalam kebenaran', sw: 'Roho Mtakatifu huongoza katika kweli', tl: 'Ang Espiritu ang umaakay sa katotohanan', am: 'መንፈስ ቅዱስ ወደ እውነት ይመራል' },
    ref: 'John 16:13',
    related: ['John 14:26', 'Romans 8:14', 'Psalm 139:23-24'],
    reflection: {
      en: 'The Holy Spirit leads the believer personally — this app does not, and neither does any other person. He guides into truth, brings things to remembrance, and convicts; He does not manufacture impressions on demand or reward anxious searching. Test everything you sense against Scripture, take your time, and do not be afraid of silence. Silence is not God withholding; it is often God saying there is nothing here to find.',
      fr: "Le Saint-Esprit conduit personnellement le croyant — cette application ne le fait pas, et personne d'autre non plus. Il conduit dans la vérité, rappelle les choses au souvenir et convainc ; Il ne fabrique pas des impressions sur commande et ne récompense pas la recherche anxieuse. Éprouve par l'Écriture tout ce que tu ressens, prends ton temps, et n'aie pas peur du silence. Le silence n'est pas Dieu qui retient : c'est souvent Dieu qui dit qu'il n'y a rien à trouver ici.",
    },
    prompts: [
      { en: 'Ask the Holy Spirit to search you, and then actually wait — without forcing anything.', fr: "Demande au Saint-Esprit de te sonder, puis attends réellement — sans rien forcer." },
      { en: 'Ask Him to keep you from fear, imagination and speculation.', fr: "Demande-Lui de te garder de la peur, de l'imagination et des spéculations." },
      { en: 'Ask for a growing love of Scripture, since that is how He confirms what is true.', fr: "Demande un amour croissant pour l'Écriture, car c'est par elle qu'Il confirme ce qui est vrai." },
    ],
    practice: {
      en: 'Sit quietly for two minutes after praying. If nothing comes to mind, that is a complete and acceptable answer.',
      fr: "Reste tranquille deux minutes après avoir prié. Si rien ne te vient, c'est une réponse entière et acceptable.",
    },
    resourceTopics: ['holy-spirit', 'discernment', 'prayer'],
    freedom: {
      understand: {
        en: 'From today onward, most prayer sessions in this plan begin by inviting the Holy Spirit and then giving you quiet space. You may write or record a private prayer note about anything that comes to mind, or answer that nothing specific did. Praystead records what you choose to say. It never interprets it, never tells you what it means, and never claims that God has revealed anything through this app.',
        fr: "À partir d'aujourd'hui, la plupart des temps de prière de ce parcours commencent en invitant le Saint-Esprit, puis en te laissant un temps de silence. Tu peux écrire ou enregistrer une note de prière privée sur ce qui te vient, ou répondre que rien de précis n'est venu. Praystead enregistre ce que tu choisis de dire. Il ne l'interprète jamais, ne te dit jamais ce que cela signifie, et ne prétend jamais que Dieu a révélé quoi que ce soit par cette application.",
      },
      standRefs: ['John 16:13', 'Psalm 139:23-24'],
    },
  },
  {
    movement: 'established',
    theme: { en: 'Confession, cleansing and grace', fr: 'Confession, purification et grâce', es: 'Confesión, limpieza y gracia', pt: 'Confissão, purificação e graça', de: 'Bekenntnis, Reinigung und Gnade', ru: 'Исповедание, очищение и благодать', zh: '認罪、潔淨與恩典', ja: '告白、きよめ、恵み', ko: '고백과 정결함과 은혜', ar: 'الاعتراف والتطهير والنعمة', fa: 'اعتراف، پاکی و فیض', hi: 'अंगीकार, शुद्धि और अनुग्रह', id: 'Pengakuan, penyucian, dan anugerah', sw: 'Kuungama, kutakaswa na neema', tl: 'Pag-amin, paglilinis at biyaya', am: 'መናዘዝ፣ መንጻትና ጸጋ' },
    ref: '1 John 1:7-9',
    related: ['Psalm 51:1-12', 'Romans 8:1'],
    reflection: {
      en: 'Conviction and condemnation feel similar and do opposite things. Conviction is specific, it names something you can actually repent of, and it moves you toward God. Condemnation is vague, it accuses you of being beyond help, and it moves you away from Him. If He is faithful and just to forgive when we confess, then honesty is safe here.',
      fr: "La conviction et la condamnation se ressemblent et produisent des effets opposés. La conviction est précise, elle nomme quelque chose dont tu peux réellement te repentir, et elle te rapproche de Dieu. La condamnation est vague, elle t'accuse d'être irrécupérable, et elle t'éloigne de Lui. S'Il est fidèle et juste pour pardonner quand nous confessons, alors l'honnêteté est sans danger ici.",
    },
    prompts: [
      { en: 'Ask the Holy Spirit to show you known areas that need repentance — not to hunt for hidden ones.', fr: "Demande au Saint-Esprit de te montrer les domaines connus qui appellent la repentance — non de traquer ceux qui seraient cachés." },
      { en: 'Confess plainly what He shows you, without softening it and without exaggerating it.', fr: "Confesse simplement ce qu'Il te montre, sans l'adoucir et sans l'exagérer." },
      { en: 'Receive His forgiveness out loud, and ask for strength to live differently.', fr: 'Reçois Son pardon à voix haute, et demande la force de vivre autrement.' },
    ],
    resourceTopics: ['repentance', 'discipleship', 'holy-spirit'],
    freedom: {
      understand: {
        en: 'Personal sin matters here, and it is not evidence of demonic possession. Repentance in Scripture is one movement with four parts: acknowledging sin, turning toward God, receiving grace, and walking differently. Areas people often need to bring here include sexual sin, deception, hatred, bitterness, idolatry, occult participation, destructive habits, substance misuse, greed, pride and unforgiveness.',
        fr: "Le péché personnel compte ici, et il n'est pas la preuve d'une possession démoniaque. Dans l'Écriture, la repentance est un seul mouvement en quatre temps : reconnaître le péché, se tourner vers Dieu, recevoir la grâce, et marcher autrement. Parmi les domaines souvent à apporter ici : le péché sexuel, le mensonge, la haine, l'amertume, l'idolâtrie, la participation à l'occultisme, les habitudes destructrices, l'abus de substances, la cupidité, l'orgueil et le refus de pardonner.",
      },
      inventory: false,
      modules: ['practicalObedience'],
      standRefs: ['1 John 1:7-9', 'Romans 8:1'],
    },
  },
  {
    movement: 'established',
    theme: { en: 'Forgiveness', fr: 'Le pardon', es: 'El perdón', pt: 'O perdão', de: 'Vergebung', ru: 'Прощение', zh: '饒恕', ja: '赦し', ko: '용서', ar: 'المغفرة', fa: 'بخشش', hi: 'क्षमा', id: 'Pengampunan', sw: 'Msamaha', tl: 'Kapatawaran', am: 'ይቅርታ' },
    ref: 'Ephesians 4:31-32',
    related: ['Colossians 3:12-14', 'Romans 12:17-21'],
    reflection: {
      en: 'Forgiveness is handing God the right to repay — it is not calling evil good, not removing wise boundaries, not returning to an unsafe relationship, not preventing justice, and not refusing appropriate help. Paul tells the same church to forgive as God forgave them and to leave vengeance to God. Both belong together: you release the debt, and He keeps the right to judge.',
      fr: "Pardonner, c'est remettre à Dieu le droit de rétribuer — ce n'est pas appeler bien le mal, ni supprimer des limites sages, ni retourner dans une relation dangereuse, ni empêcher la justice, ni refuser une aide appropriée. Paul demande à la même Église de pardonner comme Dieu lui a pardonné, et de laisser la vengeance à Dieu. Les deux vont ensemble : tu remets la dette, et Il garde le droit de juger.",
    },
    prompts: [
      { en: 'Ask the Holy Spirit whether there is someone specific to forgive today.', fr: "Demande au Saint-Esprit s'il y a aujourd'hui quelqu'un de précis à pardonner." },
      { en: 'Say plainly what was done, rather than praying around it.', fr: 'Dis clairement ce qui a été fait, au lieu de prier autour.' },
      { en: 'Choose forgiveness before God, entrust justice to Him, and keep any boundary that keeps you safe.', fr: "Choisis de pardonner devant Dieu, remets-Lui la justice, et garde toute limite qui te protège." },
    ],
    safetyNote: {
      en: 'If someone is hurting you now, forgiveness never means staying, submitting more, or not seeking help. Speak to someone you trust, and to the people whose job it is to protect you. Prayer and appropriate protection are not enemies.',
      fr: "Si quelqu'un te fait du mal en ce moment, pardonner ne signifie jamais rester, te soumettre davantage, ou renoncer à chercher de l'aide. Parles-en à une personne de confiance, et à ceux dont c'est le rôle de te protéger. La prière et une protection appropriée ne sont pas ennemies.",
    },
    resourceTopics: ['forgiveness', 'healing', 'discipleship'],
    freedom: {
      modules: ['forgive'],
      standRefs: ['Ephesians 4:31-32', 'Romans 12:17-21'],
    },
  },

  // ── Movement 2 · Personal repentance & renunciation ───────────────────────
  {
    movement: 'repentance',
    theme: { en: 'Renouncing idolatry', fr: "Renoncer à l'idolâtrie", es: 'Renunciar a la idolatría', pt: 'Renunciar à idolatria', de: 'Dem Götzendienst absagen', ru: 'Отречение от идолопоклонства', zh: '棄絕拜偶像', ja: '偶像礼拝を退ける', ko: '우상숭배를 끊다', ar: 'التبرؤ من عبادة الأوثان', fa: 'ترک بت‌پرستی', hi: 'मूर्तिपूजा का त्याग', id: 'Meninggalkan penyembahan berhala', sw: 'Kukataa ibada ya sanamu', tl: 'Pagtalikod sa pagsamba sa diyus-diyosan', am: 'ጣዖት አምልኮን መተው' },
    ref: '1 Corinthians 10:14-22',
    related: ['Exodus 20:3-6', 'Acts 19:18-20'],
    reflection: {
      en: 'Paul’s concern is not that other gods are real rivals to the living God, but that worship directed elsewhere makes a real spiritual alliance — and you cannot drink the cup of the Lord and the cup of demons. The issue he names is explicit worship, sacrifice, invocation and dependence. That is the only criterion in view today.',
      fr: "La préoccupation de Paul n'est pas que d'autres dieux soient de véritables rivaux du Dieu vivant, mais qu'un culte adressé ailleurs crée une véritable alliance spirituelle — et l'on ne peut boire à la coupe du Seigneur et à celle des démons. Ce qu'il vise, c'est le culte explicite, le sacrifice, l'invocation et la dépendance. C'est le seul critère envisagé aujourd'hui.",
    },
    prompts: [
      { en: 'Ask the Holy Spirit to show you where worship, trust or dependence has genuinely gone elsewhere.', fr: "Demande au Saint-Esprit de te montrer où le culte, la confiance ou la dépendance sont réellement allés ailleurs." },
      { en: 'Confess personal participation where there was any, without confessing what is not yours.', fr: "Confesse ta participation personnelle s'il y en a eu, sans confesser ce qui n'est pas à toi." },
      { en: 'Ask God to make Him alone the one you depend on for protection, provision and future.', fr: "Demande à Dieu d'être le seul dont tu dépendes pour la protection, la provision et l'avenir." },
    ],
    resourceTopics: ['idolatry', 'renunciation', 'deliverance'],
    freedom: {
      understand: {
        en: 'This section concerns worship, sacrifice, invocation or spiritual dependence directed to a deity, spirit or spiritual power rather than to God. It is not about culture. A practice is not spiritually evil because it is traditional, African, ethnic or old, and cultural belonging is not idolatry. The criterion is explicit worship, invocation, dependence or allegiance contrary to Christ.',
        fr: "Cette section concerne le culte, le sacrifice, l'invocation ou la dépendance spirituelle adressés à une divinité, un esprit ou une puissance spirituelle plutôt qu'à Dieu. Il ne s'agit pas de culture. Une pratique n'est pas spirituellement mauvaise parce qu'elle est traditionnelle, africaine, ethnique ou ancienne, et l'appartenance culturelle n'est pas de l'idolâtrie. Le critère est le culte, l'invocation, la dépendance ou l'allégeance explicites contraires à Christ.",
      },
      examples: [
        { en: 'Worship deliberately directed to another deity or spirit', fr: 'Un culte délibérément adressé à une autre divinité ou à un esprit' },
        { en: 'A sacrifice offered as worship to another spiritual being', fr: 'Un sacrifice offert comme culte à un autre être spirituel' },
        { en: 'Asking an ancestral spirit for protection or provision', fr: "Demander protection ou provision à un esprit ancestral" },
        { en: 'Depending on a family deity for prosperity, fertility or safety', fr: 'Dépendre d’une divinité familiale pour la prospérité, la fécondité ou la sécurité' },
        { en: 'Taking part in a ritual that explicitly invokes spiritual powers', fr: 'Participer à un rituel qui invoque explicitement des puissances spirituelles' },
        { en: 'Keeping an allegiance to a shrine or deity while professing Christ', fr: 'Maintenir une allégeance à un sanctuaire ou à une divinité tout en professant Christ' },
      ],
      inventory: true,
      modules: ['practicalObedience'],
      standRefs: ['1 Corinthians 10:14-22', 'Exodus 20:3-6'],
    },
  },
  {
    movement: 'repentance',
    theme: { en: 'Divination and occult consultation', fr: 'Divination et consultation occulte', es: 'Adivinación y consulta oculta', pt: 'Adivinhação e consulta oculta', de: 'Wahrsagerei und okkulte Beratung', ru: 'Гадание и оккультные обращения', zh: '占卜與求問邪靈', ja: '占いと霊媒への相談', ko: '점술과 영매 상담', ar: 'العرافة واستشارة الأرواح', fa: 'فالگیری و مشورت با ارواح', hi: 'भविष्यवाणी और तांत्रिक परामर्श', id: 'Ramalan dan konsultasi okultisme', sw: 'Uaguzi na kutafuta mizimu', tl: 'Panghuhula at pagsangguni sa espiritu', am: 'ጥንቆላና የመናፍስት ምክር' },
    ref: 'Deuteronomy 18:9-14',
    related: ['Acts 19:18-20', 'Isaiah 8:19-20'],
    reflection: {
      en: 'God’s command to Israel was not that the future is unknowable, but that His people are to seek Him rather than seek hidden knowledge and power elsewhere. When the Ephesian believers came to faith, they came and confessed their practices openly and burned their own books — publicly, at their own cost, and about their own lives.',
      fr: "Le commandement de Dieu à Israël n'était pas que l'avenir soit inconnaissable, mais que Son peuple Le cherche Lui plutôt que de chercher ailleurs un savoir et une puissance cachés. Quand les croyants d'Éphèse sont venus à la foi, ils ont confessé ouvertement leurs pratiques et brûlé leurs propres livres — publiquement, à leurs propres frais, et au sujet de leur propre vie.",
    },
    prompts: [
      { en: 'Bring only what you actually did or knowingly sought — not what you suspect about others.', fr: "N'apporte que ce que tu as réellement fait ou sciemment recherché — non ce que tu soupçonnes chez les autres." },
      { en: 'Repent where you went elsewhere for guidance, protection or hidden knowledge.', fr: "Repens-toi là où tu es allé ailleurs chercher direction, protection ou savoir caché." },
      { en: 'Ask God for the courage to seek Him first the next time you are afraid or uncertain.', fr: "Demande à Dieu le courage de Le chercher d'abord la prochaine fois que tu auras peur ou que tu douteras." },
    ],
    resourceTopics: ['occult', 'renunciation', 'deliverance', 'discernment'],
    freedom: {
      understand: {
        en: 'This means seeking hidden knowledge, supernatural guidance, protection or intervention through spiritual means outside dependence on God. It is not about ordinary curiosity, and it is not about seeking wisdom from doctors, counsellors, teachers or mature believers.',
        fr: "Il s'agit de chercher un savoir caché, une direction surnaturelle, une protection ou une intervention par des moyens spirituels en dehors de la dépendance à Dieu. Il ne s'agit pas de simple curiosité, ni de chercher la sagesse auprès de médecins, de conseillers, d'enseignants ou de croyants mûrs.",
      },
      examples: [
        { en: 'Consulting a medium', fr: 'Consulter un médium' },
        { en: 'Intentionally attempting to communicate with spirits', fr: 'Chercher intentionnellement à communiquer avec des esprits' },
        { en: 'Ritual divination, or fortune telling used for spiritual guidance', fr: 'La divination rituelle, ou la voyance utilisée comme direction spirituelle' },
        { en: 'Invoking a spirit to reveal the future', fr: "Invoquer un esprit pour qu'il révèle l'avenir" },
        { en: 'Consulting someone to spiritually identify who supposedly caused a problem', fr: "Consulter quelqu'un pour identifier spirituellement qui aurait causé un problème" },
        { en: 'Receiving charms specifically intended to obtain supernatural protection', fr: 'Recevoir des charmes destinés spécifiquement à obtenir une protection surnaturelle' },
        { en: 'Asking a deity or spirit for revelation or direction', fr: 'Demander une révélation ou une direction à une divinité ou à un esprit' },
      ],
      inventory: true,
      modules: ['practicalObedience'],
      standRefs: ['Deuteronomy 18:9-14', 'Isaiah 8:19-20'],
    },
  },
  {
    movement: 'repentance',
    theme: { en: 'Spiritual oaths, vows and covenants', fr: 'Serments, vœux et alliances spirituels', es: 'Juramentos, votos y pactos espirituales', pt: 'Juramentos, votos e pactos espirituais', de: 'Geistliche Eide, Gelübde und Bündnisse', ru: 'Духовные клятвы, обеты и союзы', zh: '屬靈的誓言、許願與盟約', ja: '霊的な誓い・誓願・契約', ko: '영적 맹세와 서원과 언약', ar: 'الأقسام والنذور والعهود الروحية', fa: 'سوگندها، نذرها و عهدهای روحانی', hi: 'आत्मिक शपथ, मन्नत और वाचा', id: 'Sumpah, nazar, dan perjanjian rohani', sw: 'Viapo, nadhiri na maagano ya kiroho', tl: 'Espirituwal na sumpa, panata at tipan', am: 'መንፈሳዊ መሐላ፣ ስእለትና ቃል ኪዳን' },
    ref: 'Matthew 5:33-37',
    related: ['Romans 6:11-14', '2 Corinthians 6:14-18'],
    reflection: {
      en: 'Jesus’ concern with oaths is that a follower of His should be a person whose plain word is reliable — not someone who binds themselves by invoking powers. Paul’s question is simpler still: to whom do you present yourself? You belong to the One you obey, and that is a matter of allegiance rather than of wording.',
      fr: "Ce qui préoccupe Jésus au sujet des serments, c'est qu'un disciple soit quelqu'un dont la parole simple est fiable — et non quelqu'un qui se lie en invoquant des puissances. La question de Paul est plus simple encore : à qui te présentes-tu ? Tu appartiens à celui à qui tu obéis, et c'est une affaire d'allégeance plutôt que de formulation.",
    },
    prompts: [
      { en: 'Ask the Holy Spirit to bring to mind only what is real and known — not to invent anything.', fr: "Demande au Saint-Esprit de te rappeler seulement ce qui est réel et connu — sans rien inventer." },
      { en: 'Where you knowingly took part, repent and renounce that allegiance in the name of Jesus.', fr: "Là où tu as sciemment participé, repens-toi et renonce à cette allégeance au nom de Jésus." },
      { en: 'Ask God to make your yes mean yes, in everything you promise from now on.', fr: "Demande à Dieu que ton oui soit oui, dans tout ce que tu promettras désormais." },
    ],
    resourceTopics: ['covenants', 'renunciation', 'deliverance'],
    freedom: {
      understand: {
        en: 'A spiritual covenant, oath or vow belongs in this prayer when it is a deliberate agreement, commitment, dedication or allegiance involving spiritual powers or practices contrary to allegiance to Jesus Christ. Ordinary legal contracts, marriage vows, cultural commitments, promises, professional oaths and club memberships are not demonic merely because an oath is involved. The spiritual content is what matters.',
        fr: "Une alliance, un serment ou un vœu spirituel relève de cette prière lorsqu'il s'agit d'un accord, d'un engagement, d'une consécration ou d'une allégeance délibérés impliquant des puissances ou des pratiques spirituelles contraires à l'allégeance à Jésus-Christ. Les contrats ordinaires, les vœux de mariage, les engagements culturels, les promesses, les serments professionnels et l'adhésion à des associations ne sont pas démoniaques du seul fait qu'un serment est en jeu. C'est le contenu spirituel qui compte.",
      },
      examples: [
        { en: 'Deliberately swearing allegiance to a deity or spirit', fr: 'Jurer délibérément allégeance à une divinité ou à un esprit' },
        { en: 'Making an oath during an occult initiation', fr: "Prêter serment lors d'une initiation occulte" },
        { en: 'Entering a ritual covenant for supernatural protection', fr: 'Conclure une alliance rituelle pour une protection surnaturelle' },
        { en: 'Promising something to a spiritual power in exchange for help', fr: 'Promettre quelque chose à une puissance spirituelle en échange d’une aide' },
        { en: 'A blood or ritual covenant explicitly involving spiritual allegiance', fr: 'Une alliance de sang ou rituelle impliquant explicitement une allégeance spirituelle' },
        { en: 'Personally taking part in a family spiritual covenant ceremony', fr: 'Participer personnellement à une cérémonie d’alliance spirituelle familiale' },
        { en: 'Making vows while consulting occult practitioners', fr: 'Faire des vœux en consultant des praticiens de l’occulte' },
      ],
      inventory: true,
      modules: ['practicalObedience'],
      standRefs: ['Romans 6:11-14', '2 Corinthians 6:14-18'],
    },
  },
  {
    movement: 'repentance',
    theme: { en: 'Dedications and initiations', fr: 'Consécrations et initiations', es: 'Dedicaciones e iniciaciones', pt: 'Dedicações e iniciações', de: 'Weihen und Initiationen', ru: 'Посвящения и инициации', zh: '獻身與入會禮', ja: '奉献と入門儀礼', ko: '바침과 입문 의식', ar: 'التكريسات والطقوس الابتدائية', fa: 'وقف‌ها و آیین‌های تشرف', hi: 'समर्पण और दीक्षा', id: 'Persembahan dan inisiasi', sw: 'Kuwekwa wakfu na kutawazwa', tl: 'Mga paghahandog at inisasyon', am: 'ስጦታዎችና የመግቢያ ሥርዓቶች' },
    ref: 'Romans 12:1-2',
    related: ['1 Corinthians 6:19-20', '1 Peter 2:9'],
    reflection: {
      en: 'Paul’s answer to being claimed is to present yourself — deliberately, bodily, as a living sacrifice to God. Whatever was once done with your life, today you may present it to Him yourself. That is not undoing history; it is declaring who now holds it.',
      fr: "La réponse de Paul au fait d'être revendiqué, c'est de te présenter toi-même — délibérément, corporellement, comme un sacrifice vivant à Dieu. Quoi qu'on ait fait autrefois de ta vie, tu peux aujourd'hui la Lui présenter toi-même. Ce n'est pas effacer l'histoire : c'est déclarer qui la tient désormais.",
    },
    prompts: [
      { en: 'Present your body, your future and your history to God as a living sacrifice.', fr: "Présente à Dieu ton corps, ton avenir et ton histoire comme un sacrifice vivant." },
      { en: 'Where you personally renewed or took part in a dedication, repent and renounce it.', fr: "Là où tu as personnellement renouvelé une consécration ou y as participé, repens-toi et renonces-y." },
      { en: 'If you were only told about something, place it before God without confessing guilt for it.', fr: "Si on t'a seulement raconté quelque chose, dépose-le devant Dieu sans en confesser la culpabilité." },
    ],
    resourceTopics: ['dedications', 'renunciation', 'deliverance'],
    freedom: {
      understand: {
        en: 'A dedication belongs here when a person was intentionally presented, committed, initiated or spiritually assigned to a deity, spirit, shrine or spiritual allegiance contrary to Christ. A Christian infant dedication, a naming celebration with no spiritual invocation, or an ordinary rite of passage is not what this means.',
        fr: "Une consécration relève d'ici lorsqu'une personne a été intentionnellement présentée, engagée, initiée ou spirituellement affectée à une divinité, un esprit, un sanctuaire ou une allégeance spirituelle contraire à Christ. Une présentation d'enfant chrétienne, une fête de nom sans invocation spirituelle, ou un rite de passage ordinaire ne sont pas de cela qu'il s'agit.",
      },
      examples: [
        { en: 'A child deliberately dedicated to a deity or spirit', fr: 'Un enfant délibérément consacré à une divinité ou à un esprit' },
        { en: 'Initiation into service associated with a shrine', fr: "Une initiation au service associé à un sanctuaire" },
        { en: 'Being assigned a ritual spiritual role', fr: 'Se voir attribuer un rôle spirituel rituel' },
        { en: 'A ceremony explicitly committing someone to a spirit', fr: "Une cérémonie engageant explicitement quelqu'un envers un esprit" },
        { en: 'Personally renewing such a dedication later in life', fr: 'Renouveler soi-même une telle consécration plus tard dans la vie' },
        { en: 'Initiation into an occult spiritual system', fr: 'Une initiation à un système spirituel occulte' },
      ],
      inventory: true,
      modules: ['practicalObedience'],
      standRefs: ['Romans 12:1-2', '1 Corinthians 6:19-20'],
    },
  },
  {
    movement: 'repentance',
    theme: { en: 'Secret societies and ritual allegiance', fr: 'Sociétés secrètes et allégeance rituelle', es: 'Sociedades secretas y lealtad ritual', pt: 'Sociedades secretas e lealdade ritual', de: 'Geheimbünde und rituelle Bindungen', ru: 'Тайные общества и ритуальная верность', zh: '秘密結社與儀式效忠', ja: '秘密結社と儀礼的忠誠', ko: '비밀 결사와 의식적 충성', ar: 'الجمعيات السرية والولاء الطقسي', fa: 'انجمن‌های سری و بیعت آیینی', hi: 'गुप्त संगठन और अनुष्ठानिक निष्ठा', id: 'Perkumpulan rahasia dan kesetiaan ritual', sw: 'Vyama vya siri na kiapo cha kiibada', tl: 'Lihim na samahan at ritwal na katapatan', am: 'ምስጢራዊ ማኅበራትና የሥርዓት ታማኝነት' },
    ref: '2 Corinthians 6:14-18',
    related: ['Ephesians 5:8-14', 'John 18:19-21'],
    reflection: {
      en: 'Paul is not writing about privacy; he is writing about shared spiritual allegiance. Jesus could say that He had spoken openly and said nothing in secret — a life with nothing hidden behind an oath. The question today is not whether an organisation is private, but whether its initiation or membership knowingly involves spiritual invocation, occult ritual, sacrifice or allegiance contrary to Christ.',
      fr: "Paul n'écrit pas au sujet de la discrétion ; il écrit au sujet d'une allégeance spirituelle partagée. Jésus pouvait dire qu'Il avait parlé ouvertement et n'avait rien dit en secret — une vie sans rien de caché derrière un serment. La question aujourd'hui n'est pas de savoir si une organisation est privée, mais si son initiation ou son appartenance implique sciemment une invocation spirituelle, un rituel occulte, un sacrifice ou une allégeance contraires à Christ.",
    },
    prompts: [
      { en: 'Bring only known involvement of your own — never a suspicion about someone else.', fr: "N'apporte que ton implication connue — jamais un soupçon concernant quelqu'un d'autre." },
      { en: 'Repent for personal participation, and renounce the spiritual allegiance itself.', fr: "Repens-toi de ta participation personnelle, et renonce à l'allégeance spirituelle elle-même." },
      { en: 'Ask God for wisdom about any practical decision this leaves you with.', fr: "Demande à Dieu de la sagesse pour toute décision pratique que cela te laisse." },
    ],
    resourceTopics: ['secret-societies', 'covenants', 'renunciation', 'deliverance'],
    freedom: {
      understand: {
        en: 'This section does not mean that every private organisation, club, fraternity, cultural association or secret society is spiritually evil. It concerns groups whose initiation or membership knowingly involves spiritual invocation, occult ritual, sacrifice, or allegiance contrary to Christ. Evaluate the practice and the allegiance — never a guessed organisational label, and never a name someone else has been accused of belonging to.',
        fr: "Cette section ne signifie pas que toute organisation privée, tout club, toute fraternité, toute association culturelle ou toute société secrète soit spirituellement mauvais. Elle concerne les groupes dont l'initiation ou l'appartenance implique sciemment une invocation spirituelle, un rituel occulte, un sacrifice ou une allégeance contraires à Christ. Évalue la pratique et l'allégeance — jamais une étiquette supposée, et jamais un nom dont on aurait accusé quelqu'un d'autre.",
      },
      examples: [
        { en: 'An occult lodge involving ritual spiritual invocation', fr: 'Une loge occulte pratiquant une invocation spirituelle rituelle' },
        { en: 'An esoteric order practising invocation or divination', fr: 'Un ordre ésotérique pratiquant l’invocation ou la divination' },
        { en: 'An initiatory fraternity requiring an oath to a deity or spirit', fr: 'Une fraternité initiatique exigeant un serment envers une divinité ou un esprit' },
        { en: 'A traditional society a person knowingly entered by spiritual covenant', fr: 'Une société traditionnelle dans laquelle on est entré sciemment par alliance spirituelle' },
        { en: 'A family spiritual society whose initiation involves ritual allegiance', fr: 'Une société spirituelle familiale dont l’initiation implique une allégeance rituelle' },
        { en: 'An organisation whose initiation involves sacrifice or consulting spirits', fr: 'Une organisation dont l’initiation implique un sacrifice ou la consultation d’esprits' },
      ],
      inventory: true,
      modules: ['practicalObedience'],
      standRefs: ['2 Corinthians 6:14-18', 'Ephesians 5:8-14'],
    },
  },

  // ── Movement 3 · Family foundations, covenants & curses ───────────────────
  {
    movement: 'family',
    theme: { en: 'My family history before Christ', fr: 'Mon histoire familiale devant Christ', es: 'Mi historia familiar ante Cristo', pt: 'Minha história familiar diante de Cristo', de: 'Meine Familiengeschichte vor Christus', ru: 'Моя семейная история пред Христом', zh: '把家族歷史帶到基督面前', ja: '家族の歴史をキリストの前に', ko: '내 가족의 역사를 그리스도 앞에', ar: 'تاريخ عائلتي أمام المسيح', fa: 'تاریخ خانوادگی‌ام در حضور مسیح', hi: 'मसीह के सामने मेरे परिवार का इतिहास', id: 'Sejarah keluargaku di hadapan Kristus', sw: 'Historia ya familia yangu mbele za Kristo', tl: 'Ang kasaysayan ng pamilya ko sa harap ni Cristo', am: 'የቤተሰቤ ታሪክ በክርስቶስ ፊት' },
    ref: '1 Peter 1:18-19',
    related: ['Ezekiel 18:19-20', '2 Corinthians 5:17', 'Colossians 1:13-14'],
    reflection: {
      en: 'Peter says believers were ransomed from the futile way of life handed down by their ancestors — so Scripture does take inherited patterns seriously. Ezekiel is equally clear that the son does not bear the guilt of the father. Both are true: you can name what came down to you without ever becoming guilty of it, and you can be free of a way of life without accusing the people who lived it.',
      fr: "Pierre dit que les croyants ont été rachetés de la manière de vivre vaine héritée de leurs pères — l'Écriture prend donc au sérieux ce qui se transmet. Ézéchiel est tout aussi clair : le fils ne porte pas la faute du père. Les deux sont vrais : tu peux nommer ce qui t'a été transmis sans jamais en devenir coupable, et tu peux être libéré d'une manière de vivre sans accuser ceux qui l'ont vécue.",
    },
    prompts: [
      { en: 'Thank God that you were ransomed by the blood of Christ, not by knowing your history.', fr: "Remercie Dieu : tu as été racheté par le sang de Christ, non par la connaissance de ton histoire." },
      { en: 'Bring what you actually know before Him, without filling in the gaps.', fr: "Apporte-Lui ce que tu sais réellement, sans combler les vides." },
      { en: 'Entrust to Him everything you do not know and never will.', fr: "Remets-Lui tout ce que tu ignores et ignoreras toujours." },
    ],
    practice: {
      en: 'If you do not know your family history, do not go looking for it through fear. You may ask a relative once, in an ordinary conversation, and leave it there.',
      fr: "Si tu ne connais pas ton histoire familiale, ne pars pas la chercher par peur. Tu peux interroger un proche une fois, dans une conversation ordinaire, et en rester là.",
    },
    resourceTopics: ['family-line', 'deliverance', 'identity'],
    freedom: {
      understand: {
        en: 'These ten days pray about family and inherited spiritual concerns. Four things are kept apart on purpose: your own guilt, your family’s history, destructive patterns you may have learned, and what Pentecostal teaching says about spiritual family influence. You are never told that you are personally guilty because of an ancestor’s actions, and you are never asked to become afraid of your own family.',
        fr: "Ces dix jours prient au sujet de la famille et de préoccupations spirituelles héritées. Quatre choses sont volontairement distinguées : ta propre culpabilité, l'histoire de ta famille, les schémas destructeurs que tu as pu apprendre, et ce que l'enseignement pentecôtiste dit de l'influence spirituelle familiale. On ne te dira jamais que tu es personnellement coupable à cause des actes d'un ancêtre, et il ne t'est jamais demandé d'avoir peur de ta propre famille.",
      },
      inventory: true,
      standRefs: ['1 Peter 1:18-19', 'Ezekiel 18:19-20'],
    },
  },
  {
    movement: 'family',
    theme: { en: 'Family ancestral and spirit worship', fr: 'Culte familial des ancêtres et des esprits', es: 'Culto familiar a ancestros y espíritus', pt: 'Culto familiar a ancestrais e espíritos', de: 'Ahnen- und Geisterverehrung in der Familie', ru: 'Семейное почитание предков и духов', zh: '家族祭祖與拜靈', ja: '家系の先祖・霊への礼拝', ko: '가문의 조상·영 숭배', ar: 'عبادة الأسلاف والأرواح في العائلة', fa: 'پرستش نیاکان و ارواح در خانواده', hi: 'पारिवारिक पूर्वज व आत्मा पूजा', id: 'Pemujaan leluhur dan roh dalam keluarga', sw: 'Ibada ya mizimu na mababu katika familia', tl: 'Pagsamba ng pamilya sa ninuno at espiritu', am: 'የቤተሰብ የአባቶችና የመናፍስት አምልኮ' },
    ref: 'Joshua 24:14-15',
    related: ['Deuteronomy 18:9-14', '1 Corinthians 10:20-21'],
    reflection: {
      en: 'Joshua names exactly this situation: the gods your fathers served, on the other side of the river. He does not shame the people for having such a history, and he does not tell them to research it. He puts one decision in front of them — choose today whom you will serve — and answers for his own household first.',
      fr: "Josué nomme exactement cette situation : les dieux que vos pères servaient de l'autre côté du fleuve. Il ne fait pas honte au peuple d'avoir une telle histoire, et il ne lui dit pas de faire des recherches. Il pose devant lui une seule décision — choisissez aujourd'hui qui vous servirez — et répond d'abord pour sa propre maison.",
    },
    prompts: [
      { en: 'Say to God what Joshua said: as for me and my house, we will serve the LORD.', fr: "Dis à Dieu ce que Josué a dit : moi et ma maison, nous servirons l'Éternel." },
      { en: 'Refuse as your own any allegiance you know of, without accusing anyone.', fr: "Refuse comme tienne toute allégeance que tu connais, sans accuser personne." },
      { en: 'Pray for the relatives involved, and ask God for grace toward them.', fr: 'Prie pour les proches concernés, et demande à Dieu de la grâce envers eux.' },
    ],
    resourceTopics: ['idolatry', 'family-line', 'deliverance'],
    freedom: {
      understand: {
        en: 'This concerns explicit worship, sacrifice, invocation or spiritual dependence in a family line. It is not about African heritage, and heritage is never bondage. Honouring parents, remembering the dead, cultural celebration, family names and traditional food, dress, music or art are not spirit worship.',
        fr: "Il s'agit ici de culte, de sacrifice, d'invocation ou de dépendance spirituelle explicites dans une lignée familiale. Il ne s'agit pas de l'héritage africain, et un héritage n'est jamais un esclavage. Honorer ses parents, se souvenir des défunts, célébrer sa culture, les noms de famille et la nourriture, les vêtements, la musique ou l'art traditionnels ne sont pas un culte des esprits.",
      },
      examples: [
        { en: 'Worship offered at a family shrine', fr: 'Un culte offert dans un sanctuaire familial' },
        { en: 'Sacrifices offered to ancestral spirits or a deity', fr: 'Des sacrifices offerts à des esprits ancestraux ou à une divinité' },
        { en: 'Seeking spiritual protection from ancestors', fr: 'Chercher une protection spirituelle auprès des ancêtres' },
        { en: 'A family allegiance to a particular deity', fr: 'Une allégeance familiale à une divinité particulière' },
        { en: 'A known family ritual that invokes spiritual powers', fr: 'Un rituel familial connu qui invoque des puissances spirituelles' },
      ],
      inventory: true,
      standRefs: ['Joshua 24:14-15', '1 Corinthians 10:20-21'],
    },
  },
  {
    movement: 'family',
    theme: { en: 'Family dedications and initiations', fr: 'Consécrations et initiations familiales', es: 'Dedicaciones e iniciaciones familiares', pt: 'Dedicações e iniciações familiares', de: 'Familiäre Weihen und Initiationen', ru: 'Семейные посвящения и инициации', zh: '家族的獻身與入會禮', ja: '家系による奉献と入門儀礼', ko: '가문의 바침과 입문 의식', ar: 'التكريسات والطقوس العائلية', fa: 'وقف‌ها و آیین‌های تشرف خانوادگی', hi: 'पारिवारिक समर्पण और दीक्षा', id: 'Persembahan dan inisiasi keluarga', sw: 'Kuwekwa wakfu na kutawazwa kwa kifamilia', tl: 'Mga paghahandog at inisasyon ng pamilya', am: 'የቤተሰብ ስጦታዎችና የመግቢያ ሥርዓቶች' },
    ref: '1 Corinthians 6:19-20',
    related: ['Romans 6:12-14', 'Colossians 1:13-14'],
    reflection: {
      en: 'Paul’s reasoning is about ownership: you were bought with a price, so your body is not your own to hand over — and neither was it anyone else’s to give away. If something was done over your life before you could answer for yourself, you can answer for yourself now.',
      fr: "Le raisonnement de Paul porte sur la propriété : tu as été racheté à un grand prix, si bien que ton corps ne t'appartient pas pour le livrer — et il n'appartenait pas davantage à un autre pour le donner. Si quelque chose a été fait sur ta vie avant que tu puisses répondre toi-même, tu peux répondre toi-même aujourd'hui.",
    },
    prompts: [
      { en: 'Tell God that you now present yourself to Him, whatever was once done.', fr: "Dis à Dieu que tu te présentes maintenant à Lui, quoi qu'on ait fait autrefois." },
      { en: 'If you personally renewed a dedication as an adult, repent of that and renounce it.', fr: "Si tu as renouvelé une consécration à l'âge adulte, repens-t'en et renonces-y." },
      { en: 'If you only remember being told, place it before God and refuse to add to the story.', fr: "Si tu te souviens seulement qu'on te l'a raconté, dépose-le devant Dieu et refuse d'en rajouter." },
    ],
    resourceTopics: ['dedications', 'family-line', 'deliverance'],
    freedom: {
      understand: {
        en: 'Ask yourself only what is answerable: do you personally remember taking part, were you told this happened in childhood, do you merely suspect it, or do you know nothing at all? Each of those is answered differently in prayer, and the last two are not a lesser answer.',
        fr: "Ne te demande que ce à quoi tu peux répondre : te souviens-tu personnellement d'y avoir participé, t'a-t-on dit que cela s'est produit dans ton enfance, le soupçonnes-tu seulement, ou n'en sais-tu rien du tout ? Chacune de ces réponses se prie différemment, et les deux dernières ne sont pas des réponses inférieures.",
      },
      examples: [
        { en: 'A child dedicated to a spiritual power', fr: 'Un enfant consacré à une puissance spirituelle' },
        { en: 'Descendants presented at a shrine', fr: 'Des descendants présentés dans un sanctuaire' },
        { en: 'An inherited ritual role', fr: 'Un rôle rituel hérité' },
        { en: 'A family initiation ceremony', fr: "Une cérémonie d'initiation familiale" },
        { en: 'Spiritual obligations known to have been placed on descendants', fr: 'Des obligations spirituelles connues imposées aux descendants' },
      ],
      inventory: true,
      modules: ['practicalObedience'],
      standRefs: ['1 Corinthians 6:19-20', 'Romans 6:12-14'],
    },
  },
  {
    movement: 'family',
    theme: { en: 'Family covenants, oaths and vows', fr: 'Alliances, serments et vœux familiaux', es: 'Pactos, juramentos y votos familiares', pt: 'Pactos, juramentos e votos familiares', de: 'Familiäre Bündnisse, Eide und Gelübde', ru: 'Семейные заветы, клятвы и обеты', zh: '家族的盟約、誓言與許願', ja: '家系の契約・誓い・誓願', ko: '가문의 언약과 맹세와 서원', ar: 'العهود والأقسام والنذور العائلية', fa: 'عهدها، سوگندها و نذرهای خانوادگی', hi: 'पारिवारिक वाचा, शपथ और मन्नत', id: 'Perjanjian, sumpah, dan nazar keluarga', sw: 'Maagano, viapo na nadhiri za familia', tl: 'Mga tipan, sumpa at panata ng pamilya', am: 'የቤተሰብ ቃል ኪዳን፣ መሐላና ስእለት' },
    ref: 'Romans 14:7-9',
    related: ['Matthew 5:33-37', 'Ezekiel 18:19-20'],
    reflection: {
      en: 'Paul’s point settles the question of ownership: none of us lives to himself, and whether we live or die we are the Lord’s — because Christ died and rose precisely to be Lord of the dead and the living. Whatever was agreed by people who came before you, the claim on you now is His.',
      fr: "L'argument de Paul règle la question de l'appartenance : aucun de nous ne vit pour lui-même, et soit que nous vivions soit que nous mourions, nous sommes au Seigneur — car Christ est mort et ressuscité précisément pour être le Seigneur des morts et des vivants. Quoi qu'aient convenu ceux qui t'ont précédé, celui qui a désormais un droit sur toi, c'est Lui.",
    },
    prompts: [
      { en: 'Ask the Holy Spirit to bring to mind what is relevant and known — and not to invent what He has not brought into the light.', fr: "Demande au Saint-Esprit de te rappeler ce qui est pertinent et connu — et de ne pas inventer ce qu'Il n'a pas mis en lumière." },
      { en: 'Renounce any continuing agreement of your own with what you know of.', fr: "Renonce à tout accord personnel que tu maintiendrais avec ce que tu connais." },
      { en: 'Declare before God that you are the Lord’s, in life and in death.', fr: "Déclare devant Dieu que tu appartiens au Seigneur, dans la vie et dans la mort." },
    ],
    resourceTopics: ['covenants', 'family-line', 'deliverance'],
    freedom: {
      understand: {
        en: 'A recurring family problem is not evidence that a covenant exists. This day prays only about what is actually known — and if nothing is known, that is exactly what you bring. Do not construct a hypothetical ancestral event in order to have something to renounce.',
        fr: "Un problème familial récurrent n'est pas la preuve qu'une alliance existe. Cette journée ne prie que sur ce qui est réellement connu — et si rien n'est connu, c'est précisément ce que tu apportes. Ne construis pas un événement ancestral hypothétique pour avoir quelque chose à renier.",
      },
      examples: [
        { en: 'A family covenant explicitly invoking a deity or spirit', fr: 'Une alliance familiale invoquant explicitement une divinité ou un esprit' },
        { en: 'A ritual oath said to bind descendants', fr: 'Un serment rituel réputé lier les descendants' },
        { en: 'A recurring family spiritual obligation', fr: 'Une obligation spirituelle familiale récurrente' },
        { en: 'A blood or ritual covenant', fr: 'Une alliance de sang ou rituelle' },
        { en: 'An oath connected to a shrine or an initiatory society', fr: "Un serment lié à un sanctuaire ou à une société initiatique" },
      ],
      inventory: true,
      modules: ['practicalObedience'],
      standRefs: ['Romans 14:7-9', 'Ezekiel 18:19-20'],
    },
  },
  {
    movement: 'family',
    theme: { en: 'Family shrines, altars and objects', fr: 'Sanctuaires, autels et objets familiaux', es: 'Santuarios, altares y objetos familiares', pt: 'Santuários, altares e objetos familiares', de: 'Familiäre Schreine, Altäre und Gegenstände', ru: 'Семейные святилища, жертвенники и предметы', zh: '家族的神壇、祭壇與器物', ja: '家系の祠・祭壇・器物', ko: '가문의 신당과 제단과 물건', ar: 'المزارات والمذابح والأشياء العائلية', fa: 'زیارتگاه‌ها، مذبح‌ها و اشیای خانوادگی', hi: 'पारिवारिक स्थान, वेदी और वस्तुएं', id: 'Tempat pemujaan, mezbah, dan benda keluarga', sw: 'Madhabahu, vizingiti na vitu vya familia', tl: 'Mga dambana, altar at bagay ng pamilya', am: 'የቤተሰብ መቅደሶች፣ መሠዊያዎችና ዕቃዎች' },
    ref: 'Deuteronomy 12:2-4',
    related: ['2 Corinthians 6:16', 'Acts 19:18-20'],
    reflection: {
      en: 'Israel was told not to build its worship of the LORD on someone else’s altar. The command was about a place of worship and sacrifice, not about buildings, art or age. In Ephesus the same principle moved through people’s own possessions: they dealt with what had been theirs, at their own cost, and no one else’s property was touched.',
      fr: "Il fut dit à Israël de ne pas bâtir son culte de l'Éternel sur l'autel d'un autre. Le commandement portait sur un lieu de culte et de sacrifice, non sur des bâtiments, de l'art ou de l'ancienneté. À Éphèse, le même principe est passé par les biens des personnes elles-mêmes : elles ont réglé ce qui leur appartenait, à leurs frais, et personne n'a touché aux biens d'autrui.",
    },
    prompts: [
      { en: 'Ask God to make your own home a place where He alone is worshipped.', fr: "Demande à Dieu que ta propre maison soit un lieu où Lui seul est adoré." },
      { en: 'Renounce any personal reliance on an object for spiritual power or protection.', fr: "Renonce à toute confiance personnelle en un objet pour une puissance ou une protection spirituelle." },
      { en: 'Ask for wisdom about anything whose ownership or disposal is not simple.', fr: "Demande de la sagesse pour tout ce dont la propriété ou l'élimination n'est pas simple." },
    ],
    practice: {
      en: 'If something needs to change, start with what is actually yours and stop relying on it. Do not burn anything unsafe, destroy what belongs to someone else, break the law, trespass, damage cultural property, or confront a relative. Where ownership or disposal is complicated, ask a trusted pastor before you act.',
      fr: "Si quelque chose doit changer, commence par ce qui t'appartient réellement et cesse de t'y appuyer. Ne brûle rien de dangereux, ne détruis pas le bien d'autrui, n'enfreins pas la loi, n'entre pas sans droit, n'abîme pas un bien culturel, et n'affronte pas un proche. Quand la propriété ou l'élimination est compliquée, parles-en à un pasteur de confiance avant d'agir.",
    },
    resourceTopics: ['altars', 'family-line', 'deliverance', 'renunciation'],
    freedom: {
      understand: {
        en: 'A place or an object is not spiritually evil in itself. This concerns a shrine, altar or object intentionally used for worship, sacrifice, invocation, covenant or spiritual dependence contrary to Christ. An heirloom, a carving, a mask on a wall, traditional clothing, a cultural symbol or an old family house is not condemned here without that actual spiritual use.',
        fr: "Un lieu ou un objet n'est pas spirituellement mauvais en lui-même. Il s'agit ici d'un sanctuaire, d'un autel ou d'un objet intentionnellement utilisé pour le culte, le sacrifice, l'invocation, une alliance ou une dépendance spirituelle contraires à Christ. Un héritage, une sculpture, un masque au mur, un vêtement traditionnel, un symbole culturel ou une vieille maison de famille ne sont pas condamnés ici en l'absence de cet usage spirituel réel.",
      },
      examples: [
        { en: 'Family sacrifices made at a shrine', fr: 'Des sacrifices familiaux offerts dans un sanctuaire' },
        { en: 'Invocation of ancestral spirits at a family altar', fr: "L'invocation d'esprits ancestraux devant un autel familial" },
        { en: 'Descendants dedicated at a shrine', fr: 'Des descendants consacrés dans un sanctuaire' },
        { en: 'Keeping an object because it is believed to give supernatural power', fr: "Conserver un objet parce qu'on le croit porteur d'une puissance surnaturelle" },
        { en: 'Ritual sacrifices seeking protection, fertility, prosperity or favour', fr: 'Des sacrifices rituels visant protection, fécondité, prospérité ou faveur' },
        { en: 'An altar connected to explicit spiritual oaths or covenants', fr: 'Un autel lié à des serments ou alliances spirituels explicites' },
      ],
      inventory: true,
      modules: ['practicalObedience'],
      standRefs: ['2 Corinthians 6:16', 'Deuteronomy 12:2-4'],
    },
  },
  {
    movement: 'family',
    theme: { en: 'Curses and spoken pronouncements', fr: 'Malédictions et paroles prononcées', es: 'Maldiciones y pronunciamientos', pt: 'Maldições e pronunciamentos', de: 'Flüche und ausgesprochene Verwünschungen', ru: 'Проклятия и произнесённые слова', zh: '咒詛與宣告的話', ja: 'のろいと宣言されたことば', ko: '저주와 선언된 말', ar: 'اللعنات والأقوال المنطوقة', fa: 'لعنت‌ها و سخنان اعلام‌شده', hi: 'श्राप और बोले गए वचन', id: 'Kutuk dan ucapan yang dinyatakan', sw: 'Laana na maneno yaliyotamkwa', tl: 'Mga sumpa at binigkas na pahayag', am: 'እርግማንና የተነገሩ ቃላት' },
    ref: 'Galatians 3:13-14',
    related: ['Colossians 2:13-15', 'Romans 8:31-39'],
    reflection: {
      en: 'Paul’s answer to the curse of the law is not a counter-curse but a person: Christ redeemed us by becoming a curse for us, so that the blessing promised to Abraham would come to the nations and we would receive the promised Spirit. Where fear of words is concerned, Romans 8 asks the only question that matters — if God is for us, who can be against us?',
      fr: "La réponse de Paul à la malédiction de la loi n'est pas une contre-malédiction, mais une personne : Christ nous a rachetés en devenant malédiction pour nous, afin que la bénédiction promise à Abraham parvienne aux nations et que nous recevions l'Esprit promis. Face à la peur des paroles, Romains 8 pose la seule question qui compte : si Dieu est pour nous, qui sera contre nous ?",
    },
    prompts: [
      { en: 'Name the words you are actually afraid of, and say them to God rather than repeating them to yourself.', fr: "Nomme les paroles dont tu as réellement peur, et dis-les à Dieu au lieu de te les répéter." },
      { en: 'Refuse agreement with fear, and stand on what Christ has already done.', fr: "Refuse tout accord avec la peur, et appuie-toi sur ce que Christ a déjà accompli." },
      { en: 'Pray blessing over the person who spoke them, rather than retaliation.', fr: "Prie une bénédiction sur celui qui les a prononcées, plutôt qu'une revanche." },
    ],
    resourceTopics: ['curses', 'family-line', 'deliverance', 'fear'],
    freedom: {
      understand: {
        en: 'This refers to words intentionally spoken or performed as an invocation or declaration of spiritual harm, or words you still fear as though they were spiritually authoritative over you. An insult, an angry outburst, a harsh parent, a pessimistic prediction or a cruel remark is not a supernatural curse, and treating every negative word as one will only teach you to be afraid of speech.',
        fr: "Il s'agit de paroles intentionnellement prononcées ou accomplies comme une invocation ou une déclaration de nuisance spirituelle, ou de paroles que tu redoutes encore comme si elles avaient autorité spirituelle sur toi. Une insulte, un accès de colère, un parent dur, une prédiction pessimiste ou une remarque cruelle ne sont pas une malédiction surnaturelle, et traiter chaque parole négative comme telle ne t'apprendra qu'à craindre la parole.",
      },
      examples: [
        { en: 'An explicit curse pronounced over an individual', fr: "Une malédiction explicite prononcée sur une personne" },
        { en: 'A curse pronounced over a family', fr: 'Une malédiction prononcée sur une famille' },
        { en: 'Ritual cursing', fr: 'Une malédiction rituelle' },
        { en: 'A practitioner declaring spiritual harm', fr: 'Un praticien déclarant un mal spirituel' },
        { en: 'Words said to follow the breaking of a ritual oath', fr: "Des paroles censées suivre la rupture d'un serment rituel" },
        { en: 'A statement such as “no one in this family will marry”, spoken deliberately as a spiritual pronouncement', fr: "Une phrase telle que « personne dans cette famille ne se mariera », prononcée délibérément comme une déclaration spirituelle" },
        { en: 'A threat that a spiritual power will punish the family or its descendants', fr: "La menace qu'une puissance spirituelle punira la famille ou ses descendants" },
      ],
      inventory: true,
      standRefs: ['Galatians 3:13-14', 'Romans 8:31-39'],
    },
  },
  {
    movement: 'family',
    theme: { en: 'Family occult and divination history', fr: 'Occultisme et divination dans la famille', es: 'Historia familiar de ocultismo y adivinación', pt: 'História familiar de ocultismo e adivinhação', de: 'Okkultismus und Wahrsagerei in der Familie', ru: 'Оккультизм и гадание в семье', zh: '家族的邪術與占卜歷史', ja: '家系のオカルト・占いの歴史', ko: '가문의 오컬트·점술 이력', ar: 'تاريخ العائلة مع السحر والعرافة', fa: 'سابقهٔ خانوادگی جادو و فالگیری', hi: 'परिवार में तंत्र-मंत्र का इतिहास', id: 'Riwayat okultisme dan ramalan keluarga', sw: 'Historia ya uchawi na uaguzi katika familia', tl: 'Kasaysayan ng okultismo at panghuhula sa pamilya', am: 'የቤተሰብ ጥንቆላና ምዋርት ታሪክ' },
    ref: 'Acts 19:18-20',
    related: ['Deuteronomy 18:9-14', '1 John 4:1-4'],
    reflection: {
      en: 'In Ephesus each believer dealt with their own practices. Nobody was interrogated, nobody was denounced, and nobody was made responsible for someone else’s books. That is the pattern here: the question is not who in your family did what, but what known practice you can place before God and refuse as your own allegiance.',
      fr: "À Éphèse, chaque croyant a réglé ses propres pratiques. Personne n'a été interrogé, personne n'a été dénoncé, et personne n'a été rendu responsable des livres d'un autre. C'est le modèle ici : la question n'est pas de savoir qui, dans ta famille, a fait quoi, mais quelle pratique connue tu peux déposer devant Dieu et refuser comme ta propre allégeance.",
    },
    prompts: [
      { en: 'Bring what you know without naming anyone as an accusation before God.', fr: "Apporte ce que tu sais sans nommer personne comme une accusation devant Dieu." },
      { en: 'Refuse as your own any practice you know of, and ask God to guard your children after you.', fr: "Refuse comme tienne toute pratique que tu connais, et demande à Dieu de garder tes enfants après toi." },
      { en: 'Ask for love toward the relatives involved, and for wisdom in how you relate to them.', fr: "Demande de l'amour pour les proches concernés, et de la sagesse dans ta manière de vivre avec eux." },
    ],
    safetyNote: {
      en: 'Never accuse a relative of witchcraft. Accusations of this kind destroy families and, in some places, get people hurt or killed. This prayer is about your own allegiance, not about identifying a culprit.',
      fr: "N'accuse jamais un proche de sorcellerie. De telles accusations détruisent des familles et, dans certains lieux, font blesser ou tuer des gens. Cette prière porte sur ta propre allégeance, non sur l'identification d'un coupable.",
    },
    resourceTopics: ['occult', 'family-line', 'deliverance'],
    freedom: {
      understand: {
        en: 'This day is about known, recurring involvement in a family line — occult consultation, mediums, divination, witchcraft practices, spirit invocation or rituals for spiritual protection. Knowing about it is not the same as being guilty of it, and refusing it as your own allegiance does not require you to prove anything about anyone.',
        fr: "Cette journée porte sur une implication connue et récurrente dans une lignée familiale — consultation occulte, médiums, divination, pratiques de sorcellerie, invocation d'esprits ou rituels de protection spirituelle. Le savoir n'équivaut pas à en être coupable, et refuser cela comme ta propre allégeance ne t'oblige à rien prouver sur qui que ce soit.",
      },
      inventory: true,
      standRefs: ['Acts 19:18-20', '1 John 4:1-4'],
    },
  },
  {
    movement: 'family',
    theme: { en: 'Names, ceremonies and dedications', fr: 'Noms, cérémonies et consécrations', es: 'Nombres, ceremonias y dedicaciones', pt: 'Nomes, cerimônias e dedicações', de: 'Namen, Zeremonien und Weihen', ru: 'Имена, обряды и посвящения', zh: '名字、儀式與獻身', ja: '名前・儀式・奉献', ko: '이름과 의식과 바침', ar: 'الأسماء والمراسم والتكريسات', fa: 'نام‌ها، مراسم و وقف‌ها', hi: 'नाम, समारोह और समर्पण', id: 'Nama, upacara, dan persembahan', sw: 'Majina, sherehe na kuwekwa wakfu', tl: 'Mga pangalan, seremonya at paghahandog', am: 'ስሞች፣ ሥርዓቶችና ስጦታዎች' },
    ref: 'Isaiah 43:1',
    related: ['Revelation 2:17', '1 Peter 2:9-10'],
    reflection: {
      en: 'God says to His people: I have called you by name, you are mine. Your name in His mouth is a word of belonging, and He is not embarrassed by the language it comes from. What matters is not the sound of a name but whether a known spiritual allegiance was attached to it.',
      fr: "Dieu dit à Son peuple : je t'ai appelé par ton nom, tu es à moi. Ton nom, dans Sa bouche, est une parole d'appartenance, et la langue dont il vient ne Le gêne pas. Ce qui compte n'est pas la sonorité d'un nom, mais qu'une allégeance spirituelle connue y ait été attachée.",
    },
    prompts: [
      { en: 'Thank God that He calls you by name and that you are His.', fr: "Remercie Dieu de t'appeler par ton nom et de te compter comme sien." },
      { en: 'Where a ceremony is known to have involved spiritual dedication, bring that specific thing before Him.', fr: "Là où une cérémonie est connue pour avoir comporté une consécration spirituelle, apporte-Lui cette chose précise." },
      { en: 'Ask Him to settle your identity so deeply that no one else’s words define you.', fr: "Demande-Lui d'ancrer ton identité si profondément que les paroles d'un autre ne te définissent pas." },
    ],
    resourceTopics: ['dedications', 'identity', 'family-line'],
    freedom: {
      understand: {
        en: 'A name is not demonic. This category is relevant only where a naming ceremony or a name is known to have involved explicit spiritual dedication or invocation. No name is condemned here because of its language, its ethnicity, its African origin, its unusual meaning, or because someone dislikes it — and nobody is told to change a traditional name.',
        fr: "Un nom n'est pas démoniaque. Cette catégorie ne concerne que les cas où une cérémonie de nomination ou un nom est connu pour avoir comporté une consécration ou une invocation spirituelle explicite. Aucun nom n'est ici condamné à cause de sa langue, de son ethnie, de son origine africaine, d'un sens inhabituel, ou parce qu'il déplaît — et il n'est demandé à personne de changer un nom traditionnel.",
      },
      examples: [
        { en: 'A naming ceremony intentionally dedicating a child to a deity or spirit', fr: "Une cérémonie de nomination consacrant intentionnellement un enfant à une divinité ou à un esprit" },
        { en: 'A name deliberately given as part of a spiritual covenant', fr: "Un nom délibérément donné dans le cadre d'une alliance spirituelle" },
        { en: 'A ritual explicitly tying a child’s identity to another spiritual power', fr: "Un rituel liant explicitement l'identité d'un enfant à une autre puissance spirituelle" },
      ],
      inventory: true,
      standRefs: ['Isaiah 43:1', '1 Peter 2:9-10'],
    },
  },
  {
    movement: 'family',
    theme: { en: 'Destructive generational patterns', fr: 'Schémas destructeurs de génération en génération', es: 'Patrones destructivos generacionales', pt: 'Padrões destrutivos entre gerações', de: 'Zerstörerische Muster über Generationen', ru: 'Разрушительные родовые схемы', zh: '世代相傳的破壞性模式', ja: '世代を越えた破壊的パターン', ko: '대를 잇는 파괴적 패턴', ar: 'أنماط مدمّرة متوارثة', fa: 'الگوهای ویرانگر نسلی', hi: 'पीढ़ियों से चले आ रहे विनाशकारी ढर्रे', id: 'Pola merusak antar-generasi', sw: 'Mifumo haribifu ya vizazi', tl: 'Mapanirang mga ugali sa mga henerasyon', am: 'ከትውልድ ትውልድ የሚተላለፉ ጎጂ ልማዶች' },
    ref: 'Ezekiel 18:20',
    related: ['1 Peter 1:18-19', 'Romans 12:1-2'],
    reflection: {
      en: 'A pattern that repeats in a family may be learned, relational, behavioural, social, spiritual, or several of these at once. You do not have to determine the mechanism before you can ask God to stop you reproducing what is sinful or destructive. Ezekiel’s promise is that the guilt is not transferred; Romans’ promise is that the mind can be renewed.',
      fr: "Un schéma qui se répète dans une famille peut être appris, relationnel, comportemental, social, spirituel, ou plusieurs de ces choses à la fois. Tu n'as pas besoin d'en déterminer le mécanisme pour demander à Dieu de t'empêcher de reproduire ce qui est pécheur ou destructeur. La promesse d'Ézéchiel, c'est que la faute ne se transmet pas ; celle de Romains, c'est que l'intelligence peut être renouvelée.",
    },
    prompts: [
      { en: 'Ask the Holy Spirit where you have learned, accepted or repeated something that does not honour Christ.', fr: "Demande au Saint-Esprit où tu as appris, accepté ou répété quelque chose qui n'honore pas Christ." },
      { en: 'Repent for your own part in it, and ask for a renewed mind rather than mere willpower.', fr: "Repens-toi de ta propre part, et demande une intelligence renouvelée plutôt qu'une simple volonté." },
      { en: 'Name one practical change and one person who could hold you to it.', fr: "Nomme un changement concret et une personne qui pourrait t'y tenir." },
    ],
    resourceTopics: ['generational-patterns', 'discipleship', 'healing', 'family-line'],
    freedom: {
      understand: {
        en: 'This is a separate category from curses on purpose: a repeating pattern is not automatically a curse, and calling it one usually removes the very responsibility that would change it. Patterns people bring here include addiction, violence, sexual immorality, abuse, abandonment, bitterness, dishonesty, destructive money behaviour, repeated occult involvement, idolatry, unhealthy relationship patterns and unforgiveness.',
        fr: "C'est délibérément une catégorie distincte des malédictions : un schéma récurrent n'est pas automatiquement une malédiction, et l'appeler ainsi supprime en général la responsabilité même qui pourrait le changer. Parmi les schémas apportés ici : dépendance, violence, immoralité sexuelle, maltraitance, abandon, amertume, mensonge, comportements financiers destructeurs, implication occulte répétée, idolâtrie, schémas relationnels malsains et refus de pardonner.",
      },
      inventory: true,
      modules: ['practicalObedience'],
      standRefs: ['Ezekiel 18:20', 'Romans 12:1-2'],
    },
  },
  {
    movement: 'family',
    theme: { en: 'Standing free: the family line in prayer', fr: 'Debout et libre : la lignée dans la prière', es: 'Libres en pie: el linaje en oración', pt: 'De pé e livre: a linhagem em oração', de: 'Frei stehen: die Familienlinie im Gebet', ru: 'Стоять свободным: род в молитве', zh: '站立得自由：為家族禱告', ja: '自由に立つ——家系を祈る', ko: '자유롭게 서다: 가문을 위한 기도', ar: 'الوقوف في الحرية: العائلة في الصلاة', fa: 'ایستادن در آزادی: خاندان در دعا', hi: 'स्वतंत्र खड़े होना: वंश के लिए प्रार्थना', id: 'Berdiri merdeka: garis keluarga dalam doa', sw: 'Kusimama huru: ukoo katika maombi', tl: 'Malayang tumayo: ang angkan sa panalangin', am: 'በነጻነት መቆም፦ የቤተሰብ ሐረግ በጸሎት' },
    ref: 'Romans 8:31-39',
    related: ['Galatians 3:13-14', 'Colossians 2:13-15', '2 Corinthians 5:17'],
    reflection: {
      en: 'Today gathers what you have already prayed rather than adding anything new. Romans 8 is where it belongs: God is for us, Christ is interceding, and nothing in all creation can separate us from His love. This is a longer session, and it is meant to end in confidence rather than in exhaustion.',
      fr: "Aujourd'hui rassemble ce que tu as déjà prié plutôt que d'y ajouter du neuf. Romains 8 en est le lieu : Dieu est pour nous, Christ intercède, et rien dans toute la création ne peut nous séparer de Son amour. C'est un temps plus long, et il doit s'achever dans l'assurance et non dans l'épuisement.",
    },
    prompts: [
      { en: 'Bring together the known things you have already placed before God in this movement.', fr: "Rassemble les choses connues que tu as déjà déposées devant Dieu dans ce mouvement." },
      { en: 'Entrust the unknown to Him again, and refuse fear and speculation deliberately.', fr: "Remets-Lui de nouveau l'inconnu, et refuse délibérément la peur et la spéculation." },
      { en: 'Pray blessing forward over the generations after you.', fr: 'Prie une bénédiction en avant, sur les générations qui te suivent.' },
    ],
    practice: {
      en: 'Give this day more time than usual, and stop when you are done rather than when you feel something. Nothing here depends on intensity.',
      fr: "Donne à cette journée plus de temps que d'habitude, et arrête-toi quand tu as terminé plutôt que quand tu ressens quelque chose. Rien ici ne dépend de l'intensité.",
    },
    resourceTopics: ['family-line', 'deliverance', 'renunciation', 'curses'],
    freedom: {
      understand: {
        en: 'No new categories are introduced today. Everything prayed here has already been explained in an earlier day, so nothing can be smuggled in at the end of the movement. If nothing came to mind on any of those days, this prayer is still complete — it ends with entrusting the unknown and blessing the generations after you.',
        fr: "Aucune catégorie nouvelle n'est introduite aujourd'hui. Tout ce qui est prié ici a déjà été expliqué un jour précédent, si bien que rien ne peut être glissé en fin de mouvement. Si rien ne t'est venu ces jours-là, cette prière reste complète — elle s'achève en remettant l'inconnu et en bénissant les générations qui te suivent.",
      },
      inventory: true,
      modules: ['forgive', 'practicalObedience'],
      fasting: true,
      standRefs: ['Romans 8:31-39', 'Colossians 2:13-15', '2 Corinthians 5:17'],
    },
  },

  // ── Movement 4 · Standing in spiritual warfare ────────────────────────────
  {
    movement: 'warfare',
    theme: { en: 'Pulling down strongholds', fr: 'Renverser les forteresses', es: 'Derribar fortalezas', pt: 'Derrubar fortalezas', de: 'Festungen niederreißen', ru: 'Разрушение твердынь', zh: '攻破堅固的營壘', ja: '要塞を打ち倒す', ko: '견고한 진을 무너뜨리다', ar: 'هدم الحصون', fa: 'ویران کردن قلعه‌ها', hi: 'गढ़ों को ढाना', id: 'Meruntuhkan benteng', sw: 'Kubomoa ngome', tl: 'Pagbagsak ng mga muog', am: 'ምሽጎችን ማፍረስ' },
    ref: '2 Corinthians 10:3-5',
    related: ['Romans 12:2', 'John 8:31-32'],
    reflection: {
      en: 'Paul defines a stronghold himself, and he defines it as an argument: reasonings and lofty opinions raised against the knowledge of God, and thoughts to be taken captive to obey Christ. He does not name a spirit; he names a belief. That is not a smaller battle — it is the one most people actually lose.',
      fr: "Paul définit lui-même une forteresse, et il la définit comme un raisonnement : des raisonnements et des hauteurs qui s'élèvent contre la connaissance de Dieu, et des pensées à amener captives à l'obéissance de Christ. Il ne nomme pas un esprit ; il nomme une croyance. Ce n'est pas un combat moindre — c'est celui que la plupart perdent réellement.",
    },
    prompts: [
      { en: 'Name one lie you keep believing about God, about yourself, or about your future.', fr: "Nomme un mensonge que tu continues de croire sur Dieu, sur toi-même ou sur ton avenir." },
      { en: 'Set it beside Scripture and say out loud what God says instead.', fr: "Place-le à côté de l'Écriture et dis à voix haute ce que Dieu dit à la place." },
      { en: 'Ask for a renewed mind, and choose one practical response for today.', fr: "Demande une intelligence renouvelée, et choisis une réponse concrète pour aujourd'hui." },
    ],
    resourceTopics: ['strongholds', 'spiritual-warfare', 'discipleship'],
    freedom: {
      understand: {
        en: 'A stronghold in this passage is a pattern of thought — a lie, an argument, a settled belief — that stands against what God has said. It is not automatically a demon, and turning every recurring thought into one leaves you with nothing to actually do about it.',
        fr: "Dans ce passage, une forteresse est un schéma de pensée — un mensonge, un raisonnement, une conviction installée — qui se dresse contre ce que Dieu a dit. Ce n'est pas automatiquement un démon, et faire de chaque pensée récurrente un démon ne te laisse rien à faire concrètement.",
      },
      modules: ['practicalObedience'],
      standRefs: ['2 Corinthians 10:3-5', 'John 8:31-32'],
    },
  },
  {
    movement: 'warfare',
    theme: { en: 'Fear, oppression and intimidation', fr: 'Peur, oppression et intimidation', es: 'Miedo, opresión e intimidación', pt: 'Medo, opressão e intimidação', de: 'Furcht, Bedrückung und Einschüchterung', ru: 'Страх, угнетение и запугивание', zh: '懼怕、壓制與威嚇', ja: '恐れ・圧迫・脅し', ko: '두려움과 억압과 위협', ar: 'الخوف والاضطهاد والترهيب', fa: 'ترس، فشار و ارعاب', hi: 'भय, दबाव और धमकी', id: 'Ketakutan, tekanan, dan intimidasi', sw: 'Hofu, dhiki na vitisho', tl: 'Takot, pang-aapi at pananakot', am: 'ፍርሃት፣ ጭቆናና ማስፈራራት' },
    ref: '2 Timothy 1:7',
    related: ['Psalm 27:1-3', 'Romans 8:31-39'],
    reflection: {
      en: 'Paul writes to a young man who was afraid, and reminds him what God has actually given: power, love and a sound mind. Fear is real and it can be resisted in Jesus’ name — and fear is also something the body and the mind produce for ordinary reasons. Both can be true on the same day, and neither one has to be diagnosed before you pray.',
      fr: "Paul écrit à un jeune homme qui avait peur, et lui rappelle ce que Dieu a réellement donné : force, amour et sagesse. La peur est réelle et peut être repoussée au nom de Jésus — et la peur est aussi quelque chose que le corps et l'esprit produisent pour des raisons ordinaires. Les deux peuvent être vraies le même jour, et il n'est pas nécessaire de trancher avant de prier.",
    },
    prompts: [
      { en: 'Say to God what you are actually afraid of, in plain words.', fr: "Dis à Dieu ce dont tu as réellement peur, en mots simples." },
      { en: 'In the name of Jesus Christ, refuse to let fear rule your decisions.', fr: "Au nom de Jésus-Christ, refuse que la peur gouverne tes décisions." },
      { en: 'Ask the Holy Spirit to strengthen you in truth, love, wisdom and self-control.', fr: "Demande au Saint-Esprit de t'affermir dans la vérité, l'amour, la sagesse et la maîtrise de soi." },
    ],
    safetyNote: {
      en: 'Prayer and appropriate care are not enemies. Nothing in this plan asks you to stop medication, psychiatric care, therapy or medical treatment. If you are in severe distress, cannot function, hear or see things others do not, or have thoughts of harming yourself or anyone else, contact a doctor or your local emergency service today — and keep praying.',
      fr: "La prière et des soins appropriés ne sont pas ennemis. Rien dans ce parcours ne te demande d'arrêter un traitement, un suivi psychiatrique, une thérapie ou des soins médicaux. Si tu es en grande détresse, si tu ne peux plus fonctionner, si tu entends ou vois des choses que d'autres ne perçoivent pas, ou si tu as des pensées de te faire du mal ou d'en faire à autrui, contacte aujourd'hui un médecin ou les services d'urgence — et continue de prier.",
    },
    resourceTopics: ['fear', 'spiritual-warfare', 'healing'],
    freedom: {
      understand: {
        en: 'Fear is not automatically demonic, and an illness, a delay, a financial problem, a difficulty conceiving, a relationship breakdown, a mental-health condition or a recurring hardship is never treated in this plan as proof of a spiritual attack. If you have recorded a disturbing dream, this plan will pray with you for peace, protection and discernment — it will not interpret the dream, and it will never tell you what it proves.',
        fr: "La peur n'est pas automatiquement démoniaque, et une maladie, un retard, un problème financier, une difficulté à concevoir, une rupture, un trouble psychique ou une épreuve récurrente ne sont jamais traités dans ce parcours comme la preuve d'une attaque spirituelle. Si tu as noté un rêve troublant, ce parcours priera avec toi pour la paix, la protection et le discernement — il n'interprétera pas le rêve et ne te dira jamais ce qu'il prouverait.",
      },
      standRefs: ['2 Timothy 1:7', 'Psalm 27:1-3'],
    },
  },
  {
    movement: 'warfare',
    theme: { en: 'The armour of God', fr: "L'armure de Dieu", es: 'La armadura de Dios', pt: 'A armadura de Deus', de: 'Die Waffenrüstung Gottes', ru: 'Всеоружие Божие', zh: '神所賜的全副軍裝', ja: '神の武具', ko: '하나님의 전신갑주', ar: 'سلاح الله الكامل', fa: 'اسلحهٔ کامل خدا', hi: 'परमेश्वर के सारे हथियार', id: 'Perlengkapan senjata Allah', sw: 'Silaha zote za Mungu', tl: 'Ang baluti ng Diyos', am: 'የእግዚአብሔር የጦር ዕቃ' },
    ref: 'Ephesians 6:10-18',
    related: ['Isaiah 59:17', '1 Thessalonians 5:8'],
    reflection: {
      en: 'Every piece Paul lists is something God has given and something a believer lives: truth, righteousness, the readiness of the gospel of peace, faith, salvation, His Word and prayer. It is not a visualisation exercise and it is not a formula to recite each morning; it is a description of a life, and Paul’s repeated instruction with it is simply to stand.',
      fr: "Chaque pièce que Paul énumère est un don de Dieu et une manière de vivre : la vérité, la justice, le zèle de l'Évangile de paix, la foi, le salut, Sa Parole et la prière. Ce n'est pas un exercice de visualisation ni une formule à réciter chaque matin ; c'est la description d'une vie, et l'instruction que Paul y répète est simplement de tenir ferme.",
    },
    prompts: [
      { en: 'Pray through the passage one piece at a time, asking for what each one actually is.', fr: "Prie le passage pièce par pièce, en demandant ce que chacune est réellement." },
      { en: 'Ask where you have been standing in your own strength instead.', fr: "Demande où tu tiens debout par tes propres forces à la place." },
      { en: 'End where Paul ends: praying at all times in the Spirit, for yourself and for others.', fr: "Termine là où Paul termine : en priant en tout temps par l'Esprit, pour toi et pour les autres." },
    ],
    resourceTopics: ['armor-of-god', 'spiritual-warfare', 'scripture-prayer'],
    freedom: {
      standRefs: ['Ephesians 6:10-18'],
    },
  },
  {
    movement: 'warfare',
    theme: { en: 'Submit to God, resist the devil', fr: 'Se soumettre à Dieu, résister au diable', es: 'Sométanse a Dios, resistan al diablo', pt: 'Sujeitem-se a Deus, resistam ao diabo', de: 'Gott unterordnen, dem Teufel widerstehen', ru: 'Покоритесь Богу, противостаньте диаволу', zh: '順服神，抵擋魔鬼', ja: '神に従い、悪魔に立ち向かう', ko: '하나님께 복종하고 마귀를 대적하라', ar: 'اخضعوا لله وقاوموا إبليس', fa: 'تسلیم خدا شوید، در برابر ابلیس بایستید', hi: 'परमेश्वर के अधीन हों, शैतान का सामना करें', id: 'Tunduk kepada Allah, lawan Iblis', sw: 'Mtii Mungu, mpingeni Ibilisi', tl: 'Pasakop sa Diyos, labanan ang diyablo', am: 'ለእግዚአብሔር ተገዙ፣ ዲያብሎስን ተቃወሙ' },
    ref: 'James 4:7-8',
    related: ['1 Peter 5:6-9', 'Ephesians 4:26-27'],
    reflection: {
      en: 'James keeps the order: submit to God first, then resist the devil, and he immediately adds — draw near to God, cleanse your hands, purify your hearts. Resistance in Scripture is not mostly shouting; it is submission, obedience, repentance, faith, refusing temptation and prayer. Paul adds one very ordinary example: deal with your anger before nightfall and give no opportunity to the devil.',
      fr: "Jacques garde l'ordre : soumettez-vous d'abord à Dieu, puis résistez au diable, et il ajoute aussitôt — approchez-vous de Dieu, purifiez vos mains, purifiez vos cœurs. Dans l'Écriture, résister n'est pas surtout crier ; c'est se soumettre, obéir, se repentir, croire, refuser la tentation et prier. Paul en donne un exemple très ordinaire : règle ta colère avant la nuit et ne donne pas accès au diable.",
    },
    prompts: [
      { en: 'Submit one specific area to God before you resist anything.', fr: "Soumets un domaine précis à Dieu avant de résister à quoi que ce soit." },
      { en: 'Name the temptation you keep negotiating with, and refuse it in Jesus’ name.', fr: "Nomme la tentation avec laquelle tu négocies sans cesse, et refuse-la au nom de Jésus." },
      { en: 'Ask God for the ordinary obedience that closes the door: honesty, forgiveness, a boundary, a conversation.', fr: "Demande à Dieu l'obéissance ordinaire qui ferme la porte : honnêteté, pardon, une limite, une conversation." },
    ],
    resourceTopics: ['spiritual-warfare', 'repentance', 'discipleship'],
    freedom: {
      modules: ['practicalObedience'],
      standRefs: ['James 4:7-8', '1 Peter 5:6-9'],
    },
  },
  {
    movement: 'warfare',
    theme: { en: 'Protection and confidence in God', fr: 'Protection et assurance en Dieu', es: 'Protección y confianza en Dios', pt: 'Proteção e confiança em Deus', de: 'Schutz und Zuversicht bei Gott', ru: 'Защита и упование на Бога', zh: '神的保護與信靠', ja: '神の守りと確信', ko: '하나님의 보호와 확신', ar: 'الحماية والثقة بالله', fa: 'حفاظت و اطمینان در خدا', hi: 'परमेश्वर में सुरक्षा और भरोसा', id: 'Perlindungan dan keyakinan pada Allah', sw: 'Ulinzi na tumaini kwa Mungu', tl: 'Proteksiyon at pagtitiwala sa Diyos', am: 'በእግዚአብሔር ጥበቃና እምነት' },
    ref: 'Psalm 91:1-16',
    related: ['Psalm 121:1-8', 'Romans 8:31-39'],
    reflection: {
      en: 'Psalm 91 is a psalm of confidence, not a charm. It was quoted at Jesus by the tempter and He refused to use it that way — He would not put God to the test. Faithful believers in Scripture were protected and faithful believers in Scripture suffered, and both were held by the same God. Pray it for confidence, not as insurance.',
      fr: "Le Psaume 91 est un psaume d'assurance, non une amulette. Le tentateur l'a cité à Jésus, et Il a refusé de s'en servir ainsi — Il ne voulait pas tenter Dieu. Dans l'Écriture, des croyants fidèles ont été protégés et des croyants fidèles ont souffert, tenus par le même Dieu. Prie-le pour l'assurance, non comme une assurance-vie.",
    },
    prompts: [
      { en: 'Ask God for protection for your household, and mean it as a request rather than a guarantee.', fr: "Demande à Dieu de protéger ta maison, et entends-le comme une demande et non comme une garantie." },
      { en: 'Ask for wisdom, discernment and courage — the everyday forms His protection often takes.', fr: "Demande sagesse, discernement et courage — les formes quotidiennes que prend souvent Sa protection." },
      { en: 'Tell Him you will trust Him whether or not you are spared what you fear.', fr: "Dis-Lui que tu Lui feras confiance, que tu sois épargné ou non de ce que tu crains." },
    ],
    resourceTopics: ['fear', 'scripture-prayer', 'spiritual-warfare'],
    freedom: {
      fasting: true,
      standRefs: ['Psalm 91:1-16', 'Psalm 121:1-8'],
    },
  },
  {
    movement: 'warfare',
    theme: { en: 'Praying and proclaiming the Word', fr: 'Prier et proclamer la Parole', es: 'Orar y proclamar la Palabra', pt: 'Orar e proclamar a Palavra', de: 'Das Wort beten und bekennen', ru: 'Молиться и провозглашать Слово', zh: '禱告並宣講神的話', ja: 'みことばを祈り、宣言する', ko: '말씀으로 기도하고 선포하라', ar: 'الصلاة بالكلمة وإعلانها', fa: 'دعا و اعلام کلام', hi: 'वचन से प्रार्थना और घोषणा', id: 'Berdoa dan memberitakan Firman', sw: 'Kuomba na kutangaza Neno', tl: 'Ipanalangin at ipahayag ang Salita', am: 'ቃሉን መጸለይና ማወጅ' },
    ref: 'Ephesians 6:17-18',
    related: ['Hebrews 4:12', 'Psalm 119:9-11'],
    reflection: {
      en: 'The sword of the Spirit is the word of God, and Paul joins it immediately to praying at all times. Praying Scripture is simply agreeing with God about what He has already said: read it, understand it, thank Him for it, ask Him for it, respond to it, and stand on it. A quotation of the Bible and your own declaration based on it are two different kinds of speech, and it is worth keeping them distinct in your own mouth.',
      fr: "L'épée de l'Esprit est la parole de Dieu, et Paul y joint aussitôt la prière en tout temps. Prier l'Écriture, c'est simplement se mettre d'accord avec Dieu sur ce qu'Il a déjà dit : la lire, la comprendre, L'en remercier, la Lui demander, y répondre, et s'y appuyer. Une citation de la Bible et ta propre déclaration fondée sur elle sont deux paroles différentes, et il vaut la peine de les distinguer dans ta propre bouche.",
    },
    prompts: [
      { en: 'Take one verse from this plan and pray it back to God in your own words.', fr: "Prends un verset de ce parcours et rends-le à Dieu dans tes propres mots." },
      { en: 'Thank Him for what it says about Him before you ask Him for anything from it.', fr: "Remercie-Le pour ce qu'il dit de Lui avant de Lui demander quoi que ce soit à partir de lui." },
      { en: 'Choose one passage to memorise this week.', fr: 'Choisis un passage à mémoriser cette semaine.' },
    ],
    practice: {
      en: 'Pray aloud if you are able. Speaking a prayer aloud can help you pray deliberately and attentively — the power is not in volume, repetition or exact wording, but in God.',
      fr: "Prie à voix haute si tu le peux. Dire une prière à voix haute aide à prier délibérément et avec attention — la puissance n'est ni dans le volume, ni dans la répétition, ni dans la formulation exacte, mais en Dieu.",
    },
    resourceTopics: ['scripture-prayer', 'prayer', 'spiritual-warfare'],
    freedom: {
      standRefs: ['Ephesians 6:17-18', 'Psalm 119:9-11'],
    },
  },

  // ── Movement 5 · Filled, restored & walking in freedom ────────────────────
  {
    movement: 'walking',
    theme: { en: 'Be filled with the Holy Spirit', fr: "Être rempli du Saint-Esprit", es: 'Sean llenos del Espíritu Santo', pt: 'Sejam cheios do Espírito Santo', de: 'Erfüllt werden mit dem Heiligen Geist', ru: 'Исполняйтесь Духом Святым', zh: '被聖靈充滿', ja: '聖霊に満たされる', ko: '성령으로 충만하라', ar: 'امتلئوا بالروح القدس', fa: 'از روح‌القدس پر شوید', hi: 'पवित्र आत्मा से परिपूर्ण होना', id: 'Dipenuhi Roh Kudus', sw: 'Kujazwa Roho Mtakatifu', tl: 'Mapuspos ng Espiritu Santo', am: 'በመንፈስ ቅዱስ መሞላት' },
    ref: 'Ephesians 5:18-20',
    related: ['Galatians 5:22-25', 'Romans 8:14'],
    reflection: {
      en: 'Deliverance is not mainly the removal of something; the goal is a life increasingly yielded to God. Paul’s contrast is with drunkenness — with what else governs a person — and what follows being filled is entirely ordinary: singing, thanksgiving, and the fruit of the Spirit growing in a real character over time.',
      fr: "La délivrance n'est pas d'abord le retrait de quelque chose ; le but est une vie de plus en plus livrée à Dieu. Le contraste de Paul est avec l'ivresse — avec ce qui gouverne autrement une personne — et ce qui suit le fait d'être rempli est tout à fait ordinaire : le chant, l'action de grâces, et le fruit de l'Esprit qui croît dans un caractère réel avec le temps.",
    },
    prompts: [
      { en: 'Ask the Holy Spirit to fill you, and to renew your desires and habits.', fr: "Demande au Saint-Esprit de te remplir, et de renouveler tes désirs et tes habitudes." },
      { en: 'Name one fruit of the Spirit that is clearly missing, and ask for it by name.', fr: "Nomme un fruit de l'Esprit qui manque visiblement, et demande-le nommément." },
      { en: 'Thank Him, out loud, for something specific from these twenty-seven days.', fr: "Remercie-Le, à voix haute, pour une chose précise de ces vingt-sept jours." },
    ],
    resourceTopics: ['holy-spirit', 'discipleship', 'spiritual-formation'],
    freedom: {
      standRefs: ['Ephesians 5:18-20', 'Galatians 5:22-25'],
    },
  },
  {
    movement: 'walking',
    theme: { en: 'Replacing what was pulled down', fr: 'Remplacer ce qui a été renversé', es: 'Reemplazar lo que fue derribado', pt: 'Substituir o que foi derrubado', de: 'Ersetzen, was niedergerissen wurde', ru: 'Заменить то, что разрушено', zh: '用美善填補拆毀之處', ja: '取り除いた場所を満たす', ko: '허문 자리를 채우라', ar: 'استبدال ما هُدم', fa: 'جایگزینی آنچه ویران شد', hi: 'जो ढाया गया उसकी जगह भरना', id: 'Mengganti yang telah diruntuhkan', sw: 'Kujaza mahali palipobomolewa', tl: 'Palitan ang binuwag', am: 'የፈረሰውን መተካት' },
    ref: 'Philippians 4:8-9',
    related: ['Romans 12:1-2', 'Ephesians 4:22-32'],
    reflection: {
      en: 'Paul never stops at "put off". Every removal in Ephesians 4 has a replacement attached: the thief works, the bitter speaker builds up, the liar tells the truth. Philippians tells you what to fill your mind with and then adds — practise these things. Renouncing something and leaving the space empty is how people end up back where they started.',
      fr: "Paul ne s'arrête jamais au « dépouillez-vous ». Chaque retrait d'Éphésiens 4 vient avec un remplacement : le voleur travaille, celui qui blesse édifie, le menteur dit la vérité. Philippiens dit de quoi remplir ta pensée, puis ajoute : mettez ces choses en pratique. Renoncer à quelque chose en laissant la place vide, c'est ainsi qu'on se retrouve à son point de départ.",
    },
    prompts: [
      { en: 'For each thing you have renounced, ask God what should take its place.', fr: "Pour chaque chose à laquelle tu as renoncé, demande à Dieu ce qui doit prendre sa place." },
      { en: 'Ask for help with the practical shape of that: a habit, a person, a rhythm, a boundary.', fr: "Demande de l'aide pour la forme concrète : une habitude, une personne, un rythme, une limite." },
      { en: 'Thank Him that He does not leave a life empty.', fr: "Remercie-Le : Il ne laisse pas une vie vide." },
    ],
    practice: {
      en: 'Write down one replacement pair: occult consultation → prayer, Scripture and wise Christian counsel; bitterness → forgiveness, a boundary and prayer; a destructive habit → accountability and a new habit; fear → Scripture, prayer and support.',
      fr: "Note une paire de remplacement : consultation occulte → prière, Écriture et conseil chrétien avisé ; amertume → pardon, une limite et la prière ; habitude destructrice → redevabilité et une nouvelle habitude ; peur → Écriture, prière et soutien.",
    },
    resourceTopics: ['discipleship', 'spiritual-formation', 'healing'],
    freedom: {
      modules: ['practicalObedience'],
      standRefs: ['Philippians 4:8-9', 'Ephesians 4:22-32'],
    },
  },
  {
    movement: 'walking',
    theme: { en: 'Community, confession and support', fr: 'Communauté, confession et soutien', es: 'Comunidad, confesión y apoyo', pt: 'Comunidade, confissão e apoio', de: 'Gemeinschaft, Bekenntnis und Beistand', ru: 'Общение, исповедь и поддержка', zh: '團契、認罪與扶持', ja: '交わり・告白・支え', ko: '공동체와 고백과 지지', ar: 'الشركة والاعتراف والسند', fa: 'جماعت، اعتراف و پشتیبانی', hi: 'संगति, अंगीकार और सहारा', id: 'Persekutuan, pengakuan, dan dukungan', sw: 'Ushirika, kuungama na msaada', tl: 'Pagsasama, pag-amin at suporta', am: 'ኅብረት፣ መናዘዝና ድጋፍ' },
    ref: 'James 5:16',
    related: ['Hebrews 10:24-25', 'Galatians 6:1-2'],
    reflection: {
      en: 'Freedom that isolates you is going the wrong way. James puts confession and prayer between believers; Hebrews says keep meeting; Galatians tells the spiritually mature to restore gently and to watch themselves while they do it. None of that requires public disclosure of private details — it requires one or two people who actually know you.',
      fr: "Une liberté qui t'isole va dans la mauvaise direction. Jacques place la confession et la prière entre croyants ; Hébreux dit de continuer à se réunir ; Galates demande aux plus mûrs de relever avec douceur et de prendre garde à eux-mêmes en le faisant. Rien de cela n'exige de divulguer publiquement des détails privés — cela exige une ou deux personnes qui te connaissent vraiment.",
    },
    prompts: [
      { en: 'Ask God for one trusted, mature believer you can speak with.', fr: "Demande à Dieu un croyant mûr et digne de confiance à qui parler." },
      { en: 'Pray for your church, and for your part in it rather than only what you need from it.', fr: "Prie pour ton église, et pour ta part en elle plutôt que seulement pour ce que tu en attends." },
      { en: 'Ask for the humility to receive help, and the wisdom to know what to share and with whom.', fr: "Demande l'humilité de recevoir de l'aide, et la sagesse de savoir quoi partager, et avec qui." },
    ],
    practice: {
      en: 'Consider speaking with a pastor or a mature believer about anything from these thirty days that is still unresolved. You are never required to make private details public.',
      fr: "Envisage de parler à un pasteur ou à un croyant mûr de ce qui, de ces trente jours, reste non résolu. Il ne t'est jamais demandé de rendre publics des détails privés.",
    },
    resourceTopics: ['community', 'church', 'discipleship'],
    freedom: {
      modules: ['practicalObedience'],
      standRefs: ['James 5:16', 'Hebrews 10:24-25'],
    },
  },
  {
    movement: 'walking',
    theme: { en: 'Abide in Christ and walk free', fr: 'Demeurer en Christ et marcher libre', es: 'Permanecer en Cristo y andar en libertad', pt: 'Permanecer em Cristo e andar livre', de: 'In Christus bleiben und frei leben', ru: 'Пребывать во Христе и ходить свободным', zh: '住在基督裡，自由而行', ja: 'キリストにとどまり、自由に歩む', ko: '그리스도 안에 거하며 자유롭게 걸으라', ar: 'اثبتوا في المسيح واسلكوا أحرارًا', fa: 'در مسیح بمانید و آزاد گام بردارید', hi: 'मसीह में बने रहें और स्वतंत्र चलें', id: 'Tinggal dalam Kristus dan hidup merdeka', sw: 'Kukaa ndani ya Kristo na kutembea huru', tl: 'Manatili kay Cristo at lumakad nang malaya', am: 'በክርስቶስ መኖርና በነጻነት መራመድ' },
    ref: 'John 15:1-11',
    related: ['Galatians 5:1', 'Colossians 2:6-7'],
    reflection: {
      en: 'The plan ends where it began: with Christ. Jesus does not tell the disciples to strive; He tells them to remain in Him, because apart from Him they can do nothing — and He says it so that His joy would be in them. Christian freedom is not mainly independence from something. It is a life increasingly rooted in Jesus Christ.',
      fr: "Le parcours s'achève là où il a commencé : en Christ. Jésus ne dit pas aux disciples de s'efforcer ; Il leur dit de demeurer en Lui, car sans Lui ils ne peuvent rien faire — et Il le dit pour que Sa joie soit en eux. La liberté chrétienne n'est pas d'abord une indépendance à l'égard de quelque chose. C'est une vie de plus en plus enracinée en Jésus-Christ.",
    },
    prompts: [
      { en: 'Thank God for what He has done in these thirty days, however quiet it was.', fr: "Remercie Dieu pour ce qu'Il a fait en ces trente jours, si discret que ce soit." },
      { en: 'Surrender what is still unknown, and refuse the fear of having missed something.', fr: "Remets ce qui reste inconnu, et refuse la peur d'avoir manqué quelque chose." },
      { en: 'Ask the Holy Spirit to keep leading you, and choose the habits you will carry forward.', fr: "Demande au Saint-Esprit de continuer à te conduire, et choisis les habitudes que tu emporteras." },
    ],
    resourceTopics: ['discipleship', 'holy-spirit', 'spiritual-formation'],
    freedom: {
      understand: {
        en: 'You do not need to keep discovering more in order to be safe. If nothing dramatic happened in these thirty days, nothing is missing: you have prayed Scripture, brought your life and what you know of your history before Christ, repented where repentance was called for, renounced what you did not want allegiance to, and learned to ask the Holy Spirit to lead you. That is the whole of it, and it continues tomorrow in ordinary discipleship.',
        fr: "Tu n'as pas besoin de continuer à découvrir davantage pour être en sécurité. Si rien de spectaculaire ne s'est produit en ces trente jours, rien ne manque : tu as prié l'Écriture, apporté ta vie et ce que tu sais de ton histoire devant Christ, tu t'es repenti là où la repentance était requise, tu as renoncé à ce dont tu ne voulais pas l'allégeance, et tu as appris à demander au Saint-Esprit de te conduire. C'est tout, et cela continue demain dans une simple vie de disciple.",
      },
      standRefs: ['John 15:1-11', 'Galatians 5:1'],
    },
  },
];

export default DAYS;
