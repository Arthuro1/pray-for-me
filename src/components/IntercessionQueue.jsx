import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useTranslationStore from '../store/translationStore';
import PrayerSession from './PrayerSession';
import { t, tp } from '../i18n';
import { todayKey } from '../lib/prayedLog';
import { circleLabelKey } from '../lib/circles';
import {
  intercessionQueue, dueIntercessionQueue, queueCircles, filterQueueByCircle, remainingInQueue,
} from '../lib/intercession';
import { Disclosure, PrimaryButton, QuietButton, SecondaryButton, SectionHeader } from './shared/Primitives';
import { CIRCLE_ICONS } from './shared/circleIcons';
import RiseMark from './shared/RiseMark';

// The intercession queue, surfaced inside Together: one clear Pray now — the
// most important thing on the page, so the card leads with how many wait today
// and a full-width button — over the requests the user explicitly took on (personal
// prayers for someone, saved community requests). The DEFAULT session covers
// only what is DUE today — per-prayer schedules and claimed prayer-chain days,
// via the ordinary planner — while everything carried stays reachable behind a
// collapsed disclosure. It reuses the ordinary PrayerSession and per-prayer
// completions — leaving midway keeps real progress, and reopening resumes with
// the first unfinished request. Renders nothing when the queue is empty, so
// Grace never sees it. Once carried prayers sit in different circles, one
// visible row of chips (All, then those circles) narrows the walk to a circle —
// the carrier's own placement, never anything the person who asked chose.
// Each request still names the group it came from, so no source filter.
export default function IntercessionQueue({ lang }) {
  const { prayers, categories, completions, markPrayedOn } = usePrayerStore(
    useShallow((s) => ({
      prayers: s.prayers,
      categories: s.categories,
      completions: s.completions,
      markPrayedOn: s.markPrayedOn,
    }))
  );
  const { myCommitments, fetchMyCommitments } = useCommunityStore(
    useShallow((s) => ({ myCommitments: s.myCommitments, fetchMyCommitments: s.fetchMyCommitments }))
  );
  const userId = useAuthStore((s) => s.user?.id);
  const { tr } = useTranslationStore();
  const [circle, setCircle] = useState('all');
  // Snapshot of the session's prayers, fixed when it starts — completions
  // recorded while praying must not reshuffle the walk mid-session.
  const [session, setSession] = useState(null);
  const [allOpen, setAllOpen] = useState(false);
  // The quiet "prayed for them all" line can be opened for Pray again.
  const [doneOpen, setDoneOpen] = useState(false);

  const dayKey = todayKey();

  // Claimed prayer-chain days feed the due queue. Best-effort: offline just
  // means claims can't ADD to today's queue; scheduled prayers still appear.
  // fetchMyCommitments is a stable Zustand action.
  useEffect(() => {
    if (userId) fetchMyCommitments(userId, dayKey);
  }, [userId, dayKey, fetchMyCommitments]);

  const carried = intercessionQueue(prayers);
  if (carried.length === 0) return null;

  const due = dueIntercessionQueue(prayers, categories, dayKey, myCommitments);
  const circles = queueCircles(carried);
  const activeCircle = circles.includes(circle) ? circle : 'all';
  // The circle changes only what the session walks, never completion data.
  const filtered = filterQueueByCircle(due, activeCircle);
  const listed = filterQueueByCircle(carried, activeCircle);
  const remaining = remainingInQueue(filtered, completions, dayKey);
  const allRemaining = remainingInQueue(listed, completions, dayKey);
  const dueDone = due.length > 0 && remainingInQueue(due, completions, dayKey).length === 0;

  const sessionOverlay = session && session.length > 0 && (
    <PrayerSession
      prayers={session}
      categories={categories}
      lang={lang}
      tr={tr}
      onClose={() => setSession(null)}
      onPrayed={(id) => markPrayedOn(id, dayKey)}
    />
  );

  // Everything due today is prayed → one quiet line instead of a section
  // sitting above the user's groups. Opening it offers a gentle Pray again and
  // keeps the all-carried disclosure reachable.
  if (dueDone && !doneOpen) {
    return (
      <div className="carried-queue">
        {sessionOverlay}
        <Disclosure
          id="intercession-done"
          label={t(lang, 'intercessionDone')}
          open={false}
          onToggle={() => setDoneOpen(true)}
        />
      </div>
    );
  }

  return (
    <section className="carried-queue" id="intercession-done" aria-labelledby="carried-queue-title">
      {sessionOverlay}

      <SectionHeader id="carried-queue-title" as="h2" eyebrow={t(lang, 'intercessionTitle')} />

      <div className={`carried-queue__card q-card ${remaining.length > 0 ? 'carried-queue__card--due' : ''}`}>
        {/* The action comes first: praying needs no setup. */}
        {remaining.length > 0 ? (
          <div className="carried-queue__lead">
            <p className="carried-queue__count">
              <RiseMark motion="still" size={22} />
              <span>{tp(lang, 'carryTodayCount', remaining.length)}</span>
            </p>
            <PrimaryButton onClick={() => setSession(remaining)} className="carried-queue__pray">
              {t(lang, 'prayNow')}
            </PrimaryButton>
          </div>
        ) : due.length === 0 ? (
          // Nothing is due today at all — schedules carry the load on other days.
          <p className="carried-queue__status" role="status">{t(lang, 'intercessionNoneDue')}</p>
        ) : (
          <div className="carried-queue__actions">
            <p className="carried-queue__status" role="status">
              <RiseMark motion="still" size={20} /> {t(lang, 'intercessionDone')}
            </p>
            {/* Quiet Pray again over today's due queue — completions are
                idempotent per day, so walking it again never double-counts. */}
            <QuietButton onClick={() => setSession(filtered)}>{t(lang, 'prayAgainBtn')}</QuietButton>
          </div>
        )}

        {/* Below the action, quieter: one row offered only when the carried
            prayers sit in more than one place — All, then each circle in use,
            with its icon. A pressed circle toggles back to All. It changes only
            what the session walks. Then every carried request, folded. */}
        {(circles.length > 0 || carried.length > due.length) && (
          <div className="carried-queue__footer">
            {circles.length > 0 && (
              <div className="q-chips" role="group" aria-label={t(lang, 'circleFieldLabel')}>
                <button
                  type="button"
                  aria-pressed={activeCircle === 'all'}
                  onClick={() => setCircle('all')}
                  className="q-chip pressable"
                >
                  {t(lang, 'all')}
                </button>
                {circles.map((c) => {
                  const Icon = CIRCLE_ICONS[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={activeCircle === c}
                      onClick={() => setCircle(activeCircle === c ? 'all' : c)}
                      className="q-chip circle-chip pressable"
                    >
                      <span className={`icon-tile icon-tile--sm tone-${c}`} aria-hidden="true"><Icon size={13} strokeWidth={2} /></span>
                      <span>{t(lang, circleLabelKey(c))}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Every carried request stays one tap away — but it is never the
                default session. */}
            {carried.length > due.length && (
              <Disclosure
                id="intercession-all"
                label={t(lang, 'intercessionAllCarried', { n: listed.length })}
                open={allOpen}
                onToggle={() => setAllOpen((v) => !v)}
                className="carried-queue__all"
              >
                <ul className="carried-queue__list">
                  {listed.map((p) => {
                    const prayedToday = (completions[p.id] || []).includes(dayKey);
                    return (
                      <li key={p.id} className="carried-queue__item">
                        {prayedToday
                          ? <Check size={14} aria-label={t(lang, 'prayedTodayLabel')} />
                          : <span className="w-[14px]" aria-hidden="true" />}
                        <span className="min-w-0 flex-1 truncate">{tr(p.title, lang)}</span>
                        {p.origin_group_name && <span className="carried-queue__item-from">{p.origin_group_name}</span>}
                      </li>
                    );
                  })}
                </ul>
                {allRemaining.length > 0 && (
                  <SecondaryButton onClick={() => setSession(allRemaining)} className="mt-3 w-full">
                    {t(lang, 'prayAllCarriedBtn', { n: allRemaining.length })}
                  </SecondaryButton>
                )}
              </Disclosure>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
