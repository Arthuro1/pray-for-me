import { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, HandHeart, BookOpen, Sunrise, Check } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import { useLocalizedArticles } from '../hooks/useLocalizedArticles';
import { useLocalizedGuides } from '../hooks/useLocalizedGuides';
import { useLocalizedJourney } from '../hooks/useLocalizedJourney';
import { getGuideProgress, markGuideStarted, markGuideCompleted, recommendNext, completedGuides } from '../lib/guideProgress';
import GuideReader from '../components/GuideReader';
import ArticleReader from '../components/ArticleReader';
import GospelJourneyReader from '../components/GospelJourneyReader';

// A guide/article row. Top-level (not defined inside GrowTab) so React keeps
// the DOM node across re-renders — an inline component type would remount on
// every state change and drop keyboard focus.
function ItemCard({ item, lang, onOpen, done }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-all motion-reduce:transition-none hover:scale-[1.01] motion-reduce:hover:scale-100"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', opacity: done ? 0.8 : 1 }}
    >
      <span className="text-2xl shrink-0 leading-none mt-0.5">{item.emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-1)' }}>
          {pick(item.title, lang)}
          {done && <Check size={13} aria-hidden="true" style={{ color: 'var(--success)' }} />}
        </span>
        <span className="block text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-3)' }}>{pick(item.summary, lang)}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 mt-1 opacity-50" style={{ color: 'var(--text-3)' }} />
    </button>
  );
}

// A quiet disclosure row ("Browse all guides", "Completed") — real button,
// keyboard-operable, expanded state announced. Top-level for the same
// keep-the-DOM-node reason as ItemCard.
function Disclosure({ id, label, open, onToggle, count }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={id}
      className="w-full min-h-[44px] flex items-center justify-between gap-2 py-2 text-sm font-medium"
      style={{ color: 'var(--text-2)' }}
    >
      <span>{label}{typeof count === 'number' ? ` (${count})` : ''}</span>
      <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} aria-hidden="true" />
    </button>
  );
}

// The Grow tab as a PATH, not a catalogue: one recommended next step leads the
// page — continue the guide already begun, else the next new one — derived
// purely from on-device progress (no questionnaire). The rest of the library
// waits behind "Browse all guides", and completed guides fold into a collapsed
// History, so a growing believer always faces one understandable step instead
// of a grid of equally-weighted options.
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
  // The browsable rest: everything not already surfaced by the next-step card
  // and not completed (those live in History).
  const browsable = guides.filter((g) => g.id !== recommendation?.guide?.id && !completedIds.has(g.id));

  const REC_DESC_KEYS = { continue: 'growContinueDesc', new: 'growNewDesc', again: 'growAgainDesc' };

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
    <div>
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

      <div className="px-4 md:px-8 pt-8 pb-6" style={{ background: 'var(--header)' }}>
        <h2 className="text-xl font-semibold text-white">🌱 {t(lang, 'growTitle')}</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{t(lang, 'growSubtitle')}</p>
      </div>

      <div className="px-4 md:px-8 pt-5 max-w-2xl mx-auto">
        {/* ONE recommended next step, from existing progress — an in-progress
            guide always outranks anything new. */}
        {recommendation && (
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'growNextStep')}
            </p>
            <button
              onClick={() => setOpenGuide(recommendation.guide)}
              className="w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-all motion-reduce:transition-none hover:scale-[1.01] motion-reduce:hover:scale-100"
              style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}
            >
              <span className="text-2xl shrink-0 leading-none mt-0.5">{recommendation.guide.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  {pick(recommendation.guide.title, lang)}
                </span>
                <span className="block text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {t(lang, REC_DESC_KEYS[recommendation.type])}
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 mt-1" style={{ color: 'var(--accent)' }} />
            </button>
          </div>
        )}

        {/* Segmented toggle: pray through vs. learn */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          {[
            { id: 'pray', label: t(lang, 'growPray'), icon: HandHeart },
            { id: 'learn', label: t(lang, 'growLearn'), icon: BookOpen },
          ].map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-pressed={active}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all motion-reduce:transition-none"
                style={active
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { color: 'var(--text-3)' }}
              >
                <Icon size={15} /> {label}
              </button>
            );
          })}
        </div>

        {view === 'pray' ? (
          <>
            {/* Browsing the whole library is the SECONDARY action; the next
                step above already carries the primary invitation. */}
            {browsable.length > 0 && (
              <>
                <Disclosure id="grow-browse" label={t(lang, 'growBrowseAll')} open={browseOpen} onToggle={() => setBrowseOpen((v) => !v)} />
                {browseOpen && (
                  <div id="grow-browse" className="flex flex-col gap-3 mb-2">
                    {browsable.map((item) => (
                      <ItemCard key={item.id} item={item} lang={lang} onOpen={() => setOpenGuide(item)} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Completed guides retire into a collapsed History. */}
            {completed.length > 0 && (
              <>
                <Disclosure id="grow-history" label={t(lang, 'growHistory')} count={completed.length} open={historyOpen} onToggle={() => setHistoryOpen((v) => !v)} />
                {historyOpen && (
                  <div id="grow-history" className="flex flex-col gap-3 mb-2">
                    {completed.map((item) => (
                      <ItemCard key={item.id} item={item} lang={lang} onOpen={() => setOpenGuide(item)} done />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'growLearnIntro')}
            </p>
            <div className="flex flex-col gap-3">
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
        <button
          onClick={() => setOpenJourney(true)}
          className="w-full text-left rounded-2xl p-3.5 mt-5 mb-8 flex items-center gap-3 transition-all motion-reduce:transition-none hover:scale-[1.01] motion-reduce:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)', outlineColor: 'var(--accent)' }}
        >
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
            <Sunrise size={16} className="text-white" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'growSeekerTitle')}</span>
            <span className="block text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'growSeekerDesc')}</span>
          </span>
          <ChevronRight size={15} className="shrink-0 opacity-60" style={{ color: 'var(--accent)' }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
