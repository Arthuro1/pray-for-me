import { useId, useState } from 'react';
import {
  Bell, BookOpen, ChevronDown, Church, Globe, HeartHandshake, Lightbulb, Lock, Smartphone, UserRound, Users, WifiOff,
} from 'lucide-react';
import { getAiProviderLabel } from '../../lib/aiProvider';

// What a visitor needs to trust the place before praying in it: the practical
// facts in one strip, always visible, then the questions people ask. The
// story above already shows the features themselves.

// One icon and hue per fact, in the order of `facts.items` in the locale:
// private, offline, install, languages, reminders, free.
const FACTS = [
  { icon: Lock, tone: 'plum' },
  { icon: WifiOff, tone: 'teal' },
  { icon: Smartphone, tone: 'indigo' },
  { icon: Globe, tone: 'sky' },
  { icon: Bell, tone: 'amber' },
  { icon: HeartHandshake, tone: 'rose' },
];

// One icon and hue per question, in the order of `content.faqs` in the
// locale: private, account, AI, Scripture suggestions, social network,
// churches, languages, free. A question a fact also answers wears its mark.
const FAQ_MARKS = [
  { icon: Lock, tone: 'plum' },
  { icon: UserRound, tone: 'indigo' },
  { icon: Lightbulb, tone: 'amber' },
  { icon: BookOpen, tone: 'teal' },
  { icon: Users, tone: 'clay' },
  { icon: Church, tone: 'church' },
  { icon: Globe, tone: 'sky' },
  { icon: HeartHandshake, tone: 'rose' },
];

function Question({ q, a, mark: { icon: Icon, tone } }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  return (
    <div className={`landing__faq-item q-card${open ? ' is-open' : ''}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? answerId : undefined}
        className="landing__faq-question"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`icon-tile tone-${tone}`} aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
        <span className="landing__faq-q">{q}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && <p id={answerId} className="landing__faq-answer">{a}</p>}
    </div>
  );
}

export default function LandingTrust({ copy }) {
  const { facts, content: c } = copy;
  return (
    <>
      <section className="landing-facts" aria-labelledby="landing-facts-title">
        <h2 id="landing-facts-title" className="landing__heading">{facts.title}</h2>
        <ul className="landing-facts__list">
          {facts.items.map(({ title, desc }, i) => {
            const { icon: Icon, tone } = FACTS[i];
            return (
              <li key={title} className="landing-fact">
                <span className={`icon-tile tone-${tone}`} aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
                <div className="min-w-0">
                  <h3 className="landing-fact__title">{title}</h3>
                  <p className="landing-fact__desc">{desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* The heading beside the questions where there is room; above them on a
          phone. */}
      <section id="questions" className="landing-faq" aria-labelledby="landing-faq-title">
        <div className="landing-faq__head">
          <h2 id="landing-faq-title" className="landing__heading">{c.faqTitle}</h2>
          <p className="landing-faq__intro">{c.faqIntro}</p>
        </div>
        <div className="landing__faq">
          {c.faqs.map((faq, i) => (
            <Question
              key={faq.q}
              {...faq}
              a={faq.a.replace('{provider}', getAiProviderLabel())}
              mark={FAQ_MARKS[i]}
            />
          ))}
        </div>
      </section>
    </>
  );
}
