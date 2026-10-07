import { Link } from 'react-router-dom';
import { HandHeart, Share2 } from 'lucide-react';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import { PLAN_SOURCES } from '../lib/planAnalytics';
import { circleLabelKey, planCircles } from '../lib/circles';
import { useCircleTeaching } from '../hooks/useCircleTeaching';
import CircleGlyph from './shared/CircleGlyph';
import RiseMark from './shared/RiseMark';
import { QuietButton } from './shared/Primitives';

// The themes a finished plan offers to keep carrying: its own authored
// continuation themes when it has them, otherwise the themes of its primary
// Intercession Circle (the circle's short layer, already in every language) —
// so no plan needs new prose to end in lasting prayer.
function keepCarryingThemes(plan, lang, teaching, circle) {
  if (plan.continueThemes?.length) {
    return plan.continueThemes.map((theme) => ({
      id: theme.id,
      title: t(lang, theme.titleKey),
      desc: theme.descKey ? t(lang, theme.descKey) : null,
    }));
  }
  return teaching?.circle(circle)?.themes.map((theme) => ({ ...theme, desc: null })) || [];
}

// What a rich plan says once its last day is behind the reader.
//
// Calm, and honest: it names what they did — sought God, worked on their own
// heart, prayed about a marriage that may or may not come — and it does NOT say
// that they are now ready or that anything has been earned.
//
// Then it asks what they want to keep carrying, which turns a temporary journey
// into lasting prayer. Choosing a theme opens the composer in the plan's circle
// with the theme shown above an EMPTY field (`onKeepCarrying({ circle, prompt
// })`): the person writes the prayer, and nothing is ever created for them.
// They can come back and choose another.
export default function PlanCompletionCard({ plan, lang, onKeepCarrying, onRelationshipNext, onShare }) {
  const teaching = useCircleTeaching(lang);
  const circle = planCircles(plan).primary;
  const themes = onKeepCarrying ? keepCarryingThemes(plan, lang, teaching, circle) : [];
  const relationshipActionKey = plan.lifeStage === 'engaged'
    ? 'planCoupleContinueMarriage'
    : (plan.lifeStage === 'married' && plan.renewable ? 'planCoupleRepeat' : null);
  const continuationOffered = themes.length > 0;

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

      {continuationOffered && (
        <section aria-labelledby={`plan-keep-${plan.id}`} className="plan-complete__keep">
          <h4 id={`plan-keep-${plan.id}`} className="plan-complete__question">{t(lang, 'planKeepCarryingHeading')}</h4>
          <p className="plan-complete__hint">{t(lang, 'planKeepCarryingHint')}</p>
          {circle && (
            <p className="section-label plan-complete__circle">
              <CircleGlyph circle={circle} size={16} />
              <span>{t(lang, circleLabelKey(circle))}</span>
            </p>
          )}
          <ul className="plan-complete__themes">
            {themes.map((theme) => (
              <li key={theme.id}>
                <button
                  type="button"
                  onClick={() => onKeepCarrying({ circle, prompt: theme.title })}
                  className="plan-complete__theme pressable"
                >
                  <span className="min-w-0 flex-1">
                    <span className="plan-complete__theme-title">{theme.title}</span>
                    {theme.desc && <span className="plan-complete__theme-desc">{theme.desc}</span>}
                  </span>
                  <HandHeart size={18} aria-hidden="true" className="shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Router navigation, not a bare href: a plain link reloads the whole
          document, which in the installed PWA re-runs the splash and refetch —
          at the moment someone has just finished thirty days. When continuation
          themes are offered, this stays a secondary path so the card never
          presents two competing primary actions. */}
      {relationshipActionKey && (
        <Link
          to="/plans"
          state={{ source: PLAN_SOURCES.COMPLETION }}
          onClick={onRelationshipNext}
          data-emphasis={continuationOffered ? 'secondary' : 'primary'}
          className={`${continuationOffered ? 'secondary-button' : 'primary-button'} pressable w-full no-underline`}
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
