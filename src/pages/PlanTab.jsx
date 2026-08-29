import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { monthDots, prayersForDay, sortEntries } from '../lib/planner';
import { addDays } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { buildICS } from '../utils/ics';
import MonthCalendar from '../components/MonthCalendar';
import { monthDayKeys } from '../lib/monthCalendar';
import DayAgenda from '../components/DayAgenda';
import OverflowMenu from '../components/shared/OverflowMenu';
import { PageHeader } from '../components/shared/Primitives';

// Calendar has one responsibility: show when prayers return and let a person
// manage individual occurrences. Journeys, invitations, and labels live in the
// contexts where people discover or organize them.
export default function CalendarTab() {
  const {
    categories,
    prayers,
    settings,
    completions,
    markPrayedOn,
    unmarkPrayedOn,
    skipOccurrence,
    moveOccurrence,
    setOccurrenceOverride,
    endSeriesBefore,
  } = usePrayerStore(
    useShallow((state) => ({
      categories: state.categories,
      prayers: state.prayers,
      settings: state.settings,
      completions: state.completions,
      markPrayedOn: state.markPrayedOn,
      unmarkPrayedOn: state.unmarkPrayedOn,
      skipOccurrence: state.skipOccurrence,
      moveOccurrence: state.moveOccurrence,
      setOccurrenceOverride: state.setOccurrenceOverride,
      endSeriesBefore: state.endSeriesBefore,
    })),
  );
  const tr = useTranslationStore((state) => state.tr);
  const user = useAuthStore((state) => state.user);
  const myCommitments = useCommunityStore((state) => state.myCommitments);
  const fetchMyCommitments = useCommunityStore((state) => state.fetchMyCommitments);
  const lang = settings.language || 'en';
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedKey, setSelectedKey] = useState(todayKey());

  useEffect(() => {
    if (user?.id) fetchMyCommitments(user.id, addDays(todayKey(), -92));
  }, [fetchMyCommitments, user?.id]);

  const dots = monthDots(prayers, categories, monthDayKeys(monthDate));
  for (const commitment of myCommitments) {
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    if (commitment.day.slice(0, 7) === month) {
      dots[commitment.day] = {
        ...(dots[commitment.day] || {}),
        group: ((dots[commitment.day] || {}).group || 0) + 1,
      };
    }
  }

  const entries = sortEntries(prayersForDay(prayers, categories, selectedKey), categories);
  const commitments = myCommitments.filter((commitment) => commitment.day === selectedKey);

  const exportCalendar = () => {
    const blob = new Blob([buildICS(prayers, myCommitments)], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'praystead-schedule.ics';
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t(lang, 'exportDone'));
  };

  return (
    <div className="phase-page constellation-plan">
      <div className="phase-page__shell">
        <PageHeader
          eyebrow={t(lang, 'calendar')}
          title={t(lang, 'calendarTitle')}
          subtitle={t(lang, 'calendarSub')}
          aside={(
            <OverflowMenu
              lang={lang}
              ariaLabel={t(lang, 'calendarActions')}
              triggerStyle={{ background: 'var(--surface-muted)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              items={[{ key: 'export', icon: Download, label: t(lang, 'exportIcs'), onClick: exportCalendar }]}
            />
          )}
        />
      </div>

      <div className="phase-content max-w-4xl space-y-4">
        <MonthCalendar
          monthDate={monthDate}
          dots={dots}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onMonthChange={setMonthDate}
          lang={lang}
        />
        <DayAgenda
          dayKey={selectedKey}
          lang={lang}
          tr={tr}
          entries={entries}
          completions={completions}
          commitments={commitments}
          onTogglePrayed={(id, day, prayed) => (prayed ? unmarkPrayedOn(id, day) : markPrayedOn(id, day))}
          onSkip={(id, day) => { skipOccurrence(id, day); toast.success(t(lang, 'occurrenceSkipped')); }}
          onMove={(id, from, to) => { moveOccurrence(id, from, to); toast.success(t(lang, 'occurrenceMoved', { date: to })); }}
          onRestore={(id, day) => setOccurrenceOverride(id, day, null)}
          onEndSeries={(id, day) => { endSeriesBefore(id, day); toast.success(t(lang, 'seriesEnded')); }}
        />
      </div>
    </div>
  );
}
