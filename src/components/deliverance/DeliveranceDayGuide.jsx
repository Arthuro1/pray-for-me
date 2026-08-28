import { useState } from 'react';
import { ChevronDown, Sparkles, Utensils } from 'lucide-react';
import { t } from '../../i18n';
import { pick } from '../../content/teaching';
import VersePill from '../shared/VersePill';
import { PRAYER_MODULES } from '../../content/plans/freedom/prayerModules';
import { CERTAINTY_LEVELS, REMEMBRANCE_ANSWERS } from '../../content/plans/freedom/certainty';
import { buildGuidedSession } from '../../lib/freedomSession';
import GuidedPrayerSteps from './GuidedPrayerSteps';

// The deliverance layer of one plan day, in the order the day is meant to be
// walked: understand it → invite the Holy Spirit → say what you actually know →
// choose how you want to pray.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THIS COMPONENT MUST NEVER DO
// ─────────────────────────────────────────────────────────────────────────────
//   • claim that anything is present, true or proven about the reader
//   • interpret a note, a dream, a memory or a silence
//   • say that the Holy Spirit has revealed something through this app
//   • treat "nothing came to mind" as an incomplete answer
//   • persist, sync or report what the reader selects
//
// The certainty selection lives in this component's state and nowhere else. It
// is not written to storage, not attached to the prayer, not encrypted-and-kept,
// and not sent to analytics — leaving the day forgets it, which is the correct
// trade for the most sensitive thing this app could hold.
//
// Progressive disclosure is deliberate: the definition and examples start folded
// away, so a reader who already knows what the day means is not walked through a
// taxonomy before they can pray.
export default function DeliveranceDayGuide({ day, lang, prompts = [], idPrefix = 'freedom', onAddNote }) {
  const [understandOpen, setUnderstandOpen] = useState(false);
  const [remembrance, setRemembrance] = useState(null);
  const [certainty, setCertainty] = useState(null);
  const [mode, setMode] = useState(null);
  const [stepsOpen, setStepsOpen] = useState(false);

  const freedom = day?.freedom;
  if (!freedom) return null;

  const understand = pick(freedom.understand, lang);
  const examples = (freedom.examples || []).map((e) => pick(e, lang)).filter(Boolean);
  const invite = PRAYER_MODULES.inviteSpirit;
  const steps = buildGuidedSession(day, certainty);

  const chooseRemembrance = (id) => {
    setRemembrance(id);
    if (id === 'note') onAddNote?.();
  };

  const MODES = [
    { id: 'guided', labelKey: 'freedomModeGuided', descKey: 'freedomModeGuidedDesc' },
    { id: 'points', labelKey: 'freedomModePoints', descKey: 'freedomModePointsDesc' },
    { id: 'free', labelKey: 'freedomModeFree', descKey: 'freedomModeFreeDesc' },
  ];

  const chooseMode = (id) => {
    setMode(id);
    if (id === 'guided') setStepsOpen(true);
  };

  return (
    <div className="space-y-4">
      {stepsOpen && (
        <GuidedPrayerSteps
          steps={steps}
          lang={lang}
          dayTitle={pick(day.theme, lang)}
          onClose={() => setStepsOpen(false)}
          onFinish={() => setStepsOpen(false)}
        />
      )}

      {/* "What this can mean" + examples — folded away by default. */}
      {(understand || examples.length > 0) && (
        <section className="rounded-xl px-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <button
            type="button"
            onClick={() => setUnderstandOpen((v) => !v)}
            aria-expanded={understandOpen}
            aria-controls={`${idPrefix}-understand`}
            className="flex min-h-11 w-full items-center justify-between gap-3 text-start"
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t(lang, 'freedomWhatThisMeans')}</span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              style={{ color: 'var(--text-3)', transform: understandOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
            />
          </button>
          {understandOpen && (
            <div id={`${idPrefix}-understand`} className="space-y-3 pb-3">
              {understand && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{understand}</p>
              )}
              {examples.length > 0 && (
                <section>
                  {/* "Examples can include" — illustrative, never diagnostic. The
                      heading itself carries that, so no single line can be read
                      as a claim about the reader. */}
                  <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                    {t(lang, 'freedomExamplesHeading')}
                  </h4>
                  <ul className="space-y-1.5">
                    {examples.map((text, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        <span aria-hidden="true" style={{ color: 'var(--text-3)' }}>•</span>
                        <span className="min-w-0">{text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </section>
      )}

      {/* Invite the Holy Spirit — every day, before anything is examined. */}
      <section className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
        <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          <Sparkles size={12} aria-hidden="true" /> {t(lang, 'freedomStepInviteSpirit')}
        </h4>
        <p className="mb-2 text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{pick(invite.body, lang)}</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {invite.refs.map((ref) => <VersePill key={ref} reference={ref} lang={lang} tone="quiet" />)}
        </div>

        <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'freedomQuietSpace')}</p>
        <p className="mb-2 mt-1 text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t(lang, 'freedomRemembranceQuestion')}</p>
        <div role="group" aria-label={t(lang, 'freedomRemembranceQuestion')} className="flex flex-wrap gap-2">
          {REMEMBRANCE_ANSWERS.map((answer) => {
            const on = remembrance === answer.id;
            return (
              <button
                key={answer.id}
                type="button"
                onClick={() => chooseRemembrance(answer.id)}
                aria-pressed={on}
                className="pressable min-h-11 rounded-full px-3 text-xs font-medium"
                style={on
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--surface)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
              >
                {t(lang, answer.labelKey)}
              </button>
            );
          })}
        </div>
        {/* Nothing coming to mind is a complete answer, and the app says so out
            loud rather than leaving a reader to assume they failed. */}
        {(remembrance === 'nothing' || remembrance === 'unsure') && (
          <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'freedomNothingReassurance')}</p>
        )}
        {remembrance === 'note' && (
          <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'freedomNoteHint')}</p>
        )}
      </section>

      {/* What the reader actually knows — the ONE input that changes the prayer. */}
      {freedom.inventory && (
        <section>
          <h4 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'freedomCertaintyQuestion')}</h4>
          <div role="radiogroup" aria-label={t(lang, 'freedomCertaintyQuestion')} className="flex flex-col gap-1.5">
            {CERTAINTY_LEVELS.map((level) => {
              const on = certainty === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCertainty(level.id)}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-sm"
                  style={on
                    ? { background: 'var(--accent-soft)', color: 'var(--text-1)', border: '1px solid var(--accent-border)' }
                    : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-full"
                    style={{ border: `1.5px solid ${on ? 'var(--accent)' : 'var(--input-border)'}` }}
                  >
                    {on && <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />}
                  </span>
                  <span className="min-w-0">{t(lang, level.labelKey)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, 'freedomCertaintyPrivacy')}</p>
        </section>
      )}

      {/* How would you like to pray? "Guide me" is the recommended default for a
          reader who has never prayed a prayer like this. */}
      <section>
        <h4 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'freedomModeQuestion')}</h4>
        <div role="group" aria-label={t(lang, 'freedomModeQuestion')} className="flex flex-col gap-1.5">
          {MODES.map((m) => {
            const on = mode === m.id;
            const recommended = m.id === 'guided';
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => chooseMode(m.id)}
                aria-pressed={on}
                className="flex min-h-11 w-full flex-col items-start rounded-xl px-3 py-2 text-start"
                style={on || recommended
                  ? { background: 'var(--accent-soft)', border: `${on ? 1 : 0.5}px solid var(--accent-border)` }
                  : { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                  {t(lang, m.labelKey)}
                  {recommended && (
                    <span className="ms-1.5 text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                      {t(lang, 'freedomModeRecommended')}
                    </span>
                  )}
                </span>
                <span className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, m.descKey)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Prayer points: the day's own prompts, revealed only when asked for. */}
      {mode === 'points' && prompts.length > 0 && (
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

      {mode === 'free' && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'freedomModeFreeHint')}</p>
      )}

      {mode === 'guided' && !stepsOpen && (
        <button
          type="button"
          onClick={() => setStepsOpen(true)}
          className="pressable min-h-11 w-full rounded-xl px-3 text-sm font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          {t(lang, 'freedomResumeGuided')}
        </button>
      )}

      {/* Fasting is offered, never prescribed, and never tied to whether prayer
          "works". No duration, no food requirement, and an explicit alternative. */}
      {freedom.fasting && (
        <aside className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <h4 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            <Utensils size={12} aria-hidden="true" /> {t(lang, 'freedomFastHeading')}
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'freedomFastBody')}</p>
        </aside>
      )}
    </div>
  );
}
