import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { dateLocale } from '../utils/date';
import { t } from '../i18n';

// A reflective "God's faithfulness" view of all answered prayers.
export default function AnsweredTab() {
  const navigate = useNavigate();
  const { prayers, categories, settings } = usePrayerStore();
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';
  const locale = dateLocale(lang);

  const answered = prayers
    .filter(p => p.status === 'answered')
    .sort((a, b) => new Date(b.answered_at || b.updated_at || 0) - new Date(a.answered_at || a.updated_at || 0));

  return (
    <div>
      <div className="px-4 md:px-8 pt-8 pb-6" style={{ background: 'var(--header)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
          <ArrowLeft size={16} /> {t(lang, 'today')}
        </button>
        <h2 className="text-xl font-semibold text-white">🎉 {t(lang, 'answeredTitle')}</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{t(lang, 'faithfulness')}</p>
      </div>

      <div className="px-4 md:px-8 pt-5 max-w-2xl mx-auto">
        {answered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🙏</p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'noAnsweredYet')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'noAnsweredSub')}</p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
              {answered.length} {answered.length !== 1 ? t(lang, 'prayers2') : t(lang, 'prayer')}
            </p>
            <div className="flex flex-col gap-3 pb-6">
              {answered.map(prayer => {
                const pCatIds = (prayer.prayer_categories || []).map(pc => pc.category_id);
                const pCats = categories.filter(c => pCatIds.includes(c.id));
                return (
                  <button key={prayer.id} onClick={() => navigate(`/prayers/${prayer.id}`)}
                    className="text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderLeft: '3px solid var(--success)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</p>
                    {prayer.testimony && (
                      <p className="text-sm italic leading-relaxed mb-2" style={{ color: 'var(--text-2)' }}>"{tr(prayer.testimony, lang)}"</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {prayer.answered_at && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#e8f5ed', color: '#059669' }}>
                          🙌 {format(new Date(prayer.answered_at), 'd MMM yyyy', { locale })}
                        </span>
                      )}
                      {pCats.map(c => (
                        <span key={c.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                          {c.emoji} {tr(c.name, lang)}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
