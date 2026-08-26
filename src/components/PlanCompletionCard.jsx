import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sprout } from 'lucide-react';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import { getPlanPrefs } from '../lib/planPrefs';

// What a rich plan says once its last day is behind the reader.
//
// Calm, and honest: it names what they did — sought God, worked on their own
// heart, prayed about a marriage that may or may not come — and it does NOT say
// that they are now ready or that anything has been earned. The one forward
// action is optional: carry some of the themes on as ordinary recurring prayers.
//
// The themes pre-ticked are the ones the reader asked to emphasize at the start,
// which is the whole use of that answer — it never changed a single day.
export default function PlanCompletionCard({ plan, lang, onContinue, onRelationshipNext }) {
  const prefs = getPlanPrefs(plan.id);
  const themes = plan.continueThemes || [];
  const [selected, setSelected] = useState(() => {
    const emphasized = themes.filter((th) => prefs.emphasis?.includes(th.emphasis)).map((th) => th.id);
    return emphasized.length ? emphasized : themes.map((th) => th.id);
  });
  const [done, setDone] = useState(false);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const chosen = themes.filter((th) => selected.includes(th.id));
  const relationshipActionKey = plan.lifeStage === 'engaged'
    ? 'planCoupleContinueMarriage'
    : (plan.lifeStage === 'married' && plan.renewable ? 'planCoupleRepeat' : null);

  return (
    <section className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
        <Sprout size={13} aria-hidden="true" /> {t(lang, 'planCompleteHeading', { n: plan.count })}
      </p>
      <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{pick(plan.completion, lang)}</p>

      {/* Router navigation, not a bare href: a plain link reloads the whole
          document, which in the installed PWA re-runs the splash and refetch —
          at the moment someone has just finished thirty days. */}
      {relationshipActionKey && (
        <Link
          to="/plan"
          onClick={onRelationshipNext}
          className="mb-3 block w-full rounded-xl px-3 py-2.5 text-center text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {t(lang, relationshipActionKey)}
        </Link>
      )}

      {themes.length > 0 && !done && (
        <>
          <h4 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'planContinueHeading')}</h4>
          <div role="group" aria-label={t(lang, 'planContinueHeading')} className="mb-3 flex flex-col gap-2">
            {themes.map((th) => {
              const on = selected.includes(th.id);
              return (
                <button
                  key={th.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(th.id)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start text-sm"
                  style={on
                    ? { background: 'var(--accent-soft)', color: 'var(--text-1)', border: '1px solid var(--accent-border)' }
                    : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  <span className="min-w-0">{t(lang, th.titleKey)}</span>
                  {on && <Check size={15} className="shrink-0" aria-hidden="true" style={{ color: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>
          <button
            onClick={async () => { await onContinue(chosen); setDone(true); }}
            disabled={chosen.length === 0}
            className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {t(lang, 'planContinueCta')}
          </button>
        </>
      )}

      {done && (
        <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>{t(lang, 'planContinueAdded')}</p>
      )}
    </section>
  );
}
