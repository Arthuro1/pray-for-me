import { useState } from 'react';
import { Check, ChevronDown, Library } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';
import { getResourceFallbackLanguages, setResourceFallbackLanguages } from '../lib/planPrefs';
import { availableResourceLanguages } from '../lib/resources';

const DISPLAYABLE_RESOURCE_LANGUAGES = new Set(availableResourceLanguages());

// "Resource languages" — which languages the recommended books, articles and
// teachings under a plan day's "Go deeper" may be offered in.
//
// The app's own language is always preferred and cannot be switched off.
// English is preselected for new readers, but it appears here like every other
// additional language and can be removed. A shelf may mix languages: each work
// uses its first available edition in [app language, ...selected languages].
// Languages with no approved, renderable catalogue edition are not offered.
//
// ── WHY A NEW CHOICE GOES TO THE FRONT ─────────────────────────────────────
// The list is a PRIORITY order, not a set: a work published in several of the
// enabled languages is offered once, in the first one that has a verified
// edition. Appending a newly ticked language therefore left it behind English,
// which is preselected for everyone — and because almost every work in the
// catalogue has an English edition, eight of the eleven offerable languages
// could never win. Ticking Japanese, Portuguese or Russian changed nothing a
// reader could see, which is not a setting, it is decoration.
//
// A language the reader deliberately ticks now outranks the one we ticked for
// them. Ticking again moves it back to the front, which is how the order is
// re-arranged; the numbered chain above the toggles shows where each one sits.
export default function ResourceLanguagePref({ lang }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => getResourceFallbackLanguages());

  const toggle = (code) => {
    const next = enabled.includes(code) ? enabled.filter((c) => c !== code) : [code, ...enabled];
    setEnabled(next);
    setResourceFallbackLanguages(next);
  };

  const appLabel = LANGUAGES.find((l) => l.code === lang)?.label || lang;
  const extra = enabled
    .filter((c) => c !== lang && DISPLAYABLE_RESOURCE_LANGUAGES.has(c))
    .map((c) => LANGUAGES.find((l) => l.code === c)?.label || c);
  // Numbered rather than described, so the order reads as an order in every
  // script without a sentence of copy to translate sixteen times. One language
  // on its own has no order to show, so it is left unnumbered.
  const chain = [appLabel, ...extra];
  const summary = chain.length > 1
    ? chain.map((label, i) => `${i + 1}. ${label}`).join('  ·  ')
    : chain.join('  ·  ');

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
            {LANGUAGES.filter((l) => l.code !== lang && DISPLAYABLE_RESOURCE_LANGUAGES.has(l.code)).map((l) => {
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
