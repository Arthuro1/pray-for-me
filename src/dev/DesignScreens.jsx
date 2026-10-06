// Dev-only screen previews for the design gallery: /__design/today, /journal,
// /detail and /session render the REAL screens inside the real app shell with
// sample prayers. Every store write is replaced by a local no-op first, so
// nothing is queued, synced, encrypted or sent anywhere. Never shipped.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import Layout from '../components/Layout';
import HomeTab from '../pages/HomeTab';
import PrayersTab from '../pages/PrayersTab';
import PrayerDetail from '../pages/PrayerDetail';
import PrayerSession from '../components/PrayerSession';
import { dirFor, isLocaleLoaded, loadLocale } from '../i18n';
import { todayKey } from '../lib/prayedLog';
import { addDays } from '../lib/schedule';

const daily = { type: 'recurring', freq: 'daily', startDate: '2026-01-01', end: { kind: 'never' } };
const weekly = (day) => ({ type: 'recurring', freq: 'weekly', weekDays: [day], startDate: '2026-01-01', end: { kind: 'never' } });

function samplePrayers() {
  const base = { status: 'active', prayer_categories: [], prayer_points: [], prayer_testimonies: [], prayer_updates: [], user_id: 'design-user' };
  return [
    {
      ...base, id: 'd1', title: 'Healing and peace for Sarah', circle: 'people', for_other: true, person_name: 'Sarah',
      description: 'For her recovery after surgery, and for peace for her family through the long weeks ahead.',
      schedule: daily, created_at: '2026-03-12T08:00:00Z',
      prayer_points: [{ id: 'pt1', title: 'Strength for each day of recovery', verses: [{ ref: 'Isaiah 40:31' }] }],
      prayer_updates: [{ id: 'u1', text: 'The surgery went well. She is resting at home.', created_at: '2026-09-30T10:00:00Z' }],
    },
    { ...base, id: 'd2', title: 'My church', description: 'Unity and wisdom for our elders.', circle: 'church', schedule: daily, created_at: '2026-02-02T08:00:00Z' },
    { ...base, id: 'd3', title: 'Government leaders', description: 'Wisdom, justice and restraint.', circle: 'authorities', schedule: daily, created_at: '2026-04-20T08:00:00Z' },
    { ...base, id: 'd4', title: 'My children', circle: 'household', schedule: daily, created_at: '2025-11-02T08:00:00Z' },
    { ...base, id: 'd5', title: 'Germany', circle: 'nations', schedule: weekly(1), created_at: '2026-05-01T08:00:00Z' },
    {
      ...base, id: 'd6', title: 'A new job for David', circle: 'people', for_other: true, person_name: 'David', status: 'answered',
      answered_at: '2026-09-20T08:00:00Z', schedule: null, created_at: '2026-01-15T08:00:00Z',
      prayer_testimonies: [{ id: 't1', text: 'He started his new work on Monday.', created_at: '2026-09-20T08:00:00Z' }],
    },
  ];
}

// Seed the stores and swap every write for a local, in-memory version.
function seed() {
  const today = todayKey();
  const noop = async () => ({ error: null });
  const prayers = samplePrayers();
  usePrayerStore.setState((state) => ({
    prayers,
    categories: [],
    completions: { d4: [today], d5: [addDays(today, -1)] },
    loading: false,
    userId: 'design-user',
    settings: { ...state.settings, language: state.settings.language || 'en', dailyReminderEnabled: false },
    markPrayedOn: (id, day) => usePrayerStore.setState((s) => ({ completions: { ...s.completions, [id]: [...(s.completions[id] || []), day] } })),
    unmarkPrayedOn: noop,
    updatePrayer: noop, addPrayer: noop, deletePrayer: noop, softDeletePrayer: noop, togglePin: noop,
    markAnswered: noop, markActive: noop, addTestimony: noop, editTestimony: noop, deleteTestimony: noop,
    addUpdate: noop, editUpdate: noop, deleteUpdate: noop,
    addPrayerPoint: noop, removePrayerPoint: noop, addVerseToPoint: noop, removeVerseFromPoint: noop,
    setOccurrenceOverride: noop, skipOccurrence: noop, moveOccurrence: noop, endSeriesBefore: noop,
    loadData: noop, refreshPrayer: noop, refreshSavedCopies: noop, refreshFromCommunity: noop, syncSettings: noop,
    fetchSharedActivity: async () => ({ prayers: [], testimonies: [], updates: [] }),
    updateSettings: (patch) => usePrayerStore.setState((s) => ({ settings: { ...s.settings, ...patch } })),
  }));
  useAuthStore.setState({ user: { id: 'design-user', email: 'arthur@example.com', user_metadata: { full_name: 'Arthur' } } });
  const community = useCommunityStore.getState();
  const stubbed = Object.fromEntries(Object.entries(community).filter(([, v]) => typeof v === 'function').map(([k]) => [k, noop]));
  useCommunityStore.setState({ ...stubbed, prayerShares: { d1: [{ groupId: 'g1', groupName: 'Home group', prayingCount: 8 }] }, groups: [], prayers: [], testimonies: [], pendingCount: 0 });
}

const SCREENS = ['today', 'journal', 'detail', 'session'];

export default function DesignScreens({ screen }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const lang = usePrayerStore((s) => s.settings.language) || 'en';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
  }, [lang]);

  useEffect(() => {
    seed();
    if (isLocaleLoaded(lang)) { setReady(true); return; }
    loadLocale(lang).then(() => setReady(true));
  }, [lang]);

  if (!ready) return null;
  const prayer = usePrayerStore.getState().prayers.find((p) => p.id === 'd1');

  const nav = (
    <p data-design-nav className="fixed bottom-24 end-3 z-[80] flex gap-1 rounded-control p-1 text-xs" style={{ background: 'var(--q-surface)', border: '1px solid var(--q-border)' }}>
      {SCREENS.map((s) => <Link key={s} to={`/__design/${s}`} className="rounded px-2 py-1" style={{ color: s === screen ? 'var(--q-royal-text)' : 'var(--q-text-secondary)' }}>{s}</Link>)}
    </p>
  );

  if (screen === 'session') {
    return <PrayerSession prayers={usePrayerStore.getState().prayers.slice(0, 3)} categories={[]} lang={lang} tr={(text) => text} onClose={() => navigate('/__design/today')} />;
  }

  return (
    <Layout onAddPrayer={() => {}}>
      {screen === 'journal' && <PrayersTab onAdd={() => {}} />}
      {screen === 'detail' && <PrayerDetail prayer={prayer} onBack={() => navigate('/__design/journal')} onEdit={() => {}} lang={lang} />}
      {(screen === 'today' || !SCREENS.includes(screen)) && <HomeTab onAdd={() => {}} onEdit={() => {}} />}
      {nav}
    </Layout>
  );
}
