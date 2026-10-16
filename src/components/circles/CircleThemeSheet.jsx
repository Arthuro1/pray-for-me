import { useId, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { BottomSheet, QuietButton, SectionLabel } from '../shared/Primitives';

// A prayer prompt and the way to begin from it. "Pray this" hands the host the
// prompt and a `guide` to what it belongs to (the theme or the facet: its
// title, words, prayers and passages), so the app can open the prayer form
// ready to pray it (lib/circlePrayer.js).
function PromptList({ prompts, guide, ui, onPray }) {
  const base = useId();
  return (
    <ul className="circle-deep__prompts">
      {prompts.map((prompt, i) => (
        <li key={prompt}>
          <p id={`${base}-${i}`} className="circle-deep__prompt">{prompt}</p>
          <QuietButton aria-describedby={`${base}-${i}`} onClick={() => onPray({ prompt, guide })}>{ui.prayThis}</QuietButton>
        </li>
      ))}
    </ul>
  );
}

// The fruit of the Spirit: one fruit, nine facets, one palette. The facets are
// chips that plainly invite a tap; choosing one opens a card beneath with a
// line about it, a passage and a prayer — never a score, a count, or which ones
// are "done".
function FruitFacets({ label, hint, theme, ui, lang, ScriptureRef, onPray }) {
  const [chosen, setChosen] = useState(null);
  const detailId = useId();
  const facet = theme.facets.find((f) => f.id === chosen) || null;
  const guideOf = (f) => ({
    title: `${label} — ${f.title}`,
    body: f.body,
    prompts: f.prompts,
    refs: [f.ref, ...theme.refs],
    points: [],
  });
  return (
    <div className="circle-deep__facets">
      {hint && <p className="circle-deep__facet-hint">{hint}</p>}
      <div className="circle-deep__facet-row" role="group" aria-label={label}>
        {theme.facets.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={chosen === f.id}
            aria-controls={chosen === f.id ? detailId : undefined}
            onClick={() => setChosen((current) => (current === f.id ? null : f.id))}
            className="circle-deep__facet pressable"
          >
            <span>{f.title}</span>
            <ChevronDown size={14} aria-hidden="true" className="circle-deep__facet-chevron" />
          </button>
        ))}
      </div>
      {facet && (
        <div id={detailId} className="circle-deep__facet-detail rise-in" key={facet.id}>
          <h3 className="circle-deep__facet-title">{facet.title}</h3>
          <p className="circle-deep__body">{facet.body}</p>
          <ScriptureRef reference={facet.ref} lang={lang} />
          <PromptList prompts={facet.prompts} guide={guideOf(facet)} ui={ui} onPray={onPray} />
        </div>
      )}
    </div>
  );
}

// One theme of a circle ("Unity", "Pastors and leaders"), opened from its card:
// a sentence on what to pray for, the passages behind it and prayers to begin
// from. Choosing a prayer closes the sheet and starts praying.
export default function CircleThemeSheet({ circleName, title, theme, ui, lang, ScriptureRef, onPray, onClose, closeLabel, facetHint = null }) {
  const trapRef = useFocusTrap();
  const titleId = useId();
  useEscapeKey(onClose);
  const pray = (payload) => {
    onClose();
    onPray(payload);
  };
  const guide = {
    title,
    body: theme.body,
    prompts: theme.prompts,
    refs: theme.refs,
    points: theme.facets.map((f) => ({ title: f.title, prompt: f.prompts[0], ref: f.ref })),
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
        <FruitFacets label={title} hint={facetHint} theme={theme} ui={ui} lang={lang} ScriptureRef={ScriptureRef} onPray={pray} />
      )}
      <ul className="circle-teaching__refs circle-sheet__refs">
        {theme.refs.map((ref) => <li key={ref}><ScriptureRef reference={ref} lang={lang} /></li>)}
      </ul>
      <PromptList prompts={theme.prompts} guide={guide} ui={ui} onPray={pray} />
    </BottomSheet>
  );
}
