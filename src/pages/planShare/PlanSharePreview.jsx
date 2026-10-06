import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { t } from '../../i18n';
import { useLocalizedPlan } from '../../hooks/useLocalizedPlan';
import { todayKey } from '../../lib/prayedLog';
import PlanOverview from '../../components/plan/PlanOverview';

// What a shared plan link shows, signed in or not: who invites (first name
// only, and only while the link is live), then the whole plan exactly as the
// catalogue previews it — whoever joins starts at day 1, so they see it all.
export function PlanSharePreview({ plan, lang, firstName }) {
  const localized = useLocalizedPlan(plan, lang);

  return (
    <article>
      <p className="section-label">
        {firstName ? t(lang, 'planShareInvitedBy', { name: firstName }) : t(lang, 'planShareInvited')}
      </p>
      <h1 className="reader__title">{t(lang, localized.titleKey)}</h1>
      <p className="plan-detail__sub">
        {t(lang, localized.subKey)} · {t(lang, 'planDays', { n: localized.count })}
      </p>

      <div className="mt-10">
        <PlanOverview plan={localized} lang={lang} />
      </div>
    </article>
  );
}

// "Join this plan", today or on a chosen day — the same choice the catalogue
// offers before a plan starts.
export function PlanJoinControls({ lang, onJoin, busy = false }) {
  const [startDate, setStartDate] = useState(todayKey());
  const [showStartDate, setShowStartDate] = useState(false);

  return (
    <div className="space-y-3">
      {showStartDate && (
        <label className="flex items-center justify-between gap-3">
          <span className="q-field__label">{t(lang, 'planStartDate')}</span>
          <input
            type="date"
            value={startDate}
            min={todayKey()}
            onChange={(e) => setStartDate(e.target.value)}
            className="q-input w-auto"
            style={{ colorScheme: 'light dark' }}
          />
        </label>
      )}
      <button
        type="button"
        onClick={() => onJoin(showStartDate && startDate ? startDate : todayKey())}
        disabled={busy}
        className="primary-button flex w-full items-center justify-center gap-2 px-4 disabled:opacity-60"
      >
        {busy && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
        {t(lang, 'planShareJoin')}
      </button>
      <button
        type="button"
        onClick={() => setShowStartDate((open) => !open)}
        className="quiet-button pressable w-full"
      >
        {t(lang, showStartDate ? 'startTodayInstead' : 'startAnotherDay')}
      </button>
    </div>
  );
}
