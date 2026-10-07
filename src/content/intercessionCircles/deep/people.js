// My people — DEEP layer (draft until ../review.js carries a human sign-off).
// English + French only; other languages fall back to English.
//
// `themes` matches the short layer's themes BY ID AND ORDER (asserted by the
// contract test).
//
// Guardrails applied in this file: Scripture by reference only, never quoted;
// prayer never removes responsibility — it often leads to a practical act of
// love; reconciliation is pursued where it is possible and wise, never by
// pretending harm did not happen; witness is gentle and respectful, never
// pressure; prompts are prayers a person may pray in their own words.
export default {
  id: 'people',
  meaning: {
    en: 'Love does not only notice burdens; it carries them. This circle holds friends, neighbors, colleagues, classmates, mentors, those you help to follow Jesus, people who asked you to pray, relationships that are difficult and people far from God. Praying for them does not replace love in action: often it leads to it.',
    fr: 'L’amour ne se contente pas de remarquer les fardeaux : il les porte. Ce cercle rassemble les amis, les voisins, les collègues, les camarades d’études, les mentors, ceux que vous aidez à suivre Jésus, les personnes qui vous ont demandé de prier, les relations difficiles et ceux qui sont loin de Dieu. Prier pour eux ne remplace pas l’amour en actes : bien souvent, cela y conduit.',
  },
  themes: [
    {
      id: 'compassion',
      body: {
        en: 'Ask God to help you see people, not only their problems, and to share something of His compassion for what they carry.',
        fr: 'Demandez à Dieu de vous aider à voir les personnes, et pas seulement leurs problèmes, et à partager quelque chose de sa compassion pour ce qu’elles portent.',
      },
      refs: ['Matthew 9:35-36', 'Luke 10:30-37', 'Colossians 3:12'],
      prompts: [
        { en: 'Give me compassion for what others are carrying.', fr: 'Donne-moi de la compassion pour ce que les autres portent.' },
        { en: 'Help me see the person, not only the problem.', fr: 'Aide-moi à voir la personne, et pas seulement le problème.' },
      ],
    },
    {
      id: 'burdens',
      body: {
        en: 'Remember faithfully the needs entrusted to you, and keep carrying people before God long after the first moment of concern has passed.',
        fr: 'Souvenez-vous fidèlement des besoins qui vous ont été confiés, et continuez de porter les personnes devant Dieu bien après le premier élan d’inquiétude.',
      },
      refs: ['Galatians 6:2', 'James 5:16', '1 Samuel 12:23', 'Colossians 1:9-12'],
      prompts: [
        { en: 'Help me carry this person faithfully before You.', fr: 'Aide-moi à porter fidèlement cette personne devant toi.' },
        { en: 'Remind me of those I promised to pray for.', fr: 'Rappelle-moi ceux pour qui j’ai promis de prier.' },
      ],
    },
    {
      id: 'encouragement',
      body: {
        en: 'Prayer sometimes becomes words or actions that strengthen someone. Ask how you might encourage the person you are praying for.',
        fr: 'La prière devient parfois des paroles ou des gestes qui fortifient quelqu’un. Demandez comment vous pourriez encourager la personne pour qui vous priez.',
      },
      refs: ['1 Thessalonians 5:11', 'Hebrews 10:24-25', 'Proverbs 12:25'],
      prompts: [
        { en: 'Show me how I can encourage this person.', fr: 'Montre-moi comment encourager cette personne.' },
        { en: 'Let my words strengthen and not discourage.', fr: 'Que mes paroles fortifient au lieu de décourager.' },
      ],
    },
    {
      id: 'reconciliation',
      body: {
        en: 'Carry broken and difficult relationships before God. Pursue peace where it is possible and wise, without pretending that harm did not happen.',
        fr: 'Portez devant Dieu les relations brisées ou difficiles. Recherchez la paix là où c’est possible et sage, sans faire comme si le mal n’avait pas eu lieu.',
      },
      refs: ['Matthew 5:23-24', 'Romans 12:17-21', 'Matthew 5:43-48'],
      prompts: [
        { en: 'Give me humility, wisdom and courage to pursue reconciliation where it is possible.', fr: 'Donne-moi l’humilité, la sagesse et le courage de rechercher la réconciliation là où c’est possible.' },
        { en: 'Teach me to pray for those who have hurt me.', fr: 'Apprends-moi à prier pour ceux qui m’ont fait du mal.' },
      ],
    },
    {
      id: 'witness',
      body: {
        en: 'Pray that your life and your words point the people around you toward Christ, with gentleness and respect.',
        fr: 'Priez pour que votre vie et vos paroles orientent vers Christ les personnes qui vous entourent, avec douceur et respect.',
      },
      refs: ['1 Peter 3:15-16', 'Colossians 4:5-6', 'Matthew 5:14-16'],
      prompts: [
        { en: 'Let my life point the people around me to You.', fr: 'Que ma vie oriente vers toi ceux qui m’entourent.' },
        { en: 'Open the hearts of my friends who do not yet know You.', fr: 'Ouvre le cœur de mes proches qui ne te connaissent pas encore.' },
        { en: 'Give me words that are gracious and true.', fr: 'Donne-moi des paroles pleines de grâce et de vérité.' },
      ],
    },
    {
      id: 'practical-love',
      body: {
        en: 'Prayer does not remove responsibility. Sometimes it leads to a call, a visit, listening, giving, helping, an apology or a word of encouragement.',
        fr: 'La prière ne supprime pas la responsabilité. Elle conduit parfois à un appel, une visite, une écoute, un don, une aide, des excuses ou une parole d’encouragement.',
      },
      refs: ['James 2:15-17', '1 John 3:16-18', 'Philippians 2:3-4'],
      prompts: [
        { en: 'Show me the practical step of love connected to this prayer.', fr: 'Montre-moi le pas concret d’amour lié à cette prière.' },
        { en: 'Give me courage to act on what I pray.', fr: 'Donne-moi le courage d’agir selon ce que je te demande.' },
      ],
    },
  ],
  // Qualitative only. Nothing here is ever scored, stored or counted.
  reflection: [
    { en: 'Who recently shared a burden with you?', fr: 'Qui vous a récemment confié un fardeau ?' },
    { en: 'Who have you promised to pray for but forgotten?', fr: 'Pour qui avez-vous promis de prier, puis oublié de le faire ?' },
    { en: 'Is there someone difficult Jesus is calling you to love and pray for?', fr: 'Y a-t-il une personne difficile que Jésus vous appelle à aimer et à porter dans la prière ?' },
    { en: 'Does one of your prayers call for a practical act of compassion?', fr: 'L’une de vos prières appelle-t-elle un geste concret de compassion ?' },
  ],
};
