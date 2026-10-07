// Kingdom & Mission — DEEP layer (draft until ../review.js carries a human
// sign-off). English + French only; other languages fall back to English.
//
// `themes` matches the short layer's themes BY ID AND ORDER (asserted by the
// contract test).
//
// Guardrails applied in this file: Scripture by reference only, never quoted —
// the prayer Jesus taught is cited as Matthew 6:9-10 and never written out;
// never domination of people or institutions and never a private spiritual
// empire; gospel, discipleship, mercy, justice, truth, love and obedience held
// together, the Kingdom collapsed into neither social action alone nor
// proclamation alone; revival is longed for, never promised or manufactured;
// prayer leads to obedience and mission; prompts are prayers a person may pray
// in their own words.
export default {
  id: 'kingdom',
  meaning: {
    en: 'The widest horizon of prayer is the one Jesus taught His disciples to pray for: God’s Kingdom and God’s will, above our own plans. Every other circle fits inside it. Praying for the Kingdom is never about building our own spiritual empires or dominating people and institutions. God’s people take part in His purposes through prayer, witness, discipleship, mercy, justice, reconciliation and service, and prayer may send you back into the world to obey.',
    fr: 'Le plus vaste horizon de la prière est celui que Jésus a appris à ses disciples à demander : le Royaume de Dieu et sa volonté, avant nos propres projets. Tous les autres cercles s’y inscrivent. Prier pour le Royaume, ce n’est jamais bâtir son propre empire spirituel ni dominer des personnes ou des institutions. Le peuple de Dieu prend part à ses desseins par la prière, le témoignage, la formation de disciples, la miséricorde, la justice, la réconciliation et le service, et la prière peut vous renvoyer dans le monde pour obéir.',
  },
  themes: [
    {
      id: 'not-mine',
      body: {
        en: 'Prayer is not a way to build a private spiritual empire. Ask God to align your desires, your plans and your ambitions with His Kingdom.',
        fr: 'La prière n’est pas un moyen de bâtir un empire spirituel personnel. Demandez à Dieu d’accorder vos désirs, vos projets et vos ambitions à son Royaume.',
      },
      refs: ['Matthew 6:9-10', 'Matthew 6:33', 'Luke 22:42'],
      prompts: [
        { en: 'Let Your Kingdom matter more to me than my plans.', fr: 'Que ton Royaume compte plus pour moi que mes projets.' },
        { en: 'Align my desires with Your will.', fr: 'Accorde mes désirs à ta volonté.' },
      ],
    },
    {
      id: 'harvest',
      body: {
        en: 'Jesus told His followers to pray for workers. Pray for missionaries, pastors, evangelists, disciple-makers, church planters and ordinary believers living as faithful witnesses.',
        fr: 'Jésus a demandé à ses disciples de prier pour des ouvriers. Priez pour les missionnaires, les pasteurs, les évangélistes, ceux qui forment des disciples, ceux qui implantent des Églises et les croyants ordinaires qui vivent en témoins fidèles.',
      },
      refs: ['Matthew 9:37-38', 'Luke 10:1-2', 'Romans 10:14-15'],
      prompts: [
        { en: 'Raise up workers for Your harvest, near and far.', fr: 'Suscite des ouvriers pour ta moisson, près et loin.' },
        { en: 'Strengthen those You have already sent.', fr: 'Fortifie ceux que tu as déjà envoyés.' },
      ],
    },
    {
      id: 'gospel',
      body: {
        en: 'Pray for Christ to be made known, in words and in lives that match them.',
        fr: 'Priez pour que Christ soit connu, par des paroles et par des vies qui leur correspondent.',
      },
      refs: ['Colossians 4:2-4', 'Ephesians 6:18-20', 'Romans 1:16'],
      prompts: [
        { en: 'Open doors for the gospel.', fr: 'Ouvre des portes à l’Évangile.' },
        { en: 'Give Your people clear and courageous words.', fr: 'Donne à ton peuple des paroles claires et courageuses.' },
      ],
    },
    {
      id: 'discipleship',
      body: {
        en: 'Mission is more than a first decision. Pray for people to grow into mature disciples who obey Jesus and teach others.',
        fr: 'La mission ne s’arrête pas à une première décision. Priez pour que des personnes deviennent des disciples matures, qui obéissent à Jésus et en enseignent d’autres.',
      },
      refs: ['Matthew 28:18-20', '2 Timothy 2:2', 'Colossians 1:28-29'],
      prompts: [
        { en: 'Form disciples who make other disciples.', fr: 'Forme des disciples qui forment d’autres disciples.' },
        { en: 'Show me whom I can help to follow You.', fr: 'Montre-moi qui je peux aider à te suivre.' },
      ],
    },
    {
      id: 'scripture-access',
      body: {
        en: 'Pray for Bible translation, distribution, teaching and literacy, so that every people can read and understand God’s Word.',
        fr: 'Priez pour la traduction, la diffusion et l’enseignement de la Bible, et pour l’alphabétisation, afin que chaque peuple puisse lire et comprendre la Parole de Dieu.',
      },
      refs: ['Psalm 119:105', 'Romans 10:17', 'Nehemiah 8:8'],
      prompts: [
        { en: 'Give every people Your Word in their own language.', fr: 'Donne à chaque peuple ta Parole dans sa propre langue.' },
        { en: 'Bless those who translate and teach Scripture.', fr: 'Bénis ceux qui traduisent et enseignent l’Écriture.' },
      ],
    },
    {
      id: 'justice-mercy',
      body: {
        en: 'Hold together gospel, discipleship, mercy, justice, truth, love and obedience. God’s Kingdom is neither social action alone nor proclamation alone: pray for His people to serve the vulnerable faithfully.',
        fr: 'Tenez ensemble l’Évangile, la formation de disciples, la miséricorde, la justice, la vérité, l’amour et l’obéissance. Le Royaume de Dieu n’est ni la seule action sociale ni la seule proclamation : priez pour que son peuple serve fidèlement les plus vulnérables.',
      },
      refs: ['Micah 6:8', 'Matthew 25:35-40', 'James 1:27'],
      prompts: [
        { en: 'Make Your people faithful to the poor and the vulnerable.', fr: 'Rends ton peuple fidèle envers les pauvres et les plus vulnérables.' },
        { en: 'Let our words and our deeds tell the same gospel.', fr: 'Que nos paroles et nos actes annoncent le même Évangile.' },
      ],
    },
    {
      id: 'awakening',
      body: {
        en: 'You may long for widespread repentance, renewed devotion to God and fruit for the gospel. Pray with hope, without promising revival or trying to manufacture it: it is God’s work.',
        fr: 'Vous pouvez désirer une large repentance, un attachement renouvelé à Dieu et du fruit pour l’Évangile. Priez avec espérance, sans promettre un réveil ni chercher à le fabriquer : c’est l’œuvre de Dieu.',
      },
      refs: ['Habakkuk 3:2', 'Psalm 85:6-7', 'Acts 3:19-20'],
      prompts: [
        { en: 'Renew Your people’s love for You.', fr: 'Renouvelle l’amour de ton peuple pour toi.' },
        { en: 'Bring repentance and new life, in Your time.', fr: 'Donne la repentance et une vie nouvelle, en ton temps.' },
      ],
    },
    {
      id: 'sending',
      body: {
        en: 'Prayer, obedience and mission belong together. Could God be inviting you to take part in what you are praying for: to go, give, serve, help someone follow Jesus, welcome, encourage, speak, support a missionary or keep praying faithfully?',
        fr: 'La prière, l’obéissance et la mission vont ensemble. Dieu vous invite-t-il à prendre part à ce que vous demandez : partir, donner, servir, aider quelqu’un à suivre Jésus, accueillir, encourager, parler, soutenir un missionnaire ou continuer de prier fidèlement ?',
      },
      refs: ['Isaiah 6:8', 'Acts 13:1-3', 'John 20:21'],
      prompts: [
        { en: 'Show me my part in what I pray for.', fr: 'Montre-moi ma part dans ce que je te demande.' },
        { en: 'Make me willing to go where You send me.', fr: 'Rends-moi disponible pour aller là où tu m’envoies.' },
      ],
    },
  ],
  // Qualitative only. Nothing here is ever scored, stored or counted.
  reflection: [
    { en: 'Is your prayer mostly about asking God to bless your plans?', fr: 'Votre prière consiste-t-elle surtout à demander à Dieu de bénir vos projets ?' },
    { en: 'Where might God be inviting you to take part in what you pray about?', fr: 'Où Dieu vous invite-t-il peut-être à prendre part à ce que vous demandez ?' },
    { en: 'Who needs to hear the gospel?', fr: 'Qui a besoin d’entendre l’Évangile ?' },
    { en: 'Which worker, church, missionary or people could you carry faithfully?', fr: 'Quel ouvrier, quelle Église, quel missionnaire ou quel peuple pourriez-vous porter fidèlement ?' },
  ],
};
