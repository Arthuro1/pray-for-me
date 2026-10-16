-- A group prayer meeting may last up to twelve hours — a night of prayer
-- (21:00 → 05:00) — not only four. The form now lets the person choose any
-- length by its end time (src/lib/meetingDraft.js: DURATION_MIN/DURATION_MAX
-- hold the same bounds). Nothing else about a meeting changes.
--
-- Apply this migration BEFORE deploying the client that offers "Other" lengths.
-- Until it is applied, a meeting longer than four hours is refused when saved:
-- the save is a direct write (not the offline queue), so the form reports the
-- failure and nothing is lost silently.
alter table public.group_meetings drop constraint if exists group_meetings_duration;
alter table public.group_meetings
  add constraint group_meetings_duration check (duration_minutes between 15 and 720);
