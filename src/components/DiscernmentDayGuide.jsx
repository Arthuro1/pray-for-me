import { t } from '../i18n';
import { pick } from '../content/teaching/pick';
import VersePill from './shared/VersePill';
import GoDeeper from './GoDeeper';

const heading = 'section-label mb-2';
const prose = 'text-sm leading-relaxed whitespace-pre-line break-words';

// Full manuscript sections on the existing prayer day. The journal uses the
// existing private-note action; no relationship answers are collected here.
export default function DiscernmentDayGuide({ day, lang, resources = [], resourceOffers = [], idPrefix, onAddNote }) {
  const content = day.discernment;
  const paragraphs = [
    ['reading', 'planDiscernmentReading', content.reading],
    ['reflection', 'planDiscernmentReflection', day.reflection],
    ['prayer', 'planDiscernmentPrayer', content.prayer],
    ['listening', 'planDiscernmentListening', content.listening],
  ];
  return (
    <div className="space-y-5" data-testid="discernment-day">
      {paragraphs.map(([key, label, value]) => (
        <section key={key}>
          <h4 className={heading}>{t(lang, label)}</h4>
          <p dir="auto" className={prose} style={{ color: key === 'prayer' ? 'var(--q-text)' : 'var(--q-text-secondary)' }}>{key === 'reading' ? pick(value, lang).replace(/^[,،，]\s*/, '') : pick(value, lang)}</p>
          {key === 'reading' && day.readingRefs?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {day.readingRefs.map((ref) => <VersePill key={ref} reference={ref} lang={lang} />)}
            </div>
          )}
        </section>
      ))}
      <section>
        <h4 className={heading}>{t(lang, 'planDiscernmentJournal')}</h4>
        {content.journalNote && <p dir="auto" className={`${prose} mb-2`} style={{ color: 'var(--q-text-secondary)' }}>{pick(content.journalNote, lang)}</p>}
        <ol className="list-decimal space-y-2 ps-5">
          {content.questions.map((question, index) => (
            <li key={index} dir="auto" className={prose} style={{ color: 'var(--q-text)' }}>{pick(question, lang)}</li>
          ))}
        </ol>
        {onAddNote && (
          <button type="button" onClick={onAddNote} className="secondary-button pressable mt-3">
            {t(lang, 'studyAddNote')}
          </button>
        )}
      </section>
      <section className="plan-day__aside plan-day__aside--royal">
        <h4 className={heading}>{t(lang, 'planPracticeToday')}</h4>
        <p dir="auto" className={prose} style={{ color: 'var(--q-text)' }}>{pick(day.practice, lang)}</p>
      </section>
      {content.review && (
        <details className="plan-day__fold">
          <summary className="plan-day__summary">{t(lang, 'planDiscernmentReview')}</summary>
          <p dir="auto" className={`${prose} pb-3`} style={{ color: 'var(--q-text-secondary)' }}>{pick(content.review, lang)}</p>
        </details>
      )}
      <details className="plan-day__fold">
        <summary className="plan-day__summary">{t(lang, 'planDiscernmentDeeper')}</summary>
        <div className="space-y-3 pb-3">
          <p dir="auto" className={prose} style={{ color: 'var(--q-text-secondary)' }}>{pick(content.deeper, lang)}</p>
          <div className="flex flex-wrap gap-1.5">
            {(day.related || []).map((ref) => <VersePill key={ref} reference={ref} lang={lang} />)}
          </div>
        </div>
      </details>
      <GoDeeper resources={resources} languageOffers={resourceOffers} lang={lang} id={`${idPrefix}-go-deeper`} />
    </div>
  );
}
