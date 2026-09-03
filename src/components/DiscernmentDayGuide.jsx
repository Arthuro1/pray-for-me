import { t } from '../i18n';
import { pick } from '../content/teaching/pick';
import VersePill from './shared/VersePill';
import GoDeeper from './GoDeeper';

const heading = 'mb-2 text-[11px] font-semibold uppercase tracking-widest';
const prose = 'text-sm leading-relaxed whitespace-pre-line break-words';

// Full manuscript sections on the existing prayer day. The journal uses the
// existing private-note action; no relationship answers are collected here.
export default function DiscernmentDayGuide({ day, lang, resources = [], idPrefix, onAddNote }) {
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
          <h4 className={heading} style={{ color: 'var(--text-3)' }}>{t(lang, label)}</h4>
          <p dir="auto" className={prose} style={{ color: key === 'prayer' ? 'var(--text-1)' : 'var(--text-2)' }}>{key === 'reading' ? pick(value, lang).replace(/^[,،，]\s*/, '') : pick(value, lang)}</p>
          {key === 'reading' && day.readingRefs?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {day.readingRefs.map((ref) => <VersePill key={ref} reference={ref} lang={lang} tone="quiet" />)}
            </div>
          )}
        </section>
      ))}
      <section>
        <h4 className={heading} style={{ color: 'var(--text-3)' }}>{t(lang, 'planDiscernmentJournal')}</h4>
        {content.journalNote && <p dir="auto" className={`${prose} mb-2`} style={{ color: 'var(--text-2)' }}>{pick(content.journalNote, lang)}</p>}
        <ol className="list-decimal space-y-2 ps-5">
          {content.questions.map((question, index) => (
            <li key={index} dir="auto" className={prose} style={{ color: 'var(--text-1)' }}>{pick(question, lang)}</li>
          ))}
        </ol>
        {onAddNote && (
          <button type="button" onClick={onAddNote} className="mt-3 min-h-11 rounded-lg px-3 text-sm font-semibold" style={{ color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
            {t(lang, 'studyAddNote')}
          </button>
        )}
      </section>
      <section className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
        <h4 className={heading} style={{ color: 'var(--accent)' }}>{t(lang, 'planPracticeToday')}</h4>
        <p dir="auto" className={prose} style={{ color: 'var(--text-1)' }}>{pick(day.practice, lang)}</p>
      </section>
      {content.review && (
        <details className="rounded-xl px-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <summary className="min-h-11 cursor-pointer py-3 text-start text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t(lang, 'planDiscernmentReview')}</summary>
          <p dir="auto" className={`${prose} pb-3`} style={{ color: 'var(--text-2)' }}>{pick(content.review, lang)}</p>
        </details>
      )}
      <details className="rounded-xl px-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
        <summary className="min-h-11 cursor-pointer py-3 text-start text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t(lang, 'planDiscernmentDeeper')}</summary>
        <div className="space-y-3 pb-3">
          <p dir="auto" className={prose} style={{ color: 'var(--text-2)' }}>{pick(content.deeper, lang)}</p>
          <div className="flex flex-wrap gap-1.5">
            {(day.related || []).map((ref) => <VersePill key={ref} reference={ref} lang={lang} tone="quiet" />)}
          </div>
        </div>
      </details>
      {resources.length > 0 && <GoDeeper resources={resources} lang={lang} id={`${idPrefix}-go-deeper`} />}
    </div>
  );
}
