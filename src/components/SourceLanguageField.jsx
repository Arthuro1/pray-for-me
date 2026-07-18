import { useState } from 'react';
import { Languages } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';
import { suggestedSourceLang } from '../lib/langHint';

// One quiet line — "Written in English · Change" — for the bilingual believer
// who writes in a language other than the one the app is in. It is a STATEMENT
// with a correction, not a question: the value is already defaulted from the
// active language, so nobody is ever asked to pick a language for a prayer.
//
// The picker stays folded away behind "Change" (and the whole row lives inside
// the form's existing collapsed disclosure), so the default form gains one line
// of text, never another expanded section.
//
// The heuristic may quietly OFFER a different reading when it is confident and
// disagrees; it is applied only if the author taps it. An explicit choice is
// never overwritten — once `value` has been set here it simply wins.
export default function SourceLanguageField({ value, onChange, sampleText = '', lang }) {
  const [open, setOpen] = useState(false);
  const selectId = 'prayer-source-lang-select';
  const panelId = 'prayer-source-lang-panel';

  const labelOf = (code) => LANGUAGES.find((l) => l.code === code)?.label || code;
  // Only offered while the picker is closed and the author hasn't just chosen —
  // a suggestion under an open picker would be noise.
  const suggestion = open ? null : suggestedSourceLang(sampleText, value);

  return (
    <div>
      <div className="flex items-center gap-1.5 flex-wrap text-xs" style={{ color: 'var(--text-3)' }}>
        <Languages size={12} aria-hidden="true" className="shrink-0" />
        <span>{t(lang, 'sourceLangWrittenIn', { name: labelOf(value) })}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="min-h-[44px] px-1 font-semibold focus-visible:ring-2 rounded"
          style={{ color: 'var(--accent)' }}
        >
          {t(lang, 'sourceLangChange')}
        </button>
      </div>

      {suggestion && (
        <button
          type="button"
          onClick={() => onChange(suggestion)}
          className="min-h-[44px] flex items-center text-xs text-start focus-visible:ring-2 rounded"
          style={{ color: 'var(--accent)' }}
        >
          {t(lang, 'sourceLangLooksLike', { name: labelOf(suggestion) })}
        </button>
      )}

      {open && (
        <div id={panelId} className="mt-1.5">
          <label htmlFor={selectId} className="sr-only">{t(lang, 'sourceLangLabel')}</label>
          <select
            id={selectId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm rounded-xl px-3 min-h-[44px] focus:outline-none focus-visible:ring-2"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
