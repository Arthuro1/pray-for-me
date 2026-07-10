import { useState, useEffect, useCallback } from 'react';
import { Loader2, HandHeart, X, Users } from 'lucide-react';
import useCommunityStore from '../store/communityStore';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import { parseKey } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { getAuthorName } from '../utils/user';
import usePrayerStore from '../store/prayerStore';
import { monthDots } from '../lib/planner';
import { monthDayKeys } from '../lib/monthCalendar';
import MonthCalendar from './MonthCalendar';

// Prayer-chain calendar on a community prayer: members claim days ("I'll pray
// this day") so the group covers the request continuously. Claimed days land
// on each member's personal calendar too (communityStore.fetchMyCommitments).
export default function GroupPrayerCalendar({ communityPrayer, groupId, lang, user }) {
  const fetchCommitments = useCommunityStore((s) => s.fetchCommitments);
  const addCommitment = useCommunityStore((s) => s.addCommitment);
  const removeCommitment = useCommunityStore((s) => s.removeCommitment);
  const fetchMyCommitments = useCommunityStore((s) => s.fetchMyCommitments);
  const personalPrayers = usePrayerStore((s) => s.prayers);
  const categories = usePrayerStore((s) => s.categories);
  const [commitments, setCommitments] = useState(null); // null = loading
  const [busy, setBusy] = useState(false);
  const [monthDate, setMonthDate] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedKey, setSelectedKey] = useState(todayKey());

  const reload = useCallback(async () => {
    const res = await fetchCommitments(communityPrayer.id);
    setCommitments(res.commitments || []);
    // Keep the personal calendar's mirror of my commitments fresh.
    if (user?.id) fetchMyCommitments(user.id, todayKey());
  }, [communityPrayer.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { reload(); }, [reload]);

  if (commitments === null) {
    return <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>;
  }

  // Merge this prayer's own schedule (recurring / one-time / weekly plan) with the
  // group's claimed days, so the calendar's four categories all apply here. The
  // schedule comes from the user's copy of this prayer — their shared original
  // (source_prayer_id) or a saved copy (community_origin_id).
  const myCopy = personalPrayers.find(
    (p) => p.community_origin_id === communityPrayer.id ||
      (communityPrayer.source_prayer_id && p.id === communityPrayer.source_prayer_id)
  );
  const dots = myCopy ? monthDots([myCopy], categories, monthDayKeys(monthDate)) : {};
  for (const c of commitments) dots[c.day] = { ...(dots[c.day] || {}), group: (dots[c.day]?.group || 0) + 1 };
  const dayCommitments = commitments.filter((c) => c.day === selectedKey);
  const mine = dayCommitments.find((c) => c.user_id === user?.id);
  const dayLabel = parseKey(selectedKey).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });

  const claim = async () => {
    setBusy(true);
    const res = await addCommitment({
      communityPrayerId: communityPrayer.id,
      groupId,
      userId: user.id,
      userName: getAuthorName(user),
      day: selectedKey,
    });
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(t(lang, 'commitmentAdded'));
    reload();
  };

  const release = async () => {
    setBusy(true);
    const res = await removeCommitment(mine.id);
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(t(lang, 'commitmentRemoved'));
    reload();
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <p className="text-sm font-semibold flex items-center gap-1.5 mb-0.5" style={{ color: 'var(--text-1)' }}>
        <Users size={14} style={{ color: 'var(--accent)' }} /> {t(lang, 'groupCalendarTitle')}
      </p>
      <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'groupCalendarSub')}</p>

      <MonthCalendar
        monthDate={monthDate}
        dots={dots}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
        onMonthChange={setMonthDate}
        lang={lang}
      />

      <div className="mt-3">
        <p className="text-xs font-semibold capitalize mb-1.5" style={{ color: 'var(--text-1)' }}>{dayLabel}</p>
        {commitments.length === 0 && (
          <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'noCommitmentsYet')}</p>
        )}
        {dayCommitments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {dayCommitments.map((c) => (
              <span key={c.id} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
                🙏 {c.user_id === user?.id ? getAuthorName(user) : (c.user_name || '?')}
              </span>
            ))}
          </div>
        )}
        {mine ? (
          <button
            onClick={release}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium disabled:opacity-60"
            style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-2)' }}
          >
            <X size={13} /> {t(lang, 'removeCommitmentBtn')}
          </button>
        ) : (
          <button
            onClick={claim}
            disabled={busy || selectedKey < todayKey()}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            <HandHeart size={13} /> {t(lang, 'commitToPray')}
          </button>
        )}
      </div>
    </div>
  );
}
