// Dev-only screen previews for the design gallery: /__design/today, /journal,
// /detail, /session, /bring, /circles, /tend, /carry, /together, /group,
// /plans, /plan, /grow and /guide render the REAL screens inside
// the real app shell with sample prayers. Every store write is replaced by a local no-op first, so
// nothing is queued, synced, encrypted or sent anywhere. Never shipped.
import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import Layout from '../components/Layout';
import HomeTab from '../pages/HomeTab';
import PrayersTab from '../pages/PrayersTab';
import PrayerDetail from '../pages/PrayerDetail';
import PrayerSession from '../components/PrayerSession';
import PrayerForm from '../components/PrayerForm';
import TendAltar from '../components/TendAltar';
import PrayTogetherCard from '../components/PrayTogetherCard';
import CommunityTab from '../pages/CommunityTab';
import PlansTab from '../pages/PlansTab';
import GrowTab from '../pages/GrowTab';
import PlanDetailModal from '../components/PlanDetailModal';
import GuideReader from '../components/GuideReader';
import { planById } from '../lib/guidedPlan';
import { guides } from '../content/teaching';
import CirclePicker from '../components/CirclePicker';
import { Modal, PageHeader } from '../components/shared/Primitives';
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

const SCREENS = ['today', 'journal', 'detail', 'session', 'bring', 'circles', 'tend', 'carry', 'together', 'group', 'plans', 'plan', 'grow', 'guide'];

const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();

// A small group as a member meets it: two groups, a friend request, a wall of
// requests (one carried, one answered, one anonymous) and a testimony.
function seedTogether() {
  const ok = (value) => async () => value;
  useCommunityStore.setState({
    groups: [
      { id: 'g1', name: 'Home group', role: 'admin', created_by: 'design-user', invite_code: 'HOME42', autoAdd: false },
      { id: 'g2', name: 'St Paul’s prayer team', role: 'member', created_by: 'u9', invite_code: 'PAUL7' },
    ],
    prayers: [
      { id: 'c1', group_id: 'g1', user_id: 'u2', author_name: 'Sarah', title: 'Please pray for my mother', description: 'She has surgery on Thursday. Pray for the doctors, and for peace for all of us.', created_at: hoursAgo(3), prayer_reactions: [{ count: 8 }], community_updates: [{ count: 2 }] },
      { id: 'c2', group_id: 'g1', user_id: 'u3', author_name: 'Paul', title: 'Wisdom for our elders this autumn', created_at: hoursAgo(26), prayer_reactions: [{ count: 3 }], community_updates: [{ count: 0 }] },
      { id: 'c3', group_id: 'g1', user_id: 'u4', author_name: '', is_anonymous: true, title: 'A difficult conversation with my brother', created_at: hoursAgo(50), prayer_reactions: [{ count: 0 }] },
      { id: 'c4', group_id: 'g1', user_id: 'u5', author_name: 'David', title: 'A new job', is_answered: true, created_at: hoursAgo(400), prayer_reactions: [{ count: 11 }] },
    ],
    testimonies: [
      { id: 't1', community_prayer_id: 'c4', user_id: 'u5', author_name: 'David', content: 'I started my new work on Monday. Thank you for carrying this with me for so long.', created_at: hoursAgo(30), community_prayers: { title: 'A new job' } },
    ],
    userReactions: new Set(['c1']),
    loading: false,
    memberAvatars: {},
    fetchFriends: ok({ friends: [{ id: 'f1', name: 'Marie' }, { id: 'f2', name: 'Jonas' }] }),
    fetchFriendRequests: ok({ requests: [{ id: 'r1', fromName: 'Esther' }] }),
    fetchGroupInvitations: ok({ invitations: [] }),
    fetchPlanInvitations: ok({ invitations: [] }),
    fetchGroupActivity: ok([]),
    fetchGroupMembers: ok({ members: [{ user_id: 'design-user', name: 'Arthur', role: 'admin' }, { user_id: 'u2', name: 'Sarah' }, { user_id: 'u3', name: 'Paul' }] }),
    fetchGroupPlans: ok({ plans: [{ id: 'gp1', plan_id: 'gratitude7', start_date: todayKey(), participantCount: 4, joinedByMe: false, added_by: 'u2' }] }),
    fetchReactors: ok({ reactors: [] }),
    fetchMyCommitments: ok([]),
    subscribeGroupPrayers: () => () => {},
    subscribeGroupPlans: () => () => {},
  });
}

function TogetherPreview({ screen }) {
  useState(seedTogether);
  return (
    <Routes location={screen === 'group' ? '/community/group/g1' : '/community'}>
      <Route path="/community" element={<CommunityTab />} />
      <Route path="/community/group/:groupId" element={<CommunityTab />} />
    </Routes>
  );
}

// The circle picker on its own: in the real form it appears only once the
// vault is unlocked, which a preview must never fake on a shared dev origin.
function CirclesPreview({ lang }) {
  const [circle, setCircle] = useState('household');
  return (
    <Modal label="circles" onClose={() => {}}>
      <CirclePicker value={circle} onChange={setCircle} lang={lang} idPrefix="design-circle" />
    </Modal>
  );
}

const REACTORS = [
  { user_id: 'design-user', name: 'Arthur' },
  { user_id: 'r2', name: 'Marie' },
  { user_id: 'r3', name: 'Paul' },
];

// "Carry this prayer" as a group member meets it: before and after carrying.
function CarryPreview({ lang }) {
  // Before the cards mount, so their first fetch already sees the faces.
  useState(() => useCommunityStore.setState({ fetchReactors: async (id) => ({ reactors: id === 'c2' ? REACTORS : [] }) }));
  const user = useAuthStore.getState().user;
  return (
    <div className="phase-page">
      <div className="phase-page__shell"><PageHeader eyebrow="Home group" title="Please pray for my mother" /></div>
      <div className="phase-content grid gap-10">
        <PrayTogetherCard communityPrayer={{ id: 'c1' }} count={0} hasReacted={false} busy={false} lang={lang} user={user} onTogglePraying={() => {}} />
        <PrayTogetherCard communityPrayer={{ id: 'c2' }} count={8} hasReacted busy={false} lang={lang} user={user} onTogglePraying={() => {}} />
      </div>
    </div>
  );
}

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
      {screen === 'carry' && <CarryPreview lang={lang} />}
      {(screen === 'plans' || screen === 'plan') && <PlansTab />}
      {screen === 'plan' && planById('altar7') && (
        <PlanDetailModal plan={planById('altar7')} lang={lang} running={false} onStart={() => {}} onShare={() => {}} onClose={() => navigate('/__design/plans')} />
      )}
      {(screen === 'grow' || screen === 'guide') && <GrowTab onCreatePrayer={() => {}} />}
      {screen === 'guide' && guides[0] && (
        <GuideReader guide={guides[0]} lang={lang} onClose={() => navigate('/__design/grow')} onStarted={() => {}} onCompleted={() => {}} />
      )}
      {(screen === 'together' || screen === 'group') && <TogetherPreview screen={screen} />}
      {screen === 'circles' && <CirclesPreview lang={lang} />}
      {screen === 'tend' && <PrayersTab onAdd={() => {}} />}
      {screen === 'tend' && (
        <TendAltar prayers={usePrayerStore.getState().prayers.slice(1, 5)} completions={{}} lang={lang} tr={(text) => text} onRelease={() => {}} onClose={() => navigate('/__design/journal')} />
      )}
      {(screen === 'today' || screen === 'bring' || screen === 'circles' || !SCREENS.includes(screen)) && <HomeTab onAdd={() => {}} onEdit={() => {}} />}
      {screen === 'bring' && <PrayerForm editPrayer={usePrayerStore.getState().prayers.find((p) => p.id === 'd4')} onClose={() => navigate('/__design/today')} />}
      {nav}
    </Layout>
  );
}
