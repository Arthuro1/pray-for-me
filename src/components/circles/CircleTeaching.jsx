import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, HandHeart } from 'lucide-react';
import CircleGlyph from '../shared/CircleGlyph';
import { PrimaryButton, SectionLabel, StatusLabel } from '../shared/Primitives';
import { KEY_REF_COUNT, loadCircleDeep, localizeCircleDeep } from '../../content/intercessionCircles';
import { canShowCircleDeep, isCircleDeepDraft, isCircleTranslationDraft } from '../../lib/circleReview';
import CircleThemeSheet from './CircleThemeSheet';

// One circle's teaching, as a doorway into prayer, on one page with no folds:
// its name, a heading, the formation it asks of us, a sentence or two and the
// call to pray; then what to pray for, as cards; then — in the full layout —
// what the circle means and questions to reflect on; then the passages.
//
// A theme card opens a sheet with that theme's teaching, passages and prayers,
// when the circle's deep layer may be shown (its review gate). Otherwise the
// themes are plain tiles.
//
// Shell-independent on purpose: the landing page shows the brief layout, the
// app's circle page the full one. The host supplies the circle's display name
// (each shell already names the circles), the word for closing a sheet, the
// line inviting a tap on the fruit of the Spirit's facets, the Scripture
// reference control (the landing loads the reader on demand; the app has it at
// hand) and what praying means there.
//
// `teaching` is localizeCircle()'s output and `ui` localizeCircleUi()'s, both in
// `lang`. `onPray({ prompt, guide })` starts a prayer: `prompt` is the prayer
// chosen, if any, and `guide` the theme or facet it belongs to, so the host can
// open its composer ready to pray it (lib/circlePrayer.js).
function useCircleDeep(circle, allowed, lang) {
  const [raw, setRaw] = useState(null);
  useEffect(() => {
    if (!allowed) return undefined;
    let current = true;
    loadCircleDeep(circle).then((deep) => { if (current) setRaw(deep); });
    return () => { current = false; };
  }, [circle, allowed]);
  return useMemo(() => (raw?.id === circle ? localizeCircleDeep(raw, lang) : null), [raw, circle, lang]);
}

function ThemeCards({ themes, deep, onOpen }) {
  const deepById = new Map((deep?.themes || []).map((theme) => [theme.id, theme]));
  return (
    <ul className="circle-themes">
      {themes.map((theme) => (
        <li key={theme.id}>
          {deepById.has(theme.id) ? (
            <button type="button" onClick={() => onOpen(theme.id)} className="circle-theme pressable">
              <span className="circle-theme__title">{theme.title}</span>
              <ChevronRight size={16} className="circle-theme__chevron rtl-mirror" aria-hidden="true" />
            </button>
          ) : (
            <span className="circle-theme circle-theme--plain">
              <span className="circle-theme__title">{theme.title}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function CircleTeaching({
  teaching, ui, lang, name, closeLabel, facetHint = null, ScriptureRef, onPray, id, headingLevel = 3, layout = 'full', className = '',
}) {
  const [openTheme, setOpenTheme] = useState(null);
  const Heading = `h${headingLevel}`;
  const Sub = `h${headingLevel + 1}`;
  const headingId = `${id}-heading`;
  const full = layout === 'full';
  const deep = useCircleDeep(teaching.id, canShowCircleDeep(teaching.id), lang);
  const refs = full && deep ? teaching.refs : teaching.refs.slice(0, KEY_REF_COUNT);
  const titleOf = (themeId) => teaching.themes.find((theme) => theme.id === themeId)?.title || themeId;
  const sheetTheme = openTheme && deep?.themes.find((theme) => theme.id === openTheme);

  return (
    <section id={id} className={`circle-teaching ${className}`} aria-labelledby={headingId}>
      <div className="circle-teaching__intro">
        <SectionLabel sacred className="circle-teaching__label">
          <CircleGlyph circle={teaching.id} size={18} selected />
          <span>{name}</span>
        </SectionLabel>
        <Heading id={headingId} className="circle-teaching__heading">{teaching.heading}</Heading>
        <p className="circle-teaching__formation">{teaching.formation}</p>
        {/* An AI-drafted language says so until a named human approves it
            (content/intercessionCircles/review.js). */}
        {isCircleTranslationDraft(lang) && (
          <StatusLabel tone="sacred" className="circle-teaching__draft">{ui.draftTranslation}</StatusLabel>
        )}
      </div>

      <div className="circle-teaching__body">
        <p className="circle-teaching__summary">{teaching.summary}</p>
        <div className="circle-teaching__actions">
          <PrimaryButton icon={HandHeart} onClick={() => onPray({})}>{teaching.cta}</PrimaryButton>
        </div>

        <Sub className="section-label circle-teaching__sub">{deep?.framework?.title || ui.prayFor}</Sub>
        {deep && isCircleDeepDraft(teaching.id) && <StatusLabel tone="sacred" className="circle-deep__draft">{ui.draft}</StatusLabel>}
        {deep?.framework && <p className="circle-deep__note">{deep.framework.note}</p>}
        <ThemeCards themes={teaching.themes} deep={deep} onOpen={setOpenTheme} />

        {full && deep && (
          <>
            <Sub className="section-label circle-teaching__sub">{ui.meaning}</Sub>
            <p className="circle-deep__body">{deep.meaning}</p>

            <Sub className="section-label circle-teaching__sub">{ui.reflect}</Sub>
            <ul className="circle-deep__questions">
              {deep.reflection.map((question) => <li key={question}>{question}</li>)}
            </ul>
          </>
        )}

        <Sub className="section-label circle-teaching__sub">{ui.scripture}</Sub>
        <ul className="circle-teaching__refs">
          {refs.map((ref) => <li key={ref}><ScriptureRef reference={ref} lang={lang} /></li>)}
        </ul>
      </div>

      {sheetTheme && (
        <CircleThemeSheet
          circleName={name}
          title={titleOf(sheetTheme.id)}
          theme={sheetTheme}
          ui={ui}
          lang={lang}
          ScriptureRef={ScriptureRef}
          onPray={onPray}
          onClose={() => setOpenTheme(null)}
          closeLabel={closeLabel}
          facetHint={facetHint}
        />
      )}
    </section>
  );
}
