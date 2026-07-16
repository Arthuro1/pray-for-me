import { useState, useEffect } from 'react';
import { BookOpen, Calendar, CheckCircle, Globe, Lock, ChevronDown, ChevronUp, Sparkles, Sun, Moon, Users, Sprout, Bell, Smartphone } from 'lucide-react';
import { dirFor } from '../i18n';
import usePrayerStore from '../store/prayerStore';
import { localizeRef } from '../content/teaching/pick';

// `complete: false` marks languages whose landing-page copy (FAQs, feature
// blurbs) is still an abbreviated placeholder rather than the full translation
// — shown with a small dot in the language dropdown so it doesn't look finished.
const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'FR', complete: true },
  { code: 'en', flag: '🇬🇧', label: 'EN', complete: true },
  { code: 'de', flag: '🇩🇪', label: 'DE', complete: true },
  { code: 'pt', flag: '🇧🇷', label: 'PT', complete: true },
  { code: 'zh', flag: '🇨🇳', label: 'ZH', complete: true },
  { code: 'es', flag: '🇪🇸', label: 'ES', complete: true },
  { code: 'hi', flag: '🇮🇳', label: 'HI', complete: true },
  { code: 'ja', flag: '🇯🇵', label: 'JA', complete: true },
  { code: 'sw', flag: '🇰🇪', label: 'SW', complete: false },
  { code: 'am', flag: '🇪🇹', label: 'AM', complete: false },
  { code: 'id', flag: '🇮🇩', label: 'ID', complete: false },
  { code: 'tl', flag: '🇵🇭', label: 'TL', complete: false },
  { code: 'ko', flag: '🇰🇷', label: 'KO', complete: false },
  { code: 'ru', flag: '🇷🇺', label: 'RU', complete: false },
  { code: 'ar', flag: '🇸🇦', label: 'AR', complete: false },
  { code: 'fa', flag: '🇮🇷', label: 'FA', complete: false },
];

const ALL_CODES = LANGS.map(l => l.code);

// The three things Pray4Me does, surfaced right under the hero. Icons/colours are
// language-independent (defined once); the copy lives in one shared map with an
// English fallback, so all 16 languages keep working even where the per-language
// CONTENT below is still an abbreviated placeholder.
const BENEFIT_META = [
  { icon: BookOpen, color: '#7c5cfc' },
  { icon: Calendar, color: '#059669' },
  { icon: CheckCircle, color: '#0891b2' },
];

const CORE_BENEFITS = {
  en: [
    { title: 'Remember every prayer', desc: 'Keep who and what you pray for in one private place — and never lose track again.' },
    { title: 'Know what to pray today', desc: "Open the app and today's prayers are ready — begin with one tap." },
    { title: 'Record every answer', desc: "Mark prayers answered and watch a gallery of God's faithfulness grow." },
  ],
  fr: [
    { title: 'Retenez chaque prière', desc: 'Gardez qui et quoi vous priez en un seul endroit privé — sans jamais rien oublier.' },
    { title: "Sachez quoi prier aujourd'hui", desc: "Ouvrez l'app : les prières du jour vous attendent — commencez d'un seul geste." },
    { title: 'Consignez chaque réponse', desc: 'Marquez les prières exaucées et voyez grandir une galerie de la fidélité de Dieu.' },
  ],
  de: [
    { title: 'Jedes Gebet behalten', desc: 'Behalte an einem privaten Ort, für wen und was du betest — und verliere nie den Überblick.' },
    { title: 'Wissen, was heute zu beten ist', desc: "Öffne die App und die Gebete des Tages stehen bereit — beginne mit einem Tipp." },
    { title: 'Jede Antwort festhalten', desc: 'Markiere erhörte Gebete und sieh eine Galerie von Gottes Treue wachsen.' },
  ],
  pt: [
    { title: 'Lembre cada oração', desc: 'Guarde por quem e pelo que você ora num só lugar privado — sem nunca esquecer.' },
    { title: 'Saiba o que orar hoje', desc: "Abra o app e as orações de hoje já estão prontas — comece com um toque." },
    { title: 'Registre cada resposta', desc: 'Marque orações respondidas e veja crescer uma galeria da fidelidade de Deus.' },
  ],
  es: [
    { title: 'Recuerda cada oración', desc: 'Guarda por quién y por qué oras en un lugar privado — sin olvidar nada.' },
    { title: 'Sabe qué orar hoy', desc: "Abre la app y las oraciones de hoy están listas — comienza con un toque." },
    { title: 'Registra cada respuesta', desc: 'Marca oraciones respondidas y ve crecer una galería de la fidelidad de Dios.' },
  ],
  zh: [
    { title: '记住每个祷告', desc: '把你为谁、为何祷告都存放在一个私密之处——再也不会遗忘。' },
    { title: '知道今天该为何祷告', desc: "打开应用，今天的祷告已经备好——一键开始。" },
    { title: '记录每次应允', desc: '标记已蒙应允的祷告，见证神信实的画廊不断增长。' },
  ],
  hi: [
    { title: 'हर प्रार्थना याद रखें', desc: 'आप किसके लिए और किसलिए प्रार्थना करते हैं, सब एक निजी जगह पर रखें — कभी न भूलें।' },
    { title: 'जानें आज क्या प्रार्थना करें', desc: "ऐप खोलें और आज की प्रार्थनाएँ तैयार हैं — एक टैप से शुरू करें।" },
    { title: 'हर उत्तर दर्ज करें', desc: 'उत्तरित प्रार्थनाओं को चिह्नित करें और परमेश्वर की विश्वासयोग्यता की गैलरी बढ़ते देखें।' },
  ],
  ja: [
    { title: 'すべての祈りを覚えておく', desc: '誰のために何を祈るかを一つの安全な場所に——もう見失いません。' },
    { title: '今日祈ることが分かる', desc: "アプリを開けば今日の祈りが用意されています——ワンタップで始めましょう。" },
    { title: 'すべての答えを記録する', desc: '祈りが答えられたら印を付け、神の真実の記録が増えていくのを見ましょう。' },
  ],
  sw: [
    { title: 'Kumbuka kila ombi', desc: 'Weka unayemwombea na unachokiombea mahali pamoja pa faragha — bila kusahau.' },
    { title: 'Jua la kuombea leo', desc: "Fungua programu na maombi ya leo yako tayari — anza kwa mguso mmoja." },
    { title: 'Andika kila jibu', desc: 'Weka alama maombi yaliyojibiwa na uone ghala la uaminifu wa Mungu likikua.' },
  ],
  am: [
    { title: 'እያንዳንዱን ጸሎት አስታውሱ', desc: 'ለማን እና ለምን እንደሚጸልዩ በአንድ የግል ቦታ ያኑሩ — ሳይረሱ።' },
    { title: 'ዛሬ ምን እንደሚጸልዩ እወቁ', desc: "መተግበሪያውን ሲከፍቱ የዛሬ ጸሎቶች ዝግጁ ናቸው — በአንድ ንክኪ ይጀምሩ።" },
    { title: 'እያንዳንዱን መልስ መዝግቡ', desc: 'የተመለሱ ጸሎቶችን ምልክት ያድርጉ እና የእግዚአብሔርን ታማኝነት ማዕከል ሲያድግ ይመልከቱ።' },
  ],
  id: [
    { title: 'Ingat setiap doa', desc: 'Simpan siapa dan apa yang Anda doakan di satu tempat pribadi — tanpa pernah lupa.' },
    { title: 'Tahu apa yang didoakan hari ini', desc: "Buka aplikasi dan doa hari ini sudah siap — mulai dengan satu ketukan." },
    { title: 'Catat setiap jawaban', desc: 'Tandai doa yang dijawab dan lihat galeri kesetiaan Tuhan bertumbuh.' },
  ],
  tl: [
    { title: 'Tandaan ang bawat panalangin', desc: 'Itago kung sino at ano ang ipinapanalangin mo sa isang pribadong lugar — hindi na malilimutan.' },
    { title: 'Alamin kung ano ang ipapanalangin ngayon', desc: "Buksan ang app at handa na ang mga panalangin ngayon — magsimula sa isang tap." },
    { title: 'Itala ang bawat sagot', desc: 'Markahan ang mga nasagot na panalangin at masdan ang lumalagong galerya ng katapatan ng Diyos.' },
  ],
  ko: [
    { title: '모든 기도를 기억하세요', desc: '누구를 위해 무엇을 기도하는지 한 곳에 안전하게 — 다시는 놓치지 마세요.' },
    { title: '오늘 무엇을 기도할지 아세요', desc: "앱을 열면 오늘의 기도가 준비되어 있어요 — 한 번의 탭으로 시작하세요." },
    { title: '모든 응답을 기록하세요', desc: '응답된 기도를 표시하고 하나님의 신실하심의 갤러리가 자라는 것을 보세요.' },
  ],
  ru: [
    { title: 'Помните каждую молитву', desc: 'Храните, за кого и о чём молитесь, в одном личном месте — и ничего не забывайте.' },
    { title: 'Знайте, о чём молиться сегодня', desc: "Откройте приложение — молитвы на сегодня уже готовы. Начните одним касанием." },
    { title: 'Записывайте каждый ответ', desc: 'Отмечайте отвеченные молитвы и наблюдайте, как растёт галерея Божьей верности.' },
  ],
  ar: [
    { title: 'تذكّر كل صلاة', desc: 'احفظ لمن ولماذا تصلّي في مكان خاص واحد — دون أن تنسى أبدًا.' },
    { title: 'اعرف بماذا تصلّي اليوم', desc: "افتح التطبيق وستجد صلوات اليوم جاهزة — ابدأ بلمسة واحدة." },
    { title: 'سجّل كل استجابة', desc: 'ضع علامة على الصلوات المستجابة وشاهد معرض أمانة الله ينمو.' },
  ],
  fa: [
    { title: 'هر دعا را به یاد بسپارید', desc: 'اینکه برای چه کسی و برای چه دعا می‌کنید را در یک جای خصوصی نگه دارید — بدون فراموشی.' },
    { title: 'بدانید امروز برای چه دعا کنید', desc: "برنامه را باز کنید؛ دعاهای امروز آماده‌اند — با یک لمس شروع کنید." },
    { title: 'هر پاسخ را ثبت کنید', desc: 'دعاهای مستجاب‌شده را علامت بزنید و رشد گالری وفاداری خدا را ببینید.' },
  ],
};

// Label for the toggle that folds the full feature grid away. Shared map, English
// fallback — same pattern as CORE_BENEFITS.
const EXPLORE_LABELS = {
  en: { more: 'Explore all features', less: 'Show fewer' },
  fr: { more: 'Découvrir toutes les fonctionnalités', less: 'Afficher moins' },
  de: { more: 'Alle Funktionen entdecken', less: 'Weniger anzeigen' },
  pt: { more: 'Explorar todos os recursos', less: 'Mostrar menos' },
  es: { more: 'Explorar todas las funciones', less: 'Mostrar menos' },
  zh: { more: '探索全部功能', less: '收起' },
  hi: { more: 'सभी सुविधाएँ देखें', less: 'कम दिखाएँ' },
  ja: { more: 'すべての機能を見る', less: '表示を減らす' },
  sw: { more: 'Chunguza vipengele vyote', less: 'Onyesha kidogo' },
  am: { more: 'ሁሉንም ባህሪያት ያስሱ', less: 'ያነሰ አሳይ' },
  id: { more: 'Jelajahi semua fitur', less: 'Tampilkan lebih sedikit' },
  tl: { more: 'Tuklasin ang lahat ng feature', less: 'Magpakita ng mas kaunti' },
  ko: { more: '모든 기능 살펴보기', less: '간략히 보기' },
  ru: { more: 'Все возможности', less: 'Свернуть' },
  ar: { more: 'استكشف كل الميزات', less: 'عرض أقل' },
  fa: { more: 'همهٔ امکانات را ببینید', less: 'نمایش کمتر' },
};

function detectLang() {
  const saved = localStorage.getItem('pfm_language');
  if (saved && ALL_CODES.includes(saved)) return saved;
  const nav = (navigator.language || 'en').toLowerCase().slice(0, 2);
  return ALL_CODES.includes(nav) ? nav : 'en';
}

const CONTENT = {
  fr: {
    signIn: 'Se connecter',
    badge: 'Votre compagnon de prière',
    h1a: 'N\'oubliez jamais une prière.',
    h1b: 'Tracez chaque réponse.',
    subtitle: "Un journal de prière gratuit et privé : notez une demande en quelques secondes, voyez quoi prier aujourd'hui et gardez chaque réponse.",
    cta: "Commencez votre journal de prière privé",
    howItWorks: 'Voir comment ça marche',
    verse: '"La prière fervante du juste est d\'une grande efficacité." — Jacques 5:16',
    featuresTitle: 'Tout ce dont votre vie de prière a besoin',
    featuresSub: 'Conçu pour les chrétiens qui veulent prier avec intention et suivre la fidélité de Dieu.',
    features: [
      { icon: Users, color: '#0d9488', title: 'Priez ensemble', desc: 'Rejoignez des groupes et des amis, partagez des demandes (ou restez anonyme), priez les uns pour les autres et célébrez les prières exaucées ensemble.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'Journal de prière', desc: 'Notez chaque demande de prière — pour vous ou pour d\'autres. Ajoutez des détails, suivez les évolutions, n\'oubliez jamais qui vous avez promis de prier.' },
      { icon: Calendar, color: '#059669', title: 'Planifiez vos prières', desc: 'Programmez chaque prière — ponctuelle ou récurrente (quotidienne, jours choisis, tous les N jours, mensuelle, annuelle), voire « jusqu\'à la réponse ». Calendrier mensuel, rattrapage en douceur, chaînes de prière en groupe et export .ics vers Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galerie de prières exaucées', desc: 'Marquez les prières comme exaucées et enregistrez votre témoignage. Regardez la fidélité de Dieu s\'accumuler au fil du temps.' },
      { icon: Sprout, color: '#65a30d', title: 'Grandir dans la prière', desc: 'Une bibliothèque enracinée dans l\'Écriture : 12 guides de prière à prier (les Psaumes, les promesses de Dieu, pour vos ennemis…) et de courtes lectures sur la prière et la vie chrétienne.' },
      { icon: Bell, color: '#ea580c', title: 'Rappels de prière', desc: 'Une notification quotidienne avec vos sujets du jour, et de doux rappels de suivi pour prendre des nouvelles de ceux pour qui vous priez — même app fermée.' },
      { icon: Smartphone, color: '#4f46e5', title: 'Installez-la partout', desc: 'Une vraie app sur Android, iOS et ordinateur. Fonctionne hors ligne — ajoutez et modifiez vos prières sans connexion, tout se synchronise à votre retour.' },
      { icon: Globe, color: '#db2777', title: '16 langues', desc: 'Interface complète en français, anglais, allemand, portugais, chinois, espagnol, hindi, japonais, swahili, amharique, indonésien, tagalog, coréen, russe, arabe et persan. Changez à tout moment.' },
      { icon: Lock, color: '#6d28d9', title: 'Privé & transparent', desc: 'Vos prières sont sécurisées — seul vous pouvez les voir. Verrouillez vos prières privées dans un coffre chiffré de bout en bout que seule votre phrase secrète peut ouvrir. Les fonctionnalités IA n\'envoient que le titre de la prière — nous sommes transparents sur ce qui est partagé.' },
    ],
    stepsTitle: 'Comment ça marche',
    stepsSub: "De votre première prière à un témoignage grandissant de la fidélité de Dieu — en trois étapes simples.",
    steps: [
      { emoji: "✍️", title: "Notez une prière", desc: "Écrivez ce qui est sur votre cœur." },
      { emoji: "🙏", title: "Priez ce qui compte aujourd'hui", desc: "Ouvrez l'app et commencez d'un seul geste." },
      { emoji: "🎉", title: "Souvenez-vous de la fidélité de Dieu", desc: "Consignez les réponses et témoignages au fil du temps." },
    ],
    calloutBadge: 'Suggestions de versets',
    calloutTitle: 'Trouvez le bon verset pour chaque prière',
    calloutDesc: 'Vous ne savez pas comment prier pour une situation ? Utilisez le chercheur de versets et obtenez 3 à 4 angles de prière, chacun avec des passages bibliques pertinents et leur texte complet — touchez un verset pour le lire directement dans l\'application.',
    calloutDisclaimer: 'Les suggestions présentent des passages bibliques — vous discernez ce qui parle à votre situation. L\'Esprit conduit ; cet outil vous aide à chercher les Écritures.',
    calloutTry: 'Essayer maintenant',
    calloutPreviewLabel: 'Suggestions de versets',
    faqTitle: 'Questions',
    faqs: [
      { q: 'Mes données sont-elles privées ?', a: 'Oui. Chaque prière est stockée dans votre propre compte avec Row Level Security — personne d\'autre ne peut voir vos données, pas même nous.' },
      { q: 'Ai-je besoin d\'un compte ?', a: 'Oui — un compte gratuit synchronise vos prières sur tous vos appareils. Inscrivez-vous avec Google en un tap ou utilisez email/mot de passe.' },
      { q: 'Comment fonctionne le chercheur de versets ?', a: 'Vous entrez le sujet de votre prière et l\'app suggère des versets bibliques pertinents avec leur texte complet. Vous choisissez ce qui résonne avec votre situation.' },
      { q: 'Quelles langues sont supportées ?', a: '16 langues : français, anglais, allemand, portugais, chinois, espagnol, hindi, japonais, swahili, amharique, indonésien, tagalog, coréen, russe, arabe et persan.' },
      { q: 'Est-ce gratuit ?', a: 'Oui, entièrement gratuit. L\'application est open source.' },
    ],
    ctaTitle: 'Commencez votre journal de prière aujourd\'hui',
    ctaSub: 'Gratuit, privé, et disponible en 16 langues. Inscrivez-vous en quelques secondes avec Google.',
    ctaBtn: "Commencez votre journal de prière privé",
    ctaVerse: '"Priez sans cesse." — 1 Thessaloniciens 5:17',
    footerBuilt: 'Built with ❤️ and faith',
  },
  en: {
    signIn: 'Sign in',
    badge: 'Your personal prayer companion',
    h1a: 'Never forget a prayer.',
    h1b: 'Track every answer.',
    subtitle: "A free, private prayer journal: capture requests in seconds, see what to pray today, and remember every answer.",
    cta: "Start your private prayer journal",
    howItWorks: 'See how it works',
    verse: '"The prayer of a righteous person is powerful and effective." — James 5:16',
    featuresTitle: 'Everything your prayer life needs',
    featuresSub: 'Built for Christians who want to pray with intention and track God\'s faithfulness.',
    features: [
      { icon: Users, color: '#0d9488', title: 'Pray together', desc: 'Join prayer groups and friends, share requests (or stay anonymous), pray for one another, and celebrate answered prayers as a community.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'Prayer journal', desc: 'Log every prayer request — for yourself or for others. Add details, follow up with updates, and never forget who you said you\'d pray for.' },
      { icon: Calendar, color: '#059669', title: 'Prayer scheduling', desc: 'Schedule any prayer — one-time or recurring (daily, chosen weekdays, every N days, monthly, yearly), even "until answered." A month calendar, gentle catch-up for missed days, group prayer chains, and one-tap .ics export to Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Answered prayer gallery', desc: 'Mark prayers as answered and record your testimony. Watch God\'s faithfulness accumulate over time in your personal gallery.' },
      { icon: Sprout, color: '#65a30d', title: 'Grow in prayer', desc: 'A Scripture-first library: 12 prayer guides to pray through (the Psalms, God\'s promises, for your enemies…) and short readings on prayer and the Christian life.' },
      { icon: Bell, color: '#ea580c', title: 'Prayer reminders', desc: 'A daily notification with the day\'s prayer subjects, plus gentle follow-up nudges to check in with the people you\'re praying for — even when the app is closed.' },
      { icon: Smartphone, color: '#4f46e5', title: 'Install it anywhere', desc: 'A full app on Android, iOS, and desktop. Works offline — add and edit prayers without a connection; everything syncs when you\'re back.' },
      { icon: Globe, color: '#db2777', title: '16 languages', desc: 'Full UI in French, English, German, Portuguese, Chinese, Spanish, Hindi, Japanese, Swahili, Amharic, Indonesian, Tagalog, Korean, Russian, Arabic, and Persian. Switch anytime.' },
      { icon: Lock, color: '#6d28d9', title: 'Private & transparent', desc: 'Your prayers are stored with row-level security — only you can see them. Lock private prayers in an end-to-end encrypted vault that only your passphrase opens. AI features send only the prayer title; we are transparent about what is shared.' },
    ],
    stepsTitle: 'How it works',
    stepsSub: "From a first prayer to a growing record of God's faithfulness — in three simple steps.",
    steps: [
      { emoji: "✍️", title: "Capture a prayer", desc: "Write what is on your heart." },
      { emoji: "🙏", title: "Pray what matters today", desc: "Open the app and begin with one tap." },
      { emoji: "🎉", title: "Remember God's faithfulness", desc: "Record answers and testimonies over time." },
    ],
    calloutBadge: 'Scripture suggestions',
    calloutTitle: 'Find the right Word for every prayer',
    calloutDesc: 'Stuck on how to pray for a situation? Tap the verse finder and get 3–4 prayer angles, each with relevant Bible passages and their full text — tap any verse to read it right in the app.',
    calloutDisclaimer: 'The suggestions surface Bible passages — you discern what speaks to your situation. The Spirit leads; this tool helps you search the Scriptures.',
    calloutTry: 'Try it now',
    calloutPreviewLabel: 'Scripture suggestions',
    faqTitle: 'Questions',
    faqs: [
      { q: 'Is my data private?', a: 'Yes. Every prayer is stored in your own account with Row Level Security — no one else can read your data, not even us.' },
      { q: 'Do I need an account?', a: 'Yes — a free account keeps your prayers synced across devices. Sign up with Google in one tap or use email/password.' },
      { q: 'How does the Scripture finder work?', a: 'You enter the title of your prayer and the app surfaces relevant Bible verses with their full text. You choose which ones resonate with your situation.' },
      { q: 'What languages are supported?', a: '16 languages: French, English, German, Portuguese, Chinese, Spanish, Hindi, Japanese, Swahili, Amharic, Indonesian, Tagalog, Korean, Russian, Arabic, and Persian.' },
      { q: 'Is it free?', a: 'Yes, completely free to use. The app is open source.' },
    ],
    ctaTitle: 'Start your prayer journal today',
    ctaSub: 'Free, private, and available in 16 languages. Sign up in seconds with Google.',
    ctaBtn: "Start your private prayer journal",
    ctaVerse: '"Pray without ceasing." — 1 Thessalonians 5:17',
    footerBuilt: 'Built with faith · Open source · MIT License',
  },
  de: {
    signIn: 'Anmelden',
    badge: 'Dein persönlicher Gebetsbegleiter',
    h1a: 'Vergiss kein Gebet.',
    h1b: 'Verfolge jede Antwort.',
    subtitle: "Ein kostenloses, privates Gebetstagebuch: Anliegen in Sekunden festhalten, sehen, was heute dran ist, und jede Antwort bewahren.",
    cta: "Starte dein privates Gebetstagebuch",
    howItWorks: 'Wie es funktioniert',
    verse: '"Das Gebet eines Gerechten vermag viel." — Jakobus 5:16',
    featuresTitle: 'Alles, was dein Gebetsleben braucht',
    featuresSub: 'Für Christen, die bewusst beten und Gottes Treue festhalten möchten.',
    features: [
      { icon: Users, color: '#0d9488', title: 'Gemeinsam beten', desc: 'Tritt Gebetsgruppen und Freunden bei, teile Anliegen (oder bleibe anonym), betet füreinander und feiert erhörte Gebete gemeinsam.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'Gebetstagebuch', desc: 'Notiere jede Gebetsanfrage — für dich oder für andere. Füge Details hinzu, verfolge Entwicklungen und vergiss nie, für wen du gebetet hast.' },
      { icon: Calendar, color: '#059669', title: 'Gebete planen', desc: 'Plane jedes Gebet — einmalig oder wiederkehrend (täglich, gewählte Wochentage, alle N Tage, monatlich, jährlich), sogar „bis erhört". Monatskalender, sanftes Nachholen, gemeinsame Gebetsketten und .ics-Export für Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galerie erhörter Gebete', desc: 'Markiere erhörte Gebete und halte dein Zeugnis fest. Erlebe Gottes Treue, die sich über die Zeit aufbaut.' },
      { icon: Sprout, color: '#65a30d', title: 'Im Gebet wachsen', desc: 'Eine in der Schrift verwurzelte Bibliothek: 12 Gebetsleitfäden zum Durchbeten (die Psalmen, Gottes Verheißungen, für deine Feinde…) und kurze Texte über Gebet und christliches Leben.' },
      { icon: Bell, color: '#ea580c', title: 'Gebetserinnerungen', desc: 'Eine tägliche Benachrichtigung mit deinen Gebetsanliegen des Tages, plus sanfte Erinnerungen, dich bei denen zu melden, für die du betest — auch bei geschlossener App.' },
      { icon: Smartphone, color: '#4f46e5', title: 'Überall installieren', desc: 'Eine echte App für Android, iOS und Desktop. Funktioniert offline — füge Gebete ohne Verbindung hinzu; alles synchronisiert sich, sobald du wieder online bist.' },
      { icon: Globe, color: '#db2777', title: '16 Sprachen', desc: 'Vollständige Oberfläche auf Französisch, Englisch, Deutsch, Portugiesisch, Chinesisch, Spanisch, Hindi, Japanisch, Swahili, Amharisch, Indonesisch, Tagalog, Koreanisch, Russisch, Arabisch und Persisch. Jederzeit wechselbar.' },
      { icon: Lock, color: '#6d28d9', title: 'Privat & sicher', desc: 'Deine Gebete verlassen nie deinen Account — nur du kannst sie sehen. Sperre private Gebete in einen Ende-zu-Ende-verschlüsselten Tresor, den nur deine Passphrase öffnet.' },
    ],
    stepsTitle: 'Wie es funktioniert',
    stepsSub: "Vom ersten Gebet zu einem wachsenden Zeugnis von Gottes Treue — in drei einfachen Schritten.",
    steps: [
      { emoji: "✍️", title: "Ein Gebet festhalten", desc: "Schreibe auf, was dir auf dem Herzen liegt." },
      { emoji: "🙏", title: "Beten, was heute zählt", desc: "Öffne die App und beginne mit einem Tipp." },
      { emoji: "🎉", title: "Gottes Treue erinnern", desc: "Halte Antworten und Zeugnisse über die Zeit fest." },
    ],
    calloutBadge: 'Bibelvers-Vorschläge',
    calloutTitle: 'Finde das richtige Wort für jedes Gebet',
    calloutDesc: 'Weißt du nicht, wie du für eine Situation beten sollst? Nutze den Verssucher und erhalte 3–4 Gebetsansätze mit relevanten Bibelpassagen und ihrem vollständigen Text.',
    calloutDisclaimer: 'Die Vorschläge zeigen Bibelpassagen — du unterscheidest, was zu deiner Situation spricht. Der Geist führt; dieses Tool hilft dir, die Schriften zu durchsuchen.',
    calloutTry: 'Jetzt ausprobieren',
    calloutPreviewLabel: 'Bibelvers-Vorschläge',
    faqTitle: 'Fragen',
    faqs: [
      { q: 'Sind meine Daten privat?', a: 'Ja. Jedes Gebet wird in deinem eigenen Account mit Row Level Security gespeichert — niemand sonst kann deine Daten lesen, nicht einmal wir.' },
      { q: 'Brauche ich einen Account?', a: 'Ja — ein kostenloser Account hält deine Gebete über alle Geräte synchronisiert. Melde dich mit Google in einem Tap an oder nutze E-Mail/Passwort.' },
      { q: 'Wie funktioniert der Verssucher?', a: 'Du gibst das Thema deines Gebets ein und die App zeigt relevante Bibelverse mit vollständigem Text. Du wählst, was zu deiner Situation passt.' },
      { q: 'Welche Sprachen werden unterstützt?', a: '16 Sprachen: Französisch, Englisch, Deutsch, Portugiesisch, Chinesisch, Spanisch, Hindi, Japanisch, Swahili, Amharisch, Indonesisch, Tagalog, Koreanisch, Russisch, Arabisch und Persisch.' },
      { q: 'Ist es kostenlos?', a: 'Ja, völlig kostenlos. Die App ist Open Source.' },
    ],
    ctaTitle: 'Starte dein Gebetstagebuch heute',
    ctaSub: 'Kostenlos, privat und in 16 Sprachen verfügbar. Melde dich in Sekunden mit Google an.',
    ctaBtn: "Starte dein privates Gebetstagebuch",
    ctaVerse: '"Betet ohne Unterlass." — 1. Thessalonicher 5:17',
    footerBuilt: 'Mit Glauben gebaut · Open Source · MIT-Lizenz',
  },
  pt: {
    signIn: 'Entrar',
    badge: 'Seu companheiro de oração pessoal',
    h1a: 'Nunca esqueça uma oração.',
    h1b: 'Registre cada resposta.',
    subtitle: "Um diário de oração gratuito e privado: anote pedidos em segundos, veja o que orar hoje e guarde cada resposta.",
    cta: "Comece seu diário de oração privado",
    howItWorks: 'Ver como funciona',
    verse: '"A oração fervorosa do justo é poderosa e eficaz." — Tiago 5:16',
    featuresTitle: 'Tudo que sua vida de oração precisa',
    featuresSub: 'Criado para cristãos que querem orar com intenção e registrar a fidelidade de Deus.',
    features: [
      { icon: Users, color: '#0d9488', title: 'Orem juntos', desc: 'Participe de grupos e amigos, compartilhe pedidos (ou fique anônimo), orem uns pelos outros e celebrem as orações respondidas em comunidade.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'Diário de oração', desc: 'Registre cada pedido de oração — para você ou para outros. Adicione detalhes, acompanhe atualizações e nunca esqueça por quem prometeu orar.' },
      { icon: Calendar, color: '#059669', title: 'Agende suas orações', desc: 'Agende cada oração — única ou recorrente (diária, dias escolhidos, a cada N dias, mensal, anual), até "quando respondida". Calendário mensal, recuperação suave, correntes de oração em grupo e exportação .ics para Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galeria de orações respondidas', desc: 'Marque orações como respondidas e registre seu testemunho. Veja a fidelidade de Deus se acumular ao longo do tempo.' },
      { icon: Sprout, color: '#65a30d', title: 'Cresça na oração', desc: 'Uma biblioteca enraizada nas Escrituras: 12 guias de oração para orar (os Salmos, as promessas de Deus, pelos seus inimigos…) e leituras curtas sobre oração e vida cristã.' },
      { icon: Bell, color: '#ea580c', title: 'Lembretes de oração', desc: 'Uma notificação diária com os assuntos de oração do dia, além de lembretes suaves para acompanhar as pessoas por quem você ora — mesmo com o app fechado.' },
      { icon: Smartphone, color: '#4f46e5', title: 'Instale em qualquer lugar', desc: 'Um app completo para Android, iOS e desktop. Funciona offline — adicione e edite orações sem conexão; tudo sincroniza quando você voltar.' },
      { icon: Globe, color: '#db2777', title: '16 idiomas', desc: 'Interface completa em francês, inglês, alemão, português, chinês, espanhol, hindi, japonês, suaíli, amárico, indonésio, tagalo, coreano, russo, árabe e persa. Mude a qualquer momento.' },
      { icon: Lock, color: '#6d28d9', title: 'Privado & seguro', desc: 'Suas orações nunca saem da sua conta — somente você pode vê-las. Tranque orações privadas em um cofre criptografado de ponta a ponta que só a sua frase secreta abre.' },
    ],
    stepsTitle: 'Como funciona',
    stepsSub: "Da primeira oração a um registro crescente da fidelidade de Deus — em três passos simples.",
    steps: [
      { emoji: "✍️", title: "Anote uma oração", desc: "Escreva o que está no seu coração." },
      { emoji: "🙏", title: "Ore o que importa hoje", desc: "Abra o app e comece com um toque." },
      { emoji: "🎉", title: "Lembre a fidelidade de Deus", desc: "Registre respostas e testemunhos ao longo do tempo." },
    ],
    calloutBadge: 'Sugestões de versículos',
    calloutTitle: 'Encontre a Palavra certa para cada oração',
    calloutDesc: 'Não sabe como orar por uma situação? Use o buscador de versículos e receba 3–4 ângulos de oração, cada um com passagens bíblicas relevantes e seu texto completo.',
    calloutDisclaimer: 'As sugestões apresentam passagens bíblicas — você discerne o que fala à sua situação. O Espírito guia; esta ferramenta ajuda você a pesquisar as Escrituras.',
    calloutTry: 'Experimentar agora',
    calloutPreviewLabel: 'Sugestões de versículos',
    faqTitle: 'Perguntas',
    faqs: [
      { q: 'Meus dados são privados?', a: 'Sim. Cada oração é armazenada na sua própria conta com Row Level Security — ninguém mais pode ler seus dados, nem mesmo nós.' },
      { q: 'Preciso de uma conta?', a: 'Sim — uma conta gratuita mantém suas orações sincronizadas em todos os dispositivos. Cadastre-se com Google em um toque ou use email/senha.' },
      { q: 'Como funciona o buscador de versículos?', a: 'Você insere o tema da sua oração e o app apresenta versículos bíblicos relevantes com texto completo. Você escolhe os que ressoam com sua situação.' },
      { q: 'Quais idiomas são suportados?', a: '16 idiomas: francês, inglês, alemão, português, chinês, espanhol, hindi, japonês, suaíli, amárico, indonésio, tagalo, coreano, russo, árabe e persa.' },
      { q: 'É gratuito?', a: 'Sim, completamente gratuito. O app é open source.' },
    ],
    ctaTitle: 'Comece seu diário de oração hoje',
    ctaSub: 'Gratuito, privado e disponível em 16 idiomas. Cadastre-se em segundos com o Google.',
    ctaBtn: "Comece seu diário de oração privado",
    ctaVerse: '"Orai sem cessar." — 1 Tessalonicenses 5:17',
    footerBuilt: 'Feito com fé · Open source · Licença MIT',
  },

  ja: {
    signIn: 'ログイン',
    badge: 'あなたの個人的な祈りの伴侶',
    h1a: '祈りを忘れない。',
    h1b: 'すべての答えを記録する。',
    subtitle: "無料でプライベートな祈りの日記。数秒で祈りを書き留め、今日祈ることが分かり、すべての答えを覚えておけます。",
    cta: "プライベートな祈りの日記を始める",
    howItWorks: '使い方を見る',
    verse: '"義人の祈りは大いに力があり、効果があります。" — ヤコブ 5:16',
    featuresTitle: '祈りの生活に必要なすべて',
    featuresSub: '意図を持って祈り、神の誠実さを記録したいクリスチャンのために作られました。',
    features: [
      { icon: Users, color: '#0d9488', title: '共に祈る', desc: '祈りのグループや友達に参加し、リクエストを共有（匿名も可）し、互いのために祈り、答えられた祈りを共に喜びましょう。' },
      { icon: BookOpen, color: '#7c5cfc', title: '祈り日記', desc: '自分や他の人のための祈りをすべて記録。詳細を追加し、経過を追い、誰のために祈ると約束したかを忘れない。' },
      { icon: Calendar, color: '#059669', title: '祈りのスケジュール', desc: '各祈りをスケジュール — 一度きり、または繰り返し（毎日、選んだ曜日、N日ごと、毎月、毎年）、「答えられるまで」も可能。月間カレンダー、優しいキャッチアップ、グループの祈りチェーン、Google/Apple/Outlook向け.icsエクスポート。' },
      { icon: CheckCircle, color: '#0891b2', title: '答えられた祈りギャラリー', desc: '祈りを答えられたとして記録し、証しを残す。神の誠実さが時間とともに積み重なっていくのを見る。' },
      { icon: Sprout, color: '#65a30d', title: '祈りにおいて成長する', desc: '聖書に根ざしたライブラリ：祈り抜くための12の祈りのガイド（詩篇、神の約束、敵のための祈り…）と、祈りとクリスチャン生活についての短い読み物。' },
      { icon: Bell, color: '#ea580c', title: '祈りのリマインダー', desc: 'その日の祈りの課題を毎日通知でお知らせ。祈っている相手を気にかけるためのフォローアップ通知も — アプリを閉じていても届きます。' },
      { icon: Smartphone, color: '#4f46e5', title: 'どこでもインストール', desc: 'Android、iOS、デスクトップで使える本格的なアプリ。オフラインでも動作 — 接続なしで祈りを追加・編集でき、再接続時にすべて同期されます。' },
      { icon: Globe, color: '#db2777', title: '16言語', desc: 'フランス語、英語、ドイツ語、ポルトガル語、中国語、スペイン語、ヒンディー語、日本語、スワヒリ語、アムハラ語、インドネシア語、タガログ語、韓国語、ロシア語、アラビア語、ペルシア語に完全対応。' },
      { icon: Lock, color: '#6d28d9', title: 'プライベート＆安全', desc: 'あなたの祈りはアカウントの外に出ません。プライベートな祈りは、あなたのパスフレーズだけが開けるエンドツーエンド暗号化の保管庫に保存できます。' },
    ],
    stepsTitle: '使い方',
    stepsSub: "最初の祈りから、神の真実の記録が増えていくまで——3つの簡単なステップで。",
    steps: [
      { emoji: "✍️", title: "祈りを書き留める", desc: "心にあることを書きましょう。" },
      { emoji: "🙏", title: "今日大切なことを祈る", desc: "アプリを開いて、ワンタップで始めましょう。" },
      { emoji: "🎉", title: "神の真実を覚えておく", desc: "答えと証しを積み重ねて記録しましょう。" },
    ],
    calloutBadge: '聖句の提案',
    calloutTitle: 'すべての祈りに適した聖句を見つける',
    calloutDesc: 'ある状況のためにどう祈ればいいかわからない？聖句検索機能を使って、3〜4つの祈りの角度と関連する聖書の箇所を見つけてください。',
    calloutDisclaimer: '提案は聖書の箇所を提示します — あなたの状況に語りかけるものをあなたが識別します。御霊が導きます。このツールは聖書を探す手助けをします。',
    calloutTry: '今すぐ試す',
    calloutPreviewLabel: '聖句の提案',
    faqTitle: 'よくある質問',
    faqs: [
      { q: 'データはプライベートですか？', a: 'はい。すべての祈りは行レベルセキュリティによりあなた自身のアカウントに保存されます — 私たちを含め、誰もあなたのデータを見ることはできません。' },
      { q: 'アカウントが必要ですか？', a: 'はい — 無料アカウントがあれば、すべてのデバイスで祈りを同期できます。Googleでワンタップ登録するか、メール/パスワードを使用。' },
      { q: '聖句検索機能はどのように機能しますか？', a: '祈りのテーマを入力すると、アプリが関連する聖書の言葉とその全文を提案します。あなたの状況に響くものを選んでください。' },
      { q: 'どの言語がサポートされていますか？', a: '16言語に完全対応しています。' },
      { q: '無料ですか？', a: 'はい、完全無料です。このアプリはオープンソースです。' },
    ],
    ctaTitle: '今日から祈り日記を始めましょう',
    ctaSub: '無料、プライベート、16言語対応。Googleで数秒で登録できます。',
    ctaBtn: "プライベートな祈りの日記を始める",
    ctaVerse: '"絶えず祈りなさい。" — 1テサロニケ 5:17',
    footerBuilt: '信仰で作られた · オープンソース · MITライセンス',
  },

  sw: {
    signIn: 'Ingia',
    badge: 'Msaidizi wako wa kibinafsi wa maombi',
    h1a: 'Usisahau maombi yoyote.',
    h1b: 'Rekodi kila jibu.',
    subtitle: "Shajara ya maombi ya bure na ya faragha: andika maombi kwa sekunde, jua la kuombea leo, na kumbuka kila jibu.",
    cta: "Anza shajara yako ya maombi ya faragha",
    howItWorks: 'Angalia jinsi inavyofanya kazi',
    verse: '"Maombi ya mtu mwenye haki yana nguvu nyingi." — Yakobo 5:16',
    featuresTitle: 'Kila kitu maisha yako ya maombi yanahitaji',
    featuresSub: 'Imeundwa kwa Wakristo wanaotaka kuomba kwa makusudi na kufuatilia uaminifu wa Mungu.',
    features: [
      { icon: Users, color: '#0d9488', title: 'Ombeni pamoja', desc: 'Jiunge na vikundi na marafiki, shiriki maombi (au baki bila kujulikana), ombeaneni, na shangilieni maombi yaliyojibiwa pamoja.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'Jarida la maombi', desc: 'Rekodi kila ombi — kwa ajili yako au wengine. Ongeza maelezo, fuatilia maendeleo, usisahau uliyomwahidi kuomba.' },
      { icon: Calendar, color: '#059669', title: 'Ratiba ya maombi', desc: 'Panga kila ombi — mara moja au kwa kujirudia (kila siku, siku ulizochagua, kila siku N, kila mwezi, kila mwaka), hata "hadi lijibiwe". Kalenda ya mwezi, minyororo ya maombi ya kikundi, na hamishi .ics kwa Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galeria ya maombi yaliyojibiwa', desc: 'Weka alama maombi kama yaliyojibiwa na rekodi ushuhuda wako. Angalia uaminifu wa Mungu ukikusanyika baada ya muda.' },
      { icon: Sprout, color: '#65a30d', title: 'Kua katika maombi', desc: 'Maktaba iliyojikita katika Maandiko: miongozo 12 ya maombi ya kuomba (Zaburi, ahadi za Mungu, kwa ajili ya adui…) na masomo mafupi kuhusu maombi na maisha ya Kikristo.' },
      { icon: Bell, color: '#ea580c', title: 'Vikumbusho vya maombi', desc: 'Arifa ya kila siku yenye maombi ya leo, na vikumbusho vya kufuatilia wale unaowaombea — hata app ikiwa imefungwa.' },
      { icon: Smartphone, color: '#4f46e5', title: 'Sakinisha popote', desc: 'App kamili kwa Android, iOS na kompyuta. Inafanya kazi bila mtandao — kila kitu kinasawazishwa unaporudi mtandaoni.' },
      { icon: Globe, color: '#db2777', title: 'Lugha 16', desc: 'Kiswahili, Kiingereza, Kifaransa, na lugha nyingine 13. Badilisha wakati wowote.' },
      { icon: Lock, color: '#6d28d9', title: 'Ya siri na salama', desc: 'Maombi yako hayatoki kamwe katika akaunti yako. Funga maombi yako ya faragha katika sanduku lililosimbwa kutoka mwanzo hadi mwisho ambalo neno lako la siri pekee linaweza kulifungua.' },
    ],
    stepsTitle: 'Jinsi inavyofanya kazi',
    stepsSub: "Kutoka ombi la kwanza hadi kumbukumbu inayokua ya uaminifu wa Mungu — katika hatua tatu rahisi.",
    steps: [
      { emoji: "✍️", title: "Andika ombi", desc: "Andika kilicho moyoni mwako." },
      { emoji: "🙏", title: "Omba yaliyo muhimu leo", desc: "Fungua programu na uanze kwa mguso mmoja." },
      { emoji: "🎉", title: "Kumbuka uaminifu wa Mungu", desc: "Andika majibu na shuhuda kadiri muda unavyopita." },
    ],
    calloutBadge: 'Mapendekezo ya mistari',
    calloutTitle: 'Pata mstari unaofaa kwa kila ombi',
    calloutDesc: 'Hujui jinsi ya kuomba kwa hali fulani? Tumia kitafuta cha mistari na upate pembe 3-4 za maombi, kila moja na vifungu vya Biblia vinavyohusiana.',
    calloutDisclaimer: 'Mapendekezo yanawasilisha vifungu vya Biblia — wewe unatambua kinachosema kwa hali yako. Roho anaongoza; chombo hiki kinakusaidia kutafuta Maandiko.',
    calloutTry: 'Jaribu sasa',
    calloutPreviewLabel: 'Mapendekezo ya mistari',
    faqTitle: 'Maswali',
    faqs: [
      { q: 'Je, data yangu ni ya siri?', a: 'Ndiyo. Kila ombi linahifadhiwa katika akaunti yako mwenyewe — hakuna mtu mwingine anayeweza kuona data yako, hata sisi.' },
      { q: 'Je, ninahitaji akaunti?', a: 'Ndiyo — akaunti ya bure inasawazisha maombi yako kwenye vifaa vyote. Jisajili na Google kwa kugonga mara moja au tumia barua pepe/neno la siri.' },
      { q: 'Je, ni bure?', a: 'Ndiyo, bure kabisa. Programu hii ni chanzo wazi.' },
    ],
    ctaTitle: 'Anza jarida lako la maombi leo',
    ctaSub: 'Bure, ya siri, na inapatikana katika lugha 16. Jisajili kwa sekunde chache na Google.',
    ctaBtn: "Anza shajara yako ya maombi ya faragha",
    ctaVerse: '"Ombeni bila kukoma." — 1 Wathesalonike 5:17',
    footerBuilt: 'Imejengwa kwa imani · Chanzo wazi · Leseni ya MIT',
  },

  am: {
    signIn: 'ግባ',
    badge: 'የእርስዎ የጸሎት ጓደኛ',
    h1a: 'ምንም ጸሎት አይርሱ።',
    h1b: 'እያንዳንዱ መልስ ይዝግቡ።',
    subtitle: "ነጻ እና የግል የጸሎት ማስታወሻ፦ ጸሎቶችን በሰከንዶች ያስፍሩ፣ ዛሬ ምን እንደሚጸልዩ ይወቁ፣ እያንዳንዱን መልስ ያስታውሱ።",
    cta: "የግል የጸሎት ማስታወሻዎን ይጀምሩ",
    howItWorks: 'እንዴት እንደሚሰራ ይመልከቱ',
    verse: '"የጻድቅ ሰው ጸሎት ብዙ ያደርጋል።" — ያዕቆብ 5:16',
    featuresTitle: 'የጸሎት ሕይወትዎ የሚያስፈልገው ሁሉ',
    featuresSub: 'ዓላማ ይዘው ለሚጸልዩ እና የእግዚአብሔርን ታማኝነት ለሚከታተሉ ክርስቲያኖች የተዘጋጀ።',
    features: [
      { icon: Users, color: '#0d9488', title: 'በጋራ ይጸልዩ', desc: 'የጸሎት ቡድኖችንና ጓደኞችን ይቀላቀሉ፣ ጥያቄዎችን ያጋሩ (ወይም ሳይታወቁ ይቆዩ)፣ እርስ በርስ ይጸልዩ፣ የተመለሱ ጸሎቶችንም በአንድነት ያክብሩ።' },
      { icon: BookOpen, color: '#7c5cfc', title: 'የጸሎት ዕለታዊ ጆርናል', desc: 'ለራስዎ ወይም ለሌሎች የሚደረጉ ጸሎቶችን ሁሉ ይዝግቡ። ዝርዝሮችን ያክሉ፣ ሂደቱን ይከታተሉ።' },
      { icon: Calendar, color: '#059669', title: 'የጸሎት መርሐ ግብር', desc: 'እያንዳንዱን ጸሎት ያቀናብሩ — አንዴ ወይም በተደጋጋሚ (በየቀኑ፣ በተመረጡ ቀናት፣ በየN ቀኑ፣ በየወሩ፣ በየዓመቱ)፣ "እስኪመለስ ድረስ" ጭምር። የወር ቀን መቁጠሪያ፣ የቡድን የጸሎት ሰንሰለቶች እና ወደ Google/Apple/Outlook .ics ወጪ።' },
      { icon: CheckCircle, color: '#0891b2', title: 'የተመለሱ ጸሎቶች ማሳያ', desc: 'ጸሎቶችን እንደ ተመለሱ ምልክት አድርጉ እና ምስክርነትዎን ይዝግቡ። የእግዚአብሔር ታማኝነት ከጊዜ ወደ ጊዜ ሲሰበሰብ ይመልከቱ።' },
      { icon: Sprout, color: '#65a30d', title: 'በጸሎት ያድጉ', desc: 'በቅዱሳት መጻሕፍት ላይ የተመሠረተ ቤተ-መጻሕፍት፦ 12 የጸሎት መመሪያዎች (መዝሙራት፣ የእግዚአብሔር ተስፋዎች፣ ለጠላቶች…) እና ስለ ጸሎትና ክርስቲያናዊ ሕይወት አጫጭር ንባቦች።' },
      { icon: Bell, color: '#ea580c', title: 'የጸሎት ማስታወሻዎች', desc: 'የቀኑን የጸሎት ርዕሶች የያዘ ዕለታዊ ማሳወቂያ፣ እንዲሁም ለምትጸልዩላቸው ሰዎች ደህንነት ለመጠየቅ የክትትል ማስታወሻዎች — መተግበሪያው ተዘግቶም ቢሆን።' },
      { icon: Smartphone, color: '#4f46e5', title: 'በየትም ይጫኑ', desc: 'ለ Android፣ iOS እና ዴስክቶፕ ሙሉ መተግበሪያ። ያለ ኢንተርኔት ይሰራል — መስመር ላይ ሲመለሱ ሁሉም ነገር ይመሳሰላል።' },
      { icon: Globe, color: '#db2777', title: '16 ቋንቋዎች', desc: 'አማርኛ፣ እንግሊዝኛ፣ ፈረንሳይኛ እና ሌሎች 13 ቋንቋዎች። በማንኛውም ጊዜ ይቀይሩ።' },
      { icon: Lock, color: '#6d28d9', title: 'የግል እና ደህንነቱ የተጠበቀ', desc: 'ጸሎቶችዎ ከመለያዎ ፈጽሞ አይወጡም። የግል ጸሎቶችዎን በሚስጥር ሐረግዎ ብቻ በሚከፈት ከጫፍ እስከ ጫፍ በተመሰጠረ ካዝና ውስጥ ይቆልፉ።' },
    ],
    stepsTitle: 'እንዴት እንደሚሰራ',
    stepsSub: "ከመጀመሪያ ጸሎት እስከ የእግዚአብሔር ታማኝነት እያደገ የሚሄድ መዝገብ — በሦስት ቀላል ደረጃዎች።",
    steps: [
      { emoji: "✍️", title: "ጸሎት ያስፍሩ", desc: "በልብዎ ያለውን ይጻፉ።" },
      { emoji: "🙏", title: "ዛሬ የሚያስፈልገውን ይጸልዩ", desc: "መተግበሪያውን ከፍተው በአንድ ንክኪ ይጀምሩ።" },
      { emoji: "🎉", title: "የእግዚአብሔርን ታማኝነት ያስታውሱ", desc: "መልሶችን እና ምስክርነቶችን በጊዜ ሂደት ይመዝግቡ።" },
    ],
    calloutBadge: 'የቁጥር ምክሮች',
    calloutTitle: 'ለእያንዳንዱ ጸሎት ትክክለኛ ቁጥር ያግኙ',
    calloutDesc: 'ለአንድ ሁኔታ እንዴት ማዳለጽ እንደሚቻል አያውቁም? ቁጥር ፈላጊውን ይጠቀሙ።',
    calloutDisclaimer: 'ምክሮቹ የቅዱሳት ቃሎች ክፍሎችን ያቀርባሉ — ለሁኔታዎ የሚናገረውን እርስዎ ይለዩ። ቅዱስ ነፍስ ይመራል።',
    calloutTry: 'አሁን ይሞክሩ',
    calloutPreviewLabel: 'የቁጥር ምክሮች',
    faqTitle: 'ጥያቄዎች',
    faqs: [
      { q: 'ውሂቤ የግል ነው?', a: 'አዎ። እያንዳንዱ ጸሎት በቁጥር-ደረጃ ደህንነት ባለው የእርስዎ ብቻ መለያ ተቀምጧል።' },
      { q: 'መለያ ያስፈልጋል?', a: 'አዎ — ነፃ መለያ ጸሎቶችዎን በሁሉም መሳሪያዎች ያስተባብራል። በ Google አንድ ጫን ወይም ኢሜይል/የምስጢር ቃል ይጠቀሙ።' },
      { q: 'ነፃ ነው?', a: 'አዎ፣ ሙሉ በሙሉ ነፃ ነው። ፕሮግራሙ ክፍት ምንጭ ነው።' },
    ],
    ctaTitle: 'ዛሬ የጸሎት ዕለታዊ ጆርናልዎን ይጀምሩ',
    ctaSub: 'ነፃ፣ የግል፣ እና በ16 ቋንቋዎች ይገኛል። በ Google ጥቂት ሴኮንዶች ውስጥ ይመዝገቡ።',
    ctaBtn: "የግል የጸሎት ማስታወሻዎን ይጀምሩ",
    ctaVerse: '"ሳታቋርጡ ጸልዩ።" — 1ኛ ተሰሎንቄ 5:17',
    footerBuilt: 'በእምነት ተሠርቷል · ክፍት ምንጭ · MIT ፍቃድ',
  },

  id: {
    signIn: 'Masuk',
    badge: 'Teman doa pribadi Anda',
    h1a: 'Jangan pernah lupa berdoa.',
    h1b: 'Catat setiap jawaban.',
    subtitle: "Jurnal doa gratis dan pribadi: catat permohonan dalam hitungan detik, tahu apa yang didoakan hari ini, dan ingat setiap jawaban.",
    cta: "Mulai jurnal doa pribadi Anda",
    howItWorks: 'Lihat cara kerjanya',
    verse: '"Doa orang yang benar, bila dengan yakin didoakan, sangat besar kuasanya." — Yakobus 5:16',
    featuresTitle: 'Semua yang dibutuhkan kehidupan doa Anda',
    featuresSub: 'Dirancang untuk orang Kristen yang ingin berdoa dengan niat dan melacak kesetiaan Tuhan.',
    features: [
      { icon: Users, color: '#0d9488', title: 'Berdoa bersama', desc: 'Bergabunglah dengan grup dan teman, bagikan permohonan (atau tetap anonim), saling mendoakan, dan rayakan doa yang dijawab bersama.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'Jurnal doa', desc: 'Catat setiap permohonan doa — untuk diri sendiri atau orang lain. Tambahkan detail, pantau perkembangan, dan jangan lupakan siapa yang Anda janjikan untuk doakan.' },
      { icon: Calendar, color: '#059669', title: 'Jadwal doa', desc: 'Jadwalkan setiap doa — sekali atau berulang (harian, hari pilihan, setiap N hari, bulanan, tahunan), bahkan "sampai dijawab". Kalender bulanan, rantai doa grup, dan ekspor .ics ke Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galeri doa terjawab', desc: 'Tandai doa sebagai terjawab dan catat kesaksian Anda. Saksikan kesetiaan Tuhan bertambah dari waktu ke waktu.' },
      { icon: Sprout, color: '#65a30d', title: 'Bertumbuh dalam doa', desc: 'Perpustakaan yang berakar pada Alkitab: 12 panduan doa untuk didoakan (Mazmur, janji-janji Tuhan, bagi musuh…) dan bacaan singkat tentang doa dan kehidupan Kristen.' },
      { icon: Bell, color: '#ea580c', title: 'Pengingat doa', desc: 'Notifikasi harian berisi pokok doa hari ini, plus pengingat tindak lanjut untuk menanyakan kabar orang yang Anda doakan — bahkan saat aplikasi ditutup.' },
      { icon: Smartphone, color: '#4f46e5', title: 'Pasang di mana saja', desc: 'Aplikasi lengkap untuk Android, iOS, dan desktop. Berfungsi offline — semuanya tersinkron saat Anda kembali online.' },
      { icon: Globe, color: '#db2777', title: '16 bahasa', desc: 'Bahasa Indonesia, Inggris, Prancis, dan 13 bahasa lainnya. Ganti kapan saja.' },
      { icon: Lock, color: '#6d28d9', title: 'Pribadi & aman', desc: 'Doa Anda tidak pernah keluar dari akun Anda. Kunci doa pribadi Anda dalam brankas terenkripsi ujung-ke-ujung yang hanya bisa dibuka dengan frasa sandi Anda.' },
    ],
    stepsTitle: 'Cara kerjanya',
    stepsSub: "Dari doa pertama hingga catatan kesetiaan Tuhan yang terus bertumbuh — dalam tiga langkah mudah.",
    steps: [
      { emoji: "✍️", title: "Catat sebuah doa", desc: "Tulis apa yang ada di hati Anda." },
      { emoji: "🙏", title: "Doakan yang penting hari ini", desc: "Buka aplikasi dan mulai dengan satu ketukan." },
      { emoji: "🎉", title: "Ingat kesetiaan Tuhan", desc: "Catat jawaban dan kesaksian dari waktu ke waktu." },
    ],
    calloutBadge: 'Saran ayat',
    calloutTitle: 'Temukan ayat yang tepat untuk setiap doa',
    calloutDesc: 'Tidak tahu cara berdoa untuk suatu situasi? Gunakan pencari ayat dan dapatkan 3-4 sudut pandang doa dengan bagian Alkitab yang relevan.',
    calloutDisclaimer: 'Saran menyajikan bagian Alkitab — Anda yang mendiskernmen apa yang berbicara pada situasi Anda. Roh yang memimpin.',
    calloutTry: 'Coba sekarang',
    calloutPreviewLabel: 'Saran ayat',
    faqTitle: 'Pertanyaan',
    faqs: [
      { q: 'Apakah data saya pribadi?', a: 'Ya. Setiap doa disimpan di akun Anda sendiri dengan keamanan tingkat baris — tidak ada yang bisa melihat data Anda, termasuk kami.' },
      { q: 'Apakah perlu akun?', a: 'Ya — akun gratis menyinkronkan doa Anda di semua perangkat. Daftar dengan Google dalam satu ketukan.' },
      { q: 'Apakah gratis?', a: 'Ya, sepenuhnya gratis. Aplikasi ini adalah open source.' },
    ],
    ctaTitle: 'Mulai jurnal doa Anda hari ini',
    ctaSub: 'Gratis, pribadi, dan tersedia dalam 16 bahasa. Daftar dalam hitungan detik dengan Google.',
    ctaBtn: "Mulai jurnal doa pribadi Anda",
    ctaVerse: '"Berdoalah tanpa henti." — 1 Tesalonika 5:17',
    footerBuilt: 'Dibangun dengan iman · Open source · Lisensi MIT',
  },

  tl: {
    signIn: 'Mag-sign in',
    badge: 'Ang iyong personal na kasama sa panalangin',
    h1a: 'Huwag kalimutang manalangin.',
    h1b: 'Itala ang bawat sagot.',
    subtitle: "Isang libre at pribadong prayer journal: itala ang mga panalangin sa ilang segundo, alamin ang ipapanalangin ngayon, at tandaan ang bawat sagot.",
    cta: "Simulan ang iyong pribadong prayer journal",
    howItWorks: 'Tingnan kung paano gumagana',
    verse: '"Ang taimtim na panalangin ng taong matuwid ay may malaking kapangyarihan." — Santiago 5:16',
    featuresTitle: 'Lahat ng kailangan ng iyong buhay-panalangin',
    featuresSub: 'Ginawa para sa mga Kristiyano na gustong manalangin nang may layunin at subaybayan ang katapatan ng Diyos.',
    features: [
      { icon: Users, color: '#0d9488', title: 'Magdasal nang sama-sama', desc: 'Sumali sa mga grupo at kaibigan, magbahagi ng kahilingan (o manatiling anonimo), magdasal para sa isa\'t isa, at ipagdiwang ang mga sinagot na panalangin bilang komunidad.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'Talaarawan ng panalangin', desc: 'Itala ang bawat kahilingan sa panalangin — para sa iyong sarili o para sa iba. Magdagdag ng mga detalye at huwag kalimutang sino ang ipinangako mong ipanalangin.' },
      { icon: Calendar, color: '#059669', title: 'Pag-iskedyul ng panalangin', desc: 'I-iskedyul ang bawat panalangin — isang beses o paulit-ulit (araw-araw, piniling araw, bawat N araw, buwanan, taunan), kahit "hanggang masagot". Buwanang kalendaryo, mga prayer chain ng grupo, at .ics export sa Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galeriya ng nasagot na panalangin', desc: 'Markahan ang mga panalangin bilang nasagot at itala ang iyong patotoo. Panoorin ang katapatan ng Diyos na mag-ipon sa paglipas ng panahon.' },
      { icon: Sprout, color: '#65a30d', title: 'Lumago sa panalangin', desc: 'Isang aklatan na nakaugat sa Kasulatan: 12 gabay sa panalangin (ang Mga Awit, mga pangako ng Diyos, para sa mga kaaway…) at maiikling babasahin tungkol sa panalangin at buhay Kristiyano.' },
      { icon: Bell, color: '#ea580c', title: 'Mga paalala sa panalangin', desc: 'Araw-araw na notification ng mga panalangin ngayong araw, at banayad na follow-up para kamustahin ang mga ipinapanalangin mo — kahit nakasara ang app.' },
      { icon: Smartphone, color: '#4f46e5', title: 'I-install kahit saan', desc: 'Kumpletong app para sa Android, iOS, at desktop. Gumagana offline — nagsi-sync ang lahat pagbalik mo online.' },
      { icon: Globe, color: '#db2777', title: '16 na wika', desc: 'Tagalog, Ingles, Pranses, at 13 pang wika. Palitan anumang oras.' },
      { icon: Lock, color: '#6d28d9', title: 'Pribado at ligtas', desc: 'Ang iyong mga panalangin ay hindi lumalabas sa iyong account. I-lock ang iyong mga pribadong panalangin sa isang end-to-end encrypted na vault na tanging ang iyong passphrase lang ang makakapagbukas.' },
    ],
    stepsTitle: 'Paano gumagana',
    stepsSub: "Mula sa unang panalangin hanggang sa lumalagong talaan ng katapatan ng Diyos — sa tatlong simpleng hakbang.",
    steps: [
      { emoji: "✍️", title: "Itala ang isang panalangin", desc: "Isulat ang nasa puso mo." },
      { emoji: "🙏", title: "Ipanalangin ang mahalaga ngayon", desc: "Buksan ang app at magsimula sa isang tap." },
      { emoji: "🎉", title: "Tandaan ang katapatan ng Diyos", desc: "Itala ang mga sagot at patotoo sa paglipas ng panahon." },
    ],
    calloutBadge: 'Mga mungkahing talata',
    calloutTitle: 'Hanapin ang tamang talata para sa bawat panalangin',
    calloutDesc: 'Hindi mo alam kung paano ipanalangin ang isang sitwasyon? Gamitin ang tagahanap ng talata at makakuha ng 3-4 anggulo ng panalangin.',
    calloutDisclaimer: 'Ang mga mungkahi ay nagpapakita ng mga talata ng Bibliya — ikaw ang magdidiskern kung ano ang nagsasalita sa iyong sitwasyon. Ang Espiritu ang nangunguna.',
    calloutTry: 'Subukan ngayon',
    calloutPreviewLabel: 'Mga mungkahing talata',
    faqTitle: 'Mga tanong',
    faqs: [
      { q: 'Pribado ba ang aking data?', a: 'Oo. Ang bawat panalangin ay nakaimbak sa iyong sariling account — walang ibang makakakita ng iyong data, kabilang kami.' },
      { q: 'Kailangan ko ba ng account?', a: 'Oo — ang libreng account ay nag-sync ng iyong mga panalangin sa lahat ng device. Mag-sign up gamit ang Google sa isang tap.' },
      { q: 'Libre ba?', a: 'Oo, ganap na libre. Ang app na ito ay open source.' },
    ],
    ctaTitle: 'Simulan ang iyong talaarawan ng panalangin ngayon',
    ctaSub: 'Libre, pribado, at makukuha sa 16 na wika. Mag-sign up sa loob ng ilang segundo gamit ang Google.',
    ctaBtn: "Simulan ang iyong pribadong prayer journal",
    ctaVerse: '"Manalangin kayo nang walang humpay." — 1 Tesalonica 5:17',
    footerBuilt: 'Itinayo nang may pananampalataya · Open source · MIT License',
  },

  ko: {
    signIn: '로그인',
    badge: '나만의 기도 동반자',
    h1a: '기도를 절대 잊지 마세요.',
    h1b: '모든 응답을 기록하세요.',
    subtitle: "무료 비공개 기도 일기: 몇 초 만에 기도를 기록하고, 오늘 무엇을 기도할지 알고, 모든 응답을 기억하세요.",
    cta: "나만의 기도 일기 시작하기",
    howItWorks: '어떻게 작동하는지 보기',
    verse: '"의인의 간구는 역사하는 힘이 큼이니라." — 야고보서 5:16',
    featuresTitle: '기도 생활에 필요한 모든 것',
    featuresSub: '의도적으로 기도하고 하나님의 신실하심을 기록하고 싶은 그리스도인을 위해 만들어졌습니다.',
    features: [
      { icon: Users, color: '#0d9488', title: '함께 기도하세요', desc: '기도 그룹과 친구에 참여하고, 기도 제목을 나누거나 익명으로 유지하며, 서로를 위해 기도하고, 응답된 기도를 함께 축하하세요.' },
      { icon: BookOpen, color: '#7c5cfc', title: '기도 일기', desc: '나 자신과 다른 사람을 위한 모든 기도 요청을 기록하세요. 세부 내용을 추가하고, 경과를 추적하고, 기도하겠다고 약속한 사람을 잊지 마세요.' },
      { icon: Calendar, color: '#059669', title: '기도 일정', desc: '모든 기도를 예약하세요 — 한 번 또는 반복(매일, 선택한 요일, N일마다, 매월, 매년), "응답받을 때까지"도 가능. 월간 캘린더, 그룹 기도 사슬, Google/Apple/Outlook용 .ics 내보내기.' },
      { icon: CheckCircle, color: '#0891b2', title: '응답된 기도 갤러리', desc: '기도를 응답됨으로 표시하고 간증을 기록하세요. 시간이 지남에 따라 하나님의 신실하심이 쌓이는 것을 보세요.' },
      { icon: Sprout, color: '#65a30d', title: '기도 안에서 성장하세요', desc: '성경에 뿌리내린 자료실: 기도할 수 있는 12가지 기도 가이드(시편, 하나님의 약속, 원수를 위한 기도…)와 기도와 신앙 생활에 관한 짧은 글들.' },
      { icon: Bell, color: '#ea580c', title: '기도 알림', desc: '오늘의 기도 제목을 담은 매일 알림과, 기도하고 있는 사람들의 안부를 묻도록 돕는 부드러운 후속 알림 — 앱이 닫혀 있어도 도착합니다.' },
      { icon: Smartphone, color: '#4f46e5', title: '어디서나 설치하세요', desc: 'Android, iOS, 데스크톱용 완전한 앱. 오프라인에서도 작동 — 다시 연결되면 모든 것이 동기화됩니다.' },
      { icon: Globe, color: '#db2777', title: '16개 언어', desc: '한국어, 영어, 프랑스어 등 16개 언어를 완벽 지원합니다. 언제든지 전환하세요.' },
      { icon: Lock, color: '#6d28d9', title: '비공개 및 안전', desc: '당신의 기도는 계정 밖으로 나가지 않습니다. 비공개 기도는 오직 당신의 암호문구로만 열 수 있는 종단 간 암호화된 금고에 잠글 수 있습니다.' },
    ],
    stepsTitle: '작동 방법',
    stepsSub: "첫 기도부터 자라나는 하나님의 신실하심의 기록까지 — 세 가지 간단한 단계로.",
    steps: [
      { emoji: "✍️", title: "기도를 기록하세요", desc: "마음에 있는 것을 적어 보세요." },
      { emoji: "🙏", title: "오늘 중요한 것을 기도하세요", desc: "앱을 열고 한 번의 탭으로 시작하세요." },
      { emoji: "🎉", title: "하나님의 신실하심을 기억하세요", desc: "시간이 지나며 응답과 간증을 기록하세요." },
    ],
    calloutBadge: '구절 제안',
    calloutTitle: '모든 기도에 맞는 구절을 찾으세요',
    calloutDesc: '어떤 상황을 위해 어떻게 기도해야 할지 모르겠나요? 구절 검색기를 사용하여 3-4가지 기도 각도와 관련 성경 구절을 찾아보세요.',
    calloutDisclaimer: '제안들은 성경 구절을 제시합니다 — 당신의 상황에 말씀하는 것을 당신이 분별하세요. 성령이 인도합니다.',
    calloutTry: '지금 시도해보기',
    calloutPreviewLabel: '구절 제안',
    faqTitle: '자주 묻는 질문',
    faqs: [
      { q: '내 데이터는 비공개인가요?', a: '네. 모든 기도는 행 수준 보안으로 당신 자신의 계정에 저장됩니다 — 우리를 포함하여 아무도 당신의 데이터를 볼 수 없습니다.' },
      { q: '계정이 필요한가요?', a: '네 — 무료 계정이 있으면 모든 기기에서 기도가 동기화됩니다. Google로 한 번 탭하여 가입하거나 이메일/비밀번호를 사용하세요.' },
      { q: '무료인가요?', a: '네, 완전히 무료입니다. 이 앱은 오픈 소스입니다.' },
    ],
    ctaTitle: '오늘 기도 일기를 시작하세요',
    ctaSub: '무료, 비공개, 16개 언어로 제공됩니다. Google로 몇 초 만에 가입하세요.',
    ctaBtn: "나만의 기도 일기 시작하기",
    ctaVerse: '"쉬지 말고 기도하라." — 데살로니가전서 5:17',
    footerBuilt: '믿음으로 만들어짐 · 오픈 소스 · MIT 라이선스',
  },

  ru: {
    signIn: 'Войти',
    badge: 'Ваш личный молитвенный помощник',
    h1a: 'Никогда не забывайте молитву.',
    h1b: 'Записывайте каждый ответ.',
    subtitle: "Бесплатный личный молитвенный дневник: записывайте просьбы за секунды, знайте, о чём молиться сегодня, и помните каждый ответ.",
    cta: "Начните свой личный молитвенный дневник",
    howItWorks: 'Посмотреть, как работает',
    verse: '"Много может усиленная молитва праведного." — Иакова 5:16',
    featuresTitle: 'Всё для вашей молитвенной жизни',
    featuresSub: 'Создано для христиан, которые хотят молиться осознанно и отслеживать верность Бога.',
    features: [
      { icon: Users, color: '#0d9488', title: 'Молитесь вместе', desc: 'Присоединяйтесь к группам и друзьям, делитесь просьбами (или оставайтесь анонимными), молитесь друг за друга и празднуйте отвеченные молитвы вместе.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'Молитвенный журнал', desc: 'Записывайте каждую молитвенную просьбу — за себя или за других. Добавляйте детали, отслеживайте изменения, не забывайте, за кого обещали молиться.' },
      { icon: Calendar, color: '#059669', title: 'Расписание молитв', desc: 'Планируйте каждую молитву — разово или регулярно (ежедневно, в выбранные дни, каждые N дней, ежемесячно, ежегодно), даже «пока не будет ответа». Месячный календарь, групповые молитвенные цепочки и экспорт .ics в Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Галерея отвеченных молитв', desc: 'Отмечайте молитвы как отвеченные и записывайте свидетельство. Наблюдайте, как верность Бога накапливается со временем.' },
      { icon: Sprout, color: '#65a30d', title: 'Растите в молитве', desc: 'Библиотека, укоренённая в Писании: 12 молитвенных руководств (Псалмы, обетования Бога, молитва за врагов…) и короткие чтения о молитве и христианской жизни.' },
      { icon: Bell, color: '#ea580c', title: 'Напоминания о молитве', desc: 'Ежедневное уведомление с молитвенными темами дня и мягкие напоминания узнать, как дела у тех, за кого вы молитесь — даже когда приложение закрыто.' },
      { icon: Smartphone, color: '#4f46e5', title: 'Установите где угодно', desc: 'Полноценное приложение для Android, iOS и компьютера. Работает офлайн — всё синхронизируется, когда вы снова в сети.' },
      { icon: Globe, color: '#db2777', title: '16 языков', desc: 'Русский, английский, французский и ещё 13 языков. Меняйте в любой момент.' },
      { icon: Lock, color: '#6d28d9', title: 'Приватно и безопасно', desc: 'Ваши молитвы никогда не покидают ваш аккаунт. Заприте личные молитвы в сквозном зашифрованном хранилище, которое открывается только вашей секретной фразой.' },
    ],
    stepsTitle: 'Как это работает',
    stepsSub: "От первой молитвы до растущей летописи Божьей верности — в три простых шага.",
    steps: [
      { emoji: "✍️", title: "Запишите молитву", desc: "Напишите то, что у вас на сердце." },
      { emoji: "🙏", title: "Молитесь о главном сегодня", desc: "Откройте приложение и начните одним касанием." },
      { emoji: "🎉", title: "Помните Божью верность", desc: "Записывайте ответы и свидетельства со временем." },
    ],
    calloutBadge: 'Предложения стихов',
    calloutTitle: 'Найдите нужный стих для каждой молитвы',
    calloutDesc: 'Не знаете, как молиться о ситуации? Используйте поиск стихов и получите 3-4 угла молитвы с соответствующими библейскими отрывками.',
    calloutDisclaimer: 'Предложения представляют библейские отрывки — вы различаете, что говорит вашей ситуации. Дух ведёт; этот инструмент помогает искать Писание.',
    calloutTry: 'Попробовать сейчас',
    calloutPreviewLabel: 'Предложения стихов',
    faqTitle: 'Вопросы',
    faqs: [
      { q: 'Мои данные приватны?', a: 'Да. Каждая молитва хранится в вашем личном аккаунте с защитой на уровне строк — никто не может видеть ваши данные, включая нас.' },
      { q: 'Нужен ли аккаунт?', a: 'Да — бесплатный аккаунт синхронизирует ваши молитвы на всех устройствах. Зарегистрируйтесь через Google одним нажатием.' },
      { q: 'Это бесплатно?', a: 'Да, полностью бесплатно. Приложение с открытым исходным кодом.' },
    ],
    ctaTitle: 'Начните молитвенный журнал сегодня',
    ctaSub: 'Бесплатно, приватно и доступно на 16 языках. Зарегистрируйтесь за считанные секунды через Google.',
    ctaBtn: "Начните свой личный молитвенный дневник",
    ctaVerse: '"Непрестанно молитесь." — 1 Фессалоникийцам 5:17',
    footerBuilt: 'Создано с верой · Открытый исходный код · Лицензия MIT',
  },

  ar: {
    signIn: 'تسجيل الدخول',
    badge: 'رفيقك الشخصي في الصلاة',
    h1a: 'لا تنسَ أي صلاة.',
    h1b: 'سجّل كل إجابة.',
    subtitle: "دفتر صلاة مجاني وخاص: دوّن الطلبات في ثوانٍ، واعرف بماذا تصلّي اليوم، واحفظ كل استجابة.",
    cta: "ابدأ دفتر صلاتك الخاص",
    howItWorks: 'اطلع على طريقة العمل',
    verse: '"صلاة البار تقتدر كثيراً في فعلها." — يعقوب 5:16',
    featuresTitle: 'كل ما يحتاجه حياتك الصلاتية',
    featuresSub: 'صُمِّم للمسيحيين الذين يريدون الصلاة بنية وتتبع أمانة الله.',
    features: [
      { icon: Users, color: '#0d9488', title: 'صلّوا معًا', desc: 'انضم إلى مجموعات وأصدقاء، شارك الطلبات (أو ابقَ مجهولاً)، وصلّوا بعضكم لبعض، واحتفلوا بالصلوات المستجابة كمجتمع.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'مجلة الصلاة', desc: 'سجّل كل طلب صلاة — من أجلك أو من أجل الآخرين. أضف تفاصيل وتابع التحديثات ولا تنسَ من وعدت بالصلاة عنه.' },
      { icon: Calendar, color: '#059669', title: 'جدولة الصلاة', desc: 'جدول كل صلاة — مرة واحدة أو متكررة (يوميًا، أيام مختارة، كل N يوم، شهريًا، سنويًا)، حتى "إلى أن يُستجاب لها". تقويم شهري، وسلاسل صلاة جماعية، وتصدير .ics إلى Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'غاليري الصلوات المستجابة', desc: 'علّم الصلوات كمستجابة وسجّل شهادتك. شاهد أمانة الله تتراكم عبر الزمن.' },
      { icon: Sprout, color: '#65a30d', title: 'انمُ في الصلاة', desc: 'مكتبة متجذرة في الكتاب المقدس: 12 دليل صلاة للصلاة بها (المزامير، وعود الله، من أجل الأعداء…) وقراءات قصيرة عن الصلاة والحياة المسيحية.' },
      { icon: Bell, color: '#ea580c', title: 'تذكيرات الصلاة', desc: 'إشعار يومي بمواضيع صلاة اليوم، وتذكيرات متابعة لطيفة للاطمئنان على من تصلي لأجلهم — حتى والتطبيق مغلق.' },
      { icon: Smartphone, color: '#4f46e5', title: 'ثبّته في أي مكان', desc: 'تطبيق كامل لأندرويد وiOS وسطح المكتب. يعمل دون اتصال — يتزامن كل شيء عند عودتك للإنترنت.' },
      { icon: Globe, color: '#db2777', title: '16 لغة', desc: 'العربية والإنجليزية والفرنسية و13 لغة أخرى. غيّر في أي وقت.' },
      { icon: Lock, color: '#6d28d9', title: 'خاص وآمن', desc: 'صلواتك لا تغادر حسابك أبداً. اقفل صلواتك الخاصة في خزنة مشفّرة من طرف إلى طرف لا يفتحها سوى عبارة المرور الخاصة بك.' },
    ],
    stepsTitle: 'كيف يعمل',
    stepsSub: "من أول صلاة إلى سجلّ متنامٍ لأمانة الله — في ثلاث خطوات بسيطة.",
    steps: [
      { emoji: "✍️", title: "دوّن صلاة", desc: "اكتب ما في قلبك." },
      { emoji: "🙏", title: "صلِّ لما يهم اليوم", desc: "افتح التطبيق وابدأ بلمسة واحدة." },
      { emoji: "🎉", title: "تذكّر أمانة الله", desc: "سجّل الاستجابات والشهادات مع مرور الوقت." },
    ],
    calloutBadge: 'اقتراحات الآيات',
    calloutTitle: 'اعثر على الآية المناسبة لكل صلاة',
    calloutDesc: 'لا تعرف كيف تصلي من أجل موقف ما؟ استخدم باحث الآيات واحصل على 3-4 زوايا للصلاة مع مقاطع كتابية ذات صلة.',
    calloutDisclaimer: 'الاقتراحات تقدم مقاطع كتابية — أنت تميّز ما يتكلم لوضعك. الروح يقود؛ هذه الأداة تساعدك في البحث في الكتاب المقدس.',
    calloutTry: 'جرّب الآن',
    calloutPreviewLabel: 'اقتراحات الآيات',
    faqTitle: 'أسئلة',
    faqs: [
      { q: 'هل بياناتي خاصة؟', a: 'نعم. كل صلاة مخزّنة في حسابك الخاص بأمان على مستوى الصف — لا أحد يمكنه رؤية بياناتك، ولا نحن.' },
      { q: 'هل أحتاج حساباً؟', a: 'نعم — الحساب المجاني يزامن صلواتك على جميع أجهزتك. سجّل بـ Google بنقرة واحدة.' },
      { q: 'هل هو مجاني؟', a: 'نعم، مجاني تماماً. التطبيق مفتوح المصدر.' },
    ],
    ctaTitle: 'ابدأ مجلة صلاتك اليوم',
    ctaSub: 'مجاني، خاص، ومتاح بـ 16 لغة. سجّل في ثوانٍ مع Google.',
    ctaBtn: "ابدأ دفتر صلاتك الخاص",
    ctaVerse: '"صلوا بلا انقطاع." — 1 تسالونيكي 5:17',
    footerBuilt: 'مبني بإيمان · مفتوح المصدر · رخصة MIT',
  },

  fa: {
    signIn: 'ورود',
    badge: 'همراه شخصی شما در دعا',
    h1a: 'هیچ دعایی را فراموش نکنید.',
    h1b: 'هر پاسخی را ثبت کنید.',
    subtitle: "یک دفترچهٔ دعای رایگان و خصوصی: درخواست‌ها را در چند ثانیه بنویسید، بدانید امروز برای چه دعا کنید و هر پاسخ را به یاد بسپارید.",
    cta: "دفترچهٔ دعای خصوصی خود را شروع کنید",
    howItWorks: 'ببینید چطور کار می‌کند',
    verse: '"دعای مرد عادل تأثیر عظیمی دارد." — یعقوب ۵:۱۶',
    featuresTitle: 'همه چیزی که زندگی دعایی شما نیاز دارد',
    featuresSub: 'برای مسیحیانی ساخته شده که می‌خواهند با هدف دعا کنند و وفاداری خدا را پیگیری کنند.',
    features: [
      { icon: Users, color: '#0d9488', title: 'با هم دعا کنید', desc: 'به گروه‌ها و دوستان بپیوندید، درخواست‌ها را به اشتراک بگذارید (یا ناشناس بمانید)، برای یکدیگر دعا کنید و دعاهای مستجاب را با هم جشن بگیرید.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'دفترچه دعا', desc: 'هر درخواست دعا را ثبت کنید — برای خودتان یا دیگران. جزئیات اضافه کنید و فراموش نکنید برای چه کسی قول دعا داده‌اید.' },
      { icon: Calendar, color: '#059669', title: 'زمان‌بندی دعا', desc: 'هر دعا را زمان‌بندی کنید — یک‌بار یا تکرارشونده (روزانه، روزهای انتخابی، هر N روز، ماهانه، سالانه)، حتی «تا زمان پاسخ». تقویم ماهانه، زنجیره‌های دعای گروهی و خروجی .ics برای Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'گالری دعاهای مستجاب', desc: 'دعاها را به عنوان مستجاب علامت بزنید و شهادت خود را ثبت کنید. وفاداری خدا را در طول زمان انباشته شده ببینید.' },
      { icon: Sprout, color: '#65a30d', title: 'در دعا رشد کنید', desc: 'کتابخانه‌ای ریشه‌دار در کتاب مقدس: ۱۲ راهنمای دعا برای دعا کردن (مزامیر، وعده‌های خدا، برای دشمنان…) و خواندنی‌های کوتاه درباره دعا و زندگی مسیحی.' },
      { icon: Bell, color: '#ea580c', title: 'یادآورهای دعا', desc: 'اعلان روزانه با موضوعات دعای امروز، به‌علاوه یادآورهای پیگیری برای احوال‌پرسی از کسانی که برایشان دعا می‌کنید — حتی وقتی اپ بسته است.' },
      { icon: Smartphone, color: '#4f46e5', title: 'هر جا نصب کنید', desc: 'یک اپ کامل برای اندروید، iOS و دسکتاپ. آفلاین کار می‌کند — با بازگشت به اینترنت همه‌چیز همگام‌سازی می‌شود.' },
      { icon: Globe, color: '#db2777', title: '۱۶ زبان', desc: 'فارسی، انگلیسی، فرانسوی و ۱۳ زبان دیگر. هر زمان تغییر دهید.' },
      { icon: Lock, color: '#6d28d9', title: 'خصوصی و امن', desc: 'دعاهای شما هرگز از حساب شما خارج نمی‌شوند. دعاهای خصوصی خود را در گنجینه‌ای رمزگذاری‌شده سرتاسری قفل کنید که تنها با عبارت عبور شما باز می‌شود.' },
    ],
    stepsTitle: 'چطور کار می‌کند',
    stepsSub: "از اولین دعا تا سابقه‌ای رو به رشد از وفاداری خدا — در سه مرحلهٔ ساده.",
    steps: [
      { emoji: "✍️", title: "یک دعا بنویسید", desc: "آنچه در دل دارید بنویسید." },
      { emoji: "🙏", title: "برای آنچه امروز مهم است دعا کنید", desc: "برنامه را باز کنید و با یک لمس شروع کنید." },
      { emoji: "🎉", title: "وفاداری خدا را به یاد بسپارید", desc: "پاسخ‌ها و شهادت‌ها را در طول زمان ثبت کنید." },
    ],
    calloutBadge: 'پیشنهاد آیات',
    calloutTitle: 'آیه مناسب برای هر دعا پیدا کنید',
    calloutDesc: 'نمی‌دانید برای یک موقعیت چطور دعا کنید؟ از جستجوگر آیات استفاده کنید و ۳-۴ زاویه دعا با آیات مرتبط بگیرید.',
    calloutDisclaimer: 'پیشنهادات آیات کتاب مقدس را ارائه می‌دهند — شما تشخیص می‌دهید چه چیزی به موقعیتتان می‌گوید. روح هدایت می‌کند.',
    calloutTry: 'همین الان امتحان کنید',
    calloutPreviewLabel: 'پیشنهاد آیات',
    faqTitle: 'سوالات',
    faqs: [
      { q: 'آیا داده‌هایم خصوصی است؟', a: 'بله. هر دعا در حساب خودتان با امنیت سطح ردیف ذخیره می‌شود — هیچ‌کس نمی‌تواند داده‌های شما را ببیند، حتی ما.' },
      { q: 'آیا به حساب نیاز دارم؟', a: 'بله — یک حساب رایگان دعاهایتان را در همه دستگاه‌ها همگام‌سازی می‌کند. با یک ضربه با Google ثبت‌نام کنید.' },
      { q: 'آیا رایگان است؟', a: 'بله، کاملاً رایگان. این اپ متن‌باز است.' },
    ],
    ctaTitle: 'امروز دفترچه دعای خود را شروع کنید',
    ctaSub: 'رایگان، خصوصی، و در ۱۶ زبان موجود. با Google در چند ثانیه ثبت‌نام کنید.',
    ctaBtn: "دفترچهٔ دعای خصوصی خود را شروع کنید",
    ctaVerse: '"پیوسته دعا کنید." — اول تسالونیکیان ۵:۱۷',
    footerBuilt: 'ساخته شده با ایمان · متن‌باز · مجوز MIT',
  },

  zh: {
    signIn: '登录',
    badge: '您的个人祷告伴侣',
    h1a: '不忘记任何一个祷告。',
    h1b: '记录每一个回应。',
    subtitle: "一个免费、私密的祷告日记：几秒记下祷告事项，知道今天为何祷告，并记住每一次应允。",
    cta: "开始你的私密祷告日记",
    howItWorks: '查看如何使用',
    verse: '"义人祈祷所发的力量是大有功效的。" — 雅各书 5:16',
    featuresTitle: '您祷告生活所需的一切',
    featuresSub: '专为希望有意识地祷告并追踪上帝信实的基督徒设计。',
    features: [
      { icon: Users, color: '#0d9488', title: '一起祷告', desc: '加入祷告群组和好友，分享代祷事项（或保持匿名），彼此代祷，并作为群体一同庆祝蒙应允的祷告。' },
      { icon: BookOpen, color: '#7c5cfc', title: '祷告日记', desc: '记录每个祷告请求——为自己或他人。添加详情、跟踪进展，不忘记任何一个承诺代祷的人。' },
      { icon: Calendar, color: '#059669', title: '祷告日程', desc: '为每个祷告安排日程——一次性或重复（每天、选定的星期、每N天、每月、每年），甚至"直到蒙应允"。月历、小组祷告链，以及导出 .ics 到 Google/Apple/Outlook。' },
      { icon: CheckCircle, color: '#0891b2', title: '已应允祷告见证册', desc: '将祷告标记为已应允并记录您的见证。看着上帝的信实在您的个人册中积累。' },
      { icon: Sprout, color: '#65a30d', title: '在祷告中成长', desc: '根植于圣经的资料库：12 个可以照着祷告的祷告指南（诗篇、神的应许、为仇敌祷告……）以及关于祷告和基督徒生活的简短读物。' },
      { icon: Bell, color: '#ea580c', title: '祷告提醒', desc: '每日通知列出当天的祷告事项，还有温和的跟进提醒，鼓励您问候您所代祷的人——即使应用已关闭。' },
      { icon: Smartphone, color: '#4f46e5', title: '随处安装', desc: 'Android、iOS 和桌面上的完整应用。支持离线使用——无网络也能添加和编辑祷告，恢复连接后自动同步。' },
      { icon: Globe, color: '#db2777', title: '16 种语言', desc: '完整支持 16 种语言，包括法语、英语、德语、中文、西班牙语、阿拉伯语等。随时切换。' },
      { icon: Lock, color: '#6d28d9', title: '私密且安全', desc: '您的祷告永远不会离开您的账户。可将私密祷告锁入端到端加密的保险库，只有您的密码短语才能打开。' },
    ],
    stepsTitle: '使用方法',
    stepsSub: "从第一个祷告到不断增长的信实见证——三个简单步骤。",
    steps: [
      { emoji: "✍️", title: "记下祷告", desc: "写下你心中所想。" },
      { emoji: "🙏", title: "为今天最重要的事祷告", desc: "打开应用，一键开始。" },
      { emoji: "🎉", title: "记住神的信实", desc: "随着时间记录应允和见证。" },
    ],
    calloutBadge: '经文建议',
    calloutTitle: '为每个祷告找到合适的经文',
    calloutDesc: '不知道如何为某种情况祷告？使用经文查找器，获得3-4个祷告角度，每个角度都有相关圣经段落及全文。',
    calloutDisclaimer: '建议呈现圣经段落——由您辨别什么话语适合您的情况。圣灵引导；此工具帮助您查找圣经。',
    calloutTry: '立即尝试',
    calloutPreviewLabel: '经文建议',
    faqTitle: '常见问题',
    faqs: [
      { q: '我的数据是私密的吗？', a: '是的。每个祷告都存储在您自己的账户中，使用行级安全——没有人可以看到您的数据，包括我们。' },
      { q: '我需要账户吗？', a: '是的——免费账户可以在所有设备上同步您的祷告。一键用Google注册，或使用邮箱/密码。' },
      { q: '经文查找器如何工作？', a: '您输入祷告主题，应用会推荐相关圣经经文及全文。您选择与您情况相符的内容。' },
      { q: '支持哪些语言？', a: '完整界面支持 16 种语言。' },
      { q: '是免费的吗？', a: '是的，完全免费。该应用是开源的。' },
    ],
    ctaTitle: '今天开始您的祷告日记',
    ctaSub: '免费、私密，支持 16 种语言。用Google几秒钟即可注册。',
    ctaBtn: "开始你的私密祷告日记",
    ctaVerse: '"不住地祷告。" — 帖撒罗尼迦前书 5:17',
    footerBuilt: '以信仰建造 · 开源 · MIT许可证',
  },

  es: {
    signIn: 'Iniciar sesión',
    badge: 'Tu compañero personal de oración',
    h1a: 'Nunca olvides una oración.',
    h1b: 'Registra cada respuesta.',
    subtitle: "Un diario de oración gratuito y privado: anota peticiones en segundos, ve qué orar hoy y guarda cada respuesta.",
    cta: "Comienza tu diario de oración privado",
    howItWorks: 'Ver cómo funciona',
    verse: '"La oración ferviente del justo puede mucho." — Santiago 5:16',
    featuresTitle: 'Todo lo que tu vida de oración necesita',
    featuresSub: 'Diseñado para cristianos que quieren orar con intención y registrar la fidelidad de Dios.',
    features: [
      { icon: Users, color: '#0d9488', title: 'Oren juntos', desc: 'Únete a grupos y amigos, comparte peticiones (o permanece anónimo), oren unos por otros y celebren las oraciones respondidas en comunidad.' },
      { icon: BookOpen, color: '#7c5cfc', title: 'Diario de oración', desc: 'Registra cada petición de oración — para ti o para otros. Añade detalles, haz seguimiento y nunca olvides por quién prometiste orar.' },
      { icon: Calendar, color: '#059669', title: 'Programa tus oraciones', desc: 'Programa cada oración — única o recurrente (diaria, días elegidos, cada N días, mensual, anual), incluso "hasta ser respondida". Calendario mensual, cadenas de oración en grupo y exportación .ics a Google/Apple/Outlook.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galería de oraciones respondidas', desc: 'Marca las oraciones como respondidas y registra tu testimonio. Observa la fidelidad de Dios acumularse con el tiempo.' },
      { icon: Sprout, color: '#65a30d', title: 'Crece en la oración', desc: 'Una biblioteca arraigada en las Escrituras: 12 guías de oración para orar (los Salmos, las promesas de Dios, por tus enemigos…) y lecturas breves sobre la oración y la vida cristiana.' },
      { icon: Bell, color: '#ea580c', title: 'Recordatorios de oración', desc: 'Una notificación diaria con los temas de oración del día, más suaves recordatorios de seguimiento para saber de las personas por quienes oras — incluso con la app cerrada.' },
      { icon: Smartphone, color: '#4f46e5', title: 'Instálala donde quieras', desc: 'Una app completa para Android, iOS y escritorio. Funciona sin conexión — añade y edita oraciones offline; todo se sincroniza al volver.' },
      { icon: Globe, color: '#db2777', title: '16 idiomas', desc: 'Interfaz completa en 16 idiomas, incluidos francés, inglés, alemán, chino, español, árabe y más. Cambia cuando quieras.' },
      { icon: Lock, color: '#6d28d9', title: 'Privado y seguro', desc: 'Tus oraciones nunca salen de tu cuenta — solo tú puedes verlas. Guarda tus oraciones privadas en una bóveda cifrada de extremo a extremo que solo tu frase de contraseña puede abrir.' },
    ],
    stepsTitle: 'Cómo funciona',
    stepsSub: "De la primera oración a un registro creciente de la fidelidad de Dios — en tres pasos simples.",
    steps: [
      { emoji: "✍️", title: "Anota una oración", desc: "Escribe lo que hay en tu corazón." },
      { emoji: "🙏", title: "Ora lo que importa hoy", desc: "Abre la app y comienza con un toque." },
      { emoji: "🎉", title: "Recuerda la fidelidad de Dios", desc: "Registra respuestas y testimonios con el tiempo." },
    ],
    calloutBadge: 'Sugerencias de versículos',
    calloutTitle: 'Encuentra el versículo correcto para cada oración',
    calloutDesc: '¿No sabes cómo orar por una situación? Usa el buscador de versículos y obtén 3-4 ángulos de oración, cada uno con pasajes bíblicos relevantes y su texto completo.',
    calloutDisclaimer: 'Las sugerencias presentan pasajes bíblicos — tú disciernes lo que habla a tu situación. El Espíritu guía; esta herramienta te ayuda a buscar las Escrituras.',
    calloutTry: 'Probar ahora',
    calloutPreviewLabel: 'Sugerencias de versículos',
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      { q: '¿Son privados mis datos?', a: 'Sí. Cada oración se almacena en tu propia cuenta con seguridad por filas — nadie más puede ver tus datos, ni siquiera nosotros.' },
      { q: '¿Necesito una cuenta?', a: 'Sí — una cuenta gratuita sincroniza tus oraciones en todos tus dispositivos. Regístrate con Google en un toque o usa email/contraseña.' },
      { q: '¿Cómo funciona el buscador de versículos?', a: 'Introduces el tema de tu oración y la app sugiere versículos bíblicos relevantes con su texto completo. Tú eliges lo que resuena con tu situación.' },
      { q: '¿Qué idiomas están disponibles?', a: 'La interfaz completa funciona en 16 idiomas.' },
      { q: '¿Es gratuito?', a: 'Sí, completamente gratuito. La aplicación es de código abierto.' },
    ],
    ctaTitle: 'Comienza tu diario de oración hoy',
    ctaSub: 'Gratis, privado y disponible en 16 idiomas. Regístrate en segundos con Google.',
    ctaBtn: "Comienza tu diario de oración privado",
    ctaVerse: '"Orad sin cesar." — 1 Tesalonicenses 5:17',
    footerBuilt: 'Hecho con fe · Código abierto · Licencia MIT',
  },

  hi: {
    signIn: 'साइन इन करें',
    badge: 'आपका व्यक्तिगत प्रार्थना साथी',
    h1a: 'कोई भी प्रार्थना न भूलें।',
    h1b: 'हर उत्तर को दर्ज करें।',
    subtitle: "एक निःशुल्क, निजी प्रार्थना डायरी: सेकंडों में प्रार्थनाएँ लिखें, जानें आज क्या प्रार्थना करनी है, और हर उत्तर याद रखें।",
    cta: "अपनी निजी प्रार्थना डायरी शुरू करें",
    howItWorks: 'देखें यह कैसे काम करता है',
    verse: '"धर्मी जन की प्रार्थना के प्रभाव से बहुत कुछ हो सकता है।" — याकूब 5:16',
    featuresTitle: 'आपके प्रार्थना जीवन की सब कुछ ज़रूरतें',
    featuresSub: 'उन मसीहियों के लिए बनाया गया जो उद्देश्य से प्रार्थना करना और परमेश्वर की विश्वसनीयता को ट्रैक करना चाहते हैं।',
    features: [
      { icon: Users, color: '#0d9488', title: 'साथ मिलकर प्रार्थना करें', desc: 'प्रार्थना समूहों और मित्रों में शामिल हों, अनुरोध साझा करें (या गुमनाम रहें), एक-दूसरे के लिए प्रार्थना करें, और उत्तरित प्रार्थनाओं का समुदाय के रूप में जश्न मनाएं।' },
      { icon: BookOpen, color: '#7c5cfc', title: 'प्रार्थना पत्रिका', desc: 'हर प्रार्थना अनुरोध दर्ज करें — अपने लिए या दूसरों के लिए। विवरण जोड़ें, अनुवर्ती करें, और कभी न भूलें कि आपने किसके लिए प्रार्थना का वादा किया था।' },
      { icon: Calendar, color: '#059669', title: 'प्रार्थना शेड्यूल', desc: 'किसी भी प्रार्थना को शेड्यूल करें — एक बार या दोहराव (दैनिक, चुने हुए दिन, हर N दिन, मासिक, वार्षिक), यहाँ तक कि "उत्तर मिलने तक"। मासिक कैलेंडर, समूह प्रार्थना श्रृंखलाएँ, और Google/Apple/Outlook के लिए .ics निर्यात।' },
      { icon: CheckCircle, color: '#0891b2', title: 'उत्तर मिली प्रार्थनाओं की गैलरी', desc: 'प्रार्थनाओं को उत्तर मिली के रूप में चिह्नित करें और अपनी गवाही दर्ज करें। समय के साथ परमेश्वर की विश्वसनीयता जमा होते देखें।' },
      { icon: Sprout, color: '#65a30d', title: 'प्रार्थना में बढ़ें', desc: 'पवित्रशास्त्र पर आधारित एक पुस्तकालय: प्रार्थना करने के लिए 12 प्रार्थना गाइड (भजन संहिता, परमेश्वर की प्रतिज्ञाएँ, शत्रुओं के लिए…) और प्रार्थना व मसीही जीवन पर छोटे पाठ।' },
      { icon: Bell, color: '#ea580c', title: 'प्रार्थना अनुस्मारक', desc: 'दिन के प्रार्थना विषयों के साथ दैनिक सूचना, और जिनके लिए आप प्रार्थना करते हैं उनका हाल पूछने के लिए कोमल फॉलो-अप अनुस्मारक — ऐप बंद होने पर भी।' },
      { icon: Smartphone, color: '#4f46e5', title: 'कहीं भी इंस्टॉल करें', desc: 'Android, iOS और डेस्कटॉप पर पूर्ण ऐप। ऑफ़लाइन काम करता है — बिना कनेक्शन प्रार्थनाएँ जोड़ें और संपादित करें; वापस आने पर सब सिंक हो जाता है।' },
      { icon: Globe, color: '#db2777', title: '16 भाषाएँ', desc: '16 भाषाओं में पूर्ण इंटरफ़ेस — फ्रेंच, अंग्रेजी, जर्मन, चीनी, स्पेनिश, अरबी और अधिक। कभी भी बदलें।' },
      { icon: Lock, color: '#6d28d9', title: 'निजी और सुरक्षित', desc: 'आपकी प्रार्थनाएँ कभी आपके खाते से बाहर नहीं जातीं। अपनी निजी प्रार्थनाओं को एंड-टू-एंड एन्क्रिप्टेड वॉल्ट में लॉक करें, जिसे केवल आपका पासफ़्रेज़ ही खोल सकता है।' },
    ],
    stepsTitle: 'यह कैसे काम करता है',
    stepsSub: "पहली प्रार्थना से परमेश्वर की विश्वासयोग्यता के बढ़ते अभिलेख तक — तीन सरल चरणों में।",
    steps: [
      { emoji: "✍️", title: "प्रार्थना लिखें", desc: "जो आपके दिल में है, वह लिखें।" },
      { emoji: "🙏", title: "आज जो मायने रखता है, उसकी प्रार्थना करें", desc: "ऐप खोलें और एक टैप से शुरू करें।" },
      { emoji: "🎉", title: "परमेश्वर की विश्वासयोग्यता याद रखें", desc: "समय के साथ उत्तर और गवाहियाँ दर्ज करें।" },
    ],
    calloutBadge: 'वचन सुझाव',
    calloutTitle: 'हर प्रार्थना के लिए सही वचन खोजें',
    calloutDesc: 'किसी स्थिति के लिए प्रार्थना कैसे करें नहीं जानते? वचन खोजक का उपयोग करें और 3-4 प्रार्थना कोण प्राप्त करें, प्रत्येक में प्रासंगिक बाइबल अंश और उनका पूरा पाठ।',
    calloutDisclaimer: 'सुझाव बाइबल के अंश प्रस्तुत करते हैं — आप विवेक करें कि आपकी स्थिति के लिए क्या बोलता है। आत्मा मार्गदर्शन करता है; यह उपकरण शास्त्र खोजने में मदद करता है।',
    calloutTry: 'अभी आज़माएँ',
    calloutPreviewLabel: 'वचन सुझाव',
    faqTitle: 'प्रश्न',
    faqs: [
      { q: 'क्या मेरा डेटा निजी है?', a: 'हाँ। हर प्रार्थना आपके अपने खाते में पंक्ति-स्तरीय सुरक्षा के साथ संग्रहीत है — कोई भी आपका डेटा नहीं देख सकता, हम भी नहीं।' },
      { q: 'क्या मुझे खाते की जरूरत है?', a: 'हाँ — एक मुफ्त खाता आपकी प्रार्थनाओं को सभी डिवाइस पर सिंक करता है। एक टैप में Google से साइन अप करें या ईमेल/पासवर्ड का उपयोग करें।' },
      { q: 'वचन खोजक कैसे काम करता है?', a: 'आप अपनी प्रार्थना का विषय दर्ज करते हैं और ऐप प्रासंगिक बाइबल वचन और उनके पूरे पाठ के साथ सुझाव देता है। आप चुनते हैं कि आपकी स्थिति के लिए क्या उचित है।' },
      { q: 'कौन सी भाषाएँ समर्थित हैं?', a: 'पूरा इंटरफ़ेस 16 भाषाओं में काम करता है।' },
      { q: 'क्या यह मुफ्त है?', a: 'हाँ, पूरी तरह मुफ्त। ऐप ओपन सोर्स है।' },
    ],
    ctaTitle: 'आज ही अपनी प्रार्थना पत्रिका शुरू करें',
    ctaSub: 'मुफ्त, निजी और 16 भाषाओं में उपलब्ध। Google से कुछ ही सेकंड में साइन अप करें।',
    ctaBtn: "अपनी निजी प्रार्थना डायरी शुरू करें",
    ctaVerse: '"निरन्तर प्रार्थना करते रहो।" — 1 थिस्सलुनीकियों 5:17',
    footerBuilt: 'विश्वास के साथ बनाया · ओपन सोर्स · MIT लाइसेंस',
  },
};

// Landing-page palettes. The page keeps its own marketing look (deep-purple
// dark by default) rather than the app's data-theme CSS variables, so both
// modes are defined locally; the toggle still writes pfm_theme so the auth
// page and the app continue with the visitor's choice after sign-in.
const THEMES = {
  dark: {
    bg: '#0d0a1e',
    text: '#ffffff',
    textSoft: 'rgba(255,255,255,0.75)',
    textMuted: 'rgba(255,255,255,0.6)',
    textFaint: 'rgba(255,255,255,0.5)',
    textDim: 'rgba(255,255,255,0.4)',
    textGhost: 'rgba(255,255,255,0.3)',
    surface: 'rgba(255,255,255,0.04)',
    surfaceStrong: 'rgba(255,255,255,0.06)',
    chipBg: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.12)',
    menuBg: '#1a1630',
    menuShadow: '0 8px 24px rgba(0,0,0,0.4)',
    accentText: '#a78bfa',
    accentSoftBg: 'rgba(124,92,252,0.15)',
    accentChipBg: 'rgba(124,92,252,0.2)',
    accentActiveBg: 'rgba(124,92,252,0.25)',
    accentBorder: 'rgba(124,92,252,0.3)',
    heroGlow: 'rgba(124,92,252,0.35)',
    ctaGlow: 'rgba(124,92,252,0.25)',
    calloutBg: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(167,139,250,0.08))',
    calloutBorder: 'rgba(124,92,252,0.25)',
    previewBg: 'rgba(0,0,0,0.3)',
    previewItemBg: 'rgba(255,255,255,0.05)',
    gold: '#f5c842',
    ctaShadow: '0 0 30px rgba(124,92,252,0.4)',
    ctaShadowBig: '0 0 40px rgba(124,92,252,0.45)',
  },
  light: {
    bg: '#f7f5fc',
    text: '#1a1630',
    textSoft: 'rgba(26,22,48,0.78)',
    textMuted: 'rgba(26,22,48,0.65)',
    textFaint: 'rgba(26,22,48,0.55)',
    textDim: 'rgba(26,22,48,0.45)',
    textGhost: 'rgba(26,22,48,0.38)',
    surface: '#ffffff',
    surfaceStrong: '#ffffff',
    chipBg: 'rgba(26,22,48,0.05)',
    border: 'rgba(26,22,48,0.08)',
    borderStrong: 'rgba(26,22,48,0.14)',
    menuBg: '#ffffff',
    menuShadow: '0 8px 24px rgba(26,22,48,0.14)',
    accentText: '#6d4df0',
    accentSoftBg: 'rgba(124,92,252,0.1)',
    accentChipBg: 'rgba(124,92,252,0.12)',
    accentActiveBg: 'rgba(124,92,252,0.14)',
    accentBorder: 'rgba(124,92,252,0.3)',
    heroGlow: 'rgba(124,92,252,0.16)',
    ctaGlow: 'rgba(124,92,252,0.12)',
    calloutBg: 'linear-gradient(135deg, rgba(124,92,252,0.12), rgba(167,139,250,0.05))',
    calloutBorder: 'rgba(124,92,252,0.25)',
    previewBg: '#ffffff',
    previewItemBg: 'rgba(124,92,252,0.06)',
    gold: '#b45309',
    ctaShadow: '0 10px 25px rgba(124,92,252,0.35)',
    ctaShadowBig: '0 12px 32px rgba(124,92,252,0.35)',
  },
};

function FAQ({ q, a, T }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: T.surfaceStrong, border: `0.5px solid ${T.border}` }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-sm font-medium pr-4" style={{ color: T.text }}>{q}</p>
        {open
          ? <ChevronUp size={16} style={{ color: T.textFaint }} />
          : <ChevronDown size={16} style={{ color: T.textFaint }} />}
      </div>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm" style={{ color: T.textMuted, lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const [lang, setLang] = useState(detectLang);
  const [langOpen, setLangOpen] = useState(false);
  // Dark is the landing's native look; light kicks in when the visitor picked
  // it here before, or in the app (both share the pfm_theme key).
  const [theme, setTheme] = useState(() => (localStorage.getItem('pfm_theme') === 'light' ? 'light' : 'dark'));
  // The nine-card feature grid is folded away by default so the hero + three core
  // benefits carry the first impression; visitors opt in to the full list.
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const c = CONTENT[lang];
  const T = THEMES[theme];
  const benefits = CORE_BENEFITS[lang] || CORE_BENEFITS.en;
  const explore = EXPLORE_LABELS[lang] || EXPLORE_LABELS.en;
  const activeLang = LANGS.find(l => l.code === lang);

  // Reflect the visitor's language on <html> so screen readers pronounce the
  // marketing copy correctly and Arabic/Persian render right-to-left. Mirrors the
  // in-app effect in App.jsx, which takes over once the visitor signs in.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
  }, [lang]);

  const handleLang = (code) => {
    setLang(code);
    setLangOpen(false);
    // Persist to the shared settings store (which also writes pfm_language), so
    // the choice carries into the auth page and the app after sign-in. No server
    // sync happens while logged out — updateSettings only syncs with a userId.
    usePrayerStore.getState().updateSettings({ language: code });
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    // Same key + attribute the app reads, so the choice follows the visitor
    // through sign-in.
    localStorage.setItem('pfm_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-6xl mx-auto gap-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.svg" alt="" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-lg tracking-tight">Pray4Me</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all shrink-0"
            style={{ background: T.chipBg, color: T.textSoft, border: `0.5px solid ${T.borderStrong}` }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: T.chipBg, color: T.textSoft, border: `0.5px solid ${T.borderStrong}` }}
            >
              <span>{activeLang?.flag}</span>
              <span>{activeLang?.label}</span>
              <ChevronDown size={13} style={{ opacity: 0.6 }} />
            </button>

            {langOpen && (
              <div
                className="absolute right-0 mt-1 rounded-xl overflow-hidden z-50"
                style={{ background: T.menuBg, border: `0.5px solid ${T.borderStrong}`, minWidth: '130px', boxShadow: T.menuShadow }}
              >
                {LANGS.map(({ code, flag, label, complete }) => (
                  <button
                    key={code}
                    onClick={() => handleLang(code)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                    style={lang === code
                      ? { background: T.accentActiveBg, color: T.accentText }
                      : { color: T.textSoft }}
                  >
                    <span>{flag}</span>
                    <span className="flex-1">{label}</span>
                    {!complete && (
                      <span
                        title="Translation still in progress"
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: T.gold }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onGetStarted}
            className="text-sm font-medium px-4 py-2 rounded-xl transition-all shrink-0"
            style={{ background: T.chipBg, color: T.text, border: `0.5px solid ${T.borderStrong}` }}
          >
            {c.signIn}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative text-center px-6 pt-16 pb-24 max-w-3xl mx-auto">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${T.heroGlow} 0%, transparent 70%)` }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6" style={{ background: T.accentSoftBg, color: T.accentText, border: `0.5px solid ${T.accentBorder}` }}>
            <Sparkles size={11} /> {c.badge}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
            {c.h1a}<br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {c.h1b}
            </span>
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: T.textMuted, lineHeight: 1.7 }}>{c.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', boxShadow: T.ctaShadow }}
            >
              {c.cta}
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-medium"
              style={{ background: T.surfaceStrong, color: T.text, border: `0.5px solid ${T.borderStrong}` }}
            >
              {c.howItWorks}
            </button>
          </div>
          <p className="text-xs mt-4 italic" style={{ color: T.textGhost }}>{c.verse}</p>
        </div>
      </section>

      {/* Core benefits — the three things Pray4Me does, up front, before the
          longer feature list. Centered so it reads cleanly in RTL too. */}
      <section className="px-6 max-w-5xl mx-auto mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {benefits.map(({ title, desc }, i) => {
            const { icon: Icon, color } = BENEFIT_META[i];
            return (
              <div key={title} className="rounded-2xl p-6 text-center" style={{ background: T.surface, border: `0.5px solid ${T.border}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: color + '22' }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="text-base font-bold mb-1.5" style={{ color: T.text }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.textFaint }}>{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features — the full grid is folded behind "Explore all features" so the
          landing leads with the three core benefits above, not a wall of cards. */}
      <section className="px-6 max-w-5xl mx-auto mb-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">{c.featuresTitle}</h2>
          <p className="text-sm" style={{ color: T.textFaint }}>{c.featuresSub}</p>
        </div>
        {!showAllFeatures ? (
          <div className="text-center">
            <button
              onClick={() => setShowAllFeatures(true)}
              aria-expanded={false}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
              style={{ background: T.surfaceStrong, color: T.text, border: `0.5px solid ${T.borderStrong}` }}
            >
              {explore.more} <ChevronDown size={15} />
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {c.features.map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="rounded-2xl p-5" style={{ background: T.surface, border: `0.5px solid ${T.border}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: color + '22' }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5" style={{ color: T.text }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: T.textFaint }}>{desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAllFeatures(false)}
                aria-expanded
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
                style={{ background: T.surfaceStrong, color: T.textSoft, border: `0.5px solid ${T.borderStrong}` }}
              >
                {explore.less} <ChevronUp size={15} />
              </button>
            </div>
          </>
        )}
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 max-w-3xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{c.stepsTitle}</h2>
          <p className="text-sm" style={{ color: T.textFaint }}>{c.stepsSub}</p>
        </div>
        <div className="space-y-4">
          {c.steps.map(({ emoji, title, desc }, i) => (
            <div key={title} className="flex items-start gap-5 rounded-2xl p-5" style={{ background: T.surface, border: `0.5px solid ${T.border}` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: T.accentSoftBg, border: `0.5px solid ${T.accentBorder}` }}>
                {emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: T.accentChipBg, color: T.accentText }}>
                    {lang === 'de' ? `Schritt ${i + 1}` : lang === 'fr' ? `Étape ${i + 1}` : lang === 'pt' ? `Passo ${i + 1}` : `Step ${i + 1}`}
                  </span>
                  <h3 className="text-sm font-semibold" style={{ color: T.text }}>{title}</h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: T.textFaint }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scripture finder callout */}
      <section className="px-6 max-w-5xl mx-auto mb-24">
        <div className="rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8" style={{ background: T.calloutBg, border: `0.5px solid ${T.calloutBorder}` }}>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-4" style={{ background: T.accentChipBg, color: T.accentText }}>
              <BookOpen size={11} /> {c.calloutBadge}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{c.calloutTitle}</h2>
            <p className="text-sm mb-3" style={{ color: T.textMuted, lineHeight: 1.7 }}>{c.calloutDesc}</p>
            <p className="text-xs mb-5 italic" style={{ color: T.textDim, lineHeight: 1.7 }}>{c.calloutDisclaimer}</p>
            <button onClick={onGetStarted} className="px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}>
              {c.calloutTry}
            </button>
          </div>
          <div className="w-full md:w-64 rounded-2xl p-4 shrink-0" style={{ background: T.previewBg, border: `0.5px solid ${T.border}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T.textDim }}>{c.calloutPreviewLabel}</p>
            {/* Example references use the visitor's localized book names —
                never an English "Philippians" inside another language. */}
            {[
              { point: lang === 'fr' ? 'La paix qui surpasse tout entendement' : lang === 'de' ? 'Friede, der allen Verstand übersteigt' : lang === 'pt' ? 'A paz que excede todo entendimento' : 'Peace that surpasses understanding', verse: localizeRef('Philippians 4:7', lang) },
              { point: lang === 'fr' ? 'Faire confiance au temps de Dieu' : lang === 'de' ? 'Gottes Timing vertrauen' : lang === 'pt' ? 'Confiar no tempo de Deus' : 'Trust in God\'s timing', verse: localizeRef('Isaiah 40:31', lang) },
            ].map(({ point, verse }) => (
              <div key={verse} className="rounded-xl p-3 mb-2" style={{ background: T.previewItemBg, borderLeft: `3px solid ${T.gold}` }}>
                <p className="text-xs mb-1" style={{ color: T.text }}>{point}</p>
                <p className="text-xs flex items-center gap-1" style={{ color: T.gold }}>
                  <BookOpen size={9} /> {verse}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 max-w-2xl mx-auto mb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">{c.faqTitle}</h2>
        </div>
        <div className="space-y-2">
          {c.faqs.map(faq => <FAQ key={faq.q} {...faq} T={T} />)}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 70% 80% at 50% 50%, ${T.ctaGlow} 0%, transparent 70%)` }} />
        <div className="relative max-w-xl mx-auto">
          <img src="/logo.svg" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{c.ctaTitle}</h2>
          <p className="text-sm mb-8" style={{ color: T.textMuted, lineHeight: 1.7 }}>{c.ctaSub}</p>
          <button onClick={onGetStarted} className="px-8 py-4 rounded-2xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', boxShadow: T.ctaShadowBig }}>
            {c.ctaBtn}
          </button>
          <p className="text-xs mt-4 italic" style={{ color: T.textGhost }}>{c.ctaVerse}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t max-w-5xl mx-auto" style={{ borderColor: T.border }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="w-6 h-6 rounded-md" />
            <span className="text-sm font-medium" style={{ color: T.text }}>Pray4Me</span>
          </div>
          <p className="text-xs" style={{ color: T.textGhost }}>{c.footerBuilt}</p>
          <button onClick={onGetStarted} className="text-xs font-medium px-4 py-2 rounded-xl" style={{ background: T.chipBg, color: T.textSoft, border: `0.5px solid ${T.border}` }}>
            {c.signIn} →
          </button>
        </div>
      </footer>

    </div>
  );
}
