import { useId, useState } from 'react';
import { X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { BottomSheet, QuietButton, SectionLabel } from '../shared/Primitives';

// A prayer prompt and the way to begin from it. The prompt is a starting
// point: "Pray this" opens the composer with it shown ABOVE an empty field,
// never written into the person's own words.
function PromptList({ prompts, ui, onPray }) {
  const base = useId();
  return (
    <ul className="circle-deep__prompts">
      {prompts.map((prompt, i) => (
        <li key={prompt}>
          <p id={`${base}-${i}`} className="circle-deep__prompt">{prompt}</p>
          <QuietButton aria-describedby={`${base}-${i}`} onClick={() => onPray({ prompt })}>{ui.prayThis}</QuietButton>
        </li>
      ))}
    </ul>
  );
}

// The fruit of the Spirit: one fruit, nine facets, one palette. Choosing a
// facet shows a line about it, a passage and a prayer — never a score, a
// count, or which ones are "done".
function FruitFacets({ label, facets, ui, lang, ScriptureRef, onPray }) {
  const [chosen, setChosen] = useState(null);
  const facet = facets.find((f) => f.id === chosen) || null;
  return (
    <div className="circle-deep__facets">
      <div className="circle-deep__facet-row" role="group" aria-label={label}>
        {facets.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={chosen === f.id}
            onClick={() => setChosen((current) => (current === f.id ? null : f.id))}
            className="circle-deep__facet pressable"
          >
            {f.title}
          </button>
        ))}
      </div>
      {facet && (
        <div className="circle-deep__facet-detail rise-in" key={facet.id}>
          <p className="circle-deep__body">{facet.body}</p>
          <ScriptureRef reference={facet.ref} lang={lang} />
          <PromptList prompts={facet.prompts} ui={ui} onPray={onPray} />
        </div>
      )}
    </div>
  );
}

// One theme of a circle ("Unity", "Pastors and leaders"), opened from its card:
// a sentence on what to pray for, the passages behind it and prayers to begin
// from. Choosing a prayer closes the sheet and starts praying.
export default function CircleThemeSheet({ circleName, title, theme, ui, lang, ScriptureRef, onPray, onClose, closeLabel }) {
  const trapRef = useFocusTrap();
  const titleId = useId();
  useEscapeKey(onClose);
  const pray = (payload) => {
    onClose();
    onPray(payload);
  };
  return (
    <BottomSheet ref={trapRef} aria-labelledby={titleId} className="circle-sheet">
      <div className="circle-sheet__head">
        <div className="min-w-0">
          <SectionLabel sacred>{circleName}</SectionLabel>
          <h2 id={titleId} className="circle-sheet__title">{title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label={closeLabel} className="icon-button pressable">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <p className="circle-deep__body">{theme.body}</p>
      {theme.facets.length > 0 && (
        <FruitFacets label={title} facets={theme.facets} ui={ui} lang={lang} ScriptureRef={ScriptureRef} onPray={pray} />
      )}
      <ul className="circle-teaching__refs circle-sheet__refs">
        {theme.refs.map((ref) => <li key={ref}><ScriptureRef reference={ref} lang={lang} /></li>)}
      </ul>
      <PromptList prompts={theme.prompts} ui={ui} onPray={pray} />
    </BottomSheet>
  );
}
