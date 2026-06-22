import { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Plus, Trash2, Edit2, Sparkles, Loader2, BookOpen, ExternalLink } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { format } from 'date-fns';
import { fr, enUS, de, ptBR } from 'date-fns/locale';
import { getAIRecommendations } from '../aiRecommendations';
import { t } from '../i18n';
import useTranslationStore from '../store/translationStore';

const DATE_LOCALES = { fr, en: enUS, de, pt: ptBR };

export default function PrayerCard({ prayer, onEdit, lang = 'fr' }) {
  const [expanded, setExpanded] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [showTestimony, setShowTestimony] = useState(false);
  const [testimony, setTestimony] = useState('');
  const [updateRecs, setUpdateRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState(null);
  const [expandedVerse, setExpandedVerse] = useState(null);

  const { categories, markAnswered, markActive, addUpdate, addPrayerPoint, removePrayerPoint, deletePrayer } = usePrayerStore();
  const { tr } = useTranslationStore();
  const dateLocale = DATE_LOCALES[lang] || fr;
  const prayerCategoryIds = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  const prayerCategories = categories.filter((c) => prayerCategoryIds.includes(c.id));
  const isAnswered = prayer.status === 'answered';

  const handleAddUpdate = () => {
    if (!newUpdate.trim()) return;
    addUpdate(prayer.id, newUpdate.trim());
    setNewUpdate('');
    setUpdateRecs([]);
  };

  const bibleUrl = (verse) =>
    `https://www.bible.com/search/bible?q=${encodeURIComponent(verse)}&version_id=93`;

  const fetchUpdateRecs = async () => {
    if (loadingRecs) return;
    const lastUpdate = (prayer.prayer_updates || []).slice(-1)[0]?.text || prayer.title;
    setLoadingRecs(true);
    setRecsError(null);
    const { recs, error } = await getAIRecommendations({ title: prayer.title, description: lastUpdate, type: 'evolution', lang });
    setUpdateRecs(recs);
    setRecsError(error);
    setLoadingRecs(false);
  };

  const handleMarkAnswered = () => {
    if (showTestimony) {
      markAnswered(prayer.id, testimony);
      setShowTestimony(false);
      setTestimony('');
    } else {
      setShowTestimony(true);
    }
  };

  return (
    <div className="mb-3 overflow-hidden transition-all" style={{ background: 'var(--surface)', borderRadius: '18px', border: '0.5px solid var(--border)' }}>
      {/* Colored header */}
      <div
        className="px-4 py-3"
        style={{ background: isAnswered ? 'var(--header-answered)' : 'var(--header)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-semibold leading-snug mb-1.5"
              style={{ color: 'rgba(255,255,255,0.95)', textDecoration: isAnswered ? 'line-through' : 'none' }}
            >
              {tr(prayer.title, lang)}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {prayerCategories.map((c) => (
                <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.2)' }}>
                  {c.emoji} {tr(c.name, lang)}
                </span>
              ))}
              {prayer.for_other && prayer.person_name && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                  👤 {prayer.person_name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              {isAnswered ? t(lang, 'answered2') : t(lang, 'active2')}
            </span>
            <button onClick={() => setExpanded(!expanded)} style={{ color: '#8b8ac2' }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {!expanded && prayer.description && (
        <p className="text-xs px-4 py-2.5 line-clamp-1" style={{ color: 'var(--text-3)' }}>{tr(prayer.description, lang)}</p>
      )}

      {expanded && (
        <div className="px-4 pb-4 pt-3">
          {prayer.description && (
            <p className="text-sm mb-3" style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>{tr(prayer.description, lang)}</p>
          )}

          {isAnswered && prayer.testimony && (
            <div className="rounded-xl p-3 mb-3" style={{ background: '#e8f5ed', border: '0.5px solid #b8dfc8' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#1a4a2e' }}>{t(lang, 'testimony')}</p>
              <p className="text-xs" style={{ color: '#2a6040' }}>{tr(prayer.testimony, lang)}</p>
            </div>
          )}

          <p className="text-xs mb-3" style={{ color: '#c5bdd4' }}>
            {t(lang, 'addedOn')} {format(new Date(prayer.created_at), 'd MMMM yyyy', { locale: dateLocale })}
            {prayer.answered_at && ` ${t(lang, 'answeredOn')} ${format(new Date(prayer.answered_at), 'd MMMM yyyy', { locale: dateLocale })}`}
          </p>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Évolutions */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'evolutions')}</p>
              {(prayer.prayer_updates || []).length === 0 && (
                <p className="text-xs italic" style={{ color: '#d4c8e4' }}>{t(lang, 'noUpdate')}</p>
              )}
              {(prayer.prayer_updates || []).map((u) => (
                <div key={u.id} className="flex gap-2 mb-2">
                  <div className="w-0.5 rounded-full shrink-0 mt-1" style={{ background: '#7c5cfc', alignSelf: 'stretch', minHeight: '12px' }} />
                  <div>
                    <p className="text-xs leading-snug" style={{ color: 'var(--text-1)' }}>{tr(u.text, lang)}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#c5bdd4' }}>{format(new Date(u.created_at), 'd MMM yy', { locale: dateLocale })}</p>
                  </div>
                </div>
              ))}
              {!isAnswered && (
                <div className="flex gap-1.5 mt-2">
                  <input
                    type="text"
                    value={newUpdate}
                    onChange={(e) => setNewUpdate(e.target.value)}
                    placeholder={t(lang, 'newUpdate')}
                    className="flex-1 text-xs rounded-lg px-2.5 py-1.5 min-w-0 focus:outline-none"
                    style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUpdate()}
                  />
                  <button onClick={handleAddUpdate} className="rounded-lg px-2 flex items-center justify-center" style={{ background: '#7c5cfc', color: '#fff' }}>
                    <Plus size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Sujets IA */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiSubjects')}</p>
                {!isAnswered && (
                  <button
                    onClick={fetchUpdateRecs}
                    disabled={loadingRecs}
                    className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #e8c0fc, #7c5cfc)', color: '#fff' }}
                  >
                    {loadingRecs ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                    {t(lang, 'aiSuggest')}
                  </button>
                )}
              </div>

              {(prayer.prayer_points || []).length === 0 && !loadingRecs && updateRecs.length === 0 && (
                <p className="text-xs italic" style={{ color: '#d4c8e4' }}>{t(lang, 'aiPlaceholder')}</p>
              )}

              {(prayer.prayer_points || []).map((pp) => (
                <div key={pp.id} className="mb-2 group">
                  <div className="flex gap-1.5 items-start">
                    <div className="flex-1 min-w-0 rounded-lg p-2" style={{ background: '#fff8e6', borderLeft: '2px solid #f5c842' }}>
                      <p className="text-xs leading-snug" style={{ color: '#5a4500' }}>{tr(pp.title, lang)}</p>
                      <button onClick={() => setExpandedVerse(expandedVerse === pp.id ? null : pp.id)} className="flex items-center gap-1 text-xs mt-1" style={{ color: '#c4a020' }}>
                        <BookOpen size={9} />{pp.verse}
                      </button>
                    </div>
                    <button onClick={() => removePrayerPoint(prayer.id, pp.id)} className="opacity-0 group-hover:opacity-100 mt-1 shrink-0 transition-opacity" style={{ color: '#d4c8e4' }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                  {expandedVerse === pp.id && (
                    <div className="mt-1.5 rounded-lg p-2" style={{ background: '#fffbf0', border: '0.5px solid #f0dfa0' }}>
                      {pp.verse_text && <p className="text-xs italic leading-relaxed mb-1.5" style={{ color: '#5a4500' }}>"{tr(pp.verse_text, lang)}"</p>}
                      <a href={bibleUrl(pp.verse)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium" style={{ color: '#7c5cfc' }}>
                        <ExternalLink size={9} /> {t(lang, 'openBible')}
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {recsError && <p className="text-xs rounded-lg px-2 py-1.5" style={{ color: '#a07010', background: '#fff8e0' }}>{recsError}</p>}
              {updateRecs.map((rec) => (
                <div key={rec.title} className="mb-2">
                  <div className="flex gap-1.5 items-start">
                    <div className="flex-1 min-w-0 rounded-lg p-2" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                      <p className="text-xs leading-snug font-medium" style={{ color: 'var(--text-1)' }}>{rec.title}</p>
                      <button onClick={() => setExpandedVerse(expandedVerse === rec.verse ? null : rec.verse)} className="flex items-center gap-1 text-xs mt-1" style={{ color: '#7c5cfc' }}>
                        <BookOpen size={9} />{rec.verse}
                      </button>
                    </div>
                    <button
                      onClick={() => { addPrayerPoint(prayer.id, { title: rec.title, verse: rec.verse, verseText: rec.verseText }); setUpdateRecs((prev) => prev.filter((r) => r.title !== rec.title)); }}
                      className="mt-1 rounded-lg p-1 shrink-0" style={{ background: '#7c5cfc', color: '#fff' }}
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  {expandedVerse === rec.verse && (
                    <div className="mt-1.5 rounded-lg p-2" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                      {rec.verseText && <p className="text-xs italic leading-relaxed mb-1.5" style={{ color: 'var(--text-1)' }}>"{rec.verseText}"</p>}
                      <a href={bibleUrl(rec.verse)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium" style={{ color: '#7c5cfc' }}>
                        <ExternalLink size={9} /> {t(lang, 'openBible')}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showTestimony && (
            <div className="mb-3">
              <textarea
                value={testimony}
                onChange={(e) => setTestimony(e.target.value)}
                placeholder={t(lang, 'testimonyPlaceholder')}
                className="w-full text-xs rounded-xl px-3 py-2 resize-none focus:outline-none"
                style={{ border: '0.5px solid #b8dfc8', background: '#f0faf4', color: '#1a4a2e' }}
                rows={2}
              />
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {!isAnswered && (
              <button onClick={handleMarkAnswered} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium" style={{ background: '#e8f5ed', color: '#1a6b42' }}>
                <CheckCircle size={12} />
                {showTestimony ? t(lang, 'confirm') : t(lang, 'markAnswered')}
              </button>
            )}
            {isAnswered && (
              <button onClick={() => markActive(prayer.id)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {t(lang, 'resumePrayer')}
              </button>
            )}
            <button onClick={() => onEdit(prayer)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl ml-auto" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <Edit2 size={12} />
            </button>
            <button onClick={() => deletePrayer(prayer.id)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl" style={{ background: '#fdf0f0', color: '#c04040' }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
