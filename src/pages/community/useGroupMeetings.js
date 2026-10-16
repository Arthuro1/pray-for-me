import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore, { GROUP_ENCRYPTION_UNAVAILABLE } from '../../store/communityStore';
import { t } from '../../i18n';
import { toast } from '../../store/toastStore';
import { nextMeeting } from '../../lib/meetingTime';

// A group's prayer meetings: the read-model (decrypted, soonest first), its live
// subscription, and saving or ending one. The form and the cards consume it.
export default function useGroupMeetings({ groupId, user, lang }) {
  const { fetchGroupMeetings, saveGroupMeeting, endGroupMeeting, subscribeGroupMeetings } = useCommunityStore(
    useShallow((s) => ({
      fetchGroupMeetings: s.fetchGroupMeetings,
      saveGroupMeeting: s.saveGroupMeeting,
      endGroupMeeting: s.endGroupMeeting,
      subscribeGroupMeetings: s.subscribeGroupMeetings,
    }))
  );
  const [meetings, setMeetings] = useState([]);
  // null, 'new', or the meeting being edited.
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [confirmEndMeeting, setConfirmEndMeeting] = useState(null);
  const [busyMeetingId, setBusyMeetingId] = useState(null);
  // One id per new meeting, kept across retries of the same form: a save whose
  // acknowledgement was lost is retried onto the same row, never a second one.
  const newMeetingId = useRef(null);

  const loadMeetings = useCallback(async () => {
    if (!groupId) return;
    const { meetings: rows } = await fetchGroupMeetings(groupId);
    setMeetings(rows || []);
  }, [groupId, fetchGroupMeetings]);
  useEffect(() => { loadMeetings(); }, [loadMeetings]);
  useEffect(() => {
    if (!groupId) return undefined;
    return subscribeGroupMeetings(groupId, loadMeetings);
  }, [groupId, loadMeetings, subscribeGroupMeetings]);

  // Soonest first; a one-off meeting that is over sinks to the end.
  const sortedMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .map((meeting) => ({ meeting, next: nextMeeting(meeting, now) }))
      .sort((a, b) => (a.next?.start ?? Infinity) - (b.next?.start ?? Infinity));
  }, [meetings]);

  const closeMeetingForm = () => {
    newMeetingId.current = null;
    setEditingMeeting(null);
  };

  const handleSaveMeeting = async (fields) => {
    const isNew = editingMeeting === 'new';
    if (isNew) newMeetingId.current ||= crypto.randomUUID();
    const id = isNew ? newMeetingId.current : editingMeeting.id;
    const res = await saveGroupMeeting({ ...fields, id, isNew, groupId, userId: user.id });
    if (res?.error) {
      toast.error(t(lang, res.error === GROUP_ENCRYPTION_UNAVAILABLE ? 'meetingKeyUnavailable' : 'errorGeneric'));
      return false;
    }
    closeMeetingForm();
    await loadMeetings();
    toast.success(t(lang, 'meetingSaved'));
    return true;
  };

  const handleEndMeeting = async (meeting) => {
    setBusyMeetingId(meeting.id);
    const res = await endGroupMeeting(meeting.id);
    setBusyMeetingId(null);
    setConfirmEndMeeting(null);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
    toast.success(t(lang, 'meetingEndedToast'));
  };

  return {
    meetings: sortedMeetings,
    editingMeeting, setEditingMeeting, closeMeetingForm,
    confirmEndMeeting, setConfirmEndMeeting,
    busyMeetingId,
    handleSaveMeeting, handleEndMeeting,
  };
}
