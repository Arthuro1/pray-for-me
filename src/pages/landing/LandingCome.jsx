import { Flame } from 'lucide-react';
import LatinCross from '../../components/shared/LatinCross';
import { ACCESS_REFS, NAME_REFS } from '../../content/identity';
import { BeatLabel, LandingRefs } from './LandingBeat';

// Come — where the story begins: Zechariah went in to offer the incense, and
// through Christ every believer may now draw near. Then, as on the About page,
// what the name means and why anyone may come at all — identity before
// activity, and the app named as a tool, never a go-between.
export default function LandingCome({ copy, label, lang }) {
  const { come } = copy;
  const cards = [
    { id: 'name', icon: Flame, tone: 'amber', title: come.nameTitle, body: come.nameBody, refs: NAME_REFS },
    { id: 'christ', icon: LatinCross, tone: 'plum', title: come.christTitle, body: come.christBody, refs: ACCESS_REFS },
  ];

  return (
    <section id="come" className="landing-come" aria-labelledby="landing-come-title">
      <div className="landing-come__intro">
        <BeatLabel>{label}</BeatLabel>
        <h2 id="landing-come-title" className="landing__heading">{come.title}</h2>
        <p className="landing__text">{come.body}</p>
      </div>
      <div className="landing-come__cards">
        {cards.map(({ id, icon: Icon, tone, title, body, refs }) => (
          <section key={id} className="landing-card q-card" aria-labelledby={`landing-come-${id}`}>
            <span className={`icon-tile tone-${tone}`} aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
            <h3 id={`landing-come-${id}`} className="landing-card__title">{title}</h3>
            <p className="landing-card__body">{body}</p>
            <LandingRefs refs={refs} lang={lang} />
          </section>
        ))}
      </div>
    </section>
  );
}
