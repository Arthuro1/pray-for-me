import { useState, useEffect } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { useShallow } from 'zustand/react/shallow';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { setContentLang } from '../lib/contentLang';
import { normalizeContentLang } from '../lib/langHint';
import { toast } from '../store/toastStore';
import { willEncryptNewPrayer } from '../lib/crypto/prayerCrypto';
import useCommunityStore from '../store/communityStore';
import AudienceBadge from './shared/AudienceBadge';
import SourceLanguageField from './SourceLanguageField';
import { audienceOf, protectionOf, plannedProtection } from '../lib/audience';
import PrayerSavedStep from './PrayerSavedStep';
import ScheduleEditor from './ScheduleEditor';
import CategorySelector from './CategorySelector';
import { defaultNewDraft, draftFromSchedule, scheduleFromDraft, scheduleSummary, rhythmOf, draftForRhythm, RHYTHM_PRESETS } from '../lib/scheduleDraft';

const INPUT_STYLE = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-widest mb-1.5 block';

const RHYTHM_LABEL_KEYS = {
  flexible: 'rhythmFlexible',
  daily: 'freqDaily',
  weekly: 'freqWeekly',
  occasionally: 'rhythmOccasionally',
};

// A real, keyboard- and screen-reader-operable checkbox: the native input is
// invisible but present (focus, Space, labels all work); the styled box beside
// it only mirrors its state and carries the visible focus ring.
function CheckboxToggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer min-h-[44px] py-1.5">
      <span className="relative w-5 h-5 shrink-0 flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <span
          aria-hidden="true"
          className="w-5 h-5 rounded-md flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
          style={{ background: checked ? 'var(--accent)' : 'var(--input-bg)', border: checked ? 'none' : '0.5px solid var(--input-border)' }}
        >
          {checked && <span className="text-white text-xs font-bold">✓</span>}
        </span>
      </span>
      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
    </label>
  );
}

// A quiet inline expander ("Add a note", "Organize") — a comfortably tappable
// full-width row that reveals an optional part of the form and can fold it away
// again. Entered values live in the form state, so collapsing never loses them.
function SectionToggle({ label, open, onToggle, controlsId, icon: Icon = Plus }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controlsId}
      className="w-full min-h-[44px] flex items-center justify-between gap-1.5 py-2 text-xs font-semibold"
      style={{ color: 'var(--accent)' }}
    >
      <span className="flex items-center gap-1.5">
        <Icon size={14} /> {label}
      </span>
      <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
    </button>
  );
}

function initialForm(editPrayer, prefill, lang) {
  // A new prayer may be seeded with an optional, fully-editable prefill (e.g. a
  // starter prompt from the gospel journey). Editing always wins over prefill.
  // New prayers default to the bounded weekly rhythm (visible under Organize);
  // an edited prayer keeps exactly the schedule it already has — including the
  // legacy "no schedule" (weekly category plan), which is never migrated.
  // Source language DEFAULTS from the active interface/content language and is
  // only ever overridden by an explicit choice — an edited prayer keeps the
  // language it was stamped with (or falls back for legacy rows without any).
  if (!editPrayer) return {
    title: prefill?.title || '',
    description: prefill?.description || '',
    categoryIds: [], forOther: false, personName: '', isAnonymous: false, scheduleDraft: defaultNewDraft(),
    contentLanguage: lang,
  };
  return {
    title: editPrayer.title || '',
    description: editPrayer.description || '',
    categoryIds: editPrayer.category_ids || (editPrayer.prayer_categories || []).map(pc => pc.category_id),
    forOther: editPrayer.for_other || false,
    personName: editPrayer.person_name || '',
    isAnonymous: editPrayer.is_anonymous || false,
    scheduleDraft: draftFromSchedule(editPrayer.schedule),
    contentLanguage: normalizeContentLang(editPrayer.content_language) || lang,
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
  const prayerShares = useCommunityStore((s) => s.prayerShares);
  const lang = settings.language || 'fr';
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

  const [form, setForm] = useState(() => initialForm(editPrayer, prefill, lang));
  const [created, setCreated] = useState(null);
  // One required question — everything else is optional and collapsed: a note,
  // and "Organize" (person, categories, prayer rhythm). The community request
  // form keeps its note open (context for the group is the point there).
  const [noteOpen, setNoteOpen] = useState(() => communityMode || hasNote(editPrayer, prefill));
  const [organizeOpen, setOrganizeOpen] = useState(() => usesOrganize(editPrayer));
  // The full schedule editor appears only for rhythms the presets can't express.
  const [customRhythm, setCustomRhythm] = useState(() => rhythmOf(initialForm(editPrayer, prefill, lang).scheduleDraft) === 'custom');
  // Only prayers that ALREADY follow the legacy weekly category plan keep its
  // chip; new prayers are never offered an unbounded default.
  const [legacyPlan, setLegacyPlan] = useState(() => rhythmOf(initialForm(editPrayer, prefill, lang).scheduleDraft) === 'flexible');
  useEffect(() => {
    if (editPrayer) {
      setForm(initialForm(editPrayer, null, lang));
      setNoteOpen(communityMode || hasNote(editPrayer));
      setOrganizeOpen(usesOrganize(editPrayer));
      setCustomRhythm(rhythmOf(draftFromSchedule(editPrayer.schedule)) === 'custom');
      setLegacyPlan(rhythmOf(draftFromSchedule(editPrayer.schedule)) === 'flexible');
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
  const rhythmChips = legacyPlan ? ['flexible', ...RHYTHM_PRESETS] : RHYTHM_PRESETS;
  const schedulePreview = scheduleFromDraft(form.scheduleDraft);

  // Subtle, non-technical reassurance after a personal prayer is saved. Encryption
  // is automatic and invisible, so we only hint at it — "Saved privately" always,
  // with "Encrypted on this device" added when the account key is actually ready.
  // Offline, say plainly where the prayer lives and that it will sync — the write
  // is already queued, nothing is lost.
  const notifySaved = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast.success(t(lang, 'savedOffline'));
      return;
    }
    toast.success(t(lang, willEncryptNewPrayer() ? 'savedEncrypted' : 'savedPrivately'));
  };

  // The audience this prayer will have, stated in the form itself: a new
  // personal prayer is always Private; an edited one shows its real shares.
  // Protection differs by case, and never comes from a placeholder object:
  // editing states the row's OWN stored protection, while a new prayer states
  // the creation DECISION ("Will be encrypted") — a promise about the write,
  // not a claim that something already encrypted exists.
  const formAudience = communityMode
    ? null
    : (editPrayer ? audienceOf(editPrayer, prayerShares[editPrayer.id] || []) : { kind: 'private' });
  const formProtection = editPrayer ? protectionOf(editPrayer) : plannedProtection(willEncryptNewPrayer());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (communityMode) {
      onCommunitySubmit({ title: form.title.trim(), description: form.description.trim(), isAnonymous: form.isAnonymous, categoryIds: form.categoryIds, contentLanguage: form.contentLanguage });
      onClose();
    } else if (editPrayer) {
      updatePrayer(editPrayer.id, { ...form, schedule: scheduleFromDraft(form.scheduleDraft, editPrayer.schedule) });
      notifySaved();
      onClose();
    } else {
      // New personal prayer: create it, then show a compact "Saved privately"
      // confirmation whose primary action actually starts praying. The prayer
      // already exists, so closing at any point keeps it.
      // Recorded BEFORE the write, so the confirmation states what actually
      // happened to this prayer rather than re-reading the vault later.
      const encrypted = willEncryptNewPrayer();
      const id = await addPrayer({ ...form, schedule: scheduleFromDraft(form.scheduleDraft) });
      if (id) {
        // Record the language this prayer was written in, so we don't later pay
        // to translate personal content into the language it's already in — the
        // author's correction, when they made one, not just the interface.
        setContentLang(form.contentLanguage || lang);
        notifySaved();
        setCreated({ id, title: form.title.trim(), description: form.description.trim(), encrypted });
      } else onClose();
    }
  };

  if (created) {
    return (
      <PrayerSavedStep
        prayerId={created.id}
        title={created.title}
        description={created.description}
        encrypted={created.encrypted}
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
          <button
            onClick={onClose}
            aria-label={t(lang, 'close')}
            title={t(lang, 'tipCloseForm')}
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full"
            style={{ color: 'var(--accent)' }}
          >
            <span className="p-1.5 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <X size={16} />
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-3">
          <div>
            <label htmlFor="prayer-title" className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>
              {t(lang, communityMode ? 'prayerSubject' : 'prayerFieldLabel')}
            </label>
            <input
              id="prayer-title"
              type="text"
              required
              autoFocus
              value={form.title}
              onChange={e => patch('title', e.target.value)}
              placeholder={t(lang, 'prayerSubjectPlaceholder')}
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none focus-visible:ring-2"
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <SectionToggle
              label={t(lang, 'addNote')}
              open={noteOpen}
              onToggle={() => setNoteOpen((v) => !v)}
              controlsId="prayer-note-section"
            />
            {noteOpen && (
              <div id="prayer-note-section">
                <label htmlFor="prayer-note" className="sr-only">{t(lang, 'details')}</label>
                <textarea
                  id="prayer-note"
                  value={form.description}
                  onChange={e => patch('description', e.target.value)}
                  placeholder={t(lang, 'detailsPlaceholder')}
                  className="w-full text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus-visible:ring-2"
                  style={INPUT_STYLE}
                  rows={3}
                />
              </div>
            )}
          </div>

          {communityMode && (
            <>
              <CheckboxToggle
                id="prayer-anonymous"
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
              {/* Group members read in many languages — stating the request's
                  own language is what lets the right people see "Translate". */}
              <SourceLanguageField
                value={form.contentLanguage}
                onChange={(code) => patch('contentLanguage', code)}
                sampleText={`${form.title} ${form.description}`}
                lang={lang}
              />
            </>
          )}

          {/* Organization is OPTIONAL: person, categories and the prayer rhythm
              all wait behind one quiet "Organize" expander, so writing a request
              and saving stays a single-field act. */}
          {!communityMode && (
            <div>
              <SectionToggle
                label={t(lang, 'organizeLabel')}
                open={organizeOpen}
                onToggle={() => setOrganizeOpen((v) => !v)}
                controlsId="prayer-organize-section"
                icon={ChevronDown}
              />
              {organizeOpen && (
                <div id="prayer-organize-section" className="space-y-4 rounded-2xl p-4" style={{ background: 'var(--input-bg)' }}>
                  <CheckboxToggle
                    id="prayer-for-other"
                    checked={form.forOther}
                    onChange={() => patch('forOther', !form.forOther)}
                    label={t(lang, 'forOther')}
                  />

                  {form.forOther && (
                    <div className="space-y-3 pl-3" style={{ borderLeft: '2px solid var(--accent-border)' }}>
                      <div>
                        <label htmlFor="prayer-person" className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'personName')}</label>
                        <input id="prayer-person" type="text" value={form.personName} onChange={e => patch('personName', e.target.value)}
                          placeholder={t(lang, 'personNamePlaceholder')} className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none focus-visible:ring-2"
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
                    <p className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>{t(lang, 'rhythmLabel')}</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t(lang, 'rhythmLabel')}>
                      {rhythmChips.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => pickRhythm(r)}
                          aria-pressed={rhythm === r}
                          className="min-h-[44px] px-3 py-1.5 rounded-full text-xs font-medium transition-all focus-visible:ring-2"
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
                        aria-pressed={rhythm === 'custom'}
                        className="min-h-[44px] px-3 py-1.5 rounded-full text-xs font-medium transition-all focus-visible:ring-2"
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
                    {rhythm === 'flexible' && (
                      <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'rhythmPlanHint')}</p>
                    )}
                  </div>

                  {rhythm === 'custom' && (
                    <ScheduleEditor
                      draft={form.scheduleDraft}
                      onChange={(d) => patch('scheduleDraft', d)}
                      lang={lang}
                    />
                  )}

                  {/* Source language — already answered, correctable in one tap.
                      It sits inside Organize so the default form never grows. */}
                  <SourceLanguageField
                    value={form.contentLanguage}
                    onChange={(code) => patch('contentLanguage', code)}
                    sampleText={`${form.title} ${form.description}`}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          )}

          {/* Where this prayer will be visible — stated in the form, not after.
              Encryption shows as a quiet separate status, never as an audience. */}
          {formAudience && (
            <div className="pt-1">
              <AudienceBadge audience={formAudience} protection={formProtection} lang={lang} />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} title={t(lang, 'tipDiscard')}
              className="flex-1 rounded-xl py-3 min-h-[44px] text-sm font-medium focus-visible:ring-2"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-2)' }}>
              {t(lang, 'cancel')}
            </button>
            <button type="submit" title={editPrayer ? t(lang, 'tipSavePrayer') : t(lang, 'tipAddPrayerForm')}
              className="flex-1 rounded-xl py-3 min-h-[44px] text-sm font-semibold text-white focus-visible:ring-2"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}>
              {editPrayer || communityMode ? t(lang, editPrayer ? 'save' : 'add') : t(lang, 'savePrayer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
