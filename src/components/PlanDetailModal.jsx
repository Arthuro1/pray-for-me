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
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, plan.titleKey)}
        className="editorial-dialog w-full max-w-md max-h-[85vh] min-h-0 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 flex items-start gap-3 shrink-0" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--accent-soft)' }}>
            {plan.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, plan.titleKey)}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {t(lang, plan.subKey)} · {t(lang, 'planDays', { n: plan.count })}
            </p>
            {!isPlanReviewed(source) && (
              <p className="mt-1 text-[11px] font-medium" style={{ color: 'var(--gold)' }}>{t(lang, 'planCoupleReviewPending')}</p>
            )}
          </div>
          {onShare && isPlanShareable(source) && (
            <button type="button" onClick={onShare} aria-label={t(lang, 'planShareAction')} title={t(lang, 'planShareAction')} className="phase-icon-button shrink-0">
              <Share2 size={17} aria-hidden="true" />
            </button>
          )}
          <button onClick={onClose} aria-label={t(lang, 'close')} className="phase-icon-button shrink-0"><X size={18} /></button>
        </div>

        {usable ? (<div className="min-h-0 flex-1 overflow-y-auto p-5 pb-8 space-y-5">
          {/* Opened in review mode (or a dev build): say plainly that what
              follows is a draft, not only that a review is outstanding. */}
          {!isPlanReviewed(source) && (
            <p className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-2)' }}>
              {t(lang, 'planCoupleReviewHint')}
            </p>
          )}
          <PlanOverview plan={plan} lang={lang} />
        </div>) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-5 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            {t(lang, 'planCoupleReviewHint')}
          </div>
        )}

        {/* Start action lives with the explanation: read, then choose when to begin */}
        <div
          className="shrink-0 p-5 pt-4 space-y-3"
          style={{
            background: 'var(--surface)',
            borderTop: '0.5px solid var(--border)',
            paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
          }}
        >
          {!running && usable && showStartDate && (
            <label className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{t(lang, 'planStartDate')}</span>
              <input
                type="date"
                value={startDate}
                min={todayKey()}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm rounded-lg px-2.5 py-1.5"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)', colorScheme: 'light dark' }}
              />
            </label>
          )}
          <button
            // Hand back the SOURCE plan, not the localized copy, so callers keep the canonical PLANS entry.
            onClick={() => { if (!running && usable) { onStart(source, startDate || todayKey()); onClose(); } }}
            disabled={running || !usable}
            className="w-full text-sm font-semibold px-3 py-3 rounded-xl disabled:opacity-60"
            style={running
              ? { background: 'var(--input-bg)', color: 'var(--text-3)' }
              : { background: 'var(--accent)', color: '#fff' }}
          >
            {/* A short label, not the explanation — that already sits in the
                body of this modal, right above. */}
            {!usable ? t(lang, 'planCoupleReviewPending') : running
              ? <span className="inline-flex items-center gap-1.5"><Check size={15} /> {runningLabel || t(lang, 'planRunning')}</span>
              : (ctaLabel || t(lang, showStartDate ? 'journeyStart' : 'journeyStartToday'))}
          </button>
          {footnote && <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-3)' }}>{footnote}</p>}
          {!running && usable && !ctaLabel && (
            <button
              type="button"
              onClick={() => setShowStartDate((open) => !open)}
              className="w-full min-h-11 text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {t(lang, showStartDate ? 'startTodayInstead' : 'startAnotherDay')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
