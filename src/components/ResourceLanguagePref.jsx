import { useState } from 'react';
import { Check, ChevronDown, Library } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';
import { getResourceFallbackLanguages, setResourceFallbackLanguages } from '../lib/planPrefs';

// "Resource languages" — which languages the recommended books, articles and
// teachings under a plan day's "Go deeper" may be offered in.
//
// The app's own language is always included and cannot be switched off, so this
// needs no configuration to work. Everything listed here is an ADDITIONAL
// language the reader has said they can read; nothing is ever shown in another
// language unless they turned it on, so a Spanish reader is never quietly filled
// with English.
export default function ResourceLanguagePref({ lang }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => getResourceFallbackLanguages());

  const toggle = (code) => {
    const next = enabled.includes(code) ? enabled.filter((c) => c !== code) : [...enabled, code];
    setEnabled(next);
    setResourceFallbackLanguages(next);
  };

  const appLabel = LANGUAGES.find((l) => l.code === lang)?.label || lang;
  const extra = enabled.map((c) => LANGUAGES.find((l) => l.code === c)?.label || c);
  const summary = [appLabel, ...extra].join(' · ');

  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="resource-languages-panel"
        className="flex min-h-11 w-full items-center justify-between gap-3 text-start"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Library size={16} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          <span className="min-w-0">
            <span className="block text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'resourceLanguagesTitle')}</span>
            <span className="block text-xs break-words" style={{ color: 'var(--text-3)' }}>{summary}</span>
          </span>
        </span>
        <ChevronDown size={16} aria-hidden="true" style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div id="resource-languages-panel" className="mt-3">
          <p className="mb-2 text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, 'resourceLanguagesSub')}</p>
          <div role="group" aria-label={t(lang, 'resourceLanguagesTitle')} className="flex flex-wrap gap-2">
            {LANGUAGES.filter((l) => l.code !== lang).map((l) => {
              const on = enabled.includes(l.code);
              return (
                <button
                  key={l.code}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(l.code)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium"
                  style={on
                    ? { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                    : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  {on && <Check size={12} aria-hidden="true" />}
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
