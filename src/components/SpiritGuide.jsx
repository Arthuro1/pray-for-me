import { useInRouterContext, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { t } from '../i18n';
import { planById } from '../lib/guidedPlan';
import { canUsePlan } from '../lib/planReview';
import { PLAN_SOURCES } from '../lib/planAnalytics';
import { QuietButton, SectionLabel } from './shared/Primitives';
import ScriptureRefButton from './circles/ScriptureRefButton';
import PlanCard from './plan/PlanCard';

// "What does it mean to pray in the Spirit?" — a few short answers to the
// questions people bring to the quiet space, each with the passages behind it,
// then the 21-day plan for those who want to go further. Scripture is cited by
// reference only; the app never says what the Spirit says.
const SPIRIT_PLAN_ID = 'holySpirit21';

export const SPIRIT_GUIDE = Object.freeze([
  { id: 'tongues', questionKey: 'spiritFaqTonguesQ', answerKey: 'spiritFaqTonguesA', refs: ['1 Corinthians 14:15', '1 Corinthians 12:11'] },
  { id: 'how', questionKey: 'spiritFaqHowQ', answerKey: 'spiritFaqHowA', refs: ['Philippians 4:6', 'Psalm 46:10'] },
  { id: 'wander', questionKey: 'spiritFaqWanderQ', answerKey: 'spiritFaqWanderA', refs: ['Romans 8:26-27'] },
]);

const INTRO_REFS = ['Ephesians 6:18', 'Jude 1:20'];

function Refs({ refs, lang }) {
  return (
    <ul className="spirit-guide__refs">
      {refs.map((ref) => <li key={ref}><ScriptureRefButton reference={ref} lang={lang} /></li>)}
    </ul>
  );
}

// The plan opens on the Plans page, so the quiet space (or the whole time of
// prayer around it) closes first. Rendered only inside a router.
function SpiritPlanLink({ lang, onLeave }) {
  const navigate = useNavigate();
  const plan = planById(SPIRIT_PLAN_ID);
  if (!plan || !canUsePlan(plan)) return null;
  const open = () => {
    onLeave();
    navigate('/plans', { state: { openPlanId: plan.id, source: PLAN_SOURCES.QUIET_SPACE } });
  };
  return (
    <section className="spirit-guide__plan" aria-labelledby="spirit-guide-plan">
      <SectionLabel id="spirit-guide-plan" sacred className="mb-2">{t(lang, 'goDeeper')}</SectionLabel>
      <PlanCard plan={plan} lang={lang} onOpen={open} />
    </section>
  );
}

export default function SpiritGuide({ lang, onBack, onLeave }) {
  const inRouter = useInRouterContext();
  return (
    <div className="spirit-guide">
      <h2 className="spirit-guide__title">{t(lang, 'spiritGuideLink')}</h2>
      <p className="spirit-guide__answer">{t(lang, 'spiritGuideIntro')}</p>
      <Refs refs={INTRO_REFS} lang={lang} />

      {SPIRIT_GUIDE.map(({ id, questionKey, answerKey, refs }) => (
        <section key={id} className="spirit-guide__item" aria-labelledby={`spirit-guide-${id}`}>
          <h3 id={`spirit-guide-${id}`} className="spirit-guide__question">{t(lang, questionKey)}</h3>
          <p className="spirit-guide__answer">{t(lang, answerKey)}</p>
          <Refs refs={refs} lang={lang} />
        </section>
      ))}

      {inRouter && <SpiritPlanLink lang={lang} onLeave={onLeave} />}

      <QuietButton onClick={onBack} className="spirit-guide__back">
        <span className="inline-flex items-center gap-2">
          <ChevronLeft className="rtl-mirror" size={16} aria-hidden="true" /> {t(lang, 'backBtn')}
        </span>
      </QuietButton>
    </div>
  );
}
