// The reviewed prayer modules a guided deliverance session is assembled from.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY MODULES RATHER THAN GENERATION
// ─────────────────────────────────────────────────────────────────────────────
// A guided prayer about covenants, curses or family spiritual history is the
// last place an app should improvise. Everything a reader is invited to pray
// here is AUTHORED, fixed, and reviewable as a unit; the only thing the app
// decides is WHICH of these modules apply and in what order (see
// src/lib/freedomSession.js). That is personalization. It is not diagnosis, and
// no model is asked to write, translate, interpret or extend a word of it.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THESE TEXTS ARE — AND ARE NOT
// ─────────────────────────────────────────────────────────────────────────────
// Every `body` below is PRAYSTEAD GUIDED PRAYER BASED ON SCRIPTURE. It is not
// Scripture, it is not a quotation, and it is never rendered as one: the UI
// keeps Bible text inside a verse panel and this text in a prayer card (see
// src/components/deliverance/GuidedPrayerSteps.jsx). `refs` are the passages the
// module leans on, cited so the reader can read them in context — the app never
// authors, paraphrases-as-Scripture, or generates verse text.
//
// Nothing here is a formula. A renunciation module says what it means to turn
// away from something and to belong to Christ; it never suggests that the exact
// wording, the volume, or the number of repetitions is what does the work.
//
// LOCALIZATION: authored in en + fr, like all plan prose. Other languages fall
// back through pick() until a competent speaker has reviewed a translation —
// these are exactly the terms (covenant, curse, ancestral worship, shrine,
// renunciation) a machine translation gets dangerously wrong.
export const PRAYER_MODULES = {
  inviteSpirit: {
    id: 'inviteSpirit',
    titleKey: 'freedomStepInviteSpirit',
    refs: ['Psalm 139:23-24', 'John 16:13', 'Romans 8:14', 'John 14:26'],
    body: {
      en: 'Holy Spirit, search me and guide me in truth. Bring to my remembrance anything I need to confess, forgive, renounce, surrender or make right before God. Help me recognise truth through Your Word, and keep me from fear, imagination and speculation.',
      fr: "Saint-Esprit, sonde-moi et conduis-moi dans la vérité. Rappelle-moi tout ce que j'ai besoin de confesser, de pardonner, de renoncer, de remettre ou de réparer devant Dieu. Aide-moi à reconnaître la vérité par Ta Parole, et garde-moi de la peur, de l'imagination et des spéculations.",
    },
  },

  confessChrist: {
    id: 'confessChrist',
    titleKey: 'freedomStepConfessChrist',
    refs: ['Romans 10:9-10', 'Philippians 2:9-11'],
    body: {
      en: 'Lord Jesus, You are Lord. I confess You as the Son of God who died for my sins and rose again. I belong to You. I am not praying to be safe from something; I am praying because I am Yours.',
      fr: "Seigneur Jésus, Tu es Seigneur. Je Te confesse comme le Fils de Dieu, mort pour mes péchés et ressuscité. Je T'appartiens. Je ne prie pas pour me mettre à l'abri de quelque chose ; je prie parce que je suis à Toi.",
    },
  },

  thanksCross: {
    id: 'thanksCross',
    titleKey: 'freedomStepThanksCross',
    refs: ['Colossians 2:13-15', 'Colossians 1:13-14'],
    body: {
      en: 'Father, thank You for the cross. Thank You that the record of debt against me was cancelled there, that Jesus disarmed the powers openly, and that You have already transferred me into the kingdom of Your beloved Son. I begin here, not with what I am afraid of.',
      fr: "Père, merci pour la croix. Merci : l'acte qui m'accusait y a été effacé, Jésus y a publiquement dépouillé les puissances, et Tu m'as déjà transféré dans le royaume de Ton Fils bien-aimé. Je commence ici, et non par ce qui me fait peur.",
    },
  },

  bringBeforeGod: {
    id: 'bringBeforeGod',
    titleKey: 'freedomStepBring',
    refs: ['Psalm 62:8', '1 Peter 5:6-7'],
    body: {
      en: 'Father, I bring what today has put before me into Your presence. I am not hiding it, minimising it or dramatising it. You see it exactly as it is, and I place it in Your hands.',
      fr: "Père, j'apporte devant Toi ce que cette journée a mis en lumière. Je ne le cache pas, je ne le minimise pas, je ne le dramatise pas. Tu le vois exactement tel qu'il est, et je le remets entre Tes mains.",
    },
  },

  repentPersonal: {
    id: 'repentPersonal',
    titleKey: 'freedomStepRepent',
    refs: ['1 John 1:7-9', 'Acts 3:19'],
    body: {
      en: 'Father, I acknowledge my own participation in this. I am not excusing it and I am not blaming anyone else for it. I repent and I turn away from it. Thank You that You are faithful and just to forgive, and that in Christ there is no condemnation waiting for me on the other side of the truth.',
      fr: "Père, je reconnais ma propre participation à cela. Je ne l'excuse pas et je n'en accuse personne d'autre. Je m'en repens et je m'en détourne. Merci d'être fidèle et juste pour pardonner, et qu'en Christ aucune condamnation ne m'attend de l'autre côté de la vérité.",
    },
  },

  renouncePersonal: {
    id: 'renouncePersonal',
    titleKey: 'freedomStepRenounce',
    refs: ['2 Corinthians 4:2', 'Acts 19:18-20'],
    body: {
      en: 'In the name of Jesus Christ I renounce every spiritual allegiance, agreement, oath, covenant or dedication contrary to Him in which I knowingly took part. I turn from it deliberately. It is not mine, I do not want it, and my allegiance belongs to Jesus Christ alone. This is not a formula; it is my will, and I ask You to make it my practice as well.',
      fr: "Au nom de Jésus-Christ, je renonce à toute allégeance, à tout accord, serment, alliance ou consécration spirituelle contraire à Lui auxquels j'ai sciemment pris part. Je m'en détourne délibérément. Cela ne m'appartient pas, je n'en veux pas, et mon allégeance est à Jésus-Christ seul. Ce n'est pas une formule : c'est ma volonté, et je Te demande d'en faire aussi ma pratique.",
    },
  },

  bringKnownFamily: {
    id: 'bringKnownFamily',
    titleKey: 'freedomStepBringFamily',
    refs: ['Ezekiel 18:19-20', '1 Peter 1:18-19'],
    body: {
      en: 'Father, I bring before You this part of my family history that I know about. I do not carry guilt that is not mine, and I do not accuse anyone before You. I simply say plainly: I do not choose that allegiance as my own. I have been ransomed by the precious blood of Christ from the way of life handed down to me, and my allegiance belongs to Him.',
      fr: "Père, j'apporte devant Toi cette part de mon histoire familiale que je connais. Je ne porte pas une culpabilité qui n'est pas la mienne, et je n'accuse personne devant Toi. Je dis simplement : je ne choisis pas cette allégeance comme la mienne. J'ai été racheté par le sang précieux de Christ de la manière de vivre qui m'a été transmise, et mon allégeance Lui appartient.",
    },
  },

  renounceFamilyAgreement: {
    id: 'renounceFamilyAgreement',
    titleKey: 'freedomStepRenounceFamily',
    refs: ['Joshua 24:14-15', 'Colossians 1:13-14'],
    body: {
      en: 'In the name of Jesus Christ I renounce any continuing agreement of my own with what I know of this in my family — any place where I have consented to it, relied on it, kept it going or quietly counted on it. As for me and my house, we will serve the LORD.',
      fr: "Au nom de Jésus-Christ, je renonce à tout accord personnel que je maintiendrais encore avec ce que je sais de cela dans ma famille — partout où j'y ai consenti, où je m'y suis appuyé, où je l'ai perpétué ou secrètement compté dessus. Quant à moi et à ma maison, nous servirons l'Éternel.",
    },
  },

  bringReportedFamily: {
    id: 'bringReportedFamily',
    titleKey: 'freedomStepBringReported',
    refs: ['Psalm 139:1-6', 'Proverbs 3:5-6'],
    body: {
      en: 'Father, You know exactly what happened. I have only been told about this, and I will not build a story around it. I place what I have been told before You, I refuse to be governed by it, and I ask You to establish me in truth rather than in fear. Where there is nothing to it, let me be at peace; where something is real, You are able to bring it into the light.',
      fr: "Père, Tu sais exactement ce qui s'est passé. On m'en a seulement parlé, et je ne bâtirai pas une histoire là-dessus. Je dépose devant Toi ce qui m'a été rapporté, je refuse d'en être gouverné, et je Te demande de m'affermir dans la vérité plutôt que dans la peur. S'il n'y a rien, donne-moi la paix ; si quelque chose est réel, Tu es capable de le mettre en lumière.",
    },
  },

  entrustUnknown: {
    id: 'entrustUnknown',
    titleKey: 'freedomStepEntrustUnknown',
    refs: ['Psalm 139:1-6', 'Deuteronomy 29:29'],
    body: {
      en: 'Father, You know my family history completely, including everything I do not know and never will. I place the unknown in Your hands. I will not go looking for it through fear, through speculation, or through anything You have forbidden. What is secret belongs to You; what You have revealed belongs to me, and my life belongs to Jesus Christ.',
      fr: "Père, Tu connais parfaitement mon histoire familiale, y compris tout ce que j'ignore et que j'ignorerai toujours. Je remets l'inconnu entre Tes mains. Je n'irai pas le chercher par la peur, par la spéculation, ni par rien de ce que Tu as interdit. Les choses cachées sont à Toi ; ce que Tu as révélé est à moi, et ma vie appartient à Jésus-Christ.",
    },
  },

  rejectFear: {
    id: 'rejectFear',
    titleKey: 'freedomStepRejectFear',
    refs: ['2 Timothy 1:7', 'Romans 8:31-39'],
    body: {
      en: 'Father, You have not given me a spirit of fear, but of power, love and a sound mind. In the name of Jesus Christ I refuse to let fear govern my decisions, my sleep, my relationships or my reading of my own life. Nothing in all creation can separate me from Your love in Christ Jesus.',
      fr: "Père, Tu ne m'as pas donné un esprit de crainte, mais de force, d'amour et de sagesse. Au nom de Jésus-Christ, je refuse que la peur gouverne mes décisions, mon sommeil, mes relations ou la manière dont je lis ma propre vie. Rien dans toute la création ne peut me séparer de Ton amour en Jésus-Christ.",
    },
  },

  forgive: {
    id: 'forgive',
    titleKey: 'freedomStepForgive',
    refs: ['Ephesians 4:31-32', 'Romans 12:17-21'],
    body: {
      en: 'Father, I choose before You to forgive the person You have brought to mind. I am not calling what they did good, I am not required to trust them again, and I am not asked to remove wise limits or to stay where I am unsafe. I am handing You the right to repay, because vengeance is Yours and not mine. Take the bitterness out of me as You do it.',
      fr: "Père, je choisis devant Toi de pardonner à la personne que Tu m'as mise à l'esprit. Je n'appelle pas bien ce qu'elle a fait, je ne suis pas obligé de lui refaire confiance, et il ne m'est pas demandé de supprimer des limites sages ni de rester là où je ne suis pas en sécurité. Je Te remets le droit de rétribuer, car la vengeance T'appartient et non à moi. Ôte de moi l'amertume pendant que Tu le fais.",
    },
  },

  prayTheWord: {
    id: 'prayTheWord',
    titleKey: 'freedomStepPrayTheWord',
    refs: ['Ephesians 6:17-18', 'Hebrews 4:12'],
    body: {
      en: 'Read today’s passage again slowly, and pray it back to God in your own words — thank Him for what it says about Him, ask Him for what it promises His people, and tell Him where you need it to become true of you. Praying Scripture is not reciting a spell; it is agreeing with God about what He has already said.',
      fr: "Relis lentement le passage du jour et rends-le à Dieu dans tes propres mots — remercie-Le pour ce qu'il dit de Lui, demande-Lui ce qu'il promet à Son peuple, et dis-Lui où tu as besoin qu'il devienne vrai pour toi. Prier l'Écriture n'est pas réciter une formule : c'est se mettre d'accord avec Dieu sur ce qu'Il a déjà dit.",
    },
  },

  standInChrist: {
    id: 'standInChrist',
    titleKey: 'freedomStepStand',
    refs: ['Ephesians 6:13-14', 'Galatians 5:1'],
    body: {
      en: 'Father, I stand on what You have said rather than on what I feel. Christ has set me free, and I will stand firm in that freedom. Where my thinking argues against Your Word, teach me to answer it with Your Word instead of with fear.',
      fr: "Père, je m'appuie sur ce que Tu as dit plutôt que sur ce que je ressens. Christ m'a affranchi, et je demeurerai ferme dans cette liberté. Là où mes pensées contredisent Ta Parole, apprends-moi à leur répondre par Ta Parole plutôt que par la peur.",
    },
  },

  askFilled: {
    id: 'askFilled',
    titleKey: 'freedomStepAskFilled',
    refs: ['Ephesians 5:18-20', 'Luke 11:11-13'],
    body: {
      en: 'Holy Spirit, fill me. An empty room is not the goal — a life yielded to God is. Renew my desires, my thoughts, my habits, my speech, my relationships and my choices. Produce Your fruit in me and teach me to obey Jesus today.',
      fr: "Saint-Esprit, remplis-moi. Une pièce vide n'est pas le but : une vie livrée à Dieu l'est. Renouvelle mes désirs, mes pensées, mes habitudes, mes paroles, mes relations et mes choix. Produis Ton fruit en moi et apprends-moi à obéir à Jésus aujourd'hui.",
    },
  },

  thanksgiving: {
    id: 'thanksgiving',
    titleKey: 'freedomStepThanksgiving',
    refs: ['Psalm 103:1-5', 'Colossians 2:6-7'],
    body: {
      en: 'Father, thank You. Thank You for hearing me, for what You have already done in Christ, and for what You will keep doing that I cannot see yet. I walk out of this prayer belonging to You — not waiting to find out whether I am free.',
      fr: "Père, merci. Merci de m'avoir écouté, merci pour ce que Tu as déjà accompli en Christ, et pour ce que Tu continueras de faire et que je ne vois pas encore. Je sors de cette prière en T'appartenant — et non en attendant de savoir si je suis libre.",
    },
  },

  practicalObedience: {
    id: 'practicalObedience',
    titleKey: 'freedomStepPractical',
    refs: ['James 1:22-25', 'Acts 19:18-20'],
    body: {
      en: 'Ask God for one practical step that belongs with what you have just prayed — something you will actually do this week. Renouncing something and then continuing to practise it is not freedom. If the step involves other people, property, or a decision you are unsure about, ask a trusted mature Christian before you act.',
      fr: "Demande à Dieu un pas concret qui accompagne ce que tu viens de prier — quelque chose que tu feras réellement cette semaine. Renoncer à une chose puis continuer de la pratiquer n'est pas la liberté. Si ce pas implique d'autres personnes, des biens, ou une décision dont tu n'es pas sûr, parles-en à un chrétien mûr et digne de confiance avant d'agir.",
    },
  },
};

export const PRAYER_MODULE_IDS = Object.keys(PRAYER_MODULES);
