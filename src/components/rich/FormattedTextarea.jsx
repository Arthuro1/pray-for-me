// The prayer description uses the same WYSIWYG surface as updates and message
// edits. Its toolbar stays visible because this is the longer-form field.
import RichTextEditor from './RichTextEditor';

export default function FormattedTextarea({ id, value, onChange, placeholder, ariaLabel, rows = 3, lang }) {
  return (
    <div className="rounded-xl" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
      <RichTextEditor
        inputId={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        ariaLabel={ariaLabel || placeholder}
        lang={lang}
        minHeight={rows * 24 + 20}
        maxHeight={Math.max(rows * 44, 160)}
        showToolbar
      />
    </div>
  );
}
