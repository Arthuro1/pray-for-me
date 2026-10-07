import { useState } from 'react';
import { HandHeart } from 'lucide-react';
import CircleGlyph from '../shared/CircleGlyph';
import { PrimaryButton, QuietButton, SectionLabel } from '../shared/Primitives';
import { KEY_REF_COUNT } from '../../content/intercessionCircles';
import { canShowCircleDeep } from '../../lib/circleReview';
import CircleDeepTeaching from './CircleDeepTeaching';

// One circle's teaching, as a doorway into prayer: its name, a heading, the
// formation it asks of us, a sentence or two, the themes Scripture teaches us to
// pray for, a few anchors, and a call to pray. The deep layer opens beneath on
// request, only where its review gate allows it.
//
// Shell-independent on purpose: the landing page uses it now and the app will
// later. The host supplies the circle's display name (each shell already names
// the circles), the Scripture reference control (the landing loads the reader
// on demand; the app has it at hand) and what praying means there.
//
// `teaching` is localizeCircle()'s output and `ui` localizeCircleUi()'s, both in
// `lang`. `onPray({ prompt })` starts a prayer; the composer it opens never
// writes the person's words for them.
export default function CircleTeaching({
  teaching, ui, lang, name, ScriptureRef, onPray, id, headingLevel = 3, className = '',
}) {
  const [deepOpen, setDeepOpen] = useState(false);
  const Heading = `h${headingLevel}`;
  const Sub = `h${headingLevel + 1}`;
  const headingId = `${id}-heading`;
  const deepId = `${id}-deep`;
  const deepAllowed = canShowCircleDeep(teaching.id);

  return (
    <section id={id} className={`circle-teaching ${className}`} aria-labelledby={headingId}>
      <div className="circle-teaching__intro">
        <SectionLabel sacred className="circle-teaching__label">
          <CircleGlyph circle={teaching.id} size={18} selected />
          <span>{name}</span>
        </SectionLabel>
        <Heading id={headingId} className="circle-teaching__heading">{teaching.heading}</Heading>
        <p className="circle-teaching__formation">{teaching.formation}</p>
      </div>

      <div className="circle-teaching__body">
        <p className="circle-teaching__summary">{teaching.summary}</p>

        <Sub className="section-label circle-teaching__sub">{ui.prayFor}</Sub>
        <ul className="circle-teaching__themes">
          {teaching.themes.map((theme) => <li key={theme.id}>{theme.title}</li>)}
        </ul>

        <Sub className="section-label circle-teaching__sub">{ui.scripture}</Sub>
        <ul className="circle-teaching__refs">
          {teaching.refs.slice(0, KEY_REF_COUNT).map((ref) => (
            <li key={ref}><ScriptureRef reference={ref} lang={lang} /></li>
          ))}
        </ul>

        <div className="circle-teaching__actions">
          <PrimaryButton icon={HandHeart} onClick={() => onPray({})}>{teaching.cta}</PrimaryButton>
          {deepAllowed && (
            <QuietButton aria-expanded={deepOpen} aria-controls={deepId} onClick={() => setDeepOpen((open) => !open)}>
              {deepOpen ? ui.exploreLess : ui.explore}
            </QuietButton>
          )}
        </div>

        {deepAllowed && deepOpen && (
          <CircleDeepTeaching
            id={deepId}
            circle={teaching.id}
            themes={teaching.themes}
            refs={teaching.refs}
            ui={ui}
            lang={lang}
            ScriptureRef={ScriptureRef}
            onPray={onPray}
            headingLevel={headingLevel + 1}
          />
        )}
      </div>
    </section>
  );
}
