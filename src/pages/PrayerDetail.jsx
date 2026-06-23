import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, CheckCircle, Sparkles, Loader2, BookOpen, ExternalLink } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { format } from 'date-fns';
import { fr, enUS, de, ptBR } from 'date-fns/locale';
import { getAIRecommendations } from '../aiRecommendations';
import { t } from '../i18n';
import AiConsentModal, { hasAiConsent } from '../components/AiConsentModal';

const DATE_LOCALES = { fr, en: enUS, de, pt: ptBR };

export default function PrayerDetail({ prayer, onBack, onEdit, lang = 'en' }) {
  const [newUpdate, setNewUpdate] = useState('');
  const [showTestimony, setShowTestimony] = useState(true);
  const [testimony, setTestimony] = useState('');
  const [updateRecs, setUpdateRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState(null);
  const [expandedVerse, setExpandedVerse] = useState(null);
  const [manualPoint, setManualPoint] = useState({ title: '', verse: '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [addingVerseTo, setAddingVerseTo] = useState(null); // pointId
  const [newVerse, setNewVerse] = useState({ ref: '', text: '' });
  const [showAiConsent, setShowAiConsent] = useState(false);

  const { categories, markAnswered, markActive, addUpdate, addPrayerPoint, addVerseToPoint, removeVerseFromPoint, removePrayerPoint, deletePrayer, prayers } = usePrayerStore();
  const { tr } = useTranslationStore();
  const dateLocale = DATE_LOCALES[lang] || enUS;

  // Clear pending AI suggestions when language changes so user can re-generate in new language
  useEffect(() => { setUpdateRecs([]); setRecsError(null); }, [lang]);

  const livePrayer = prayers.find(p => p.id === prayer.id) || prayer;
  const isAnswered = livePrayer.status === 'answered';
  const prayerCategoryIds = (livePrayer.prayer_categories || []).map(pc => pc.category_id);
  const prayerCategories = categories.filter(c => prayerCategoryIds.includes(c.id));

  const bibleUrl = verse => `https://www.bible.com/search/bible?q=${encodeURIComponent(verse)}&version_id=93`;

  const handleAddUpdate = () => {
    if (!newUpdate.trim()) return;
    addUpdate(livePrayer.id, newUpdate.trim());
    setNewUpdate('');
    setUpdateRecs([]);
  };

  const fetchRecs = async () => {
    if (loadingRecs) return;
    if (!hasAiConsent('prayer')) { setShowAiConsent(true); return; }
    const lastUpdate = (livePrayer.prayer_updates || []).slice(-1)[0]?.text || livePrayer.title;
    setLoadingRecs(true);
    setRecsError(null);
    const { recs, error } = await getAIRecommendations({ title: livePrayer.title, description: lastUpdate, type: 'evolution', lang });
    setUpdateRecs(recs);
    setRecsError(error);
    setLoadingRecs(false);
  };

  const handleMarkAnswered = () => {
    if (showTestimony) {
      markAnswered(livePrayer.id, testimony);
      setShowTestimony(false);
      setTestimony('');
    } else {
      setShowTestimony(true);
    }
  };

  const handleDelete = () => {
    deletePrayer(livePrayer.id);
    onBack();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {showAiConsent && (
        <AiConsentModal
          lang={lang}
          onAccept={() => { setShowAiConsent(false); fetchRecs(); }}
          onCancel={() => setShowAiConsent(false)}
        />
      )}
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-4 md:px-8 py-4 flex items-center gap-3"
        style={{ background: isAnswered ? 'var(--header-answered)' : 'var(--header)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={onBack}
          title={t(lang, 'tipBack')}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-white truncate" style={{ textDecoration: isAnswered ? 'line-through' : 'none' }}>
            {tr(livePrayer.title, lang)}
          </h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {format(new Date(livePrayer.created_at), 'd MMMM yyyy', { locale: dateLocale })}
            {livePrayer.answered_at && ` · ${t(lang, 'answeredOn')} ${format(new Date(livePrayer.answered_at), 'd MMM yyyy', { locale: dateLocale })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onEdit(livePrayer)}
            title={t(lang, 'tipEditPrayer')}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={handleDelete}
            title={t(lang, 'tipDeletePrayer')}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto space-y-4">

        {/* Categories */}
        {prayerCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {prayerCategories.map(c => (
              <span key={c.id} className="text-xs px-3 py-1.5 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
                {c.emoji} {tr(c.name, lang)}
              </span>
            ))}
            {livePrayer.for_other && livePrayer.person_name && (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
                👤 {livePrayer.person_name}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {livePrayer.description && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'details')}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
              {tr(livePrayer.description, lang)}
            </p>
          </div>
        )}

        {/* Testimony */}
        {isAnswered && livePrayer.testimony && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--card-answered-bg)', border: '0.5px solid var(--card-answered-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--success)' }}>{t(lang, 'testimony')}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>"{tr(livePrayer.testimony, lang)}"</p>
          </div>
        )}

        {/* Prayer points */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiSubjects')}</p>
            {!isAnswered && (
              <button
                onClick={fetchRecs}
                disabled={loadingRecs}
                title={t(lang, 'tipAiSuggest')}
                className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 font-medium disabled:opacity-50 text-white"
                style={{ background: 'var(--accent)' }}
              >
                {loadingRecs ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {t(lang, 'aiSuggest')}
              </button>
            )}
          </div>

          {(livePrayer.prayer_points || []).length === 0 && !loadingRecs && updateRecs.length === 0 && (
            <p className="text-sm italic" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiPlaceholder')}</p>
          )}

          <div className="space-y-2">
            {(livePrayer.prayer_points || []).map(pp => {
              // Support both new `verses` array and legacy `verse`/`verse_text` fields
              const verses = pp.verses?.length
                ? pp.verses
                : pp.verse ? [{ ref: pp.verse, text: pp.verse_text || '' }] : [];
              return (
                <div key={pp.id} className="group rounded-xl p-3" style={{ background: '#fff8e6', borderLeft: '3px solid #f5c842' }}>
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm leading-snug" style={{ color: '#5a4500' }}>{tr(pp.title, lang)}</p>
                    {!isAnswered && (
                      <button onClick={() => removePrayerPoint(livePrayer.id, pp.id)} title={t(lang, 'tipRemovePoint')} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#c4a020' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Verse pills */}
                  {verses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {verses.map((v, i) => (
                        <div key={i} className="group/verse">
                          <button
                            onClick={() => setExpandedVerse(expandedVerse === `${pp.id}-${i}` ? null : `${pp.id}-${i}`)}
                            title={t(lang, 'tipVerseToggle')}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                            style={{ background: '#f5e8a0', color: '#7a5e00' }}
                          >
                            <BookOpen size={9} /> {v.ref}
                          </button>
                          {expandedVerse === `${pp.id}-${i}` && (
                            <div className="mt-1.5 rounded-xl p-3" style={{ background: '#fffbf0', border: '0.5px solid #f0dfa0' }}>
                              {v.text && <p className="text-sm italic leading-relaxed mb-2" style={{ color: '#5a4500' }}>"{tr(v.text, lang)}"</p>}
                              <div className="flex items-center justify-between">
                                <a href={bibleUrl(v.ref)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                                  <ExternalLink size={11} /> {t(lang, 'openBible')}
                                </a>
                                {!isAnswered && (
                                  <button onClick={() => removeVerseFromPoint(livePrayer.id, pp.id, v.ref)} title={t(lang, 'tipRemoveVerse')} className="text-xs" style={{ color: '#c04040' }}>
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add verse inline form */}
                  {!isAnswered && (
                    addingVerseTo === pp.id ? (
                      <div className="mt-2 space-y-1.5">
                        <input
                          type="text"
                          value={newVerse.ref}
                          onChange={e => setNewVerse(v => ({ ...v, ref: e.target.value }))}
                          placeholder={t(lang, 'verseRefPlaceholder')}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                          style={{ background: '#fffbf0', border: '0.5px solid #f0dfa0', color: '#5a4500' }}
                          autoFocus
                        />
                        <input
                          type="text"
                          value={newVerse.text}
                          onChange={e => setNewVerse(v => ({ ...v, text: e.target.value }))}
                          placeholder={t(lang, 'verseTextPlaceholder')}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                          style={{ background: '#fffbf0', border: '0.5px solid #f0dfa0', color: '#5a4500' }}
                        />
                        <div className="flex gap-1.5">
                          <button onClick={() => { setAddingVerseTo(null); setNewVerse({ ref: '', text: '' }); }} className="flex-1 text-xs rounded-lg py-1.5" style={{ background: '#f5e8a0', color: '#7a5e00' }}>{t(lang, 'cancel')}</button>
                          <button
                            onClick={() => {
                              if (!newVerse.ref.trim()) return;
                              addVerseToPoint(livePrayer.id, pp.id, { ref: newVerse.ref.trim(), text: newVerse.text.trim() });
                              setAddingVerseTo(null);
                              setNewVerse({ ref: '', text: '' });
                            }}
                            title={t(lang, 'tipSaveVerse')}
                            className="flex-1 text-xs rounded-lg py-1.5 font-medium"
                            style={{ background: '#f5c842', color: '#5a4500' }}
                          >
                            {t(lang, 'addVerse')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingVerseTo(pp.id); setNewVerse({ ref: '', text: '' }); }}
                        title={t(lang, 'tipAddVerse')}
                        className="mt-1.5 flex items-center gap-1 text-xs"
                        style={{ color: '#c4a020' }}
                      >
                        <Plus size={11} /> {t(lang, 'addVerse')}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {recsError && <p className="text-xs rounded-xl px-3 py-2 mt-2" style={{ color: '#a07010', background: '#fff8e0' }}>{recsError}</p>}

          <div className="space-y-2 mt-2">
            {updateRecs.map(rec => (
              <div key={rec.title} className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                <div className="flex gap-2 items-start">
                  <p className="flex-1 text-sm leading-snug font-medium" style={{ color: 'var(--text-1)' }}>{rec.title}</p>
                  <button
                    onClick={() => { addPrayerPoint(livePrayer.id, { title: rec.title, verses: rec.verses }); setUpdateRecs(prev => prev.filter(r => r.title !== rec.title)); }}
                    title={t(lang, 'tipAddPoint')}
                    className="shrink-0 rounded-xl p-1.5 text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                {(rec.verses || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rec.verses.map((v, i) => (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedVerse(expandedVerse === `rec-${rec.title}-${i}` ? null : `rec-${rec.title}-${i}`)}
                          title={t(lang, 'tipVerseToggle')}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                          style={{ background: 'var(--accent-border)', color: 'var(--accent)' }}
                        >
                          <BookOpen size={9} /> {v.ref}
                        </button>
                        {expandedVerse === `rec-${rec.title}-${i}` && (
                          <div className="mt-1.5 rounded-xl p-2" style={{ background: 'var(--surface)', border: '0.5px solid var(--accent-border)' }}>
                            {v.text && <p className="text-xs italic leading-relaxed mb-1.5" style={{ color: 'var(--text-2)' }}>"{v.text}"</p>}
                            <a href={bibleUrl(v.ref)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                              <ExternalLink size={10} /> {t(lang, 'openBible')}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Manual prayer point input */}
          {!isAnswered && (
            showManualForm ? (
              <div className="mt-3 rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)' }}>
                <input
                  type="text"
                  value={manualPoint.title}
                  onChange={e => setManualPoint(p => ({ ...p, title: e.target.value }))}
                  placeholder={t(lang, 'pointTitlePlaceholder')}
                  className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                  autoFocus
                />
                <input
                  type="text"
                  value={manualPoint.verse}
                  onChange={e => setManualPoint(p => ({ ...p, verse: e.target.value }))}
                  placeholder={t(lang, 'pointVersePlaceholder')}
                  className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowManualForm(false)}
                    className="flex-1 text-sm rounded-xl py-2"
                    style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                  >
                    {t(lang, 'cancel')}
                  </button>
                  <button
                    onClick={() => {
                      if (!manualPoint.title.trim()) return;
                      addPrayerPoint(livePrayer.id, { title: manualPoint.title.trim(), verse: manualPoint.verse.trim() });
                      setManualPoint({ title: '', verse: '' });
                      setShowManualForm(false);
                    }}
                    title={t(lang, 'tipAddManualPoint')}
                    className="flex-1 text-sm rounded-xl py-2 font-medium text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    {t(lang, 'addBtn')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowManualForm(true)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                <Plus size={13} /> {t(lang, 'addPointManually')}
              </button>
            )
          )}
        </div>

                {/* Updates */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'evolutions')}</p>

          {(livePrayer.prayer_updates || []).length === 0 && (
            <p className="text-sm italic mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'noUpdate')}</p>
          )}

          <div className="space-y-3 mb-3">
            {(livePrayer.prayer_updates || []).map(u => (
              <div key={u.id} className="flex gap-3">
                <div className="w-0.5 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--accent)', alignSelf: 'stretch', minHeight: '14px' }} />
                <div>
                  <p className="text-sm leading-snug" style={{ color: 'var(--text-1)' }}>{tr(u.text, lang)}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{format(new Date(u.created_at), 'd MMM yy', { locale: dateLocale })}</p>
                </div>
              </div>
            ))}
          </div>

          {!isAnswered && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newUpdate}
                onChange={e => setNewUpdate(e.target.value)}
                placeholder={t(lang, 'newUpdate')}
                className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                onKeyDown={e => e.key === 'Enter' && handleAddUpdate()}
              />
              <button onClick={handleAddUpdate} title={t(lang, "tipSaveUpdate")} className="rounded-xl px-4 flex items-center justify-center text-white text-sm font-medium" style={{ background: 'var(--accent)' }}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>


        {/* Testimony input */}
        {showTestimony && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'testimony')}</p>
            <textarea
              value={testimony}
              onChange={e => setTestimony(e.target.value)}
              placeholder={t(lang, 'testimonyPlaceholder')}
              className="w-full text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
              rows={3}
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          {!isAnswered && (
            <button onClick={handleMarkAnswered} title={showTestimony ? t(lang, "tipConfirm") : t(lang, "tipMarkAnswered")} className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-medium" style={{ background: 'var(--card-answered-bg)', color: 'var(--success)', border: '0.5px solid var(--card-answered-border)' }}>
              <CheckCircle size={15} />
              {showTestimony ? t(lang, 'confirm') : t(lang, 'markAnswered')}
            </button>
          )}
          {isAnswered && (
            <button onClick={() => markActive(livePrayer.id)} title={t(lang, "tipResume")} className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {t(lang, 'resumePrayer')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
