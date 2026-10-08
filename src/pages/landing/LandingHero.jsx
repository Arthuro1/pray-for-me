import { ChevronDown, Smartphone } from 'lucide-react';
import { HEBREW_NAME, TRANSLITERATION } from '../../content/identity';
import { PrimaryButton, QuietButton, SecondaryButton } from '../../components/shared/Primitives';
import RiseMark from '../../components/shared/RiseMark';
import { reducedMotion } from '../../hooks/useRingReveal';
import { TodayPreview } from './LandingVignettes';

// The Play listing follows the Android application id, which keeps its
// historical name so installed apps keep updating (docs/QETORET_MIGRATION.md).
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=space.praystead.twa';

// The name before anything explains it, as on the About page: the Hebrew word
// under the rising stroke, how it sounds and what it means — then the line the
// app lives by, the one first step (pray), and the real Today beside it.
export default function LandingHero({ copy, onBeginPrayer, onSignIn }) {
  const { hero, content: c, beginLabel, playStore } = copy;

  const showStory = () => document.getElementById('come')
    ?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });

  return (
    <section className="landing__hero-band">
      <div className="landing__hero">
        <div className="landing__hero-copy">
          <div className="landing__name">
            <RiseMark motion="still" size={30} className="landing__name-mark" />
            <p className="landing__hebrew" lang="he" dir="rtl">{HEBREW_NAME}</p>
            <p className="landing__gloss">
              <span className="landing__sound" lang="he-Latn">{TRANSLITERATION}</span>
              <span aria-hidden="true"> · </span>
              <span>{hero.gloss}</span>
            </p>
          </div>
          <h1 className="landing__title rise-in">{hero.title}</h1>
          <p className="landing__lede">{hero.subtitle}</p>
          <div className="landing__actions">
            <PrimaryButton onClick={() => onBeginPrayer()} className="landing__cta">{beginLabel}</PrimaryButton>
            <SecondaryButton onClick={onSignIn} className="landing__cta">{c.signIn}</SecondaryButton>
          </div>
          <div className="landing__links">
            <QuietButton onClick={showStory} className="-ms-3">
              {c.howItWorks} <ChevronDown size={16} aria-hidden="true" />
            </QuietButton>
            <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className="landing__link">
              <Smartphone size={16} aria-hidden="true" /> {playStore.cta}
            </a>
          </div>
        </div>

        <TodayPreview copy={copy} onBeginPrayer={onBeginPrayer} />
      </div>
    </section>
  );
}
