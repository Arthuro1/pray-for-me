import { useState } from 'react';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import VersePill from './shared/VersePill';
import GoDeeper from './GoDeeper';

// Everything a rich plan day says BELOW its title and primary passage:
// reflection → related Scripture → prayer prompts → the self-prompt → an
// optional role reflection → today's practice → "Go deeper".
//
// The order is the resource hierarchy the plan is built on: Scripture first
// (rendered by the host, immediately above this), then Pray4Me's reflection,
// then prayer, then an optional practice, and only then anything external. The
// three kinds of text stay visually distinct — Bible text only ever appears
// inside a VersePill's panel, reflections are prose, prompts are a list — so a
// prayer prompt is never mistaken for a quotation.
//
// Every section is optional, so the older plans (theme + verse only) render
// nothing here at all. Pure presentation: the host resolves the localized day,
// the reader's chosen role and any approved resources.
export default function PlanDayBody({ day, lang, role = 'general', resources = [], idPrefix = 'plan-day' }) {
  const [relatedOpen, setRelatedOpen] = useState(false);
  if (!day) return null;

  const reflection = pick(day.reflection, lang);
  const prompts = (day.prompts || []).map((p) => pick(p, lang)).filter(Boolean);
  const selfPrompt = pick(day.selfPrompt, lang);
  const practice = pick(day.practice, lang);
  const related = day.related || [];
  // Role reflections are shown ONLY when the reader explicitly asked for them in
  // onboarding — never inferred from a name, a photo or anything else.
  const roleReflection = role && role !== 'general' ? day.roles?.[role] : null;
  const roleText = pick(roleReflection, lang);

  if (!reflection && !prompts.length && !selfPrompt && !practice && !related.length && !roleText && !resources.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {reflection && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{reflection}</p>
      )}

      {/* Related passages stay quiet and folded away — the primary passage above
          must keep the reader's attention. */}
      {related.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setRelatedOpen((v) => !v)}
            aria-expanded={relatedOpen}
            aria-controls={`${idPrefix}-related`}
            className="min-h-11 text-xs font-medium"
            style={{ color: 'var(--text-3)' }}
          >
            {t(lang, 'planRelatedScripture')}
          </button>
          {relatedOpen && (
            <div id={`${idPrefix}-related`} className="mt-1 flex flex-wrap gap-1.5">
              {related.map((ref) => <VersePill key={ref} reference={ref} lang={lang} tone="quiet" />)}
            </div>
          )}
        </div>
      )}

      {prompts.length > 0 && (
        <section>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'planPrayerPrompts')}
          </h4>
          <ul className="space-y-1.5">
            {prompts.map((text, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>
                <span aria-hidden="true" style={{ color: 'var(--accent)' }}>•</span>
                <span className="min-w-0">{text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The mirror: every prayer for someone else is prayed back over the reader. */}
      {selfPrompt && (
        <section className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            {t(lang, 'planPrayForYourself')}
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{selfPrompt}</p>
        </section>
      )}

      {roleText && (
        <section className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {t(lang, role === 'husband' ? 'planPrepRoleHusbandHeading' : 'planPrepRoleWifeHeading')}
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{roleText}</p>
          {roleReflection?.ref && (
            <div className="mt-2"><VersePill reference={roleReflection.ref} lang={lang} tone="quiet" /></div>
          )}
        </section>
      )}

      {practice && (
        <section>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'planPracticeToday')}
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{practice}</p>
        </section>
      )}

      <GoDeeper resources={resources} lang={lang} id={`${idPrefix}-go-deeper`} />
    </div>
  );
}
