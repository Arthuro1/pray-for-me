import { ChevronRight } from 'lucide-react';
import { t } from '../../i18n';
import { isPlanReviewed } from '../../lib/planReview';
import { StatusLabel } from '../shared/Primitives';
import PlanEmblem from './PlanEmblem';

// One plan in the catalogue: the quiet mark of its kind, its title in the
// serif, what it is, and how long it takes as a small chip — or, while it
// runs, where the reader stands, with a thin gold line. A single button whose
// accessible name carries all of it, so a screen reader hears the row as one
// thing. No picture, no coloured card, and no circle label: plans are browsed
// by what they are for, and a plan's circle is said once, in its detail.
// The length lives ONLY in the chip — subtitles never repeat it.
//
//   progress — { day } when the plan is running for this reader
//   finished — the reader has walked this plan to its end before
//   featured — the larger reading used for "Continue" and "Start here"
export default function PlanCard({ plan, lang, progress, finished = false, featured = false, onOpen }) {
  const running = !!progress;
  const day = progress?.day || 1;
  return (
    <button type="button" onClick={onOpen} className={`plan-row pressable ${featured ? 'plan-row--featured' : ''}`}>
      <PlanEmblem category={plan.category} />
      <span className="plan-row__body">
        <span className="plan-row__title">{t(lang, plan.titleKey)}</span>
        <span className="plan-row__sub">{t(lang, plan.subKey)}</span>
        {/* A draft on screen always says so, in the row and again in the
            detail — a reviewer must never mistake one for shipped content. */}
        {!isPlanReviewed(plan) && <StatusLabel tone="sacred" className="plan-row__draft">{t(lang, 'planCoupleReviewPending')}</StatusLabel>}
        {running ? (
          <>
            <span className="plan-row__meta">{t(lang, 'planDayOf', { n: day, total: plan.count })}</span>
            <span className="plan-row__track" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.round((day / plan.count) * 100))}%` }} />
            </span>
          </>
        ) : finished ? (
          <span className="plan-row__meta">{t(lang, 'prayAgain')}</span>
        ) : (
          <span className="plan-row__chip">{t(lang, 'planDays', { n: plan.count })}</span>
        )}
      </span>
      <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
    </button>
  );
}
