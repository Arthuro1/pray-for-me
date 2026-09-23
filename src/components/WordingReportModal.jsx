import { useEffect, useId, useMemo, useState } from 'react';
import { t, dirFor } from '../i18n';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { loadCatalogue } from '../content-quality/catalogue';
import { buildWordingPayload, submitWordingReport, WORDING_ISSUES } from '../lib/wordingReports';

export default function WordingReportModal({ lang, initialSurface = 'ui', onClose }) {
  const trapRef = useFocusTrap();
  useEscapeKey(onClose);
  const heading = useId();
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
  const matches = useMemo(() => entries.filter((e) => e.surface === surface && `${e.text} ${e.key}`.toLocaleLowerCase(lang).includes(query.toLocaleLowerCase(lang))).slice(0, 80), [entries, surface, query, lang]);
  const chosen = entries.find((e) => e.id === selected);
  async function submit(event) {
    event.preventDefault();
    if (sending || !chosen) return;
    setSending(true); setError(false);
    try {
      await submitWordingReport(buildWordingPayload(entries, selected, lang, issue, suggestion));
      setDone(true);
    } catch { setError(true); } finally { setSending(false); }
  }
  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <section ref={trapRef} role="dialog" aria-modal="true" aria-labelledby={heading} tabIndex={-1} dir={dirFor(lang)} className="editorial-dialog w-full max-w-xl max-h-[90dvh] overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between gap-4"><h2 id={heading} className="font-semibold">{t(lang, 'wordingReport')}</h2><button type="button" onClick={onClose}>{t(lang, 'close')}</button></div>
        {done ? <p role="status">{t(lang, 'feedbackThanks')}</p> : <>
          <p className="text-sm">{t(lang, 'wordingPrivacy')}</p>
          {loading ? <p role="status">{t(lang, 'wordingLoading')}</p> : entries.length > 0 ? <form onSubmit={submit} className="space-y-4">
            <label className="block">{t(lang, 'wordingScreen')}<select className="wording-control" value={surface} onChange={(e) => { setSurface(e.target.value); setSelected(''); }}>
              {surfaces.map((value) => <option key={value} value={value}>{value === 'ui' ? t(lang, 'wordingApp') : value === 'landing' ? t(lang, 'wordingLanding') : entries.find((e) => e.surface === value)?.surfaceLabel || value}</option>)}
            </select></label>
            <label className="block">{t(lang, 'wordingSearch')}<input className="wording-control" value={query} onChange={(e) => { setQuery(e.target.value); setSelected(''); }} maxLength={200} /></label>
            <label className="block">{t(lang, 'wordingChoose')}<select className="wording-control" required value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">{t(lang, 'wordingChoose')}</option>
              {matches.map((e) => <option key={e.id} value={e.id}>{e.text.slice(0, 100)} · {e.key}</option>)}
            </select></label>
            {matches.length === 0 && <p role="status">{t(lang, 'wordingEmpty')}</p>}
            {chosen && <blockquote className="rounded-xl p-3 whitespace-pre-wrap break-words" style={{ background: 'var(--input-bg)' }}>{chosen.text}</blockquote>}
            <label className="block">{t(lang, 'wordingIssue')}<select className="wording-control" value={issue} onChange={(e) => setIssue(e.target.value)}>{WORDING_ISSUES.map((value) => <option key={value} value={value}>{t(lang, `wordingIssue_${value}`)}</option>)}</select></label>
            <label className="block">{t(lang, 'wordingSuggestion')}<textarea className="wording-control" rows={3} value={suggestion} maxLength={2000} onChange={(e) => setSuggestion(e.target.value)} /></label>
            <button className="wording-action" disabled={sending || !chosen} type="submit">{t(lang, sending ? 'wordingLoading' : 'feedbackSubmit')}</button>
          </form> : null}
          {error && <div role="alert"><p>{t(lang, 'feedbackError')}</p>{entries.length === 0 && <button type="button" className="wording-action" onClick={() => setRetry((value) => value + 1)}>{t(lang, 'wordingRetry')}</button>}</div>}
        </>}
      </section>
    </div>
  );
}
