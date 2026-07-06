import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { setContentLang } from '../lib/contentLang';
import ScriptureFirstStep from './ScriptureFirstStep';
import ScheduleEditor, { emptyDraft, draftFromSchedule, scheduleFromDraft } from './ScheduleEditor';
import FollowUpField from './FollowUpField';
import useFollowUpStore from '../store/followUpStore';

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

function CategorySelector({ categories, selectedIds, onToggle, tr, lang }) {
  if (categories.length === 0) return null;
  return (
    <div>
      <label className={LABEL_CLASS} style={{ color: 'var(--text-3)' }}>
        {t(lang, 'categories')}{' '}
        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#c5bdd4' }}>
          {t(lang, 'multipleAllowed')}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const selected = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={selected
                ? { backgroundColor: c.color, color: '#fff', border: `1.5px solid ${c.color}` }
                : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }
              }
            >
              {c.emoji} {tr(c.name, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// The per-prayer follow-up lives in followUpStore (client-side), not on the
// prayer row, so read it here to pre-fill the form when editing.
function initialFollowUpDate(editPrayer) {
  return editPrayer ? (useFollowUpStore.getState().getFollowUp(editPrayer.id)?.date || null) : null;
}

function initialForm(editPrayer) {
  if (!editPrayer) return { title: '', description: '', categoryIds: [], forOther: false, personName: '', isAnonymous: false, scheduleDraft: emptyDraft(), followUpDate: null };
  return {
    title: editPrayer.title || '',
    description: editPrayer.description || '',
    categoryIds: editPrayer.category_ids || (editPrayer.prayer_categories || []).map(pc => pc.category_id),
    forOther: editPrayer.for_other || false,
    personName: editPrayer.person_name || '',
    isAnonymous: editPrayer.is_anonymous || false,
    scheduleDraft: draftFromSchedule(editPrayer.schedule),
    followUpDate: initialFollowUpDate(editPrayer),
  };
}

// A brand-new personal prayer opens in compact "Quick Add" mode (subject +
// detail only). Only reveal the extra options up-front when editing a prayer
// that already uses categories, a schedule, or the "for someone else" fields.
function hasDetails(editPrayer) {
  if (!editPrayer) return false;
  const cats = editPrayer.category_ids || (editPrayer.prayer_categories || []);
  return !!(editPrayer.schedule || editPrayer.for_other || cats.length);
}

// communityMode hides the forOther field and calls onCommunitySubmit instead of prayerStore
export default function PrayerForm({ onClose, editPrayer, communityMode, onCommunitySubmit }) {
  const { categories, addPrayer, updatePrayer, settings } = usePrayerStore();
  const setFollowUp = useFollowUpStore((s) => s.setFollowUp);
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';
  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

  const [form, setForm] = useState(() => initialForm(editPrayer));
  const [created, setCreated] = useState(null);
  // Quick Add: a new personal prayer opens collapsed to just subject + detail;
  // editing a prayer that already has options opens expanded so nothing hides.
  const [expanded, setExpanded] = useState(() => hasDetails(editPrayer));
  useEffect(() => { if (editPrayer) { setForm(initialForm(editPrayer)); setExpanded(hasDetails(editPrayer)); } }, [editPrayer]);

  const patch = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const toggleCategory = (id) => patch('categoryIds', form.categoryIds.includes(id)
    ? form.categoryIds.filter(c => c !== id)
    : [...form.categoryIds, id]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (communityMode) {
      onCommunitySubmit({ title: form.title.trim(), description: form.description.trim(), isAnonymous: form.isAnonymous, categoryIds: form.categoryIds });
      onClose();
    } else if (editPrayer) {
      updatePrayer(editPrayer.id, { ...form, schedule: scheduleFromDraft(form.scheduleDraft, editPrayer.schedule) });
      // Follow-up is a per-prayer client-side reminder, saved separately from the
      // prayer row / recurrence schedule.
      setFollowUp(editPrayer.id, form.followUpDate);
      onClose();
    } else {
      // New personal prayer: create it, then invite the user into Scripture
      // before they pray (Step 2). The prayer already exists by then, so
      // closing the Scripture step at any point keeps the prayer.
      const id = await addPrayer({ ...form, schedule: scheduleFromDraft(form.scheduleDraft) });
      if (id) {
        setFollowUp(id, form.followUpDate);
        // Record the language this prayer was written in, so we don't later pay
        // to translate personal content into the language it's already in.
        setContentLang(lang);
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

          {(communityMode || expanded) && (
            <CategorySelector
              categories={categories}
              selectedIds={form.categoryIds}
              onToggle={toggleCategory}
              tr={tr}
              lang={lang}
            />
          )}

          {!communityMode && expanded && <>
            <ScheduleEditor
              draft={form.scheduleDraft}
              onChange={(d) => patch('scheduleDraft', d)}
              lang={lang}
            />

            <FollowUpField
              value={form.followUpDate}
              onChange={(d) => patch('followUpDate', d)}
              lang={lang}
            />

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

          {/* Quick Add keeps the default new-prayer form to just a subject and a
              detail; categories, scheduling and "for someone else" live behind
              this toggle so the first prayer is only one field away. */}
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
