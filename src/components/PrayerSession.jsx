import { useState } from 'react';
import { X, Check, ChevronRight, BookOpen } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

// A focused, full-screen "Pray now" flow: walk through today's prayers one at a
// time, then a closing screen. Completing it marks the day as prayed (streak).
export default function PrayerSession({ prayers, categories, lang, tr, onClose, onComplete }) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  const total = prayers.length;
  const advance = () => {
    if (index + 1 >= total) { setDone(true); onComplete?.(); }
    else setIndex(index + 1);
  };

  const overlay = (children) => (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'prayNow')} tabIndex={-1} className="flex flex-col h-full focus:outline-none">
        {children}
      </div>
    </div>
  );

  if (done) {
    return overlay(
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
        <div className="text-6xl mb-1">🙏</div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'sessionDoneTitle')}</h2>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'sessionDoneSub', { n: total })}</p>
        <button
          onClick={onClose}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          {t(lang, 'close')}
        </button>
      </div>
    );
  }

  const prayer = prayers[index];
  const ids = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  const cats = categories.filter((c) => ids.includes(c.id));
  const points = prayer.prayer_points || [];

  return overlay(
    <>
      {/* Header: progress + close */}
      <div className="shrink-0 px-5 pt-4 pb-3" style={{ background: 'var(--header)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {index + 1} / {total}
          </span>
          <button onClick={onClose} aria-label={t(lang, 'close')} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((index + 1) / total) * 100}%`, background: '#fff' }} />
        </div>
      </div>

      {/* Current prayer */}
      <div className="flex-1 overflow-y-auto px-6 py-7 max-w-xl mx-auto w-full">
        {(cats.length > 0 || (prayer.for_other && prayer.person_name)) && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {cats.map((c) => (
              <span key={c.id} className="text-xs px-3 py-1 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
                {c.emoji} {tr(c.name, lang)}
              </span>
            ))}
            {prayer.for_other && prayer.person_name && (
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
                👤 {prayer.person_name}
              </span>
            )}
          </div>
        )}

        <h2 className="text-2xl font-semibold leading-snug mb-3" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</h2>

        {prayer.description && (
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>{tr(prayer.description, lang)}</p>
        )}

        {points.length > 0 && (
          <div className="space-y-3">
            {points.map((pp, i) => (
              <div key={pp.id || i} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{tr(pp.title, lang)}</p>
                {(pp.verses || []).map((v, vi) => (
                  <div key={vi} className="mt-2 pl-3" style={{ borderLeft: '2px solid var(--accent-border)' }}>
                    {v.text && <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-2)' }}>"{v.text}"</p>}
                    {v.ref && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                        <BookOpen size={11} /> {v.ref}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="shrink-0 px-6 py-4 flex items-center gap-3 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
        <button onClick={advance} className="text-sm px-4 py-3" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'skip')}
        </button>
        <button
          onClick={advance}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          {index + 1 >= total ? <><Check size={16} /> {t(lang, 'prayedBtn')}</> : <>{t(lang, 'prayedBtn')} <ChevronRight size={16} /></>}
        </button>
      </div>
    </>
  );
}
