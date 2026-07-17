import { useState } from 'react';
import { Check, HandHeart, X } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { useShallow } from 'zustand/react/shallow';
import AudienceBadge from './shared/AudienceBadge';
import { audienceOf } from '../lib/audience';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { todayKey } from '../lib/prayedLog';
import PrayerSession from './PrayerSession';

// Shown right after a new personal prayer is saved: a calm "Saved privately"
// confirmation with ONE decision — pray now, or be done. "Pray now" opens a real
// prayer session on the prayer that was just written (not a mere modal close).
// Scripture, reminders and sharing are surfaced later, from the prayer detail
// page, so this moment stays about praying rather than configuring.
export default function PrayerSavedStep({ prayerId, title, description, lang, onClose }) {
  const [praying, setPraying] = useState(false);
  const { prayers, categories, markPrayedOn } = usePrayerStore(
    useShallow((s) => ({ prayers: s.prayers, categories: s.categories, markPrayedOn: s.markPrayedOn }))
  );
  const { tr } = useTranslationStore();
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  if (praying) {
    // The optimistic store copy is already present; fall back to the values we
    // were handed so the session can never open on an empty screen.
    const prayer = prayers.find((p) => p.id === prayerId)
      || { id: prayerId, title, description, prayer_categories: [], prayer_points: [] };
    return (
      <PrayerSession
        prayers={[prayer]}
        categories={categories}
        lang={lang}
        tr={tr}
        onClose={onClose}
        onPrayed={(id) => markPrayedOn(id, todayKey())}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6" style={{ background: 'rgba(26,10,46,0.6)' }} onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'savedPrivately')}
        className="w-full max-w-md mx-auto rounded-t-3xl md:rounded-3xl px-6 pt-6 pb-8 md:shadow-2xl"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-2 mb-1">
          <button onClick={onClose} aria-label={t(lang, 'close')} className="p-1.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Compact success confirmation */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--success-soft, #e8f5ed)' }}>
            <Check size={26} style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'savedPrivately')}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'savedOnToday')}</p>
          {/* The prayer's audience, stated the same way it will read everywhere
              else — a new personal prayer is always Private (encrypted when the
              device key is ready). */}
          <div className="mt-2.5">
            <AudienceBadge audience={audienceOf({}, [])} lang={lang} />
          </div>
        </div>

        <button
          onClick={() => setPraying(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white mb-2.5"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}
        >
          <HandHeart size={17} /> {t(lang, 'prayNowCta')}
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-medium"
          style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-2)' }}
        >
          {t(lang, 'doneBtn')}
        </button>
      </div>
    </div>
  );
}
