import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { t } from '../i18n';
import { pick } from '../content/teaching';
import VersePill from './shared/VersePill';
import GoDeeper from './GoDeeper';
import { ROLES } from '../lib/planPrefs';
import { hasReviewSignoff } from '../lib/planReview';
import DeliveranceDayGuide from './deliverance/DeliveranceDayGuide';

// Everything a rich plan day says BELOW its title and primary passage:
// reflection → prayer directions → an optional role reflection → one folded
// shelf for related Scripture, couple exercises, practice and resources.
//
// The order is the resource hierarchy the plan is built on: Scripture first
// (rendered by the host, immediately above this), then Pray4Me's reflection,
// then prayer, then an optional after-prayer shelf, and only then anything external. The
// three kinds of text stay visually distinct — Bible text only ever appears
// inside a VersePill's panel, reflections are prose, prompts are a list — so a
// prayer prompt is never mistaken for a quotation.
//
// Every section is optional, so the older plans (theme + verse only) render
// nothing here at all. Pure presentation: the host resolves the localized day,
// the reader's chosen role and any approved resources.
//
// `onChooseRole` is how the husband/wife question gets asked without a sheet in
// front of the plan: the host passes it only while the question is still open,
// and only a day that HAS such a reflection puts it on screen — so it is asked
// on the first day it would change something, and never again after an answer.
export default function PlanDayBody({
  day, lang, role = 'general', resources = [], idPrefix = 'plan-day', onChooseRole, onAddNote,
}) {
  const [afterPrayerOpen, setAfterPrayerOpen] = useState(false);
  if (!day) return null;

  const reflection = pick(day.reflection, lang);
  const prompts = (day.prompts || []).map((p) => pick(p, lang)).filter(Boolean);
  const selfPrompt = pick(day.selfPrompt, lang);
  const spousePrompt = pick(day.spousePrompt, lang);
  const marriagePrompt = pick(day.marriagePrompt, lang);
  const practice = pick(day.practice, lang);
  const conversationPrompt = pick(day.conversationPrompt, lang);
  const prayTogether = pick(day.prayTogether, lang);
  const safetyNote = pick(day.safetyNote, lang);
  const related = day.related || [];
  const isFreedomDay = !!day.freedom;
  // Role reflections are shown ONLY when the reader has explicitly asked for
  // them — never inferred from a name, a photo or anything else.
  const roleApproved = !day.roleReviewStatus || hasReviewSignoff(day.roleReviewStatus);
  const roleReflection = roleApproved && role && role !== 'general' ? day.roles?.[role] : null;
  const roleText = pick(roleReflection, lang);
  const rolePending = !roleApproved && role !== 'general' && !!day.roles?.[role];
  // Asked only where an answer has somewhere to land: this day carries the
  // reflections, they have cleared review, and no answer has been given yet.
  const askRole = !!onChooseRole && roleApproved && !!day.roles && !roleText;
  const hasAfterPrayer = related.length > 0 || !!conversationPrompt || !!practice || !!prayTogether;

  if (!isFreedomDay && !askRole && !reflection && !prompts.length && !selfPrompt && !spousePrompt && !marriagePrompt
    && !day.childPrayers?.length && !conversationPrompt && !prayTogether && !safetyNote
    && !practice && !related.length && !roleText && !rolePending && !resources.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {reflection && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{reflection}</p>
      )}

      {/* A deliverance day replaces the plain prompt list with its own guidance:
          what the category means, the Holy Spirit invitation, what the reader
          actually knows, and the three ways to pray. The prompts become the
          "Prayer points" path inside it rather than a fourth thing on screen. */}
      {isFreedomDay && (
        <DeliveranceDayGuide
          day={day}
          lang={lang}
          prompts={prompts}
          idPrefix={idPrefix}
          onAddNote={onAddNote}
        />
      )}

      {!isFreedomDay && prompts.length > 0 && (
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

      {spousePrompt && (
        <section>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {day.partnerName
              ? t(lang, 'planPrayForNamedPerson', { name: `\u2068${day.partnerName}\u2069` })
              : t(lang, 'planPrayForSpouse')}
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{spousePrompt}</p>
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

      {marriagePrompt && (
        <section className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'planPrayForMarriage')}
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{marriagePrompt}</p>
        </section>
      )}

      {(day.childPrayers || []).map((child) => (
        <section key={child.id}>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'planPrayForChild', { name: `\u2068${child.name}\u2069` })}
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{pick(child.prompt, lang)}</p>
        </section>
      ))}

      {askRole && (
        <section className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <h4 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'planPrepRoleQ')}</h4>
          <div role="radiogroup" aria-label={t(lang, 'planPrepRoleQ')} className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={false}
                onClick={() => onChooseRole(r.id)}
                className="pressable min-h-11 rounded-full px-3 text-xs font-medium"
                style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
              >
                {t(lang, r.labelKey)}
              </button>
            ))}
          </div>
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

      {safetyNote && (
        <aside className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'planCoupleSafetyHeading')}
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{safetyNote}</p>
        </aside>
      )}

      {rolePending && (
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'planCoupleRoleReviewPending')}</p>
      )}

      {/* Keep the prayer itself short. Related reading and couple exercises are
          available after prayer without competing with the primary directions. */}
      {hasAfterPrayer && (
        <section className="rounded-xl px-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <button
            type="button"
            onClick={() => setAfterPrayerOpen((v) => !v)}
            aria-expanded={afterPrayerOpen}
            aria-controls={`${idPrefix}-after-prayer`}
            className="flex min-h-11 w-full items-center justify-between gap-3 text-start"
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t(lang, 'planAfterPrayer')}</span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              style={{
                color: 'var(--text-3)',
                transform: afterPrayerOpen ? 'rotate(180deg)' : undefined,
                transition: 'transform 0.15s',
              }}
            />
          </button>

          {afterPrayerOpen && (
            <div id={`${idPrefix}-after-prayer`} className="space-y-4 pb-3">
              {related.length > 0 && (
                <section>
                  <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                    {t(lang, 'planRelatedScripture')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {related.map((ref) => <VersePill key={ref} reference={ref} lang={lang} tone="quiet" />)}
                  </div>
                </section>
              )}

              {conversationPrompt && (
                <section>
                  <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                    {t(lang, 'planTalkTogether')}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{conversationPrompt}</p>
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

              {prayTogether && (
                <section className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                  <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                    {t(lang, 'planPrayTogether')}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{prayTogether}</p>
                </section>
              )}

            </div>
          )}
        </section>
      )}

      {/* External reading stays last, but it gets its own single disclosure.
          Hiding it inside "After prayer" made a relevant book take two taps to
          discover and concealed the size of the shelf. */}
      {resources.length > 0 && (
        <div className="rounded-xl px-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <GoDeeper resources={resources} lang={lang} id={`${idPrefix}-go-deeper`} />
        </div>
      )}
    </div>
  );
}
