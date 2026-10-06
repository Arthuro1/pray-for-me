import { t } from '../i18n';
import { pick } from '../content/teaching/pick';

const heading = 'section-label mb-2';
const prose = 'text-sm leading-relaxed break-words';

// Study is a distinct optional day layer, not prayer prompts with a new title.
// Native disclosures support keyboard/RTL and need no new persisted state.
export default function StudyDayGuide({ study, lang, onAddNote }) {
  if (!study) return null;
  const questions = (study.questions || []).map((q) => pick(q, lang)).filter(Boolean);
  const context = pick(study.context, lang);
  const tension = pick(study.tension, lang);
  const synthesis = pick(study.synthesis, lang);
  const prayer = pick(study.prayer, lang);

  return (
    <div className="space-y-4">
      {questions.length > 0 && (
        <section>
          <h4 className={heading}>{t(lang, 'studyQuestions')}</h4>
          <ol dir="auto" className="list-decimal space-y-2 ps-5">
            {questions.map((question, index) => (
              <li key={index} className={prose} style={{ color: 'var(--q-text)' }}>{question}</li>
            ))}
          </ol>
        </section>
      )}
      {tension && (
        <aside className="plan-day__aside">
          <h4 className={heading}>{t(lang, 'studyTension')}</h4>
          <p dir="auto" className={prose} style={{ color: 'var(--q-text-secondary)' }}>{tension}</p>
        </aside>
      )}
      {context && (
        <details className="plan-day__fold">
          <summary className="plan-day__summary">{t(lang, 'studyContext')}</summary>
          <p dir="auto" className={`${prose} pb-3`} style={{ color: 'var(--q-text-secondary)' }}>{context}</p>
        </details>
      )}
      {synthesis && (
        <section className="plan-day__aside plan-day__aside--royal">
          <h4 className={heading}>{t(lang, 'studySynthesis')}</h4>
          <p dir="auto" className={prose} style={{ color: 'var(--q-text)' }}>{synthesis}</p>
          {onAddNote && (
            <button type="button" onClick={onAddNote} className="secondary-button pressable mt-2">
              {t(lang, 'studyAddNote')}
            </button>
          )}
        </section>
      )}
      {prayer && (
        <details className="plan-day__fold">
          <summary className="plan-day__summary">{t(lang, 'studyPrayer')}</summary>
          <p dir="auto" className={`${prose} pb-3`} style={{ color: 'var(--q-text-secondary)' }}>{prayer}</p>
        </details>
      )}
    </div>
  );
}
