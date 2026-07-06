import { useState } from 'react';
import { X, Bug, Lightbulb, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

const TYPES = [
  { key: 'general', icon: MessageSquare, labelKey: 'feedbackTypeGeneral' },
  { key: 'feature', icon: Lightbulb, labelKey: 'feedbackTypeFeature' },
  { key: 'bug', icon: Bug, labelKey: 'feedbackTypeBug' },
];

export default function FeedbackModal({ onClose }) {
  const { user } = useAuthStore();
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings?.language || 'fr';
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const email = user?.email || '';

  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);

    const payload = {
      type,
      message: message.trim(),
      user_id: anonymous ? null : user?.id ?? null,
      name: anonymous ? null : displayName || null,
      email: anonymous ? null : email || null,
      lang,
    };

    const { error: err } = await supabase.from('feedback').insert([payload]);
    setLoading(false);
    if (err) {
      setError(t(lang, 'feedbackError'));
    } else {
      setDone(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl px-6 pt-6 pb-8"
        style={{ background: 'var(--surface)' }}
      >
        <button
          onClick={onClose}
          aria-label={t(lang, 'close')}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}
        >
          <X size={15} />
        </button>

        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle size={44} style={{ color: '#2a7a4e' }} className="mb-3" />
            <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text-1)' }}>{t(lang, 'feedbackThanks')}</p>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'feedbackThanksub')}</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              {t(lang, 'close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-1)' }}>
              {t(lang, 'feedbackTitle')}
            </h2>

            {/* Type tabs */}
            <div className="flex gap-2 mb-4">
              {TYPES.map(({ key, icon: Icon, labelKey }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
                  style={type === key
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  <Icon size={13} />
                  {t(lang, labelKey)}
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(lang, 'feedbackPlaceholder')}
              rows={4}
              className="w-full rounded-xl px-3 py-3 text-sm focus:outline-none resize-none mb-4"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
            />

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between mb-4 rounded-xl px-4 py-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t(lang, 'feedbackAnon')}</p>
                {!anonymous && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {displayName || email}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAnonymous((a) => !a)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
                style={{ background: anonymous ? '#7c5cfc' : '#e0d8f0' }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  style={{ transform: anonymous ? 'translateX(24px)' : 'translateX(4px)' }}
                />
              </button>
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3 py-2 mb-3" style={{ color: '#c04040', background: '#fdf0f0' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {t(lang, 'feedbackSubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
