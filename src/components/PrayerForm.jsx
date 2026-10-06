import { useCallback, useEffect, useState } from 'react';
import { X, ChevronDown, Plus, SlidersHorizontal } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { useShallow } from 'zustand/react/shallow';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { setContentLang } from '../lib/contentLang';
import { normalizeContentLang } from '../lib/langHint';
import { toast } from '../store/toastStore';
import { canHoldPrivateMetadata, willEncryptNewPrayer } from '../lib/crypto/prayerCrypto';
import { circleOf } from '../lib/circles';
import CirclePicker from './CirclePicker';
import useCommunityStore from '../store/communityStore';
import AudienceBadge from './shared/AudienceBadge';
import SourceLanguageField from './SourceLanguageField';
import { audienceOf, protectionOf, plannedProtection } from '../lib/audience';
import PrayerSavedStep from './PrayerSavedStep';
import SchedulePicker from './SchedulePicker';
import CategorySelector from './CategorySelector';
import FormattedTextarea from './rich/FormattedTextarea';
import { planWeekDays } from '../lib/planner';
import { defaultNewDraft, draftFromSchedule, returnsSummary, scheduleFromDraft } from '../lib/scheduleDraft';
import { useFormDraft } from '../hooks/useFormDraft';
import { DRAFT_SLOTS } from '../lib/prayerFormDrafts';
import { Checkbox, PrimaryButton, SecondaryButton } from './shared/Primitives';

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
      className="prayer-form__toggle pressable"
    >
      <span>
        <Icon size={16} aria-hidden="true" /> {label}
      </span>
      <ChevronDown size={16} aria-hidden="true" />
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
    // Optional Intercession Circle — never preselected, never required.
    circle: null,
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
    circle: circleOf(editPrayer),
  };
}

// Editing a prayer that already uses the optional parts opens them, so nothing
// a user chose earlier ever silently hides.
function hasNote(editPrayer, prefill) {
  return !!(editPrayer?.description || prefill?.description);
}
// Editing a prayer that already uses any organizing choice — its rhythm, who
// it's for, or its labels — auto-opens Organize, so nothing set earlier hides.
function usesOrganize(editPrayer) {
  return !!(editPrayer && (editPrayer.schedule || editPrayer.for_other || circleOf(editPrayer)
    || (editPrayer.prayer_categories || []).length > 0 || (editPrayer.category_ids || []).length > 0));
}

// communityMode hides the forOther field and calls onCommunitySubmit instead of prayerStore.
// initialOrganizeOpen is used by a contextual next-step card after sign-in; the
// normal quick-add experience remains collapsed.
export default function PrayerForm({
  onClose,
  editPrayer,
  communityMode,
  onCommunitySubmit,
  prefill,
  initialOrganizeOpen = false,
  onEditSaved,
}) {
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
  const [submitting, setSubmitting] = useState(false);
  // One required question — everything else is optional and collapsed: a note,
  // and "Organize" (circle, person, categories, prayer rhythm). The community request
  // form keeps its note open (context for the group is the point there).
  const [noteOpen, setNoteOpen] = useState(() => communityMode || hasNote(editPrayer, prefill));
  const [organizeOpen, setOrganizeOpen] = useState(() => initialOrganizeOpen || usesOrganize(editPrayer));
  useEffect(() => {
    if (editPrayer) {
      setForm(initialForm(editPrayer, null, lang));
      setNoteOpen(communityMode || hasNote(editPrayer));
      setOrganizeOpen(initialOrganizeOpen || usesOrganize(editPrayer));
    }
  }, [communityMode, editPrayer, initialOrganizeOpen, lang]);

  const patch = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const toggleCategory = (id) => patch('categoryIds', form.categoryIds.includes(id)
    ? form.categoryIds.filter(c => c !== id)
    : [...form.categoryIds, id]
  );

  // An unfinished PERSONAL prayer survives a mis-tapped backdrop, a swipe-away
  // or a reload: it is autosaved to this device only, encrypted, and cleared the
  // moment the prayer really exists.
  //
  // Three cases are excluded. Editing already has a saved row. A community
  // request is written for other people to read and gets no local copy. And a
  // PREFILLED form was opened to write one specific thing (a starter prompt from
  // Grow), so restoring an unrelated draft over it — or letting that prompt take
  // the slot a later blank Add would restore from — would both be wrong.
  const draftEnabled = !editPrayer && !communityMode && !prefill;
  const { restored, commit: commitDraft, discard: discardDraft } = useFormDraft({
    slot: DRAFT_SLOTS.NEW_PRAYER,
    enabled: draftEnabled,
    value: form,
    // Only what the user actually chose — named field by field, so the draft can
    // never quietly carry something the form happens to hold later.
    serialize: (f) => (f.title.trim() || f.description.trim() || f.personName.trim()
      ? {
        title: f.title,
        description: f.description,
        forOther: f.forOther,
        personName: f.personName,
        categoryIds: f.categoryIds,
        scheduleDraft: f.scheduleDraft,
        contentLanguage: f.contentLanguage,
        circle: f.circle,
      }
      : null),
    restore: ({ title, description, forOther, personName, categoryIds, scheduleDraft, contentLanguage, circle }) => {
      if (!title && !description && !personName) return false;
      setForm((current) => ({
        ...current,
        title: title || '',
        description: description || '',
        forOther: !!forOther,
        personName: personName || '',
        categoryIds: categoryIds || [],
        scheduleDraft: scheduleDraft || current.scheduleDraft,
        contentLanguage: contentLanguage || current.contentLanguage,
        circle: circleOf({ circle }),
      }));
      if (description) setNoteOpen(true);
      return true;
    },
  });

  // "Start fresh" really starts fresh: the form goes back to what it opens with
  // and the stored draft is deleted, not merely hidden.
  const startFresh = () => {
    setForm(initialForm(null, prefill, lang));
    setNoteOpen(hasNote(null, prefill));
    setOrganizeOpen(false);
    discardDraft();
  };

  // "Change" on the rhythm line opens Organize and hands focus to the rhythm
  // row itself, so the control the user asked for is where they're looking.
  const [rhythmFocusSignal, setRhythmFocusSignal] = useState(0);
  const revealRhythm = useCallback(() => {
    setOrganizeOpen(true);
    setRhythmFocusSignal((n) => n + 1);
  }, []);

  // What "follow my normal rhythm" would actually mean for THIS prayer, from
  // the same planner Today uses — so the choice can show its real days instead
  // of asking the user to remember their weekly plan.
  const planDays = planWeekDays(categories, form.categoryIds, editPrayer?.week_days);

  // Read from the SAME conversion the save performs, so the line and the saved
  // schedule can never disagree.
  const rhythmLine = returnsSummary(scheduleFromDraft(form.scheduleDraft), lang, { planDays });

  // Subtle, non-technical reassurance after a personal prayer is saved. Offline,
  // say plainly where the prayer lives and that it will sync — the write is
  // already queued, nothing is lost.
  //
  // A NEW prayer gets the short form: this toast is followed immediately by the
  // saved panel, and three privacy statements around one private note make the
  // app feel riskier, not safer. The full "Encrypted on this device" line stays
  // on an EDIT, where the toast is the only confirmation there is. Nothing is
  // hidden either way — the saved panel and the prayer's own page keep stating
  // its real audience and protection.
  const notifySaved = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast.success(t(lang, 'savedOffline'));
      return;
    }
    if (!editPrayer) { toast.success(t(lang, 'savedPrivately')); return; }
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
    if (submitting || !form.title.trim()) return;
    if (communityMode) {
      setSubmitting(true);
      try {
        const result = await onCommunitySubmit({ title: form.title.trim(), description: form.description.trim(), isAnonymous: form.isAnonymous, categoryIds: form.categoryIds, contentLanguage: form.contentLanguage });
        if (!result?.error) onClose();
      } finally {
        setSubmitting(false);
      }
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
      const schedule = scheduleFromDraft(form.scheduleDraft);
      const id = await addPrayer({ ...form, schedule });
      if (id) {
        // The prayer exists now — the unfinished copy has served its purpose.
        commitDraft();
        // Record the language this prayer was written in, so we don't later pay
        // to translate personal content into the language it's already in — the
        // author's correction, when they made one, not just the interface.
        setContentLang(form.contentLanguage || lang);
        notifySaved();
        setCreated({ id, title: form.title.trim(), description: form.description.trim(), encrypted, schedule });
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
        schedule={created.schedule}
        lang={lang}
        onClose={onClose}
        onChooseRhythm={onEditSaved}
      />
    );
  }

  const title = communityMode
    ? (editPrayer ? t(lang, 'tipEditPrayer') : t(lang, 'newRequest'))
    : (editPrayer ? t(lang, 'editPrayer') : t(lang, 'newPrayer'));

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6" onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prayer-form-title"
        className="editorial-dialog prayer-form w-full max-w-lg mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="prayer-form__grip" aria-hidden="true" />

        <div className="prayer-form__header">
          <h2 id="prayer-form-title" className="prayer-form__title">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, 'close')}
            title={t(lang, 'tipCloseForm')}
            className="icon-button pressable -me-2"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="prayer-form__body">
          <div className="q-field">
            <label htmlFor="prayer-title" className="q-field__label">
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
              className="q-input q-input--editorial"
            />
          </div>

          {/* The rhythm this prayer already has, in one quiet line, BEFORE the
              optional sections — so the bounded weekly default a new prayer
              receives is something the writer reads rather than discovers later.
              It is secondary information, not a field: one tap opens the real
              control under Organize. */}
          {!communityMode && (
            <button
              type="button"
              onClick={revealRhythm}
              aria-label={`${rhythmLine} — ${t(lang, 'rhythmChangeAria')}`}
              className="prayer-form__rhythm"
            >
              <span className="min-w-0 break-words">{rhythmLine}</span>
              <span aria-hidden="true">·</span>
              <span className="prayer-form__rhythm-change">{t(lang, 'schedChange')}</span>
            </button>
          )}

          {/* Something unfinished was put back. Stated once, quietly, with the
              one action that undoes it — never a modal in the way of praying. */}
          {restored && (
            <p className="q-meta flex flex-wrap items-center gap-x-2" role="status">
              {t(lang, 'draftRestoredNote')}
              <button
                type="button"
                onClick={startFresh}
                className="quiet-button pressable -ms-3"
              >
                {t(lang, 'draftDiscardCta')}
              </button>
            </p>
          )}

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
                {/* The note reads back through RichText, so it writes with the
                    same light formatting the update composer offers. */}
                <FormattedTextarea
                  id="prayer-note"
                  lang={lang}
                  value={form.description}
                  onChange={(v) => patch('description', v)}
                  placeholder={t(lang, 'detailsPlaceholder')}
                  ariaLabel={t(lang, 'details')}
                  rows={3}
                />
              </div>
            )}
          </div>

          {communityMode && (
            <>
              <Checkbox
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
                icon={SlidersHorizontal}
              />
              {organizeOpen && (
                <div id="prayer-organize-section" className="prayer-form__organize">
                  {/* "Place on your altar" — offered only where the circle can
                      live inside this prayer's ciphertext (lib/circles.js). */}
                  {canHoldPrivateMetadata(editPrayer || null) && (
                    <CirclePicker
                      value={form.circle}
                      onChange={(circle) => patch('circle', circle)}
                      lang={lang}
                      idPrefix="prayer-circle"
                    />
                  )}

                  <Checkbox
                    id="prayer-for-other"
                    checked={form.forOther}
                    onChange={() => patch('forOther', !form.forOther)}
                    label={t(lang, 'forOther')}
                  />

                  {form.forOther && (
                    <div className="prayer-form__person">
                      <div className="q-field">
                        <label htmlFor="prayer-person" className="q-field__label">{t(lang, 'personName')}</label>
                        <input id="prayer-person" type="text" value={form.personName} onChange={e => patch('personName', e.target.value)}
                          placeholder={t(lang, 'personNamePlaceholder')} className="q-input" />
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

                  {/* The rhythm this prayer already has, in one line. A new
                      prayer arrives with the bounded weekly default already
                      chosen, so saving without opening this is a complete
                      answer — the scheduler only exists after "Change". */}
                  <SchedulePicker
                    draft={form.scheduleDraft}
                    onCommit={(d) => patch('scheduleDraft', d)}
                    lang={lang}
                    planDays={planDays}
                    idPrefix="prayer-sched"
                    focusSignal={rhythmFocusSignal}
                  />

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
            <AudienceBadge audience={formAudience} protection={formProtection} lang={lang} />
          )}

          <div className="prayer-form__actions">
            <SecondaryButton onClick={onClose} title={t(lang, 'tipDiscard')}>
              {t(lang, 'cancel')}
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={submitting} title={editPrayer ? t(lang, 'tipSavePrayer') : t(lang, 'tipAddPrayerForm')}>
              {editPrayer || communityMode ? t(lang, editPrayer ? 'save' : 'add') : t(lang, 'savePrayer')}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
