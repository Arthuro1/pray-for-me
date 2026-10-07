import { useEffect, useId, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { QuietButton, StatusLabel } from '../shared/Primitives';
import { loadCircleDeep, localizeCircleDeep } from '../../content/intercessionCircles';
import { isCircleDeepDraft } from '../../lib/circleReview';

// A heading whose button opens one section — the accessible accordion pattern.
function SectionToggle({ as: Tag, id, open, onToggle, children }) {
  return (
    <Tag className="circle-deep__toggle-heading">
      <button
        type="button"
        id={`${id}-button`}
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="q-disclosure pressable"
      >
        <span>{children}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </Tag>
  );
}

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

// The deep layer of one circle: what it means, how to pray it (for My heart,
// Qetoret's seven foundations, named as Qetoret's framework), every Scripture
// anchor, and questions to reflect on — one section open at a time so it never
// becomes a wall of text. Drafts carry their "review pending" label.
export default function CircleDeepTeaching({
  id, circle, themes, refs, ui, lang, ScriptureRef, onPray, headingLevel = 4,
}) {
  const [raw, setRaw] = useState(null);
  const [section, setSection] = useState('meaning');
  const [theme, setTheme] = useState(null);
  const Sub = `h${headingLevel}`;
  const Item = `h${Math.min(headingLevel + 1, 6)}`;

  useEffect(() => {
    let current = true;
    loadCircleDeep(circle).then((deep) => { if (current) setRaw(deep); });
    return () => { current = false; };
  }, [circle]);

  const deep = useMemo(() => localizeCircleDeep(raw, lang), [raw, lang]);
  if (!deep) return <div id={id} className="circle-deep" aria-busy="true" />;

  const titleOf = (themeId) => themes.find((t) => t.id === themeId)?.title || themeId;
  const toggle = (name) => () => setSection((open) => (open === name ? null : name));
  const sections = [
    {
      name: 'meaning',
      label: ui.meaning,
      body: <p className="circle-deep__body">{deep.meaning}</p>,
    },
    {
      name: 'pray',
      label: deep.framework?.title || ui.prayFor,
      body: (
        <>
          {deep.framework && <p className="circle-deep__note">{deep.framework.note}</p>}
          <ul className="circle-deep__themes">
            {deep.themes.map((item) => {
              const open = theme === item.id;
              const themeId = `${id}-theme-${item.id}`;
              return (
                <li key={item.id}>
                  <SectionToggle as={Item} id={themeId} open={open} onToggle={() => setTheme(open ? null : item.id)}>
                    {titleOf(item.id)}
                  </SectionToggle>
                  {open && (
                    <div id={themeId} role="region" aria-labelledby={`${themeId}-button`} className="circle-deep__theme rise-in">
                      <p className="circle-deep__body">{item.body}</p>
                      {item.facets.length > 0 && (
                        <FruitFacets label={titleOf(item.id)} facets={item.facets} ui={ui} lang={lang} ScriptureRef={ScriptureRef} onPray={onPray} />
                      )}
                      <ul className="circle-teaching__refs">
                        {item.refs.map((ref) => <li key={ref}><ScriptureRef reference={ref} lang={lang} /></li>)}
                      </ul>
                      <PromptList prompts={item.prompts} ui={ui} onPray={onPray} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      ),
    },
    {
      name: 'scripture',
      label: ui.scripture,
      body: (
        <ul className="circle-teaching__refs">
          {refs.map((ref) => <li key={ref}><ScriptureRef reference={ref} lang={lang} /></li>)}
        </ul>
      ),
    },
    {
      name: 'reflect',
      label: ui.reflect,
      body: (
        <ul className="circle-deep__questions">
          {deep.reflection.map((question) => <li key={question}>{question}</li>)}
        </ul>
      ),
    },
  ];

  return (
    <div id={id} className="circle-deep rise-in">
      {isCircleDeepDraft(circle) && <StatusLabel tone="sacred" className="circle-deep__draft">{ui.draft}</StatusLabel>}
      {sections.map(({ name, label, body }) => {
        const sectionId = `${id}-${name}`;
        const open = section === name;
        return (
          <div key={name} className="circle-deep__section">
            <SectionToggle as={Sub} id={sectionId} open={open} onToggle={toggle(name)}>{label}</SectionToggle>
            {open && <div id={sectionId} role="region" aria-labelledby={`${sectionId}-button`} className="circle-deep__panel">{body}</div>}
          </div>
        );
      })}
    </div>
  );
}
