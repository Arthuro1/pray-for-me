// Dev-only design gallery (/__design). Never shipped: App.jsx imports it only
// when import.meta.env.DEV, so production builds drop it. Renders the Qetoret
// primitives with sample content — no account, no network, no stored data —
// so every phase of the redesign can be checked in light, dark and RTL.
import { useEffect, useState } from 'react';
import { Check, Moon, Plus, Sun } from 'lucide-react';
import {
  CircleOption,
  Field,
  Input,
  Modal,
  PageHeader,
  PrayerRow,
  PrimaryButton,
  QuietButton,
  ScriptureBlock,
  SecondaryButton,
  SectionDivider,
  SectionHeader,
  SegmentedControl,
  StatusLabel,
  StatusPill,
  Textarea,
} from '../components/shared/Primitives';
import RiseMark from '../components/shared/RiseMark';

const SWATCHES = [
  ['canvas', '--q-canvas'], ['surface', '--q-surface'], ['surface-muted', '--q-surface-muted'], ['inverse', '--q-surface-inverse'],
  ['text', '--q-text'], ['text-secondary', '--q-text-secondary'], ['text-tertiary', '--q-text-tertiary'], ['border', '--q-border'],
  ['royal', '--q-royal'], ['royal-text', '--q-royal-text'], ['royal-light', '--q-royal-light'], ['royal-deep', '--q-royal-deep'],
  ['gold', '--q-gold'], ['gold-text', '--q-gold-text'], ['gold-soft', '--q-gold-soft'], ['success', '--q-success'],
];

const CIRCLES = [
  ['My heart', 'Personal prayer and formation'],
  ['My house', 'Family and household'],
  ['My people', 'Friends and relationships'],
  ['His Church', 'Church and ministry'],
  ['Authorities', 'Leaders and governments'],
  ['Nations', 'Cities, countries and peoples'],
  ['Kingdom & Mission', 'Gospel, justice, mercy and God’s purposes'],
];

function Section({ title, children }) {
  return (
    <section className="py-10">
      <p className="section-label mb-6">{title}</p>
      {children}
    </section>
  );
}

export default function DesignGallery() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const [dir, setDir] = useState('ltr');
  const [circle, setCircle] = useState('My house');
  const [segment, setSegment] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [rise, setRise] = useState(0);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.setAttribute('dir', dir); }, [dir]);

  return (
    <div className="phase-page" dir={dir}>
      <div className="phase-page__shell">
        <PageHeader
          eyebrow="Qetoret · design system"
          title="Alabaster, royal violet, temple gold, ink"
          subtitle="Every primitive in one place. Purple carries the brand; gold marks what is sacred; alabaster gives prayer room to breathe."
          aside={(
            <div className="flex gap-1">
              <QuietButton icon={theme === 'light' ? Moon : Sun} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme" />
              <QuietButton onClick={() => setDir(dir === 'ltr' ? 'rtl' : 'ltr')}>{dir.toUpperCase()}</QuietButton>
            </div>
          )}
        />
      </div>

      <div className="phase-content">
        <Section title="Tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SWATCHES.map(([name, token]) => (
              <div key={token}>
                <div className="h-14 rounded-control" style={{ background: `var(${token})`, boxShadow: '0 0 0 1px var(--q-border)' }} />
                <p className="q-meta mt-2">{name}</p>
              </div>
            ))}
          </div>
        </Section>

        <SectionDivider />

        <Section title="Type">
          <p className="q-display">Build a life of prayer</p>
          <p className="q-title mt-6">Your altar today</p>
          <p className="q-section-title mt-6">Carried in prayer</p>
          <p className="q-prayer-title mt-6">Healing and peace for Sarah</p>
          <p className="q-body mt-4" style={{ color: 'var(--q-text-secondary)' }}>
            Body copy is the sans voice of the software: controls, labels, dates and settings stay in it so every language reads cleanly.
          </p>
          <p className="q-meta mt-2">Carried since March 12 · My people</p>
          <p className="section-label mt-4">Eyebrow · neutral</p>
          <p className="section-label section-label--sacred mt-2">Remember · sacred</p>
        </Section>

        <SectionDivider />

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton>Begin prayer</PrimaryButton>
            <SecondaryButton>Explore a prayer plan</SecondaryButton>
            <QuietButton>Release from rhythm</QuietButton>
            <PrimaryButton icon={Plus}>Bring a prayer</PrimaryButton>
            <PrimaryButton disabled>Disabled</PrimaryButton>
            <PrimaryButton danger>Delete</PrimaryButton>
          </div>
          <div className="prayer-surface--focus q-inverse mt-6 flex flex-wrap gap-3 rounded-surface p-6">
            <PrimaryButton inverse>Begin prayer</PrimaryButton>
            <SecondaryButton inverse>Remain with God</SecondaryButton>
            <QuietButton inverse>Finish</QuietButton>
          </div>
        </Section>

        <SectionDivider />

        <Section title="Section header · rows · status">
          <SectionHeader eyebrow="Your altar today" sacred supporting="Come before God with what you’re carrying today." />
          <div>
            <PrayerRow title="Sarah" context="Healing and peace" circle="My people" />
            <PrayerRow title="My church" context="Unity and wisdom" circle="His Church" meta={<span>Every Sunday</span>} />
            <PrayerRow title="Germany" context="Every Monday" circle="Nations" status={<StatusLabel tone="answered">Answered</StatusLabel>} />
            <PrayerRow title="My father" context="Carried since March 2025" status={<StatusLabel tone="sacred">Testimony</StatusLabel>} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <StatusPill>All</StatusPill>
            <StatusPill tone="answered" icon={Check}>Answered</StatusPill>
            <StatusPill tone="scripture">Psalm 141:2</StatusPill>
          </div>
          <div className="mt-6">
            <SegmentedControl label="Filter" value={segment} onChange={setSegment} options={[{ value: 'active', label: 'Carrying' }, { value: 'answered', label: 'Answered' }, { value: 'all', label: 'All' }]} />
          </div>
        </Section>

        <SectionDivider />

        <Section title="Intercession circles">
          <div role="radiogroup" aria-label="Circle" className="circle-options">
            {CIRCLES.map(([title, description]) => (
              <CircleOption key={title} title={title} description={description} selected={circle === title} onSelect={() => setCircle(title)} />
            ))}
          </div>
        </Section>

        <SectionDivider />

        <Section title="Scripture">
          <ScriptureBlock reference="Psalm 141:2">
            <p className="scripture-block__text" style={{ color: 'var(--q-text-tertiary)' }}>
              Scripture text is resolved at render time from the verse pipeline — never written here.
            </p>
          </ScriptureBlock>
        </Section>

        <SectionDivider />

        <Section title="Fields">
          <div className="grid gap-5">
            <Field label="Title" hint="Who or what are you bringing before God?">
              {(props) => <Input {...props} placeholder="Sarah’s recovery" />}
            </Field>
            <Field label="Prayer">
              {(props) => <Textarea editorial {...props} placeholder="What is on your heart?" />}
            </Field>
            <Field label="Email" error="Enter a valid email address.">
              {(props) => <Input {...props} type="email" defaultValue="not-an-email" />}
            </Field>
          </div>
        </Section>

        <SectionDivider />

        <Section title="Rise mark · modal">
          <div className="flex items-end gap-8">
            <RiseMark key={rise} size={56} />
            <RiseMark motion="breathe" size={56} />
            <RiseMark motion="still" size={56} />
            <SecondaryButton onClick={() => setRise((n) => n + 1)}>Replay</SecondaryButton>
            <PrimaryButton onClick={() => setModalOpen(true)}>Open modal</PrimaryButton>
          </div>
        </Section>
      </div>

      {modalOpen && (
        <Modal label="Record a testimony" onClose={() => setModalOpen(false)}>
          <p className="section-label section-label--sacred">Remember</p>
          <h2 className="q-title mt-2">What has God done?</h2>
          <p className="mt-3" style={{ color: 'var(--q-text-secondary)' }}>Record what happened so you can remember God’s faithfulness.</p>
          <Textarea editorial className="mt-5" placeholder="Write it in your own words." />
          <div className="mt-6 flex justify-end gap-2">
            <QuietButton onClick={() => setModalOpen(false)}>Cancel</QuietButton>
            <PrimaryButton onClick={() => setModalOpen(false)}>Save testimony</PrimaryButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
