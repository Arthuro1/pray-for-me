import { useState, useEffect } from 'react';
import { Loader2, HeartHandshake } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../../store/communityStore';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';
import Avatar from '../shared/Avatar';
import { avatarConfigFrom } from '../../lib/avatar';
import EmptyState from '../shared/EmptyState';
import { Checkbox, Field, Input, PrimaryButton, SectionLabel, StatusLabel } from '../shared/Primitives';

// Invite friends and/or whole groups to walk a guided plan together, inside
// Qetoret. Selecting a group fans the invitation out to each of its members
// (see invitePlan); each person accepts or declines on their own. A plan
// invitation carries only the plan's content id + a start date — never any
// prayer content — so the framing stays simple: "they'll be invited to pray this
// plan with you". Lives in the Share sheet beside the public link.
export default function PlanInvitePanel({ plan, startDate, lang, userId, onDone }) {
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
    onDone();
  };

  return (
    <>
      <div className="plan-detail__body min-h-0 flex-1 overflow-y-auto">
        {/* Calm, honest framing of what an invitation does. */}
        <p className="share-note">
          <HeartHandshake size={16} aria-hidden="true" /> <span>{t(lang, 'planInviteSub')}</span>
        </p>

        {loading ? (
          <div className="q-loading"><Loader2 size={20} className="animate-spin" aria-hidden="true" /></div>
        ) : nothingToInvite ? (
          <EmptyState compact title={t(lang, 'planInviteEmpty')} />
        ) : (
          <>
            {/* Start date — invitees begin the plan on this day. */}
            <Field label={t(lang, 'planStartDate')} className="q-dialog__section">
              {(field) => <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto justify-self-start" {...field} />}
            </Field>

            {friends.length > 0 && (
              <section className="q-dialog__section">
                <SectionLabel>{t(lang, 'planInviteFriendsHeading')}</SectionLabel>
                <ul className="member-list">
                  {friends.map((f) => {
                    const already = invitedIds.has(f.id);
                    return (
                      <li key={f.id} className="member-row">
                        <Checkbox
                          id={`plan-invite-friend-${f.id}`}
                          checked={already || selFriends.has(f.id)}
                          disabled={already}
                          onChange={() => toggleFriend(f.id)}
                          className="min-w-0 flex-1"
                          label={(
                            <span className="plan-invite__who">
                              <Avatar name={f.name} avatar={f.avatar} size={32} />
                              <span>{f.name}</span>
                            </span>
                          )}
                        />
                        {already && <StatusLabel tone="royal" className="shrink-0">{t(lang, 'planInvitedBadge')}</StatusLabel>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {groups.length > 0 && (
              <section className="q-dialog__section">
                <SectionLabel>{t(lang, 'planInviteGroupsHeading')}</SectionLabel>
                <ul className="member-list">
                  {groups.map((g) => (
                    <li key={g.id} className="member-row">
                      <Checkbox
                        id={`plan-invite-group-${g.id}`}
                        checked={selGroups.has(g.id)}
                        onChange={() => toggleGroup(g.id)}
                        className="min-w-0 flex-1"
                        label={(
                          <span className="plan-invite__who">
                            <Avatar kind="group" name={g.name} avatar={avatarConfigFrom(g)} size={32} />
                            <span>{g.name}</span>
                          </span>
                        )}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {!nothingToInvite && (
        <div className="plan-detail__footer shrink-0">
          <PrimaryButton onClick={handleSend} disabled={!canSend || sending} className="w-full">
            {sending ? <Loader2 size={16} className="animate-spin" aria-label={t(lang, 'planInviteSend')} /> : t(lang, 'planInviteSend')}
          </PrimaryButton>
        </div>
      )}
    </>
  );
}
