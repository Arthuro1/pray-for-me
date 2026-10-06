import { useState } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { CircleOption, Disclosure, Input, PrimaryButton, QuietButton } from './shared/Primitives';
import { ROLES, GROWTH_AREAS, DEFAULT_ROLE, getPlanPrefs } from '../lib/planPrefs';
import { MARRIAGE_INCLUDES, MAX_PLAN_CHILDREN, isCouplePlan, sanitizePlanPersonalization } from '../lib/planPersonalization';

// One compact tailoring sheet with two contexts: the singles plan opens it
// before day one because role wording and resource ranking matter immediately;
// engaged and married plans start without a gate and offer it from the plan day.
// The old singles sheet also asked for a season that nothing read and an
// emphasis that only pre-ticked completion choices weeks later. Those questions
// stay out so the pre-start step remains short and consequential.
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

// One answer, drawn as the shared choice row. Radio semantics for the
// single-choice questions, checkbox semantics for the multi-choice ones, so a
// screen reader announces "one of four" versus "selected".
function OptionRow({ label, selected, multi, onSelect }) {
  return (
    <CircleOption
      title={label}
      selected={selected}
      onSelect={onSelect}
      className="circle-option--compact"
      {...(multi ? { role: 'checkbox' } : {})}
    />
  );
}

function Question({ id, title, hint, children }) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="plan-tailor__title">{title}</h3>
      {hint && <p className="q-field__hint plan-tailor__hint">{hint}</p>}
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
      <div role="radiogroup" aria-labelledby="plan-role" className="plan-tailor__choices">
        {options.map((r) => (
          <OptionRow key={r.id} label={t(lang, r.labelKey)} selected={role === r.id} onSelect={() => onChange(r.id)} />
        ))}
      </div>
    </Question>
  );
}

function Footer({ lang, ctaKey, privacyKey, onSave }) {
  return (
    <div className="plan-detail__footer shrink-0">
      <PrimaryButton onClick={onSave} className="w-full">{t(lang, ctaKey)}</PrimaryButton>
      {privacyKey && <p className="q-meta mt-3 text-center">{t(lang, privacyKey)}</p>}
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
  const [familyOpen, setFamilyOpen] = useState(() => !!saved?.includes?.length);
  const [roleOpen, setRoleOpen] = useState(() => !!saved?.role && saved.role !== DEFAULT_ROLE);
  const [children, setChildren] = useState(() => (saved?.children || []).map((child) => ({
    id: child.id || crypto.randomUUID(), name: child.name,
  })));
  const childEnabled = includes.includes('children');
  const atChildLimit = children.length >= MAX_PLAN_CHILDREN;

  const changeName = (value) => {
    const normalized = value.trim().toLocaleLowerCase();
    const found = (people || []).find((item) => item.name.trim().toLocaleLowerCase() === normalized);
    setPartner(found || null);
    setName(value);
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
      <div className="plan-detail__body plan-tailor min-h-0 flex-1 overflow-y-auto">
        <Question id="plan-couple-person" title={t(lang, engaged ? 'planCoupleFianceQ' : 'planCoupleSpouseQ')}>
          <Input
            aria-label={t(lang, 'planCoupleDisplayName')}
            list={(people || []).length > 0 ? `plan-couple-people-${plan.id}` : undefined}
            value={name}
            maxLength={80}
            autoComplete="off"
            onChange={(event) => changeName(event.target.value)}
            placeholder={t(lang, 'planCoupleDisplayName')}
          />
          {(people || []).length > 0 && (
            <datalist id={`plan-couple-people-${plan.id}`}>
              {(people || []).map((item) => <option key={item.prayerId} value={item.name} />)}
            </datalist>
          )}
          <p className="q-field__hint mt-2">{t(lang, 'planCouplePrivacy')}</p>
        </Question>

        <Question id="plan-couple-mode" title={t(lang, 'planCoupleModeQ')} hint={t(lang, 'planCoupleTogetherHint')}>
          <div role="radiogroup" aria-labelledby="plan-couple-mode" className="plan-tailor__choices">
            <OptionRow label={t(lang, 'planCoupleModePrivate')} selected={mode === 'private'} onSelect={() => setMode('private')} />
            <OptionRow label={t(lang, 'planCoupleModeTogether')} selected={mode === 'together'} onSelect={() => setMode('together')} />
          </div>
        </Question>

        {!engaged && (
          <Disclosure
            id="plan-couple-family-options"
            label={t(lang, 'planCoupleIncludeQ')}
            count={includes.length || undefined}
            open={familyOpen}
            onToggle={() => setFamilyOpen((open) => !open)}
            className="plan-tailor__fold"
          >
            <div className="plan-tailor__fold-body">
              <p className="q-field__hint">{t(lang, 'planCoupleIncludeHint')}</p>
              <div role="group" aria-label={t(lang, 'planCoupleIncludeQ')} className="plan-tailor__choices">
                {MARRIAGE_INCLUDES.map((item) => (
                  <OptionRow key={item.id} label={t(lang, item.labelKey)} selected={includes.includes(item.id)} multi onSelect={() => toggleInclude(item.id)} />
                ))}
              </div>

              {childEnabled && (
                <Question id="plan-couple-children" title={t(lang, 'planCoupleIncludeChildren')}>
                  <div className="grid gap-2">
                    {children.map((child, index) => (
                      <div key={child.id} className="plan-tailor__child">
                        <Input
                          aria-label={t(lang, 'planCoupleChildName')}
                          value={child.name}
                          maxLength={80}
                          autoComplete="off"
                          onChange={(event) => setChildren((current) => current.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))}
                          placeholder={t(lang, 'planCoupleChildName')}
                          className="min-w-0 flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setChildren((current) => current.filter((_, i) => i !== index))}
                          aria-label={t(lang, 'planCoupleRemoveChild', { name: child.name || String(index + 1) })}
                          className="icon-button pressable shrink-0"
                        ><Trash2 size={16} aria-hidden="true" /></button>
                      </div>
                    ))}
                    {!atChildLimit && (
                      <QuietButton icon={Plus} iconSize={16} onClick={addChild} className="-ms-3 justify-self-start">
                        {t(lang, 'planCoupleAddChild')}
                      </QuietButton>
                    )}
                  </div>
                </Question>
              )}
            </div>
          </Disclosure>
        )}

        <Disclosure
          id="plan-couple-role-options"
          label={t(lang, 'planCoupleRoleQ')}
          count={role !== DEFAULT_ROLE ? 1 : undefined}
          open={roleOpen}
          onToggle={() => setRoleOpen((open) => !open)}
          className="plan-tailor__fold"
        >
          <div className="plan-tailor__fold-body">
            <p className="q-field__hint">{t(lang, 'planCoupleRoleReviewPending')}</p>
            <div role="radiogroup" aria-label={t(lang, 'planCoupleRoleQ')} className="plan-tailor__choices">
              {COUPLE_ROLES.map((item) => (
                <OptionRow key={item.id} label={t(lang, item.labelKey)} selected={role === item.id} onSelect={() => setRole(item.id)} />
              ))}
            </div>
          </div>
        </Disclosure>
      </div>

      <Footer lang={lang} ctaKey={ctaKey} onSave={save} />
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
      <div className="plan-detail__body plan-tailor min-h-0 flex-1 overflow-y-auto">
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
        <Disclosure
          id="plan-prep-growth"
          label={t(lang, 'planPrepGrowthQ')}
          count={growth.length || undefined}
          open={growthOpen}
          onToggle={() => setGrowthOpen((v) => !v)}
          className="plan-tailor__fold"
        >
          <div className="plan-tailor__fold-body">
            <div role="group" aria-label={t(lang, 'planPrepGrowthQ')} className="q-chips">
              {GROWTH_AREAS.map((g) => {
                const selected = growth.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => toggleGrowth(g.id)}
                    className="q-chip pressable"
                  >
                    {selected && <Check size={14} aria-hidden="true" />}
                    {t(lang, g.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </Disclosure>
      </div>

      <Footer lang={lang} ctaKey={ctaKey} privacyKey="planPrepOnboardingPrivacy" onSave={() => onSave({ role, growth })} />
    </>
  );
}

// `initial` carries a couple run's already-saved answers so the sheet opens
// pre-filled — a reader corrects a name or adds a child without deleting the
// prayer and losing its history, which used to be the only way. The singles
// answers live on the device and are read here directly.
export default function PlanPersonalizeModal({ plan, lang, onSave, onClose, people = [], initial = null, ctaKey = 'save', mode = 'edit' }) {
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
        className="q-dialog flex max-h-[88vh] min-h-0 w-full max-w-md flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="plan-detail__header shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="q-dialog__title">{t(lang, 'planPersonalizeTitle')}</h2>
            <p className="q-meta mt-1">
              {t(lang, plan.titleKey)}{mode === 'start' ? ` · ${t(lang, 'planDays', { n: plan.count })}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0"><X size={18} aria-hidden="true" /></button>
        </div>

        {couple
          ? <CoupleQuestions plan={plan} lang={lang} people={people} initial={initial} ctaKey={ctaKey} onSave={onSave} />
          : <SinglesQuestions plan={plan} lang={lang} ctaKey={ctaKey} onSave={onSave} />}
      </div>
    </div>
  );
}
