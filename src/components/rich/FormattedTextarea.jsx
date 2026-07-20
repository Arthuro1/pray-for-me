// A single markdown-lite form field (the prayer note): the same bold / italic /
// list affordance as UpdateComposer, without the media row or send action —
// the surrounding form owns submission, and prayers store only their text.
import { useRef } from 'react';
import FormatToolbar from './FormatToolbar';
import { useMarkdownFormatting } from './formatting';

export default function FormattedTextarea({ id, value, onChange, placeholder, rows = 3, lang }) {
  const textareaRef = useRef(null);
  const applyFormat = useMarkdownFormatting(textareaRef, value, onChange);

  return (
    <div className="rounded-xl" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full text-sm bg-transparent rounded-xl px-4 pt-3 pb-1 resize-none focus:outline-none focus-visible:ring-2"
        style={{ color: 'var(--text-1)' }}
      />
      <div className="flex items-center gap-0.5 px-1.5 pb-1.5">
        <FormatToolbar lang={lang} onFormat={applyFormat} />
      </div>
    </div>
  );
}
