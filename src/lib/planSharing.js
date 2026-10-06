// Couple-plan sharing is deliberately metadata-only. These builders are the
// boundary between private prayer state and Supabase rows/UI summaries: passing
// a richer object cannot accidentally copy a name, note, recording, reflection,
// completion history, or personalization answer into shared state.

export function buildPlanInvitationRow({
  planId,
  startDate,
  invitedUserId,
  invitedBy,
  groupId = null,
} = {}) {
  return {
    plan_id: planId,
    start_date: startDate,
    invited_user_id: invitedUserId,
    invited_by: invitedBy,
    group_id: groupId,
  };
}

export function acceptedPlanFromInvitation(invitation = {}) {
  return {
    planId: invitation.plan_id,
    startDate: invitation.start_date,
  };
}

export function buildGroupPlanMembershipRow({ groupPlanId, groupId, userId } = {}) {
  return {
    group_plan_id: groupPlanId,
    group_id: groupId,
    user_id: userId,
  };
}

export function groupPlanMembershipTarget({ groupPlanId, userId } = {}) {
  return { groupPlanId, userId };
}

// Only an aggregate and the viewer's own participation leave this boundary.
// Member identities are used locally for the calculation and are not returned.
export function summarizePlanParticipation(members = [], viewerId) {
  const participantIds = [...new Set(
    members
      .map((member) => (typeof member === 'string' ? member : member?.user_id))
      .filter(Boolean),
  )];
  return {
    participantCount: participantIds.length,
    joinedByMe: participantIds.includes(viewerId),
  };
}
