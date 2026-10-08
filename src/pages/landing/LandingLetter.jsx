import { useId, useState } from 'react';
import { ChevronDown, Quote } from 'lucide-react';
import { AUTHOR, AUTHOR_REFS } from '../../content/author';
import { BeatLabel, LandingRefs } from './LandingBeat';

// The author's word, as on the About page and in the same words (a guard
// test keeps the two identical): the line it is remembered by, then the
// letter folded after its first paragraph. Unfolded, it ends as a letter
// ends — its passages, the closing prayer, the signature.

// The portrait over the author's initial: the initial is already right if the
// picture never arrives (offline, blocked), so nothing breaks or shifts.
function AuthorPortrait() {
  const [failed, setFailed] = useState(false);
  return (
    <span className="about-letter__portrait landing-letter__portrait">
      <span className="landing-letter__initial" aria-hidden="true">{AUTHOR.name.charAt(0)}</span>
      {!failed && (
        <img
          src={AUTHOR.photo}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export default function LandingLetter({ copy, lang }) {
  const { letter } = copy;
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const [first, ...rest] = letter.storyBody.split('\n\n');

  return (
    <section id="letter" className="landing-letter" aria-labelledby="landing-letter-title">
      <article className="about-letter__card landing-letter__card">
        <Quote className="about-letter__mark rtl-mirror" size={30} strokeWidth={1.4} aria-hidden="true" />
        <BeatLabel>{letter.title}</BeatLabel>
        <h2 id="landing-letter-title" className="landing-letter__quote">{letter.quote}</h2>
        <p className="landing-letter__byline">
          <AuthorPortrait />
          <span>{AUTHOR.name}</span>
        </p>

        {/* One body, so only the closing paragraph reads a shade brighter. */}
        <div id={bodyId} className="about-letter__body">
          <p>{first}</p>
          {open && rest.map((paragraph) => <p key={paragraph} className="landing-letter__more">{paragraph}</p>)}
        </div>

        {open && (
          <div className="landing-letter__rest">
            <LandingRefs refs={AUTHOR_REFS} lang={lang} />
            <footer className="about-letter__close">
              <p className="about-letter__prayer">{letter.prayer}</p>
              <p className="about-letter__signature">{AUTHOR.name}</p>
            </footer>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="quiet-button pressable landing-letter__toggle"
        >
          <span>{open ? letter.readLess : letter.readMore}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </article>
    </section>
  );
}
