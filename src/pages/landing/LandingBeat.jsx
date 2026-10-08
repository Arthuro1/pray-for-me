import ScriptureRefButton from '../../components/circles/ScriptureRefButton';

// A row of Scripture references, by reference only: each one opens the
// passage in place from the reader's Bible sources, never authored text.
// References are written once in English and localized at render.
export function LandingRefs({ refs, lang, className = '' }) {
  return (
    <ul className={`landing__refs ${className}`}>
      {refs.map((ref) => (
        <li key={ref}><ScriptureRefButton reference={ref} lang={lang} /></li>
      ))}
    </ul>
  );
}

// The movement a section belongs to, in small capitals over a short gold
// stroke — the same eyebrow on every step of the story.
export function BeatLabel({ children }) {
  return <p className="landing-beat__label section-label section-label--sacred">{children}</p>;
}

// One step of the story: the words on one side, the app itself on the other
// (`visual`), alternating sides down the page (`flip`). On a phone the words
// come first, then what they describe.
export default function LandingBeat({ id, label, title, body, refs, lang, flip = false, visual, children }) {
  const titleId = `landing-${id}-title`;
  return (
    <section id={id} className={`landing-beat${flip ? ' landing-beat--flip' : ''}`} aria-labelledby={titleId}>
      <div className="landing-beat__copy">
        <BeatLabel>{label}</BeatLabel>
        <h2 id={titleId} className="landing__heading">{title}</h2>
        <p className="landing__text">{body}</p>
        {refs && <LandingRefs refs={refs} lang={lang} />}
        {children}
      </div>
      <div className="landing-beat__visual">{visual}</div>
    </section>
  );
}
