// Draft engaged-plan days on the shared guided-plan model.
// English/French prose is authored here; the other 14 languages are lazy JSON
// overlays in translations/covenant21/. All day titles are authored inline.
// No Scripture text is stored. Partner tokens never infer gender or pronouns.
// Role reflections stay hidden until their separate review is approved.
export const DAYS = [
  {
    "theme": {
      "en": "Christ at the center",
      "fr": "Christ au centre",
      "es": "Cristo en el centro",
      "pt": "Cristo no centro",
      "de": "Christus im Mittelpunkt",
      "ru": "Христос в центре",
      "zh": "以基督为中心",
      "ja": "キリストを中心に",
      "ko": "그리스도를 중심에",
      "ar": "المسيح في المركز",
      "fa": "مسیح در مرکز",
      "hi": "मसीह को केंद्र में रखें",
      "id": "Kristus sebagai pusat",
      "sw": "Kristo awe kiini",
      "tl": "Si Cristo ang sentro",
      "am": "ክርስቶስ በማዕከል"
    },
    "ref": "Matthew 6:33",
    "related": [
      "Colossians 1:15-18"
    ],
    "reflection": {
      "en": "Jesus directs our attention to God’s kingdom. Your coming marriage can serve that purpose; it cannot take Christ’s place.",
      "fr": "Jésus dirige notre attention vers le royaume de Dieu. Votre futur mariage peut servir ce but ; il ne peut pas prendre la place de Christ."
    },
    "prompts": [
      {
        "en": "For {partner}: deepen faith and love for Christ.",
        "fr": "Pour {partner} : approfondis la foi et l’amour pour Christ."
      },
      {
        "en": "Keep our relationship open to Your guidance.",
        "fr": "Garde notre relation ouverte à Ta direction."
      },
      {
        "en": "Help us seek Your kingdom before wedding plans.",
        "fr": "Aide-nous à chercher Ton royaume avant les préparatifs."
      }
    ],
    "selfPrompt": {
      "en": "Where am I expecting marriage to do what only God can?",
      "fr": "Où est-ce que j’attends du mariage ce que Dieu seul peut donner ?"
    },
    "practice": {
      "en": "Begin today’s prayer with thanks for Christ.",
      "fr": "Commence la prière par un remerciement pour Christ."
    },
    "conversationPrompt": {
      "en": "What helps each of us put Christ first?",
      "fr": "Qu’est-ce qui aide chacun à donner la première place à Christ ?"
    },
    "resourceTopics": [
      "premarital",
      "prayer"
    ],
    "prayTogether": {
      "en": "If you both wish, take a few minutes to pray through these prompts together. No second account is needed.",
      "fr": "Si vous le souhaitez tous deux, prenez quelques minutes pour prier ensemble avec ces pistes. Aucun second compte n’est nécessaire."
    }
  },
  {
    "theme": {
      "en": "Covenant beyond romance",
      "fr": "L’alliance au-delà des sentiments",
      "es": "El pacto más allá del romance",
      "pt": "Aliança além do romance",
      "de": "Bund über Verliebtheit hinaus",
      "ru": "Завет глубже романтики",
      "zh": "超越浪漫的盟约",
      "ja": "恋愛感情を超える契約",
      "ko": "설렘을 넘어서는 언약",
      "ar": "العهد أبعد من الرومانسية",
      "fa": "عهد فراتر از عاشقانه‌ها",
      "hi": "रोमांस से आगे की वाचा",
      "id": "Perjanjian melampaui romansa",
      "sw": "Agano zaidi ya hisia za mapenzi",
      "tl": "Tipan na higit sa romansa",
      "am": "ከፍቅር ስሜት የሚበልጥ ቃል ኪዳን"
    },
    "ref": "Genesis 2:24",
    "related": [
      "Matthew 19:4-6"
    ],
    "reflection": {
      "en": "Genesis describes leaving, joining, and becoming a new household. Covenant calls for steady faithfulness beyond changing feelings.",
      "fr": "La Genèse décrit le fait de quitter, de s’attacher et de former un nouveau foyer. L’alliance appelle une fidélité durable, au-delà des sentiments changeants."
    },
    "prompts": [
      {
        "en": "Teach us the weight and joy of commitment.",
        "fr": "Apprends-nous le poids et la joie de l’engagement."
      },
      {
        "en": "For {partner}: give wisdom about our shared future.",
        "fr": "Pour {partner} : donne la sagesse pour notre avenir commun."
      },
      {
        "en": "Form love that keeps honest promises.",
        "fr": "Forme un amour qui tient des promesses sincères."
      }
    ],
    "selfPrompt": {
      "en": "Which promise needs more care in my daily actions?",
      "fr": "Quelle promesse demande plus de soin dans mes actes ?"
    },
    "practice": {
      "en": "Keep one small commitment carefully today.",
      "fr": "Tiens avec soin un petit engagement aujourd’hui."
    },
    "conversationPrompt": {
      "en": "What will faithful commitment look like in ordinary life?",
      "fr": "À quoi ressemblera un engagement fidèle dans la vie ordinaire ?"
    },
    "resourceTopics": [
      "covenant",
      "marriage"
    ]
  },
  {
    "theme": {
      "en": "Knowing and serving each other",
      "fr": "Se connaître et se servir",
      "es": "Conocerse y servirse",
      "pt": "Conhecer e servir um ao outro",
      "de": "Einander kennen und dienen",
      "ru": "Узнавать друг друга и служить",
      "zh": "彼此了解与服侍",
      "ja": "互いを知り、仕える",
      "ko": "서로를 알아가고 섬기기",
      "ar": "أن نعرف بعضنا ونخدم بعضنا",
      "fa": "شناخت و خدمت به یکدیگر",
      "hi": "एक दूसरे को जानना और सेवा करना",
      "id": "Saling mengenal dan melayani",
      "sw": "Kujuana na kutumikiana",
      "tl": "Kilalanin at paglingkuran ang isa’t isa",
      "am": "መተዋወቅና መገልገል"
    },
    "ref": "Philippians 2:3-5",
    "related": [],
    "reflection": {
      "en": "Paul points believers toward Christ’s humility. Knowing each other means asking what serves, without assuming you already know.",
      "fr": "Paul invite les croyants à l’humilité de Christ. Se connaître, c’est demander ce qui aide, sans présumer de la réponse."
    },
    "prompts": [
      {
        "en": "For {partner}: give strength for today’s real needs.",
        "fr": "Pour {partner} : donne la force face aux besoins d’aujourd’hui."
      },
      {
        "en": "Free me from needing to win attention.",
        "fr": "Libère-moi du besoin d’attirer toute l’attention."
      },
      {
        "en": "Teach us to serve without keeping score.",
        "fr": "Apprends-nous à servir sans tenir les comptes."
      }
    ],
    "selfPrompt": {
      "en": "Where have I assumed instead of asking?",
      "fr": "Où ai-je présumé au lieu de demander ?"
    },
    "practice": {
      "en": "Ask what would help today, and listen.",
      "fr": "Demande ce qui aiderait aujourd’hui, puis écoute."
    },
    "conversationPrompt": {
      "en": "What small act of care matters most to you?",
      "fr": "Quel petit geste d’attention compte le plus pour toi ?"
    },
    "resourceTopics": [
      "character",
      "premarital"
    ]
  },
  {
    "theme": {
      "en": "Character for everyday life",
      "fr": "Le caractère au quotidien",
      "es": "Carácter para la vida diaria",
      "pt": "Caráter para o dia a dia",
      "de": "Charakter im Alltag",
      "ru": "Характер в повседневной жизни",
      "zh": "日常生活中的品格",
      "ja": "日々の暮らしに表れる品性",
      "ko": "일상에서 자라는 성품",
      "ar": "الشخصية في الحياة اليومية",
      "fa": "شخصیت در زندگی روزمره",
      "hi": "दैनिक जीवन के लिए चरित्र",
      "id": "Karakter dalam keseharian",
      "sw": "Tabia katika maisha ya kila siku",
      "tl": "Ugali sa araw-araw",
      "am": "በዕለት ተዕለት ሕይወት የሚታይ ባህርይ"
    },
    "ref": "Galatians 5:22-23",
    "related": [],
    "reflection": {
      "en": "The Spirit’s fruit grows in everyday choices. Patience, kindness, faithfulness, gentleness, and self-control matter long after the ceremony.",
      "fr": "Le fruit de l’Esprit grandit dans les choix ordinaires. Patience, bonté, fidélité, douceur et maîtrise de soi comptent bien après la cérémonie."
    },
    "prompts": [
      {
        "en": "Grow patience when plans change.",
        "fr": "Fais grandir la patience quand les projets changent."
      },
      {
        "en": "Make our kindness dependable in private.",
        "fr": "Rends notre bonté constante même en privé."
      },
      {
        "en": "For {partner}: strengthen gentleness and self-control.",
        "fr": "Pour {partner} : affermis douceur et maîtrise de soi."
      }
    ],
    "selfPrompt": {
      "en": "Which fruit needs room to grow in me?",
      "fr": "Quel fruit a besoin de place pour grandir en moi ?"
    },
    "practice": {
      "en": "Practice patience in one ordinary interruption.",
      "fr": "Exerce la patience face à une petite interruption."
    },
    "conversationPrompt": {
      "en": "When do we find it hardest to be gentle?",
      "fr": "Quand est-il le plus difficile pour nous d’être doux ?"
    },
    "resourceTopics": [
      "character"
    ]
  },
  {
    "theme": {
      "en": "Naming expectations",
      "fr": "Nommer nos attentes",
      "es": "Expresar las expectativas",
      "pt": "Expressar expectativas",
      "de": "Erwartungen aussprechen",
      "ru": "Говорить об ожиданиях",
      "zh": "说出彼此的期待",
      "ja": "期待を言葉にする",
      "ko": "기대를 말로 나누기",
      "ar": "التعبير عن التوقعات",
      "fa": "بیان انتظارها",
      "hi": "अपेक्षाएँ व्यक्त करना",
      "id": "Mengungkapkan harapan",
      "sw": "Kusema matarajio yetu",
      "tl": "Sabihin ang mga inaasahan",
      "am": "የምንጠብቀውን መግለጽ"
    },
    "ref": "Philippians 2:4",
    "related": [],
    "reflection": {
      "en": "Paul asks believers to notice one another’s interests. Naming expectations helps make room for both people instead of imposing a script.",
      "fr": "Paul invite les croyants à considérer les intérêts des autres. Nommer nos attentes permet de faire place à chacun sans imposer un scénario."
    },
    "prompts": [
      {
        "en": "Give us courage to name unspoken hopes.",
        "fr": "Donne-nous le courage de nommer nos espoirs silencieux."
      },
      {
        "en": "Keep us curious about our differences.",
        "fr": "Garde-nous attentifs à nos différences."
      },
      {
        "en": "Help us share responsibilities fairly.",
        "fr": "Aide-nous à partager équitablement les responsabilités."
      }
    ],
    "selfPrompt": {
      "en": "Which expectation have I treated as a rule?",
      "fr": "Quelle attente ai-je transformée en règle ?"
    },
    "practice": {
      "en": "Name one assumption without demanding agreement.",
      "fr": "Nomme une supposition sans exiger un accord."
    },
    "conversationPrompt": {
      "en": "What do we expect about chores, work, affection, time apart, and church?",
      "fr": "Qu’attendons-nous des tâches, du travail, de l’affection, du temps personnel et de l’Église ?"
    },
    "resourceTopics": [
      "communication",
      "premarital"
    ]
  },
  {
    "theme": {
      "en": "Words that build up",
      "fr": "Des paroles qui édifient",
      "es": "Palabras que edifican",
      "pt": "Palavras que edificam",
      "de": "Worte, die aufbauen",
      "ru": "Слова, которые созидают",
      "zh": "造就人的言语",
      "ja": "人を育てる言葉",
      "ko": "서로를 세우는 말",
      "ar": "كلام يبني",
      "fa": "سخنانی که بنا می‌کنند",
      "hi": "हौसला बढ़ाने वाले शब्द",
      "id": "Perkataan yang membangun",
      "sw": "Maneno yanayojenga",
      "tl": "Mga salitang nagpapatibay",
      "am": "የሚያንጹ ቃላት"
    },
    "ref": "Ephesians 4:29",
    "related": [
      "James 1:19"
    ],
    "reflection": {
      "en": "Paul asks that speech serve the listener’s good. Truth can be clear and gentle; listening is part of loving speech.",
      "fr": "Paul demande que nos paroles servent le bien de celui qui écoute. La vérité peut être claire et douce ; l’écoute fait partie d’une parole aimante."
    },
    "prompts": [
      {
        "en": "Make my words truthful and kind.",
        "fr": "Rends mes paroles vraies et bienveillantes."
      },
      {
        "en": "For {partner}: make space to speak freely.",
        "fr": "Pour {partner} : donne un espace pour parler librement."
      },
      {
        "en": "Teach us to listen before answering.",
        "fr": "Apprends-nous à écouter avant de répondre."
      }
    ],
    "selfPrompt": {
      "en": "When does defensiveness shape my response?",
      "fr": "Quand est-ce que je réponds sur la défensive ?"
    },
    "practice": {
      "en": "Listen to one concern without interrupting.",
      "fr": "Écoute une préoccupation sans interrompre."
    },
    "conversationPrompt": {
      "en": "What helps you feel heard when something matters?",
      "fr": "Qu’est-ce qui t’aide à te sentir écouté sur un sujet important ?"
    },
    "resourceTopics": [
      "communication",
      "listening"
    ]
  },
  {
    "theme": {
      "en": "Facing conflict with care",
      "fr": "Traverser les conflits avec respect",
      "es": "Afrontar el conflicto con cuidado",
      "pt": "Enfrentar conflitos com cuidado",
      "de": "Konflikte achtsam angehen",
      "ru": "Бережно проходить конфликты",
      "zh": "以关怀面对冲突",
      "ja": "思いやりをもって対立に向き合う",
      "ko": "배려하며 갈등 마주하기",
      "ar": "مواجهة الخلاف باهتمام",
      "fa": "رویارویی با اختلاف با احترام",
      "hi": "संवेदनशीलता से मतभेद सुलझाना",
      "id": "Menghadapi konflik dengan kepedulian",
      "sw": "Kukabili migogoro kwa kujali",
      "tl": "Harapin ang alitan nang may malasakit",
      "am": "ግጭትን በጥንቃቄ መጋፈጥ"
    },
    "ref": "James 1:19-20",
    "related": [],
    "reflection": {
      "en": "James connects listening with restraint in anger. Disagreement needs care; contempt, intimidation, and manipulation must not become normal.",
      "fr": "Jacques relie l’écoute à la retenue dans la colère. Les désaccords demandent du soin ; mépris, intimidation et manipulation ne doivent pas devenir habituels."
    },
    "prompts": [
      {
        "en": "Slow my angry reactions.",
        "fr": "Ralentis mes réactions de colère."
      },
      {
        "en": "For {partner}: bring safety and a voice.",
        "fr": "Pour {partner} : apporte la sécurité et la liberté de parler."
      },
      {
        "en": "Give us humility and wise help with conflict.",
        "fr": "Donne-nous humilité et aide avisée dans les conflits."
      }
    ],
    "selfPrompt": {
      "en": "What can I take responsibility for without excusing harm?",
      "fr": "De quoi puis-je répondre sans excuser le mal subi ?"
    },
    "practice": {
      "en": "If safe, agree how to pause and return calmly.",
      "fr": "Si c’est sans danger, convenez d’une pause puis d’une reprise calme."
    },
    "conversationPrompt": {
      "en": "What happens when one of us feels misunderstood?",
      "fr": "Que se passe-t-il quand l’un de nous se sent incompris ?"
    },
    "resourceTopics": [
      "conflict",
      "abuse-safety"
    ],
    "safetyNote": {
      "en": "If you feel unsafe, prioritize safety and trusted outside support. Prayer does not require staying in a threatening conversation or relationship.",
      "fr": "Si tu te sens en danger, donne priorité à ta sécurité et à un soutien extérieur fiable. Prier n’oblige pas à rester dans une conversation ou une relation menaçante."
    }
  },
  {
    "theme": {
      "en": "Repentance and forgiveness",
      "fr": "Repentance et pardon",
      "es": "Arrepentimiento y perdón",
      "pt": "Arrependimento e perdão",
      "de": "Umkehr und Vergebung",
      "ru": "Покаяние и прощение",
      "zh": "悔改与饶恕",
      "ja": "悔い改めと赦し",
      "ko": "회개와 용서",
      "ar": "التوبة والغفران",
      "fa": "توبه و بخشش",
      "hi": "मन फिराना और क्षमा",
      "id": "Pertobatan dan pengampunan",
      "sw": "Toba na msamaha",
      "tl": "Pagsisisi at pagpapatawad",
      "am": "ንስሐና ይቅርታ"
    },
    "ref": "Colossians 3:12-14",
    "related": [
      "Ephesians 4:31-32"
    ],
    "reflection": {
      "en": "Paul connects forgiveness with compassion and love. Repentance names harm and changes behavior; forgiveness does not erase accountability.",
      "fr": "Paul relie le pardon à la compassion et à l’amour. La repentance nomme le mal et change les actes ; le pardon n’efface pas la responsabilité."
    },
    "prompts": [
      {
        "en": "Help me acknowledge harm without excuses.",
        "fr": "Aide-moi à reconnaître le mal sans excuses."
      },
      {
        "en": "For {partner}: bring healing and trustworthy support.",
        "fr": "Pour {partner} : apporte guérison et soutien digne de confiance."
      },
      {
        "en": "Teach us mercy with truth and responsibility.",
        "fr": "Apprends-nous la miséricorde avec vérité et responsabilité."
      }
    ],
    "selfPrompt": {
      "en": "What apology needs changed action from me?",
      "fr": "Quelles excuses demandent un changement de ma part ?"
    },
    "practice": {
      "en": "Offer a specific apology where it is safe and appropriate.",
      "fr": "Présente des excuses précises si cela est approprié et sans danger."
    },
    "conversationPrompt": {
      "en": "What makes an apology honest and repair meaningful?",
      "fr": "Qu’est-ce qui rend des excuses sincères et une réparation réelle ?"
    },
    "resourceTopics": [
      "forgiveness",
      "abuse-safety"
    ],
    "safetyNote": {
      "en": "Forgiveness never requires silence about abuse, immediate trust, or remaining in danger. Safety, accountability, and qualified support can accompany prayer.",
      "fr": "Le pardon n’exige jamais le silence sur les violences, une confiance immédiate ou le maintien dans le danger. Sécurité, responsabilité et soutien qualifié peuvent accompagner la prière."
    }
  },
  {
    "theme": {
      "en": "Trust and honesty",
      "fr": "Confiance et honnêteté",
      "es": "Confianza y honestidad",
      "pt": "Confiança e honestidade",
      "de": "Vertrauen und Ehrlichkeit",
      "ru": "Доверие и честность",
      "zh": "信任与诚实",
      "ja": "信頼と誠実さ",
      "ko": "신뢰와 정직",
      "ar": "الثقة والصدق",
      "fa": "اعتماد و صداقت",
      "hi": "भरोसा और ईमानदारी",
      "id": "Kepercayaan dan kejujuran",
      "sw": "Uaminifu na ukweli",
      "tl": "Tiwala at katapatan",
      "am": "መተማመንና ቅንነት"
    },
    "ref": "Ephesians 4:25",
    "related": [],
    "reflection": {
      "en": "Truthfulness belongs to life together in Christ. Trust grows through reliable action; it is not proved through surveillance or forced disclosure.",
      "fr": "La vérité appartient à la vie commune en Christ. La confiance grandit par des actes fiables ; elle ne se prouve ni par la surveillance ni par des confidences forcées."
    },
    "prompts": [
      {
        "en": "Make my words and actions agree.",
        "fr": "Accorde mes paroles et mes actes."
      },
      {
        "en": "For {partner}: protect dignity and privacy.",
        "fr": "Pour {partner} : protège dignité et vie privée."
      },
      {
        "en": "Help us rebuild trust patiently where needed.",
        "fr": "Aide-nous à rebâtir patiemment la confiance si nécessaire."
      }
    ],
    "selfPrompt": {
      "en": "Where am I avoiding a truthful conversation?",
      "fr": "Quelle conversation vraie est-ce que j’évite ?"
    },
    "practice": {
      "en": "Follow through on something you said you would do.",
      "fr": "Fais ce que tu avais dit que tu ferais."
    },
    "conversationPrompt": {
      "en": "What helps us be honest without monitoring each other?",
      "fr": "Qu’est-ce qui aide à être honnêtes sans nous surveiller ?"
    },
    "resourceTopics": [
      "trust",
      "communication"
    ]
  },
  {
    "theme": {
      "en": "Intimacy with dignity",
      "fr": "L’intimité dans la dignité",
      "es": "Intimidad con dignidad",
      "pt": "Intimidade com dignidade",
      "de": "Intimität in Würde",
      "ru": "Близость с уважением к достоинству",
      "zh": "尊重彼此尊严的亲密",
      "ja": "尊厳を大切にする親密さ",
      "ko": "존엄을 지키는 친밀함",
      "ar": "الحميمية مع الكرامة",
      "fa": "صمیمیت همراه با کرامت",
      "hi": "गरिमा के साथ अंतरंगता",
      "id": "Keintiman yang menghormati martabat",
      "sw": "Ukaribu wenye heshima",
      "tl": "Pagpapalagayang may dignidad",
      "am": "ክብር ያለው ቅርበት"
    },
    "ref": "1 Corinthians 6:18-20",
    "related": [
      "Hebrews 13:4"
    ],
    "reflection": {
      "en": "Paul treats the body as belonging to God. Prepare for sexual faithfulness with dignity, mutual care, and freedom from shame about the past.",
      "fr": "Paul présente le corps comme appartenant à Dieu. Préparez une fidélité sexuelle fondée sur la dignité et l’attention mutuelle, sans honte imposée au sujet du passé."
    },
    "prompts": [
      {
        "en": "Guide our choices before marriage.",
        "fr": "Guide nos choix avant le mariage."
      },
      {
        "en": "For {partner}: protect dignity and freedom from pressure.",
        "fr": "Pour {partner} : protège dignité et liberté face aux pressions."
      },
      {
        "en": "Prepare us for faithful, mutually willing intimacy.",
        "fr": "Prépare-nous à une intimité fidèle et librement consentie."
      }
    ],
    "selfPrompt": {
      "en": "Do my choices respect the other person’s freedom?",
      "fr": "Mes choix respectent-ils la liberté de l’autre ?"
    },
    "practice": {
      "en": "Consider a boundary that supports mutual respect.",
      "fr": "Réfléchis à une limite qui favorise le respect mutuel."
    },
    "conversationPrompt": {
      "en": "How can we discuss intimacy, consent, and boundaries without pressure?",
      "fr": "Comment parler d’intimité, de consentement et de limites sans pression ?"
    },
    "resourceTopics": [
      "sexuality",
      "purity",
      "abuse-safety"
    ],
    "safetyNote": {
      "en": "Engagement or marriage never creates entitlement to another person’s body. Consent must be free, without pressure or coercion. Seek trusted, qualified support if needed.",
      "fr": "Les fiançailles ou le mariage ne donnent jamais de droit sur le corps de l’autre. Le consentement doit être libre, sans pression ni contrainte. Cherche un soutien fiable et qualifié si nécessaire."
    }
  },
  {
    "theme": {
      "en": "Money and stewardship",
      "fr": "L’argent et la responsabilité",
      "es": "Dinero y buena administración",
      "pt": "Dinheiro e boa administração",
      "de": "Geld verantwortlich verwalten",
      "ru": "Деньги и ответственное распоряжение",
      "zh": "金钱与管家责任",
      "ja": "お金と管理の責任",
      "ko": "돈과 청지기 정신",
      "ar": "المال وحسن التدبير",
      "fa": "پول و امانت‌داری",
      "hi": "धन और जिम्मेदार देखभाल",
      "id": "Uang dan penatalayanan",
      "sw": "Fedha na uwakili",
      "tl": "Pera at responsableng pamamahala",
      "am": "ገንዘብና መጋቢነት"
    },
    "ref": "Matthew 6:19-21",
    "related": [
      "1 Timothy 6:6-10"
    ],
    "reflection": {
      "en": "Jesus connects treasure with the heart. Discuss money as something entrusted to your care, without making wealth your identity or security.",
      "fr": "Jésus relie le trésor au cœur. Parlez de l’argent comme d’une responsabilité confiée, sans faire de la richesse votre identité ou votre sécurité."
    },
    "prompts": [
      {
        "en": "Loosen money’s grip on my sense of worth.",
        "fr": "Libère ma valeur personnelle de l’emprise de l’argent."
      },
      {
        "en": "Give us honesty about spending, saving, and debt.",
        "fr": "Donne-nous de la franchise sur dépenses, épargne et dettes."
      },
      {
        "en": "Grow generosity and shared responsibility.",
        "fr": "Fais grandir générosité et responsabilité partagée."
      }
    ],
    "selfPrompt": {
      "en": "What fear shapes how I use money?",
      "fr": "Quelle peur façonne mon usage de l’argent ?"
    },
    "practice": {
      "en": "Choose a calm time to discuss financial expectations.",
      "fr": "Choisissez un moment calme pour parler des attentes financières."
    },
    "conversationPrompt": {
      "en": "What did money mean in each of our families?",
      "fr": "Que représentait l’argent dans chacune de nos familles ?"
    },
    "resourceTopics": [
      "finances",
      "generosity"
    ]
  },
  {
    "theme": {
      "en": "Work, calling, and rest",
      "fr": "Travail, vocation et repos",
      "es": "Trabajo, vocación y descanso",
      "pt": "Trabalho, vocação e descanso",
      "de": "Arbeit, Berufung und Ruhe",
      "ru": "Труд, призвание и отдых",
      "zh": "工作、呼召与休息",
      "ja": "仕事、召し、休息",
      "ko": "일과 소명과 쉼",
      "ar": "العمل والدعوة والراحة",
      "fa": "کار، دعوت و استراحت",
      "hi": "काम, बुलाहट और विश्राम",
      "id": "Pekerjaan, panggilan, dan istirahat",
      "sw": "Kazi, wito na mapumziko",
      "tl": "Trabaho, tawag, at pahinga",
      "am": "ሥራ፣ ጥሪና እረፍት"
    },
    "ref": "Colossians 3:23-24",
    "related": [],
    "reflection": {
      "en": "Paul calls for wholehearted work before the Lord. Paid work, care, and rest all deserve attention as you shape shared priorities.",
      "fr": "Paul appelle à travailler de tout cœur devant le Seigneur. Travail rémunéré, soins aux autres et repos méritent tous une place dans vos priorités communes."
    },
    "prompts": [
      {
        "en": "For {partner}: give strength and purpose in work.",
        "fr": "Pour {partner} : donne force et sens dans le travail."
      },
      {
        "en": "Free me from proving my worth through busyness.",
        "fr": "Libère-moi du besoin de prouver ma valeur par l’activité."
      },
      {
        "en": "Help us make room for work, care, and rest.",
        "fr": "Aide-nous à faire place au travail, aux soins et au repos."
      }
    ],
    "selfPrompt": {
      "en": "What deserves time that I keep giving away?",
      "fr": "Qu’est-ce qui mérite le temps que je donne ailleurs ?"
    },
    "practice": {
      "en": "Protect one small period of rest today.",
      "fr": "Protège aujourd’hui un petit moment de repos."
    },
    "conversationPrompt": {
      "en": "How will we support each other’s calling and share care work?",
      "fr": "Comment soutenir nos vocations et partager les tâches de soin ?"
    },
    "resourceTopics": [
      "work",
      "spiritual-formation"
    ]
  },
  {
    "theme": {
      "en": "Family ties and boundaries",
      "fr": "Liens familiaux et limites",
      "es": "Vínculos familiares y límites",
      "pt": "Laços familiares e limites",
      "de": "Familienbeziehungen und Grenzen",
      "ru": "Родственные связи и границы",
      "zh": "原生家庭与界限",
      "ja": "家族とのつながりと境界線",
      "ko": "가족 관계와 경계",
      "ar": "روابط الأسرة والحدود",
      "fa": "پیوندهای خانوادگی و مرزها",
      "hi": "पारिवारिक रिश्ते और सीमाएँ",
      "id": "Ikatan keluarga dan batasan",
      "sw": "Mahusiano ya kifamilia na mipaka",
      "tl": "Ugnayan sa pamilya at mga hangganan",
      "am": "የቤተሰብ ትስስርና ድንበሮች"
    },
    "ref": "Genesis 2:24",
    "related": [],
    "reflection": {
      "en": "Genesis describes forming a new household. Honoring relatives can coexist with wise boundaries around time, decisions, and privacy.",
      "fr": "La Genèse décrit la formation d’un nouveau foyer. Honorer ses proches peut aller avec des limites sages concernant le temps, les décisions et la vie privée."
    },
    "prompts": [
      {
        "en": "Give us gratitude without surrendering wise judgment.",
        "fr": "Donne-nous de la gratitude sans renoncer au discernement."
      },
      {
        "en": "For {partner}: give freedom from harmful pressure.",
        "fr": "Pour {partner} : donne la liberté face aux pressions nuisibles."
      },
      {
        "en": "Help us form caring, clear family boundaries.",
        "fr": "Aide-nous à poser des limites familiales claires et attentionnées."
      }
    ],
    "selfPrompt": {
      "en": "Where do I need to speak clearly and kindly?",
      "fr": "Où dois-je parler avec clarté et bienveillance ?"
    },
    "practice": {
      "en": "Name one boundary you can discuss safely.",
      "fr": "Nomme une limite dont tu peux parler sans danger."
    },
    "conversationPrompt": {
      "en": "What do we expect about holidays, caregiving, and family privacy?",
      "fr": "Qu’attendons-nous des fêtes, des soins aux proches et de la confidentialité familiale ?"
    },
    "resourceTopics": [
      "family-of-origin",
      "boundaries",
      "abuse-safety"
    ],
    "safetyNote": {
      "en": "Honoring family does not require accepting abuse or giving up privacy. Boundaries may need support from trusted pastoral, professional, or safeguarding services.",
      "fr": "Honorer sa famille n’oblige pas à accepter des violences ni à renoncer à sa vie privée. Des limites peuvent nécessiter un soutien pastoral fiable, professionnel ou de protection."
    }
  },
  {
    "theme": {
      "en": "Friendship in marriage",
      "fr": "L’amitié dans le mariage",
      "es": "Amistad en el matrimonio",
      "pt": "Amizade no casamento",
      "de": "Freundschaft in der Ehe",
      "ru": "Дружба в браке",
      "zh": "婚姻中的友谊",
      "ja": "結婚生活の中の友情",
      "ko": "결혼 안의 우정",
      "ar": "الصداقة في الزواج",
      "fa": "دوستی در ازدواج",
      "hi": "विवाह में मित्रता",
      "id": "Persahabatan dalam pernikahan",
      "sw": "Urafiki katika ndoa",
      "tl": "Pagkakaibigan sa pagsasama",
      "am": "በትዳር ውስጥ ጓደኝነት"
    },
    "ref": "Ecclesiastes 4:9-12",
    "related": [],
    "reflection": {
      "en": "Ecclesiastes values companionship and help. Friendship grows through attention, shared enjoyment, and curiosity about the person beside you.",
      "fr": "L’Ecclésiaste souligne la valeur de la compagnie et de l’entraide. L’amitié grandit par l’attention, la joie partagée et la curiosité pour l’autre."
    },
    "prompts": [
      {
        "en": "For {partner}: give joy in ordinary moments.",
        "fr": "Pour {partner} : donne de la joie dans les moments ordinaires."
      },
      {
        "en": "Keep me interested in who this person is becoming.",
        "fr": "Garde mon intérêt pour la personne que l’autre devient."
      },
      {
        "en": "Grow friendship alongside responsibility.",
        "fr": "Fais grandir l’amitié au milieu des responsabilités."
      }
    ],
    "selfPrompt": {
      "en": "When did I last listen simply to know more?",
      "fr": "Quand ai-je écouté simplement pour mieux connaître l’autre ?"
    },
    "practice": {
      "en": "Share a small enjoyable activity if you both wish.",
      "fr": "Partagez une petite activité agréable si vous le souhaitez tous deux."
    },
    "conversationPrompt": {
      "en": "What ordinary moments help us enjoy being together?",
      "fr": "Quels moments simples nous aident à apprécier notre compagnie ?"
    },
    "resourceTopics": [
      "friendship",
      "marriage"
    ],
    "prayTogether": {
      "en": "If you both wish, thank God together for one ordinary joy in your friendship.",
      "fr": "Si vous le souhaitez tous deux, remerciez Dieu ensemble pour une joie simple de votre amitié."
    }
  },
  {
    "theme": {
      "en": "Spiritual rhythms together",
      "fr": "Des habitudes spirituelles à deux",
      "es": "Hábitos espirituales juntos",
      "pt": "Hábitos espirituais juntos",
      "de": "Gemeinsame geistliche Gewohnheiten",
      "ru": "Совместные духовные привычки",
      "zh": "共同的属灵生活节奏",
      "ja": "共に育む信仰の習慣",
      "ko": "함께하는 신앙의 습관",
      "ar": "عادات روحية معًا",
      "fa": "عادت‌های روحانی مشترک",
      "hi": "मिलकर आत्मिक आदतें बनाना",
      "id": "Kebiasaan rohani bersama",
      "sw": "Mazoea ya kiroho pamoja",
      "tl": "Sama-samang mga gawi sa pananampalataya",
      "am": "የጋራ መንፈሳዊ ልምዶች"
    },
    "ref": "Colossians 3:16",
    "related": [],
    "reflection": {
      "en": "Paul pictures a community shaped by Christ’s word and gratitude. Shared spiritual habits can be simple and need not look identical for both people.",
      "fr": "Paul décrit une communauté façonnée par la parole de Christ et la reconnaissance. Les habitudes spirituelles communes peuvent être simples, sans être identiques pour chacun."
    },
    "prompts": [
      {
        "en": "Help us receive Scripture with humility.",
        "fr": "Aide-nous à recevoir l’Écriture avec humilité."
      },
      {
        "en": "For {partner}: nourish a personal walk with You.",
        "fr": "Pour {partner} : nourris une marche personnelle avec Toi."
      },
      {
        "en": "Give us a gentle, sustainable rhythm of prayer.",
        "fr": "Donne-nous un rythme de prière doux et durable."
      }
    ],
    "selfPrompt": {
      "en": "Am I inviting shared faith or demanding my way?",
      "fr": "Est-ce que j’invite à partager la foi ou impose ma façon ?"
    },
    "practice": {
      "en": "Choose one small spiritual habit to try.",
      "fr": "Choisissez une petite habitude spirituelle à essayer."
    },
    "conversationPrompt": {
      "en": "Which shared rhythm would nourish us without pressure?",
      "fr": "Quel rythme commun nous nourrirait sans pression ?"
    },
    "resourceTopics": [
      "spiritual-formation",
      "prayer-together"
    ],
    "prayTogether": {
      "en": "If you both wish, read the passage and offer one short prayer each. Different ways of praying are welcome.",
      "fr": "Si vous le souhaitez tous deux, lisez le passage puis faites chacun une courte prière. Des façons différentes de prier ont leur place."
    }
  },
  {
    "theme": {
      "en": "Rooted in Christian community",
      "fr": "Enracinés dans la communauté chrétienne",
      "es": "Arraigados en la comunidad cristiana",
      "pt": "Enraizados na comunidade cristã",
      "de": "In christlicher Gemeinschaft verwurzelt",
      "ru": "Укорениться в христианской общине",
      "zh": "扎根于基督徒群体",
      "ja": "キリストの共同体に根を下ろす",
      "ko": "그리스도인 공동체에 뿌리내리기",
      "ar": "متجذران في الجماعة المسيحية",
      "fa": "ریشه‌دار در جماعت مسیحی",
      "hi": "मसीही समुदाय में जड़ें जमाना",
      "id": "Berakar dalam komunitas Kristen",
      "sw": "Kujikita katika jumuiya ya Kikristo",
      "tl": "Nakaugat sa pamayanang Kristiyano",
      "am": "በክርስቲያን ማኅበረሰብ መሠረት መያዝ"
    },
    "ref": "Hebrews 10:24-25",
    "related": [],
    "reflection": {
      "en": "Hebrews calls believers to encourage one another in love. Marriage needs friendships and a church community; it need not become an isolated world.",
      "fr": "Hébreux invite les croyants à s’encourager dans l’amour. Le mariage a besoin d’amitiés et d’une communauté chrétienne ; il ne doit pas devenir un monde isolé."
    },
    "prompts": [
      {
        "en": "For {partner}: give trustworthy Christian friends.",
        "fr": "Pour {partner} : donne des amitiés chrétiennes fiables."
      },
      {
        "en": "Keep us open to wise encouragement.",
        "fr": "Garde-nous ouverts aux encouragements avisés."
      },
      {
        "en": "Show us how to contribute to our community.",
        "fr": "Montre-nous comment contribuer à notre communauté."
      }
    ],
    "selfPrompt": {
      "en": "Whose wise voice have I stopped hearing?",
      "fr": "Quelle voix sage ai-je cessé d’écouter ?"
    },
    "practice": {
      "en": "Thank someone who supports your life of faith.",
      "fr": "Remercie une personne qui soutient ta vie de foi."
    },
    "conversationPrompt": {
      "en": "Who can support us while respecting our privacy?",
      "fr": "Qui peut nous soutenir en respectant notre vie privée ?"
    },
    "resourceTopics": [
      "community"
    ]
  },
  {
    "theme": {
      "en": "Hopes about children",
      "fr": "Nos attentes concernant les enfants",
      "es": "Esperanzas sobre los hijos",
      "pt": "Esperanças sobre filhos",
      "de": "Hoffnungen rund um Kinder",
      "ru": "Надежды, связанные с детьми",
      "zh": "关于孩子的期望",
      "ja": "子どもについての願い",
      "ko": "자녀에 대한 소망",
      "ar": "آمال بشأن الأطفال",
      "fa": "امیدها درباره فرزند",
      "hi": "बच्चों के बारे में आशाएँ",
      "id": "Harapan tentang anak",
      "sw": "Matumaini kuhusu watoto",
      "tl": "Mga pag-asa tungkol sa mga anak",
      "am": "ስለ ልጆች ያሉ ተስፋዎች"
    },
    "ref": "James 4:13-15",
    "related": [],
    "reflection": {
      "en": "James teaches humility about plans for tomorrow. Hopes about children deserve honest conversation; neither marriage nor prayer guarantees children.",
      "fr": "Jacques enseigne l’humilité dans nos projets pour demain. Les espoirs concernant les enfants méritent une parole sincère ; ni le mariage ni la prière ne garantissent leur venue."
    },
    "prompts": [
      {
        "en": "Help us name hopes and uncertainty kindly.",
        "fr": "Aide-nous à exprimer espoirs et incertitudes avec douceur."
      },
      {
        "en": "For {partner}: give freedom from family pressure.",
        "fr": "Pour {partner} : donne la liberté face aux pressions familiales."
      },
      {
        "en": "Teach us to receive the future without demands.",
        "fr": "Apprends-nous à accueillir l’avenir sans exigences."
      }
    ],
    "selfPrompt": {
      "en": "Which assumption about children have I left unspoken?",
      "fr": "Quelle supposition sur les enfants n’ai-je pas exprimée ?"
    },
    "practice": {
      "en": "Make space for a conversation without requiring a decision.",
      "fr": "Faites place à un échange sans exiger de décision."
    },
    "conversationPrompt": {
      "en": "What hopes, fears, or questions do we carry about children or parenting?",
      "fr": "Quels espoirs, peurs ou questions portons-nous sur les enfants ou la parentalité ?"
    },
    "resourceTopics": [
      "family",
      "parenting",
      "infertility"
    ],
    "safetyNote": {
      "en": "A marriage without children is already a family. Do not pressure one another about fertility, adoption, or fostering. These paths are not guaranteed and may need specialist support.",
      "fr": "Un couple marié sans enfant est déjà une famille. Ne vous mettez pas de pression concernant la fertilité, l’adoption ou l’accueil d’enfants. Ces chemins ne sont pas garantis et peuvent demander un soutien spécialisé."
    }
  },
  {
    "theme": {
      "en": "Bearing difficult seasons",
      "fr": "Traverser les saisons difficiles",
      "es": "Atravesar tiempos difíciles",
      "pt": "Atravessar tempos difíceis",
      "de": "Schwere Zeiten tragen",
      "ru": "Проходить трудные времена",
      "zh": "共度艰难时光",
      "ja": "困難な季節を共に歩む",
      "ko": "어려운 시기를 함께 견디기",
      "ar": "احتمال المواسم الصعبة",
      "fa": "گذر از فصل‌های دشوار",
      "hi": "कठिन समय में साथ निभाना",
      "id": "Menjalani masa sulit",
      "sw": "Kubeba nyakati ngumu",
      "tl": "Pagharap sa mahihirap na panahon",
      "am": "አስቸጋሪ ወቅቶችን መሸከም"
    },
    "ref": "Romans 12:12",
    "related": [
      "Galatians 6:2"
    ],
    "reflection": {
      "en": "Paul connects hope, patience, and prayer in trouble. Facing hardship together includes receiving help, not carrying every burden alone.",
      "fr": "Paul relie espérance, patience et prière dans l’épreuve. Traverser ensemble les difficultés implique d’accepter de l’aide, sans porter seuls tous les fardeaux."
    },
    "prompts": [
      {
        "en": "For {partner}: give strength for present burdens.",
        "fr": "Pour {partner} : donne la force face aux fardeaux présents."
      },
      {
        "en": "Teach me to offer patient, practical care.",
        "fr": "Apprends-moi une attention patiente et concrète."
      },
      {
        "en": "Help us seek support when we need it.",
        "fr": "Aide-nous à chercher du soutien quand il le faut."
      }
    ],
    "selfPrompt": {
      "en": "What help am I reluctant to receive?",
      "fr": "Quelle aide ai-je du mal à recevoir ?"
    },
    "practice": {
      "en": "Offer one practical kindness without trying to fix everything.",
      "fr": "Offre une attention concrète sans vouloir tout résoudre."
    },
    "conversationPrompt": {
      "en": "What helps each of us receive care in hard times?",
      "fr": "Qu’est-ce qui aide chacun à recevoir du soutien dans l’épreuve ?"
    },
    "resourceTopics": [
      "suffering",
      "community"
    ],
    "prayTogether": {
      "en": "If you both wish, name only what you freely choose to share and ask God for help together.",
      "fr": "Si vous le souhaitez tous deux, partagez seulement ce que vous choisissez librement de dire, puis demandez ensemble l’aide de Dieu."
    }
  },
  {
    "theme": {
      "en": "A home that welcomes",
      "fr": "Un foyer qui accueille",
      "es": "Un hogar que acoge",
      "pt": "Um lar que acolhe",
      "de": "Ein gastfreundliches Zuhause",
      "ru": "Гостеприимный дом",
      "zh": "愿意接待的家",
      "ja": "人を迎える家庭",
      "ko": "환대하는 가정",
      "ar": "بيت يرحّب",
      "fa": "خانه‌ای پذیرنده",
      "hi": "स्वागत करने वाला घर",
      "id": "Rumah yang menyambut",
      "sw": "Nyumba inayokaribisha",
      "tl": "Tahanang mapagpatuloy",
      "am": "እንግዳ የሚቀበል ቤት"
    },
    "ref": "1 Peter 4:9-10",
    "related": [],
    "reflection": {
      "en": "Peter connects hospitality with using gifts to serve others. A generous home can welcome people within its real limits and resources.",
      "fr": "Pierre relie l’hospitalité à l’usage de nos dons pour servir. Un foyer généreux accueille en tenant compte de ses limites et de ses ressources réelles."
    },
    "prompts": [
      {
        "en": "Make us attentive to people beyond ourselves.",
        "fr": "Rends-nous attentifs aux personnes au-delà de notre couple."
      },
      {
        "en": "For {partner}: bring joy in using gifts to serve.",
        "fr": "Pour {partner} : donne de la joie à servir avec ses dons."
      },
      {
        "en": "Grow hospitality that is generous and sustainable.",
        "fr": "Fais grandir une hospitalité généreuse et durable."
      }
    ],
    "selfPrompt": {
      "en": "Who is easy for me to overlook?",
      "fr": "Qui ai-je tendance à ne pas remarquer ?"
    },
    "practice": {
      "en": "Offer one simple welcome within your capacity.",
      "fr": "Offre un accueil simple selon tes possibilités."
    },
    "conversationPrompt": {
      "en": "How might our future household serve others together?",
      "fr": "Comment notre futur foyer pourrait-il servir les autres ?"
    },
    "resourceTopics": [
      "hospitality",
      "generosity",
      "mission"
    ]
  },
  {
    "theme": {
      "en": "Preparing to serve faithfully",
      "fr": "Se préparer à servir fidèlement",
      "es": "Prepararse para servir con fidelidad",
      "pt": "Preparar-se para servir com fidelidade",
      "de": "Treues Dienen einüben",
      "ru": "Готовиться служить верно",
      "zh": "预备忠心服侍",
      "ja": "忠実に仕える備え",
      "ko": "신실하게 섬길 준비",
      "ar": "الاستعداد للخدمة بأمانة",
      "fa": "آمادگی برای خدمت وفادارانه",
      "hi": "निष्ठा से सेवा की तैयारी",
      "id": "Bersiap melayani dengan setia",
      "sw": "Kujiandaa kutumikia kwa uaminifu",
      "tl": "Paghahandang maglingkod nang tapat",
      "am": "በታማኝነት ለማገልገል መዘጋጀት"
    },
    "ref": "Mark 10:42-45",
    "related": [],
    "reflection": {
      "en": "Jesus describes greatness through service. Preparing for marriage includes humility, repentance, and shared responsibility, whatever role reflection you choose.",
      "fr": "Jésus décrit la grandeur par le service. Se préparer au mariage implique humilité, repentance et responsabilité partagée, quelle que soit la réflexion de rôle choisie."
    },
    "prompts": [
      {
        "en": "Make my love practical and self-giving.",
        "fr": "Rends mon amour concret et généreux."
      },
      {
        "en": "For {partner}: strengthen wisdom and integrity.",
        "fr": "Pour {partner} : affermis sagesse et intégrité."
      },
      {
        "en": "Teach us responsibility without control.",
        "fr": "Apprends-nous la responsabilité sans le contrôle."
      }
    ],
    "selfPrompt": {
      "en": "Where can I serve without claiming the last word?",
      "fr": "Où puis-je servir sans revendiquer le dernier mot ?"
    },
    "practice": {
      "en": "Take responsibility for one ordinary act of service.",
      "fr": "Prends la responsabilité d’un geste ordinaire de service."
    },
    "conversationPrompt": {
      "en": "What do service and mutual respect look like to us?",
      "fr": "À quoi ressemblent pour nous le service et le respect mutuel ?"
    },
    "resourceTopics": [
      "marriage",
      "character"
    ],
    "safetyNote": {
      "en": "Christlike service never excuses domination, coercion, or abuse. Optional role reflections require theological review and do not grant control over another person.",
      "fr": "Le service à l’image de Christ n’excuse jamais domination, contrainte ou violence. Les réflexions de rôle facultatives demandent une relecture théologique et n’accordent aucun contrôle sur l’autre."
    },
    "roleReviewStatus": "needs_review",
    "roles": {
      "husband": {
        "ref": "Ephesians 5:25-29",
        "en": "Preparing to be a husband includes self-giving love and care. Ask where you can listen, repent, and serve without demanding authority or obedience.",
        "fr": "Se préparer à être mari implique un amour généreux et attentionné. Demande où tu peux écouter, te repentir et servir sans exiger autorité ou obéissance."
      },
      "wife": {
        "ref": "Proverbs 31:26",
        "en": "Preparing to be a wife includes wisdom, kindness, and an honest voice. Ask how to serve with strength and integrity, without hiding needs or accepting harm.",
        "fr": "Se préparer à être épouse implique sagesse, bonté et parole sincère. Demande comment servir avec force et intégrité, sans cacher tes besoins ni accepter le mal."
      }
    }
  },
  {
    "theme": {
      "en": "Entrusting the marriage to God",
      "fr": "Confier le mariage à Dieu",
      "es": "Encomendar el matrimonio a Dios",
      "pt": "Entregar o casamento a Deus",
      "de": "Die Ehe Gott anvertrauen",
      "ru": "Доверить брак Богу",
      "zh": "把婚姻交托给神",
      "ja": "結婚生活を神に委ねる",
      "ko": "결혼을 하나님께 맡기기",
      "ar": "إيداع الزواج بين يدي الله",
      "fa": "سپردن ازدواج به خدا",
      "hi": "विवाह को परमेश्वर के हाथों सौंपना",
      "id": "Menyerahkan pernikahan kepada Allah",
      "sw": "Kumkabidhi Mungu ndoa",
      "tl": "Ipagkatiwala sa Diyos ang pagsasama",
      "am": "ትዳርን ለእግዚአብሔር መስጠት"
    },
    "ref": "Psalm 127:1",
    "related": [],
    "reflection": {
      "en": "The psalm puts human building in dependence on God. Entrust your coming marriage to Him; the wedding begins, rather than completes, a life of faithfulness.",
      "fr": "Le psaume place toute construction humaine dans la dépendance envers Dieu. Confiez-Lui votre futur mariage ; la cérémonie commence une vie de fidélité, elle ne l’achève pas."
    },
    "prompts": [
      {
        "en": "Thank You for what these days have revealed.",
        "fr": "Merci pour ce que ces jours ont révélé."
      },
      {
        "en": "For {partner}: sustain faith and hope in You.",
        "fr": "Pour {partner} : soutiens la foi et l’espérance en Toi."
      },
      {
        "en": "Keep forming our marriage with patience and grace.",
        "fr": "Continue à former notre mariage avec patience et grâce."
      }
    ],
    "selfPrompt": {
      "en": "Which habit of prayer do I want to carry forward?",
      "fr": "Quelle habitude de prière ai-je envie de poursuivre ?"
    },
    "practice": {
      "en": "Choose a simple way to continue praying after this plan.",
      "fr": "Choisis une façon simple de continuer à prier après ce parcours."
    },
    "conversationPrompt": {
      "en": "What are we grateful for, and what do we still entrust to God?",
      "fr": "De quoi sommes-nous reconnaissants, et que confions-nous encore à Dieu ?"
    },
    "resourceTopics": [
      "covenant",
      "prayer"
    ],
    "prayTogether": {
      "en": "If you both wish, thank God together and entrust your coming marriage to Him without making promises about the outcome.",
      "fr": "Si vous le souhaitez tous deux, remerciez Dieu ensemble et confiez-Lui votre futur mariage sans promettre son issue."
    }
  }
];

