import { useState, useEffect } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { useShallow } from 'zustand/react/shallow';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { setContentLang } from '../lib/contentLang';
import { toast } from '../store/toastStore';
import { canEncrypt } from '../lib/crypto/prayerCrypto';
import PrayerSavedStep from './PrayerSavedStep';
import ScheduleEditor from './ScheduleEditor';
import CategorySelector from './CategorySelector';
import { emptyDraft, draftFromSchedule, scheduleFromDraft, scheduleSummary, rhythmOf, draftForRhythm, RHYTHM_PRESETS } from '../lib/scheduleDraft';

const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-widest mb-1.5 block';

const RHYTHM_LABEL_KEYS = {
  flexible: 'rhythmFlexible',
  daily: 'freqDaily',
  weekly: 'freqWeekly',
  occasionally: 'rhythmOccasionally',
};

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

// A quiet inline expander ("Add a note", "Organize") — one small tap target
// that reveals an optional part of the form without ever demanding it.
function Expander({ label, onOpen, icon: Icon = Plus }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-1.5 text-xs font-semibold"
      style={{ color: 'var(--accent)' }}
    >
      <Icon size={14} /> {label}
    </button>
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

// Editing a prayer that already uses the optional parts opens them, so nothing
// a user chose earlier ever silently hides.
function hasNote(editPrayer, prefill) {
  return !!(editPrayer?.description || prefill?.description);
}
function usesOrganize(editPrayer) {
  return !!(editPrayer && (editPrayer.schedule || editPrayer.for_other
    || (editPrayer.prayer_categories || []).length > 0 || (editPrayer.category_ids || []).length > 0));
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
  // One required question — everything else is optional and collapsed: a note,
  // and "Organize" (person, categories, prayer rhythm). The community request
  // form keeps its note open (context for the group is the point there).
  const [noteOpen, setNoteOpen] = useState(() => communityMode || hasNote(editPrayer, prefill));
  const [organizeOpen, setOrganizeOpen] = useState(() => usesOrganize(editPrayer));
  // The full schedule editor appears only for rhythms the presets can't express.
  const [customRhythm, setCustomRhythm] = useState(() => rhythmOf(initialForm(editPrayer, prefill).scheduleDraft) === 'custom');
  useEffect(() => {
    if (editPrayer) {
      setForm(initialForm(editPrayer));
      setNoteOpen(communityMode || hasNote(editPrayer));
      setOrganizeOpen(usesOrganize(editPrayer));
      setCustomRhythm(rhythmOf(draftFromSchedule(editPrayer.schedule)) === 'custom');
    }
  }, [editPrayer]);

  const patch = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const toggleCategory = (id) => patch('categoryIds', form.categoryIds.includes(id)
    ? form.categoryIds.filter(c => c !== id)
    : [...form.categoryIds, id]
  );

  const rhythm = customRhythm ? 'custom' : rhythmOf(form.scheduleDraft);
  const pickRhythm = (r) => {
    setCustomRhythm(false);
    patch('scheduleDraft', draftForRhythm(r, form.scheduleDraft));
  };
  const schedulePreview = scheduleFromDraft(form.scheduleDraft);

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
      // New personal prayer: create it, then show a compact "Saved privately"
      // confirmation whose primary action actually starts praying. The prayer
      // already exists, so closing at any point keeps it.
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
      <PrayerSavedStep
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
            <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>
              {t(lang, communityMode ? 'prayerSubject' : 'prayerFieldLabel')}
            </label>
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

          {noteOpen ? (
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
          ) : (
            <Expander label={t(lang, 'addNote')} onOpen={() => setNoteOpen(true)} />
          )}

          {communityMode && (
            <>
              <CheckboxToggle
                checked={form.isAnonymous}
                onChange={() => patch('isAnonymous', !form.isAnonymous)}
                label={t(lang, 'anonymous')}
              />
              <CategorySelector
                categories={categories}
                selectedIds={form.categoryIds}
                onToggle={toggleCategory}
                tr={tr}
                lang={lang}
              />
            </>
          )}

          {/* Organization is OPTIONAL: person, categories and the prayer rhythm
              all wait behind one quiet "Organize" expander, so writing a request
              and saving stays a single-field act. */}
          {!communityMode && !organizeOpen && (
            <Expander label={t(lang, 'organizeLabel')} onOpen={() => setOrganizeOpen(true)} icon={ChevronDown} />
          )}

          {!communityMode && organizeOpen && (
            <div className="space-y-4 rounded-2xl p-4" style={{ background: 'var(--input-bg)' }}>
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
                      placeholder={t(lang, 'personNamePlaceholder')} className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none"
                      style={{ ...INPUT_STYLE, background: 'var(--surface)' }} />
                  </div>
                </div>
              )}

              <CategorySelector
                categories={categories}
                selectedIds={form.categoryIds}
                onToggle={toggleCategory}
                tr={tr}
                lang={lang}
              />

              <div>
                <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'rhythmLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {RHYTHM_PRESETS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => pickRhythm(r)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={rhythm === r
                        ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                        : { background: 'var(--surface)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                    >
                      {t(lang, RHYTHM_LABEL_KEYS[r])}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomRhythm(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={rhythm === 'custom'
                      ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                      : { background: 'var(--surface)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                  >
                    {t(lang, 'rhythmCustom')}
                  </button>
                </div>
                {rhythm !== 'custom' && schedulePreview && (
                  <p className="text-xs mt-2" style={{ color: 'var(--accent)' }}>{scheduleSummary(schedulePreview, lang)}</p>
                )}
              </div>

              {rhythm === 'custom' && (
                <ScheduleEditor
                  draft={form.scheduleDraft}
                  onChange={(d) => patch('scheduleDraft', d)}
                  lang={lang}
                />
              )}
            </div>
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
              {editPrayer || communityMode ? t(lang, editPrayer ? 'save' : 'add') : t(lang, 'savePrayer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
