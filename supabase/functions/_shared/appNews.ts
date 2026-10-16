// Push copy for 'app_news' — the "What's new" announcement of a release
// (queued by queue_app_news() in 20261016180000_app_news_announcements.sql).
// Pure and dependency-free like eventNotify.ts, so Vitest imports it too.
//
// The text is fixed product copy per release, never member content. The full
// list of changes lives in the app (src/content/releaseNotes.js); a parity
// test checks that every release there has push copy here in every language.

type Copy = { title: string; body: string };

const VERSION_RE = /^\d+\.\d+\.\d+$/;

// "What's new in Qetoret", per language. Shared by every release.
export const APP_NEWS_TITLE: Record<string, string> = {
  en: "What's new in Qetoret",
  fr: 'Quoi de neuf dans Qetoret',
  de: 'Neu in Qetoret',
  es: 'Novedades de Qetoret',
  pt: 'Novidades do Qetoret',
  zh: 'Qetoret 新功能',
  ja: 'Qetoret の新機能',
  ko: 'Qetoret 새 소식',
  ru: 'Что нового в Qetoret',
  ar: 'ما الجديد في Qetoret',
  fa: 'تازه‌های Qetoret',
  hi: 'Qetoret में नया क्या है',
  sw: 'Mapya katika Qetoret',
  am: 'በ Qetoret ውስጥ አዲስ ነገሮች',
  id: 'Yang baru di Qetoret',
  tl: 'Mga bago sa Qetoret',
};

// One short line per release, per language.
export const APP_NEWS_BODY: Record<string, Record<string, string>> = {
  '1.0.6': {
    en: 'Pray in the Spirit, prayer times for your groups, and more.',
    fr: "Prier dans l'Esprit, des temps de prière pour vos groupes, et plus encore.",
    de: 'Im Geist beten, Gebetszeiten für deine Gruppen und mehr.',
    es: 'Orar en el Espíritu, tiempos de oración para tus grupos y más.',
    pt: 'Orar no Espírito, tempos de oração para seus grupos e mais.',
    zh: '在圣灵里祷告、为你的群组安排祷告时间，以及更多。',
    ja: '御霊によって祈る、グループの祈りの時間など。',
    ko: '성령 안에서 기도하기, 그룹 기도 시간 등.',
    ru: 'Молитва в Духе, время молитвы для ваших групп и многое другое.',
    ar: 'الصلاة في الروح، وأوقات صلاة لمجموعاتك، والمزيد.',
    fa: 'دعا در روح، زمان‌های دعا برای گروه‌هایتان و موارد دیگر.',
    hi: 'आत्मा में प्रार्थना, आपके समूहों के लिए प्रार्थना का समय, और भी बहुत कुछ।',
    sw: 'Kuomba katika Roho, muda wa maombi kwa vikundi vyako, na zaidi.',
    am: 'በመንፈስ መጸለይ፣ ለቡድኖችዎ የጸሎት ጊዜ እና ሌሎችም።',
    id: 'Berdoa dalam Roh, waktu doa untuk grup Anda, dan lainnya.',
    tl: 'Manalangin sa Espiritu, oras ng panalangin para sa iyong mga grupo, at iba pa.',
  },
};

// The release an announcement is about, or null when the metadata doesn't
// name one in the expected shape.
export function appNewsVersion(meta: Record<string, unknown> = {}): string | null {
  const version = meta.version;
  return typeof version === 'string' && VERSION_RE.test(version) ? version : null;
}

// Title and body for `version` in `lang`, falling back to English. A release
// with no copy here still gets the title, with an empty body.
export function appNewsCopy(version: string | null, lang: string): Copy {
  const bodies = (version && APP_NEWS_BODY[version]) || {};
  return {
    title: APP_NEWS_TITLE[lang] || APP_NEWS_TITLE.en,
    body: bodies[lang] || bodies.en || '',
  };
}
