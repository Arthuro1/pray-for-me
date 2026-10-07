// His Church — DEEP layer (draft until ../review.js carries a human sign-off).
// English + French only; other languages fall back to English.
//
// `themes` matches the short layer's themes BY ID AND ORDER (asserted by the
// contract test).
//
// Guardrails applied in this file: Scripture by reference only, never quoted;
// the Church belongs to Christ and believers pray for her rather than merely
// criticize her — but praying for the Church never means staying silent about
// harm done in her (see the churchHurt21 plan); gifts build others up and never
// create status; prompts are prayers a person may pray in their own words.
export default {
  id: 'church',
  meaning: {
    en: 'The Church belongs to Christ, and He loves her. It is easy to criticize the Church; Qetoret invites you to pray for her first: for your local church, its pastors and members, believers across the world and those who suffer for their faith. Praying for the Church does not mean staying silent about harm. It means bringing even what is wrong before Christ, who calls His people to holiness.',
    fr: 'L’Église appartient à Christ, et il l’aime. Il est facile de critiquer l’Église ; Qetoret vous invite d’abord à prier pour elle : pour votre Église locale, ses pasteurs et ses membres, les croyants à travers le monde et ceux qui souffrent pour leur foi. Prier pour l’Église ne veut pas dire se taire face au mal. C’est apporter même ce qui ne va pas devant Christ, qui appelle son peuple à la sainteté.',
  },
  themes: [
    {
      id: 'unity',
      body: {
        en: 'Pray for unity rooted in Christ and in truth, not a surface agreement that avoids every difficulty.',
        fr: 'Priez pour une unité enracinée en Christ et dans la vérité, et non pour un accord de surface qui évite toute difficulté.',
      },
      refs: ['John 17:20-23', 'Ephesians 4:1-6', 'Philippians 2:1-2'],
      prompts: [
        { en: 'Make Your Church one in Christ and in truth.', fr: 'Rends ton Église une, en Christ et dans la vérité.' },
        { en: 'Heal the divisions in my church.', fr: 'Guéris les divisions dans mon Église.' },
        { en: 'Make me a peacemaker among Your people.', fr: 'Fais de moi un artisan de paix au milieu de ton peuple.' },
      ],
    },
    {
      id: 'holiness',
      body: {
        en: 'Pray that the Church reflects Jesus: repentance, integrity, purity, love and humility.',
        fr: 'Priez pour que l’Église reflète Jésus : la repentance, l’intégrité, la pureté, l’amour et l’humilité.',
      },
      refs: ['1 Peter 1:15-16', 'Ephesians 5:25-27', 'Revelation 2:4-5'],
      prompts: [
        { en: 'Let Your Church reflect Jesus in the way she lives.', fr: 'Que ton Église reflète Jésus dans sa manière de vivre.' },
        { en: 'Bring us to repentance where we have wandered.', fr: 'Conduis-nous à la repentance là où nous nous sommes égarés.' },
        { en: 'Begin with me.', fr: 'Commence par moi.' },
      ],
    },
    {
      id: 'maturity',
      body: {
        en: 'Pray that believers grow beyond spiritual infancy into the maturity of Christ, rooted in His Word.',
        fr: 'Priez pour que les croyants dépassent l’enfance spirituelle et grandissent jusqu’à la maturité de Christ, enracinés dans sa Parole.',
      },
      refs: ['Ephesians 4:11-16', 'Hebrews 5:12-14', 'Colossians 1:28-29'],
      prompts: [
        { en: 'Help Your people grow up into Christ.', fr: 'Aide ton peuple à grandir en Christ.' },
        { en: 'Give my church hunger for Your Word.', fr: 'Donne à mon Église faim de ta Parole.' },
      ],
    },
    {
      id: 'leaders',
      body: {
        en: 'Carry pastors, elders, ministry leaders and missionaries. Pray for their integrity, wisdom, healthy families, courage and faithful teaching, and that they are kept from pride.',
        fr: 'Portez les pasteurs, les anciens, les responsables de ministère et les missionnaires. Priez pour leur intégrité, leur sagesse, la santé de leur famille, leur courage et la fidélité de leur enseignement, et pour qu’ils soient gardés de l’orgueil.',
      },
      refs: ['1 Peter 5:1-4', '1 Timothy 3:1-7', 'Hebrews 13:17-18'],
      prompts: [
        { en: 'Give our pastors integrity and wisdom.', fr: 'Donne à nos pasteurs intégrité et sagesse.' },
        { en: 'Keep our leaders from pride and strengthen their families.', fr: 'Garde nos responsables de l’orgueil et fortifie leurs familles.' },
        { en: 'Let them teach Your Word faithfully.', fr: 'Qu’ils enseignent ta Parole avec fidélité.' },
      ],
    },
    {
      id: 'mission',
      body: {
        en: 'Pray for workers for the harvest, missionaries, church planting, gospel witness and the making of disciples.',
        fr: 'Priez pour des ouvriers pour la moisson, les missionnaires, l’implantation d’Églises, le témoignage de l’Évangile et la formation de disciples.',
      },
      refs: ['Matthew 9:37-38', 'Acts 13:1-3', 'Ephesians 6:18-20'],
      prompts: [
        { en: 'Send workers into Your harvest.', fr: 'Envoie des ouvriers dans ta moisson.' },
        { en: 'Give my church courage to make Christ known.', fr: 'Donne à mon Église le courage de faire connaître Christ.' },
      ],
    },
    {
      id: 'persecuted',
      body: {
        en: 'Remember Christians who suffer because of their faith, as though you were suffering with them.',
        fr: 'Souvenez-vous des chrétiens qui souffrent à cause de leur foi, comme si vous souffriez avec eux.',
      },
      refs: ['Hebrews 13:3', '2 Corinthians 1:8-11', 'Acts 12:5'],
      prompts: [
        { en: 'Strengthen believers who suffer for Your name.', fr: 'Fortifie les croyants qui souffrent pour ton nom.' },
        { en: 'Give them courage, comfort and faithful friends.', fr: 'Donne-leur courage, consolation et des amis fidèles.' },
      ],
    },
    {
      id: 'gifts',
      body: {
        en: 'Pray that spiritual gifts build others up rather than create status, and that every member finds a way to serve.',
        fr: 'Priez pour que les dons spirituels édifient les autres au lieu de créer des rangs, et que chaque membre trouve sa manière de servir.',
      },
      refs: ['1 Corinthians 12:4-7', '1 Peter 4:10-11', 'Romans 12:4-8'],
      prompts: [
        { en: 'Show me how I can serve Your Church.', fr: 'Montre-moi comment servir ton Église.' },
        { en: 'Let every gift among us build others up.', fr: 'Que chaque don parmi nous serve à édifier les autres.' },
      ],
    },
  ],
  // Qualitative only. Nothing here is ever scored, stored or counted.
  reflection: [
    { en: 'Do you pray for your church as readily as you criticize it?', fr: 'Priez-vous pour votre Église aussi volontiers que vous la critiquez ?' },
    { en: 'Which leaders are you intentionally carrying in prayer?', fr: 'Quels responsables portez-vous délibérément dans la prière ?' },
    { en: 'Where does your church need greater unity, holiness or courage?', fr: 'Où votre Église a-t-elle besoin de plus d’unité, de sainteté ou de courage ?' },
    { en: 'How might prayer move you toward serving the Church?', fr: 'Comment la prière pourrait-elle vous conduire à servir l’Église ?' },
  ],
};
