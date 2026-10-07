import { ChevronRight } from 'lucide-react';
import { t } from '../../i18n';
import { isPlanReviewed } from '../../lib/planReview';
import { circleLabelKey, planCircles } from '../../lib/circles';
import CircleGlyph from '../shared/CircleGlyph';
import { StatusLabel } from '../shared/Primitives';

// One plan in the catalogue, as an editorial row: its title in the serif, what
// it is, how long it takes — and, while it runs, where the reader stands, with
// a thin gold line. A single button whose accessible name carries all of it, so
// a screen reader hears the row as one thing. No emoji tile, no coloured card.
//
//   progress — { day } when the plan is running for this reader
//   finished — the reader has walked this plan to its end before
//   featured — the larger reading used for "Continue" and "Start here"
//   showCircle — name the plan's primary Intercession Circle above its title
//                (one quiet line, never every circle it touches); off where
//                the page is already about that circle
export default function PlanCard({ plan, lang, progress, finished = false, featured = false, showCircle = true, onOpen }) {
  const running = !!progress;
  const day = progress?.day || 1;
  const circle = showCircle ? planCircles(plan).primary : null;
  return (
    <button type="button" onClick={onOpen} className={`plan-row pressable ${featured ? 'plan-row--featured' : ''}`}>
      <span className="plan-row__body">
        {circle && (
          <span className="plan-row__circle">
            <CircleGlyph circle={circle} size={14} />
            <span>{t(lang, circleLabelKey(circle))}</span>
          </span>
        )}
        <span className="plan-row__title">{t(lang, plan.titleKey)}</span>
        <span className="plan-row__sub">{t(lang, plan.subKey)}</span>
        {/* A draft on screen always says so, in the row and again in the
            detail — a reviewer must never mistake one for shipped content. */}
        {!isPlanReviewed(plan) && <StatusLabel tone="sacred" className="plan-row__draft">{t(lang, 'planCoupleReviewPending')}</StatusLabel>}
        <span className="plan-row__meta">
          {running
            ? t(lang, 'planDayOf', { n: day, total: plan.count })
            : finished
              ? t(lang, 'prayAgain')
              : t(lang, 'planDays', { n: plan.count })}
        </span>
        {running && (
          <span className="plan-row__track" aria-hidden="true">
            <span style={{ width: `${Math.min(100, Math.round((day / plan.count) * 100))}%` }} />
          </span>
        )}
      </span>
      <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
    </button>
  );
}
