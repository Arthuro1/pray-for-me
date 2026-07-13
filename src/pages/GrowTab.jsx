import { useState } from 'react';
import { ChevronRight, HandHeart, BookOpen, Sunrise } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import { useLocalizedArticles } from '../hooks/useLocalizedArticles';
import { useLocalizedGuides } from '../hooks/useLocalizedGuides';
import { useLocalizedJourney } from '../hooks/useLocalizedJourney';
import GuideReader from '../components/GuideReader';
import ArticleReader from '../components/ArticleReader';
import GospelJourneyReader from '../components/GospelJourneyReader';

// The Grow tab: a small library that helps the believer learn to pray according
// to God's Word. Two sections — prayer guides to PRAY THROUGH, and theology
// explanations to READ — both Scripture-first, both pointing past the app to Christ.
//
// Near the top sits one gentle, optional invitation for people new to prayer or
// exploring the faith: the gospel journey. It never auto-opens, never blocks the
// Pray/Learn sections, and stays available after it's been read or dismissed.
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

  // Both guides and articles carry per-language translations loaded on demand;
  // en/fr are authored in the source and any missing field falls back through pick().
  const guides = useLocalizedGuides(lang);
  const articles = useLocalizedArticles(lang);
  const journey = useLocalizedJourney(lang);
  const items = view === 'pray' ? guides : articles;

  // The journey and the Learn articles reference each other by STABLE id, never by
  // translated title, so navigation is language-independent.
  const openArticleById = (id) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;
    setOpenJourney(false);
    setView('learn');
    setOpenArticle(article);
  };

  const ItemCard = ({ item, onOpen }) => (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-all motion-reduce:transition-none hover:scale-[1.01] motion-reduce:hover:scale-100"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
    >
      <span className="text-2xl shrink-0 leading-none mt-0.5">{item.emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{pick(item.title, lang)}</span>
        <span className="block text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-3)' }}>{pick(item.summary, lang)}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 mt-1 opacity-50" style={{ color: 'var(--text-3)' }} />
    </button>
  );

  return (
    <div>
      {openGuide && <GuideReader guide={openGuide} lang={lang} onClose={() => setOpenGuide(null)} />}
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
        {/* Gentle, optional invitation for those new to prayer or exploring faith.
            Opens the gospel journey only when explicitly selected — it never
            auto-opens and never diminishes the Pray/Learn options below. */}
        <button
          onClick={() => setOpenJourney(true)}
          className="w-full text-left rounded-2xl p-4 mb-5 flex items-center gap-3.5 transition-all motion-reduce:transition-none hover:scale-[1.01] motion-reduce:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)', outlineColor: 'var(--accent)' }}
        >
          <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
            <Sunrise size={20} className="text-white" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'growSeekerTitle')}</span>
            <span className="block text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'growSeekerDesc')}</span>
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              {t(lang, 'growSeekerCta')} <ChevronRight size={13} aria-hidden="true" />
            </span>
          </span>
        </button>

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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all motion-reduce:transition-none"
                style={active
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { color: 'var(--text-3)' }}
              >
                <Icon size={15} /> {label}
              </button>
            );
          })}
        </div>

        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-3)' }}>
          {t(lang, view === 'pray' ? 'growPrayIntro' : 'growLearnIntro')}
        </p>

        <div className="flex flex-col gap-3 pb-8">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onOpen={() => (view === 'pray' ? setOpenGuide(item) : setOpenArticle(item))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
