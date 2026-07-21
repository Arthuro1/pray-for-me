// One composer for every update/testimony write surface (personal + community):
// a textarea with light formatting (bold / italic / list), media attachments
// (photo, audio, video — picked or recorded — and links), and a send action.
//
// Media is encrypted + uploaded as soon as it's picked, so by the time the user
// sends, onSend(text, attachments) receives finished metadata the stores can
// persist inside the row (E2EE payload when the row is encrypted). Text-only
// sends never touch the network here, so offline text updates keep working;
// media picks while offline fail fast with an honest toast.
import { useEffect, useRef, useState } from 'react';
import { Camera, Film, Link2, Loader2, Mic, Music, Send, Square, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { uploadAttachment, linkAttachment, removeAttachmentFiles } from '../../lib/attachments';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';
import FormatToolbar, { ToolbarButton } from './FormatToolbar';
import { useMarkdownFormatting } from './formatting';
import { recorderMime } from './recorderMime';

export default function UpdateComposer({
  lang,
  onSend, // async (text, attachments) => void
  placeholder,
  rows = 2,
  autoFocus = false,
  sendLabel = null, // null → send icon
  // The answered flow confirms with an OPTIONAL testimony — its send button
  // must stay enabled with nothing written.
  allowEmpty = false,
  inputId,
}) {
  const [text, setText] = useState('');
  // [{ id, status: 'uploading'|'ready'|'error', meta?, name }]
  const [pending, setPending] = useState([]);
  const [sending, setSending] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const textareaRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const { user } = useAuthStore();

  // Stop the mic if the composer unmounts mid-recording.
  useEffect(() => () => {
    recorderRef.current?.stream?.getTracks().forEach((tr) => tr.stop());
    clearInterval(timerRef.current);
  }, []);

  const uploading = pending.some((p) => p.status === 'uploading');
  const ready = pending.filter((p) => p.status === 'ready').map((p) => p.meta);
  const canSend = !sending && !uploading && !recording && (allowEmpty || text.trim() || ready.length > 0);

  // ── Formatting: wrap the selection (or insert markers) in the textarea ─────
  const applyFormat = useMarkdownFormatting(textareaRef, text, setText);

  // ── Attachments ────────────────────────────────────────────────────────────
  const addFiles = async (files) => {
    for (const file of files) {
      const entryId = crypto.randomUUID();
      setPending((prev) => [...prev, { id: entryId, status: 'uploading', name: file.name }]);
      const { attachment, error } = await uploadAttachment(file, user?.id);
      if (error) {
        toast.error(t(lang, error));
        setPending((prev) => prev.filter((p) => p.id !== entryId));
      } else {
        setPending((prev) => prev.map((p) => (p.id === entryId ? { ...p, status: 'ready', meta: attachment } : p)));
      }
    }
  };

  const pickFile = (accept) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => { if (input.files?.length) addFiles([...input.files]); };
    input.click();
  };

  const removePending = (entry) => {
    setPending((prev) => prev.filter((p) => p.id !== entry.id));
    if (entry.meta?.path) removeAttachmentFiles([entry.meta]);
  };

  const addLink = () => {
    const att = linkAttachment(linkDraft);
    if (!att) { toast.error(t(lang, 'linkInvalid')); return; }
    setPending((prev) => [...prev, { id: att.id, status: 'ready', meta: att, name: att.url }]);
    setLinkDraft('');
    setShowLinkInput(false);
  };

  // ── Voice note recording ───────────────────────────────────────────────────
  const startRecording = async () => {
    const mime = recorderMime();
    if (!mime || !navigator.mediaDevices?.getUserMedia) { toast.error(t(lang, 'micUnavailable')); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        clearInterval(timerRef.current);
        setRecording(false);
        setRecordSeconds(0);
        const ext = mime.includes('mp4') ? 'm4a' : 'webm';
        const file = new File(chunks, `voice-note.${ext}`, { type: mime.split(';')[0] });
        if (file.size > 0) addFiles([file]);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      toast.error(t(lang, 'micUnavailable'));
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  // ── Send ───────────────────────────────────────────────────────────────────
  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await onSend(text.trim(), ready);
      setText('');
      setPending([]);
      setShowLinkInput(false);
    } finally {
      setSending(false);
    }
  };

  const fmtSeconds = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div id={inputId} className="rounded-xl" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className="w-full text-sm bg-transparent px-3 pt-2.5 pb-1 resize-none focus:outline-none"
        style={{ color: 'var(--text-1)' }}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
      />

      {/* Pending attachment chips */}
      {pending.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-1.5">
          {pending.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5 max-w-[180px] rounded-full ps-2.5 pe-1 py-1 text-xs" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
              {p.status === 'uploading' && <Loader2 size={11} className="animate-spin shrink-0" aria-hidden="true" />}
              <span className="truncate">{p.name || p.meta?.type}</span>
              {p.status !== 'uploading' && (
                <button type="button" onClick={() => removePending(p)} aria-label={t(lang, 'attachRemove')} title={t(lang, 'attachRemove')} className="w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                  <X size={11} aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Inline link input */}
      {showLinkInput && (
        <div className="flex gap-1.5 px-3 pb-1.5">
          <input
            type="url"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder={t(lang, 'linkPlaceholder')}
            className="flex-1 min-w-0 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
            autoFocus
          />
          <button type="button" onClick={addLink} className="text-xs px-3 rounded-lg font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            {t(lang, 'addBtn')}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-1.5 pb-1.5">
        <FormatToolbar lang={lang} onFormat={applyFormat} />
        <span className="w-px h-4 mx-1" style={{ background: 'var(--input-border)' }} aria-hidden="true" />
        <ToolbarButton icon={Camera} label={t(lang, 'attachPhoto')} onClick={() => pickFile('image/*')} />
        <ToolbarButton icon={Film} label={t(lang, 'attachVideo')} onClick={() => pickFile('video/*')} />
        <ToolbarButton icon={Music} label={t(lang, 'attachAudio')} onClick={() => pickFile('audio/*')} />
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            aria-label={t(lang, 'stopRecording')}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium"
            style={{ background: '#fde8e8', color: '#c04040' }}
          >
            <Square size={11} aria-hidden="true" /> {fmtSeconds(recordSeconds)}
          </button>
        ) : (
          <ToolbarButton icon={Mic} label={t(lang, 'recordVoice')} onClick={startRecording} />
        )}
        <ToolbarButton icon={Link2} label={t(lang, 'attachLink')} active={showLinkInput} onClick={() => setShowLinkInput((v) => !v)} />

        <div className="flex-1" />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label={sendLabel || t(lang, 'tipSaveUpdate')}
          title={sendLabel || t(lang, 'tipSaveUpdate')}
          className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3.5 rounded-lg text-white text-xs font-medium disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          {sending || uploading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
          {sendLabel}
        </button>
      </div>
    </div>
  );
}
