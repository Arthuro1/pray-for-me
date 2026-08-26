// Curated "verse of the day" — a large, vetted pool of prayer-themed passages
// rotated by day-of-year, so the same verse shows for every user on a given day
// and the year rarely repeats.
//
// This replaces the former AI-generated daily verse (a Supabase cron that made
// ~16 Claude calls every day, forever). Two design rules keep it free, offline,
// and impossible to misquote:
//
//   1. The POOL holds only vetted, language-neutral Bible REFERENCES (book +
//      chapter:verse) — never generated Scripture text. A reference is safe to
//      curate; a verse's wording is not. References are localized for display via
//      BOOK_NAMES (book names, not verse text — low-stakes and deterministic).
//
//   2. The verse TEXT is sourced two ways, never from an LLM guessing Scripture:
//        • SEED — a hand-vetted core set carrying embedded text in all 16
//          languages, so the most common days render instantly and fully offline.
//        • Everything else resolves through the authoritative pipeline in
//          verseText.js (localStorage → shared verse_cache → YouVersion). Once a
//          reference is resolved it's cached forever: zero recurring cost, and
//          offline from then on.
//
// To grow the pool, add vetted references to BY_BOOK (and a book's names to
// BOOK_NAMES if it isn't there yet). To make a verse render offline on day one,
// add its embedded text to SEED.

// Localized book names for every book the pool references. Keys are USFM-style
// codes; the seed's six books (PSA, MAT, MRK, PHP, 1TH, JAS) are carried over
// verbatim from the previously-shipped daily verses.
export const BOOK_NAMES = {
  PSA: { fr: 'Psaume', en: 'Psalm', de: 'Psalm', pt: 'Salmos', zh: '诗篇', es: 'Salmos', hi: 'भजन संहिता', ja: '詩篇', sw: 'Zaburi', am: 'መዝሙር', id: 'Mazmur', tl: 'Awit', ko: '시편', ru: 'Псалтирь', ar: 'مزمور', fa: 'مزامیر' },
  PRO: { fr: 'Proverbes', en: 'Proverbs', de: 'Sprüche', pt: 'Provérbios', zh: '箴言', es: 'Proverbios', hi: 'नीतिवचन', ja: '箴言', sw: 'Mithali', am: 'ምሳሌ', id: 'Amsal', tl: 'Kawikaan', ko: '잠언', ru: 'Притчи', ar: 'أمثال', fa: 'امثال' },
  ISA: { fr: 'Ésaïe', en: 'Isaiah', de: 'Jesaja', pt: 'Isaías', zh: '以赛亚书', es: 'Isaías', hi: 'यशायाह', ja: 'イザヤ書', sw: 'Isaya', am: 'ኢሳይያስ', id: 'Yesaya', tl: 'Isaias', ko: '이사야', ru: 'Исаия', ar: 'إشعياء', fa: 'اشعیا' },
  JER: { fr: 'Jérémie', en: 'Jeremiah', de: 'Jeremia', pt: 'Jeremias', zh: '耶利米书', es: 'Jeremías', hi: 'यिर्मयाह', ja: 'エレミヤ書', sw: 'Yeremia', am: 'ኤርምያስ', id: 'Yeremia', tl: 'Jeremias', ko: '예레미야', ru: 'Иеремия', ar: 'إرميا', fa: 'ارمیا' },
  LAM: { fr: 'Lamentations', en: 'Lamentations', de: 'Klagelieder', pt: 'Lamentações', zh: '耶利米哀歌', es: 'Lamentaciones', hi: 'विलापगीत', ja: '哀歌', sw: 'Maombolezo', am: 'ሰቆቃው', id: 'Ratapan', tl: 'Panaghoy', ko: '예레미야애가', ru: 'Плач Иеремии', ar: 'مراثي إرميا', fa: 'مراثی' },
  MAT: { fr: 'Matthieu', en: 'Matthew', de: 'Matthäus', pt: 'Mateus', zh: '马太福音', es: 'Mateo', hi: 'मत्ती', ja: 'マタイ', sw: 'Mathayo', am: 'ማቴዎስ', id: 'Matius', tl: 'Mateo', ko: '마태복음', ru: 'Матфея', ar: 'متى', fa: 'متی' },
  MRK: { fr: 'Marc', en: 'Mark', de: 'Markus', pt: 'Marcos', zh: '马可福音', es: 'Marcos', hi: 'मरकुस', ja: 'マルコ', sw: 'Marko', am: 'ማርቆስ', id: 'Markus', tl: 'Marcos', ko: '마가복음', ru: 'Марка', ar: 'مرقس', fa: 'مرقس' },
  LUK: { fr: 'Luc', en: 'Luke', de: 'Lukas', pt: 'Lucas', zh: '路加福音', es: 'Lucas', hi: 'लूका', ja: 'ルカ', sw: 'Luka', am: 'ሉቃስ', id: 'Lukas', tl: 'Lucas', ko: '누가복음', ru: 'Луки', ar: 'لوقا', fa: 'لوقا' },
  JHN: { fr: 'Jean', en: 'John', de: 'Johannes', pt: 'João', zh: '约翰福音', es: 'Juan', hi: 'यूहन्ना', ja: 'ヨハネ', sw: 'Yohana', am: 'ዮሐንስ', id: 'Yohanes', tl: 'Juan', ko: '요한복음', ru: 'Иоанна', ar: 'يوحنا', fa: 'یوحنا' },
  ROM: { fr: 'Romains', en: 'Romans', de: 'Römer', pt: 'Romanos', zh: '罗马书', es: 'Romanos', hi: 'रोमियों', ja: 'ローマ', sw: 'Warumi', am: 'ሮሜ', id: 'Roma', tl: 'Roma', ko: '로마서', ru: 'Римлянам', ar: 'رومية', fa: 'رومیان' },
  '1CO': { fr: '1 Corinthiens', en: '1 Corinthians', de: '1. Korinther', pt: '1 Coríntios', zh: '哥林多前书', es: '1 Corintios', hi: '1 कुरिन्थियों', ja: '1コリント', sw: '1 Wakorintho', am: '1ኛ ቆሮንቶስ', id: '1 Korintus', tl: '1 Corinto', ko: '고린도전서', ru: '1 Коринфянам', ar: '1 كورنثوس', fa: 'اول قرنتیان' },
  '2CO': { fr: '2 Corinthiens', en: '2 Corinthians', de: '2. Korinther', pt: '2 Coríntios', zh: '哥林多后书', es: '2 Corintios', hi: '2 कुरिन्थियों', ja: '2コリント', sw: '2 Wakorintho', am: '2ኛ ቆሮንቶስ', id: '2 Korintus', tl: '2 Corinto', ko: '고린도후서', ru: '2 Коринфянам', ar: '2 كورنثوس', fa: 'دوم قرنتیان' },
  GAL: { fr: 'Galates', en: 'Galatians', de: 'Galater', pt: 'Gálatas', zh: '加拉太书', es: 'Gálatas', hi: 'गलातियों', ja: 'ガラテヤ', sw: 'Wagalatia', am: 'ገላትያ', id: 'Galatia', tl: 'Galacia', ko: '갈라디아서', ru: 'Галатам', ar: 'غلاطية', fa: 'غلاطیان' },
  EPH: { fr: 'Éphésiens', en: 'Ephesians', de: 'Epheser', pt: 'Efésios', zh: '以弗所书', es: 'Efesios', hi: 'इफिसियों', ja: 'エペソ', sw: 'Waefeso', am: 'ኤፌሶን', id: 'Efesus', tl: 'Efeso', ko: '에베소서', ru: 'Ефесянам', ar: 'أفسس', fa: 'افسسیان' },
  PHP: { fr: 'Philippiens', en: 'Philippians', de: 'Philipper', pt: 'Filipenses', zh: '腓立比书', es: 'Filipenses', hi: 'फिलिप्पियों', ja: 'ピリピ', sw: 'Wafilipi', am: 'ፊልጵስዩስ', id: 'Filipi', tl: 'Filipos', ko: '빌립보서', ru: 'Филиппийцам', ar: 'فيلبي', fa: 'فیلیپیان' },
  COL: { fr: 'Colossiens', en: 'Colossians', de: 'Kolosser', pt: 'Colossenses', zh: '歌罗西书', es: 'Colosenses', hi: 'कुलुस्सियों', ja: 'コロサイ', sw: 'Wakolosai', am: 'ቆላስይስ', id: 'Kolose', tl: 'Colosas', ko: '골로새서', ru: 'Колоссянам', ar: 'كولوسي', fa: 'کولسیان' },
  '1TH': { fr: '1 Thessaloniciens', en: '1 Thessalonians', de: '1. Thessalonicher', pt: '1 Tessalonicenses', zh: '帖撒罗尼迦前书', es: '1 Tesalonicenses', hi: '1 थिस्सलुनीकियों', ja: '1テサロニケ', sw: '1 Wathesalonike', am: '1ኛ ተሰሎንቄ', id: '1 Tesalonika', tl: '1 Tesalonica', ko: '데살로니가전서', ru: '1 Фессалоникийцам', ar: '1 تسالونيكي', fa: 'اول تسالونیکیان' },
  '1TI': { fr: '1 Timothée', en: '1 Timothy', de: '1. Timotheus', pt: '1 Timóteo', zh: '提摩太前书', es: '1 Timoteo', hi: '1 तीमुथियुस', ja: '1テモテ', sw: '1 Timotheo', am: '1ኛ ጢሞቴዎስ', id: '1 Timotius', tl: '1 Timoteo', ko: '디모데전서', ru: '1 Тимофею', ar: '1 تيموثاوس', fa: 'اول تیموتائوس' },
  '2TI': { fr: '2 Timothée', en: '2 Timothy', de: '2. Timotheus', pt: '2 Timóteo', zh: '提摩太后书', es: '2 Timoteo', hi: '2 तीमुथियुस', ja: '2テモテ', sw: '2 Timotheo', am: '2ኛ ጢሞቴዎስ', id: '2 Timotius', tl: '2 Timoteo', ko: '디모데후서', ru: '2 Тимофею', ar: '2 تيموثاوس', fa: 'دوم تیموتائوس' },
  HEB: { fr: 'Hébreux', en: 'Hebrews', de: 'Hebräer', pt: 'Hebreus', zh: '希伯来书', es: 'Hebreos', hi: 'इब्रानियों', ja: 'ヘブル', sw: 'Waebrania', am: 'ዕብራውያን', id: 'Ibrani', tl: 'Hebreo', ko: '히브리서', ru: 'Евреям', ar: 'عبرانيين', fa: 'عبرانیان' },
  JAS: { fr: 'Jacques', en: 'James', de: 'Jakobus', pt: 'Tiago', zh: '雅各书', es: 'Santiago', hi: 'याकूब', ja: 'ヤコブ', sw: 'Yakobo', am: 'ያዕቆብ', id: 'Yakobus', tl: 'Santiago', ko: '야고보서', ru: 'Иакова', ar: 'يعقوب', fa: 'یعقوب' },
  '1PE': { fr: '1 Pierre', en: '1 Peter', de: '1. Petrus', pt: '1 Pedro', zh: '彼得前书', es: '1 Pedro', hi: '1 पतरस', ja: '1ペテロ', sw: '1 Petro', am: '1ኛ ጴጥሮስ', id: '1 Petrus', tl: '1 Pedro', ko: '베드로전서', ru: '1 Петра', ar: '1 بطرس', fa: 'اول پطرس' },
  '1JN': { fr: '1 Jean', en: '1 John', de: '1. Johannes', pt: '1 João', zh: '约翰一书', es: '1 Juan', hi: '1 यूहन्ना', ja: '1ヨハネ', sw: '1 Yohana', am: '1ኛ ዮሐንስ', id: '1 Yohanes', tl: '1 Juan', ko: '요한일서', ru: '1 Иоанна', ar: '1 يوحنا', fa: 'اول یوحنا' },
  DEU: { fr: 'Deutéronome', en: 'Deuteronomy', de: '5. Mose', pt: 'Deuteronômio', zh: '申命记', es: 'Deuteronomio', hi: 'व्यवस्थाविवरण', ja: '申命記', sw: 'Kumbukumbu', am: 'ዘዳግም', id: 'Ulangan', tl: 'Deuteronomio', ko: '신명기', ru: 'Второзаконие', ar: 'تثنية', fa: 'تثنیه' },
  JOS: { fr: 'Josué', en: 'Joshua', de: 'Josua', pt: 'Josué', zh: '约书亚记', es: 'Josué', hi: 'यहोशू', ja: 'ヨシュア記', sw: 'Yoshua', am: 'ኢያሱ', id: 'Yosua', tl: 'Josue', ko: '여호수아', ru: 'Иисуса Навина', ar: 'يشوع', fa: 'یوشع' },
  '1CH': { fr: '1 Chroniques', en: '1 Chronicles', de: '1. Chronik', pt: '1 Crônicas', zh: '历代志上', es: '1 Crónicas', hi: '1 इतिहास', ja: '歴代誌第一', sw: '1 Nyakati', am: '1ኛ ዜና መዋዕል', id: '1 Tawarikh', tl: '1 Cronica', ko: '역대상', ru: '1 Паралипоменон', ar: '1 أخبار الأيام', fa: 'اول تواریخ' },
  NEH: { fr: 'Néhémie', en: 'Nehemiah', de: 'Nehemia', pt: 'Neemias', zh: '尼希米记', es: 'Nehemías', hi: 'नहेमायाह', ja: 'ネヘミヤ記', sw: 'Nehemia', am: 'ነህምያ', id: 'Nehemia', tl: 'Nehemias', ko: '느헤미야', ru: 'Неемия', ar: 'نحميا', fa: 'نحمیا' },
  ZEP: { fr: 'Sophonie', en: 'Zephaniah', de: 'Zefanja', pt: 'Sofonias', zh: '西番雅书', es: 'Sofonías', hi: 'सपन्याह', ja: 'ゼパニヤ書', sw: 'Sefania', am: 'ሶፎንያስ', id: 'Zefanya', tl: 'Zefanias', ko: '스바냐', ru: 'Софония', ar: 'صفنيا', fa: 'صفنیا' },
  // Books referenced by the authored prayer plans and Grow-tab teaching content
  // (localizeRef in teaching/pick.js). Extending BOOK_NAMES — the single source of
  // localized book names — lets those references render in every language, not just
  // English/French. Non-en/fr names follow the same conventions as the rows above
  // (German Pentateuch "N. Mose", Persian spelled-out ordinals, Russian Synodal
  // numbering where 1 Kings = 3 Царств); AI-drafted, pending native review.
  GEN: { fr: 'Genèse', en: 'Genesis', de: '1. Mose', pt: 'Gênesis', zh: '创世记', es: 'Génesis', hi: 'उत्पत्ति', ja: '創世記', sw: 'Mwanzo', am: 'ዘፍጥረት', id: 'Kejadian', tl: 'Genesis', ko: '창세기', ru: 'Бытие', ar: 'تكوين', fa: 'پیدایش' },
  EXO: { fr: 'Exode', en: 'Exodus', de: '2. Mose', pt: 'Êxodo', zh: '出埃及记', es: 'Éxodo', hi: 'निर्गमन', ja: '出エジプト記', sw: 'Kutoka', am: 'ዘጸአት', id: 'Keluaran', tl: 'Exodo', ko: '출애굽기', ru: 'Исход', ar: 'خروج', fa: 'خروج' },
  LEV: { fr: 'Lévitique', en: 'Leviticus', de: '3. Mose', pt: 'Levítico', zh: '利未记', es: 'Levítico', hi: 'लैव्यव्यवस्था', ja: 'レビ記', sw: 'Mambo ya Walawi', am: 'ዘሌዋውያን', id: 'Imamat', tl: 'Levitico', ko: '레위기', ru: 'Левит', ar: 'اللاويين', fa: 'لاویان' },
  NUM: { fr: 'Nombres', en: 'Numbers', de: '4. Mose', pt: 'Números', zh: '民数记', es: 'Números', hi: 'गिनती', ja: '民数記', sw: 'Hesabu', am: 'ዘኍልቍ', id: 'Bilangan', tl: 'Mga Bilang', ko: '민수기', ru: 'Числа', ar: 'العدد', fa: 'اعداد' },
  '1KI': { fr: '1 Rois', en: '1 Kings', de: '1. Könige', pt: '1 Reis', zh: '列王纪上', es: '1 Reyes', hi: '1 राजा', ja: '列王記第一', sw: '1 Wafalme', am: '1ኛ ነገሥት', id: '1 Raja-raja', tl: '1 Mga Hari', ko: '열왕기상', ru: '3 Царств', ar: '1 ملوك', fa: 'اول پادشاهان' },
  '2CH': { fr: '2 Chroniques', en: '2 Chronicles', de: '2. Chronik', pt: '2 Crônicas', zh: '历代志下', es: '2 Crónicas', hi: '2 इतिहास', ja: '歴代誌第二', sw: '2 Nyakati', am: '2ኛ ዜና መዋዕል', id: '2 Tawarikh', tl: '2 Cronica', ko: '역대하', ru: '2 Паралипоменон', ar: '2 أخبار الأيام', fa: 'دوم تواریخ' },
  EST: { fr: 'Esther', en: 'Esther', de: 'Ester', pt: 'Ester', zh: '以斯帖记', es: 'Ester', hi: 'एस्तेर', ja: 'エステル記', sw: 'Esta', am: 'አስቴር', id: 'Ester', tl: 'Ester', ko: '에스더', ru: 'Есфирь', ar: 'أستير', fa: 'استر' },
  JOB: { fr: 'Job', en: 'Job', de: 'Hiob', pt: 'Jó', zh: '约伯记', es: 'Job', hi: 'अय्यूब', ja: 'ヨブ記', sw: 'Ayubu', am: 'ኢዮብ', id: 'Ayub', tl: 'Job', ko: '욥기', ru: 'Иов', ar: 'أيوب', fa: 'ایوب' },
  ECC: { fr: 'Ecclésiaste', en: 'Ecclesiastes', de: 'Prediger', pt: 'Eclesiastes', zh: '传道书', es: 'Eclesiastés', hi: 'सभोपदेशक', ja: '伝道者の書', sw: 'Mhubiri', am: 'መክብብ', id: 'Pengkhotbah', tl: 'Mangangaral', ko: '전도서', ru: 'Екклесиаст', ar: 'الجامعة', fa: 'جامعه' },
  JOL: { fr: 'Joël', en: 'Joel', de: 'Joel', pt: 'Joel', zh: '约珥书', es: 'Joel', hi: 'योएल', ja: 'ヨエル書', sw: 'Yoeli', am: 'ኢዮኤል', id: 'Yoël', tl: 'Joel', ko: '요엘', ru: 'Иоиль', ar: 'يوئيل', fa: 'یوئیل' },
  MIC: { fr: 'Michée', en: 'Micah', de: 'Micha', pt: 'Miqueias', zh: '弥迦书', es: 'Miqueas', hi: 'मीका', ja: 'ミカ書', sw: 'Mika', am: 'ሚክያስ', id: 'Mikha', tl: 'Mikas', ko: '미가', ru: 'Михей', ar: 'ميخا', fa: 'میکاه' },
  HAB: { fr: 'Habacuc', en: 'Habakkuk', de: 'Habakuk', pt: 'Habacuque', zh: '哈巴谷书', es: 'Habacuc', hi: 'हबक्कूक', ja: 'ハバクク書', sw: 'Habakuki', am: 'ዕንባቆም', id: 'Habakuk', tl: 'Habacuc', ko: '하박국', ru: 'Аввакум', ar: 'حبقوق', fa: 'حبقوق' },
  DAN: { fr: 'Daniel', en: 'Daniel', de: 'Daniel', pt: 'Daniel', zh: '但以理书', es: 'Daniel', hi: 'दानिय्येल', ja: 'ダニエル書', sw: 'Danieli', am: 'ዳንኤል', id: 'Daniel', tl: 'Daniel', ko: '다니엘', ru: 'Даниил', ar: 'دانيال', fa: 'دانیال' },
  ACT: { fr: 'Actes', en: 'Acts', de: 'Apostelgeschichte', pt: 'Atos', zh: '使徒行传', es: 'Hechos', hi: 'प्रेरितों के काम', ja: '使徒の働き', sw: 'Matendo', am: 'የሐዋርያት ሥራ', id: 'Kisah Para Rasul', tl: 'Mga Gawa', ko: '사도행전', ru: 'Деяния', ar: 'أعمال الرسل', fa: 'اعمال رسولان' },
  '2PE': { fr: '2 Pierre', en: '2 Peter', de: '2. Petrus', pt: '2 Pedro', zh: '彼得后书', es: '2 Pedro', hi: '2 पतरस', ja: '2ペテロ', sw: '2 Petro', am: '2ኛ ጴጥሮስ', id: '2 Petrus', tl: '2 Pedro', ko: '베드로후서', ru: '2 Петра', ar: '2 بطرس', fa: 'دوم پطرس' },
  REV: { fr: 'Apocalypse', en: 'Revelation', de: 'Offenbarung', pt: 'Apocalipse', zh: '启示录', es: 'Apocalipsis', hi: 'प्रकाशितवाक्य', ja: '黙示録', sw: 'Ufunuo', am: 'ራእይ', id: 'Wahyu', tl: 'Pahayag', ko: '요한계시록', ru: 'Откровение', ar: 'رؤيا', fa: 'مکاشفه' },
};

// Vetted, prayer/faith/trust/thanksgiving-themed references grouped by book so
// each entry is easy to verify. buildPool() interleaves them (round-robin) so
// consecutive days rotate through different books rather than long single-book runs.
const BY_BOOK = {
  PSA: ['3:4', '4:8', '5:3', '9:1', '9:2', '9:10', '13:5', '16:1', '16:8', '16:11', '17:6', '18:6', '19:14', '23:1', '23:4', '25:1', '25:4', '25:5', '27:1', '27:4', '27:8', '27:14', '28:7', '29:11', '30:5', '31:24', '32:7', '33:20', '33:22', '34:1', '34:4', '34:8', '34:17', '34:18', '37:4', '37:5', '37:7', '40:1', '42:1', '42:11', '46:1', '46:10', '51:10', '51:12', '54:2', '55:22', '56:3', '57:1', '59:16', '61:2', '62:1', '62:5', '62:8', '63:1', '66:19', '66:20', '68:19', '71:1', '73:26', '77:1', '84:11', '86:5', '86:7', '86:11', '89:1', '90:12', '91:1', '91:2', '91:11', '92:1', '94:19', '95:2', '100:4', '103:1', '103:2', '104:33', '105:1', '107:1', '107:8', '111:1', '112:7', '115:1', '116:1', '116:2', '118:24', '119:105', '119:114', '121:1', '121:2', '130:5', '131:1', '136:1', '138:3', '139:23', '139:24', '141:2', '143:8', '143:10', '145:18', '145:19', '147:3', '150:6'],
  PRO: ['3:5', '3:6', '15:8', '15:29', '16:3', '16:9', '18:10'],
  ISA: ['26:3', '30:15', '40:29', '40:31', '41:10', '43:2', '55:6', '55:7', '58:9', '65:24'],
  JER: ['17:7', '29:11', '29:12', '33:3'],
  LAM: ['3:22', '3:25'],
  MAT: ['6:6', '6:9', '6:33', '7:7', '11:28', '18:20', '21:22'],
  MRK: ['11:24', '11:25'],
  LUK: ['11:9', '11:10', '18:1', '18:27', '22:42'],
  JHN: ['14:13', '14:14', '14:27', '15:7', '16:24', '16:33'],
  ROM: ['8:26', '8:28', '10:12', '12:12', '15:13'],
  '1CO': ['10:13', '15:57', '16:13'],
  '2CO': ['1:3', '4:16', '5:7', '9:8', '12:9'],
  GAL: ['6:9'],
  EPH: ['3:16', '3:20', '6:10', '6:18'],
  PHP: ['4:6', '4:7', '4:13', '4:19'],
  COL: ['3:15', '3:16', '3:17', '4:2'],
  '1TH': ['5:16', '5:17', '5:18'],
  '1TI': ['2:1', '2:8'],
  '2TI': ['1:7'],
  HEB: ['4:16', '10:22', '10:23', '11:1', '11:6', '12:2', '13:5', '13:15'],
  JAS: ['1:5', '1:6', '4:8', '5:13', '5:16'],
  '1PE': ['4:7', '5:6', '5:7'],
  '1JN': ['3:22', '5:14', '5:15'],
  DEU: ['31:6', '31:8'],
  JOS: ['1:9'],
  '1CH': ['16:11', '16:34'],
  NEH: ['8:10'],
  ZEP: ['3:17'],
};

// Round-robin interleave: one verse from each book in turn until all are used.
// Deterministic (source order is fixed), so the day-of-year rotation is stable.
function buildPool() {
  const books = Object.keys(BY_BOOK);
  const remaining = books.map((b) => BY_BOOK[b].slice());
  const pool = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (let i = 0; i < books.length; i++) {
      const cv = remaining[i].shift();
      if (cv) { pool.push({ book: books[i], cv }); progressed = true; }
    }
  }
  return pool;
}

export const POOL = buildPool();

// Hand-vetted embedded text for a core set, in all 16 languages, so the most
// common days render instantly and fully offline. Keyed by "<BOOK> <chapter:verse>",
// matching the neutral key verseOfDay builds. Anything not here resolves through
// the authoritative pipeline (verseText.js) and is cached after first view.
const SEED = {
  '1TH 5:17': { fr: 'Priez sans cesse.', en: 'Pray without ceasing.', de: 'Betet ohne Unterlass.', pt: 'Orai sem cessar.', zh: '不住地祷告。', es: 'Orad sin cesar.', hi: 'निरन्तर प्रार्थना करते रहो।', ja: '絶えず祈りなさい。', sw: 'Ombeni bila kukoma.', am: 'ሳታቋርጡ ጸልዩ።', id: 'Berdoalah tanpa henti.', tl: 'Manalangin kayo nang walang humpay.', ko: '쉬지 말고 기도하라.', ru: 'Непрестанно молитесь.', ar: 'صلوا بلا انقطاع.', fa: 'پیوسته دعا کنید.' },
  'PHP 4:6': { fr: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications.", en: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', de: 'Sorgt euch um nichts, sondern in allem lasst eure Bitten im Gebet und Flehen mit Danksagung vor Gott kundwerden.', pt: 'Não andeis ansiosos por coisa alguma; antes em tudo apresentai as vossas petições a Deus em oração e súplica com ações de graças.', zh: '应当一无挂虑，只要凡事藉着祷告、祈求和感谢，将你们所要的告诉神。', es: 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.', hi: 'किसी भी बात की चिन्ता मत करो; परन्तु हर एक बात में प्रार्थना और बिनती के द्वारा धन्यवाद के साथ अपनी विनतियाँ परमेश्वर के सम्मुख उपस्थित करो।', ja: '何も思い煩わないで、あらゆる場合に、感謝をもってささげる祈りと願いによって、あなたがたの求めることを神に打ち明けなさい。', sw: 'Msijishughulishe na kitu chochote, bali katika kila kitu maombi yenu na dua na shukrani ziwasilishwe kwa Mungu.', am: 'ስለ ምንም አትጨነቁ፤ ነገር ግን በሁሉ ነገር ምስጋናን ጨምራችሁ ጸሎትና ልመናን ለእግዚአብሔር አሳውቁ።', id: 'Janganlah hendaknya kamu kuatir tentang apa pun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur.', tl: 'Huwag kayong mabalisa sa anumang bagay; sa halip, sa lahat ng bagay, ipahayag ang inyong mga kahilingan sa Diyos sa pamamagitan ng panalangin at pagmamakaawa na may pasasalamat.', ko: '아무것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라.', ru: 'Не заботьтесь ни о чём, но всегда в молитве и прошении с благодарением открывайте свои желания пред Богом.', ar: 'لا تهتموا بشيء، بل في كل شيء بالصلاة والتضرع مع الشكر، لتُعلَم طلباتكم لدى الله.', fa: 'هیچ چیز را نگران نباشید، بلکه در هر چیز، با دعا و تضرع با شکرگزاری، خواسته‌های خود را به خدا اعلام کنید.' },
  'JAS 5:16': { fr: 'La prière fervente du juste a une grande efficacité.', en: 'The prayer of a righteous person is powerful and effective.', de: 'Das inständige Gebet eines Gerechten vermag viel.', pt: 'A oração eficaz do justo pode muito.', zh: '义人祈祷所发的力量是大有功效的。', es: 'La oración eficaz del justo puede mucho.', hi: 'धर्मी जन की प्रार्थना के प्रभाव से बहुत कुछ हो सकता है।', ja: '義人の祈りは大いに力があり、効果があります。', sw: 'Maombi ya mtu mwenye haki, yakiombwa kwa bidii, yana nguvu nyingi.', am: 'የጻድቅ ሰው ጸሎት ብዙ ያደርጋል።', id: 'Doa orang yang benar, bila dengan yakin didoakan, sangat besar kuasanya.', tl: 'Ang taimtim na panalangin ng taong matuwid ay may malaking kapangyarihan.', ko: '의인의 간구는 역사하는 힘이 큼이니라.', ru: 'Много может усиленная молитва праведного.', ar: 'صلاة البار تقتدر كثيراً في فعلها.', fa: 'دعای مرد عادل تأثیر عظیمی دارد.' },
  'MAT 7:7': { fr: "Demandez, et l'on vous donnera; cherchez, et vous trouverez; frappez, et l'on vous ouvrira.", en: 'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.', de: 'Bittet, so wird euch gegeben; suchet, so werdet ihr finden; klopfet an, so wird euch aufgetan.', pt: 'Pedi, e dar-se-vos-á; buscai e encontrareis; batei, e abrir-se-vos-á.', zh: '你们祈求，就给你们；寻找，就寻见；叩门，就给你们开门。', es: 'Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá.', hi: 'मांगो, तो तुम्हें दिया जाएगा; ढूंढ़ो, तो तुम पाओगे; खटखटाओ, तो तुम्हारे लिए खोला जाएगा।', ja: '求めなさい。そうすれば与えられます。捜しなさい。そうすれば見つかります。たたきなさい。そうすれば開かれます。', sw: 'Ombeni, nanyi mtapewa; tafuteni, nanyi mtapata; bisheni, nanyi mtafunguliwa.', am: 'ለምኑ ይሰጣችኋል፤ ፈልጉ ታገኛላችሁ፤ መቱ ይከፈትላችኋል።', id: 'Mintalah, maka akan diberikan kepadamu; carilah, maka kamu akan mendapat; ketoklah, maka pintu akan dibukakan bagimu.', tl: "Humingi kayo at kayo'y bibigyan; maghanap kayo at kayo'y makakahanap; kumatok kayo at kayo'y pagbubukas.", ko: '구하라 그리하면 너희에게 주실 것이요 찾으라 그리하면 찾아낼 것이요 문을 두드리라 그리하면 너희에게 열릴 것이니.', ru: 'Просите, и дано будет вам; ищите, и найдёте; стучите, и отворят вам.', ar: 'اسألوا تُعطَوا، اطلبوا تجدوا، اقرعوا يُفتَح لكم.', fa: 'بخواهید تا به شما داده شود؛ بجویید تا بیابید؛ بکوبید تا در باز شود.' },
  'MRK 11:24': { fr: "Je vous le dis, tout ce que vous demanderez en priant, croyez que vous l'avez reçu, et vous le verrez s'accomplir.", en: 'Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours.', de: "Darum sage ich euch: Alles, was ihr im Gebet begehrt, glaubt nur, dass ihr's empfangen werdet, so wird's euch werden.", pt: 'Por isso vos digo que tudo quanto em oração pedirdes, crede que recebestes e assim será convosco.', zh: '所以我告诉你们，凡你们祷告祈求的，无论是什么，只要信是得着的，就必得着。', es: 'Por tanto, os digo que todo lo que pidiereis orando, creed que lo recibiréis, y os vendrá.', hi: 'इसलिए मैं तुमसे कहता हूं, जो कुछ तुम प्रार्थना करके मांगो, विश्वास करो कि मिल गया, तो तुम्हें मिलेगा।', ja: 'だからあなたがたに言うのです。祈って求めるものは何でも、すでに受けたと信じなさい。そうすれば、そのとおりになります。', sw: 'Kwa sababu hiyo nawaambia, kila kitu mnaomba mkisali, aminini kwamba mmekwisha kupokea, nazo zitakuwa zenu.', am: 'ስለዚህ እላችኋለሁ፤ ስትጸልዩ የምትለምኑትን ሁሉ ተቀብላችኋል ብላችሁ እመኑ፥ ይሆናልላችሁ።', id: 'Karena itu Aku berkata kepadamu: apa saja yang kamu minta dan doakan, percayalah bahwa kamu telah menerimanya, maka hal itu akan diberikan kepadamu.', tl: 'Kaya sinasabi ko sa inyo, anumang hingin ninyo sa panalangin, manampalataya kayong ito ay natanggap na ninyo, at magkakaroon kayo nito.', ko: '그러므로 내가 너희에게 말하노니 무엇이든지 기도하고 구하는 것은 받은 줄로 믿으라 그리하면 너희에게 그대로 되리라.', ru: 'Потому говорю вам: всё, чего ни будете просить в молитве, верьте, что получите, — и будет вам.', ar: 'لذلك أقول لكم: كل ما تطلبونه حين تصلون فآمنوا أنكم تنالونه، فيكون لكم.', fa: 'بنابراین به شما می‌گویم هر چه در دعا بخواهید، ایمان داشته باشید که آن را دریافت کرده‌اید، و برای شما خواهد بود.' },
  'MAT 6:33': { fr: "Cherchez d'abord le royaume de Dieu et sa justice, et toutes ces choses vous seront données par-dessus.", en: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', de: 'Trachtet zuerst nach dem Reich Gottes und nach seiner Gerechtigkeit, so wird euch das alles zufallen.', pt: 'Buscai em primeiro lugar o seu reino e a sua justiça, e todas essas coisas vos serão acrescentadas.', zh: '你们要先求他的国和他的义，这些东西都要加给你们了。', es: 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.', hi: 'इसलिए पहले परमेश्वर के राज्य और उसकी धार्मिकता की खोज करो, तो ये सब वस्तुएं भी तुम्हें मिल जाएंगी।', ja: 'まず神の国と神の義を求めなさい。そうすれば、これらのものはすべて、それに加えて与えられます。', sw: 'Bali utafuteni kwanza ufalme wa Mungu na haki yake; na hizi zote mtaziongezewa.', am: 'ነገር ግን አስቀድማችሁ የእግዚአብሔርን መንግሥቱንና ጽድቁን ፈልጉ፤ ይህም ሁሉ ይጨመርላችኋል።', id: 'Tetapi carilah dahulu Kerajaan Allah dan kebenarannya, maka semuanya itu akan ditambahkan kepadamu.', tl: 'Ngunit hanapin muna ninyo ang kaharian ng Diyos at ang kanyang katuwiran, at ang lahat ng mga bagay na ito ay idadagdag sa inyo.', ko: '그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라.', ru: 'Ищите же прежде Царства Божия и правды Его, и это всё приложится вам.', ar: 'بل اطلبوا أولاً ملكوت الله وبره، وهذه كلها تُزاد لكم.', fa: 'بلکه نخست پادشاهی خدا و عدالت او را بجویید، و همه این‌ها به شما افزوده خواهد شد.' },
  'PSA 145:18': { fr: "L'Éternel est proche de tous ceux qui l'invoquent, de tous ceux qui l'invoquent avec sincérité.", en: 'The Lord is near to all who call on him, to all who call on him in truth.', de: 'Der Herr ist nahe allen, die ihn anrufen, allen, die ihn ernstlich anrufen.', pt: 'O Senhor está perto de todos os que o invocam, de todos os que o invocam com sinceridade.', zh: '凡呼求耶和华的，就是诚心呼求他的，耶和华便与他们相近。', es: 'Cercano está Jehová a todos los que le invocan, a todos los que le invocan de veras.', hi: 'जो उसे पुकारते हैं, जो उसे सच्चाई से पुकारते हैं, उन सबके निकट यहोवा है।', ja: '主はご自分を呼び求めるすべての者に、真実をもってご自分を呼び求めるすべての者に、近くいてくださいます。', sw: 'Bwana yu karibu na wote wanaomwita, wote wanaomwita kwa kweli.', am: 'እግዚአብሔር ለሚጠሩት ሁሉ፥ በእውነት ለሚጠሩት ሁሉ ቅርብ ነው።', id: 'TUHAN dekat pada semua orang yang berseru kepada-Nya, pada semua orang yang berseru kepada-Nya dalam kesetiaan.', tl: 'Ang Panginoon ay malapit sa lahat ng tumatawag sa kanya, sa lahat ng tumatawag sa kanya nang tapat.', ko: '여호와께서는 자기에게 간구하는 모든 자 곧 진실하게 간구하는 모든 자에게 가까이 하시는도다.', ru: 'Господь близок ко всем призывающим Его, ко всем призывающим Его в истине.', ar: 'الرب قريب من كل الذين يدعونه، من كل الذين يدعونه بالحق.', fa: 'خداوند به همه کسانی که او را می‌خوانند، به همه کسانی که او را در راستی می‌خوانند، نزدیک است.' },
};

// Day-of-year (1–366) in the given date's local time, used to rotate the pool so
// every user sees the same verse on the same calendar day.
function dayOfYear(date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86400000);
}

// Render a pool entry's reference in the given language (e.g. "Philippiens 4:6").
// Falls back to the English book name, then the raw code, if a name is missing.
function localizedRef(entry, lang) {
  const names = BOOK_NAMES[entry.book] || {};
  const name = names[lang] || names.en || entry.book;
  return `${name} ${entry.cv}`;
}

// The verse of the day: deterministic per calendar day, shared across all users.
// Returns { ref, text, usfm } — `ref` is the localized reference; `text` is the
// embedded SEED text when we have it in this language (instant + offline), else
// '' so the caller resolves it through the authoritative pipeline and caches it;
// `usfm` (e.g. "PHP.4.6") is derived directly from the pool entry's own USFM book
// code, so resolving the daily verse via YouVersion never needs an AI call to
// re-derive the passage id from the localized reference string.
export function verseOfDay(lang, date = new Date()) {
  const entry = POOL[dayOfYear(date) % POOL.length];
  const key = `${entry.book} ${entry.cv}`;
  return { ref: localizedRef(entry, lang), text: SEED[key]?.[lang] || '', usfm: `${entry.book}.${entry.cv.replace(':', '.')}` };
}
