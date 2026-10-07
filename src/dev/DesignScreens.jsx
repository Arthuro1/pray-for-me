// Dev-only screen previews for the design gallery: /__design/today, /journal,
// /detail, /session, /bring, /circles, /tend, /carry, /together, /group,
// /plans, /plan, /plan-day, /plan-share, /plan-tailor, /grow, /guide, /more,
// /about, /settings, /inbox, /auth, /auth-save, /vault-lock, /key-missing,
// /vault-setup, /privacy, /feedback, /donate, /ai-consent, /confirm,
// /first-prayer, /calendar, /saved, /labels and /ai-preview render
// the REAL screens inside the real app shell with sample prayers (the vault and
// key gates replace the shell, as in the app). Every store write is replaced
// by a local no-op first, and
// every database query answers empty, so nothing is queued, synced, encrypted
// or sent anywhere. Never shipped.
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
import MoreTab from '../pages/MoreTab';
import AboutTab from '../pages/AboutTab';
import SettingsTab from '../pages/SettingsTab';
import PlanTab from '../pages/PlanTab';
import NotificationsPage from '../pages/NotificationsPage';
import AuthPage from '../pages/AuthPage';
import GuestPrayerFlow from '../components/GuestPrayerFlow';
import VaultLockScreen from '../components/VaultLockScreen';
import AccountKeyRecoveryScreen from '../components/AccountKeyRecoveryScreen';
import VaultModal from '../components/VaultModal';
import PrivacyCenter from '../components/PrivacyCenter';
import FeedbackModal from '../components/FeedbackModal';
import DonateModal from '../components/DonateModal';
import AiConsentModal from '../components/AiConsentModal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import PrayerSavedStep from '../components/PrayerSavedStep';
import LabelsManager from '../components/LabelsManager';
import AiOutgoingPreview from '../components/AiOutgoingPreview';
import useNotificationStore from '../store/notificationStore';
import PlanDetailModal from '../components/PlanDetailModal';
import PlanPersonalizeModal from '../components/PlanPersonalizeModal';
import PlanShareSheet from '../components/plan/PlanShareSheet';
import GuideReader from '../components/GuideReader';
import { buildGuidedPlanPrayer, planById } from '../lib/guidedPlan';
import { supabase } from '../lib/supabase';
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

// A query that answers empty however it is chained — `.select().eq()…` and an
// `await` at the end all resolve to { data: null, error: null }.
function offlineQuery() {
  const result = Promise.resolve({ data: null, error: null });
  const chain = new Proxy(() => {}, {
    get: (_, prop) => {
      if (prop === 'then') return result.then.bind(result);
      if (prop === 'catch') return result.catch.bind(result);
      return () => chain;
    },
    apply: () => chain,
  });
  return chain;
}

// Seed the stores and swap every write for a local, in-memory version. The
// gallery never reaches the database: every query answers empty, right here.
function seed() {
  supabase.rpc = async () => ({ data: null, error: { message: 'design preview' } });
  supabase.from = () => offlineQuery();
  const today = todayKey();
  const noop = async () => ({ error: null });
  const prayers = samplePrayers();
  usePrayerStore.setState((state) => ({
    prayers,
    categories: [{ id: 'c1', name: 'Family', emoji: '🏠', color: '#7A5BA8' }, { id: 'c2', name: 'Work', emoji: '💼', color: '#4F7A6B' }],
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

const SCREENS = [
  'today', 'journal', 'detail', 'session', 'bring', 'circles', 'tend', 'carry', 'together', 'group',
  'plans', 'plan', 'plan-day', 'plan-share', 'plan-tailor', 'grow', 'guide', 'more', 'about', 'settings', 'inbox', 'auth', 'auth-save', 'vault-lock', 'key-missing', 'vault-setup', 'privacy', 'feedback', 'donate', 'ai-consent', 'confirm', 'first-prayer', 'calendar', 'saved', 'labels', 'ai-preview',
];

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

// A rich guided plan on its fourth day, as its prayer page shows it.
function PlanDayPreview({ lang }) {
  const navigate = useNavigate();
  const [prayer] = useState(() => {
    const plan = planById('preparing21');
    if (!plan) return null;
    const run = {
      ...buildGuidedPlanPrayer(plan, addDays(todayKey(), -3), lang),
      id: 'd7', status: 'active', circle: 'heart', user_id: 'design-user', created_at: '2026-10-03T08:00:00Z',
      prayer_categories: [], prayer_points: [], prayer_testimonies: [], prayer_updates: [],
    };
    usePrayerStore.setState((s) => ({ prayers: [...s.prayers.filter((p) => p.id !== run.id), run] }));
    return run;
  });
  if (!prayer) return null;
  return <PrayerDetail prayer={prayer} onBack={() => navigate('/__design/plans')} onEdit={() => {}} lang={lang} />;
}

// The share sheet with a live link, three who joined and two friends to
// invite. Its RPCs are answered here, during render — before the sheet's own
// first fetch — so the preview never reaches the database.
function PlanSharePreview({ lang }) {
  const navigate = useNavigate();
  useState(() => {
    supabase.rpc = async (fn) => (fn === 'plan_share_status'
      ? { data: [{ active_token: 'DesignPreviewLinkToken01', stopped: false, join_count: 3, friend_names: ['Marie'] }], error: null }
      : { data: null, error: { message: 'design preview' } });
    useCommunityStore.setState({
      groups: [{ id: 'g1', name: 'Home group' }],
      fetchFriends: async () => ({ friends: [{ id: 'f1', name: 'Marie Curie' }, { id: 'f2', name: 'Jonas Weber' }] }),
      fetchPlanInvitees: async () => ({ inviteeIds: ['f2'] }),
    });
  });
  const plan = planById('altar7');
  return plan && <PlanShareSheet plan={plan} lang={lang} userId="design-user" onClose={() => navigate('/__design/plans')} />;
}

function PlanTailorPreview({ lang }) {
  const navigate = useNavigate();
  const plan = planById('preparing21');
  return plan && <PlanPersonalizeModal plan={plan} lang={lang} mode="start" ctaKey="journeyStart" onSave={() => {}} onClose={() => navigate('/__design/plans')} />;
}

// The inbox with a few reminders, two unread. Rows carry only a type and a
// time — never content — exactly as the real ones do.
function InboxPreview() {
  useState(() => {
    const noop = async () => {};
    useNotificationStore.setState({
      notifications: [
        { id: 'n1', type: 'reaction_bucket', group_id: null, created_at: hoursAgo(1), read_at: null },
        { id: 'n2', type: 'plan_invitation', group_id: null, created_at: hoursAgo(5), read_at: null },
        { id: 'n3', type: 'testimony', group_id: null, created_at: hoursAgo(28), read_at: hoursAgo(20) },
        { id: 'n4', type: 'friend_request', group_id: null, created_at: hoursAgo(70), read_at: hoursAgo(60) },
      ],
      unreadCount: 2, loading: false, error: null, hasMore: false,
      fetchNotifications: noop, fetchMoreNotifications: noop, markRead: noop, markAllRead: noop,
    });
  });
  return <NotificationsPage />;
}

// The circle picker on its own: in the real form it appears only once the
// vault is unlocked, which a preview must never fake on a shared dev origin.
// Both forms: the composer's compact row, and the full choice used to change
// a saved prayer's circle.
function CirclesPreview({ lang }) {
  const [circle, setCircle] = useState('household');
  return (
    <Modal label="circles" onClose={() => {}}>
      <CirclePicker compact value={circle} onChange={setCircle} lang={lang} idPrefix="design-circle-row" />
      <hr className="my-6 border-0 border-t" style={{ borderColor: 'var(--q-border)' }} />
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

  // Sign-in is outside the app shell, as it is in the real app.
  if (screen === 'auth' || screen === 'auth-save') {
    return <AuthPage onBack={() => navigate('/__design')} intent={screen === 'auth-save' ? 'save-prayer' : undefined} />;
  }

  // The key and vault gates replace the whole app, as they do for real.
  if (screen === 'vault-lock') return <VaultLockScreen lang={lang} />;
  // The pray-first capture; nothing is stored unless the form is submitted.
  if (screen === 'first-prayer') return <GuestPrayerFlow lang={lang} onFinish={() => navigate('/__design')} onRequestSave={() => {}} />;
  if (screen === 'key-missing') return <AccountKeyRecoveryScreen lang={lang} onResolved={() => {}} />;

  if (screen === 'session') {
    return <PrayerSession prayers={usePrayerStore.getState().prayers.slice(0, 3)} categories={[]} lang={lang} tr={(text) => text} onClose={() => navigate('/__design/today')} />;
  }

  return (
    <Layout onAddPrayer={() => {}}>
      {screen === 'journal' && <PrayersTab onAdd={() => {}} />}
      {screen === 'detail' && <PrayerDetail prayer={prayer} onBack={() => navigate('/__design/journal')} onEdit={() => {}} lang={lang} />}
      {screen === 'carry' && <CarryPreview lang={lang} />}
      {(screen === 'plans' || screen === 'plan' || screen === 'plan-share' || screen === 'plan-tailor') && <PlansTab />}
      {screen === 'plan-day' && <PlanDayPreview lang={lang} />}
      {screen === 'plan-share' && <PlanSharePreview lang={lang} />}
      {screen === 'plan-tailor' && <PlanTailorPreview lang={lang} />}
      {screen === 'plan' && planById('altar7') && (
        <PlanDetailModal plan={planById('altar7')} lang={lang} running={false} onStart={() => {}} onShare={() => {}} onClose={() => navigate('/__design/plans')} />
      )}
      {(screen === 'grow' || screen === 'guide') && <GrowTab onCreatePrayer={() => {}} />}
      {screen === 'guide' && guides[0] && (
        <GuideReader guide={guides[0]} lang={lang} onClose={() => navigate('/__design/grow')} onStarted={() => {}} onCompleted={() => {}} />
      )}
      {(screen === 'together' || screen === 'group') && <TogetherPreview screen={screen} />}
      {screen === 'circles' && <CirclesPreview lang={lang} />}
      {screen === 'more' && <MoreTab />}
      {screen === 'about' && <AboutTab />}
      {screen === 'settings' && <SettingsTab />}
      {screen === 'calendar' && <PlanTab />}
      {screen === 'saved' && <PrayerSavedStep prayerId="d4" title="My children" schedule={usePrayerStore.getState().prayers[3].schedule} lang={lang} onClose={() => navigate('/__design/today')} />}
      {screen === 'labels' && <Modal label="labels" onClose={() => navigate('/__design/journal')}><LabelsManager lang={lang} tr={(text) => text} onDone={() => navigate('/__design/journal')} /></Modal>}
      {screen === 'ai-preview' && <AiOutgoingPreview lang={lang} title="Healing and peace for Sarah" description="For her recovery after surgery." update="The surgery went well." onSend={() => {}} onCancel={() => navigate('/__design/detail')} />}
      {screen === 'inbox' && <InboxPreview />}
      {['vault-setup', 'privacy', 'feedback', 'donate', 'ai-consent', 'confirm'].includes(screen) && <SettingsTab />}
      {screen === 'vault-setup' && <VaultModal lang={lang} initialMode="setup" userId="design-user" onClose={() => navigate('/__design/settings')} />}
      {screen === 'privacy' && <PrivacyCenter lang={lang} onClose={() => navigate('/__design/settings')} />}
      {screen === 'feedback' && <FeedbackModal onClose={() => navigate('/__design/settings')} />}
      {screen === 'donate' && <DonateModal onClose={() => navigate('/__design/settings')} />}
      {screen === 'ai-consent' && <AiConsentModal lang={lang} onAccept={() => {}} onCancel={() => navigate('/__design/settings')} />}
      {screen === 'confirm' && (
        <ConfirmDialog
          title="Delete this prayer?"
          message="It will be removed from every device. This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={() => {}}
          onCancel={() => navigate('/__design/journal')}
        />
      )}
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
