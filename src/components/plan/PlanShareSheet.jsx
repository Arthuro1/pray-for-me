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
import { PrimaryButton, QuietButton, SecondaryButton, SectionLabel } from '../shared/Primitives';
import ShareButtons from '../shared/ShareButtons';
import ConfirmDialog from '../shared/ConfirmDialog';
import PlanInvitePanel from './PlanInvitePanel';
import PlanShareImagePanel from './PlanShareImagePanel';

// "Share this plan": the one sheet every plan surface opens — the catalogue
// preview, a run in progress, a finished run. Two halves:
//
//   In Qetoret — invite friends or whole groups (plan_invitations).
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

  return (
    <>
      <div className="dialog-backdrop fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={onClose}>
        <div
          ref={trapRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={t(lang, 'planShareAction')}
          className="q-dialog flex max-h-[88vh] min-h-0 w-full max-w-md flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="plan-detail__header shrink-0">
            {view !== 'main' && (
              <button type="button" onClick={() => setView('main')} aria-label={t(lang, 'backBtn')} className="icon-button pressable -ms-2 -mt-2 shrink-0">
                <ArrowLeft className="rtl-mirror" size={18} aria-hidden="true" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="q-dialog__title">{t(lang, view === 'invite' ? 'planShareInviteFriends' : 'planShareAction')}</h2>
              <p className="q-meta mt-1 truncate">{title}</p>
            </div>
            <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
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
            <div className="plan-detail__body min-h-0 flex-1 overflow-y-auto">
              <div className="invite-code">
                <QRCodeSVG value={link.url} size={200} bgColor="#FFFFFF" fgColor="#29213F" level="M" aria-hidden="true" />
                <p className="invite-code__hint">{t(lang, 'planShareScan')}</p>
              </div>
            </div>
          )}

          {view === 'main' && (
            <div className="plan-detail__body min-h-0 flex-1 overflow-y-auto">
              <section className="plan-share__section">
                <SectionLabel>{t(lang, 'planShareInApp')}</SectionLabel>
                <button type="button" onClick={() => setView('invite')} className="plan-share__row pressable">
                  <HeartHandshake size={18} strokeWidth={1.85} aria-hidden="true" />
                  <span>{t(lang, 'planShareInviteFriends')}</span>
                  <ChevronRight className="rtl-mirror" size={16} aria-hidden="true" />
                </button>
              </section>

              <section className="plan-share__section">
                <SectionLabel>{t(lang, 'planShareAnywhere')}</SectionLabel>

                {link.status === 'loading' && (
                  <div className="q-loading"><Loader2 size={20} className="animate-spin" aria-hidden="true" /></div>
                )}

                {link.status === 'stopped' && (
                  <>
                    <p className="share-note">
                      <Link2Off size={16} aria-hidden="true" /> <span>{t(lang, 'planShareStopped')}</span>
                    </p>
                    <PrimaryButton onClick={link.renew} className="w-full">{t(lang, 'planShareNewLink')}</PrimaryButton>
                  </>
                )}

                {hasLink && (
                  <>
                    <div className="share-link">
                      <span className="share-link__url" dir="ltr">{link.url.replace(/^https?:\/\//, '')}</span>
                      <QuietButton icon={Copy} iconSize={15} onClick={copyLink} className="shrink-0">{t(lang, 'planShareCopy')}</QuietButton>
                    </div>
                    <p className="q-field__hint mt-2">
                      {t(lang, link.status === 'ready' ? 'planShareLinkNote' : 'planShareLinkNotePlain')}
                    </p>

                    {canUseNativeSheet && (
                      <PrimaryButton icon={Share2} onClick={nativeShare} className="mt-5 w-full">{t(lang, 'planShareNative')}</PrimaryButton>
                    )}

                    <ShareButtons url={link.url} text={message} copiedLabel={t(lang, 'linkCopied')} onShared={() => shared('social')} />

                    <div className="plan-share__more">
                      <SecondaryButton icon={ImageIcon} iconSize={16} onClick={() => setView('image')}>{t(lang, 'planShareImage')}</SecondaryButton>
                      <SecondaryButton icon={QrCode} iconSize={16} onClick={() => { setView('qr'); shared('qr'); }}>{t(lang, 'showQrCode')}</SecondaryButton>
                    </div>
                  </>
                )}
              </section>

              {/* What came back — a count, and names only for friends. Absent for
                  the plain fallback link, which counts nothing. */}
              {(link.status === 'ready' || link.status === 'stopped') && (
                <section className="plan-share__returns" aria-live="polite">
                  <p className="q-meta">
                    {link.joinCount > 0 ? tp(lang, 'planShareJoined', link.joinCount) : t(lang, 'planShareJoinedNone')}
                    {link.friendNames.length > 0 && ` ${t(lang, 'planShareJoinedFriends', { names: link.friendNames.join(', ') })}`}
                  </p>
                  {link.status === 'ready' && (
                    <QuietButton icon={Link2Off} iconSize={15} onClick={() => setConfirmStop(true)} className="-ms-3 mt-1">
                      {t(lang, 'planShareStop')}
                    </QuietButton>
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
