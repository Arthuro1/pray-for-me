import { useId, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '../../i18n';
import { pick } from '../../content/teaching';
import VersePill from '../shared/VersePill';

// What a guided plan is, before anyone commits to it: the intro, the Scripture
// story it follows (biblical, behind a "Read more"), and a day-by-day preview so
// the days hold no surprises. Longer journeys lead with their movements and keep
// the full syllabus one tap away. Shared by the catalogue's PlanDetailModal and
// the public page a shared plan link opens, so both read the same. `plan` is
// already localized (useLocalizedPlan). Read as a page of a prayer book: prose
// in the serif, days as rows divided by hairlines, Scripture in gold.
export default function PlanOverview({ plan, lang }) {
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const disclosureId = useId();
  const movementFirst = plan.count >= 8 && (plan.movements?.length || 0) > 0;
  const defaultDayCount = plan.count <= 7 ? plan.days.length : 3;
  const visibleDays = showAllDays ? plan.days : movementFirst ? [] : plan.days.slice(0, defaultDayCount);

  return (
    <>
      {plan.mode === 'study' && (
        <p className="q-meta">{t(lang, 'studyPace')}</p>
      )}

      {/* What this journey is */}
      {(plan.intro || plan.biblical) && (
        <section className="plan-overview__section">
          <h3 className="section-label">{t(lang, 'planAbout')}</h3>
          <div id={`${disclosureId}-about`}>
            {plan.intro && (
              <p className={`plan-overview__intro ${!showFullAbout && plan.biblical ? 'line-clamp-3' : ''}`}>
                {pick(plan.intro, lang)}
              </p>
            )}

            {/* Keep the longer biblical context available without making it
                part of the first-use scan. */}
            {showFullAbout && plan.biblical && (
              <div className="plan-overview__bible">
                <h4 className="section-label section-label--sacred">{t(lang, 'planInBible')}</h4>
                <p className="plan-overview__bible-text">{pick(plan.biblical.text, lang)}</p>
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
              className="quiet-button pressable -ms-3"
            >
              {showFullAbout ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              <span>{t(lang, showFullAbout ? 'tipCollapse' : 'gospelReadMore')}</span>
            </button>
          )}
        </section>
      )}

      {/* Long journeys reveal their shape before their full syllabus. */}
      <section className="plan-overview__section">
        <h3 className="section-label">
          {t(lang, movementFirst && !showAllDays ? 'journeyWalkThrough' : 'journeyDayPreview')}
        </h3>
        {movementFirst && !showAllDays && (
          <ol className="plan-overview__list">
            {plan.movements.map((movement, index) => {
              const next = plan.movements[index + 1];
              const to = next ? next.from - 1 : plan.count;
              return (
                <li key={`${movement.from}-${movement.titleKey}`} className="plan-overview__movement">
                  <span className="plan-overview__span" dir="ltr">{movement.from}–{to}</span>
                  <span className="plan-overview__movement-title">{t(lang, movement.titleKey)}</span>
                </li>
              );
            })}
          </ol>
        )}
        <ol id={`${disclosureId}-days`} className="plan-overview__list">
          {visibleDays.map((day, i) => {
            // A movement heading appears on the day it starts, so the shape
            // of a longer journey reads without adding a second list level.
            const movement = plan.movements?.find((m) => m.from === i + 1);
            return (
              <li key={i} className="plan-overview__day">
                {movement && <p className="section-label plan-overview__movement-head">{t(lang, movement.titleKey)}</p>}
                <p className="plan-overview__day-label">{t(lang, 'planDayLabel', { n: i + 1 })}</p>
                <p className="plan-overview__theme">{pick(day.theme, lang)}</p>
                <VersePill reference={day.ref} lang={lang} />
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
            className="secondary-button pressable mt-4 w-full"
          >
            {showAllDays ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            <span>{showAllDays ? t(lang, 'tipCollapse') : t(lang, 'previewAllDays')}</span>
          </button>
        )}
      </section>
    </>
  );
}
