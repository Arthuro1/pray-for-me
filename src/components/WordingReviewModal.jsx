import { useEffect, useId, useState } from 'react';
import { t, dirFor } from '../i18n';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { fetchWordingReports, updateWordingStatus, WORDING_STATUSES, canReviewWording } from '../lib/wordingReports';
import useAuthStore from '../store/authStore';

export default function WordingReviewModal({ lang, onClose }) {
  const user = useAuthStore((s) => s.user);
  const allowed = canReviewWording(user);
  const trapRef = useFocusTrap();
  useEscapeKey(onClose);
  const heading = useId();
  const [status, setStatus] = useState('new');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ rows: [], hasMore: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setLoading(true); setError(false); setResult({ rows: [], hasMore: false });
    fetchWordingReports(status, page).then((data) => { if (active) setResult(data); })
      .catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [allowed, status, page, refresh]);
  async function change(id, next) {
    setBusy(true); setError(false);
    try { await updateWordingStatus(id, next); setRefresh((v) => v + 1); }
    catch { setError(true); } finally { setBusy(false); }
  }
  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <section ref={trapRef} role="dialog" aria-modal="true" aria-labelledby={heading} tabIndex={-1} dir={dirFor(lang)} className="editorial-dialog w-full max-w-2xl max-h-[90dvh] overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between gap-4"><h2 id={heading} className="font-semibold">{t(lang, 'wordingReview')}</h2><button onClick={onClose}>{t(lang, 'close')}</button></div>
        {!allowed ? <p role="alert">{t(lang, 'wordingRestricted')}</p> : <>
          <label className="block">{t(lang, 'wordingStatus')}<select className="wording-control" disabled={busy} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>{WORDING_STATUSES.map((s) => <option key={s} value={s}>{t(lang, `wordingStatus_${s}`)}</option>)}</select></label>
          {loading ? <p role="status">{t(lang, 'wordingLoading')}</p> : result.rows.length === 0 && !error ? <p>{t(lang, 'wordingEmpty')}</p> : null}
          {result.rows.map((row) => <article key={row.id} className="rounded-xl border p-4 space-y-2 break-words" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs">{row.locale} · {row.translation_key} · {new Date(row.created_at).toLocaleDateString(lang)}</p>
            <p className="text-sm">{t(lang, `wordingIssue_${row.issue_type}`)}</p>
            <blockquote dir={dirFor(row.locale)} className="whitespace-pre-wrap">{row.current_string}</blockquote>
            {row.suggested_wording && <p dir={dirFor(row.locale)} className="whitespace-pre-wrap"><strong>{t(lang, 'wordingSuggestion')}: </strong>{row.suggested_wording}</p>}
            <label className="block">{t(lang, 'wordingStatus')}<select className="wording-control" disabled={busy || loading} value={row.status} onChange={(e) => change(row.id, e.target.value)}>{WORDING_STATUSES.map((s) => <option key={s} value={s}>{t(lang, `wordingStatus_${s}`)}</option>)}</select></label>
          </article>)}
          {error && <div role="alert"><p>{t(lang, 'feedbackError')}</p><button className="wording-action" onClick={() => setRefresh((v) => v + 1)}>{t(lang, 'wordingRetry')}</button></div>}
          <div className="flex justify-between gap-4"><button disabled={page === 0 || loading || busy} onClick={() => setPage((v) => v - 1)}>{t(lang, 'wordingPrevious')}</button><button disabled={!result.hasMore || loading || busy} onClick={() => setPage((v) => v + 1)}>{t(lang, 'wordingNext')}</button></div>
        </>}
      </section>
    </div>
  );
}
