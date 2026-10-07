// Authorities — DEEP layer (draft until ../review.js carries a human sign-off).
// English + French only; other languages fall back to English.
//
// `themes` matches the short layer's themes BY ID AND ORDER (asserted by the
// contract test).
//
// Guardrails applied in this file (NONPARTISAN by construction): Scripture by
// reference only, never quoted; prayer for leaders whether or not we agree with
// them; never a party, a candidate, a political outcome or a claim that God
// chose a movement; never "taking authority" over a government or ruling a
// nation spiritually — we bring those entrusted with responsibility before God.
// Qetoret never decides which leaders deserve prayer.
export default {
  id: 'authorities',
  meaning: {
    en: 'Scripture calls believers to pray for everyone, including those in authority: presidents, prime ministers, monarchs, legislators, judges, governors, mayors, civil servants and those who keep the public safe. Qetoret never decides which leaders deserve prayer, never favors a party or a candidate, and never treats prayer as a way to take control of a government. We bring those entrusted with responsibility before God.',
    fr: 'L’Écriture appelle les croyants à prier pour tous, y compris pour ceux qui exercent l’autorité : présidents, Premiers ministres, souverains, parlementaires, juges, gouverneurs, maires, fonctionnaires et ceux qui veillent à la sécurité publique. Qetoret ne décide jamais quels dirigeants méritent la prière, ne favorise jamais un parti ou un candidat, et ne présente jamais la prière comme un moyen de prendre le contrôle d’un gouvernement. Nous portons devant Dieu ceux à qui une responsabilité est confiée.',
  },
  themes: [
    {
      id: 'wisdom',
      body: {
        en: 'Pray for sound judgment and good counsel for those who must decide for many.',
        fr: 'Priez pour un jugement sûr et de bons conseils pour ceux qui doivent décider pour beaucoup.',
      },
      refs: ['Proverbs 21:1', '1 Kings 3:9', 'James 1:5'],
      prompts: [
        { en: 'Give our leaders wisdom beyond their own.', fr: 'Donne à nos dirigeants une sagesse qui dépasse la leur.' },
        { en: 'Surround them with honest and wise counsel.', fr: 'Entoure-les de conseillers honnêtes et sages.' },
      ],
    },
    {
      id: 'justice',
      body: {
        en: 'Pray that leaders act fairly and protect the vulnerable, the poor and those without a voice.',
        fr: 'Priez pour que les dirigeants agissent avec équité et protègent les plus vulnérables, les pauvres et ceux qui n’ont pas de voix.',
      },
      refs: ['Micah 6:8', 'Psalm 72:1-4', 'Proverbs 31:8-9'],
      prompts: [
        { en: 'Let justice protect the weak in our land.', fr: 'Que la justice protège les plus faibles dans notre pays.' },
        { en: 'Give our judges fairness and courage.', fr: 'Donne à nos juges l’équité et le courage.' },
      ],
    },
    {
      id: 'integrity',
      body: {
        en: 'Pray against corruption and dishonesty, and for leaders who keep their word.',
        fr: 'Priez contre la corruption et la malhonnêteté, et pour des dirigeants qui tiennent parole.',
      },
      refs: ['Proverbs 16:12', 'Proverbs 29:4', 'Exodus 18:21'],
      prompts: [
        { en: 'Turn our leaders away from corruption.', fr: 'Détourne nos dirigeants de la corruption.' },
        { en: 'Raise up honest people in public life.', fr: 'Suscite des personnes intègres dans la vie publique.' },
      ],
    },
    {
      id: 'restraint',
      body: {
        en: 'Pray that authority is used to serve and not abused, and that those who hold power remember they will give account.',
        fr: 'Priez pour que l’autorité serve au lieu d’être détournée, et que ceux qui détiennent le pouvoir se souviennent qu’ils en rendront compte.',
      },
      refs: ['Mark 10:42-45', 'Deuteronomy 17:18-20'],
      prompts: [
        { en: 'Keep those in power from abusing it.', fr: 'Garde ceux qui ont le pouvoir d’en abuser.' },
        { en: 'Teach them to lead by serving.', fr: 'Apprends-leur à diriger en servant.' },
      ],
    },
    {
      id: 'peace',
      body: {
        en: 'Pray against needless violence, hatred and conflict, and for a peace in which people can live quiet and faithful lives.',
        fr: 'Priez contre la violence, la haine et les conflits inutiles, et pour une paix où chacun puisse mener une vie tranquille et fidèle.',
      },
      refs: ['1 Timothy 2:1-4', 'Jeremiah 29:7', 'Psalm 34:14'],
      prompts: [
        { en: 'Give our land peace.', fr: 'Donne la paix à notre pays.' },
        { en: 'Turn leaders away from hatred and needless violence.', fr: 'Détourne les dirigeants de la haine et de la violence inutile.' },
      ],
    },
    {
      id: 'governance',
      body: {
        en: 'Pray for competence, wise administration and truthful counsel in the everyday work of public service.',
        fr: 'Priez pour la compétence, une administration avisée et des conseils véridiques dans le travail quotidien du service public.',
      },
      refs: ['Romans 13:1-7', 'Proverbs 11:14', 'Proverbs 29:2'],
      prompts: [
        { en: 'Bless the public servants who keep our communities running.', fr: 'Bénis les agents publics qui font vivre nos communautés.' },
        { en: 'Give those who govern competence and truthful counsel.', fr: 'Donne à ceux qui gouvernent la compétence et des conseils véridiques.' },
      ],
    },
    {
      id: 'disagreement',
      body: {
        en: 'Pray for leaders across political differences, including those whose decisions you oppose. Qetoret never tells you which political outcome to ask for: bring them before God and ask that His purposes of righteousness, peace and truth prevail.',
        fr: 'Priez pour les dirigeants au-delà des divergences politiques, y compris ceux dont vous contestez les décisions. Qetoret ne vous dit jamais quel résultat politique demander : portez-les devant Dieu et demandez que ses desseins de justice, de paix et de vérité s’accomplissent.',
      },
      refs: ['1 Timothy 2:1-2', 'Matthew 5:44', 'Jeremiah 29:7'],
      prompts: [
        { en: 'Help me pray for leaders I disagree with.', fr: 'Aide-moi à prier pour les dirigeants avec qui je suis en désaccord.' },
        { en: 'Guard my heart from contempt for those who lead.', fr: 'Garde mon cœur du mépris envers ceux qui dirigent.' },
        { en: 'Let Your purposes of righteousness, peace and truth prevail.', fr: 'Que tes desseins de justice, de paix et de vérité s’accomplissent.' },
      ],
    },
  ],
  // Qualitative only. Nothing here is ever scored, stored or counted.
  reflection: [
    { en: 'Do you pray only for leaders you support?', fr: 'Priez-vous seulement pour les dirigeants que vous soutenez ?' },
    { en: 'How can you pray faithfully for someone whose policies you oppose?', fr: 'Comment prier fidèlement pour quelqu’un dont vous contestez les choix politiques ?' },
    { en: 'Where does your society most need wisdom, justice and peace?', fr: 'Où votre société a-t-elle le plus besoin de sagesse, de justice et de paix ?' },
  ],
};
