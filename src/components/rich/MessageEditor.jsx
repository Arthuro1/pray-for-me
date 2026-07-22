// Inline editor for an already-posted word/testimony — the WhatsApp "edit
// message" gesture: the text becomes an editable field (WYSIWYG, so bold/italic
// show inline and a selection raises the formatting toolbar) with a clear
// Cancel / Save footer. Text-only, so the row's attachments are preserved
// untouched (the caller re-encrypts text + existing media on save). Author-only
// editing is enforced by the caller, which renders this only for rows the
// viewer wrote.
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { t } from '../../i18n';

export default function MessageEditor({ initialText, onSave, onCancel, lang }) {
  const [text, setText] = useState(initialText || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = text.trim();
    // An empty edit or an unchanged one just closes — a message is emptied by
    // deleting it, never by saving blank text (same as WhatsApp).
    if (!next || next === (initialText || '').trim()) { onCancel(); return; }
    setSaving(true);
    try { await onSave(next); } finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
      <RichTextEditor
        value={text}
        onChange={setText}
        lang={lang}
        autoFocus
        ariaLabel={t(lang, 'editWord')}
        minHeight={44}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
          else if (e.key === 'Escape') onCancel();
        }}
      />
      {/* A balanced two-button footer: an equal-width secondary Cancel and
          primary Save, each a comfortable tap target, separated from the field
          by a hairline — clearer than two small right-hugging buttons. */}
      <div className="flex items-center gap-2 px-2 pb-2 pt-1.5" style={{ borderTop: '0.5px solid var(--input-border)' }}>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-[40px] text-sm rounded-lg font-medium"
          style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
        >
          {t(lang, 'cancel')}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] text-sm rounded-lg font-medium text-white disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          {saving && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
          {t(lang, 'save')}
        </button>
      </div>
    </div>
  );
}
