import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { useShallow } from 'zustand/react/shallow';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { setContentLang } from '../lib/contentLang';
import { toast } from '../store/toastStore';
import { canEncrypt } from '../lib/crypto/prayerCrypto';
import ScriptureFirstStep from './ScriptureFirstStep';
import ScheduleEditor from './ScheduleEditor';
import CategorySelector from './CategorySelector';
import { emptyDraft, draftFromSchedule, scheduleFromDraft } from '../lib/scheduleDraft';

const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-widest mb-1.5 block';

function CheckboxToggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
        style={{ background: checked ? 'var(--accent)' : 'var(--input-bg)', border: checked ? 'none' : '0.5px solid var(--input-border)' }}
        onClick={onChange}
      >
        {checked && <span className="text-white text-xs font-bold">✓</span>}
      </div>
      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
    </label>
  );
}

function initialForm(editPrayer, prefill) {
  // A new prayer may be seeded with an optional, fully-editable prefill (e.g. a
  // starter prompt from the gospel journey). Editing always wins over prefill.
  if (!editPrayer) return {
    title: prefill?.title || '',
    description: prefill?.description || '',
    categoryIds: [], forOther: false, personName: '', isAnonymous: false, scheduleDraft: emptyDraft(),
  };
  return {
    title: editPrayer.title || '',
    description: editPrayer.description || '',
    categoryIds: editPrayer.category_ids || (editPrayer.prayer_categories || []).map(pc => pc.category_id),
    forOther: editPrayer.for_other || false,
    personName: editPrayer.person_name || '',
    isAnonymous: editPrayer.is_anonymous || false,
    scheduleDraft: draftFromSchedule(editPrayer.schedule),
  };
}

// Categories and "for someone else" are always visible; only the recurrence
// schedule lives behind "More options". Auto-open it when editing a prayer that
// already has a schedule so nothing stays hidden.
function hasSchedule(editPrayer) {
  return !!(editPrayer && editPrayer.schedule);
}

// communityMode hides the forOther field and calls onCommunitySubmit instead of prayerStore
export default function PrayerForm({ onClose, editPrayer, communityMode, onCommunitySubmit, prefill }) {
  const { categories, addPrayer, updatePrayer, settings } = usePrayerStore(
    useShallow((s) => ({
      categories: s.categories,
      addPrayer: s.addPrayer,
      updatePrayer: s.updatePrayer,
      settings: s.settings,
    }))
  );
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

  const [form, setForm] = useState(() => initialForm(editPrayer, prefill));
  const [created, setCreated] = useState(null);
  // "More options" reveals the recurrence schedule; a new prayer opens with it
  // collapsed, and editing a prayer that already has a schedule opens expanded.
  const [expanded, setExpanded] = useState(() => hasSchedule(editPrayer));
  useEffect(() => { if (editPrayer) { setForm(initialForm(editPrayer)); setExpanded(hasSchedule(editPrayer)); } }, [editPrayer]);

  const patch = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const toggleCategory = (id) => patch('categoryIds', form.categoryIds.includes(id)
    ? form.categoryIds.filter(c => c !== id)
    : [...form.categoryIds, id]
  );

  // Subtle, non-technical reassurance after a personal prayer is saved. Encryption
  // is automatic and invisible, so we only hint at it — "Saved privately" always,
  // with "Encrypted on this device" added when the account key is actually ready.
  const notifySaved = () => toast.success(t(lang, canEncrypt({}) ? 'savedEncrypted' : 'savedPrivately'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (communityMode) {
      onCommunitySubmit({ title: form.title.trim(), description: form.description.trim(), isAnonymous: form.isAnonymous, categoryIds: form.categoryIds });
      onClose();
    } else if (editPrayer) {
      updatePrayer(editPrayer.id, { ...form, schedule: scheduleFromDraft(form.scheduleDraft, editPrayer.schedule) });
      notifySaved();
      onClose();
    } else {
      // New personal prayer: create it, then invite the user into Scripture
      // before they pray (Step 2). The prayer already exists by then, so
      // closing the Scripture step at any point keeps the prayer.
      const id = await addPrayer({ ...form, schedule: scheduleFromDraft(form.scheduleDraft) });
      if (id) {
        // Record the language this prayer was written in, so we don't later pay
        // to translate personal content into the language it's already in.
        setContentLang(lang);
        notifySaved();
        setCreated({ id, title: form.title.trim(), description: form.description.trim() });
      } else onClose();
    }
  };

  if (created) {
    return (
      <ScriptureFirstStep
        prayerId={created.id}
        title={created.title}
        description={created.description}
        lang={lang}
        onClose={onClose}
      />
    );
  }

  const title = communityMode
    ? (editPrayer ? t(lang, 'tipEditPrayer') : t(lang, 'newRequest'))
    : (editPrayer ? t(lang, 'editPrayer') : t(lang, 'newPrayer'));

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6" style={{ background: 'rgba(26,10,46,0.6)' }} onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg mx-auto rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto md:shadow-2xl"
        style={{ background: 'var(--surface)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-1)' }}>{title}</h2>
          <button onClick={onClose} title={t(lang, 'tipCloseForm')} className="p-1.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-4">
          <div>
            <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'prayerSubject')}</label>
            <input
              type="text"
              required
              autoFocus
              value={form.title}
              onChange={e => patch('title', e.target.value)}
              placeholder={t(lang, 'prayerSubjectPlaceholder')}
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none"
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'details')}</label>
            <textarea
              value={form.description}
              onChange={e => patch('description', e.target.value)}
              placeholder={t(lang, 'detailsPlaceholder')}
              className="w-full text-sm rounded-xl px-4 py-3 resize-none focus:outline-none"
              style={INPUT_STYLE}
              rows={3}
            />
          </div>

          {communityMode && (
            <CheckboxToggle
              checked={form.isAnonymous}
              onChange={() => patch('isAnonymous', !form.isAnonymous)}
              label={t(lang, 'anonymous')}
            />
          )}

          <CategorySelector
            categories={categories}
            selectedIds={form.categoryIds}
            onToggle={toggleCategory}
            tr={tr}
            lang={lang}
          />

          {!communityMode && <>
            <CheckboxToggle
              checked={form.forOther}
              onChange={() => patch('forOther', !form.forOther)}
              label={t(lang, 'forOther')}
            />

            {form.forOther && (
              <div className="space-y-3 pl-3" style={{ borderLeft: '2px solid var(--accent-border)' }}>
                <div>
                  <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'personName')}</label>
                  <input type="text" value={form.personName} onChange={e => patch('personName', e.target.value)}
                    placeholder="Prénom Nom" className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none" style={INPUT_STYLE} />
                </div>
              </div>
            )}
          </>}

          {!communityMode && expanded && (
            <ScheduleEditor
              draft={form.scheduleDraft}
              onChange={(d) => patch('scheduleDraft', d)}
              lang={lang}
            />
          )}

          {/* Categories and "for someone else" sit in the open; only the
              recurrence schedule lives behind this toggle, so a quick prayer is
              still just a couple of fields away. */}
          {!communityMode && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              {t(lang, expanded ? 'fewerOptions' : 'moreOptions')}
            </button>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} title={t(lang, 'tipDiscard')}
              className="flex-1 rounded-xl py-3 text-sm font-medium"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-2)' }}>
              {t(lang, 'cancel')}
            </button>
            <button type="submit" title={editPrayer ? t(lang, 'tipSavePrayer') : t(lang, 'tipAddPrayerForm')}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}>
              {editPrayer ? t(lang, 'save') : t(lang, 'add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
