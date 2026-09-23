// Myles Munroe. English originals from Whitaker House and Destiny Image (whose
// shop is Nori Media Group's); French editions from Éditions Bethesda; Spanish
// from Whitaker House's Spanish list. Titles marked sold out at Nori Media Group
// (Kingdom Parenting, In Pursuit of Purpose, Overcoming Crisis and others) are
// left out rather than linked to a page that cannot sell them.
import { edition, unlinkedEdition, authorBook } from './shared';

const whitaker = (title, product, extra) => edition(title, 'Myles Munroe', 'Whitaker House', `https://www.whitakerhouse.com/product/${product}`, extra);
const destinyImage = (title, product, extra) => edition(title, 'Myles Munroe', 'Destiny Image', `https://norimediagroup.com/products/${product}`, extra);
const bethesda = (title, book, extra) => edition(title, 'Myles Munroe', 'Éditions Bethesda', `https://www.editionsbethesda.com/livre/${book}`, extra);
const OUT_OF_STOCK = { available: false };
const CHARISMATIC = ['charismatic'];

export const MUNROE_BOOKS = [
  // ── On the current plans ─────────────────────────────────────────────────
  authorBook({
    id: 'munroe-purpose-and-power-of-prayer',
    language: 'en',
    domains: ['relationships', 'freedom'],
    perspective: CHARISMATIC,
    topics: ['prayer'],
    description: {
      en: 'Why and how to pray: prayer as partnering with God’s purposes on earth.',
      fr: 'Pourquoi et comment prier : la prière comme collaboration aux desseins de Dieu sur la terre.',
      es: 'Por qué y cómo orar: la oración como colaboración con los propósitos de Dios en la tierra.',
    },
    editions: {
      en: whitaker('Understanding the Purpose and Power of Prayer', 'understanding-the-purpose-and-power-of-prayer-expanded-edition', { isbn: '9781629119175' }),
      es: whitaker('Entendiendo el propósito y el poder de la oración', 'span-understanding-the-purpose-and-power-of-prayer-expanded-edition', { isbn: '9781629119199' }),
    },
  }),
  authorBook({
    id: 'munroe-purpose-and-power-of-the-holy-spirit',
    language: 'en',
    domains: ['freedom'],
    perspective: CHARISMATIC,
    topics: ['holy-spirit'],
    // Sensitive: the publisher presents it as teaching on accessing God's
    // power for healing and deliverance, which the Freedom shelf treats like
    // the deliverance books (docs/RESOURCES.md § Deliverance material).
    reviewLevel: 'sensitive',
    description: {
      en: 'On the presence and work of the Holy Spirit in a believer’s life.',
      fr: 'Sur la présence et l’œuvre du Saint-Esprit dans la vie du croyant.',
    },
    editions: {
      en: whitaker('The Purpose and Power of the Holy Spirit', 'purpose-and-power-of-the-holy-spirit', { isbn: '9781641231350' }),
      es: whitaker('El propósito y el poder del Espíritu Santo', 'span-purpose-and-power-of-the-holy-spirit'),
      // The publisher's author bio calls the English book "formerly titled The
      // Most Important Person on Earth", which is this French title. Bethesda
      // had no copies in stock on the verification date.
      fr: bethesda('La personne la plus importante sur terre', 'la-personne-la-plus-importante-sur-terre-myles-munroe-65', OUT_OF_STOCK),
    },
  }),
  authorBook({
    id: 'munroe-waiting-and-dating',
    language: 'en',
    domains: ['relationships'],
    topics: ['dating', 'singleness', 'discernment', 'friendship', 'future-spouse', 'marriage-roles'],
    lifeStages: ['single', 'dating'],
    // Sensitive: teaches the man as spiritual head of the relationship.
    description: {
      en: 'On becoming whole, sharing faith and building friendship before choosing someone to marry.',
      fr: 'Devenir une personne accomplie, partager la foi et bâtir l’amitié avant de choisir avec qui se marier.',
    },
    editions: {
      en: destinyImage('Waiting and Dating', 'waiting-and-dating-a-sensible-guide-to-a-fulfilling-love-relationship', { isbn: '9780768421576' }),
      fr: bethesda('Avant le mariage… Patienter pour mieux se fréquenter', 'avant-le-mariage-myles-munroe--56'),
    },
  }),
  authorBook({
    id: 'munroe-single-married-separated',
    language: 'en',
    domains: ['relationships'],
    topics: ['singleness', 'identity', 'marriage', 'divorce'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    // Sensitive: divorce and separation.
    description: {
      en: 'Grounds identity in God rather than in relationship status: single, married, separated or divorced.',
      fr: 'Enracine l’identité en Dieu plutôt que dans la situation amoureuse : célibataire, marié, séparé ou divorcé.',
    },
    editions: {
      en: destinyImage('Single, Married, Separated, and Life After Divorce', 'single-married-separated-expanded-edition', { isbn: '9780768431612' }),
    },
  }),
  authorBook({
    id: 'munroe-purpose-and-power-of-love-and-marriage',
    language: 'en',
    domains: ['relationships'],
    topics: ['marriage', 'communication', 'finances', 'sexual-intimacy'],
    lifeStages: ['engaged', 'married'],
    // Sensitive: sexual intimacy.
    description: {
      en: 'Practical chapters for newly married couples on love, communication, money and intimacy.',
      fr: 'Des chapitres pratiques pour jeunes mariés sur l’amour, la communication, l’argent et l’intimité.',
    },
    editions: {
      en: destinyImage('The Purpose and Power of Love & Marriage', 'purpose-and-power-of-love-and-marriage', { isbn: '9780768422511' }),
      // Les Éditions du 20 Décembre present the author but have no page for
      // the book, so the French edition is recorded unlinked.
      fr: unlinkedEdition('Mariés et après ? But et puissance de l’amour et du mariage', 'Myles Munroe', 'Les Éditions du 20 Décembre'),
    },
  }),
  authorBook({
    id: 'munroe-purpose-and-power-of-men',
    language: 'en',
    domains: ['relationships'],
    topics: ['identity', 'marriage', 'marriage-roles'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    // Sensitive: marriage roles are the subject.
    description: {
      en: 'Munroe’s account of God’s design for men, including his view of a husband’s role.',
      fr: 'La lecture de Munroe du dessein de Dieu pour l’homme, y compris sa vision du rôle de l’époux.',
    },
    editions: {
      en: whitaker('Understanding the Purpose and Power of Men', 'understanding-the-purpose-and-power-of-men-expanded-edition'),
      es: whitaker('Entendiendo el propósito y el poder del hombre', 'span-understanding-the-purpose-and-power-of-men-expanded-edition'),
    },
  }),
  authorBook({
    id: 'munroe-purpose-and-power-of-women',
    language: 'en',
    domains: ['relationships'],
    topics: ['identity', 'marriage', 'marriage-roles'],
    lifeStages: ['single', 'dating', 'engaged', 'married'],
    // Sensitive: marriage roles are the subject.
    description: {
      en: 'Munroe’s account of God’s design for women, including his view of a wife’s role.',
      fr: 'La lecture de Munroe du dessein de Dieu pour la femme, y compris sa vision du rôle de l’épouse.',
    },
    editions: {
      en: whitaker('Understanding the Purpose and Power of Women', 'understanding-the-purpose-and-power-of-women-expanded-edition'),
      es: whitaker('Entendiendo el propósito y el poder de la mujer', 'span-understanding-the-purpose-and-power-of-women-expanded-edition'),
      fr: bethesda('Comprendre le but et le pouvoir de la femme', 'comprendre-le-but-et-le-pouvoir-de-la-femme-557'),
    },
  }),
  authorBook({
    id: 'munroe-fatherhood-principle',
    language: 'en',
    domains: ['relationships'],
    topics: ['parenting', 'family', 'identity', 'marriage-roles'],
    // Sensitive: a man's role as father and head of a home is the subject.
    description: {
      en: 'God’s design for every man as a father, whether or not he has children, including Munroe’s view of a man’s role.',
      fr: 'Le dessein de Dieu pour tout homme en tant que père, qu’il ait des enfants ou non, y compris la vision de Munroe du rôle de l’homme.',
    },
    editions: {
      en: whitaker('The Fatherhood Principle', 'fatherhood-principle'),
      // Same subtitle as the English book: "God's Design and Destiny for Every Man".
      fr: bethesda('Brave papa !', 'brave-papa--558'),
    },
  }),

  // ── Held on the christian-living shelf for coming plans ──────────────────
  authorBook({
    id: 'munroe-prayer-with-purpose-and-power',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['prayer'],
    description: {
      en: 'A 90-day devotional on prayer, drawn from Munroe’s book on the subject.',
      fr: 'Un parcours de 90 jours sur la prière, tiré du livre de Munroe sur le sujet.',
      es: 'Un devocional de 90 días sobre la oración, basado en el libro de Munroe sobre el tema.',
    },
    editions: {
      en: whitaker('Prayer with Purpose and Power', 'prayer-with-purpose-and-power'),
      es: whitaker('Oración con propósito y poder', 'span-prayer-with-purpose-and-power'),
    },
  }),
  authorBook({
    id: 'munroe-experiencing-the-holy-spirit',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['holy-spirit'],
    description: {
      en: 'A 90-day devotional on the Holy Spirit’s role in a believer’s life.',
      fr: 'Un parcours de 90 jours sur le rôle du Saint-Esprit dans la vie du croyant.',
    },
    editions: {
      en: whitaker('Experiencing the Holy Spirit with Purpose and Power', 'experiencing-the-holy-spirit-with-purpose-and-power'),
    },
  }),
  authorBook({
    id: 'munroe-man-of-purpose-and-power',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['identity', 'marriage-roles'],
    // Sensitive: drawn from his books on the roles of men and women.
    description: {
      en: 'A 90-day devotional for men, drawn from Munroe’s books on men and women.',
      fr: 'Un parcours de 90 jours pour les hommes, tiré des livres de Munroe sur l’homme et la femme.',
    },
    editions: {
      en: whitaker('Man of Purpose and Power', 'man-of-purpose-and-power'),
    },
  }),
  authorBook({
    id: 'munroe-woman-of-purpose-and-power',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['identity', 'marriage-roles'],
    // Sensitive: drawn from his books on the roles of men and women.
    description: {
      en: 'A 90-day devotional for women, drawn from Munroe’s books on women and men.',
      fr: 'Un parcours de 90 jours pour les femmes, tiré des livres de Munroe sur la femme et l’homme.',
    },
    editions: {
      en: whitaker('Woman of Purpose and Power', 'woman-of-purpose-and-power'),
      es: whitaker('Una mujer de propósito y poder', 'span-woman-of-purpose-and-power', OUT_OF_STOCK),
    },
  }),
  authorBook({
    id: 'munroe-principles-and-power-of-vision',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling'],
    description: {
      en: 'On discovering your purpose and turning God-given vision into reality.',
      fr: 'Sur la découverte de sa vocation et la réalisation de la vision reçue de Dieu.',
    },
    editions: {
      en: whitaker('The Principles and Power of Vision', 'principles-and-power-of-vision'),
      es: whitaker('Los principios y poder de la visión', 'span-principles-and-power-of-vision', OUT_OF_STOCK),
    },
  }),
  authorBook({
    id: 'munroe-vision-with-purpose-and-power',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling'],
    description: {
      en: 'A 90-day devotional on finding and fulfilling your life’s vision.',
      fr: 'Un parcours de 90 jours pour découvrir et accomplir la vision de sa vie.',
      es: 'Un devocional de 90 días para descubrir y cumplir la visión de tu vida.',
    },
    editions: {
      en: whitaker('Vision with Purpose and Power', 'vision-with-purpose-and-power'),
      es: whitaker('Visión con propósito y poder', 'span-vision-with-purpose-and-power'),
    },
  }),
  authorBook({
    id: 'munroe-principles-and-power-of-success',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling', 'work'],
    description: {
      en: 'Success as fulfilling your God-given purpose rather than beating others.',
      fr: 'La réussite comme accomplissement de la vocation reçue de Dieu, non comme victoire sur les autres.',
      es: 'El éxito como cumplimiento del propósito que Dios te dio, no como victoria sobre los demás.',
    },
    editions: {
      en: whitaker('The Principles and Power of Success', 'principles-and-power-of-success'),
      es: whitaker('Los principios del éxito', 'los-principios-del-exito'),
    },
  }),
  authorBook({
    id: 'munroe-success-with-purpose-and-power',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling', 'work'],
    description: {
      en: 'A 90-day devotional on success as serving your God-given gift.',
      fr: 'Un parcours de 90 jours sur la réussite comme service du don reçu de Dieu.',
    },
    editions: {
      en: whitaker('Success with Purpose and Power', 'success-with-purpose-and-power'),
    },
  }),
  authorBook({
    id: 'munroe-purpose-and-power-of-change',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling'],
    description: {
      en: 'On meeting unavoidable change so that it becomes a positive force.',
      fr: 'Sur la manière d’accueillir les changements inévitables pour qu’ils deviennent une force positive.',
    },
    editions: {
      en: whitaker('Understanding the Purpose and Power of Change', 'understanding-the-purpose-and-power-of-change'),
    },
  }),
  authorBook({
    // The publisher names this as a separate book from "Understanding the
    // Purpose and Power of Change"; only the Spanish edition is on sale.
    id: 'munroe-principles-and-benefits-of-change',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling'],
    description: {
      en: 'On how we handle inevitable change, and whether it becomes a positive or negative force.',
      fr: 'Sur la façon d’affronter les changements inévitables, et s’ils deviennent une force positive ou négative.',
      es: 'Sobre cómo afrontamos los cambios inevitables, y si se convierten en una fuerza positiva o negativa.',
    },
    editions: {
      es: whitaker('Los principios y beneficios del cambio', 'span-principles-and-benefits-of-change'),
    },
  }),
  authorBook({
    id: 'munroe-understanding-your-potential',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling', 'identity'],
    description: {
      en: 'On the potential God places in every person, and why it so often stays buried.',
      fr: 'Sur le potentiel que Dieu dépose en chacun, et pourquoi il reste si souvent enfoui.',
    },
    editions: {
      en: destinyImage('Understanding Your Potential', 'understanding-your-potential-expanded-edition'),
    },
  }),
  authorBook({
    // Possibly the French "Understanding Your Potential", but the publisher's
    // page does not name its original, so it stands as its own entry.
    id: 'munroe-un-potentiel-formidable',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling', 'identity'],
    description: {
      en: 'On the great potential every person carries as someone made in God’s image.',
      fr: 'Sur le potentiel formidable que porte chaque être humain, créé à l’image de Dieu.',
    },
    editions: {
      fr: bethesda('Un potentiel formidable', 'un-potentiel-formidable-560'),
    },
  }),
  authorBook({
    id: 'munroe-releasing-your-potential',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling'],
    description: {
      en: 'A step-by-step approach to releasing the potential God has placed in you.',
      fr: 'Une démarche pas à pas pour libérer le potentiel que Dieu a placé en toi.',
    },
    editions: {
      en: destinyImage('Releasing Your Potential', 'releasing-your-potential-expanded-edition'),
    },
  }),
  authorBook({
    id: 'munroe-unleash-your-purpose',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling'],
    description: {
      en: 'On discovering the purpose your Creator designed for you and living it out.',
      fr: 'Sur la découverte du dessein que le Créateur a prévu pour toi, et la manière de le vivre.',
    },
    editions: {
      en: destinyImage('Unleash Your Purpose', 'unleash-your-purpose'),
    },
  }),
  authorBook({
    id: 'munroe-become-who-you-were-meant-to-be',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling'],
    description: {
      en: 'A devotional for those worn down by setbacks or unfulfilling work, on purpose and potential.',
      fr: 'Un parcours pour ceux que les échecs ou un travail sans sens ont usés, sur la vocation et le potentiel.',
    },
    editions: {
      en: destinyImage('Become Who You Were Meant to Be', 'become-who-you-were-meant-to-be-a-devotional-for-fulfilling-your-purpose-and-maximizing-your-potential-august-2024'),
    },
  }),
  authorBook({
    id: 'munroe-reclaiming-gods-original-purpose',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['calling', 'kingdom-of-god'],
    description: {
      en: 'On God’s original purpose for humanity as the answer to the deepest longing of the heart.',
      fr: 'Sur le dessein originel de Dieu pour l’humanité, réponse à l’aspiration la plus profonde du cœur.',
    },
    editions: {
      en: destinyImage('Reclaiming God’s Original Purpose for Your Life', 'reclaiming-gods-original-purpose-for-your-life'),
    },
  }),
  authorBook({
    id: 'munroe-spirit-of-leadership',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['leadership'],
    description: {
      en: 'On the attitudes that mark effective leaders, in families and churches as much as boardrooms.',
      fr: 'Sur les attitudes des leaders efficaces, en famille et à l’église autant qu’en entreprise.',
    },
    editions: {
      en: whitaker('The Spirit of Leadership', 'spirit-of-leadership'),
      es: whitaker('El espíritu de liderazgo', 'span-spirit-of-leadership', OUT_OF_STOCK),
    },
  }),
  authorBook({
    id: 'munroe-becoming-a-leader',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['leadership'],
    description: {
      en: 'Argues that leadership is not reserved for a few, and how to develop it.',
      fr: 'Montre que le leadership n’est pas réservé à quelques-uns, et comment le développer.',
      es: 'Muestra que el liderazgo no está reservado a unos pocos, y cómo desarrollarlo.',
    },
    editions: {
      en: whitaker('Becoming a Leader', 'becoming-a-leader-expanded-edition'),
      es: whitaker('Convirtiéndose en un líder', 'span-becoming-a-leader'),
      fr: bethesda('Devenir un leader', 'devenir-un-leader-561'),
    },
  }),
  authorBook({
    id: 'munroe-leader-of-purpose-and-power',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['leadership'],
    description: {
      en: 'A 90-day devotional on the leadership capacity in every person.',
      fr: 'Un parcours de 90 jours sur la capacité de leadership présente en chacun.',
    },
    editions: {
      en: whitaker('Leader of Purpose and Power', 'leader-of-purpose-and-power'),
    },
  }),
  authorBook({
    id: 'munroe-power-of-character-in-leadership',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['leadership', 'character'],
    description: {
      en: 'On the character that keeps a leader’s influence from collapsing.',
      fr: 'Sur le caractère qui empêche l’influence d’un leader de s’effondrer.',
      es: 'Sobre el carácter que impide que la influencia de un líder se derrumbe.',
    },
    editions: {
      en: whitaker('The Power of Character in Leadership', 'power-of-character-in-leadership'),
      es: whitaker('El poder del carácter en el liderazgo', 'span-power-of-character-in-leadership'),
    },
  }),
  authorBook({
    id: 'munroe-purpose-and-power-of-authority',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['leadership'],
    description: {
      en: 'Reclaims authority as something meant to serve, in an age that has learned to fear it.',
      fr: 'Redonne à l’autorité son sens de service, à une époque qui a appris à la craindre.',
    },
    editions: {
      en: whitaker('Understanding the Purpose and Power of Authority', 'understanding-the-purpose-and-power-of-authority'),
    },
  }),
  authorBook({
    id: 'munroe-kingdom-principles',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['kingdom-of-god'],
    description: {
      en: 'On the Kingdom of God as the centre of Jesus’ message, and living by its principles.',
      fr: 'Sur le Royaume de Dieu, cœur du message de Jésus, et la vie selon ses principes.',
    },
    editions: {
      en: destinyImage('Kingdom Principles', 'kingdom-principles', OUT_OF_STOCK),
      fr: bethesda('Les principes du Royaume', 'les-principes-du-royaume-myles-munroe-53'),
    },
  }),
  authorBook({
    id: 'munroe-rediscovering-the-kingdom',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['kingdom-of-god'],
    description: {
      en: 'Presents the Kingdom of God and its laws as a guide through hard times.',
      fr: 'Présente le Royaume de Dieu et ses lois comme un guide dans les temps difficiles.',
    },
    editions: {
      fr: bethesda('Redécouvrir le Royaume', 'redecouvrir-le-royaume-myles-munroe-50'),
    },
  }),
  authorBook({
    id: 'munroe-kingdom-citizenship',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['kingdom-of-god'],
    description: {
      en: 'On living as a citizen of God’s Kingdom rather than beneath that inheritance.',
      fr: 'Sur la vie de citoyen du Royaume de Dieu, plutôt qu’en deçà de cet héritage.',
    },
    editions: {
      en: destinyImage('The Principle and Power of Kingdom Citizenship', 'principle-and-power-of-kingdom-citizenship-paper-back'),
    },
  }),
  authorBook({
    id: 'munroe-you-are-a-king',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['kingdom-of-god', 'blessing'],
    description: {
      en: 'On the blessing, favour and provision Munroe teaches belong to citizens of God’s Kingdom.',
      fr: 'Sur la bénédiction, la faveur et la provision qui, selon Munroe, reviennent aux citoyens du Royaume.',
    },
    editions: {
      en: destinyImage('You Are a King', 'you-are-a-king-access-the-unlimited-resources-of-gods-abundant-kingdom-paperback-d-may-7-2024'),
    },
  }),
  authorBook({
    id: 'munroe-rediscovering-kingdom-worship',
    language: 'en',
    domains: ['christian-living'],
    perspective: CHARISMATIC,
    topics: ['worship', 'kingdom-of-god'],
    description: {
      en: 'On worship as the heart of God’s presence rather than a preliminary to it.',
      fr: 'Sur l’adoration comme cœur de la présence de Dieu, et non comme simple préliminaire.',
    },
    editions: {
      en: destinyImage('Rediscovering Kingdom Worship', 'rediscovering-kingdom-worship'),
    },
  }),
];
