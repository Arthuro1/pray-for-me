import { t } from '../i18n';
import { pick } from '../content/teaching/pick';

const heading = 'mb-1.5 text-[11px] font-semibold uppercase tracking-widest';
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
          <h4 className={heading} style={{ color: 'var(--text-3)' }}>{t(lang, 'studyQuestions')}</h4>
          <ol dir="auto" className="list-decimal space-y-2 ps-5">
            {questions.map((question, index) => (
              <li key={index} className={prose} style={{ color: 'var(--text-1)' }}>{question}</li>
            ))}
          </ol>
        </section>
      )}
      {tension && (
        <aside className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <h4 className={heading} style={{ color: 'var(--text-3)' }}>{t(lang, 'studyTension')}</h4>
          <p dir="auto" className={prose} style={{ color: 'var(--text-2)' }}>{tension}</p>
        </aside>
      )}
      {context && (
        <details className="rounded-xl px-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <summary className="min-h-11 cursor-pointer py-3 text-start text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t(lang, 'studyContext')}</summary>
          <p dir="auto" className={`${prose} pb-3`} style={{ color: 'var(--text-2)' }}>{context}</p>
        </details>
      )}
      {synthesis && (
        <section className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
          <h4 className={heading} style={{ color: 'var(--accent)' }}>{t(lang, 'studySynthesis')}</h4>
          <p dir="auto" className={prose} style={{ color: 'var(--text-1)' }}>{synthesis}</p>
          {onAddNote && (
            <button type="button" onClick={onAddNote} className="mt-2 min-h-11 rounded-lg px-3 text-sm font-semibold" style={{ color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
              {t(lang, 'studyAddNote')}
            </button>
          )}
        </section>
      )}
      {prayer && (
        <details className="rounded-xl px-3" style={{ border: '0.5px solid var(--input-border)' }}>
          <summary className="min-h-11 cursor-pointer py-3 text-start text-sm font-semibold" style={{ color: 'var(--text-3)' }}>{t(lang, 'studyPrayer')}</summary>
          <p dir="auto" className={`${prose} pb-3`} style={{ color: 'var(--text-2)' }}>{prayer}</p>
        </details>
      )}
    </div>
  );
}
