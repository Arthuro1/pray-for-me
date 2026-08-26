import { BookOpen } from 'lucide-react';
import { localizeRef } from '../../content/teaching';
import VerseAccordion from '../VerseAccordion';

// A verse reference as a tappable pill that expands the passage in place.
// Authoritative Scripture only — VerseAccordion never generates or translates
// Bible text, and falls back to a link into the reader's own Bible.
//
// Shared by every surface that cites a plan's Scripture (the plan preview modal,
// a plan day's related passages, role reflections) so one pill is styled and
// labelled once.
export default function VersePill({ reference, lang, tone = 'accent' }) {
  const label = localizeRef(reference, lang);
  const panelStyle = tone === 'quiet'
    ? { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }
    : { background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' };

  return (
    <VerseAccordion reference={label} lang={lang} panelStyle={panelStyle}>
      {({ toggle, expanded }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
          style={tone === 'quiet'
            ? { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }
            : { background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <BookOpen size={11} aria-hidden="true" /> {label}
        </button>
      )}
    </VerseAccordion>
  );
}
