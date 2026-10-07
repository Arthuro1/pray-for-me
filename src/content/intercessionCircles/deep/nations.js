// Nations — DEEP layer (draft until ../review.js carries a human sign-off).
// English + French only; other languages fall back to English.
//
// `themes` matches the short layer's themes BY ID AND ORDER (asserted by the
// contract test).
//
// Guardrails applied in this file: Scripture by reference only, never quoted;
// never Christian nationalism — praying for one's own country is not treating
// it as uniquely entitled to God's favor; a person always CHOOSES the nation or
// people they carry, nothing is assigned; peace, the vulnerable, justice and the
// gospel are held together; prompts are prayers a person may pray in their own
// words.
export default {
  id: 'nations',
  meaning: {
    en: 'God’s concern reaches every nation, people, language and culture. Let your prayer grow beyond your own world: your own country and others, a city, a region, a people group, places of war or disaster, refugees, missionaries, persecuted believers and peoples who have not yet heard the gospel. You choose what you carry, and you might carry one nation long enough to learn about its people, its churches and its needs.',
    fr: 'Le souci de Dieu s’étend à chaque nation, chaque peuple, chaque langue et chaque culture. Laissez votre prière dépasser votre propre horizon : votre pays et d’autres, une ville, une région, un peuple, des lieux de guerre ou de catastrophe, les réfugiés, les missionnaires, les chrétiens persécutés et les peuples qui n’ont pas encore entendu l’Évangile. C’est vous qui choisissez ce que vous portez, et vous pouvez porter une nation assez longtemps pour apprendre à connaître ses habitants, ses Églises et ses besoins.',
  },
  themes: [
    {
      id: 'peace',
      body: {
        en: 'Pray for peace where there is war, for an end to violence and for leaders who seek peace.',
        fr: 'Priez pour la paix là où il y a la guerre, pour la fin des violences et pour des dirigeants qui recherchent la paix.',
      },
      refs: ['Isaiah 2:2-4', 'Psalm 46:8-11', 'Matthew 5:9'],
      prompts: [
        { en: 'Bring peace where there is war.', fr: 'Donne la paix là où règne la guerre.' },
        { en: 'Make peacemakers of those who can end this conflict.', fr: 'Fais des artisans de paix de ceux qui peuvent mettre fin à ce conflit.' },
      ],
    },
    {
      id: 'vulnerable',
      body: {
        en: 'Pray for civilians, displaced people, refugees, children and all who are most exposed when nations suffer.',
        fr: 'Priez pour les civils, les personnes déplacées, les réfugiés, les enfants et tous ceux qui sont les plus exposés quand les nations souffrent.',
      },
      refs: ['Psalm 146:7-9', 'Deuteronomy 10:18-19', 'Matthew 25:35-40'],
      prompts: [
        { en: 'Protect civilians and children caught in conflict.', fr: 'Protège les civils et les enfants pris dans les conflits.' },
        { en: 'Give refugees safety, welcome and hope.', fr: 'Donne aux réfugiés sécurité, accueil et espérance.' },
      ],
    },
    {
      id: 'reconciliation',
      body: {
        en: 'Pray against hatred between peoples, and for reconciliation that is honest about the wrongs that were done.',
        fr: 'Priez contre la haine entre les peuples, et pour une réconciliation qui reconnaît honnêtement les torts commis.',
      },
      refs: ['Ephesians 2:14-18', 'Revelation 7:9-10', 'Galatians 3:28'],
      prompts: [
        { en: 'Break down hatred between peoples.', fr: 'Abats la haine entre les peuples.' },
        { en: 'Make Your Church a place of reconciliation.', fr: 'Fais de ton Église un lieu de réconciliation.' },
      ],
    },
    {
      id: 'justice',
      body: {
        en: 'Pray for societies marked by truth and justice, where the powerful cannot crush the weak.',
        fr: 'Priez pour des sociétés marquées par la vérité et la justice, où les puissants ne peuvent pas écraser les faibles.',
      },
      refs: ['Isaiah 1:17', 'Jeremiah 22:3', 'Psalm 82:3-4'],
      prompts: [
        { en: 'Let justice and truth grow in this nation.', fr: 'Fais grandir la justice et la vérité dans cette nation.' },
        { en: 'Defend those who cannot defend themselves.', fr: 'Défends ceux qui ne peuvent pas se défendre.' },
      ],
    },
    {
      id: 'local-church',
      body: {
        en: 'Pray for the believers who live in that country: their churches, their leaders and their witness.',
        fr: 'Priez pour les croyants qui vivent dans ce pays : leurs Églises, leurs responsables et leur témoignage.',
      },
      refs: ['Philippians 1:3-11', 'Colossians 1:3-12'],
      prompts: [
        { en: 'Strengthen the Church in this nation.', fr: 'Fortifie l’Église dans cette nation.' },
        { en: 'Give its leaders wisdom and courage.', fr: 'Donne à ses responsables sagesse et courage.' },
      ],
    },
    {
      id: 'mission',
      body: {
        en: 'Pray for gospel witness, missionaries, local Christian leaders, the making of disciples and access to Scripture among every people.',
        fr: 'Priez pour le témoignage de l’Évangile, les missionnaires, les responsables chrétiens locaux, la formation de disciples et l’accès à l’Écriture dans chaque peuple.',
      },
      refs: ['Matthew 28:18-20', 'Matthew 24:14', 'Romans 10:14-15', 'Psalm 67'],
      prompts: [
        { en: 'Let the gospel be heard among this people.', fr: 'Que l’Évangile soit entendu parmi ce peuple.' },
        { en: 'Bless the missionaries and local leaders who serve there.', fr: 'Bénis les missionnaires et les responsables locaux qui y servent.' },
      ],
    },
    {
      id: 'persecuted',
      body: {
        en: 'Pray for Christians who face persecution or pressure because of their faith.',
        fr: 'Priez pour les chrétiens qui subissent la persécution ou des pressions à cause de leur foi.',
      },
      refs: ['Hebrews 13:3', 'Matthew 5:10-12', '1 Peter 4:12-14'],
      prompts: [
        { en: 'Sustain believers under pressure for their faith.', fr: 'Soutiens les croyants mis sous pression à cause de leur foi.' },
        { en: 'Give them courage, and soften the hearts of those who oppose them.', fr: 'Donne-leur du courage, et adoucis le cœur de ceux qui s’opposent à eux.' },
      ],
    },
    {
      id: 'humility',
      body: {
        en: 'Praying for your own country does not mean treating it as uniquely entitled to God’s favor. Pray for it with humility, as Daniel prayed for his people, confessing its wrongs as well as asking for its good.',
        fr: 'Prier pour votre pays ne veut pas dire le considérer comme ayant un droit particulier à la faveur de Dieu. Priez pour lui avec humilité, comme Daniel a prié pour son peuple, en confessant ses torts autant qu’en demandant son bien.',
      },
      refs: ['Daniel 9:4-19', 'Jeremiah 29:7', 'Acts 17:26-27'],
      prompts: [
        { en: 'Teach me to pray for my country with humility.', fr: 'Apprends-moi à prier pour mon pays avec humilité.' },
        { en: 'Forgive our nation’s wrongs and lead it toward what is right.', fr: 'Pardonne les torts de notre nation et conduis-la vers ce qui est juste.' },
        { en: 'Teach me to love other peoples as You love them.', fr: 'Apprends-moi à aimer les autres peuples comme tu les aimes.' },
      ],
    },
  ],
  // Qualitative only. Nothing here is ever scored, stored or counted.
  reflection: [
    { en: 'Is your prayer life mostly limited to your immediate needs?', fr: 'Votre vie de prière se limite-t-elle surtout à vos besoins immédiats ?' },
    { en: 'Which nation or people has repeatedly been placed on your heart?', fr: 'Quelle nation ou quel peuple revient sans cesse sur votre cœur ?' },
    { en: 'Could you carry one nation long enough to learn about its people, its churches and its needs?', fr: 'Pourriez-vous porter une nation assez longtemps pour connaître ses habitants, ses Églises et ses besoins ?' },
  ],
};
