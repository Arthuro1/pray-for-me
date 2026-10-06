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
// already localized (useLocalizedPlan).
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
        <p className="text-xs leading-relaxed" style={{ color: 'var(--accent)' }}>{t(lang, 'studyPace')}</p>
      )}

      {/* What this journey is */}
      {(plan.intro || plan.biblical) && (
        <section>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>{t(lang, 'planAbout')}</h4>
          <div id={`${disclosureId}-about`}>
            {plan.intro && (
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
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
                <p className="text-sm leading-relaxed whitespace-pre-line mb-2.5" style={{ color: 'var(--text-1)' }}>{pick(plan.biblical.text, lang)}</p>
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
    </>
  );
}
