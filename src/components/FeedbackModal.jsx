import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { Modal, PrimaryButton, SegmentedControl, Textarea } from './shared/Primitives';
import Switch from './shared/Switch';
import RiseMark from './shared/RiseMark';

const TYPES = [
  { key: 'general', labelKey: 'feedbackTypeGeneral' },
  { key: 'feature', labelKey: 'feedbackTypeFeature' },
  { key: 'bug', labelKey: 'feedbackTypeBug' },
];

export default function FeedbackModal({ onClose }) {
  const { user } = useAuthStore();
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings?.language || 'fr';

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
    <Modal label={t(lang, 'feedbackTitle')} onClose={onClose}>
      {done ? (
        <div className="dialog-done">
          <RiseMark motion="still" size={32} />
          <p className="q-dialog__title">{t(lang, 'feedbackThanks')}</p>
          <p className="q-meta">{t(lang, 'feedbackThanksub')}</p>
          <PrimaryButton onClick={onClose} className="mt-4">{t(lang, 'close')}</PrimaryButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="q-dialog__header mb-0">
            <h2 className="q-dialog__title">{t(lang, 'feedbackTitle')}</h2>
            <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <SegmentedControl
            className="segmented-control--fill"
            label={t(lang, 'feedbackTitle')}
            value={type}
            onChange={setType}
            options={TYPES.map(({ key, labelKey }) => ({ value: key, label: t(lang, labelKey) }))}
          />

          <Textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t(lang, 'feedbackPlaceholder')}
            aria-label={t(lang, 'feedbackPlaceholder')}
            rows={4}
          />

          <div className="settings-row__main">
            <div className="min-w-0">
              <p className="settings-row__label">{t(lang, 'feedbackAnon')}</p>
              {!anonymous && <p className="settings-row__sub">{displayName || email}</p>}
            </div>
            <Switch checked={anonymous} onChange={() => setAnonymous((a) => !a)} label={t(lang, 'feedbackAnon')} />
          </div>

          {error && <p role="alert" className="q-notice q-notice--error">{error}</p>}

          <PrimaryButton type="submit" disabled={loading || !message.trim()} className="w-full">
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {t(lang, 'feedbackSubmit')}
          </PrimaryButton>
        </form>
      )}
    </Modal>
  );
}
