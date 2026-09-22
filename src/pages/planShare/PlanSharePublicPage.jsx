import { useLocation } from 'react-router-dom';
import { t } from '../../i18n';
import { planById } from '../../lib/guidedPlan';
import { parsePlanSharePath, savePendingPlanJoin } from '../../lib/planShareLink';
import { usePlanShareInvite } from '../../hooks/usePlanShareInvite';
import { PlanJoinControls, PlanSharePreview } from './PlanSharePreview';

// What someone without an account sees when they open a shared plan link:
// the plan itself, readable before anything is asked of them, and one action.
// "Join this plan" remembers their choice on this device and leads to sign-up;
// once they arrive signed in (even after confirming an email) the plan starts
// on its own — see PlanJoinPage. Nothing here is personal: the plan is public
// content, and the sharer is at most a first name. It wears the same
// Constellation sky as the app the visitor is about to join.
export default function PlanSharePublicPage({ lang, onJoin, onSignIn }) {
  const { pathname } = useLocation();
  const { planId, token } = parsePlanSharePath(pathname) || {};
  const plan = planById(planId);
  const invite = usePlanShareInvite(token, planId);

  const join = (startDate) => {
    savePendingPlanJoin({ planId, token: invite.active ? token : null, startDate });
    onJoin();
  };

  return (
    <div className="constellation-plan-share relative flex min-h-screen flex-col">
      <div className="constellation-plan-share__sky" aria-hidden="true">
        <img src="/assets/constellation/detail-sky-light-transparent.png" alt="" className="constellation-plan-share__sky-image constellation-plan-share__sky-image--light" />
        <img src="/assets/constellation/detail-sky-dark-transparent.png" alt="" className="constellation-plan-share__sky-image constellation-plan-share__sky-image--dark" />
      </div>

      <header className="relative mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <a href="/" className="flex min-h-11 items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          <img src="/logo.svg" alt="" className="h-8 w-8 rounded-lg" /> Praystead
        </a>
        <button type="button" onClick={onSignIn} className="min-h-11 px-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
          {t(lang, 'authLogIn')}
        </button>
      </header>

      {plan ? (
        <>
          <main className="relative mx-auto w-full max-w-md flex-1 px-4 pb-8 pt-6">
            <PlanSharePreview plan={plan} lang={lang} firstName={invite.firstName} />
          </main>
          {/* Read, then choose: the action stays in reach however far the
              day-by-day preview is opened — as in the catalogue's plan sheet. */}
          <footer className="constellation-plan-share__actions sticky bottom-0 z-10 px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-md">
              <PlanJoinControls lang={lang} onJoin={join} busy={invite.loading} />
            </div>
          </footer>
        </>
      ) : (
        <main className="relative mx-auto w-full max-w-md flex-1 px-4">
          <p className="py-10 text-center text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'planShareUnavailable')}</p>
        </main>
      )}
    </div>
  );
}
