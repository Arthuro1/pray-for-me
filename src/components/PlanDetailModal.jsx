import { useState } from 'react';
import { X, Check, HeartHandshake } from 'lucide-react';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import { todayKey } from '../lib/prayedLog';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalizedPlan } from '../hooks/useLocalizedPlan';
import VersePill from './shared/VersePill';

// Explains a guided plan before the user commits to it: what the journey is
// (intro), the Scripture story it follows — when and how it was prayed/fasted in
// the Bible (biblical) — and a day-by-day preview so the days hold no surprises.
// A single Start action lives here so "read, then choose" is one flow. Pure
// presentation: `plan` is a PLANS entry, actions come from the caller.

// Optional props let the same modal drive the "adopt for the group" flow:
//   ctaLabel     — overrides the primary "Start" label (e.g. "Start for the group")
//   runningLabel — overrides the disabled/started label (e.g. "The group is already praying this")
//   footnote     — a small line under the actions (e.g. what starting shares with the group)
export default function PlanDetailModal({ plan: source, lang, running, onStart, onInvite, onClose, ctaLabel, runningLabel, footnote }) {
  // Rich plans carry prose in more languages than the source file authors; the
  // overlay folds in on demand and the day themes are already localized.
  const plan = useLocalizedPlan(source, lang);
  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true);
  const [startDate, setStartDate] = useState(todayKey());

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, plan.titleKey)}
        className="editorial-dialog w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 flex items-start gap-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--accent-soft)' }}>
            {plan.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, plan.titleKey)}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {plan.audienceKey ? `${t(lang, plan.audienceKey)} · ` : ''}{t(lang, plan.subKey)} · {t(lang, 'planDays', { n: plan.count })}
            </p>
          </div>
          <button onClick={onClose} aria-label={t(lang, 'close')} className="phase-icon-button shrink-0"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* What this journey is */}
          {plan.intro && (
            <section>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>{t(lang, 'planAbout')}</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{pick(plan.intro, lang)}</p>
            </section>
          )}

          {/* The Scripture story it follows — when & how it was done in the Bible */}
          {plan.biblical && (
            <section className="rounded-xl p-3.5" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--accent)' }}>{t(lang, 'planInBible')}</h4>
              <p className="text-sm leading-relaxed mb-2.5" style={{ color: 'var(--text-1)' }}>{pick(plan.biblical.text, lang)}</p>
              <VersePill reference={plan.biblical.ref} lang={lang} />
            </section>
          )}

          {/* Day-by-day preview so the user knows what they're starting */}
          <section>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'planDayByDay')}</h4>
            <ol className="space-y-2">
              {plan.days.map((day, i) => {
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
          </section>
        </div>

        {/* Start action lives with the explanation: read, then choose when to begin */}
        <div className="p-5 pt-0 sticky bottom-0 space-y-3" style={{ background: 'var(--surface)' }}>
          {!running && (
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
            // Hand back the SOURCE plan, not the localized copy, so callers keep the canonical PLANS entry.
            onClick={() => { if (!running) { onStart(source, startDate || todayKey()); onClose(); } }}
            disabled={running}
            className="w-full text-sm font-semibold px-3 py-3 rounded-xl disabled:opacity-60"
            style={running
              ? { background: 'var(--input-bg)', color: 'var(--text-3)' }
              : { background: 'var(--accent)', color: '#fff' }}
          >
            {running
              ? <span className="inline-flex items-center gap-1.5"><Check size={15} /> {runningLabel || t(lang, 'planRunning')}</span>
              : (ctaLabel || `${t(lang, 'planStart')} · ${t(lang, 'planDays', { n: plan.count })}`)}
          </button>
          {footnote && <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-3)' }}>{footnote}</p>}
          {/* Invite others to walk the plan with you — available whether or not
              you've started it yourself. */}
          {onInvite && (
            <button
              onClick={() => onInvite(source, startDate || todayKey())}
              className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl inline-flex items-center justify-center gap-2"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
            >
              <HeartHandshake size={15} /> {t(lang, 'planInviteCta')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
