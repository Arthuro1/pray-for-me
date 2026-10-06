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
      <p className="section-label mb-3">
        {firstName ? t(lang, 'planShareInvitedBy', { name: firstName }) : t(lang, 'planShareInvited')}
      </p>
      <div className="flex items-start gap-3">
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }} aria-hidden="true">
          {localized.emoji}
        </span>
        <div className="min-w-0">
          <h1 className="editorial-heading text-3xl leading-tight" style={{ color: 'var(--text-1)' }}>{t(lang, localized.titleKey)}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>
            {t(lang, localized.subKey)} · {t(lang, 'planDays', { n: localized.count })}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
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
        className="w-full min-h-11 text-sm font-medium"
        style={{ color: 'var(--accent)' }}
      >
        {t(lang, showStartDate ? 'startTodayInstead' : 'startAnotherDay')}
      </button>
    </div>
  );
}
