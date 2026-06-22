import { useState } from 'react';
import { BookOpen, Calendar, CheckCircle, Globe, Lock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'pt', flag: '🇧🇷', label: 'PT' },
];

function detectLang() {
  const saved = localStorage.getItem('pfm_language');
  if (saved && ['fr', 'en', 'de', 'pt'].includes(saved)) return saved;
  const nav = (navigator.language || 'en').toLowerCase().slice(0, 2);
  return ['fr', 'en', 'de', 'pt'].includes(nav) ? nav : 'en';
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
