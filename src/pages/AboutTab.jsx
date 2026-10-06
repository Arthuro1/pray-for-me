import { BookOpen } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { APP_NAME } from '../lib/brand';
import { CIRCLES, circleLabelKey } from '../lib/circles';
import { localizeRef } from '../content/teaching';
import { bibleLink } from '../utils/bibleLink';
import { CIRCLE_ICONS } from '../components/shared/circleIcons';
import { PageHeader } from '../components/shared/Primitives';
import RiseMark from '../components/shared/RiseMark';

// "About Qetoret": the name, the access it rests on, the story behind it, the
// movements, the circles and the promises the app keeps — a short biblical
// foundation (docs/QETORET_IDENTITY.md), never a substitute for Scripture.
// Scripture is cited by reference only and opens in the reader's own Bible;
// no verse text is authored here.
const MOVEMENTS = ['come', 'bring', 'carry', 'return', 'listen', 'respond', 'remember'];

const SECTIONS = [
  { id: 'name', titleKey: 'aboutNameTitle', bodyKey: 'aboutNameBody', refs: ['Exodus 30:7-8', 'Psalm 141:2', 'Revelation 5:8', 'Revelation 8:3-4'] },
  { id: 'access', titleKey: 'aboutAccessTitle', bodyKey: 'aboutAccessBody', refs: ['Hebrews 4:14-16', 'Hebrews 10:19-22', '1 Peter 2:9', 'Revelation 1:6'] },
  { id: 'story', titleKey: 'aboutStoryTitle', bodyKey: 'aboutStoryBody', refs: ['Luke 1:5-25', 'Luke 1:57-80'] },
];

function References({ refs, lang }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {refs.map((ref) => {
        const label = localizeRef(ref, lang);
        return (
          <li key={ref}>
            <a
              href={bibleLink(ref, lang)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium"
              style={{ background: 'var(--q-selected)', color: 'var(--q-royal-text)' }}
            >
              <BookOpen size={11} aria-hidden="true" /> {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Section({ title, children, labelledBy }) {
  return (
    <section className="mb-8" aria-labelledby={labelledBy}>
      <h2 id={labelledBy} className="editorial-heading mb-2 text-2xl" style={{ color: 'var(--q-text)' }}>{title}</h2>
      {children}
    </section>
  );
}

export default function AboutTab() {
  const settings = usePrayerStore((s) => s.settings);
  const lang = settings.language || 'fr';

  return (
    <div className="phase-page constellation-more">
      <div className="phase-page__shell">
        <PageHeader eyebrow={APP_NAME} title={t(lang, 'aboutTitle')} />
      </div>

      <div className="phase-content max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <RiseMark animate={false} size={32} />
          <p className="editorial text-xl" style={{ color: 'var(--q-royal-text)' }}>{t(lang, 'aboutTagline')}</p>
        </div>

        {SECTIONS.map(({ id, titleKey, bodyKey, refs }) => (
          <Section key={id} title={t(lang, titleKey)} labelledBy={`about-${id}`}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, bodyKey)}</p>
            <References refs={refs} lang={lang} />
          </Section>
        ))}

        <Section title={t(lang, 'aboutMovementsTitle')} labelledBy="about-movements">
          <ol className="space-y-2">
            {MOVEMENTS.map((m) => (
              <li key={m} className="text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>
                {t(lang, `aboutMove_${m}`)}
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t(lang, 'aboutCirclesTitle')} labelledBy="about-circles">
          <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'aboutCirclesBody')}</p>
          <ol className="flex flex-wrap gap-2">
            {CIRCLES.map((circle) => {
              const Icon = CIRCLE_ICONS[circle];
              return (
                <li key={circle} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium" style={{ background: 'var(--q-surface)', border: '1px solid var(--q-border)', color: 'var(--q-text-secondary)' }}>
                  <Icon size={13} aria-hidden="true" style={{ color: 'var(--q-royal-text)' }} /> {t(lang, circleLabelKey(circle))}
                </li>
              );
            })}
          </ol>
        </Section>

        <Section title={t(lang, 'aboutPromisesTitle')} labelledBy="about-promises">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'aboutPromisesBody')}</p>
        </Section>
      </div>
    </div>
  );
}
