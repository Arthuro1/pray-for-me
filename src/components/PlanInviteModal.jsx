import { useState, useEffect } from 'react';
import { Loader2, Users, Check, HeartHandshake } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../store/communityStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import Avatar from './shared/Avatar';
import EmptyState from './shared/EmptyState';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Invite friends and/or whole groups to walk a guided plan together. Selecting a
// group fans the invitation out to each of its members (see invitePlan); each
// person accepts or declines on their own. A plan invitation carries only the
// plan's content id + a start date — never any prayer content — so the framing
// stays simple: "they'll be invited to pray this plan with you".
export default function PlanInviteModal({ plan, startDate, lang, userId, onClose }) {
  const { groups, fetchGroups, fetchFriends, fetchPlanInvitees, invitePlan } = useCommunityStore(
    useShallow((s) => ({
      groups: s.groups,
      fetchGroups: s.fetchGroups,
      fetchFriends: s.fetchFriends,
      fetchPlanInvitees: s.fetchPlanInvitees,
      invitePlan: s.invitePlan,
    }))
  );
  const [friends, setFriends] = useState([]);
  const [invitedIds, setInvitedIds] = useState(new Set()); // already invited to THIS plan
  const [selFriends, setSelFriends] = useState(new Set());
  const [selGroups, setSelGroups] = useState(new Set());
  const [date, setDate] = useState(startDate);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    Promise.all([
      fetchFriends(userId),
      fetchPlanInvitees(plan.id, userId),
      // Groups may not be loaded yet when the user opens this from the Plan tab.
      groups.length ? Promise.resolve() : fetchGroups(userId),
    ]).then(([f, inv]) => {
      setFriends(f?.friends || []);
      setInvitedIds(new Set(inv?.inviteeIds || []));
      setLoading(false);
    });
  }, [userId, plan.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (setter) => (id) => setter((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleFriend = toggle(setSelFriends);
  const toggleGroup = toggle(setSelGroups);

  const nothingToInvite = !loading && friends.length === 0 && groups.length === 0;
  const canSend = selFriends.size > 0 || selGroups.size > 0;

  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    const res = await invitePlan({
      planId: plan.id,
      startDate: date,
      friendIds: [...selFriends],
      groupIds: [...selGroups],
      invitedBy: userId,
    });
    setSending(false);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    toast.success(t(lang, 'planInviteSentToast'));
    onClose();
  };

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'planInviteTitle')}
        className="editorial-dialog w-full max-w-md flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 pb-3 shrink-0" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{t(lang, 'planInviteTitle')}</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, plan.titleKey)}</p>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-5">
          {/* Calm, honest framing of what an invitation does. */}
          <div className="rounded-xl p-3 flex gap-2.5" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
            <HeartHandshake size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'planInviteSub')}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
          ) : nothingToInvite ? (
            <EmptyState compact emoji="🤝" title={t(lang, 'planInviteEmpty')} />
          ) : (
            <>
              {/* Start date — invitees begin the plan on this day (they can adjust
                  when they accept if the flow ever exposes it; for now it's shared). */}
              <label className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{t(lang, 'planStartDate')}</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm rounded-lg px-2.5 py-1.5"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)', colorScheme: 'light dark' }}
                />
              </label>

              {friends.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'planInviteFriendsHeading')}</p>
                  <div className="space-y-2">
                    {friends.map((f) => {
                      const already = invitedIds.has(f.id);
                      const checked = selFriends.has(f.id);
                      return (
                        <label
                          key={f.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl"
                          style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', cursor: already ? 'default' : 'pointer', opacity: already ? 0.6 : 1 }}
                        >
                          <input type="checkbox" className="rounded" checked={already || checked} disabled={already} onChange={() => toggleFriend(f.id)} />
                          <Avatar name={f.name} size={30} />
                          <span className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--text-1)' }}>{f.name}</span>
                          {already && (
                            <span className="text-xs inline-flex items-center gap-1 shrink-0" style={{ color: 'var(--accent)' }}>
                              <Check size={13} /> {t(lang, 'planInvitedBadge')}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {groups.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'planInviteGroupsHeading')}</p>
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <label key={g.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
                        <input type="checkbox" className="rounded" checked={selGroups.has(g.id)} onChange={() => toggleGroup(g.id)} />
                        <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                          <Users size={15} />
                        </span>
                        <span className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--text-1)' }}>{g.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 pt-3 shrink-0 flex gap-2" style={{ borderTop: '0.5px solid var(--border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>
            {t(lang, 'cancel')}
          </button>
          <button onClick={handleSend} disabled={!canSend || sending} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
            {sending ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'planInviteSend')}
          </button>
        </div>
      </div>
    </div>
  );
}
