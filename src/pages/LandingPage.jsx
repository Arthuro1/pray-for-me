import { useState, useEffect } from 'react';
import { BookOpen, Calendar, CheckCircle, Globe, Lock, ChevronDown, ChevronUp, Sun, Moon, Users, Sprout, Bell, Smartphone, HandHeart, Feather, Loader2 } from 'lucide-react';
import { dirFor } from '../i18n';
import { normalizeTheme } from '../utils/theme';
import { loadLandingCopy } from './landing/copy';

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
  { icon: Feather, color: '#a97938' },
  { icon: Calendar, color: '#60457b' },
  { icon: CheckCircle, color: '#5f7865' },
];

const FEATURE_ICONS = {
  BookOpen,
  Calendar,
  CheckCircle,
  Globe,
  Lock,
  Users,
  Sprout,
  Bell,
  Smartphone,
  HandHeart,
  Feather,
};

function detectLang() {
  const saved = localStorage.getItem('pfm_language');
  if (saved && ALL_CODES.includes(saved)) return saved;
  const nav = (navigator.language || 'en').toLowerCase().slice(0, 2);
  return ALL_CODES.includes(nav) ? nav : 'en';
}

const THEMES = {
  dark: {
    bg: '#120f1b',
    text: '#f8f5ff',
    textSoft: '#d6ccec',
    textMuted: '#b4a8c9',
    textFaint: '#8d82a2',
    textDim: '#817491',
    textGhost: '#766a85',
    surface: '#171423',
    surfaceStrong: '#211c31',
    chipBg: '#171423',
    border: '#373047',
    borderStrong: '#4b415f',
    menuBg: '#171423',
    menuShadow: '0 8px 24px rgba(0,0,0,0.4)',
    accentText: '#b19aeb',
    accentSoftBg: '#28203d',
    accentChipBg: '#28203d',
    accentActiveBg: '#33294a',
    accentBorder: '#493b68',
    calloutBg: '#1c1730',
    calloutBorder: '#493b68',
    previewBg: '#120f1b',
    previewItemBg: '#211c31',
    gold: '#9a7ce0',
    primaryBg: '#7457b8',
    prayerPreviewBg: '#30215e',
    prayerPreviewButtonBg: '#f8f5ff',
    prayerPreviewButtonText: '#30215e',
    peaceBg: '#173331',
    peaceText: '#63d1cb',
    benefitColors: ['#9a7ce0', '#b19aeb', '#63d1cb'],
    ctaShadow: '0 12px 32px rgba(0,0,0,0.28)',
    ctaShadowBig: '0 18px 44px rgba(0,0,0,0.34)',
  },
  light: {
    bg: '#f8f7fd',
    text: '#251e35',
    textSoft: '#4b405f',
    textMuted: '#74628f',
    textFaint: '#8d82a2',
    textDim: '#8d82a2',
    textGhost: '#817491',
    surface: '#ffffff',
    surfaceStrong: '#f0ecf8',
    chipBg: '#ffffff',
    border: '#ded8ee',
    borderStrong: '#c9bfe2',
    menuBg: '#ffffff',
    menuShadow: '0 8px 24px rgba(26,22,48,0.14)',
    accentText: '#7457b8',
    accentSoftBg: '#eeebfa',
    accentChipBg: '#eeebfa',
    accentActiveBg: '#e6e0f5',
    accentBorder: '#d8cfee',
    calloutBg: '#30215e',
    calloutBorder: '#5d43a7',
    previewBg: '#ffffff',
    previewItemBg: '#f0ecfb',
    gold: '#7457b8',
    primaryBg: '#7457b8',
    prayerPreviewBg: '#30215e',
    prayerPreviewButtonBg: '#ffffff',
    prayerPreviewButtonText: '#30215e',
    peaceBg: '#e7f7f5',
    peaceText: '#249e98',
    benefitColors: ['#7457b8', '#8c76c9', '#249e98'],
    ctaShadow: '0 12px 30px rgba(48,33,63,0.18)',
    ctaShadowBig: '0 18px 42px rgba(48,33,63,0.22)',
  },
};

function FAQ({ q, a, T }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden" style={{ borderBlockEnd: `1px solid ${T.border}` }}>
      <button
        type="button"
        aria-expanded={open}
        className="pressable flex min-h-14 w-full items-center justify-between gap-4 px-1 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="editorial text-lg" style={{ color: T.text }}>{q}</span>
        {open
          ? <ChevronUp size={16} style={{ color: T.textFaint }} />
          : <ChevronDown size={16} style={{ color: T.textFaint }} />}
      </button>
      {open && (
        <div className="pb-5 pe-8">
          <p className="text-sm" style={{ color: T.textMuted, lineHeight: 1.8 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// `onBeginPrayer` opens the pray-first guest flow (the hero and journal CTAs);
// `onSignIn` is the direct path to authentication (the nav + footer "Sign in"),
// preserved for people who already have an account.
export default function LandingPage({ onBeginPrayer, onSignIn }) {
  const [lang, setLang] = useState(detectLang);
  const [copyState, setCopyState] = useState(null);
  const [langOpen, setLangOpen] = useState(false);
  // Public and signed-in surfaces share one Light/Dark choice. A legacy Night
  // value is folded into Dark so returning visitors never see a broken state.
  const [theme, setTheme] = useState(() => {
    return normalizeTheme(localStorage.getItem('pfm_theme'));
  });
  // The nine-card feature grid is folded away by default so the hero + three core
  // benefits carry the first impression; visitors opt in to the full list.
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const T = THEMES[theme];
  const activeLang = LANGS.find(l => l.code === lang);

  // Fetch only the selected landing dictionary. A stale request cannot overwrite
  // a newer language selection.
  useEffect(() => {
    let current = true;
    loadLandingCopy(lang).then((copy) => {
      if (current) setCopyState({ lang, copy });
    });
    return () => { current = false; };
  }, [lang]);

  // Reflect the visitor's language on <html> so screen readers pronounce the
  // marketing copy correctly and Arabic/Persian render right-to-left. Mirrors the
  // in-app effect in App.jsx, which takes over once the visitor signs in.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('constellation-landing-root');
    localStorage.setItem('pfm_theme', theme);
    return () => document.documentElement.classList.remove('constellation-landing-root');
  }, [lang, theme]);

  const handleLang = (code) => {
    setLang(code);
    setLangOpen(false);
    setShowAllFeatures(false);
    // This is the same content-free preference the authenticated store reads on
    // startup. Keeping the anonymous write local avoids importing or initializing
    // the prayer/Supabase stack before the visitor asks to sign in.
    localStorage.setItem('pfm_language', code);
  };

  const toggleTheme = () => {
    // The compact public control and Settings now expose the same two choices.
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    // Same key + attribute the app reads, so the choice follows the visitor
    // through sign-in.
    localStorage.setItem('pfm_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const copy = copyState?.lang === lang ? copyState.copy : null;
  if (!copy) {
    return (
      <div
        aria-busy="true"
        className="flex min-h-screen items-center justify-center"
        style={{ background: T.bg, color: T.text }}
      >
        <div className="text-center">
          <img src="/logo.svg" alt="Pray4Me" className="mx-auto mb-4 h-16 w-16 rounded-2xl" />
          <Loader2 className="mx-auto animate-spin" size={24} aria-hidden="true" />
        </div>
      </div>
    );
  }

  const {
    content: c,
    benefits,
    explore,
    beginLabel,
    heroReassurance,
    calloutBegin,
    hero,
    samplePrayerTitle,
    privacyFaq,
    scripturePreviewPoints,
    scriptureReferences,
    stepLabel,
    todayLabel,
    prayNowLabel,
  } = copy;

  return (
    <div className={`constellation-landing constellation-landing--${theme} min-h-screen`} style={{ background: T.bg, color: T.text }}>

      {/* Nav */}
      <nav className="constellation-landing__nav mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5 md:px-12">
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.svg" alt="" className="w-8 h-8 rounded-lg" />
          <span className="hidden text-lg font-semibold tracking-tight min-[430px]:inline">Pray4Me</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all"
            style={{ background: T.chipBg, color: T.textSoft, border: `0.5px solid ${T.borderStrong}` }}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="pressable flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all"
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
                    className="pressable flex min-h-11 w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors"
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
            onClick={onSignIn}
            className="pressable min-h-11 max-w-28 shrink-0 truncate rounded-xl px-3 py-2 text-sm font-medium transition-all sm:px-4"
            style={{ background: T.chipBg, color: T.text, border: `0.5px solid ${T.borderStrong}` }}
          >
            {c.signIn}
          </button>
        </div>
      </nav>

      {/* Hero: lived prayer experience first, product preview second. */}
      <section className="constellation-landing__hero relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-14 md:grid-cols-[1.02fr_.98fr] md:gap-16 md:pt-20">
        <div className="constellation-landing__hero-copy relative min-w-0">
          <div className="mb-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em]" style={{ color: T.gold }}>
            <Feather size={14} strokeWidth={1.7} /> {c.badge}
          </div>
          <h1 className="editorial-heading text-5xl leading-[1.02] sm:text-6xl lg:text-7xl" style={{ color: T.text }}>
            {hero.title}
          </h1>
          <p className="editorial mt-5 max-w-xl text-2xl leading-snug" style={{ color: T.accentText }}>
            {hero.promise}
          </p>
          <p className="mt-5 max-w-lg text-base" style={{ color: T.textMuted, lineHeight: 1.75 }}>{hero.subtitle}</p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              onClick={onBeginPrayer}
              className="pressable min-h-[52px] rounded-xl px-7 text-sm font-bold text-white"
              style={{ background: T.primaryBg, boxShadow: T.ctaShadow }}
            >
              {beginLabel}
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="pressable min-h-[52px] rounded-xl px-6 text-sm font-semibold"
              style={{ color: T.textSoft, border: `1px solid ${T.borderStrong}` }}
            >
              {c.howItWorks}
            </button>
          </div>
          <p className="mt-5 flex max-w-lg items-start gap-2 text-xs" style={{ color: T.textFaint, lineHeight: 1.65 }}>
            <Lock size={13} className="mt-0.5 shrink-0" /> {heroReassurance}
          </p>
        </div>

        {/* A truthful, decorative preview of the actual journey: Today →
            focused prayer → remembrance. No fabricated usage statistics. */}
        <div className="constellation-landing__preview relative mx-auto w-full max-w-lg" aria-label="Pray4Me product preview">
          <div className="constellation-landing__preview-frame relative overflow-hidden rounded-[1.75rem] p-3 sm:p-4" style={{ background: T.surface, border: `1px solid ${T.borderStrong}`, boxShadow: T.ctaShadowBig }}>
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="" className="h-7 w-7 rounded-lg" />
                <span className="text-xs font-bold" style={{ color: T.text }}>Pray4Me</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: T.textDim }}>{todayLabel}</span>
            </div>
            <div className="constellation-landing__preview-focus relative overflow-hidden rounded-[1.35rem] p-5 sm:p-6" style={{ background: T.prayerPreviewBg, color: '#fff' }}>
              <span className="constellation-landing__preview-art" aria-hidden="true">
                <img src="/assets/constellation/community-sky-dark-transparent.png" alt="" />
              </span>
              <p className="relative text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: 'rgba(255,255,255,.62)' }}>{benefits[1].title}</p>
              <p className="editorial relative mt-5 max-w-[18rem] text-2xl leading-snug">{samplePrayerTitle}</p>
              <button
                className="relative mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold"
                style={{ background: T.prayerPreviewButtonBg, color: T.prayerPreviewButtonText }}
                tabIndex={-1}
              >
                <HandHeart size={16} /> {prayNowLabel}
              </button>
            </div>
            <div className="grid gap-2 p-2 pt-3 sm:grid-cols-2">
              <div className="min-h-24 p-4" style={{ borderInlineStart: `2px solid ${T.gold}`, background: T.previewItemBg }}>
                <p className="text-[10px] font-bold uppercase tracking-[.13em]" style={{ color: T.gold }}>{c.calloutPreviewLabel}</p>
                <p className="editorial mt-3 text-sm leading-relaxed" style={{ color: T.text }}>{c.verse}</p>
              </div>
              <div className="min-h-24 p-4" style={{ background: T.peaceBg }}>
                <p className="text-[10px] font-bold uppercase tracking-[.13em]" style={{ color: T.peaceText }}>{benefits[2].title}</p>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: T.textMuted }}>{c.steps[2]?.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core benefits — the three things Pray4Me does, up front, before the
          longer feature list. Centered so it reads cleanly in RTL too. */}
      <section className="constellation-landing__section mx-auto mb-28 max-w-6xl px-6">
        <div className="constellation-landing__benefits grid grid-cols-1 border-block md:grid-cols-3" style={{ borderColor: T.border }}>
          {benefits.map(({ title, desc }, i) => {
            const { icon: Icon, color: defaultColor } = BENEFIT_META[i];
            const color = T.benefitColors?.[i] || defaultColor;
            return (
              <div key={title} className="constellation-landing__benefit px-2 py-8 text-start md:px-7" style={{ borderInlineStart: i ? `1px solid ${T.border}` : undefined }}>
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: color + '18', border: `1px solid ${color}35` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="editorial text-xl mb-2" style={{ color: T.text }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.textFaint }}>{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features — the full grid is folded behind "Explore all features" so the
          landing leads with the three core benefits above, not a wall of cards. */}
      <section className="constellation-landing__section px-6 max-w-5xl mx-auto mb-24">
        <div className="constellation-landing__section-heading text-center mb-8">
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
              {c.features.map(({ icon, color, title, desc }) => {
                const Icon = FEATURE_ICONS[icon] || Feather;
                return (
                  <div key={title} className="constellation-landing__feature p-5" style={{ background: T.surface, border: `0.5px solid ${T.border}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: color + '22' }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-1.5" style={{ color: T.text }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: T.textFaint }}>{desc}</p>
                  </div>
                );
              })}
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
      <section id="how-it-works" className="constellation-landing__section px-6 max-w-3xl mx-auto mb-24">
        <div className="constellation-landing__section-heading text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{c.stepsTitle}</h2>
          <p className="text-sm" style={{ color: T.textFaint }}>{c.stepsSub}</p>
        </div>
        <div className="border-block" style={{ borderColor: T.border }}>
          {c.steps.map(({ title, desc }, i) => {
            const StepIcon = [Feather, HandHeart, CheckCircle][i];
            return (
            <div key={title} className="constellation-landing__step flex items-start gap-5 py-6" style={{ borderBlockEnd: i < c.steps.length - 1 ? `1px solid ${T.border}` : undefined }}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: T.accentSoftBg, border: `1px solid ${T.accentBorder}`, color: T.accentText }}>
                <StepIcon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: T.accentChipBg, color: T.accentText }}>
                    {stepLabel} {i + 1}
                  </span>
                  <h3 className="editorial text-lg" style={{ color: T.text }}>{title}</h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: T.textFaint }}>{desc}</p>
              </div>
            </div>
          );})}
        </div>
      </section>

      {/* Scripture finder callout */}
      <section className="constellation-landing__section px-6 max-w-5xl mx-auto mb-24">
        <div className="constellation-landing__callout relative overflow-hidden p-8 md:p-12 flex flex-col md:flex-row items-center gap-8" style={{ background: T.calloutBg, border: `1px solid ${T.calloutBorder}`, color: '#fff', boxShadow: T.ctaShadow }}>
          <img src="/assets/constellation/community-sky-dark-transparent.png" alt="" className="constellation-landing__callout-art" aria-hidden="true" />
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-4" style={{ background: T.accentChipBg, color: T.accentText }}>
              <BookOpen size={11} /> {c.calloutBadge}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{c.calloutTitle}</h2>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,.76)', lineHeight: 1.7 }}>{c.calloutDesc}</p>
            <p className="text-xs mb-5 italic" style={{ color: 'rgba(255,255,255,.52)', lineHeight: 1.7 }}>{c.calloutDisclaimer}</p>
            <button onClick={onBeginPrayer} className="pressable min-h-11 px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: T.prayerPreviewButtonBg, color: T.prayerPreviewButtonText }}>
              {calloutBegin}
            </button>
          </div>
          <div className="w-full md:w-64 rounded-2xl p-4 shrink-0" style={{ background: T.previewBg, border: `0.5px solid ${T.border}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T.textDim }}>{c.calloutPreviewLabel}</p>
            {/* Example references use the visitor's localized book names —
                never an English "Philippians" inside another language. */}
            {scriptureReferences.map((verse, index) => (
              <div key={verse} className="rounded-xl p-3 mb-2" style={{ background: T.previewItemBg, borderLeft: `3px solid ${T.gold}` }}>
                <p className="text-xs mb-1" style={{ color: T.text }}>{scripturePreviewPoints[index]}</p>
                <p className="text-xs flex items-center gap-1" style={{ color: T.gold }}>
                  <BookOpen size={9} /> {verse}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="constellation-landing__section px-6 max-w-2xl mx-auto mb-24">
        <div className="constellation-landing__section-heading text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">{c.faqTitle}</h2>
        </div>
        <div className="space-y-2">
          {c.faqs.map((faq, i) => (
            <FAQ key={faq.q} {...faq} a={i === 0 ? privacyFaq : faq.a} T={T} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="constellation-landing__final relative px-6 py-20 text-center overflow-hidden">
        <div className="relative max-w-xl mx-auto">
          <img src="/logo.svg" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{c.ctaTitle}</h2>
          <p className="text-sm mb-8" style={{ color: T.textMuted, lineHeight: 1.7 }}>{c.ctaSub}</p>
          <button onClick={onBeginPrayer} className="pressable min-h-[52px] px-8 py-4 rounded-xl text-sm font-semibold text-white" style={{ background: T.primaryBg, boxShadow: T.ctaShadowBig }}>
            {c.ctaBtn}
          </button>
          <p className="text-xs mt-4 italic" style={{ color: T.textGhost }}>{c.ctaVerse}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="constellation-landing__footer px-6 py-8 border-t max-w-5xl mx-auto" style={{ borderColor: T.border }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="w-6 h-6 rounded-md" />
            <span className="text-sm font-medium" style={{ color: T.text }}>Pray4Me</span>
          </div>
          <p className="text-xs" style={{ color: T.textGhost }}>{c.footerBuilt}</p>
          <button onClick={onSignIn} className="pressable min-h-11 rounded-xl px-4 py-2 text-xs font-medium" style={{ background: T.chipBg, color: T.textSoft, border: `0.5px solid ${T.border}` }}>
            {c.signIn} →
          </button>
        </div>
      </footer>

    </div>
  );
}
