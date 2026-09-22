import { useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { t } from '../../i18n';
import { localizeRef, pick } from '../../content/teaching';
import { useLocalizedPlan } from '../../hooks/useLocalizedPlan';
import { todayKey } from '../../lib/prayedLog';

// What a shared plan link shows, signed in or not: who invites (first name
// only, and only while the link is live), the plan, and its first day. Day 1,
// not the sharer's current day — whoever joins starts at the beginning.
export function PlanSharePreview({ plan, lang, firstName }) {
  const localized = useLocalizedPlan(plan, lang);
  const firstDay = localized.days?.[0] || null;

  return (
    <article>
      <p className="section-label mb-3">
        {firstName ? t(lang, 'planShareInvitedBy', { name: firstName }) : t(lang, 'planShareInvited')}
      </p>
      <div className="flex items-start gap-3">
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--accent-soft)' }} aria-hidden="true">
          {localized.emoji}
        </span>
        <div className="min-w-0">
          <h1 className="editorial-heading text-3xl leading-tight" style={{ color: 'var(--text-1)' }}>{t(lang, localized.titleKey)}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>
            {t(lang, localized.subKey)} · {t(lang, 'planDays', { n: localized.count })}
          </p>
        </div>
      </div>

      {localized.intro && (
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--text-2)', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 5, overflow: 'hidden' }}
        >
          {pick(localized.intro, lang)}
        </p>
      )}

      {firstDay && (
        <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t(lang, 'planDayLabel', { n: 1 })}</p>
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-1)' }}>{pick(firstDay.theme, lang)}</p>
          {firstDay.ref && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
              <BookOpen size={12} aria-hidden="true" /> {localizeRef(firstDay.ref, lang)}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

// "Join this plan", today or on a chosen day — the same choice the catalogue
// offers before a plan starts.
export function PlanJoinControls({ lang, onJoin, busy = false, footnote = null }) {
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
      {footnote && <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-3)' }}>{footnote}</p>}
    </div>
  );
}
