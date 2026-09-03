import { useId, useState } from 'react';
import { X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import { todayKey } from '../lib/prayedLog';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalizedPlan } from '../hooks/useLocalizedPlan';
import VersePill from './shared/VersePill';
import { canUsePlan, isPlanReviewed } from '../lib/planReview';

// Explains a guided plan before the user commits to it: what the journey is
// (intro), the Scripture story it follows — when and how it was prayed/fasted in
// the Bible (biblical) — and a day-by-day preview so the days hold no surprises.
// A single Start action lives here so "read, then choose" is one flow. Pure
// presentation: `plan` is a PLANS entry, actions come from the caller.

// Optional props let the same modal drive the "adopt for the group" flow:
//   ctaLabel     — overrides the primary "Start" label (e.g. "Start for the group")
//   runningLabel — overrides the disabled/started label (e.g. "The group is already praying this")
//   footnote     — a small line under the actions (e.g. what starting shares with the group)
export default function PlanDetailModal({ plan: source, lang, running, onStart, onClose, ctaLabel, runningLabel, footnote }) {
  // Rich plans carry prose in more languages than the source file authors; the
  // overlay folds in on demand and the day themes are already localized.
  const plan = useLocalizedPlan(source, lang);
  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true);
  const [startDate, setStartDate] = useState(todayKey());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const disclosureId = useId();
  const usable = canUsePlan(source);
  const movementFirst = plan.count >= 8 && (plan.movements?.length || 0) > 0;
  const defaultDayCount = plan.count <= 7 ? plan.days.length : 3;
  const visibleDays = showAllDays ? plan.days : movementFirst ? [] : plan.days.slice(0, defaultDayCount);

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
          <button onClick={onClose} aria-label={t(lang, 'close')} className="phase-icon-button shrink-0"><X size={18} /></button>
        </div>

        {usable ? (<div className="min-h-0 flex-1 overflow-y-auto p-5 pb-8 space-y-5">
          {plan.mode === 'study' && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--accent)' }}>{t(lang, 'studyPace')}</p>
          )}
          {/* Opened in review mode (or a dev build): say plainly that what
              follows is a draft, not only that a review is outstanding. */}
          {!isPlanReviewed(source) && (
            <p className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-2)' }}>
              {t(lang, 'planCoupleReviewHint')}
            </p>
          )}

          {/* What this journey is */}
          {(plan.intro || plan.biblical) && (
            <section>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>{t(lang, 'planAbout')}</h4>
              <div id={`${disclosureId}-about`}>
                {plan.intro && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: 'var(--text-2)',
                      ...(!showFullAbout && plan.biblical
                        ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }
                        : {}),
                    }}
                  >
                    {pick(plan.intro, lang)}
                  </p>
                )}

                {/* Keep the longer biblical context available without making it
                    part of the first-use scan. */}
                {showFullAbout && plan.biblical && (
                  <div className="rounded-xl p-3.5 mt-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--accent)' }}>{t(lang, 'planInBible')}</h4>
                    <p className="text-sm leading-relaxed mb-2.5" style={{ color: 'var(--text-1)' }}>{pick(plan.biblical.text, lang)}</p>
                    <VersePill reference={plan.biblical.ref} lang={lang} />
                  </div>
                )}
              </div>
              {plan.biblical && (
                <button
                  type="button"
                  aria-expanded={showFullAbout}
                  aria-controls={`${disclosureId}-about`}
                  onClick={() => setShowFullAbout((open) => !open)}
                  className="mt-2 min-h-11 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg"
                  style={{ color: 'var(--accent)' }}
                >
                  {showFullAbout ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
                  {t(lang, showFullAbout ? 'tipCollapse' : 'gospelReadMore')}
                </button>
              )}
            </section>
          )}

          {/* Long journeys reveal their shape before their full syllabus. */}
          <section>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
              {t(lang, movementFirst && !showAllDays ? 'journeyWalkThrough' : 'journeyDayPreview')}
            </h4>
            {movementFirst && !showAllDays && (
              <ol className="space-y-2">
                {plan.movements.map((movement, index) => {
                  const next = plan.movements[index + 1];
                  const to = next ? next.from - 1 : plan.count;
                  return (
                    <li key={`${movement.from}-${movement.titleKey}`} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
                      <span className="w-14 shrink-0 text-xs font-semibold" style={{ color: 'var(--accent)' }}>{movement.from}–{to}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t(lang, movement.titleKey)}</span>
                    </li>
                  );
                })}
              </ol>
            )}
            <ol id={`${disclosureId}-days`} className="space-y-2">
              {visibleDays.map((day, i) => {
                // A movement heading appears on the day it starts, so the shape
                // of a longer journey reads without adding a second list level.
                const movement = plan.movements?.find((m) => m.from === i + 1);
                return (
                  <li key={i}>
                    {movement && (
                      <p className="mb-1.5 mt-3 first:mt-0 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                        {t(lang, movement.titleKey)}
                      </p>
                    )}
                    <div className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t(lang, 'planDayLabel', { n: i + 1 })}</p>
                      <p className="text-sm font-medium mb-2 leading-snug" style={{ color: 'var(--text-1)' }}>{pick(day.theme, lang)}</p>
                      <VersePill reference={day.ref} lang={lang} />
                    </div>
                  </li>
                );
              })}
            </ol>
            {plan.count > 7 && (
              <button
                type="button"
                aria-expanded={showAllDays}
                aria-controls={`${disclosureId}-days`}
                aria-label={t(lang, showAllDays ? 'tipCollapse' : 'previewAllDays')}
                onClick={() => setShowAllDays((open) => !open)}
                className="mt-3 w-full min-h-11 rounded-xl inline-flex items-center justify-center gap-1.5 text-sm font-semibold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
              >
                {showAllDays ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                {showAllDays ? t(lang, 'tipCollapse') : t(lang, 'previewAllDays')}
              </button>
            )}
          </section>
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
