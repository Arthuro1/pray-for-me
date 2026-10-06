import { useState } from 'react';
import { ArrowLeft, ChevronRight, Copy, HeartHandshake, ImageIcon, Link2Off, Loader2, QrCode, Share2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { t, tp } from '../../i18n';
import { toast } from '../../store/toastStore';
import { track, EVENTS } from '../../lib/analytics';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePlanShareLink } from '../../hooks/usePlanShareLink';
import { todayKey } from '../../lib/prayedLog';
import ShareButtons from '../shared/ShareButtons';
import ConfirmDialog from '../shared/ConfirmDialog';
import PlanInvitePanel from './PlanInvitePanel';
import PlanShareImagePanel from './PlanShareImagePanel';

const QUIET_BUTTON = { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' };

// "Share this plan": the one sheet every plan surface opens — the catalogue
// preview, a run in progress, a finished run. Two halves:
//
//   In Praystead — invite friends or whole groups (plan_invitations).
//   Anywhere     — a public link for people with no account and no friendship
//                  yet: the phone's share sheet, the web share targets, an
//                  image for Stories, and a QR code to show in person.
//
// The link names the sharer by first name, and the sheet says so right under
// it. What comes back is a count of people who began the plan through it, and
// names only for those who are already friends.
export default function PlanShareSheet({ plan, lang, userId, startDate = todayKey(), onClose }) {
  const [view, setView] = useState('main');
  const [confirmStop, setConfirmStop] = useState(false);
  const [stopping, setStopping] = useState(false);
  const link = usePlanShareLink(plan.id, lang);
  const title = t(lang, plan.titleKey);
  const message = t(lang, 'planShareMessage', { plan: title, days: t(lang, 'planDays', { n: plan.count }) });

  useEscapeKey(confirmStop ? null : onClose);
  const trapRef = useFocusTrap(true);

  const shared = (channel) => track(EVENTS.PLAN_LINK_SHARED, { channel });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success(t(lang, 'linkCopied'));
      shared('copy');
    } catch {
      toast.error(t(lang, 'errorGeneric'));
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: message, url: link.url });
      shared('native');
    } catch { /* dismissed */ }
  };

  const stop = async () => {
    setStopping(true);
    const ok = await link.stop();
    setStopping(false);
    setConfirmStop(false);
    if (!ok) toast.error(t(lang, 'errorGeneric'));
  };

  const canUseNativeSheet = typeof navigator !== 'undefined' && !!navigator.share;
  const hasLink = !!link.url;
  const back = () => setView('main');

  return (
    <>
      <div className="dialog-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
        <div
          ref={trapRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={t(lang, 'planShareAction')}
          className="editorial-dialog w-full max-w-md flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 pb-3 shrink-0 flex items-start gap-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
            {view !== 'main' && (
              <button type="button" onClick={back} aria-label={t(lang, 'backBtn')} className="phase-icon-button shrink-0">
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>
                {t(lang, view === 'invite' ? 'planShareInviteFriends' : 'planShareAction')}
              </h3>
              <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{title}</p>
            </div>
            <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="phase-icon-button shrink-0">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {view === 'invite' && (
            <PlanInvitePanel plan={plan} startDate={startDate} lang={lang} userId={userId} onDone={onClose} />
          )}

          {view === 'image' && (
            <PlanShareImagePanel plan={plan} lang={lang} message={message} url={link.url} onShared={() => shared('image')} />
          )}

          {view === 'qr' && (
            <div className="px-5 py-5 overflow-y-auto">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ background: '#ffffff', border: '0.5px solid var(--border)' }}>
                <QRCodeSVG value={link.url} size={200} bgColor="#ffffff" fgColor="#1a0a2e" level="M" aria-hidden="true" />
                <p className="text-xs" style={{ color: '#475569' }}>{t(lang, 'planShareScan')}</p>
              </div>
            </div>
          )}

          {view === 'main' && (
            <div className="px-5 py-4 overflow-y-auto space-y-5">
              <section>
                <p className="section-label mb-2">{t(lang, 'planShareInApp')}</p>
                <button
                  type="button"
                  onClick={() => setView('invite')}
                  className="pressable flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-start text-sm font-medium"
                  style={QUIET_BUTTON}
                >
                  <HeartHandshake size={16} aria-hidden="true" style={{ color: 'var(--accent)' }} />
                  <span className="flex-1 min-w-0" style={{ color: 'var(--text-1)' }}>{t(lang, 'planShareInviteFriends')}</span>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: 'var(--text-3)' }} />
                </button>
              </section>

              <section>
                <p className="section-label mb-2">{t(lang, 'planShareAnywhere')}</p>

                {link.status === 'loading' && (
                  <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-3)' }} aria-hidden="true" /></div>
                )}

                {link.status === 'stopped' && (
                  <div className="rounded-xl p-3" style={QUIET_BUTTON}>
                    <p className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                      <Link2Off size={14} aria-hidden="true" className="shrink-0 mt-0.5" /> {t(lang, 'planShareStopped')}
                    </p>
                    <button
                      type="button"
                      onClick={link.renew}
                      className="pressable mt-3 flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-medium text-white"
                      style={{ background: 'var(--accent)' }}
                    >
                      {t(lang, 'planShareNewLink')}
                    </button>
                  </div>
                )}

                {hasLink && (
                  <>
                    <div className="flex items-center gap-2 rounded-xl p-1.5 ps-3" style={QUIET_BUTTON}>
                      <span className="flex-1 min-w-0 truncate text-xs font-mono" dir="ltr" style={{ color: 'var(--text-2)' }}>{link.url.replace(/^https?:\/\//, '')}</span>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="pressable flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        <Copy size={13} aria-hidden="true" /> {t(lang, 'planShareCopy')}
                      </button>
                    </div>
                    <p className="mt-1.5 mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
                      {t(lang, link.status === 'ready' ? 'planShareLinkNote' : 'planShareLinkNotePlain')}
                    </p>

                    {canUseNativeSheet && (
                      <button
                        type="button"
                        onClick={nativeShare}
                        className="pressable mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white"
                        style={{ background: 'var(--accent)' }}
                      >
                        <Share2 size={16} aria-hidden="true" /> {t(lang, 'planShareNative')}
                      </button>
                    )}

                    <ShareButtons url={link.url} text={message} copiedLabel={t(lang, 'linkCopied')} onShared={() => shared('social')} />

                    <div className="flex gap-2">
                      <button type="button" onClick={() => setView('image')} className="pressable flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium" style={QUIET_BUTTON}>
                        <ImageIcon size={15} aria-hidden="true" /> {t(lang, 'planShareImage')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setView('qr'); shared('qr'); }}
                        className="pressable flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium"
                        style={QUIET_BUTTON}
                      >
                        <QrCode size={15} aria-hidden="true" /> {t(lang, 'showQrCode')}
                      </button>
                    </div>
                  </>
                )}
              </section>

              {/* What came back — a count, and names only for friends. Absent for
                  the plain fallback link, which counts nothing. */}
              {(link.status === 'ready' || link.status === 'stopped') && (
                <section className="space-y-2 pt-1" aria-live="polite">
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {link.joinCount > 0 ? tp(lang, 'planShareJoined', link.joinCount) : t(lang, 'planShareJoinedNone')}
                    {link.friendNames.length > 0 && ` ${t(lang, 'planShareJoinedFriends', { names: link.friendNames.join(', ') })}`}
                  </p>
                  {link.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => setConfirmStop(true)}
                      className="pressable flex min-h-11 items-center gap-1.5 text-xs font-medium"
                      style={{ color: 'var(--text-3)' }}
                    >
                      <Link2Off size={13} aria-hidden="true" /> {t(lang, 'planShareStop')}
                    </button>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmStop && (
        <ConfirmDialog
          title={t(lang, 'planShareStopTitle')}
          message={t(lang, 'planShareStopBody')}
          confirmLabel={t(lang, 'planShareStop')}
          cancelLabel={t(lang, 'cancel')}
          loading={stopping}
          onConfirm={stop}
          onCancel={() => setConfirmStop(false)}
        />
      )}
    </>
  );
}
