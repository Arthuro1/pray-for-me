import { BookOpen } from 'lucide-react';
import { localizeRef } from '../../content/teaching';
import VerseAccordion from '../VerseAccordion';

// A Scripture reference you can open in place: the reference in temple gold
// (gold marks what is sacred), never a filled pill. Authoritative Scripture
// only — VerseAccordion never generates or translates Bible text, and falls
// back to a link into the reader's own Bible.
//
// Shared by every surface that cites a plan's Scripture (the plan preview, a
// plan day's related passages, role reflections) so one reference is styled
// and labelled once.
export default function VersePill({ reference, lang }) {
  const label = localizeRef(reference, lang);
  return (
    <VerseAccordion reference={label} lang={lang}>
      {({ toggle, expanded }) => (
        <button type="button" onClick={toggle} aria-expanded={expanded} className="scripture-ref">
          <BookOpen size={13} aria-hidden="true" /> {label}
        </button>
      )}
    </VerseAccordion>
  );
}
