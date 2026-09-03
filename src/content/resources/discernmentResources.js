// Selected in docs/DISCERNMENT_RESOURCES_2026-09-03.md and explicitly released
// by Paul. Publisher pages and native edition titles checked on 2026-09-03.
// Link checks are independent of approval; no video/article text is embedded.
import { DISCERNMENT_RESOURCE_SIGNOFF } from '../reviews/paulDiscernment20260903';

const edition = (title, author, publisher, url) => ({
  title, author, publisher, url, available: true, lastVerifiedAt: '2026-09-03',
});
const signoffs = () => ({
  status: 'approved',
  contentReview: { ...DISCERNMENT_RESOURCE_SIGNOFF },
  safetyReview: { ...DISCERNMENT_RESOURCE_SIGNOFF },
});

export const DISCERNMENT_RESOURCES = [
  {
    id: 'bibleproject-wisdom-proverbs', type: 'video', originalLanguage: 'en',
    ...signoffs(), topics: ['discernment'], lifeStages: ['single', 'dating', 'engaged', 'married'],
    description: {
      en: 'A short introduction to biblical wisdom for daily choices; relationship discernment is an application of the theme.',
      fr: 'Une introduction à la sagesse biblique pour les choix quotidiens ; le discernement relationnel en est une application.',
      es: 'Una introducción a la sabiduría bíblica para las decisiones cotidianas; el discernimiento de una relación es una aplicación del tema.',
    },
    editions: {
      en: edition('The Wisdom of Proverbs', 'BibleProject', 'BibleProject', 'https://bibleproject.com/videos/wisdom-proverbs/'),
      es: edition('La sabiduría de Proverbios', 'BibleProject', 'BibleProject', 'https://bibleproject.com/es/videos/la-sabiduria-de-proverbios/'),
    },
  },
  {
    id: 'bibleproject-holy-spirit', type: 'video', originalLanguage: 'en',
    ...signoffs(), topics: ['prayer', 'spiritual-formation'], lifeStages: ['single', 'dating', 'engaged', 'married'],
    description: {
      en: 'An overview of the Spirit’s work in the biblical story, to deepen prayer and attentive reading.',
      fr: 'Un aperçu de l’action de l’Esprit dans le récit biblique, pour approfondir la prière et la lecture attentive.',
    },
    editions: {
      en: edition('Holy Spirit', 'BibleProject', 'BibleProject', 'https://bibleproject.com/videos/holy-spirit/'),
    },
  },
  {
    id: 'alpha-pre-marriage-course', type: 'study', originalLanguage: 'en',
    ...signoffs(), reviewLevel: 'sensitive',
    topics: ['premarital', 'communication', 'listening', 'finances', 'family'], lifeStages: ['single', 'dating', 'engaged'],
    description: {
      en: 'Five optional days of conversation about listening, expectations and life together, for people already considering a mutual relationship.',
      fr: 'Cinq jours facultatifs de conversation sur l’écoute, les attentes et la vie commune, pour une relation déjà envisagée à deux.',
      de: 'Fünf freiwillige Lesetage über Zuhören, Erwartungen und das gemeinsame Leben für Menschen, die bereits beiderseitig eine Beziehung erwägen.',
      es: 'Cinco días opcionales de conversación sobre la escucha, las expectativas y la vida compartida, cuando ambos consideran una relación.',
      pt: 'Cinco dias opcionais de conversa sobre escuta, expectativas e vida em comum, para quem já considera uma relação recíproca.',
    },
    editions: {
      en: edition('The Pre-Marriage Course', 'Nicky and Sila Lee', 'Alpha / YouVersion', 'https://www.bible.com/reading-plans/22661-the-pre-marriage-course'),
      de: edition('Ein voreheliches Seminar', 'Nicky und Sila Lee', 'Alpha / YouVersion', 'https://www.bible.com/de/reading-plans/22661-the-pre-marriage-course'),
      es: edition('El curso pre-matrimonial', 'Nicky y Sila Lee', 'Alpha / YouVersion', 'https://www.bible.com/es/reading-plans/22661-the-pre-marriage-course'),
      pt: edition('O Curso do Casamento', 'Nicky e Sila Lee', 'Alpha / YouVersion', 'https://www.bible.com/pt/reading-plans/22661-the-pre-marriage-course'),
    },
  },
  {
    id: 'gotquestions-found-spouse', type: 'article', originalLanguage: 'en',
    ...signoffs(), reviewLevel: 'sensitive',
    topics: ['discernment', 'character', 'premarital', 'finances', 'family'], lifeStages: ['single', 'dating', 'engaged'],
    description: {
      en: 'Questions about character, time and shared priorities before marriage; shared faith does not remove the need for consent and safety.',
      fr: 'Des questions sur le caractère, le temps et les priorités avant le mariage ; la foi partagée ne dispense pas du consentement et de la sécurité.',
      ko: '결혼 전 성품, 알아 가는 시간, 함께하는 우선순위를 살피는 질문들입니다. 같은 믿음이 동의와 안전의 필요성을 대신하지는 않습니다.',
      fa: 'پرسش‌هایی دربارهٔ شخصیت، زمان شناخت و اولویت‌های مشترک پیش از ازدواج؛ ایمان مشترک نیاز به رضایت و امنیت را برطرف نمی‌کند.',
    },
    editions: {
      en: edition('How will I know when I have found the perfect spouse for me?', 'Got Questions Ministries', 'Got Questions Ministries', 'https://www.gotquestions.org/know-found-spouse.html'),
      ko: edition('완벽한 배우자를 찾았는지 어떻게 알 수 있는가?', 'Got Questions Ministries', 'Got Questions Ministries', 'https://www.gotquestions.org/Korean/Korean-know-found-spouse.html'),
      fa: edition('از کجا بدانم که همسر ایده آل خود را پیدا کرده ام؟', 'Got Questions Ministries', 'Got Questions Ministries', 'https://www.gotquestions.org/Farsi/Farsi-perfect-spouse.html'),
    },
  },
  {
    id: 'gotquestions-christian-girlfriend', type: 'article', originalLanguage: 'en',
    ...signoffs(), reviewLevel: 'sensitive',
    topics: ['dating', 'character'], lifeStages: ['single', 'dating'],
    description: {
      en: 'An Indonesian article addressed to men about character and faith in dating, as an optional complement to the shared standards of this journey.',
      fr: 'Un article indonésien destiné aux hommes sur le caractère et la foi dans les fréquentations, en complément facultatif des repères communs du parcours.',
      id: 'Artikel untuk pria tentang karakter dan iman dalam berpacaran, sebagai bacaan tambahan bagi pedoman yang berlaku untuk semua peserta perjalanan ini.',
    },
    editions: {
      id: edition('Apakah kriteria yang seharusnya saya cari dalam berpacaran dengan wanita Kristen?', 'Got Questions Ministries', 'Got Questions Ministries', 'https://www.gotquestions.org/Indonesia/perempuan-pacar-kristen.html'),
    },
  },
  {
    id: 'gotquestions-dating-choice', type: 'article', originalLanguage: 'en',
    ...signoffs(), reviewLevel: 'sensitive',
    topics: ['dating', 'discernment'], lifeStages: ['single', 'dating'],
    description: {
      en: 'A supplementary Christian perspective on several possible relationships; its discussion of roles does not override anyone’s freedom to decline.',
      fr: 'Un regard chrétien complémentaire sur plusieurs relations possibles ; ses positions sur les rôles ne suppriment jamais la liberté de refuser.',
    },
    editions: {
      en: edition('What should I do if I cannot decide whom I should be dating?', 'Got Questions Ministries', 'Got Questions Ministries', 'https://www.gotquestions.org/dating-choice.html'),
    },
  },
  {
    id: 'lifechurch-dateable', type: 'study', originalLanguage: 'en',
    ...signoffs(), reviewLevel: 'sensitive',
    topics: ['dating', 'character', 'purity'], lifeStages: ['single', 'dating'],
    description: {
      en: 'A five-day devotional about personal growth and dating, with a youth-oriented tone; an optional addition to the adult journey.',
      fr: 'Cinq jours sur la croissance personnelle et les fréquentations, avec un ton destiné aux jeunes ; un complément facultatif au parcours adulte.',
      es: 'Cinco días sobre crecimiento personal y noviazgo, con un tono dirigido a jóvenes; un complemento opcional del recorrido para adultos.',
    },
    editions: {
      en: edition('Dateable', 'Life.Church Switch', 'Life.Church / YouVersion', 'https://www.bible.com/reading-plans/11133-dateable'),
      es: edition('Listo para las citas', 'Life.Church Switch', 'Life.Church / YouVersion', 'https://www.bible.com/es/reading-plans/11133-dateable'),
    },
  },
];
