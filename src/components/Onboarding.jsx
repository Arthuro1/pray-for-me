import { useState } from 'react';
import { Lock, HandHeart, Loader2 } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { setContentLang } from '../lib/contentLang';
import { todayKey } from '../lib/prayedLog';
import PrayerSession from './PrayerSession';

// First run = first prayer. Instead of a carousel about the app, one screen asks
// the only question that matters — "What would you like to pray about?" — saves
// it (privately, encrypted by default) and goes STRAIGHT into praying it.
// Reminders, AI, groups and planning all introduce themselves later, in context,
// after the core value has been experienced. Skipping is always one tap away.
export default function Onboarding({ lang = 'en', onFinish }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [prayingId, setPrayingId] = useState(null);
  useEscapeKey(onFinish);
  const trapRef = useFocusTrap();

  const saveAndPray = async (e) => {
    e.preventDefault();
    const title = text.trim();
    if (!title || saving) return;
    setSaving(true);
    const id = await usePrayerStore.getState().addPrayer({ title });
    setSaving(false);
    // Record the language this prayer was written in (same as the main form).
    if (id) { setContentLang(lang); setPrayingId(id); }
    else onFinish();
  };

  if (prayingId) {
    const { prayers, categories, markPrayedOn } = usePrayerStore.getState();
    const prayer = prayers.find((p) => p.id === prayingId)
      || { id: prayingId, title: text.trim(), prayer_categories: [], prayer_points: [] };
    return (
      <PrayerSession
        prayers={[prayer]}
        categories={categories}
        lang={lang}
        tr={useTranslationStore.getState().tr}
        onClose={onFinish}
        onPrayed={(id) => markPrayedOn(id, todayKey())}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <form
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onSubmit={saveAndPray}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
      >
        <div className="text-4xl mb-3 text-center">🙏</div>
        <h2 className="text-xl font-semibold mb-4 text-center" style={{ color: 'var(--text-1)' }}>
          {t(lang, 'onboardCaptureTitle')}
        </h2>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(lang, 'onboardCapturePlaceholder')}
          rows={3}
          className="w-full text-sm rounded-xl px-4 py-3 resize-none focus:outline-none mb-2"
          style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
        />

        <p className="text-xs flex items-center justify-center gap-1.5 mb-5" style={{ color: 'var(--text-3)' }}>
          <Lock size={11} /> {t(lang, 'onboardPrivateNote')}
        </p>

        <button
          type="submit"
          disabled={!text.trim() || saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 mb-2.5"
          style={{ background: 'var(--accent)' }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <HandHeart size={16} />}
          {t(lang, 'onboardSaveAndPray')}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="w-full py-3 rounded-xl text-sm font-medium"
          style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
        >
          {t(lang, 'onboardLater')}
        </button>
      </form>
    </div>
  );
}
