import { useState } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { SEASONS, EMPHASES, ROLES, GROWTH_AREAS, DEFAULT_EMPHASIS, DEFAULT_ROLE, getPlanPrefs } from '../lib/planPrefs';

// The short onboarding a rich plan asks for before it starts.
//
// Four questions, one screen, all of them skippable: nothing here is required to
// begin, none of it asks about a person, and none of it changes the 21 days. It
// only chooses which optional reflection appears and which approved resources
// rank first. Answers are stored on the device and never leave it.
//
// The husband/wife question is asked OUT LOUD on purpose — the app must never
// infer it from a name, a profile photo, pronouns or anything else — and it
// defaults to keeping the plan general.

// A tappable option row. Radio semantics for the single-choice questions,
// checkbox semantics for the multi-choice ones, so a screen reader announces
// "one of four" versus "selected".
function OptionRow({ label, selected, multi, onSelect }) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onSelect}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start text-sm"
      style={selected
        ? { background: 'var(--accent-soft)', color: 'var(--text-1)', border: '1px solid var(--accent-border)' }
        : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
    >
      <span className="min-w-0">{label}</span>
      {selected && <Check size={15} className="shrink-0" aria-hidden="true" style={{ color: 'var(--accent)' }} />}
    </button>
  );
}

function Question({ id, title, hint, children }) {
  return (
    <section aria-labelledby={id}>
      <h4 id={id} className="mb-0.5 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{title}</h4>
      {hint && <p className="mb-2 text-xs" style={{ color: 'var(--text-3)' }}>{hint}</p>}
      {children}
    </section>
  );
}

export default function PlanOnboardingModal({ plan, lang, onStart, onClose }) {
  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true);
  const saved = getPlanPrefs(plan.id);

  const [season, setSeason] = useState(saved.season || null);
  const [emphasis, setEmphasis] = useState(saved.emphasis?.length ? saved.emphasis : DEFAULT_EMPHASIS);
  const [role, setRole] = useState(saved.role || DEFAULT_ROLE);
  const [growth, setGrowth] = useState(saved.growth || []);
  const [growthOpen, setGrowthOpen] = useState((saved.growth || []).length > 0);

  const toggle = (list, setList, id) => setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'planPrepOnboardingTitle')}
        className="editorial-dialog max-h-[85vh] w-full max-w-md overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5 pb-4" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'planPrepOnboardingTitle')}</h3>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'planPrepOnboardingSub')}</p>
          </div>
          <button onClick={onClose} aria-label={t(lang, 'close')} className="phase-icon-button shrink-0"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-5">
          <Question id="plan-prep-season" title={t(lang, 'planPrepSeasonQ')}>
            <div role="radiogroup" aria-labelledby="plan-prep-season" className="flex flex-col gap-2">
              {SEASONS.map((s) => (
                <OptionRow
                  key={s.id}
                  label={t(lang, s.labelKey)}
                  selected={season === s.id}
                  onSelect={() => setSeason(season === s.id ? null : s.id)}
                />
              ))}
            </div>
          </Question>

          <Question id="plan-prep-emphasis" title={t(lang, 'planPrepEmphasisQ')} hint={t(lang, 'planPrepEmphasisHint')}>
            <div role="group" aria-labelledby="plan-prep-emphasis" className="flex flex-col gap-2">
              {EMPHASES.map((e) => (
                <OptionRow
                  key={e.id}
                  label={t(lang, e.labelKey)}
                  selected={emphasis.includes(e.id)}
                  multi
                  onSelect={() => toggle(emphasis, setEmphasis, e.id)}
                />
              ))}
            </div>
          </Question>

          <Question id="plan-prep-role" title={t(lang, 'planPrepRoleQ')} hint={t(lang, 'planPrepRoleHint')}>
            <div role="radiogroup" aria-labelledby="plan-prep-role" className="flex flex-col gap-2">
              {ROLES.map((r) => (
                <OptionRow key={r.id} label={t(lang, r.labelKey)} selected={role === r.id} onSelect={() => setRole(r.id)} />
              ))}
            </div>
          </Question>

          {/* Growth areas matter more than the husband/wife choice, but they are
              the longest list — so they wait behind a disclosure and the plan
              starts fine without them. */}
          <section>
            <button
              type="button"
              onClick={() => setGrowthOpen((v) => !v)}
              aria-expanded={growthOpen}
              aria-controls="plan-prep-growth"
              className="flex min-h-11 w-full items-center justify-between gap-3 text-start"
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                {t(lang, 'planPrepGrowthQ')}{growth.length ? ` · ${growth.length}` : ''}
              </span>
              <ChevronDown size={16} aria-hidden="true" style={{ color: 'var(--text-3)', transform: growthOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
            </button>
            {growthOpen && (
              <div id="plan-prep-growth" role="group" aria-label={t(lang, 'planPrepGrowthQ')} className="mt-2 flex flex-wrap gap-2">
                {GROWTH_AREAS.map((g) => {
                  const selected = growth.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => toggle(growth, setGrowth, g.id)}
                      className="min-h-11 rounded-full px-3 text-xs font-medium"
                      style={selected
                        ? { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                        : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                    >
                      {t(lang, g.labelKey)}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 space-y-2 p-5 pt-0" style={{ background: 'var(--surface)' }}>
          <button
            onClick={() => onStart({ season, emphasis, role, growth })}
            className="w-full rounded-xl px-3 py-3 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {t(lang, 'planPrepOnboardingCta')}
          </button>
          <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'planPrepOnboardingPrivacy')}
          </p>
        </div>
      </div>
    </div>
  );
}
