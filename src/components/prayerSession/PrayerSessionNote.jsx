// The one quiet secondary action inside a prayer session: capture something you
// want to remember about THIS request. Collapsed until asked for, so a user who
// never takes notes sees a single unobtrusive line and nothing else.
//
// The session is for praying first — this is why there is no always-visible
// textarea, no formatting toolbar by default (one `Aa` control reveals it), and
// no media beyond writing and a voice note. Photos, videos and links stay in
// Prayer Details, where the full composer already lives.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronUp, Loader2, NotebookPen, Type } from 'lucide-react';
import { t } from '../../i18n';
import RichTextEditor from '../rich/RichTextEditor';
import { plainText } from '../rich/plainText';
import PrayerVoiceRecorder from './PrayerVoiceRecorder';
import { fmtDuration } from './duration';
import { NOTE_STATUS } from './useSessionNotes';

// What the collapsed row says once something has been captured. Quiet, factual,
// and never claiming a server round-trip that hasn't happened.
function summaryLabel(lang, draft) {
  const committedText = plainText(draft.committedText || '');
  const textChanged = plainText(draft.text) !== committedText;
  if ((draft.status === NOTE_STATUS.SAVED || draft.status === NOTE_STATUS.SAVING) && !textChanged) {
    return t(lang, 'noteSaved');
  }
  if (draft.status === NOTE_STATUS.PENDING) return t(lang, 'noteAdded');
  const hasText = !!plainText(draft.text);
  if (hasText && draft.voice) return t(lang, 'noteSummaryBoth');
  if (draft.voice) return t(lang, 'noteSummaryVoice', { duration: fmtDuration(draft.voice.seconds || 0) });
  return t(lang, 'noteAdded');
}

function focusEditorWithoutPageScroll(panel) {
  const editor = panel?.querySelector('[role="textbox"]');
  if (!editor) return;
  editor.focus?.({ preventScroll: true });
  try {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  } catch { /* selection APIs can be absent in lightweight browser shells */ }
}

export default function PrayerSessionNote({
  lang,
  prayerId,
  draft,
  onChangeText,
  onCaptureVoice,
  onDeleteVoice,
  recorderRef,
  saving = false,
}) {
  const [open, setOpen] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const returnFocus = useRef(false);
  const panelId = `prayer-note-${prayerId}`;

  // Each prayer starts collapsed — moving on is never a note-taking prompt.
  useEffect(() => { setOpen(false); setShowFormatting(false); }, [prayerId]);

  // Focus before paint and explicitly suppress the browser's default page
  // scrolling. The request container is adjusted separately below.
  useLayoutEffect(() => {
    if (open) focusEditorWithoutPageScroll(panelRef.current);
  }, [open]);

  // On a phone the composer sits below the fold and the keyboard eats what's
  // left. Keep the reveal inside the request's own scroll area: scrollIntoView
  // can move the fixed dialog itself in mobile browsers and clip its header.
  // Re-run when the visual viewport changes so the editor remains reachable
  // after the keyboard has finished opening.
  useEffect(() => {
    if (!open) return;

    let frame = null;
    const reveal = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;

        const scroller = panel.closest('.constellation-session__request');
        if (!scroller) return;
        const panelRect = panel.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        const vv = typeof window !== 'undefined' ? window.visualViewport : null;
        const viewportTop = vv?.offsetTop || 0;
        const viewportBottom = viewportTop + (vv?.height || window.innerHeight);
        const visibleTop = Math.max(scrollerRect.top, viewportTop) + 12;
        const visibleBottom = Math.min(scrollerRect.bottom, viewportBottom) - 12;
        if (visibleBottom <= visibleTop) return;

        // If the panel is taller than the remaining viewport, prioritise its
        // heading/editor; otherwise reveal its bottom actions as well.
        if (panelRect.height > visibleBottom - visibleTop || panelRect.top < visibleTop) {
          scroller.scrollTop += panelRect.top - visibleTop;
        } else if (panelRect.bottom > visibleBottom) {
          scroller.scrollTop += panelRect.bottom - visibleBottom;
        }
      });
    };

    reveal();
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    vv?.addEventListener?.('resize', reveal);
    vv?.addEventListener?.('scroll', reveal);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      vv?.removeEventListener?.('resize', reveal);
      vv?.removeEventListener?.('scroll', reveal);
    };
  }, [open]);

  // Returning to prayer collapses the composer, which is when the disclosure
  // row is rendered again — so the focus hand-back waits for that render rather
  // than reaching for a button that doesn't exist yet.
  useEffect(() => {
    if (!open && returnFocus.current) {
      returnFocus.current = false;
      triggerRef.current?.focus?.({ preventScroll: true });
    }
  }, [open]);

  const collapse = () => {
    returnFocus.current = true;
    setOpen(false);
    setShowFormatting(false);
  };

  const hasContent = !!plainText(draft.text) || !!draft.voice;
  // Once the note has become a real update, its recording belongs to that entry:
  // further media is added from Prayer Details, like any other update.
  const committed = draft.status === NOTE_STATUS.SAVED || draft.status === NOTE_STATUS.SAVING;
  const hasPendingTextChanges = committed
    && plainText(draft.text) !== plainText(draft.committedText || '');
  const settled = committed && !hasPendingTextChanges;

  if (!open) {
    return (
      <div className="border-block-start mt-8 pt-5" style={{ borderColor: 'var(--border)' }}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-controls={panelId}
          className="pressable flex min-h-11 items-center gap-2 rounded-xl text-sm"
          style={{ color: hasContent ? 'var(--success)' : 'var(--text-3)' }}
        >
          {hasContent
            ? <Check size={14} aria-hidden="true" />
            : <NotebookPen size={14} aria-hidden="true" />}
          <span>{hasContent ? summaryLabel(lang, draft) : t(lang, 'noteAdd')}</span>
          {saving && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
        </button>
        {hasContent && draft.restored && draft.status === NOTE_STATUS.DRAFT && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'noteContinue')}</p>
        )}
        {draft.status === NOTE_STATUS.PENDING && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'noteVoicePending')}</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      id={panelId}
      className="border-block-start mt-8 pt-5"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'noteTitle')}
        </p>
        {settled && (
          <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--success)' }}>
            <Check size={11} aria-hidden="true" /> {t(lang, 'noteSaved')}
          </span>
        )}
      </div>

      <div className="rounded-2xl" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
        <RichTextEditor
          value={draft.text}
          onChange={(text) => onChangeText(text)}
          placeholder={t(lang, 'notePlaceholder')}
          ariaLabel={t(lang, 'noteTitle')}
          lang={lang}
          minHeight={72}
          maxHeight={200}
          showToolbar={showFormatting}
        />
      </div>

      {/* One line while idle — `Aa` and a quiet Voice note action. The recorder's
          active states declare `w-full`, so they wrap onto their own line and
          become the focused thing on screen. */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFormatting((v) => !v)}
          aria-expanded={showFormatting}
          aria-pressed={showFormatting}
          aria-label={t(lang, 'noteFormatting')}
          title={t(lang, 'noteFormatting')}
          className="pressable flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs font-semibold"
          style={{ color: showFormatting ? 'var(--accent)' : 'var(--text-3)' }}
        >
          <Type size={14} aria-hidden="true" /> Aa
        </button>
        {!committed && (
          <PrayerVoiceRecorder
            ref={recorderRef}
            lang={lang}
            voice={draft.voice}
            onCaptured={onCaptureVoice}
            onDelete={onDeleteVoice}
          />
        )}
      </div>

      {/* A recording that already belongs to a saved note stays playable, but the
          recorder itself is retired for this entry. */}
      {committed && draft.voice && (
        <PrayerVoiceRecorder lang={lang} voice={draft.voice} readOnly onCaptured={() => {}} onDelete={() => {}} />
      )}

      {hasContent && (!committed || hasPendingTextChanges) && (
        <p
          role="status"
          className="mt-2 flex items-start gap-1.5 text-xs leading-5"
          style={{ color: 'var(--text-3)' }}
        >
          <Check className="mt-0.5 shrink-0" size={12} aria-hidden="true" />
          <span>{t(lang, 'noteSavedOnContinue')}</span>
        </p>
      )}

      <button
        type="button"
        onClick={collapse}
        className="pressable mt-3 flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-medium"
        style={{ color: 'var(--accent)' }}
      >
        <ChevronUp size={14} aria-hidden="true" /> {t(lang, 'resumePrayer')}
      </button>
    </div>
  );
}
