import { useState } from 'react';
import { ChevronRight, HandHeart, BookOpen } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { guides, pick } from '../content/teaching';
import { useLocalizedArticles } from '../hooks/useLocalizedArticles';
import GuideReader from '../components/GuideReader';
import ArticleReader from '../components/ArticleReader';

// The Grow tab: a small library that helps the believer learn to pray according
// to God's Word. Two sections — prayer guides to PRAY THROUGH, and theology
// explanations to READ — both Scripture-first, both pointing past the app to Christ.
export default function GrowTab() {
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'fr';
  const [view, setView] = useState('pray'); // 'pray' | 'learn'
  const [openGuide, setOpenGuide] = useState(null);
  const [openArticle, setOpenArticle] = useState(null);

  // Articles carry per-language translations loaded on demand; guides are authored
  // in en/fr and fall back through pick().
  const articles = useLocalizedArticles(lang);
  const items = view === 'pray' ? guides : articles;

  const ItemCard = ({ item, onOpen }) => (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-all hover:scale-[1.01]"
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
      {openArticle && <ArticleReader article={openArticle} lang={lang} onClose={() => setOpenArticle(null)} />}

      <div className="px-4 md:px-8 pt-8 pb-6" style={{ background: 'var(--header)' }}>
        <h2 className="text-xl font-semibold text-white">🌱 {t(lang, 'growTitle')}</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{t(lang, 'growSubtitle')}</p>
      </div>

      <div className="px-4 md:px-8 pt-5 max-w-2xl mx-auto">
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
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
