import { useState } from 'react';
import { BookOpen, Calendar, CheckCircle, Globe, Lock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'pt', flag: '🇧🇷', label: 'PT' },
  { code: 'zh', flag: '🇨🇳', label: 'ZH' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'hi', flag: '🇮🇳', label: 'HI' },
  { code: 'ja', flag: '🇯🇵', label: 'JA' },
  { code: 'sw', flag: '🇰🇪', label: 'SW' },
  { code: 'am', flag: '🇪🇹', label: 'AM' },
  { code: 'id', flag: '🇮🇩', label: 'ID' },
  { code: 'tl', flag: '🇵🇭', label: 'TL' },
  { code: 'ko', flag: '🇰🇷', label: 'KO' },
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'ar', flag: '🇸🇦', label: 'AR' },
  { code: 'fa', flag: '🇮🇷', label: 'FA' },
];

const ALL_CODES = LANGS.map(l => l.code);

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
    subtitle: 'Un journal de prière privé avec un plan hebdomadaire, des versets bibliques pertinents pour chaque demande, et une galerie de prières exaucées.',
    cta: 'Commencer — c\'est gratuit',
    howItWorks: 'Voir comment ça marche',
    verse: '"La prière fervante du juste est d\'une grande efficacité." — Jacques 5:16',
    stats: [
      { emoji: '📋', label: 'Prières actives', value: '12', sub: 'en intercession' },
      { emoji: '✅', label: 'Prières exaucées', value: '34', sub: 'témoignages enregistrés' },
      { emoji: '📅', label: 'Jours couverts', value: '7/7', sub: 'plan hebdomadaire' },
    ],
    featuresTitle: 'Tout ce dont votre vie de prière a besoin',
    featuresSub: 'Conçu pour les chrétiens qui veulent prier avec intention et suivre la fidélité de Dieu.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'Journal de prière', desc: 'Notez chaque demande de prière — pour vous ou pour d\'autres. Ajoutez des détails, suivez les évolutions, n\'oubliez jamais qui vous avez promis de prier.' },
      { icon: Calendar, color: '#059669', title: 'Plan de prière hebdomadaire', desc: 'Assignez des catégories à chaque jour. Lundi pour la famille, mardi pour la santé… chaque matin, vous savez exactement quoi prier.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galerie de prières exaucées', desc: 'Marquez les prières comme exaucées et enregistrez votre témoignage. Regardez la fidélité de Dieu s\'accumuler au fil du temps.' },
      { icon: Globe, color: '#db2777', title: '4 langues', desc: 'Interface complète en français, anglais, allemand et portugais. Changez à tout moment.' },
      { icon: Lock, color: '#6d28d9', title: 'Privé & sécurisé', desc: 'Vos prières ne quittent jamais votre compte. Seul vous pouvez voir vos données — jamais.' },
    ],
    stepsTitle: 'Comment ça marche',
    stepsSub: 'De votre première prière à une galerie complète de réponses — en quatre étapes simples.',
    steps: [
      { emoji: '✍️', title: 'Ajoutez une prière', desc: 'Notez une demande, assignez une catégorie, et indiquez optionnellement pour qui vous priez.' },
      { emoji: '📅', title: 'Configurez votre plan', desc: 'Assignez des catégories à des jours. Ouvrez l\'app chaque matin et voyez votre liste du jour.' },
      { emoji: '📖', title: 'Trouvez les Écritures', desc: 'Utilisez le chercheur de versets pour trouver des passages bibliques liés à votre demande — vous discernez ce qui vous parle.' },
      { emoji: '🎉', title: 'Enregistrez les réponses', desc: 'Quand Dieu répond, marquez-le. Ajoutez votre témoignage. Revenez-y quand vous avez besoin de foi.' },
    ],
    calloutBadge: 'Suggestions de versets',
    calloutTitle: 'Trouvez le bon verset pour chaque prière',
    calloutDesc: 'Vous ne savez pas comment prier pour une situation ? Utilisez le chercheur de versets et obtenez 3 à 4 angles de prière, chacun avec des passages bibliques pertinents et leur texte complet.',
    calloutDisclaimer: 'Les suggestions présentent des passages bibliques — vous discernez ce qui parle à votre situation. L\'Esprit conduit ; cet outil vous aide à chercher les Écritures.',
    calloutTry: 'Essayer maintenant',
    calloutPreviewLabel: 'Suggestions de versets',
    faqTitle: 'Questions',
    faqs: [
      { q: 'Mes données sont-elles privées ?', a: 'Oui. Chaque prière est stockée dans votre propre compte avec Row Level Security — personne d\'autre ne peut voir vos données, pas même nous.' },
      { q: 'Ai-je besoin d\'un compte ?', a: 'Oui — un compte gratuit synchronise vos prières sur tous vos appareils. Inscrivez-vous avec Google en un tap ou utilisez email/mot de passe.' },
      { q: 'Comment fonctionne le chercheur de versets ?', a: 'Vous entrez le sujet de votre prière et l\'app suggère des versets bibliques pertinents avec leur texte complet. Vous choisissez ce qui résonne avec votre situation.' },
      { q: 'Quelles langues sont supportées ?', a: 'L\'interface complète fonctionne en français, anglais, allemand et portugais. Les suggestions de versets sont aussi dans votre langue.' },
      { q: 'Est-ce gratuit ?', a: 'Oui, entièrement gratuit. L\'application est open source.' },
    ],
    ctaTitle: 'Commencez votre journal de prière aujourd\'hui',
    ctaSub: 'Gratuit, privé, et disponible en 4 langues. Inscrivez-vous en quelques secondes avec Google.',
    ctaBtn: 'Commencer — c\'est gratuit',
    ctaVerse: '"Priez sans cesse." — 1 Thessaloniciens 5:17',
    footerBuilt: 'Fait avec foi · Open source · Licence MIT',
  },
  en: {
    signIn: 'Sign in',
    badge: 'Your personal prayer companion',
    h1a: 'Never forget a prayer.',
    h1b: 'Track every answer.',
    subtitle: 'A private prayer journal with a weekly plan, relevant Bible verses for every request, and a gallery of God\'s answered prayers.',
    cta: 'Get started — it\'s free',
    howItWorks: 'See how it works',
    verse: '"The prayer of a righteous person is powerful and effective." — James 5:16',
    stats: [
      { emoji: '📋', label: 'Active prayers', value: '12', sub: 'being prayed for' },
      { emoji: '✅', label: 'Answered prayers', value: '34', sub: 'testimonies recorded' },
      { emoji: '📅', label: 'Days covered', value: '7/7', sub: 'weekly plan set' },
    ],
    featuresTitle: 'Everything your prayer life needs',
    featuresSub: 'Built for Christians who want to pray with intention and track God\'s faithfulness.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'Prayer journal', desc: 'Log every prayer request — for yourself or for others. Add details, follow up with updates, and never forget who you said you\'d pray for.' },
      { icon: Calendar, color: '#059669', title: 'Weekly prayer plan', desc: 'Assign categories to days of the week. Monday for family, Tuesday for health… each day you see exactly what to pray for.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Answered prayer gallery', desc: 'Mark prayers as answered and record your testimony. Watch God\'s faithfulness accumulate over time in your personal gallery.' },
      { icon: Globe, color: '#db2777', title: '4 languages', desc: 'Full UI in French, English, German, and Portuguese. Switch anytime — every label and suggestion follows your choice.' },
      { icon: Lock, color: '#6d28d9', title: 'Private & secure', desc: 'Your prayers never leave your account. Row-level security means only you can see your data — ever.' },
    ],
    stepsTitle: 'How it works',
    stepsSub: 'From your first prayer to a full gallery of answered ones — in four simple steps.',
    steps: [
      { emoji: '✍️', title: 'Add a prayer', desc: 'Type a request, assign a category, and optionally note who it\'s for.' },
      { emoji: '📅', title: 'Set your plan', desc: 'Assign categories to days. Open the app each morning and see today\'s list.' },
      { emoji: '📖', title: 'Find relevant Scripture', desc: 'Tap the verse finder to surface Bible passages related to your request — you discern what speaks to your situation.' },
      { emoji: '🎉', title: 'Record answers', desc: 'When God answers, mark it. Add your testimony. Revisit it whenever you need faith.' },
    ],
    calloutBadge: 'Scripture suggestions',
    calloutTitle: 'Find the right Word for every prayer',
    calloutDesc: 'Stuck on how to pray for a situation? Tap the verse finder and get 3–4 prayer angles, each with relevant Bible passages and their full text — ready to open directly in Bible.com.',
    calloutDisclaimer: 'The suggestions surface Bible passages — you discern what speaks to your situation. The Spirit leads; this tool helps you search the Scriptures.',
    calloutTry: 'Try it now',
    calloutPreviewLabel: 'Scripture suggestions',
    faqTitle: 'Questions',
    faqs: [
      { q: 'Is my data private?', a: 'Yes. Every prayer is stored in your own account with Row Level Security — no one else can read your data, not even us.' },
      { q: 'Do I need an account?', a: 'Yes — a free account keeps your prayers synced across devices. Sign up with Google in one tap or use email/password.' },
      { q: 'How does the Scripture finder work?', a: 'You enter the title of your prayer and the app surfaces relevant Bible verses with their full text. You choose which ones resonate with your situation.' },
      { q: 'What languages are supported?', a: 'The full interface works in French, English, German, and Portuguese. Verse suggestions are also returned in your chosen language.' },
      { q: 'Is it free?', a: 'Yes, completely free to use. The app is open source.' },
    ],
    ctaTitle: 'Start your prayer journal today',
    ctaSub: 'Free, private, and available in 4 languages. Sign up in seconds with Google.',
    ctaBtn: 'Get started — it\'s free',
    ctaVerse: '"Pray without ceasing." — 1 Thessalonians 5:17',
    footerBuilt: 'Built with faith · Open source · MIT License',
  },
  de: {
    signIn: 'Anmelden',
    badge: 'Dein persönlicher Gebetsbegleiter',
    h1a: 'Vergiss kein Gebet.',
    h1b: 'Verfolge jede Antwort.',
    subtitle: 'Ein privates Gebetstagebuch mit einem Wochenplan, relevanten Bibelversen für jede Bitte und einer Galerie erhörter Gebete.',
    cta: 'Loslegen — kostenlos',
    howItWorks: 'Wie es funktioniert',
    verse: '"Das Gebet eines Gerechten vermag viel." — Jakobus 5:16',
    stats: [
      { emoji: '📋', label: 'Aktive Gebete', value: '12', sub: 'werden gebetet' },
      { emoji: '✅', label: 'Erhörte Gebete', value: '34', sub: 'Zeugnisse aufgezeichnet' },
      { emoji: '📅', label: 'Tage abgedeckt', value: '7/7', sub: 'Wochenplan gesetzt' },
    ],
    featuresTitle: 'Alles, was dein Gebetsleben braucht',
    featuresSub: 'Für Christen, die bewusst beten und Gottes Treue festhalten möchten.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'Gebetstagebuch', desc: 'Notiere jede Gebetsanfrage — für dich oder für andere. Füge Details hinzu, verfolge Entwicklungen und vergiss nie, für wen du gebetet hast.' },
      { icon: Calendar, color: '#059669', title: 'Wöchentlicher Gebetsplan', desc: 'Weise Kategorien den Wochentagen zu. Montag für die Familie, Dienstag für Gesundheit… jeden Tag weißt du genau, wofür du beten sollst.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galerie erhörter Gebete', desc: 'Markiere erhörte Gebete und halte dein Zeugnis fest. Erlebe Gottes Treue, die sich über die Zeit aufbaut.' },
      { icon: Globe, color: '#db2777', title: '4 Sprachen', desc: 'Vollständige Oberfläche auf Französisch, Englisch, Deutsch und Portugiesisch. Jederzeit wechselbar.' },
      { icon: Lock, color: '#6d28d9', title: 'Privat & sicher', desc: 'Deine Gebete verlassen nie deinen Account. Nur du kannst deine Daten sehen — für immer.' },
    ],
    stepsTitle: 'Wie es funktioniert',
    stepsSub: 'Vom ersten Gebet bis zu einer vollständigen Galerie erhörter Gebete — in vier einfachen Schritten.',
    steps: [
      { emoji: '✍️', title: 'Gebet hinzufügen', desc: 'Trage eine Bitte ein, weise eine Kategorie zu und notiere optional, für wen du betest.' },
      { emoji: '📅', title: 'Plan einrichten', desc: 'Weise Kategorien Tagen zu. Öffne die App jeden Morgen und sieh deine Liste für heute.' },
      { emoji: '📖', title: 'Bibelverse finden', desc: 'Nutze den Verssucher, um Bibelpassagen zu deiner Bitte zu finden — du unterscheidest, was zu dir spricht.' },
      { emoji: '🎉', title: 'Antworten festhalten', desc: 'Wenn Gott antwortet, markiere es. Füge dein Zeugnis hinzu. Kehre zurück, wann immer du Glauben brauchst.' },
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
      { q: 'Welche Sprachen werden unterstützt?', a: 'Die vollständige Oberfläche ist auf Französisch, Englisch, Deutsch und Portugiesisch verfügbar. Versvorschläge werden ebenfalls in deiner Sprache angezeigt.' },
      { q: 'Ist es kostenlos?', a: 'Ja, völlig kostenlos. Die App ist Open Source.' },
    ],
    ctaTitle: 'Starte dein Gebetstagebuch heute',
    ctaSub: 'Kostenlos, privat und in 4 Sprachen verfügbar. Melde dich in Sekunden mit Google an.',
    ctaBtn: 'Loslegen — kostenlos',
    ctaVerse: '"Betet ohne Unterlass." — 1. Thessalonicher 5:17',
    footerBuilt: 'Mit Glauben gebaut · Open Source · MIT-Lizenz',
  },
  pt: {
    signIn: 'Entrar',
    badge: 'Seu companheiro de oração pessoal',
    h1a: 'Nunca esqueça uma oração.',
    h1b: 'Registre cada resposta.',
    subtitle: 'Um diário de oração privado com um plano semanal, versículos bíblicos relevantes para cada pedido e uma galeria das orações respondidas por Deus.',
    cta: 'Começar — é grátis',
    howItWorks: 'Ver como funciona',
    verse: '"A oração fervorosa do justo é poderosa e eficaz." — Tiago 5:16',
    stats: [
      { emoji: '📋', label: 'Orações ativas', value: '12', sub: 'sendo intercedidas' },
      { emoji: '✅', label: 'Orações respondidas', value: '34', sub: 'testemunhos registrados' },
      { emoji: '📅', label: 'Dias cobertos', value: '7/7', sub: 'plano semanal definido' },
    ],
    featuresTitle: 'Tudo que sua vida de oração precisa',
    featuresSub: 'Criado para cristãos que querem orar com intenção e registrar a fidelidade de Deus.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'Diário de oração', desc: 'Registre cada pedido de oração — para você ou para outros. Adicione detalhes, acompanhe atualizações e nunca esqueça por quem prometeu orar.' },
      { icon: Calendar, color: '#059669', title: 'Plano semanal de oração', desc: 'Atribua categorias aos dias da semana. Segunda para família, terça para saúde… cada dia você sabe exatamente pelo que orar.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galeria de orações respondidas', desc: 'Marque orações como respondidas e registre seu testemunho. Veja a fidelidade de Deus se acumular ao longo do tempo.' },
      { icon: Globe, color: '#db2777', title: '4 idiomas', desc: 'Interface completa em francês, inglês, alemão e português. Mude a qualquer momento.' },
      { icon: Lock, color: '#6d28d9', title: 'Privado & seguro', desc: 'Suas orações nunca saem da sua conta. Somente você pode ver seus dados — para sempre.' },
    ],
    stepsTitle: 'Como funciona',
    stepsSub: 'Da sua primeira oração a uma galeria completa de respostas — em quatro passos simples.',
    steps: [
      { emoji: '✍️', title: 'Adicione uma oração', desc: 'Digite um pedido, atribua uma categoria e opcionalmente anote por quem está orando.' },
      { emoji: '📅', title: 'Configure seu plano', desc: 'Atribua categorias aos dias. Abra o app toda manhã e veja sua lista do dia.' },
      { emoji: '📖', title: 'Encontre as Escrituras', desc: 'Use o buscador de versículos para encontrar passagens bíblicas relacionadas ao seu pedido — você discerne o que fala à sua situação.' },
      { emoji: '🎉', title: 'Registre as respostas', desc: 'Quando Deus responder, marque. Adicione seu testemunho. Volte sempre que precisar de fé.' },
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
      { q: 'Quais idiomas são suportados?', a: 'A interface completa funciona em francês, inglês, alemão e português. As sugestões de versículos também são no seu idioma escolhido.' },
      { q: 'É gratuito?', a: 'Sim, completamente gratuito. O app é open source.' },
    ],
    ctaTitle: 'Comece seu diário de oração hoje',
    ctaSub: 'Gratuito, privado e disponível em 4 idiomas. Cadastre-se em segundos com o Google.',
    ctaBtn: 'Começar — é grátis',
    ctaVerse: '"Orai sem cessar." — 1 Tessalonicenses 5:17',
    footerBuilt: 'Feito com fé · Open source · Licença MIT',
  },

  ja: {
    signIn: 'ログイン',
    badge: 'あなたの個人的な祈りの伴侶',
    h1a: '祈りを忘れない。',
    h1b: 'すべての答えを記録する。',
    subtitle: 'プライベートな祈り日記。週間プラン、各祈りに関連する聖書の言葉、そして神が答えてくださった祈りのギャラリー付き。',
    cta: '無料で始める',
    howItWorks: '使い方を見る',
    verse: '"義人の祈りは大いに力があり、効果があります。" — ヤコブ 5:16',
    stats: [
      { emoji: '📋', label: '進行中の祈り', value: '12', sub: '執り成し中' },
      { emoji: '✅', label: '答えられた祈り', value: '34', sub: '証し記録済み' },
      { emoji: '📅', label: 'カバーされた日数', value: '7/7', sub: '週間プラン' },
    ],
    featuresTitle: '祈りの生活に必要なすべて',
    featuresSub: '意図を持って祈り、神の誠実さを記録したいクリスチャンのために作られました。',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: '祈り日記', desc: '自分や他の人のための祈りをすべて記録。詳細を追加し、経過を追い、誰のために祈ると約束したかを忘れない。' },
      { icon: Calendar, color: '#059669', title: '週間祈りプラン', desc: '各カテゴリを曜日に割り当て。月曜は家族、火曜は健康…毎朝何のために祈るかが明確にわかる。' },
      { icon: CheckCircle, color: '#0891b2', title: '答えられた祈りギャラリー', desc: '祈りを答えられたとして記録し、証しを残す。神の誠実さが時間とともに積み重なっていくのを見る。' },
      { icon: Globe, color: '#db2777', title: '16言語', desc: 'フランス語、英語、ドイツ語、ポルトガル語、中国語、スペイン語、ヒンディー語、日本語、スワヒリ語、アムハラ語、インドネシア語、タガログ語、韓国語、ロシア語、アラビア語、ペルシア語に完全対応。' },
      { icon: Lock, color: '#6d28d9', title: 'プライベート＆安全', desc: 'あなたの祈りはアカウントの外に出ることはありません。あなただけが自分のデータを見ることができます。' },
    ],
    stepsTitle: '使い方',
    stepsSub: '最初の祈りから、答えられた祈りの完全なギャラリーまで — 4つの簡単なステップで。',
    steps: [
      { emoji: '✍️', title: '祈りを追加', desc: 'リクエストを入力し、カテゴリを割り当て、誰のためかを任意で記録。' },
      { emoji: '📅', title: 'プランを設定', desc: 'カテゴリを曜日に割り当て。毎朝アプリを開いて今日のリストを確認。' },
      { emoji: '📖', title: '聖書の言葉を探す', desc: '聖句検索機能で、あなたの祈りに関連する聖書の箇所を見つける — あなたの状況に語りかけるものを識別する。' },
      { emoji: '🎉', title: '答えを記録', desc: '神が答えてくださったら、記録する。証しを追加する。信仰が必要な時に振り返る。' },
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
    ctaBtn: '無料で始める',
    ctaVerse: '"絶えず祈りなさい。" — 1テサロニケ 5:17',
    footerBuilt: '信仰で作られた · オープンソース · MITライセンス',
  },

  sw: {
    signIn: 'Ingia',
    badge: 'Msaidizi wako wa kibinafsi wa maombi',
    h1a: 'Usisahau maombi yoyote.',
    h1b: 'Rekodi kila jibu.',
    subtitle: 'Jarida la maombi la kibinafsi lenye mpango wa wiki, mistari ya Biblia inayohusiana na kila ombi, na galeria ya maombi yaliyojibiwa na Mungu.',
    cta: 'Anza — ni bure',
    howItWorks: 'Angalia jinsi inavyofanya kazi',
    verse: '"Maombi ya mtu mwenye haki yana nguvu nyingi." — Yakobo 5:16',
    stats: [
      { emoji: '📋', label: 'Maombi yanayoendelea', value: '12', sub: 'katika uombezi' },
      { emoji: '✅', label: 'Maombi yaliyojibiwa', value: '34', sub: 'ushuhuda umerekodiwa' },
      { emoji: '📅', label: 'Siku zilizofunikwa', value: '7/7', sub: 'mpango wa wiki' },
    ],
    featuresTitle: 'Kila kitu maisha yako ya maombi yanahitaji',
    featuresSub: 'Imeundwa kwa Wakristo wanaotaka kuomba kwa makusudi na kufuatilia uaminifu wa Mungu.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'Jarida la maombi', desc: 'Rekodi kila ombi — kwa ajili yako au wengine. Ongeza maelezo, fuatilia maendeleo, usisahau uliyomwahidi kuomba.' },
      { icon: Calendar, color: '#059669', title: 'Mpango wa maombi wa wiki', desc: 'Weka kila kundi kwa siku za wiki. Jumatatu kwa familia, Jumanne kwa afya… kila siku unajua hasa unaomba nini.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galeria ya maombi yaliyojibiwa', desc: 'Weka alama maombi kama yaliyojibiwa na rekodi ushuhuda wako. Angalia uaminifu wa Mungu ukikusanyika baada ya muda.' },
      { icon: Globe, color: '#db2777', title: 'Lugha 16', desc: 'Kiswahili, Kiingereza, Kifaransa, na lugha nyingine 13. Badilisha wakati wowote.' },
      { icon: Lock, color: '#6d28d9', title: 'Ya siri na salama', desc: 'Maombi yako hayatoki kamwe katika akaunti yako. Wewe peke yako unaweza kuona data yako.' },
    ],
    stepsTitle: 'Jinsi inavyofanya kazi',
    stepsSub: 'Kutoka ombi lako la kwanza hadi galeria kamili ya majibu — katika hatua nne rahisi.',
    steps: [
      { emoji: '✍️', title: 'Ongeza ombi', desc: 'Andika ombi, weka kundi, na kwa hiari andika ni kwa nani.' },
      { emoji: '📅', title: 'Weka mpango wako', desc: 'Weka makundi kwa siku. Fungua app kila asubuhi na uone orodha ya leo.' },
      { emoji: '📖', title: 'Tafuta Maandiko', desc: 'Tumia kitafuta cha mistari kupata vifungu vya Biblia vinavyohusiana na ombi lako.' },
      { emoji: '🎉', title: 'Rekodi majibu', desc: 'Mungu anapojibu, iweke alama. Ongeza ushuhuda wako. Rudi kwake unapohitaji imani.' },
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
    ctaBtn: 'Anza — ni bure',
    ctaVerse: '"Ombeni bila kukoma." — 1 Wathesalonike 5:17',
    footerBuilt: 'Imejengwa kwa imani · Chanzo wazi · Leseni ya MIT',
  },

  am: {
    signIn: 'ግባ',
    badge: 'የእርስዎ የጸሎት ጓደኛ',
    h1a: 'ምንም ጸሎት አይርሱ።',
    h1b: 'እያንዳንዱ መልስ ይዝግቡ።',
    subtitle: 'የሳምንት እቅድ፣ ለእያንዳንዱ ጸሎት ተዛማጅ የቅዱስ ቃሎች፣ እና እግዚአብሔር የመለሳቸው ጸሎቶች ማሳያ ያለው የጸሎት ዕለታዊ ጆርናል።',
    cta: 'ይጀምሩ — ነፃ ነው',
    howItWorks: 'እንዴት እንደሚሰራ ይመልከቱ',
    verse: '"የጻድቅ ሰው ጸሎት ብዙ ያደርጋል።" — ያዕቆብ 5:16',
    stats: [
      { emoji: '📋', label: 'ንቁ ጸሎቶች', value: '12', sub: 'በምልጃ' },
      { emoji: '✅', label: 'የተመለሱ ጸሎቶች', value: '34', sub: 'ምስክርነቶች ተዘጋጅቷል' },
      { emoji: '📅', label: 'የተሸፈኑ ቀናት', value: '7/7', sub: 'የሳምንት እቅድ' },
    ],
    featuresTitle: 'የጸሎት ሕይወትዎ የሚያስፈልገው ሁሉ',
    featuresSub: 'ዓላማ ይዘው ለሚጸልዩ እና የእግዚአብሔርን ታማኝነት ለሚከታተሉ ክርስቲያኖች የተዘጋጀ።',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'የጸሎት ዕለታዊ ጆርናል', desc: 'ለራስዎ ወይም ለሌሎች የሚደረጉ ጸሎቶችን ሁሉ ይዝግቡ። ዝርዝሮችን ያክሉ፣ ሂደቱን ይከታተሉ።' },
      { icon: Calendar, color: '#059669', title: 'የሳምንት የጸሎት እቅድ', desc: 'እያንዳንዱ ምድብ ለሳምንቱ ቀናት ይመድቡ። ሰኞ ለቤተሰብ፣ ማክሰኞ ለጤና… ሁሉ ቀን ምን ማድረግ እንዳለቦት ያውቃሉ።' },
      { icon: CheckCircle, color: '#0891b2', title: 'የተመለሱ ጸሎቶች ማሳያ', desc: 'ጸሎቶችን እንደ ተመለሱ ምልክት አድርጉ እና ምስክርነትዎን ይዝግቡ። የእግዚአብሔር ታማኝነት ከጊዜ ወደ ጊዜ ሲሰበሰብ ይመልከቱ።' },
      { icon: Globe, color: '#db2777', title: '16 ቋንቋዎች', desc: 'አማርኛ፣ እንግሊዝኛ፣ ፈረንሳይኛ እና ሌሎች 13 ቋንቋዎች። በማንኛውም ጊዜ ይቀይሩ።' },
      { icon: Lock, color: '#6d28d9', title: 'የግል እና ደህንነቱ የተጠበቀ', desc: 'ጸሎቶችዎ ከመለያዎ ፈጽሞ አይወጡም። እርስዎ ብቻ ውሂብዎን ማየት ይችላሉ።' },
    ],
    stepsTitle: 'እንዴት እንደሚሰራ',
    stepsSub: 'ከመጀመሪያ ጸሎት እስከ ሙሉ ማሳያ — በአራት ቀላል ደረጃዎች።',
    steps: [
      { emoji: '✍️', title: 'ጸሎት ያክሉ', desc: 'ጥያቄ ያስገቡ፣ ምድብ ይወስኑ፣ ለማን እንደሆነ ይዝግቡ።' },
      { emoji: '📅', title: 'እቅድዎን ያዘጋጁ', desc: 'ምድቦችን ለቀናት ይመድቡ። ሁሉ ቀን ዕለቱን ዝርዝር ይመልከቱ።' },
      { emoji: '📖', title: 'ቅዱሳት መጻሕፍት ይፈልጉ', desc: 'ለጸሎትዎ ተዛማጅ የቅዱስ ቃሎችን ለማግኘት ቁጥር ፈላጊውን ይጠቀሙ።' },
      { emoji: '🎉', title: 'መልሶችን ይዝግቡ', desc: 'እግዚአብሔር ሲመልስ፣ ምልክት ያድርጉ። ምስክርነትዎን ያክሉ። እምነት ሲያስፈልጋችሁ ተመልሱ።' },
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
    ctaBtn: 'ይጀምሩ — ነፃ ነው',
    ctaVerse: '"ሳታቋርጡ ጸልዩ።" — 1ኛ ተሰሎንቄ 5:17',
    footerBuilt: 'በእምነት ተሠርቷል · ክፍት ምንጭ · MIT ፍቃድ',
  },

  id: {
    signIn: 'Masuk',
    badge: 'Teman doa pribadi Anda',
    h1a: 'Jangan pernah lupa berdoa.',
    h1b: 'Catat setiap jawaban.',
    subtitle: 'Jurnal doa pribadi dengan rencana mingguan, ayat Alkitab yang relevan untuk setiap permohonan, dan galeri doa yang telah dijawab Tuhan.',
    cta: 'Mulai — gratis',
    howItWorks: 'Lihat cara kerjanya',
    verse: '"Doa orang yang benar, bila dengan yakin didoakan, sangat besar kuasanya." — Yakobus 5:16',
    stats: [
      { emoji: '📋', label: 'Doa aktif', value: '12', sub: 'dalam syafaat' },
      { emoji: '✅', label: 'Doa terjawab', value: '34', sub: 'kesaksian tercatat' },
      { emoji: '📅', label: 'Hari tercakup', value: '7/7', sub: 'rencana mingguan' },
    ],
    featuresTitle: 'Semua yang dibutuhkan kehidupan doa Anda',
    featuresSub: 'Dirancang untuk orang Kristen yang ingin berdoa dengan niat dan melacak kesetiaan Tuhan.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'Jurnal doa', desc: 'Catat setiap permohonan doa — untuk diri sendiri atau orang lain. Tambahkan detail, pantau perkembangan, dan jangan lupakan siapa yang Anda janjikan untuk doakan.' },
      { icon: Calendar, color: '#059669', title: 'Rencana doa mingguan', desc: 'Tetapkan kategori ke hari-hari dalam seminggu. Senin untuk keluarga, Selasa untuk kesehatan… setiap pagi Anda tahu persis untuk apa berdoa.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galeri doa terjawab', desc: 'Tandai doa sebagai terjawab dan catat kesaksian Anda. Saksikan kesetiaan Tuhan bertambah dari waktu ke waktu.' },
      { icon: Globe, color: '#db2777', title: '16 bahasa', desc: 'Bahasa Indonesia, Inggris, Prancis, dan 13 bahasa lainnya. Ganti kapan saja.' },
      { icon: Lock, color: '#6d28d9', title: 'Pribadi & aman', desc: 'Doa Anda tidak pernah keluar dari akun Anda. Hanya Anda yang bisa melihat data Anda.' },
    ],
    stepsTitle: 'Cara kerjanya',
    stepsSub: 'Dari doa pertama hingga galeri lengkap yang terjawab — dalam empat langkah mudah.',
    steps: [
      { emoji: '✍️', title: 'Tambah doa', desc: 'Ketik permohonan, pilih kategori, dan opsional catat untuk siapa.' },
      { emoji: '📅', title: 'Atur rencana', desc: 'Tetapkan kategori ke hari. Buka app setiap pagi dan lihat daftar hari ini.' },
      { emoji: '📖', title: 'Temukan Firman', desc: 'Gunakan pencari ayat untuk menemukan bagian Alkitab terkait permohonan Anda.' },
      { emoji: '🎉', title: 'Catat jawaban', desc: 'Ketika Tuhan menjawab, tandai. Tambahkan kesaksian. Kembali saat butuh iman.' },
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
    ctaBtn: 'Mulai — gratis',
    ctaVerse: '"Berdoalah tanpa henti." — 1 Tesalonika 5:17',
    footerBuilt: 'Dibangun dengan iman · Open source · Lisensi MIT',
  },

  tl: {
    signIn: 'Mag-sign in',
    badge: 'Ang iyong personal na kasama sa panalangin',
    h1a: 'Huwag kalimutang manalangin.',
    h1b: 'Itala ang bawat sagot.',
    subtitle: 'Isang pribadong talaarawan ng panalangin na may lingguhang plano, mga talata ng Bibliya para sa bawat petisyon, at isang galeriya ng mga panalanging sinagot ng Diyos.',
    cta: 'Magsimula — libre',
    howItWorks: 'Tingnan kung paano gumagana',
    verse: '"Ang taimtim na panalangin ng taong matuwid ay may malaking kapangyarihan." — Santiago 5:16',
    stats: [
      { emoji: '📋', label: 'Aktibong panalangin', value: '12', sub: 'sa pamamagitan ng panalangin' },
      { emoji: '✅', label: 'Nasagot na panalangin', value: '34', sub: 'naitala na patotoo' },
      { emoji: '📅', label: 'Mga araw na sakop', value: '7/7', sub: 'lingguhang plano' },
    ],
    featuresTitle: 'Lahat ng kailangan ng iyong buhay-panalangin',
    featuresSub: 'Ginawa para sa mga Kristiyano na gustong manalangin nang may layunin at subaybayan ang katapatan ng Diyos.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'Talaarawan ng panalangin', desc: 'Itala ang bawat kahilingan sa panalangin — para sa iyong sarili o para sa iba. Magdagdag ng mga detalye at huwag kalimutang sino ang ipinangako mong ipanalangin.' },
      { icon: Calendar, color: '#059669', title: 'Lingguhang plano ng panalangin', desc: 'Italaga ang mga kategorya sa mga araw ng linggo. Lunes para sa pamilya, Martes para sa kalusugan… araw-araw alam mo kung para saan ka magdarasal.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galeriya ng nasagot na panalangin', desc: 'Markahan ang mga panalangin bilang nasagot at itala ang iyong patotoo. Panoorin ang katapatan ng Diyos na mag-ipon sa paglipas ng panahon.' },
      { icon: Globe, color: '#db2777', title: '16 na wika', desc: 'Tagalog, Ingles, Pranses, at 13 pang wika. Palitan anumang oras.' },
      { icon: Lock, color: '#6d28d9', title: 'Pribado at ligtas', desc: 'Ang iyong mga panalangin ay hindi kailanman lalabas sa iyong account. Ikaw lang ang makakakita ng iyong data.' },
    ],
    stepsTitle: 'Paano gumagana',
    stepsSub: 'Mula sa iyong unang panalangin hanggang sa kumpletong galeriya ng mga sagot — sa apat na simpleng hakbang.',
    steps: [
      { emoji: '✍️', title: 'Magdagdag ng panalangin', desc: 'Mag-type ng petisyon, pumili ng kategorya, at opsyonal na itala kung para kanino.' },
      { emoji: '📅', title: 'Itakda ang iyong plano', desc: 'Italaga ang mga kategorya sa mga araw. Buksan ang app tuwing umaga at tingnan ang listahan ngayon.' },
      { emoji: '📖', title: 'Hanapin ang Kasulatan', desc: 'Gamitin ang tagahanap ng talata para matuklasan ang mga talata ng Bibliya na may kaugnayan sa iyong kahilingan.' },
      { emoji: '🎉', title: 'Itala ang mga sagot', desc: 'Kapag sumagot ang Diyos, markahan ito. Idagdag ang iyong patotoo. Bumalik dito kapag kailangan mo ng pananampalataya.' },
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
    ctaBtn: 'Magsimula — libre',
    ctaVerse: '"Manalangin kayo nang walang humpay." — 1 Tesalonica 5:17',
    footerBuilt: 'Itinayo nang may pananampalataya · Open source · MIT License',
  },

  ko: {
    signIn: '로그인',
    badge: '나만의 기도 동반자',
    h1a: '기도를 절대 잊지 마세요.',
    h1b: '모든 응답을 기록하세요.',
    subtitle: '주간 계획, 각 기도를 위한 관련 성경 말씀, 그리고 하나님이 응답하신 기도들의 갤러리가 있는 개인 기도 일기.',
    cta: '시작하기 — 무료',
    howItWorks: '어떻게 작동하는지 보기',
    verse: '"의인의 간구는 역사하는 힘이 큼이니라." — 야고보서 5:16',
    stats: [
      { emoji: '📋', label: '진행 중인 기도', value: '12', sub: '중보기도 중' },
      { emoji: '✅', label: '응답된 기도', value: '34', sub: '간증 기록됨' },
      { emoji: '📅', label: '커버된 일수', value: '7/7', sub: '주간 계획' },
    ],
    featuresTitle: '기도 생활에 필요한 모든 것',
    featuresSub: '의도적으로 기도하고 하나님의 신실하심을 기록하고 싶은 그리스도인을 위해 만들어졌습니다.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: '기도 일기', desc: '나 자신과 다른 사람을 위한 모든 기도 요청을 기록하세요. 세부 내용을 추가하고, 경과를 추적하고, 기도하겠다고 약속한 사람을 잊지 마세요.' },
      { icon: Calendar, color: '#059669', title: '주간 기도 계획', desc: '각 카테고리를 요일에 배정하세요. 월요일은 가족, 화요일은 건강… 매일 아침 무엇을 위해 기도해야 할지 정확히 알 수 있습니다.' },
      { icon: CheckCircle, color: '#0891b2', title: '응답된 기도 갤러리', desc: '기도를 응답됨으로 표시하고 간증을 기록하세요. 시간이 지남에 따라 하나님의 신실하심이 쌓이는 것을 보세요.' },
      { icon: Globe, color: '#db2777', title: '16개 언어', desc: '한국어, 영어, 프랑스어 등 16개 언어를 완벽 지원합니다. 언제든지 전환하세요.' },
      { icon: Lock, color: '#6d28d9', title: '비공개 및 안전', desc: '당신의 기도는 계정 밖으로 절대 나가지 않습니다. 오직 당신만이 자신의 데이터를 볼 수 있습니다.' },
    ],
    stepsTitle: '작동 방법',
    stepsSub: '첫 번째 기도부터 응답된 기도의 완전한 갤러리까지 — 네 가지 간단한 단계로.',
    steps: [
      { emoji: '✍️', title: '기도 추가', desc: '요청을 입력하고, 카테고리를 선택하고, 선택적으로 누구를 위한 것인지 기록하세요.' },
      { emoji: '📅', title: '계획 설정', desc: '카테고리를 요일에 배정하세요. 매일 아침 앱을 열고 오늘의 목록을 확인하세요.' },
      { emoji: '📖', title: '성경 말씀 찾기', desc: '구절 검색기를 사용하여 기도 요청과 관련된 성경 구절을 찾으세요.' },
      { emoji: '🎉', title: '응답 기록', desc: '하나님이 응답하시면 표시하세요. 간증을 추가하세요. 믿음이 필요할 때 돌아보세요.' },
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
    ctaBtn: '시작하기 — 무료',
    ctaVerse: '"쉬지 말고 기도하라." — 데살로니가전서 5:17',
    footerBuilt: '믿음으로 만들어짐 · 오픈 소스 · MIT 라이선스',
  },

  ru: {
    signIn: 'Войти',
    badge: 'Ваш личный молитвенный помощник',
    h1a: 'Никогда не забывайте молитву.',
    h1b: 'Записывайте каждый ответ.',
    subtitle: 'Личный молитвенный журнал с недельным планом, актуальными библейскими стихами для каждой просьбы и галереей отвеченных молитв.',
    cta: 'Начать — бесплатно',
    howItWorks: 'Посмотреть, как работает',
    verse: '"Много может усиленная молитва праведного." — Иакова 5:16',
    stats: [
      { emoji: '📋', label: 'Активные молитвы', value: '12', sub: 'в ходатайстве' },
      { emoji: '✅', label: 'Отвеченные молитвы', value: '34', sub: 'свидетельств записано' },
      { emoji: '📅', label: 'Охваченных дней', value: '7/7', sub: 'недельный план' },
    ],
    featuresTitle: 'Всё для вашей молитвенной жизни',
    featuresSub: 'Создано для христиан, которые хотят молиться осознанно и отслеживать верность Бога.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'Молитвенный журнал', desc: 'Записывайте каждую молитвенную просьбу — за себя или за других. Добавляйте детали, отслеживайте изменения, не забывайте, за кого обещали молиться.' },
      { icon: Calendar, color: '#059669', title: 'Недельный молитвенный план', desc: 'Назначайте категории на дни недели. Понедельник — для семьи, вторник — для здоровья… каждое утро вы знаете, о чём именно молиться.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Галерея отвеченных молитв', desc: 'Отмечайте молитвы как отвеченные и записывайте свидетельство. Наблюдайте, как верность Бога накапливается со временем.' },
      { icon: Globe, color: '#db2777', title: '16 языков', desc: 'Русский, английский, французский и ещё 13 языков. Меняйте в любой момент.' },
      { icon: Lock, color: '#6d28d9', title: 'Приватно и безопасно', desc: 'Ваши молитвы никогда не покидают ваш аккаунт. Только вы можете видеть свои данные.' },
    ],
    stepsTitle: 'Как это работает',
    stepsSub: 'От первой молитвы до полной галереи ответов — в четыре простых шага.',
    steps: [
      { emoji: '✍️', title: 'Добавьте молитву', desc: 'Введите просьбу, выберите категорию, при желании укажите, за кого молитесь.' },
      { emoji: '📅', title: 'Настройте план', desc: 'Назначьте категории на дни. Открывайте приложение каждое утро и смотрите список на сегодня.' },
      { emoji: '📖', title: 'Найдите Писание', desc: 'Используйте поиск стихов, чтобы найти библейские места, связанные с вашей просьбой.' },
      { emoji: '🎉', title: 'Записывайте ответы', desc: 'Когда Бог отвечает — отмечайте. Добавляйте свидетельство. Возвращайтесь, когда нужна вера.' },
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
    ctaBtn: 'Начать — бесплатно',
    ctaVerse: '"Непрестанно молитесь." — 1 Фессалоникийцам 5:17',
    footerBuilt: 'Создано с верой · Открытый исходный код · Лицензия MIT',
  },

  ar: {
    signIn: 'تسجيل الدخول',
    badge: 'رفيقك الشخصي في الصلاة',
    h1a: 'لا تنسَ أي صلاة.',
    h1b: 'سجّل كل إجابة.',
    subtitle: 'مجلة صلاة خاصة بخطة أسبوعية، آيات كتابية ذات صلة لكل طلب، وغاليري من الصلوات التي أجاب عليها الله.',
    cta: 'ابدأ — مجاناً',
    howItWorks: 'اطلع على طريقة العمل',
    verse: '"صلاة البار تقتدر كثيراً في فعلها." — يعقوب 5:16',
    stats: [
      { emoji: '📋', label: 'الصلوات النشطة', value: '12', sub: 'في الشفاعة' },
      { emoji: '✅', label: 'الصلوات المستجابة', value: '34', sub: 'شهادات مسجلة' },
      { emoji: '📅', label: 'الأيام المشمولة', value: '7/7', sub: 'الخطة الأسبوعية' },
    ],
    featuresTitle: 'كل ما يحتاجه حياتك الصلاتية',
    featuresSub: 'صُمِّم للمسيحيين الذين يريدون الصلاة بنية وتتبع أمانة الله.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'مجلة الصلاة', desc: 'سجّل كل طلب صلاة — من أجلك أو من أجل الآخرين. أضف تفاصيل وتابع التحديثات ولا تنسَ من وعدت بالصلاة عنه.' },
      { icon: Calendar, color: '#059669', title: 'خطة الصلاة الأسبوعية', desc: 'خصّص كل فئة لأيام الأسبوع. الاثنين للعائلة، الثلاثاء للصحة… كل صباح تعرف بالضبط لماذا تصلي.' },
      { icon: CheckCircle, color: '#0891b2', title: 'غاليري الصلوات المستجابة', desc: 'علّم الصلوات كمستجابة وسجّل شهادتك. شاهد أمانة الله تتراكم عبر الزمن.' },
      { icon: Globe, color: '#db2777', title: '16 لغة', desc: 'العربية والإنجليزية والفرنسية و13 لغة أخرى. غيّر في أي وقت.' },
      { icon: Lock, color: '#6d28d9', title: 'خاص وآمن', desc: 'صلواتك لا تغادر حسابك أبداً. أنت وحدك من يمكنه رؤية بياناتك.' },
    ],
    stepsTitle: 'كيف يعمل',
    stepsSub: 'من أول صلاة إلى غاليري كامل من الإجابات — في أربع خطوات بسيطة.',
    steps: [
      { emoji: '✍️', title: 'أضف صلاة', desc: 'اكتب طلباً، اختر فئة، وسجّل اختيارياً لمن هي.' },
      { emoji: '📅', title: 'ضع خطتك', desc: 'خصّص الفئات للأيام. افتح التطبيق كل صباح وانظر قائمة اليوم.' },
      { emoji: '📖', title: 'ابحث في الكتاب', desc: 'استخدم باحث الآيات للعثور على مقاطع كتابية مرتبطة بطلبك.' },
      { emoji: '🎉', title: 'سجّل الإجابات', desc: 'عندما يجيب الله، علّم ذلك. أضف شهادتك. عُد إليها حين تحتاج الإيمان.' },
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
    ctaBtn: 'ابدأ — مجاناً',
    ctaVerse: '"صلوا بلا انقطاع." — 1 تسالونيكي 5:17',
    footerBuilt: 'مبني بإيمان · مفتوح المصدر · رخصة MIT',
  },

  fa: {
    signIn: 'ورود',
    badge: 'همراه شخصی شما در دعا',
    h1a: 'هیچ دعایی را فراموش نکنید.',
    h1b: 'هر پاسخی را ثبت کنید.',
    subtitle: 'یک دفترچه دعای شخصی با برنامه هفتگی، آیات کتاب مقدس مرتبط با هر درخواست، و گالری دعاهای مستجاب‌شده توسط خداوند.',
    cta: 'شروع کنید — رایگان',
    howItWorks: 'ببینید چطور کار می‌کند',
    verse: '"دعای مرد عادل تأثیر عظیمی دارد." — یعقوب ۵:۱۶',
    stats: [
      { emoji: '📋', label: 'دعاهای فعال', value: '12', sub: 'در شفاعت' },
      { emoji: '✅', label: 'دعاهای مستجاب', value: '34', sub: 'شهادت ثبت شده' },
      { emoji: '📅', label: 'روزهای پوشش‌داده', value: '7/7', sub: 'برنامه هفتگی' },
    ],
    featuresTitle: 'همه چیزی که زندگی دعایی شما نیاز دارد',
    featuresSub: 'برای مسیحیانی ساخته شده که می‌خواهند با هدف دعا کنند و وفاداری خدا را پیگیری کنند.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'دفترچه دعا', desc: 'هر درخواست دعا را ثبت کنید — برای خودتان یا دیگران. جزئیات اضافه کنید و فراموش نکنید برای چه کسی قول دعا داده‌اید.' },
      { icon: Calendar, color: '#059669', title: 'برنامه دعای هفتگی', desc: 'هر دسته‌بندی را به روزهای هفته اختصاص دهید. دوشنبه برای خانواده، سه‌شنبه برای سلامتی… هر صبح می‌دانید برای چه دعا کنید.' },
      { icon: CheckCircle, color: '#0891b2', title: 'گالری دعاهای مستجاب', desc: 'دعاها را به عنوان مستجاب علامت بزنید و شهادت خود را ثبت کنید. وفاداری خدا را در طول زمان انباشته شده ببینید.' },
      { icon: Globe, color: '#db2777', title: '۱۶ زبان', desc: 'فارسی، انگلیسی، فرانسوی و ۱۳ زبان دیگر. هر زمان تغییر دهید.' },
      { icon: Lock, color: '#6d28d9', title: 'خصوصی و امن', desc: 'دعاهای شما هرگز از حساب شما خارج نمی‌شوند. فقط شما می‌توانید داده‌های خود را ببینید.' },
    ],
    stepsTitle: 'چطور کار می‌کند',
    stepsSub: 'از اولین دعا تا گالری کامل پاسخ‌ها — در چهار مرحله ساده.',
    steps: [
      { emoji: '✍️', title: 'دعا اضافه کنید', desc: 'درخواستی بنویسید، دسته‌بندی انتخاب کنید، و اختیاری بنویسید برای کیست.' },
      { emoji: '📅', title: 'برنامه‌تان را تنظیم کنید', desc: 'دسته‌بندی‌ها را به روزها اختصاص دهید. هر صبح اپ را باز کنید و لیست امروز را ببینید.' },
      { emoji: '📖', title: 'کلام پیدا کنید', desc: 'از جستجوگر آیات استفاده کنید تا آیات کتاب مقدس مرتبط با درخواست‌تان را بیابید.' },
      { emoji: '🎉', title: 'پاسخ‌ها را ثبت کنید', desc: 'وقتی خدا پاسخ داد، علامت بزنید. شهادت خود را اضافه کنید. وقتی به ایمان نیاز دارید برگردید.' },
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
    ctaBtn: 'شروع کنید — رایگان',
    ctaVerse: '"پیوسته دعا کنید." — اول تسالونیکیان ۵:۱۷',
    footerBuilt: 'ساخته شده با ایمان · متن‌باز · مجوز MIT',
  },

  zh: {
    signIn: '登录',
    badge: '您的个人祷告伴侣',
    h1a: '不忘记任何一个祷告。',
    h1b: '记录每一个回应。',
    subtitle: '一个私密的祷告日记，配有每周计划、相关圣经经文，以及上帝应允祷告的见证册。',
    cta: '免费开始',
    howItWorks: '查看如何使用',
    verse: '"义人祈祷所发的力量是大有功效的。" — 雅各书 5:16',
    stats: [
      { emoji: '📋', label: '活跃祷告', value: '12', sub: '正在代祷' },
      { emoji: '✅', label: '已应允祷告', value: '34', sub: '见证已记录' },
      { emoji: '📅', label: '覆盖天数', value: '7/7', sub: '每周计划' },
    ],
    featuresTitle: '您祷告生活所需的一切',
    featuresSub: '专为希望有意识地祷告并追踪上帝信实的基督徒设计。',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: '祷告日记', desc: '记录每个祷告请求——为自己或他人。添加详情、跟踪进展，不忘记任何一个承诺代祷的人。' },
      { icon: Calendar, color: '#059669', title: '每周祷告计划', desc: '为每天分配祷告类别。周一为家庭，周二为健康……每天清晰地知道要为什么祷告。' },
      { icon: CheckCircle, color: '#0891b2', title: '已应允祷告见证册', desc: '将祷告标记为已应允并记录您的见证。看着上帝的信实在您的个人册中积累。' },
      { icon: Globe, color: '#db2777', title: '7种语言', desc: '完整支持法语、英语、德语、葡萄牙语、中文、西班牙语和印地语。随时切换。' },
      { icon: Lock, color: '#6d28d9', title: '私密且安全', desc: '您的祷告永远不会离开您的账户。行级安全意味着只有您才能看到您的数据。' },
    ],
    stepsTitle: '使用方法',
    stepsSub: '从第一个祷告到完整的应允见证册——四个简单步骤。',
    steps: [
      { emoji: '✍️', title: '添加祷告', desc: '输入请求，分配类别，并可注明代祷对象。' },
      { emoji: '📅', title: '设置计划', desc: '为每天分配类别。每天早上打开应用查看当天的祷告列表。' },
      { emoji: '📖', title: '查找经文', desc: '使用经文查找器搜索与您请求相关的圣经段落——由您辨别什么话语对您的情况有用。' },
      { emoji: '🎉', title: '记录回应', desc: '当上帝回应时，标记它。添加您的见证。在需要信心时回顾它。' },
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
      { q: '支持哪些语言？', a: '完整界面支持法语、英语、德语、葡萄牙语、中文、西班牙语和印地语。' },
      { q: '是免费的吗？', a: '是的，完全免费。该应用是开源的。' },
    ],
    ctaTitle: '今天开始您的祷告日记',
    ctaSub: '免费、私密，支持7种语言。用Google几秒钟即可注册。',
    ctaBtn: '免费开始',
    ctaVerse: '"不住地祷告。" — 帖撒罗尼迦前书 5:17',
    footerBuilt: '以信仰建造 · 开源 · MIT许可证',
  },

  es: {
    signIn: 'Iniciar sesión',
    badge: 'Tu compañero personal de oración',
    h1a: 'Nunca olvides una oración.',
    h1b: 'Registra cada respuesta.',
    subtitle: 'Un diario de oración privado con un plan semanal, versículos bíblicos relevantes para cada petición y una galería de oraciones respondidas por Dios.',
    cta: 'Comenzar — es gratis',
    howItWorks: 'Ver cómo funciona',
    verse: '"La oración ferviente del justo puede mucho." — Santiago 5:16',
    stats: [
      { emoji: '📋', label: 'Oraciones activas', value: '12', sub: 'en intercesión' },
      { emoji: '✅', label: 'Oraciones respondidas', value: '34', sub: 'testimonios registrados' },
      { emoji: '📅', label: 'Días cubiertos', value: '7/7', sub: 'plan semanal' },
    ],
    featuresTitle: 'Todo lo que tu vida de oración necesita',
    featuresSub: 'Diseñado para cristianos que quieren orar con intención y registrar la fidelidad de Dios.',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'Diario de oración', desc: 'Registra cada petición de oración — para ti o para otros. Añade detalles, haz seguimiento y nunca olvides por quién prometiste orar.' },
      { icon: Calendar, color: '#059669', title: 'Plan de oración semanal', desc: 'Asigna categorías a días de la semana. Lunes para familia, martes para salud… cada mañana sabes exactamente por qué orar.' },
      { icon: CheckCircle, color: '#0891b2', title: 'Galería de oraciones respondidas', desc: 'Marca las oraciones como respondidas y registra tu testimonio. Observa la fidelidad de Dios acumularse con el tiempo.' },
      { icon: Globe, color: '#db2777', title: '7 idiomas', desc: 'Interfaz completa en francés, inglés, alemán, portugués, chino, español e hindi. Cambia cuando quieras.' },
      { icon: Lock, color: '#6d28d9', title: 'Privado y seguro', desc: 'Tus oraciones nunca salen de tu cuenta. La seguridad por filas significa que solo tú puedes ver tus datos — siempre.' },
    ],
    stepsTitle: 'Cómo funciona',
    stepsSub: 'Desde tu primera oración hasta una galería completa de respuestas — en cuatro pasos simples.',
    steps: [
      { emoji: '✍️', title: 'Añade una oración', desc: 'Escribe una petición, asigna una categoría y opcionalmente anota por quién es.' },
      { emoji: '📅', title: 'Configura tu plan', desc: 'Asigna categorías a días. Abre la app cada mañana y ve la lista de hoy.' },
      { emoji: '📖', title: 'Encuentra las Escrituras', desc: 'Usa el buscador de versículos para encontrar pasajes bíblicos relacionados con tu petición — tú disciernes lo que habla a tu situación.' },
      { emoji: '🎉', title: 'Registra las respuestas', desc: 'Cuando Dios responda, márcalo. Añade tu testimonio. Vuelve a él cuando necesites fe.' },
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
      { q: '¿Qué idiomas están disponibles?', a: 'La interfaz completa funciona en francés, inglés, alemán, portugués, chino, español e hindi.' },
      { q: '¿Es gratuito?', a: 'Sí, completamente gratuito. La aplicación es de código abierto.' },
    ],
    ctaTitle: 'Comienza tu diario de oración hoy',
    ctaSub: 'Gratis, privado y disponible en 7 idiomas. Regístrate en segundos con Google.',
    ctaBtn: 'Comenzar — es gratis',
    ctaVerse: '"Orad sin cesar." — 1 Tesalonicenses 5:17',
    footerBuilt: 'Hecho con fe · Código abierto · Licencia MIT',
  },

  hi: {
    signIn: 'साइन इन करें',
    badge: 'आपका व्यक्तिगत प्रार्थना साथी',
    h1a: 'कोई भी प्रार्थना न भूलें।',
    h1b: 'हर उत्तर को दर्ज करें।',
    subtitle: 'एक निजी प्रार्थना पत्रिका जिसमें साप्ताहिक योजना, हर प्रार्थना के लिए प्रासंगिक बाइबल वचन, और परमेश्वर की उत्तर मिली प्रार्थनाओं की गैलरी है।',
    cta: 'शुरू करें — यह मुफ्त है',
    howItWorks: 'देखें यह कैसे काम करता है',
    verse: '"धर्मी जन की प्रार्थना के प्रभाव से बहुत कुछ हो सकता है।" — याकूब 5:16',
    stats: [
      { emoji: '📋', label: 'सक्रिय प्रार्थनाएँ', value: '12', sub: 'मध्यस्थता में' },
      { emoji: '✅', label: 'उत्तर मिली प्रार्थनाएँ', value: '34', sub: 'गवाहियाँ दर्ज' },
      { emoji: '📅', label: 'दिन कवर किए', value: '7/7', sub: 'साप्ताहिक योजना' },
    ],
    featuresTitle: 'आपके प्रार्थना जीवन की सब कुछ ज़रूरतें',
    featuresSub: 'उन मसीहियों के लिए बनाया गया जो उद्देश्य से प्रार्थना करना और परमेश्वर की विश्वसनीयता को ट्रैक करना चाहते हैं।',
    features: [
      { icon: BookOpen, color: '#7c5cfc', title: 'प्रार्थना पत्रिका', desc: 'हर प्रार्थना अनुरोध दर्ज करें — अपने लिए या दूसरों के लिए। विवरण जोड़ें, अनुवर्ती करें, और कभी न भूलें कि आपने किसके लिए प्रार्थना का वादा किया था।' },
      { icon: Calendar, color: '#059669', title: 'साप्ताहिक प्रार्थना योजना', desc: 'सप्ताह के दिनों में श्रेणियाँ असाइन करें। सोमवार को परिवार, मंगलवार को स्वास्थ्य… हर दिन आप जानते हैं कि किसके लिए प्रार्थना करनी है।' },
      { icon: CheckCircle, color: '#0891b2', title: 'उत्तर मिली प्रार्थनाओं की गैलरी', desc: 'प्रार्थनाओं को उत्तर मिली के रूप में चिह्नित करें और अपनी गवाही दर्ज करें। समय के साथ परमेश्वर की विश्वसनीयता जमा होते देखें।' },
      { icon: Globe, color: '#db2777', title: '7 भाषाएँ', desc: 'फ्रेंच, अंग्रेजी, जर्मन, पुर्तगाली, चीनी, स्पेनिश और हिंदी में पूर्ण इंटरफ़ेस। कभी भी बदलें।' },
      { icon: Lock, color: '#6d28d9', title: 'निजी और सुरक्षित', desc: 'आपकी प्रार्थनाएँ कभी भी आपके खाते से बाहर नहीं जाती। केवल आप ही अपना डेटा देख सकते हैं।' },
    ],
    stepsTitle: 'यह कैसे काम करता है',
    stepsSub: 'पहली प्रार्थना से उत्तर मिली प्रार्थनाओं की पूरी गैलरी तक — चार सरल चरणों में।',
    steps: [
      { emoji: '✍️', title: 'प्रार्थना जोड़ें', desc: 'एक अनुरोध टाइप करें, श्रेणी असाइन करें, और वैकल्पिक रूप से नोट करें कि यह किसके लिए है।' },
      { emoji: '📅', title: 'अपनी योजना बनाएं', desc: 'दिनों में श्रेणियाँ असाइन करें। हर सुबह ऐप खोलें और आज की सूची देखें।' },
      { emoji: '📖', title: 'शास्त्र खोजें', desc: 'वचन खोजक का उपयोग करें और अपनी प्रार्थना से संबंधित बाइबल के अंश खोजें — आप विवेक करें कि आपकी स्थिति के लिए क्या बोलता है।' },
      { emoji: '🎉', title: 'उत्तर दर्ज करें', desc: 'जब परमेश्वर उत्तर दे, तो उसे चिह्नित करें। अपनी गवाही जोड़ें। जब विश्वास की जरूरत हो तो वापस देखें।' },
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
      { q: 'कौन सी भाषाएँ समर्थित हैं?', a: 'पूरा इंटरफ़ेस फ्रेंच, अंग्रेजी, जर्मन, पुर्तगाली, चीनी, स्पेनिश और हिंदी में काम करता है।' },
      { q: 'क्या यह मुफ्त है?', a: 'हाँ, पूरी तरह मुफ्त। ऐप ओपन सोर्स है।' },
    ],
    ctaTitle: 'आज ही अपनी प्रार्थना पत्रिका शुरू करें',
    ctaSub: 'मुफ्त, निजी और 7 भाषाओं में उपलब्ध। Google से कुछ ही सेकंड में साइन अप करें।',
    ctaBtn: 'शुरू करें — यह मुफ्त है',
    ctaVerse: '"निरन्तर प्रार्थना करते रहो।" — 1 थिस्सलुनीकियों 5:17',
    footerBuilt: 'विश्वास के साथ बनाया · ओपन सोर्स · MIT लाइसेंस',
  },
};

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)' }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-sm font-medium text-white pr-4">{q}</p>
        {open
          ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
          : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />}
      </div>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const [lang, setLang] = useState(detectLang);
  const [langOpen, setLangOpen] = useState(false);
  const c = CONTENT[lang];
  const activeLang = LANGS.find(l => l.code === lang);

  const handleLang = (code) => {
    setLang(code);
    setLangOpen(false);
    localStorage.setItem('pfm_language', code);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0d0a1e', color: '#fff' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-6xl mx-auto gap-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.svg" alt="" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-lg tracking-tight">Pray4Me</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', border: '0.5px solid rgba(255,255,255,0.12)' }}
            >
              <span>{activeLang?.flag}</span>
              <span>{activeLang?.label}</span>
              <ChevronDown size={13} style={{ opacity: 0.6 }} />
            </button>

            {langOpen && (
              <div
                className="absolute right-0 mt-1 rounded-xl overflow-hidden z-50"
                style={{ background: '#1a1630', border: '0.5px solid rgba(255,255,255,0.12)', minWidth: '130px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              >
                {LANGS.map(({ code, flag, label }) => (
                  <button
                    key={code}
                    onClick={() => handleLang(code)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                    style={lang === code
                      ? { background: 'rgba(124,92,252,0.25)', color: '#a78bfa' }
                      : { color: 'rgba(255,255,255,0.7)' }}
                  >
                    <span>{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onGetStarted}
            className="text-sm font-medium px-4 py-2 rounded-xl transition-all shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.15)' }}
          >
            {c.signIn}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative text-center px-6 pt-16 pb-24 max-w-3xl mx-auto">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,92,252,0.35) 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(124,92,252,0.15)', color: '#a78bfa', border: '0.5px solid rgba(124,92,252,0.3)' }}>
            <Sparkles size={11} /> {c.badge}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
            {c.h1a}<br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {c.h1b}
            </span>
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{c.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', boxShadow: '0 0 30px rgba(124,92,252,0.4)' }}
            >
              {c.cta}
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.12)' }}
            >
              {c.howItWorks}
            </button>
          </div>
          <p className="text-xs mt-4 italic" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.verse}</p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-6 max-w-4xl mx-auto mb-24">
        <div className="rounded-3xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-4" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
          {c.stats.map(({ emoji, label, value, sub }) => (
            <div key={label} className="text-center py-2">
              <div className="text-3xl mb-2">{emoji}</div>
              <div className="text-3xl font-bold mb-0.5" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
              <div className="text-xs font-medium text-white mb-0.5">{label}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 max-w-5xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{c.featuresTitle}</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.featuresSub}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {c.features.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: color + '22' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5 text-white">{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 max-w-3xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{c.stepsTitle}</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.stepsSub}</p>
        </div>
        <div className="space-y-4">
          {c.steps.map(({ emoji, title, desc }, i) => (
            <div key={title} className="flex items-start gap-5 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'rgba(124,92,252,0.15)', border: '0.5px solid rgba(124,92,252,0.2)' }}>
                {emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,92,252,0.2)', color: '#a78bfa' }}>
                    {lang === 'de' ? `Schritt ${i + 1}` : lang === 'fr' ? `Étape ${i + 1}` : lang === 'pt' ? `Passo ${i + 1}` : `Step ${i + 1}`}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scripture finder callout */}
      <section className="px-6 max-w-5xl mx-auto mb-24">
        <div className="rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(167,139,250,0.08))', border: '0.5px solid rgba(124,92,252,0.25)' }}>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(124,92,252,0.2)', color: '#a78bfa' }}>
              <BookOpen size={11} /> {c.calloutBadge}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{c.calloutTitle}</h2>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{c.calloutDesc}</p>
            <p className="text-xs mb-5 italic" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{c.calloutDisclaimer}</p>
            <button onClick={onGetStarted} className="px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}>
              {c.calloutTry}
            </button>
          </div>
          <div className="w-full md:w-64 rounded-2xl p-4 shrink-0" style={{ background: 'rgba(0,0,0,0.3)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.calloutPreviewLabel}</p>
            {[
              { point: lang === 'fr' ? 'La paix qui surpasse tout entendement' : lang === 'de' ? 'Friede, der allen Verstand übersteigt' : lang === 'pt' ? 'A paz que excede todo entendimento' : 'Peace that surpasses understanding', verse: 'Philippians 4:7' },
              { point: lang === 'fr' ? 'Faire confiance au temps de Dieu' : lang === 'de' ? 'Gottes Timing vertrauen' : lang === 'pt' ? 'Confiar no tempo de Deus' : 'Trust in God\'s timing', verse: 'Isaiah 40:31' },
            ].map(({ point, verse }) => (
              <div key={verse} className="rounded-xl p-3 mb-2" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: '3px solid #f5c842' }}>
                <p className="text-xs text-white mb-1">{point}</p>
                <p className="text-xs flex items-center gap-1" style={{ color: '#f5c842' }}>
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
          {c.faqs.map(faq => <FAQ key={faq.q} {...faq} />)}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(124,92,252,0.25) 0%, transparent 70%)' }} />
        <div className="relative max-w-xl mx-auto">
          <img src="/logo.svg" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{c.ctaTitle}</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{c.ctaSub}</p>
          <button onClick={onGetStarted} className="px-8 py-4 rounded-2xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', boxShadow: '0 0 40px rgba(124,92,252,0.45)' }}>
            {c.ctaBtn}
          </button>
          <p className="text-xs mt-4 italic" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.ctaVerse}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t max-w-5xl mx-auto" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="w-6 h-6 rounded-md" />
            <span className="text-sm font-medium text-white">Pray4Me</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.footerBuilt}</p>
          <button onClick={onGetStarted} className="text-xs font-medium px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
            {c.signIn} →
          </button>
        </div>
      </footer>

    </div>
  );
}
