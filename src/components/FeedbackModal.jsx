import { useState } from 'react';
import { Bug, Lightbulb, Loader2, MessageSquare, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { Modal, PrimaryButton, SegmentedControl, Textarea } from './shared/Primitives';
import Switch from './shared/Switch';
import RiseMark from './shared/RiseMark';

const TYPES = [
  { key: 'general', labelKey: 'feedbackTypeGeneral', icon: MessageSquare },
  { key: 'feature', labelKey: 'feedbackTypeFeature', icon: Lightbulb },
  { key: 'bug', labelKey: 'feedbackTypeBug', icon: Bug },
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
          <div>
            <div className="q-dialog__header mb-0">
              <div className="q-dialog__lead">
                <span className="icon-tile tone-teal" aria-hidden="true"><MessageSquare size={18} strokeWidth={1.85} /></span>
                <h2 className="q-dialog__title">{t(lang, 'feedbackTitle')}</h2>
              </div>
              <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="q-dialog__intro q-dialog__intro--tight">{t(lang, 'feedbackSub')}</p>
          </div>

          <SegmentedControl
            className="segmented-control--fill feedback-types"
            label={t(lang, 'feedbackTitle')}
            value={type}
            onChange={setType}
            options={TYPES.map(({ key, labelKey, icon: Icon }) => ({
              value: key,
              label: <span><Icon size={15} strokeWidth={1.85} aria-hidden="true" />{t(lang, labelKey)}</span>,
            }))}
          />

          <Textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t(lang, 'feedbackPlaceholder')}
            aria-label={t(lang, 'feedbackPlaceholder')}
            rows={5}
          />

          <div className="settings-row__main feedback-anon">
            <div className="min-w-0">
              <p className="settings-row__label">{t(lang, 'feedbackAnon')}</p>
              <p className="settings-row__sub">{anonymous ? t(lang, 'anonymousAuthor') : displayName || email}</p>
            </div>
            <Switch checked={anonymous} onChange={() => setAnonymous((a) => !a)} label={t(lang, 'feedbackAnon')} />
          </div>

          {error && <p role="alert" className="q-notice q-notice--error">{error}</p>}

          <PrimaryButton type="submit" disabled={loading || !message.trim()} className="w-full">
            {loading
              ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              : <Send size={16} aria-hidden="true" />}
            {t(lang, 'feedbackSubmit')}
          </PrimaryButton>
        </form>
      )}
    </Modal>
  );
}
