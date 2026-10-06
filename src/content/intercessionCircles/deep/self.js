// My heart — DEEP layer (draft until ../review.js carries a human sign-off).
// English + French only; other languages fall back to English.
//
// `themes` matches the short layer's themes BY ID AND ORDER (asserted by the
// contract test). The seven foundations are QETORET'S framework for prayer and
// formation — the `framework` note says so on screen, and no sentence here may
// claim that the Bible gives seven abilities every believer must have.
//
// Guardrails applied in this file: Scripture by reference only, never quoted;
// listening to God is always paired with testing impressions against Scripture
// and the app never confirms that God said something; fruit is grown by the
// Spirit, never scored, earned or "completed"; prompts are prayers a person may
// pray in their own words — the composer never pre-writes them.
export default {
  id: 'self',
  meaning: {
    en: 'Prayer begins with letting God shape our character, desires, habits, thinking, relationships and obedience. Jesus calls His followers salt and light: lives whose good works point others to the Father. A tree is known by its fruit, so pray not only for changed circumstances but for a changed heart. This is God’s work in you, received by faith and answered in obedience, never something earned by praying more.',
    fr: 'La prière commence quand nous laissons Dieu façonner notre caractère, nos désirs, nos habitudes, nos pensées, nos relations et notre obéissance. Jésus appelle ses disciples le sel et la lumière : des vies dont les œuvres bonnes orientent les autres vers le Père. On reconnaît l’arbre à son fruit ; priez donc non seulement pour que les circonstances changent, mais pour que votre cœur change. C’est l’œuvre de Dieu en vous, reçue par la foi et accueillie dans l’obéissance, jamais une récompense que l’on gagne en priant davantage.',
  },
  framework: {
    title: { en: 'Seven foundations of a formed disciple', fr: 'Sept fondements d’un disciple formé' },
    note: {
      en: 'Qetoret groups several biblical practices into seven foundations for prayer and formation. They are a way to pray, not a list Scripture gives, and never a checklist.',
      fr: 'Qetoret regroupe plusieurs pratiques bibliques en sept fondements pour la prière et la formation. C’est une manière de prier, non une liste donnée par l’Écriture, et jamais une liste à cocher.',
    },
  },
  themes: [
    {
      id: 'communion',
      body: {
        en: 'Seek God Himself, not only His answers. Pray honestly, remain with Him, and let prayer grow into a faithful rhythm.',
        fr: 'Cherchez Dieu lui-même, et pas seulement ses réponses. Priez avec franchise, demeurez avec lui, et laissez la prière devenir un rythme fidèle.',
      },
      refs: ['Matthew 6:6-13', 'Luke 11:1-13', '1 Thessalonians 5:17', 'Hebrews 4:14-16'],
      prompts: [
        { en: 'Teach me to seek You before I seek answers.', fr: 'Apprends-moi à te chercher avant de chercher des réponses.' },
        { en: 'Form a faithful rhythm of prayer in me.', fr: 'Forme en moi un rythme de prière fidèle.' },
        { en: 'Teach me to pray honestly and with surrender.', fr: 'Apprends-moi à prier avec franchise et abandon.' },
        { en: 'Let prayer become relationship, not religious performance.', fr: 'Que la prière devienne une relation, et non une performance religieuse.' },
      ],
    },
    {
      id: 'scripture',
      body: {
        en: 'Ask for hunger for God’s Word, for understanding, for remembering what He teaches, and for grace to live it.',
        fr: 'Demandez la faim de la Parole de Dieu, l’intelligence pour la comprendre, la mémoire de ce qu’il enseigne et la grâce de la vivre.',
      },
      refs: ['Psalm 1:1-3', 'Joshua 1:8', 'Psalm 119:9-16', '2 Timothy 3:16-17', 'James 1:22-25'],
      prompts: [
        { en: 'Give me hunger for Your Word.', fr: 'Donne-moi faim de ta Parole.' },
        { en: 'Help me understand Scripture faithfully.', fr: 'Aide-moi à comprendre l’Écriture avec fidélité.' },
        { en: 'Let Your Word shape the way I think.', fr: 'Que ta Parole façonne ma manière de penser.' },
        { en: 'Help me remember what You teach me.', fr: 'Aide-moi à me souvenir de ce que tu m’enseignes.' },
        { en: 'Make me a doer of the Word.', fr: 'Fais de moi quelqu’un qui met ta Parole en pratique.' },
      ],
    },
    {
      id: 'discernment',
      body: {
        en: 'Qetoret encourages believers to listen for God’s leading through Scripture, prayer and the Holy Spirit, while testing impressions against Scripture. Not every thought, feeling or impression is God’s voice, and no app can confirm that God has spoken.',
        fr: 'Qetoret encourage les croyants à être attentifs à la conduite de Dieu par l’Écriture, la prière et le Saint-Esprit, en éprouvant leurs impressions à la lumière de l’Écriture. Toute pensée, tout sentiment ou toute impression n’est pas la voix de Dieu, et aucune application ne peut confirmer que Dieu a parlé.',
      },
      refs: ['John 10:27', 'Romans 8:14', '1 Corinthians 2:12-16', '1 Thessalonians 5:19-22', '1 John 4:1'],
      prompts: [
        { en: 'Make me attentive to Your leading.', fr: 'Rends mon cœur attentif à ta conduite.' },
        { en: 'Give me discernment between truth and error.', fr: 'Donne-moi de discerner la vérité de l’erreur.' },
        { en: 'Help me test what I perceive by Scripture.', fr: 'Aide-moi à éprouver ce que je perçois à la lumière de l’Écriture.' },
        { en: 'Make me sensitive to the conviction of the Holy Spirit.', fr: 'Rends-moi sensible à la conviction du Saint-Esprit.' },
      ],
    },
    {
      id: 'obedience',
      body: {
        en: 'Knowing the truth is meant to become faithful action, also when obedience costs something.',
        fr: 'Connaître la vérité doit devenir une action fidèle, même quand l’obéissance coûte.',
      },
      refs: ['Luke 6:46-49', 'John 14:15', 'John 14:21', 'James 1:22'],
      prompts: [
        { en: 'Give me courage to obey what You have already shown me.', fr: 'Donne-moi le courage d’obéir à ce que tu m’as déjà montré.' },
        { en: 'Make me faithful when obedience is costly.', fr: 'Rends-moi fidèle quand l’obéissance coûte.' },
        { en: 'Bring my desires under Your will.', fr: 'Soumets mes désirs à ta volonté.' },
        { en: 'Teach me to respond to the Holy Spirit in ways that agree with Scripture.', fr: 'Apprends-moi à répondre au Saint-Esprit d’une manière conforme à l’Écriture.' },
      ],
    },
    {
      id: 'faith',
      body: {
        en: 'Faith becomes visible in trust and in good works, often before we can see the outcome.',
        fr: 'La foi devient visible dans la confiance et dans les œuvres bonnes, souvent avant que nous voyions l’issue.',
      },
      refs: ['James 2:14-18', 'Hebrews 11', 'Galatians 5:6', 'Ephesians 2:10'],
      prompts: [
        { en: 'Strengthen my faith.', fr: 'Fortifie ma foi.' },
        { en: 'Teach me to trust You when I cannot see the outcome.', fr: 'Apprends-moi à te faire confiance quand je ne vois pas l’issue.' },
        { en: 'Let my faith become faithful action.', fr: 'Que ma foi devienne une action fidèle.' },
        { en: 'Show me the obedient step connected to what I pray about.', fr: 'Montre-moi le pas d’obéissance lié à ce que je te demande.' },
      ],
    },
    {
      id: 'fruit',
      body: {
        en: 'The fruit of the Spirit is the character of Christ growing in a life. It is grown by the Spirit, not earned, and never a score to reach.',
        fr: 'Le fruit de l’Esprit, c’est le caractère de Christ qui grandit dans une vie. Il est produit par l’Esprit, non mérité, et n’est jamais un score à atteindre.',
      },
      refs: ['Galatians 5:22-25'],
      prompts: [
        { en: 'Form the character of Jesus in me.', fr: 'Forme en moi le caractère de Jésus.' },
      ],
      // The nine facets of the one fruit, in the order of the passage. One
      // palette for all nine — no colour per fruit, no count of how many.
      facets: [
        {
          id: 'love',
          title: { en: 'Love', fr: 'L’amour' },
          body: { en: 'Love that gives itself, even when it costs.', fr: 'Un amour qui se donne, même quand il coûte.' },
          ref: '1 Corinthians 13:4-7',
          prompts: [{ en: 'Teach me to love when love costs me something.', fr: 'Apprends-moi à aimer quand aimer me coûte.' }],
        },
        {
          id: 'joy',
          title: { en: 'Joy', fr: 'La joie' },
          body: { en: 'Joy rooted in God rather than in circumstances.', fr: 'Une joie enracinée en Dieu plutôt que dans les circonstances.' },
          ref: 'John 15:9-11',
          prompts: [{ en: 'Let my joy be rooted in You rather than in my circumstances.', fr: 'Que ma joie soit enracinée en toi plutôt que dans les circonstances.' }],
        },
        {
          id: 'peace',
          title: { en: 'Peace', fr: 'La paix' },
          body: { en: 'A quiet trust in God that also makes peace with others.', fr: 'Une confiance paisible en Dieu, qui fait aussi la paix avec les autres.' },
          ref: 'Philippians 4:6-7',
          prompts: [{ en: 'Form Your peace in me and make me a peacemaker.', fr: 'Forme ta paix en moi et fais de moi un artisan de paix.' }],
        },
        {
          id: 'patience',
          title: { en: 'Patience', fr: 'La patience' },
          body: { en: 'Patience with people, with circumstances and with God’s timing.', fr: 'La patience envers les autres, les circonstances et le temps de Dieu.' },
          ref: 'James 5:7-8',
          prompts: [{ en: 'Give me patience with people, circumstances and Your timing.', fr: 'Donne-moi de la patience envers les autres, les circonstances et ton temps.' }],
        },
        {
          id: 'kindness',
          title: { en: 'Kindness', fr: 'La bonté' },
          body: { en: 'Kindness that notices others and acts.', fr: 'Une bonté qui remarque les autres et agit.' },
          ref: 'Ephesians 4:32',
          prompts: [{ en: 'Make me kind in what I say and in what I do.', fr: 'Mets ta bonté dans mes paroles et dans mes actes.' }],
        },
        {
          id: 'goodness',
          title: { en: 'Goodness', fr: 'La bienveillance' },
          body: { en: 'A life whose deeds are good and point others to God.', fr: 'Une vie dont les actes sont bons et orientent les autres vers Dieu.' },
          ref: 'Matthew 5:16',
          prompts: [{ en: 'Let my life do good that points others to You.', fr: 'Que ma vie fasse le bien et oriente les autres vers toi.' }],
        },
        {
          id: 'faithfulness',
          title: { en: 'Faithfulness', fr: 'La fidélité' },
          body: { en: 'Being reliable in small things and in what God entrusts.', fr: 'Être digne de confiance dans les petites choses et dans ce que Dieu confie.' },
          ref: 'Luke 16:10',
          prompts: [{ en: 'Make me faithful in small things and in what You entrust to me.', fr: 'Rends-moi fidèle dans les petites choses et dans ce que tu me confies.' }],
        },
        {
          id: 'gentleness',
          title: { en: 'Gentleness', fr: 'La douceur' },
          body: { en: 'Strength that does not crush, and humility that does not need to win.', fr: 'Une force qui n’écrase pas, une humilité qui n’a pas besoin de gagner.' },
          ref: 'Matthew 11:28-30',
          prompts: [{ en: 'Make me gentle, especially when I think I am right.', fr: 'Donne-moi ta douceur, surtout quand je pense avoir raison.' }],
        },
        {
          id: 'self-control',
          title: { en: 'Self-control', fr: 'La maîtrise de soi' },
          body: { en: 'Freedom to say no to what harms and yes to what is good.', fr: 'La liberté de dire non à ce qui fait du mal et oui à ce qui est bon.' },
          ref: 'Titus 2:11-12',
          prompts: [{ en: 'Strengthen me to say no to what harms me and others.', fr: 'Fortifie-moi pour dire non à ce qui me fait du mal, à moi et aux autres.' }],
        },
      ],
    },
    {
      id: 'relationships',
      body: {
        en: 'Formation becomes visible in how we treat others: forgiving, showing mercy, making peace, giving generously and loving people we find difficult, even enemies.',
        fr: 'La formation devient visible dans notre manière de traiter les autres : pardonner, faire miséricorde, rechercher la paix, donner avec générosité et aimer ceux qui nous sont difficiles, jusqu’à nos ennemis.',
      },
      refs: ['Matthew 5:9', 'Matthew 5:43-48', 'Matthew 6:14-15', 'Romans 12:9-21', 'Ephesians 4:31-32', 'Colossians 3:12-15', 'Hebrews 12:14'],
      prompts: [
        { en: 'Show me where I need to forgive.', fr: 'Montre-moi où je dois pardonner.' },
        { en: 'Remove bitterness from my heart.', fr: 'Ôte l’amertume de mon cœur.' },
        { en: 'Teach me to pursue peace.', fr: 'Apprends-moi à rechercher la paix.' },
        { en: 'Make me compassionate.', fr: 'Donne-moi un cœur plein de compassion.' },
        { en: 'Teach me to love people I find difficult.', fr: 'Apprends-moi à aimer ceux qui me sont difficiles.' },
      ],
    },
  ],
  // Qualitative only. Nothing here is ever scored, stored or counted.
  reflection: [
    { en: 'Where is Christ already producing fruit in your life?', fr: 'Où Christ produit-il déjà du fruit dans votre vie ?' },
    { en: 'Where do you most need His transforming work?', fr: 'Où avez-vous le plus besoin de son œuvre de transformation ?' },
    { en: 'Is there something you know to be true but have not yet obeyed?', fr: 'Y a-t-il une vérité que vous connaissez mais à laquelle vous n’avez pas encore obéi ?' },
    { en: 'Which fruit of the Spirit do you most need God to form in you now?', fr: 'Quel aspect du fruit de l’Esprit avez-vous le plus besoin que Dieu forme en vous maintenant ?' },
  ],
};
