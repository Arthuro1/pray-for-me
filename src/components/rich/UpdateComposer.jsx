// One composer for every update/testimony write surface (personal + community),
// styled like a familiar chat bar: a rounded input pill flanked by an attach
// "+" button (its menu holds photo / video / audio / voice note / link, plus
// the bold / italic / list formatting) and a right-hand action that is a mic
// when the field is empty (record a voice note) and a send button once there is
// something to send. Surfaces that pass an explicit sendLabel (the answered /
// testimony flows) keep a labelled send button instead of the mic.
//
// Media is encrypted + uploaded as soon as it's picked, so by the time the user
// sends, onSend(text, attachments) receives finished metadata the stores can
// persist inside the row (E2EE payload when the row is encrypted). Text-only
// sends never touch the network here, so offline text updates keep working;
// media picks while offline fail fast with an honest toast.
import { useEffect, useRef, useState } from 'react';
import { Camera, Film, Link2, Loader2, Mic, Music, Plus, Send, Square, Trash2, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { uploadAttachment, linkAttachment, removeAttachmentFiles } from '../../lib/attachments';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';
import RichTextEditor from './RichTextEditor';
import { recorderMime } from './recorderMime';

// One row in the attach "+" menu: an icon chip and a label.
function MenuRow({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-sm text-start transition-colors"
      style={{ color: 'var(--text-1)' }}
    >
      <span className="w-8 h-8 flex items-center justify-center rounded-full shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
        <Icon size={15} aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

export default function UpdateComposer({
  lang,
  onSend, // async (text, attachments) => void
  placeholder,
  rows = 2,
  autoFocus = false,
  sendLabel = null, // null → mic-when-empty / send-when-typing (chat style)
  // The answered flow confirms with an OPTIONAL testimony — its send button
  // must stay enabled with nothing written.
  allowEmpty = false,
  inputId,
}) {
  const [text, setText] = useState('');
  // [{ id, status: 'uploading'|'ready'|'error', meta?, name }]
  const [pending, setPending] = useState([]);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const menuRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const discardRef = useRef(false); // set true to drop an in-progress recording
  const { user } = useAuthStore();

  // Stop the mic if the composer unmounts mid-recording.
  useEffect(() => () => {
    recorderRef.current?.stream?.getTracks().forEach((tr) => tr.stop());
    clearInterval(timerRef.current);
  }, []);

  // Close the attach menu on an outside click or Escape.
  useEffect(() => {
    if (!showMenu) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    const onKey = (e) => { if (e.key === 'Escape') setShowMenu(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [showMenu]);

  const uploading = pending.some((p) => p.status === 'uploading');
  const ready = pending.filter((p) => p.status === 'ready').map((p) => p.meta);
  const hasContent = !!text.trim() || ready.length > 0;
  const canSend = !sending && !uploading && !recording && (allowEmpty || hasContent);

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
      discardRef.current = false;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        clearInterval(timerRef.current);
        setRecording(false);
        setRecordSeconds(0);
        if (discardRef.current) return; // cancelled — keep no file
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
  const cancelRecording = () => { discardRef.current = true; recorderRef.current?.stop(); };

  // ── Send ───────────────────────────────────────────────────────────────────
  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const result = await onSend(text.trim(), ready);
      if (result === false) return;
      setText('');
      setPending([]);
      setShowLinkInput(false);
    } finally {
      setSending(false);
    }
  };

  const fmtSeconds = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const runMenu = (fn) => { setShowMenu(false); fn(); };

  // The mic replaces the send button only on chat-style surfaces (no sendLabel)
  // while there is nothing yet to send.
  const showMic = !sendLabel && !hasContent && !sending && !uploading;

  const sendButton = (
    <button
      type="button"
      onClick={send}
      disabled={!canSend}
      aria-label={sendLabel || t(lang, 'tipSaveUpdate')}
      title={sendLabel || t(lang, 'tipSaveUpdate')}
      className={`update-composer__send flex items-center justify-center gap-1.5 min-h-[44px] shrink-0 text-white text-xs font-medium disabled:opacity-40 ${sendLabel ? 'px-3.5 rounded-lg' : 'w-11 rounded-full'}`}
      style={{ background: 'var(--accent)' }}
    >
      {sending || uploading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
      {sendLabel}
    </button>
  );

  return (
    <div id={inputId} className={`update-composer space-y-1.5 ${sendLabel ? 'update-composer--labelled' : 'update-composer--compact'}`}>
      {/* Pending attachment chips */}
      {pending.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
        <div className="flex gap-1.5">
          <input
            type="url"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder={t(lang, 'linkPlaceholder')}
            className="flex-1 min-w-0 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
            style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
            autoFocus
          />
          <button type="button" onClick={addLink} className="text-xs px-3 rounded-lg font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            {t(lang, 'addBtn')}
          </button>
        </div>
      )}

      {recording ? (
        /* Recording bar: cancel · pulsing dot + timer · stop */
        <div className="flex items-center gap-2 rounded-full px-2 py-1.5" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <button type="button" onClick={cancelRecording} aria-label={t(lang, 'cancel')} title={t(lang, 'cancel')} className="w-9 h-9 flex items-center justify-center rounded-full shrink-0" style={{ color: 'var(--text-3)' }}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
          <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ background: '#e53e3e' }} aria-hidden="true" />
          <span className="flex-1 text-sm tabular-nums" style={{ color: 'var(--text-2)' }}>{fmtSeconds(recordSeconds)}</span>
          <button type="button" onClick={stopRecording} aria-label={t(lang, 'stopRecording')} title={t(lang, 'stopRecording')} className="w-11 h-11 flex items-center justify-center rounded-full shrink-0 text-white" style={{ background: 'var(--accent)' }}>
            <Square size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="update-composer__row flex items-end gap-1.5">
          {/* Attach "+" menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              aria-label={t(lang, 'attachMenu')}
              title={t(lang, 'attachMenu')}
              aria-expanded={showMenu}
              className="w-11 h-11 flex items-center justify-center rounded-full transition-transform"
              style={{ color: 'var(--text-3)', transform: showMenu ? 'rotate(45deg)' : 'none' }}
            >
              <Plus size={22} aria-hidden="true" />
            </button>
            {showMenu && (
              <div
                role="menu"
                className="absolute bottom-12 start-0 z-20 w-52 rounded-2xl p-1.5 shadow-lg"
                style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
              >
                <MenuRow icon={Camera} label={t(lang, 'attachPhoto')} onClick={() => runMenu(() => pickFile('image/*'))} />
                <MenuRow icon={Film} label={t(lang, 'attachVideo')} onClick={() => runMenu(() => pickFile('video/*'))} />
                <MenuRow icon={Music} label={t(lang, 'attachAudio')} onClick={() => runMenu(() => pickFile('audio/*'))} />
                <MenuRow icon={Mic} label={t(lang, 'recordVoice')} onClick={() => runMenu(startRecording)} />
                <MenuRow icon={Link2} label={t(lang, 'attachLink')} onClick={() => runMenu(() => setShowLinkInput(true))} />
              </div>
            )}
          </div>

          {/* Input pill — a WYSIWYG field: selecting text raises a bold / italic /
              list toolbar and the styling shows inline, never as raw markers. */}
          <div className="update-composer__input flex-1 min-w-0 rounded-3xl flex items-center" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
            <RichTextEditor
              value={text}
              onChange={setText}
              placeholder={placeholder}
              lang={lang}
              autoFocus={autoFocus}
              minHeight={rows > 1 ? rows * 22 : 24}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            />
          </div>

          {/* Right action: mic (empty, chat-style) or send */}
          {showMic ? (
            <button
              type="button"
              onClick={startRecording}
              aria-label={t(lang, 'recordVoice')}
              title={t(lang, 'recordVoice')}
              className="w-11 h-11 flex items-center justify-center rounded-full shrink-0 text-white"
              style={{ background: 'var(--accent)' }}
            >
              <Mic size={18} aria-hidden="true" />
            </button>
          ) : (
            sendButton
          )}
        </div>
      )}
    </div>
  );
}
