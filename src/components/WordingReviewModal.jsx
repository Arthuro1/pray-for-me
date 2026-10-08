import { useEffect, useId, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardCheck, Inbox, Loader2, RefreshCw, X } from 'lucide-react';
import { t, dirFor } from '../i18n';
import { fetchWordingReports, updateWordingStatus, WORDING_STATUSES, canReviewWording } from '../lib/wordingReports';
import useAuthStore from '../store/authStore';
import { Modal, QuietButton, SecondaryButton, StatusLabel } from './shared/Primitives';

// One report as a card: where the wording lives (language, key, date), what is
// wrong with it, the wording as published, the reporter's suggestion, and where
// its review stands.
function ReportCard({ row, lang, disabled, onStatus }) {
  const statusId = useId();
  return (
    <article className="wording-report">
      <div className="wording-report__meta">
        <span className="wording-report__locale">{row.locale}</span>
        <code className="wording-report__key">{row.translation_key}</code>
        <span className="wording-report__date">{new Date(row.created_at).toLocaleDateString(lang)}</span>
      </div>
      <StatusLabel tone="sacred">{t(lang, `wordingIssue_${row.issue_type}`)}</StatusLabel>
      <blockquote dir={dirFor(row.locale)} className="wording-report__quote">{row.current_string}</blockquote>
      {row.suggested_wording && (
        <div className="wording-report__suggestion">
          <p className="section-label">{t(lang, 'wordingSuggestion')}</p>
          <p dir={dirFor(row.locale)}>{row.suggested_wording}</p>
        </div>
      )}
      <div className="wording-report__status">
        <label htmlFor={statusId}>{t(lang, 'wordingStatus')}</label>
        <select
          id={statusId}
          className="q-input q-input--compact w-auto"
          disabled={disabled}
          value={row.status}
          onChange={(e) => onStatus(row.id, e.target.value)}
        >
          {WORDING_STATUSES.map((s) => <option key={s} value={s}>{t(lang, `wordingStatus_${s}`)}</option>)}
        </select>
      </div>
    </article>
  );
}

export default function WordingReviewModal({ lang, onClose }) {
  const user = useAuthStore((s) => s.user);
  const allowed = canReviewWording(user);
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
  const showPager = page > 0 || result.hasMore;

  return (
    <Modal labelledBy={heading} onClose={onClose} size="lg" className="max-h-[90dvh] overflow-y-auto">
      <div dir={dirFor(lang)}>
        <div className="q-dialog__header">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile tone-plum" aria-hidden="true"><ClipboardCheck size={18} strokeWidth={1.85} /></span>
            <h2 id={heading} className="q-dialog__title">{t(lang, 'wordingReview')}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {!allowed ? <p role="alert" className="q-notice q-notice--error">{t(lang, 'wordingRestricted')}</p> : (
          <>
            {/* Which reports to see: one tap per status, the current one marked. */}
            <div role="group" aria-label={t(lang, 'wordingStatus')} className="q-chips">
              {WORDING_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  disabled={busy}
                  onClick={() => { setStatus(s); setPage(0); }}
                  className="q-chip pressable"
                >
                  {t(lang, `wordingStatus_${s}`)}
                </button>
              ))}
            </div>

            <div className="wording-review__list">
              {loading && (
                <p role="status" className="q-loading items-center gap-2">
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {t(lang, 'wordingLoading')}
                </p>
              )}
              {!loading && !error && result.rows.length === 0 && (
                <div className="wording-review__empty">
                  <span className="icon-tile icon-tile--round" aria-hidden="true"><Inbox size={18} strokeWidth={1.85} /></span>
                  <p>{t(lang, 'wordingEmpty')}</p>
                </div>
              )}
              {result.rows.map((row) => (
                <ReportCard key={row.id} row={row} lang={lang} disabled={busy || loading} onStatus={change} />
              ))}
            </div>

            {error && (
              <div role="alert" className="q-notice q-notice--error wording-review__error">
                <span>{t(lang, 'feedbackError')}</span>
                <QuietButton icon={RefreshCw} iconSize={14} onClick={() => setRefresh((v) => v + 1)}>{t(lang, 'wordingRetry')}</QuietButton>
              </div>
            )}

            {showPager && (
              <div className="wording-review__pager">
                <SecondaryButton disabled={page === 0 || loading || busy} onClick={() => setPage((v) => v - 1)}>
                  <ChevronLeft size={16} strokeWidth={1.85} className="rtl-mirror" aria-hidden="true" /> {t(lang, 'wordingPrevious')}
                </SecondaryButton>
                <SecondaryButton disabled={!result.hasMore || loading || busy} onClick={() => setPage((v) => v + 1)}>
                  {t(lang, 'wordingNext')} <ChevronRight size={16} strokeWidth={1.85} className="rtl-mirror" aria-hidden="true" />
                </SecondaryButton>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
