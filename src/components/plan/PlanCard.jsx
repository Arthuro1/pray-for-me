import { Check, ChevronRight } from 'lucide-react';
import { t } from '../../i18n';
import { isPlanReviewed } from '../../lib/planReview';

// One plan in the catalogue: a single button whose accessible name carries the
// title, the summary and where the reader stands ("Day 8 of 30", or its length),
// so a screen reader hears the whole card as one thing.
//
//   progress — { day } when the plan is running for this reader
//   finished — the reader has walked this plan to its end before
export default function PlanCard({ plan, lang, progress, finished = false, onOpen }) {
  const running = !!progress;
  return (
    <button type="button" onClick={onOpen} className="phase-card grow-card w-full p-4 text-start">
      <span className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: 'var(--accent-soft)' }} aria-hidden="true">
          {plan.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            {t(lang, plan.titleKey)}
            {finished && <Check size={13} aria-hidden="true" style={{ color: 'var(--success)' }} />}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, plan.subKey)}</span>
          {/* A draft on screen always says so, in the card and again in the
              detail — a reviewer must never mistake one for shipped content. */}
          {!isPlanReviewed(plan) && (
            <span className="mt-1 block text-[11px] font-medium" style={{ color: 'var(--gold)' }}>{t(lang, 'planCoupleReviewPending')}</span>
          )}
          <span className="mt-2 block text-xs font-medium" style={{ color: running ? 'var(--success)' : 'var(--accent)' }}>
            {running
              ? t(lang, 'planDayOf', { n: progress.day || 1, total: plan.count })
              : finished
                ? t(lang, 'prayAgain')
                : t(lang, 'planDays', { n: plan.count })}
          </span>
        </span>
        <ChevronRight size={16} className="rtl-mirror mt-1 shrink-0" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
      </span>
    </button>
  );
}
