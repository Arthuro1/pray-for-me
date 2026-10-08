import { useId, useState } from 'react';
import { BookOpen } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { APP_NAME } from '../lib/brand';
import { CIRCLES, circleLabelKey } from '../lib/circles';
import { localizeRef } from '../content/teaching';
import CircleGlyph from '../components/shared/CircleGlyph';
import { PageHeader } from '../components/shared/Primitives';
import RiseMark from '../components/shared/RiseMark';
import VerseAccordion from '../components/VerseAccordion';

// "About Qetoret": the name, the access it rests on, the story behind it, the
// movements, the circles and the promises the app keeps — a short biblical
// foundation (docs/QETORET_IDENTITY.md), never a substitute for Scripture.
// Scripture is cited by reference only; tapping one unfolds the passage from
// the reader's Bible sources in place. No verse text is authored here.
const MOVEMENTS = ['come', 'bring', 'carry', 'return', 'listen', 'respond', 'remember'];

const SECTIONS = [
  { id: 'name', titleKey: 'aboutNameTitle', bodyKey: 'aboutNameBody', refs: ['Exodus 30:7-8', 'Psalm 141:2', 'Revelation 5:8', 'Revelation 8:3-4'] },
  { id: 'access', titleKey: 'aboutAccessTitle', bodyKey: 'aboutAccessBody', refs: ['Hebrews 4:14-16', 'Hebrews 10:19-22', '1 Peter 2:9', 'Revelation 1:6'] },
  { id: 'story', titleKey: 'aboutStoryTitle', bodyKey: 'aboutStoryBody', refs: ['Luke 1:5-25', 'Luke 1:57-80'] },
];

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

function Section({ title, children, labelledBy }) {
  return (
    <section className="about__section" aria-labelledby={labelledBy}>
      <h2 id={labelledBy} className="q-section-title">{title}</h2>
      {children}
    </section>
  );
}

export default function AboutTab() {
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'fr';

  return (
    <div className="phase-page">
      <div className="phase-page__shell">
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
          <RiseMark animate={false} size={28} />
          <span>{t(lang, 'aboutTagline')}</span>
        </p>

        {SECTIONS.map(({ id, titleKey, bodyKey, refs }) => (
          <Section key={id} title={t(lang, titleKey)} labelledBy={`about-${id}`}>
            <p className="about__body">{t(lang, bodyKey)}</p>
            <References refs={refs} lang={lang} />
          </Section>
        ))}

        <Section title={t(lang, 'aboutMovementsTitle')} labelledBy="about-movements">
          <ol className="about__list">
            {MOVEMENTS.map((m) => <li key={m}>{t(lang, `aboutMove_${m}`)}</li>)}
          </ol>
        </Section>

        <Section title={t(lang, 'aboutCirclesTitle')} labelledBy="about-circles">
          <p className="about__body">{t(lang, 'aboutCirclesBody')}</p>
          <ol className="about__list about__list--circles">
            {CIRCLES.map((circle) => (
              <li key={circle}>
                <CircleGlyph circle={circle} size={22} />
                {t(lang, circleLabelKey(circle))}
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t(lang, 'aboutPromisesTitle')} labelledBy="about-promises">
          <p className="about__body">{t(lang, 'aboutPromisesBody')}</p>
        </Section>
      </div>
    </div>
  );
}
