import { useState } from 'react';
import { X, Check, Share2 } from 'lucide-react';
import { t } from '../i18n';
import { todayKey } from '../lib/prayedLog';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalizedPlan } from '../hooks/useLocalizedPlan';
import PlanOverview from './plan/PlanOverview';
import { canUsePlan, isPlanReviewed } from '../lib/planReview';
import { isPlanShareable } from '../lib/planShareLink';
import { PrimaryButton, QuietButton, StatusLabel } from './shared/Primitives';

// Explains a guided plan before the user commits to it (PlanOverview: the
// intro, its Scripture story and a day-by-day preview) with a single Start
// action beside it, so "read, then choose" is one flow. Pure presentation:
// `plan` is a PLANS entry, actions come from the caller.

// Optional props let the same modal drive the "adopt for the group" flow:
//   ctaLabel     — overrides the primary "Start" label (e.g. "Start for the group")
//   runningLabel — overrides the disabled/started label (e.g. "The group is already praying this")
//   footnote     — a small line under the actions (e.g. what starting shares with the group)
//   onShare      — shows a "Share this plan" action in the header (signed-in catalogue only)
export default function PlanDetailModal({ plan: source, lang, running, onStart, onClose, ctaLabel, runningLabel, footnote, onShare }) {
  // Rich plans carry prose in more languages than the source file authors; the
  // overlay folds in on demand and the day themes are already localized.
  const plan = useLocalizedPlan(source, lang);
  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true);
  const [startDate, setStartDate] = useState(todayKey());
  const [showStartDate, setShowStartDate] = useState(false);
  const usable = canUsePlan(source);

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, plan.titleKey)}
        className="q-dialog flex max-h-[88vh] min-h-0 w-full max-w-lg flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: the plan's length, its name in the serif, what it is. */}
        <div className="plan-detail__header shrink-0">
          <div className="min-w-0 flex-1">
            <p className="section-label">{t(lang, 'planDays', { n: plan.count })}</p>
            <h2 className="plan-detail__title">{t(lang, plan.titleKey)}</h2>
            <p className="plan-detail__sub">{t(lang, plan.subKey)}</p>
            {!isPlanReviewed(source) && (
              <StatusLabel tone="sacred" className="mt-2">{t(lang, 'planCoupleReviewPending')}</StatusLabel>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 -me-2 -mt-2">
            {onShare && isPlanShareable(source) && (
              <button type="button" onClick={onShare} aria-label={t(lang, 'planShareAction')} title={t(lang, 'planShareAction')} className="icon-button pressable">
                <Share2 size={18} aria-hidden="true" />
              </button>
            )}
            <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable"><X size={18} aria-hidden="true" /></button>
          </div>
        </div>

        {usable ? (
          <div className="plan-detail__body min-h-0 flex-1 overflow-y-auto">
            {/* Opened in review mode (or a dev build): say plainly that what
                follows is a draft, not only that a review is outstanding. */}
            {!isPlanReviewed(source) && (
              <p className="nudge__body mb-6">{t(lang, 'planCoupleReviewHint')}</p>
            )}
            <PlanOverview plan={plan} lang={lang} />
          </div>
        ) : (
          <div className="plan-detail__body min-h-0 flex-1 overflow-y-auto text-[0.9375rem] leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>
            {t(lang, 'planCoupleReviewHint')}
          </div>
        )}

        {/* Start action lives with the explanation: read, then choose when to begin */}
        <div className="plan-detail__footer shrink-0">
          {!running && usable && showStartDate && (
            <label className="mb-3 flex items-center justify-between gap-3">
              <span className="q-field__label">{t(lang, 'planStartDate')}</span>
              <input
                type="date"
                value={startDate}
                min={todayKey()}
                onChange={(e) => setStartDate(e.target.value)}
                className="q-input w-auto"
                style={{ colorScheme: 'light dark' }}
              />
            </label>
          )}
          <PrimaryButton
            // Hand back the SOURCE plan, not the localized copy, so callers keep the canonical PLANS entry.
            onClick={() => { if (!running && usable) { onStart(source, startDate || todayKey()); onClose(); } }}
            disabled={running || !usable}
            icon={running ? Check : undefined}
            className="w-full"
          >
            {/* A short label, not the explanation — that already sits in the
                body of this modal, right above. */}
            {!usable ? t(lang, 'planCoupleReviewPending') : running
              ? (runningLabel || t(lang, 'planRunning'))
              : (ctaLabel || t(lang, showStartDate ? 'journeyStart' : 'journeyStartToday'))}
          </PrimaryButton>
          {footnote && <p className="q-meta mt-3 text-center">{footnote}</p>}
          {!running && usable && !ctaLabel && (
            <QuietButton onClick={() => setShowStartDate((open) => !open)} className="mt-1 w-full">
              {t(lang, showStartDate ? 'startTodayInstead' : 'startAnotherDay')}
            </QuietButton>
          )}
        </div>
      </div>
    </div>
  );
}
