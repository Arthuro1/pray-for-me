import { useId, useState } from 'react';
import { Bell, ChevronDown, Globe, HeartHandshake, Lock, Smartphone, WifiOff } from 'lucide-react';

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

function Question({ q, a }) {
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
        <span>{q}</span>
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

      <section id="questions" className="landing-faq" aria-labelledby="landing-faq-title">
        <h2 id="landing-faq-title" className="landing__heading">{c.faqTitle}</h2>
        <div className="landing__faq">
          {c.faqs.map((faq) => <Question key={faq.q} {...faq} />)}
        </div>
      </section>
    </>
  );
}
