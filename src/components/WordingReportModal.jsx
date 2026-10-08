import { useEffect, useId, useMemo, useState } from 'react';
import { Flag, Loader2, Search, X } from 'lucide-react';
import { t, dirFor } from '../i18n';
import { loadCatalogue } from '../content-quality/catalogue';
import { buildWordingPayload, submitWordingReport, WORDING_ISSUES } from '../lib/wordingReports';
import { Modal, PrimaryButton, QuietButton, SecondaryButton } from './shared/Primitives';
import RiseMark from './shared/RiseMark';

// How many matches the list shows at once — enough to scan, few enough to stay
// a list rather than a page. Typing narrows it.
const MAX_MATCHES = 80;

// Report a published wording: find the text by typing a few of its words, tap
// it, say what is wrong and, optionally, how it should read. Only that text and
// the correction are sent (buildWordingPayload is an explicit allowlist).
export default function WordingReportModal({ lang, initialSurface = 'ui', onClose }) {
  const heading = useId();
  const ids = useId();
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [surface, setSurface] = useState(initialSurface);
  const [selected, setSelected] = useState('');
  const [issue, setIssue] = useState('unnatural');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false); setSelected(''); setEntries([]);
    loadCatalogue(lang).then((items) => {
      if (!active) return;
      const published = items.filter((e) => e.published !== false && e.text && e.text.length <= 20000);
      setEntries(published);
      // A screen with no published wording in this language falls back to the app text.
      setSurface((current) => (published.some((e) => e.surface === current) ? current : 'ui'));
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [lang, retry]);
  const surfaces = useMemo(() => [...new Set(entries.map((e) => e.surface))], [entries]);
  const matches = useMemo(() => entries.filter((e) => e.surface === surface && `${e.text} ${e.key}`.toLocaleLowerCase(lang).includes(query.toLocaleLowerCase(lang))).slice(0, MAX_MATCHES), [entries, surface, query, lang]);
  const chosen = entries.find((e) => e.id === selected);
  const surfaceLabel = (value) => (value === 'ui' ? t(lang, 'wordingApp') : value === 'landing' ? t(lang, 'wordingLanding') : entries.find((e) => e.surface === value)?.surfaceLabel || value);

  async function submit(event) {
    event.preventDefault();
    if (sending || !chosen) return;
    setSending(true); setError(false);
    try {
      await submitWordingReport(buildWordingPayload(entries, selected, lang, issue, suggestion));
      setDone(true);
    } catch { setError(true); } finally { setSending(false); }
  }

  const ready = !loading && entries.length > 0;

  return (
    <Modal labelledBy={heading} onClose={onClose} size="lg" className="wording-dialog">
      <div dir={dirFor(lang)}>
        <div className="q-dialog__header">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile tone-indigo" aria-hidden="true"><Flag size={18} strokeWidth={1.85} /></span>
            <h2 id={heading} className="q-dialog__title">{t(lang, 'wordingReport')}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {done ? (
          <div className="dialog-done" role="status">
            <RiseMark motion="still" size={36} />
            <p className="q-dialog__text mt-0">{t(lang, 'feedbackThanks')}</p>
            <SecondaryButton onClick={onClose} className="mt-4">{t(lang, 'close')}</SecondaryButton>
          </div>
        ) : (
          <form onSubmit={submit} className="wording-form">
            <p className="wording-form__privacy">{t(lang, 'wordingPrivacy')}</p>

            {loading && (
              <p role="status" className="q-loading items-center gap-2">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {t(lang, 'wordingLoading')}
              </p>
            )}

            {ready && (
              <>
                {surfaces.length > 1 && (
                  <div className="q-field">
                    <label htmlFor={`${ids}-surface`} className="q-field__label">{t(lang, 'wordingScreen')}</label>
                    <select id={`${ids}-surface`} className="q-input q-select" value={surface} onChange={(e) => { setSurface(e.target.value); setSelected(''); }}>
                      {surfaces.map((value) => <option key={value} value={value}>{surfaceLabel(value)}</option>)}
                    </select>
                  </div>
                )}

                {/* The text itself: once chosen it stands alone, with a way back
                    to the list; until then, a search over a short list. */}
                {chosen ? (
                  <div className="q-field">
                    <span className="q-field__label">{t(lang, 'wordingChoose')}</span>
                    <div className="wording-pick__chosen">
                      <blockquote>{chosen.text}</blockquote>
                      <QuietButton onClick={() => setSelected('')} className="-me-2 shrink-0">{t(lang, 'schedChange')}</QuietButton>
                    </div>
                  </div>
                ) : (
                  <fieldset className="q-field wording-pick">
                    <legend className="q-field__label">{t(lang, 'wordingChoose')}</legend>
                    <div className="q-input-wrap">
                      <Search size={16} className="q-input-wrap__icon" aria-hidden="true" />
                      <input
                        type="search"
                        className="q-input q-input--with-icon"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t(lang, 'wordingSearch')}
                        aria-label={t(lang, 'wordingSearch')}
                        maxLength={200}
                      />
                    </div>
                    {matches.length === 0 ? (
                      <p role="status" className="q-meta">{t(lang, 'wordingEmpty')}</p>
                    ) : (
                      <ul className="wording-pick__list">
                        {matches.map((e) => (
                          <li key={e.id}>
                            <label className="wording-pick__row">
                              <input type="radio" name={`${ids}-text`} value={e.id} checked={selected === e.id} onChange={() => setSelected(e.id)} className="sr-only" />
                              <span>{e.text}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </fieldset>
                )}

                <div className="q-field">
                  <span id={`${ids}-issue`} className="q-field__label">{t(lang, 'wordingIssue')}</span>
                  <div role="radiogroup" aria-labelledby={`${ids}-issue`} className="q-chips">
                    {WORDING_ISSUES.map((value) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={issue === value}
                        onClick={() => setIssue(value)}
                        className="q-chip pressable"
                      >
                        {t(lang, `wordingIssue_${value}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="q-field">
                  <label htmlFor={`${ids}-suggestion`} className="q-field__label">{t(lang, 'wordingSuggestion')}</label>
                  <textarea id={`${ids}-suggestion`} className="q-textarea wording-form__suggestion" rows={3} value={suggestion} maxLength={2000} onChange={(e) => setSuggestion(e.target.value)} />
                </div>
              </>
            )}

            {(ready || error) && (
              <div className="wording-form__footer">
                {error && (
                  <div role="alert" className="q-notice q-notice--error wording-form__error">
                    <span>{t(lang, 'feedbackError')}</span>
                    {entries.length === 0 && (
                      <QuietButton onClick={() => setRetry((value) => value + 1)}>{t(lang, 'wordingRetry')}</QuietButton>
                    )}
                  </div>
                )}
                {ready && (
                  <PrimaryButton type="submit" disabled={sending || !chosen} aria-busy={sending} className="w-full">
                    {sending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                    {t(lang, 'feedbackSubmit')}
                  </PrimaryButton>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
}
