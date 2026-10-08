import { useState } from 'react';
import { Sprout, Users } from 'lucide-react';
import { CIRCLE_ICONS } from '../../components/shared/circleIcons';
import CarryButton from '../../components/shared/CarryButton';
import { PrimaryButton, StatusLabel } from '../../components/shared/Primitives';
import RiseMark from '../../components/shared/RiseMark';

// The app itself, beside the words that describe it: Today, a prayer row, a
// group request, a testimony — drawn with the app's own classes (soft cards,
// circle-tone tiles, the deep-violet focus), never a picture of a phone. The
// sample words come from the landing locale; no usage figures are invented.

const TILE_ICON = { size: 20, strokeWidth: 1.8, 'aria-hidden': true };

// A prayer row as the Journal and Today draw it: its circle's tile (or a
// plan's gold outline), the title in the serif, one quiet detail line, and a
// plan's thin progress line (day 4 of 21 in the sample).
function SampleRow({ circle, plan = false, title, meta }) {
  const Icon = plan ? Sprout : CIRCLE_ICONS[circle];
  return (
    <div className="prayer-row prayer-row--marked q-card landing-row">
      <span className={`icon-tile prayer-mark ${plan ? 'prayer-mark--plan' : `tone-${circle}`}`} aria-hidden="true">
        <Icon {...TILE_ICON} />
      </span>
      <span className="min-w-0">
        <span className="prayer-row__title">{title}</span>
        <span className="prayer-row__details">
          <span className="prayer-row__detail prayer-row__detail--lead">{meta}</span>
        </span>
        {plan && (
          <span className="prayer-row__track" aria-hidden="true">
            <span className="landing-row__progress" />
          </span>
        )}
      </span>
    </div>
  );
}

// The hero: the real Today — "Your altar today", one prayer in the
// deep-violet focus with Pray now, and two rows below it. Pray now enters the
// same guest flow as the primary call.
export function TodayPreview({ copy, onBeginPrayer }) {
  const { preview, todayLabel, samplePrayerTitle, prayNowLabel } = copy;
  return (
    <div className="landing__preview" role="group" aria-label={preview.altarToday}>
      <p className="section-label section-label--sacred">{preview.altarToday}</p>
      <div className="today-focus q-immersive landing__focus">
        <p className="today-focus__context">{todayLabel}</p>
        <p className="today-focus__title">{samplePrayerTitle}</p>
        <PrimaryButton onClick={() => onBeginPrayer()} className="today-focus__begin">{prayNowLabel}</PrimaryButton>
      </div>
      <div className="landing-stack">
        <SampleRow circle="authorities" {...preview.rows[0]} />
        <SampleRow circle="church" {...preview.rows[1]} />
      </div>
    </div>
  );
}

// Bring: the first question of the guest flow, and the way into it.
export function BringVignette({ copy, onBeginPrayer }) {
  const { bring, beginLabel } = copy;
  return (
    <div className="landing-stage">
      <div className="landing-bring q-card">
        <p className="landing-bring__question">{bring.question}</p>
        <p className="landing-bring__field" aria-hidden="true">{bring.placeholder}</p>
        <PrimaryButton onClick={() => onBeginPrayer()} className="landing-bring__begin">{beginLabel}</PrimaryButton>
      </div>
    </div>
  );
}

// Together: a group's wall — a request the visitor can carry (the real Carry
// gesture, kept on this page only) and one the group has seen answered.
export function TogetherVignette({ copy, lang }) {
  const { together } = copy;
  const [carrying, setCarrying] = useState(false);
  return (
    <div className="landing-stage">
      <p className="landing-group">
        <span className="icon-tile icon-tile--round tone-people" aria-hidden="true"><Users {...TILE_ICON} size={18} /></span>
        <span>{together.group}</span>
      </p>
      <div className="landing-stack">
        <div className="prayer-row q-card landing-row">
          <span className="prayer-row__title">{together.request}</span>
          <CarryButton
            variant="quiet"
            carrying={carrying}
            onToggle={() => setCarrying((c) => !c)}
            lang={lang}
            labels={{ carry: together.carry, carrying: together.carrying }}
          />
        </div>
        <div className="prayer-row q-card landing-row together-prayer--answered">
          <span className="prayer-row__title">{together.answeredRequest}</span>
          <StatusLabel tone="answered">{together.answered}</StatusLabel>
        </div>
      </div>
    </div>
  );
}

// Return and Listen: a guided plan under way, a prayer that comes back every
// morning, and the stillness of Remain with God.
export function RhythmVignette({ copy }) {
  const { rhythm } = copy;
  return (
    <div className="landing-stage landing-stack">
      <SampleRow plan title={rhythm.planTitle} meta={rhythm.planDay} />
      <SampleRow circle="self" title={rhythm.rowTitle} meta={rhythm.rowMeta} />
      <div className="landing-still q-immersive">
        <RiseMark motion="breathe" size={40} className="landing-still__mark" />
        <p className="landing-still__title">{rhythm.stillTitle}</p>
        <p className="landing-still__body">{rhythm.stillBody}</p>
      </div>
    </div>
  );
}

// Remember and Respond: a prayer carried for months, the testimony recorded
// when it was answered — in the person's own words — and the question that
// turns an answer toward obedience.
export function RememberVignette({ copy }) {
  const { remember } = copy;
  return (
    <div className="landing-stage landing-stack">
      <SampleRow circle="household" title={remember.prayerTitle} meta={remember.carriedSince} />
      <div className="landing-testimony q-card">
        <StatusLabel tone="answered">{remember.testimonyLabel}</StatusLabel>
        <p className="landing-testimony__text">{remember.testimony}</p>
        <p className="landing-testimony__marked">{remember.answered}</p>
      </div>
      <div className="landing-next q-card">
        <p className="landing-next__title">{remember.nextTitle}</p>
        <ul className="landing-next__steps">
          {remember.nextSteps.map((step) => <li key={step} className="q-chip">{step}</li>)}
        </ul>
      </div>
    </div>
  );
}
