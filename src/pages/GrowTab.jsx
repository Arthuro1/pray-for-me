import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, Clock, CloudSun, Compass, Flame, Footprints, HandHeart, MessageCircleHeart, Sprout } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import { useLocalizedArticles } from '../hooks/useLocalizedArticles';
import { useLocalizedGuides } from '../hooks/useLocalizedGuides';
import { useLocalizedJourney } from '../hooks/useLocalizedJourney';
import { getGuideProgress, markGuideStarted, markGuideCompleted, recommendNext, completedGuides } from '../lib/guideProgress';
import { guideDurationMinutes } from '../lib/guideMeta';
import GuideReader from '../components/GuideReader';
import ArticleReader from '../components/ArticleReader';
import GospelJourneyReader from '../components/GospelJourneyReader';
import RiseMark from '../components/shared/RiseMark';
import { Disclosure, PageHeader, SegmentedControl } from '../components/shared/Primitives';
import { runningPlanIds } from '../lib/planner';
import { todayKey } from '../lib/prayedLog';

// One mark per teaching theme (the `theme` authored on each guide and article),
// in the icon-tile voice of prayer rows, so the library scans by more than its
// titles. Decorative: the title beside it says what it is.
const THEME_MARKS = {
  foundations: { Icon: Flame, tone: 'amber' },
  practices: { Icon: Footprints, tone: 'plum' },
  scripture: { Icon: BookOpen, tone: 'indigo' },
  others: { Icon: HandHeart, tone: 'rose' },
  virtues: { Icon: Sprout, tone: 'teal' },
  seasons: { Icon: CloudSun, tone: 'sky' },
  'hard-questions': { Icon: CircleHelp, tone: 'clay' },
  requests: { Icon: MessageCircleHeart, tone: 'rose' },
};
const DEFAULT_MARK = { Icon: Compass, tone: 'teal' };

function ThemeMark({ theme, className = '' }) {
  const { Icon, tone } = THEME_MARKS[theme] || DEFAULT_MARK;
  return (
    <span className={`icon-tile tone-${tone} ${className}`} aria-hidden="true">
      <Icon size={20} strokeWidth={1.8} />
    </span>
  );
}

const minutesLabel = (guide, lang) => {
  const minutes = guideDurationMinutes(guide);
  return minutes ? t(lang, 'aboutMinutes', { n: minutes }) : null;
};

// A guide/article card. Top-level (not defined inside GrowTab) so React keeps
// the DOM node across re-renders — an inline component type would remount on
// every state change and drop keyboard focus. Its theme's mark, the title in
// the serif, what it is, how long it takes.
function ItemCard({ item, lang, onOpen, done, durationLabel }) {
  return (
    <button type="button" onClick={onOpen} className="grow-card q-card pressable">
      <ThemeMark theme={item.theme} />
      <span className="grow-card__body">
        <span className="grow-card__title">{pick(item.title, lang)}</span>
        <span className="grow-card__sub">{pick(item.summary, lang)}</span>
        {(durationLabel || done) && (
          <span className="grow-card__meta">
            {done ? <Check size={13} aria-hidden="true" /> : <Clock size={13} aria-hidden="true" />}
            {durationLabel}
          </span>
        )}
      </span>
      <ChevronRight size={16} className="grow-card__chevron rtl-mirror" aria-hidden="true" />
    </button>
  );
}

// The one recommended next step, as the page's doorway: a deep-violet card
// with the guide's mark, its title, why it is next (or, when it is simply the
// next new one, what it is), how long it takes and the way in.
const REC_DESC_KEYS = { continue: 'growContinueDesc', again: 'growAgainDesc' };
const REC_CTA_KEYS = { continue: 'guidanceContinue', new: 'guideBegin', again: 'guideBegin' };

function NextStep({ recommendation, lang, onOpen }) {
  const { guide, type } = recommendation;
  const duration = minutesLabel(guide, lang);
  return (
    <button type="button" onClick={onOpen} className="grow-hero q-immersive pressable">
      <RiseMark motion="still" size={160} className="grow-hero__rise" />
      <ThemeMark theme={guide.theme} className="grow-hero__mark" />
      <span className="grow-hero__title">{pick(guide.title, lang)}</span>
      <span className="grow-hero__desc">
        {REC_DESC_KEYS[type] ? t(lang, REC_DESC_KEYS[type]) : pick(guide.summary, lang)}
      </span>
      <span className="grow-hero__foot">
        <span className="primary-button grow-hero__cta">
          <span>{t(lang, REC_CTA_KEYS[type])}</span>
          <ArrowRight className="rtl-mirror" size={16} aria-hidden="true" />
        </span>
        {duration && (
          <span className="grow-hero__meta"><Clock size={13} aria-hidden="true" /> {duration}</span>
        )}
      </span>
    </button>
  );
}

// The Grow tab as a PATH, not a catalogue: one recommended next step leads the
// page — continue the guide already begun, else the next new one — derived
// purely from on-device progress (no questionnaire). The rest of the library
// waits behind "Browse all guides", and completed guides fold into a collapsed
// History, so a growing believer always faces one understandable step instead
// of a grid of equally-weighted options. Multi-day prayer plans are a
// destination of their own (pages/PlansTab.jsx), not a section of this path.
//
// Near the bottom sits one gentle, optional invitation for people new to prayer
// or exploring the faith: the gospel journey. It never auto-opens, never blocks
// the Pray/Learn sections, and stays available after it's been read.
//
// `onCreatePrayer` opens the existing prayer-creation flow (App-level), letting
// the journey's "Create a private prayer" step reuse it with a private, editable
// starter prompt rather than duplicating any form logic.
export default function GrowTab({ onCreatePrayer }) {
  const settings = usePrayerStore((s) => s.settings);
  const prayers = usePrayerStore((s) => s.prayers);
  const lang = settings.language || 'fr';
  const [view, setView] = useState('pray'); // 'pray' | 'learn'
  const [openGuide, setOpenGuide] = useState(null);
  const [openArticle, setOpenArticle] = useState(null);
  const [openJourney, setOpenJourney] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Bumped whenever guide progress changes so the recommendation re-derives.
  const [progressVersion, setProgressVersion] = useState(0);

  // Both guides and articles carry per-language translations loaded on demand;
  // en/fr are authored in the source and any missing field falls back through pick().
  const guides = useLocalizedGuides(lang);
  const articles = useLocalizedArticles(lang);
  const journey = useLocalizedJourney(lang);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const progress = useMemo(() => getGuideProgress(), [progressVersion]);
  const recommendation = recommendNext(guides, progress);
  const completed = completedGuides(guides, progress);
  const completedIds = new Set(completed.map((g) => g.id));
  const hasActiveJourney = runningPlanIds(prayers, todayKey()).size > 0;
  // The browsable rest: everything not already surfaced by the next-step card
  // and not completed (those live in History).
  const browsable = guides.filter((g) => g.id !== recommendation?.guide?.id && !completedIds.has(g.id));

  // The journey and the Learn articles reference each other by STABLE id, never by
  // translated title, so navigation is language-independent.
  const openArticleById = (id) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;
    setOpenJourney(false);
    setView('learn');
    setOpenArticle(article);
  };

  return (
    <div className="phase-page grow">
      {openGuide && (
        <GuideReader
          guide={openGuide}
          lang={lang}
          onClose={() => { setOpenGuide(null); setProgressVersion((v) => v + 1); }}
          onStarted={markGuideStarted}
          onCompleted={markGuideCompleted}
        />
      )}
      {openArticle && (
        <ArticleReader
          article={openArticle}
          lang={lang}
          onClose={() => setOpenArticle(null)}
          onOpenJourney={() => { setOpenArticle(null); setOpenJourney(true); }}
        />
      )}
      {openJourney && (
        <GospelJourneyReader
          journey={journey}
          lang={lang}
          onClose={() => setOpenJourney(false)}
          onCreatePrayer={(prefill) => onCreatePrayer?.(prefill)}
          onOpenArticle={openArticleById}
          onExplore={() => { setView('learn'); setOpenJourney(false); }}
        />
      )}

      <div className="phase-page__shell">
        <PageHeader
          title={t(lang, 'guidanceTitle')}
          subtitle={t(lang, 'guidanceSub')}
          backTo="/more"
          backLabel={t(lang, 'moreTab')}
          backAriaLabel={`${t(lang, 'backBtn')}: ${t(lang, 'moreTab')}`}
        />
      </div>

      <div className="phase-content">
        {/* Pray through vs. learn */}
        <SegmentedControl
          className="grow-tabs"
          label={t(lang, 'guidanceTitle')}
          value={view}
          onChange={setView}
          options={[
            { value: 'pray', label: t(lang, 'growPray') },
            { value: 'learn', label: t(lang, 'growLearn') },
          ]}
        />

        {view === 'pray' ? (
          <>
            {/* ONE recommended next step, from existing progress — an
                in-progress guide always outranks anything new. It lives INSIDE
                the Pray segment so Learn stays focused on learning content. */}
            {recommendation && (
              <section className="grow-next" aria-labelledby="grow-next-label">
                <h2 id="grow-next-label" className="section-label section-label--sacred">{t(lang, 'growNextStep')}</h2>
                <NextStep recommendation={recommendation} lang={lang} onOpen={() => setOpenGuide(recommendation.guide)} />
              </section>
            )}

            {/* Browsing the whole library is the SECONDARY action; the next
                step above already carries the primary invitation. */}
            {browsable.length > 0 && (
              <Disclosure id="grow-browse" label={t(lang, 'growBrowseAll')} open={browseOpen} onToggle={() => setBrowseOpen((v) => !v)} className="grow-fold">
                <div className="grow-grid">
                  {browsable.map((item) => (
                    <ItemCard key={item.id} item={item} lang={lang} onOpen={() => setOpenGuide(item)} durationLabel={minutesLabel(item, lang)} />
                  ))}
                </div>
              </Disclosure>
            )}

            {/* Completed guides retire into a collapsed History. */}
            {completed.length > 0 && (
              <Disclosure id="grow-history" label={t(lang, 'growHistory')} count={completed.length} open={historyOpen} onToggle={() => setHistoryOpen((v) => !v)} className="grow-fold">
                <div className="grow-grid">
                  {completed.map((item) => (
                    <ItemCard key={item.id} item={item} lang={lang} onOpen={() => setOpenGuide(item)} done />
                  ))}
                </div>
              </Disclosure>
            )}
          </>
        ) : (
          <>
            <p className="grow-intro">{t(lang, 'growLearnIntro')}</p>
            <div className="grow-grid">
              {articles.map((item) => (
                <ItemCard key={item.id} item={item} lang={lang} onOpen={() => setOpenArticle(item)} />
              ))}
            </div>
          </>
        )}

        {/* Gentle, optional invitation for those new to prayer or exploring
            faith — a quiet card BELOW the guides (an established believer's
            content comes first). It never auto-opens and stays available after
            it's been read or dismissed. */}
        {prayers.length <= 1 && Object.keys(progress).length === 0 && !hasActiveJourney && (
          <div className="grow-seeker">
            <button type="button" onClick={() => setOpenJourney(true)} className="grow-card grow-card--seeker q-card pressable">
              <span className="icon-tile tone-sky" aria-hidden="true"><Compass size={20} strokeWidth={1.8} /></span>
              <span className="grow-card__body">
                <span className="grow-card__title">{t(lang, 'growSeekerTitle')}</span>
                <span className="grow-card__sub">{t(lang, 'growSeekerDesc')}</span>
              </span>
              <ChevronRight size={16} className="grow-card__chevron rtl-mirror" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
