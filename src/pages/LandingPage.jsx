import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { dirFor } from '../i18n';
import { applyTheme, normalizeTheme, resolveTheme } from '../utils/theme';
import {
  cachedLandingCopy, FALLBACK_LANDING_COPY, FALLBACK_LANDING_LANG, LANDING_LOCALE_CODES, resolveLandingCopy,
} from './landing/copy';
import { BrandLockup, BrandMark } from '../components/shared/Brand';
import { PrimaryButton, QuietButton } from '../components/shared/Primitives';
import LandingHeader from './landing/LandingHeader';
import LandingHero, { GOOGLE_PLAY_URL } from './landing/LandingHero';
import LandingCome from './landing/LandingCome';
import LandingBeat from './landing/LandingBeat';
import LandingCircles from './landing/LandingCircles';
import LandingLetter from './landing/LandingLetter';
import LandingTrust from './landing/LandingTrust';
import { BringVignette, RememberVignette, RhythmVignette, TogetherVignette } from './landing/LandingVignettes';

// The public first page tells one story — Zechariah's (Luke 1:5–25,
// docs/QETORET_IDENTITY.md §2) — and invites the visitor into it: a servant
// comes before God, brings a prayer, carries others from the heart to the
// nations, while the people pray together; incense rises morning and evening;
// a long-carried prayer is remembered and its answer becomes a calling. Each
// step sits beside the app that serves it, drawn with the app's own tokens,
// cards and tiles, so the first page and the product read as one place.
//
// Scripture is cited by reference only (CLAUDE.md, Scripture rule).

// The passages under each step of the story, localized at render.
const REFS = {
  bring: ['Psalm 62:8', '1 Samuel 1:15'],
  together: ['Luke 1:10', 'Galatians 6:2'],
  rhythm: ['Exodus 30:7-8', 'Luke 18:1', 'Psalm 46:10'],
  remember: ['Luke 1:13-17', 'Psalm 103:2'],
};

// Where each of the seven movements sits in the locale's `movements` list.
const MOVEMENT = { come: 0, bring: 1, carry: 2, return: 3, listen: 4, respond: 5, remember: 6 };

function detectLang() {
  const saved = localStorage.getItem('pfm_language');
  if (saved && LANDING_LOCALE_CODES.includes(saved)) return saved;
  const nav = (navigator.language || 'en').toLowerCase().slice(0, 2);
  return LANDING_LOCALE_CODES.includes(nav) ? nav : 'en';
}

// `onBeginPrayer` opens the pray-first guest flow (every "Begin" and "Pray now"
// on the page, and a circle's call to pray, which passes { circle, prompt } to
// frame it); `onSignIn` is the direct path to authentication for people who
// already have an account.
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
  // Public and signed-in surfaces share one appearance preference (Light, Dark
  // or Automatic). A legacy Night value is folded into Dark so returning
  // visitors never see a broken state. `shown` is what is drawn right now.
  const [theme, setTheme] = useState(() => normalizeTheme(localStorage.getItem('pfm_theme')));
  const shown = resolveTheme(theme);

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
  // copy correctly and Arabic/Persian render right-to-left. Mirrors the in-app
  // effect in App.jsx, which takes over once the visitor signs in.
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

  const changeLanguage = (code) => {
    setLang(code);
    // This is the same content-free preference the authenticated store reads on
    // startup. Keeping the anonymous write local avoids importing or initializing
    // the prayer/Supabase stack before the visitor asks to sign in.
    localStorage.setItem('pfm_language', code);
  };

  // The compact public control flips what is shown into an explicit choice;
  // Automatic is offered in Settings. Same key + attribute the app reads, so
  // the choice follows the visitor through sign-in.
  const toggleTheme = () => setTheme(shown === 'light' ? 'dark' : 'light');

  const copy = rendered.copy;
  const { content: c, movements, beginLabel, playStore } = copy;
  const movement = (...names) => names.map((name) => movements[MOVEMENT[name]]).join(' · ');
  // A step of the story: its words and the passages under them.
  const beat = (id, label) => ({
    id, label, lang: rendered.lang, title: copy[id].title, body: copy[id].body, refs: REFS[id],
  });

  return (
    <div className="landing">
      <LandingHeader
        lang={lang}
        onLanguageChange={changeLanguage}
        // A language was asked for and its words have not arrived yet. The page
        // stays exactly as it is; only the language control says it is working.
        pending={rendered.lang !== lang}
        copy={copy}
        theme={shown}
        onToggleTheme={toggleTheme}
        onSignIn={onSignIn}
      />

      <main>
        <LandingHero copy={copy} onBeginPrayer={onBeginPrayer} onSignIn={onSignIn} />

        <div className="landing__story">
          <LandingCome copy={copy} label={movement('come')} lang={rendered.lang} />

          <LandingBeat
            {...beat('bring', movement('bring'))}
            visual={<BringVignette copy={copy} onBeginPrayer={onBeginPrayer} />}
          />

          {/* From your heart to the nations: the seven Intercession Circles —
              not levels, the widening reach of intercession, each a doorway
              into prayer (landing/LandingCircles.jsx). */}
          <LandingCircles lang={rendered.lang} label={movement('carry')} copy={copy.circles} onBeginPrayer={onBeginPrayer} />

          <LandingBeat
            {...beat('together', copy.together.label)}
            flip
            visual={<TogetherVignette copy={copy} lang={rendered.lang} />}
          />

          <LandingBeat
            {...beat('rhythm', movement('return', 'listen'))}
            visual={<RhythmVignette copy={copy} />}
          />

          <LandingBeat
            {...beat('remember', movement('remember', 'respond'))}
            flip
            visual={<RememberVignette copy={copy} />}
          />
        </div>

        <LandingLetter copy={copy} lang={rendered.lang} />

        <LandingTrust copy={copy} />

        {/* The last invitation, in the deep violet of the place of prayer, and
            the seven movements as the page's closing line. */}
        <section className="landing__final q-immersive" aria-labelledby="landing-final-title">
          <BrandMark size={56} />
          <h2 id="landing-final-title" className="landing__final-title">{c.ctaTitle}</h2>
          <div className="landing__actions landing__actions--center">
            <PrimaryButton onClick={() => onBeginPrayer()} className="landing__cta">{beginLabel}</PrimaryButton>
            <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className="secondary-button landing__cta">
              <Smartphone size={18} aria-hidden="true" />
              <span>{playStore.cta}</span>
            </a>
          </div>
          <p className="landing__litany">{movements.join(' · ')}</p>
        </section>
      </main>

      <footer className="landing__footer">
        <BrandLockup size={24} />
        <p className="q-meta">{c.footerBuilt}</p>
        <QuietButton onClick={onSignIn}>{c.signIn} →</QuietButton>
      </footer>
    </div>
  );
}
