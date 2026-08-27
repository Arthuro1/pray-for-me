import { useState } from 'react';
import { X, Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { ROLES, GROWTH_AREAS, DEFAULT_ROLE, getPlanPrefs } from '../lib/planPrefs';
import { MARRIAGE_INCLUDES, MAX_PLAN_CHILDREN, isCouplePlan, sanitizePlanPersonalization } from '../lib/planPersonalization';

// Tailoring a plan that is ALREADY RUNNING.
//
// This used to be a gate: a sheet of questions between "Start" and the first
// day. It asked four things of a single reader, of which one — a season — was
// stored and never read by anything, and another only pre-ticked a checkbox
// three weeks later on the completion card. Nothing here blocks a start any
// more; the plan begins on Start, and this sheet is offered from the plan day,
// where a reader can see what the answers actually change.
//
// So every question left has to earn its place by changing what a day says:
//   role      which optional husband/wife reflection a day shows
//   growth    which approved resources rank first on "Go deeper"
//   partner   the name a couple plan's prompts are written around
//   mode      whether the shared activities appear at all
//   includes  the optional children / home / extended-family layers
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

// The husband / wife / general choice. One control, but NOT one wording: a
// single reader is "preparing to be" a husband or wife, and a married one
// already is one. Telling a married man he is preparing to be a husband would be
// simply untrue, so each audience keeps its own labels.
const COUPLE_ROLES = [
  { id: 'general', labelKey: 'planPrepRoleGeneral' },
  { id: 'husband', labelKey: 'planCoupleRoleHusband' },
  { id: 'wife', labelKey: 'planCoupleRoleWife' },
];

function RoleQuestion({ lang, role, onChange, questionKey, hintKey, options }) {
  return (
    <Question id="plan-role" title={t(lang, questionKey)} hint={t(lang, hintKey)}>
      <div role="radiogroup" aria-labelledby="plan-role" className="flex flex-col gap-2">
        {options.map((r) => (
          <OptionRow key={r.id} label={t(lang, r.labelKey)} selected={role === r.id} onSelect={() => onChange(r.id)} />
        ))}
      </div>
    </Question>
  );
}

function Footer({ lang, ctaKey, privacyKey, onSave }) {
  return (
    <div className="sticky bottom-0 space-y-2 p-5 pt-0" style={{ background: 'var(--surface)' }}>
      <button onClick={onSave} className="w-full rounded-xl px-3 py-3 text-sm font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
        {t(lang, ctaKey)}
      </button>
      <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, privacyKey)}</p>
    </div>
  );
}

function CoupleQuestions({ plan, lang, people, initial, onSave, ctaKey }) {
  const engaged = plan.lifeStage === 'engaged';
  // The optional layers exist only on the married plan: an engaged couple has no
  // children, home or extended family to add to a plan about preparing for a
  // covenant, so nothing is inherited that does not apply.
  const saved = initial ? sanitizePlanPersonalization(initial) : null;
  const [partner, setPartner] = useState(() => (saved?.partner?.prayerId
    ? (people || []).find((item) => item.prayerId === saved.partner.prayerId) || null
    : null));
  const [name, setName] = useState(saved?.partner?.name || '');
  const [mode, setMode] = useState(saved?.mode || 'private');
  const [role, setRole] = useState(saved?.role || DEFAULT_ROLE);
  const [includes, setIncludes] = useState(() => saved?.includes || []);
  const [children, setChildren] = useState(() => (saved?.children || []).map((child) => ({
    id: child.id || crypto.randomUUID(), name: child.name,
  })));
  const childEnabled = includes.includes('children');
  const atChildLimit = children.length >= MAX_PLAN_CHILDREN;

  const choosePerson = (value) => {
    const found = (people || []).find((item) => item.prayerId === value);
    setPartner(found || null);
    if (found) setName(found.name);
  };
  const toggleInclude = (id) => setIncludes((current) => (current.includes(id)
    ? current.filter((item) => item !== id) : [...current, id]));
  const addChild = () => setChildren((current) => (current.length >= MAX_PLAN_CHILDREN ? current : [
    ...current, { id: crypto.randomUUID(), name: '' },
  ]));
  const save = () => onSave(sanitizePlanPersonalization({
    partner: name.trim() ? { id: partner?.id, prayerId: partner?.prayerId, name } : null,
    mode, role, includes, children,
  }));

  return (
    <>
      <div className="space-y-5 p-5">
        <Question id="plan-couple-person" title={t(lang, engaged ? 'planCoupleFianceQ' : 'planCoupleSpouseQ')}>
          {(people || []).length > 0 && (
            <label className="mb-2 block text-xs" style={{ color: 'var(--text-3)' }}>
              <span className="mb-1 block">{t(lang, 'planCoupleChoosePerson')}</span>
              <select
                value={partner?.prayerId || ''}
                onChange={(event) => choosePerson(event.target.value)}
                className="min-h-11 w-full rounded-xl px-3 text-sm"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
              >
                <option value="">{t(lang, 'planCoupleNoPerson')}</option>
                {(people || []).map((item) => <option key={item.prayerId} value={item.prayerId}>{item.name}</option>)}
              </select>
            </label>
          )}
          <input
            aria-label={t(lang, 'planCoupleDisplayName')}
            value={name}
            maxLength={80}
            autoComplete="off"
            onChange={(event) => { setName(event.target.value); setPartner(null); }}
            placeholder={t(lang, 'planCoupleDisplayName')}
            className="min-h-11 w-full rounded-xl px-3 text-sm"
            style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
          />
        </Question>

        <Question id="plan-couple-mode" title={t(lang, 'planCoupleModeQ')} hint={t(lang, 'planCoupleTogetherHint')}>
          <div role="radiogroup" aria-labelledby="plan-couple-mode" className="flex flex-col gap-2">
            <OptionRow label={t(lang, 'planCoupleModePrivate')} selected={mode === 'private'} onSelect={() => setMode('private')} />
            <OptionRow label={t(lang, 'planCoupleModeTogether')} selected={mode === 'together'} onSelect={() => setMode('together')} />
          </div>
        </Question>

        {!engaged && (
          <Question id="plan-couple-includes" title={t(lang, 'planCoupleIncludeQ')} hint={t(lang, 'planCoupleIncludeHint')}>
            <div role="group" aria-labelledby="plan-couple-includes" className="flex flex-col gap-2">
              {MARRIAGE_INCLUDES.map((item) => (
                <OptionRow key={item.id} label={t(lang, item.labelKey)} selected={includes.includes(item.id)} multi onSelect={() => toggleInclude(item.id)} />
              ))}
            </div>
          </Question>
        )}

        {!engaged && childEnabled && (
          <Question id="plan-couple-children" title={t(lang, 'planCoupleIncludeChildren')}>
            <div className="space-y-2">
              {children.map((child, index) => (
                <div key={child.id} className="flex items-center gap-2">
                  <input
                    aria-label={t(lang, 'planCoupleChildName')}
                    value={child.name}
                    maxLength={80}
                    autoComplete="off"
                    onChange={(event) => setChildren((current) => current.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))}
                    placeholder={t(lang, 'planCoupleChildName')}
                    className="min-h-11 min-w-0 flex-1 rounded-xl px-3 text-sm"
                    style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setChildren((current) => current.filter((_, i) => i !== index))}
                    aria-label={t(lang, 'planCoupleRemoveChild', { name: child.name || String(index + 1) })}
                    className="phase-icon-button shrink-0"
                  ><Trash2 size={16} /></button>
                </div>
              ))}
              {/* At the cap the action goes away rather than accepting a name
                  that sanitizePlanPersonalization would silently drop. */}
              {!atChildLimit && (
                <button type="button" onClick={addChild} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                  <Plus size={15} aria-hidden="true" /> {t(lang, 'planCoupleAddChild')}
                </button>
              )}
            </div>
          </Question>
        )}

        <RoleQuestion
          lang={lang}
          role={role}
          onChange={setRole}
          questionKey="planCoupleRoleQ"
          hintKey="planCoupleRoleReviewPending"
          options={COUPLE_ROLES}
        />
      </div>

      <Footer lang={lang} ctaKey={ctaKey} privacyKey="planCouplePrivacy" onSave={save} />
    </>
  );
}

function SinglesQuestions({ plan, lang, onSave, ctaKey }) {
  const saved = getPlanPrefs(plan.id);
  const [role, setRole] = useState(saved.role || DEFAULT_ROLE);
  const [growth, setGrowth] = useState(saved.growth || []);
  const [growthOpen, setGrowthOpen] = useState((saved.growth || []).length > 0);

  const toggleGrowth = (id) => setGrowth((current) => (current.includes(id)
    ? current.filter((x) => x !== id) : [...current, id]));

  return (
    <>
      <div className="space-y-5 p-5">
        <RoleQuestion
          lang={lang}
          role={role}
          onChange={setRole}
          questionKey="planPrepRoleQ"
          hintKey="planPrepRoleHint"
          options={ROLES}
        />

        {/* Growth areas are the longest list and only rank the "Go deeper"
            shelf, so they wait behind a disclosure. */}
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
                    onClick={() => toggleGrowth(g.id)}
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

      <Footer lang={lang} ctaKey={ctaKey} privacyKey="planPrepOnboardingPrivacy" onSave={() => onSave({ role, growth })} />
    </>
  );
}

// `initial` carries a couple run's already-saved answers so the sheet opens
// pre-filled — a reader corrects a name or adds a child without deleting the
// prayer and losing its history, which used to be the only way. The singles
// answers live on the device and are read here directly.
export default function PlanPersonalizeModal({ plan, lang, onSave, onClose, people = [], initial = null, ctaKey = 'save' }) {
  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true);
  const couple = isCouplePlan(plan);

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'planPersonalizeTitle')}
        className="editorial-dialog max-h-[85vh] w-full max-w-md overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5 pb-4" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <h3 className="min-w-0 flex-1 text-base font-semibold" style={{ color: 'var(--text-1)' }}>
            {t(lang, 'planPersonalizeTitle')}
          </h3>
          <button onClick={onClose} aria-label={t(lang, 'close')} className="phase-icon-button shrink-0"><X size={18} /></button>
        </div>

        {couple
          ? <CoupleQuestions plan={plan} lang={lang} people={people} initial={initial} ctaKey={ctaKey} onSave={onSave} />
          : <SinglesQuestions plan={plan} lang={lang} ctaKey={ctaKey} onSave={onSave} />}
      </div>
    </div>
  );
}
