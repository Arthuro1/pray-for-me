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
// content, and the sharer is at most a first name.
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <a href="/" className="flex min-h-11 items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          <img src="/logo.svg" alt="" className="h-8 w-8 rounded-lg" /> Praystead
        </a>
        <button type="button" onClick={onSignIn} className="min-h-11 px-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
          {t(lang, 'authLogIn')}
        </button>
      </header>

      <main className="mx-auto max-w-md px-4 pb-12 pt-4">
        {plan ? (
          <>
            <PlanSharePreview plan={plan} lang={lang} firstName={invite.firstName} />
            <div className="mt-6">
              <PlanJoinControls
                lang={lang}
                onJoin={join}
                busy={invite.loading}
                footnote={invite.firstName ? t(lang, 'planShareJoinFootnote', { name: invite.firstName }) : null}
              />
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'planShareUnavailable')}</p>
        )}

        <p className="mt-10 text-center text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'planShareAboutApp')}{' '}
          <a href="/" className="font-medium" style={{ color: 'var(--accent)' }}>{t(lang, 'planShareDiscover')}</a>
        </p>
      </main>
    </div>
  );
}
