import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronDown, HandHeart, Quote } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { APP_NAME } from '../lib/brand';
import { CIRCLES, circleLabelKey } from '../lib/circles';
import { EVENTS, track } from '../lib/analytics';
import { localizeRef } from '../content/teaching';
import { useCircleTeaching } from '../hooks/useCircleTeaching';
import CircleRings from '../components/circles/CircleRings';
import { reducedMotion, useRingReveal } from '../hooks/useRingReveal';
import { CIRCLE_ICONS } from '../components/shared/circleIcons';
import Avatar from '../components/shared/Avatar';
import { PageHeader, PrimaryButton } from '../components/shared/Primitives';
import RiseMark from '../components/shared/RiseMark';
import VerseAccordion from '../components/VerseAccordion';

// "About Qetoret": the name, the access it rests on, the author's own word on
// how it began, the circles and the promises the app keeps — a short biblical
// foundation (docs/QETORET_IDENTITY.md), never a substitute for Scripture.
// Scripture is cited by reference only; tapping one unfolds the passage from
// the reader's Bible sources in place. No verse text is authored here.
const SECTIONS = [
  { id: 'name', titleKey: 'aboutNameTitle', bodyKey: 'aboutNameBody', refs: ['Exodus 30:7-8', 'Psalm 141:2', 'Revelation 5:8', 'Revelation 8:3-4'] },
  { id: 'access', titleKey: 'aboutAccessTitle', bodyKey: 'aboutAccessBody', refs: ['Hebrews 4:14-16', 'Hebrews 10:19-22', '1 Peter 2:9', 'Revelation 1:6'] },
];

// The author's testimony is theirs: first person, signed with their name and
// portrait (public/authors/). The name is not translated.
const AUTHOR = { name: 'Paul', photo: '/authors/paul.webp' };
const AUTHOR_REFS = ['Luke 1:5-17', '1 Peter 2:9', 'Ezekiel 22:30'];
const PORTRAIT_SIZE = 64;

// A section's references in one row; the one tapped opens beneath the row (a
// second tap, or another reference, closes it). One passage open at a time
// keeps the page a page, not a stack of quotations.
function References({ refs, lang }) {
  const [openRef, setOpenRef] = useState(null);
  const panelId = useId();
  return (
    <div className="about__refs-block">
      <ul className="about__refs">
        {refs.map((ref) => {
          const open = openRef === ref;
          return (
            <li key={ref}>
              <button
                type="button"
                onClick={() => setOpenRef(open ? null : ref)}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                className="scripture-ref"
              >
                <BookOpen size={13} aria-hidden="true" /> {localizeRef(ref, lang)}
              </button>
            </li>
          );
        })}
      </ul>
      {openRef && (
        <div id={panelId}>
          <VerseAccordion key={openRef} reference={localizeRef(openRef, lang)} lang={lang} defaultExpanded>
            {() => null}
          </VerseAccordion>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, labelledBy, className = '' }) {
  return (
    <section className={`about__section ${className}`} aria-labelledby={labelledBy}>
      <h2 id={labelledBy} className="q-section-title">{title}</h2>
      {children}
    </section>
  );
}

// The author's portrait over their initial: the initial is already right if
// the picture never arrives (offline, blocked), so nothing breaks or shifts.
function AuthorPortrait() {
  const [failed, setFailed] = useState(false);
  return (
    <span className="about-letter__portrait">
      <Avatar name={AUTHOR.name} size={PORTRAIT_SIZE} />
      {!failed && (
        <img
          src={AUTHOR.photo}
          alt=""
          width={PORTRAIT_SIZE}
          height={PORTRAIT_SIZE}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

// How Qetoret began, in the author's own words, as a short letter: the story,
// the passages it rests on straight after it, then the prayer it closes on and
// the signature, set at the end of the page like a letter's sign-off.
function AuthorWord({ lang }) {
  return (
    <Section title={t(lang, 'aboutStoryTitle')} labelledBy="about-story" className="about-letter">
      <article className="about-letter__card">
        <Quote className="about-letter__mark rtl-mirror" size={30} strokeWidth={1.4} aria-hidden="true" />
        <div className="about-letter__body">
          {t(lang, 'aboutStoryBody').split('\n\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <References refs={AUTHOR_REFS} lang={lang} />
        <footer className="about-letter__close">
          <p className="about-letter__prayer">{t(lang, 'aboutStoryPrayer')}</p>
          <p className="about-letter__signature">
            <span>{AUTHOR.name}</span>
            <AuthorPortrait />
          </p>
        </footer>
      </article>
    </Section>
  );
}

// The seven circles as one control: the rings are a drawing of the list's
// state (hover or focus previews a circle's reach; a tap on either opens it).
// An open circle says how to pray in it and offers two doors — start a prayer
// placed in it, or its own page. Breadth, never rank.
function AboutCircles({ lang, onPrayInCircle }) {
  const teaching = useCircleTeaching(lang);
  const ringsRef = useRef(null);
  const stage = useRingReveal(ringsRef);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const active = preview ?? selected;

  const toggle = (circle) => {
    const next = circle === selected ? null : circle;
    setSelected(next);
    if (!next) return;
    track(EVENTS.CIRCLE_TEACHING_OPENED, { source: 'about' });
    // Chosen on the rings above a phone's list: bring the opened circle into view.
    requestAnimationFrame(() => document.getElementById(`about-circle-${next}`)
      ?.scrollIntoView?.({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }));
  };

  const pray = (circle) => {
    track(EVENTS.CIRCLE_PRAYER_STARTED, { source: 'about' });
    onPrayInCircle(circle);
  };

  return (
    <Section title={t(lang, 'aboutCirclesTitle')} labelledBy="about-circles">
      <p className="about__body">{t(lang, 'aboutCirclesBody')}</p>
      <div className="about-circles">
        <div ref={ringsRef} className="about-circles__rings">
          <CircleRings active={active} stage={stage} onPreview={setPreview} onSelect={toggle} />
        </div>
        <div className="min-w-0">
          {teaching && <p className="about-circles__hint">{teaching.ui.choose}</p>}
          <ol className="about-circles__list">
            {CIRCLES.map((circle) => {
              const Icon = CIRCLE_ICONS[circle];
              const content = teaching?.circle(circle);
              const open = selected === circle;
              const panelId = `about-circle-${circle}-panel`;
              return (
                <li key={circle} id={`about-circle-${circle}`} className={`about-circle${open ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={open ? panelId : undefined}
                    onClick={() => toggle(circle)}
                    onPointerEnter={() => setPreview(circle)}
                    onPointerLeave={() => setPreview(null)}
                    onFocus={() => setPreview(circle)}
                    onBlur={() => setPreview(null)}
                    className={`about-circle__toggle${active === circle ? ' is-active' : ''}`}
                  >
                    <span className={`icon-tile tone-${circle}`} aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
                    <span className="about-circle__text">
                      <span className="about-circle__name">{t(lang, circleLabelKey(circle))}</span>
                      {content && <span className="about-circle__formation">{content.formation}</span>}
                    </span>
                    <ChevronDown className="about-circle__chevron" size={16} aria-hidden="true" />
                  </button>
                  {open && content && (
                    <div id={panelId} className="about-circle__panel">
                      <p>{content.summary}</p>
                      <div className="about-circle__actions">
                        {onPrayInCircle && (
                          <PrimaryButton icon={HandHeart} onClick={() => pray(circle)}>{content.cta}</PrimaryButton>
                        )}
                        <Link to={`/circles/${circle}`} state={{ from: '/about' }} className="quiet-button pressable">
                          <span>{teaching.ui.explore}</span>
                          <ArrowRight className="rtl-mirror" size={16} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </Section>
  );
}

export default function AboutTab({ onPrayInCircle }) {
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'fr';

  return (
    <div className="phase-page">
      <div className="phase-page__shell max-w-2xl">
        <PageHeader
          eyebrow={APP_NAME}
          title={t(lang, 'aboutTitle')}
          backTo="/more"
          backLabel={t(lang, 'moreTab')}
          backAriaLabel={`${t(lang, 'backBtn')}: ${t(lang, 'moreTab')}`}
        />
      </div>

      <div className="phase-content max-w-2xl">
        <p className="about__tagline">
          <RiseMark motion="still" size={28} />
          <span>{t(lang, 'aboutTagline')}</span>
        </p>

        {SECTIONS.map(({ id, titleKey, bodyKey, refs }) => (
          <Section key={id} title={t(lang, titleKey)} labelledBy={`about-${id}`}>
            <p className="about__body">{t(lang, bodyKey)}</p>
            <References refs={refs} lang={lang} />
          </Section>
        ))}

        <AuthorWord lang={lang} />

        <AboutCircles lang={lang} onPrayInCircle={onPrayInCircle} />

        <Section title={t(lang, 'aboutPromisesTitle')} labelledBy="about-promises">
          <p className="about__body">{t(lang, 'aboutPromisesBody')}</p>
        </Section>
      </div>
    </div>
  );
}
