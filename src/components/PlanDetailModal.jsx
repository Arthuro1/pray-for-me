import { useState } from 'react';
import { X, BookOpen, Check } from 'lucide-react';
import { t } from '../i18n';
import { pick, localizeRef } from '../content/teaching';
import { todayKey } from '../lib/prayedLog';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import VerseAccordion from './VerseAccordion';

// Explains a guided plan before the user commits to it: what the journey is
// (intro), the Scripture story it follows — when and how it was prayed/fasted in
// the Bible (biblical) — and a day-by-day preview so the days hold no surprises.
// A single Start action lives here so "read, then choose" is one flow. Pure
// presentation: `plan` is a PLANS entry, actions come from the caller.

// A verse reference rendered as a tappable pill that expands the passage in place
// (authoritative Scripture only, no AI) via VerseAccordion.
function VersePill({ reference, lang }) {
  return (
    <VerseAccordion reference={reference} lang={lang} panelStyle={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
      {({ toggle }) => (
        <button
          onClick={toggle}
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <BookOpen size={11} /> {localizeRef(reference, lang)}
        </button>
      )}
    </VerseAccordion>
  );
}

export default function PlanDetailModal({ plan, lang, running, onStart, onClose }) {
  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true);
  const [startDate, setStartDate] = useState(todayKey());

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, plan.titleKey)}
        className="w-full max-w-md rounded-2xl max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 flex items-start gap-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--accent-soft)' }}>
            {plan.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, plan.titleKey)}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, plan.subKey)} · {t(lang, 'planDays', { n: plan.count })}</p>
          </div>
          <button onClick={onClose} aria-label={t(lang, 'close')} className="shrink-0" style={{ color: 'var(--text-3)' }}><X size={18} /></button>
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
              {plan.days.map((day, i) => (
                <li key={i} className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t(lang, 'planDayLabel', { n: i + 1 })}</p>
                  <p className="text-sm font-medium mb-2 leading-snug" style={{ color: 'var(--text-1)' }}>{pick(day.theme, lang)}</p>
                  <VersePill reference={day.ref} lang={lang} />
                </li>
              ))}
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
            onClick={() => { if (!running) { onStart(plan, startDate || todayKey()); onClose(); } }}
            disabled={running}
            className="w-full text-sm font-semibold px-3 py-3 rounded-xl disabled:opacity-60"
            style={running
              ? { background: 'var(--input-bg)', color: 'var(--text-3)' }
              : { background: 'var(--accent)', color: '#fff' }}
          >
            {running
              ? <span className="inline-flex items-center gap-1.5"><Check size={15} /> {t(lang, 'planRunning')}</span>
              : `${t(lang, 'planStart')} · ${t(lang, 'planDays', { n: plan.count })}`}
          </button>
        </div>
      </div>
    </div>
  );
}
