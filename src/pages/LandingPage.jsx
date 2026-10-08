import { useEffect, useRef, useState } from 'react';
import { BookOpen, Calendar, CheckCircle, Globe, Lock, ChevronDown, ChevronUp, Sun, Moon, Users, Sprout, Bell, Smartphone, HandHeart, Feather, Loader2, Repeat } from 'lucide-react';
import { dirFor, LANGUAGES } from '../i18n';
import { applyTheme, normalizeTheme, resolveTheme } from '../utils/theme';
import { cachedLandingCopy, FALLBACK_LANDING_COPY, FALLBACK_LANDING_LANG, resolveLandingCopy } from './landing/copy';
import { APP_NAME } from '../lib/brand';
import { BrandLockup, BrandMark, Wordmark } from '../components/shared/Brand';
import { PrimaryButton, QuietButton, SecondaryButton, StatusLabel } from '../components/shared/Primitives';
import RiseMark from '../components/shared/RiseMark';
import LandingCircles from './landing/LandingCircles';

// The landing page is the product's first page, built from the product's own
// tokens, primitives and classes (src/styles/landing.css): alabaster, royal
// violet, temple gold, the serif for what is sacred — the same Today the app
// shows, one deep-violet band, no separate marketing palette.

// Keep native language names in the shared registry. Languages whose longer
// marketing copy is still abbreviated show a clear, translated status label.
const PARTIAL_LANDING_LANGS = new Set(['sw', 'am', 'id', 'tl', 'ko', 'ru', 'ar', 'fa']);
const LANGS = LANGUAGES.map((language) => ({
  ...language,
  shortLabel: language.code.toUpperCase(),
  complete: !PARTIAL_LANDING_LANGS.has(language.code),
}));

const ALL_CODES = LANGS.map(l => l.code);
// The Play listing follows the Android application id, which keeps its
// historical name so installed apps keep updating (docs/QETORET_MIGRATION.md).
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=space.praystead.twa';

// Four of the seven movements (docs/QETORET_IDENTITY.md §4), surfaced right
// under the hero in this order: Bring, Carry, Return, Remember. One line icon
// each; the words come from the landing locale.
const MOVEMENT_ICONS = [Feather, HandHeart, Repeat, CheckCircle];

// One line-icon family for the feature list. The colours the locale files
// still carry per feature are not used: the page has one palette.
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

function GooglePlayLink({ label }) {
  return (
    <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className="secondary-button landing__cta">
      <Smartphone size={18} aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="landing__faq-item">
      <button type="button" aria-expanded={open} className="landing__faq-question" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && <p className="landing__faq-answer">{a}</p>}
    </div>
  );
}

// `onBeginPrayer` opens the pray-first guest flow (the hero and journal CTAs,
// and a circle's call to pray, which passes { circle, prompt } to frame it);
// `onSignIn` is the direct path to authentication (the nav + footer "Sign in"),
// preserved for people who already have an account.
export default function LandingPage({ onBeginPrayer, onSignIn }) {
  const [lang, setLang] = useState(detectLang);
  // What is ON SCREEN right now, and which language it is really in. The page
  // never waits behind a dictionary: English is bundled, so the first frame is
  // the real landing page, and the visitor's language replaces it a moment
  // later. Switching languages keeps the current copy up until the new one is
  // in hand — replacing a whole page with a spinner to change a language reads
  // as a slower site than simply letting the words change.
  const [rendered, setRendered] = useState(() => {
    const initial = detectLang();
    const ready = cachedLandingCopy(initial);
    return ready
      ? { lang: initial, copy: ready }
      : { lang: FALLBACK_LANDING_LANG, copy: FALLBACK_LANDING_COPY };
  });
  const [langOpen, setLangOpen] = useState(false);
  const langMenuRef = useRef(null);
  const langButtonRef = useRef(null);
  // Public and signed-in surfaces share one appearance preference (Light, Dark
  // or Automatic). A legacy Night value is folded into Dark so returning
  // visitors never see a broken state. `shown` is what is drawn right now.
  const [theme, setTheme] = useState(() => {
    return normalizeTheme(localStorage.getItem('pfm_theme'));
  });
  const shown = resolveTheme(theme);
  // The feature list is folded away by default so the hero and the
  // movements carry the first impression; visitors opt in to the full list.
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const activeLang = LANGS.find(l => l.code === lang);

  // Fetch only the selected landing dictionary. A stale request cannot overwrite
  // a newer language selection. resolveLandingCopy reports the language the copy
  // is genuinely in, so a chunk that fails to load leaves the page labelled
  // English rather than claiming to be a language it is not showing.
  useEffect(() => {
    if (rendered.lang === lang) return undefined;
    let current = true;
    resolveLandingCopy(lang).then((next) => {
      if (current) setRendered(next);
    });
    return () => { current = false; };
  }, [lang, rendered.lang]);

  // Reflect the visitor's language on <html> so screen readers pronounce the
  // marketing copy correctly and Arabic/Persian render right-to-left. Mirrors the
  // in-app effect in App.jsx, which takes over once the visitor signs in.
  //
  // The two attributes deliberately follow different things. `dir` follows the
  // SELECTED language and is set immediately, so the layout is already correct
  // and never flips once the translated copy arrives. `lang` follows the copy
  // actually on screen, so a screen reader is never told to pronounce English
  // words as Arabic during the moment before the real dictionary lands.
  useEffect(() => {
    document.documentElement.lang = rendered.lang;
    document.documentElement.dir = dirFor(lang);
    applyTheme(theme);
    document.documentElement.classList.add('landing-root');
    localStorage.setItem('pfm_theme', theme);
    return () => document.documentElement.classList.remove('landing-root');
  }, [lang, rendered.lang, theme]);

  useEffect(() => {
    if (!langOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!langMenuRef.current?.contains(event.target)) setLangOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setLangOpen(false);
      langButtonRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [langOpen]);

  const handleLang = (code) => {
    setLang(code);
    setLangOpen(false);
    setShowAllFeatures(false);
    // This is the same content-free preference the authenticated store reads on
    // startup. Keeping the anonymous write local avoids importing or initializing
    // the prayer/Supabase stack before the visitor asks to sign in.
    localStorage.setItem('pfm_language', code);
    requestAnimationFrame(() => langButtonRef.current?.focus());
  };

  const focusLanguageOption = (direction) => {
    const options = [...(langMenuRef.current?.querySelectorAll('[role="menuitemradio"]') || [])];
    if (!options.length) return;
    const currentIndex = options.indexOf(document.activeElement);
    const nextIndex = direction === 'first'
      ? 0
      : direction === 'last'
        ? options.length - 1
        : (currentIndex + direction + options.length) % options.length;
    options[nextIndex].focus();
  };

  const handleLanguageMenuKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusLanguageOption(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusLanguageOption(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusLanguageOption('first');
    } else if (event.key === 'End') {
      event.preventDefault();
      focusLanguageOption('last');
    }
  };

  const toggleTheme = () => {
    // The compact public control flips what is shown into an explicit choice;
    // Automatic is offered in Settings.
    const next = shown === 'light' ? 'dark' : 'light';
    setTheme(next);
    // Same key + attribute the app reads, so the choice follows the visitor
    // through sign-in.
    localStorage.setItem('pfm_theme', next);
    applyTheme(next);
  };

  const copy = rendered.copy;
  // A language was asked for and its words have not arrived yet. The page stays
  // exactly as it is; only the language control says it is working.
  const copyPending = rendered.lang !== lang;

  const {
    content: c,
    movements,
    circles,
    why,
    preview,
    explore,
    beginLabel,
    playStore,
    hero,
    heroReassurance,
    samplePrayerTitle,
    scripturePreviewPoints,
    scriptureReferences,
    todayLabel,
    prayNowLabel,
    languageMenuLabel,
    translationInProgress,
  } = copy;

  return (
    <div className="landing">

      {/* Header: the mark, the language, the theme, Sign in. */}
      <nav className="landing__nav" aria-label={APP_NAME}>
        <div className="landing__brand">
          <BrandMark size={32} title={APP_NAME} />
          <Wordmark height={20} title={null} className="hidden min-[430px]:inline-block" />
        </div>

        <div className="landing__nav-actions">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={shown === 'light' ? 'Dark mode' : 'Light mode'}
            aria-label={shown === 'light' ? 'Dark mode' : 'Light mode'}
            className="icon-button icon-button--outlined pressable"
          >
            {shown === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
          </button>

          {/* Language dropdown */}
          <div ref={langMenuRef} className="relative">
            <button
              ref={langButtonRef}
              type="button"
              onClick={() => setLangOpen(o => !o)}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowDown') return;
                event.preventDefault();
                setLangOpen(true);
                requestAnimationFrame(() => focusLanguageOption('first'));
              }}
              aria-expanded={langOpen}
              aria-haspopup="menu"
              aria-controls="landing-language-menu"
              aria-label={`${languageMenuLabel}: ${activeLang?.label}`}
              // The ONLY thing that reports a language still loading. The page
              // itself keeps its words; a whole-page spinner to change a
              // language is what made the site feel slow.
              aria-busy={copyPending || undefined}
              className="language-picker pressable"
            >
              <span>{activeLang?.flag}</span>
              <span>{activeLang?.shortLabel}</span>
              {copyPending
                ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                : <ChevronDown size={14} aria-hidden="true" />}
            </button>

            {langOpen && (
              <div
                id="landing-language-menu"
                role="menu"
                aria-label={languageMenuLabel}
                onKeyDown={handleLanguageMenuKeyDown}
                className="q-menu landing__language-menu"
              >
                {LANGS.map(({ code, flag, label, complete }) => (
                  <button
                    key={code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={lang === code}
                    onClick={() => handleLang(code)}
                    className="q-menu__item"
                  >
                    <span>{flag}</span>
                    <span className="flex-1">{label}</span>
                    {!complete && <span className="landing__language-status">{translationInProgress}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <SecondaryButton onClick={onSignIn} className="landing__sign-in">{c.signIn}</SecondaryButton>
        </div>
      </nav>

      {/* Hero: who Qetoret is for and the one first step — pray. */}
      <section className="landing__hero">
        <div className="landing__hero-copy">
          <p className="section-label section-label--sacred">{APP_NAME}</p>
          <h1 className="landing__title rise-in">{hero.title}</h1>
          <p className="landing__lede">{hero.subtitle}</p>
          <div className="landing__actions">
            <PrimaryButton onClick={() => onBeginPrayer()} className="landing__cta">{beginLabel}</PrimaryButton>
            <SecondaryButton onClick={onSignIn} className="landing__cta">{c.signIn}</SecondaryButton>
          </div>
          <p className="landing__reassurance">
            <Lock size={14} aria-hidden="true" /> {heroReassurance}
          </p>
          <div className="landing__links">
            <QuietButton
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="-ms-3"
            >
              {c.howItWorks} <ChevronDown size={16} aria-hidden="true" />
            </QuietButton>
            <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className="landing__link">
              <Smartphone size={16} aria-hidden="true" /> {playStore.cta}
            </a>
          </div>
        </div>

        {/* The real Today, not a mock-up: "Your altar today", one prayer in the
            deep-violet focus, Pray now — the same classes the app draws it
            with — and two rows below it. Pray now enters the same guest flow
            as the primary call; no fabricated usage statistics. */}
        <div className="landing__preview" aria-label={`${APP_NAME} — ${preview.altarToday}`}>
          <div className="landing__preview-page">
            <p className="section-label section-label--sacred">{preview.altarToday}</p>
            <section className="today-focus q-immersive landing__focus">
              <RiseMark motion="still" size={140} className="today-focus__rise" />
              <p className="today-focus__context">{todayLabel}</p>
              <p className="today-focus__title">{samplePrayerTitle}</p>
              <PrimaryButton onClick={() => onBeginPrayer()} className="today-focus__begin">{prayNowLabel}</PrimaryButton>
            </section>
            <ul className="landing__preview-rows">
              <li>
                <span className="landing__preview-title">{preview.carriedTitle}</span>
                <span className="landing__preview-meta">{preview.carriedLabel}</span>
              </li>
              <li>
                <span className="landing__preview-title">{preview.rememberText}</span>
                <StatusLabel tone="answered">{preview.rememberLabel}</StatusLabel>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Bring · Carry · Return · Remember — the movements of a life of prayer,
          up front, before anything about features: one editorial row. */}
      <section className="landing__band" aria-label={movements.map((m) => m.title).join(' · ')}>
        <ol className="landing__movements">
          {movements.map(({ title, desc }, i) => {
            const Icon = MOVEMENT_ICONS[i] || Feather;
            return (
              <li key={title}>
                <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                <h3 className="landing__movement-title">{title}</h3>
                <p className="landing__movement-desc">{desc}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* From your heart to the nations: the seven Intercession Circles. Not
          levels — the widening reach of intercession, each a doorway into
          prayer (landing/LandingCircles.jsx). */}
      <LandingCircles lang={rendered.lang} copy={circles} onBeginPrayer={onBeginPrayer} />

      {/* How it works: three steps, numbered in the serif. */}
      <section id="how-it-works" className="landing__band landing__narrow">
        <h2 className="landing__heading">{c.stepsTitle}</h2>
        <ol className="landing__steps">
          {c.steps.map(({ title, desc }, i) => (
            <li key={title}>
              <span className="landing__step-number" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="landing__step-title">{title}</h3>
                <p className="landing__step-desc">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Why Qetoret? — the name, briefly, with room to breathe and references
          only: the Bible text itself is never authored here (CLAUDE.md,
          Scripture rule). */}
      <section className="landing__band landing__narrow landing__why" aria-labelledby="landing-why-title">
        <RiseMark motion="still" size={40} />
        <h2 id="landing-why-title" className="section-label section-label--sacred">{why.title}</h2>
        <p className="landing__why-body">{why.body}</p>
        <p className="section-label mt-8">{why.referencesLabel}</p>
        <ul className="landing__refs">
          {why.references.map((ref) => (
            <li key={ref} className="scripture-ref"><BookOpen size={13} aria-hidden="true" /> {ref}</li>
          ))}
        </ul>
        <p className="landing__note">{why.note}</p>
      </section>

      {/* Features — a quiet list, folded behind "Explore all features" so the
          page leads with the movements above, not a wall of cards. */}
      <section className="landing__band landing__narrow">
        <h2 className="landing__heading">{c.featuresTitle}</h2>
        {c.featuresSub && <p className="landing__text">{c.featuresSub}</p>}
        {showAllFeatures && (
          <ul className="landing__features">
            {c.features.map(({ icon, title, desc }) => {
              const Icon = FEATURE_ICONS[icon] || Feather;
              return (
                <li key={title}>
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  <div>
                    <h3 className="landing__feature-title">{title}</h3>
                    <p className="landing__feature-desc">{desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <SecondaryButton onClick={() => setShowAllFeatures((open) => !open)} aria-expanded={showAllFeatures} className="mt-6">
          {showAllFeatures ? explore.less : explore.more}
          {showAllFeatures ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </SecondaryButton>
      </section>

      {/* Praying with Scripture — the one deep-violet band on the page. */}
      <section className="landing__scripture q-immersive">
        <div className="landing__scripture-inner">
          <div>
            <p className="section-label section-label--sacred">{c.calloutBadge}</p>
            <h2 className="landing__heading">{c.calloutTitle}</h2>
            <p className="landing__text">{c.calloutDesc}</p>
            <p className="landing__note">{c.calloutDisclaimer}</p>
            <PrimaryButton onClick={() => onBeginPrayer()} className="mt-6">{beginLabel}</PrimaryButton>
          </div>
          <div>
            <p className="section-label">{c.calloutPreviewLabel}</p>
            {/* Example references use the visitor's localized book names —
                never an English "Philippians" inside another language. */}
            <ul className="landing__scripture-list">
              {scriptureReferences.map((verse, index) => (
                <li key={verse}>
                  <span className="landing__scripture-point">{scripturePreviewPoints[index]}</span>
                  <span className="scripture-ref"><BookOpen size={13} aria-hidden="true" /> {verse}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing__band landing__narrow">
        <h2 className="landing__heading">{c.faqTitle}</h2>
        <div className="landing__faq">
          {c.faqs.map((faq) => <FAQ key={faq.q} {...faq} />)}
        </div>
      </section>

      {/* Final invitation */}
      <section className="landing__final">
        <BrandMark size={56} />
        <h2 className="landing__final-title">{c.ctaTitle}</h2>
        <div className="landing__actions landing__actions--center">
          <PrimaryButton onClick={() => onBeginPrayer()} className="landing__cta">{beginLabel}</PrimaryButton>
          <GooglePlayLink label={playStore.cta} />
        </div>
        <p className="landing__promise">{hero.promise}</p>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <BrandLockup size={24} />
        <p className="q-meta">{c.footerBuilt}</p>
        <QuietButton onClick={onSignIn}>{c.signIn} →</QuietButton>
      </footer>

    </div>
  );
}
