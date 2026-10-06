import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Share2 } from 'lucide-react';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import { PLAN_SOURCES } from '../lib/planAnalytics';
import RiseMark from './shared/RiseMark';
import { PrimaryButton, QuietButton } from './shared/Primitives';

// What a rich plan says once its last day is behind the reader.
//
// Calm, and honest: it names what they did — sought God, worked on their own
// heart, prayed about a marriage that may or may not come — and it does NOT say
// that they are now ready or that anything has been earned. The one forward
// action is optional: carry some of the themes on as ordinary recurring prayers.
//
// This list IS the "what would you like this plan to emphasize?" question,
// asked where it can finally do something. It used to be put at the START of the
// plan as well, and the only thing that answer ever did was pre-tick these boxes
// three weeks later — so it is asked once, here, with everything offered.
export default function PlanCompletionCard({ plan, lang, onContinue, onRelationshipNext, onShare }) {
  const themes = plan.continueThemes || [];
  // Recurring prayers are a lasting choice, so completion never opts the
  // reader into all of them by default.
  const [selected, setSelected] = useState([]);
  const [done, setDone] = useState(false);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const chosen = themes.filter((th) => selected.includes(th.id));
  const relationshipActionKey = plan.lifeStage === 'engaged'
    ? 'planCoupleContinueMarriage'
    : (plan.lifeStage === 'married' && plan.renewable ? 'planCoupleRepeat' : null);
  const continuationChoiceOpen = themes.length > 0 && !done;

  return (
    <section className="plan-complete">
      <RiseMark motion="still" size={36} />
      <p className="section-label section-label--sacred mt-4">{t(lang, 'planCompleteHeading', { n: plan.count })}</p>
      <p className="plan-complete__body">{pick(plan.completion, lang)}</p>

      {/* "Look back" — questions to sit with, not a form to fill in. A plan that
          declares them gets them; the others render nothing here. They ask about
          Scripture, surrender, practical change and remaining prayer — never
          about what supposedly left the reader. */}
      {(plan.lookBack || []).length > 0 && (
        <section className="mb-4">
          <h4 className="section-label mb-2">
            {t(lang, 'planLookBackHeading')}
          </h4>
          <ul className="space-y-1.5">
            {plan.lookBack.map((key) => (
              <li key={key} className="plan-day__item">
                <span aria-hidden="true" className="plan-day__bullet" />
                <span className="min-w-0">{t(lang, key)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {themes.length > 0 && !done && (
        <>
          <h4 className="plan-complete__question">{t(lang, 'planContinueHeading')}</h4>
          <div role="group" aria-label={t(lang, 'planContinueHeading')} className="plan-complete__themes">
            {themes.map((th) => {
              const on = selected.includes(th.id);
              return (
                <button
                  key={th.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(th.id)}
                  className="plan-complete__theme pressable"
                >
                  <span className="q-check__box" aria-hidden="true" style={on ? { borderColor: 'var(--q-action-primary)', background: 'var(--q-action-primary)' } : undefined}>
                    {on && <Check size={14} strokeWidth={2.5} />}
                  </span>
                  <span className="min-w-0">{t(lang, th.titleKey)}</span>
                </button>
              );
            })}
          </div>
          <PrimaryButton
            onClick={async () => { await onContinue(chosen); setDone(true); }}
            disabled={chosen.length === 0}
            className={`${relationshipActionKey ? 'mb-3 ' : ''}w-full`}
          >
            {t(lang, 'planContinueCta')}
          </PrimaryButton>
        </>
      )}

      {done && (
        <p className={`plan-complete__added ${relationshipActionKey ? 'mb-3' : ''}`} role="status">
          {t(lang, 'planContinueAdded')}
        </p>
      )}

      {/* Router navigation, not a bare href: a plain link reloads the whole
          document, which in the installed PWA re-runs the splash and refetch —
          at the moment someone has just finished thirty days. When continuation
          choices are also present, this remains a secondary path so the card
          never presents two competing primary actions. */}
      {relationshipActionKey && (
        <Link
          to="/plans"
          state={{ source: PLAN_SOURCES.COMPLETION }}
          onClick={onRelationshipNext}
          data-emphasis={continuationChoiceOpen ? 'secondary' : 'primary'}
          className={`${continuationChoiceOpen ? 'secondary-button' : 'primary-button'} pressable w-full no-underline`}
        >
          {t(lang, relationshipActionKey)}
        </Link>
      )}

      {/* Passing the plan on is always the quiet, last option — never a second
          primary action competing with the ones above. */}
      {onShare && (
        <QuietButton icon={Share2} iconSize={16} onClick={onShare} className="mt-3 w-full">
          {t(lang, 'planShareWithSomeone')}
        </QuietButton>
      )}
    </section>
  );
}
