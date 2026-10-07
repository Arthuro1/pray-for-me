import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import LabelsManager from './LabelsManager';
import { circleLabelKey } from '../lib/circles';

const selectClass = 'min-h-11 w-full rounded-xl px-3 text-sm';

export default function JournalFilters({
  segment,
  filters,
  categories,
  people,
  groups,
  hasPersonal,
  hasPlans,
  circles = [],
  lang,
  tr,
  active,
  onChange,
  onClear,
  onClose,
}) {
  const [managingLabels, setManagingLabels] = useState(false);
  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true, 'select');
  const set = (key) => (event) => onChange({ ...filters, [key]: event.target.value });

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: 'rgba(24, 16, 32, 0.48)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'journalFilters')}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl"
        style={{ background: 'var(--q-surface)', border: '0.5px solid var(--q-border)', boxShadow: 'var(--q-elevation)' }}
      >
        {managingLabels ? (
          <LabelsManager lang={lang} tr={tr} onDone={() => setManagingLabels(false)} />
        ) : (<>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold" style={{ color: 'var(--q-text)' }}>
              {t(lang, 'journalFilters')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t(lang, 'close')}
              className="phase-icon-button shrink-0"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.length > 0 && (
            <label className="grid gap-1.5 text-xs font-medium" style={{ color: 'var(--q-text-secondary)' }}>
              {t(lang, 'allCategories')}
              <select
                value={filters.category}
                onChange={set('category')}
                className={selectClass}
                style={{ background: 'var(--q-field)', border: '0.5px solid var(--q-field-border)', color: 'var(--q-text)' }}
              >
                <option value="all">{t(lang, 'all')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {tr(category.name, lang)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {circles.length > 0 && (
            <label className="grid gap-1.5 text-xs font-medium" style={{ color: 'var(--q-text-secondary)' }}>
              {t(lang, 'circleFieldLabel')}
              <select
                value={filters.circle || 'all'}
                onChange={set('circle')}
                className={selectClass}
                style={{ background: 'var(--q-field)', border: '0.5px solid var(--q-field-border)', color: 'var(--q-text)' }}
              >
                <option value="all">{t(lang, 'all')}</option>
                {circles.map((circle) => <option key={circle} value={circle}>{t(lang, circleLabelKey(circle))}</option>)}
                <option value="none">{t(lang, 'circleUnplaced')}</option>
              </select>
            </label>
          )}

          {people.length > 0 && (
            <label className="grid gap-1.5 text-xs font-medium" style={{ color: 'var(--q-text-secondary)' }}>
              {t(lang, 'peopleView')}
              <select
                value={filters.person}
                onChange={set('person')}
                className={selectClass}
                style={{ background: 'var(--q-field)', border: '0.5px solid var(--q-field-border)', color: 'var(--q-text)' }}
              >
                <option value="all">{t(lang, 'all')}</option>
                {people.map((person) => <option key={person} value={person}>{person}</option>)}
              </select>
            </label>
          )}

          {/* Source also answers "just my plans" — so it is offered to a reader
              who runs plans but belongs to no group, who never saw it before. */}
          {(groups.length > 0 || hasPlans) && (
            <label className="grid gap-1.5 text-xs font-medium" style={{ color: 'var(--q-text-secondary)' }}>
              {t(lang, 'journalSource')}
              <select
                value={filters.source}
                onChange={set('source')}
                className={selectClass}
                style={{ background: 'var(--q-field)', border: '0.5px solid var(--q-field-border)', color: 'var(--q-text)' }}
              >
                <option value="all">{t(lang, 'all')}</option>
                {hasPersonal && <option value="personal">{t(lang, 'srcPersonal')}</option>}
                {hasPlans && <option value="plan">{t(lang, 'plansTitle')}</option>}
                {groups.map((group) => <option key={group} value={`group:${group}`}>{group}</option>)}
              </select>
            </label>
          )}

          {segment === 'answered' && (
            <label className="grid gap-1.5 text-xs font-medium" style={{ color: 'var(--q-text-secondary)' }}>
              {t(lang, 'schedDateLabel')}
              <select
                value={filters.answeredDate}
                onChange={set('answeredDate')}
                className={selectClass}
                style={{ background: 'var(--q-field)', border: '0.5px solid var(--q-field-border)', color: 'var(--q-text)' }}
              >
                <option value="all">{t(lang, 'all')}</option>
                <option value="month">{t(lang, 'answeredThisMonth')}</option>
                <option value="earlier">{t(lang, 'answeredEarlier')}</option>
              </select>
            </label>
          )}

          {active && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium sm:col-span-2 sm:justify-self-end"
              style={{ background: 'var(--q-selected)', color: 'var(--q-royal-text)' }}
            >
              <X size={14} aria-hidden="true" /> {t(lang, 'clearFiltersBtn')}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setManagingLabels(true)}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium"
          style={{ background: 'var(--q-surface-muted)', color: 'var(--q-text-secondary)', border: '0.5px solid var(--q-border)' }}
        >
          <Tag size={15} aria-hidden="true" /> {t(lang, 'manageLabels')}
        </button>
        </>)}
      </div>
    </div>
  );
}
