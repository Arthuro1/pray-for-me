-- Published-copy feedback only. No prayer/journal joins, triggers or content capture.
create table public.wording_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  locale text not null check (locale in ('en','fr','de','es','pt','zh','hi','ja','sw','am','id','tl','ko','ru','ar','fa')),
  translation_key text not null check (char_length(translation_key) between 1 and 300),
  screen text not null check (screen ~ '^(ui|landing|plans/[A-Za-z0-9_-]+|theology/[A-Za-z0-9_-]+|guides/[A-Za-z0-9_-]+|gospel/[A-Za-z0-9_-]+)$'),
  current_string text not null check (char_length(btrim(current_string)) between 1 and 20000),
  issue_type text not null check (issue_type in ('unnatural','terminology','unclear','too_long','other')),
  suggested_wording text check (char_length(suggested_wording) <= 2000),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','reviewing','resolved','dismissed')),
  constraint wording_key_screen check (starts_with(translation_key, screen || ':'))
);
alter table public.wording_reports enable row level security;
revoke all on public.wording_reports from public, anon, authenticated;
grant insert (locale, translation_key, screen, current_string, issue_type, suggested_wording)
  on public.wording_reports to authenticated;
grant select on public.wording_reports to authenticated;
grant update (status) on public.wording_reports to authenticated;
grant all on public.wording_reports to service_role;

create policy wording_submit on public.wording_reports for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false'
    and status = 'new'
  );
create policy wording_editors_read on public.wording_reports for select to authenticated
  using (
    (select auth.uid()) is not null
    and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false'
    and (select auth.jwt())->'app_metadata'->'content_reviewer' = 'true'::jsonb
  );
create policy wording_editors_update on public.wording_reports for update to authenticated
  using (
    (select auth.uid()) is not null
    and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false'
    and (select auth.jwt())->'app_metadata'->'content_reviewer' = 'true'::jsonb
  ) with check (
    (select auth.uid()) is not null
    and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false'
    and (select auth.jwt())->'app_metadata'->'content_reviewer' = 'true'::jsonb
  );
create index wording_reports_queue on public.wording_reports (status, created_at desc, id);
create index wording_reports_user on public.wording_reports (user_id);
