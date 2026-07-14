import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, BookOpen, Bell, Share2, ChevronRight, X } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import ScriptureFirstStep from './ScriptureFirstStep';

// Shown right after a new personal prayer is saved. A calm, compact confirmation
// — "Saved privately" — that then offers Scripture, a reminder and sharing as
// PURELY OPTIONAL next steps. Nothing here is required: the prayer already exists
// and is already on Today, so the primary action is simply to go pray. Scripture
// is opt-in (opened on demand), never forced.
export default function PrayerSavedStep({ prayerId, title, description, lang, onClose }) {
  const [showScripture, setShowScripture] = useState(false);
  const navigate = useNavigate();
  const trapRef = useFocusTrap(true);
  useEscapeKey(onClose);

  // Opening Scripture reuses the existing guidance step; closing it closes the
  // whole flow, matching "closing at any point keeps the prayer".
  if (showScripture) {
    return (
      <ScriptureFirstStep
        prayerId={prayerId}
        title={title}
        description={description}
        lang={lang}
        onClose={onClose}
      />
    );
  }

  const go = (path) => { onClose(); navigate(path); };

  const optionalActions = [
    { key: 'scripture', icon: BookOpen, label: t(lang, 'findScripture'), onClick: () => setShowScripture(true) },
    { key: 'reminder', icon: Bell, label: t(lang, 'setReminderCta'), onClick: () => go('/settings#notifications') },
    { key: 'share', icon: Share2, label: t(lang, 'shareGroupCta'), onClick: () => go(`/prayers/${prayerId}`) },
  ];

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
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--success-soft, #e8f5ed)' }}>
            <Check size={26} style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'savedPrivately')}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'savedOnToday')}</p>
        </div>

        {/* Optional next steps */}
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'savedOptionalSteps')}
        </p>
        <div className="space-y-2 mb-5">
          {optionalActions.map(({ key, icon: Icon, label, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}
            >
              <Icon size={17} style={{ color: 'var(--accent)' }} />
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</span>
              <ChevronRight size={15} style={{ color: 'var(--text-3)' }} />
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}
        >
          {t(lang, 'prayNowCta')}
        </button>
      </div>
    </div>
  );
}
