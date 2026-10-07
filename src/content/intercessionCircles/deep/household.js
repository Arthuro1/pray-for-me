// My house — DEEP layer (draft until ../review.js carries a human sign-off).
// English + French only; other languages fall back to English.
//
// `themes` matches the short layer's themes BY ID AND ORDER (asserted by the
// contract test).
//
// Guardrails applied in this file: Scripture by reference only, never quoted;
// prayer for a home is formation, never fear-driven protection; a household is
// whatever home someone has (a couple, a family, one person living alone);
// forgiveness never requires staying in harm's way, and trust broken by abuse
// is restored only where that is wise and safe; prompts are prayers a person
// may pray in their own words — the composer never pre-writes them.
export default {
  id: 'household',
  meaning: {
    en: 'Prayer for a household is more than asking God to protect it. It asks Him to form it, so that Christ is known, loved, obeyed and reflected in the way its members treat one another. A household may be a married couple, parents and children, relatives under one roof or one person living alone: faith belongs in ordinary home life wherever it is lived.',
    fr: 'Prier pour un foyer, c’est plus que demander à Dieu de le protéger. C’est lui demander de le former, pour que Christ y soit connu, aimé, obéi et reflété dans la manière dont chacun traite les autres. Un foyer peut être un couple, des parents et leurs enfants, une famille élargie sous un même toit ou une personne qui vit seule : la foi se vit dans le quotidien de la maison, quelle qu’elle soit.',
  },
  themes: [
    {
      id: 'marriage-family',
      body: {
        en: 'Pray for relationships shaped by Christ: love that gives itself, faithfulness, humility, honest and kind words, mutual honor and patience.',
        fr: 'Priez pour des relations façonnées par Christ : un amour qui se donne, la fidélité, l’humilité, des paroles vraies et bienveillantes, l’honneur mutuel et la patience.',
      },
      refs: ['Ephesians 5:21-33', 'Colossians 3:12-14', '1 Corinthians 13:4-7', 'Ephesians 4:29'],
      prompts: [
        { en: 'Teach us to love one another as Christ loves us.', fr: 'Apprends-nous à nous aimer comme Christ nous aime.' },
        { en: 'Give us patience and humility with each other.', fr: 'Donne-nous patience et humilité les uns envers les autres.' },
        { en: 'Let our words build up and not wound.', fr: 'Que nos paroles édifient au lieu de blesser.' },
        { en: 'Keep us faithful to one another.', fr: 'Garde-nous fidèles les uns envers les autres.' },
      ],
    },
    {
      id: 'children',
      body: {
        en: 'Pray that children come to know God for themselves, that those who raise them receive wisdom, and that Scripture and prayer become a natural part of home life.',
        fr: 'Priez pour que les enfants connaissent Dieu par eux-mêmes, que ceux qui les élèvent reçoivent la sagesse, et que l’Écriture et la prière deviennent une part naturelle de la vie du foyer.',
      },
      refs: ['Deuteronomy 6:4-9', 'Psalm 78:4-7', 'Ephesians 6:4', 'Luke 2:52', 'Mark 10:13-16'],
      prompts: [
        { en: 'Let the children in my home come to know You for themselves.', fr: 'Que les enfants de mon foyer apprennent à te connaître par eux-mêmes.' },
        { en: 'Give wisdom and patience to those who raise them.', fr: 'Donne sagesse et patience à ceux qui les élèvent.' },
        { en: 'Make Scripture and prayer a natural part of our home.', fr: 'Fais de l’Écriture et de la prière une part naturelle de notre foyer.' },
        { en: 'Let them grow in wisdom and in faith.', fr: 'Fais-les grandir en sagesse et dans la foi.' },
      ],
    },
    {
      id: 'forgiveness',
      body: {
        en: 'Pray for humility to apologize, willingness to forgive, healing of wounds and freedom from bitterness. Forgiveness does not require staying in harm’s way: where trust was broken by abuse, safety comes first, and trust is restored only where that is wise and safe.',
        fr: 'Priez pour l’humilité de demander pardon, la disposition à pardonner, la guérison des blessures et la libération de l’amertume. Pardonner n’oblige pas à rester en danger : là où la confiance a été brisée par des violences, la sécurité passe d’abord, et la confiance ne se rétablit que là où c’est sage et sûr.',
      },
      refs: ['Colossians 3:13', 'Ephesians 4:31-32', 'Matthew 18:21-22', 'Hebrews 12:14-15', 'Romans 12:18'],
      prompts: [
        { en: 'Give me humility to apologize where I have done wrong.', fr: 'Donne-moi l’humilité de demander pardon là où j’ai fait du tort.' },
        { en: 'Make me willing to forgive.', fr: 'Donne-moi de vouloir pardonner.' },
        { en: 'Heal the wounds in our home.', fr: 'Guéris les blessures de notre foyer.' },
        { en: 'Free us from bitterness, and restore trust where it is wise and safe.', fr: 'Libère-nous de l’amertume, et rétablis la confiance là où c’est sage et sûr.' },
      ],
    },
    {
      id: 'wisdom-protection',
      body: {
        en: 'Ask for wisdom, health, protection, wise decisions, good stewardship of money and discernment, out of trust in the Father who cares for you, not out of fear.',
        fr: 'Demandez la sagesse, la santé, la protection, des décisions avisées, une bonne gestion de l’argent et le discernement, dans la confiance envers le Père qui prend soin de vous, et non dans la peur.',
      },
      refs: ['Proverbs 24:3-4', 'James 1:5', 'Psalm 121', 'Philippians 4:6-7', 'Luke 12:22-31'],
      prompts: [
        { en: 'Give us wisdom for the decisions before us.', fr: 'Donne-nous la sagesse pour les décisions qui sont devant nous.' },
        { en: 'Watch over the health and safety of my household.', fr: 'Veille sur la santé et la sécurité de mon foyer.' },
        { en: 'Teach us to steward well what You provide.', fr: 'Apprends-nous à bien gérer ce que tu nous donnes.' },
        { en: 'Replace our anxiety with trust in You.', fr: 'Remplace notre inquiétude par la confiance en toi.' },
      ],
    },
    {
      id: 'generations',
      body: {
        en: 'Pray that faith, wisdom and godly character are passed on faithfully, and that each generation tells the next what God has done.',
        fr: 'Priez pour que la foi, la sagesse et un caractère selon Dieu se transmettent fidèlement, et que chaque génération raconte à la suivante ce que Dieu a fait.',
      },
      refs: ['2 Timothy 1:5', 'Psalm 145:4', 'Joshua 24:15', 'Psalm 103:17-18'],
      prompts: [
        { en: 'Let faith be passed on faithfully from one generation to the next.', fr: 'Que la foi se transmette fidèlement d’une génération à l’autre.' },
        { en: 'Make me a faithful example to those who come after me.', fr: 'Fais de moi un exemple fidèle pour ceux qui viennent après moi.' },
        { en: 'Let our family tell of what You have done.', fr: 'Que notre famille raconte ce que tu as fait.' },
      ],
    },
  ],
  // Qualitative only. Nothing here is ever scored, stored or counted.
  reflection: [
    { en: 'What kind of spiritual atmosphere are you helping to create at home?', fr: 'Quelle atmosphère spirituelle contribuez-vous à créer chez vous ?' },
    { en: 'Where does your household most need peace or healing?', fr: 'Où votre foyer a-t-il le plus besoin de paix ou de guérison ?' },
    { en: 'Who in your family would you like to bring before God again?', fr: 'Qui, dans votre famille, aimeriez-vous de nouveau porter devant Dieu ?' },
    { en: 'Which spiritual practices could become more natural in your home?', fr: 'Quelles pratiques spirituelles pourraient devenir plus naturelles dans votre foyer ?' },
  ],
};
