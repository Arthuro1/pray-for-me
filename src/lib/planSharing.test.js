import { describe, expect, it } from 'vitest';
import {
  acceptedPlanFromInvitation,
  buildGroupPlanMembershipRow,
  buildPlanInvitationRow,
  groupPlanMembershipTarget,
  summarizePlanParticipation,
} from './planSharing';

describe('couple plan sharing privacy boundary', () => {
  it('persists only the explicit invitation metadata', () => {
    const row = buildPlanInvitationRow({
      planId: 'marriage30', startDate: '2026-09-01',
      invitedUserId: 'spouse-account', invitedBy: 'viewer', groupId: null,
      spouseName: 'Anna', children: ['Emma'], note: 'private confession',
      voiceNote: new Uint8Array([1, 2]), reflection: 'private answer', day: 7,
    });
    expect(row).toEqual({
      plan_id: 'marriage30', start_date: '2026-09-01',
      invited_user_id: 'spouse-account', invited_by: 'viewer', group_id: null,
    });
  });

  it('accepting an invitation reveals only the plan id and proposed date', () => {
    expect(acceptedPlanFromInvitation({
      plan_id: 'covenant21', start_date: '2026-09-02',
      inviter_name: 'Anna', private_note: 'never copy me', progress: [1, 2, 3],
    })).toEqual({ planId: 'covenant21', startDate: '2026-09-02' });
  });

  it('summarizes participation without exposing identities or private fields', () => {
    const summary = summarizePlanParticipation([
      { user_id: 'viewer', note: 'private', prayedDays: [1, 2] },
      { user_id: 'partner', voiceNote: 'private', reflection: 'private' },
      { user_id: 'partner', note: 'duplicate membership cannot inflate count' },
    ], 'viewer');
    expect(summary).toEqual({ participantCount: 2, joinedByMe: true });
    expect(JSON.stringify(summary)).not.toMatch(/partner|note|voice|reflection|prayed/i);
  });

  it('joining stores membership only, never historical prayer data', () => {
    expect(buildGroupPlanMembershipRow({
      groupPlanId: 'shared-run', groupId: 'group', userId: 'viewer',
      historicalNotes: ['private'], voiceNotes: ['private'], completedDays: [1, 2],
    })).toEqual({ group_plan_id: 'shared-run', group_id: 'group', user_id: 'viewer' });
  });

  it('leaving targets only shared membership, leaving the private prayer untouched', () => {
    expect(groupPlanMembershipTarget({
      groupPlanId: 'shared-run', userId: 'viewer', prayerId: 'private-prayer',
      notes: ['keep me'],
    })).toEqual({ groupPlanId: 'shared-run', userId: 'viewer' });
  });
});
